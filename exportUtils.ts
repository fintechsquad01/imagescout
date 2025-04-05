
import { saveAs } from 'file-saver';
import { ScoredImage } from '@/types/scoring';

// Export image as JSON
export const exportImageAsJson = (image: ScoredImage) => {
  const dataStr = JSON.stringify(image, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  saveAs(dataBlob, `image-${image.id}.json`);
};

// Export scoring data as CSV
export const exportScoringResultsAsCsv = (images: ScoredImage[]) => {
  if (!images || images.length === 0) return;
  
  // Define headers
  const headers = [
    'ID',
    'Filename',
    'Score',
    'Image URL',
    'Width',
    'Height',
    'Upload Date'
  ];
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...images.map(img => [
      img.id,
      img.fileName || img.name || 'unknown',
      img.opportunityScore || img.score || 0,
      img.url,
      img.width || 0,
      img.height || 0,
      img.uploadDate
    ].join(','))
  ].join('\n');
  
  // Create and save blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `scoring-results-${new Date().toISOString().slice(0, 10)}.csv`);
};

// Base64 download helper
export const downloadBase64File = (base64Data: string, filename: string, mimeType: string = 'image/png') => {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  saveAs(blob, filename);
};

// Download image directly from URL
export const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
};
