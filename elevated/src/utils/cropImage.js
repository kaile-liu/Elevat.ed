export const getCroppedImg = (imageSrc, pixelCrop, fileType = "image/jpeg") => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Canvas is empty");
          // name property is optional, just for convenience
          blob.name = `cropped.${fileType.split("/")[1]}`; 
          const fileUrl = window.URL.createObjectURL(blob);
          resolve({ blob, url: fileUrl });
        },
        fileType, // use dynamic file type
        0.9 // quality for jpeg/webp
      );
    };

    image.onerror = () => reject("Failed to load image");
  });
};
