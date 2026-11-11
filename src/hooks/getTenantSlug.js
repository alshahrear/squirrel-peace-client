const MAIN_DOMAIN = 'bashaybazar.com';

export const getTenantSlug = () => {
  const host = window.location.hostname.toLowerCase();
  let sub = '';
  if (host.endsWith('.localhost')) sub = host.slice(0, -'.localhost'.length);
  else if (host.endsWith('.' + MAIN_DOMAIN)) sub = host.slice(0, -('.' + MAIN_DOMAIN).length);
  if (!sub || sub.includes('.') || sub === 'www') return '';
  return sub;
};