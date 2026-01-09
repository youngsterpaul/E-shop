import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIProductHelperProps {
  productName: string;
  category: string;
  description: string;
  type: 'features' | 'specifications';
  onApply: (result: string[] | Record<string, string>) => void;
  existingItems: string[] | Array<{ key: string; value: string }>;
}

export function AIProductHelper({
  productName,
  category,
  description,
  type,
  onApply,
  existingItems,
}: AIProductHelperProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | Record<string, string> | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const generateSuggestions = async () => {
    if (!productName.trim()) {
      toast.error('Please enter a product name first');
      return;
    }

    setLoading(true);
    setSuggestions(null);
    setSelectedItems(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-details', {
        body: { productName, category, description, type },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestions(data.result);
      
      // Pre-select all items
      if (Array.isArray(data.result)) {
        setSelectedItems(new Set(data.result.map((_: string, i: number) => i)));
      } else {
        setSelectedItems(new Set(Object.keys(data.result)));
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (key: string | number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const applySelected = () => {
    if (Array.isArray(suggestions)) {
      const selected = suggestions.filter((_, i) => selectedItems.has(i));
      onApply(selected);
    } else if (suggestions) {
      const selected: Record<string, string> = {};
      Object.entries(suggestions).forEach(([key, value]) => {
        if (selectedItems.has(key)) {
          selected[key] = value;
        }
      });
      onApply(selected);
    }
    setSuggestions(null);
    setSelectedItems(new Set());
    toast.success(`Added ${selectedItems.size} ${type === 'features' ? 'features' : 'specifications'}`);
  };

  const selectAll = () => {
    if (Array.isArray(suggestions)) {
      setSelectedItems(new Set(suggestions.map((_, i) => i)));
    } else if (suggestions) {
      setSelectedItems(new Set(Object.keys(suggestions)));
    }
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateSuggestions}
        disabled={loading}
        className="w-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate {type === 'features' ? 'Features' : 'Specifications'} with AI
          </>
        )}
      </Button>

      {suggestions && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              AI Suggestions (click to select)
            </p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-7 px-2 text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {Array.isArray(suggestions) ? (
              suggestions.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleSelection(index)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    selectedItems.has(index)
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-background hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                    selectedItems.has(index) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selectedItems.has(index) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span>{item}</span>
                </button>
              ))
            ) : (
              Object.entries(suggestions).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSelection(key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    selectedItems.has(key)
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-background hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                    selectedItems.has(key) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}>
                    {selectedItems.has(key) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="font-medium">{key}:</span>
                  <span className="text-muted-foreground">{value}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={applySelected}
              disabled={selectedItems.size === 0}
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Selected ({selectedItems.size})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSuggestions(null);
                setSelectedItems(new Set());
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
