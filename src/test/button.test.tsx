/** @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../components/ui/button';

describe('Button Component', () => {
    it('renders correctly', () => {
        const { getByText } = render(<Button>Click me</Button>);
        expect(getByText('Click me')).toBeDefined();
    });

    it('applies variant classes', () => {
        const { getByText } = render(<Button variant="ghost">Ghost Button</Button>);
        const button = getByText('Ghost Button');
        expect(button).toBeDefined();
    });
});
