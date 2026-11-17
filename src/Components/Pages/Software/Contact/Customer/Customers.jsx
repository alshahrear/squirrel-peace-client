import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaEye, FaPlus, FaMinus, FaFilter, FaRedo, FaStore } from 'react-icons/fa';
import CustomerForm from './CustomersFrom';
import { useNavigate } from 'react-router-dom';
import useDraftState from '../../../../../hooks/useDraftState';
import useCan from '../../../../../hooks/useCan';
import { inputCls, labelCls, PopStyle, Skeleton, Pager, ComboBox, RowMenu, DateInput } from '../../Product/ProductUi';


const EMPTY_FILTERS = {
    startDate: '',
    endDate: '',
    businessName: '',
    email: '',
    contactNumber: '',
    contactName: '',
    businessNumber: '',
    address: '',
    route: '',
};

const NA = () => <span className="text-slate-400 italic">N/A</span>;

const BalanceCell = ({ item }) => (
    <span className="font-semibold text-emerald-600 whitespace-nowrap">
        ৳ {item.openingBalance ? Number(item.openingBalance).toLocaleString() : '0'}
        {item.openingBalanceType && (
            <span
                className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.openingBalanceType === 'Get' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
            >
                {item.openingBalanceType}
            </span>
        )}
    </span>
);

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const { canAdd, canEdit, canDelete } = useCan('customers');
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState([]);
    const [editingId, setEditingId] = useDraftState('customerEditingId', null);
    const editingCustomer = customers.find((c) => c._id === editingId) || null;
    const setEditingCustomer = (c) => setEditingId(c ? c._id : null);

    const [isFormOpen, setIsFormOpen] = useDraftState('customerFormOpen', false);
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    const showToast = (message, type = 'success') =>
        type === 'error' ? toast.error(message) : toast.success(message);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:5000/customer');
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Failed to load customers!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const res = await fetch('http://localhost:5000/route');
            const data = await res.json();
            setRoutes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchRoutes();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const handleDelete = (id) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/customer/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('Customer deleted successfully!', 'success');
                        setCustomers((prev) => prev.filter((customer) => customer._id !== id));
                    } else {
                        showToast('Failed to delete customer!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting customer:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const handleEdit = (customer) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        setEditingCustomer(customer);
        setIsFormOpen(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const filteredCustomers = [...customers].reverse().filter((customer) => {
        if (filters.startDate || filters.endDate) {
            if (!customer.createdAt) return false;
            const datePart = customer.createdAt.split(',')[0].trim();
            const [cDay, cMonth, cYear] = datePart.split('/');
            const customerDate = new Date(`${cYear}-${cMonth}-${cDay}`);
            if (filters.startDate) {
                const s = new Date(filters.startDate);
                if (!isNaN(s) && customerDate < s) return false;
            }
            if (filters.endDate) {
                const e = new Date(filters.endDate);
                if (!isNaN(e) && customerDate > e) return false;
            }
        }
        const has = (field, val) => !val || customer[field]?.toLowerCase().includes(val.toLowerCase());
        if (!(
            has('businessName', filters.businessName) &&
            has('email', filters.email) &&
            has('contactNumber', filters.contactNumber) &&
            has('contactName', filters.contactName) &&
            has('businessNumber', filters.businessNumber) &&
            has('address', filters.address)
        )) return false;
        if (filters.route && customer.route !== filters.route) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const businessOptions = customers
        .filter((c) => {
            const s = filters.businessName.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: c.businessName, sub: `📞 ${c.contactNumber || ''}`, value: c }));

    const routeOptions = routes
        .filter((r) => r.isActive !== false)
        .map((r) => r.routeName || r.name || r)
        .filter((n) => String(n).toLowerCase().includes(filters.route.toLowerCase()))
        .map((n, i) => ({ key: `${n}-${i}`, title: n, value: n }));

    const menuItems = (c) => [
        { label: 'View Details', icon: <FaEye size={12} />, tone: 'emerald', onClick: () => navigate(`/customer-details/${c._id}`) },
        { label: 'Edit', icon: <FaEdit size={12} />, onClick: () => handleEdit(c) },
        { label: 'Delete', icon: <FaTrash size={12} />, tone: 'rose', onClick: () => handleDelete(c._id) },
    ];

    const textField = (name, label, placeholder) => (
        <div>
            <label htmlFor={`cuf-${name}`} className={labelCls}>{label}</label>
            <input
                id={`cuf-${name}`}
                type="text"
                name={name}
                placeholder={placeholder}
                value={filters[name]}
                onChange={handleFilterChange}
                className={inputCls}
            />
        </div>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <PopStyle />
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Customer Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Manage your customer contacts, balances, and details efficiently.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isFormOpen && !canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
                            setEditingCustomer(null);
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-5 rounded-full text-white text-sm font-semibold cursor-pointer ${isFormOpen ? 'bg-slate-600 hover:bg-slate-700' : 'bg-brand-600'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus size={12} /> Close Form</> : <><FaPlus size={12} /> Add New Customer</>}
                    </button>
                </div>

                {/* Form */}
                {isFormOpen && !loading && (
                    <div ref={formSectionRef}>
                        <CustomerForm
                            key={editingCustomer?._id || 'new'}
                            customers={customers}
                            fetchCustomers={fetchCustomers}
                            setShowForm={setIsFormOpen}
                            editingCustomer={editingCustomer}
                            setEditingCustomer={setEditingCustomer}
                            showToast={showToast}
                            routes={routes}
                            scrollToTable={() => {
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            aria-expanded={showFilters}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer lg:cursor-default"
                        >
                            <FaFilter className="text-brand-600" /> Filter & Search
                            {activeFilterCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                            <span className="lg:hidden text-xs font-medium text-brand-600">
                                {showFilters ? 'Hide' : 'Show'}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1.5 min-h-[36px] text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 rounded-full font-semibold cursor-pointer"
                        >
                            <FaRedo size={10} /> Clear All
                        </button>
                    </div>

                    <div className={`${showFilters ? 'block' : 'hidden'} lg:block mt-4 pt-4 border-t border-slate-100`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <span className={labelCls}>Start Date</span>
                                <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                            </div>
                            <div>
                                <span className={labelCls}>End Date</span>
                                <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                            </div>
                            <div>
                                <span className={labelCls}>Business Name</span>
                                <ComboBox
                                    value={filters.businessName}
                                    placeholder="Search or select customer..."
                                    options={businessOptions}
                                    emptyText="No customer found"
                                    onType={(v) => {
                                        setFilters({ ...filters, businessName: v });
                                        setCurrentPage(1);
                                    }}
                                    onPick={(o) => {
                                        setFilters({ ...filters, businessName: o.value.businessName, contactNumber: o.value.contactNumber || '' });
                                        setCurrentPage(1);
                                    }}
                                    onClear={() => {
                                        setFilters({ ...filters, businessName: '', contactNumber: '' });
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            {textField('email', 'Email', 'Search email...')}
                            {textField('contactNumber', 'Contact Number', 'Search number...')}
                            {textField('contactName', 'Contact Name', 'Search contact name...')}
                            {textField('businessNumber', 'Business Number', 'Search business no...')}
                            {textField('address', 'Address', 'Search address...')}
                            <div>
                                <span className={labelCls}>Route</span>
                                <ComboBox
                                    value={filters.route}
                                    placeholder="Search or select route..."
                                    options={routeOptions}
                                    emptyText="No route found"
                                    onType={(v) => {
                                        setFilters({ ...filters, route: v });
                                        setCurrentPage(1);
                                    }}
                                    onPick={(o) => {
                                        setFilters({ ...filters, route: o.value });
                                        setCurrentPage(1);
                                    }}
                                    onClear={() => {
                                        setFilters({ ...filters, route: '' });
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div ref={tableSectionRef} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 sm:px-5 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                        <h2 className="text-base font-semibold text-slate-800">Customer Directory</h2>
                        <span className="bg-brand-50 text-brand-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                            Showing {filteredCustomers.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredCustomers.length)}` : 0} of {filteredCustomers.length} ({customers.length} total)
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-4">
                            <Skeleton rows={6} />
                        </div>
                    ) : currentCustomers.length === 0 ? (
                        <div className="text-center py-14 text-slate-400 flex flex-col items-center">
                            <FaStore size={32} className="mb-2 opacity-40" />
                            No matching customers found!
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden p-2 space-y-1.5">
                                {currentCustomers.map((customer) => (
                                    <div
                                        key={customer._id}
                                        className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm"
                                    >
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-brand-500" />
                                        <div className="flex items-stretch gap-2">
                                            {/* Left: info */}
                                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/customer-details/${customer._id}`)}
                                                        className="font-bold text-[13px] text-brand-700 text-left truncate cursor-pointer leading-tight min-w-0"
                                                    >
                                                        {customer.businessName}
                                                    </button>
                                                    <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                        📞 {customer.contactNumber || 'N/A'}
                                                    </span>
                                                </div>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Contact: </span>
                                                    {customer.contactName || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Biz No: </span>
                                                    {customer.businessNumber || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">📍 </span>
                                                    {customer.address || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Right: route + actions + balance */}
                                            <div className="shrink-0 w-[116px] flex flex-col items-end justify-between gap-1.5">
                                                <div className="flex items-center justify-between gap-1.5 w-full">
                                                    {customer.route ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[9.5px] font-bold truncate max-w-[78px]">
                                                            {customer.route}
                                                        </span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                    <RowMenu compact items={menuItems(customer)} />
                                                </div>
                                                <div
                                                    className={`w-full rounded-lg px-2 py-1.5 text-right ${customer.openingBalanceType === 'Pay' ? 'bg-rose-50' : 'bg-emerald-50'}`}
                                                >
                                                    <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Opening Balance</p>
                                                    <p
                                                        className={`text-[12.5px] font-extrabold leading-tight mt-1 whitespace-nowrap ${customer.openingBalanceType === 'Pay' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                    >
                                                        ৳ {customer.openingBalance ? Number(customer.openingBalance).toLocaleString() : '0'}
                                                        {customer.openingBalanceType && (
                                                            <span className="ml-1 text-[9px] font-bold">{customer.openingBalanceType}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {['Business Name', 'Contact Number', 'Contact Name', 'Business No', 'Route', 'Opening Balance', 'Address'].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                                            ))}
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentCustomers.map((customer) => (
                                            <tr key={customer._id} className="border-t border-slate-100 hover:bg-brand-50/40 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/customer-details/${customer._id}`)}
                                                        className="text-brand-700 hover:underline font-bold text-left cursor-pointer"
                                                    >
                                                        {customer.businessName}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{customer.contactNumber}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{customer.contactName || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{customer.businessNumber || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {customer.route ? (
                                                        <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-xs font-semibold">{customer.route}</span>
                                                    ) : <NA />}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap"><BalanceCell item={customer} /></td>
                                                <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate" title={customer.address}>{customer.address || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <RowMenu items={menuItems(customer)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {filteredCustomers.length > 0 && (
                        <div className="px-4 py-3 sm:px-5 bg-slate-50 border-t border-slate-200">
                            <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Customers;