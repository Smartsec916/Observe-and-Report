import React from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, navigate] = useLocation();

  // Redirect to input page
  React.useEffect(() => {
    navigate("/input");
  }, [navigate]);

  return (
    <div className="px-4 py-3">
      <p className="text-center text-[#8A8A8A]">Redirecting to Input page...</p>
    </div>
  );
}
