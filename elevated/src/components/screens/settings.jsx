import React, { useRef, useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropImage';
import Modal from '@mui/material/Modal';
import { supabase } from '../../integrations/supabase/client';

const Settings = ({ user }) => {
  const fileInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    // Upload or update logic goes here
    console.log("Cropped image blob:", croppedImage);
    setShowCropper(false);
    const blob = croppedImage.blob
    const { data, error } = await supabase.storage
        .from('storage') // your bucket name
        .upload(`profile-${user.profile_id}`, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/png',
        });

    if (error) {
        console.error('Upload error:', error.message);
        return null;
    }
  };

  return (
    <div className="flex items-center gap-8 p-8">
      {/* Profile + Button */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-28 h-28">
          <img
            src={user.pfp || "/profile.png"}
            alt="Profile"
            className="rounded-full w-full h-full object-cover shadow-md"
          />
        </div>

        <button
          onClick={triggerFileSelect}
          className="px-4 py-1 bg-green-full text-white rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          Change picture
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />

      {/* Cropper Modal */}
      <Modal open={showCropper} onClose={() => setShowCropper(false)}>
        <div className="fixed inset-0 bg-white p-6 flex flex-col items-center justify-center">
          <div className="relative w-[90vw] max-w-md h-[70vh] bg-gray-100">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <button
            onClick={handleCropConfirm}
            className="mt-4 px-6 py-2 bg-green-full text-white rounded-md"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
