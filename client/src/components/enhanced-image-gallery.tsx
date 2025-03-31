import React, { useState } from "react";
import { ImageInfo } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";
import { Camera, X, Upload, Info } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { ImageViewer } from "./image-viewer";

interface EnhancedImageGalleryProps {
  images: ImageInfo[];
  observationId: number;
  readOnly?: boolean;
}

/**
 * An enhanced image gallery component with metadata viewing capabilities
 */
export function EnhancedImageGallery({ images = [], observationId, readOnly = false }: EnhancedImageGalleryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  
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
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
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
          <label htmlFor="image-upload" className="cursor-pointer">
            <input
              id="image-upload"
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
        <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-400">No images attached</p>
          {!readOnly && (
            <p className="mt-1 text-xs text-gray-500">
              Click the "Add Image" button to attach images
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={image.url} className="flex flex-col space-y-2">
              {/* Image thumbnail with metadata viewer */}
              {/* Use the standalone ImageViewer component */}
              <ImageViewer image={image} index={index} />
              
              {/* View MetaData button below image */}
              {image.metadata && Object.keys(image.metadata).length > 0 && (
                <div className="flex text-xs">
                  <div 
                    className="flex-1 flex items-center justify-center gap-1 py-1 h-6 text-blue-400 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMetadata(true);
                      
                      // Find the right dialog trigger - get all image containers first
                      const imageContainers = document.querySelectorAll('.aspect-square.rounded-md');
                      // Then click on the one at this index
                      if (imageContainers[index]) {
                        imageContainers[index].dispatchEvent(
                          new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
                        );
                      }
                    }}
                  >
                    <Info className="h-3 w-3" />
                    <span>View MetaData</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}