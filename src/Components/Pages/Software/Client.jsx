import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes } from 'react-icons/fa';
import ClientList from './ClientList';

const Client = () => {
    // ফরমের ডেটা ম্যানেজ করার জন্য স্টেট
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        address: '',
        isActive: false
    });

    // এডিট করার সময় সিলেক্টেড ক্লায়েন্টের আইডি রাখার জন্য স্টেট
    const [editingId, setEditingId] = useState(null);

    // টেবিল রিফ্রেশ করার ট্রিগার স্টেট
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    // পাসওয়ার্ড দৃশ্যমান বা অদৃশ্য করার স্টেট
    const [showPassword, setShowPassword] = useState(false);

    // ডুপ্লিকেট এরর ফিল্ড ট্র্যাক করার স্টেট
    const [fieldErrors, setFieldErrors] = useState({ phone: '', email: '' });

    // ফর্ম দৃশ্যমান বা অদৃশ্য (Collapse) করার স্টেট
    const [isFormOpen, setIsFormOpen] = useState(false);

    // স্ক্রল করার জন্য রেফ (Ref)
    const formRef = useRef(null);

    // টোস্ট নোটিফিকেশন কনফিগারেশন (SweetAlert2 Mixin)
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

    // ইনপুট পরিবর্তনের হ্যান্ডলার
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // শুধু সংখ্যা ইনপুট ও পেস্ট নিশ্চিত করার জন্য (এখানে বাগটি ঠিক করা হয়েছে)
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        const numericValue = value.replace(/\D/g, ''); 

        setFormData(prev => ({
            ...prev,
            phone: numericValue
        }));
        
        setFieldErrors(prev => ({ ...prev, phone: '' }));
    };

    // তালিকা থেকে Edit বাটনে ক্লিক করলে এই ফাংশন কল হবে
    const handleEditClick = (client) => {
        setEditingId(client._id);
        setFormData({
            name: client.name || '',
            phone: client.phone || '',
            email: client.email || '',
            password: client.password || '',
            address: client.address || '',
            isActive: client.isActive || false
        });
        setIsFormOpen(true); // এডিট ক্লিক করলে ফর্ম ওপেন হয়ে যাবে

        // ফর্মের দিকে স্মুথলি স্ক্রল করে নিয়ে যাবে
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // ফর্ম রিসেট বা এডিট মোড ক্যানসেল করার ফাংশন
    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            password: '',
            address: '',
            isActive: false
        });
        setEditingId(null);
        setFieldErrors({ phone: '', email: '' });
        setIsFormOpen(false); // ফর্ম বন্ধ হয়ে যাবে
    };

    // ফর্ম সাবমিট অথবা আপডেট হ্যান্ডলার
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({ phone: '', email: '' });

        try {
            const url = editingId 
                ? `http://localhost:5000/client/${editingId}` 
                : 'http://localhost:5000/client';
            
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                Toast.fire({
                    icon: 'success',
                    title: editingId ? 'Client updated successfully!' : 'Client added successfully!'
                });

                resetForm();
                setRefreshTrigger(prev => !prev); 
            } else {
                if (data.error) {
                    setFieldErrors(prev => ({
                        ...prev,
                        [data.field]: data.message
                    }));
                }
                Toast.fire({
                    icon: 'error',
                    title: data.message || 'Something went wrong!'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Toast.fire({
                icon: 'error',
                title: 'Could not connect to the server.'
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 bg-slate-50 min-h-screen" ref={formRef}>
            {/* টগল বাটন (Add New Client) */}
            <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Client Management</h1>
                    <p className="text-indigo-100 text-sm mt-1">Manage your clients efficiently with secure access and live controls.</p>
                </div>
                <button
                    onClick={() => {
                        if (isFormOpen && editingId) {
                            resetForm();
                        } else {
                            setIsFormOpen(!isFormOpen);
                        }
                    }}
                    className="flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                    {isFormOpen ? (
                        <>
                            <FaTimes /> Close Form
                        </>
                    ) : (
                        <>
                            <FaUserPlus /> Add New Client
                        </>
                    )}
                </button>
            </div>

            {/* Collapsible Form Container */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-10' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-50 p-8">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-8 bg-indigo-600 rounded-full inline-block"></span>
                            {editingId ? 'Update Client Details' : 'Register New Client'}
                        </h2>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* প্রতি লাইনে ৩টি ইনপুট ফিল্ড (Grid layout) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    placeholder="Enter client name"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    required
                                    className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.phone ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-300 focus:ring-indigo-500'} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                                    placeholder="Enter phone number"
                                />
                                {fieldErrors.phone && (
                                    <p className="mt-1 text-xs text-rose-600 font-semibold">{fieldErrors.phone}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setFieldErrors(prev => ({ ...prev, email: '' }));
                                    }}
                                    required
                                    className={`w-full px-4 py-2.5 bg-gray-50 border ${fieldErrors.email ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-300 focus:ring-indigo-500'} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                                    placeholder="Enter email address"
                                />
                                {fieldErrors.email && (
                                    <p className="mt-1 text-xs text-rose-600 font-semibold">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    placeholder="Enter address"
                                />
                            </div>

                            {/* Active Status Toggle / Checkbox */}
                            <div className="flex items-center pt-7">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    <span className="ml-3 text-sm font-semibold text-gray-700">
                                        {formData.isActive ? 'Active Status (On)' : 'Non-Active Status (Off)'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Submit / Update Button */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-8 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 ${
                                    editingId
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                }`}
                            >
                                {editingId ? 'Update Client Information' : 'Submit Client'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Client List Component */}
            <div>
                <ClientList onEdit={handleEditClick} refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default Client;