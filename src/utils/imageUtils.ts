/**
 * Ensures that an image URL is absolute by adding the base URL if needed
 * 
 * @param url The image URL to process
 * @returns An absolute URL
 */
export function getAbsoluteImageUrl(url: string): string {
  // If the URL is already absolute, return it as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  
  // For relative URLs, prepend the base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Ensures that multiple image URLs are absolute
 * 
 * @param urls Array of image URLs to process
 * @returns Array of absolute URLs
 */
export function getAbsoluteImageUrls(urls: string[]): string[] {
  return urls.map(url => getAbsoluteImageUrl(url));
} 