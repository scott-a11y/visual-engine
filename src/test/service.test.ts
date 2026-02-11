import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualEngineService } from '../lib/services/visual-engine-service';
import { createClient } from '../lib/supabase/server';

// Mock Supabase
vi.mock('../lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                        data: { id: 'test-id', project_id: 'proj-1', type: 'image', status: 'pending' },
                        error: null
                    }))
                }))
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
        }))
    }))
}));

describe('VisualEngineService', () => {
    it('should generate an image and trigger AI processing', async () => {
        const asset = await VisualEngineService.generateImage(
            'proj-1',
            'exterior',
            'modern house',
            'user-1'
        );

        expect(asset.id).toBe('test-id');
        expect(asset.project_id).toBe('proj-1');
    });
});
