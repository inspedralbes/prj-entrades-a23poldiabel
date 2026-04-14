import { describe, expect, it } from 'vitest';
import { getAdminRedirect, getAuthRedirect, isPublicPage } from '../../src/utils/routeAccess';

describe('route access helpers', () => {
  it('marks expected public pages correctly', () => {
    expect(isPublicPage('/')).toBe(true);
    expect(isPublicPage('/login')).toBe(true);
    expect(isPublicPage('/register')).toBe(true);
    expect(isPublicPage('/events')).toBe(false);
  });

  it('redirects unauthenticated users to login on private pages', () => {
    expect(getAuthRedirect('/events', false)).toBe('/login');
  });

  it('redirects authenticated users away from login/register', () => {
    expect(getAuthRedirect('/login', true)).toBe('/events');
    expect(getAuthRedirect('/register', true)).toBe('/events');
  });

  it('does not redirect when auth access is valid', () => {
    expect(getAuthRedirect('/events', true)).toBeNull();
  });

  it('handles admin route redirects', () => {
    expect(getAdminRedirect(undefined)).toBe('/login');
    expect(getAdminRedirect('comprador')).toBe('/events');
    expect(getAdminRedirect('administrador')).toBeNull();
  });
});
