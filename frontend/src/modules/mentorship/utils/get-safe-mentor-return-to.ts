export function getSafeReturnTo(returnTo?: string): string | null {
  if (!returnTo) {
    return null;
  }

  if (
    !returnTo.startsWith('/mentorship/mentors') ||
    returnTo.startsWith('//') ||
    returnTo.includes('\\') ||
    returnTo.includes('#')
  ) {
    return null;
  }

  try {
    const url = new URL(returnTo, 'http://localhost');

    if (url.origin !== 'http://localhost') {
      return null;
    }

    if (url.pathname !== '/mentorship/mentors') {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
