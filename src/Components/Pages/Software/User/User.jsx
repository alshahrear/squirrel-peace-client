import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import UserForm from './UserForm';
import useDraftState from '../../../../hooks/useDraftState';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiChevronDown, FiEdit3, FiTrash2 } from 'react-icons/fi';

const User = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Search, Form & Edit Modal States
    const [searchTerm, setSearchTerm] = useState('');
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
                        // রিফ্রেশ ছাড়াই স্টেট থেকে ফিল্টার করে ডিলিট করা ইউজার বাদ দেওয়া
                        setUsers(prevUsers => prevUsers.filter(user => user._id !== id));
                    } else {
                        showToast('Failed to delete user!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // Filtered Users based on Search
    const filteredUsers = users.filter((user) => {
        const search = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(search);
        const emailMatch = user.email?.toLowerCase().includes(search);
        const phoneMatch = user.phone?.toLowerCase().includes(search);
        return nameMatch || emailMatch || phoneMatch;
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
                    </div>

                    <button
                        onClick={() => {
                            setEditingUser(null);
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
                            editingUser={editingUser}
                            onUserAdded={(newUser) => {
                                // নতুন ইউজার সাথে সাথে স্টেটে যোগ করা (রিফ্রেশ ছাড়া)
                                setUsers(prevUsers => [newUser, ...prevUsers]);
                                setShowForm(false);
                                setEditingUser(null);
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                            onUserSaved={(updatedUser) => {
                                // এডিট করা ইউজার সাথে সাথে স্টেটে আপডেট করা (রিফ্রেশ ছাড়া)
                                setUsers(prevUsers => prevUsers.map(u => u._id === updatedUser._id ? updatedUser : u));
                                setShowForm(false);
                                setEditingUser(null);
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

                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No users found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm p-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
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
                                    {currentUsers.map((user, index) => (
                                        <tr key={user._id || index} className="hover:bg-indigo-50/40 transition duration-150">
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
                                            <td className="py-4 px-5 text-xs text-gray-500">{user.createdAt}</td>
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