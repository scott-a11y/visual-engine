'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Download,
    Printer,
    Share2,
    ArrowLeft,
    Sparkles,
    MapPin,
    Phone,
    Mail,
    Globe,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { isDemoMode, DEMO_PROJECTS, DEMO_ASSETS } from '@/lib/demo-data';
import type { Project, Asset, Company } from '@/lib/types/database';

export default function ProjectFlyerPage() {
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (isDemoMode()) {
                const demoProject = DEMO_PROJECTS.find(p => p.id === id) || DEMO_PROJECTS[0];
                setProject(demoProject);
                setAssets(DEMO_ASSETS.filter(a => a.status === 'complete') as any);
                setCompany({
                    id: 'demo-company',
                    name: 'Chad E. Davis Construction',
                    logo_url: null,
                    primary_color: '#f59e0b',
                    contact_email: 'chad@davisconstruction.com',
                    contact_phone: '(425) 555-0142',
                    website: 'davisconstruction.com',
                    created_at: new Date().toISOString(),
                } as Company);
                setLoading(false);
                return;
            }
            try {
                const projRes = await fetch(`/api/projects/${id}`);
                const projData = await projRes.json();
                const project = projData.data;
                setProject(project);

                const assetsRes = await fetch(`/api/assets?projectId=${id}`);
                const assets = await assetsRes.json();
                setAssets(Array.isArray(assets) ? assets.filter((a: any) => a.status === 'complete') : []);

                if (project?.company_id) {
                    const compRes = await fetch(`/api/companies`);
                    const comps = await compRes.json();
                    const arr = Array.isArray(comps) ? comps : [];
                    const comp = arr.find((c: any) => c.id === project.company_id);
                    setCompany(comp || null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loading size="lg" /></div>;
    if (!project) return <div className="text-center py-20 text-white">Project not found</div>;

    const featuredImage = assets.find(a => a.type === 'image')?.url || 'https://picsum.photos/seed/placeholder/1920/1080';
    const secondaryImages = assets.filter(a => a.type === 'image').slice(1, 4);

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-indigo-100 pb-20">
            {/* Action Bar - Hidden on Print */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50 print:hidden">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href={`/visual-engine/${id}`} className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">
                        <ArrowLeft className="w-4 h-4" />
                        Command Center
                    </Link>
                    <div className="flex items-center gap-3">
                        <Button onClick={handlePrint} variant="outline" className="rounded-full border-black/10 bg-white hover:bg-black/5 font-bold">
                            <Printer className="w-4 h-4 mr-2" />
                            Print to PDF
                        </Button>
                        <Button className="rounded-full bg-black text-white hover:bg-black/80 shadow-xl font-bold">
                            <Share2 className="w-4 h-4 mr-2" />
                            Copy Share Link
                        </Button>
                    </div>
                </div>
            </div>

            {/* Flyer Container - Optimized for A4 / Letter */}
            <div className="max-w-5xl mx-auto bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] my-12 print:my-0 print:shadow-none min-h-[1414px] flex flex-col overflow-hidden">

                {/* 1. Header Section */}
                <div className="p-12 pb-0 flex items-start justify-between">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full w-fit">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Exclusive Presentation</span>
                        </div>
                        <h1 className="text-6xl font-bold tracking-tighter text-black leading-[0.9]">
                            {project.name}
                        </h1>
                        <p className="text-xl text-black/40 font-medium flex items-center gap-2">
                            <MapPin className="w-5 h-5 opacity-40" />
                            {project.address || 'Address pending'}
                        </p>
                    </div>
                    {company && (
                        <div className="text-right flex flex-col items-end gap-3">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                style={{ backgroundColor: company.primary_color }}
                            >
                                {company.name[0]}
                            </div>
                            <p className="font-bold text-sm tracking-tight">{company.name}</p>
                        </div>
                    )}
                </div>

                {/* 2. Hero Image Section */}
                <div className="px-12 py-10 flex-shrink-0">
                    <div className="aspect-[16/9] w-full rounded-[2rem] overflow-hidden shadow-2xl relative">
                        <img
                            src={featuredImage}
                            alt="Primary View"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* 3. Grid Section */}
                <div className="px-12 grid grid-cols-3 gap-8">
                    {/* Specifications */}
                    <div className="col-span-1 space-y-8 bg-neutral-50 rounded-[2rem] p-8">
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">Property Specifications</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-black/[0.03] pb-2">
                                    <span className="text-sm font-medium opacity-60">Architecture</span>
                                    <span className="text-sm font-bold">{project.style || 'Custom'}</span>
                                </div>
                                <div className="flex justify-between border-b border-black/[0.03] pb-2">
                                    <span className="text-sm font-medium opacity-60">Stage</span>
                                    <span className="text-sm font-bold">{project.stage || 'Completed'}</span>
                                </div>
                                <div className="flex justify-between border-b border-black/[0.03] pb-2">
                                    <span className="text-sm font-medium opacity-60">Category</span>
                                    <span className="text-sm font-bold">Luxury New Build</span>
                                </div>
                            </div>
                        </div>

                        {project.notes && (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-4">Developer Notes</h3>
                                <p className="text-sm leading-relaxed opacity-70">
                                    {project.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Secondary Gallery */}
                    <div className="col-span-2 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            {secondaryImages.length > 0 ? secondaryImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden shadow-lg border border-black/5">
                                    <img src={img.url || ''} className="w-full h-full object-cover" />
                                </div>
                            )) : (
                                <>
                                    <div className="aspect-square rounded-[1.5rem] bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                                        <Building2 className="w-12 h-12 text-indigo-200" />
                                    </div>
                                    <div className="aspect-square rounded-[1.5rem] bg-purple-50 flex items-center justify-center border border-purple-100/50">
                                        <Building2 className="w-12 h-12 text-purple-200" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Footer & Contact - Push to Bottom */}
                <div className="mt-auto p-12 bg-black text-white flex items-end justify-between rounded-t-[3rem]">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">Schedule a Private Showing</h2>
                            <p className="text-white/40 text-sm">Direct inquiries for pre-market availability</p>
                        </div>
                        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-indigo-400">
                            {company?.contact_phone && <span className="flex items-center gap-2"><Phone className="w-3 h-3" /> {company.contact_phone}</span>}
                            {company?.contact_email && <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> {company.contact_email}</span>}
                        </div>
                    </div>
                    {company?.website && (
                        <div className="text-right space-y-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-block text-[10px] font-mono tracking-tighter">
                                HTTPS://{company.website.toUpperCase().replace('HTTPS://', '').replace('HTTP://', '')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Attribution - Hidden on Print */}
            <div className="text-center text-[10px] font-bold uppercase tracking-[0.3em] opacity-20 print:hidden">
                Generated by Visual Engine Luxury Marketing Suite v2.0
            </div>
        </div>
    );
}
