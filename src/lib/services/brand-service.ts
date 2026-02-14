import { createClient } from '../supabase/client';
import { DEMO_COMPANIES, isDemoMode } from '../demo-data';
import type { Company } from '../types/database';

export async function getCompanyBranding(companyId?: string): Promise<Partial<Company> | null> {
    if (!companyId) return null;

    if (isDemoMode()) {
        return DEMO_COMPANIES.find(c => c.id === companyId) || DEMO_COMPANIES[0];
    }

    const supabase = createClient();

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

    if (error) {
        console.error('Error fetching company branding:', error);
        return null;
    }

    return data;
}

export async function getUserCompanyId(userId: string): Promise<string | null> {
    if (isDemoMode()) {
        const { data: { user } } = await createClient().auth.getUser();
        return user?.user_metadata?.company_id || null;
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user company ID:', error);
        return null;
    }

    return data?.company_id;
}
