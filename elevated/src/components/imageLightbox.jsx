import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

const ImageLightbox = ({ images, index, onClose, setIndex }) => {
  if (!images || images.length === 0) return null;

  const prev = () => setIndex((index - 1 + images.length) % images.length);
  const next = () => setIndex((index + 1) % images.length);

  // ✅ Add keyboard support (Esc, ←, →)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index]);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300"
        onClick={onClose}
      >
        <X size={36} />
      </button>

      {/* Image (fullscreen, scale down to fit screen) */}
      <div className="flex items-center justify-center w-full h-full px-4">
        <div className="relative w-full max-w-[90vw] aspect-[16/9] bg-black flex items-center justify-center">
            <img
            src={images[index]}
            alt={`screenshot-${index}`}
            className="object-contain w-full h-full"
            />
        </div>
      </div>

      {/* Left / Right Controls */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-6 text-white hover:text-gray-300"
            onClick={prev}
          >
            <ChevronLeft size={48} />
          </button>
          <button
            className="absolute right-6 text-white hover:text-gray-300"
            onClick={next}
          >
            <ChevronRight size={48} />
          </button>
        </>
      )}

      {/* Footer: Counter + Download */}
      <div className="absolute bottom-6 right-0 w-full flex items-center justify-center gap-6 text-white">
        <p className="text-sm font-medium gap-1 px-3 py-1 shadow-sm bg-white rounded-md">{index + 1} / {images.length}</p>
        <a
          href={images[index]}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1 shadow-sm bg-white rounded-md hover:shadow-lg transition !text-green-full"
        >
          <Download size={18} />
          <span className="text-sm">Download</span>
        </a>
      </div>
    </div>
  );
};

export default ImageLightbox;
