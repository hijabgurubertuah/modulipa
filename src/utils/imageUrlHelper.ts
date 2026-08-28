/**
 * Utility to format, normalize, and validate image URLs.
 * Handles common cloud/drive links (Google Drive, Dropbox, etc.)
 * converting them into direct raw image URLs that load properly in web browsers and iframes.
 */

export const normalizeImageUrl = (inputUrl: string): string => {
  if (!inputUrl) return '';
  let url = inputUrl.trim();

  // If already base64 data url, return as is
  if (url.startsWith('data:image/')) {
    return url;
  }

  // 1. Google Drive Sharing Links
  // Patterns:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/edit
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const gdriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveFileMatch && gdriveFileMatch[1]) {
    const fileId = gdriveFileMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  const gdriveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (gdriveIdMatch && gdriveIdMatch[1]) {
    const fileId = gdriveIdMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. Dropbox Links
  // Pattern: https://www.dropbox.com/s/xyz/photo.png?dl=0
  if (url.includes('dropbox.com')) {
    url = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    url = url.replace('?dl=0', '');
    if (!url.includes('raw=1') && !url.includes('dl.dropboxusercontent.com')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  }

  // 3. ImgBB viewer links to direct format helper
  // Pattern: https://ibb.co/xyz -> note: direct link is i.ibb.co/xyz/image.png
  // If user pasted ibb.co.com or i.ibb.co, keep it
  
  return url;
};

/**
 * Validates if an image URL can be loaded successfully by the browser.
 */
export const testImageLoad = (url: string, timeoutMs = 8000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url || !url.trim()) {
      resolve(false);
      return;
    }

    const normalized = normalizeImageUrl(url);
    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.referrerPolicy = 'no-referrer';
    img.src = normalized;
  });
};
