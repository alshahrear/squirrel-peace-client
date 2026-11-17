import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaUserPlus, FaTimes } from 'react-icons/fa';
import ClientList from './ClientList';
import useAxiosSecure from '../../../../hooks/useAxiosSecure';

const inputCls =
    'w-full px-3 py-2.5 text-sm rounded-xl border bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500';
const okCls = 'border-slate-300 focus:border-brand-500 focus:ring-brand-100';
const errCls = 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100';
const labelCls = 'block mb-1.5 text-xs font-medium text-slate-600';

const emptyForm = {
    whatsapp: '',
    userLimit: 10,
    name: '',
    slug: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    isActive: false,
};

const Client = () => {
    const axiosSecure = useAxiosSecure();
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [slugLocked, setSlugLocked] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ phone: '', email: '', slug: '' });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const formRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePhoneChange = (e) => {
        const numericValue = e.target.value.replace(/\D/g, '');
        setFormData((prev) => ({ ...prev, phone: numericValue }));
        setFieldErrors((prev) => ({ ...prev, phone: '' }));
    };

    const handleEditClick = (client) => {
        setEditingId(client._id);
        setSlugLocked(!!client.slug);
        setFormData({
            name: client.name || '',
            slug: client.slug || '',
            phone: client.phone || '',
            email: client.email || '',
            password: '',
            address: client.address || '',
            isActive: client.isActive || false,
            whatsapp: client.whatsapp || '',
            userLimit: client.userLimit ?? 10,
        });
        setIsFormOpen(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setSlugLocked(false);
        setFieldErrors({ phone: '', email: '', slug: '' });
        setShowPassword(false);
        setIsFormOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setFieldErrors({ phone: '', email: '', slug: '' });
        setSaving(true);
        try {
            if (editingId) {
                await axiosSecure.put(`/client/${editingId}`, formData);
            } else {
                await axiosSecure.post('/client', formData);
            }
            toast.success(editingId ? 'Client updated successfully!' : 'Client added successfully!');
            resetForm();
            setRefreshTrigger((prev) => !prev);
        } catch (error) {
            const data = error.response?.data;
            if (data?.error && data.field) {
                setFieldErrors((prev) => ({ ...prev, [data.field]: data.message }));
            }
            toast.error(data?.message || 'Something went wrong!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Client Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Dealers, user limit and live login control.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (isFormOpen) resetForm();
                            else setIsFormOpen(true);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 shadow-sm cursor-pointer"
                    >
                        {isFormOpen ? (<><FaTimes /> Close Form</>) : (<><FaUserPlus /> Add New Client</>)}
                    </button>
                </div>

                {/* Form */}
                {isFormOpen && (
                    <div ref={formRef} className="scroll-mt-20 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                            <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                {editingId ? 'Update Client Details' : 'Register New Client'}
                            </h2>
                            {editingId && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">Editing</span>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="c-name" className={labelCls}>Full Name</label>
                                    <input id="c-name" type="text" name="name" value={formData.name} onChange={handleChange} required
                                        className={`${inputCls} ${okCls}`} placeholder="Enter client name" />
                                </div>

                                <div>
                                    <label htmlFor="c-slug" className={labelCls}>Subdomain</label>
                                    <div className="flex">
                                        <input
                                            id="c-slug"
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                setFormData((prev) => ({ ...prev, slug: v }));
                                                setFieldErrors((prev) => ({ ...prev, slug: '' }));
                                            }}
                                            required
                                            disabled={slugLocked}
                                            maxLength={30}
                                            className={`${inputCls} ${fieldErrors.slug ? errCls : okCls} rounded-r-none min-w-0`}
                                            placeholder="client1"
                                        />
                                        <span className="px-3 flex items-center bg-slate-100 border border-l-0 border-slate-300 rounded-r-xl text-xs text-slate-500 whitespace-nowrap">.bashaybazar.com</span>
                                    </div>
                                    {fieldErrors.slug && <p className="mt-1 text-xs text-rose-600 font-semibold">{fieldErrors.slug}</p>}
                                    {slugLocked && <p className="mt-1 text-xs text-slate-500">Subdomain cannot be changed.</p>}
                                </div>

                                <div>
                                    <label htmlFor="c-phone" className={labelCls}>Phone Number</label>
                                    <input id="c-phone" type="text" inputMode="numeric" name="phone" value={formData.phone} onChange={handlePhoneChange} required
                                        className={`${inputCls} ${fieldErrors.phone ? errCls : okCls}`} placeholder="Enter phone number" />
                                    {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{fieldErrors.phone}</p>}
                                </div>

                                <div>
                                    <label htmlFor="c-email" className={labelCls}>Email Address</label>
                                    <input id="c-email" type="email" name="email" value={formData.email}
                                        onChange={(e) => { handleChange(e); setFieldErrors((prev) => ({ ...prev, email: '' })); }}
                                        required className={`${inputCls} ${fieldErrors.email ? errCls : okCls}`} placeholder="Enter email address" />
                                    {fieldErrors.email && <p className="mt-1 text-xs text-rose-600 font-semibold">{fieldErrors.email}</p>}
                                </div>

                                <div>
                                    <label htmlFor="c-pass" className={labelCls}>Password</label>
                                    <div className="relative">
                                        <input
                                            id="c-pass"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editingId}
                                            maxLength={128}
                                            pattern="(?=.*[A-Za-z])(?=.*\d).{8,128}"
                                            title="8-128 characters, must include letters and numbers"
                                            autoComplete="new-password"
                                            className={`${inputCls} ${okCls} pr-11`}
                                            placeholder={editingId ? 'Leave blank to keep current' : 'Min 8 chars, letters & numbers'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-0 top-0 w-11 h-full flex items-center justify-center bg-transparent border-0 p-0 text-slate-400 hover:text-brand-600"
                                        >
                                            {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="c-addr" className={labelCls}>Address</label>
                                    <input id="c-addr" type="text" name="address" value={formData.address} onChange={handleChange} required
                                        className={`${inputCls} ${okCls}`} placeholder="Enter address" />
                                </div>

                                <div>
                                    <label htmlFor="c-wa" className={labelCls}>WhatsApp Number <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <input id="c-wa" type="text" inputMode="numeric" name="whatsapp" value={formData.whatsapp}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '') }))}
                                        className={`${inputCls} ${okCls}`} placeholder="Enter WhatsApp number" />
                                </div>

                                <div>
                                    <label htmlFor="c-limit" className={labelCls}>User Limit <span className="text-slate-400 font-normal">(including dealer)</span></label>
                                    <input id="c-limit" type="text" inputMode="numeric" name="userLimit" value={formData.userLimit}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, userLimit: e.target.value.replace(/\D/g, '') }))}
                                        required className={`${inputCls} ${okCls}`} placeholder="10" />
                                </div>

                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
                                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                        <span className="relative w-11 h-6 shrink-0 rounded-full bg-slate-300 peer-checked:bg-emerald-600 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"></span>
                                        <span className="text-sm font-medium text-slate-700">
                                            {formData.isActive ? 'Active' : 'Non-Active'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                                <button type="button" onClick={resetForm}
                                    className="px-6 py-2.5 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-8 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer">
                                    {saving ? 'Saving...' : editingId ? 'Update Client' : 'Submit Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <ClientList onEdit={handleEditClick} refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default Client;