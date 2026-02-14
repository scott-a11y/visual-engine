'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Hammer,
    MapPin,
    ExternalLink,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, DEMO_PROJECTS, DEMO_COMPANIES } from '@/lib/demo-data';
import type { Project, Asset, Company } from '@/lib/types/database';
import { Loading } from '@/components/ui/loading';
import { getCompanyBranding } from '@/lib/services/brand-service';

export default function PublicSharePage() {
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [company, setCompany] = useState<Partial<Company> | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPublicData() {
            setLoading(true);

            // Fetch Project & Assets
            if (isDemoMode()) {
                const demoProj = DEMO_PROJECTS.find(p => p.id === id);
                if (demoProj) {
                    setProject(demoProj as any);

                    // Simulate assets
                    setAssets([
                        {
                            id: 'a1',
                            type: 'image',
                            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
                            status: 'complete',
                            prompt: 'Modern architecture',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 'a2',
                            type: 'image',
                            url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
                            status: 'complete',
                            prompt: 'Kitchen sunset',
                            created_at: new Date().toISOString()
                        }
                    ] as any);

                    const comp = DEMO_COMPANIES.find(c => c.id === demoProj.company_id) || DEMO_COMPANIES[0];
                    setCompany(comp);
                }
            } else {
                const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single();
                if (proj) {
                    setProject(proj);
                    const { data: asts } = await supabase.from('assets').select('*').eq('project_id', id).eq('status', 'complete');
                    setAssets(asts || []);

                    const branding = await getCompanyBranding(proj.company_id);
                    setCompany(branding);
                }
            }
            setLoading(false);
        }
        fetchPublicData();
    }, [id, supabase]);

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loading size="lg" />
        </div>
    );

    if (!project) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40">
            Project not found or expired.
        </div>
    );

    const brandColor = company?.primary_color || '#6366f1';
    const brandFont = company?.brand_font || 'modernist';

    // Font family mapping
    const fontClass = {
        'modernist': 'font-sans', // Outfit (default)
        'luxury': 'font-serif',   // Playfair Display
        'industrial': 'font-mono' // Space Mono
    }[brandFont] || 'font-sans';

    // CSS variables for specific font names
    const fontStyles = brandFont === 'luxury'
        ? { fontFamily: 'var(--font-playfair), serif' }
        : brandFont === 'industrial'
            ? { fontFamily: 'var(--font-space-mono), monospace' }
            : { fontFamily: 'var(--font-outfit), sans-serif' };

    return (
        <div
            className={`min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 ${fontClass}`}
            style={fontStyles}
        >
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] opacity-20 blur-[120px] rounded-full" style={{ backgroundColor: brandColor }} />
            </div>

            {/* Public Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-black/20">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: brandColor }}
                        >
                            {company?.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-6 h-6 object-contain" />
                            ) : (
                                <Hammer className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-tight">{company?.name || 'Authorized Builder'}</h2>
                            <p className="text-[10px] uppercase tracking-widest text-white/30">Client Experience Portfolio</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified Build Status: {project.status}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12 relative">
                {/* Project Hero Info */}
                <div className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                                {project.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-white/60">
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {project.address}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Est. Completion: {project.stage || 'Final Polish'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Feature Grid / Gallery */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {assets.map((asset, idx) => (
                            <div
                                key={asset.id}
                                className={`group relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl transition-all hover:border-white/20 ${idx === 0 ? 'md:col-span-2 aspect-[21/9]' : 'aspect-square md:aspect-[4/3]'}`}
                            >
                                <img
                                    src={asset.url || ''}
                                    alt={asset.prompt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    <p className="text-sm font-medium text-white/80">{asset.prompt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Builder Contact Footer */}
                <div className="mt-20 p-12 rounded-[3.5rem] bg-white/5 border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: brandColor }} />
                    <BuildingBadge color={brandColor} />
                    <h3 className="text-2xl font-bold mb-4">Questions about your build?</h3>
                    <p className="text-white/40 max-w-xl mx-auto mb-8">
                        Your vision is our priority. Connect with the {company?.name || 'Builder'} team directly for timeline updates or finish selections.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <a
                            href={`mailto:${company?.contact_email}`}
                            className="px-8 py-4 rounded-2xl bg-white text-black font-bold flex items-center gap-2 hover:bg-white/90 transition-all"
                        >
                            Contact Development Team
                        </a>
                        {company?.website && (
                            <a
                                href={`https://${company.website}`}
                                target="_blank"
                                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
                            >
                                <GlobeIcon />
                                Visit Website
                            </a>
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-12 text-center border-t border-white/5 bg-black/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                    Proprietary Client Portal | Visual Engine Platform
                </p>
            </footer>
        </div>
    );
}

function BuildingBadge({ color }: { color: string }) {
    return (
        <div
            className="w-16 h-16 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: color, boxShadow: `0 0 30px ${color}40` }}
        >
            <Hammer className="w-8 h-8 text-white" />
        </div>
    );
}

function GlobeIcon() {
    return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>;
}
