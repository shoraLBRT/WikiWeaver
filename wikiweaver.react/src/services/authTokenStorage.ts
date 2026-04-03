const TOKEN_KEY = 'wikiweaver.admin.token';

export const ADMIN_SESSION_EXPIRED_EVENT = 'wikiweaver:admin-session-expired';

export const getStoredAdminToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setStoredAdminToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredAdminToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const notifyAdminSessionExpired = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
};
