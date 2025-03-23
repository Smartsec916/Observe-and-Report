import React, { useState } from "react";
import { ImageInfo } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Camera, X, Plus, Upload, Trash2 } from "lucide-react";

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
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Use fetch directly for FormData
      const response = await fetch(`/api/observations/${observationId}/images`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header as browser sets it with boundary for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
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
    const formData = new FormData();
    formData.append('image', file);
    
    // Optional description
    formData.append('description', '');
    
    setIsUploading(true);
    uploadMutation.mutate(formData);
    
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
                </div>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-xl p-1 bg-black">
                <div className="relative">
                  <img 
                    src={selectedImage?.url} 
                    alt={selectedImage?.description || "Observation image"} 
                    className="w-full h-auto object-contain max-h-[80vh]" 
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
                  
                  {selectedImage?.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-sm">
                      {selectedImage.description}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}