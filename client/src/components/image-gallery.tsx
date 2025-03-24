import React, { useState, Suspense } from "react";
import { ImageInfo, Observation } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Camera, X, Upload, Trash2, Info, MapPin, ExternalLink } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { LocationMap } from "./ui/map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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

  // Removed location-adding functionality as requested by user

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
              <Dialog>
                <DialogTrigger asChild>
                  <div className="aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer">
                    <div className="relative h-full w-full">
                      <img
                        src={image.url}
                        alt={image.description || `Image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Show location indicator on thumbnail if GPS data exists */}
                      {image.metadata?.latitude && image.metadata?.longitude && (
                        <div className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1">
                          <MapPin className="h-3 w-3 text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-xl p-1 bg-black">
                  {/* Tabs for Image and Map */}
                  <Tabs defaultValue="image" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-1">
                      <TabsTrigger value="image">Image</TabsTrigger>
                      <TabsTrigger 
                        value="map" 
                        disabled={!(image.metadata?.latitude && image.metadata?.longitude)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Location
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="image" className="mt-0 p-0">
                      {/* Full image view */}
                      <div className="relative">
                        <img 
                          src={image.url} 
                          alt={image.description || "Observation image"} 
                          className="w-full h-auto object-contain max-h-[70vh]" 
                        />
                        
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-full h-8 w-8 p-0 bg-black/50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          {!readOnly && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-full h-8 w-8 p-0 bg-black/50 text-red-500 border-red-500"
                              onClick={() => handleDeleteImage(image.url)}
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
                    </TabsContent>
                    
                    <TabsContent value="map" className="mt-0 p-0">
                      {/* Map view */}
                      {image.metadata?.latitude && image.metadata?.longitude ? (
                        <div className="relative">
                          {/* Only load the map when this tab is active to save resources */}
                          <Suspense fallback={
                            <div className="h-[300px] flex items-center justify-center bg-gray-800">
                              <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-gray-400">Loading map...</p>
                              </div>
                            </div>
                          }>
                            <LocationMap 
                              latitude={image.metadata.latitude} 
                              longitude={image.metadata.longitude}
                              height="300px"
                            />
                          </Suspense>
                          <div className="absolute top-2 right-2 z-50">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-black/70 hover:bg-black/90 text-white text-xs px-2 py-1 h-auto"
                              onClick={(e) => {
                                if (image.metadata?.latitude && image.metadata?.longitude) {
                                  // Show loading state
                                  const button = e.currentTarget;
                                  const originalContent = button.innerHTML;
                                  button.innerHTML = `<svg class="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg> Opening...`;

                                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${image.metadata.latitude},${image.metadata.longitude}`;
                                  window.open(googleMapsUrl, "_blank");
                                  
                                  // Restore original content after a short delay
                                  setTimeout(() => {
                                    button.innerHTML = originalContent;
                                  }, 1000);
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open in Google Maps
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center bg-gray-900 rounded-md">
                          <div className="text-center p-4">
                            <MapPin className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400">No location data available</p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  {/* Metadata section */}
                  <div className="mt-4 p-3 border border-gray-700 rounded-md bg-gray-900/50">
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
                              
                              {(image.metadata.latitude && image.metadata.longitude) && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right">{image.metadata.latitude}, {image.metadata.longitude}</span>
                                </div>
                              )}
                              
                              {image.metadata.gpsCoordinates && (
                                <div className="flex justify-between">
                                  <span className="font-medium text-gray-400">GPS:</span>
                                  <span className="text-right">{image.metadata.gpsCoordinates}</span>
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
                </DialogContent>
              </Dialog>
              
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
                  
                  {/* Show map icon if location data is available */}
                  {image.metadata?.latitude && image.metadata?.longitude && (
                    <div 
                      className="flex-1 flex items-center justify-center gap-1 py-1 h-6 text-green-400 cursor-pointer border-l border-border/30"
                      onClick={(e) => {
                        e.preventDefault();
                        // Open the image dialog and switch to map tab
                        const imageContainers = document.querySelectorAll('.aspect-square.rounded-md');
                        if (imageContainers[index]) {
                          imageContainers[index].dispatchEvent(
                            new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
                          );
                          
                          // Small delay to ensure dialog opens before clicking tab
                          setTimeout(() => {
                            // Find and click the map tab
                            const mapTab = document.querySelector('[value="map"]');
                            if (mapTab) {
                              mapTab.dispatchEvent(
                                new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
                              );
                            }
                          }, 50);
                        }
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                      <span>View Location</span>
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