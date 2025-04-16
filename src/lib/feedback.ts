import { FeedbackCategory } from './types';

export const feedbackCategories: FeedbackCategory[] = [
  {
    id: 'bug',
    label: 'Report an Issue',
    description: 'Something is not working correctly'
  },
  {
    id: 'feature',
    label: 'Request a Feature',
    description: 'Suggest a new feature or improvement'
  },
  {
    id: 'other',
    label: 'General Feedback',
    description: 'Share your thoughts about the app'
  }
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// Function to validate image before upload
export async function validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image must be smaller than 5MB'
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed'
    };
  }

  // Create an image element to check dimensions and validate the file
  try {
    const image = await createImageBitmap(file);
    
    // Check minimum dimensions
    if (image.width < 50 || image.height < 50) {
      return {
        valid: false,
        error: 'Image is too small. Minimum size is 50x50 pixels.'
      };
    }

    // Check maximum dimensions
    if (image.width > 4096 || image.height > 4096) {
      return {
        valid: false,
        error: 'Image is too large. Maximum size is 4096x4096 pixels.'
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file'
    };
  }
}