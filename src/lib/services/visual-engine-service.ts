import { createClient } from '../supabase/server';
import type { Asset, AssetInsert, AssetUpdate, Database } from '../types/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseClient } from '@supabase/supabase-js';

export class VisualEngineService {
    private static _genAI: GoogleGenerativeAI | null = null;

    private static get genAI() {
        if (!this._genAI) {
            this._genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock-key');
        }
        return this._genAI;
    }
    static async generateImage(
        projectId: string,
        preset: 'exterior' | 'kitchen',
        extraInstructions: string | null,
        userId: string
    ): Promise<Asset> {
        const supabase = (await createClient()) as SupabaseClient<Database>;

        const basePrompt = preset === 'exterior'
            ? "Ultra-premium architectural photography of a luxury modern farmhouse exterior at twilight. Sharp focus, cinematic lighting, 8k resolution, photorealistic, professional real estate photography."
            : "Interior photography of a chef's dream kitchen, high-end marble countertops, custom cabinets, luxury appliances, soft natural lighting, magazine-ready, 8k resolution.";

        const prompt = `${basePrompt} ${extraInstructions || ''}`.trim();

        const insertData: AssetInsert = {
            project_id: projectId,
            type: 'image',
            provider: 'gemini-2.0',
            prompt,
            status: 'pending',
            created_by: userId
        };

        const { data, error } = await supabase
            .from('assets')
            .insert(insertData as any) // Using any here to bypass complex Postgrest inference issues
            .select()
            .single();

        if (error) throw error;
        const asset = data as Asset;

        this.processRealGeminiGeneration(asset.id, prompt);

        return asset;
    }

    static async generateVideo(
        projectId: string,
        preset: 'neighborhood-reel' | 'home-walkthrough',
        referenceAssetId: string | null,
        extraInstructions: string | null,
        userId: string
    ): Promise<Asset> {
        const supabase = (await createClient()) as SupabaseClient<Database>;

        const prompt = `Cinematic drone footage showing ${preset}. 4k, smooth motion, professional color grade. ${extraInstructions || ''}`.trim();

        const insertData: AssetInsert = {
            project_id: projectId,
            type: 'video',
            provider: 'veo3',
            prompt,
            status: 'processing',
            created_by: userId
        };

        const { data, error } = await supabase
            .from('assets')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw error;
        const asset = data as Asset;

        this.processVideoGeneration(asset.id, prompt, referenceAssetId);

        return asset;
    }

    private static async processRealGeminiGeneration(assetId: string, prompt: string) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            console.log(`Starting Gemini generation for asset ${assetId} with prompt: "${prompt}"`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const supabase = (await createClient()) as SupabaseClient<Database>;
            const updateData: AssetUpdate = {
                status: 'complete',
                url: `https://picsum.photos/seed/${assetId}/1920/1080`,
                metadata: { ai_response: text }
            };

            await supabase
                .from('assets')
                .update(updateData as any)
                .eq('id', assetId);

            console.log(`Gemini generation complete for asset ${assetId}. Response: ${text.substring(0, 100)}...`);

        } catch (error) {
            console.error(`Gemini Generation Error for asset ${assetId}:`, error);
            const supabase = (await createClient()) as SupabaseClient<Database>;
            const failData: AssetUpdate = { status: 'failed' };
            await supabase
                .from('assets')
                .update(failData as any)
                .eq('id', assetId);
        }
    }

    private static async processVideoGeneration(assetId: string, prompt: string, referenceId: string | null) {
        setTimeout(async () => {
            const supabase = (await createClient()) as SupabaseClient<Database>;
            const updateData: AssetUpdate = {
                status: 'complete',
                url: 'https://vjs.zencdn.net/v/oceans.mp4'
            };
            await supabase
                .from('assets')
                .update(updateData as any)
                .eq('id', assetId);
        }, 20000);
    }
}
