import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const { data, error } = await supabase
            .from('companies')
            .insert({
                name: body.name,
                primary_color: body.primary_color || '#6366f1',
                contact_email: body.contact_email || null,
                contact_phone: body.contact_phone || null,
                website: body.website || null,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
