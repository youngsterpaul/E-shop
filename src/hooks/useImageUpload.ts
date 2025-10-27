import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProgress {
  index: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  preview: string;
}

export const useImageUpload = () => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Image compression function
  const compressImage = useCallback((file: File, quality: number = 0.8, maxWidth: number = 1920, maxHeight: number = 1080): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original if compression fails
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files) return;

    const newFiles = Array.from(files);
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Show compression progress
    toast({
      title: "Compressing images...",
      description: `Processing ${validFiles.length} image(s)`,
    });

    try {
      const compressedImages: CompressedImage[] = [];
      
      // Compress images concurrently
      await Promise.all(
        validFiles.map(async (file) => {
          const originalSize = file.size;
          const compressedFile = await compressImage(file);
          const compressedSize = compressedFile.size;
          
          // Create preview
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(compressedFile);
          });

          compressedImages.push({
            file: compressedFile,
            originalSize,
            compressedSize,
            preview
          });
        })
      );

      setImages(prev => [...prev, ...compressedImages]);
      
      // Show compression results
      const totalOriginal = compressedImages.reduce((sum, img) => sum + img.originalSize, 0);
      const totalCompressed = compressedImages.reduce((sum, img) => sum + img.compressedSize, 0);
      const savings = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
      
      toast({
        title: "Images compressed successfully",
        description: `Reduced size by ${savings}% (${formatFileSize(totalOriginal)} → ${formatFileSize(totalCompressed)})`,
      });

    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression failed",
        description: "Some images could not be processed",
        variant: "destructive"
      });
    }
  }, [compressImage, toast]);

  // Retry logic with exponential backoff
  const uploadWithRetry = async (file: File, filePath: string, maxRetries: number = 3): Promise<string> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '31536000', // 1 year cache for CDN
            upsert: false
          });

        if (error) throw error;

        // Get CDN-optimized public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath, {
            //transform: {
              //width: 800,
              //height: 600,
              //resize: 'contain',
              // format: 'webp' // Use WebP for better compression
              //format: 'origin' // Use original format as required by Supabase type
            //}
          });

        return publicUrl;

      } catch (error: any) {
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff: wait 2^attempt seconds
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Upload failed');
  };

  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setIsUploading(true);
    
    // Initialize progress tracking
    const initialProgress = images.map((_, index) => ({
      index,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadProgress(initialProgress);

    try {
      // Upload images concurrently with controlled concurrency
      const concurrencyLimit = 3; // Upload max 3 images at once
      const results: string[] = [];
      
      for (let i = 0; i < images.length; i += concurrencyLimit) {
        const batch = images.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (image, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          try {
            // Update progress: uploading
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'uploading', progress: 0 }
                : p
            ));

            // Generate unique filename
            const fileExt = image.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            // Simulate progress updates (since Supabase doesn't provide real progress)
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => prev.map(p => 
                p.index === globalIndex 
                  ? { ...p, progress: Math.min(p.progress + 10, 90) }
                  : p
              ));
            }, 200);

            const publicUrl = await uploadWithRetry(image.file, filePath);
            
            clearInterval(progressInterval);
            
            // Update progress: success
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'success', progress: 100 }
                : p
            ));

            return publicUrl;

          } catch (error: any) {
            // Update progress: error
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'error', progress: 0, error: error.message }
                : p
            ));
            
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches to avoid overwhelming the server
        if (i + concurrencyLimit < images.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setImageUrls(results);
      
      toast({
        title: "Upload completed",
        description: `Successfully uploaded ${results.length} image(s)`,
      });
      
      return results;
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress([]), 2000);
    }
  };
  
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter(p => p.index !== index).map((p, i) => ({ ...p, index: i })));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setImageUrls([]);
    setUploadProgress([]);
  }, []);

  return {
    images,
    imageUrls,
    uploadProgress,
    isUploading,
    handleImageUpload,
    uploadImagesToStorage,
    removeImage,
    clearImages
  };
};

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};