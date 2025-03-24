import React from "react";
import { useLocation } from "wouter";
import { FilePlus, Search } from "lucide-react";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around px-4 z-10">
      <button 
        onClick={() => navigate("/input")}
        className={`flex flex-col items-center justify-center w-24 h-full ${location === "/input" ? "text-primary" : "text-muted-foreground"}`}
      >
        <FilePlus className="h-6 w-6" />
        <span className="text-xs mt-1">Input</span>
      </button>
      
      <button 
        onClick={() => navigate("/search")}
        className={`flex flex-col items-center justify-center w-24 h-full ${location === "/search" ? "text-primary" : "text-muted-foreground"}`}
      >
        <Search className="h-6 w-6" />
        <span className="text-xs mt-1">Search</span>
      </button>
    </div>
  );
}