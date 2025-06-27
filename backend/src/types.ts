export interface PatternRecord {
  id?: number;
  label: string;
  pattern: string;
  description?: string;
  selected?: string | null;
}

// Keep the old interface name for backward compatibility during transition
export interface ConnectionRecord extends PatternRecord {}

export interface DatabaseError extends Error {
  code?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}