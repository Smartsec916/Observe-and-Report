import React, { useState } from "react";
import { ImageInfo, ImageMetadata, Observation } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Camera, X, Plus, Upload, Trash2, Info } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface ImageGalleryProps {
  images: ImageInfo[];
  observationId: number;
  readOnly?: boolean;
}

export function ImageGallery({ images = [], observationId, readOnly = false }: ImageGalleryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Use fetch directly for FormData
      const response = await fetch(`/api/observations/${observationId}/images`, {
        method: "POST",
        body: formData,
        credentials: 'include', // Include cookies for authentication
        // Don't set Content-Type header as browser sets it automatically with proper boundary
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      // URL encode the path to handle special characters
      const encodedPath = encodeURIComponent(imageUrl);
      
      const response = await fetch(`/api/observations/${observationId}/images/${encodedPath}`, {
        method: "DELETE",
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        let errorMessage = 'Deletion failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      toast({
        title: "Image deleted",
        description: "Your image has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log("Selected file:", file.name, "Size:", file.size, "Type:", file.type);
    
    // Create a new FormData instance
    const formData = new FormData();
    
    // Append the file with 'image' as the field name
    formData.append('image', file, file.name);
    
    // Optional description
    formData.append('description', '');
    
    setIsUploading(true);
    
    try {
      console.log("Uploading file to observation ID:", observationId);
      
      // Use mobile-specific endpoint for better handling on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const endpoint = isMobile 
        ? `/api/observations/${observationId}/mobile-upload`
        : `/api/observations/${observationId}/images`;
        
      console.log(`Using ${isMobile ? 'mobile' : 'standard'} upload endpoint`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Important: Don't set Content-Type header, browser will set it with correct boundary
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log("Upload successful:", result);
      
      // Invalidate query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      
      toast({
        title: "Image uploaded",
        description: "Your image has been successfully uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (image: ImageInfo) => {
    if (window.confirm("Are you sure you want to remove this image?")) {
      deleteMutation.mutate(image.url);
    }
  };

  if (images.length === 0 && readOnly) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Images</h3>
        
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
                {isUploading ? (
                  <>Uploading...</>
                ) : (
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
              <Dialog>
                <DialogTrigger asChild>
                  <div 
                    className="aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.description || `Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-xl p-1 bg-black">
                  <div className="relative">
                    <img 
                      src={image.url} 
                      alt={image.description || "Observation image"} 
                      className="w-full h-auto object-contain max-h-[70vh]" 
                    />
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full h-8 w-8 p-0 bg-black/50"
                        onClick={() => setSelectedImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {!readOnly && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full h-8 w-8 p-0 bg-black/50 text-red-500 border-red-500"
                          onClick={() => handleDeleteImage(image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-black/70 p-2 text-white text-sm">
                      {image.description && (
                        <div className="mb-2">{image.description}</div>
                      )}
                      
                      <div className="w-full">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-xs w-full bg-gray-800 border-gray-700"
                          onClick={() => setShowMetadata(!showMetadata)}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          {showMetadata ? "Hide Metadata" : "Show Metadata"}
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
                                  
                                  {image.metadata.locationText && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Location:</span>
                                      <span className="text-right">{image.metadata.locationText}</span>
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
                              
                              {/* Add a button to copy GPS coordinates to observation location */}
                              {!readOnly && image.metadata && (image.metadata.gpsCoordinates || image.metadata.locationText) && (
                                <div className="mt-3 pt-2 border-t border-gray-700">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="text-xs w-full bg-gray-800 border-gray-700 mt-1"
                                    onClick={() => {
                                      // Check if we have location information
                                      const hasGPS = image.metadata?.gpsCoordinates;
                                      const hasLocationText = image.metadata?.locationText;
                                      
                                      if (hasGPS || hasLocationText) {
                                        // Get current observation
                                        const currentObservation = queryClient.getQueryData([`/api/observations/${observationId}`]) as Observation | undefined;
                                        const currentLocation = currentObservation?.location || '';
                                        
                                        // Format location information
                                        const locationInfo: string[] = [];
                                        
                                        // Add GPS coordinates if available
                                        if (hasGPS && image.metadata?.gpsCoordinates) {
                                          const gpsCoordinates = image.metadata.gpsCoordinates;
                                          
                                          // Check if the GPS coordinates are already in the location
                                          if (currentLocation.includes(gpsCoordinates)) {
                                            toast({
                                              title: "GPS Coordinates Already Added",
                                              description: "These GPS coordinates are already in the location list.",
                                            });
                                          } else {
                                            locationInfo.push(`GPS: ${gpsCoordinates}`);
                                          }
                                        }
                                        
                                        // Add text location if available
                                        if (hasLocationText && image.metadata?.locationText) {
                                          const locationText = image.metadata.locationText;
                                          
                                          // Check if the location text is already in the location
                                          if (currentLocation.includes(locationText)) {
                                            toast({
                                              title: "Location Already Added",
                                              description: "This location is already in the location list.",
                                            });
                                          } else {
                                            locationInfo.push(`Location: ${locationText}`);
                                          }
                                        }
                                        
                                        // If nothing new to add, return
                                        if (locationInfo.length === 0) {
                                          return;
                                        }
                                        
                                        // Add location information as a new line in the location, under Location Information
                                        const formattedLocationInfo = locationInfo.join('\n');
                                        const newLocationText = currentLocation.trim() 
                                          ? currentLocation.includes("Location Information")
                                            ? `${currentLocation}\n${formattedLocationInfo}`
                                            : `${currentLocation}\nLocation Information\n${formattedLocationInfo}`
                                          : `Location Information\n${formattedLocationInfo}`;
                                        
                                        // Update the observation with the new location
                                        const locationUpdate = {
                                          location: newLocationText
                                        };
                                        
                                        // Send PATCH request to update location using apiRequest
                                        apiRequest(`/api/observations/${observationId}`, {
                                          method: 'PATCH',
                                          body: JSON.stringify(locationUpdate),
                                          headers: {
                                            'Content-Type': 'application/json'
                                          }
                                        })
                                        .then(response => response.json())
                                        .then(() => {
                                          // Invalidate the query to refresh the data
                                          queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
                                          
                                          toast({
                                            title: "Location Updated",
                                            description: "Location information added to observation",
                                          });
                                        })
                                        .catch(error => {
                                          console.error("Error updating location:", error);
                                          toast({
                                            title: "Update Failed",
                                            description: error instanceof Error ? error.message : "Could not add location information",
                                            variant: "destructive",
                                          });
                                        });
                                      }
                                    }}
                                  >
                                    Add Location Information
                                  </Button>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Metadata button below the image */}
              {image.metadata && Object.keys(image.metadata).length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex items-center justify-center gap-1 py-1 h-6 text-blue-400 w-full"
                  onClick={() => {
                    setSelectedImage(image);
                    setShowMetadata(true);
                    
                    // Find the dialog trigger for this image
                    const dialogTriggers = document.querySelectorAll('[role="button"]');
                    // This is the image's dialog trigger
                    const imageDialogTrigger = dialogTriggers[index];
                    if (imageDialogTrigger) {
                      imageDialogTrigger.dispatchEvent(
                        new MouseEvent('click', {
                          bubbles: true,
                          cancelable: true,
                          view: window
                        })
                      );
                    }
                  }}
                >
                  <Info className="h-3 w-3" />
                  <span>View Metadata</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}