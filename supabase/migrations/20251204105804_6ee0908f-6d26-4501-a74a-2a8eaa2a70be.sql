-- Allow everyone to read the popular_searches setting
CREATE POLICY "Everyone can view popular_searches setting" 
ON public.admin_settings 
FOR SELECT 
USING (setting_key = 'popular_searches');