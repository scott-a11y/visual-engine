'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    ArrowLeft,
    Box,
    RotateCcw,
    Grid3X3,
    Scissors,
    Eye,
    Layers,
    Home,
    Ruler,
    Mountain,
    Upload,
    Sparkles,
    ChevronsUpDown,
    FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demo-data';
import { generateBuildingModel, type BuildingModel } from '@/lib/services/model-generator';
import type { PlanAnalysisResult, PlanAnalysisResponse } from '@/lib/types/plan-analysis';

// Dynamic import for Three.js (SSR-incompatible)
const ModelViewer = dynamic(
    () => import('@/components/three/ModelViewer'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-[#080808] rounded-3xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loading size="lg" />
                    <span className="text-white/30 text-sm">Loading 3D Engine...</span>
                </div>
            </div>
        ),
    }
);

export default function ModelGeneratorPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const supabase = createClient();

    // Model state
    const [analysis, setAnalysis] = useState<PlanAnalysisResult | null>(null);
    const [model, setModel] = useState<BuildingModel | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Viewer controls
    const [autoRotate, setAutoRotate] = useState(true);
    const [wireframe, setWireframe] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [cutaway, setCutaway] = useState(false);

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

    // When analysis changes, generate the 3D model
    useEffect(() => {
        if (analysis) {
            const building = generateBuildingModel(analysis);
            setModel(building);
        }
    }, [analysis]);

    const handleFileUpload = async (f: File) => {
        setFile(f);
        setAnalyzing(true);
        setError(null);
        setModel(null);
        setAnalysis(null);

        try {
            const formData = new FormData();
            formData.append('file', f);
            const res = await fetch('/api/analyze/plan', {
                method: 'POST',
                body: formData,
            });
            const data: PlanAnalysisResponse = await res.json();
            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
            } else {
                setError(data.error || 'Analysis failed.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const loadDemoModel = () => {
        // Use the demo analysis from the plan analysis service
        const demoAnalysis: PlanAnalysisResult = {
            documentType: 'floor_plan',
            architecturalStyle: 'modern_farmhouse',
            buildingType: 'single_family',
            stories: 2,
            squareFootage: 3200,
            bedrooms: 4,
            bathrooms: 3.5,
            specialFeatures: ['attached_garage_3_car', 'covered_front_porch', 'rear_deck', 'mudroom', 'walk_in_pantry', 'bonus_room'],
            materials: ['hardie_board_siding', 'standing_seam_metal_roof', 'natural_stone_veneer', 'engineered_hardwood'],
            roofType: 'gable',
            regionalStyle: { isPNW: true, description: 'Pacific Northwest modern farmhouse with deep overhangs' },
            scale: '1/4" = 1\'',
            rooms: [
                { name: 'Great Room', dimensions: '24\' x 18\'', ceilingHeight: 'Vaulted to 18\'', notes: 'Open to kitchen' },
                { name: 'Kitchen', dimensions: '16\' x 14\'', ceilingHeight: '10\'', notes: '42" shaker cabinets' },
                { name: 'Primary Suite', dimensions: '18\' x 16\'', ceilingHeight: '10\'', notes: 'Spa bath' },
                { name: 'Bedroom 2', dimensions: '14\' x 12\'', ceilingHeight: '9\'', notes: 'Walk-in closet' },
                { name: 'Bedroom 3', dimensions: '13\' x 12\'', ceilingHeight: '9\'', notes: 'Jack & Jill bath' },
                { name: 'Bedroom 4 / Bonus', dimensions: '16\' x 14\'', ceilingHeight: '8\'', notes: 'Above garage' },
                { name: 'Garage', dimensions: '34\' x 24\'', ceilingHeight: '10\'', notes: '3-car, EV ready' },
            ],
            doorWindowLocations: '8\' pivot entry door, 16\' rear multi-slide',
            notableDetails: ['Board-and-batten exterior', 'Open riser staircase', 'Cedar porch ceiling'],
            writtenNotes: ['All trim: Arctic White', 'Roof pitch: 8/12 main'],
            confidence: 92,
        };
        setAnalysis(demoAnalysis);
    };

    const viewerControls = [
        { icon: RotateCcw, label: 'Rotate', active: autoRotate, toggle: () => setAutoRotate(!autoRotate) },
        { icon: Grid3X3, label: 'Grid', active: showGrid, toggle: () => setShowGrid(!showGrid) },
        { icon: Eye, label: 'Wireframe', active: wireframe, toggle: () => setWireframe(!wireframe) },
        { icon: Scissors, label: 'Cutaway', active: cutaway, toggle: () => setCutaway(!cutaway) },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                            <Box className="w-7 h-7" style={{ color: brandColor }} />
                            3D Model Generator
                        </h1>
                        <p className="text-white/40 text-sm mt-1">
                            Procedural architectural models from plan analysis
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/visual-engine/analyze">
                        <Button variant="outline" className="rounded-full px-5 border-white/10 text-sm">
                            <FileSearch className="w-4 h-4 mr-2" />
                            Plan Analyzer
                        </Button>
                    </Link>
                </div>
            </div>

            {!model ? (
                /* Empty / Upload State */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ minHeight: '60vh' }}>
                    {/* Upload Zone */}
                    <label
                        className="relative rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 p-12"
                    >
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        {analyzing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loading size="lg" />
                                <p className="text-sm text-white/60">Analyzing blueprint & generating model...</p>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                                    AI Vision + Procedural Generation
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                    style={{ backgroundColor: `${brandColor}20` }}
                                >
                                    <Upload className="w-8 h-8" style={{ color: brandColor }} />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold mb-1">Upload architectural plans</p>
                                    <p className="text-sm text-white/40">
                                        AI analyzes the plan → generates a 3D model instantly
                                    </p>
                                </div>
                            </>
                        )}
                    </label>

                    {/* Info Sidebar */}
                    <div className="space-y-6">
                        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    <Sparkles className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Procedural Architecture</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30">
                                        Plan → Analysis → 3D Model
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm text-white/50 leading-relaxed">
                                <p>
                                    Upload any architectural plan and our AI will analyze it, then procedurally generate
                                    a <strong className="text-white/80">3D building model</strong> with:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: Layers, text: 'Extruded walls' },
                                        { icon: Home, text: 'Roof geometry' },
                                        { icon: Ruler, text: 'Real dimensions' },
                                        { icon: Mountain, text: 'Site context' },
                                        { icon: ChevronsUpDown, text: 'Multi-story' },
                                        { icon: Box, text: 'Door/window openings' },
                                    ].map(({ icon: Icon, text }) => (
                                        <div key={text} className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                                            <Icon className="w-3.5 h-3.5 text-white/30" />
                                            <span className="text-xs">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Demo Button */}
                        <Button
                            onClick={loadDemoModel}
                            className="w-full h-14 rounded-2xl font-bold text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Box className="w-5 h-5 mr-2" />
                            Load Demo Model (PNW Modern Farmhouse)
                        </Button>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* 3D Viewer State */
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Viewer Canvas */}
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#080808]" style={{ minHeight: '65vh' }}>
                        <Suspense fallback={
                            <div className="w-full h-full flex items-center justify-center">
                                <Loading size="lg" />
                            </div>
                        }>
                            <ModelViewer
                                model={model}
                                brandColor={brandColor}
                                autoRotate={autoRotate}
                                wireframe={wireframe}
                                showGrid={showGrid}
                                cutaway={cutaway}
                            />
                        </Suspense>

                        {/* Floating Controls */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-1.5">
                            {viewerControls.map(({ icon: Icon, label, active, toggle }) => (
                                <button
                                    key={label}
                                    onClick={toggle}
                                    title={label}
                                    className={`p-2.5 rounded-xl transition-all ${active
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>

                        {/* Model Info Badge */}
                        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                Procedural Model
                            </p>
                            <p className="text-sm font-bold capitalize">
                                {analysis?.architecturalStyle?.replace(/_/g, ' ')} ·{' '}
                                {analysis?.stories} Story ·{' '}
                                {analysis?.squareFootage?.toLocaleString()} SF
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Model Stats */}
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Box className="w-4 h-4" style={{ color: brandColor }} />
                                Model Statistics
                            </h3>
                            <div className="space-y-2 text-xs">
                                <StatRow label="Walls" value={String(model.walls.length)} color={brandColor} />
                                <StatRow label="Exterior" value={String(model.walls.filter(w => w.isExterior).length)} color={brandColor} />
                                <StatRow label="Interior" value={String(model.walls.filter(w => !w.isExterior).length)} color={brandColor} />
                                <StatRow label="Floor Slabs" value={String(model.floors.length)} color={brandColor} />
                                <StatRow label="Roof Planes" value={String(model.roofPlanes.length)} color={brandColor} />
                                <StatRow label="Site Elements" value={String(model.siteElements.length)} color={brandColor} />
                                <div className="border-t border-white/10 pt-2 mt-2" />
                                <StatRow label="Width" value={`${model.boundingBox.width.toFixed(0)} ft`} color={brandColor} />
                                <StatRow label="Depth" value={`${model.boundingBox.depth.toFixed(0)} ft`} color={brandColor} />
                                <StatRow label="Height" value={`${model.boundingBox.height.toFixed(0)} ft`} color={brandColor} />
                            </div>
                        </div>

                        {/* Rooms */}
                        {analysis && analysis.rooms.length > 0 && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Home className="w-4 h-4" style={{ color: brandColor }} />
                                    Room Layout
                                </h3>
                                <div className="space-y-1.5">
                                    {analysis.rooms.map((room, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-black/30">
                                            <span className="text-xs font-medium">{room.name}</span>
                                            {room.dimensions && (
                                                <span className="text-[10px] text-white/30 font-mono">{room.dimensions}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Materials */}
                        {analysis && analysis.materials.length > 0 && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Layers className="w-4 h-4" style={{ color: brandColor }} />
                                    Materials
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {analysis.materials.map((mat, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border"
                                            style={{ borderColor: `${brandColor}30`, color: brandColor, backgroundColor: `${brandColor}10` }}
                                        >
                                            {mat.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Analysis */}
                        <Button
                            onClick={() => { setModel(null); setAnalysis(null); setFile(null); }}
                            variant="outline"
                            className="w-full rounded-2xl border-white/10"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Plan
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-white/40">{label}</span>
            <span className="font-bold font-mono" style={{ color }}>{value}</span>
        </div>
    );
}
