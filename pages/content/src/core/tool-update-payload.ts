export function extractToolUpdateTools(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const tools = (payload as { tools?: unknown }).tools;
    if (Array.isArray(tools)) {
      return tools;
    }
  }

  return [];
}
