-- Add delivery_fee column to cities and counties for location-based delivery pricing
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.counties ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.cities.delivery_fee IS 'Delivery fee in KES for this city. Takes precedence over county fee.';
COMMENT ON COLUMN public.counties.delivery_fee IS 'Default delivery fee in KES for this county (fallback when city has 0).';