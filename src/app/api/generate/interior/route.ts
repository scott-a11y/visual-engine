import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InteriorRenderingService, type InteriorRenderRequest } from '@/lib/services/interior-rendering-service';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body: InteriorRenderRequest = await request.json();

        // Validate input
        if (!body.room || !body.room.name) {
            return NextResponse.json(
                { success: false, error: 'Missing room data.' },
                { status: 400 }
            );
        }
        if (!body.style) {
            return NextResponse.json(
                { success: false, error: 'Missing architectural style.' },
                { status: 400 }
            );
        }

        const result = await InteriorRenderingService.generateRoomRendering(body);

        return NextResponse.json({
            success: true,
            rendering: result,
        });

    } catch (error) {
        console.error('[InteriorRoute] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Interior rendering failed.' },
            { status: 500 }
        );
    }
}
