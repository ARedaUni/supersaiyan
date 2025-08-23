import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';


describe('Button', () => {
    it('renders a button', () => {
        render(<button>Click me</button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });
});



