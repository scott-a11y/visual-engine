import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PlanAnalysisService } from '@/lib/services/plan-analysis-service';
import type { PlanAnalysisResponse } from '@/lib/types/plan-analysis';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' } as PlanAnalysisResponse, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' } as PlanAnalysisResponse, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Accepted: PNG, JPEG, WebP, PDF' } as PlanAnalysisResponse,
                { status: 400 }
            );
        }

        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum 20MB.' } as PlanAnalysisResponse,
                { status: 400 }
            );
        }

        // Convert to base64 for Gemini
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');

        console.log(`[PlanAnalysis] Analyzing ${file.name} (${(file.size / 1024).toFixed(1)}KB, ${file.type})`);

        const analysis = await PlanAnalysisService.analyzePlan(base64, file.type);

        const response: PlanAnalysisResponse = {
            success: true,
            analysis,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Plan analysis error:', error);
        return NextResponse.json(
            { success: false, analysis: null, error: String(error) } as PlanAnalysisResponse,
            { status: 500 }
        );
    }
}
