import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaEye, FaEdit, FaTrash, FaUsers, FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import useAxiosSecure from '../../../../hooks/useAxiosSecure';
import { RowMenu } from '../Product/ProductUi';

const fieldCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const StatusBadge = ({ active }) => (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {active ? 'Active' : 'Non-Active'}
    </span>
);

const ClientList = ({ onEdit, refreshTrigger }) => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    const emptyFilters = { name: '', phone: '', email: '', address: '', status: '', login: '' };
    const [filters, setFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const activeCount = Object.values(filters).filter((v) => v !== '').length;

    const handleFilterChange = (e) => {
        setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters(emptyFilters);
        setCurrentPage(1);
    };

    // created date: createdAt na thakle (purono client) _id theke ber kora
    const getCreatedDate = (c) => {
        if (c.createdAt) {
            const d = new Date(c.createdAt);
            if (!isNaN(d)) return d;
        }
        if (c._id && /^[0-9a-fA-F]{24}$/.test(c._id)) return new Date(parseInt(c._id.substring(0, 8), 16) * 1000);
        return null;
    };
    const formatDate = (c) => {
        const d = getCreatedDate(c);
        return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    };

    const filteredClients = [...clients].reverse().filter((c) => {
        const has = (v, s) => String(v || '').toLowerCase().includes(s.toLowerCase());
        if (filters.name && !has(c.name, filters.name)) return false;
        if (filters.phone && !has(c.phone, filters.phone)) return false;
        if (filters.email && !has(c.email, filters.email)) return false;
        if (filters.address && !has(c.address, filters.address)) return false;
        if (filters.status !== '' && String(!!c.isActive) !== filters.status) return false;
        if (filters.login !== '' && (c.login === 'yes' ? 'yes' : 'no') !== filters.login) return false;
        return true;
    });
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfLastItem = safePage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const fetchClients = async () => {
        try {
            const res = await axiosSecure.get(`/client?t=${Date.now()}`);
            setClients(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
        const handleFocus = () => fetchClients();
        window.addEventListener('focus', handleFocus);
        window.addEventListener('clientUserUpdated', fetchClients);
        const interval = setInterval(fetchClients, 2000);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('clientUserUpdated', fetchClients);
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (openDropdownId === null) return;
        const handleScroll = () => setOpenDropdownId(null);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [openDropdownId]);

    const handleForceLogout = async (client) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to log out ${client.name || client.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, log out!',
        });
        if (!result.isConfirmed) return;
        try {
            await axiosSecure.patch(`/client/login-status/${client._id}`, { login: 'no' });
            toast.success('Client has been logged out successfully.');
            fetchClients();
        } catch (error) {
            console.error('Error logging out client:', error);
            toast.error('Something went wrong.');
        }
    };

    const handleDelete = (id) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: 'Enter admin password to delete this client!',
            icon: 'warning',
            input: 'password',
            inputPlaceholder: 'Admin password',
            inputAttributes: { autocomplete: 'off' },
            showCancelButton: true,
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !Swal.isLoading(),
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, delete it!',
            preConfirm: async (password) => {
                if (!password) {
                    Swal.showValidationMessage('Please enter the password');
                    return false;
                }
                try {
                    const r = await axiosSecure.post('/users/verify-admin-password', { password });
                    return r.data.actionToken;
                } catch (err) {
                    Swal.showValidationMessage(err?.response?.data?.message || 'Incorrect password');
                    return false;
                }
            },
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    await axiosSecure.delete(`/client/${id}`, { headers: { 'x-action-token': result.value } });
                    toast.success('Client deleted successfully!');
                    fetchClients();
                } catch (error) {
                    console.error('Error deleting client:', error);
                    toast.error(error?.response?.data?.message || 'Could not delete client.');
                }
            }
        });
    };

    const menuItems = (c) => [
        { label: 'View Details', icon: <FaEye size={12} />, tone: 'emerald', onClick: () => navigate(`/client-details/${c._id}`) },
        { label: 'Edit', icon: <FaEdit size={12} />, onClick: () => onEdit(c) },
        { label: 'Delete', icon: <FaTrash size={12} />, tone: 'rose', onClick: () => handleDelete(c._id) },
    ];

    const LoginBadge = ({ client }) =>
        client.login === 'yes' ? (
            <button
                type="button"
                onClick={() => handleForceLogout(client)}
                title="Click to force logout"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold border-0 cursor-pointer transition"
            >
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Logged In
            </button>
        ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> Logged Out
            </span>
        );

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                <div className="h-6 w-48 rounded bg-slate-200" />
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 mb-6">
            {/* Header */}
            <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <FaUsers />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800">Client Directory</h2>
                        <p className="text-xs text-slate-500">Total clients: {clients.length}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setFilterOpen((v) => !v)}
                    className="md:hidden inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
                >
                    <FaFilter /> Filter
                    {activeCount > 0 && <span className="px-1.5 rounded-full bg-brand-600 text-white">{activeCount}</span>}
                </button>
            </div>

            {/* Filters */}
            <div className={`${filterOpen ? 'block' : 'hidden'} md:block p-4 sm:p-5 border-b border-slate-100`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                        Showing {filteredClients.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredClients.length)}` : 0} of {filteredClients.length}
                    </span>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold cursor-pointer transition"
                    >
                        <FaRedo size={10} /> Clear Filters
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                        ['name', 'Name', 'Search name...'],
                        ['phone', 'Phone', 'Search phone...'],
                        ['email', 'Email', 'Search email...'],
                        ['address', 'Address', 'Search address...'],
                    ].map(([key, label, ph]) => (
                        <div key={key}>
                            <label className="block mb-1 text-xs font-medium text-slate-600">{label}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name={key}
                                    placeholder={ph}
                                    value={filters[key]}
                                    onChange={handleFilterChange}
                                    autoComplete="off"
                                    className={`${fieldCls} pr-9`}
                                />
                                {filters[key] && (
                                    <button
                                        type="button"
                                        aria-label="Clear"
                                        onClick={() => { setFilters((p) => ({ ...p, [key]: '' })); setCurrentPage(1); }}
                                        className="absolute right-0 top-0 w-9 h-full flex items-center justify-center bg-transparent border-0 p-0 text-slate-400 hover:text-rose-500 cursor-pointer"
                                    >
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div>
                        <label className="block mb-1 text-xs font-medium text-slate-600">Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={`${fieldCls} cursor-pointer`}>
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Non-Active</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-medium text-slate-600">Login</label>
                        <select name="login" value={filters.login} onChange={handleFilterChange} className={`${fieldCls} cursor-pointer`}>
                            <option value="">All Login</option>
                            <option value="yes">Logged In</option>
                            <option value="no">Logged Out</option>
                        </select>
                    </div>
                </div>
            </div>

            {clients.length === 0 ? (
                <div className="text-center py-14 text-sm text-slate-400">No clients found in the database.</div>
            ) : currentClients.length === 0 ? (
                <div className="text-center py-14 text-sm text-slate-400">No clients match the filters!</div>
            ) : (
                <>
                    {/* Mobile: cards */}
                    <div className="md:hidden p-2 space-y-1.5">
                        {currentClients.map((client, index) => (
                            <div
                                key={client._id || index}
                                className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm"
                            >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${client.isActive ? 'bg-brand-500' : 'bg-rose-400'}`} />
                                <div className="flex items-stretch gap-2">
                                    {/* Left: info */}
                                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                        <p className="font-bold text-[13px] text-brand-700 truncate leading-tight">
                                            {client.name} <span className="text-slate-500 font-semibold">({(client.staffCount || 0) + 1})</span>
                                        </p>
                                        <p className="text-[10.5px] text-slate-600 font-semibold leading-snug truncate">
                                            📞 {client.phone || 'N/A'}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                            ✉️ {client.email || 'N/A'}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                            <span className="uppercase text-slate-400 font-bold">📍 </span>
                                            {client.address || 'N/A'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 leading-snug truncate">
                                            <span className="uppercase font-bold">Created: </span>
                                            {formatDate(client) || 'N/A'}
                                        </p>
                                    </div>

                                    {/* Right: serial + actions, status, login */}
                                    <div className="shrink-0 w-[104px] flex flex-col items-end justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-400">#{indexOfFirstItem + index + 1}</span>
                                            <RowMenu compact items={menuItems(client)} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge active={client.isActive} />
                                            <LoginBadge client={client} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* md+: table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[960px] text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                                    <th className="px-4 py-3 w-12">#</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Address</th>
                                    <th className="px-4 py-3">Created At</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Login</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentClients.map((client, index) => (
                                    <tr key={client._id || index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-400">{indexOfFirstItem + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800">
                                            {client.name} <span className="text-brand-600 font-semibold">({(client.staffCount || 0) + 1})</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{client.phone}</td>
                                        <td className="px-4 py-3 text-slate-600 break-all">{client.email}</td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={client.address}>{client.address}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(client)}</td>
                                        <td className="px-4 py-3 text-center"><StatusBadge active={client.isActive} /></td>
                                        <td className="px-4 py-3 text-center"><LoginBadge client={client} /></td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="relative inline-block action-dropdown-container">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setDropdownPos({ top: rect.top - 8, left: rect.right });
                                                        setOpenDropdownId(openDropdownId === client._id ? null : client._id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold cursor-pointer transition"
                                                >
                                                    Select
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === client._id ? 'rotate-180' : ''}`}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                    </svg>
                                                </button>

                                                {openDropdownId === client._id && (
                                                    <div
                                                        style={{ top: dropdownPos.top, left: dropdownPos.left, transform: 'translate(-100%, -100%)' }}
                                                        className="fixed w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[9999] text-left"
                                                    >
                                                        <button type="button"
                                                            onClick={() => { setOpenDropdownId(null); navigate(`/client-details/${client._id}`); }}
                                                            className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 bg-transparent border-0 cursor-pointer">
                                                            <FaEye size={12} /> View Details
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => { setOpenDropdownId(null); onEdit(client); }}
                                                            className="w-full px-4 py-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 flex items-center gap-2 bg-transparent border-0 cursor-pointer">
                                                            <FaEdit size={12} /> Edit
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => handleDelete(client._id)}
                                                            className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 bg-transparent border-0 cursor-pointer">
                                                            <FaTrash size={12} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {clients.length > 0 && filteredClients.length > 0 && (
                <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">
                        Page <span className="font-bold text-slate-700">{safePage}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handlePageChange(safePage - 1)} disabled={safePage === 1}
                            className="inline-flex items-center gap-1 px-3 min-h-[40px] rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                            <FaChevronLeft size={10} /> Prev
                        </button>
                        <div className="hidden sm:flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const n = i + 1;
                                if (n === 1 || n === totalPages || (n >= safePage - 1 && n <= safePage + 1)) {
                                    return (
                                        <button key={n} type="button" onClick={() => handlePageChange(n)}
                                            className={`w-9 h-9 rounded-full text-xs font-bold cursor-pointer border ${safePage === n
                                                ? 'bg-brand-600 text-white border-transparent'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                                            {n}
                                        </button>
                                    );
                                } else if (n === safePage - 2 || n === safePage + 2) {
                                    return <span key={n} className="text-slate-400 px-1">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <button type="button" onClick={() => handlePageChange(safePage + 1)} disabled={safePage === totalPages}
                            className="inline-flex items-center gap-1 px-3 min-h-[40px] rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                            Next <FaChevronRight size={10} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;