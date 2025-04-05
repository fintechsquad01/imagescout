
# Environment Variables Documentation

This file documents all environment variables used in the ImageScout application.

## Core Environment Variables

| Variable | Description | Required | Default in Dev |
|----------|-------------|----------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | None |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | None |
| `VITE_VISION_API_KEY` | Google Vision API key | Yes* | None |

*Required unless Edge Functions are used for image scoring

## Feature Flags

| Variable | Description | Default in Dev |
|----------|-------------|---------------|
| `VITE_USE_EDGE_FUNCTIONS` | Whether to use Supabase Edge Functions for scoring | `true` |
| `VITE_ENABLE_REAL_SCORING` | Force real API calls even in dev mode | `false` |
| `VITE_ENABLE_STRIPE_BILLING` | Enable Stripe billing integration | `true` in dev |
| `VITE_TEST_EDGE_FUNCTION` | Run Edge Functions in test mode | `false` |
| `VITE_LOG_API_RESPONSES` | Log full API responses in console | `false` |

## Edge Function Environment Variables

These variables must be set in the Supabase project dashboard for Edge Functions:

| Variable | Description | Required |
|----------|-------------|----------|
| `VISION_API_KEY` | Google Vision API key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Development vs Production

In development mode:
- Most feature flags default to `true` even if not explicitly set
- Missing required variables trigger fallbacks to mock data
- Auth requirements are bypassed
- Telemetry is logged but not sent to production endpoints

For production deployment:
- All required environment variables must be explicitly set
- No auth bypassing occurs
- Proper error handling is enforced for all API calls
- Telemetry is recorded in Supabase tables

## Edge Function Deployment

When deploying Edge Functions to production:
1. Ensure all Edge Function environment variables are set in Supabase
2. Use `supabase functions deploy score-image` to deploy
3. Verify CORS configuration allows requests from your production domain
4. Test with both real and mock data to validate end-to-end flow
5. Check telemetry logging to ensure requests are properly recorded

## Telemetry and Logging

The application logs various events to Supabase:
- Image uploads and scoring attempts
- Generation results and user feedback
- API usage and errors
- Edge Function performance metrics

Telemetry can be monitored in the admin dashboard.
