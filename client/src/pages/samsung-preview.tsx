import React, { useState } from 'react';
import '../samsung-s24-ultra.css';

export default function SamsungPreview() {
  const [showEmulator, setShowEmulator] = useState(true);
  const currentUrl = window.location.origin;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Samsung S24 Ultra Emulator</h1>
      
      <div className="mb-4">
        <button 
          onClick={() => setShowEmulator(!showEmulator)}
          className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md"
        >
          {showEmulator ? "Hide Emulator" : "Show Emulator"}
        </button>
      </div>
      
      {showEmulator && (
        <>
          <div className="samsung-s24-ultra-instructions">
            <p className="mb-2 text-foreground">This is an emulation of how the app would look on a Samsung S24 Ultra device.</p>
            <p className="text-muted-foreground text-sm">The actual app is loaded within the device frame below.</p>
          </div>
          
          <div className="samsung-s24-ultra-container">
            <iframe 
              src={currentUrl} 
              className="samsung-s24-ultra-screen"
              title="Samsung S24 Ultra Preview"
            />
          </div>
        </>
      )}
    </div>
  );
}