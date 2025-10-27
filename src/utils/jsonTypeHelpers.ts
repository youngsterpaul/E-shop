<<<<<<< HEAD

import { Json } from '@/integrations/supabase/types';

export const typeCastToJson = <T extends object>(data: T): Json => {
  return data as unknown as Json;
};
=======

import { Json } from '@/integrations/supabase/types';

export const typeCastToJson = <T extends object>(data: T): Json => {
  return data as unknown as Json;
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
