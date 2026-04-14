const PUBLIC_PAGES = new Set<string>(['/', '/login', '/register']);

export function isPublicPage(path: string): boolean {
  return PUBLIC_PAGES.has(path);
}

export function getAuthRedirect(path: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && !isPublicPage(path)) {
    return '/login';
  }

  if (isAuthenticated && (path === '/login' || path === '/register')) {
    return '/events';
  }

  return null;
}

export function getAdminRedirect(role: string | undefined): string | null {
  if (!role) {
    return '/login';
  }

  if (role !== 'administrador') {
    return '/events';
  }

  return null;
}
