declare module 'exif' {
  export class ExifImage {
    constructor(options: { image: string }, callback: (error: Error | null, data: ExifData) => void);
  }

  export interface ExifData {
    image?: {
      Make?: string;
      Model?: string;
      Software?: string;
      [key: string]: any;
    };
    exif?: {
      DateTimeOriginal?: string;
      [key: string]: any;
    };
    gps?: {
      GPSLatitude?: number[];
      GPSLatitudeRef?: string;
      GPSLongitude?: number[];
      GPSLongitudeRef?: string;
      GPSAltitude?: number;
      GPSImgDirection?: number;
      GPSImgDirectionRef?: string;
      GPSSpeed?: number;
      GPSSpeedRef?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
}