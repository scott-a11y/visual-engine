import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VisualEngineService } from '@/lib/services/visual-engine-service';
import type { GenerateImageRequest } from '@/lib/types/api';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body: { projectId: string } & GenerateImageRequest = await request.json();

        const asset = await VisualEngineService.generateImage(
            body.projectId,
            body.preset,
            body.extraInstructions || null,
            user.id
        );

        return NextResponse.json(asset);
    } catch (error) {
        console.error('Image generation error:', error);
        return NextResponse.json({ message: 'Generation failed' }, { status: 500 });
    }
}
