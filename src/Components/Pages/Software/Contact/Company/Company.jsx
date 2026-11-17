import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaEye, FaPlus, FaMinus, FaFilter, FaRedo, FaBuilding } from 'react-icons/fa';
import CompanyForm from './CompanyForm';
import { useNavigate } from 'react-router-dom';
import useDraftState from '../../../../../hooks/useDraftState';
import useCan from '../../../../../hooks/useCan';
import { inputCls, labelCls, PopStyle, Skeleton, Pager, ComboBox, RowMenu, DateInput } from '../../Product/ProductUi';

const EMPTY_FILTERS = {
    startDate: '',
    endDate: '',
    businessName: '',
    contactNumber: '',
    email: '',
    contactName: '',
    businessNumber: '',
    address: '',
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

const Company = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const { canAdd, canEdit, canDelete } = useCan('company');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useDraftState('companyEditingId', null);
    const editingCompany = companies.find((c) => c._id === editingId) || null;
    const setEditingCompany = (c) => setEditingId(c ? c._id : null);

    const [isFormOpen, setIsFormOpen] = useDraftState('companyFormOpen', false);
    const [showFilters, setShowFilters] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    const showToast = (message, type = 'success') =>
        type === 'error' ? toast.error(message) : toast.success(message);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            showToast('Failed to load companies!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
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
                    const response = await fetch(`http://localhost:5000/company/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('Company deleted successfully!', 'success');
                        setCompanies((prev) => prev.filter((company) => company._id !== id));
                    } else {
                        showToast('Failed to delete company!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting company:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const handleEdit = (company) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        setEditingCompany(company);
        setIsFormOpen(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const filteredCompanies = [...companies].reverse().filter((company) => {
        if (filters.startDate || filters.endDate) {
            if (!company.createdAt) return false;
            const datePart = company.createdAt.split(',')[0].trim();
            const [cDay, cMonth, cYear] = datePart.split('/');
            const companyDate = new Date(`${cYear}-${cMonth}-${cDay}`);
            if (filters.startDate) {
                const s = new Date(filters.startDate);
                if (!isNaN(s) && companyDate < s) return false;
            }
            if (filters.endDate) {
                const e = new Date(filters.endDate);
                if (!isNaN(e) && companyDate > e) return false;
            }
        }
        const has = (field, val) => !val || company[field]?.toLowerCase().includes(val.toLowerCase());
        return (
            has('businessName', filters.businessName) &&
            has('contactNumber', filters.contactNumber) &&
            has('email', filters.email) &&
            has('contactName', filters.contactName) &&
            has('businessNumber', filters.businessNumber) &&
            has('address', filters.address)
        );
    });

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompanies = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const businessOptions = companies
        .filter((c) => {
            const s = filters.businessName.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: c.businessName, sub: `📞 ${c.contactNumber || ''}`, value: c }));

    const menuItems = (c) => [
        { label: 'View Details', icon: <FaEye size={12} />, tone: 'emerald', onClick: () => navigate(`/company-details/${c._id}`) },
        { label: 'Edit', icon: <FaEdit size={12} />, onClick: () => handleEdit(c) },
        { label: 'Delete', icon: <FaTrash size={12} />, tone: 'rose', onClick: () => handleDelete(c._id) },
    ];

    const textField = (name, label, placeholder) => (
        <div>
            <label htmlFor={`cf-${name}`} className={labelCls}>{label}</label>
            <input
                id={`cf-${name}`}
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
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Company Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Manage your business contacts, balances, and details efficiently.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!isFormOpen && !canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
                            setEditingCompany(null);
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-5 rounded-full text-white text-sm font-semibold cursor-pointer ${isFormOpen ? 'bg-slate-600 hover:bg-slate-700' : 'bg-brand-600'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus size={12} /> Close Form</> : <><FaPlus size={12} /> Add New Company</>}
                    </button>
                </div>

                {/* Form */}
                {isFormOpen && !loading && (
                    <div ref={formSectionRef}>
                        <CompanyForm
                            key={editingCompany?._id || 'new'}
                            companies={companies}
                            fetchCompanies={fetchCompanies}
                            setShowForm={setIsFormOpen}
                            editingCompany={editingCompany}
                            setEditingCompany={setEditingCompany}
                            showToast={showToast}
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
                                    placeholder="Search or select company..."
                                    options={businessOptions}
                                    emptyText="No company found"
                                    onType={(v) => {
                                        setFilters({ ...filters, businessName: v });
                                        setCurrentPage(1);
                                    }}
                                    onPick={(o) => {
                                        setFilters({ ...filters, businessName: o.value.businessName, contactNumber: o.value.contactNumber || '' });
                                        setCurrentPage(1);
                                    }}
                                    onClear={() => {
                                        setFilters({ ...filters, businessName: '' });
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            {textField('contactNumber', 'Contact Number', 'Search number...')}
                            {textField('email', 'Email', 'Search email...')}
                            {textField('contactName', 'Contact Name', 'Search contact...')}
                            {textField('businessNumber', 'Business Number', 'Search reg / ID...')}
                            {textField('address', 'Address', 'Search address...')}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div ref={tableSectionRef} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 sm:px-5 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center">
                        <h2 className="text-base font-semibold text-slate-800">Company Directory</h2>
                        <span className="bg-brand-50 text-brand-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                            Showing {filteredCompanies.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredCompanies.length)}` : 0} of {filteredCompanies.length} ({companies.length} total)
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-4">
                            <Skeleton rows={6} />
                        </div>
                    ) : currentCompanies.length === 0 ? (
                        <div className="text-center py-14 text-slate-400 flex flex-col items-center">
                            <FaBuilding size={32} className="mb-2 opacity-40" />
                            No matching companies found!
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden p-2 space-y-1.5">
                                {currentCompanies.map((company) => (
                                    <div
                                        key={company._id}
                                        className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm"
                                    >
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-brand-500" />
                                        <div className="flex items-stretch gap-2">
                                            {/* Left: info */}
                                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/company-details/${company._id}`)}
                                                        className="font-bold text-[13px] text-brand-700 text-left truncate cursor-pointer leading-tight min-w-0"
                                                    >
                                                        {company.businessName}
                                                    </button>
                                                    <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                        📞 {company.contactNumber || 'N/A'}
                                                    </span>
                                                </div>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Contact: </span>
                                                    {company.contactName || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Biz No: </span>
                                                    {company.businessNumber || 'N/A'}
                                                </p>
                                                <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                    <span className="uppercase text-slate-400 font-bold">📍 </span>
                                                    {company.address || 'N/A'}
                                                </p>
                                            </div>

                                            {/* Right: actions + balance */}
                                            <div className="shrink-0 w-[116px] flex flex-col items-end justify-between gap-1.5">
                                                <RowMenu compact items={menuItems(company)} />
                                                <div
                                                    className={`w-full rounded-lg px-2 py-1.5 text-right ${company.openingBalanceType === 'Pay' ? 'bg-rose-50' : 'bg-emerald-50'}`}
                                                >
                                                    <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Opening Balance</p>
                                                    <p
                                                        className={`text-[12.5px] font-extrabold leading-tight mt-1 whitespace-nowrap ${company.openingBalanceType === 'Pay' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                    >
                                                        ৳ {company.openingBalance ? Number(company.openingBalance).toLocaleString() : '0'}
                                                        {company.openingBalanceType && (
                                                            <span className="ml-1 text-[9px] font-bold">{company.openingBalanceType}</span>
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
                                            {['Business Name', 'Contact Number', 'Contact Name', 'Business Number', 'Opening Balance', 'Address'].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                                            ))}
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentCompanies.map((company) => (
                                            <tr key={company._id} className="border-t border-slate-100 hover:bg-brand-50/40 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/company-details/${company._id}`)}
                                                        className="text-brand-700 hover:underline font-bold text-left cursor-pointer"
                                                    >
                                                        {company.businessName}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{company.contactNumber}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{company.contactName || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{company.businessNumber || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><BalanceCell item={company} /></td>
                                                <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={company.address}>{company.address || <NA />}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <RowMenu items={menuItems(company)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {filteredCompanies.length > 0 && (
                        <div className="px-4 py-3 sm:px-5 bg-slate-50 border-t border-slate-200">
                            <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Company;