import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaCalendarAlt, FaMoneyBillWave, FaStickyNote, FaTimes, FaEdit, FaBullseye } from 'react-icons/fa';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "YYYY-MM" -> "November, 2026"
export const displayMonthYear = (value) => {
    if (!value) return '';
    const [y, m] = String(value).split('-');
    const idx = Number(m) - 1;
    if (!y || isNaN(idx) || !MONTHS[idx]) return value;
    return `${MONTHS[idx]}, ${y}`;
};

const getCurrentMonthValue = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// 26/08/2026, 3:19:09 pm
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

const inputBase =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed';

const personName = (u) => u.name || u.userName || u.fullName || u.email || '';

const SalesSrTargetForm = ({
    targets,
    srList = [],
    fetchTargets,
    setShowForm,
    editingTarget,
    setEditingTarget,
    showToast,
    scrollToTable,
}) => {
    const isEditing = Boolean(editingTarget && editingTarget._id);
    const editingId = isEditing ? editingTarget._id : null;

    const [formData, setFormData] = useState({
        srId: editingTarget?.srId || '',
        sr: editingTarget?.sr || '',
        targetMonth: editingTarget?.targetMonth || getCurrentMonthValue(),
        targetAmount: editingTarget?.targetAmount !== undefined ? String(editingTarget.targetAmount) : '',
        note: editingTarget?.note || '',
    });
    const [loading, setLoading] = useState(false);

    // SR searchable select
    const [srSearch, setSrSearch] = useState(editingTarget?.sr || '');
    const [srOpen, setSrOpen] = useState(false);

    // Month-Year picker
    const [monthOpen, setMonthOpen] = useState(false);
    const monthRef = useRef(null);
    const [pickerYear, setPickerYear] = useState(Number(formData.targetMonth.split('-')[0]));

    useEffect(() => {
        const handleOutside = (e) => {
            if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const currentYear = new Date().getFullYear();
    const selectedYear = Number(formData.targetMonth.split('-')[0]);
    const selectedMonthIdx = Number(formData.targetMonth.split('-')[1]) - 1;

    const yearOptions = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) yearOptions.push(y);
    if (!yearOptions.includes(pickerYear)) yearOptions.push(pickerYear);
    yearOptions.sort((a, b) => a - b);

    const filteredSr = srList.filter((u) => {
        const q = srSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            personName(u).toLowerCase().includes(q) ||
            String(u.phone || u.contactNumber || '').toLowerCase().includes(q)
        );
    });

    const handleSelectMonth = (idx) => {
        setFormData((prev) => ({
            ...prev,
            targetMonth: `${pickerYear}-${String(idx + 1).padStart(2, '0')}`,
        }));
        setMonthOpen(false);
    };

    const handleCancelEdit = () => {
        setEditingTarget(null);
        setShowForm(false);
        if (scrollToTable) scrollToTable();
    };

    const canSubmit = !!formData.srId && !!formData.targetMonth && Number(formData.targetAmount) > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) {
            showToast('Please fill all required fields!', 'error');
            return;
        }

        const exists = targets.some(
            (t) => String(t.srId) === String(formData.srId) && t.targetMonth === formData.targetMonth && t._id !== editingId
        );
        if (exists) {
            showToast('This SR already has a target for this month!', 'error');
            return;
        }

        setLoading(true);

        const payload = {
            srId: formData.srId,
            sr: formData.sr,
            targetMonth: formData.targetMonth,
            targetAmount: Math.round((Number(formData.targetAmount) || 0) * 100) / 100,
            note: formData.note.trim(),
        };
        if (!isEditing) payload.createdAt = formatDateTime(new Date());

        const url = isEditing
            ? `http://localhost:5000/sales-sr-target/${editingId}`
            : 'http://localhost:5000/sales-sr-target';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                showToast(isEditing ? 'Target updated successfully!' : 'Target added successfully!', 'success');
                if (fetchTargets) await fetchTargets();
                setEditingTarget(null);
                setShowForm(false);
                if (scrollToTable) scrollToTable();
            } else {
                showToast(data?.message || (isEditing ? 'Failed to update target!' : 'Failed to add target!'), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {isEditing ? (
                        <span className="text-indigo-600 flex items-center gap-2"><FaEdit /> Edit SR Target</span>
                    ) : (
                        <span className="text-indigo-600 flex items-center gap-2"><FaBullseye /> Add SR Target</span>
                    )}
                </h2>
                {isEditing && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                {/* SR */}
                <div className="relative">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-indigo-500" /> SR <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={srSearch}
                            placeholder="Search or select SR..."
                            autoComplete="off"
                            onFocus={() => setSrOpen(true)}
                            onChange={(e) => {
                                setSrSearch(e.target.value);
                                setSrOpen(true);
                                if (formData.srId) setFormData((prev) => ({ ...prev, srId: '', sr: '' }));
                            }}
                            onBlur={() => setTimeout(() => setSrOpen(false), 150)}
                            className={`${inputBase} pr-8`}
                        />
                        {srSearch && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSrSearch('');
                                    setFormData((prev) => ({ ...prev, srId: '', sr: '' }));
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 cursor-pointer"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}
                    </div>
                    {srOpen && (
                        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                            {filteredSr.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-400">No SR found</p>
                            ) : (
                                filteredSr.map((u) => (
                                    <div
                                        key={u._id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSrSearch(personName(u));
                                            setSrOpen(false);
                                            setFormData((prev) => ({ ...prev, srId: u._id, sr: personName(u) }));
                                        }}
                                        className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <p className="text-sm font-semibold text-gray-800">{personName(u)}</p>
                                        {(u.phone || u.contactNumber) && (
                                            <p className="text-xs text-gray-500 mt-0.5">{u.phone || u.contactNumber}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Target Month & Year */}
                <div className="relative" ref={monthRef}>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaCalendarAlt className="text-indigo-500" /> Target Month & Year <span className="text-red-500">*</span>
                    </label>
                    <div
                        className="relative w-full cursor-pointer"
                        onClick={() => {
                            setPickerYear(selectedYear);
                            setMonthOpen((o) => !o);
                        }}
                    >
                        <input
                            type="text"
                            readOnly
                            placeholder="Select month & year"
                            value={displayMonthYear(formData.targetMonth)}
                            className={`${inputBase} pointer-events-none cursor-pointer`}
                        />
                    </div>
                    {monthOpen && (
                        <div className="absolute z-30 mt-1 w-full min-w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                            <select
                                value={pickerYear}
                                onChange={(e) => setPickerYear(Number(e.target.value))}
                                className={`${inputBase} cursor-pointer mb-3`}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-3 gap-2">
                                {MONTHS.map((m, idx) => {
                                    const active = pickerYear === selectedYear && idx === selectedMonthIdx;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleSelectMonth(idx)}
                                            className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${active
                                                ? 'bg-indigo-600 text-white shadow'
                                                : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-100'
                                                }`}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Target Amount */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaMoneyBillWave className="text-indigo-500" /> Target Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.targetAmount}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                setFormData((prev) => ({ ...prev, targetAmount: value }));
                            }
                        }}
                        className={inputBase}
                    />
                </div>

                {/* Note */}
                <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaStickyNote className="text-indigo-500" /> Note
                    </label>
                    <input
                        type="text"
                        placeholder="Write additional notes here..."
                        value={formData.note}
                        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                        className={inputBase}
                    />
                </div>

                {/* Submit */}
                <div className="sm:col-span-2 md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className={`px-8 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer ${isEditing
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {loading
                            ? isEditing ? 'Updating...' : 'Saving...'
                            : isEditing ? 'Update Target' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SalesSrTargetForm;