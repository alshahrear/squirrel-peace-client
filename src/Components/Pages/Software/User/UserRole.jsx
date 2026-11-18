import React, { useState, useEffect, useRef } from 'react';
import useAxiosClient from '../../../../hooks/useAxiosClient';
import useCan from '../../../../hooks/useCan';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaPlus, FaSave, FaTimes, FaSearch, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiChevronDown, FiEdit3, FiTrash2 } from 'react-icons/fi';

const inputCls =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';

const UserRole = () => {
    const axiosClient = useAxiosClient();
    const { canAdd, canEdit, canDelete } = useCan('user_role');
    const [roles, setRoles] = useState([]);
    const [roleInput, setRoleInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [menu, setMenu] = useState(null); // { id, top, left }
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const inputRef = useRef(null);

    const fetchRoles = async () => {
        try {
            const response = await axiosClient.get('/userRole');
            setRoles([...response.data].reverse());
        } catch (error) {
            toast.error('Failed to load roles');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId ? !canEdit : !canAdd) {
            toast.error(editingId ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!');
            return;
        }
        if (!roleInput.trim()) {
            toast.error('Role name is required!');
            return;
        }

        const trimmedRole = roleInput.trim().toLowerCase();
        if (trimmedRole.replace(/[\s_-]+/g, '') === 'superadmin') {
            toast.error('"Super Admin" নামে role বানানো যাবে না!');
            return;
        }
        const isDuplicate = roles.some(
            (r) => r.role.trim().toLowerCase() === trimmedRole && r._id !== editingId
        );
        if (isDuplicate) {
            toast.error('This role already exists!');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                const response = await axiosClient.put(`/userRole/${editingId}`, {
                    role: roleInput,
                });
                if (response.status === 200) {
                    toast.success('Role updated successfully!');
                }
                setEditingId(null);
            } else {
                const response = await axiosClient.post('/userRole', {
                    role: roleInput,
                });
                if (response.data.insertedId) {
                    toast.success('Role added successfully!');
                }
            }
            setRoleInput('');
            fetchRoles();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setMenu(null);
        if (!canEdit) {
            toast.error('আপনার Edit করার অনুমতি নেই!');
            return;
        }
        setRoleInput(item.role);
        setEditingId(item._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => inputRef.current?.focus(), 250);
    };

    const handleCancel = () => {
        setEditingId(null);
        setRoleInput('');
    };

    const handleDelete = (id) => {
        setMenu(null);
        if (!canDelete) {
            toast.error('আপনার Delete করার অনুমতি নেই!');
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete it!',
            width: '350px',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axiosClient.delete(`/userRole/${id}`);
                    if (res.data.deletedCount > 0) {
                        toast.success('Role deleted!');
                        fetchRoles();
                    }
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Failed to delete!');
                }
            }
        });
    };

    const filteredRoles = roles.filter((item) =>
        item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRoles = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const menuItem = menu ? roles.find((r) => r._id === menu.id) : null;
    const pgBtn =
        'inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            {/* Toast দেখায় Main.jsx এর Toaster */}

            {menu && menuItem && (
                <div
                    role="menu"
                    style={{ top: menu.top, left: menu.left }}
                    className="action-menu-panel fixed z-[9999] w-36 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleEdit(menuItem)}
                        className="w-full px-4 min-h-[40px] text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2 cursor-pointer"
                    >
                        <FiEdit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleDelete(menuItem._id)}
                        className="w-full px-4 min-h-[40px] text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                {/* Create / Update */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 shrink-0 bg-brand-600 text-white rounded-xl flex items-center justify-center">
                            <FaShieldAlt size={16} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                                {editingId ? 'Update Role' : 'Create New Role'}
                            </h2>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Add permissions or update existing roles for your system</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            placeholder="Enter role name (e.g. SR, Manager)"
                            className={`${inputCls} flex-1`}
                            disabled={loading}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 min-h-[44px] text-sm font-semibold cursor-pointer whitespace-nowrap disabled:opacity-60 ${editingId
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white rounded-full'
                                    : 'bg-brand-600 text-white'
                                    }`}
                            >
                                {editingId ? <><FaSave /> Update</> : <><FaPlus /> Add Role</>}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    aria-label="Cancel edit"
                                    className="w-11 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center cursor-pointer"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-800">Assigned Roles</h3>
                            <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full">
                                Total {roles.length} roles
                            </span>
                        </div>

                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                <FaSearch size={13} />
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Search roles..."
                                className={`${inputCls} pl-9`}
                            />
                        </div>
                    </div>

                    {fetching ? (
                        <div className="space-y-2" aria-busy="true">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full min-w-[320px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                                        <th className="py-3 px-4 w-14">#</th>
                                        <th className="py-3 px-4">Role Name</th>
                                        <th className="py-3 px-4 text-center w-36">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {currentRoles.length > 0 ? (
                                        currentRoles.map((item, index) => (
                                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 text-slate-400">{indexOfFirstItem + index + 1}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-semibold text-xs">
                                                        {item.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {item.fixed && (
                                                        <span className="inline-flex items-center gap-1 px-3 h-9 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                                                            <FaShieldAlt size={10} /> Fixed
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => openMenu(e, item._id)}
                                                        aria-haspopup="menu"
                                                        style={item.fixed ? { display: 'none' } : undefined}
                                                        aria-label="Actions"
                                                        className="action-menu-btn inline-flex items-center gap-1.5 px-3 h-9 bg-slate-50 border border-slate-300 text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-semibold cursor-pointer"
                                                    >
                                                        Actions
                                                        <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menu?.id === item._id ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-14 text-slate-400">
                                                <FaShieldAlt size={30} className="mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm font-medium">No matching roles found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!fetching && filteredRoles.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                                Page <b className="text-slate-700">{currentPage}</b> of <b className="text-slate-700">{totalPages}</b>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={pgBtn}>
                                    <FaChevronLeft size={10} /> Prev
                                </button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const n = i + 1;
                                        if (n === 1 || n === totalPages || (n >= currentPage - 1 && n <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => handlePageChange(n)}
                                                    className={`w-9 h-9 rounded-xl text-xs font-bold cursor-pointer ${currentPage === n
                                                        ? 'bg-brand-600 text-white'
                                                        : 'bg-slate-50 text-slate-700 border border-slate-300 hover:bg-brand-50'
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            );
                                        }
                                        if (n === currentPage - 2 || n === currentPage + 2) return <span key={n} className="text-slate-400 px-1">...</span>;
                                        return null;
                                    })}
                                </div>
                                <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={pgBtn}>
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

export default UserRole;