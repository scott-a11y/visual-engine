/**
 * Plan Analysis Service — AI Blueprint Intelligence
 * Uses Gemini 2.0 Flash with vision to analyze architectural documents
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PlanAnalysisResult } from '../types/plan-analysis';

const PLAN_ANALYSIS_SYSTEM_PROMPT = `You are an expert architectural plan interpreter. Analyze the uploaded architectural document and extract the following information in structured JSON format.

REQUIRED INFORMATION:
1. documentType: "floor_plan" | "elevation" | "site_plan" | "section" | "detail"
2. architecturalStyle: "modern" | "contemporary" | "craftsman" | "farmhouse" | "traditional" | "colonial" | "mid-century" | "ranch" | "bungalow" | "victorian" | "mediterranean" | "industrial" | "modern_farmhouse" | "northwest_contemporary"
3. buildingType: "single_family" | "multi_family" | "commercial" | "mixed_use"
4. stories: number
5. squareFootage: approximate number
6. bedrooms: number
7. bathrooms: number (use .5 for half baths)
8. specialFeatures: array of strings like "attached_garage_2_car", "covered_front_porch", "rear_deck", "mudroom", "basement", "pool"
9. materials: array of material call-outs visible in the document like "hardie_board_siding", "metal_roofing", "stone_accents"
10. roofType: "gable" | "hip" | "flat" | "shed" | "gambrel" | "mansard"
11. regionalStyle: { isPNW: boolean, description: string }
12. scale: the drawing scale if visible, e.g. "1/4\\" = 1'"
13. rooms: array of { name: string, dimensions: string | null, ceilingHeight: string | null, notes: string | null }
14. doorWindowLocations: brief description of door and window locations if visible
15. notableDetails: array of any notable architectural details
16. writtenNotes: array of any written specifications or notes visible in the document
17. confidence: 0-100 how confident you are in the analysis

OUTPUT FORMAT:
Return ONLY valid JSON. If information cannot be determined, use null for single values or empty arrays for lists.
Do NOT include any markdown formatting, code fences, or explanation — only the raw JSON object.`;

export class PlanAnalysisService {
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
     * Analyze an architectural plan image using Gemini 2.0 Flash vision
     */
    static async analyzePlan(imageBase64: string, mimeType: string): Promise<PlanAnalysisResult> {
        if (!this.hasValidApiKey()) {
            return this.getDemoAnalysis();
        }

        try {
            console.log('[PlanAnalysis] Starting Gemini vision analysis...');

            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const result = await model.generateContent([
                PLAN_ANALYSIS_SYSTEM_PROMPT,
                {
                    inlineData: {
                        mimeType,
                        data: imageBase64,
                    },
                },
            ]);

            const response = await result.response;
            let text = response.text().trim();

            // Strip markdown code fences if present
            if (text.startsWith('```')) {
                text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
            }

            console.log('[PlanAnalysis] Gemini response received, parsing JSON...');

            const analysis: PlanAnalysisResult = JSON.parse(text);
            return analysis;
        } catch (error) {
            console.error('[PlanAnalysis] Analysis failed:', error);
            throw new Error(`Plan analysis failed: ${String(error)}`);
        }
    }

    /**
     * Returns a realistic demo analysis for testing without API key
     */
    private static getDemoAnalysis(): PlanAnalysisResult {
        return {
            documentType: 'floor_plan',
            architecturalStyle: 'modern_farmhouse',
            buildingType: 'single_family',
            stories: 2,
            squareFootage: 3200,
            bedrooms: 4,
            bathrooms: 3.5,
            specialFeatures: [
                'attached_garage_3_car',
                'covered_front_porch',
                'rear_deck',
                'mudroom',
                'walk_in_pantry',
                'bonus_room',
            ],
            materials: [
                'hardie_board_siding',
                'standing_seam_metal_roof',
                'natural_stone_veneer',
                'engineered_hardwood',
            ],
            roofType: 'gable',
            regionalStyle: {
                isPNW: true,
                description: 'Pacific Northwest modern farmhouse with deep overhangs for rain protection, covered outdoor living, and large windows to capture natural light.',
            },
            scale: '1/4" = 1\'',
            rooms: [
                { name: 'Great Room', dimensions: '24\' x 18\'', ceilingHeight: 'Vaulted to 18\'', notes: 'Open to kitchen, fireplace wall' },
                { name: 'Kitchen', dimensions: '16\' x 14\'', ceilingHeight: '10\'', notes: '42" shaker cabinets, quartz island' },
                { name: 'Primary Suite', dimensions: '18\' x 16\'', ceilingHeight: '10\'', notes: 'Tray ceiling, spa bath' },
                { name: 'Bedroom 2', dimensions: '14\' x 12\'', ceilingHeight: '9\'', notes: 'Walk-in closet' },
                { name: 'Bedroom 3', dimensions: '13\' x 12\'', ceilingHeight: '9\'', notes: 'Jack & Jill bath' },
                { name: 'Bedroom 4 / Bonus', dimensions: '16\' x 14\'', ceilingHeight: '8\'', notes: 'Above garage, potential media room' },
                { name: 'Garage', dimensions: '34\' x 24\'', ceilingHeight: '10\'', notes: '3-car, EV charging roughed in' },
            ],
            doorWindowLocations: 'Primary entry: covered porch with 8\' pivot door. Rear: 16\' multi-slide glass wall to deck. Windows: Oversized Low-E throughout with transoms on south elevation.',
            notableDetails: [
                'Board-and-batten exterior with stone accent at entry',
                'Covered outdoor living with vaulted cedar ceiling',
                'Open riser staircase with cable rail',
                'Dedicated drop zone / mudroom from garage',
            ],
            writtenNotes: [
                'All exterior trim: Hardie smooth, Arctic White',
                'Roof pitch: 8/12 main, 4/12 porch',
                'Foundation: Stem wall, 4" slab on grade',
            ],
            confidence: 92,
        };
    }
}
