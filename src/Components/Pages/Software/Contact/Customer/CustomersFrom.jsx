import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDraftState, { clearDraft } from '../../../../../hooks/useDraftState';
import { FaPlus } from 'react-icons/fa';
import { FaUser, FaPhone, FaHashtag, FaWallet, FaMapMarkerAlt, FaStickyNote, FaTimes, FaEnvelope, FaEdit, FaSave, FaStore, FaRoute, FaCreditCard, FaChevronDown } from 'react-icons/fa';

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

const CustomersFrom = ({
    customers,
    fetchCustomers,
    setShowForm,
    editingCustomer,
    setEditingCustomer,
    showToast,
    scrollToTable,
    routes = [],
}) => {
    const navigate = useNavigate();

    const emptyForm = {
        businessName: '',
        contactNumber: '',
        email: '',
        contactName: '',
        businessNumber: '',
        openingBalance: '',
        openingBalanceType: '',
        creditLimit: '',
        address: '',
        route: '',
        note: '',
    };

    const draftKey = editingCustomer?._id ? `customerForm:${editingCustomer._id}` : 'customerForm:new';
    const [formData, setFormData] = useDraftState(draftKey, () =>
        editingCustomer
            ? {
                businessName: editingCustomer.businessName || '',
                contactNumber: editingCustomer.contactNumber || '',
                email: editingCustomer.email || '',
                contactName: editingCustomer.contactName || '',
                businessNumber: editingCustomer.businessNumber || '',
                openingBalance: editingCustomer.openingBalance || '',
                openingBalanceType: editingCustomer.openingBalanceType || '',
                creditLimit: editingCustomer.creditLimit || '',
                address: editingCustomer.address || '',
                route: editingCustomer.route || '',
                note: editingCustomer.note || '',
            }
            : emptyForm
    );
    const [loading, setLoading] = useState(false);

    const isEditing = Boolean(editingCustomer && editingCustomer._id);
    const editingId = isEditing ? editingCustomer._id : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'openingBalanceType' && !value) {
            setFormData((prev) => ({ ...prev, openingBalanceType: '', openingBalance: '' }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        clearDraft(draftKey);
        setEditingCustomer(null);
        setShowForm(false);
        if (scrollToTable) {
            scrollToTable();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contactInput = formData.contactNumber.trim();
        const businessNoInput = formData.businessNumber.trim().toLowerCase();

        const contactExists = customers.some(
            (c) => c.contactNumber?.trim() === contactInput && c._id !== editingId
        );
        if (contactExists) {
            showToast('This contact number already exists!', 'error');
            return;
        }

        if (businessNoInput) {
            const businessNoExists = customers.some(
                (c) => c.businessNumber?.trim().toLowerCase() === businessNoInput && c._id !== editingId
            );
            if (businessNoExists) {
                showToast('This business number already exists!', 'error');
                return;
            }
        }

        setLoading(true);

        const finalData = isEditing
            ? { ...formData }
            : { ...formData, createdAt: formatDateTime(new Date()) };

        const url = isEditing
            ? `http://localhost:5000/customer/${editingCustomer._id}`
            : 'http://localhost:5000/customer';
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
                    isEditing ? 'Customer updated successfully!' : 'Customer added successfully!',
                    'success'
                );

                if (fetchCustomers) {
                    await fetchCustomers();
                }

                clearDraft(draftKey);
                setEditingCustomer(null);
                setShowForm(false);

                if (scrollToTable) {
                    scrollToTable();
                }
            } else {
                showToast(
                    isEditing ? 'Failed to update customer!' : 'Something went wrong, please try again.',
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
    const [routeSearch, setRouteSearch] = useState('');
    const [isRouteOpen, setIsRouteOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsRouteOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setRouteSearch(formData.route || '');
    }, [formData.route]);

    const filteredRoutes = routes
        .filter(rt => rt.isActive !== false)
        .map(rt => rt.routeName || rt.name || rt)
        .filter(routeName => routeName.toLowerCase().includes(routeSearch.toLowerCase()));

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {editingId ? <span className="text-indigo-600"><FaEdit /> Edit Customer</span> : <span className="text-indigo-600"><FaSave /> Add New Customer</span>}
                </h2>
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-all"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                {/* Business Name */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-indigo-500" /> Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="businessName"
                        placeholder="Business name"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Contact Number */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaPhone className="text-indigo-500" /> Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="contactNumber"
                        placeholder="Contact number"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Email Address */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaEnvelope className="text-indigo-500" /> Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        placeholder="customer@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Contact Name */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-indigo-500" /> Contact Name
                    </label>
                    <input
                        type="text"
                        name="contactName"
                        placeholder="Reference name"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Business Number / ID */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaHashtag className="text-indigo-500" /> Business Number / ID
                    </label>
                    <input
                        type="text"
                        name="businessNumber"
                        placeholder="ID or Reg number"
                        value={formData.businessNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Opening Balance */}
                <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2 h-4">
                        <label className="text-gray-700 text-xs font-semibold flex items-center gap-1.5">
                            <FaWallet className="text-indigo-500" /> Opening Balance
                        </label>
                        <select
                            name="openingBalanceType"
                            value={formData.openingBalanceType || ''}
                            onChange={handleChange}
                            className="h-5 px-1.5 py-0 text-[11px] leading-none rounded-md border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 text-gray-700 cursor-pointer"
                        >
                            <option value="">Select type</option>
                            <option value="Get">Get</option>
                            <option value="Pay">Pay</option>
                        </select>
                    </div>
                    <input
                        type="number"
                        name="openingBalance"
                        placeholder={formData.openingBalanceType ? '0.00' : 'Select type first'}
                        value={formData.openingBalance}
                        disabled={!formData.openingBalanceType}
                        required={!!formData.openingBalanceType}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                handleChange(e);
                            }
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Credit Limit */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaCreditCard className="text-indigo-500" /> Due Limit
                    </label>
                    <input
                        type="number"
                        name="creditLimit"
                        placeholder="0.00"
                        value={formData.creditLimit}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                handleChange(e);
                            }
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Route (Conditional: Searchable Select for Wholesale Customer) */}
                {(
                    <div className="relative" ref={dropdownRef}>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-gray-700 text-xs font-semibold flex items-center gap-1.5">
                                <FaRoute className="text-indigo-500" /> Route <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => navigate('/routes')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-pink-600 transition-colors cursor-pointer"
                            >
                                <FaPlus size={10} />
                                Add Route
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search or select route..."
                                value={routeSearch}
                                onFocus={() => setIsRouteOpen(true)}
                                onChange={(e) => {
                                    setRouteSearch(e.target.value);
                                    setIsRouteOpen(true);
                                    handleChange({
                                        target: { name: 'route', value: e.target.value }
                                    });
                                }}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 pr-8"
                            />
                            <button
                                type="button"
                                onClick={() => setIsRouteOpen(!isRouteOpen)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FaChevronDown size={12} />
                            </button>
                        </div>

                        {isRouteOpen && (
                            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredRoutes.length > 0 ? (
                                    filteredRoutes.map((routeName, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() => {
                                                setRouteSearch(routeName);
                                                setIsRouteOpen(false);
                                                handleChange({
                                                    target: { name: 'route', value: routeName }
                                                });
                                            }}
                                            className="px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                                        >
                                            {routeName}
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-3 py-2 text-sm text-gray-400">
                                        No matching route (You can type a new one)
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                )}

                {/* Address */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-indigo-500" /> Address
                    </label>
                    <input
                        type="text"
                        name="address"
                        placeholder="Customer address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Note */}
                <div className="sm:col-span-2 md:col-span-2">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaStickyNote className="text-indigo-500" /> Note
                    </label>
                    <input
                        type="text"
                        name="note"
                        placeholder="Write additional notes here..."
                        value={formData.note}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Submit Button */}
                <div className="sm:col-span-2 md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${editingId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {loading
                            ? editingId
                                ? 'Updating Customer...'
                                : 'Adding Customer...'
                            : editingId
                                ? 'Update Customer Details'
                                : 'Add Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomersFrom;