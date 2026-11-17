import React, { useState } from 'react';
import useDraftState, { clearDraft } from '../../../../../hooks/useDraftState';
import useCan from '../../../../../hooks/useCan';
import { FaBuilding, FaPhone, FaUser, FaHashtag, FaWallet, FaMapMarkerAlt, FaStickyNote, FaTimes, FaEnvelope, FaEdit, FaSave } from 'react-icons/fa';
import { inputCls, labelCls } from '../../Product/ProductUi';

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

const Lbl = ({ htmlFor, icon, children, required }) => (
    <label htmlFor={htmlFor} className={`${labelCls} flex items-center gap-1.5`}>
        <span className="text-brand-500">{icon}</span> {children} {required && <span className="text-rose-500">*</span>}
    </label>
);

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
    const { canAdd, canEdit } = useCan('company');

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
        if (scrollToTable) scrollToTable();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (isEditing && !canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        if (!isEditing && !canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');

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
            ? `http://localhost:5000/company/${editingCompany._id}`
            : 'http://localhost:5000/company';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                showToast(isEditing ? 'Company updated successfully!' : 'Company added successfully!', 'success');
                if (fetchCompanies) await fetchCompanies();
                clearDraft(draftKey);
                setEditingCompany(null);
                setShowForm(false);
                if (scrollToTable) scrollToTable();
            } else {
                showToast(isEditing ? 'Failed to update company!' : 'Something went wrong, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-brand-600">{editingId ? <FaEdit /> : <FaSave />}</span>
                    {editingId ? 'Edit Company' : 'Add New Company'}
                </h2>
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1.5 min-h-[36px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 rounded-full font-semibold cursor-pointer"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Lbl htmlFor="co-name" icon={<FaBuilding />} required>Business Name</Lbl>
                    <input id="co-name" type="text" name="businessName" placeholder="Business name" value={formData.businessName} onChange={handleChange} required className={inputCls} />
                </div>

                <div>
                    <Lbl htmlFor="co-phone" icon={<FaPhone />} required>Contact Number</Lbl>
                    <input id="co-phone" type="tel" inputMode="tel" name="contactNumber" placeholder="Contact number" value={formData.contactNumber} onChange={handleChange} required className={inputCls} />
                </div>

                <div>
                    <Lbl htmlFor="co-email" icon={<FaEnvelope />}>Email Address</Lbl>
                    <input id="co-email" type="email" name="email" placeholder="company@example.com" value={formData.email} onChange={handleChange} className={inputCls} />
                </div>

                <div>
                    <Lbl htmlFor="co-contact" icon={<FaUser />}>Contact Name</Lbl>
                    <input id="co-contact" type="text" name="contactName" placeholder="Contact person name" value={formData.contactName} onChange={handleChange} className={inputCls} />
                </div>

                <div>
                    <Lbl htmlFor="co-bno" icon={<FaHashtag />}>Business Number / Reg</Lbl>
                    <input id="co-bno" type="text" name="businessNumber" placeholder="Reg / ID number" value={formData.businessNumber} onChange={handleChange} className={inputCls} />
                </div>

                {/* Opening Balance */}
                <div>
                    <Lbl htmlFor="co-balance" icon={<FaWallet />}>Opening Balance</Lbl>
                    <div className="flex gap-2">
                        <select
                            name="openingBalanceType"
                            aria-label="Opening balance type"
                            value={formData.openingBalanceType || ''}
                            onChange={handleChange}
                            className="w-28 shrink-0 px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none cursor-pointer"
                        >
                            <option value="">Type</option>
                            <option value="Get">Get</option>
                            <option value="Pay">Pay</option>
                        </select>
                        <input
                            id="co-balance"
                            type="number"
                            inputMode="decimal"
                            name="openingBalance"
                            placeholder={formData.openingBalanceType ? '0.00' : 'Select type first'}
                            value={formData.openingBalance}
                            disabled={!formData.openingBalanceType}
                            required={!!formData.openingBalanceType}
                            onChange={(e) => {
                                if (/^\d*\.?\d{0,2}$/.test(e.target.value)) handleChange(e);
                            }}
                            step="0.01"
                            min="0"
                            className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                        />
                    </div>
                </div>

                <div>
                    <Lbl htmlFor="co-address" icon={<FaMapMarkerAlt />}>Address</Lbl>
                    <input id="co-address" type="text" name="address" placeholder="Business address" value={formData.address} onChange={handleChange} className={inputCls} />
                </div>

                <div className="sm:col-span-2">
                    <Lbl htmlFor="co-note" icon={<FaStickyNote />}>Note</Lbl>
                    <input id="co-note" type="text" name="note" placeholder="Write additional notes here..." value={formData.note} onChange={handleChange} className={inputCls} />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full sm:w-auto min-h-[44px] px-7 rounded-full text-white text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600'
                            }`}
                    >
                        {loading
                            ? editingId ? 'Updating Company...' : 'Adding Company...'
                            : editingId ? 'Update Company Details' : 'Add Company'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;