-- Visual Engine Schema Migration

-- Enums
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('CREATED', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('pending', 'processing', 'complete', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    brand_font TEXT DEFAULT 'modernist', -- 'modernist', 'luxury', 'industrial'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company_id UUID REFERENCES companies(id),
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    status project_status NOT NULL DEFAULT 'CREATED',
    address TEXT,
    style TEXT,
    stage TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: assets
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type asset_type NOT NULL,
    provider TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status asset_status NOT NULL DEFAULT 'pending',
    external_job_id TEXT,
    url TEXT,
    created_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Realtime
-- Note: This is usually done via the Supabase Dashboard, but this command enables it for the assets table.
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
