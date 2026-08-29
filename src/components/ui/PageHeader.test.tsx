import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the description only when provided', () => {
    const { rerender } = render(<PageHeader title="Dashboard" />);
    expect(screen.queryByText('Some description')).toBeNull();

    rerender(<PageHeader title="Dashboard" description="Some description" />);
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders extra content when provided', () => {
    render(<PageHeader title="Dashboard" extra={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
