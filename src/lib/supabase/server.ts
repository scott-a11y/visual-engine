import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../types/database';

const noopResponse = { data: null, error: { message: 'Supabase not configured' } };
const noopChain = (): any => ({ select: noopChain, single: noopChain, eq: noopChain, order: noopChain, insert: noopChain, update: noopChain, delete: noopChain, filter: noopChain, ...noopResponse });

const stubClient = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => noopResponse,
        signUp: async () => noopResponse,
        signOut: async () => ({ error: null }),
    },
    from: () => noopChain(),
} as any;

export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        console.warn('⚠️ Server: Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local');
        return stubClient;
    }

    const cookieStore = await cookies();

    return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            cookieStore.set(name, value, options);
                        }
                    } catch {
                        // Read-only context
                    }
                },
            },
        }
    );
}
