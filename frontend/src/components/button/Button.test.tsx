import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
    it('should execute action when user clicks', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Save Changes</Button>);

        await userEvent.click(screen.getByText('Save Changes'));

        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should not execute action when disabled', async () => {
        const handleClick = vi.fn();
        render(
            <Button onClick={handleClick} disabled>
                Save Changes
            </Button>
        );

        await userEvent.click(screen.getByText('Save Changes'));

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should show loading state when processing', () => {
        render(
            <Button loading>
                Save Changes
            </Button>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should prevent multiple submissions during loading', async () => {
        const handleClick = vi.fn();
        render(
            <Button onClick={handleClick} loading>
                Save Changes
            </Button>
        );

        await userEvent.click(screen.getByText('Loading...'));

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be accessible via keyboard', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Save Changes</Button>);

        const button = screen.getByText('Save Changes');
        button.focus();
        await userEvent.keyboard('{Enter}');

        expect(handleClick).toHaveBeenCalledOnce();
    });
});

