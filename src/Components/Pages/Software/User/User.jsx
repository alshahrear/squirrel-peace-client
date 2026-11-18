import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import UserForm from './UserForm';
import useDraftState from '../../../../hooks/useDraftState';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import useCan from '../../../../hooks/useCan';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes, FaPlus, FaUsers } from 'react-icons/fa';
import { FiChevronDown, FiEdit3, FiTrash2 } from 'react-icons/fi';
import { FaEllipsisV } from 'react-icons/fa';


// "23/10/2026, 8:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none';

const Pager = ({ page, total, onChange }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <span className="text-xs text-slate-500">
            Page <b className="text-slate-700">{page}</b> of <b className="text-slate-700">{total}</b>
        </span>
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
                <FaChevronLeft size={10} /> Prev
            </button>
            <div className="hidden sm:flex items-center gap-1">
                {[...Array(total)].map((_, i) => {
                    const n = i + 1;
                    if (n === 1 || n === total || (n >= page - 1 && n <= page + 1)) {
                        return (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange(n)}
                                className={`w-9 h-9 rounded-xl text-xs font-bold cursor-pointer ${page === n
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-slate-50 text-slate-700 border border-slate-300 hover:bg-brand-50'
                                    }`}
                            >
                                {n}
                            </button>
                        );
                    }
                    if (n === page - 2 || n === page + 2) return <span key={n} className="text-slate-400 px-1">...</span>;
                    return null;
                })}
            </div>
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === total}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
                Next <FaChevronRight size={10} />
            </button>
        </div>
    </div>
);

const RoleBadge = ({ children }) => (
    <span className="px-2.5 py-0.5 bg-brand-50 text-brand-700 rounded-full font-semibold text-xs">{children}</span>
);

const StatusBadge = ({ active }) => (
    <span
        className={`px-2.5 py-0.5 rounded-full font-semibold text-xs ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
    >
        {active ? 'Active' : 'Inactive'}
    </span>
);

const User = () => {
    const [users, setUsers] = useState([]);
    const { clientUser } = useClientAuth();
    const { canAdd, canEdit, canDelete } = useCan('user_list');
    // staff এর নিজের row (id বা email মিললে)
    const isOwnRow = (u) =>
        clientUser?.isStaff === true &&
        (String(u._id) === String(clientUser._id) ||
            (u.email || '').toLowerCase() === (clientUser.email || '').toLowerCase());
    const [showLimitModal, setShowLimitModal] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLimit, setUserLimit] = useState(10);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ name: '', email: '', phone: '', role: '', address: '', status: '' });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isNameOpen, setIsNameOpen] = useState(false);
    const nameFilterRef = useRef(null);

    // Toast: Main.jsx এর Toaster ব্যবহার হয় (page এ নিজের Toaster নয়)
    const showToast = (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
    };

    useEffect(() => {
        const handleOutside = (event) => {
            if (nameFilterRef.current && !nameFilterRef.current.contains(event.target)) {
                setIsNameOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ name: '', email: '', phone: '', role: '', address: '', status: '' });
        setCurrentPage(1);
    };

    const nameFilterOptions = users.filter((u) => {
        const s = filters.name.toLowerCase();
        return (
            u.name?.toLowerCase().includes(s) ||
            u.phone?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s)
        );
    });

    const roleOptions = [...new Set(users.map((u) => u.role).filter(Boolean))];
    const usedSlots = users.length + 1; // dealer নিজে ১ জন
    const limitReached = usedSlots >= userLimit;
    const overBy = Math.max(usedSlots - userLimit, 0); // আরও কতজন delete করতে হবে
    const selectMode = overBy > 0 && !showLimitModal;
    const CONTACT_URL = ''; // TODO: Software Authority এর contact link এখানে বসান

    const handleContact = () => {
        if (CONTACT_URL) window.open(CONTACT_URL, '_blank');
        else showToast('Contact details শীঘ্রই যোগ হবে।', 'success');
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!canDelete) {
            showToast('আপনার Delete করার অনুমতি নেই!', 'error');
            return;
        }
        const r = await Swal.fire({
            title: `আপনি কি ${selectedIds.length} জন user ডিলিট করতে চান?`,
            text: 'ডিলিট করলে আর ফেরানো যাবে না।',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'হ্যাঁ',
            cancelButtonText: 'না',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            width: 360,
            customClass: {
                popup: '!rounded-2xl',
                title: '!text-lg !font-bold !text-slate-800',
                htmlContainer: '!text-sm !text-slate-500',
                confirmButton: '!rounded-full !px-6 !text-sm !font-semibold',
                cancelButton: '!rounded-full !px-6 !text-sm !font-semibold',
            },
        });
        if (!r.isConfirmed) return;
        const deleted = [];
        for (const id of selectedIds) {
            try {
                const resp = await fetch(`http://localhost:5000/user/${id}`, { method: 'DELETE' });
                if (resp.ok) deleted.push(id);
            } catch (e) { }
        }
        setUsers((prev) => prev.filter((u) => !deleted.includes(u._id)));
        setSelectedIds([]);
        if (deleted.length === selectedIds.length) showToast(`${deleted.length} জন user delete হয়েছে!`, 'success');
        else showToast('কিছু user delete হয়নি!', 'error');
        window.dispatchEvent(new Event('clientUserUpdated'));
    };

    const [showForm, setShowForm] = useDraftState('userFormOpen', false);
    const [editingUserId, setEditingUserId] = useDraftState('userEditingId', null);
    const editingUser = users.find((u) => u._id === editingUserId) || null;
    const setEditingUser = (u) => setEditingUserId(u ? u._id : null);

    // Action menu (position:fixed, table scroll এ কাটা পড়ে না)
    const [menu, setMenu] = useState(null); // { id, top, left }

    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/user');
            const data = await response.json();
            setUsers(data);
            try {
                const meRes = await fetch('http://localhost:5000/client/me');
                const me = await meRes.json();
                if (Number.isInteger(me?.userLimit)) setUserLimit(me.userLimit);
            } catch (e) { }
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // menu: বাইরে click / scroll / resize হলে বন্ধ
    useEffect(() => {
        const onDown = (e) => {
            if (!e.target.closest('.action-menu-panel') && !e.target.closest('.action-menu-btn')) setMenu(null);
        };
        const close = () => setMenu(null);
        document.addEventListener('mousedown', onDown);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, []);

    const openMenu = (e, id) => {
        if (menu?.id === id) {
            setMenu(null);
            return;
        }
        const r = e.currentTarget.getBoundingClientRect();
        const h = 96;
        const top = r.bottom + h + 8 > window.innerHeight ? r.top - h - 4 : r.bottom + 4;
        const left = Math.max(8, Math.min(r.right - 144, window.innerWidth - 152));
        setMenu({ id, top, left });
    };

    const handleEdit = (user) => {
        setMenu(null);
        if (!canEdit) {
            showToast('আপনার Edit করার অনুমতি নেই!', 'error');
            return;
        }
        if (isOwnRow(user)) {
            showToast('নিজেকে Edit করা যাবে না!', 'error');
            return;
        }
        setEditingUser(user);
        setShowForm(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Delete User Handler with SweetAlert2
    const handleDelete = async (id) => {
        setMenu(null);
        if (!canDelete) {
            showToast('আপনার Delete করার অনুমতি নেই!', 'error');
            return;
        }
        const target = users.find((u) => u._id === id);
        if (target && isOwnRow(target)) {
            showToast('নিজেকে Delete করা যাবে না!', 'error');
            return;
        }
        Swal.fire({
            title: 'আপনি কি ডিলিট করতে চান?',
            text: 'ডিলিট করলে আর ফেরানো যাবে না।',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'হ্যাঁ',
            cancelButtonText: 'না',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            width: 360,
            customClass: {
                popup: '!rounded-2xl',
                title: '!text-lg !font-bold !text-slate-800',
                htmlContainer: '!text-sm !text-slate-500',
                confirmButton: '!rounded-full !px-6 !text-sm !font-semibold',
                cancelButton: '!rounded-full !px-6 !text-sm !font-semibold',
            },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/user/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('User deleted successfully!', 'success');
                        window.dispatchEvent(new Event('clientUserUpdated'));
                        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
                    } else {
                        const errData = await response.json().catch(() => ({}));
                        showToast(errData.message || 'Failed to delete user!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // user কে force logout
    const handleForceLogoutUser = async (user) => {
        if (!canEdit) {
            showToast('আপনার Edit করার অনুমতি নেই!', 'error');
            return;
        }
        if (isOwnRow(user)) {
            showToast('নিজেকে logout করা যাবে না!', 'error');
            return;
        }
        const r = await Swal.fire({
            title: 'আপনি কি লগ আউট করাতে চান?',
            text: `${user.name || user.email} কে লগ আউট করানো হবে।`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'হ্যাঁ',
            cancelButtonText: 'না',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
            focusCancel: true,
            width: 360,
            customClass: {
                popup: '!rounded-2xl',
                title: '!text-lg !font-bold !text-slate-800',
                htmlContainer: '!text-sm !text-slate-500',
                confirmButton: '!rounded-full !px-6 !text-sm !font-semibold',
                cancelButton: '!rounded-full !px-6 !text-sm !font-semibold',
            },
        });
        if (!r.isConfirmed) return;
        try {
            const resp = await fetch(`http://localhost:5000/user/${user._id}/logout`, { method: 'PATCH' });
            if (resp.ok) {
                setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, login: 'no' } : u)));
                showToast('User logged out successfully!', 'success');
            } else {
                const errData = await resp.json().catch(() => ({}));
                showToast(errData.message || 'Failed to logout user!', 'error');
            }
        } catch (error) {
            showToast('Server error!', 'error');
        }
    };

    // Filtered Users based on Search
    const filteredUsers = [...users].reverse().filter((user) => {
        if (filters.name && !user.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (filters.email && !user.email?.toLowerCase().includes(filters.email.toLowerCase())) return false;
        if (filters.phone && !user.phone?.toLowerCase().includes(filters.phone.toLowerCase())) return false;
        if (filters.role && user.role !== filters.role) return false;
        if (filters.address && !user.address?.toLowerCase().includes(filters.address.toLowerCase())) return false;
        if (filters.status !== '' && String(!!user.isActive) !== filters.status) return false;
        return true;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const menuUser = menu ? users.find((u) => u._id === menu.id) : null;
    const superCreated = clientUser?.createdAt
        ? new Date(clientUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';

    const LoginBadge = ({ user }) => {
        const on = user.login === 'yes';
        return (
            <button
                type="button"
                disabled={!on}
                onClick={() => on && handleForceLogoutUser(user)}
                title={on ? 'Click to force logout' : 'Offline'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${on
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors'
                    : 'bg-slate-100 text-slate-500 cursor-default'
                    }`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {on ? 'Logged In' : 'Logged Out'}
            </button>
        );
    };

    const ActionBtn = ({ user }) => (
        <button
            type="button"
            onClick={(e) => openMenu(e, user._id)}
            aria-haspopup="menu"
            aria-label="Actions"
            className="action-menu-btn inline-flex items-center gap-1.5 px-3 h-9 bg-slate-50 border border-slate-300 text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-semibold cursor-pointer"
        >
            Actions
            <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menu?.id === user._id ? 'rotate-180' : ''}`} />
        </button>
    );

    const ActionBtnCompact = ({ user }) => (
        <button
            type="button"
            onClick={(e) => openMenu(e, user._id)}
            aria-haspopup="menu"
            aria-label="Actions"
            className="action-menu-btn inline-flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-300 text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl cursor-pointer"
        >
            <FaEllipsisV size={12} />
        </button>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            {/* User limit over modal */}
            {overBy > 0 && showLimitModal && !loading && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-rose-600">⚠️ User limit পূর্ণ</h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            আপনার user limit <b>{userLimit} জন</b> (আপনি সহ)। কিন্তু এখন <b>{usedSlots} জন</b> আছে। তাই আরও <b>{overBy} জন</b> user delete করতে হবে।
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            যতক্ষণ না করছেন, software এর অন্য কোনো কাজ করা যাবে না।
                        </p>
                        <p className="text-sm font-bold text-slate-800">আপনি কি {overBy} জন user delete করতে চান?</p>
                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowLimitModal(false)}
                                className="px-5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full cursor-pointer"
                            >
                                হ্যাঁ, user delete করব
                            </button>
                            <button
                                type="button"
                                onClick={handleContact}
                                className="px-5 min-h-[44px] bg-brand-50 text-brand-700 hover:bg-brand-100 text-sm font-semibold rounded-full cursor-pointer"
                            >
                                Limit বাড়াতে Software Authority-কে contact করব
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed action menu */}
            {menu && menuUser && (
                <div
                    role="menu"
                    style={{ top: menu.top, left: menu.left }}
                    className="action-menu-panel fixed z-[9999] w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleEdit(menuUser)}
                        className="w-full px-4 min-h-[40px] text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2 cursor-pointer"
                    >
                        <FiEdit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleDelete(menuUser._id)}
                        className="w-full px-4 min-h-[40px] text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Title + Add */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">User Management</h2>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage all registered users and permissions in the system</p>
                        <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${limitReached ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
                        >
                            Users: {usedSlots} / {userLimit} (including you){usedSlots > userLimit ? ' - over limit, delete some users' : ''}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingUser(null);
                            if (!showForm && !canAdd) {
                                showToast('আপনার Add করার অনুমতি নেই!', 'error');
                                return;
                            }
                            if (!showForm && limitReached) {
                                showToast(`User limit reached (${userLimit} including you). Delete a user first.`, 'error');
                                return;
                            }
                            setShowForm(!showForm);
                        }}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 min-h-[44px] w-full sm:w-auto cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-2"
                    >
                        {showForm ? (<><FaTimes size={13} /> Close Form</>) : (<><FaPlus size={13} /> Add New User</>)}
                    </button>
                </div>

                {/* Form */}
                {showForm && !loading && (
                    <div ref={formSectionRef} className="scroll-mt-20">
                        <UserForm
                            key={editingUser?._id || 'new'}
                            showToast={showToast}
                            users={users}
                            fetchUsers={fetchUsers}
                            setShowForm={setShowForm}
                            editingUser={editingUser}
                            setEditingUser={setEditingUser}
                            scrollToTable={() => {
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Directory */}
                <div ref={tableSectionRef} className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-6 space-y-3 sm:space-y-4 scroll-mt-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FaUsers className="text-brand-600" /> Users Directory
                        </h3>
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full w-fit">
                            Showing {filteredUsers.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredUsers.length)}` : 0} of {filteredUsers.length} ({users.length} total)
                        </span>
                    </div>

                    {/* Filters */}
                    <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 bg-slate-50/60">
                        <div className="flex justify-between items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((v) => !v)}
                                className="lg:cursor-default flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[36px]"
                                aria-expanded={filtersOpen}
                            >
                                <FaFilter className="text-brand-600" /> Filter &amp; Search
                                <FiChevronDown className={`lg:hidden w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 h-9 rounded-xl font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear
                            </button>
                        </div>

                       <div className={`${filtersOpen ? 'grid' : 'hidden'} lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                            <div className="relative" ref={nameFilterRef}>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Search or select user..."
                                        value={filters.name}
                                        onChange={(e) => {
                                            handleFilterChange(e);
                                            setIsNameOpen(true);
                                        }}
                                        onFocus={() => setIsNameOpen(true)}
                                        autoComplete="off"
                                        className={`${inputCls} pr-9`}
                                    />
                                    {filters.name && (
                                        <button
                                            type="button"
                                            aria-label="Clear name"
                                            onClick={() => {
                                                setFilters({ ...filters, name: '' });
                                                setCurrentPage(1);
                                                setIsNameOpen(false);
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    )}
                                </div>
                                {isNameOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                                        {nameFilterOptions.length > 0 ? (
                                            nameFilterOptions.map((u) => (
                                                <div
                                                    key={u._id}
                                                    onClick={() => {
                                                        setFilters({ ...filters, name: u.name || '' });
                                                        setCurrentPage(1);
                                                        setIsNameOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-none"
                                                >
                                                    <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                        {u.phone ? `📞 ${u.phone}` : ''}{u.phone && u.email ? ' | ' : ''}{u.email ? `✉️ ${u.email}` : ''}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-slate-400 text-center">No user found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Email</label>
                                <input type="text" name="email" placeholder="Search email..." value={filters.email} onChange={handleFilterChange} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Phone</label>
                                <input type="text" name="phone" placeholder="Search phone..." value={filters.phone} onChange={handleFilterChange} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Role</label>
                                <select name="role" value={filters.role} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                    <option value="">All Roles</option>
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Address</label>
                                <input type="text" name="address" placeholder="Search address..." value={filters.address} onChange={handleFilterChange} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-medium mb-1">Status</label>
                                <select name="status" value={filters.status} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                    <option value="">All Status</option>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Over limit bulk bar */}
                    {overBy > 0 && !showLimitModal && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <p className="text-sm text-rose-700 font-semibold">
                                আরও {overBy} জন user delete করতে হবে। নিচের তালিকা থেকে tick দিয়ে বাছুন। (Selected: {selectedIds.length})
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className="px-4 min-h-[40px] bg-rose-600 text-white text-xs font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Selected delete করুন
                                </button>
                                <button
                                    type="button"
                                    onClick={handleContact}
                                    className="px-4 min-h-[40px] bg-white border border-brand-200 text-brand-700 text-xs font-bold rounded-full cursor-pointer"
                                >
                                    Software Authority-কে contact
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {loading ? (
                        <div className="space-y-3" aria-busy="true">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentUsers.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <FaUsers size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm font-medium">No users found!</p>
                                    </div>
                                )}
                                {currentUsers.map((user, index) => (
                                    <div
                                        key={user._id || index}
                                        className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm"
                                    >
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${user.isActive ? 'bg-brand-500' : 'bg-rose-400'}`} />
                                        <div className="flex items-stretch gap-2">
                                            {selectMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(user._id)}
                                                    onChange={() => toggleSelect(user._id)}
                                                    className="self-center w-5 h-5 shrink-0 cursor-pointer accent-rose-600"
                                                />
                                            )}

                                            {/* Left: info */}
                                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="font-bold text-[13px] text-brand-700 truncate leading-tight min-w-0">{user.name}</p>
                                                    <span className="shrink-0 px-1.5 py-px bg-brand-50 text-brand-700 rounded-full font-bold text-[9.5px] leading-tight">
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <p className="text-[10.5px] text-slate-600 font-semibold leading-snug truncate">
                                                    📞 {user.phone || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    ✉️ {user.email || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">📍 </span>
                                                    {user.address || 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 leading-snug truncate">
                                                    <span className="uppercase font-bold">Created: </span>
                                                    {formatCreatedDate(user.createdAt) || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Right: actions + status */}
                                            <div className="shrink-0 w-[104px] flex flex-col items-end justify-between gap-1.5">
                                                <ActionBtnCompact user={user} />
                                                <div className="flex flex-col items-end gap-1">
                                                    <StatusBadge active={user.isActive} />
                                                    <LoginBadge user={user} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {clientUser && !clientUser.isStaff && (
                                    <div className="relative rounded-xl border border-amber-300 bg-amber-50 pl-3 pr-2 py-2 shadow-sm">
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-amber-500" />
                                        <div className="flex items-stretch gap-2">
                                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="font-extrabold text-[13px] text-amber-900 truncate leading-tight min-w-0">👑 {clientUser.name}</p>
                                                    <span className="shrink-0 px-1.5 py-px bg-amber-500 text-white rounded-full font-bold text-[9.5px] leading-tight">
                                                        Super Admin
                                                    </span>
                                                </div>
                                                <p className="text-[10.5px] text-amber-900/80 font-semibold leading-snug truncate">
                                                    📞 {clientUser.phone || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-amber-900/70 leading-snug truncate">✉️ {clientUser.email}</p>
                                                {clientUser.address && (
                                                    <p className="text-[10.5px] text-amber-900/70 leading-snug truncate">📍 {clientUser.address}</p>
                                                )}
                                                {superCreated && (
                                                    <p className="text-[10px] text-amber-900/60 leading-snug truncate">
                                                        <span className="uppercase font-bold">Created: </span>{superCreated}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="shrink-0 w-[104px] flex flex-col items-end justify-end gap-1">
                                                <StatusBadge active={clientUser.isActive} />
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Logged In
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full min-w-[960px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                            {selectMode && <th className="py-3 px-4"></th>}
                                            <th className="py-3 px-4">#</th>
                                            <th className="py-3 px-4">Name</th>
                                            <th className="py-3 px-4">Email</th>
                                            <th className="py-3 px-4">Phone</th>
                                            <th className="py-3 px-4">Role</th>
                                            <th className="py-3 px-4">Address</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Login</th>
                                            <th className="py-3 px-4">Created At</th>
                                            <th className="py-3 px-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {currentUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={selectMode ? 11 : 10} className="py-14 text-center text-slate-400 font-medium">
                                                    No users found!
                                                </td>
                                            </tr>
                                        )}
                                        {currentUsers.map((user, index) => (
                                            <tr key={user._id || index} className="hover:bg-slate-50 transition-colors">
                                                {selectMode && (
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(user._id)}
                                                            onChange={() => toggleSelect(user._id)}
                                                            className="w-4 h-4 cursor-pointer accent-rose-600"
                                                        />
                                                    </td>
                                                )}
                                                <td className="py-3 px-4 text-slate-400">{indexOfFirstItem + index + 1}</td>
                                                <td className="py-3 px-4 font-bold text-slate-800">{user.name}</td>
                                                <td className="py-3 px-4 text-slate-600">{user.email}</td>
                                                <td className="py-3 px-4 text-slate-600">{user.phone || 'N/A'}</td>
                                                <td className="py-3 px-4"><RoleBadge>{user.role}</RoleBadge></td>
                                                <td className="py-3 px-4 text-slate-600">{user.address || 'N/A'}</td>
                                                <td className="py-3 px-4"><StatusBadge active={user.isActive} /></td>
                                                <td className="py-3 px-4"><LoginBadge user={user} /></td>
                                                <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{formatCreatedDate(user.createdAt)}</td>
                                                <td className="py-3 px-4 text-center"><ActionBtn user={user} /></td>
                                            </tr>
                                        ))}
                                        {clientUser && !clientUser.isStaff && (
                                            <tr className="bg-amber-50 border-t-2 border-amber-300">
                                                {selectMode && <td className="py-3 px-4"></td>}
                                                <td className="py-3 px-4 font-bold text-amber-500">★</td>
                                                <td className="py-3 px-4 font-extrabold text-amber-900">👑 {clientUser.name}</td>
                                                <td className="py-3 px-4 text-amber-900/80">{clientUser.email}</td>
                                                <td className="py-3 px-4 text-amber-900/80">{clientUser.phone || 'N/A'}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full font-bold text-xs">Super Admin</span>
                                                </td>
                                                <td className="py-3 px-4 text-amber-900/80">{clientUser.address || 'N/A'}</td>
                                                <td className="py-3 px-4"><StatusBadge active={clientUser.isActive} /></td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Logged In
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs text-amber-900/70 whitespace-nowrap">{superCreated}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed opacity-60"
                                                    >
                                                        Actions <FiChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {!loading && filteredUsers.length > 0 && (
                        <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default User;