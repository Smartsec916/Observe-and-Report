import React, { useState } from 'react';
import '../samsung-s24-ultra.css';
import { useAuth } from '@/contexts/auth-context';
import { Link } from 'wouter';

export default function SamsungPreview() {
  const [showEmulator, setShowEmulator] = useState(true);
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Samsung S24 Ultra Emulator</h1>
      
      <div className="mb-4 flex gap-2">
        <button 
          onClick={() => setShowEmulator(!showEmulator)}
          className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md"
        >
          {showEmulator ? "Hide Emulator" : "Show Emulator"}
        </button>
        
        <Link href="/">
          <a className="bg-secondary text-secondary-foreground font-medium px-4 py-2 rounded-md inline-block">
            Back to App
          </a>
        </Link>
      </div>
      
      {showEmulator && (
        <>
          <div className="samsung-s24-ultra-instructions">
            <p className="mb-2 text-foreground">This is a visual representation of how the app would look on a Samsung S24 Ultra device.</p>
            <p className="text-muted-foreground text-sm mb-4">
              Screen dimensions: 1440 x 3120 pixels (19.5:9 aspect ratio)
            </p>
            {!isAuthenticated && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md mb-4">
                Note: You are not logged in. Login to see the full application in the emulator.
              </div>
            )}
          </div>
          
          <div className="samsung-s24-ultra-container">
            <div className="samsung-s24-ultra-screen">
              <div className="p-4 h-full overflow-auto">
                <h2 className="text-xl font-semibold mb-3">Samsung S24 Ultra Display</h2>
                <p className="mb-4">
                  When viewing this app on a Samsung S24 Ultra, all UI elements will be optimized for its
                  screen dimensions and aspect ratio. 
                </p>
                
                <div className="mb-4 p-3 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-md text-blue-800 dark:text-blue-200">
                  <strong>Key Display Features:</strong>
                  <ul className="list-disc ml-5 mt-2">
                    <li>Edge-to-edge AMOLED display</li>
                    <li>High pixel density for sharp text and images</li>
                    <li>Tall aspect ratio optimized for scrolling content</li>
                    <li>Dark mode support with true blacks</li>
                  </ul>
                </div>
                
                <p className="mb-4">
                  To experience the real application interface:
                </p>
                
                <ol className="list-decimal ml-5 mb-4">
                  <li className="mb-2">Navigate to the main application (<Link href="/"><a className="text-primary hover:underline">homepage</a></Link>)</li>
                  <li className="mb-2">Log in if not already authenticated</li>
                  <li className="mb-2">Use Samsung's device emulation in the browser dev tools</li>
                  <li>Or access the app directly from a Samsung S24 Ultra device</li>
                </ol>
                
                <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Samsung S24 Ultra Specifications</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="font-medium py-1">Display</td>
                        <td>6.8" Dynamic AMOLED 2X</td>
                      </tr>
                      <tr>
                        <td className="font-medium py-1">Resolution</td>
                        <td>1440 x 3120 pixels</td>
                      </tr>
                      <tr>
                        <td className="font-medium py-1">Aspect Ratio</td>
                        <td>19.5:9</td>
                      </tr>
                      <tr>
                        <td className="font-medium py-1">Pixel Density</td>
                        <td>~501 ppi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}