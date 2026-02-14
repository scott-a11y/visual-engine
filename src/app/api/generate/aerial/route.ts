import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AerialRenderingService, type AerialRenderRequest } from '@/lib/services/aerial-rendering-service';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body: AerialRenderRequest = await request.json();

        // Validate input
        if (!body.plan) {
            return NextResponse.json(
                { success: false, error: 'Missing plan analysis data.' },
                { status: 400 }
            );
        }

        const result = await AerialRenderingService.generateAerialRendering(body);

        return NextResponse.json({
            success: true,
            rendering: result,
        });

    } catch (error) {
        console.error('[AerialRoute] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Aerial rendering failed.' },
            { status: 500 }
        );
    }
}
