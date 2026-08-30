import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaSearch, FaShieldAlt } from 'react-icons/fa';

const UserRole = () => {
    const [roles, setRoles] = useState([]);
    const [roleInput, setRoleInput] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleInput.trim()) {
            toast.error('Role name is required!');
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
        setRoleInput(item.role);
        setEditingId(item._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setRoleInput('');
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#9ca3af',
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

    return (
        <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-gray-50/50 min-h-screen">
            <Toaster toastOptions={{ duration: 2500 }} position="top-right" />
            
            {/* Feature 1: Role Creation & Input Card (Soft & Eye-friendly) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <FaShieldAlt size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {editingId ? 'Update Role' : 'Create New Role'}
                        </h2>
                        <p className="text-gray-500 text-xs">Add permissions or update existing roles for your system</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="Enter role name (e.g. Moderator, Admin)"
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition"
                        disabled={loading}
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-sm ${
                                editingId 
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {editingId ? <><FaSave /> Update</> : <><FaPlus /> Save Role</>}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition"
                                title="Cancel"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Feature 2: Table & Search Bar Component */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Assigned Roles</h3>
                        <p className="text-xs text-gray-400">Total {roles.length} roles found in database</p>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <FaSearch size={13} />
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search roles..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Table View */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50/80 sticky top-0 border-b border-gray-200 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 w-16 font-semibold">#</th>
                                    <th className="px-4 py-3 font-semibold">Role Name</th>
                                    <th className="px-4 py-3 text-center w-32 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRoles.length > 0 ? (
                                    filteredRoles.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-gray-50/60 transition">
                                            <td className="px-4 py-3 text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 bg-blue-50/60 text-blue-700 rounded-lg font-medium text-xs border border-blue-100">
                                                    {item.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                    title="Edit"
                                                >
                                                    <FaEdit size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-10 text-gray-400 text-sm">
                                            No matching roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRole;