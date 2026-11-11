import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaEye, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import useAxiosSecure from '../../../../hooks/useAxiosSecure';

const ClientList = ({ onEdit, refreshTrigger }) => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);

    // Action Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(true);

    // টোস্ট নোটিফিকেশন কনফিগারেশন
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    // ব্যাকএন্ড থেকে ক্লায়েন্ট ডাটা ফেচ করা
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

        const handleFocus = () => {
            fetchClients();
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('clientUserUpdated', fetchClients);

        const interval = setInterval(() => {
            fetchClients();
        }, 2000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('clientUserUpdated', fetchClients);
            clearInterval(interval);
        };
    }, [refreshTrigger]);

    // Dropdown er baire click korle close hobe
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll korle dropdown auto close hoye jabe
    useEffect(() => {
        if (openDropdownId === null) return;

        const handleScroll = () => {
            setOpenDropdownId(null);
        };

        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [openDropdownId]);

    // সুইট অ্যালার্ট দিয়ে ফোর্সড লগআউট কনফার্মেশন হ্যান্ডলার
    const handleForceLogout = async (client) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to log out ${client.name || client.email}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, log out!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosSecure.patch(`/client/login-status/${client._id}`, { login: 'no' });
                    const res = { ok: true };

                    if (res.ok) {
                        // এখানে বড় পপআপের বদলে Toast ব্যবহার করা হয়েছে
                        Toast.fire({
                            icon: 'success',
                            title: 'Client has been logged out successfully.'
                        });
                        fetchClients();
                    } else {
                        Toast.fire({
                            icon: 'error',
                            title: 'Failed to log out client.'
                        });
                    }
                } catch (error) {
                    console.error('Error logging out client:', error);
                    Toast.fire({
                        icon: 'error',
                        title: 'Something went wrong.'
                    });
                }
            }
        });
    };

    // ডিলিট হ্যান্ডলার
    const handleDelete = (id) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "Enter admin password to delete this client!",
            icon: 'warning',
            input: 'password',
            inputPlaceholder: 'Admin password',
            inputAttributes: { autocomplete: 'off' },
            showCancelButton: true,
            showLoaderOnConfirm: true,
            allowOutsideClick: () => !Swal.isLoading(),
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
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
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    await axiosSecure.delete(`/client/${id}`, { headers: { 'x-action-token': result.value } });
                    const response = { ok: true };
                    const data = {};

                    if (response.ok) {
                        Toast.fire({
                            icon: 'success',
                            title: 'Client deleted successfully!'
                        });
                        fetchClients();
                    } else {
                        Toast.fire({
                            icon: 'error',
                            title: data.message || 'Failed to delete'
                        });
                    }
                } catch (error) {
                    console.error('Error deleting client:', error);
                    Toast.fire({
                        icon: 'error',
                        title: 'Could not connect to the server.'
                    });
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 overflow-hidden mb-10">
            <div className="bg-gradient-to-r from-gray-900 to-indigo-950 px-6 py-5 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                        <FaUsers className="text-indigo-400 text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Client Directory</h2>
                        <p className="text-xs text-gray-300">Total registered active/inactive clients: {clients.length}</p>
                    </div>
                </div>
            </div>

            {clients.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg font-medium">No clients found in the database.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/75">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Login</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {clients.map((client, index) => (
                                <tr key={client._id || index} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-400">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                        {client.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                        {client.phone}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {client.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                                        {client.address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-xs ${client.isActive
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                }`}
                                        >
                                            {client.isActive ? 'Active' : 'Non-Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <span
                                            onClick={() => client.login === 'yes' && handleForceLogout(client)}
                                            className={`cursor-pointer px-3 py-1 inline-flex items-center rounded-full text-xs font-semibold ${client.login === 'yes'
                                                ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 transition-all'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}
                                            title={client.login === 'yes' ? "Click to force logout" : "Offline"}
                                        >
                                            {client.login === 'yes' ? '🟢 Logged In' : '⚪ Logged Out'}
                                        </span>
                                    </td>


                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                                        <div className="relative inline-block action-dropdown-container">
                                            <button
                                                onClick={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setDropdownPos({ top: rect.top - 8, left: rect.right });
                                                    setOpenDropdownId(
                                                        openDropdownId === client._id ? null : client._id
                                                    );
                                                }}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <span>Select</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === client._id ? 'rotate-180' : ''}`}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </button>

                                            {openDropdownId === client._id && (
                                                <div
                                                    style={{ top: dropdownPos.top, left: dropdownPos.left, transform: 'translate(-100%, -100%)' }}
                                                    className="fixed w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setOpenDropdownId(null);
                                                            navigate(`/client-details/${client._id}`);
                                                        }}
                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                    >
                                                        <FaEye size={12} className="text-emerald-500" />
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setOpenDropdownId(null);
                                                            onEdit(client);
                                                        }}
                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                    >
                                                        <FaEdit size={12} className="text-indigo-500" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client._id)}
                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                    >
                                                        <FaTrash size={12} className="text-rose-500" />
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
        </div>
    );
};

export default ClientList;