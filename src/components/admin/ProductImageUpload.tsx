import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Video, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}

interface ImageUploadProgress {
  index: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ExistingImage {
  url: string;
  isExisting: true;
  index: number;
}

interface ProductImageUploadProps {
  images: CompressedImage[];
  videos?: VideoFile[];
  uploadProgress: ImageUploadProgress[];
  isUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo?: (index: number) => void;
  onReorderImages?: (oldIndex: number, newIndex: number) => void;
  onReorderVideos?: (oldIndex: number, newIndex: number) => void;
  onReorderExistingImages?: (newOrder: ExistingImage[]) => void;
  existingImages?: ExistingImage[];
  onRemoveExistingImage?: (index: number) => void;
  isEditMode?: boolean;
}

// Sortable Image Item Component
const SortableImageItem = ({ 
  id, 
  image, 
  index, 
  isEditMode, 
  isUploading, 
  progressInfo, 
  formatFileSize, 
  getStatusIcon, 
  onRemove 
}: {
  id: string;
  image: CompressedImage;
  index: number;
  isEditMode: boolean;
  isUploading: boolean;
  progressInfo?: ImageUploadProgress;
  formatFileSize: (bytes: number) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const compressionRatio = ((image.originalSize - image.compressedSize) / image.originalSize * 100).toFixed(1);

  return (
    <div ref={setNodeRef} style={style} className="relative border rounded-lg overflow-hidden">
      <div className="relative">
        <img
          src={image.preview}
          alt={`New image ${index + 1}`}
          className="w-full h-48 object-cover"
        />
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded p-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        {isEditMode && (
          <div className="absolute top-2 left-10">
            <Badge variant="default" className="bg-green-600 text-white text-xs">
              New
            </Badge>
          </div>
        )}
        
        {progressInfo && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              {getStatusIcon(progressInfo.status)}
              <p className="text-sm mt-1">
                {progressInfo.status === 'uploading' && `${progressInfo.progress}%`}
                {progressInfo.status === 'success' && 'Uploaded'}
                {progressInfo.status === 'error' && 'Failed'}
              </p>
            </div>
          </div>
        )}
        
        {!progressInfo?.status || progressInfo.status !== 'uploading' ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-1 transition-all"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{image.file.name}</span>
          {progressInfo && getStatusIcon(progressInfo.status)}
        </div>
        
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Original:</span>
            <span>{formatFileSize(image.originalSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Compressed:</span>
            <span className="text-green-600">
              {formatFileSize(image.compressedSize)} (-{compressionRatio}%)
            </span>
          </div>
        </div>

        {progressInfo && progressInfo.status !== 'pending' && (
          <div className="space-y-1">
            <Progress value={progressInfo.progress} className="h-2" />
            {progressInfo.status === 'error' && progressInfo.error && (
              <p className="text-xs text-red-500 truncate">{progressInfo.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Sortable Video Item Component
const SortableVideoItem = ({ 
  id, 
  video, 
  index, 
  formatFileSize, 
  onRemove 
}: {
  id: string;
  video: VideoFile;
  index: number;
  formatFileSize: (bytes: number) => string;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative border rounded-lg overflow-hidden">
      <div className="relative">
        <video
          src={video.preview}
          className="w-full h-48 object-cover bg-black"
          controls
          preload="metadata"
        />
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded p-1 cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="absolute top-2 left-10 pointer-events-none z-10">
          <Badge variant="default" className="bg-purple-600 text-white text-xs">
            <Video className="h-3 w-3 mr-1" />
            Video
          </Badge>
        </div>
        
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{video.file.name}</span>
        </div>
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{formatFileSize(video.size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sortable Existing Image Item Component
const SortableExistingImageItem = ({ 
  id, 
  existingImage, 
  onRemove 
}: {
  id: string;
  existingImage: ExistingImage;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative border rounded-lg overflow-hidden">
      <div className="relative">
        <img
          src={existingImage.url}
          alt={`Existing image ${existingImage.index + 1}`}
          className="w-full h-48 object-cover"
        />
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded p-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="absolute top-2 left-10">
          <Badge variant="default" className="bg-blue-600 text-white text-xs">
            Current
          </Badge>
        </div>
        
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="text-xs text-muted-foreground">
          <span className="flex items-center">
            <ImageIcon className="h-3 w-3 mr-1" />
            Existing image
          </span>
        </div>
      </div>
    </div>
  );
};

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  images,
  videos = [],
  uploadProgress,
  isUploading,
  onImageUpload,
  onRemoveImage,
  onRemoveVideo,
  onReorderImages,
  onReorderVideos,
  onReorderExistingImages,
  existingImages = [],
  onRemoveExistingImage,
  isEditMode = false
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressInfo = (index: number) => {
    return uploadProgress.find(p => p.index === index);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleDragEndImages = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `image-${i}` === over.id);
      onReorderImages?.(oldIndex, newIndex);
    }
  };

  const handleDragEndVideos = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = videos.findIndex((_, i) => `video-${i}` === active.id);
      const newIndex = videos.findIndex((_, i) => `video-${i}` === over.id);
      onReorderVideos?.(oldIndex, newIndex);
    }
  };

  const handleDragEndExisting = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = existingImages.findIndex((img) => `existing-${img.index}` === active.id);
      const newIndex = existingImages.findIndex((img) => `existing-${img.index}` === over.id);
      const newOrder = arrayMove(existingImages, oldIndex, newIndex);
      onReorderExistingImages?.(newOrder);
    }
  };

  const totalMedia = existingImages.length + images.length + videos.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Media</span>
          {totalMedia > 0 && (
            <div className="flex items-center space-x-2">
              {isEditMode && existingImages.length > 0 && (
                <Badge variant="outline" className="bg-blue-50">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {existingImages.length} existing
                </Badge>
              )}
              {images.length > 0 && (
                <Badge variant="secondary">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {images.length} images
                </Badge>
              )}
              {videos.length > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Video className="h-3 w-3 mr-1" />
                  {videos.length} videos
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Input
            id="media"
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
            disabled={isUploading}
          />
          <Label
            htmlFor="media"
            className={`flex flex-col items-center justify-center cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-lg font-medium">
              {isUploading ? 'Uploading...' : isEditMode ? 'Add more media' : 'Click to upload images & videos'}
            </p>
            <p className="text-sm text-muted-foreground">
              Images: JPG, PNG, GIF up to 10MB | Videos: MP4, WebM up to 50MB
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag items to reorder • First image will be the main product image
            </p>
          </Label>
        </div>

        {/* Existing Images (Edit Mode) */}
        {isEditMode && existingImages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-600">Current Images (drag to reorder)</h4>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndExisting}
            >
              <SortableContext
                items={existingImages.map(img => `existing-${img.index}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingImages.map((existingImage) => (
                    <SortableExistingImageItem
                      key={`existing-${existingImage.index}`}
                      id={`existing-${existingImage.index}`}
                      existingImage={existingImage}
                      onRemove={() => onRemoveExistingImage?.(existingImage.index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* New Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            {isEditMode && (
              <div className="flex items-center space-x-2">
                <UploadCloud className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-600">New Images to Upload (drag to reorder)</h4>
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndImages}
            >
              <SortableContext
                items={images.map((_, i) => `image-${i}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <SortableImageItem
                      key={`image-${index}`}
                      id={`image-${index}`}
                      image={image}
                      index={index}
                      isEditMode={isEditMode}
                      isUploading={isUploading}
                      progressInfo={getProgressInfo(index)}
                      formatFileSize={formatFileSize}
                      getStatusIcon={getStatusIcon}
                      onRemove={() => onRemoveImage(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Videos Preview */}
        {videos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-600">
                {isEditMode ? 'Videos (drag to reorder)' : 'Videos to Upload (drag to reorder)'}
              </h4>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndVideos}
            >
              <SortableContext
                items={videos.map((_, i) => `video-${i}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video, index) => (
                    <SortableVideoItem
                      key={`video-${index}`}
                      id={`video-${index}`}
                      video={video}
                      index={index}
                      formatFileSize={formatFileSize}
                      onRemove={() => onRemoveVideo?.(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Overall Progress */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Upload Progress</span>
              <span className="text-sm text-muted-foreground">
                {uploadProgress.filter(p => p.status === 'success').length} / {uploadProgress.length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Uploading: {uploadProgress.filter(p => p.status === 'uploading').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Success: {uploadProgress.filter(p => p.status === 'success').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Failed: {uploadProgress.filter(p => p.status === 'error').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Compression Summary for New Images */}
        {images.length > 0 && !isUploading && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-green-800">
                {isEditMode ? 'New Images ' : ''}Compression Summary:
              </p>
              <p className="text-green-700">
                Total size reduced from {formatFileSize(images.reduce((sum, img) => sum + img.originalSize, 0))} to{' '}
                {formatFileSize(images.reduce((sum, img) => sum + img.compressedSize, 0))}
                {' '}({((images.reduce((sum, img) => sum + img.originalSize, 0) - images.reduce((sum, img) => sum + img.compressedSize, 0)) / images.reduce((sum, img) => sum + img.originalSize, 0) * 100).toFixed(1)}% savings)
              </p>
            </div>
          </div>
        )}

        {/* No Media Message */}
        {totalMedia === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No media selected</p>
            <p className="text-sm">Click the upload area above to add product images or videos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductImageUpload;