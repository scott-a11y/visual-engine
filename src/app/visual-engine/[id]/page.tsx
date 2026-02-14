'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PlanUpload from '@/components/plan-upload';
import {
    ArrowLeft,
    Sparkles,
    Image as ImageIcon,
    Video as VideoIcon,
    Clock,
    CheckCircle2,
    Share2,
    Copy,
    AlertCircle,
    Download,
    ExternalLink,
    Play,
    Plus,
    RefreshCw,
    FileUp,
    LayoutGrid,
    X,
    ZoomIn,
    Hammer
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, DEMO_PROJECTS, DEMO_ASSETS, DEMO_COMPANIES } from '@/lib/demo-data';
import { RealtimePostgresChangesPayload, User } from '@supabase/supabase-js';
import type { Project, Asset } from '@/lib/types/database';
import { DEMO_PERSONAS } from '@/lib/demo-data';
import { PersonaCard } from '@/components/persona-card';

export default function ProjectDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'gallery' | 'plans'>('gallery');
    const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Escape key closes lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxAsset(null);
        };
        if (lightboxAsset) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [lightboxAsset]);

    const fetchProjectData = async () => {
        // Get User first
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (isDemoMode()) {
            const demoProject = DEMO_PROJECTS.find(p => p.id === id);

            // Security: Prevent accessing other builders' projects
            if (demoProject && demoProject.user_id !== currentUser?.id) {
                router.push('/visual-engine');
                return;
            }

            setProject(demoProject || DEMO_PROJECTS[0]);
            setAssets(DEMO_ASSETS.filter(a => a.project_id === id || a.project_id === DEMO_PROJECTS[0].id) as any);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) throw new Error('Project not found');
            const projectData = await res.json();

            if (projectData.data.user_id !== currentUser?.id) {
                router.push('/visual-engine');
                return;
            }

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

        if (isDemoMode()) return; // Skip realtime in demo mode

        // Initialize Realtime Subscription
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

        if (isDemoMode()) {
            // Simulate AI generation with realistic timing
            const newAsset = {
                id: `demo-${Date.now()}`,
                project_id: id as string,
                type,
                provider: 'gemini',
                prompt: type === 'image'
                    ? 'Ultra-premium architectural photography, twilight golden hour, cinematic lighting'
                    : 'Cinematic aerial drone flyover, Pacific Northwest luxury neighborhood',
                status: 'processing' as const,
                external_job_id: null,
                url: null,
                created_by: user?.id || 'demo-user-001',
                metadata: {},
                created_at: new Date().toISOString(),
            } as any;

            setAssets(prev => [newAsset, ...prev]);

            // Simulate processing → complete after 3 seconds
            setTimeout(() => {
                setAssets(prev => prev.map(a =>
                    a.id === newAsset.id
                        ? {
                            ...a,
                            status: 'complete',
                            url: type === 'image'
                                ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
                                : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
                        }
                        : a
                ));
                setGenerating(null);
            }, 3000);
            return;
        }

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

    const companyId = user?.user_metadata?.company_id;
    const company = isDemoMode()
        ? DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0]
        : null;

    const brandColor = company?.primary_color || '#f59e0b';

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
                            <span
                                className="px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                                style={{ backgroundColor: `${brandColor}10`, borderColor: `${brandColor}20`, color: brandColor }}
                            >
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
                        variant="outline"
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/share/${id}`);
                            alert('Public share link copied to clipboard!');
                        }}
                        className="rounded-full px-6 border-white/10 hover:bg-white/10"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Experience
                    </Button>
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
                        className="text-white rounded-full px-6"
                        style={{ backgroundColor: brandColor }}
                    >
                        {generating === 'video' ? <Loading size="sm" className="mr-2" /> : <VideoIcon className="w-4 h-4 mr-2" />}
                        Generate Video
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'gallery'
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Asset Gallery
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'plans'
                        ? 'bg-white/10 text-white shadow-lg'
                        : 'text-white/40 hover:text-white/60'
                        }`}
                    style={activeTab === 'plans' ? { backgroundColor: `${brandColor}20`, color: brandColor } : {}}
                >
                    <FileUp className="w-4 h-4" />
                    Upload Plans
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Content */}
                <div className="lg:col-span-3 space-y-6">
                    {activeTab === 'plans' ? (
                        <PlanUpload
                            projectId={id as string}
                            projectName={project.name}
                            onRenderGenerated={(asset) => {
                                setAssets(prev => [asset, ...prev]);
                            }}
                        />
                    ) : (
                        <>
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
                                                            <Play
                                                                className="w-12 h-12 text-white/40 transition-colors"
                                                                style={{ groupHoverColor: brandColor } as any}
                                                            />
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
                                                    <div
                                                        onClick={() => setLightboxAsset(asset)}
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 cursor-pointer"
                                                    >
                                                        <Button size="icon" className="rounded-full bg-white text-black hover:scale-110 transition-transform">
                                                            <ZoomIn className="w-5 h-5" />
                                                        </Button>
                                                        <a
                                                            href={asset.url || ''}
                                                            download
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button size="icon" className="rounded-full bg-white/20 backdrop-blur-md text-white hover:scale-110 transition-transform">
                                                                <Download className="w-5 h-5" />
                                                            </Button>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta info */}
                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {asset.type === 'image' ? <ImageIcon className="w-4 h-4 text-white/40" /> : <VideoIcon className="w-4 h-4" style={{ color: brandColor }} />}
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
                        </>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 space-y-6">
                        <h3 className="font-bold border-b border-white/5 pb-4">Project Specs</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Style</label>
                                <p className="font-medium" style={{ color: brandColor }}>{project.style || 'Not specified'}</p>
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

                    {project.persona_id && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 ml-2">Active Strategy</h3>
                            {DEMO_PERSONAS.find(p => p.id === project.persona_id) ? (
                                <PersonaCard
                                    persona={DEMO_PERSONAS.find(p => p.id === project.persona_id)!}
                                    isSelected={true}
                                />
                            ) : null}
                        </div>
                    )}

                    <div
                        className="border rounded-3xl p-6"
                        style={{ background: `linear-gradient(to bottom right, ${brandColor}20, transparent)`, borderColor: `${brandColor}20` }}
                    >
                        <h3 className="font-bold mb-4">Marketing Tip</h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Exterior drone reels are currently performing 40% better on Instagram for new construction listings.
                            Try generating a "Neighborhood Reel" for this project.
                        </p>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxAsset && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setLightboxAsset(null)}
                    onKeyDown={(e) => e.key === 'Escape' && setLightboxAsset(null)}
                >
                    <div className="absolute top-6 right-6 flex gap-3 z-10">
                        <Button
                            size="icon"
                            className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition"
                            onClick={(e) => {
                                e.stopPropagation();
                                const url = lightboxAsset.url;
                                if (!url) return;
                                fetch(url)
                                    .then(res => res.blob())
                                    .then(blob => {
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `render-${lightboxAsset.id}.${lightboxAsset.type === 'image' ? 'jpg' : 'mp4'}`;
                                        document.body.appendChild(a);
                                        a.click();
                                        setTimeout(() => {
                                            URL.revokeObjectURL(a.href);
                                            document.body.removeChild(a);
                                        }, 500);
                                    })
                                    .catch(() => window.open(url, '_blank'));
                            }}
                        >
                            <Download className="w-5 h-5" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={() => setLightboxAsset(null)}
                            className="rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        {lightboxAsset.type === 'image' ? (
                            <img
                                src={lightboxAsset.url || ''}
                                alt={lightboxAsset.prompt || 'Generated visual'}
                                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                            />
                        ) : (
                            <div className="w-[80vw] max-w-4xl aspect-video bg-black rounded-2xl flex items-center justify-center">
                                <Play className="w-20 h-20 text-white/40" />
                            </div>
                        )}
                        <p className="text-center text-xs text-white/40 mt-4 italic max-w-xl mx-auto">
                            &quot;{lightboxAsset.prompt}&quot;
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
