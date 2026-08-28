import React from 'react';
import { FaBuilding, FaPhone, FaUser, FaHashtag, FaWallet, FaMapMarkerAlt, FaStickyNote, FaTimes, FaEnvelope, FaEdit, FaSave } from 'react-icons/fa';

const CompanyForm = ({ formData, handleChange, handleSubmit, editingId, handleCancelEdit }) => {
    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {editingId ? <span className="text-indigo-600"><FaEdit /> Edit Company</span> : <span className="text-indigo-600"><FaSave /> Add New Company</span>}
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
                        <FaBuilding className="text-indigo-500" /> Business Name <span className="text-red-500">*</span>
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
                        placeholder="company@example.com"
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
                        placeholder="Contact person name"
                        value={formData.contactName} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                    />
                </div>

                {/* Business Number */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaHashtag className="text-indigo-500" /> Business Number / Reg
                    </label>
                    <input 
                        type="text" 
                        name="businessNumber" 
                        placeholder="Reg / ID number"
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

                {/* Address */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaMapMarkerAlt className="text-indigo-500" /> Address
                    </label>
                    <input 
                        type="text" 
                        name="address" 
                        placeholder="Business address"
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
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${
                            editingId 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200' 
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                        }`}
                    >
                        {editingId ? 'Update Company Details' : 'Save Company'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;