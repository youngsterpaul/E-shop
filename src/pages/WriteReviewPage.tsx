
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useReviews } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Star, Upload, X, ArrowLeft, Settings } from 'lucide-react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Skeleton } from '@/components/ui/skeleton';

const WriteReviewPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isMobile = isMobileUserAgent();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: product, isLoading } = useProduct(productId || '');
  const { submitReview, uploadReviewMedia } = useReviews();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid file type",
          description: "Only images and videos are allowed",
          variant: "destructive"
        });
        return false;
      }
      
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${isVideo ? '50MB' : '10MB'} limit`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !productId || !product) return;
    
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Please write a comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUploading(true);

      // Upload media files
      const uploadedUrls: string[] = [];
      for (const file of mediaFiles) {
        const url = await uploadReviewMedia(file);
        if (url) uploadedUrls.push(url);
      }

      setIsUploading(false);

      // Submit review
      await submitReview({
        product_id: productId,
        rating,
        comment: comment.trim(),
        media_urls: uploadedUrls
      });

      toast({
        title: "Review submitted successfully",
        description: "Thank you for your feedback!"
      });

          const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    const productSlug = generateSlug(product.name || '');

      navigate(`/products/${productSlug}/${productId}`);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </main>
        
        
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-grow container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button 
            variant="ghost" 
            onClick={() => {
              if (!product) return;
              
              const generateSlug = (name: string) => {
                return name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
              };
              const productSlug = generateSlug((product as any).name);

              navigate(`/products/${productSlug}/${productId}`);
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Button>
        </main>
        
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'Write Review'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className="flex-grow container py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/products/${productId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
              <div className="flex items-center gap-4">
                <img 
                  src={product.image_urls?.[0] || ''} 
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ksh {product.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star 
                        className={`h-8 w-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Review *</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Add Photos or Videos (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Upload images (max 10MB) or videos (max 50MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={mediaFiles.length >= 5}
                    >
                      Choose Files
                    </Button>
                    <p className="text-xs text-gray-400 mt-1">
                      Maximum 5 files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    title="Upload images or videos"
                    placeholder="Choose images or videos to upload"
                  />
                </div>

                {/* Preview selected files */}
                {mediaFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-cover"
                              controls={false}
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/products/${productId}`)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0 || !comment.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    isUploading ? "Uploading..." : "Submitting..."
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WriteReviewPage;
