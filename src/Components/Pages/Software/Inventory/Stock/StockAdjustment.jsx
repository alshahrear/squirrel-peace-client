import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import useCan from '../../../../../hooks/useCan';
import { DateInput } from '../../Product/ProductUi';
import { fmt, labelCls, inputCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../../Purchase/PurchaseUi';

const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const sumRow = (row) => {
    let inn = 0;
    let out = 0;
    (row.items || []).forEach((it) => {
        const m = Number(it.totalQty) || 0;
        const f = Number(it.freeQty) || 0;
        if (it.mainType === 'out') out += m; else inn += m;
        if (it.freeType === 'out') out += f; else inn += f;
    });
    return { inn, out };
};

const StockAdjustment = () => {
    const { canAdd, canEdit, canDelete } = useCan('stock_adjustment');
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
    const [companies, setCompanies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const fetched = useRef(false);

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;
        fetch('http://localhost:5000/stock-adjustment')
            .then((res) => res.json())
            .then((data) => setRows(Array.isArray(data) ? [...data].reverse() : []))
            .catch((err) => {
                console.error(err);
                showToast('Failed to load adjustments!', 'error');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((data) => setCompanies(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Error fetching companies:', err));
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    const companyOptions = companies
        .filter((c) => {
            const s = filters.company.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const getPhoneByName = (name) =>
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const getRowPhone = (r) => r.companyContact || getPhoneByName(r.company);

    const handleDelete = async (id) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete it!',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`http://localhost:5000/stock-adjustment/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Adjustment deleted successfully!');
                setRows((prev) => prev.filter((r) => r._id !== id));
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Failed to delete!', 'error');
            }
        } catch (e) {
            showToast('Server error while deleting!', 'error');
        }
    };

    const handleEdit = (r) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        navigate(`/stock-adjustment-form?edit=${r._id}`, { state: { adjustment: r } });
    };

    const menuItems = (r) => [
        { label: 'View', onClick: () => navigate(`/stock-adjustment-view/${r._id}`) },
        { label: 'Edit', tone: 'brand', onClick: () => handleEdit(r) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDelete(r._id) },
    ];

    const filtered = rows.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.adjustmentDate);
            if (!d) return false;
            const s = parseToLocalDate(filters.startDate);
            const e = parseToLocalDate(filters.endDate);
            if (s && d < s) return false;
            if (e && d > e) return false;
        }
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.companyContact) {
            const phone = getRowPhone(r);
            if (phone && phone !== filters.companyContact) return false;
        }
        if (filters.invoiceNo && !r.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const first = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(first, first + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const grand = filtered.reduce(
        (s, r) => {
            const t = sumRow(r);
            return { inn: s.inn + t.inn, out: s.out + t.out };
        },
        { inn: 0, out: 0 }
    );

    const activeCount = ['startDate', 'endDate', 'company', 'invoiceNo'].filter((k) => filters[k]).length;

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Stock Adjustment</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Track stock In / Out adjustments</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (canAdd ? navigate('/stock-adjustment-form') : showToast('আপনার Add করার অনুমতি নেই!', 'error'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                        <FaPlus size={12} /> New Adjustment
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="text-[10px] font-bold uppercase text-emerald-500">Total In (+)</div>
                        <div className="text-base sm:text-lg font-extrabold text-emerald-700">{fmt(grand.inn)} pcs</div>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 sm:px-4 py-2.5 sm:py-3">
                        <div className="text-[10px] font-bold uppercase text-rose-400">Total Out (−)</div>
                        <div className="text-base sm:text-lg font-extrabold text-rose-700">{fmt(grand.out)} pcs</div>
                    </div>
                </div>

                {/* Filter */}
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
                        label="Company"
                        value={filters.company}
                        placeholder="Search company..."
                        options={companyOptions}
                        onType={(v) => {
                            setFilters({ ...filters, company: v, companyContact: '' });
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters({ ...filters, company: '', companyContact: '' });
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ ...filters, company: o.raw.businessName, companyContact: o.raw.contactNumber || '' });
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <label className={labelCls}>Invoice Number</label>
                        <input type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className={inputCls} />
                    </div>
                </FilterPanel>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 px-1.5 pt-1 sm:p-0">
                        <h3 className="text-base font-bold text-slate-800">Adjustment Directory</h3>
                        <Pill tone="brand">{filtered.length} of {rows.length}</Pill>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : filtered.length === 0 ? (
                        <Empty text="No adjustments found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {current.map((r) => {
                                    const t = sumRow(r);
                                    return (
                                        <div key={r._id} className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm">
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-brand-500" />
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <p className="font-bold text-[13px] text-brand-700 truncate leading-tight min-w-0">{r.company}</p>
                                                        <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">#{r.invoiceNo}</span>
                                                    </div>
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Date: </span>
                                                        {r.adjustmentDate || 'N/A'}
                                                    </p>
                                                    {getRowPhone(r) && <p className="text-[10.5px] text-slate-400 leading-snug truncate">📞 {getRowPhone(r)}</p>}
                                                </div>

                                                {/* Right: menu, In, Out */}
                                                <div className="shrink-0 w-[116px] flex flex-col items-end justify-between gap-1.5">
                                                    <RowMenu compact items={menuItems(r)} />
                                                    <div className="w-full space-y-px">
                                                        <div className="flex items-center justify-between rounded-md bg-emerald-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-emerald-500">IN</span>
                                                            <span className="text-[11px] font-bold text-emerald-700">{t.inn > 0 ? `+${fmt(t.inn)}` : '—'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-rose-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-rose-400">OUT</span>
                                                            <span className="text-[11px] font-bold text-rose-700">{t.out > 0 ? `−${fmt(t.out)}` : '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Invoice No</th>
                                            <th className="px-3 py-3">In (+)</th>
                                            <th className="px-3 py-3">Out (−)</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {current.map((r) => {
                                            const t = sumRow(r);
                                            return (
                                                <tr key={r._id} className="align-middle hover:bg-slate-50">
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-600">{r.adjustmentDate || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{r.company}</div>
                                                        {getRowPhone(r) && <div className="text-[11px] text-slate-400 mt-0.5">📞 {getRowPhone(r)}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">#{r.invoiceNo}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-bold text-emerald-600">
                                                        {t.inn > 0 ? `+${fmt(t.inn)} pcs` : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-bold text-rose-600">
                                                        {t.out > 0 ? `−${fmt(t.out)} pcs` : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <RowMenu items={menuItems(r)} />
                                                    </td>
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
                                from={first + 1}
                                to={Math.min(first + itemsPerPage, filtered.length)}
                                total={filtered.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockAdjustment;