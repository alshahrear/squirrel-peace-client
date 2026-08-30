import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaPhone, FaHashtag, FaWallet, FaMapMarkerAlt, FaStickyNote, FaTimes, FaEnvelope, FaEdit, FaSave, FaStore, FaRoute, FaCreditCard, FaChevronDown } from 'react-icons/fa';

const CustomersFrom = ({ formData, handleChange, handleSubmit, editingId, handleCancelEdit, routes = [] }) => {
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

                {/* Customer Type */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaStore className="text-indigo-500" /> Customer Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="customerType"
                        value={formData.customerType}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    >
                        <option value="Wholesale Customer">Wholesale Customer</option>
                        <option value="Retail Customer">Retail Customer</option>
                    </select>
                </div>

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
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaWallet className="text-indigo-500" /> Opening Balance
                    </label>
                    <input
                        type="number"
                        name="openingBalance"
                        placeholder="0.00"
                        value={formData.openingBalance}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Credit Limit */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaCreditCard className="text-indigo-500" /> Credit Limit
                    </label>
                    <input
                        type="number"
                        name="creditLimit"
                        placeholder="0.00"
                        value={formData.creditLimit || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

              {/* Route (Conditional: Searchable Select for Wholesale Customer) */}
                {formData.customerType === 'Wholesale Customer' && (
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaRoute className="text-indigo-500" /> Route <span className="text-red-500">*</span>
                        </label>
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
                                required={formData.customerType === 'Wholesale Customer'}
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
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${editingId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {editingId ? 'Update Customer Details' : 'Save Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomersFrom;