/**
 * This file serves as the entry point for Stripe server-side operations.
 * It exports all the necessary functions for use in edge functions or serverless functions.
 */

// Re-export all functions and types from the new structure
export * from '@/lib/stripe/server';

// Keep the processStripeWebhook function for backward compatibility
export { processStripeWebhook } from '@/lib/stripe/server';
