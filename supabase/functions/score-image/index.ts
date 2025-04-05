
// Supabase Edge Function for image scoring
// Run locally with Supabase CLI: supabase functions serve score-image
// Deploy with: supabase functions deploy score-image

// Import Supabase client (using ESM version for Deno)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, addCorsHeaders } from './_shared/cors.ts';

// Type definitions
interface RequestData {
  image: string; // base64 encoded image
  metadata: {
    filename: string;
    width: number;
    height: number;
    size: number;
    type: string;
    projectId?: string;
    userId?: string;
  };
  test_mode?: boolean; // Flag for test requests
}

interface VisionApiData {
  labels: string[];
  colors: string[];
  objects: string[];
  landmarks: string[];
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
  };
}

// Telemetry interface for function events
interface FunctionTelemetry {
  request_id: string;
  project_id?: string;
  user_id?: string;
  image_size: number;
  image_type: string;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  is_test_mode: boolean;
  timestamp: string;
}

// Check if we're in a Deno environment
const isDeno = typeof Deno !== 'undefined';

/**
 * Get environment variable - works in Deno environment
 */
function getEnv(key: string): string | undefined {
  if (isDeno) {
    return Deno.env.get(key);
  }
  return undefined;
}

/**
 * Generate a unique request ID for telemetry
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Main handler for HTTP requests
 */
if (isDeno) {
  Deno.serve(async (req: Request) => {
    const requestId = generateRequestId();
    const startTime = performance.now();
    let telemetry: FunctionTelemetry | null = null;
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return handleCors();
    }

    try {
      // Get environment variables
      const apiKey = getEnv('VISION_API_KEY');
      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
      
      // Check if we have all required environment variables
      const missingKeys = [];
      if (!apiKey) missingKeys.push('VISION_API_KEY');
      if (!supabaseUrl) missingKeys.push('SUPABASE_URL');
      if (!supabaseServiceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');

      // Parse request data
      const requestData = await req.json() as RequestData;
      const { image, metadata, test_mode } = requestData;
      
      // Initialize telemetry
      telemetry = {
        request_id: requestId,
        project_id: metadata.projectId,
        user_id: metadata.userId,
        image_size: metadata.size,
        image_type: metadata.type,
        response_time_ms: 0,
        success: false,
        is_test_mode: !!test_mode,
        timestamp: new Date().toISOString()
      };
      
      if (!image) {
        throw new Error('Image data is required');
      }

      // If any required keys are missing, return mock data
      if (missingKeys.length > 0) {
        console.log(`Missing required environment variables: ${missingKeys.join(', ')}. Using mock data.`);
        
        // Generate mock data
        const mockData = generateMockVisionData(metadata.filename);
        
        // Update telemetry
        if (telemetry) {
          telemetry.success = true;
          telemetry.response_time_ms = Math.round(performance.now() - startTime);
        }
        
        // Log telemetry
        await logFunctionTelemetry(
          supabaseUrl, 
          supabaseServiceKey, 
          telemetry
        ).catch(e => console.error('Telemetry error:', e));
        
        return new Response(
          JSON.stringify(mockData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Handle test mode requests differently
      if (test_mode) {
        console.log('Test mode request received');
        
        // In test mode, log the request but don't call the actual API
        const mockData = generateMockVisionData(metadata.filename);
        
        // Update telemetry
        if (telemetry) {
          telemetry.success = true;
          telemetry.response_time_ms = Math.round(performance.now() - startTime);
        }
        
        // Log telemetry
        await logFunctionTelemetry(
          supabaseUrl, 
          supabaseServiceKey, 
          telemetry
        ).catch(e => console.error('Telemetry error:', e));
        
        return new Response(
          JSON.stringify({
            test: true,
            message: 'Test request successful',
            mockData,
            received: {
              filename: metadata.filename,
              size: metadata.size,
              type: metadata.type,
              imageByteLength: image.length,
              requestId
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Authenticate user if userId is provided
      if (metadata.userId) {
        // This is a simplified check - in production you'd use proper auth
        const { error } = await supabase.auth.getUser();
        if (error) {
          // Update telemetry
          if (telemetry) {
            telemetry.success = false;
            telemetry.error_message = 'Unauthorized';
            telemetry.response_time_ms = Math.round(performance.now() - startTime);
          }
          
          // Log telemetry
          await logFunctionTelemetry(
            supabaseUrl, 
            supabaseServiceKey, 
            telemetry
          ).catch(e => console.error('Telemetry error:', e));
          
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Call the Vision API
      let visionData: VisionApiData;
      try {
        visionData = await callVisionApi(image, apiKey);
        
        // Update telemetry for success
        if (telemetry) {
          telemetry.success = true;
          telemetry.response_time_ms = Math.round(performance.now() - startTime);
        }
      } catch (error) {
        console.error('Vision API error:', error);
        
        // Update telemetry for failure
        if (telemetry) {
          telemetry.success = false;
          telemetry.error_message = error instanceof Error ? error.message : String(error);
          telemetry.response_time_ms = Math.round(performance.now() - startTime);
        }
        
        // Log telemetry
        await logFunctionTelemetry(
          supabaseUrl, 
          supabaseServiceKey, 
          telemetry
        ).catch(e => console.error('Telemetry error:', e));
        
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Log the API call telemetry
      await logFunctionTelemetry(
        supabaseUrl, 
        supabaseServiceKey, 
        telemetry
      ).catch(e => console.error('Telemetry error:', e));

      // Return the vision data
      return new Response(
        JSON.stringify(visionData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Edge function error:', error);
      
      // Update telemetry for unexpected error
      if (telemetry) {
        telemetry.success = false;
        telemetry.error_message = error instanceof Error ? error.message : String(error);
        telemetry.response_time_ms = Math.round(performance.now() - startTime);
        
        // Try to log telemetry even for unexpected errors
        try {
          const supabaseUrl = getEnv('SUPABASE_URL');
          const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
          
          if (supabaseUrl && supabaseServiceKey) {
            await logFunctionTelemetry(
              supabaseUrl, 
              supabaseServiceKey, 
              telemetry
            );
          }
        } catch (e) {
          console.error('Failed to log telemetry:', e);
        }
      }
      
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  });
}

/**
 * Call the Vision API to analyze an image
 */
async function callVisionApi(imageBase64: string, apiKey: string): Promise<VisionApiData> {
  const url = "https://vision.googleapis.com/v1/images:annotate";
  
  const requestData = {
    requests: [{
      image: {
        content: imageBase64
      },
      features: [
        { type: "LABEL_DETECTION", maxResults: 10 },
        { type: "IMAGE_PROPERTIES", maxResults: 5 },
        { type: "OBJECT_LOCALIZATION", maxResults: 5 },
        { type: "LANDMARK_DETECTION", maxResults: 3 },
        { type: "SAFE_SEARCH_DETECTION" }
      ]
    }]
  };
  
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vision API error: ${response.status} - ${text}`);
  }
  
  const data = await response.json();
  const responseData = data.responses[0];
  
  // Transform the API response to our VisionApiData format
  return {
    labels: responseData.labelAnnotations?.map((label: any) => label.description) || [],
    colors: responseData.imagePropertiesAnnotation?.dominantColors?.colors?.map(
      (color: any) => `rgb(${Math.round(color.color.red)}, ${Math.round(color.color.green)}, ${Math.round(color.color.blue)})`
    ) || [],
    objects: responseData.localizedObjectAnnotations?.map((obj: any) => obj.name) || [],
    landmarks: responseData.landmarkAnnotations?.map((landmark: any) => landmark.description) || [],
    safeSearch: {
      adult: responseData.safeSearchAnnotation?.adult || "UNLIKELY",
      violence: responseData.safeSearchAnnotation?.violence || "UNLIKELY",
      racy: responseData.safeSearchAnnotation?.racy || "UNLIKELY"
    }
  };
}

/**
 * Log function telemetry to Supabase
 */
async function logFunctionTelemetry(
  supabaseUrl: string | undefined,
  supabaseKey: string | undefined,
  telemetry: FunctionTelemetry | null
): Promise<boolean> {
  if (!telemetry || !supabaseUrl || !supabaseKey) {
    console.log('Missing required data for telemetry logging');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase
      .from('function_telemetry')
      .insert({
        request_id: telemetry.request_id,
        project_id: telemetry.project_id,
        user_id: telemetry.user_id,
        image_size: telemetry.image_size,
        image_type: telemetry.image_type,
        response_time_ms: telemetry.response_time_ms,
        success: telemetry.success,
        error_message: telemetry.error_message,
        is_test_mode: telemetry.is_test_mode,
        function_name: 'score-image',
        created_at: telemetry.timestamp
      });

    if (error) {
      console.error('Error logging function telemetry:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logFunctionTelemetry:', error);
    return false;
  }
}

/**
 * Generate mock vision data for testing
 */
function generateMockVisionData(filename: string): VisionApiData {
  // Use filename to generate deterministic but varied mock data
  const hash = filename.split('').reduce((a, b) => {
    return a + b.charCodeAt(0);
  }, 0);
  
  const mockLabelSets = [
    ['person', 'outdoor', 'nature', 'landscape', 'mountain'],
    ['dog', 'animal', 'pet', 'mammal', 'canine'],
    ['food', 'meal', 'restaurant', 'cuisine', 'dish'],
    ['building', 'architecture', 'urban', 'city', 'skyline'],
    ['beach', 'ocean', 'water', 'sand', 'coast']
  ];
  
  const mockColors = [
    ['rgb(42, 75, 153)', 'rgb(89, 156, 231)', 'rgb(235, 245, 251)'],
    ['rgb(67, 122, 50)', 'rgb(120, 173, 59)', 'rgb(238, 240, 214)'],
    ['rgb(153, 42, 42)', 'rgb(231, 89, 89)', 'rgb(251, 235, 235)'],
    ['rgb(42, 42, 42)', 'rgb(120, 120, 120)', 'rgb(200, 200, 200)'],
    ['rgb(201, 148, 21)', 'rgb(247, 202, 24)', 'rgb(253, 235, 180)']
  ];
  
  const setIndex = hash % mockLabelSets.length;
  
  return {
    labels: mockLabelSets[setIndex],
    colors: mockColors[setIndex],
    objects: mockLabelSets[setIndex].slice(0, 2),
    landmarks: [],
    safeSearch: {
      adult: 'VERY_UNLIKELY',
      violence: 'UNLIKELY',
      racy: 'UNLIKELY'
    }
  };
}

// Export functions for testing in non-Deno environments
export { callVisionApi, generateMockVisionData, logFunctionTelemetry };
