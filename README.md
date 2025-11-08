# 🧠 Agentic Chat Endpoint

An Express.js server with a single `/chat` route that accepts user queries and returns AI-generated content with **agentic reasoning** capabilities. The server uses Google Gemini API and can trigger external tools (like web search) to improve responses.

## Features

- ✅ **Agentic Reasoning**: Uses Google Gemini API with function calling support
- ✅ **Tool Integration**: Automatically triggers web search when real-time data is needed
- ✅ **Streaming Responses**: Server-Sent Events (SSE) for real-time JSON streaming
- ✅ **Event Types**: Streams reasoning, tool_call, and response events
- ✅ **TypeScript**: Fully typed codebase

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Clone or navigate to the project directory:

```bash
cd agentic-chat
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Add your Gemini API key to `.env`:

```
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### POST /chat

Send a query and receive streaming agentic responses.

**Request:**

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain the state of AI in 2025?"}'
```

**Response (Server-Sent Events):**

The endpoint streams JSON events in SSE format:

```json
data: {"type":"reasoning","content":"Let me think about the current state of AI..."}

data: {"type":"tool_call","tool":"web_search","input":"AI state 2025","output":"..."}

data: {"type":"response","content":"In 2025, AI continues to evolve..."}

data: [DONE]
```

**Event Types:**

1. **`reasoning`**: Initial thoughts and reasoning process

   ```json
   { "type": "reasoning", "content": "Thinking about relevant factors..." }
   ```

2. **`tool_call`**: External tool usage (e.g., web search)

   ```json
   {
     "type": "tool_call",
     "tool": "web_search",
     "input": "inflation stock market 2025",
     "output": "<search results>"
   }
   ```

3. **`response`**: Final AI-generated response
   ```json
   {
     "type": "response",
     "content": "In 2025, inflation continues to impact equities by..."
   }
   ```

### GET /health

Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Example Client (JavaScript)

```javascript
const eventSource = new EventSource("http://localhost:3000/chat", {
  method: "POST",
  body: JSON.stringify({ query: "What is the latest news about AI?" }),
  headers: { "Content-Type": "application/json" },
});

// For POST requests, use fetch with ReadableStream instead:
async function streamChat(query) {
  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;

        try {
          const event = JSON.parse(data);
          console.log("Event:", event);
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

streamChat("Explain the state of AI in 2025?");
```

## Project Structure

```
agentic-chat/
├── src/
│   ├── index.ts          # Express server and routes
│   ├── gemini.ts         # Gemini API integration
│   ├── tools.ts          # External tools (web search)
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Google Gemini API** - LLM for reasoning and generation
- **Axios** - HTTP client for web search

## Notes

- The web search tool uses DuckDuckGo's instant answer API as a free alternative. For production use, consider integrating with SerpAPI, Google Custom Search API, or similar services.
- The server uses Server-Sent Events (SSE) for streaming, which works well for one-way communication from server to client.
- Function calling is handled automatically by Gemini when it determines that external tools are needed.

## License

MIT
