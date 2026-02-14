/**
 * Interior Rendering Prompt Builder & Service
 * Constructs photorealistic rendering prompts from Plan Analysis metadata.
 * Feeds prompts to Gemini for AI-generated room descriptions / future Imagen integration.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlanAnalysisResult, RoomAnalysis, ArchitecturalStyle } from '../types/plan-analysis';

// ── Style-specific finish libraries ────────────────────────────────

interface FinishSet {
    cabinetry: string;
    countertops: string;
    backsplash: string;
    flooring: string;
    walls: string;
    ceiling: string;
    fixtures: string;
    furniture: string;
    decor: string;
    lighting: string;
    windows: string;
}

const KITCHEN_FINISHES: Partial<Record<ArchitecturalStyle, Partial<FinishSet>>> = {
    modern_farmhouse: {
        cabinetry: 'Shaker-style in white or warm gray, matte black cup-pull hardware',
        countertops: 'Honed Calacatta quartz, waterfall edge on island',
        backsplash: 'Hand-laid white subway tile with gray grout, shiplap above range',
        flooring: 'Wide-plank white oak hardwood, matte finish',
        fixtures: 'Stainless steel or black stainless appliances',
        lighting: 'Black iron pendant trio over island, recessed LED perimeter',
        decor: 'Wood cutting boards, white ceramic vessels, herb pots',
    },
    modern: {
        cabinetry: 'Flat-panel handleless in warm white with integrated grip channel',
        countertops: 'Ultra-thin porcelain slab in Statuario pattern',
        backsplash: 'Full-height porcelain slab or fluted glass',
        flooring: 'Large format porcelain tile in warm gray, rectified edges',
        fixtures: 'Integrated panel appliances, induction cooktop',
        lighting: 'Linear LED channel over island, cove lighting on upper cabinets',
        decor: 'Sculptural bowl, single orchid, minimal styling',
    },
    contemporary: {
        cabinetry: 'Flat slab, two-tone (white uppers, walnut lowers), soft-close',
        countertops: 'Leathered quartzite in neutral tone',
        backsplash: 'Large format matte ceramic or thin brick veneer',
        flooring: 'Engineered European oak, wire-brushed finish',
        fixtures: 'Professional-grade range, built-in refrigerator columns',
        lighting: 'Sculptural pendants, under-cabinet LED ribbon',
        decor: 'Cookbooks, artisan pottery, copper accents',
    },
    craftsman: {
        cabinetry: 'Recessed panel in warm honey maple, oil-rubbed bronze hardware',
        countertops: 'Honed granite or butcher block island',
        backsplash: 'Handmade or arts-and-crafts tile in earth tones',
        flooring: 'Quarter-sawn red oak, satin finish',
        fixtures: 'Classic stainless, farmhouse apron-front sink',
        lighting: 'Mica shade pendants, art glass accents',
        decor: 'Handcrafted ceramics, woven baskets, copper pots',
    },
    farmhouse: {
        cabinetry: 'Beadboard in antique white, cup-pull and bin-pull hardware',
        countertops: 'Soapstone or honed marble, live-edge wood accent',
        backsplash: 'Subway tile or beadboard wainscoting',
        flooring: 'Reclaimed wide-plank pine, distressed finish',
        fixtures: 'Farmhouse apron sink, vintage-style faucet',
        lighting: 'Mason jar pendants, wrought iron chandelier',
        decor: 'Fresh flowers, enamelware, vintage scales',
    },
    traditional: {
        cabinetry: 'Raised panel in cream or espresso, polished nickel hardware',
        countertops: 'Polished marble or dark granite',
        backsplash: 'Marble mosaic or hand-painted tile',
        flooring: 'Cherry or walnut hardwood, high gloss',
        fixtures: 'Professional range, cabinet-depth refrigerator',
        lighting: 'Crystal mini-pendants, recessed lighting',
        decor: 'Silver accessories, fresh flowers in crystal vase',
    },
};

const LIVING_FINISHES: Partial<Record<ArchitecturalStyle, Partial<FinishSet>>> = {
    modern_farmhouse: {
        flooring: 'Wide-plank light oak hardwood matching kitchen',
        walls: 'Shiplap accent wall in white, remaining walls in warm white',
        ceiling: 'Exposed timber beams if vaulted, clean flat white if standard',
        furniture: 'Modern linen sectional in fog gray, reclaimed wood coffee table',
        lighting: 'Mix of recessed, black iron pendants, and floor lamps',
        windows: 'Large black-framed windows, floor-to-ceiling where possible',
        decor: 'Layered throws, abstract art, fiddle leaf fig, minimal styling',
    },
    modern: {
        flooring: 'Polished concrete or large-format porcelain',
        walls: 'Smooth plaster in warm white, accent wall in board-formed concrete',
        ceiling: 'Clean flat with integrated linear lighting tracks',
        furniture: 'Low-profile sectional in charcoal, sculptural lounge chair',
        lighting: 'Architectural floor lamp, recessed adjustable spots',
        windows: 'Floor-to-ceiling curtain wall with minimal frames',
        decor: 'Single large abstract canvas, monstera, sculptural objects',
    },
    craftsman: {
        flooring: 'Quarter-sawn oak with area rug',
        walls: 'Wainscoting below chair rail, warm-toned paint above',
        ceiling: 'Box beam or coffered in stained wood',
        furniture: 'Arts-and-crafts leather armchairs, mission-style sofa',
        lighting: 'Mica shade table lamps, art glass pendants',
        windows: 'Grouped double-hung with art glass transoms',
        decor: 'Built-in bookshelves, pottery, warm textiles',
    },
};

const BEDROOM_FINISHES: Partial<Record<ArchitecturalStyle, Partial<FinishSet>>> = {
    modern_farmhouse: {
        flooring: 'White oak hardwood with woven jute area rug',
        walls: 'Board and batten accent wall behind bed, soft gray-green or sage',
        ceiling: 'Tongue-and-groove wood if vaulted, smooth white if flat',
        furniture: 'Upholstered platform bed in linen, nightstands in light wood',
        lighting: 'Pendant bedside drops or ceramic lamps, recessed overhead',
        decor: 'Layered neutral bedding, woven throw, minimal art, potted plant',
    },
    modern: {
        flooring: 'Engineered wood or carpet tile in warm neutral',
        walls: 'Smooth plaster, upholstered accent wall behind bed',
        ceiling: 'Recessed cove lighting, flat white',
        furniture: 'Low-platform bed, floating nightstands, built-in wardrobe',
        lighting: 'Swing-arm wall sconces, integrated headboard lighting',
        decor: 'Single oversized artwork, architectural objects, minimal',
    },
};

// ── Room type detection ────────────────────────────────────────────

type RoomCategory = 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'dining' | 'office' | 'other';

function categorizeRoom(name: string): RoomCategory {
    const lower = name.toLowerCase();
    if (/kitchen|pantry/.test(lower)) return 'kitchen';
    if (/great|living|family|den/.test(lower)) return 'living';
    if (/bed|master|primary|suite|guest|bonus/.test(lower)) return 'bedroom';
    if (/bath|powder|shower/.test(lower)) return 'bathroom';
    if (/dining|breakfast|nook/.test(lower)) return 'dining';
    if (/office|study|library/.test(lower)) return 'office';
    return 'other';
}

// ── Unsplash curated placeholder URLs by room type ─────────────────

const ROOM_PLACEHOLDERS: Record<RoomCategory, string[]> = {
    kitchen: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=90',
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1920&q=90',
        'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=1920&q=90',
    ],
    living: [
        'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=90',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=90',
        'https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=1920&q=90',
    ],
    bedroom: [
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920&q=90',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1920&q=90',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=90',
    ],
    bathroom: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=90',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=90',
    ],
    dining: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920&q=90',
        'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1920&q=90',
    ],
    office: [
        'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=1920&q=90',
    ],
    other: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=90',
    ],
};

// ── Public API ─────────────────────────────────────────────────────

export interface InteriorRenderRequest {
    room: RoomAnalysis;
    style: ArchitecturalStyle;
    totalPlan?: PlanAnalysisResult;
}

export interface InteriorRenderResult {
    roomName: string;
    prompt: string;
    imageUrl: string;
    aiDescription: string | null;
    category: RoomCategory;
}

export class InteriorRenderingService {
    private static _genAI: GoogleGenerativeAI | null = null;

    private static get genAI() {
        if (!this._genAI) {
            const key = process.env.GEMINI_API_KEY;
            if (!key || key === 'your-gemini-api-key') {
                throw new Error('GEMINI_API_KEY not configured.');
            }
            this._genAI = new GoogleGenerativeAI(key);
        }
        return this._genAI;
    }

    private static hasValidApiKey(): boolean {
        const key = process.env.GEMINI_API_KEY;
        return !!key && key !== 'your-gemini-api-key' && key !== 'mock-key';
    }

    /**
     * Build a rich, detailed rendering prompt for a specific room
     */
    static buildRoomPrompt(req: InteriorRenderRequest): string {
        const { room, style, totalPlan } = req;
        const category = categorizeRoom(room.name);
        const dims = room.dimensions || '14\' x 12\'';
        const ceilingH = room.ceilingHeight || '9 feet';
        const isVaulted = /vaulted|cathedral/i.test(ceilingH);
        const ceilingType = isVaulted ? 'vaulted with exposed beams' : /tray/i.test(ceilingH) ? 'tray ceiling' : /coffered/i.test(ceilingH) ? 'coffered ceiling' : 'flat';
        const isPNW = totalPlan?.regionalStyle?.isPNW ?? false;

        // Base prompt
        const parts: string[] = [];
        parts.push(`Photorealistic interior rendering of a ${style.replace(/_/g, ' ')} ${room.name}, ${dims} with ${ceilingType} ceiling at ${ceilingH}.`);

        // Camera
        parts.push('Wide-angle view from corner showing two walls and depth, 18mm lens equivalent, camera height 5 feet, rule of thirds composition, spacious feeling.');

        // Lighting
        parts.push(`Natural morning light (10 AM) softly diffused through ${isPNW ? 'rain-washed' : ''} windows. Interior lights ON: recessed and pendant fixtures providing warm ambient fill. Soft realistic window shadows on floor.`);

        // Style-specific finishes
        const finishLib =
            category === 'kitchen' ? KITCHEN_FINISHES
                : category === 'bedroom' ? BEDROOM_FINISHES
                    : LIVING_FINISHES;

        const finishes = finishLib[style] || finishLib['modern_farmhouse'] || {};

        Object.entries(finishes).forEach(([key, value]) => {
            if (value) parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}.`);
        });

        // Room-specific notes
        if (room.notes) {
            parts.push(`Room notes: ${room.notes}.`);
        }

        // Staging
        parts.push(`Staging: ${style.replace(/_/g, ' ')} interior design. Furniture scaled to room size, functional layout with traffic flow. Neutral palette with style-appropriate accents. Styled but not cluttered — books, 2-3 large plants (fiddle leaf fig, monstera), layered textiles, abstract art in simple frames.`);

        // Materials from plan
        if (totalPlan?.materials && totalPlan.materials.length > 0) {
            parts.push(`Plan-specified materials: ${totalPlan.materials.map(m => m.replace(/_/g, ' ')).join(', ')}.`);
        }

        // Technical
        parts.push('Professional real estate photography style, bright inviting atmosphere, natural color grading, 4K resolution, high detail, no distortion.');

        // Negative
        parts.push('AVOID: dated styles, clutter, unrealistic lighting, fisheye distortion, AI artifacts, empty staged-to-sell appearance, furniture too small or large.');

        return parts.join(' ');
    }

    /**
     * Generate a rendering for a specific room
     */
    static async generateRoomRendering(req: InteriorRenderRequest): Promise<InteriorRenderResult> {
        const category = categorizeRoom(req.room.name);
        const prompt = this.buildRoomPrompt(req);

        // Select a curated placeholder URL matching the room type
        const placeholders = ROOM_PLACEHOLDERS[category] || ROOM_PLACEHOLDERS.other;
        const placeholderUrl = placeholders[Math.floor(Math.random() * placeholders.length)];

        let aiDescription: string | null = null;

        if (this.hasValidApiKey()) {
            try {
                console.log(`[InteriorRendering] Generating AI description for ${req.room.name}...`);
                const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
                const result = await model.generateContent([
                    `You are an elite interior designer and architectural visualizer. Based on this rendering prompt, write a vivid 2-3 sentence description of what the final photorealistic rendering looks like. Be specific about materials, colors, mood, and light quality. This will be shown as a caption beneath the rendering.\n\nPrompt:\n"${prompt}"`
                ]);
                const response = await result.response;
                aiDescription = response.text().trim();
            } catch (err) {
                console.error('[InteriorRendering] AI description failed:', err);
            }
        } else {
            // Curated fallback descriptions
            const fallbacks: Record<RoomCategory, string> = {
                kitchen: 'Morning light cascades through oversized windows onto honed quartz countertops, illuminating shaker cabinetry and warm oak flooring. Black iron pendants anchor the space above a waterfall-edge island styled with artisan ceramics.',
                living: 'Vaulted timber beams frame a double-height great room where a stone fireplace wall anchors the composition. Linen sectional seating in fog gray is layered with woven throws beneath gallery-scale abstract artwork.',
                bedroom: 'Soft sage board-and-batten frames an upholstered platform bed dressed in organic cotton layers. Brass pendant drops flank each side while filtered morning light creates gentle geometric shadows on white oak flooring.',
                bathroom: 'Floor-to-ceiling marble envelops a freestanding soaking tub positioned beneath a rain shower canopy. Warm brass fixtures contrast cool stone surfaces as recessed lighting creates an intimate spa atmosphere.',
                dining: 'A sculptural wood dining table seats eight beneath a brass linear chandelier. Floor-to-ceiling windows frame a garden view while built-in buffet storage keeps the space refined and uncluttered.',
                office: 'Natural walnut built-ins line the walls of a sun-filled study with a leather desk chair and brass task lighting. A reading nook by the window offers tranquility with a curated shelf of design volumes.',
                other: 'Clean architectural lines define a versatile space flooded with natural light. Premium finishes and thoughtful material selections create an atmosphere that is both functional and aspirational.',
            };
            aiDescription = fallbacks[category];
        }

        return {
            roomName: req.room.name,
            prompt,
            imageUrl: placeholderUrl,
            aiDescription,
            category,
        };
    }
}
