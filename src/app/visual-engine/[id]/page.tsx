'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Sparkles,
    Image as ImageIcon,
    Video as VideoIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    ExternalLink,
    Play,
    Plus,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Project, Asset } from '@/lib/types/database';

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null); // 'image' | 'video'

    const fetchProjectData = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) throw new Error('Project not found');
            const projectData = await res.json();
            setProject(projectData.data);

            const assetsRes = await fetch(`/api/assets?projectId=${id}`);
            const assetsData = await assetsRes.json();
            setAssets(assetsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();

        // Initialize Realtime Subscription
        const supabase = createClient();
        const channel = supabase
            .channel(`project-assets-${id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assets',
                    filter: `project_id=eq.${id}`,
                },
                (payload: RealtimePostgresChangesPayload<Asset>) => {
                    console.log('Realtime update received:', payload);

                    if (payload.eventType === 'INSERT') {
                        setAssets(prev => [payload.new as Asset, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setAssets(prev => prev.map(a => a.id === (payload.new as Asset).id ? payload.new as Asset : a));
                    } else if (payload.eventType === 'DELETE') {
                        setAssets(prev => prev.filter(a => a.id !== (payload.old as Asset).id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleGenerate = async (type: 'image' | 'video') => {
        setGenerating(type);
        try {
            const endpoint = type === 'image' ? '/api/generate/image' : '/api/generate/video';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: id,
                    preset: type === 'image' ? 'exterior' : 'neighborhood-reel',
                }),
            });
            if (!res.ok) throw new Error('Generation failed');
            fetchProjectData();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loading size="lg" />
            <p className="text-white/40 animate-pulse">Initializing Command Center...</p>
        </div>
    );

    if (!project) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Project not found</h2>
            <Link href="/visual-engine">
                <Button variant="outline">Back to Projects</Button>
            </Link>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Nav & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/visual-engine">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                {project.status}
                            </span>
                        </div>
                        <p className="text-white/40 flex items-center gap-2">
                            {project.address || 'No address provided'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href={`/visual-engine/${id}/flyer`}>
                        <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/10">
                            View Flyer
                        </Button>
                    </Link>
                    <Button
                        disabled={!!generating}
                        onClick={() => handleGenerate('image')}
                        className="bg-white text-black hover:bg-white/90 rounded-full px-6"
                    >
                        {generating === 'image' ? <Loading size="sm" className="border-black mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        Generate Image
                    </Button>
                    <Button
                        disabled={!!generating}
                        onClick={() => handleGenerate('video')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6"
                    >
                        {generating === 'video' ? <Loading size="sm" className="mr-2" /> : <VideoIcon className="w-4 h-4 mr-2" />}
                        Generate Video
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Visuals Gallery */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold">Asset Gallery</h2>
                        <div className="text-xs text-white/40 flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" />
                            Live sync active
                        </div>
                    </div>

                    {assets.length === 0 ? (
                        <div className="aspect-video rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                            <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                            <p>No visuals generated yet.</p>
                            <p className="text-sm">Click generate to start the engine.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assets.map((asset) => (
                                <div key={asset.id} className="group relative bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden hover:border-white/20 transition-all">
                                    {/* Preview Area */}
                                    <div className="aspect-video bg-neutral-900 relative">
                                        {asset.status === 'complete' ? (
                                            asset.type === 'image' ? (
                                                <img src={asset.url || ''} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-black">
                                                    <Play className="w-12 h-12 text-white/40 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                <Loading />
                                                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{asset.status}</p>
                                            </div>
                                        )}

                                        {/* Overlay Actions */}
                                        {asset.status === 'complete' && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <Button size="icon" className="rounded-full bg-white text-black hover:scale-110 transition-transform">
                                                    <Download className="w-5 h-5" />
                                                </Button>
                                                <Button size="icon" className="rounded-full bg-white/20 backdrop-blur-md text-white hover:scale-110 transition-transform">
                                                    <ExternalLink className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {asset.type === 'image' ? <ImageIcon className="w-4 h-4 text-white/40" /> : <VideoIcon className="w-4 h-4 text-indigo-400" />}
                                                <span className="text-sm font-medium capitalize">{asset.type}</span>
                                            </div>
                                            <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                                {new Date(asset.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/60 line-clamp-2 italic">"{asset.prompt}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 space-y-6">
                        <h3 className="font-bold border-b border-white/5 pb-4">Project Specs</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Style</label>
                                <p className="text-indigo-400 font-medium">{project.style || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Construction Stage</label>
                                <p className="font-medium">{project.stage || 'Internal'}</p>
                            </div>
                            {project.notes && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Team Notes</label>
                                    <p className="text-sm text-white/60 leading-relaxed mt-1">{project.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-3xl p-6">
                        <h3 className="font-bold mb-4">Marketing Tip</h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Exterior drone reels are currently performing 40% better on Instagram for new construction listings.
                            Try generating a "Neighborhood Reel" for this project.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
