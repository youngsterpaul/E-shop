import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, X } from 'lucide-react';

interface ProductImageUploadProps {
  images: File[];
  imagePreview: string[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  images,
  imagePreview,
  onImageUpload,
  onRemoveImage
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
          />
          <Label
            htmlFor="images"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-lg font-medium">Click to upload images</p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG or GIF up to 5MB
            </p>
          </Label>
        </div>
        
        {imagePreview.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {imagePreview.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductImageUpload;
