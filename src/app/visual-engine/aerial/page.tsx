'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Plane,
    Sparkles,
    Sun,
    CloudSun,
    Sunrise,
    TreePine,
    Flower2,
    Leaf,
    Snowflake,
    Camera,
    ArrowUpRight,
    Download,
    RefreshCw,
    CheckCircle2,
    X,
    Maximize2,
    FileSearch,
    Upload,
    Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demo-data';
import type { PlanAnalysisResult } from '@/lib/types/plan-analysis';

type AerialViewAngle = 'front_left' | 'front_right' | 'rear_left' | 'rear_right' | 'direct_overhead';
type Season = 'spring' | 'summer' | 'fall' | 'winter';
type TimeOfDay = 'morning' | 'afternoon' | 'golden_hour';

interface AerialRenderResult {
    viewAngle: AerialViewAngle;
    season: Season;
    prompt: string;
    imageUrl: string;
    aiDescription: string | null;
}

// Demo plan
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
        { name: 'Great Room', dimensions: '24\' x 18\'', ceilingHeight: 'Vaulted to 18\'', notes: null },
        { name: 'Kitchen', dimensions: '16\' x 14\'', ceilingHeight: '10\'', notes: null },
        { name: 'Primary Suite', dimensions: '18\' x 16\'', ceilingHeight: '10\'', notes: null },
        { name: 'Garage', dimensions: '34\' x 24\'', ceilingHeight: '10\'', notes: '3-car' },
    ],
    doorWindowLocations: '8\' pivot entry door',
    notableDetails: ['Board-and-batten exterior', 'Standing seam metal roof'],
    writtenNotes: [],
    confidence: 92,
};

const VIEW_ANGLES: { id: AerialViewAngle; label: string; desc: string }[] = [
    { id: 'front_left', label: 'Front Left', desc: 'Primary facade + left side' },
    { id: 'front_right', label: 'Front Right', desc: 'Primary facade + right side' },
    { id: 'rear_left', label: 'Rear Left', desc: 'Backyard + left side' },
    { id: 'rear_right', label: 'Rear Right', desc: 'Backyard + right side' },
    { id: 'direct_overhead', label: 'Overhead', desc: 'Bird\'s-eye site plan' },
];

const SEASONS: { id: Season; label: string; icon: any; color: string }[] = [
    { id: 'spring', label: 'Spring', icon: Flower2, color: '#22c55e' },
    { id: 'summer', label: 'Summer', icon: Sun, color: '#f59e0b' },
    { id: 'fall', label: 'Fall', icon: Leaf, color: '#f97316' },
    { id: 'winter', label: 'Winter', icon: Snowflake, color: '#06b6d4' },
];

const TIMES: { id: TimeOfDay; label: string; icon: any }[] = [
    { id: 'morning', label: 'Morning', icon: Sunrise },
    { id: 'afternoon', label: 'Afternoon', icon: Sun },
    { id: 'golden_hour', label: 'Golden Hour', icon: CloudSun },
];

export default function AerialStudioPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const supabase = createClient();

    // State
    const [plan, setPlan] = useState<PlanAnalysisResult | null>(null);
    const [selectedAngle, setSelectedAngle] = useState<AerialViewAngle>('front_left');
    const [selectedSeason, setSelectedSeason] = useState<Season>('summer');
    const [selectedTime, setSelectedTime] = useState<TimeOfDay>('golden_hour');
    const [renderings, setRenderings] = useState<AerialRenderResult[]>([]);
    const [generating, setGenerating] = useState(false);
    const [lightbox, setLightbox] = useState<AerialRenderResult | null>(null);
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

    const handleFileUpload = async (f: File) => {
        setAnalyzing(true);
        setRenderings([]);
        try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch('/api/analyze/plan', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.analysis) setPlan(data.analysis);
        } catch { /* ignore */ }
        finally { setAnalyzing(false); }
    };

    const generateRendering = async () => {
        if (!plan) return;
        setGenerating(true);

        try {
            const res = await fetch('/api/generate/aerial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    viewAngle: selectedAngle,
                    season: selectedSeason,
                    timeOfDay: selectedTime,
                }),
            });
            const data = await res.json();
            if (data.success && data.rendering) {
                setRenderings(prev => [data.rendering, ...prev]);
            }
        } catch (err) {
            console.error('Aerial rendering failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const generateAllAngles = async () => {
        if (!plan) return;
        for (const angle of VIEW_ANGLES) {
            setGenerating(true);
            try {
                const res = await fetch('/api/generate/aerial', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan,
                        viewAngle: angle.id,
                        season: selectedSeason,
                        timeOfDay: selectedTime,
                    }),
                });
                const data = await res.json();
                if (data.success && data.rendering) {
                    setRenderings(prev => {
                        const filtered = prev.filter(r => r.viewAngle !== angle.id);
                        return [data.rendering, ...filtered];
                    });
                }
            } catch { /* continue */ }
        }
        setGenerating(false);
    };

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
                            <Plane className="w-7 h-7" style={{ color: brandColor }} />
                            Aerial Studio
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Drone-view contextual renderings from plan analysis</p>
                    </div>
                </div>
                {plan && (
                    <Button
                        onClick={generateAllAngles}
                        className="rounded-full px-6 font-bold text-black"
                        style={{ backgroundColor: brandColor }}
                        disabled={generating}
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        {generating ? 'Generating...' : 'All 5 Angles'}
                    </Button>
                )}
            </div>

            {!plan ? (
                /* Upload / Load State */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ minHeight: '55vh' }}>
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
                                    <p className="text-sm text-white/40">AI generates aerial drone renderings</p>
                                </div>
                            </>
                        )}
                    </label>

                    <div className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                                    <Sparkles className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Contextual Aerials</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30">
                                        Home + Neighborhood + Landscape
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed mb-4">
                                Generate photorealistic drone views showing your home in its <strong className="text-white/80">suburban context</strong> — with neighboring homes, mature landscaping, driveways, and seasonal atmosphere.
                                Choose from <strong className="text-white/80">5 camera angles</strong>, <strong className="text-white/80">4 seasons</strong>, and <strong className="text-white/80">3 lighting conditions</strong>.
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                                {VIEW_ANGLES.map(v => (
                                    <div key={v.id} className="text-center p-2 rounded-xl bg-white/5">
                                        <Camera className="w-3.5 h-3.5 mx-auto mb-1 text-white/30" />
                                        <span className="text-[9px] text-white/40">{v.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => setPlan(DEMO_PLAN)}
                            className="w-full h-14 rounded-2xl font-bold text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Load Demo — PNW Modern Farmhouse
                        </Button>
                    </div>
                </div>
            ) : (
                /* Controls + Gallery */
                <div className="space-y-6">
                    {/* Controls Bar */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* View Angle */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 block mb-3">Camera Angle</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {VIEW_ANGLES.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedAngle(v.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedAngle === v.id
                                                    ? 'text-black'
                                                    : 'bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/10'
                                                }`}
                                            style={selectedAngle === v.id ? { backgroundColor: brandColor } : undefined}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Season */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 block mb-3">Season</label>
                                <div className="flex gap-1.5">
                                    {SEASONS.map(s => {
                                        const Icon = s.icon;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSeason(s.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedSeason === s.id
                                                        ? 'bg-white/15 text-white'
                                                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" style={{ color: selectedSeason === s.id ? s.color : undefined }} />
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time of Day */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 block mb-3">Time of Day</label>
                                <div className="flex gap-1.5">
                                    {TIMES.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTime(t.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${selectedTime === t.id
                                                        ? 'text-black'
                                                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                                style={selectedTime === t.id ? { backgroundColor: brandColor } : undefined}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3 text-xs text-white/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="capitalize">{plan.architecturalStyle?.replace(/_/g, ' ')} · {plan.squareFootage?.toLocaleString()} SF · {plan.stories} Story</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => { setPlan(null); setRenderings([]); }}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/30 hover:text-white/60"
                                >
                                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                                    New Plan
                                </Button>
                                <Button
                                    onClick={generateRendering}
                                    disabled={generating}
                                    className="rounded-xl font-bold text-black px-6"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    {generating ? (
                                        <div className="flex items-center gap-2">
                                            <Loading size="sm" />
                                            <span>Rendering...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Plane className="w-4 h-4" />
                                            Generate Shot
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Gallery */}
                    {renderings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {renderings.map((render, idx) => {
                                const seasonData = SEASONS.find(s => s.id === render.season);
                                const SeasonIcon = seasonData?.icon || Sun;

                                return (
                                    <div
                                        key={`${render.viewAngle}-${idx}`}
                                        className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden group"
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden">
                                            <img
                                                src={render.imageUrl}
                                                alt={`${render.viewAngle} aerial view`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button
                                                    onClick={() => setLightbox(render)}
                                                    className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                                                >
                                                    <Maximize2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {/* Badges */}
                                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md border border-white/10 text-white/70">
                                                    <Camera className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                                                    {render.viewAngle.replace(/_/g, ' ')}
                                                </span>
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md border border-white/10"
                                                    style={{ color: seasonData?.color }}>
                                                    <SeasonIcon className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
                                                    {render.season}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-3">
                                            {render.aiDescription && (
                                                <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
                                                    {render.aiDescription}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={render.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                                                >
                                                    <Download className="w-3.5 h-3.5 text-white/40" />
                                                </a>
                                                <a
                                                    href={render.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-white/40" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {renderings.length === 0 && !generating && (
                        <div className="text-center py-16">
                            <Camera className="w-12 h-12 mx-auto mb-4 text-white/10" />
                            <p className="text-white/30 text-sm">Choose your angle, season, and time — then generate your first aerial shot</p>
                        </div>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="max-w-6xl w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox.imageUrl}
                            alt="Aerial rendering"
                            className="w-full rounded-3xl shadow-2xl"
                        />
                        <div className="mt-6 px-4">
                            <h2 className="text-xl font-bold mb-2 capitalize">{lightbox.viewAngle.replace(/_/g, ' ')} — {lightbox.season}</h2>
                            {lightbox.aiDescription && (
                                <p className="text-sm text-white/50 leading-relaxed max-w-3xl">{lightbox.aiDescription}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
