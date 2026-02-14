import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/database';

const noopResponse = { data: null, error: { message: 'Supabase not configured' } };
const noopChain = () => ({ select: noopChain, single: noopChain, eq: noopChain, order: noopChain, insert: noopChain, update: noopChain, delete: noopChain, filter: noopChain, ...noopResponse });

// Basic in-memory session for demo mode with localStorage persistence
let mockUser: any = null;

if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('visual_engine_demo_session');
    if (saved) {
        try {
            mockUser = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse demo session', e);
        }
    }
}

const stubClient = {
    auth: {
        getUser: async () => ({ data: { user: mockUser }, error: null }),
        signInWithPassword: async ({ email }: { email: string }) => {
            // Find user in demo data logic
            if (email?.includes('dallis')) {
                mockUser = { id: 'demo-user-dallis', email, user_metadata: { full_name: 'Dallis Raynor', company_id: 'demo-company-dallis' } };
            } else {
                mockUser = { id: 'demo-user-001', email: email || 'chad@davisconstruction.com', user_metadata: { full_name: 'Chad E. Davis', company_id: 'demo-company-chad' } };
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('visual_engine_demo_session', JSON.stringify(mockUser));
            }

            return { data: { user: mockUser }, error: null };
        },
        signUp: async () => ({ data: { user: null }, error: { message: 'Signup disabled in demo mode' } }),
        signOut: async () => {
            mockUser = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('visual_engine_demo_session');
            }
            return { error: null };
        },
    },
    from: () => noopChain(),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), unsubscribe: () => { } }),
    removeChannel: () => { },
} as any;

export function createClient() {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (isDemo || !supabaseUrl || !supabaseUrl.startsWith('http')) {
        if (!isDemo) {
            console.warn('⚠️ Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL to .env.local');
        }
        return stubClient;
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
