export interface QueryableDb {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}
