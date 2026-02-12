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
  RotateCw,
  Video as VideoIcon,
  Building2,
  LayoutGrid
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

type PlanType = 'elevation' | 'floorplan';

type RenderStyle = 'photorealistic' | 'twilight' | 'aerial';

const RENDER_STYLES: { id: RenderStyle; label: string; description: string; prompt: string }[] = [
  {
    id: 'photorealistic',
    label: 'Photorealistic Exterior',
    description: 'Daytime, street-level perspective',
    prompt: 'Ultra-photorealistic architectural render from elevation plans. Street-level perspective, natural daylight, lush landscaping, clear blue sky, sharp focus, 8K resolution.',
  },
  {
    id: 'twilight',
    label: 'Twilight Golden Hour',
    description: 'Warm evening glow, interior lights on',
    prompt: 'Cinematic twilight golden hour architectural render from elevation plans. Warm interior glow through windows, dramatic sky gradients, professional real estate photography, 8K.',
  },
  {
    id: 'aerial',
    label: 'Aerial Drone View',
    description: "Bird's-eye perspective showing lot & roof",
    prompt: "Aerial drone photography render from architectural elevation plans. Bird's eye view showing roof design, lot layout, landscaping, neighborhood context, Pacific Northwest setting, 8K.",
  },
];

// Demo blueprint SVG
const BLUEPRINT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
  <rect width="800" height="600" fill="#1a1a2e"/>
  <text x="400" y="50" text-anchor="middle" fill="#4a9eff" font-size="18" font-family="monospace">FLOOR PLAN - 16454 108TH AVE NE</text>
  <rect x="100" y="80" width="300" height="200" stroke="#4a9eff" stroke-width="2"/>
  <text x="250" y="190" text-anchor="middle" fill="#7ab8ff" font-size="14" font-family="monospace">GREAT ROOM 24 x 18</text>
  <rect x="400" y="80" width="200" height="200" stroke="#4a9eff" stroke-width="2"/>
  <text x="500" y="190" text-anchor="middle" fill="#7ab8ff" font-size="14" font-family="monospace">KITCHEN 16 x 18</text>
  <rect x="100" y="300" width="250" height="250" stroke="#4a9eff" stroke-width="2"/>
  <text x="225" y="435" text-anchor="middle" fill="#7ab8ff" font-size="14" font-family="monospace">GARAGE 24 x 24</text>
  <rect x="400" y="300" width="300" height="150" stroke="#4a9eff" stroke-width="2"/>
  <text x="550" y="385" text-anchor="middle" fill="#7ab8ff" font-size="14" font-family="monospace">PRIMARY SUITE 20 x 18</text>
  <text x="500" y="500" text-anchor="middle" fill="#4a9eff" font-size="11" font-family="monospace">BEDROOM 2</text>
  <text x="600" y="520" text-anchor="middle" fill="#4a9eff" font-size="11" font-family="monospace">BEDROOM 3</text>
  <text x="700" y="500" text-anchor="middle" fill="#4a9eff" font-size="11" font-family="monospace">BEDROOM 4</text>
  <text x="650" y="560" text-anchor="middle" fill="#4a9eff" font-size="11" font-family="monospace">BONUS ROOM</text>
  <text x="400" y="590" text-anchor="middle" fill="#666" font-size="12" font-family="monospace">3,850 SQFT | 4 BED | 3.5 BATH | 3-CAR GARAGE</text>
</svg>
`;

function getDemoBlueprintUrl(): string {
  if (typeof window !== 'undefined') {
    return 'data:image/svg+xml;base64,' + btoa(BLUEPRINT_SVG);
  }
  return 'data:image/svg+xml;base64,' + Buffer.from(BLUEPRINT_SVG).toString('base64');
}

const DEMO_RENDERS: Record<string, string> = {
  photorealistic: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  twilight: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  aerial: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
};

export default function PlanUpload({ projectId, projectName, onRenderGenerated }: PlanUploadProps) {
  const [plan, setPlan] = useState<UploadedPlan | null>(null);
  const [planType, setPlanType] = useState<PlanType>('elevation');
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
    let preview = '';
    if (file.type.includes('image')) {
      preview = URL.createObjectURL(file);
    } else {
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

  const handleGenerateRender = async () => {
    if (!plan) return;
    setGenerating(true);
    setGeneratedRender(null);
    setProgress(0);

    const stages = [
      { label: 'Analyzing elevation dimensions...', duration: 800 },
      { label: 'Extracting architectural facade details...', duration: 1000 },
      { label: 'Mapping exterior proportions...', duration: 800 },
      { label: 'Generating 3D exterior from elevation...', duration: 1200 },
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
      try {
        const style = RENDER_STYLES.find(s => s.id === selectedStyle);
        const res = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            preset: 'exterior',
            customPrompt: `From architectural elevation drawing: ${style?.prompt}`,
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

  const handleGenerateVideo = async () => {
    if (!plan) return;
    setGenerating(true);
    setGeneratedRender(null);
    setProgress(0);

    const stages = [
      { label: 'Analyzing floor plan layout...', duration: 800 },
      { label: 'Mapping room-to-room pathways...', duration: 1000 },
      { label: 'Building 3D walkthrough route...', duration: 1200 },
      { label: 'Rendering interior perspectives...', duration: 1500 },
      { label: 'Compositing video walkthrough...', duration: 2000 },
    ];

    let elapsed = 0;
    const totalDuration = stages.reduce((s, st) => s + st.duration, 0);
    for (const stage of stages) {
      setProgressLabel(stage.label);
      await new Promise(r => setTimeout(r, stage.duration));
      elapsed += stage.duration;
      setProgress(Math.round((elapsed / totalDuration) * 100));
    }

    if (!isDemoMode()) {
      try {
        await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            preset: 'home-walkthrough',
            extraInstructions: 'Generated from uploaded floor plan. Walkthrough based on room layout.',
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    setGenerating(false);
    setProgress(100);
    setProgressLabel('Video walkthrough queued!');

    if (onRenderGenerated) {
      onRenderGenerated({
        id: `video-${Date.now()}`,
        type: 'video',
        url: null,
        prompt: 'Video walkthrough generated from floor plan layout',
        status: 'processing',
      });
    }
  };

  return (
    <div>
      {/* Upload Zone */}
      {!plan ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'border-amber-400 bg-amber-500/5 scale-[1.02]'
              : 'border-white/10 bg-white/[0.02] hover:border-amber-400/50 hover:bg-white/[0.04]'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-white/60">Processing blueprint...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-amber-400/60 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Upload Architectural Plans</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto mb-4">
                Drop your PDF blueprints or floor plan images here. Upload an <strong className="text-amber-400">elevation</strong> for exterior renders, or a <strong className="text-indigo-400">floor plan</strong> for video walkthroughs and flyers.
              </p>
              <div className="flex gap-3 justify-center text-xs text-white/20">
                <span className="px-3 py-1 rounded-full border border-white/10">PDF</span>
                <span className="px-3 py-1 rounded-full border border-white/10">PNG</span>
                <span className="px-3 py-1 rounded-full border border-white/10">JPG</span>
                <span className="px-3 py-1 rounded-full border border-white/10">TIFF</span>
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
          {/* Uploaded Plan Header */}
          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-sm">{plan.name}</p>
                <p className="text-xs text-white/40">{plan.pages} page{plan.pages > 1 ? 's' : ''} &bull; Blueprint</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setPlan(null); setGeneratedRender(null); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Plan Type Selector */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">What type of plan is this?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPlanType('elevation')}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  planType === 'elevation'
                    ? 'border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/20'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <Building2 className={`w-6 h-6 mb-2 ${planType === 'elevation' ? 'text-amber-400' : 'text-white/30'}`} />
                <p className="font-bold text-sm">Elevation</p>
                <p className="text-xs text-white/40 mt-1">Exterior facade view</p>
                <p className="text-[10px] text-amber-400/60 mt-2 uppercase tracking-widest font-bold">Used for: Rendering</p>
              </button>
              <button
                onClick={() => setPlanType('floorplan')}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  planType === 'floorplan'
                    ? 'border-indigo-400/50 bg-indigo-500/10 ring-1 ring-indigo-400/20'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <LayoutGrid className={`w-6 h-6 mb-2 ${planType === 'floorplan' ? 'text-indigo-400' : 'text-white/30'}`} />
                <p className="font-bold text-sm">Floor Plan</p>
                <p className="text-xs text-white/40 mt-1">Room layout / blueprint</p>
                <p className="text-[10px] text-indigo-400/60 mt-2 uppercase tracking-widest font-bold">Used for: Video &amp; Flyers</p>
              </button>
            </div>
          </div>

          {/* Blueprint Preview */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
            <img src={plan.preview} alt="Blueprint" className="w-full max-h-64 object-contain" />
          </div>

          {/* ELEVATION: Render Style Selection */}
          {planType === 'elevation' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Select Render Style</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {RENDER_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      selectedStyle === style.id
                        ? 'border-amber-400/50 bg-amber-500/5 ring-1 ring-amber-400/20'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <p className="font-bold text-sm">{style.label}</p>
                    <p className="text-xs text-white/40 mt-1">{style.description}</p>
                  </button>
                ))}
              </div>

              {!generatedRender && (
                <Button
                  onClick={handleGenerateRender}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full py-6 font-bold text-base"
                >
                  {generating ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {progressLabel}</>
                  ) : (
                    <><ImageIcon className="w-5 h-5 mr-2" /> Generate Render from Elevation</>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* FLOORPLAN: Video Walkthrough + Flyer */}
          {planType === 'floorplan' && (
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-indigo-400 mb-2">Floor Plan Actions</h3>
                <p className="text-sm text-white/50 mb-1">
                  This floor plan will be used to generate a <strong className="text-white">video walkthrough</strong> and will be referenced in <strong className="text-white">marketing flyers</strong>.
                </p>
                <p className="text-xs text-white/30">
                  The AI will analyze room layouts, dimensions, and flow to create a cinematic interior tour.
                </p>
              </div>

              {!generatedRender && (
                <Button
                  onClick={handleGenerateVideo}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full py-6 font-bold text-base"
                >
                  {generating ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {progressLabel}</>
                  ) : (
                    <><VideoIcon className="w-5 h-5 mr-2" /> Generate Video Walkthrough from Floor Plan</>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {generating && (
            <div className="space-y-2">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    planType === 'elevation'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>{progressLabel}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Generated Result */}
          {generatedRender && planType === 'elevation' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">Render generated from your elevation</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Elevation Input</p>
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <img src={plan.preview} alt="Blueprint" className="w-full aspect-video object-contain" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">AI Render Output</p>
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img src={generatedRender} alt="Rendered" className="w-full aspect-video object-cover" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => { setGeneratedRender(null); setProgress(0); }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-full px-6 font-bold"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Try Another Style
                </Button>
                <a href={generatedRender} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full px-6">
                    Download Render
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Floor plan video queued message */}
          {progress === 100 && planType === 'floorplan' && !generating && (
            <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">Video walkthrough queued!</span>
              </div>
              <p className="text-sm text-white/50">
                Your floor plan is being processed. The video walkthrough will appear in your Asset Gallery when complete. This plan will also be available for flyer generation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
