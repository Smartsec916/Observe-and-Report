import React, { useState } from "react";
import { ImageInfo, Observation } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Camera, X, Upload, Trash2, Info } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

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

  // Handle location data copying
  const handleAddLocationInfo = (image: ImageInfo) => {
    if (!image.metadata) return;
    const hasGPS = image.metadata?.gpsCoordinates;
    const hasLocationText = image.metadata?.locationText;
    
    if (!hasGPS && !hasLocationText) return;
    
    // Get current observation
    const currentObservation = queryClient.getQueryData([`/api/observations/${observationId}`]) as Observation | undefined;
    const currentLocation = currentObservation?.location || '';
    
    // Format location information
    const locationInfo: string[] = [];
    
    // Add GPS coordinates if available
    if (hasGPS && image.metadata?.gpsCoordinates) {
      const gpsCoordinates = image.metadata.gpsCoordinates;
      if (!currentLocation.includes(gpsCoordinates)) {
        locationInfo.push(`GPS: ${gpsCoordinates}`);
      }
    }
    
    // Add text location if available
    if (hasLocationText && image.metadata?.locationText) {
      const locationText = image.metadata.locationText;
      if (!currentLocation.includes(locationText)) {
        locationInfo.push(`Location: ${locationText}`);
      }
    }
    
    // If nothing new to add, return
    if (locationInfo.length === 0) {
      toast({
        title: "No new information",
        description: "This location information is already included."
      });
      return;
    }
    
    // Add location information
    const formattedLocationInfo = locationInfo.join('\n');
    const newLocationText = currentLocation.trim() 
      ? currentLocation.includes("Location Information")
        ? `${currentLocation}\n${formattedLocationInfo}`
        : `${currentLocation}\nLocation Information\n${formattedLocationInfo}`
      : `Location Information\n${formattedLocationInfo}`;
    
    // Update the observation
    apiRequest(`/api/observations/${observationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ location: newLocationText }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      toast({
        title: "Location Updated",
        description: "Location information added to observation"
      });
    })
    .catch(() => {
      toast({
        title: "Update Failed",
        description: "Could not add location information",
        variant: "destructive"
      });
    });
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
              <Dialog>
                <DialogTrigger asChild>
                  <div className="aspect-square rounded-md overflow-hidden border border-gray-700 cursor-pointer">
                    <img
                      src={image.url}
                      alt={image.description || `Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-xl p-1 bg-black">
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
                          
                          {/* Add location button */}
                          {!readOnly && image.metadata && (image.metadata.gpsCoordinates || image.metadata.locationText) && (
                            <div className="mt-3 pt-2 border-t border-gray-700">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="text-xs w-full bg-gray-800 border-gray-700 mt-1"
                                onClick={() => handleAddLocationInfo(image)}
                              >
                                Add Location Information
                              </Button>
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs flex items-center justify-center gap-1 py-1 h-6 text-blue-400 w-full"
                  onClick={() => {
                    setShowMetadata(true);
                    // Find and click the dialog trigger for this image
                    document.querySelectorAll('[role="button"]')[index]?.dispatchEvent(
                      new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
                    );
                  }}
                >
                  <Info className="h-3 w-3" />
                  <span>View MetaData</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}