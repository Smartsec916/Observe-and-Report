import React, { useState } from "react";
import { ImageInfo } from "@shared/schema";
import { X, Info } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";

interface ImageViewerProps {
  image: ImageInfo;
  index: number;
}

/**
 * A standalone image viewer component that displays a single image
 * with optional metadata in a bottom sheet
 */
export function ImageViewer({ image, index }: ImageViewerProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer">
          <img
            src={image.url}
            alt={image.description || `Image ${index + 1}`}
            className="h-full w-full object-cover"
          />
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
          
          <SheetClose className="absolute top-1 right-1 rounded-full h-8 w-8 p-0 bg-black/50 flex items-center justify-center z-50 border-0 hover:bg-black/70">
            <X className="h-4 w-4" />
          </SheetClose>
        </SheetHeader>
        
        {/* Full image view */}
        <div className="relative">
          <img 
            src={image.url} 
            alt={image.description || "Observation image"} 
            className="w-full h-auto object-contain max-h-[55vh]" 
          />
          
          {/* Image description */}
          {image.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-sm">
              {image.description}
            </div>
          )}
        </div>
        
        {/* Metadata section - only shown if there's metadata */}
        {image.metadata && Object.keys(image.metadata).length > 0 && (
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
                  {image.metadata.dateTaken && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-400">Date Taken:</span>
                      <span>{image.metadata.dateTaken}</span>
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
                  
                  {/* Address display (if available) - Added prominently at the top */}
                  {image.metadata.location?.formattedAddress && (
                    <div className="mb-2 pb-2 border-b border-gray-700">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">Address:</span>
                        <span className="text-right text-green-300">{image.metadata.location.formattedAddress}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Street address details */}
                  {!image.metadata.location?.formattedAddress && image.metadata.location && (
                    <>
                      {/* Combine street, city, state, zip into a full address if no formatted address exists */}
                      {((image.metadata.location.streetNumber || image.metadata.location.streetName) || 
                        (image.metadata.location.city || image.metadata.location.state || image.metadata.location.zipCode)) && (
                        <div className="mb-2 pb-2 border-b border-gray-700">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-300">Address:</span>
                            <span className="text-right text-green-300">
                              {[
                                [
                                  image.metadata.location.streetNumber,
                                  image.metadata.location.streetName
                                ].filter(Boolean).join(' '),
                                [
                                  image.metadata.location.city,
                                  image.metadata.location.state,
                                  image.metadata.location.zipCode
                                ].filter(Boolean).join(', ')
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Display sample data warning if present */}
                  {image.metadata.locationNote && (
                    <div className="bg-yellow-900/30 rounded p-1 mb-2 border border-yellow-800">
                      <span className="text-yellow-300 text-[10px]">
                        {image.metadata.locationNote}
                      </span>
                    </div>
                  )}
                  
                  {/* GPS coordinates display (if available) */}
                  {(image.metadata.latitude !== undefined && image.metadata.longitude !== undefined) ? (
                    <div className="flex flex-col mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">GPS:</span>
                        <span className="text-right">{image.metadata.latitude.toFixed(6)}, {image.metadata.longitude.toFixed(6)}</span>
                      </div>
                      <div className="mt-1">
                        <a 
                          href={`https://www.google.com/maps?q=${image.metadata.latitude},${image.metadata.longitude}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 text-[10px] hover:text-blue-300 hover:underline w-full text-center block bg-blue-900/30 rounded p-1 border border-blue-800"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (image.metadata.location?.latitude !== undefined && image.metadata.location?.longitude !== undefined) ? (
                    <div className="flex flex-col mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">GPS:</span>
                        <span className="text-right">{image.metadata.location.latitude.toFixed(6)}, {image.metadata.location.longitude.toFixed(6)}</span>
                      </div>
                      <div className="mt-1">
                        <a 
                          href={`https://www.google.com/maps?q=${image.metadata.location.latitude},${image.metadata.location.longitude}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 text-[10px] hover:text-blue-300 hover:underline w-full text-center block bg-blue-900/30 rounded p-1 border border-blue-800"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  ) : image.metadata.gpsCoordinates ? (
                    <div className="flex flex-col mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-400">GPS:</span>
                        <span className="text-right">{image.metadata.gpsCoordinates}</span>
                      </div>
                      <div className="mt-1">
                        <a 
                          href={`https://www.google.com/maps?q=${image.metadata.gpsCoordinates}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 text-[10px] hover:text-blue-300 hover:underline w-full text-center block bg-blue-900/30 rounded p-1 border border-blue-800"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-400">GPS:</span>
                      <span className="text-right text-gray-500">No GPS data in image</span>
                    </div>
                  )}
                  
                  {/* Show individual location components if they aren't already shown in the formatted address */}
                  {!image.metadata.location?.formattedAddress && image.metadata.location && (
                    <>
                      {/* Street Number and Name display */}
                      {(image.metadata.location.streetNumber || image.metadata.location.streetName) && (
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
                      
                      {/* City/State/Zip display */}
                      {(image.metadata.location.city || image.metadata.location.state || image.metadata.location.zipCode) && (
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
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}