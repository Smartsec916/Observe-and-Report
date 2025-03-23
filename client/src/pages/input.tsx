import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { PersonInfoSection } from "@/components/person-info-section";
import { VehicleInfoSection } from "@/components/vehicle-info-section";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PersonInfo, VehicleInfo } from "@/lib/types";

export default function InputPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for form data
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [person, setPerson] = useState<PersonInfo>({});
  const [vehicle, setVehicle] = useState<VehicleInfo>({});

  // Create mutation for saving observations
  const createObservation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/observations", {
        date,
        time,
        person,
        vehicle,
      });
      return response.json();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createObservation.mutate();
  };

  return (
    <div className="px-4 py-3 h-full">
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
        
        {/* Submit Button - Adding extra bottom padding to avoid navigation overlap */}
        <div className="flex justify-center pt-2 pb-20">
          <Button
            type="submit"
            className="bg-[#0F52BA] hover:bg-[#0A3A8C] text-white font-medium px-6 py-3 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2979FF] focus:ring-opacity-50 transition-colors w-full"
            disabled={createObservation.isPending}
          >
            {createObservation.isPending ? "Saving..." : "Save Observation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
