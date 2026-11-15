import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../../components/Header';

vi.mock('../../../components/collaboration/PresenceBar', () => ({
  PresenceBar: () => <div data-testid="presence-bar" />,
}));

vi.mock('../../../components/ConnectionStatus', () => ({
  ConnectionStatus: () => <div data-testid="connection-status" />,
}));

vi.mock('../../../components/PricingModal', () => ({
  PricingModal: () => null,
}));

vi.mock('../../../components/DropdownMenu', () => ({
  DropdownMenu: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}));

describe('Header accessibility and zoom menu UX', () => {
  const defaultProps = {
    onDownload: vi.fn(),
    zoom: 1,
    onZoomChange: vi.fn(),
    showGrid: false,
    onToggleGrid: vi.fn(),
    showRulers: false,
    onToggleRulers: vi.fn(),
  };

  it('exposes ARIA state on zoom trigger, menu items, save status, and Agent toggle', () => {
    render(<Header {...defaultProps} />);

    const zoomTrigger = screen.getByRole('button', { name: /Canvas zoom level: 100%/i });
    expect(zoomTrigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(zoomTrigger).toHaveAttribute('aria-expanded', 'false');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open AI tools' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(zoomTrigger);

    expect(zoomTrigger).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('menu', { name: 'Zoom levels' });
    expect(menu).toBeInTheDocument();

    const activeItem = screen.getByRole('menuitem', { name: '100%' });
    expect(activeItem).toHaveAttribute('aria-current', 'true');
  });

  it('closes the zoom menu on Escape and returns focus to the trigger', () => {
    render(<Header {...defaultProps} />);

    const zoomTrigger = screen.getByRole('button', { name: /Canvas zoom level: 100%/i });
    fireEvent.click(zoomTrigger);
    expect(screen.getByRole('menu', { name: 'Zoom levels' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu', { name: 'Zoom levels' })).not.toBeInTheDocument();
    expect(zoomTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(zoomTrigger);
  });
});
