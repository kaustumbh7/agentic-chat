import axios from "axios";

/**
 * Web search tool using SerpAPI
 * SerpAPI provides Google search results via their API
 */
export async function webSearch(query: string): Promise<string> {
  return await serpApiSearch(query);
}

/**
 * SerpAPI search implementation
 * SerpAPI provides Google search results via their API
 */
async function serpApiSearch(query: string): Promise<string> {
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!serpApiKey) {
    return `Error: SERPAPI_KEY environment variable is required for web search. Please configure it in your .env file. Get your API key at https://serpapi.com/`;
  }

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        api_key: serpApiKey,
        engine: "google",
        q: query,
        num: 5, // Number of results
      },
      timeout: 15000,
    });

    const data = response.data;
    let results = `Search results for "${query}":\n\n`;

    // Extract organic search results
    if (data.organic_results && data.organic_results.length > 0) {
      data.organic_results.slice(0, 5).forEach((item: any, index: number) => {
        results += `${index + 1}. ${item.title || "No title"}\n`;
        if (item.snippet) {
          results += `   ${item.snippet}\n`;
        }
        if (item.link) {
          results += `   URL: ${item.link}\n`;
        }
        results += "\n";
      });
    } else if (data.answer_box) {
      // If there's an answer box, use that
      const answerBox = data.answer_box;
      if (answerBox.answer) {
        results += `Answer: ${answerBox.answer}\n`;
      }
      if (answerBox.snippet) {
        results += `\n${answerBox.snippet}\n`;
      }
      if (answerBox.link) {
        results += `\nSource: ${answerBox.link}\n`;
      }
    } else if (data.knowledge_graph) {
      // Use knowledge graph if available
      const kg = data.knowledge_graph;
      if (kg.title) {
        results += `${kg.title}\n`;
      }
      if (kg.description) {
        results += `${kg.description}\n`;
      }
    } else {
      results = `No search results found for: "${query}"`;
    }

    return results.trim();
  } catch (error: any) {
    console.error("SerpAPI search error:", error);
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      return `Error performing web search (Status ${status}): ${message}. Please check your SERPAPI_KEY.`;
    }
    return `Error performing web search for: "${query}". Please try again or check your SERPAPI_KEY configuration.`;
  }
}
