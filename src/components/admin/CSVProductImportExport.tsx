import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Proper CSV parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

// Parse CSV content into rows
function parseCSV(text: string): string[][] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r') i++; // Skip \n after \r
    } else if (char !== '\r') {
      currentLine += char;
    }
  }
  
  // Add last line
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines.map(line => parseCSVLine(line));
}

export function CSVProductImportExport() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<{ inserted: number; updated: number } | null>(null);

  // Export products to CSV
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create CSV content with all product fields
      const headers = [
        'product_id', 'name', 'description', 'price', 'stock', 'categories', 
        'featured', 'rating', 'reviews_count', 'reorder_point', 'low_stock_threshold',
        'is_digital', 'store', 'subcategory_id', 'display_order', 'image_urls',
        'features', 'specification', 'created_at', 'updated_at'
      ];
      
      const csvContent = [
        headers.join(','),
        ...products.map(product => 
          headers.map(header => {
            const value = product[header as keyof typeof product];
            // Handle different value types
            if (value === null || value === undefined) {
              return '';
            }
            if (typeof value === 'object') {
              // Stringify JSON objects/arrays and escape quotes
              const jsonStr = JSON.stringify(value).replace(/"/g, '""');
              return `"${jsonStr}"`;
            }
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
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
    setImportStats(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
      const productsToInsert: any[] = [];
      const productsToUpdate: any[] = [];
      const importErrors: string[] = [];

      // Get existing product IDs to check for duplicates
      const { data: existingProducts } = await supabase
        .from('products')
        .select('product_id');
      
      const existingIds = new Set(existingProducts?.map(p => p.product_id) || []);

      for (let i = 1; i < rows.length; i++) {
        try {
          const values = rows[i];
          const product: any = {};

          headers.forEach((header, index) => {
            let value = values[index] || '';
            
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            // Handle escaped quotes
            value = value.replace(/""/g, '"');
            
            // Type conversions based on field type
            if (['price', 'stock', 'reorder_point', 'low_stock_threshold', 'rating', 'reviews_count', 'display_order', 'subcategory_id'].includes(header)) {
              product[header] = value ? parseFloat(value) : null;
            } else if (['featured', 'is_digital'].includes(header)) {
              product[header] = value?.toLowerCase() === 'true';
            } else if (['image_urls', 'features', 'specification'].includes(header)) {
              // Parse JSON fields
              if (value) {
                try {
                  product[header] = JSON.parse(value);
                } catch {
                  // Try to parse as cleaned string
                  try {
                    product[header] = JSON.parse(value.replace(/""/g, '"'));
                  } catch {
                    product[header] = header === 'image_urls' ? [] : null;
                  }
                }
              } else {
                product[header] = header === 'image_urls' ? [] : null;
              }
            } else if (['created_at', 'updated_at'].includes(header)) {
              // Skip timestamps for imports - let DB handle them
              // Only keep for updates
              if (value && header === 'updated_at') {
                product[header] = new Date().toISOString();
              }
            } else if (header === 'product_id') {
              if (value) product[header] = value;
            } else {
              product[header] = value || null;
            }
          });

          // Validate required fields
          if (!product.name || product.name.trim() === '') {
            importErrors.push(`Line ${i + 1}: Missing required field (name)`);
            continue;
          }
          
          if (product.price === null || product.price === undefined || isNaN(product.price)) {
            importErrors.push(`Line ${i + 1}: Missing or invalid required field (price)`);
            continue;
          }

          // Check if product exists for update or insert
          if (product.product_id && existingIds.has(product.product_id)) {
            // Remove created_at for updates
            delete product.created_at;
            product.updated_at = new Date().toISOString();
            productsToUpdate.push(product);
          } else {
            // Remove product_id for new inserts (let DB generate it)
            delete product.product_id;
            delete product.created_at;
            delete product.updated_at;
            productsToInsert.push(product);
          }
        } catch (error) {
          importErrors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }

        setProgress(((i / (rows.length - 1)) * 50));
      }

      let insertedCount = 0;
      let updatedCount = 0;

      // Insert new products in batches
      if (productsToInsert.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < productsToInsert.length; i += batchSize) {
          const batch = productsToInsert.slice(i, i + batchSize);
          const { error } = await supabase
            .from('products')
            .insert(batch as any[]);

          if (error) {
            importErrors.push(`Insert batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            insertedCount += batch.length;
          }
          
          setProgress(50 + ((i / productsToInsert.length) * 25));
        }
      }

      // Update existing products individually (to avoid conflicts)
      if (productsToUpdate.length > 0) {
        for (let i = 0; i < productsToUpdate.length; i++) {
          const product = productsToUpdate[i];
          const productId = product.product_id;
          delete product.product_id; // Remove from update payload
          
          const { error } = await supabase
            .from('products')
            .update(product)
            .eq('product_id', productId);

          if (error) {
            importErrors.push(`Update product ${productId}: ${error.message}`);
          } else {
            updatedCount++;
          }
          
          setProgress(75 + ((i / productsToUpdate.length) * 25));
        }
      }

      setErrors(importErrors);
      setImportStats({ inserted: insertedCount, updated: updatedCount });
      
      if (importErrors.length === 0) {
        toast.success(`Successfully imported: ${insertedCount} new, ${updatedCount} updated`);
      } else {
        toast.warning(`Imported ${insertedCount} new, ${updatedCount} updated, with ${importErrors.length} errors`);
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
              Upload a CSV file to add new or update existing products
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

        {importStats && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription>
              <p className="font-medium text-green-700 dark:text-green-400">
                Import complete: {importStats.inserted} new products added, {importStats.updated} products updated
              </p>
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
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
            <li>Headers: product_id, name, description, price, stock, categories, featured, etc.</li>
            <li>Required fields: name, price</li>
            <li>Boolean fields (featured, is_digital): 'true' or 'false'</li>
            <li>JSON fields (image_urls, features, specification): valid JSON format</li>
            <li>Use double quotes for values containing commas or quotes</li>
            <li><strong>New products:</strong> Leave product_id empty for auto-generation</li>
            <li><strong>Update existing:</strong> Include product_id to update instead of insert</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
