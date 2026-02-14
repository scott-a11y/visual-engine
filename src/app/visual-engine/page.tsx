'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    MapPin,
    ChevronRight,
    Plus,
    Home,
    Construction,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import type { Project } from '@/lib/types/database';
import { isDemoMode, DEMO_PROJECTS, DEMO_COMPANIES } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function VisualEngineDashboard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchData() {
            // Get User
            if (isDemoMode()) {
                const { data: { user: mockUser } } = await supabase.auth.getUser();
                setUser(mockUser);
            } else {
                const { data: { user: realUser } } = await supabase.auth.getUser();
                setUser(realUser);
            }

            // Get Projects
            if (isDemoMode()) {
                setProjects(DEMO_PROJECTS);
                setLoading(false);
                return;
            }
            try {
                const res = await fetch('/api/projects');
                const data = await res.json();
                setProjects(data.data || []);
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [supabase]);

    const companyId = user?.user_metadata?.company_id;
    const company = isDemoMode()
        ? DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0]
        : null;

    const branding = company?.name || 'Active Workspace';
    const brandColor = company?.primary_color || '#f59e0b';

    const userProjects = isDemoMode()
        ? projects.filter(p => p.user_id === user?.id)
        : projects;

    const filteredProjects = userProjects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStageIcon = (stage?: string | null) => {
        switch (stage?.toLowerCase()) {
            case 'pre-sale': return <Clock className="w-4 h-4 text-amber-400" />;
            case 'under construction': return <Construction className="w-4 h-4 text-blue-400" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            default: return <Home className="w-4 h-4 text-white/40" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
                        <p className="text-white/40 text-sm font-semibold uppercase tracking-[0.15em]">
                            {branding}
                        </p>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        {user?.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Projects` : 'Active Projects'}
                    </h1>
                    <p className="text-white/40">AI-powered visual marketing for every build</p>
                </div>
                <Link href="/visual-engine/new">
                    <Button
                        className="text-black rounded-full px-6 h-12 font-bold shadow-lg"
                        style={{ backgroundColor: brandColor }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Project
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-white/20 group-focus-within:text-white/40 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search by subdivision or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-lg focus:outline-none transition-all"
                    style={{ focusRingColor: `${brandColor}40` } as any}
                />
            </div>

            {/* Projects Grid/List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loading size="lg" />
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/visual-engine/${project.id}`}
                            className="group relative bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-white/20 transition-all overflow-hidden"
                        >
                            {/* Subtle accent hover effect */}
                            <div
                                className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ backgroundColor: `${brandColor}20` }}
                            />

                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="p-3 rounded-2xl bg-white/5 transition-colors"
                                    style={{ groupHoverBackgroundColor: `${brandColor}10` } as any}
                                >
                                    <Home
                                        className="w-6 h-6 text-white/40 transition-colors"
                                        style={{ groupHoverColor: brandColor } as any}
                                    />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                                    {project.style || 'Standard'}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-1 truncate transition-colors" style={{ groupHoverColor: brandColor } as any}>{project.name}</h3>

                            <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{project.address || 'No address provided'}</span>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    {getStageIcon(project.stage)}
                                    <span className="capitalize">{project.stage || 'Internal'}</span>
                                </div>
                                <div
                                    className="flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                                    style={{ color: brandColor }}
                                >
                                    Open visuals
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-amber-500/20 rounded-3xl">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        {searchQuery ? (
                            <Search className="w-8 h-8 text-amber-400/40" />
                        ) : (
                            <Construction className="w-8 h-8 text-amber-400/40" />
                        )}
                    </div>
                    <h3 className="text-lg font-bold mb-1">
                        {searchQuery ? 'No matching projects' : 'Ready to build something stunning'}
                    </h3>
                    <p className="text-white/40 mb-6">
                        {searchQuery
                            ? `No projects found matching "${searchQuery}"`
                            : 'Create your first project to start generating AI visuals'
                        }
                    </p>
                    {!searchQuery && (
                        <Link href="/visual-engine/new">
                            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full px-6 font-bold">
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Project
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
