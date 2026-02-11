import type { Project } from '@/lib/types/database';

// Demo mode is active when NEXT_PUBLIC_DEMO_MODE=true or when Supabase isn't configured
export function isDemoMode(): boolean {
    if (typeof window !== 'undefined') {
        // Client-side check
        return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
            !process.env.NEXT_PUBLIC_SUPABASE_URL ||
            process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project-url';
    }
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export const DEMO_USER = {
    id: 'demo-user-001',
    email: 'chad@davisconstruction.com',
    user_metadata: { full_name: 'Chad E. Davis' },
};

export const DEMO_PROJECTS: Project[] = [
    {
        id: 'demo-proj-001',
        user_id: 'demo-user-001',
        company_id: null,
        name: '16454 108th Ave NE',
        status: 'COMPLETED' as any,
        address: 'Bothell, WA 98011',
        style: 'Modern Farmhouse',
        stage: 'Pre-Construction',
        notes: 'Luxury new build for Chad E. Davis Construction. 4-bed, 3.5-bath, chef\'s kitchen with double island, vaulted great room with stone fireplace. Pacific NW contemporary with cedar and stone facade.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'demo-proj-002',
        user_id: 'demo-user-001',
        company_id: null,
        name: 'Skyline Ridge Estates',
        status: 'PROCESSING' as any,
        address: 'Snoqualmie, WA 98065',
        style: 'Northwest Contemporary',
        stage: 'Under Construction',
        notes: '8-lot luxury subdivision. Mountain views, private trails, each home 3,500+ sqft. Open floor plans with floor-to-ceiling windows.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'demo-proj-003',
        user_id: 'demo-user-001',
        company_id: null,
        name: 'Cedar Valley Custom',
        status: 'CREATED' as any,
        address: 'Woodinville, WA 98072',
        style: 'Craftsman',
        stage: 'Pre-Sale',
        notes: 'Custom craftsman home on 1.5 acres. Wrap-around porch, exposed beams, artisan tile work throughout. Wine cellar and outdoor kitchen.',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
];

export const DEMO_ASSETS = [
    {
        id: 'demo-asset-001',
        project_id: 'demo-proj-001',
        type: 'image' as const,
        provider: 'gemini',
        prompt: 'Ultra-premium architectural photography of a luxury modern farmhouse exterior at twilight.',
        status: 'complete' as const,
        external_job_id: null,
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        created_by: 'demo-user-001',
        metadata: {},
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-asset-002',
        project_id: 'demo-proj-001',
        type: 'image' as const,
        provider: 'gemini',
        prompt: 'Luxury chef kitchen with double island, marble countertops, warm lighting.',
        status: 'complete' as const,
        external_job_id: null,
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        created_by: 'demo-user-001',
        metadata: {},
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-asset-003',
        project_id: 'demo-proj-001',
        type: 'video' as const,
        provider: 'gemini',
        prompt: 'Cinematic aerial flyover of Pacific Northwest luxury home, drone footage.',
        status: 'processing' as const,
        external_job_id: null,
        url: null,
        created_by: 'demo-user-001',
        metadata: {},
        created_at: new Date().toISOString(),
    },
];
