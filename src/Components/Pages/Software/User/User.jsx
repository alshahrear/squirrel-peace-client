import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import UserForm from './UserForm';
import useDraftState from '../../../../hooks/useDraftState';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import useCan from '../../../../hooks/useCan';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';
import { FiChevronDown, FiEdit3, FiTrash2 } from 'react-icons/fi';

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
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Search, Form & Edit Modal States
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        address: '',
        status: ''
    });
    const [isNameOpen, setIsNameOpen] = useState(false);
    const nameFilterRef = useRef(null);

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
            title: `${selectedIds.length} জন user delete করবেন?`,
            text: 'এটা আর ফেরানো যাবে না।',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'হ্যাঁ, delete করুন',
            cancelButtonText: 'না',
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

    // Active Action Dropdown State
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Table section ref for auto scrolling
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
    }, []);

    // বাইরে কোথাও ক্লিক করলে ড্রপডাউন বন্ধ করার জন্য
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // Delete User Handler with SweetAlert2
    const handleDelete = async (id) => {
        if (!canDelete) {
            setActiveDropdownId(null);
            showToast('আপনার Delete করার অনুমতি নেই!', 'error');
            return;
        }
        const target = users.find((u) => u._id === id);
        if (target && isOwnRow(target)) {
            setActiveDropdownId(null);
            showToast('নিজেকে Delete করা যাবে না!', 'error');
            return;
        }
        setActiveDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/user/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('User deleted successfully!', 'success');
                        window.dispatchEvent(new Event('clientUserUpdated'));
                        // রিফ্রেশ ছাড়াই স্টেট থেকে ফিল্টার করে ডিলিট করা ইউজার বাদ দেওয়া
                        setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
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

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* User limit over modal */}
            {overBy > 0 && showLimitModal && !loading && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 space-y-4">
                        <h3 className="text-xl font-extrabold text-rose-600">⚠️ User limit পূর্ণ</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            আপনার user limit <b>{userLimit} জন</b> (আপনি সহ)। কিন্তু এখন <b>{usedSlots} জন</b> আছে। তাই আরও <b>{overBy} জন</b> user delete করতে হবে।
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            যতক্ষণ না করছেন, software এর অন্য কোনো কাজ করা যাবে না।
                        </p>
                        <p className="text-sm font-bold text-gray-800">আপনি কি {overBy} জন user delete করতে চান?</p>
                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={() => setShowLimitModal(false)}
                                className="px-5 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold rounded-2xl cursor-pointer"
                            >
                                হ্যাঁ, user delete করব
                            </button>
                            <button
                                onClick={handleContact}
                                className="px-5 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-2xl cursor-pointer"
                            >
                                Limit বাড়াতে Software Authority-কে contact করব
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title & Add Button */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            User Management
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage all registered users and permissions in the system</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${limitReached ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            Users: {usedSlots} / {userLimit} (including you){usedSlots > userLimit ? ' - over limit, delete some users' : ''}
                        </span>
                    </div>

                    <button
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
                        className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        {showForm ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Form
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add New User
                            </>
                        )}
                    </button>
                </div>

                {/* Collapsible Form Component */}
                {showForm && !loading && (
                    <div ref={formSectionRef}>
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

                {/* Table Card Section */}
                <div ref={tableSectionRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Users Directory</h3>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                Showing: {filteredUsers.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredUsers.length)}` : 0} of {filteredUsers.length} ({users.length} total)
                            </span>
                        </div>

                    </div>

                    {/* Filter & Search Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Name (Select Input) */}
                            <div className="relative" ref={nameFilterRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Name</label>
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
                                        className="w-full px-3 py-1.5 pr-14 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {filters.name && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFilters({ ...filters, name: '' });
                                                    setCurrentPage(1);
                                                    setIsNameOpen(false);
                                                }}
                                                className="text-gray-400 hover:text-rose-500"
                                            >
                                                <FaTimes size={11} />
                                            </button>
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-indigo-500 pointer-events-none">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>

                                {isNameOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-indigo-100 max-h-60 overflow-y-auto">
                                        {nameFilterOptions.length > 0 ? (
                                            nameFilterOptions.map((u) => (
                                                <div
                                                    key={u._id}
                                                    onClick={() => {
                                                        setFilters({ ...filters, name: u.name || '' });
                                                        setCurrentPage(1);
                                                        setIsNameOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {u.phone ? `📞 ${u.phone}` : ''}{u.phone && u.email ? ' | ' : ''}{u.email ? `✉️ ${u.email}` : ''}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No user found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Email</label>
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="Search email..."
                                    value={filters.email}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Search phone..."
                                    value={filters.phone}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Role</label>
                                <select
                                    name="role"
                                    value={filters.role}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All Roles</option>
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Search address..."
                                    value={filters.address}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {overBy > 0 && !showLimitModal && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <p className="text-sm text-rose-700 font-semibold">
                                আরও {overBy} জন user delete করতে হবে। নিচের তালিকা থেকে tick দিয়ে বাছুন। (Selected: {selectedIds.length})
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Selected delete করুন
                                </button>
                                <button
                                    onClick={handleContact}
                                    className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Software Authority-কে contact
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading users...</div>
                    ) : false ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No users found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm p-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        {selectMode && <th className="py-4 px-5"></th>}
                                        <th className="py-4 px-5">#</th>
                                        <th className="py-4 px-5">Name</th>
                                        <th className="py-4 px-5">Email</th>
                                        <th className="py-4 px-5">Phone</th>
                                        <th className="py-4 px-5">Role</th>
                                        <th className="py-4 px-5">Address</th>
                                        <th className="py-4 px-5">Status</th>
                                        <th className="py-4 px-5">Created At</th>
                                        <th className="py-4 px-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={selectMode ? 10 : 9} className="py-10 text-center text-gray-400 font-medium">No users found!</td>
                                        </tr>
                                    )}
                                    {currentUsers.map((user, index) => (
                                        <tr key={user._id || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            {selectMode && (
                                                <td className="py-4 px-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(user._id)}
                                                        onChange={() => toggleSelect(user._id)}
                                                        className="w-4 h-4 cursor-pointer accent-rose-600"
                                                    />
                                                </td>
                                            )}
                                            <td className="py-4 px-5 font-medium text-gray-400">{indexOfFirstItem + index + 1}</td>
                                            <td className="py-4 px-5 font-bold text-gray-800">{user.name}</td>
                                            <td className="py-4 px-5 text-gray-600">{user.email}</td>
                                            <td className="py-4 px-5 text-gray-600">{user.phone || 'N/A'}</td>
                                            <td className="py-4 px-5">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-xs">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-gray-600">{user.address || 'N/A'}</td>
                                            <td className="py-4 px-5">
                                                <span className={`px-3 py-1 rounded-full font-semibold text-xs ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-xs text-gray-500">{formatCreatedDate(user.createdAt)}</td>
                                            <td className="py-4 px-5 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={() => setActiveDropdownId(activeDropdownId === user._id ? null : user._id)}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === user._id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {activeDropdownId === user._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
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
                                                                }}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FiEdit3 className="w-3.5 h-3.5 text-indigo-500" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {clientUser && !clientUser.isStaff && (
                                        <tr className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-t-2 border-amber-300">
                                            {selectMode && <td className="py-4 px-5"></td>}
                                            <td className="py-4 px-5 font-bold text-amber-500">★</td>
                                            <td className="py-4 px-5 font-extrabold text-amber-900">👑 {clientUser.name}</td>
                                            <td className="py-4 px-5 text-amber-900/80">{clientUser.email}</td>
                                            <td className="py-4 px-5 text-amber-900/80">{clientUser.phone || 'N/A'}</td>
                                            <td className="py-4 px-5">
                                                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold text-xs shadow">
                                                    Super Admin
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-amber-900/80">{clientUser.address || 'N/A'}</td>
                                            <td className="py-4 px-5">
                                                <span className={`px-3 py-1 rounded-full font-semibold text-xs ${clientUser.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {clientUser.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-xs text-amber-900/70">
                                                {clientUser.createdAt ? new Date(clientUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                            </td>
                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    disabled
                                                    className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl font-semibold text-xs flex items-center gap-1.5 mx-auto cursor-not-allowed opacity-60"
                                                >
                                                    <span>Select</span>
                                                    <FiChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!loading && filteredUsers.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default User;