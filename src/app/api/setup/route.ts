import { NextResponse } from 'next/server';

// This endpoint creates the database schema using the Supabase Management API
// It requires the SUPABASE_SERVICE_ROLE_KEY environment variable
export async function POST() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const statements = [
        // Enums
        `DO $$ BEGIN CREATE TYPE project_status AS ENUM ('CREATED', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
        `DO $$ BEGIN CREATE TYPE asset_type AS ENUM ('image', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
        `DO $$ BEGIN CREATE TYPE asset_status AS ENUM ('pending', 'processing', 'complete', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
        // Tables
        `CREATE TABLE IF NOT EXISTS companies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, logo_url TEXT, primary_color TEXT DEFAULT '#6366f1', contact_email TEXT, contact_phone TEXT, website TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name TEXT, company_id UUID REFERENCES companies(id), role TEXT DEFAULT 'member', created_at TIMESTAMPTZ DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, company_id UUID REFERENCES companies(id), name TEXT NOT NULL, status project_status NOT NULL DEFAULT 'CREATED', address TEXT, style TEXT, stage TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, type asset_type NOT NULL, provider TEXT NOT NULL, prompt TEXT NOT NULL, status asset_status NOT NULL DEFAULT 'pending', external_job_id TEXT, url TEXT, created_by UUID NOT NULL, metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL)`,
        // Trigger
        `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql'`,
        `DROP TRIGGER IF EXISTS update_projects_updated_at ON projects`,
        `CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`,
        // RLS
        `ALTER TABLE companies ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE projects ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE assets ENABLE ROW LEVEL SECURITY`,
        `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_companies ON companies FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
        `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_projects ON projects FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
        `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_assets ON assets FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    ];

    // Extract project ref from URL
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

    const results: { statement: string; status: string; error?: string }[] = [];

    for (const sql of statements) {
        try {
            // Try the Supabase pg endpoint
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ sql_string: sql }),
            });

            if (res.ok) {
                results.push({ statement: sql.substring(0, 60), status: 'success' });
            } else {
                // If rpc doesn't exist, that's expected - we need a different approach
                const body = await res.text();
                results.push({ statement: sql.substring(0, 60), status: 'failed', error: body.substring(0, 100) });
            }
        } catch (err: any) {
            results.push({ statement: sql.substring(0, 60), status: 'error', error: err.message });
        }
    }

    return NextResponse.json({ results, projectRef });
}

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ configured: false });
    }

    // Check which tables exist
    const headers = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` };
    const tables: Record<string, boolean> = {};

    for (const table of ['companies', 'projects', 'assets', 'profiles']) {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=0`, { headers });
        tables[table] = res.status === 200;
    }

    return NextResponse.json({ configured: true, tables });
}
