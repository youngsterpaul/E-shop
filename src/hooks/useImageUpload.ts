import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProgress {
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

interface VideoFile {
  file: File;
  size: number;
  preview: string;
  duration?: number;
}

// Alias for backward compatibility
export type ImageUploadProgress = MediaUploadProgress;

export const useImageUpload = () => {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos

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
    
    // Separate images and videos
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];
    
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Image too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive"
          });
        } else {
          imageFiles.push(file);
        }
      } else if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_SIZE) {
          toast({
            title: "Video too large",
            description: `${file.name} exceeds 50MB limit`,
            variant: "destructive"
          });
        } else {
          videoFiles.push(file);
        }
      } else {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image or video`,
          variant: "destructive"
        });
      }
    });

    // Process images
    if (imageFiles.length > 0) {
      toast({
        title: "Compressing images...",
        description: `Processing ${imageFiles.length} image(s)`,
      });

      try {
        const compressedImages: CompressedImage[] = [];
        
        await Promise.all(
          imageFiles.map(async (file) => {
            const originalSize = file.size;
            const compressedFile = await compressImage(file);
            const compressedSize = compressedFile.size;
            
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
        
        const totalOriginal = compressedImages.reduce((sum, img) => sum + img.originalSize, 0);
        const totalCompressed = compressedImages.reduce((sum, img) => sum + img.compressedSize, 0);
        const savings = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
        
        toast({
          title: "Images compressed",
          description: `Reduced by ${savings}%`,
        });
      } catch (error) {
        console.error('Compression error:', error);
        toast({
          title: "Compression failed",
          variant: "destructive"
        });
      }
    }

    // Process videos
    if (videoFiles.length > 0) {
      const newVideos: VideoFile[] = await Promise.all(
        videoFiles.map(async (file) => {
          const preview = URL.createObjectURL(file);
          return {
            file,
            size: file.size,
            preview
          };
        })
      );
      
      setVideos(prev => [...prev, ...newVideos]);
      
      toast({
        title: "Videos added",
        description: `${videoFiles.length} video(s) ready to upload`,
      });
    }
  }, [compressImage, toast, MAX_VIDEO_SIZE]);

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
    const totalMedia = images.length + videos.length;
    if (totalMedia === 0) return [];
    
    setIsUploading(true);
    
    // Initialize progress tracking for both images and videos
    const initialProgress = [
      ...images.map((_, index) => ({
        index,
        progress: 0,
        status: 'pending' as const
      })),
      ...videos.map((_, index) => ({
        index: images.length + index,
        progress: 0,
        status: 'pending' as const
      }))
    ];
    setUploadProgress(initialProgress);

    try {
      const concurrencyLimit = 3;
      const imageResults: string[] = [];
      const videoResults: string[] = [];
      
      // Upload images
      for (let i = 0; i < images.length; i += concurrencyLimit) {
        const batch = images.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (image, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          try {
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'uploading', progress: 0 }
                : p
            ));

            const fileExt = image.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const progressInterval = setInterval(() => {
              setUploadProgress(prev => prev.map(p => 
                p.index === globalIndex 
                  ? { ...p, progress: Math.min(p.progress + 10, 90) }
                  : p
              ));
            }, 200);

            const publicUrl = await uploadWithRetry(image.file, filePath);
            
            clearInterval(progressInterval);
            
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'success', progress: 100 }
                : p
            ));

            return publicUrl;

          } catch (error: any) {
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'error', progress: 0, error: error.message }
                : p
            ));
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        imageResults.push(...batchResults);
        
        if (i + concurrencyLimit < images.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Upload videos
      for (let i = 0; i < videos.length; i += concurrencyLimit) {
        const batch = videos.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (video, batchIndex) => {
          const globalIndex = images.length + i + batchIndex;
          
          try {
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'uploading', progress: 0 }
                : p
            ));

            const fileExt = video.file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `products/videos/${fileName}`;

            const progressInterval = setInterval(() => {
              setUploadProgress(prev => prev.map(p => 
                p.index === globalIndex 
                  ? { ...p, progress: Math.min(p.progress + 5, 90) }
                  : p
              ));
            }, 500);

            const publicUrl = await uploadWithRetry(video.file, filePath);
            
            clearInterval(progressInterval);
            
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'success', progress: 100 }
                : p
            ));

            return publicUrl;

          } catch (error: any) {
            setUploadProgress(prev => prev.map(p => 
              p.index === globalIndex 
                ? { ...p, status: 'error', progress: 0, error: error.message }
                : p
            ));
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        videoResults.push(...batchResults);
        
        if (i + concurrencyLimit < videos.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setImageUrls(imageResults);
      setVideoUrls(videoResults);
      
      toast({
        title: "Upload completed",
        description: `Uploaded ${imageResults.length} image(s) and ${videoResults.length} video(s)`,
      });
      
      return [...imageResults, ...videoResults];
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 2000);
    }
  };
  
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => prev.filter(p => p.index !== index).map((p, i) => ({ ...p, index: i })));
  }, []);

  const removeVideo = useCallback((index: number) => {
    setVideos(prev => {
      const video = prev[index];
      if (video?.preview) {
        URL.revokeObjectURL(video.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reorderImages = useCallback((oldIndex: number, newIndex: number) => {
    setImages(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  }, []);

  const reorderVideos = useCallback((oldIndex: number, newIndex: number) => {
    setVideos(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  }, []);

  const clearImages = useCallback(() => {
    videos.forEach(v => URL.revokeObjectURL(v.preview));
    setImages([]);
    setVideos([]);
    setImageUrls([]);
    setVideoUrls([]);
    setUploadProgress([]);
  }, [videos]);

  return {
    images,
    videos,
    imageUrls,
    videoUrls,
    uploadProgress,
    isUploading,
    handleImageUpload,
    uploadImagesToStorage,
    removeImage,
    removeVideo,
    reorderImages,
    reorderVideos,
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