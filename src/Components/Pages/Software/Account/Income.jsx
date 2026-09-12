import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import IncomeForm from './IncomeForm';
import { FiEye, FiPieChart, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Search, Form & Edit Modal States
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);

    // Breakdown Modal States
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

    // Table section ref for auto scrolling
    const tableSectionRef = useRef(null);

    // Fetch Incomes
    const fetchIncomes = async () => {
        try {
            const response = await fetch('http://localhost:5000/income');
            const data = await response.json();
            setIncomes(data);
        } catch (error) {
            console.error('Error fetching incomes:', error);
            showToast('Failed to load incomes!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncomes();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // View Note Handler with SweetAlert2
    const handleViewNote = (note) => {
        Swal.fire({
            title: '<span class="text-xl font-bold text-gray-800">Income Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-white'
            }
        });
    };

    // Delete Income Handler with SweetAlert2
    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/income/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Income deleted successfully!', 'success');
                        setIncomes(prevIncomes => prevIncomes.filter(income => income._id !== id));
                    } else {
                        showToast('Failed to delete income!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting income:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // Filtered Incomes based on Search
    const filteredIncomes = incomes.filter((income) => {
        const search = searchTerm.toLowerCase();
        const categoryMatch = income.incomeCategory?.toLowerCase().includes(search);
        const nameMatch = income.name?.toLowerCase().includes(search);
        const accountMatch = income.accountType?.toLowerCase().includes(search);
        const noteMatch = income.note?.toLowerCase().includes(search);
        const invoiceMatch = income.invoiceNumber?.toLowerCase().includes(search);
        const bankMatch = income.bankName?.toLowerCase().includes(search);
        const accNoMatch = income.accountNumber?.toLowerCase().includes(search);
        const accNameMatch = income.accountName?.toLowerCase().includes(search);
        const branchMatch = income.accountBranch?.toLowerCase().includes(search);
        return categoryMatch || nameMatch || accountMatch || noteMatch || invoiceMatch || bankMatch || accNoMatch || accNameMatch || branchMatch;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentIncomes = filteredIncomes.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // কোনো account detail field আছে কিনা চেক করার হেল্পার (bankName না থাকলেও accountNumber/accountName/accountBranch থাকতে পারে)
    const hasAccountDetails = (income) =>
        Boolean(income.bankName || income.accountNumber || income.accountBranch || income.accountName);

    // Open/close breakdown modal with smooth animation
    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };

    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    // Income Breakdown Calculation
    // - accountType wise total (Cash, Mobile Banking, Bank ...)
    // - Mobile Banking er khetre accountName (Bkash/Nagad) + accountNumber onujayi sub-group (same provider er multiple number alada dekhabe)
    // - Bank er khetre bankName + accountNumber onujayi sub-group (same bank er multiple account alada dekhabe)
    const getIncomeBreakdown = () => {
        const groups = {};

        filteredIncomes.forEach((income) => {
            const type = income.accountType?.trim() || 'Others';
            const amount = Number(income.amount) || 0;

            if (!groups[type]) {
                groups[type] = { total: 0, subGroups: {} };
            }

            groups[type].total += amount;

            const normalizedType = type.toLowerCase();
            let subKey = '';

            if (normalizedType === 'mobile banking') {
                // Provider (Bkash/Nagad) + Number diye alada alada dekhabe
                const provider = income.accountName?.trim();
                const number = income.accountNumber?.trim();
                if (provider && number) {
                    subKey = `${provider} (${number})`;
                } else if (provider) {
                    subKey = provider;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType === 'bank') {
                // Bank Name + Account Number diye alada alada dekhabe
                const bank = income.bankName?.trim();
                const number = income.accountNumber?.trim();
                if (bank && number) {
                    subKey = `${bank} (${number})`;
                } else if (bank) {
                    subKey = bank;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType !== 'cash') {
                // Onno kono accountType hole fallback: jekono available field
                const fallbackName = income.bankName?.trim() || income.accountName?.trim();
                const number = income.accountNumber?.trim();
                if (fallbackName && number) {
                    subKey = `${fallbackName} (${number})`;
                } else if (fallbackName) {
                    subKey = fallbackName;
                } else if (number) {
                    subKey = number;
                }
            }
            // Cash hole subKey empty thakbe, tai sub-breakdown dekhabe na

            if (subKey) {
                groups[type].subGroups[subKey] = (groups[type].subGroups[subKey] || 0) + amount;
            }
        });

        return groups;
    };

    const breakdown = getIncomeBreakdown();
    const grandTotal = filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Income Breakdown Modal */}
            {showBreakdown && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${breakdownVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
                    onClick={closeBreakdown}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all duration-300 ${breakdownVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Income Breakdown</h3>
                                <p className="text-indigo-100 text-xs mt-0.5">Source wise total income</p>
                            </div>
                            <button
                                onClick={closeBreakdown}
                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition duration-200 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {Object.keys(breakdown).length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-medium">No data to show!</div>
                            ) : (
                                Object.entries(breakdown).map(([type, data]) => (
                                    <div key={type} className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800 text-sm">{type}</span>
                                            <span className="font-bold text-emerald-600 text-sm">৳ {data.total.toLocaleString()}</span>
                                        </div>

                                        {Object.keys(data.subGroups).length > 0 && (
                                            <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-100">
                                                {Object.entries(data.subGroups).map(([subKey, subAmount]) => (
                                                    <div key={subKey} className="flex items-center justify-between text-xs text-gray-600">
                                                        <span className="font-medium">{subKey}</span>
                                                        <span className="font-semibold text-gray-700">৳ {subAmount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Grand Total</span>
                            <span className="text-lg font-extrabold text-indigo-700">৳ {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title & Add Button */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Income Management
                        </h2>
                    </div>

                    <button
                        onClick={() => {
                            setEditingIncome(null);
                            setShowForm(!showForm);
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        {showForm ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Form
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add New Income
                            </>
                        )}
                    </button>
                </div>

                {/* Collapsible Form Component */}
                {showForm && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                        <IncomeForm
                            fetchIncomes={fetchIncomes}
                            setShowForm={setShowForm}
                            editingIncome={editingIncome}
                            setEditingIncome={setEditingIncome}
                            showToast={showToast}
                            scrollToTable={() => {
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Table Card Section */}
                <div ref={tableSectionRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Income Records</h3>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                Showing: {filteredIncomes.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredIncomes.length)}` : 0} of {filteredIncomes.length} ({incomes.length} total)
                            </span>
                            <span className="px-3 py-3  bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-full shadow-sm">
                                Total Income: ৳ {grandTotal.toLocaleString()}
                            </span>
                            <button
                                onClick={openBreakdown}
                                className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm transition duration-200 cursor-pointer"
                                title="View Income Breakdown"
                            >
                                <FiPieChart className="w-3.5 h-3.5" />
                                Breakdown
                            </button>
                        </div>

                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by category, name, account, invoice..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading incomes...</div>
                    ) : filteredIncomes.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No income records found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-4">#</th>
                                        <th className="py-4 px-4">Date</th>
                                        <th className="py-4 px-4">Invoice</th>
                                        <th className="py-4 px-4">Income Category</th>
                                        <th className="py-4 px-4">Name</th>
                                        <th className="py-4 px-4">Account Type</th>
                                        <th className="py-4 px-4">Account Details</th>
                                        <th className="py-4 px-4">Amount</th>
                                        <th className="py-4 px-4 text-center">Note</th>
                                        <th className="py-4 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentIncomes.map((income, index) => (
                                        <tr key={income._id || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-4 px-4 font-medium text-gray-400">{indexOfFirstItem + index + 1}</td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{income.date || 'N/A'}</td>
                                            <td className="py-4 px-4 font-mono text-xs text-indigo-600 font-semibold">{income.invoiceNumber || 'N/A'}</td>
                                            <td className="py-4 px-4 font-bold text-gray-800">{income.incomeCategory || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600">{income.name || 'N/A'}</td>
                                            <td className="py-4 px-4">
                                                {income.accountType === 'Mobile Banking' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-amber-700 text-sm">
                                                            {income.accountName || 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                            Mobile Banking
                                                        </span>
                                                    </div>
                                                ) : income.accountType === 'Bank' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-indigo-700 text-sm">
                                                            {income.bankName || 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                            Bank
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 rounded-full font-semibold text-xs whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                                        {income.accountType || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-500">
                                                {hasAccountDetails(income) ? (
                                                    <div className="space-y-0.5">

                                                        {income.accountNumber && <p><strong className="text-gray-700">A/C:</strong> {income.accountNumber}</p>}
                                                        {income.accountBranch && <p><strong className="text-gray-700">Branch:</strong> {income.accountBranch}</p>}

                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 ">Cash</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">৳ {income.amount ?? 'N/A'}</td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleViewNote(income.note)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition duration-200 shadow-sm text-xs font-semibold cursor-pointer"
                                                    title="View Note"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    View Note
                                                </button>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingIncome(income);
                                                            setShowForm(true);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Edit Income"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(income._id)}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Delete Income"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!loading && filteredIncomes.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                                    <FiChevronLeft size={12} /> Previous
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
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
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
                                    Next <FiChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Income;