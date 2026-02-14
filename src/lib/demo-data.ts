import type { Project } from '@/lib/types/database';
import type { DeveloperPersona } from '@/lib/types/persona';


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
    user_metadata: {
        full_name: 'Chad E. Davis',
        company_id: 'demo-company-chad'
    },
};

export const DALLIS_USER = {
    id: 'demo-user-dallis',
    email: 'dallis@rosecityreimagined.com',
    user_metadata: {
        full_name: 'Dallis Raynor',
        company_id: 'demo-company-dallis'
    },
};

export const DEMO_COMPANIES = [
    {
        id: 'demo-company-chad',
        name: 'Chad E. Davis Construction',
        logo_url: null,
        primary_color: '#f59e0b', // Amber/Orange
        contact_email: 'chad@davisconstruction.com',
        contact_phone: '(425) 555-0142',
        website: 'davisconstruction.com',
        brand_font: 'industrial',
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-company-dallis',
        name: 'Rose City Reimagined',
        logo_url: null,
        primary_color: '#6366f1', // Indigo
        contact_email: 'dallis@rosecityreimagined.com',
        contact_phone: '(503) 555-0192',
        website: 'rosecityreimagined.com',
        brand_font: 'luxury',
        created_at: new Date().toISOString(),
    }
];

export const DEMO_PERSONAS: DeveloperPersona[] = [
    {
        id: "persona_dallis_raynor",
        name: "Dallis Raynor",
        role: "Rehab & Infill Developer",
        market: "Portland, Oregon – inner eastside (1920s housing stock)",
        archetype: "Rehab & Infill Preservationist",
        finish_level: {
            label: "Modest high-end preservation",
            description: "Refined but not flashy; emphasizes restored original character over luxury upgrades.",
            elements: [
                "Refinished original hardwood floors where possible",
                "Preserved trim, doors, and built-ins when structurally sound",
                "New finishes sized and detailed to feel 1920s-appropriate, not luxury spec",
                "Neutral, light palettes that photograph well for listings"
            ]
        },
        cabinet_spec: {
            kitchen: {
                style: "Simple Shaker or clean face-frame overlay, proportioned to 1920s rooms",
                construction: "Plywood boxes, durable hardware, stain-grade or painted shaker faces",
                integration: [
                    "Tie into existing casing and openings rather than re-framing everything",
                    "Respect original window placements and sill heights",
                    "Avoid full-gut Euro-modern layouts unless the existing kitchen is unsalvageable"
                ],
                finish_palette: [
                    "Painted warm whites and light taupes for resale",
                    "Occasional natural oak or light-stained wood for anchor pieces (island, hutch)",
                    "Subtle, period-adjacent hardware (simple knobs and bars, not ornate or hyper-modern)"
                ],
                hardware: {
                    default: "Simple black or satin nickel knobs and pulls",
                    optional: "Soft brass/bronze accents where it fits the neighborhood and comps",
                    avoid: "High-gloss, ultra-modern, or overly decorative hardware"
                }
            },
            bath: {
                style: "Furniture-style vanities or simple shaker boxes sized to small baths",
                notes: [
                    "Keep layouts compact and efficient",
                    "Play nice with existing window locations and vintage tile where feasible"
                ]
            },
            original_casework_strategy: {
                keep_and_refinish: true,
                description: "Prefer to keep original built-ins and hutches, then add new cabinets that visually match profiles and proportions."
            }
        } as any,
        risk_profile: {
            capital_style: "Conservative value-add",
            description: "Buys distressed or nuisance properties, fixes structural and cosmetic issues, and adds modest density without overbuilding.",
            behavior: [
                "Avoids overcapitalizing finishes beyond neighborhood comps",
                "Prioritizes projects where structure is salvageable",
                "Uses infill units on underutilized lots/backyards but keeps massing modest"
            ]
        },
        hold_vs_flip: {
            primary_strategy: "Value-add resale with occasional hold",
            listing_vibe: "Bright, clean, and inviting for resale photos; show off restored character plus practical upgrades.",
            hold_vibe: "Durable, low-maintenance surfaces with the same 1920s character cues.",
            staging_directives: {
                flip: [
                    "Warm daylight, slightly vibrant color grading",
                    "Minimal but intentional staging to highlight built-ins and restored details",
                    "Clear sightlines that show old + new working together"
                ],
                hold: [
                    "Slightly softer, more neutral lighting",
                    "Less staging, more emphasis on durability and storage",
                    "Show how spaces live day-to-day, not just in listing photos"
                ]
            }
        },
        preservation_ethos: {
            label: "Neighborhood-scale preservation",
            principles: [
                "Preserve structurally sound 1920s houses rather than tearing them down",
                "Maintain or echo original trim profiles, window patterns, and massing",
                "Add density with small, context-aware infill units instead of maxed-out boxes",
                "Avoid design moves that visually overpower adjacent homes"
            ],
            visual_engine_hints: {
                scale: "Respect existing rooflines, porch forms, and lot rhythm; no out-of-scale additions.",
                materials: "Use siding, color, and trim that feel native to 1920s Portland (lap siding, simple fascias, modest eave details).",
                composition: "Always let the original house remain the visual anchor; new infill reads as a quiet neighbor, not the main character."
            }
        },
        aesthetic_flags: {
            avoid: [
                "Ultra-modern, flat-panel high-gloss cabinets",
                "Aggressive black-on-black exterior schemes in quiet historic streets",
                "Overly ornate traditional millwork that feels suburban McMansion",
                "Max-FAR boxes that ignore neighboring rooflines"
            ],
            lean_into: [
                "Light-filled kitchens with shaker cabinets and modest hardware",
                "Visible original floors, doors, and built-ins where possible",
                "Warm, listing-friendly color grading rather than moody or hyper-stylized looks"
            ]
        }
    }
];


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
        persona_id: null,
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
        persona_id: null,
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
        persona_id: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: 'demo-proj-dallis-001',
        user_id: 'demo-user-dallis',
        company_id: null,
        name: 'SE 78th & Washington',
        status: 'COMPLETED' as any,
        address: '604 SE 78th Ave, Portland, OR',
        style: '1920s Bungalow Rehab + Infill',
        stage: 'Finished',
        notes: '1925 house rehab + two new small homes on the former backyard lot. Preservation of original character, refinished oak floors, modernized kitchen with shaker cabinets. Infill units match bungalow scale.',
        persona_id: 'persona_dallis_raynor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
