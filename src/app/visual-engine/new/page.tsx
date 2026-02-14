'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Sparkles,
    MapPin,
    Home,
    Ruler,
    StickyNote,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDemoMode, DEMO_PROJECTS } from '@/lib/demo-data';
import { PersonaSelector } from '@/components/persona-selector';

const STYLES = [
    'Modern Farmhouse',
    'Northwest Contemporary',
    'Craftsman',
    'Mid-Century Modern',
    'Traditional',
    'Mediterranean',
    'Colonial',
    'Industrial Loft',
    'Scandinavian',
    'Custom'
];

const STAGES = [
    'Pre-Construction',
    'Foundation',
    'Framing',
    'Under Construction',
    'Finishing',
    'Pre-Sale',
    'Completed'
];

export default function NewProjectPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        address: '',
        style: '',
        stage: 'Pre-Construction',
        notes: '',
        persona_id: ''
    });

    const update = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        setSaving(true);

        if (isDemoMode()) {
            // Create a demo project and add it locally
            const newProject = {
                id: `demo-proj-${Date.now()}`,
                user_id: 'demo-user',
                company_id: null,
                name: form.name,
                status: 'CREATED' as const,
                address: form.address || null,
                style: form.style || null,
                stage: form.stage || null,
                notes: form.notes || null,
                persona_id: form.persona_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            // Add to demo projects array for this session
            DEMO_PROJECTS.push(newProject);
            await new Promise(r => setTimeout(r, 800)); // Simulate save
            router.push(`/visual-engine/${newProject.id}`);
            return;
        }

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const project = await res.json();
                router.push(`/visual-engine/${project.id}`);
            }
        } catch (err) {
            console.error(err);
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/visual-engine">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
                    <p className="text-white/40 text-sm">Set up a new build for AI visual marketing</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                        <Home className="w-3 h-3" />
                        Project / Subdivision Name *
                    </label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="e.g. 16454 108th Ave NE"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all placeholder:text-white/15"
                    />
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Property Address
                    </label>
                    <input
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        placeholder="e.g. Bothell, WA 98011"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all placeholder:text-white/15"
                    />
                </div>

                {/* Style + Stage Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Architectural Style */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                            <Ruler className="w-3 h-3" />
                            Architectural Style
                        </label>
                        <div className="relative">
                            <select
                                value={form.style}
                                onChange={(e) => update('style', e.target.value)}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pr-10 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                            >
                                <option value="" className="bg-[#111]">Select style...</option>
                                {STYLES.map(s => (
                                    <option key={s} value={s} className="bg-[#111]">{s}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                        </div>
                    </div>

                    {/* Construction Stage */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Construction Stage
                        </label>
                        <div className="relative">
                            <select
                                value={form.stage}
                                onChange={(e) => update('stage', e.target.value)}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pr-10 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all"
                            >
                                {STAGES.map(s => (
                                    <option key={s} value={s} className="bg-[#111]">{s}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                        <StickyNote className="w-3 h-3" />
                        Project Notes
                    </label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        placeholder="Specs, features, marketing angle... e.g. 4-bed, 3.5-bath, 3-car garage. Vaulted great room with floor-to-ceiling windows."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30 transition-all placeholder:text-white/15 resize-none leading-relaxed"
                    />
                </div>

                {/* Persona Selector */}
                <PersonaSelector
                    selectedId={form.persona_id}
                    onSelect={(id) => update('persona_id', id)}
                />

                {/* Submit */}
                <div className="pt-4 flex gap-4">
                    <Link href="/visual-engine" className="flex-1">
                        <Button type="button" variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-lg">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={saving || !form.name.trim()}
                        className="flex-[2] h-14 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-2xl text-lg font-bold shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] disabled:opacity-40"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating project...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Create Project & Start Generating
                            </span>
                        )}
                    </Button>
                </div>
            </form>

            {/* Quick Info */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 mt-8">
                <h3 className="font-bold text-sm text-amber-400 mb-2">💡 What happens next?</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                    After creating your project, you&apos;ll enter the <strong className="text-white/70">Command Center</strong> where you can
                    upload blueprints, generate AI renders in multiple styles, create walkthrough
                    videos, and build print-ready marketing flyers — all powered by AI.
                </p>
            </div>
        </div>
    );
}
