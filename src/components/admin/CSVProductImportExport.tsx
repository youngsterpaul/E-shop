import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function CSVProductImportExport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Export products to CSV
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV content
      const headers = ['name', 'description', 'price', 'stock', 'categories', 'featured', 'reorder_point'];
      const csvContent = [
        headers.join(','),
        ...products.map(product => 
          headers.map(header => {
            const value = product[header as keyof typeof product];
            // Handle values that might contain commas
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Products exported successfully');
    },
    onError: (error) => {
      toast.error('Failed to export products');
      console.error(error);
    },
  });

  // Import products from CSV
  const handleImport = async (file: File) => {
    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const products: any[] = [];
      const importErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const product: any = {};

          headers.forEach((header, index) => {
            const value = values[index];
            
            // Type conversions
            if (header === 'price' || header === 'stock' || header === 'reorder_point') {
              product[header] = value ? parseFloat(value) : null;
            } else if (header === 'featured') {
              product[header] = value.toLowerCase() === 'true';
            } else {
              product[header] = value || null;
            }
          });

          // Validate required fields
          if (!product.name || !product.price) {
            importErrors.push(`Line ${i + 1}: Missing required fields (name, price)`);
            continue;
          }

          products.push(product);
        } catch (error) {
          importErrors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }

        setProgress(((i / (lines.length - 1)) * 100));
      }

      if (products.length === 0) {
        throw new Error('No valid products found in CSV');
      }

      // Insert products in batches
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase
          .from('products')
          .insert(batch as any[]);

        if (error) {
          importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        }
      }

      setErrors(importErrors);
      
      if (importErrors.length === 0) {
        toast.success(`Successfully imported ${products.length} products`);
      } else {
        toast.warning(`Imported ${products.length} products with ${importErrors.length} errors`);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV');
      console.error(error);
    } finally {
      setImporting(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      handleImport(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          CSV Import/Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Export Products</h3>
            <p className="text-sm text-muted-foreground">
              Download all products as a CSV file for backup or editing
            </p>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? 'Exporting...' : 'Export to CSV'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Import Products</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to bulk import or update products
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              variant="secondary"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import from CSV'}
            </Button>
          </div>
        </div>

        {importing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Importing products... {progress.toFixed(0)}%
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{errors.length} errors occurred during import:</p>
                <ul className="list-disc list-inside text-sm max-h-40 overflow-y-auto">
                  {errors.slice(0, 10).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 10 && <li>...and {errors.length - 10} more</li>}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside text-xs space-y-1">
            <li>Headers: name, description, price, stock, categories, featured, reorder_point</li>
            <li>Required fields: name, price</li>
            <li>Featured should be 'true' or 'false'</li>
            <li>Use quotes for values containing commas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
