import { useState } from 'react';

export const useImageUpload = () => {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files) {
      const newFiles = Array.from(files);
      setImages(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreview(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImages([]);
    setImagePreview([]);
  };

  return {
    images,
    imagePreview,
    setImagePreview,
    handleImageUpload,
    removeImage,
    clearImages
  };
};
