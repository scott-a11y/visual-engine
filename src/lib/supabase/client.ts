import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/database';

const noopResponse = { data: null, error: { message: 'Supabase not configured' } };
const noopChain = () => ({ select: noopChain, single: noopChain, eq: noopChain, order: noopChain, insert: noopChain, update: noopChain, delete: noopChain, filter: noopChain, ...noopResponse });

const stubClient = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => noopResponse,
        signUp: async () => noopResponse,
        signOut: async () => ({ error: null }),
    },
    from: () => noopChain(),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), unsubscribe: () => { } }),
    removeChannel: () => { },
} as any;

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        console.warn('⚠️ Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local');
        return stubClient;
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
