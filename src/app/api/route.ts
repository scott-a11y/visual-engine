import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ message: 'Missing projectId' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch assets
        const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (assetsError) {
            return NextResponse.json({ message: assetsError.message }, { status: 500 });
        }

        return NextResponse.json(assets);
    } catch (error) {
        console.error('Error in GET /api/assets:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
