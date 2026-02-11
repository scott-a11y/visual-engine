'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Sparkles, MapPin, Palette, Layout, FileText, Plus, ChevronRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';

export default function NewProjectPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        companyId: '',
        address: '',
        style: 'Modern Farmhouse',
        stage: 'Pre-sale',
        notes: ''
    });

    useEffect(() => {
        async function fetchCompanies() {
            const res = await fetch('/api/companies');
            const data = await res.json();
            setCompanies(data || []);
            if (data?.length > 0) {
                setFormData(prev => ({ ...prev, companyId: data[0].id }));
            }
        }
        fetchCompanies();
    }, []);

    const styles = [
        'Modern Farmhouse',
        'Contemporary',
        'Traditional',
        'Industrial',
        'Scandinavian',
        'Custom'
    ];

    const stages = [
        'Pre-sale',
        'Under Construction',
        'Completed',
        'Maintenance'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create project');
            }

            const project = await res.json();
            router.push(`/visual-engine/${project.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/visual-engine">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white/60">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
            </div>

            {/* Form Card */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-600/5 blur-[100px]" />

                <form onSubmit={handleSubmit} className="relative space-y-10">

                    {/* Main Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                                <Home className="w-4 h-4" />
                                Subdivision / Project Name
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Oakwood Estates Phase 1"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.08] transition-all"
                            />
                        </div>

                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                                <Building2 className="w-4 h-4" />
                                Builder / Company Profile
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={formData.companyId}
                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                                >
                                    {companies.length === 0 ? (
                                        <option value="">No companies found - Create one in Brand Center</option>
                                    ) : (
                                        companies.map(c => <option key={c.id} value={c.id} className="bg-neutral-900">{c.name}</option>)
                                    )}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                                <MapPin className="w-4 h-4" />
                                Full Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="e.g. 123 Pine St, Olympia WA 98501"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.08] transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                                <Palette className="w-4 h-4" />
                                Architecture Style
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.style}
                                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                                >
                                    {styles.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                    <Layout className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                                <Sparkles className="w-4 h-4" />
                                Project Stage
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                                >
                                    {stages.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40">
                            <FileText className="w-4 h-4" />
                            Internal Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional context for your team..."
                            className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
                        >
                            {loading ? <Loading size="lg" className="border-black" /> : (
                                <span className="flex items-center justify-center gap-3">
                                    Initialize Project
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
