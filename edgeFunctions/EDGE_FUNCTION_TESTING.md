
# Edge Function Testing Guide

This guide explains how to test the `score-image` Edge Function both locally and in production.

## Prerequisites

1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`

## Local Testing

### 1. Start the Local Supabase Development Server

```bash
supabase start
```

### 2. Serve Edge Functions Locally

```bash
supabase functions serve score-image
```

### 3. Test with the Debug Panel

Navigate to `/test-scoring` in the app to access the test page. This allows you to:

- Upload test images
- Toggle between Edge Function and direct API testing
- Force mock data for debugging
- View raw request/response payloads
- Inspect vision data and opportunity scores

## Edge Function Configuration

### Required Environment Variables

For the Edge Function to work properly, you must set these environment variables:

```bash
# For local development
supabase secrets set --env-file ./supabase/.env.local

# For production
supabase secrets set VISION_API_KEY=your-api-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Environment File Format (.env.local)

```
VISION_API_KEY=your-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment

### 1. Deploy the Edge Function

```bash
supabase functions deploy score-image
```

### 2. Verify CORS Configuration

The Edge Function includes CORS headers to allow requests from your domain. For production, update the `corsHeaders` in `_shared/cors.ts` to restrict access to your domain.

### 3. Test in Production

After deployment, verify that the function works with your production environment:

1. Use the test page to ensure proper connectivity
2. Check function telemetry logs in the database
3. Validate error handling and retry logic

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Check your secrets configuration with:
   ```bash
   supabase secrets list
   ```

2. **CORS Errors**: Verify that your frontend domain is allowed in the CORS configuration.

3. **Timeout Errors**: The default timeout for Edge Functions is 2 seconds. For image processing:
   ```bash
   supabase functions deploy score-image --no-verify-jwt --import-map ./supabase/functions/import_map.json --timeout 10
   ```

4. **Memory Limits**: Large images may exceed memory limits. Consider resizing images before uploading.

### Debug Logs

Access Edge Function logs through the Supabase dashboard or CLI:

```bash
supabase functions logs score-image
```

## Telemetry

The function logs detailed telemetry to the `function_telemetry` table, including:

- Request ID
- Project and user IDs
- Response time
- Success/failure status
- Error messages
- Test mode status

View this data in the Supabase dashboard or query it directly.
