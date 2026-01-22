import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useReviews, UploadProgress } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Star, Upload, X, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const WriteReviewPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get existing review from location state
  const location = useLocation();
  const existingReview = location.state?.existingReview;
  
  const isMobile = isMobileUserAgent();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(existingReview?.media_urls || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const { data: product, isLoading } = useProduct(productId || '');
  const { submitReview, uploadMultipleMedia, validateFile } = useReviews();
  
  const isEditing = !!existingReview;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check if adding these files would exceed the limit
    if (mediaFiles.length + files.length > 5) {
      toast({
        title: "Too many files",
        description: `You can only upload up to 5 files. Currently selected: ${mediaFiles.length}`,
        variant: "destructive"
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach(file => {
      // Check for duplicates
      const isDuplicate = mediaFiles.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        toast({
          title: "Duplicate file",
          description: `${file.name} is already selected`,
          variant: "destructive"
        });
        return;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
        return;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
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

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      toast({
        title: "Please write a comment",
        variant: "destructive"
      });
      return;
    }

    if (trimmedComment.length < 10) {
      toast({
        title: "Comment too short",
        description: "Please write at least 10 characters",
        variant: "destructive"
      });
      return;
    }

    if (trimmedComment.length > 500) {
      toast({
        title: "Comment too long",
        description: "Please keep your review under 500 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload new media files with progress tracking
      let uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        uploadedUrls = await uploadMultipleMedia(mediaFiles, setUploadProgress);
      }

      // Combine existing media URLs with newly uploaded ones
      const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];

      // Submit review (will update if existingReview exists)
      await submitReview({
        product_id: productId,
        rating,
        comment: trimmedComment,
        media_urls: allMediaUrls,
        review_id: existingReview?.review_id // Pass review_id for updates
      });

      toast({
        title: isEditing ? "Review updated successfully" : "Review submitted successfully",
        description: "Thank you for your feedback!"
      });

      const generateSlug = (name: string) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      };

      const productSlug = generateSlug(product.name || '');
      navigate(`/product/${productSlug}/${productId}`);
      
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: isEditing ? "Failed to update review" : "Failed to submit review",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress([]);
    }
  };

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>     
        <main className="flex-grow max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
          <div className="mb-6">
            <Skeleton className="h-10 w-40" />
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Skeleton className="h-5 w-16 mb-2" />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Skeleton key={star} className="h-8 w-8 rounded" />
                    ))}
                  </div>
                </div>
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max min-w-[1200px]' : ''}`}>
        <main className="flex-grow max-w-[1400px] mx-auto px-4 lg:px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </main>      
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`flex-grow max-w-[1400px] mx-auto px-4 lg:px-6 py-8`}>
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              const generateSlug = (name: string) => {
                return name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
              };
              const productSlug = generateSlug(product.name || '');
              navigate(`/product/${productSlug}/${productId}`);
            }}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl text-foreground">{isEditing ? 'Edit Your Review' : 'Write a Review'}</CardTitle>
              <div className="flex items-center gap-4 mt-4">
                <img 
                  src={product.image_urls?.[0] || ''} 
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-xl border border-border/50"
                />
                <div>
                  <h3 className="font-medium text-foreground">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ksh {product.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                      disabled={isSubmitting}
                    >
                      <Star 
                        className={`h-8 w-8 transition-colors ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Your Review *</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product... (minimum 10 characters)"
                  rows={5}
                  className="resize-none rounded-xl border-border focus:border-primary"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {comment.length}/500 characters {comment.trim().length < 10 && comment.length > 0 && '(minimum 10)'}
                </p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Add Photos or Videos (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload images (max 10MB) or videos (max 50MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={mediaFiles.length >= 5 || isSubmitting}
                      className="rounded-xl"
                    >
                      Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {mediaFiles.length}/5 files selected
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
                  />
                </div>

                {/* Upload Progress */}
                {uploadProgress.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Upload Progress</h4>
                    {uploadProgress.map((progress, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-2 text-muted-foreground">{progress.fileName}</span>
                          {progress.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                          {progress.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        {progress.status === 'uploading' && (
                          <Progress value={progress.progress} className="h-2" />
                        )}
                        {progress.status === 'error' && (
                          <p className="text-xs text-destructive">{progress.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview existing media */}
                {existingMediaUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Existing Media</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {existingMediaUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border/50">
                            {url.includes('.mp4') || url.includes('video') ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                controls={false}
                                muted
                              />
                            ) : (
                              <img
                                src={url}
                                alt={`Existing media ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingMedia(index)}
                            disabled={isSubmitting}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 disabled:opacity-50 shadow-md"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview selected files */}
                {mediaFiles.length > 0 && uploadProgress.length === 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border/50">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={previewUrls[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={previewUrls[index]}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 disabled:opacity-50 shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const generateSlug = (name: string) => {
                      return name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                    };
                    const productSlug = generateSlug(product.name || '');
                    navigate(`/product/${productSlug}/${productId}`);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                  className="flex-1 h-12 rounded-xl font-semibold"
                >
                  {isSubmitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
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