import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PersonInfoSection } from "@/components/person-info-section";
import { VehicleInfoSection } from "@/components/vehicle-info-section";
import { ImageGallery } from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonInfo, VehicleInfo, ImageInfo, Observation } from "@/lib/types";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Search, ChevronDown, ChevronUp } from "lucide-react";

interface InputPageProps {
  id?: string;
}

export default function InputPage({ id }: InputPageProps = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEditMode = Boolean(params.id);
  const observationId = params.id ? parseInt(params.id, 10) : undefined;
  
  // State for form data
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [person, setPerson] = useState<PersonInfo>({});
  const [vehicle, setVehicle] = useState<VehicleInfo>({});
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [notesExpanded, setNotesExpanded] = useState(true);

  // Fetch observation data if in edit mode
  const { data: existingObservation, isLoading } = useQuery({
    queryKey: [`/api/observations/${observationId || 0}`],
    queryFn: getQueryFn<Observation>({ on401: "throw" }),
    enabled: isEditMode,
    staleTime: Infinity
  });

  // Load existing observation data when available
  useEffect(() => {
    if (existingObservation) {
      setDate(existingObservation.date);
      setTime(existingObservation.time);
      setPerson(existingObservation.person ?? {});
      setVehicle(existingObservation.vehicle ?? {});
      setNotes(existingObservation.notes ?? "");
      setImages(existingObservation.images ?? []);
    }
  }, [existingObservation]);

  // Create mutation for saving new observations
  const createObservation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/observations", {
        method: "POST",
        body: JSON.stringify({
          date,
          time,
          person,
          vehicle,
          notes,
        }),
      });
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
      
      // Show success toast with instructions for adding images
      toast({
        title: "Observation saved",
        description: "Your observation has been recorded. You can now add images.",
        variant: "default",
        duration: 5000, // Show toast longer to ensure user notices
      });
      
      // Navigate to edit view to allow adding images
      if (data && data.id) {
        navigate(`/input/${data.id}`);
      }
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Failed to save observation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update mutation for editing existing observations
  const updateObservation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/observations/${observationId}`, {
        method: "PATCH",
        body: JSON.stringify({
          date,
          time,
          person,
          vehicle,
          notes,
        }),
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/observations/${observationId}`] });
      
      // Show success toast
      toast({
        title: "Observation updated",
        description: "Your changes have been saved successfully.",
        variant: "default",
      });
      
      // Navigate back to search page
      navigate("/search");
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Failed to update observation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) {
      updateObservation.mutate();
    } else {
      createObservation.mutate();
    }
  };
  
  const handleCancel = () => {
    navigate("/search");
  };

  // Check if any mutation is in progress
  const isMutating = createObservation.isPending || updateObservation.isPending;
  
  // Show loading state while fetching data in edit mode
  if (isEditMode && isLoading) {
    return (
      <div className="px-4 py-3 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8A8A8A]">Loading observation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 h-full">
      {/* Header with back button in edit mode */}
      {isEditMode && (
        <div className="mb-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2" 
            onClick={handleCancel}
          >
            <ChevronLeft className="h-5 w-5 text-[#8A8A8A]" />
          </Button>
          <h2 className="text-lg font-medium">Edit Observation #{observationId}</h2>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DateTime Section */}
        <DateTimePicker
          date={date}
          time={time}
          onDateChange={setDate}
          onTimeChange={setTime}
        />

        {/* Person Information Section */}
        <PersonInfoSection person={person} onChange={setPerson} />
        
        {/* Vehicle Information Section */}
        <VehicleInfoSection vehicle={vehicle} onChange={setVehicle} />
        
        {/* Notes Section */}
        <div className="bg-card rounded-lg p-4 shadow-md border border-border">
          <button
            type="button"
            className="w-full flex justify-between items-center mb-2"
            onClick={() => setNotesExpanded(!notesExpanded)}
          >
            <h2 className="text-md font-medium">Notes</h2>
            {notesExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#0F52BA]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#0F52BA]" />
            )}
          </button>

          {notesExpanded && (
            <div className="space-y-4">
              <Textarea
                placeholder="Additional notes about this observation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-[#0F52BA] focus:outline-none"
              />
            </div>
          )}
        </div>
        
        {/* Location Information Section removed as requested */}
        
        {/* Image Gallery - Only show if we have an observation ID */}
        {observationId ? (
          <div className="rounded-lg shadow bg-card p-4 space-y-3">
            <h3 className="text-base font-medium">Images</h3>
            <ImageGallery 
              images={images} 
              observationId={observationId} 
            />
          </div>
        ) : (
          <div className="rounded-lg shadow bg-card p-4 space-y-3">
            <h3 className="text-base font-medium">Images</h3>
            <p className="text-sm text-muted-foreground">
              Images can be added after saving the observation.
            </p>
          </div>
        )}
        
        {/* Submit and Cancel Buttons */}
        <div className="flex justify-between gap-4 pt-2 pb-4">
          {isEditMode && (
            <Button
              type="button"
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition-colors flex-1"
              onClick={handleCancel}
              disabled={isMutating}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2979FF] focus:ring-opacity-50 transition-colors flex-1"
            disabled={isMutating}
          >
            {isMutating ? "Saving..." : isEditMode ? "Update Observation" : "Save Observation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
