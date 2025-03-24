import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PersonInfoSection } from "@/components/person-info-section";
import { VehicleInfoSection } from "@/components/vehicle-info-section";
import { LocationInfoSection } from "@/components/location-info-section";
import { ImageGallery } from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonInfo, VehicleInfo, ImageInfo, Observation, AdditionalNote, IncidentLocation } from "@/lib/types";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Search, ChevronDown, ChevronUp, Plus, Calendar, Clock, X } from "lucide-react";
import { format } from "date-fns";

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
  const [location, setLocation] = useState<IncidentLocation>({});
  const [notes, setNotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState<AdditionalNote[]>([]);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [additionalNotesExpanded, setAdditionalNotesExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(true);

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
      setLocation(existingObservation.location ?? {});
      setNotes(existingObservation.notes ?? "");
      setAdditionalNotes(existingObservation.additionalNotes ?? []);
      setImages(existingObservation.images ?? []);
    }
  }, [existingObservation]);
  
  // Function to add a new additional note - Optimized with useCallback
  const addAdditionalNote = React.useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentTime = format(new Date(), 'HH:mm');
    const newNote: AdditionalNote = {
      date: today,
      time: currentTime,
      content: '',
      createdAt: new Date().toISOString()
    };
    setAdditionalNotes(prevNotes => [...prevNotes, newNote]);
  }, []);
  
  // Function to update an additional note - Optimized with useCallback
  const updateAdditionalNote = React.useCallback((index: number, field: keyof AdditionalNote, value: string) => {
    setAdditionalNotes(prevNotes => 
      prevNotes.map((note, i) => 
        i === index ? { ...note, [field]: value } : note
      )
    );
  }, []);
  
  // Function to remove an additional note - Optimized with useCallback
  const removeAdditionalNote = React.useCallback((index: number) => {
    setAdditionalNotes(prevNotes => prevNotes.filter((_, i) => i !== index));
  }, []);

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
          location,
          notes,
          additionalNotes,
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
          additionalNotes,
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
          <p className="text-muted-foreground">Loading observation data...</p>
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
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
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
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </button>

          {notesExpanded && (
            <div className="space-y-4">
              <Textarea
                placeholder="Additional notes about this observation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          )}
        </div>
        
        {/* Additional Notes Section */}
        <div className="bg-card rounded-lg p-4 shadow-md border border-border">
          <button
            type="button"
            className="w-full flex justify-between items-center mb-2"
            onClick={() => setAdditionalNotesExpanded(!additionalNotesExpanded)}
          >
            <h2 className="text-md font-medium">Additional Dated Notes</h2>
            {additionalNotesExpanded ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </button>

          {additionalNotesExpanded && (
            <div className="space-y-6">
              {additionalNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional notes added yet. Click the button below to add dated notes.</p>
              ) : (
                additionalNotes.map((note, index) => (
                  <div key={index} className="border border-border rounded-md p-3 space-y-3 bg-background/50">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col space-y-3 w-full">
                        <div className="flex flex-row gap-2 items-center">
                          <div className="flex items-center space-x-2 flex-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date" 
                              value={note.date}
                              onChange={(e) => updateAdditionalNote(index, 'date', e.target.value)}
                              className="px-2 py-1 h-8 text-sm border-input bg-background"
                            />
                          </div>
                          <div className="flex items-center space-x-2 flex-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="time"
                              value={note.time}
                              onChange={(e) => updateAdditionalNote(index, 'time', e.target.value)}
                              className="px-2 py-1 h-8 text-sm border-input bg-background"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeAdditionalNote(index)}
                            className="p-0 h-8 w-8 rounded-full hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Enter details for this date..."
                          value={note.content}
                          onChange={(e) => updateAdditionalNote(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full rounded border-input bg-background text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <Button
                type="button"
                onClick={addAdditionalNote}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-md border border-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add Note for Another Date
              </Button>
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
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors flex-1"
            disabled={isMutating}
          >
            {isMutating ? "Saving..." : isEditMode ? "Update Observation" : "Save Observation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
