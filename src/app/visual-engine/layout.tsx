'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Hammer,
    ImageIcon,
    FileSearch,
    Box
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo-data';
import { getCompanyBranding } from '@/lib/services/brand-service';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function VisualEngineLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        async function initAuth() {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);

            const companyId = currentUser?.user_metadata?.company_id;
            const branding = await getCompanyBranding(companyId);
            setCompany(branding);
        }
        initAuth();
    }, [supabase, router]);

    const navItems = [
        { href: '/hub', label: 'Hub', icon: LayoutDashboard },
        { href: '/visual-engine', label: 'Projects', icon: LayoutDashboard },
        { href: '/visual-engine/analyze', label: 'Plan Analyzer', icon: FileSearch },
        { href: '/visual-engine/model', label: '3D Model', icon: Box },
        { href: '/visual-engine/branding', label: 'Brand Center', icon: ImageIcon },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const branding = company?.name || 'Active Workspace';
    const brandColor = company?.primary_color || '#f59e0b';

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
            {/* Premium Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" style={{ backgroundColor: `${brandColor}10` }} />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/hub" className="flex items-center gap-3 group">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"
                            style={{ backgroundColor: brandColor, boxShadow: `0 0 20px ${brandColor}40` }}
                        >
                            {company?.logo_url ? (
                                <img src={company.logo_url} alt={branding} className="w-5 h-5 object-contain" />
                            ) : (
                                <Hammer className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent leading-tight">
                                {branding}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                                Command Center
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pathname === item.href
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-xs text-white/40">{user?.email}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-white/60 hover:text-white hover:bg-white/5"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </Button>
                    </div>

                    {/* Mobile: Email + Menu Toggle */}
                    <div className="md:hidden flex items-center gap-3">
                        <span className="text-[10px] text-white/40 truncate max-w-[140px]">{user?.email}</span>
                        <button
                            className="p-2 text-white/60"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-2xl md:hidden pt-20 px-6">
                    <nav className="flex flex-col gap-4">
                        {/* User info */}
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mb-2">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                                {user?.email?.[0]?.toUpperCase() || 'C'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{user?.user_metadata?.full_name || 'Project Lead'}</p>
                                <p className="text-[11px] text-white/40">{user?.email}</p>
                            </div>
                        </div>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 text-lg font-medium p-4 rounded-2xl bg-white/5"
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 text-lg font-medium p-4 rounded-2xl bg-red-500/10 text-red-400"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
