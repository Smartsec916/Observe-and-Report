import exif from "exif";
import type { ExifData } from "exif";
import fs from "fs";

/**
 * Extract basic metadata from an image file
 * @param filePath Path to the image file
 * @returns Promise resolving to metadata object
 */
export const extractBasicMetadata = (filePath: string): Promise<Record<string, any>> => {
  return new Promise((resolve) => {
    try {
      new exif.ExifImage({ image: filePath }, (error: Error | null, exifData: ExifData) => {
        if (error) {
          console.log('EXIF extraction error:', error.message);
          resolve({}); // Return empty object if EXIF data can't be read
          return;
        }
        
        // Extract relevant metadata
        const metadata: Record<string, any> = {};
        
        // Date and time
        if (exifData.exif?.DateTimeOriginal) {
          metadata.dateTaken = exifData.exif.DateTimeOriginal;
        }
        
        // Device info
        if (exifData.image) {
          const deviceInfo = [];
          if (exifData.image.Make) deviceInfo.push(exifData.image.Make);
          if (exifData.image.Model) deviceInfo.push(exifData.image.Model);
          if (deviceInfo.length > 0) {
            metadata.deviceInfo = deviceInfo.join(' ');
          }
        }
        
        // Software info (could indicate editing)
        if (exifData.image?.Software) {
          metadata.editHistory = `Processed with ${exifData.image.Software}`;
        }
        
        console.log('Extracted basic metadata:', metadata);
        resolve(metadata);
      });
    } catch (err) {
      console.error('Failed to extract EXIF data:', err);
      resolve({});
    }
  });
};