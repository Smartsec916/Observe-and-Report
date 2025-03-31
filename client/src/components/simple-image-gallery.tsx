import React, { useState } from "react";
import { ImageInfo } from "@shared/schema";
import { Button } from "./ui/button";
import { Camera, Upload } from "lucide-react";
import { ImageViewer } from "./image-viewer";

interface SimpleImageGalleryProps {
  images: ImageInfo[];
  observationId: number;
  readOnly?: boolean;
}

/**
 * A simplified image gallery component without uploading/metadata functionality
 */
export function SimpleImageGallery({ images = [], observationId, readOnly = false }: SimpleImageGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('description', '');
    
    setIsUploading(true);
    
    try {
      const response = await fetch(`/api/observations/${observationId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      // Reload the page to see the new image
      window.location.reload();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Empty state handler
  if (images.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Images</h3>
        
        {/* Upload button */}
        {!readOnly && (
          <label htmlFor="simple-image-upload" className="cursor-pointer">
            <input
              id="simple-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? "Uploading..." : (
                  <>
                    <Upload className="h-4 w-4" />
                    Add Image
                  </>
                )}
              </span>
            </Button>
          </label>
        )}
      </div>

      {/* Image gallery */}
      {images.length === 0 ? (
        <div className="text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No images attached</p>
          {!readOnly && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Click the "Add Image" button to attach images
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={image.url} className="flex flex-col space-y-2">
              {/* Use the standalone ImageViewer component */}
              <ImageViewer image={image} index={index} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}