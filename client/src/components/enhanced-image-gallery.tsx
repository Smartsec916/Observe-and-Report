import React, { useState } from "react";
import { ImageInfo } from "@/lib/types";
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
              <Sheet>
                <SheetTrigger asChild>
                  <div className="aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer">
                    <div className="relative h-full w-full">
                      <img
                        src={image.url}
                        alt={image.description || `Image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </SheetTrigger>
                
                <SheetContent 
                  side="bottom" 
                  className="h-[90vh] p-0 pt-2 bg-black border-t border-gray-700 rounded-t-xl"
                >
                  <SheetHeader className="px-4 pt-0 pb-2">
                    <SheetTitle className="text-sm text-center text-white">
                      Image Viewer
                    </SheetTitle>
                  </SheetHeader>
                  
                  <SheetClose className="absolute top-1 right-1 rounded-full h-8 w-8 p-0 bg-black/50 flex items-center justify-center z-50 border-0 hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </SheetClose>
                  
                  {/* Full image view */}
                  <div className="relative">
                    <img 
                      src={image.url} 
                      alt={image.description || "Observation image"} 
                      className="w-full h-auto object-contain max-h-[50vh]" 
                    />
                    
                    {/* Image description */}
                    {image.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-sm">
                        {image.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Metadata section */}
                  <div className="mt-1 mx-4 p-3 border border-gray-700 rounded-md bg-gray-900/50">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs w-full bg-gray-800 border-gray-700 mb-2"
                      onClick={() => setShowMetadata(!showMetadata)}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      {showMetadata ? "Hide MetaData" : "Show MetaData"}
                    </Button>
                    
                    {showMetadata && (
                      <ScrollArea className="h-[120px] w-full mt-2 rounded-md border border-gray-700 bg-gray-900 p-2">
                        <div className="space-y-1 text-xs">
                          {image.metadata && Object.keys(image.metadata).length > 0 ? (
                            <>
                              {image.metadata.dateTaken && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Date Taken:</span>
                                  <span>{image.metadata.dateTaken}</span>
                                </div>
                              )}
                              
                              {/* GPS coordinates display (if available) */}
                              {(image.metadata.latitude !== undefined && image.metadata.longitude !== undefined) ? (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right">{image.metadata.latitude.toFixed(6)}, {image.metadata.longitude.toFixed(6)}</span>
                                </div>
                              ) : (image.metadata.location?.latitude !== undefined && image.metadata.location?.longitude !== undefined) ? (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right">{image.metadata.location.latitude.toFixed(6)}, {image.metadata.location.longitude.toFixed(6)}</span>
                                </div>
                              ) : image.metadata.gpsCoordinates ? (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right">{image.metadata.gpsCoordinates}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right text-gray-500">No GPS data in image</span>
                                </div>
                              )}
                              
                              {/* Location Info Header */}
                              {!image.metadata.location && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Location:</span>
                                  <span className="text-right text-gray-500">No location data available</span>
                                </div>
                              )}
                              
                              {/* Street Number and Name display */}
                              {(image.metadata.location?.streetNumber || image.metadata.location?.streetName) && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Street:</span>
                                  <span className="text-right">
                                    {[
                                      image.metadata.location.streetNumber,
                                      image.metadata.location.streetName
                                    ].filter(Boolean).join(' ')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Location address display */}
                              {image.metadata.location?.formattedAddress && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Full Address:</span>
                                  <span className="text-right max-w-[180px] truncate">{image.metadata.location.formattedAddress}</span>
                                </div>
                              )}
                              
                              {/* City/State/Zip display */}
                              {(image.metadata.location?.city || image.metadata.location?.state || image.metadata.location?.zipCode) && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Location:</span>
                                  <span className="text-right">
                                    {[
                                      image.metadata.location.city,
                                      image.metadata.location.state,
                                      image.metadata.location.zipCode
                                    ].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Device info */}
                              {image.metadata.deviceInfo && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Device:</span>
                                  <span>{image.metadata.deviceInfo}</span>
                                </div>
                              )}
                              
                              {/* Edit info */}
                              {image.metadata.editHistory && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Edit Info:</span>
                                  <span>{image.metadata.editHistory}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex justify-center items-center h-20">
                              <span className="text-gray-400">No metadata found in image</span>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
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