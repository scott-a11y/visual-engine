'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Mail, Lock, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            router.push('/visual-engine');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Invalid login credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />

            {/* Logo Section */}
            <div className="mb-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Visual Engine
                    </h1>
                    <p className="text-white/40 font-medium italic mt-1 uppercase tracking-widest text-[10px]">
                        The Premiere Suite by Chad Davis
                    </p>
                </div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full" />

                <h2 className="text-2xl font-bold mb-8 tracking-tight">Welcome back</h2>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.08] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Password</label>
                            <Link href="#" className="text-[10px] uppercase tracking-widest text-indigo-400 hover:text-indigo-300 font-bold">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/[0.08] transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] group"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <span className="flex items-center justify-center gap-2">
                                Access Dashboard
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/40 text-sm font-medium">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-white hover:text-indigo-400 transition-colors font-bold">
                            Request Access
                        </Link>
                    </p>
                </div>
            </div>

            {/* Footer Attribution */}
            <div className="mt-12 text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 pointer-events-none animate-in fade-in duration-1000 delay-500">
                Authorized Access Only <div className="w-1 h-1 rounded-full bg-white/20" /> Visual Engine v2.0
            </div>
        </div>
    );
}
