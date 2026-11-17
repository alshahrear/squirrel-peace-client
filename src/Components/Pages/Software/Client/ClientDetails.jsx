import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaUser, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaToggleOn,
    FaSignInAlt, FaWhatsapp, FaHistory, FaUsers, FaCalendarAlt, FaGlobe,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import useAxiosSecure from '../../../../hooks/useAxiosSecure';

const InfoCard = ({ icon, label, children, iconBg = 'bg-brand-50 text-brand-600' }) => (
    <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">{label}</p>
            <div className="text-sm font-semibold text-slate-800 break-words">{children}</div>
        </div>
    </div>
);

const NA = () => <span className="text-slate-400 italic font-normal">N/A</span>;

const fmtDT = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d) ? null : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};
const ago = (v) => {
    if (!v) return '';
    const s = Math.max(Math.floor((Date.now() - new Date(v).getTime()) / 1000), 0);
    if (s < 60) return 'এইমাত্র';
    if (s < 3600) return `${Math.floor(s / 60)} মিনিট আগে`;
    if (s < 86400) return `${Math.floor(s / 3600)} ঘণ্টা আগে`;
    return `${Math.floor(s / 86400)} দিন আগে`;
};
const REASON = {
    self: 'নিজে logout',
    force_admin: 'Admin force logout',
    force_dealer: 'Dealer force logout',
    new_login: 'অন্য জায়গায় login করায়',
    password_changed: 'Password বদলেছে',
    password_reset: 'Password reset',
    inactive: 'Inactive করা হয়েছে',
    admin_login_as: 'Admin login-as',
    wrong_password: 'ভুল email / password',
};
const EVENT_STYLE = {
    login: 'bg-emerald-50 text-emerald-700',
    logout: 'bg-slate-100 text-slate-600',
    failed: 'bg-rose-50 text-rose-700',
    impersonation: 'bg-amber-50 text-amber-700',
};
const EVENT_LABEL = { login: 'Login', logout: 'Logout', failed: 'Failed', impersonation: 'Admin Login-as' };

const fieldCls =
    'px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const SectionHead = ({ icon, title, children }) => (
    <div className="px-4 sm:px-5 py-3.5 bg-brand-900 text-white flex flex-wrap items-center gap-3">
        <span className="text-brand-200">{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
        {children}
    </div>
);

const ClientDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [users, setUsers] = useState([]);
    const [loginInfo, setLoginInfo] = useState(null);
    const [hFilter, setHFilter] = useState({ user: '', event: '', q: '' });
    const [hPage, setHPage] = useState(1);

    useEffect(() => {
        let alive = true;
        const load = () =>
            axiosSecure
                .get(`/client/${id}/login-info`)
                .then((r) => { if (alive) setLoginInfo(r.data); })
                .catch(() => { });
        load();
        const t = setInterval(load, 20000);
        return () => { alive = false; clearInterval(t); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        axiosSecure
            .get(`/client/${id}/users`)
            .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
            .catch(() => setUsers([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleImpersonate = async (u) => {
        const r = await Swal.fire({
            title: 'Login করতে চান?',
            text: `${u.name} (${u.role}) এর account এ password ছাড়া নতুন tab এ login হবে।`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'হ্যাঁ, login করব',
            cancelButtonText: 'না',
        });
        if (!r.isConfirmed) return;
        const w = window.open('', '_blank');
        if (!w) {
            Swal.fire({ icon: 'error', title: 'Popup block হয়েছে', text: 'Browser এ popup allow করুন।' });
            return;
        }
        try {
            const res = await axiosSecure.post('/client/impersonate', {
                clientId: client._id,
                staffId: u.isDealer ? undefined : u._id,
            });
            const { code, slug } = res.data;
            const isLocal = window.location.hostname.endsWith('localhost');
            const base = isLocal
                ? `http://${slug}.localhost:${window.location.port || 5173}`
                : `https://${slug}.bashaybazar.com`;
            try { w.opener = null; } catch (e) { }
            w.location.href = `${base}/impersonate?code=${code}`;
        } catch (err) {
            w.close();
            Swal.fire({ icon: 'error', title: 'Failed', text: err?.response?.data?.message || 'Login করা যায়নি' });
        }
    };

    const handleForceLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to log out ${client.name || client.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, log out!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                await axiosSecure.patch(`/client/login-status/${client._id}`, { login: 'no' });
                setClient((prev) => ({ ...prev, login: 'no' }));
                toast.success('Client has been logged out successfully.');
            } catch (error) {
                console.error('Error logging out client:', error);
                toast.error('Something went wrong.');
            }
        });
    };

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await axiosSecure.get(`/client/${id}`);
                if (res.data && res.data._id) setClient(res.data);
                else setNotFound(true);
            } catch (error) {
                console.error('Error fetching client:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen p-3 sm:p-5 md:p-8">
                <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
                    <div className="h-9 w-40 rounded-full bg-white/70" />
                    <div className="h-32 rounded-2xl bg-white/70 border border-slate-200" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/70 border border-slate-200" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !client) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaUser size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Client Not Found</h2>
                    <p className="text-sm text-slate-500 mb-6">This client does not exist or has been deleted.</p>
                    <button type="button" onClick={() => navigate('/client')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold cursor-pointer">
                        <FaArrowLeft size={12} /> Back to Clients
                    </button>
                </div>
            </div>
        );
    }

    const initials = (client.name || 'C').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    let createdDate = client.createdAt ? new Date(client.createdAt) : null;
    if (!createdDate || isNaN(createdDate)) {
        createdDate = /^[0-9a-fA-F]{24}$/.test(client._id || '')
            ? new Date(parseInt(client._id.substring(0, 8), 16) * 1000)
            : null;
    }

    const allUsers = [
        { _id: client._id, name: client.name, email: client.email, phone: client.phone, role: 'Super Admin', isActive: client.isActive, isDealer: true },
        ...users,
    ];

    const ActiveBadge = ({ active, inactiveLabel = 'Non-Active' }) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {active ? 'Active' : inactiveLabel}
        </span>
    );

    const LoginBtn = ({ u }) => (
        <button type="button" onClick={() => handleImpersonate(u)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer">
            <FaSignInAlt size={11} /> Login
        </button>
    );

    // ---------- Login & Session ----------
    const renderLoginSession = () => {
        if (!loginInfo) return null;
        const now = new Date(loginInfo.now).getTime();
        const rows = loginInfo.users || [];
        const isOnline = (u) => u.login === 'yes' && u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000;
        const onlineCount = rows.filter(isOnline).length;
        const q = hFilter.q.trim().toLowerCase();
        const hist = (loginInfo.history || []).filter((h) =>
            (!hFilter.user || h.userKey === hFilter.user) &&
            (!hFilter.event || h.event === hFilter.event) &&
            (!q || `${h.name || ''} ${h.email || ''} ${h.ip || ''} ${h.device || ''}`.toLowerCase().includes(q))
        );
        const PER = 20;
        const pages = Math.max(Math.ceil(hist.length / PER), 1);
        const pg = Math.min(hPage, pages);
        const slice = hist.slice((pg - 1) * PER, pg * PER);

        const OnlineBadge = ({ u }) =>
            isOnline(u) ? (
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Online</span>
            ) : u.login === 'yes' ? (
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">Session open (inactive)</span>
            ) : (
                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">Offline</span>
            );

        return (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <SectionHead icon={<FaHistory />} title="Login & Session">
                    <span className="sm:ml-auto flex flex-wrap gap-2 text-[11px] font-semibold">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-100">Online: {onlineCount} / {rows.length}</span>
                        <span className="px-2.5 py-1 rounded-full bg-rose-400/20 text-rose-100">Failed (24h): {loginInfo.failed24h || 0}</span>
                    </span>
                </SectionHead>

                {/* Summary: mobile cards */}
                <div className="md:hidden p-3 space-y-3">
                    {rows.map((u) => (
                        <div key={u.userKey} className={`rounded-xl border p-3.5 text-sm ${u.isDealer ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 break-words">{u.isDealer ? '👑 ' : ''}{u.name}</p>
                                    <p className="text-xs text-slate-400 break-all">{u.role} · {u.email}</p>
                                </div>
                                <OnlineBadge u={u} />
                            </div>
                            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                <div><dt className="text-slate-400">Last Login</dt><dd className="font-medium text-slate-700">{fmtDT(u.lastLoginAt) || 'N/A'}{u.lastLoginAt && <span className="block text-[10px] text-slate-400">{ago(u.lastLoginAt)}</span>}</dd></div>
                                <div><dt className="text-slate-400">IP / Device</dt><dd className="font-medium text-slate-700 break-all">{u.lastLoginIp || 'N/A'}<span className="block text-[10px] text-slate-400">{u.lastLoginDevice || ''}</span></dd></div>
                                <div><dt className="text-slate-400">Last Active</dt><dd className="font-medium text-slate-700">{fmtDT(u.lastActiveAt) || 'N/A'}</dd></div>
                                <div><dt className="text-slate-400">Logins</dt><dd className="font-bold text-slate-700">{u.loginCount || 0}</dd></div>
                                <div className="col-span-2"><dt className="text-slate-400">Last Logout</dt><dd className="font-medium text-slate-700">{fmtDT(u.lastLogoutAt) || 'N/A'}{u.lastLogoutReason && <span className="text-[10px] text-slate-400"> · {REASON[u.lastLogoutReason] || u.lastLogoutReason}</span>}</dd></div>
                                {u.login === 'yes' && u.sessionStartedAt && (
                                    <div className="col-span-2 text-[10px] text-slate-400">Session শুরু: {ago(u.sessionStartedAt)}</div>
                                )}
                            </dl>
                        </div>
                    ))}
                </div>

                {/* Summary: md+ table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Last Login</th>
                                <th className="px-4 py-3">IP / Device</th>
                                <th className="px-4 py-3">Last Active</th>
                                <th className="px-4 py-3">Last Logout</th>
                                <th className="px-4 py-3 text-center">Logins</th>
                                <th className="px-4 py-3">Password / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {rows.map((u) => (
                                <tr key={u.userKey} className={u.isDealer ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'}>
                                    <td className="px-4 py-3">
                                        <p className="font-bold">{u.isDealer ? '👑 ' : ''}{u.name}</p>
                                        <p className="text-[10px] text-slate-400">{u.role} · {u.email}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <OnlineBadge u={u} />
                                        {u.login === 'yes' && u.sessionStartedAt && (
                                            <p className="text-[10px] text-slate-400 mt-1">Session শুরু: {ago(u.sessionStartedAt)}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {fmtDT(u.lastLoginAt) || <NA />}
                                        {u.lastLoginAt && <p className="text-[10px] text-slate-400">{ago(u.lastLoginAt)}</p>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {u.lastLoginIp || <NA />}
                                        <p className="text-[10px] text-slate-400">{u.lastLoginDevice || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {fmtDT(u.lastActiveAt) || <NA />}
                                        {u.lastActiveAt && <p className="text-[10px] text-slate-400">{ago(u.lastActiveAt)}</p>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {fmtDT(u.lastLogoutAt) || <NA />}
                                        {u.lastLogoutReason && <p className="text-[10px] text-slate-400">{REASON[u.lastLogoutReason] || u.lastLogoutReason}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold">{u.loginCount || 0}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-[10px] text-slate-500">
                                        <p>Password: {fmtDT(u.passwordChangedAt) || 'N/A'}</p>
                                        <p>Status: {fmtDT(u.statusChangedAt) ? `${fmtDT(u.statusChangedAt)} (${u.statusChangedBy || '-'})` : 'N/A'}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* History filters */}
                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/70">
                    <p className="text-xs font-bold text-slate-600 mb-2">Login History ({hist.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <select value={hFilter.user} onChange={(e) => { setHFilter({ ...hFilter, user: e.target.value }); setHPage(1); }} className={`${fieldCls} cursor-pointer`}>
                            <option value="">All Users</option>
                            {rows.map((u) => <option key={u.userKey} value={u.userKey}>{u.name}</option>)}
                            <option value="unknown">Unknown (failed)</option>
                        </select>
                        <select value={hFilter.event} onChange={(e) => { setHFilter({ ...hFilter, event: e.target.value }); setHPage(1); }} className={`${fieldCls} cursor-pointer`}>
                            <option value="">All Events</option>
                            {Object.keys(EVENT_LABEL).map((k) => <option key={k} value={k}>{EVENT_LABEL[k]}</option>)}
                        </select>
                        <input value={hFilter.q} onChange={(e) => { setHFilter({ ...hFilter, q: e.target.value }); setHPage(1); }}
                            placeholder="Search name / email / IP / device" className={`${fieldCls} sm:col-span-2 lg:col-span-1`} />
                        {(hFilter.user || hFilter.event || hFilter.q) && (
                            <button type="button" onClick={() => { setHFilter({ user: '', event: '', q: '' }); setHPage(1); }}
                                className="min-h-[40px] px-4 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border-0 cursor-pointer">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* History: mobile cards */}
                <div className="md:hidden p-3 space-y-2.5">
                    {slice.length === 0 && <p className="py-6 text-center text-sm text-slate-400">কোনো history নেই</p>}
                    {slice.map((h) => (
                        <div key={h._id} className="rounded-xl border border-slate-200 p-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${EVENT_STYLE[h.event] || 'bg-slate-100 text-slate-600'}`}>{EVENT_LABEL[h.event] || h.event}</span>
                                <span className="text-slate-400">{fmtDT(h.at)}</span>
                            </div>
                            <p className="mt-1.5 font-semibold text-slate-800">{h.name || '—'} <span className="font-normal text-slate-400 break-all">{h.email}</span></p>
                            {(h.reason || h.by) && <p className="text-slate-500">{REASON[h.reason] || h.reason || ''}{h.by ? ` (${h.by})` : ''}</p>}
                            <p className="text-slate-400 break-all">{h.ip} · {h.device}</p>
                        </div>
                    ))}
                </div>

                {/* History: md+ table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3">IP</th>
                                <th className="px-4 py-3">Device</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {slice.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">কোনো history নেই</td></tr>
                            )}
                            {slice.map((h) => (
                                <tr key={h._id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-2.5 whitespace-nowrap">{fmtDT(h.at)}</td>
                                    <td className="px-4 py-2.5">
                                        <p className="font-semibold">{h.name || '—'}</p>
                                        <p className="text-[10px] text-slate-400">{h.email}</p>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${EVENT_STYLE[h.event] || 'bg-slate-100 text-slate-600'}`}>{EVENT_LABEL[h.event] || h.event}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {REASON[h.reason] || h.reason || ''}
                                        {h.by ? <span className="text-[10px] text-slate-400"> ({h.by})</span> : null}
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">{h.ip}</td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">{h.device}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 text-center sm:text-left">Page {pg} / {pages} (নতুন ৩০০টা দেখাচ্ছে, ১৫ দিনের পুরনো history নিজে মুছে যায়)</span>
                    <div className="flex gap-2">
                        <button type="button" disabled={pg <= 1} onClick={() => setHPage(pg - 1)}
                            className="px-4 min-h-[40px] rounded-full border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-40 cursor-pointer">Prev</button>
                        <button type="button" disabled={pg >= pages} onClick={() => setHPage(pg + 1)}
                            className="px-4 min-h-[40px] rounded-full border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-40 cursor-pointer">Next</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4">
                <button type="button" onClick={() => navigate('/client')}
                    className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-full bg-white border border-slate-200 text-brand-700 hover:bg-brand-50 text-xs font-semibold cursor-pointer transition">
                    <FaArrowLeft size={11} /> Back to Clients
                </button>

                {/* Hero */}
                <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 sm:px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl font-extrabold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white break-words leading-tight">
                                {client.name} ({(client.staffCount || 0) + 1})
                            </h1>
                            <p className="text-brand-100 text-xs mt-0.5">Client Details</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                {client.phone && (
                                    <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition">
                                        <FaPhoneAlt size={10} /> {client.phone}
                                    </a>
                                )}
                                {client.email && (
                                    <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition break-all">
                                        <FaEnvelope size={10} /> {client.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaUser size={15} />} label="Full Name">
                        {client.name ? `${client.name} (${(client.staffCount || 0) + 1})` : <NA />}
                    </InfoCard>
                    <InfoCard icon={<FaPhoneAlt size={15} />} label="Phone" iconBg="bg-emerald-50 text-emerald-600">{client.phone || <NA />}</InfoCard>
                    <InfoCard icon={<FaEnvelope size={15} />} label="Email" iconBg="bg-sky-50 text-sky-600"><span className="break-all">{client.email || <NA />}</span></InfoCard>
                    <InfoCard icon={<FaMapMarkerAlt size={15} />} label="Address" iconBg="bg-rose-50 text-rose-600">{client.address || <NA />}</InfoCard>
                    <InfoCard icon={<FaGlobe size={15} />} label="Subdomain" iconBg="bg-amber-50 text-amber-600">
                        <span className="break-all">{client.slug ? `${client.slug}.bashaybazar.com` : <NA />}</span>
                    </InfoCard>
                    <InfoCard icon={<FaToggleOn size={15} />} label="Status" iconBg="bg-violet-50 text-violet-600">
                        <ActiveBadge active={client.isActive} />
                    </InfoCard>
                    <InfoCard icon={<FaWhatsapp size={15} />} label="WhatsApp" iconBg="bg-green-50 text-green-600">{client.whatsapp || <NA />}</InfoCard>
                    <InfoCard icon={<FaUsers size={15} />} label="User Limit" iconBg="bg-orange-50 text-orange-600">{client.userLimit ?? 10} (incl. dealer)</InfoCard>
                    <InfoCard icon={<FaCalendarAlt size={15} />} label="Created At" iconBg="bg-teal-50 text-teal-600">
                        {createdDate ? createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <NA />}
                    </InfoCard>
                    <InfoCard icon={<FaSignInAlt size={15} />} label="Login Status">
                        {client.login === 'yes' ? (
                            <button type="button" onClick={handleForceLogout} title="Click to force logout"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold border-0 cursor-pointer transition">
                                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Logged In
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Logged Out
                            </span>
                        )}
                    </InfoCard>
                </div>

                {renderLoginSession()}

                {/* Client & Users (Support login) */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <SectionHead icon={<FaUsers />} title={`Client & Users (${users.length + 1})`} />

                    {/* mobile cards */}
                    <div className="md:hidden p-3 space-y-3">
                        {allUsers.map((u, i) => (
                            <div key={u._id} className={`rounded-xl border p-3.5 ${u.isDealer ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400 font-semibold">#{i + 1}</p>
                                        <p className="font-bold text-slate-800 break-words">{u.isDealer ? '👑 ' : ''}{u.name}</p>
                                        <p className="text-sm text-slate-500 break-all">{u.email}</p>
                                        <p className="text-sm text-slate-500">{u.phone || 'N/A'}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">{u.role}</span>
                                        <ActiveBadge active={u.isActive} inactiveLabel="Inactive" />
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end"><LoginBtn u={u} /></div>
                            </div>
                        ))}
                    </div>

                    {/* md+ table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 w-12">#</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-center">Login</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {allUsers.map((u, i) => (
                                    <tr key={u._id} className={u.isDealer ? 'bg-amber-50/60' : 'hover:bg-slate-50/70'}>
                                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                                        <td className="px-4 py-3 font-bold">{u.isDealer ? '👑 ' : ''}{u.name}</td>
                                        <td className="px-4 py-3 break-all">{u.email}</td>
                                        <td className="px-4 py-3">{u.phone || 'N/A'}</td>
                                        <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">{u.role}</span></td>
                                        <td className="px-4 py-3"><ActiveBadge active={u.isActive} inactiveLabel="Inactive" /></td>
                                        <td className="px-4 py-3 text-center"><LoginBtn u={u} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetails;