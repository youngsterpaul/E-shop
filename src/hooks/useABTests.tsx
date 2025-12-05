import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  test_type: string;
  status: string;
  variant_a: Record<string, any>;
  variant_b: Record<string, any>;
  traffic_split: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ABTestResult {
  id: string;
  test_id: string;
  variant: 'A' | 'B';
  event_type: string;
  session_id: string | null;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ABTestStats {
  test_id: string;
  variant_a_views: number;
  variant_a_clicks: number;
  variant_a_conversions: number;
  variant_b_views: number;
  variant_b_clicks: number;
  variant_b_conversions: number;
  variant_a_ctr: number;
  variant_b_ctr: number;
  variant_a_conversion_rate: number;
  variant_b_conversion_rate: number;
  winner: 'A' | 'B' | 'tie' | null;
  confidence: number;
}

export const useABTests = () => {
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ABTest[];
    }
  });

  const createTest = useMutation({
    mutationFn: async (test: Partial<ABTest>) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert([test as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('A/B test created successfully');
    },
    onError: () => {
      toast.error('Failed to create A/B test');
    }
  });

  const updateTest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('A/B test updated successfully');
    },
    onError: () => {
      toast.error('Failed to update A/B test');
    }
  });

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ab_tests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('A/B test deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete A/B test');
    }
  });

  return {
    tests,
    isLoading,
    createTest,
    updateTest,
    deleteTest
  };
};

export const useABTestStats = (testId: string) => {
  return useQuery({
    queryKey: ['ab-test-stats', testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_results')
        .select('*')
        .eq('test_id', testId);
      
      if (error) throw error;

      const results = data as ABTestResult[];
      
      // Calculate stats
      const variantAResults = results.filter(r => r.variant === 'A');
      const variantBResults = results.filter(r => r.variant === 'B');

      const stats: ABTestStats = {
        test_id: testId,
        variant_a_views: variantAResults.filter(r => r.event_type === 'view').length,
        variant_a_clicks: variantAResults.filter(r => r.event_type === 'click').length,
        variant_a_conversions: variantAResults.filter(r => r.event_type === 'conversion').length,
        variant_b_views: variantBResults.filter(r => r.event_type === 'view').length,
        variant_b_clicks: variantBResults.filter(r => r.event_type === 'click').length,
        variant_b_conversions: variantBResults.filter(r => r.event_type === 'conversion').length,
        variant_a_ctr: 0,
        variant_b_ctr: 0,
        variant_a_conversion_rate: 0,
        variant_b_conversion_rate: 0,
        winner: null,
        confidence: 0
      };

      // Calculate rates
      if (stats.variant_a_views > 0) {
        stats.variant_a_ctr = (stats.variant_a_clicks / stats.variant_a_views) * 100;
        stats.variant_a_conversion_rate = (stats.variant_a_conversions / stats.variant_a_views) * 100;
      }
      if (stats.variant_b_views > 0) {
        stats.variant_b_ctr = (stats.variant_b_clicks / stats.variant_b_views) * 100;
        stats.variant_b_conversion_rate = (stats.variant_b_conversions / stats.variant_b_views) * 100;
      }

      // Determine winner (simplified - using conversion rate)
      const totalSamples = stats.variant_a_views + stats.variant_b_views;
      if (totalSamples > 100) {
        if (stats.variant_a_conversion_rate > stats.variant_b_conversion_rate * 1.1) {
          stats.winner = 'A';
          stats.confidence = Math.min(95, 50 + (totalSamples / 20));
        } else if (stats.variant_b_conversion_rate > stats.variant_a_conversion_rate * 1.1) {
          stats.winner = 'B';
          stats.confidence = Math.min(95, 50 + (totalSamples / 20));
        } else {
          stats.winner = 'tie';
          stats.confidence = 0;
        }
      }

      return stats;
    },
    enabled: !!testId
  });
};

// Track A/B test event
export const trackABTestEvent = async (
  testId: string,
  variant: 'A' | 'B',
  eventType: 'view' | 'click' | 'conversion',
  sessionId?: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  const { error } = await supabase
    .from('ab_test_results')
    .insert({
      test_id: testId,
      variant,
      event_type: eventType,
      session_id: sessionId || null,
      user_id: userId || null,
      metadata: metadata || {}
    });

  if (error) {
    console.error('Failed to track A/B test event:', error);
  }
};

// Get active test for a specific type
export const useActiveABTest = (testType: string) => {
  return useQuery({
    queryKey: ['active-ab-test', testType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_type', testType)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ABTest | null;
    }
  });
};