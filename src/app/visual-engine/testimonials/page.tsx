'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Star,
    Quote,
    Plus,
    Trash2,
    Edit3,
    X,
    CheckCircle2,
    User,
    Building2,
    MessageSquareQuote,
    ExternalLink,
    Save,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES, DEMO_PROJECTS } from '@/lib/demo-data';

// ── Types ──────────────────────────────────────────────────────────

interface Testimonial {
    id: string;
    name: string;
    role: 'investor' | 'homeowner' | 'partner' | 'agent' | 'contractor';
    company: string;
    quote: string;
    rating: number;
    projectName: string;
    featured: boolean;
    createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
    investor: 'Investor',
    homeowner: 'Homeowner',
    partner: 'Partner',
    agent: 'Real Estate Agent',
    contractor: 'Contractor',
};

const ROLE_COLORS: Record<string, string> = {
    investor: '#22c55e',
    homeowner: '#3b82f6',
    partner: '#a855f7',
    agent: '#f59e0b',
    contractor: '#f97316',
};

// ── Seed testimonials ──────────────────────────────────────────────

const SEED_TESTIMONIALS: Testimonial[] = [
    {
        id: 't1',
        name: 'Michael Chen',
        role: 'investor',
        company: 'Pacific Growth Capital',
        quote: 'Working with this team has been exceptional. They delivered our Bothell project on time and under budget. The quality of craftsmanship exceeds anything else in the market. Our ROI has consistently outperformed projections.',
        rating: 5,
        projectName: '16454 108th Ave NE',
        featured: true,
        createdAt: '2025-11-15',
    },
    {
        id: 't2',
        name: 'Sarah Williams',
        role: 'homeowner',
        company: '',
        quote: 'From the initial visualization to the final walkthrough, every detail was considered. Our Cedar Valley home is everything we dreamed of and more. The AI-powered rendering system let us see our home before ground was even broken.',
        rating: 5,
        projectName: 'Cedar Valley Custom',
        featured: true,
        createdAt: '2025-09-22',
    },
    {
        id: 't3',
        name: 'David Park',
        role: 'partner',
        company: 'Cascadia Development Group',
        quote: 'The Skyline Ridge development is a testament to thoughtful design and market intelligence. Returns are exceeding our projections by 12%. Their use of technology for pre-sales visualization is a game changer.',
        rating: 5,
        projectName: 'Skyline Ridge Estates',
        featured: true,
        createdAt: '2026-01-08',
    },
    {
        id: 't4',
        name: 'Jennifer Torres',
        role: 'agent',
        company: 'Compass Real Estate',
        quote: 'The share links and visual engine have completely transformed how I present pre-construction to buyers. My clients get a luxury experience before the first nail is driven. Close rates are up 30%.',
        rating: 5,
        projectName: 'Greenlake Renovation',
        featured: false,
        createdAt: '2025-12-14',
    },
    {
        id: 't5',
        name: 'Robert Kim',
        role: 'contractor',
        company: 'Pinnacle Builders NW',
        quote: 'The plan analysis tool has saved us countless hours in the estimation phase. We get accurate room breakdowns and material lists before we even visit the site. Integration with our workflow has been seamless.',
        rating: 4,
        projectName: 'Maple Leaf Duplex',
        featured: false,
        createdAt: '2025-10-30',
    },
];

export default function TestimonialsPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const supabase = createClient();

    const [testimonials, setTestimonials] = useState<Testimonial[]>(SEED_TESTIMONIALS);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterRole, setFilterRole] = useState<string>('all');

    // Form state
    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState<string>('homeowner');
    const [formCompany, setFormCompany] = useState('');
    const [formQuote, setFormQuote] = useState('');
    const [formRating, setFormRating] = useState(5);
    const [formProject, setFormProject] = useState('');
    const [formFeatured, setFormFeatured] = useState(false);

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

    const resetForm = () => {
        setFormName('');
        setFormRole('homeowner');
        setFormCompany('');
        setFormQuote('');
        setFormRating(5);
        setFormProject('');
        setFormFeatured(false);
        setEditingId(null);
    };

    const handleSubmit = () => {
        if (!formName || !formQuote) return;

        if (editingId) {
            setTestimonials(prev => prev.map(t =>
                t.id === editingId
                    ? { ...t, name: formName, role: formRole as any, company: formCompany, quote: formQuote, rating: formRating, projectName: formProject, featured: formFeatured }
                    : t
            ));
        } else {
            const newT: Testimonial = {
                id: `t-${Date.now()}`,
                name: formName,
                role: formRole as any,
                company: formCompany,
                quote: formQuote,
                rating: formRating,
                projectName: formProject,
                featured: formFeatured,
                createdAt: new Date().toISOString().split('T')[0],
            };
            setTestimonials(prev => [newT, ...prev]);
        }

        setShowForm(false);
        resetForm();
    };

    const handleEdit = (t: Testimonial) => {
        setFormName(t.name);
        setFormRole(t.role);
        setFormCompany(t.company);
        setFormQuote(t.quote);
        setFormRating(t.rating);
        setFormProject(t.projectName);
        setFormFeatured(t.featured);
        setEditingId(t.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setTestimonials(prev => prev.filter(t => t.id !== id));
    };

    const toggleFeatured = (id: string) => {
        setTestimonials(prev => prev.map(t =>
            t.id === id ? { ...t, featured: !t.featured } : t
        ));
    };

    const filtered = filterRole === 'all'
        ? testimonials
        : testimonials.filter(t => t.role === filterRole);

    const featuredCount = testimonials.filter(t => t.featured).length;
    const avgRating = (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1);

    // Generate portfolio slug from company name
    const portfolioSlug = company?.name
        ? company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
        : 'demo';

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
                            <MessageSquareQuote className="w-7 h-7" style={{ color: brandColor }} />
                            Testimonials
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Social proof for your public portfolio</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/portfolio/${portfolioSlug}`} target="_blank">
                        <Button variant="outline" className="rounded-full border-white/10 text-white/50 hover:text-white">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Portfolio
                        </Button>
                    </Link>
                    <Button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="rounded-full px-6 font-bold text-black"
                        style={{ backgroundColor: brandColor }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Testimonial
                    </Button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: testimonials.length.toString(), icon: MessageSquareQuote, color: brandColor },
                    { label: 'Featured', value: featuredCount.toString(), icon: Star, color: '#f59e0b' },
                    { label: 'Avg Rating', value: avgRating, icon: Star, color: '#22c55e' },
                    { label: 'Client Types', value: new Set(testimonials.map(t => t.role)).size.toString(), icon: User, color: '#a855f7' },
                ].map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="p-5 rounded-3xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{kpi.label}</span>
                            </div>
                            <p className="text-2xl font-bold">{kpi.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {['all', 'investor', 'homeowner', 'partner', 'agent', 'contractor'].map(role => {
                    const count = role === 'all' ? testimonials.length : testimonials.filter(t => t.role === role).length;
                    if (count === 0 && role !== 'all') return null;
                    return (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${filterRole === role
                                    ? 'text-black'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                            style={filterRole === role ? { backgroundColor: brandColor } : undefined}
                        >
                            {role === 'all' ? 'All' : ROLE_LABELS[role] || role} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(t => {
                    const roleColor = ROLE_COLORS[t.role] || '#94a3b8';
                    return (
                        <div
                            key={t.id}
                            className={`rounded-3xl border bg-white/5 p-6 space-y-4 relative group transition-all ${t.featured ? 'border-amber-500/20' : 'border-white/10'
                                }`}
                        >
                            {/* Featured Badge */}
                            {t.featured && (
                                <div className="absolute -top-2 -right-2">
                                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                        <Star className="w-3 h-3 text-black fill-black" />
                                    </div>
                                </div>
                            )}

                            {/* Actions overlay */}
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => toggleFeatured(t.id)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                    title={t.featured ? 'Unfeature' : 'Feature'}
                                >
                                    <Star className={`w-3 h-3 ${t.featured ? 'fill-amber-400 text-amber-400' : 'text-white/30'}`} />
                                </button>
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <Edit3 className="w-3 h-3 text-white/30" />
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" />
                                </button>
                            </div>

                            {/* Quote icon */}
                            <Quote className="w-6 h-6" style={{ color: `${brandColor}20` }} />

                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`}
                                    />
                                ))}
                            </div>

                            {/* Quote text */}
                            <p className="text-sm text-white/60 leading-relaxed italic line-clamp-4">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
                                >
                                    {t.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold">{t.name}</p>
                                    <p className="text-[10px] text-white/30">
                                        <span style={{ color: roleColor }}>{ROLE_LABELS[t.role]}</span>
                                        {t.company && ` · ${t.company}`}
                                    </p>
                                </div>
                            </div>

                            {t.projectName && (
                                <div className="flex items-center gap-1.5 text-[10px] text-white/20">
                                    <Building2 className="w-3 h-3" />
                                    <span>{t.projectName}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300"
                    onClick={() => { setShowForm(false); resetForm(); }}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Name</label>
                                    <input
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20"
                                        placeholder="John Smith"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Role</label>
                                    <select
                                        value={formRole}
                                        onChange={e => setFormRole(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20"
                                    >
                                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k} className="bg-[#0a0a0a]">{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Company</label>
                                    <input
                                        value={formCompany}
                                        onChange={e => setFormCompany(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Project</label>
                                    <input
                                        value={formProject}
                                        onChange={e => setFormProject(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20"
                                        placeholder="Project name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Quote</label>
                                <textarea
                                    value={formQuote}
                                    onChange={e => setFormQuote(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-white/20 resize-none"
                                    placeholder="Their testimonial..."
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Rating</label>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <button key={i} onClick={() => setFormRating(i + 1)}>
                                                <Star className={`w-5 h-5 transition-colors ${i < formRating ? 'fill-amber-400 text-amber-400' : 'text-white/10 hover:text-white/30'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Featured</label>
                                    <button
                                        onClick={() => setFormFeatured(!formFeatured)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${formFeatured ? '' : 'bg-white/10'}`}
                                        style={formFeatured ? { backgroundColor: brandColor } : undefined}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formFeatured ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!formName || !formQuote}
                            className="w-full rounded-xl font-bold h-12 text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {editingId ? 'Save Changes' : 'Add Testimonial'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
