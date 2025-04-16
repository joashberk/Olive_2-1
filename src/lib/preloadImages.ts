const DEFAULT_IMAGES = [
  '/jar/Profile-Olive-01-B.png',
  '/jar/Note-Paper-Pen-01-B.png',
  '/jar/Saved-Pin-01-B.png'
] as const;

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function preloadDefaultImages(): Promise<void> {
  try {
    // Load all images in parallel
    await Promise.all(DEFAULT_IMAGES.map(preloadImage));
  } catch (error) {
    console.warn('Failed to preload some images:', error);
    // Don't throw - we want the app to continue even if preloading fails
  }
}

// Export the list of images for type safety
export const defaultImages = DEFAULT_IMAGES; 