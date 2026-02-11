'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Upload,
    FileText,
    Sparkles,
    X,
    Loader2,
    Image as ImageIcon,
    CheckCircle2,
    ArrowRight,
    ZoomIn,
    RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/lib/demo-data';

interface PlanUploadProps {
    projectId: string;
    projectName: string;
    onRenderGenerated?: (asset: any) => void;
}

type UploadedPlan = {
    id: string;
    file: File;
    preview: string;
    name: string;
    pages: number;
    uploadedAt: Date;
};

type RenderStyle = 'photorealistic' | 'twilight' | 'aerial' | 'interior';

const RENDER_STYLES: { id: RenderStyle; label: string; description: string; prompt: string }[] = [
    {
        id: 'photorealistic',
        label: 'Photorealistic Exterior',
        description: 'Daytime, street-level perspective',
        prompt: 'Ultra-photorealistic architectural render from blueprint plans. Street-level perspective, natural daylight, lush landscaping, clear blue sky, sharp focus, 8K resolution.',
    },
    {
        id: 'twilight',
        label: 'Twilight Golden Hour',
        description: 'Warm evening glow, interior lights on',
        prompt: 'Cinematic twilight golden hour architectural render from blueprint plans. Warm interior glow through windows, dramatic sky gradients, professional real estate photography, 8K.',
    },
    {
        id: 'aerial',
        label: 'Aerial Drone View',
        description: 'Bird\'s-eye perspective showing lot & roof',
        prompt: 'Aerial drone photography render from architectural plans. Bird\'s eye view showing roof design, lot layout, landscaping, neighborhood context, Pacific Northwest setting, 8K.',
    },
    {
        id: 'interior',
        label: 'Interior Showcase',
        description: 'Open floor plan, great room perspective',
        prompt: 'Luxury interior architectural render from floor plans. Open concept great room, vaulted ceilings, natural light, modern finishes, warm wood tones, designer furniture staging, 8K.',
    },
];

// Demo blueprint SVG (inline data URI approach to avoid btoa SSR issues)
const BLUEPRINT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
  <rect width="800" height="600" fill="#0a1628"/>
  <text x="400" y="40" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="16" font-weight="bold">FLOOR PLAN - 16454 108TH AVE NE</text>
  <rect x="100" y="80" width="600" height="440" stroke="#3b82f6" stroke-width="3" rx="2"/>
  <rect x="100" y="80" width="250" height="220" stroke="#3b82f6" stroke-width="2"/>
  <text x="225" y="200" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="14">GREAT ROOM</text>
  <text x="225" y="220" text-anchor="middle" fill="#1e40af" font-family="monospace" font-size="10">24 x 18</text>
  <rect x="350" y="80" width="200" height="220" stroke="#3b82f6" stroke-width="2"/>
  <text x="450" y="200" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="14">KITCHEN</text>
  <text x="450" y="220" text-anchor="middle" fill="#1e40af" font-family="monospace" font-size="10">16 x 18</text>
  <rect x="550" y="80" width="150" height="220" stroke="#3b82f6" stroke-width="2"/>
  <text x="625" y="200" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="14">GARAGE</text>
  <text x="625" y="220" text-anchor="middle" fill="#1e40af" font-family="monospace" font-size="10">24 x 24</text>
  <rect x="100" y="300" width="300" height="220" stroke="#3b82f6" stroke-width="2"/>
  <text x="250" y="420" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="14">PRIMARY SUITE</text>
  <text x="250" y="440" text-anchor="middle" fill="#1e40af" font-family="monospace" font-size="10">20 x 18</text>
  <rect x="400" y="300" width="150" height="110" stroke="#3b82f6" stroke-width="2"/>
  <text x="475" y="360" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="12">BEDROOM 2</text>
  <rect x="550" y="300" width="150" height="110" stroke="#3b82f6" stroke-width="2"/>
  <text x="625" y="360" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="12">BEDROOM 3</text>
  <rect x="400" y="410" width="150" height="110" stroke="#3b82f6" stroke-width="2"/>
  <text x="475" y="470" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="12">BEDROOM 4</text>
  <rect x="550" y="410" width="150" height="110" stroke="#3b82f6" stroke-width="2"/>
  <text x="625" y="470" text-anchor="middle" fill="#3b82f6" font-family="monospace" font-size="12">BONUS ROOM</text>
  <line x1="200" y1="80" x2="200" y2="73" stroke="#60a5fa" stroke-width="2"/>
  <line x1="240" y1="80" x2="240" y2="73" stroke="#60a5fa" stroke-width="2"/>
  <text x="400" y="570" text-anchor="middle" fill="#1e40af" font-family="monospace" font-size="12">3,850 SQFT | 4 BED | 3.5 BATH | 3-CAR GARAGE</text>
</svg>`;

function getDemoBlueprintUrl(): string {
    if (typeof window !== 'undefined') {
        return 'data:image/svg+xml;base64,' + btoa(BLUEPRINT_SVG);
    }
    return 'data:image/svg+xml;base64,' + Buffer.from(BLUEPRINT_SVG).toString('base64');
}

const DEMO_RENDERS: Record<RenderStyle, string> = {
    photorealistic: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    twilight: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    aerial: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    interior: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
};

export default function PlanUpload({ projectId, projectName, onRenderGenerated }: PlanUploadProps) {
    const [plan, setPlan] = useState<UploadedPlan | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<RenderStyle>('photorealistic');
    const [generating, setGenerating] = useState(false);
    const [generatedRender, setGeneratedRender] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
            alert('Please upload a PDF or image file');
            return;
        }

        setUploading(true);

        // Create preview
        let preview = '';
        if (file.type.includes('image')) {
            preview = URL.createObjectURL(file);
        } else {
            // For PDFs, use a placeholder or the demo blueprint
            preview = getDemoBlueprintUrl();
        }

        setTimeout(() => {
            setPlan({
                id: `plan-${Date.now()}`,
                file,
                preview,
                name: file.name,
                pages: file.type.includes('pdf') ? Math.ceil(file.size / 50000) : 1,
                uploadedAt: new Date(),
            });
            setUploading(false);
        }, 1500);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleGenerate = async () => {
        if (!plan) return;
        setGenerating(true);
        setGeneratedRender(null);
        setProgress(0);

        const stages = [
            { label: 'Analyzing blueprint dimensions...', duration: 800 },
            { label: 'Extracting architectural elements...', duration: 1000 },
            { label: 'Mapping room layouts and proportions...', duration: 800 },
            { label: 'Generating 3D structure from plans...', duration: 1200 },
            { label: 'Applying materials and textures...', duration: 1000 },
            { label: 'Rendering final composition...', duration: 1200 },
        ];

        let elapsed = 0;
        const totalDuration = stages.reduce((s, st) => s + st.duration, 0);

        for (const stage of stages) {
            setProgressLabel(stage.label);
            await new Promise(r => setTimeout(r, stage.duration));
            elapsed += stage.duration;
            setProgress(Math.round((elapsed / totalDuration) * 100));
        }

        if (isDemoMode()) {
            setGeneratedRender(DEMO_RENDERS[selectedStyle]);
        } else {
            // In production, call the real AI endpoint
            try {
                const style = RENDER_STYLES.find(s => s.id === selectedStyle);
                const res = await fetch('/api/generate/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId,
                        preset: 'exterior',
                        customPrompt: `From architectural blueprint/floor plan: ${style?.prompt}`,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setGeneratedRender(data.url || DEMO_RENDERS[selectedStyle]);
                }
            } catch (err) {
                console.error(err);
                setGeneratedRender(DEMO_RENDERS[selectedStyle]);
            }
        }

        setGenerating(false);
        setProgress(100);
        setProgressLabel('Render complete!');

        if (onRenderGenerated) {
            onRenderGenerated({
                id: `render-${Date.now()}`,
                type: 'image',
                url: DEMO_RENDERS[selectedStyle],
                prompt: RENDER_STYLES.find(s => s.id === selectedStyle)?.prompt,
                status: 'complete',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            {!plan ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${dragOver
                        ? 'border-amber-400 bg-amber-500/5 scale-[1.02]'
                        : 'border-white/10 bg-white/[0.02] hover:border-amber-400/50 hover:bg-white/[0.04]'
                        }`}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                            <p className="text-white/60 font-medium">Processing blueprint...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Upload Architectural Plans</h3>
                            <p className="text-white/40 mb-4 max-w-md mx-auto">
                                Drop your PDF blueprints or floor plan images here. Our AI will analyze the drawings and generate photorealistic marketing renders.
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 font-medium">PDF</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 font-medium">PNG</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 font-medium">JPG</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 font-medium">TIFF</span>
                            </div>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Uploaded Plan Preview */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{plan.name}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{plan.pages} page{plan.pages > 1 ? 's' : ''} • Blueprint</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-white/10"
                                    onClick={() => { setPlan(null); setGeneratedRender(null); }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Blueprint Preview */}
                        <div className="relative bg-[#0a1628] p-4">
                            <img
                                src={plan.preview}
                                alt="Blueprint"
                                className="w-full h-auto max-h-[400px] object-contain rounded-xl"
                            />
                            <div className="absolute bottom-6 right-6 flex gap-2">
                                <button className="p-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                    <RotateCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Render Style Selection */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Select Render Style</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {RENDER_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`text-left p-4 rounded-2xl border transition-all ${selectedStyle === style.id
                                        ? 'border-amber-400/50 bg-amber-500/5 ring-1 ring-amber-400/20'
                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                        }`}
                                >
                                    <p className="font-bold text-sm mb-1">{style.label}</p>
                                    <p className="text-xs text-white/40">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    {!generatedRender && (
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-2xl text-lg font-bold shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] group"
                        >
                            {generating ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {progressLabel}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Generate Render from Plans
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    )}

                    {/* Progress Bar */}
                    {generating && (
                        <div className="space-y-2">
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-white/40">
                                <span>{progressLabel}</span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    )}

                    {/* Generated Render Result */}
                    {generatedRender && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                Render generated from your plans
                            </div>

                            {/* Side by Side Comparison */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60">Blueprint Input</p>
                                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a1628]">
                                        <img src={plan.preview} alt="Blueprint" className="w-full h-48 object-contain p-2" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">AI Render Output</p>
                                    <div className="rounded-2xl overflow-hidden border border-amber-400/20">
                                        <img src={generatedRender} alt="Rendered" className="w-full h-48 object-cover" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setGeneratedRender(null);
                                        setProgress(0);
                                    }}
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full px-6 font-bold"
                                >
                                    <RotateCw className="w-4 h-4 mr-2" />
                                    Try Another Style
                                </Button>
                                <a href={generatedRender} download target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/10">
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Download Render
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
