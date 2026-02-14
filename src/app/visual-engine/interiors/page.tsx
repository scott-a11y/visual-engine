'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Image as ImageIcon,
    Sparkles,
    Home,
    ChefHat,
    BedDouble,
    Bath,
    Armchair,
    Coffee,
    FileSearch,
    Download,
    CheckCircle2,
    RefreshCw,
    Layers,
    Maximize2,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demo-data';
import type { PlanAnalysisResult, RoomAnalysis, ArchitecturalStyle } from '@/lib/types/plan-analysis';

type RoomCategory = 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'dining' | 'office' | 'other';

interface RenderResult {
    roomName: string;
    prompt: string;
    imageUrl: string;
    aiDescription: string | null;
    category: RoomCategory;
}

const CATEGORY_ICONS: Record<RoomCategory, any> = {
    kitchen: ChefHat,
    living: Armchair,
    bedroom: BedDouble,
    bathroom: Bath,
    dining: Coffee,
    office: Layers,
    other: Home,
};

const CATEGORY_COLORS: Record<RoomCategory, string> = {
    kitchen: '#f59e0b',
    living: '#3b82f6',
    bedroom: '#8b5cf6',
    bathroom: '#06b6d4',
    dining: '#f97316',
    office: '#22c55e',
    other: '#94a3b8',
};

function categorizeRoom(name: string): RoomCategory {
    const lower = name.toLowerCase();
    if (/kitchen|pantry/.test(lower)) return 'kitchen';
    if (/great|living|family|den/.test(lower)) return 'living';
    if (/bed|master|primary|suite|guest|bonus/.test(lower)) return 'bedroom';
    if (/bath|powder|shower/.test(lower)) return 'bathroom';
    if (/dining|breakfast|nook/.test(lower)) return 'dining';
    if (/office|study|library/.test(lower)) return 'office';
    return 'other';
}

// Demo plan for instant testing
const DEMO_PLAN: PlanAnalysisResult = {
    documentType: 'floor_plan',
    architecturalStyle: 'modern_farmhouse',
    buildingType: 'single_family',
    stories: 2,
    squareFootage: 3200,
    bedrooms: 4,
    bathrooms: 3.5,
    specialFeatures: ['attached_garage_3_car', 'covered_front_porch', 'rear_deck', 'mudroom', 'walk_in_pantry'],
    materials: ['hardie_board_siding', 'standing_seam_metal_roof', 'natural_stone_veneer', 'engineered_hardwood'],
    roofType: 'gable',
    regionalStyle: { isPNW: true, description: 'Pacific Northwest modern farmhouse' },
    scale: '1/4" = 1\'',
    rooms: [
        { name: 'Great Room', dimensions: '24\' x 18\'', ceilingHeight: 'Vaulted to 18\'', notes: 'Open to kitchen, shiplap accent wall' },
        { name: 'Kitchen', dimensions: '16\' x 14\'', ceilingHeight: '10\'', notes: '42" shaker cabinets, large island' },
        { name: 'Primary Suite', dimensions: '18\' x 16\'', ceilingHeight: '10\'', notes: 'Spa bath, walk-in closet' },
        { name: 'Bedroom 2', dimensions: '14\' x 12\'', ceilingHeight: '9\'', notes: 'Walk-in closet' },
        { name: 'Bedroom 3', dimensions: '13\' x 12\'', ceilingHeight: '9\'', notes: 'Jack & Jill bath' },
        { name: 'Dining Room', dimensions: '14\' x 12\'', ceilingHeight: '10\'', notes: 'Adjacent to kitchen' },
        { name: 'Home Office', dimensions: '12\' x 10\'', ceilingHeight: '9\'', notes: 'Built-in shelving' },
    ],
    doorWindowLocations: '8\' pivot entry door, 16\' rear multi-slide',
    notableDetails: ['Board-and-batten exterior', 'Open riser staircase'],
    writtenNotes: ['All trim: Arctic White'],
    confidence: 92,
};

export default function InteriorsPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const supabase = createClient();

    // State
    const [plan, setPlan] = useState<PlanAnalysisResult | null>(null);
    const [renderings, setRenderings] = useState<Map<string, RenderResult>>(new Map());
    const [generating, setGenerating] = useState<Set<string>>(new Set());
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<RenderResult | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        async function init() {
            const { data: { user: u } } = await supabase.auth.getUser();
            setUser(u);
            if (u) {
                const companyId = u?.user_metadata?.company_id;
                if (isDemoMode()) {
                    setCompany(DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0]);
                } else {
                    const branding = await getCompanyBranding(companyId);
                    setCompany(branding);
                }
            }
        }
        init();
    }, []);

    const brandColor = company?.primary_color || '#f59e0b';

    // Upload and analyze a plan
    const handleFileUpload = async (f: File) => {
        setFile(f);
        setAnalyzing(true);
        setRenderings(new Map());

        try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch('/api/analyze/plan', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.analysis) {
                setPlan(data.analysis);
            }
        } catch { /* ignore */ }
        finally { setAnalyzing(false); }
    };

    // Generate a single room rendering
    const generateRoom = useCallback(async (room: RoomAnalysis) => {
        if (!plan) return;
        setGenerating(prev => new Set(prev).add(room.name));

        try {
            const res = await fetch('/api/generate/interior', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room,
                    style: plan.architecturalStyle || 'modern_farmhouse',
                    totalPlan: plan,
                }),
            });
            const data = await res.json();
            if (data.success && data.rendering) {
                setRenderings(prev => {
                    const next = new Map(prev);
                    next.set(room.name, data.rendering);
                    return next;
                });
            }
        } catch (err) {
            console.error('Rendering failed:', err);
        } finally {
            setGenerating(prev => {
                const next = new Set(prev);
                next.delete(room.name);
                return next;
            });
        }
    }, [plan]);

    // Generate ALL rooms
    const generateAll = async () => {
        if (!plan) return;
        const renderableRooms = plan.rooms.filter(r =>
            !/garage|laundry|mudroom|pantry|closet|utility|storage/i.test(r.name)
        );
        for (const room of renderableRooms) {
            if (!renderings.has(room.name)) {
                await generateRoom(room);
            }
        }
    };

    // Filter rooms suitable for rendering (skip utility rooms)
    const renderableRooms = plan?.rooms.filter(r =>
        !/garage|laundry|mudroom|pantry|closet|utility|storage/i.test(r.name)
    ) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/visual-engine">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ImageIcon className="w-7 h-7" style={{ color: brandColor }} />
                            Interior Studio
                        </h1>
                        <p className="text-white/40 text-sm mt-1">AI-generated photorealistic room renderings from plan data</p>
                    </div>
                </div>
                {plan && (
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={generateAll}
                            className="rounded-full px-6 font-bold text-black"
                            style={{ backgroundColor: brandColor }}
                            disabled={generating.size > 0}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {generating.size > 0 ? `Generating (${generating.size})...` : 'Generate All Rooms'}
                        </Button>
                    </div>
                )}
            </div>

            {!plan ? (
                /* Upload / Load Plan State */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ minHeight: '55vh' }}>
                    {/* Upload Zone */}
                    <label className="relative rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 p-12">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        {analyzing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loading size="lg" />
                                <p className="text-sm text-white/60">Analyzing floor plan...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                                    <FileSearch className="w-8 h-8" style={{ color: brandColor }} />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold mb-1">Upload Floor Plan</p>
                                    <p className="text-sm text-white/40">AI will analyze rooms → generate interior renderings</p>
                                </div>
                            </>
                        )}
                    </label>

                    {/* Info + Demo */}
                    <div className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                                    <Sparkles className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-bold">AI Interior Visualization</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30">
                                        Plan → Rooms → Photorealistic Renderings
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed mb-4">
                                Upload an architectural plan and the AI will identify each room, then generate
                                <strong className="text-white/80"> style-matched interior renderings</strong> with
                                appropriate finishes, furniture, and lighting based on the architectural style.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {(['kitchen', 'living', 'bedroom'] as RoomCategory[]).map(cat => {
                                    const Icon = CATEGORY_ICONS[cat];
                                    return (
                                        <div key={cat} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[cat] }} />
                                            <span className="text-xs capitalize text-white/50">{cat}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            onClick={() => setPlan(DEMO_PLAN)}
                            className="w-full h-14 rounded-2xl font-bold text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Load Demo — PNW Modern Farmhouse (7 Rooms)
                        </Button>
                    </div>
                </div>
            ) : (
                /* Rooms View */
                <div className="space-y-6">
                    {/* Plan Overview Bar */}
                    <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <div>
                                <span className="text-sm font-bold capitalize">
                                    {plan.architecturalStyle?.replace(/_/g, ' ')} ·{' '}
                                    {plan.squareFootage?.toLocaleString()} SF ·{' '}
                                    {plan.stories} Story
                                </span>
                                <span className="text-xs text-white/30 ml-3">
                                    {renderableRooms.length} renderable rooms
                                </span>
                            </div>
                        </div>
                        <Button
                            onClick={() => { setPlan(null); setRenderings(new Map()); }}
                            variant="ghost"
                            size="sm"
                            className="text-white/30 hover:text-white/60"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            New Plan
                        </Button>
                    </div>

                    {/* Room Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {renderableRooms.map((room) => {
                            const category = categorizeRoom(room.name);
                            const Icon = CATEGORY_ICONS[category];
                            const catColor = CATEGORY_COLORS[category];
                            const render = renderings.get(room.name);
                            const isGenerating = generating.has(room.name);

                            return (
                                <div
                                    key={room.name}
                                    className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden group"
                                >
                                    {/* Image area */}
                                    <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                                        {render ? (
                                            <>
                                                <img
                                                    src={render.imageUrl}
                                                    alt={room.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() => setLightboxImage(render)}
                                                        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                                                    >
                                                        <Maximize2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                {/* Category badge */}
                                                <div
                                                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border"
                                                    style={{ borderColor: `${catColor}40`, color: catColor, backgroundColor: `${catColor}15` }}
                                                >
                                                    <Icon className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                                                    {category}
                                                </div>
                                            </>
                                        ) : isGenerating ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                                <Loading size="lg" />
                                                <p className="text-xs text-white/40">Rendering {room.name}...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${catColor}15` }}
                                                >
                                                    <Icon className="w-6 h-6" style={{ color: catColor }} />
                                                </div>
                                                <p className="text-xs text-white/30">Click Generate to render</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-sm">{room.name}</h3>
                                            {room.dimensions && (
                                                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                                                    {room.dimensions}
                                                </span>
                                            )}
                                        </div>

                                        {render?.aiDescription && (
                                            <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
                                                {render.aiDescription}
                                            </p>
                                        )}

                                        {!render?.aiDescription && room.notes && (
                                            <p className="text-xs text-white/30">{room.notes}</p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            {!render ? (
                                                <Button
                                                    onClick={() => generateRoom(room)}
                                                    disabled={isGenerating}
                                                    size="sm"
                                                    className="w-full rounded-xl font-bold text-black text-xs"
                                                    style={{ backgroundColor: brandColor }}
                                                >
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                    Generate Rendering
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={() => generateRoom(room)}
                                                        disabled={isGenerating}
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 rounded-xl border-white/10 text-xs"
                                                    >
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        Regenerate
                                                    </Button>
                                                    <a
                                                        href={render.imageUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                                                    >
                                                        <Download className="w-3.5 h-3.5 text-white/40" />
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="max-w-6xl w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightboxImage.imageUrl}
                            alt={lightboxImage.roomName}
                            className="w-full rounded-3xl shadow-2xl"
                        />
                        <div className="mt-6 px-4">
                            <h2 className="text-xl font-bold mb-2">{lightboxImage.roomName}</h2>
                            {lightboxImage.aiDescription && (
                                <p className="text-sm text-white/50 leading-relaxed max-w-3xl">
                                    {lightboxImage.aiDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
