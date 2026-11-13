import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaTrash, FaStickyNote, FaTimes, FaEye, FaClock, FaFilter, FaRedo, FaChevronLeft, FaChevronRight, FaPlus, FaMinus } from 'react-icons/fa';
import SalesDuePaymentForm from './SalesDuePaymentForm';
import { calcCustomerBalance } from '../../Software/Contact/Customer/CustomerAccountAc'; // path ta nijer folder onujayi thik koro
import { fetchAccountBalance } from '../../Software/Account/AccountBalance';
import useCan from '../../../../hooks/useCan';
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

const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

const SalesDuePayment = () => {
    const [payments, setPayments] = useState([]);
    const can = useCan('sales_due_payment');
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
    const submitLock = useRef(false);

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '', status: '' });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Customer searchable-select state (filter)
    const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
    const customerFilterRef = useRef(null);

    useEffect(() => {
        const handleClickOutsideCustomerFilter = (event) => {
            if (customerFilterRef.current && !customerFilterRef.current.contains(event.target)) {
                setIsCustomerFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCustomerFilter);
        return () => document.removeEventListener('mousedown', handleClickOutsideCustomerFilter);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    };

    // ---------------- Fetch ----------------
    const fetchPayments = async () => {
        try {
            const res = await fetch('http://localhost:5000/sales-due-payment');
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching due payments:', error);
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (openDropdownId === null) return;
        const handleScroll = () => setOpenDropdownId(null);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [openDropdownId]);

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

    // ---------------- Balance (CustomerAccountAc er final Pay / Get) ----------------
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

        // lock age set, jate slow balance check cholar somoy bar bar click e duplicate row na hoy
        submitLock.current = true;
        setIsSubmitting(true);
        const releaseLock = () => {
            setIsSubmitting(false);
            submitLock.current = false;
        };

        // Pay hole (customer ke dile) oi account e porjapto balance ache kina check
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
                showToast(
                    `Ei account e etoh balance nai! Available: ৳${Math.max(available, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'error'
                );
                releaseLock();
                return;
            }
        }

        // Credit Limit check: customer ke Pay dile customer er Get amount creditLimit er beshi hoye jabe kina
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
            createdAt: formatDateTime(new Date()),
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
            setTimeout(() => { submitLock.current = false; }, 1000);
        }
    };

    // ---------------- Delete ----------------
    const handleDelete = (id) => {
        if (!can.canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
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

    const filteredCustomerOptions = customers.filter((c) => {
        const s = filters.customer.toLowerCase();
        return (
            c.businessName?.toLowerCase().includes(s) ||
            c.contactNumber?.toLowerCase().includes(s)
        );
    });

    const getPhoneByName = (name) =>
        customers.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const getPaymentPhone = (p) => p.customerContact || getPhoneByName(p.customer);

    const handleSelectCustomerFilter = (c) => {
        setFilters({ ...filters, customer: c.businessName, customerContact: c.contactNumber || '' });
        setCurrentPage(1);
        setIsCustomerFilterOpen(false);
    };

    const handleClearCustomerFilter = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, customer: '', customerContact: '' });
        setCurrentPage(1);
        setIsCustomerFilterOpen(false);
    };

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

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8 relative">

            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Sales Due Payment
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Receive customer dues and keep track of every payment.</p>
                    </div>

                    <button
                        onClick={() => {
                            if (!isFormOpen && !can.canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer ${isFormOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus /> Close Form</> : <><FaPlus /> Add Due Payment</>}
                    </button>
                </div>

                {/* Collapsible Form */}
                <div
                    className={`transition-all duration-500 ease-in-out ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-8 overflow-visible' : 'max-h-0 opacity-0 mb-0 overflow-hidden'
                        }`}
                >
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
                </div>

                {/* Filter Panel */}
                <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FaFilter className="text-indigo-600" /> Filter & Search Panel
                        </h3>
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                            >
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select start date"
                                    value={displayFormattedDate(filters.startDate)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                            >
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select end date"
                                    value={displayFormattedDate(filters.endDate)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                            <input
                                type="text"
                                name="invoiceNo"
                                placeholder="Search invoice..."
                                value={filters.invoiceNo}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="Get">Get</option>
                                <option value="Pay">Pay</option>
                            </select>
                        </div>

                        <div className="relative" ref={customerFilterRef}>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                            <div
                                onClick={() => setIsCustomerFilterOpen(true)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                            >
                                <input
                                    type="text"
                                    placeholder="Search or select customer..."
                                    value={filters.customer}
                                    onChange={(e) => {
                                        setFilters({ ...filters, customer: e.target.value, customerContact: '' });
                                        setCurrentPage(1);
                                        setIsCustomerFilterOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                                />
                                {filters.customer && (
                                    <button type="button" onClick={handleClearCustomerFilter} className="text-gray-400 hover:text-red-500 pl-1">
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>

                            {isCustomerFilterOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                    {filteredCustomerOptions.length > 0 ? (
                                        filteredCustomerOptions.map((c) => (
                                            <div
                                                key={c._id}
                                                onClick={() => handleSelectCustomerFilter(c)}
                                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                            >
                                                <p className="text-xs font-semibold text-gray-800">{c.businessName}</p>
                                                {c.contactNumber && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5">📞 {c.contactNumber}</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-wrap gap-2 justify-between items-center">
                        <h2 className="text-xl font-bold">Due Payment History</h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Total: ৳ {totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Showing: {filteredPayments.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredPayments.length)}` : 0} of {filteredPayments.length} ({payments.length} total)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={TH}>Customer</th>
                                    <th className={TH}>Date</th>
                                    <th className={TH}>Invoice</th>
                                    <th className={TH}>SR</th>
                                    <th className={TH}>Delivery Man</th>
                                    <th className={TH}>Payment Method</th>
                                    <th className={TH}>Payment Account</th>
                                    <th className={TH}>Amount</th>
                                    <th className={TH}>Status</th>
                                    <th className={`${TH} text-center`}>Note</th>
                                    <th className={TH}>Created At</th>
                                    <th className={`${TH} text-center`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentPayments.length > 0 ? (
                                    currentPayments.map((p) => (
                                        <tr key={p._id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {p.customer}
                                                {getPaymentPhone(p) && (
                                                    <div className="text-xs font-normal text-gray-400">📞 {getPaymentPhone(p)}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {displayFormattedDate(p.date)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                {getInvoiceNo(p) || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {p.sr || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {p.deliveredBy || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                    {p.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {getAccountLabel(p.paymentMethod, p.paymentAccount)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                ৳ {Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDueType(p) === 'Get' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {getDueType(p)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => handleOpenModal(p.note)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all text-xs font-semibold shadow-sm cursor-pointer"
                                                >
                                                    <FaEye size={12} /> View Note
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {p.createdAt ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FaClock className="text-indigo-400" size={11} /> {formatCreatedDate(p.createdAt)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({ top: rect.top - 8, left: rect.right });
                                                            setOpenDropdownId(openDropdownId === p._id ? null : p._id);
                                                        }}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === p._id ? 'rotate-180' : ''}`}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                        </svg>
                                                    </button>

                                                    {openDropdownId === p._id && (
                                                        <div
                                                            style={{ top: dropdownPos.top, left: dropdownPos.left, transform: 'translate(-100%, -100%)' }}
                                                            className="fixed w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left"
                                                        >
                                                            <button
                                                                onClick={() => handleDelete(p._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FaTrash size={12} className="text-rose-500" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="12" className="text-center py-10 text-gray-400 text-sm">
                                            No matching payments found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredPayments.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Note Modal */}
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                    <div
                        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaStickyNote className="text-indigo-600" /> Payment Note
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm min-h-[80px] whitespace-pre-wrap">
                            {selectedNote}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDuePayment;