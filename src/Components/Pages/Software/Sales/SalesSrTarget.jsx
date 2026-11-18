import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaStickyNote, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import SalesSrTargetForm, { MonthField, displayMonthYear } from './SalesSrTargetForm';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
import { labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../Purchase/PurchaseUi';

// "23/10/2026, 8:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MONTH_MAP = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// order date (05 Nov 2026 / 05/11/2026 / 2026-11-05) -> "YYYY-MM"
const getOrderMonthKey = (dateStr) => {
    if (!dateStr) return '';
    const part = String(dateStr).split(',')[0].trim();
    let y, m;
    if (part.includes('/')) {
        const [, mm, yy] = part.split('/');
        m = Number(mm);
        y = Number(yy);
    } else if (/^\d{4}-\d{2}/.test(part)) {
        const [yy, mm] = part.split('-');
        y = Number(yy);
        m = Number(mm);
    } else {
        const bits = part.split(/\s+/);
        if (bits.length < 3) return '';
        m = MONTH_MAP[bits[1].slice(0, 3).toLowerCase()];
        y = Number(bits[2]);
    }
    if (!y || !m) return '';
    return `${y}-${String(m).padStart(2, '0')}`;
};

// Order er Grand amount: product discount, overall discount, adjustment dhore
const getOrderGrandAmount = (o) => {
    const sub = Number(o.subTotal) || 0;
    const pwd = Number(o.productWiseDiscount) || 0;
    const after = sub - pwd;
    let overall;
    if (o.overallDiscountValue !== undefined && o.overallDiscountValue !== null) {
        overall = Number(o.overallDiscountValue) || 0;
    } else if (o.overallDiscountType === 'percent') {
        overall = (after * (Number(o.overallDiscount) || 0)) / 100;
    } else {
        overall = Number(o.overallDiscount) || 0;
    }
    const adjAmt = Number(o.adjustment?.amount) || 0;
    const adj = o.adjustment?.type === '-' ? -adjAmt : adjAmt;
    return Math.round((after - overall + adj) * 100) / 100;
};

const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "23/10/2026, 8:03:51 pm" -> Date
const parseCreatedDate = (value) => {
    if (!value) return null;
    const datePart = String(value).split(/[ ,]/)[0];
    const [d, m, y] = datePart.split('/');
    if (!d || !m || !y) return null;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dateObj) ? null : dateObj;
};

// "YYYY-MM-DD" -> Date
const parseYmd = (value) => {
    if (!value) return null;
    const [y, m, d] = value.split('-');
    if (!y || !m || !d) return null;
    return new Date(Number(y), Number(m) - 1, Number(d));
};

const Progress = ({ percent, done }) => (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
            className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
    </div>
);

const SalesSrTarget = () => {
    const can = useCan('sales_sr_target');
    const [targets, setTargets] = useState([]);
    const [sales, setSales] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingTarget, setEditingTarget] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    const [filters, setFilters] = useState({ startDate: '', endDate: '', sr: '', targetMonth: '' });

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', sr: '', targetMonth: '' });
        setCurrentPage(1);
    };

    // ---------------- Fetch ----------------
    const fetchTargets = async () => {
        try {
            const res = await fetch('http://localhost:5000/sales-sr-target');
            const data = await res.json();
            setTargets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching SR targets:', error);
            showToast('Failed to load targets!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
        fetch('http://localhost:5000/sales')
            .then((res) => res.json())
            .then((data) => setSales(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales:', error));
        fetch('http://localhost:5000/user')
            .then((res) => res.json())
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching users:', error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------- SR list ----------------
    const roleOf = (u) => String(u.role || u.userRole || u.designation || '').toLowerCase();
    const srFiltered = users.filter((u) => roleOf(u).includes('sr'));
    const srList = srFiltered.length > 0 ? srFiltered : users;

    // ---------------- Delete ----------------
    const handleDelete = (id) => {
        if (!can.canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:5000/sales-sr-target/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('Target deleted successfully!', 'success');
                        setTargets((prev) => prev.filter((t) => t._id !== id));
                    } else {
                        showToast('Failed to delete target!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting target:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // ---------------- Edit ----------------
    const handleEdit = (target) => {
        if (!can.canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        setEditingTarget(target);
        setIsFormOpen(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleOpenModal = (noteText) => {
        setSelectedNote(noteText || 'No note available for this target.');
        setIsModalOpen(true);
    };

    const menuItems = (t) => [
        { label: 'Edit', tone: 'brand', onClick: () => handleEdit(t) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDelete(t._id) },
    ];

    // ---------------- Filter / Pagination ----------------
    const srOptions = srList
        .filter((u) =>
            String(u.name || u.userName || u.fullName || '').toLowerCase().includes(filters.sr.toLowerCase())
        )
        .map((u) => ({ key: u._id, title: u.name || u.userName || u.fullName || '', raw: u }));

    const filteredTargets = targets.filter((t) => {
        if (filters.startDate || filters.endDate) {
            const created = parseCreatedDate(t.createdAt);
            if (!created) return false;
            const start = parseYmd(filters.startDate);
            const end = parseYmd(filters.endDate);
            if (start && created < start) return false;
            if (end && created > end) return false;
        }
        if (filters.sr && !String(t.sr || '').toLowerCase().includes(filters.sr.toLowerCase())) return false;
        if (filters.targetMonth && t.targetMonth !== filters.targetMonth) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredTargets.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTargets = filteredTargets.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const activeCount = ['startDate', 'endDate', 'sr', 'targetMonth'].filter((k) => filters[k]).length;

    // ---------------- Sale stats per target (SR + Month) ----------------
    const statsById = {};
    currentTargets.forEach((t) => {
        let grand = 0;
        sales.forEach((o) => {
            if (String(o.srId) !== String(t.srId)) return;
            if (o.status !== 'Delivered') return;
            if (getOrderMonthKey(o.orderDate) !== t.targetMonth) return;
            grand += getOrderGrandAmount(o);
        });
        grand = Math.round(grand * 100) / 100;
        const target = Number(t.targetAmount) || 0;
        const diff = Math.round((target - grand) * 100) / 100;
        statsById[t._id] = {
            grand,
            remaining: diff > 0 ? diff : 0,
            extra: diff < 0 ? Math.abs(diff) : 0,
            percent: target > 0 ? (grand / target) * 100 : 0,
        };
    });

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sales SR Target</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Set monthly sales targets for every SR and keep track of them.</p>
                    </div>
                    {isFormOpen ? (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingTarget(null);
                                setIsFormOpen(false);
                            }}
                            className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 w-full sm:w-auto cursor-pointer"
                        >
                            <FaMinus size={12} /> Close Form
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                if (!can.canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
                                setEditingTarget(null);
                                setIsFormOpen(true);
                            }}
                            className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                        >
                            <FaPlus size={12} /> Add SR Target
                        </button>
                    )}
                </div>

                {/* Form */}
                {isFormOpen && !loading && (
                    <div ref={formSectionRef} className="scroll-mt-4 relative z-20">
                        <SalesSrTargetForm
                            key={editingTarget?._id || 'new'}
                            targets={targets}
                            srList={srList}
                            fetchTargets={fetchTargets}
                            setShowForm={setIsFormOpen}
                            editingTarget={editingTarget}
                            setEditingTarget={setEditingTarget}
                            showToast={showToast}
                            scrollToTable={() => {
                                setCurrentPage(1);
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Filters */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-4">
                    <div>
                        <span className={labelCls}>Start Date</span>
                        <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                    </div>
                    <div>
                        <span className={labelCls}>End Date</span>
                        <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                    </div>
                    <ComboField
                        label="SR"
                        value={filters.sr}
                        placeholder="Search or select SR..."
                        options={srOptions}
                        onType={(v) => {
                            setFilters((prev) => ({ ...prev, sr: v }));
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters((prev) => ({ ...prev, sr: '' }));
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters((prev) => ({ ...prev, sr: o.title }));
                            setCurrentPage(1);
                        }}
                    />
                    <MonthField
                        label="Targeted Month"
                        placeholder="Select month"
                        value={filters.targetMonth}
                        clearable
                        onChange={(v) => {
                            setFilters((prev) => ({ ...prev, targetMonth: v }));
                            setCurrentPage(1);
                        }}
                    />
                </FilterPanel>

                {/* History */}
                <div
                    ref={tableSectionRef}
                    className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3 scroll-mt-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-slate-800">SR Target History</h2>
                        <Pill tone="slate">{filteredTargets.length} of {targets.length}</Pill>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : filteredTargets.length === 0 ? (
                        <Empty text="No targets found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-2">
                                {currentTargets.map((t) => {
                                    const st = statsById[t._id] || {};
                                    const reached = st.extra > 0 || (Number(t.targetAmount) > 0 && st.remaining === 0);
                                    return (
                                        <div key={t._id} className="relative rounded-xl border border-slate-200 bg-white pl-3.5 pr-2.5 py-2.5 shadow-sm">
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${reached ? 'bg-emerald-500' : 'bg-brand-500'}`} />

                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[14px] text-brand-700 truncate leading-tight">{t.sr || 'N/A'}</p>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="px-1.5 py-px rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold leading-tight">
                                                            {displayMonthYear(t.targetMonth)}
                                                        </span>
                                                        {t.createdAt && (
                                                            <span className="text-[10px] text-slate-400 leading-tight">
                                                                Added {formatCreatedDate(t.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        aria-label="Note"
                                                        onClick={() => handleOpenModal(t.note)}
                                                        className="inline-flex items-center gap-1 h-6 px-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold cursor-pointer"
                                                    >
                                                        <FaStickyNote size={9} /> Note
                                                    </button>
                                                    <RowMenu compact items={menuItems(t)} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                                                <div className="rounded-lg bg-slate-50 px-2 py-1.5 min-w-0">
                                                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Target</p>
                                                    <p className="text-[11.5px] font-extrabold text-slate-800 mt-1 truncate">৳ {fmtMoney(t.targetAmount)}</p>
                                                </div>
                                                <div className="rounded-lg bg-brand-50 px-2 py-1.5 min-w-0">
                                                    <p className="text-[9px] uppercase font-bold text-brand-600 leading-none">Sale</p>
                                                    <p className="text-[11.5px] font-extrabold text-brand-700 mt-1 truncate">৳ {fmtMoney(st.grand)}</p>
                                                </div>
                                                <div className={`rounded-lg px-2 py-1.5 min-w-0 ${st.extra > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                    <p className={`text-[9px] uppercase font-bold leading-none ${st.extra > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {st.extra > 0 ? 'Extra' : 'Remaining'}
                                                    </p>
                                                    <p className={`text-[11.5px] font-extrabold mt-1 truncate ${st.extra > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                        ৳ {fmtMoney(st.extra > 0 ? st.extra : st.remaining)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1"><Progress percent={st.percent} done={reached} /></div>
                                                <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{Math.round(st.percent || 0)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">SR</th>
                                            <th className="px-3 py-3">Targeted Month</th>
                                            <th className="px-3 py-3">Targeted Amount</th>
                                            <th className="px-3 py-3 min-w-[170px]">Grand Sale Amount</th>
                                            <th className="px-3 py-3">Remaining</th>
                                            <th className="px-3 py-3 text-center">Note</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentTargets.map((t) => {
                                            const st = statsById[t._id] || {};
                                            const reached = st.extra > 0 || (Number(t.targetAmount) > 0 && st.remaining === 0);
                                            return (
                                                <tr key={t._id} className="align-middle hover:bg-slate-50">
                                                    <td className="px-3 py-3 whitespace-nowrap text-slate-500">
                                                        {t.createdAt ? formatCreatedDate(t.createdAt) : <span className="text-slate-300">N/A</span>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-bold text-slate-800">{t.sr || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <Pill tone="slate">{displayMonthYear(t.targetMonth)}</Pill>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-800">৳ {fmtMoney(t.targetAmount)}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <span className="font-semibold text-brand-700 whitespace-nowrap">৳ {fmtMoney(st.grand)}</span>
                                                            <span className="text-[11px] font-bold text-slate-400">{Math.round(st.percent || 0)}%</span>
                                                        </div>
                                                        <Progress percent={st.percent} done={reached} />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-semibold">
                                                        {st.extra > 0 ? (
                                                            <span className="text-emerald-600">
                                                                ৳ {fmtMoney(st.extra)} <span className="text-xs font-bold">(Extra)</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-600">৳ {fmtMoney(st.remaining)}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenModal(t.note)}
                                                            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                                        >
                                                            <FaStickyNote size={11} /> View
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-3 text-center"><RowMenu items={menuItems(t)} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pager
                                page={currentPage}
                                totalPages={totalPages}
                                onChange={handlePageChange}
                                from={indexOfFirstItem + 1}
                                to={Math.min(indexOfLastItem, filteredTargets.length)}
                                total={filteredTargets.length}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Note Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FaStickyNote className="text-brand-600" /> Target Note
                            </h3>
                            <button type="button" aria-label="Close" onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm min-h-[80px] whitespace-pre-wrap break-words">
                            {selectedNote}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-brand-600 text-white text-sm font-semibold px-5 py-2 cursor-pointer">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesSrTarget;