/**
 * Compresses an image file to reduce its size while maintaining acceptable quality
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB (default: 1MB)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @param quality - Image quality from 0 to 1 (default: 0.8)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compressed size is acceptable
            const compressedSizeMB = blob.size / (1024 * 1024);

            if (compressedSizeMB > maxSizeMB && quality > 0.1) {
              // If still too large, try with lower quality
              const newQuality = quality * 0.7;
              compressImage(file, maxSizeMB, maxWidthOrHeight, newQuality)
                .then(resolve)
                .catch(reject);
              return;
            }

            // Create new file from blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Checks if an image needs compression based on size and dimensions
 * @param file - The image file to check
 * @param maxSizeMB - Maximum acceptable file size in MB
 * @returns Promise<boolean> - True if compression is needed
 */
export async function needsCompression(
  file: File,
  maxSizeMB: number = 1
): Promise<boolean> {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
}
