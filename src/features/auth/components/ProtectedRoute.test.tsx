import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const useAuth = vi.fn();
vi.mock('../AuthContext', () => ({ useAuth: () => useAuth() }));

const { default: ProtectedRoute } = await import('./ProtectedRoute');

const renderWithRoute = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/" element={<div>Landing Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('shows a loading spinner while auth state is still resolving', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { container } = renderWithRoute();
    expect(container.querySelector('.ant-spin')).toBeTruthy();
    expect(screen.queryByText('Dashboard Content')).toBeNull();
  });

  it('redirects to the landing page when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderWithRoute();
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).toBeNull();
  });

  it('renders the protected content once authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWithRoute();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
