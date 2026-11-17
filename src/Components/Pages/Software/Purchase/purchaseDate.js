const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// "06 Sep 2026" -> "2026-09-06"
export const labelToISO = (s) => {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = String(s).match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
    if (!m || M[m[2]] === undefined) return '';
    return `${m[3]}-${String(M[m[2]] + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

// "2026-09-06" -> "06 Sep 2026"
export const isoToLabel = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};