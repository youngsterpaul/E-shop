-- Insert popular searches setting into admin_settings
INSERT INTO admin_settings (setting_key, setting_value, description)
VALUES (
  'popular_searches',
  '["smartphones", "laptops", "headphones", "cameras", "tablets", "smart watches", "speakers", "accessories"]'::jsonb,
  'Popular search suggestions shown to users when search input is focused'
)
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = now();