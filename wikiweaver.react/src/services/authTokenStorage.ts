const TOKEN_KEY = 'wikiweaver.admin.token';

export const getStoredAdminToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setStoredAdminToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredAdminToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};
