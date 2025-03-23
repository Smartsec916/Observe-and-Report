import React from "react";
import { useLocation } from "wouter";
import { FilePlus, Search } from "lucide-react";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#3A3A3A] h-16 flex items-center justify-around px-4 z-10">
      <button 
        onClick={() => navigate("/input")}
        className={`flex flex-col items-center justify-center w-24 h-full ${location === "/input" ? "text-[#0F52BA]" : "text-[#8A8A8A]"}`}
      >
        <FilePlus className="h-6 w-6" />
        <span className="text-xs mt-1">Input</span>
      </button>
      
      <button 
        onClick={() => navigate("/search")}
        className={`flex flex-col items-center justify-center w-24 h-full ${location === "/search" ? "text-[#0F52BA]" : "text-[#8A8A8A]"}`}
      >
        <Search className="h-6 w-6" />
        <span className="text-xs mt-1">Search</span>
      </button>
    </div>
  );
}