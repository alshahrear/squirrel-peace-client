import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { FaPlus, FaSave, FaTimes, FaSearch, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiChevronDown, FiEdit3, FiTrash2 } from 'react-icons/fi';

const UserRole = () => {
    const [roles, setRoles] = useState([]);
    const [roleInput, setRoleInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const fetchRoles = async () => {
        try {
            const response = await axios.get('http://localhost:5000/userRole');
            setRoles(response.data);
        } catch (error) {
            toast.error('Failed to load roles');
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleInput.trim()) {
            toast.error('Role name is required!');
            return;
        }

               const trimmedRole = roleInput.trim().toLowerCase();
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
                const response = await axios.put(`http://localhost:5000/userRole/${editingId}`, {
                    role: roleInput,
                });
                if (response.data.modifiedCount > 0) {
                    toast.success('Role updated successfully!');
                }
                setEditingId(null);
            } else {
                const response = await axios.post('http://localhost:5000/userRole', {
                    role: roleInput,
                });
                if (response.data.insertedId) {
                    toast.success('Role added successfully!');
                }
            }
            setRoleInput('');
            fetchRoles();
        } catch (error) {
            toast.error('Something went wrong!');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setActiveDropdownId(null);
        setRoleInput(item.role);
        setEditingId(item._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setRoleInput('');
    };

    const handleDelete = (id) => {
        setActiveDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!',
            width: '350px'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.delete(`http://localhost:5000/userRole/${id}`);
                    if (res.data.deletedCount > 0) {
                        toast.success('Role deleted!');
                        fetchRoles();
                    }
                } catch (error) {
                    toast.error('Failed to delete!');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            <Toaster toastOptions={{ duration: 2500 }} position="top-right" />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Feature 1: Role Creation & Input Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                            <FaShieldAlt size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                {editingId ? 'Update Role' : 'Create New Role'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Add permissions or update existing roles for your system</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            placeholder="Enter role name (e.g. Moderator, Admin)"
                            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            disabled={loading}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition duration-300 shadow-lg cursor-pointer whitespace-nowrap ${editingId
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200'
                                    : 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white shadow-indigo-200'
                                    }`}
                            >
                                {editingId ? <><FaSave /> Update</> : <><FaPlus /> Save Role</>}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm transition duration-200 cursor-pointer"
                                    title="Cancel"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Feature 2: Table & Search Bar Component */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Assigned Roles</h3>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                Total {roles.length} roles found
                            </span>
                        </div>

                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                <FaSearch size={14} />
                            </span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Search roles..."
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm p-1">
                        <div className="max-h-96 overflow-y-auto overflow-x-visible rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-5 w-16">#</th>
                                        <th className="py-4 px-5">Role Name</th>
                                        <th className="py-4 px-5 text-center w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentRoles.length > 0 ? (
                                        currentRoles.map((item, index) => {
                                            const isNearBottom = index >= currentRoles.length - 3;
                                            return (
                                                <tr
                                                    key={item._id}
                                                    className="hover:bg-indigo-50/40 transition duration-150"
                                                    style={activeDropdownId === item._id ? { position: 'relative', zIndex: 50 } : undefined}
                                                >
                                                    <td className="py-4 px-5 font-medium text-gray-400">{indexOfFirstItem + index + 1}</td>
                                                    <td className="py-4 px-5">
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-xs">
                                                            {item.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-5 text-center relative">
                                                        <div className="relative inline-block action-dropdown-container">
                                                            <button
                                                                onClick={() => setActiveDropdownId(activeDropdownId === item._id ? null : item._id)}
                                                                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer mx-auto"
                                                            >
                                                                <span>Select</span>
                                                                <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === item._id ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {activeDropdownId === item._id && (
                                                                <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'} w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150`}>
                                                                    <button
                                                                        onClick={() => handleEdit(item)}
                                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                                    >
                                                                        <FiEdit3 className="w-3.5 h-3.5 text-indigo-500" />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(item._id)}
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
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-20 text-gray-400 font-medium">
                                                No matching roles found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredRoles.length > 0 && (
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

export default UserRole;