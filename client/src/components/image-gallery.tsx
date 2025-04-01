import React, { useState } from "react";
import { ImageInfo } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Camera, X, Upload, Trash2, Info, MapPin, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImageGalleryProps {
  images: ImageInfo[];
  observationId: number;
  readOnly?: boolean;
}

export function ImageGallery({ images = [], observationId, readOnly = false }: ImageGalleryProps) {
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

  // Handle image deletion
  const handleDeleteImage = (imageUrl: string) => {
    if (window.confirm("Are you sure you want to remove this image?")) {
      const encodedPath = encodeURIComponent(imageUrl);
      
      fetch(`/api/observations/${observationId}/images/${encodedPath}`, {
        method: "DELETE",
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) throw new Error('Deletion failed');
        return response.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
        toast({
          title: "Image deleted",
          description: "Your image has been successfully removed."
        });
      })
      .catch(error => {
        toast({
          title: "Deletion failed",
          description: error instanceof Error ? error.message : "Failed to delete image",
          variant: "destructive"
        });
      });
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
              {/* Image thumbnail with dialog */}
              <Sheet>
                <SheetTrigger asChild>
                  <div className="aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer">
                    <div className="relative h-full w-full">
                      <img
                        src={image.url}
                        alt={image.description || `Image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Show location indicator on thumbnail if GPS data exists */}
                      {(image.metadata?.latitude && image.metadata?.longitude) || 
                       (image.metadata?.location?.latitude && image.metadata?.location?.longitude) ? (
                        <div 
                          className="absolute bottom-1 right-1 bg-black/70 rounded-md px-1.5 py-0.5 flex items-center"
                          title="Contains location data"
                        >
                          <MapPin className="h-3 w-3 text-green-400 mr-1" />
                          <span className="text-green-300 text-xs font-medium">GPS</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SheetTrigger>
                
                <SheetContent 
                  side="bottom" 
                  className="h-[90vh] p-0 pt-2 bg-black border-t border-gray-700 rounded-t-xl"
                  aria-describedby="image-viewer-description"
                >
                  <div id="image-viewer-description" className="sr-only">
                    View image details, metadata, and location information
                  </div>
                  <SheetHeader className="px-4 pt-0 pb-2">
                    <SheetTitle className="text-sm text-center text-white">
                      Image Viewer
                    </SheetTitle>
                  </SheetHeader>
                  
                  <SheetClose className="absolute top-1 right-1 rounded-full h-8 w-8 p-0 bg-black/50 flex items-center justify-center z-50 border-0 hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </SheetClose>
                  
                  {/* Image content without tabs */}
                  <div className="w-full flex-1 flex flex-col">
                    
                    {/* Full image view */}
                    <div className="relative">
                      <img 
                        src={image.url} 
                        alt={image.description || "Observation image"} 
                        className="w-full h-auto object-contain max-h-[60vh]" 
                      />
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {!readOnly && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-full h-8 w-8 p-0 bg-black/50 text-red-500 border-red-500"
                            onClick={() => handleDeleteImage(image.url)}
                            aria-label="Delete image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Image description */}
                      {image.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-sm">
                          {image.description}
                        </div>
                      )}
                    </div>
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
                              
                              {/* GPS coordinates display */}
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
                              ) : null}
                              
                              {/* Location address display */}
                              {image.metadata.location?.formattedAddress && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Address:</span>
                                  <span className="text-right">{image.metadata.location.formattedAddress}</span>
                                </div>
                              )}
                              
                              {/* City/State display */}
                              {(image.metadata.location?.city || image.metadata.location?.state) && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Location:</span>
                                  <span className="text-right">
                                    {[
                                      image.metadata.location.city,
                                      image.metadata.location.state
                                    ].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {image.metadata.altitude && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Altitude:</span>
                                  <span>{image.metadata.altitude} m</span>
                                </div>
                              )}
                              
                              {image.metadata.direction && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Direction:</span>
                                  <span>{image.metadata.direction}</span>
                                </div>
                              )}
                              
                              {image.metadata.speed && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Speed:</span>
                                  <span>{image.metadata.speed}</span>
                                </div>
                              )}
                              
                              {image.metadata.deviceInfo && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">Device:</span>
                                  <span>{image.metadata.deviceInfo}</span>
                                </div>
                              )}
                              
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
                  
                  {/* Show google maps button if location data is available */}
                  {((image.metadata?.latitude && image.metadata?.longitude) || 
                    (image.metadata?.location?.latitude && image.metadata?.location?.longitude)) && (
                    <div 
                      className="flex-1 flex items-center justify-center gap-1 py-1 h-6 text-green-400 cursor-pointer border-l border-border/30"
                      onClick={(e) => {
                        e.preventDefault();
                        const lat = image.metadata?.location?.latitude || image.metadata?.latitude;
                        const lng = image.metadata?.location?.longitude || image.metadata?.longitude;
                        
                        if (lat && lng) {
                          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                          window.open(googleMapsUrl, "_blank");
                        }
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Maps</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
