import React, { useState } from 'react';
import useDraftState, { clearDraft } from '../../../../../hooks/useDraftState';
import { FaBuilding, FaPhone, FaUser, FaHashtag, FaWallet, FaMapMarkerAlt, FaStickyNote, FaTimes, FaEnvelope, FaEdit, FaSave } from 'react-icons/fa';

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

const CompanyForm = ({
    companies,
    fetchCompanies,
    setShowForm,
    editingCompany,
    setEditingCompany,
    showToast,
    scrollToTable,
}) => {
    const emptyForm = {
        businessName: '',
        contactNumber: '',
        email: '',
        contactName: '',
        businessNumber: '',
        openingBalance: '',
        openingBalanceType: '',
        address: '',
        note: '',
    };

    const draftKey = editingCompany?._id ? `companyForm:${editingCompany._id}` : 'companyForm:new';
    const [formData, setFormData] = useDraftState(draftKey, () =>
        editingCompany
            ? {
                businessName: editingCompany.businessName || '',
                contactNumber: editingCompany.contactNumber || '',
                email: editingCompany.email || '',
                contactName: editingCompany.contactName || '',
                businessNumber: editingCompany.businessNumber || '',
                openingBalance: editingCompany.openingBalance || '',
                openingBalanceType: editingCompany.openingBalanceType || '',
                address: editingCompany.address || '',
                note: editingCompany.note || '',
            }
            : emptyForm
    );
    const [loading, setLoading] = useState(false);

    const isEditing = Boolean(editingCompany && editingCompany._id);
    const editingId = isEditing ? editingCompany._id : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'openingBalanceType' && !value) {
            setFormData({ ...formData, openingBalanceType: '', openingBalance: '' });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleCancelEdit = () => {
        clearDraft(draftKey);
        setEditingCompany(null);
        setShowForm(false);
        if (scrollToTable) {
            scrollToTable();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const contactInput = formData.contactNumber.trim();
        const businessNoInput = formData.businessNumber.trim().toLowerCase();

        const contactExists = companies.some(
            (c) => c.contactNumber?.trim() === contactInput && c._id !== editingId
        );
        if (contactExists) {
            showToast('This contact number already exists!', 'error');
            return;
        }

        if (businessNoInput) {
            const businessNoExists = companies.some(
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
            ? `https://squirrel-peace-server.onrender.com/company/${editingCompany._id}`
            : 'https://squirrel-peace-server.onrender.com/company';
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
                    isEditing ? 'Company updated successfully!' : 'Company added successfully!',
                    'success'
                );

                if (fetchCompanies) {
                    await fetchCompanies();
                }

                clearDraft(draftKey);
                setEditingCompany(null);
                setShowForm(false);

                if (scrollToTable) {
                    scrollToTable();
                }
            } else {
                showToast(
                    isEditing ? 'Failed to update company!' : 'Something went wrong, please try again.',
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

                            // Decimal-এর পরে সর্বোচ্চ 2 digit allow করবে
                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                handleChange(e);
                            }
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
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
                        disabled={loading}
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${editingId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {loading
                            ? editingId
                                ? 'Updating Company...'
                                : 'Adding Company...'
                            : editingId
                                ? 'Update Company Details'
                                : 'Add Company'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;