// Run SQL via Supabase's pg-meta query endpoint
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://oynlrzbnflqcuvjrwetg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bmxyemJuZmxxY3V2anJ3ZXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc3NTM1MiwiZXhwIjoyMDg2MzUxMzUyfQ._Hrla73tdNxKVIQFQW-rVUmOZTzFvncWY-9mgrtUYnU';

// Split into individual statements to run one at a time
const statements = [
    `DO $$ BEGIN CREATE TYPE project_status AS ENUM ('CREATED', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE asset_type AS ENUM ('image', 'video'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE asset_status AS ENUM ('pending', 'processing', 'complete', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `CREATE TABLE IF NOT EXISTS companies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, logo_url TEXT, primary_color TEXT DEFAULT '#6366f1', contact_email TEXT, contact_phone TEXT, website TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name TEXT, company_id UUID REFERENCES companies(id), role TEXT DEFAULT 'member', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL, company_id UUID REFERENCES companies(id), name TEXT NOT NULL, status project_status NOT NULL DEFAULT 'CREATED', address TEXT, style TEXT, stage TEXT, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS assets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, type asset_type NOT NULL, provider TEXT NOT NULL, prompt TEXT NOT NULL, status asset_status NOT NULL DEFAULT 'pending', external_job_id TEXT, url TEXT, created_by UUID NOT NULL, metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL)`,
    `CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql'`,
    `DROP TRIGGER IF EXISTS update_projects_updated_at ON projects`,
    `CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`,
    // RLS - enable with permissive policies
    `ALTER TABLE companies ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE projects ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE assets ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_companies ON companies FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_projects ON projects FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_assets ON assets FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$`,
];

async function run() {
    console.log('🔧 Running migration statements...\n');

    for (let i = 0; i < statements.length; i++) {
        const sql = statements[i];
        const label = sql.substring(0, 60).replace(/\n/g, ' ');

        try {
            const res = await fetch(`${SUPABASE_URL}/pg-meta/default/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'X-Connection-Encrypted': 'true',
                },
                body: JSON.stringify({ query: sql }),
            });

            const body = await res.text();
            if (res.ok) {
                console.log(`  ✅ [${i + 1}/${statements.length}] ${label}...`);
            } else {
                console.log(`  ❌ [${i + 1}/${statements.length}] ${label}...`);
                console.log(`     Status: ${res.status} | ${body.substring(0, 150)}`);
            }
        } catch (err) {
            console.log(`  ❌ [${i + 1}/${statements.length}] ${label}...`);
            console.log(`     Error: ${err.message}`);
        }
    }

    // Verify tables exist now
    console.log('\n📊 Verifying tables...');
    for (const table of ['companies', 'projects', 'assets', 'profiles']) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            }
        });
        console.log(`  ${table}: ${r.status === 200 ? '✅ EXISTS' : '❌ ' + r.status}`);
    }
}

run().catch(console.error);
