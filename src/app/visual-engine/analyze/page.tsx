'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    Upload,
    FileSearch,
    Layers,
    Ruler,
    Home,
    BedDouble,
    Bath,
    LayoutGrid,
    Mountain,
    Sparkles,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    X,
    Hammer,
    Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES } from '@/lib/demo-data';
import type { PlanAnalysisResult, PlanAnalysisResponse } from '@/lib/types/plan-analysis';

export default function PlanAnalyzerPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<PlanAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

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

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setError(null);
        setAnalysis(null);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(f);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/analyze/plan', {
                method: 'POST',
                body: formData,
            });

            const data: PlanAnalysisResponse = await res.json();

            if (data.success && data.analysis) {
                setAnalysis(data.analysis);
            } else {
                setError(data.error || 'Analysis failed');
            }
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setAnalysis(null);
        setError(null);
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
                            <FileSearch className="w-7 h-7" style={{ color: brandColor }} />
                            Plan Analyzer
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Upload architectural plans for AI-powered structural analysis</p>
                    </div>
                </div>
                {analysis && (
                    <Button onClick={reset} variant="outline" className="rounded-full px-6 border-white/10">
                        <Upload className="w-4 h-4 mr-2" />
                        New Analysis
                    </Button>
                )}
            </div>

            {!analysis ? (
                /* Upload + Analyze State */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Drop Zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${dragOver
                                ? 'border-white/40 bg-white/10'
                                : preview
                                    ? 'border-white/10 bg-white/5'
                                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                            }`}
                        style={{ minHeight: '450px' }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        {preview ? (
                            <>
                                <img src={preview} alt="Plan preview" className="w-full h-full object-contain p-4" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); reset(); }}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-red-500/40 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between">
                                    <span className="text-xs text-white/60 font-medium truncate">{file?.name}</span>
                                    <span className="text-[10px] text-white/30 font-mono">{((file?.size || 0) / 1024).toFixed(0)} KB</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-6 p-12 text-center" style={{ minHeight: '450px' }}>
                                <div
                                    className="w-20 h-20 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: `${brandColor}20` }}
                                >
                                    <Upload className="w-8 h-8" style={{ color: brandColor }} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold mb-1">Drop architectural plans here</p>
                                    <p className="text-sm text-white/40">
                                        PNG, JPEG, WebP, or PDF — up to 20MB
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['Floor Plans', 'Elevations', 'Site Plans', 'Sections', 'Details'].map((t) => (
                                        <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    <Sparkles className="w-5 h-5 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-bold">AI Blueprint Intelligence</h3>
                                    <p className="text-[10px] uppercase tracking-widest text-white/30">Powered by Gemini 2.0 Flash</p>
                                </div>
                            </div>

                            <p className="text-sm text-white/50 leading-relaxed mb-6">
                                Upload any architectural document and our AI will extract <strong className="text-white/80">structural data</strong>, identify <strong className="text-white/80">architectural style</strong>, detect <strong className="text-white/80">room dimensions</strong>, and catalog <strong className="text-white/80">material callouts</strong> — all in seconds.
                            </p>

                            <Button
                                onClick={handleAnalyze}
                                disabled={!file || analyzing}
                                className="w-full h-14 rounded-2xl font-bold text-black transition-all"
                                style={{ backgroundColor: file ? brandColor : undefined }}
                            >
                                {analyzing ? (
                                    <div className="flex items-center gap-3">
                                        <Loading size="sm" />
                                        <span>Analyzing Blueprint...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <FileSearch className="w-5 h-5" />
                                        Analyze Plan
                                    </div>
                                )}
                            </Button>

                            {error && (
                                <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* What AI Extracts */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 block mb-4">What AI Extracts</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Home, label: 'Style & Type' },
                                    { icon: LayoutGrid, label: 'Room Layout' },
                                    { icon: Ruler, label: 'Dimensions' },
                                    { icon: Layers, label: 'Materials' },
                                    { icon: BedDouble, label: 'Bedrooms' },
                                    { icon: Bath, label: 'Bathrooms' },
                                    { icon: Mountain, label: 'Roof Type' },
                                    { icon: Maximize2, label: 'Sq. Footage' },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <Icon className="w-4 h-4 text-white/30" />
                                        <span className="text-xs font-medium text-white/50">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Results State */
                <div className="space-y-8">
                    {/* Confidence Bar */}
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-bold">Analysis Complete</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Confidence</span>
                            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${analysis.confidence}%`, backgroundColor: brandColor }}
                                />
                            </div>
                            <span className="text-sm font-bold" style={{ color: brandColor }}>{analysis.confidence}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Document Overview */}
                        <div className="space-y-6">
                            {/* Preview Thumbnail */}
                            {preview && (
                                <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/3]">
                                    <img src={preview} alt="Analyzed plan" className="w-full h-full object-contain p-2" />
                                </div>
                            )}

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard label="Document" value={analysis.documentType?.replace('_', ' ') || '—'} color={brandColor} />
                                <StatCard label="Style" value={analysis.architecturalStyle?.replace(/_/g, ' ') || '—'} color={brandColor} />
                                <StatCard label="Stories" value={String(analysis.stories ?? '—')} color={brandColor} />
                                <StatCard label="Sq. Ft." value={analysis.squareFootage?.toLocaleString() || '—'} color={brandColor} />
                                <StatCard label="Beds" value={String(analysis.bedrooms ?? '—')} color={brandColor} />
                                <StatCard label="Baths" value={String(analysis.bathrooms ?? '—')} color={brandColor} />
                                <StatCard label="Roof" value={analysis.roofType || '—'} color={brandColor} />
                                <StatCard label="Type" value={analysis.buildingType?.replace('_', ' ') || '—'} color={brandColor} />
                            </div>
                        </div>

                        {/* Middle Column: Rooms & Features */}
                        <div className="space-y-6">
                            {/* Room Breakdown */}
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" style={{ color: brandColor }} />
                                    Rooms ({analysis.rooms.length})
                                </h3>
                                <div className="space-y-2">
                                    {analysis.rooms.map((room, i) => (
                                        <div key={i} className="p-3 rounded-2xl bg-black/30 border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-bold">{room.name}</span>
                                                {room.dimensions && (
                                                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{room.dimensions}</span>
                                                )}
                                            </div>
                                            {(room.ceilingHeight || room.notes) && (
                                                <p className="text-[10px] text-white/30 mt-1">
                                                    {[room.ceilingHeight && `Ceiling: ${room.ceilingHeight}`, room.notes].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Special Features */}
                            {analysis.specialFeatures.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
                                        Special Features
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.specialFeatures.map((feat, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                                                style={{ borderColor: `${brandColor}30`, color: brandColor, backgroundColor: `${brandColor}10` }}
                                            >
                                                {feat.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Materials, Regional, Notes */}
                        <div className="space-y-6">
                            {/* Materials */}
                            {analysis.materials.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                                        <Layers className="w-4 h-4" style={{ color: brandColor }} />
                                        Materials
                                    </h3>
                                    <div className="space-y-2">
                                        {analysis.materials.map((mat, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-black/30">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
                                                <span className="text-sm">{mat.replace(/_/g, ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Regional Style */}
                            {analysis.regionalStyle && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                                        <Mountain className="w-4 h-4" style={{ color: brandColor }} />
                                        Regional Style
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${analysis.regionalStyle.isPNW ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                                            {analysis.regionalStyle.isPNW ? 'PNW Detected' : 'Non-PNW'}
                                        </span>
                                    </div>
                                    {analysis.regionalStyle.description && (
                                        <p className="text-xs text-white/50 leading-relaxed">{analysis.regionalStyle.description}</p>
                                    )}
                                </div>
                            )}

                            {/* Doors & Windows */}
                            {analysis.doorWindowLocations && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-3">Doors & Windows</h3>
                                    <p className="text-xs text-white/50 leading-relaxed">{analysis.doorWindowLocations}</p>
                                </div>
                            )}

                            {/* Notable Details */}
                            {analysis.notableDetails.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-3">Notable Details</h3>
                                    <ul className="space-y-2">
                                        {analysis.notableDetails.map((note, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Written Specs */}
                            {analysis.writtenNotes.length > 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-bold text-sm mb-3">Written Specifications</h3>
                                    <div className="space-y-2 font-mono">
                                        {analysis.writtenNotes.map((spec, i) => (
                                            <p key={i} className="text-[10px] text-white/40 p-2 rounded-xl bg-black/30">
                                                {spec}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1">{label}</p>
            <p className="text-sm font-bold capitalize" style={{ color }}>{value}</p>
        </div>
    );
}
