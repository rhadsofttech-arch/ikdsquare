/**
 * Administrator Authentication & Authorization Helper
 * Evaluates configured ADMIN_EMAIL environment variable
 */

export const getAdminEmail = (): string => {
  const envEmail =
    (import.meta.env && import.meta.env.VITE_ADMIN_EMAIL) ||
    (typeof process !== 'undefined' && process.env && process.env.ADMIN_EMAIL) ||
    'adeniji@ikorodusquare.com.ng';
  return envEmail.trim().toLowerCase();
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === getAdminEmail();
};
