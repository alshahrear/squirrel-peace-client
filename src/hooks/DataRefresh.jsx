import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, LOCAL_API } from '../config/api';

const API = API_BASE;
let knownVersion = null;
let pendingWrites = 0;

// ---------- Global fetch patch (ekbar e install hobe) ----------
if (typeof window !== 'undefined' && !window.__fetchPatched) {
    window.__fetchPatched = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
        let url = typeof input === 'string' ? input : input?.url || input?.href || String(input || '');
        // localhost:5000 -> VITE_API_BASE_URL (production-এ Render URL)
        if (API !== LOCAL_API && url.startsWith(LOCAL_API)) {
            url = API + url.slice(LOCAL_API.length);
            input = (typeof input === 'string' || !input?.url) ? url : new Request(url, input);
        }
        if (!url.startsWith(API)) return originalFetch(input, init);

        const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();

        // client / admin token auto jog hobe (login, feature, data-version bade)
        const rel = url.slice(API.length);
        const skipAuth = rel.startsWith('/client/login') || rel.startsWith('/gate') || rel.startsWith('/jwt');
        const hdrs = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
        if (!skipAuth && !hdrs.has('authorization')) {
            const t = localStorage.getItem('clientToken') || localStorage.getItem('access-token');
            if (t) hdrs.set('authorization', `Bearer ${t}`);
        }
        init = { ...init, headers: hdrs };

        // GET: kokhono browser cache theke dekhabe na
        if (method === 'GET') return originalFetch(input, { ...init, cache: 'no-store' });

        // POST / PUT / PATCH / DELETE: successful hole data change mark hobe
        pendingWrites++;
        const done = () => { pendingWrites = Math.max(0, pendingWrites - 1); };
        return originalFetch(input, init)
            .then(async (res) => {
                if (res.ok) {
                    try {
                        const r = await originalFetch(`${API}/data-version`, { cache: 'no-store', headers: hdrs });
                        if (r.ok) {
                            const d = await r.json();
                            knownVersion = String(d.version);
                        }
                    } catch (e) { /* ignore */ }
                }
                done();
                return res;
            })
            .catch((err) => { done(); throw err; });
    };
}

// ---------- Axios patch (default axios + axios.create() instance duitar jonno) ----------
export const patchAxios = (instance) => {
    if (!instance || instance.__dataPatched) return instance;
    instance.__dataPatched = true;

    instance.interceptors.request.use((config) => {
        if (API !== LOCAL_API) {
            if (typeof config.url === 'string' && config.url.startsWith(LOCAL_API)) config.url = API + config.url.slice(LOCAL_API.length);
            if (typeof config.baseURL === 'string' && config.baseURL.startsWith(LOCAL_API)) config.baseURL = API + config.baseURL.slice(LOCAL_API.length);
        }
        const method = (config.method || 'get').toUpperCase();
        if (method !== 'GET') {
            pendingWrites++;
            config.__counted = true;
        }
        return config;
    });

    instance.interceptors.response.use(
        async (res) => {
            if (res.config?.__counted) {
                try {
                    const r = await fetch(`${API}/data-version`);
                    if (r.ok) {
                        const d = await r.json();
                        knownVersion = String(d.version);
                    }
                } catch (e) { /* ignore */ }
                pendingWrites = Math.max(0, pendingWrites - 1);
            }
            return res;
        },
        (err) => {
            if (err.config?.__counted) pendingWrites = Math.max(0, pendingWrites - 1);
            return Promise.reject(err);
        }
    );
    return instance;
};

patchAxios(axios);

const FORM_PATH = /(add|form|create|assign)/i;
const DataRefresh = () => {
    const [tick, setTick] = useState(0);
    const location = useLocation();
    const pathRef = useRef(location.pathname);
    pathRef.current = location.pathname;

    useEffect(() => {
        const check = async () => {
            if (document.visibilityState !== 'visible' || pendingWrites > 0) return;
            try {
                const res = await fetch(`${API}/data-version`);
                if (!res.ok) return;
                const d = await res.json();
                const cur = String(d.version);
                if (knownVersion === null) {
                    knownVersion = cur;
                    return;
                }
                if (cur === knownVersion) return;
                // form page e thakle input hariye jabe, tai skip
                if (FORM_PATH.test(pathRef.current)) return;
                knownVersion = cur;
                setTick((t) => t + 1);
            } catch (e) {
                // ignore
            }
        };

        check();
        const timer = setInterval(check, 4000);
        window.addEventListener('focus', check);
        document.addEventListener('visibilitychange', check);
        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', check);
            document.removeEventListener('visibilitychange', check);
        };
    }, []);

    return <Outlet key={tick} />;
};

export default DataRefresh;