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
        description: "Your image has been successfully attached to the observation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const encodedUrl = encodeURIComponent(imageUrl);
      return await apiRequest(`/api/observations/${observationId}/images/${encodedUrl}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      setSelectedImage(null);
      toast({
        title: "Image removed",
        description: "The image has been removed from this observation.",
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
        description: "Your image has been successfully attached to the observation.",
      });
    } catch (error) {
      console.error("Error in file upload:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
    
    // Reset the file input
    e.target.value = '';
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <Dialog key={image.url}>
              <DialogTrigger asChild>
                <div 
                  className="relative aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.description || `Image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {image.metadata && Object.keys(image.metadata).length > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
                      <Info className="h-3 w-3 text-blue-400" />
                    </div>
                  )}
                </div>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-xl p-1 bg-black">
                <div className="relative">
                  <img 
                    src={selectedImage?.url} 
                    alt={selectedImage?.description || "Observation image"} 
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
                    {selectedImage?.description && (
                      <div className="mb-2">{selectedImage.description}</div>
                    )}
                    
                    {selectedImage && (
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
                              {selectedImage.metadata && Object.keys(selectedImage.metadata).length > 0 ? (
                                <>
                                  {selectedImage.metadata.dateTaken && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Date Taken:</span>
                                      <span>{selectedImage.metadata.dateTaken}</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.gpsCoordinates && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">GPS:</span>
                                      <span className="text-right">{selectedImage.metadata.gpsCoordinates}</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.altitude && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Altitude:</span>
                                      <span>{selectedImage.metadata.altitude} m</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.direction && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Direction:</span>
                                      <span>{selectedImage.metadata.direction}</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.speed && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Speed:</span>
                                      <span>{selectedImage.metadata.speed}</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.deviceInfo && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Device:</span>
                                      <span>{selectedImage.metadata.deviceInfo}</span>
                                    </div>
                                  )}
                                  
                                  {selectedImage.metadata.editHistory && (
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-400">Edit Info:</span>
                                      <span>{selectedImage.metadata.editHistory}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex justify-center items-center h-20">
                                  <span className="text-gray-400">No metadata found in image</span>
                                </div>
                              )}
                              
                              {/* Add a button to copy GPS coordinates to observation location */}
                              {selectedImage.metadata && selectedImage.metadata.gpsCoordinates && !readOnly && (
                                <div className="mt-3 pt-2 border-t border-gray-700">
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="text-xs w-full bg-gray-800 border-gray-700 mt-1"
                                    onClick={() => {
                                      if (selectedImage.metadata?.gpsCoordinates) {
                                        // Get current observation
                                        const currentObservation = queryClient.getQueryData([`/api/observations/${observationId}`]) as Observation | undefined;
                                        const currentLocation = currentObservation?.location || '';
                                        const gpsCoordinates = selectedImage.metadata.gpsCoordinates;
                                        
                                        // Check if the GPS coordinates are already in the location
                                        if (currentLocation.includes(gpsCoordinates)) {
                                          toast({
                                            title: "Location Already Added",
                                            description: "These GPS coordinates are already in the location list.",
                                          });
                                          return;
                                        }
                                        
                                        // Format coordinates for better readability
                                        const formattedGPS = `GPS: ${gpsCoordinates}`;
                                        
                                        // Add GPS coordinates as a new line in the location, under Location Information
                                        const newLocationText = currentLocation.trim() 
                                          ? currentLocation.includes("Location Information")
                                            ? `${currentLocation}\n${formattedGPS}`
                                            : `${currentLocation}\nLocation Information\n${formattedGPS}`
                                          : `Location Information\n${formattedGPS}`;
                                        
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
                                            description: "GPS coordinates added to location information",
                                          });
                                        })
                                        .catch(error => {
                                          console.error("Error updating location:", error);
                                          toast({
                                            title: "Update Failed",
                                            description: error instanceof Error ? error.message : "Could not add GPS coordinates to location",
                                            variant: "destructive",
                                          });
                                        });
                                      }
                                    }}
                                  >
                                    Add GPS to Location
                                  </Button>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}