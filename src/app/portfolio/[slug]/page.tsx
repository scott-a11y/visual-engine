'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    MapPin,
    ExternalLink,
    Mail,
    Phone,
    Globe,
    Home,
    TrendingUp,
    Calendar,
    CheckCircle2,
    Star,
    Quote,
    Hammer,
    ArrowUpRight,
    ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, DEMO_COMPANIES, DEMO_PROJECTS } from '@/lib/demo-data';
import { Loading } from '@/components/ui/loading';
import type { Project, Company } from '@/lib/types/database';

// ── Demo portfolio data ────────────────────────────────────────────

interface PortfolioProject {
    id: string;
    name: string;
    address: string;
    style: string;
    stage: string;
    imageUrl: string;
    sqft: number;
    beds: number;
    baths: number;
    year: number;
}

interface Testimonial {
    id: string;
    name: string;
    role: string;
    quote: string;
    rating: number;
    projectName: string;
    avatar: string;
}

const DEMO_PORTFOLIO_PROJECTS: PortfolioProject[] = [
    {
        id: '1',
        name: '16454 108th Ave NE',
        address: 'Bothell, WA 98011',
        style: 'Modern Farmhouse',
        stage: 'Pre-Construction',
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        sqft: 3800,
        beds: 4,
        baths: 3.5,
        year: 2026,
    },
    {
        id: '2',
        name: 'Skyline Ridge Estates',
        address: 'Snoqualmie, WA 98065',
        style: 'Northwest Contemporary',
        stage: 'Under Construction',
        imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        sqft: 4200,
        beds: 5,
        baths: 4,
        year: 2026,
    },
    {
        id: '3',
        name: 'Cedar Valley Custom',
        address: 'Woodinville, WA 98072',
        style: 'Craftsman',
        stage: 'Completed',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        sqft: 3200,
        beds: 4,
        baths: 3,
        year: 2025,
    },
    {
        id: '4',
        name: 'Greenlake Renovation',
        address: 'Seattle, WA 98103',
        style: 'Modern',
        stage: 'Completed',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        sqft: 2800,
        beds: 3,
        baths: 2.5,
        year: 2025,
    },
    {
        id: '5',
        name: 'Maple Leaf Duplex',
        address: 'Seattle, WA 98115',
        style: 'Contemporary',
        stage: 'Completed',
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        sqft: 2400,
        beds: 3,
        baths: 2,
        year: 2024,
    },
    {
        id: '6',
        name: 'Kirkland Waterfront',
        address: 'Kirkland, WA 98033',
        style: 'Northwest Contemporary',
        stage: 'Completed',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        sqft: 5100,
        beds: 5,
        baths: 4.5,
        year: 2024,
    },
];

const DEMO_TESTIMONIALS: Testimonial[] = [
    {
        id: 't1',
        name: 'Michael Chen',
        role: 'Investor',
        quote: 'Working with this team has been exceptional. They delivered our Bothell project on time and under budget. The quality of craftsmanship exceeds anything else in the market.',
        rating: 5,
        projectName: '16454 108th Ave NE',
        avatar: 'MC',
    },
    {
        id: 't2',
        name: 'Sarah Williams',
        role: 'Homeowner',
        quote: 'From the initial visualization to the final walkthrough, every detail was considered. Our Cedar Valley home is everything we dreamed of and more.',
        rating: 5,
        projectName: 'Cedar Valley Custom',
        avatar: 'SW',
    },
    {
        id: 't3',
        name: 'David Park',
        role: 'Investment Partner',
        quote: 'The Skyline Ridge development is a testament to thoughtful design and market intelligence. Returns are exceeding our projections by 12%.',
        rating: 5,
        projectName: 'Skyline Ridge Estates',
        avatar: 'DP',
    },
];

export default function PublicPortfolioPage() {
    const { slug } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchPortfolio() {
            setLoading(true);

            if (isDemoMode()) {
                // Match slug to demo companies
                const match = DEMO_COMPANIES.find(c =>
                    c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') === slug ||
                    c.id === slug
                );
                setCompany(match || DEMO_COMPANIES[0]);
            } else {
                // Look up by slug-style match
                const { data } = await supabase
                    .from('companies')
                    .select('*')
                    .limit(10);
                if (data && data.length > 0) {
                    const match = data.find((c: any) =>
                        c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') === slug
                    );
                    setCompany(match || data[0]);
                }
            }
            setLoading(false);
        }
        fetchPortfolio();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loading size="lg" />
        </div>
    );

    if (!company) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40">
            Portfolio not found.
        </div>
    );

    const brandColor = company.primary_color || '#f59e0b';
    const completed = DEMO_PORTFOLIO_PROJECTS.filter(p => p.stage === 'Completed').length;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: `radial-gradient(ellipse at 30% 20%, ${brandColor}40, transparent 60%), radial-gradient(ellipse at 70% 80%, ${brandColor}20, transparent 50%)`,
                    }}
                />
                <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                                    style={{ backgroundColor: brandColor, color: '#000' }}
                                >
                                    {company.name.charAt(0)}
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Portfolio</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">{company.name}</h1>
                            <p className="text-lg text-white/40 max-w-xl">
                                Premium residential construction & renovation in the Pacific Northwest.
                                {completed > 0 && ` ${completed} completed projects delivered.`}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {company.website && (
                                <a
                                    href={`https://${company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm"
                                >
                                    <Globe className="w-4 h-4" style={{ color: brandColor }} />
                                    {company.website}
                                </a>
                            )}
                            {company.contact_email && (
                                <a
                                    href={`mailto:${company.contact_email}`}
                                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm"
                                >
                                    <Mail className="w-4 h-4" style={{ color: brandColor }} />
                                    {company.contact_email}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        {[
                            { label: 'Projects', value: DEMO_PORTFOLIO_PROJECTS.length.toString(), icon: Home },
                            { label: 'Completed', value: completed.toString(), icon: CheckCircle2 },
                            { label: 'Total SF Built', value: `${(DEMO_PORTFOLIO_PROJECTS.reduce((s, p) => s + p.sqft, 0) / 1000).toFixed(0)}K+`, icon: TrendingUp },
                            { label: 'Years Active', value: '4+', icon: Calendar },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                    <Icon className="w-4 h-4 mb-2" style={{ color: brandColor }} />
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Project Gallery */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold">Featured Projects</h2>
                    <span className="text-xs text-white/30">{DEMO_PORTFOLIO_PROJECTS.length} properties</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {DEMO_PORTFOLIO_PROJECTS.map(project => (
                        <div
                            key={project.id}
                            className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden group hover:border-white/20 transition-all"
                        >
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img
                                    src={project.imageUrl}
                                    alt={project.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-3 left-3 flex gap-1.5">
                                    <span
                                        className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md"
                                        style={{
                                            backgroundColor: project.stage === 'Completed' ? 'rgba(34,197,94,0.2)' : `${brandColor}20`,
                                            color: project.stage === 'Completed' ? '#22c55e' : brandColor,
                                            border: `1px solid ${project.stage === 'Completed' ? 'rgba(34,197,94,0.3)' : brandColor + '30'}`,
                                        }}
                                    >
                                        {project.stage}
                                    </span>
                                </div>
                                <div className="absolute bottom-3 right-3">
                                    <span className="px-2 py-1 rounded-full text-[9px] font-bold bg-black/60 backdrop-blur-md text-white/60">
                                        {project.year}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div>
                                    <h3 className="font-bold text-sm">{project.name}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3 text-white/30" />
                                        <span className="text-[11px] text-white/30">{project.address}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-white/40">
                                    <span className="px-2 py-0.5 rounded-full bg-white/5">{project.style}</span>
                                    <span>{project.sqft.toLocaleString()} SF</span>
                                    <span>{project.beds} BD / {project.baths} BA</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Testimonials */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold mb-8">What People Say</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {DEMO_TESTIMONIALS.map(t => (
                        <div
                            key={t.id}
                            className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 relative"
                        >
                            <Quote className="w-8 h-8 absolute top-5 right-5" style={{ color: `${brandColor}20` }} />
                            <div className="flex items-center gap-1">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                                >
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-xs font-bold">{t.name}</p>
                                    <p className="text-[10px] text-white/30">{t.role} — {t.projectName}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div
                    className="rounded-[2.5rem] p-12 text-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${brandColor}20, transparent)`, border: `1px solid ${brandColor}20` }}
                >
                    <h2 className="text-3xl font-bold mb-3">Ready to Build?</h2>
                    <p className="text-white/40 max-w-md mx-auto mb-8">
                        Start a conversation about your next project. From vision to construction, we bring your architectural dreams to life.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {company.contact_email && (
                            <a
                                href={`mailto:${company.contact_email}`}
                                className="px-8 py-4 rounded-full font-bold text-black transition-all hover:scale-105"
                                style={{ backgroundColor: brandColor }}
                            >
                                <Mail className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                                Get in Touch
                            </a>
                        )}
                        {company.contact_phone && (
                            <a
                                href={`tel:${company.contact_phone}`}
                                className="px-8 py-4 rounded-full font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                <Phone className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                                {company.contact_phone}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-white/20">
                    <span>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</span>
                    <span>Powered by Visual Engine</span>
                </div>
            </div>
        </div>
    );
}
