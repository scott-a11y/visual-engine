import { describe, it, expect, vi } from 'vitest';
import { VisualEngineService } from '../lib/services/visual-engine-service';
import { DEMO_PERSONAS } from '../lib/demo-data';

// We need to access the private buildPrompt method or mock enough to verify output
// Since it's private, we'll verify it via a public method if possible, or use a test-only export

describe('VisualEngineService Persona Logic', () => {
    it('should include Dallis Raynor traits in the prompt when his persona is linked', () => {
        const projectContext = {
            name: 'SE 78th & Washington',
            style: '1920s Bungalow',
            notes: 'Test project',
            persona_id: 'persona_dallis_raynor'
        };

        // @ts-ignore - accessing private for testing logic
        const prompt = VisualEngineService.buildPrompt('kitchen', projectContext);

        // Verify Dallis specific traits are in the prompt
        expect(prompt).toContain('Rehab & Infill Preservationist');
        expect(prompt).toContain('Modest high-end preservation');
        expect(prompt).toContain('Simple Shaker');
        expect(prompt).toContain('warm whites and light taupes');
        expect(prompt).toContain('Warm daylight');
    });

    it('should stay neutral for generic projects (no persona)', () => {
        const projectContext = {
            name: 'Generic Project',
            style: 'Modern',
            notes: 'Basic test',
            persona_id: null
        };

        // @ts-ignore - accessing private for testing logic
        const prompt = VisualEngineService.buildPrompt('kitchen', projectContext);

        console.log('Generic Prompt:', prompt);

        expect(prompt).not.toContain('Rehab & Infill Preservationist');
        expect(prompt).toContain("chef's dream kitchen"); // From standard preset
    });
});
