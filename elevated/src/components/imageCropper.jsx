import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { v4 as uuidv4 } from "uuid";

const ImageCropper = ({ onCropComplete }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
      });
    }
  };

  const onCropCompleteCallback = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage); // return to parent
    } catch (e) {
      console.error("Crop failed:", e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {!imageSrc && (
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-green-full text-white px-4 py-2 rounded"
        >
          Upload Image
        </button>
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onSelectFile}
        className="hidden"
      />

      {imageSrc && (
        <div className="relative w-full h-96 mt-4 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
      )}

      {imageSrc && (
        <div className="w-full mt-4 flex flex-col gap-4">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
          />
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCrop}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Apply Crop
            </button>
            <button
              onClick={() => setImageSrc(null)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;