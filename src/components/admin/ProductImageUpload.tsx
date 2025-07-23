import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  preview: string;
}

interface ImageUploadProgress {
  index: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ProductImageUploadProps {
  images: CompressedImage[];
  uploadProgress: ImageUploadProgress[];
  isUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  images,
  uploadProgress,
  isUploading,
  onImageUpload,
  onRemoveImage
}) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Images</span>
          {images.length > 0 && (
            <Badge variant="secondary">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
            disabled={isUploading}
          />
          <Label
            htmlFor="images"
            className={`flex flex-col items-center justify-center cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-lg font-medium">
              {isUploading ? 'Uploading...' : 'Click to upload images'}
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG or GIF up to 10MB (will be compressed)
            </p>
          </Label>
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => {
                const progressInfo = getProgressInfo(index);
                const compressionRatio = ((image.originalSize - image.compressedSize) / image.originalSize * 100).toFixed(1);
                
                return (
                  <div key={index} className="relative border rounded-lg overflow-hidden">
                    {/* Image */}
                    <div className="relative">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Status Overlay */}
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
                      
                      {/* Remove Button */}
                      {!progressInfo?.status || progressInfo.status !== 'uploading' ? (
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          className="absolute top-2 right-2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-1 transition-all"
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    {/* Image Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{image.file.name}</span>
                        {progressInfo && getStatusIcon(progressInfo.status)}
                      </div>
                      
                      {/* File Size Info */}
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

                      {/* Progress Bar */}
                      {progressInfo && progressInfo.status !== 'pending' && (
                        <div className="space-y-1">
                          <Progress 
                            value={progressInfo.progress} 
                            className="h-2"
                          />
                          {progressInfo.status === 'error' && progressInfo.error && (
                            <p className="text-xs text-red-500 truncate">
                              {progressInfo.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

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
          </div>
        )}

        {/* Summary */}
        {images.length > 0 && !isUploading && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-green-800">Compression Summary:</p>
              <p className="text-green-700">
                Total size reduced from {formatFileSize(images.reduce((sum, img) => sum + img.originalSize, 0))} to{' '}
                {formatFileSize(images.reduce((sum, img) => sum + img.compressedSize, 0))}
                {' '}({((images.reduce((sum, img) => sum + img.originalSize, 0) - images.reduce((sum, img) => sum + img.compressedSize, 0)) / images.reduce((sum, img) => sum + img.originalSize, 0) * 100).toFixed(1)}% savings)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductImageUpload;