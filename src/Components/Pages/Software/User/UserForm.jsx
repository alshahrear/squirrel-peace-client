import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaUserPlus, FaUserEdit, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';
import useCan from '../../../../hooks/useCan';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

const inputCls =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';

// Helper function to format date & time like: 26/08/2026, 3:19:09 pm
const formatDateTime = (date = new Date()) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
};

const UserForm = ({
    showToast,
    users = [],
    fetchUsers,
    setShowForm,
    editingUser,
    setEditingUser,
    scrollToTable,
}) => {
    const navigate = useNavigate();
    const { canAdd, canEdit } = useCan('user_list');
    const isEditing = Boolean(editingUser && editingUser._id);
    const draftKey = editingUser ? `userForm:${editingUser._id}` : 'userForm:new';
    const [formData, setFormData] = useDraftState(draftKey, () => ({
        name: editingUser?.name || '',
        email: editingUser?.email || '',
        phone: editingUser?.phone || '',
        role: editingUser?.role || '',
        address: editingUser?.address || '',
        isActive: editingUser?.isActive ?? true,
    }));
    const [password, setPassword] = useState('');

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleCancelEdit = () => {
        clearDraft(draftKey);
        setPassword('');
        setEditingUser(null);
        setShowForm(false);
        if (scrollToTable) {
            scrollToTable();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingUser && editingUser._id ? !canEdit : !canAdd) {
            showToast(editingUser && editingUser._id ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', 'error');
            return;
        }

        const emailInput = formData.email.trim().toLowerCase();
        const phoneInput = formData.phone.trim();

        const emailExists = users.some(
            (u) => u.email?.trim().toLowerCase() === emailInput && u._id !== editingUser?._id
        );
        if (emailExists) {
            showToast('This email already exists!', 'error');
            return;
        }

        if (phoneInput) {
            const phoneExists = users.some(
                (u) => u.phone?.trim() === phoneInput && u._id !== editingUser?._id
            );
            if (phoneExists) {
                showToast('This phone number already exists!', 'error');
                return;
            }
        }

        if ((!isEditing || password.trim()) && !PASSWORD_RULE.test(password)) {
            showToast('Password must be 8-128 characters and include letters and numbers', 'error');
            return;
        }

        setLoading(true);

        const finalData = isEditing
            ? { ...formData }
            : { ...formData, createdAt: formatDateTime(new Date()) };

        // Password শুধু তখনই যাবে যখন কিছু লেখা থাকবে
        if (password.trim()) {
            finalData.password = password;
        }

        const url = isEditing
            ? `http://localhost:5000/user/${editingUser._id}`
            : 'http://localhost:5000/user';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                showToast(
                    isEditing ? 'User updated successfully!' : 'User created successfully!',
                    'success'
                );

                if (fetchUsers) {
                    await fetchUsers();
                }

                clearDraft(draftKey);
                setPassword('');
                setEditingUser(null);
                setShowForm(false);

                if (scrollToTable) {
                    scrollToTable();
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                showToast(
                    errData.message || (isEditing ? 'Failed to update user!' : 'Something went wrong, please try again.'),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                        {isEditing ? <FaUserEdit size={16} /> : <FaUserPlus size={16} />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                            {editingUser ? 'Edit User Information' : 'New User Registration'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Fill out the essential details below to manage system access</p>
                    </div>
                </div>
                {isEditing && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="shrink-0 flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 h-9 rounded-full cursor-pointer"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Name <span className="text-rose-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter name" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Email Address <span className="text-rose-500">*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" className={inputCls} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-medium text-slate-600">Role <span className="text-rose-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => navigate('/user-role')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer"
                            >
                                <FaPlus size={9} /> Add Role
                            </button>
                        </div>
                        <select name="role" value={formData.role} onChange={handleChange} required className={`${inputCls} cursor-pointer`}>
                            <option value="" disabled>Select role</option>
                            {roles.map((item) => (
                                <option key={item._id} value={item.role}>
                                    {item.role}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Enter address" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>
                            Password {!editingUser && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={!editingUser}
                                placeholder={editingUser ? 'Leave blank to keep current' : 'Min 8 chars, letters & numbers'}
                                maxLength={128}
                                autoComplete="new-password"
                                className={`${inputCls} pr-11`}
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-slate-400 hover:text-brand-600 cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-1">
                    <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-800">Account Status</span>
                            <span className="text-xs text-slate-400">Active status enables user permissions</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                                aria-label="Account status"
                            />
                            <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full min-h-[46px] px-4 bg-brand-600 text-white text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (isEditing ? 'Updating User...' : 'Adding User...') : (isEditing ? 'Update User' : 'Add User')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;