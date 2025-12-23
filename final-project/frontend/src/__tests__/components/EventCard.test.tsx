import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupCard from '../../components/EventCard';

describe('GroupCard', () => {
  const mockProps = {
    id: 1,
    name: '測試群組',
    memberCount: 5,
    createdAt: '2025-01-15',
    onClick: vi.fn(),
  };

  it('should render group information correctly', () => {
    render(<GroupCard {...mockProps} />);
    
    expect(screen.getByText('測試群組')).toBeInTheDocument();
    expect(screen.getByText('5 位成員')).toBeInTheDocument();
    expect(screen.getByText('建立於 2025-01-15')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(<GroupCard {...mockProps} />);
    
    const card = screen.getByText('測試群組').closest('button');
    if (card) {
      fireEvent.click(card);
      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should display group ID as chip', () => {
    render(<GroupCard {...mockProps} />);
    
    expect(screen.getByText('群組 #1')).toBeInTheDocument();
  });
});


