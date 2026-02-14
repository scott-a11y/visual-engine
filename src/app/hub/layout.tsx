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
    Activity,
    Compass,
    ImageIcon
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, DEMO_USER, DEMO_COMPANIES } from '@/lib/demo-data';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function HubLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        async function getUser() {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                router.push('/login');
                return;
            }
            setUser(currentUser);
        }
        getUser();
    }, [supabase, router]);

    const navItems = [
        { href: '/hub', label: 'Hub', icon: Activity },
        { href: '/visual-engine', label: 'Projects', icon: Compass },
        { href: '/visual-engine/branding', label: 'Branding', icon: ImageIcon },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const companyId = user?.user_metadata?.company_id;
    const company = isDemoMode()
        ? DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0]
        : null; // Would fetch from DB in production

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
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${pathname === item.href
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user?.email}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl h-9"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-white/60"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-2xl md:hidden pt-20 px-6">
                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 text-lg font-medium p-4 rounded-3xl bg-white/5 border border-white/5"
                            >
                                <item.icon className="w-5 h-5 text-amber-500" />
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 text-lg font-medium p-4 rounded-3xl bg-red-500/10 text-red-400 border border-red-500/10"
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
