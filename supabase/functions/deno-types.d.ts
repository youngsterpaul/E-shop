
// Type declarations for Deno runtime in Supabase Edge Functions
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  
  const env: Env;
}

// Declare global fetch if not available
declare global {
  const Deno: typeof Deno;
}

// Export empty object to make this a module
export {};
