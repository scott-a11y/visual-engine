/**
 * Plan Analysis Types — AI Blueprint Intelligence
 * Structured output from Gemini vision analysis of architectural documents
 */

export type DocumentType = 'floor_plan' | 'elevation' | 'site_plan' | 'section' | 'detail';

export type ArchitecturalStyle =
    | 'modern' | 'contemporary' | 'craftsman' | 'farmhouse' | 'traditional'
    | 'colonial' | 'mid-century' | 'ranch' | 'bungalow' | 'victorian'
    | 'mediterranean' | 'industrial' | 'modern_farmhouse' | 'northwest_contemporary';

export type BuildingType = 'single_family' | 'multi_family' | 'commercial' | 'mixed_use';

export type RoofType = 'gable' | 'hip' | 'flat' | 'shed' | 'gambrel' | 'mansard';

export interface RoomAnalysis {
    name: string;
    dimensions: string | null;
    ceilingHeight: string | null;
    notes: string | null;
}

export interface RegionalStyle {
    isPNW: boolean;
    description: string | null;
}

export interface PlanAnalysisResult {
    documentType: DocumentType | null;
    architecturalStyle: ArchitecturalStyle | null;
    buildingType: BuildingType | null;
    stories: number | null;
    squareFootage: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    specialFeatures: string[];
    materials: string[];
    roofType: RoofType | null;
    regionalStyle: RegionalStyle | null;
    scale: string | null;
    rooms: RoomAnalysis[];
    doorWindowLocations: string | null;
    notableDetails: string[];
    writtenNotes: string[];
    confidence: number; // 0-100 how confident the AI is
}

export interface PlanAnalysisResponse {
    success: boolean;
    analysis: PlanAnalysisResult | null;
    rawText?: string;
    error?: string;
}
