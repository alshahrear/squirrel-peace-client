import React, { useState, useEffect } from 'react';

const UserForm = ({ showToast, editingUser, onUserAdded, onUserSaved }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        address: '',
        password: '',
        isActive: true,
    });

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Fetch Roles
    useEffect(() => {
        fetch('http://localhost:5000/userRole')
            .then((res) => res.json())
            .then((data) => {
                setRoles(data);
            })
            .catch((error) => console.error('Error fetching roles:', error));
    }, []);

    // Handle Edit Mode Data Load
    useEffect(() => {
        if (editingUser) {
            setFormData({
                name: editingUser.name || '',
                email: editingUser.email || '',
                phone: editingUser.phone || '',
                role: editingUser.role || '',
                address: editingUser.address || '',
                password: '', 
                isActive: editingUser.isActive ?? true,
            });
        }
    }, [editingUser]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const now = new Date();
        const formattedDate = now.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }).toLowerCase().replace(',', ',');

        const url = editingUser 
            ? `http://localhost:5000/user/${editingUser._id}` 
            : 'http://localhost:5000/user';
        
        const method = editingUser ? 'PUT' : 'POST';

        const finalData = {
            ...formData,
            createdAt: editingUser ? editingUser.createdAt : formattedDate,
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                const resultData = await response.json();
                
                showToast(editingUser ? 'User updated successfully!' : 'User created successfully!', 'success');
                
                if (editingUser && onUserSaved) {
                    // এডিট করার পর আপডেট ডাটা প্যারেন্ট কম্পোনেন্টে পাঠানো
                    const updatedUserObj = {
                        ...editingUser,
                        ...finalData,
                        password: finalData.password ? finalData.password : editingUser.password // পাসওয়ার্ড ফাকা থাকলে আগেরটা রাখা
                    };
                    onUserSaved(updatedUserObj);
                } else if (onUserAdded) {
                    // নতুন ইউজারের ক্ষেত্রে ব্যাকএন্ড থেকে আসা insertedId বা পুরো অবজেক্ট হ্যান্ডেল করা
                    const newUserId = resultData.insertedId || resultData._id || Date.now().toString();
                    const createdUserObj = {
                        ...finalData,
                        _id: newUserId
                    };
                    onUserAdded(createdUserObj);
                }

                // ফর্ম রিসেট
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    role: '',
                    address: '',
                    password: '',
                    isActive: true,
                });
            } else {
                showToast('Something went wrong, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white mb-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800">
                            {editingUser ? 'Edit User Information' : 'New User Registration'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Fill out the essential details below to manage system access</p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            placeholder="Enter name" 
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            placeholder="example@email.com" 
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            placeholder="Enter phone number" 
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                        <select 
                            name="role" 
                            value={formData.role} 
                            onChange={handleChange} 
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select role</option>
                            {roles.map((item) => (
                                <option key={item._id} value={item.role}>
                                    {item.role}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <input 
                            type="text" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="Enter address" 
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password {!editingUser && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                required={!editingUser} 
                                placeholder="••••••••" 
                                className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors cursor-pointer"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-200/60 shadow-sm">
                        <div>
                            <span className="block text-sm font-semibold text-gray-800">Account Status</span>
                            <span className="text-xs text-gray-400">Active status enables user permissions</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="isActive" 
                                checked={formData.isActive} 
                                onChange={handleChange} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-pink-600"></div>
                        </label>
                    </div>

                    <div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (editingUser ? 'Updating User...' : 'Saving User...') : (editingUser ? 'Update User' : 'Submit User')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserForm;