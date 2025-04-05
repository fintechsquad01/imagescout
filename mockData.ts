// Import correct types from their new locations
import { ScoredImage } from '@/types/scoring';
import { VisionApiData } from '@/types/vision';
import { ContentSuggestion, AIModel } from '@/types/content';

// Validation function for upload limits
export const validateUploadLimits = (files: File[]): boolean => {
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  if (files.length > MAX_FILES) {
    console.error(`Too many files. Maximum is ${MAX_FILES}.`);
    return false;
  }
  
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File ${file.name} is too large. Maximum size is 5MB.`);
      return false;
    }
    
    if (!file.type.startsWith('image/')) {
      console.error(`File ${file.name} is not an image.`);
      return false;
    }
  }
  
  return true;
};

// Mock vision data
export const getMockVisionData = (): VisionApiData => {
  return {
    labels: [
      'Architecture',
      'Building',
      'Sky',
      'City',
      'Urban',
      'Modern'
    ],
    objects: [
      'Building',
      'Window',
      'Sky'
    ],
    landmarks: [],
    colors: [
      '#5D6D7E',
      '#D6DBDF',
      '#2874A6',
      '#F4F6F7',
      '#85929E'
    ],
    safeSearch: {
      adult: 'UNLIKELY',
      violence: 'UNLIKELY',
      racy: 'UNLIKELY'
    }
  };
};

// Mock scored images with the correct type structure
export const getMockScoredImages = (): ScoredImage[] => {
  return [
    {
      id: 'img1',
      url: '/placeholder.svg',
      thumbnailUrl: '/placeholder.svg',
      src: '/placeholder.svg', // For backward compatibility
      fileName: 'office-building.jpg', // For backward compatibility
      name: 'office-building.jpg',
      width: 800,
      height: 600,
      size: 1024 * 1024,
      format: 'image/jpeg',
      lastModified: Date.now(),
      uploadDate: new Date().toISOString(),
      visionData: getMockVisionData(),
      opportunityScore: 78,
      score: 78, // For backward compatibility
      projectId: 'default-project-id'
    },
    {
      id: 'img2',
      url: '/placeholder.svg',
      thumbnailUrl: '/placeholder.svg',
      src: '/placeholder.svg', // For backward compatibility
      fileName: 'modern-architecture.jpg', // For backward compatibility
      name: 'modern-architecture.jpg',
      width: 800,
      height: 600,
      size: 1024 * 1024,
      format: 'image/jpeg',
      lastModified: Date.now(),
      uploadDate: new Date().toISOString(),
      visionData: getMockVisionData(),
      opportunityScore: 85,
      score: 85, // For backward compatibility
      projectId: 'default-project-id'
    }
  ];
};

// Function to generate mock content suggestions
export function generateMockContentSuggestions(): ContentSuggestion[] {
  return [
    {
      id: '1',
      title: 'Social Media Caption',
      description: 'Engaging caption for Instagram and Facebook posts',
      platforms: ['instagram', 'facebook'],
      prompt: 'Write an engaging social media caption for this image',
      text: 'Social media caption content',
      type: 'social'
    },
    {
      id: '2',
      title: 'Product Description',
      description: 'Detailed description for e-commerce listings',
      platforms: ['amazon', 'shopify'],
      prompt: 'Write a detailed product description based on this image',
      text: 'Product description content',
      type: 'product'
    },
    {
      id: '3',
      title: 'Blog Post Introduction',
      description: 'Engaging intro paragraph for blog articles',
      platforms: ['wordpress', 'medium'],
      prompt: 'Write an introduction paragraph for a blog post featuring this image',
      text: 'Blog introduction content',
      type: 'blog'
    }
  ];
}

// Function to generate mock AI models
export function generateMockAiModels(): AIModel[] {
  return [
    {
      id: 'renderai-v1',
      name: 'RenderAI Basic',
      description: 'Fast and efficient for simple content generation',
      icon: 'zap',
      suitableFor: ['social media', 'simple descriptions', 'titles'],
      explanation: 'Uses a lightweight model optimized for speed and efficiency',
      provider: 'RenderAI',
      available: true
    },
    {
      id: 'renderai-v2',
      name: 'RenderAI Pro',
      description: 'High-quality generation with more detailed results',
      icon: 'sparkles',
      suitableFor: ['blog posts', 'product descriptions', 'creative content'],
      explanation: 'Balances quality and speed for most content generation tasks',
      provider: 'RenderAI',
      available: true
    },
    {
      id: 'creativeai-v1',
      name: 'CreativeAI',
      description: 'Advanced creative writing capabilities for narrative content',
      icon: 'pen-tool',
      suitableFor: ['stories', 'long-form content', 'creative writing'],
      explanation: 'Specialized in generating creative and engaging long-form content',
      provider: 'CreativeAI',
      available: true
    }
  ];
}

// Mock content suggestions
export const getMockContentSuggestions = (): ContentSuggestion[] => {
  return [
    {
      id: 'sg1',
      title: 'Instagram Carousel',
      description: 'A visually stunning carousel showcasing modern architecture',
      platforms: ['instagram', 'facebook'],
      prompt: 'Create a set of 5 slides for an Instagram carousel about modern architecture, highlighting the geometric patterns and innovative design.'
    },
    {
      id: 'sg2',
      title: 'Twitter Thread',
      description: 'An educational thread about sustainable urban design',
      platforms: ['twitter'],
      prompt: 'Write a 5-tweet thread explaining how this building exemplifies sustainable urban design principles and why they matter for our future cities.'
    },
    {
      id: 'sg3',
      title: 'LinkedIn Article',
      description: 'Professional case study for architecture firms',
      platforms: ['linkedin'],
      prompt: 'Draft an introduction for a LinkedIn article presenting this structure as an exemplary case study in modern architectural innovation.'
    }
  ];
};

// Add the missing recommendModel function
export const recommendModel = (visionData?: VisionApiData): AIModel => {
  // Default model for when vision data is missing
  const defaultModel: AIModel = {
    id: 'render-standard',
    name: 'RenderNet Standard',
    description: 'Balanced quality and speed',
    icon: 'sparkles',
    suitableFor: ['social media', 'blog posts', 'general purpose'],
    explanation: 'Good all-around model that works well for most content types.'
  };
  
  // If no vision data, return default model
  if (!visionData) return defaultModel;
  
  // Check for characteristics in the labels to recommend a model
  const labels = visionData.labels.map(l => l.toLowerCase());
  
  // For product or object focused images
  if (labels.some(l => ['product', 'object', 'food', 'drink', 'clothing'].includes(l))) {
    return {
      id: 'render-product',
      name: 'RenderNet Product',
      description: 'Optimized for products',
      icon: 'image',
      suitableFor: ['e-commerce', 'product listings', 'catalogs'],
      explanation: 'Specialized for product imagery and detailed object descriptions.'
    };
  }
  
  // For landscapes or scenic images
  if (labels.some(l => ['landscape', 'nature', 'scenery', 'outdoor', 'travel'].includes(l))) {
    return {
      id: 'render-scenic',
      name: 'RenderNet Scenic',
      description: 'Enhanced for landscapes',
      icon: 'layout',
      suitableFor: ['travel content', 'nature blogs', 'landscape descriptions'],
      explanation: 'Best for scenic imagery and descriptive travel or nature content.'
    };
  }
  
  // Default to standard model
  return defaultModel;
};

// Add missing generatePromptFromMetadata function
export const generatePromptFromMetadata = (
  visionData: VisionApiData | undefined, 
  intent: string = 'describe',
  tone: string = 'neutral'
): string => {
  if (!visionData) {
    return "Describe this image in detail, focusing on the main elements visible.";
  }
  
  const labels = visionData.labels.slice(0, 3).join(', ');
  const objects = visionData.objects.slice(0, 3).join(', ');
  
  let basePrompt = "";
  
  // Handle different intents
  switch (intent) {
    case 'describe':
      basePrompt = `Describe this image showing ${labels}. Focus on the ${objects} visible in the scene.`;
      break;
    case 'advertise':
      basePrompt = `Write compelling advertising copy featuring this image of ${labels}. Highlight the ${objects} to attract potential customers.`;
      break;
    case 'story':
      basePrompt = `Create a short story inspired by this image containing ${labels}. Use the ${objects} as key elements in your narrative.`;
      break;
    case 'social':
      basePrompt = `Draft a social media post about this image featuring ${labels}. Mention the ${objects} in an engaging way to drive engagement.`;
      break;
    default:
      basePrompt = `Describe this image showing ${labels} in detail.`;
  }
  
  // Adjust for tone
  let tonePrefix = "";
  switch (tone) {
    case 'professional':
      tonePrefix = "Using a professional and formal tone, ";
      break;
    case 'casual':
      tonePrefix = "In a casual and conversational style, ";
      break;
    case 'humorous':
      tonePrefix = "With a humorous and lighthearted approach, ";
      break;
    case 'technical':
      tonePrefix = "Using technical and precise language, ";
      break;
    default:
      // No prefix for neutral tone
      tonePrefix = "";
  }
  
  return tonePrefix + basePrompt;
};
