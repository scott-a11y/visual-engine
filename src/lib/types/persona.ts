export interface CabinetSpec {
    kitchen: {
        style: string;
        construction: string;
        integration: string[];
        finish_palette: string[];
        hardware: {
            default: string;
            optional: string;
            avoid: string;
        };
    };
    bath: {
        style: string;
        notes: string[];
    };
    original_casework_strategy: {
        keep_and_refinish: boolean;
        description: string;
    };
}

export interface FinishLevel {
    label: string;
    description: string;
    elements: string[];
}

export interface RiskProfile {
    capital_style: string;
    description: string;
    behavior: string[];
}

export interface HoldVsFlip {
    primary_strategy: string;
    listing_vibe: string;
    hold_vibe: string;
    staging_directives: {
        flip: string[];
        hold: string[];
    };
}

export interface PreservationEthos {
    label: string;
    principles: string[];
    visual_engine_hints: {
        scale: string;
        materials: string;
        composition: string;
    };
}

export interface AestheticFlags {
    avoid: string[];
    lean_into: string[];
}

export interface DeveloperPersona {
    id: string;
    name: string;
    role: string;
    market: string;
    archetype: string;
    finish_level: FinishLevel;
    cabinet_spec: CabinetSpec;
    risk_profile: RiskProfile;
    hold_vs_flip: HoldVsFlip;
    preservation_ethos: PreservationEthos;
    aesthetic_flags: AestheticFlags;
}
