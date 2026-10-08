export function ok(message: string, data?: Record<string, unknown>) {
  return data ? { success: true as const, message, data } : { success: true as const, message };
}

export function fail(message: string) {
  return { success: false as const, message };
}