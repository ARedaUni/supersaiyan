import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
    it('should display user input value', async () => {
        render(<Input label="Email Address" />);
        
        const input = screen.getByLabelText('Email Address');
        await userEvent.type(input, 'test@example.com');
        
        expect(input).toHaveValue('test@example.com');
    });

    it('should show error message when error prop is provided', () => {
        render(<Input label="Email" error="Email is required" />);
        
        expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should indicate required fields visually', () => {
        render(<Input label="Email" required />);
        
        expect(screen.getByText('*')).toBeInTheDocument();
    });
});