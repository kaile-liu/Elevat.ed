import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Popup = ({ setIsOpen, children }) => {
  const popupRef = useRef();
  const bgRef = useRef();

  useEffect(() => {
    // Enter animation
    gsap.fromTo(
      bgRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    gsap.fromTo(
      popupRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  const handleClose = () => {
    // Exit animation
    gsap.to(bgRef.current, { opacity: 0, duration: 0.3 });
    gsap.to(popupRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.3,
      ease: 'power3.in',
      onComplete: () => setIsOpen(false),
    });
  };

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15"
    >
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full px-8 py-6 space-y-4 relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Popup;
