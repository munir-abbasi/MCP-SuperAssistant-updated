export type PrimitiveType = 'resource' | 'tool' | 'prompt' | 'error';

export interface PrimitiveValue {
  name: string;
  description?: string;
  uri?: string;
  inputSchema?: any;
  input_schema?: any;  // snake_case variant for compatibility
  arguments?: any[];
  schema?: string;     // JSON string representation for legacy compatibility
}

export interface CapabilityError {
  capability: string;
  message: string;
  code?: string;
}

export type Primitive = 
  | { type: 'resource' | 'tool' | 'prompt'; value: PrimitiveValue }
  | { type: 'error'; value: CapabilityError };

export interface NormalizedTool {
  name: string;
  description: string;
  input_schema: any;
  schema: string;
  uri?: string;
  arguments?: any[];
}

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolCallResult {
  content: any[];
  isError?: boolean;
}

export interface CapabilityError {
  capability: string;
  message: string;
  code?: string;
}

export interface PrimitivesResponse {
  tools: NormalizedTool[];
  resources: any[];
  prompts: any[];
  errors?: CapabilityError[];
  timestamp: number;
}