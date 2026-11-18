import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaStickyNote, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import SalesDuePaymentForm from './SalesDuePaymentForm';
import { calcCustomerBalance } from '../../Software/Contact/Customer/CustomerAccountAc';
import { fetchAccountBalance } from '../../Software/Account/AccountBalance';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
import { inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../Purchase/PurchaseUi';

const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = () => ({
    customer: '',
    customerId: '',
    customerContact: '',
    date: getTodayISO(),
    paymentMethod: '',
    accountKey: '',
    amount: '',
    note: '',
    type: 'Get',
    srId: '',
    sr: '',
    deliveredById: '',
    deliveredBy: '',
});

const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const generateInvoiceNo = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yy}${mm}${dd}${hh}${min}${ss}`;
};

const getInvoiceNo = (p) => {
    if (p.invoiceNo) return p.invoiceNo;
    const pad = (n) => String(n).padStart(2, '0');
    let d = null;
    const m = String(p.createdAt || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)/i);
    if (m) {
        let h = Number(m[4]) % 12;
        if (m[7].toLowerCase() === 'pm') h += 12;
        d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), h, Number(m[5]), Number(m[6]));
    } else if (p._id) {
        const t = parseInt(String(p._id).slice(0, 8), 16) * 1000;
        if (!isNaN(t)) d = new Date(t);
    }
    if (!d || isNaN(d)) return '';
    return `${pad(d.getFullYear() % 100)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const getAccountKey = (inv) => {
    if (inv.accountType === 'Bank') return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
    if (inv.accountType === 'Mobile Banking') return `${inv.accountName}-${inv.accountNumber}`;
    return 'cash';
};

const getAccountLabel = (method, acc = {}) => {
    if (method === 'Bank') return `${acc.bankName || ''} - ${acc.accountNumber || ''}`;
    if (method === 'Mobile Banking') return `${acc.accountName || ''} - ${acc.accountNumber || ''}`;
    return 'Cash';
};

// Get = customer theke nilam, Pay = customer ke dilam
const getDueType = (p) =>
    p?.type === 'Pay' || p?.status === 'Pay' || p?.paymentAccount?.dueType === 'Pay' ? 'Pay' : 'Get';

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SalesDuePayment = () => {
    const can = useCan('sales_due_payment');
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [sales, setSales] = useState([]);
    const [users, setUsers] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [formData, setFormData] = useState(emptyForm());
    const [formKey, setFormKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const submitLock = useRef(false);

    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '', status: '' });

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    const fetchPayments = async () => {
        try {
            const res = await fetch('http://localhost:5000/sales-due-payment');
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching due payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
        const load = (url, setter, label) =>
            fetch(url)
                .then((res) => res.json())
                .then((data) => setter(Array.isArray(data) ? data : []))
                .catch((error) => console.error(`Error fetching ${label}:`, error));

        load('http://localhost:5000/customer', setCustomers, 'customers');
        load('http://localhost:5000/sales', setSales, 'sales');
        load('http://localhost:5000/sales-bulk-return', setBulkReturns, 'bulk returns');
        load('http://localhost:5000/sales-damage', setDamageReturns, 'damage returns');
        load('http://localhost:5000/investment', setInvestments, 'investments');
        load('http://localhost:5000/user', setUsers, 'users');
    }, []);

    // ---------------- SR / Delivery Man list ----------------
    const roleOf = (u) => String(u.role || u.userRole || u.designation || '').toLowerCase();
    const srFiltered = users.filter((u) => roleOf(u).includes('sr'));
    const deliveryFiltered = users.filter((u) => roleOf(u).includes('deliver'));
    const srList = srFiltered.length > 0 ? srFiltered : users;
    const deliveryList = deliveryFiltered.length > 0 ? deliveryFiltered : users;

    // ---------------- Payment accounts ----------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === formData.paymentMethod)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) uniqueAccountsMap.set(key, inv);
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    // ---------------- Balance ----------------
    const balance = (() => {
        const b = calcCustomerBalance(
            { sales, bulkReturns, damageReturns, duePayments: payments, customers },
            formData.customer
        );
        return { pay: b.net > 0 ? b.net : 0, get: b.net < 0 ? -b.net : 0 };
    })();

    const canPay =
        !!formData.customer &&
        !!formData.date &&
        !!formData.paymentMethod &&
        !!formData.accountKey &&
        Number(formData.amount) > 0;

    // ---------------- Submit ----------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!can.canAdd) {
            showToast('আপনার Add করার অনুমতি নেই!', 'error');
            return;
        }
        if (submitLock.current || !canPay) return;

        const selectedAccountInfo = uniqueAccounts.find((inv) => getAccountKey(inv) === formData.accountKey);
        if (!selectedAccountInfo) {
            showToast('Please select an account!', 'error');
            return;
        }

        let paymentAccount = {};
        if (formData.paymentMethod === 'Bank') {
            paymentAccount = {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        } else if (formData.paymentMethod === 'Mobile Banking') {
            paymentAccount = {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        } else {
            paymentAccount = { accountName: 'Cash' };
        }

        const dueType = formData.type === 'Pay' ? 'Pay' : 'Get';

        submitLock.current = true;
        setIsSubmitting(true);
        const releaseLock = () => {
            setIsSubmitting(false);
            submitLock.current = false;
        };

        // Pay hole oi account e porjapto balance ache kina
        if (dueType === 'Pay') {
            const payAmt = Math.round((Number(formData.amount) || 0) * 100) / 100;
            let available = 0;
            try {
                available = Number(await fetchAccountBalance(paymentAccount)) || 0;
            } catch (err) {
                console.error('Balance check failed:', err);
                showToast('Account balance check korte problem hoyeche, abar try korun!', 'error');
                releaseLock();
                return;
            }
            available = Math.round(available * 100) / 100;
            if (available <= 0 || payAmt > available) {
                showToast(`Ei account e etoh balance nai! Available: ৳${money(Math.max(available, 0))}`, 'error');
                releaseLock();
                return;
            }
        }

        // Credit limit check (Pay dile)
        if (dueType === 'Pay') {
            const custInfo =
                customers.find((c) => String(c._id) === String(formData.customerId)) ||
                customers.find(
                    (c) =>
                        String(c.businessName || '').trim().toLowerCase() ===
                        String(formData.customer || '').trim().toLowerCase()
                );
            const limitRaw = custInfo?.creditLimit;
            const hasLimit =
                limitRaw !== undefined && limitRaw !== null && String(limitRaw).trim() !== '' && !isNaN(Number(limitRaw));
            if (hasLimit) {
                const limit = Number(limitRaw);
                const payAmt = Math.round((Number(formData.amount) || 0) * 100) / 100;
                const netAfter = Math.round((balance.pay - balance.get - payAmt) * 100) / 100;
                const getAfter = netAfter < 0 ? -netAfter : 0;
                if (getAfter > limit) {
                    showToast(
                        `Credit limit cross hoye jabe! Limit: ৳${limit}, Total Get hobe: ৳${getAfter}. Pay amount kom din.`,
                        'error'
                    );
                    releaseLock();
                    return;
                }
            }
        }

        const payload = {
            customer: formData.customer,
            customerId: formData.customerId,
            customerContact: formData.customerContact,
            srId: formData.srId || '',
            sr: formData.sr || '',
            deliveredById: formData.deliveredById || '',
            deliveredBy: formData.deliveredBy || '',
            date: formData.date,
            paymentMethod: formData.paymentMethod,
            paymentAccount: { ...paymentAccount, dueType },
            amount: Math.round((Number(formData.amount) || 0) * 100) / 100,
            note: formData.note.trim(),
            type: dueType,
            status: dueType,
            invoiceNo: generateInvoiceNo(),
        };

        try {
            const res = await fetch('http://localhost:5000/sales-due-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.insertedId) {
                showToast('Payment added successfully!', 'success');
                setFormData(emptyForm());
                setFormKey((prev) => prev + 1);
                setIsFormOpen(false);
                setCurrentPage(1);
                fetchPayments();
            } else {
                showToast(data?.message || 'Failed to add payment!', 'error');
            }
        } catch (error) {
            console.error('Error saving due payment:', error);
            showToast('Failed to add payment!', 'error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                submitLock.current = false;
            }, 1000);
        }
    };

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
                    const res = await fetch(`http://localhost:5000/sales-due-payment/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.deletedCount > 0) {
                        showToast('Payment deleted successfully!', 'success');
                        fetchPayments();
                    }
                } catch (error) {
                    console.error('Error deleting due payment:', error);
                }
            }
        });
    };

    const handleOpenModal = (noteText) => {
        setSelectedNote(noteText || 'No note available for this payment.');
        setIsModalOpen(true);
    };

    // ---------------- Filters ----------------
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '', status: '' });
        setCurrentPage(1);
    };

    const getPhoneByName = (name) =>
        customers.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const getPaymentPhone = (p) => p.customerContact || getPhoneByName(p.customer);

    const customerFilterOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const filteredPayments = payments.filter((p) => {
        if (filters.startDate && (!p.date || p.date < filters.startDate)) return false;
        if (filters.endDate && (!p.date || p.date > filters.endDate)) return false;
        if (filters.customer && !p.customer?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.customerContact) {
            const phone = getPaymentPhone(p);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.invoiceNo && !getInvoiceNo(p).toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.status && getDueType(p) !== filters.status) return false;
        return true;
    });

    const totalFilteredAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // ---------------- Pagination ----------------
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const activeCount = ['startDate', 'endDate', 'customer', 'invoiceNo', 'status'].filter((k) => filters[k]).length;

    const typePill = (p) => (getDueType(p) === 'Get' ? <Pill tone="green">Get</Pill> : <Pill tone="rose">Pay</Pill>);
    const menuItems = (p) => [{ label: 'Delete', tone: 'danger', onClick: () => handleDelete(p._id) }];

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sales Due Payment</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Receive customer dues and keep track of every payment.</p>
                    </div>
                    {isFormOpen ? (
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 w-full sm:w-auto cursor-pointer"
                        >
                            <FaMinus size={12} /> Close Form
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => (can.canAdd ? setIsFormOpen(true) : showToast('আপনার Add করার অনুমতি নেই!', 'error'))}
                            className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                        >
                            <FaPlus size={12} /> Add Due Payment
                        </button>
                    )}
                </div>

                {isFormOpen && (
                    <SalesDuePaymentForm
                        key={formKey}
                        formData={formData}
                        setFormData={setFormData}
                        handleSubmit={handleSubmit}
                        customers={customers}
                        accountTypes={accountTypes}
                        uniqueAccounts={uniqueAccounts}
                        getAccountKey={getAccountKey}
                        canPay={canPay}
                        dueAmount={formData.type === 'Pay' ? balance.pay : balance.get}
                        srList={srList}
                        deliveryList={deliveryList}
                        isSubmitting={isSubmitting}
                    />
                )}

                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-5">
                    <div>
                        <span className={labelCls}>Start Date</span>
                        <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                    </div>
                    <div>
                        <span className={labelCls}>End Date</span>
                        <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                    </div>
                    <div>
                        <label className={labelCls}>Invoice Number</label>
                        <input type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="Get">Get</option>
                            <option value="Pay">Pay</option>
                        </select>
                    </div>
                    <ComboField
                        label="Customer"
                        value={filters.customer}
                        placeholder="Search customer..."
                        options={customerFilterOptions}
                        onType={(v) => {
                            setFilters({ ...filters, customer: v, customerContact: '' });
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters({ ...filters, customer: '', customerContact: '' });
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ ...filters, customer: o.raw.businessName, customerContact: o.raw.contactNumber || '' });
                            setCurrentPage(1);
                        }}
                    />
                </FilterPanel>

                {/* History */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-slate-800">Due Payment History</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <Pill tone="brand">Total: ৳ {money(totalFilteredAmount)}</Pill>
                            <Pill tone="slate">{filteredPayments.length} of {payments.length}</Pill>
                        </div>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : filteredPayments.length === 0 ? (
                        <Empty text="No matching payments found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentPayments.map((p) => {
                                    const isGetRow = getDueType(p) === 'Get';
                                    const phone = getPaymentPhone(p);
                                    return (
                                        <div key={p._id} className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm">
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isGetRow ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                                            <div className="flex items-stretch gap-2">
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <p className="font-bold text-[13px] text-brand-700 truncate leading-tight min-w-0">{p.customer}</p>
                                                        {phone && (
                                                            <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                                📞 {phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="shrink-0 px-1.5 py-px rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold leading-tight">
                                                            #{getInvoiceNo(p) || 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 leading-tight truncate min-w-0">{displayFormattedDate(p.date)}</span>
                                                    </div>
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 font-bold">{p.paymentMethod || 'Method'}: </span>
                                                        {getAccountLabel(p.paymentMethod, p.paymentAccount)}
                                                    </p>
                                                    {(p.sr || p.deliveredBy) && (
                                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                            <span className="uppercase text-slate-400 font-bold">{p.sr ? 'SR' : 'Delivery'}: </span>
                                                            {p.sr || p.deliveredBy}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="shrink-0 w-[104px] flex flex-col items-end justify-between gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            aria-label="Note"
                                                            onClick={() => handleOpenModal(p.note)}
                                                            className="inline-flex items-center gap-1 h-6 px-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold cursor-pointer"
                                                        >
                                                            <FaStickyNote size={9} /> Note
                                                        </button>
                                                        <RowMenu compact items={menuItems(p)} />
                                                    </div>
                                                    <div className={`w-full rounded-lg px-2 py-1.5 text-right ${isGetRow ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className={`px-1.5 py-px rounded-full text-[9px] font-bold leading-tight ${isGetRow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                {isGetRow ? 'Get' : 'Pay'}
                                                            </span>
                                                            <span className="text-[9px] uppercase font-bold leading-none text-slate-400">Amount</span>
                                                        </div>
                                                        <p className={`text-[12.5px] font-extrabold leading-tight mt-1 whitespace-nowrap ${isGetRow ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            ৳ {money(p.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1150px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">SR</th>
                                            <th className="px-3 py-3">Delivery Man</th>
                                            <th className="px-3 py-3">Method</th>
                                            <th className="px-3 py-3">Account</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-center">Note</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentPayments.map((p) => (
                                            <tr key={p._id} className="align-middle hover:bg-slate-50">
                                                <td className="px-3 py-3 font-bold text-slate-800">
                                                    {p.customer}
                                                    {getPaymentPhone(p) && <div className="text-xs font-normal text-slate-400">📞 {getPaymentPhone(p)}</div>}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">{displayFormattedDate(p.date)}</td>
                                                <td className="px-3 py-3 whitespace-nowrap font-medium">{getInvoiceNo(p) || 'N/A'}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">{p.sr || 'N/A'}</td>
                                                <td className="px-3 py-3 whitespace-nowrap">{p.deliveredBy || 'N/A'}</td>
                                                <td className="px-3 py-3"><Pill tone="slate">{p.paymentMethod}</Pill></td>
                                                <td className="px-3 py-3">{getAccountLabel(p.paymentMethod, p.paymentAccount)}</td>
                                                <td className="px-3 py-3 whitespace-nowrap font-semibold text-emerald-600">৳ {money(p.amount)}</td>
                                                <td className="px-3 py-3">{typePill(p)}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <button type="button" onClick={() => handleOpenModal(p.note)} className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer">
                                                        <FaStickyNote size={11} /> View
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 text-center"><RowMenu items={menuItems(p)} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pager
                                page={currentPage}
                                totalPages={totalPages}
                                onChange={handlePageChange}
                                from={indexOfFirstItem + 1}
                                to={Math.min(indexOfLastItem, filteredPayments.length)}
                                total={filteredPayments.length}
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
                                <FaStickyNote className="text-brand-600" /> Payment Note
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

export default SalesDuePayment;