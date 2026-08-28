import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';

const ClientList = ({ onEdit, refreshTrigger }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPasswords, setShowPasswords] = useState({});

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
            const response = await fetch(`http://localhost:5000/client?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await response.json();
            setClients(data);
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

    // পাসওয়ার্ড টগল করার ফাংশন
    const togglePasswordVisibility = (id) => {
        setShowPasswords((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

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
                const res = await fetch(`http://localhost:5000/client/login-status/${client._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ login: 'no' })
                });

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
        Swal.fire({
            title: 'Are you sure?',
            text: "You want to delete this client!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/client/${id}`, {
                        method: 'DELETE',
                    });
                    const data = await response.json();

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
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Password</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 w-fit">
                                            <span className="font-mono">
                                                {showPasswords[client._id] ? client.password : '••••••••'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility(client._id)}
                                                className="text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
                                            >
                                                {showPasswords[client._id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                            </button>
                                        </div>
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


                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => onEdit(client)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white focus:outline-none transition-all shadow-xs"
                                                title="Edit Client"
                                            >
                                                <FaEdit size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client._id)}
                                                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white focus:outline-none transition-all shadow-xs"
                                                title="Delete Client"
                                            >
                                                <FaTrash size={15} />
                                            </button>
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