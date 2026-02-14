'use client';

import {
    Activity,
    BarChart3,
    Bell,
    Cloud,
    Compass,
    Ghost,
    LayoutDashboard,
    Map,
    TrendingUp,
    Users,
    ChevronRight,
    MapPin,
    Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isDemoMode, DEMO_PROJECTS, DEMO_COMPANIES } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';

export default function UnifiedHubPage() {
    const [user, setUser] = useState<any>(null);
    const [isGhosting, setIsGhosting] = useState(false);
    const [ghostOutput, setGhostOutput] = useState('');
    const [showToast, setShowToast] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getUser();
    }, []);

    const handleGhostDetail = async () => {
        setIsGhosting(true);
        setShowToast(true);

        // Hide toast after 3s
        setTimeout(() => setShowToast(false), 3000);

        // Simulate AI "Ghosting" Delay
        await new Promise(r => setTimeout(r, 1500));

        setGhostOutput(
            "This residence transcends mere shelter, offering a curated living experience where historical architecture meets modern ethereal grace. Every corner has been detailed by our specialized engine to reflect a deep preservationist soul, blending warm twilight glimmers with artisan-crafted textures that feel both timeless and profoundly new."
        );
        setIsGhosting(false);
    };

    const companyId = user?.user_metadata?.company_id;
    const company = isDemoMode()
        ? DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0]
        : null;

    const branding = company?.name || 'Active Workspace';
    const fullName = user?.user_metadata?.full_name || 'Project Lead';
    const brandColor = company?.primary_color || '#f59e0b';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Dashboard Stat HUD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Total Engagement</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold">1,248</h3>
                        <span className="text-emerald-400 text-xs font-bold mb-1">+12%</span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Active Leads</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold">42</h3>
                        <span className="text-amber-400 text-xs font-bold mb-1">9 unread</span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Cloud Capacity</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold">88%</h3>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-[88%]" style={{ backgroundColor: brandColor }} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-sm font-bold uppercase tracking-tighter">Operational</h3>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-amber-400/80 text-sm font-semibold uppercase tracking-[0.15em]">{branding}</p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Unified Marketing Suite</h1>
                    <p className="text-white/40">The command center for your real estate ecosystem.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/visual-engine/new">
                        <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-bold">
                            Quick Launch
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Local Ecosystem */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 2. Regional Pulse Visible */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Map className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-indigo-500/10">
                                <Activity className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Regional Market Pulse</h3>
                                <p className="text-xs text-white/40">Real-time listing & inventory velocity</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { county: 'King', trend: '+4.2%', color: 'text-emerald-400', volume: 'High' },
                                { county: 'Snohomish', trend: '+1.8%', color: 'text-emerald-400', volume: 'Moderate' },
                                { county: 'Pierce', trend: '-0.5%', color: 'text-red-400', volume: 'Steady' }
                            ].map((item) => (
                                <div key={item.county} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1">{item.county} County</p>
                                    <p className="text-lg font-bold">{item.trend}</p>
                                    <p className="text-[10px] font-medium text-white/40">{item.volume} Volume</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Projects Integration */}
                    <div>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Compass className="w-5 h-5 text-amber-500" />
                                Marketing Studio
                            </h3>
                            <Link href="/visual-engine" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                View Gallery
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(DEMO_PROJECTS.filter(p => p.user_id === user?.id).length > 0
                                ? DEMO_PROJECTS.filter(p => p.user_id === user?.id)
                                : DEMO_PROJECTS
                            ).slice(0, 4).map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/visual-engine/${project.id}`}
                                    className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex items-center justify-between group"
                                >
                                    <div>
                                        <h4 className="font-bold group-hover:text-amber-400 transition-colors">{project.name}</h4>
                                        <p className="text-xs text-white/40">{project.address}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI & Leads */}
                <div className="space-y-8">
                    {/* 4. Lead Hub Badge Accuracy */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] p-8 relative">
                        <div className="absolute top-6 right-6">
                            <div className="relative">
                                <Bell className="w-6 h-6 text-amber-400" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white leading-none">
                                    2
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Leads Dashboard</h3>
                        <p className="text-sm text-white/60 mb-6 font-medium">2 new inquiries since your last session.</p>

                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">SR</div>
                                <div>
                                    <p className="text-sm font-bold">Sarah Richards</p>
                                    <p className="text-[10px] text-white/40 italic">Inquiry: Skyline Ridge</p>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full mt-6 bg-amber-500 text-black hover:bg-amber-400 rounded-2xl font-bold h-12">
                            Open Lead Hub
                        </Button>
                    </div>

                    {/* 3. AI Ghost Detailer Logic */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/20">
                                    <Ghost className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold">Buyer's Experience</h3>
                            </div>
                            <div className="w-10 h-5 bg-purple-500/20 rounded-full relative">
                                <div className="absolute inset-y-1 right-1 w-3 h-3 bg-purple-400 rounded-full" />
                            </div>
                        </div>

                        <p className="text-xs text-white/40 leading-relaxed mb-6">
                            Use the <strong className="text-white/60">AI Ghost Detailer</strong> to automatically insert lifestyle elements into your architectural renders.
                        </p>

                        <div className="space-y-4">
                            {/* The Agent's Take Section */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">The Agent's Take</label>
                                <div className="min-h-[120px] p-5 rounded-3xl bg-black/40 border border-white/5 relative group">
                                    {isGhosting ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] uppercase font-bold text-purple-400">Detailing...</p>
                                            </div>
                                        </div>
                                    ) : null}
                                    <textarea
                                        readOnly
                                        value={ghostOutput}
                                        placeholder="Click 'Ghost Detail' to generate a premium property narrative..."
                                        className="w-full bg-transparent border-none resize-none text-sm text-white/80 leading-relaxed focus:outline-none min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleGhostDetail}
                                disabled={isGhosting}
                                variant="outline"
                                className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-xl h-12 font-bold gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                {isGhosting ? 'Engaging Ghost...' : 'Ghost Detail'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full font-bold shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-[100] flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Ghost Detailer Engaged
                </div>
            )}
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    );
}
