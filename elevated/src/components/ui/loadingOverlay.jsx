import React, { useState, useEffect } from "react";

const LoadingOverlay = ( { full=true, time=0.4 } ) => {
  const [loading, setLoading] = useState(true);     // controls fade animation
  const [show, setShow] = useState(true);           // controls DOM presence

  useEffect(() => {
    // Simulate load finishing after 500ms
    const timer = setTimeout(() => {
      setLoading(false);
    }, time * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (!loading) {
      // wait fade duration + extra 300ms buffer
      timer = setTimeout(() => setShow(false), 700);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (!show) return null; // completely remove from DOM

  return (
    <div
      className={`${full ? 'fixed inset-0 z-99' : 'absolute w-full h-screen max-h-full top-0 left-0 z-98'} bg-white flex items-center justify-center transition-opacity duration-700
        ${loading ? "opacity-100" : "opacity-0"}`}
    >
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default LoadingOverlay;
