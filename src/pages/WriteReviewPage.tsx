import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProduct } from '@/hooks/useProducts';
import { useReviews, UploadProgress } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Star, Upload, X, Camera, CheckCircle, AlertCircle, ImagePlus, Sparkles } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

const ratingLabels = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const WriteReviewPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const existingReview = location.state?.existingReview;

  const isMobile = isMobileUserAgent();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(existingReview?.media_urls || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const { data: product, isLoading } = useProduct(productId || '');
  const { submitReview, uploadMultipleMedia, validateFile } = useReviews();
  const isEditing = !!existingReview;
  const activeRating = hoveredRating || rating;

  useEffect(() => {
    return () => { previewUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  const navigateToProduct = () => {
    if (!product) return navigate('/');
    navigate(`/product/${generateSlug(product.name || '')}/${productId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (mediaFiles.length + files.length > 5) {
      toast({ title: "Too many files", description: `You can only upload up to 5 files.`, variant: "destructive" });
      return;
    }
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    files.forEach(file => {
      if (mediaFiles.some(f => f.name === file.name && f.size === file.size)) {
        toast({ title: "Duplicate file", description: `${file.name} is already selected`, variant: "destructive" });
        return;
      }
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({ title: "Invalid file", description: `${file.name}: ${validation.error}`, variant: "destructive" });
        return;
      }
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });
    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !productId || !product) return;
    if (rating === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    const trimmedComment = comment.trim();
    if (!trimmedComment) { toast({ title: "Please write a comment", variant: "destructive" }); return; }
    if (trimmedComment.length < 10) { toast({ title: "Comment too short", description: "Please write at least 10 characters", variant: "destructive" }); return; }
    if (trimmedComment.length > 500) { toast({ title: "Comment too long", description: "Please keep your review under 500 characters", variant: "destructive" }); return; }

    try {
      setIsSubmitting(true);
      let uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) uploadedUrls = await uploadMultipleMedia(mediaFiles, setUploadProgress);
      const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];
      await submitReview({ product_id: productId, rating, comment: trimmedComment, media_urls: allMediaUrls, review_id: existingReview?.review_id });
      toast({ title: isEditing ? "Review updated successfully" : "Review submitted successfully", description: "Thank you for your feedback!" });
      navigateToProduct();
    } catch (error: any) {
      toast({ title: isEditing ? "Failed to update review" : "Failed to submit review", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUploadProgress([]);
    }
  };

  if (!user) { navigate('/auth/signin'); return null; }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
          <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl">Back to Home</Button>
        </div>
      </div>
    );
  }

  const totalMedia = existingMediaUrls.length + mediaFiles.length;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 lg:px-6 py-6 pb-32 md:pb-10">
        {/* Product Context Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border/60 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm"
        >
          <img
            src={product.image_urls?.[0] || ''}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-xl border border-border/40 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              {isEditing ? 'Editing review for' : 'Reviewing'}
            </p>
            <h3 className="font-semibold text-foreground text-sm leading-snug truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground">Ksh {product.price?.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Rating Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border/60 rounded-2xl p-5 mb-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            How would you rate this product?
          </h2>
          <div className="flex items-center gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={isSubmitting}
                whileTap={{ scale: 0.85 }}
                className="p-1.5 rounded-lg transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                <Star
                  className={`h-9 w-9 transition-all duration-150 ${
                    star <= activeRating
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                      : 'text-muted-foreground/25'
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {activeRating > 0 && (
              <motion.p
                key={activeRating}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-center text-sm font-medium text-foreground mt-3"
              >
                {ratingLabels[activeRating]}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Comment Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl p-5 mb-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Share your experience</h2>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? Would you recommend this product? (min. 10 characters)"
            rows={5}
            className="resize-none rounded-xl border-border/60 bg-muted/30 focus:bg-background focus:border-primary transition-colors text-sm"
            disabled={isSubmitting}
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {comment.trim().length < 10 && comment.length > 0 && (
                <span className="text-amber-500">Minimum 10 characters required</span>
              )}
            </p>
            <p className={`text-xs font-medium ${comment.length > 450 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {comment.length}/500
            </p>
          </div>
        </motion.div>

        {/* Media Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-card border border-border/60 rounded-2xl p-5 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Add photos or videos
            </h2>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {totalMedia}/5
            </span>
          </div>

          {/* Upload area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={totalMedia >= 5 || isSubmitting}
            className="w-full border-2 border-dashed border-border/60 rounded-xl p-6 bg-muted/10 hover:bg-muted/30 hover:border-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Tap to add photos or videos</p>
              <p className="text-xs text-muted-foreground">Images up to 10MB · Videos up to 50MB</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            title="Upload images or videos"
          />

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2 text-muted-foreground text-xs">{progress.fileName}</span>
                    {progress.status === 'completed' && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                    {progress.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                  </div>
                  {progress.status === 'uploading' && <Progress value={progress.progress} className="h-1.5" />}
                  {progress.status === 'error' && <p className="text-xs text-destructive">{progress.error}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Media Previews */}
          {(existingMediaUrls.length > 0 || (mediaFiles.length > 0 && uploadProgress.length === 0)) && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* Existing media */}
              {existingMediaUrls.map((url, index) => (
                <motion.div
                  key={`existing-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border/40">
                    {url.includes('.mp4') || url.includes('video') ? (
                      <video src={url} className="w-full h-full object-cover" controls={false} muted />
                    ) : (
                      <img src={url} alt={`Existing media ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(index)}
                    disabled={isSubmitting}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-destructive/90 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}

              {/* New files */}
              {uploadProgress.length === 0 && mediaFiles.map((file, index) => (
                <motion.div
                  key={`new-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border/40">
                    {file.type.startsWith('image/') ? (
                      <img src={previewUrls[index]} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <video src={previewUrls[index]} className="w-full h-full object-cover" controls={false} muted />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-destructive/90 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Submit Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-3"
        >
          <Button
            variant="outline"
            onClick={navigateToProduct}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl border-border/60 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className="flex-1 h-12 rounded-xl font-semibold text-sm shadow-md"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : isEditing ? 'Update Review' : 'Submit Review'}
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default WriteReviewPage;