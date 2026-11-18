import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaBullseye, FaEdit } from 'react-icons/fa';
import { inputCls, labelCls, ComboField } from '../Purchase/PurchaseUi';
import { Card } from '../Purchase/PurchaseFormUi';

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

const personName = (u) => u.name || u.userName || u.fullName || u.email || '';

// ---------- Month & Year picker (all browsers, mobile friendly) ----------
export const MonthField = ({ label, value, onChange, placeholder = 'Select month', clearable = false }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const nowYear = new Date().getFullYear();
    const selYear = value ? Number(value.split('-')[0]) : nowYear;
    const selMonth = value ? Number(value.split('-')[1]) - 1 : -1;
    const [year, setYear] = useState(selYear);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        document.addEventListener('touchstart', h);
        return () => {
            document.removeEventListener('mousedown', h);
            document.removeEventListener('touchstart', h);
        };
    }, []);

    const pick = (idx) => {
        onChange(`${year}-${String(idx + 1).padStart(2, '0')}`);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <span className={labelCls}>{label}</span>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        setYear(selYear);
                        setOpen((o) => !o);
                    }}
                    className={`${inputCls} h-[38px] text-left cursor-pointer pr-9 truncate whitespace-nowrap ${value ? 'text-slate-800' : 'text-slate-400'}`}
                >
                    {value ? displayMonthYear(value) : placeholder}
                </button>
                {clearable && value && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => onChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                        <FaTimes size={11} />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-40 right-0 sm:right-auto sm:left-0 mt-1 w-[260px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            aria-label="Previous year"
                            onClick={() => setYear((y) => y - 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-brand-50 cursor-pointer"
                        >
                            <FaChevronLeft size={11} />
                        </button>
                        <span className="text-sm font-bold text-slate-800">{year}</span>
                        <button
                            type="button"
                            aria-label="Next year"
                            onClick={() => setYear((y) => y + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-brand-50 cursor-pointer"
                        >
                            <FaChevronRight size={11} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map((m, idx) => {
                            const active = year === selYear && idx === selMonth;
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => pick(idx)}
                                    className={`h-10 rounded-xl text-xs font-semibold cursor-pointer ${active
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-brand-50 hover:text-brand-700'
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
    );
};

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
    const [srSearch, setSrSearch] = useState(editingTarget?.sr || '');
    const [loading, setLoading] = useState(false);

    const srOptions = srList
        .filter((u) => {
            const q = srSearch.trim().toLowerCase();
            if (!q) return true;
            return personName(u).toLowerCase().includes(q) || String(u.phone || u.contactNumber || '').toLowerCase().includes(q);
        })
        .map((u) => ({
            key: u._id,
            title: personName(u),
            sub: u.phone || u.contactNumber ? `📞 ${u.phone || u.contactNumber}` : '',
            raw: u,
        }));

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

        try {
            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
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
        <Card
            title={
                <span className="inline-flex items-center gap-2">
                    {isEditing ? <FaEdit className="text-amber-500" /> : <FaBullseye className="text-brand-600" />}
                    {isEditing ? 'Edit SR Target' : 'Add SR Target'}
                </span>
            }
            subtitle="Set a monthly sales target for an SR"
            right={
                isEditing ? (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                        <FaTimes size={11} /> Cancel Edit
                    </button>
                ) : null
            }
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ComboField
                    label="SR *"
                    value={srSearch}
                    placeholder="Search or select SR..."
                    options={srOptions}
                    onType={(v) => {
                        setSrSearch(v);
                        if (formData.srId) setFormData((prev) => ({ ...prev, srId: '', sr: '' }));
                    }}
                    onClear={() => {
                        setSrSearch('');
                        setFormData((prev) => ({ ...prev, srId: '', sr: '' }));
                    }}
                    onPick={(o) => {
                        setSrSearch(personName(o.raw));
                        setFormData((prev) => ({ ...prev, srId: o.raw._id, sr: personName(o.raw) }));
                    }}
                />

                <MonthField
                    label="Target Month & Year *"
                    value={formData.targetMonth}
                    onChange={(v) => setFormData((prev) => ({ ...prev, targetMonth: v }))}
                />

                <div>
                    <label className={labelCls}>Target Amount *</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={formData.targetAmount}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(v)) setFormData((prev) => ({ ...prev, targetAmount: v }));
                        }}
                        className={inputCls}
                    />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelCls}>Note</label>
                    <input
                        type="text"
                        placeholder="Write additional notes here..."
                        value={formData.note}
                        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                        className={inputCls}
                    />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className={`text-white text-sm font-semibold px-8 py-2.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600'}`}
                    >
                        {loading ? (isEditing ? 'Updating...' : 'Saving...') : isEditing ? 'Update Target' : 'Submit'}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default SalesSrTargetForm;