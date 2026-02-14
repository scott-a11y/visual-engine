/**
 * Aerial Contextual Rendering Service
 * Constructs photorealistic aerial/drone-view rendering prompts
 * from Plan Analysis metadata for suburban site context visualization.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlanAnalysisResult, ArchitecturalStyle } from '../types/plan-analysis';

// ── Regional vegetation & atmosphere libraries ─────────────────────

interface RegionalContext {
    trees: string;
    vegetation: string;
    atmosphere: string;
    sky: string;
    roofDetails: string;
    hardscape: string;
}

const REGIONAL_CONTEXT: Record<string, RegionalContext> = {
    pnw: {
        trees: 'Mature Douglas fir, western red cedar, and big-leaf maple trees. Evergreen-dominant with some deciduous',
        vegetation: 'Lush green lawns, native sword ferns, rhododendrons, and azaleas in foundation beds. Moss on north-facing surfaces',
        atmosphere: 'Soft Pacific Northwest light filtering through thin overcast. Slight atmospheric haze adding depth and moodiness',
        sky: 'Characteristic PNW partly cloudy sky with layered clouds and occasional blue patches, not harsh sunshine',
        roofDetails: 'Subtle moss or lichen on north-facing shingle areas. Rain gutters and oversized downspouts clearly visible. Deep 36-inch overhangs',
        hardscape: 'Natural stone or stamped concrete walkways, gravel driveway borders. Rain-garden swale near property edge',
    },
    default: {
        trees: 'Mix of mature deciduous shade trees (oaks, maples) and ornamental trees (dogwood, crepe myrtle)',
        vegetation: 'Well-maintained lawn, boxwood and hydrangea foundation plantings, perennial garden beds',
        atmosphere: 'Warm golden-hour light with soft shadows indicating late afternoon or early morning',
        sky: 'Clear to partly cloudy sky with natural cumulus cloud formations',
        roofDetails: 'Clean roofing with visible ridge cap, gutters, and architectural details',
        hardscape: 'Concrete or paver walkways, asphalt or concrete driveway',
    },
};

// ── Style-specific exterior details ────────────────────────────────

interface ExteriorPalette {
    siding: string;
    trim: string;
    roof: string;
    accents: string;
    garage: string;
    porch: string;
    landscapeStyle: string;
}

const EXTERIOR_PALETTES: Partial<Record<ArchitecturalStyle, ExteriorPalette>> = {
    modern_farmhouse: {
        siding: 'Board-and-batten in white or warm gray with horizontal lap siding accent sections',
        trim: 'Black-framed windows and doors, clean white fascia and trim',
        roof: 'Standing seam metal roof in dark charcoal or matte black',
        accents: 'Natural wood garage door, black exterior lights, black metal railings',
        garage: 'Three-car attached garage with natural wood or dark-stained doors',
        porch: 'Covered front porch with wood ceiling and black metal columns',
        landscapeStyle: 'Modern cottage garden with structured boxwood borders and ornamental grass clusters',
    },
    modern: {
        siding: 'Smooth stucco and timber cladding, flat-panel fiber cement, mixed material facade',
        trim: 'Frameless or minimal aluminum window frames in dark bronze',
        roof: 'Flat roof with built-up membrane or low-slope with hidden parapet',
        accents: 'Integrated LED facade lighting, steel balcony rails, ipe wood soffits',
        garage: 'Flush contemporary garage door in matching facade material',
        porch: 'Recessed entry with cantilevered concrete canopy',
        landscapeStyle: 'Minimalist hardscape-dominant, geometric planting beds, architectural grasses',
    },
    contemporary: {
        siding: 'Mix of natural wood, stone, and painted stucco in warm neutral tones',
        trim: 'Dark aluminum window systems, concealed gutters',
        roof: 'Low-slope or shed roof with deep overhangs, zinc or standing seam',
        accents: 'Corten steel planters, glass railings, concrete accent walls',
        garage: 'Carriage-style wood or glass-panel garage doors',
        porch: 'Open timber-frame entry structure',
        landscapeStyle: 'Natural and curated blend of native and ornamental plantings',
    },
    craftsman: {
        siding: 'Cedar shingle and horizontal clapboard in earth tones, tapered columns on stone piers',
        trim: 'Wide painted trim boards, exposed rafter tails, decorative brackets',
        roof: 'Medium-pitch composition shingle in charcoal or moss green',
        accents: 'River rock or fieldstone porch columns, art-glass porch lights',
        garage: 'Detached or side-load garage with matching cedar doors',
        porch: 'Deep covered front porch with tapered columns and built-in seating',
        landscapeStyle: 'Arts-and-crafts inspired with flagstone paths, perennial borders, climbing roses',
    },
    farmhouse: {
        siding: 'White horizontal clapboard with batten accents, classic wrap-around porch',
        trim: 'White painted trim, traditional divided-light windows',
        roof: 'Asphalt shingle in dark gray or weathered slate',
        accents: 'Barn-red or black shutters, classic lantern sconces, metal roofing on porch',
        garage: 'Barn-style detached garage or matching attached with classic doors',
        porch: 'Full-width or wrap-around porch with turned columns and wood decking',
        landscapeStyle: 'Traditional cottage garden with picket fence sections, hydrangeas, climbing vines',
    },
    traditional: {
        siding: 'Brick facade or painted clapboard, symmetrical window placement',
        trim: 'Crown molding, pediment entry, classical proportions',
        roof: 'Steep-pitch asphalt or slate roof with multiple gables and dormers',
        accents: 'Coach lights, iron railings, decorative keystones',
        garage: 'Side-load or front with arched openings matching masonry',
        porch: 'Columned portico entry with pediment',
        landscapeStyle: 'Formal symmetrical foundation plantings, boxwood hedges, annual color beds',
    },
    colonial: {
        siding: 'Brick or painted clapboard, strictly symmetrical facade',
        trim: 'White painted trim, multi-pane double-hung windows, dentil molding',
        roof: 'Side-gable with dormer windows, slate or asphalt shingle',
        accents: 'Black shutters, brass door hardware, fanlight transom',
        garage: 'Attached side garage or separate carriage house',
        porch: 'Centered entry portico with classical columns',
        landscapeStyle: 'Formal bilateral symmetry, brick walkway, urns with seasonal plants',
    },
    ranch: {
        siding: 'Brick and horizontal siding combination, low-profile design',
        trim: 'Wide roof overhangs, horizontal emphasis trim',
        roof: 'Low-pitch hip or gable, composition shingle',
        accents: 'Large picture windows, integrated planters, carport or attached garage',
        garage: 'Prominent front-facing double garage',
        porch: 'Low covered entry or open stoop',
        landscapeStyle: 'Open front lawn with mature shade trees, foundation shrubs, screen hedges at property lines',
    },
    northwest_contemporary: {
        siding: 'Natural cedar and dark-stained timber, stone veneer accents, green roof sections',
        trim: 'Large floor-to-ceiling window walls with aluminum frames',
        roof: 'Shed or butterfly roof with deep overhangs, standing seam',
        accents: 'Live-edge wood beams, corten steel accents, rain chain downspouts',
        garage: 'Integrated garage with cedar or glass door',
        porch: 'Covered outdoor room with timber frame and cable railings',
        landscapeStyle: 'Native PNW plantings, rain garden, pea-gravel paths, evergreen screening',
    },
};

// ── Season descriptions ────────────────────────────────────────────

type Season = 'spring' | 'summer' | 'fall' | 'winter';

const SEASON_DETAILS: Record<Season, string> = {
    spring: 'Early spring: fresh bright green foliage emerging, flowering trees in bloom (cherry, magnolia), daffodils and tulips in gardens, some trees still filling in',
    summer: 'Full summer: lush dense foliage, deep green lawns, mature flowers in bloom, long warm shadows, vibrant garden beds',
    fall: 'Autumn: warm golden and amber foliage, some red-orange highlights, leaves on ground near trees, dried ornamental grasses, warm afternoon light',
    winter: 'Late winter: bare deciduous trees revealing branch structure, evergreens providing color, dormant lawn, subtle frost on north-facing surfaces',
};

// ── View angle types ───────────────────────────────────────────────

export type AerialViewAngle = 'front_left' | 'front_right' | 'rear_left' | 'rear_right' | 'direct_overhead';

const VIEW_DESCRIPTIONS: Record<AerialViewAngle, string> = {
    front_left: 'Aerial drone view at 45-degree angle from the front-left, showing the primary facade and left side elevation. Home occupies 40% of frame with neighborhood context providing setting',
    front_right: 'Aerial drone view at 45-degree angle from the front-right, showing the primary facade and right side elevation. Home occupies 40% of frame with suburban surroundings',
    rear_left: 'Aerial drone view from the rear-left showing backyard with patio/deck area, rear elevation, and side yard. Reveals outdoor living spaces and landscaping',
    rear_right: 'Aerial drone view from the rear-right showing backyard layout, rear windows, and side elevation. Reveals property depth and outdoor amenities',
    direct_overhead: 'Direct overhead bird\'s-eye view showing roof plan, lot boundaries, and surrounding properties. Reveals the full site layout with driveway, walkways, and landscape zones',
};

// ── Public types ───────────────────────────────────────────────────

export interface AerialRenderRequest {
    plan: PlanAnalysisResult;
    viewAngle?: AerialViewAngle;
    season?: Season;
    timeOfDay?: 'morning' | 'afternoon' | 'golden_hour';
}

export interface AerialRenderResult {
    viewAngle: AerialViewAngle;
    season: Season;
    prompt: string;
    imageUrl: string;
    aiDescription: string | null;
}

// ── Curated aerial photo placeholders ──────────────────────────────

const AERIAL_PLACEHOLDERS: Record<AerialViewAngle, string[]> = {
    front_left: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=90',
    ],
    front_right: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=90',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=90',
    ],
    rear_left: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=90',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=90',
    ],
    rear_right: [
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=90',
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&q=90',
    ],
    direct_overhead: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=90',
    ],
};

// ── Service ────────────────────────────────────────────────────────

export class AerialRenderingService {
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
     * Build a rich aerial rendering prompt from plan analysis data
     */
    static buildAerialPrompt(req: AerialRenderRequest): string {
        const { plan, viewAngle = 'front_left', season = 'summer', timeOfDay = 'golden_hour' } = req;
        const style = plan.architecturalStyle ?? 'modern_farmhouse';
        const isPNW = plan.regionalStyle?.isPNW ?? false;
        const region = isPNW ? REGIONAL_CONTEXT.pnw : REGIONAL_CONTEXT.default;
        const palette = EXTERIOR_PALETTES[style] ?? EXTERIOR_PALETTES.modern_farmhouse!;
        const sqft = plan.squareFootage ?? 2800;
        const stories = plan.stories ?? 2;
        const roofType = plan.roofType ?? 'gable';
        const beds = plan.bedrooms ?? 3;
        const baths = plan.bathrooms ?? 2.5;

        const hasGarage = plan.specialFeatures.some(f => /garage/i.test(f));
        const hasDeck = plan.specialFeatures.some(f => /deck|patio/i.test(f));
        const hasPorch = plan.specialFeatures.some(f => /porch/i.test(f));

        const parts: string[] = [];

        // View
        parts.push(`Photorealistic ${VIEW_DESCRIPTIONS[viewAngle]}.`);

        // Drone specs
        parts.push('Drone camera at 50-80 feet altitude, f/2.8 aperture for shallow background blur on neighboring homes, sharp detail on subject home.');

        // Building description
        parts.push(`Subject home: ${style.replace(/_/g, ' ')} ${stories}-story ${plan.buildingType?.replace(/_/g, ' ') || 'single family'} residence, approximately ${sqft.toLocaleString()} square feet, ${beds} bedrooms, ${baths} bathrooms.`);

        // Exterior materials
        parts.push(`Siding: ${palette.siding}. Trim: ${palette.trim}. Roof: ${palette.roof} with ${roofType} form.`);
        parts.push(`Accents: ${palette.accents}.`);

        // Garage
        if (hasGarage) {
            parts.push(`Garage: ${palette.garage}.`);
        }

        // Porch
        if (hasPorch) {
            parts.push(`Porch: ${palette.porch}.`);
        }

        // Roof details
        parts.push(`Roof details: ${region.roofDetails}.`);

        // Lot & site
        parts.push('Lot: Typical suburban lot (50\' x 100\' or similar), home set back 20-25 feet from street. Driveway leading to garage.');

        // Landscaping
        parts.push(`Front yard: ${palette.landscapeStyle}. ${region.trees}. ${region.vegetation}.`);

        // Backyard
        if (hasDeck) {
            parts.push('Backyard: Partially visible rear deck or patio area with outdoor furniture, fenced yard with mature landscaping.');
        }

        // Neighborhood
        parts.push('Neighborhood: 4-6 neighboring homes partially visible, similar style era with varied colors, spaced 10-15 feet apart, slightly out of focus. Typical suburban street with curb, sidewalk, street trees. 1-2 parked cars on street for realism.');

        // Season
        parts.push(`Season: ${SEASON_DETAILS[season]}.`);

        // Atmosphere
        const timeDesc = timeOfDay === 'morning'
            ? 'Soft early morning light from the east, long gentle shadows'
            : timeOfDay === 'afternoon'
                ? 'Direct afternoon sunlight, crisp shadows, bright conditions'
                : 'Warm golden-hour light from low angle, rich warm tones, romantic atmosphere';
        parts.push(`Lighting: ${timeDesc}. ${region.atmosphere}.`);
        parts.push(`Sky: ${region.sky}.`);

        // Plan-specific materials
        if (plan.materials.length > 0) {
            parts.push(`Specified materials: ${plan.materials.map(m => m.replace(/_/g, ' ')).join(', ')}.`);
        }

        // Special features
        const visibleFeatures = plan.specialFeatures.filter(f =>
            !/walk_in|mudroom|pantry/i.test(f)
        );
        if (visibleFeatures.length > 0) {
            parts.push(`Notable features visible from aerial: ${visibleFeatures.map(f => f.replace(/_/g, ' ')).join(', ')}.`);
        }

        // Technical
        parts.push('Professional real estate aerial photography, 4K resolution, natural color grading, realistic proportions, high detail on subject home. DJI Mavic 3 quality. Slight aerial perspective haze on far objects for depth.');

        // Negative
        parts.push('AVOID: distorted perspective, unrealistic scale, oversaturated HDR effect, empty treeless lots, uniform cookie-cutter homes, unrealistic perfect lighting, AI artifacts, miniature tilt-shift effect.');

        return parts.join(' ');
    }

    /**
     * Generate an aerial contextual rendering
     */
    static async generateAerialRendering(req: AerialRenderRequest): Promise<AerialRenderResult> {
        const viewAngle = req.viewAngle ?? 'front_left';
        const season = req.season ?? 'summer';
        const prompt = this.buildAerialPrompt(req);

        // Placeholder URL
        const placeholders = AERIAL_PLACEHOLDERS[viewAngle];
        const imageUrl = placeholders[Math.floor(Math.random() * placeholders.length)];

        let aiDescription: string | null = null;

        if (this.hasValidApiKey()) {
            try {
                console.log(`[AerialRendering] Generating AI description for ${viewAngle} view...`);
                const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
                const result = await model.generateContent([
                    `You are a luxury real estate photographer and drone pilot. Based on this aerial rendering prompt, write a vivid 2-3 sentence description of what the final photorealistic drone shot looks like. Be specific about the home's presence in the landscape, the quality of light, and the neighborhood feel. This will caption the rendering.\n\nPrompt:\n"${prompt}"`
                ]);
                const response = await result.response;
                aiDescription = response.text().trim();
            } catch (err) {
                console.error('[AerialRendering] AI description failed:', err);
            }
        } else {
            // Curated fallback descriptions per view angle
            const fallbacks: Record<AerialViewAngle, string> = {
                front_left: 'A warm golden-hour drone shot reveals the home\'s sculptural presence among mature evergreen canopy. The board-and-batten facade catches amber light while deep overhangs cast dramatic shadows across the landscaped front yard.',
                front_right: 'From fifty feet, the full architectural composition unfolds — standing seam roof planes intersect above a carefully proportioned facade. Street trees frame the property while neighboring homes provide suburban context in the soft background.',
                rear_left: 'The aerial perspective reveals the private outdoor living zone: a generous rear deck steps down to a landscaped backyard enclosed by mature plantings. Oversized windows and multi-slide doors connect interior to exterior seamlessly.',
                rear_right: 'Climbing above the rear property line, the drone captures the home\'s depth and massing. Multiple roof planes create visual interest while the backyard landscape demonstrates thoughtful integration of hardscape and native plantings.',
                direct_overhead: 'A bird\'s-eye view reveals the full site plan: the roof geometry\'s clean lines, driveway approach, walkway circulation, and the balanced distribution of outdoor living spaces across the property.',
            };
            aiDescription = fallbacks[viewAngle];
        }

        return {
            viewAngle,
            season,
            prompt,
            imageUrl,
            aiDescription,
        };
    }
}
