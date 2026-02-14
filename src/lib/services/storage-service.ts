import { createClient } from '../supabase/client';
import { isDemoMode } from '../demo-data';

export async function uploadCompanyLogo(companyId: string, file: File): Promise<string | null> {
    if (isDemoMode()) {
        // In demo mode, we just return a placeholder or the same URL
        return URL.createObjectURL(file);
    }

    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/logo_${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filePath);

    // Update company record with new logo URL
    const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId);

    if (updateError) {
        console.error('Error updating company logo URL:', updateError);
    }

    return publicUrl;
}
