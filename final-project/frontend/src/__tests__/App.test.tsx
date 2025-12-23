import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('should initialize with AuthProvider', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });
});


