import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PersonInfoSection } from "@/components/person-info-section";
import { VehicleInfoSection } from "@/components/vehicle-info-section";
import { Button } from "@/components/ui/button";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonInfo, VehicleInfo, Observation } from "@/lib/types";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Search } from "lucide-react";

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
        }),
      });
    },
    onSuccess: () => {
      // Reset form (except date/time) after successful submission
      setPerson({});
      setVehicle({});
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/observations"] });
      
      // Show success toast
      toast({
        title: "Observation saved",
        description: "Your observation has been recorded successfully.",
        variant: "default",
      });
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
        
        {/* Submit and Cancel Buttons */}
        <div className="flex justify-between gap-4 pt-2 pb-4">
          {isEditMode && (
            <Button
              type="button"
              className="bg-[#3A3A3A] hover:bg-[#5A5A5A] text-white font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A5A] focus:ring-opacity-50 transition-colors flex-1"
              onClick={handleCancel}
              disabled={isMutating}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            className="bg-[#0F52BA] hover:bg-[#0A3A8C] text-white font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2979FF] focus:ring-opacity-50 transition-colors flex-1"
            disabled={isMutating}
          >
            {isMutating ? "Saving..." : isEditMode ? "Update Observation" : "Save Observation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
