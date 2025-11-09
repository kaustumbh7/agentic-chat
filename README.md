# 🧠 Agentic Chat Endpoint

An Express.js server with a single `/chat` route that accepts user queries and returns AI-generated content with **agentic reasoning** capabilities. The server uses Google Gemini API and can trigger external tools (like web search) to improve responses.

## Demo

📹 [Watch the demo video](https://drive.google.com/file/d/1N86uxH0m0tjMb-YVBBsLDNyeiXBXh2Ue/view?usp=sharing)

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

4. Add your API keys to `.env`:

```
PORT=3000

# Google Gemini API Key (required)
GEMINI_API_KEY=your_gemini_api_key_here

# Web search configuration (required)
SERPAPI_KEY=your_serpapi_key_here
```

**Note:** For web search, SerpAPI is required:

- **SerpAPI**: Get API key: https://serpapi.com/ (free tier: 100 searches/month)

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

```
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

## Project Structure

```
agentic-chat/
├── src/
│   ├── index.ts          # Express server and routes
│   ├── gemini.ts         # Gemini API integration
│   ├── tools.ts          # External tools (web search)
│   └── types.ts          # TypeScript type definitions
├── example-client.js     # Example client implementation
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Technologies

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **Google Gemini API** - LLM for reasoning and generation

## Agentic Behavior

The endpoint implements **agentic reasoning** where Gemini autonomously decides whether to use external tools:

1. **Reasoning Phase**: Model analyzes the query and decides if external data is needed
2. **Tool Calling**: If required, calls `web_search` with appropriate parameters
3. **Response Refinement**: Uses tool output to generate accurate, contextual responses

### Event Flow

```
User Query → Reasoning → Tool Decision → Tool Call (if needed) → Final Response
```

Example flow:

```
data: {"type":"reasoning","content":"I need recent data on AI development."}
data: {"type":"tool_call","tool":"web_search","input":"AI state 2025","output":null}
data: {"type":"tool_call","tool":"web_search","input":"AI state 2025","output":"<search results>"}
data: {"type":"response","content":"Based on current data, AI in 2025..."}
```

## Web Search Configuration

The system uses **SerpAPI** for web search:

- Get API key: https://serpapi.com/ (free tier: 100 searches/month)
- Add `SERPAPI_KEY` to `.env`
- Provides Google search results via SerpAPI's service

**Note**: SerpAPI is required for web search functionality. It's easy to set up and provides high-quality Google search results.

## Technical Notes

- Uses **gemini-2.5-pro** for reliable function calling support
- Streams JSON events via **Server-Sent Events (SSE)**
- Function calling is autonomous - Gemini decides when tools are needed
- Tool calls send 2 events: pre-call (output: null) and post-call (output: results)
