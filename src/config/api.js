export const LOCAL_API = 'http://localhost:5000';

// লোকাল টেস্টে মোবাইল থেকে খুললে (nip.io / laptop IP) backend ও laptop এর IP তে যাবে
const devApi = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return '';
  const h = window.location.hostname.toLowerCase();
  const m = h.match(/(\d{1,3}(?:\.\d{1,3}){3})(?:\.nip\.io)?$/);
  return m ? `http://${m[1]}:5000` : '';
};

export const API_BASE = (devApi() || import.meta.env.VITE_API_BASE_URL || LOCAL_API).replace(/\/+$/, '');

export default API_BASE;