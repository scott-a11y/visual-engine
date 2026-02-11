'use client';

import { useState, useEffect } from 'react';
import { Hammer, CheckCircle2, XCircle, Database, Copy, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const MIGRATION_SQL = `-- Visual Engine Schema Migration
-- Run this in your Supabase Dashboard > SQL Editor > New Query

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

-- RLS Policies (permissive for development)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_companies ON companies FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_projects ON projects FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN EXECUTE 'CREATE POLICY allow_all_assets ON assets FOR ALL USING (true) WITH CHECK (true)'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Enable Realtime on assets
ALTER PUBLICATION supabase_realtime ADD TABLE assets;`;

export default function SetupPage() {
    const [tables, setTables] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [projectRef, setProjectRef] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/setup');
            const data = await res.json();
            setTables(data.tables || {});
            // Extract project ref from SUPABASE_URL
            setProjectRef('oynlrzbnflqcuvjrwetg');
        } catch (err) {
            console.error('Failed to check setup status:', err);
        } finally {
            setLoading(false);
        }
    };

    const allReady = Object.values(tables).length > 0 && Object.values(tables).every(v => v);

    const handleCopy = () => {
        navigator.clipboard.writeText(MIGRATION_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-800/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        <Database className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Database Setup</h1>
                    <p className="text-white/40">Chad E. Davis Construction — Visual Engine</p>
                </div>

                {/* Status Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-amber-400" />
                        Table Status
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {['companies', 'profiles', 'projects', 'assets'].map((table) => (
                                <div
                                    key={table}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border ${tables[table]
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-red-500/5 border-red-500/20'
                                        }`}
                                >
                                    {tables[table] ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    )}
                                    <div>
                                        <p className="font-mono text-sm font-bold">{table}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                            {tables[table] ? 'Ready' : 'Not created'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {allReady && (
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-4">
                                <CheckCircle2 className="w-4 h-4" />
                                All tables ready!
                            </div>
                            <div className="mt-4">
                                <Link href="/visual-engine">
                                    <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full px-8 h-12 font-bold text-lg group">
                                        Launch Visual Engine
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Migration Instructions */}
                {!allReady && !loading && (
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                        <h2 className="text-lg font-bold mb-4">Run Migration</h2>
                        <p className="text-white/40 text-sm mb-6">
                            Copy the SQL below and run it in your Supabase SQL Editor:
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                            <Button
                                onClick={handleCopy}
                                className={`rounded-full px-6 font-bold ${copied
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy SQL
                                    </>
                                )}
                            </Button>

                            <a
                                href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/10 font-bold">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open SQL Editor
                                </Button>
                            </a>

                            <Button
                                onClick={checkStatus}
                                variant="outline"
                                className="rounded-full px-6 border-white/10 hover:bg-white/10"
                            >
                                Refresh Status
                            </Button>
                        </div>

                        {/* SQL Preview */}
                        <div className="relative">
                            <pre className="bg-black/50 border border-white/5 rounded-2xl p-6 text-xs text-white/60 overflow-auto max-h-[400px] font-mono leading-relaxed">
                                {MIGRATION_SQL}
                            </pre>
                        </div>

                        {/* Steps */}
                        <div className="mt-6 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">Steps</p>
                            <div className="flex items-start gap-3 text-sm text-white/60">
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                Click "Copy SQL" above
                            </div>
                            <div className="flex items-start gap-3 text-sm text-white/60">
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                Click "Open SQL Editor" to go to your Supabase Dashboard
                            </div>
                            <div className="flex items-start gap-3 text-sm text-white/60">
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                Paste the SQL and click "Run"
                            </div>
                            <div className="flex items-start gap-3 text-sm text-white/60">
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                                Come back here and click "Refresh Status"
                            </div>
                        </div>
                    </div>
                )}

                {/* Login Credentials */}
                <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-amber-400" />
                        Demo Login Credentials
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span className="text-white/40 text-sm">Email</span>
                            <code className="text-amber-400 font-mono text-sm">chad@davisconstruction.com</code>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span className="text-white/40 text-sm">Password</span>
                            <code className="text-amber-400 font-mono text-sm">DavisBuilder2026!</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
