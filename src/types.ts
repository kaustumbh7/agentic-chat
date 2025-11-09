export interface ChatRequest {
  query: string;
}

export type StreamEventType = "reasoning" | "tool_call" | "response";

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  tool?: string;
  input?: string;
  output?: string | null;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}
