
# Supabase Edge Functions for ImageScout

This directory contains documentation and type definitions for the Supabase Edge Functions used by ImageScout.

## Edge Function Location

The actual Edge Function code is located in the following directory structure:

```
supabase/
├── functions/
│   ├── score-image/
│   │   ├── index.ts        <- Main function code
│   │   └── _shared/        <- Shared utilities
│   │       └── cors.ts     <- CORS headers
```

## Development and Deployment

For detailed instructions on developing, testing, and deploying Edge Functions, see:
- [ENV_VARIABLES.md](../ENV_VARIABLES.md) - Required environment variables
- [EDGE_FUNCTION_TESTING.md](./EDGE_FUNCTION_TESTING.md) - Testing instructions

## Type Definitions

This directory contains type definitions and utilities needed by the application to interact with Edge Functions, but NOT the Edge Functions themselves. This separation prevents Deno-specific code from causing issues with the Vite build process.

## Implementation Notes

- The Edge Functions are implemented using Deno and TypeScript
- They are designed to work in both development and production environments
- In development mode, they can return mock data when required credentials are missing
- Functions use the Supabase service role key for database operations

To modify the Edge Functions, edit the files in the `supabase/functions/` directory, not in this directory.
