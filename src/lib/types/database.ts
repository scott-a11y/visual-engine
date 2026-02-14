/**
 * Visual Engine Database Type Definitions
 */

export type ProjectStatus = 'CREATED' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AssetType = 'image' | 'video';
export type AssetStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type UserType = 'admin' | 'member';

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string;
                    name: string;
                    logo_url: string | null;
                    primary_color: string;
                    contact_email: string | null;
                    contact_phone: string | null;
                    website: string | null;
                    created_at: string;
                };
                Insert: {
                    name: string;
                    logo_url?: string | null;
                    primary_color?: string;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    website?: string | null;
                };
                Update: {
                    name?: string;
                    logo_url?: string | null;
                    primary_color?: string;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    website?: string | null;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    company_id: string | null;
                    role: string;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    company_id?: string | null;
                    role?: string;
                };
                Update: {
                    full_name?: string | null;
                    company_id?: string | null;
                    role?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    company_id: string | null;
                    name: string;
                    status: ProjectStatus;
                    address: string | null;
                    style: string | null;
                    stage: string | null;
                    notes: string | null;
                    persona_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    company_id?: string | null;
                    name: string;
                    status?: ProjectStatus;
                    address?: string | null;
                    style?: string | null;
                    stage?: string | null;
                    notes?: string | null;
                    persona_id?: string | null;
                };
                Update: {
                    company_id?: string | null;
                    name?: string;
                    status?: ProjectStatus;
                    address?: string | null;
                    style?: string | null;
                    stage?: string | null;
                    notes?: string | null;
                    persona_id?: string | null;
                };
            };
            assets: {
                Row: {
                    id: string;
                    project_id: string;
                    type: AssetType;
                    provider: string;
                    prompt: string;
                    status: AssetStatus;
                    external_job_id: string | null;
                    url: string | null;
                    created_by: string;
                    metadata: any;
                    created_at: string;
                };
                Insert: {
                    project_id: string;
                    type: AssetType;
                    provider: string;
                    prompt: string;
                    status?: AssetStatus;
                    external_job_id?: string | null;
                    url?: string | null;
                    created_by: string;
                    metadata?: any;
                };
                Update: {
                    status?: AssetStatus;
                    external_job_id?: string | null;
                    url?: string | null;
                    metadata?: any;
                };
            };
        };
        Enums: {
            project_status: ProjectStatus;
            asset_type: AssetType;
            asset_status: AssetStatus;
        };
    };
}

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Asset = Database['public']['Tables']['assets']['Row'];
export type AssetInsert = Database['public']['Tables']['assets']['Insert'];
export type AssetUpdate = Database['public']['Tables']['assets']['Update'];

export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
