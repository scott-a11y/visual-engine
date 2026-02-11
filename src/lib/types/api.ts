import type {
    ProjectStatus, Project, Asset, AssetType, AssetStatus
} from './database';

export interface CreateProjectRequest {
    name: string;
    companyId?: string;
    address?: string;
    style?: string;
    stage?: string;
    notes?: string;
}

export interface UpdateProjectRequest {
    name?: string;
    status?: ProjectStatus;
}

export interface ProjectResponse extends Project {
    assets?: Asset[];
}

export interface GenerateImageRequest {
    preset: 'exterior' | 'kitchen';
    extraInstructions?: string;
}

export interface GenerateVideoRequest {
    preset: 'neighborhood-reel' | 'home-walkthrough';
    referenceAssetId?: string;
    extraInstructions?: string;
}

export type { ProjectStatus, Project, Asset, AssetType, AssetStatus } from './database';
