const MAIN_DOMAIN = 'bashaybazar.com';

// শুধু লোকাল টেস্টে (মোবাইলে): clientbaba.192.168.68.105.nip.io
const NIP_RULE = /^(?:([a-z0-9-]+)\.)?\d{1,3}(?:\.\d{1,3}){3}\.nip\.io$/;

export const getTenantSlug = () => {
  const host = window.location.hostname.toLowerCase();
  let sub = '';
  if (host.endsWith('.localhost')) sub = host.slice(0, -'.localhost'.length);
  else if (host.endsWith('.' + MAIN_DOMAIN)) sub = host.slice(0, -('.' + MAIN_DOMAIN).length);
  else if (import.meta.env.DEV) {
    const m = host.match(NIP_RULE);
    if (m) sub = m[1] || '';
  }
  if (!sub || sub.includes('.') || sub === 'www') return '';
  return sub;
};