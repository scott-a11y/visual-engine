-- Visual Engine RLS Policies

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 1. Profiles Policies
--------------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users -> profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--------------------------------------------------------------------------------
-- 2. Companies Policies
--------------------------------------------------------------------------------

-- Users can view their own company
CREATE POLICY "Users can view own company"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 3. Projects Policies
--------------------------------------------------------------------------------

-- Users can view projects from their own company
CREATE POLICY "Users can view company projects"
ON projects FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Users can insert projects for their own company
CREATE POLICY "Users can insert projects for own company"
ON projects FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ) OR (company_id IS NULL AND user_id = auth.uid())
);

-- Users can update projects for their own company
CREATE POLICY "Users can update company projects"
ON projects FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ) OR user_id = auth.uid()
);

--------------------------------------------------------------------------------
-- 4. Assets Policies
--------------------------------------------------------------------------------

-- Users can view assets for projects they have access to
CREATE POLICY "Users can view project assets"
ON assets FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE 
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR user_id = auth.uid()
  )
);

-- Users can insert assets for projects they have access to
CREATE POLICY "Users can insert project assets"
ON assets FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE 
      company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR user_id = auth.uid()
  )
);

--------------------------------------------------------------------------------
-- 5. Storage Buckets (Logical Policies)
--------------------------------------------------------------------------------

-- Note: These should be applied to storage.objects in the bucket 'marketing-assets'
-- INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-assets', 'marketing-assets', true);

/*
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'marketing-assets');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketing-assets' AND auth.role() = 'authenticated');
*/
