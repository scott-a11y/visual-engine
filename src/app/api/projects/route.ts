import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Project, ProjectInsert } from '@/lib/types/database';
import type { CreateProjectRequest } from '@/lib/types/api';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
        .from('projects')
        .select('*, assets(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body: CreateProjectRequest = await request.json();

    const projectData: ProjectInsert = {
        user_id: user.id,
        name: body.name,
        status: 'CREATED',
        address: body.address || null,
        style: body.style || null,
        stage: body.stage || null,
        notes: body.notes || null,
    };

    const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json(data);
}
