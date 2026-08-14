/**
 * Centralized utility for resolving image URLs across Getsy frontend.
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;

  // Handle array of images (e.g. item.images)
  if (Array.isArray(imagePath)) {
    if (imagePath.length === 0) return null;
    imagePath = imagePath[0];
  }

  if (typeof imagePath !== 'string' || !imagePath.trim()) return null;

  const path = imagePath.trim();

  // Return full external URLs, data URLs, or blob URLs as-is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  // Public frontend assets in /images/ (e.g. /images/demo/... or /images/categories/...)
  if (path.startsWith('/images/')) {
    return path;
  }

  if (path.startsWith('images/')) {
    return `/${path}`;
  }

  // Already prefixed with /uploads/
  if (path.startsWith('/uploads/')) {
    return path;
  }

  // Prefixed with uploads/ (missing leading slash)
  if (path.startsWith('uploads/')) {
    return `/${path}`;
  }

  // Relative backend upload filename, add /uploads/
  return `/uploads/${path.replace(/^\/+/, '')}`;
}

export default getImageUrl;
