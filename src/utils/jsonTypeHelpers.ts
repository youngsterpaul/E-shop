
import { Json } from '@/integrations/supabase/types';

export const typeCastToJson = <T extends object>(data: T): Json => {
  return data as unknown as Json;
};
