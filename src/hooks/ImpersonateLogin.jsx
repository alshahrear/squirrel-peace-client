import { useEffect, useState } from 'react';
import { API_BASE } from '../config/api';

const getSlug = () => {
    const h = window.location.hostname;
    if (h.endsWith('.bashaybazar.com') || h.endsWith('.localhost')) return h.split('.')[0];
    return '';
};

// code একবারই server এ যাবে (page remount হলেও)
let exchangePromise = null;
const doExchange = (code) => {
    if (exchangePromise) return exchangePromise;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    exchangePromise = fetch(`${API_BASE}/client/impersonate/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, slug: getSlug() }),
        signal: ctrl.signal,
    })
        .then(async (r) => {
            const d = await r.json().catch(() => ({}));
            if (!r.ok || !d.token) throw new Error(d.message || `Login failed (${r.status})`);
            return d;
        })
        .finally(() => clearTimeout(timer));
    return exchangePromise;
};

const ImpersonateLogin = () => {
    const [msg, setMsg] = useState('Logging in...');

    useEffect(() => {
        const urlCode = new URLSearchParams(window.location.search).get('code');
        if (urlCode) {
            window.sessionStorage.setItem('impPendingCode', urlCode);
            window.history.replaceState({}, '', '/impersonate');
        }
        const code = urlCode || window.sessionStorage.getItem('impPendingCode');
        if (!code) { setMsg('Invalid link.'); return; }

        doExchange(code)
            .then((d) => {
                const ss = window.sessionStorage;
                ss.removeItem('impPendingCode');
                ss.setItem('impTab', '1');
                ss.setItem('impLabel', `${d.client?.name || ''}${d.client?.role ? ' (' + d.client.role + ')' : ' (Super Admin)'}`);
                ss.setItem('clientToken', d.token);
                ss.setItem('clientUser', JSON.stringify(d.client));
                window.location.replace('/dashboard');
            })
            .catch((e) => {
                window.sessionStorage.removeItem('impPendingCode');
                setMsg(
                    e.name === 'AbortError'
                        ? 'Server সাড়া দিচ্ছে না। কিছুক্ষণ পর admin panel থেকে আবার Login চাপুন।'
                        : e.message || 'Login failed'
                );
            });
    }, []);

    return (
        <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-600 px-4 text-center">
            {msg}
        </div>
    );
};

export default ImpersonateLogin;