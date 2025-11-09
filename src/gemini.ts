import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamEvent } from "./types";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Get or initialize the Gemini AI client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * Get the Gemini model with function calling support
 */
export function getGeminiModel() {
  // Use gemini-2.5-pro for better function calling support
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      temperature: 0.7,
    },
  });
}

/**
 * Define the web_search function for Gemini function calling
 */
export const functionDeclarations = [
  {
    name: "web_search",
    description:
      "Search the web for current information, facts, or real-time data. Use this function when the user asks about current events, recent news, statistics, or anything requiring up-to-date information beyond your training data cutoff.",
    parameters: {
      type: "object" as const,
      properties: {
        query: {
          type: "string" as const,
          description:
            "The specific search query to look up on the web. Be precise and focused.",
        },
      },
      required: ["query"],
    },
  },
] as const;

/**
 * Send a message to Gemini and get streaming response
 */
export async function* streamGeminiResponse(
  prompt: string,
  history: any[] = []
): AsyncGenerator<StreamEvent, void, unknown> {
  const model = getGeminiModel();

  // Start a chat session with function calling
  const chat = model.startChat({
    history: history as any,
    tools: [
      {
        functionDeclarations: functionDeclarations as any,
      },
    ],
  });

  try {
    // Send the user message
    const result = await chat.sendMessageStream(prompt);

    let fullResponse = "";
    let functionCalls: any[] = [];
    let hasText = false;

    // Collect all chunks to check for function calls
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        hasText = true;
        // Stream reasoning/content as it comes
        yield {
          type: "reasoning",
          content: chunkText,
        };
      }

      // Check for function calls
      const chunkFunctionCalls = chunk.functionCalls();
      if (chunkFunctionCalls && chunkFunctionCalls.length > 0) {
        functionCalls.push(...chunkFunctionCalls);
      }
    }

    // If there were function calls, handle them
    if (functionCalls.length > 0) {
      // If the model didn't generate reasoning text before calling a function,
      // add a reasoning event to show agentic decision-making
      if (!hasText || fullResponse.trim().length === 0) {
        yield {
          type: "reasoning",
          content:
            "I need to search for current information to answer this accurately.",
        };
      }

      for (const funcCall of functionCalls) {
        const functionName = funcCall.name;
        const args = funcCall.args;

        if (functionName === "web_search") {
          const searchQuery =
            args.query || args.searchQuery || JSON.stringify(args);

          // Send pre-call event with output: null
          yield {
            type: "tool_call",
            tool: "web_search",
            input: searchQuery,
            output: null,
          };

          // Import and call the web search tool
          const { webSearch } = await import("./tools");
          const searchResults = await webSearch(searchQuery);

          // Send post-call event with actual output
          yield {
            type: "tool_call",
            tool: "web_search",
            input: searchQuery,
            output: searchResults,
          };

          // Send the function response back to Gemini and get final response
          const functionResponse = {
            functionResponse: {
              name: "web_search",
              response: {
                results: searchResults,
              },
            },
          };

          const finalResult = await chat.sendMessageStream([functionResponse]);

          for await (const chunk of finalResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              yield {
                type: "response",
                content: chunkText,
              };
            }
          }
        }
      }
    } else if (fullResponse) {
      // If no function call was made, the response is complete
      yield {
        type: "response",
        content: fullResponse,
      };
    } else if (!hasText) {
      // If we got nothing, yield an empty response
      yield {
        type: "response",
        content:
          "I received your query but couldn't generate a response. Please try again.",
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    yield {
      type: "response",
      content: `Error: ${
        error instanceof Error ? error.message : "Unknown error occurred"
      }`,
    };
  }
}
