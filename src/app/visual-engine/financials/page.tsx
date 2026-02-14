'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PiggyBank,
    BarChart3,
    Percent,
    Home,
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
    Building2,
    Wallet,
    Target,
    Landmark,
    CircleDollarSign,
    Briefcase,
    Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { isDemoMode, DEMO_COMPANIES, DEMO_PROJECTS } from '@/lib/demo-data';

// ── Financial data types ───────────────────────────────────────────

interface ProjectFinancials {
    projectId: string;
    name: string;
    address: string | null;
    stage: string | null;
    purchasePrice: number;
    rehabBudget: number;
    totalInvested: number;
    arv: number;          // After Repair Value
    currentValue: number;
    roi: number;
    margin: number;
    profit: number;
    holdingCosts: number;
    daysOnMarket: number | null;
    status: 'active' | 'sold' | 'holding' | 'pre-construction';
}

interface PortfolioMetrics {
    totalInvested: number;
    totalCurrentValue: number;
    totalProfit: number;
    avgROI: number;
    avgMargin: number;
    projectCount: number;
    activeProjects: number;
    soldProjects: number;
    bestPerformer: string;
    worstPerformer: string;
    monthlyGrowth: number;
}

// ── Demo financial data ────────────────────────────────────────────

const DEMO_FINANCIALS: ProjectFinancials[] = [
    {
        projectId: 'demo-proj-001',
        name: '16454 108th Ave NE',
        address: 'Bothell, WA 98011',
        stage: 'Pre-Construction',
        purchasePrice: 425000,
        rehabBudget: 380000,
        totalInvested: 805000,
        arv: 1250000,
        currentValue: 1180000,
        roi: 46.6,
        margin: 31.8,
        profit: 375000,
        holdingCosts: 18500,
        daysOnMarket: null,
        status: 'active',
    },
    {
        projectId: 'demo-proj-002',
        name: 'Skyline Ridge Estates',
        address: 'Snoqualmie, WA 98065',
        stage: 'Under Construction',
        purchasePrice: 1850000,
        rehabBudget: 2400000,
        totalInvested: 4250000,
        arv: 7200000,
        currentValue: 5800000,
        roi: 36.5,
        margin: 26.7,
        profit: 1550000,
        holdingCosts: 84000,
        daysOnMarket: null,
        status: 'active',
    },
    {
        projectId: 'demo-proj-003',
        name: 'Cedar Valley Custom',
        address: 'Woodinville, WA 98072',
        stage: 'Pre-Sale',
        purchasePrice: 380000,
        rehabBudget: 290000,
        totalInvested: 670000,
        arv: 985000,
        currentValue: 985000,
        roi: 47.0,
        margin: 32.0,
        profit: 315000,
        holdingCosts: 12200,
        daysOnMarket: 18,
        status: 'sold',
    },
    {
        projectId: 'fin-proj-004',
        name: 'Maple Leaf Duplex',
        address: 'Seattle, WA 98115',
        stage: 'Holding',
        purchasePrice: 520000,
        rehabBudget: 185000,
        totalInvested: 705000,
        arv: 1100000,
        currentValue: 1050000,
        roi: 48.9,
        margin: 32.8,
        profit: 345000,
        holdingCosts: 6800,
        daysOnMarket: null,
        status: 'holding',
    },
    {
        projectId: 'fin-proj-005',
        name: 'Greenlake Renovation',
        address: 'Seattle, WA 98103',
        stage: 'Sold',
        purchasePrice: 695000,
        rehabBudget: 210000,
        totalInvested: 905000,
        arv: 1320000,
        currentValue: 1295000,
        roi: 43.1,
        margin: 30.1,
        profit: 390000,
        holdingCosts: 14200,
        daysOnMarket: 12,
        status: 'sold',
    },
];

function computePortfolioMetrics(projects: ProjectFinancials[]): PortfolioMetrics {
    const totalInvested = projects.reduce((s, p) => s + p.totalInvested, 0);
    const totalCurrentValue = projects.reduce((s, p) => s + p.currentValue, 0);
    const totalProfit = projects.reduce((s, p) => s + p.profit, 0);
    const avgROI = projects.reduce((s, p) => s + p.roi, 0) / projects.length;
    const avgMargin = projects.reduce((s, p) => s + p.margin, 0) / projects.length;
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'pre-construction').length;
    const soldProjects = projects.filter(p => p.status === 'sold').length;
    const sorted = [...projects].sort((a, b) => b.roi - a.roi);
    return {
        totalInvested,
        totalCurrentValue,
        totalProfit,
        avgROI,
        avgMargin,
        projectCount: projects.length,
        activeProjects,
        soldProjects,
        bestPerformer: sorted[0]?.name || '',
        worstPerformer: sorted[sorted.length - 1]?.name || '',
        monthlyGrowth: 3.2,
    };
}

function formatCurrency(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e',
    sold: '#3b82f6',
    holding: '#a855f7',
    'pre-construction': '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    sold: 'Sold',
    holding: 'Holding',
    'pre-construction': 'Pre-Con',
};

export default function FinancialsPage() {
    const [user, setUser] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const supabase = createClient();
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

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

    const filtered = filterStatus === 'all'
        ? DEMO_FINANCIALS
        : DEMO_FINANCIALS.filter(p => p.status === filterStatus);

    const metrics = useMemo(() => computePortfolioMetrics(DEMO_FINANCIALS), []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hub">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <DollarSign className="w-7 h-7" style={{ color: brandColor }} />
                            Financial Dashboard
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Portfolio ROI, project values & profit margins</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="rounded-full border-white/10 text-white/50 hover:text-white"
                >
                    <Calculator className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Portfolio KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {[
                    { label: 'Total Invested', value: formatCurrency(metrics.totalInvested), icon: Wallet, color: '#f59e0b', sub: `${metrics.projectCount} projects` },
                    { label: 'Current Value', value: formatCurrency(metrics.totalCurrentValue), icon: Landmark, color: '#22c55e', sub: `+${metrics.monthlyGrowth}% /mo` },
                    { label: 'Total Profit', value: formatCurrency(metrics.totalProfit), icon: PiggyBank, color: '#3b82f6', sub: `${metrics.soldProjects} sold` },
                    { label: 'Avg ROI', value: `${metrics.avgROI.toFixed(1)}%`, icon: TrendingUp, color: '#22c55e', sub: 'across portfolio' },
                    { label: 'Avg Margin', value: `${metrics.avgMargin.toFixed(1)}%`, icon: Percent, color: '#a855f7', sub: 'profit margin' },
                    { label: 'Active Projects', value: `${metrics.activeProjects}`, icon: Building2, color: '#f97316', sub: `${metrics.projectCount - metrics.activeProjects} completed` },
                ].map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{kpi.label}</p>
                            </div>
                            <p className="text-xl font-bold">{kpi.value}</p>
                            <p className="text-[10px] text-white/30 mt-1">{kpi.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Allocation + Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Allocation Chart (CSS Bar) */}
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-white/40" />
                        Capital Allocation
                    </h3>
                    <p className="text-[10px] text-white/30 mb-6">By project — total {formatCurrency(metrics.totalInvested)}</p>
                    <div className="space-y-4">
                        {DEMO_FINANCIALS.map(proj => {
                            const pct = (proj.totalInvested / metrics.totalInvested) * 100;
                            return (
                                <div key={proj.projectId}>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-white/60 truncate max-w-[60%]">{proj.name}</span>
                                        <span className="font-mono text-white/40">{formatCurrency(proj.totalInvested)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: STATUS_COLORS[proj.status] || brandColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ROI Leaderboard */}
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        <Target className="w-4 h-4 text-white/40" />
                        ROI Leaderboard
                    </h3>
                    <p className="text-[10px] text-white/30 mb-6">Ranked by return on investment</p>
                    <div className="space-y-3">
                        {[...DEMO_FINANCIALS].sort((a, b) => b.roi - a.roi).map((proj, i) => (
                            <div key={proj.projectId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                                    style={{
                                        backgroundColor: i === 0 ? `${brandColor}30` : 'rgba(255,255,255,0.05)',
                                        color: i === 0 ? brandColor : 'rgba(255,255,255,0.4)',
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{proj.name}</p>
                                    <p className="text-[10px] text-white/30">{formatCurrency(proj.profit)} profit</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                                    <span className="text-sm font-bold text-emerald-400">{proj.roi.toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profit Breakdown */}
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
                    <h3 className="font-bold mb-1 flex items-center gap-2">
                        <CircleDollarSign className="w-4 h-4 text-white/40" />
                        Profit Analysis
                    </h3>
                    <p className="text-[10px] text-white/30 mb-6">Purchase vs Rehab vs Profit</p>
                    <div className="space-y-4">
                        {DEMO_FINANCIALS.map(proj => {
                            const total = proj.currentValue;
                            const purchasePct = (proj.purchasePrice / total) * 100;
                            const rehabPct = (proj.rehabBudget / total) * 100;
                            const profitPct = (proj.profit / total) * 100;
                            return (
                                <div key={proj.projectId}>
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-white/60 truncate max-w-[60%]">{proj.name}</span>
                                        <span className="font-mono text-emerald-400/60">{proj.margin.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
                                        <div className="h-full bg-amber-500/70" style={{ width: `${purchasePct}%` }} title={`Purchase: ${formatCurrency(proj.purchasePrice)}`} />
                                        <div className="h-full bg-blue-500/70" style={{ width: `${rehabPct}%` }} title={`Rehab: ${formatCurrency(proj.rehabBudget)}`} />
                                        <div className="h-full bg-emerald-500/70" style={{ width: `${profitPct}%` }} title={`Profit: ${formatCurrency(proj.profit)}`} />
                                    </div>
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/70" /><span className="text-[9px] text-white/30">Purchase</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" /><span className="text-[9px] text-white/30">Rehab</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /><span className="text-[9px] text-white/30">Profit</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2">
                {['all', 'active', 'sold', 'holding', 'pre-construction'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterStatus === status
                                ? 'text-black'
                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                        style={filterStatus === status ? { backgroundColor: brandColor } : undefined}
                    >
                        {status === 'all' ? `All (${DEMO_FINANCIALS.length})` : `${STATUS_LABELS[status] || status} (${DEMO_FINANCIALS.filter(p => p.status === status).length})`}
                    </button>
                ))}
            </div>

            {/* Project Detail Table */}
            <div className="space-y-3">
                {filtered.map(proj => {
                    const isExpanded = expandedProject === proj.projectId;
                    const statusColor = STATUS_COLORS[proj.status] || '#94a3b8';
                    return (
                        <div
                            key={proj.projectId}
                            className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden transition-all"
                        >
                            {/* Row */}
                            <button
                                onClick={() => setExpandedProject(isExpanded ? null : proj.projectId)}
                                className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${statusColor}20` }}
                                >
                                    <Home className="w-4 h-4" style={{ color: statusColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm truncate">{proj.name}</h4>
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                                            style={{ color: statusColor, backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}30` }}
                                        >
                                            {STATUS_LABELS[proj.status]}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/30">{proj.address}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[9px] text-white/20 uppercase">Invested</p>
                                        <p className="text-sm font-mono font-bold">{formatCurrency(proj.totalInvested)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-white/20 uppercase">Value</p>
                                        <p className="text-sm font-mono font-bold">{formatCurrency(proj.currentValue)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-white/20 uppercase">Profit</p>
                                        <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(proj.profit)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-white/20 uppercase">ROI</p>
                                        <p className="text-sm font-bold text-emerald-400">{proj.roi.toFixed(1)}%</p>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-white/20 shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-white/20 shrink-0" />
                                )}
                            </button>

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-0 border-t border-white/5">
                                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                                        {[
                                            { label: 'Purchase Price', value: formatCurrency(proj.purchasePrice) },
                                            { label: 'Rehab Budget', value: formatCurrency(proj.rehabBudget) },
                                            { label: 'Total Invested', value: formatCurrency(proj.totalInvested) },
                                            { label: 'ARV', value: formatCurrency(proj.arv) },
                                            { label: 'Current Value', value: formatCurrency(proj.currentValue) },
                                            { label: 'Net Profit', value: formatCurrency(proj.profit), color: '#22c55e' },
                                            { label: 'Holding Costs', value: formatCurrency(proj.holdingCosts) },
                                            { label: 'ROI', value: `${proj.roi.toFixed(1)}%`, color: '#22c55e' },
                                            { label: 'Margin', value: `${proj.margin.toFixed(1)}%`, color: '#a855f7' },
                                            { label: 'Stage', value: proj.stage || 'N/A' },
                                            { label: 'Days on Market', value: proj.daysOnMarket !== null ? `${proj.daysOnMarket}` : '—' },
                                            { label: 'Status', value: STATUS_LABELS[proj.status] || proj.status },
                                        ].map(item => (
                                            <div key={item.label} className="p-3 rounded-xl bg-white/5">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">{item.label}</p>
                                                <p className="text-sm font-bold" style={{ color: (item as any).color || undefined }}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Profit vs Cost Visual */}
                                    <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-3">Investment Breakdown</p>
                                        <div className="h-6 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-amber-500/60 flex items-center justify-center text-[9px] font-bold" style={{ width: `${(proj.purchasePrice / proj.currentValue) * 100}%` }}>
                                                {((proj.purchasePrice / proj.currentValue) * 100).toFixed(0)}%
                                            </div>
                                            <div className="h-full bg-blue-500/60 flex items-center justify-center text-[9px] font-bold" style={{ width: `${(proj.rehabBudget / proj.currentValue) * 100}%` }}>
                                                {((proj.rehabBudget / proj.currentValue) * 100).toFixed(0)}%
                                            </div>
                                            <div className="h-full bg-emerald-500/60 flex items-center justify-center text-[9px] font-bold" style={{ width: `${(proj.profit / proj.currentValue) * 100}%` }}>
                                                {((proj.profit / proj.currentValue) * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 mt-2">
                                            <span className="text-[9px] text-white/30 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/60" />Purchase</span>
                                            <span className="text-[9px] text-white/30 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/60" />Rehab</span>
                                            <span className="text-[9px] text-white/30 flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" />Profit</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
