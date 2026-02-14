import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VisualEngineService } from '@/lib/services/visual-engine-service';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { context } = await request.json();
        const copy = await VisualEngineService.generateMarketingCopy(context);

        return NextResponse.json({ copy });
    } catch (error) {
        console.error('Copy generation error:', error);
        return NextResponse.json({ message: 'Generation failed' }, { status: 500 });
    }
}
