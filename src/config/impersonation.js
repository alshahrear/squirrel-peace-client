// Support mode (admin login-as): token + user শুধু এই tab এ (sessionStorage) থাকে
const IMP_KEYS = ['clientToken', 'clientUser', 'draftAutoSaveEnabled'];
const isImpKey = (k) => IMP_KEYS.includes(k) || String(k).startsWith('draftData:');

if (typeof window !== 'undefined' && window.sessionStorage.getItem('impTab') === '1') {
    const ls = window.localStorage;
    const proto = Storage.prototype;
    const g = proto.getItem;
    const s = proto.setItem;
    const r = proto.removeItem;
    const pick = (self, k) => (self === ls && isImpKey(k) ? window.sessionStorage : self);
    proto.getItem = function (k) { return g.call(pick(this, k), k); };
    proto.setItem = function (k, v) { return s.call(pick(this, k), k, v); };
    proto.removeItem = function (k) { return r.call(pick(this, k), k); };

    const mount = () => {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;background:#b91c1c;color:#fff;padding:8px 12px;border-radius:12px;font:600 12px sans-serif;display:flex;gap:10px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.3)';
        const t = document.createElement('span');
        t.textContent = 'Support mode: ' + (window.sessionStorage.getItem('impLabel') || '');
        const b = document.createElement('button');
        b.textContent = 'Exit';
        b.style.cssText = 'background:#fff;color:#b91c1c;border:0;border-radius:8px;padding:3px 10px;font-weight:700;cursor:pointer';
        b.onclick = () => {
            window.sessionStorage.clear();
            window.close();
            setTimeout(() => { window.location.href = '/login-client'; }, 300);
        };
        bar.appendChild(t);
        bar.appendChild(b);
        document.body.appendChild(bar);
    };
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
}