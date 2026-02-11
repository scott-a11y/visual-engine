import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';

describe('Button Component', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeDefined();
    });

    it('applies variant classes', () => {
        render(<Button variant="ghost">Ghost Button</Button>);
        const button = screen.getByText('Ghost Button');
        expect(button.className).toContain('hover:bg-accent');
    });
});
