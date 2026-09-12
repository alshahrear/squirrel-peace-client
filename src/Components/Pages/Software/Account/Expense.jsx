import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import ExpenseForm from './ExpenseForm';
import { FiEye, FiPieChart, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Search, Form & Edit Modal States
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // Breakdown Modal States
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

    // Table section ref for auto scrolling
    const tableSectionRef = useRef(null);

    // Fetch Expenses
    const fetchExpenses = async () => {
        try {
            const response = await fetch('http://localhost:5000/expense');
            const data = await response.json();
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showToast('Failed to load expenses!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
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
            title: '<span class="text-xl font-bold text-gray-800">Expense Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#e11d48',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-white'
            }
        });
    };

    // Delete Expense Handler with SweetAlert2
    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/expense/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Expense deleted successfully!', 'success');
                        setExpenses(prevExpenses => prevExpenses.filter(expense => expense._id !== id));
                    } else {
                        showToast('Failed to delete expense!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting expense:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // Filtered Expenses based on Search
    const filteredExpenses = expenses.filter((expense) => {
        const search = searchTerm.toLowerCase();
        const categoryMatch = expense.expenseCategory?.toLowerCase().includes(search);
        const nameMatch = expense.name?.toLowerCase().includes(search);
        const accountMatch = expense.accountType?.toLowerCase().includes(search);
        const noteMatch = expense.note?.toLowerCase().includes(search);
        const invoiceMatch = expense.invoiceNumber?.toLowerCase().includes(search);
        const bankMatch = expense.bankName?.toLowerCase().includes(search);
        const accNoMatch = expense.accountNumber?.toLowerCase().includes(search);
        const accNameMatch = expense.accountName?.toLowerCase().includes(search);
        const branchMatch = expense.accountBranch?.toLowerCase().includes(search);
        return categoryMatch || nameMatch || accountMatch || noteMatch || invoiceMatch || bankMatch || accNoMatch || accNameMatch || branchMatch;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // কোনো account detail field আছে কিনা চেক করার হেল্পার (bankName না থাকলেও accountNumber/accountName/accountBranch থাকতে পারে)
    const hasAccountDetails = (expense) =>
        Boolean(expense.bankName || expense.accountNumber || expense.accountBranch || expense.accountName);

    // Open/close breakdown modal with smooth animation
    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };

    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    // Expense Breakdown Calculation
    // - accountType wise total (Cash, Mobile Banking, Bank ...)
    // - Mobile Banking er khetre accountName (Bkash/Nagad) + accountNumber onujayi sub-group (same provider er multiple number alada dekhabe)
    // - Bank er khetre bankName + accountNumber onujayi sub-group (same bank er multiple account alada dekhabe)
    const getExpenseBreakdown = () => {
        const groups = {};

        filteredExpenses.forEach((expense) => {
            const type = expense.accountType?.trim() || 'Others';
            const amount = Number(expense.amount) || 0;

            if (!groups[type]) {
                groups[type] = { total: 0, subGroups: {} };
            }

            groups[type].total += amount;

            const normalizedType = type.toLowerCase();
            let subKey = '';

            if (normalizedType === 'mobile banking') {
                // Provider (Bkash/Nagad) + Number diye alada alada dekhabe
                const provider = expense.accountName?.trim();
                const number = expense.accountNumber?.trim();
                if (provider && number) {
                    subKey = `${provider} (${number})`;
                } else if (provider) {
                    subKey = provider;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType === 'bank') {
                // Bank Name + Account Number diye alada alada dekhabe
                const bank = expense.bankName?.trim();
                const number = expense.accountNumber?.trim();
                if (bank && number) {
                    subKey = `${bank} (${number})`;
                } else if (bank) {
                    subKey = bank;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType !== 'cash') {
                // Onno kono accountType hole fallback: jekono available field
                const fallbackName = expense.bankName?.trim() || expense.accountName?.trim();
                const number = expense.accountNumber?.trim();
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

    const breakdown = getExpenseBreakdown();
    const grandTotal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Expense Breakdown Modal */}
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
                        <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Expense Breakdown</h3>
                                <p className="text-rose-100 text-xs mt-0.5">Source wise total expense</p>
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
                                            <span className="font-bold text-rose-600 text-sm">৳ {data.total.toLocaleString()}</span>
                                        </div>

                                        {Object.keys(data.subGroups).length > 0 && (
                                            <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-rose-100">
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
                        <div className="px-6 py-4 bg-rose-50/60 border-t border-rose-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Grand Total</span>
                            <span className="text-lg font-extrabold text-rose-700">৳ {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title & Add Button */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                            Expense Management
                        </h2>
                    </div>

                    <button
                        onClick={() => {
                            setEditingExpense(null);
                            setShowForm(!showForm);
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
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
                                Add New Expense
                            </>
                        )}
                    </button>
                </div>

                {/* Collapsible Form Component */}
                {showForm && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                        <ExpenseForm
                            fetchExpenses={fetchExpenses}
                            setShowForm={setShowForm}
                            editingExpense={editingExpense}
                            setEditingExpense={setEditingExpense}
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
                            <h3 className="text-xl font-bold text-gray-800">Expense Records</h3>
                            <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 font-semibold text-xs rounded-full shadow-sm">
                                Showing: {filteredExpenses.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredExpenses.length)}` : 0} of {filteredExpenses.length} ({expenses.length} total)
                            </span>
                            <span className="px-3 py-3  bg-amber-50 border border-amber-100 text-amber-700 font-bold text-xs rounded-full shadow-sm">
                                Total Expense: ৳ {grandTotal.toLocaleString()}
                            </span>
                            <button
                                onClick={openBreakdown}
                                className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-full shadow-sm transition duration-200 cursor-pointer"
                                title="View Expense Breakdown"
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
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading expenses...</div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No expense records found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-rose-600 to-orange-500 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-4">#</th>
                                        <th className="py-4 px-4">Date</th>
                                        <th className="py-4 px-4">Invoice</th>
                                        <th className="py-4 px-4">Category</th>
                                        <th className="py-4 px-4">Name</th>
                                        <th className="py-4 px-4">Account Type</th>
                                        <th className="py-4 px-4">Account Details</th>
                                        <th className="py-4 px-4">Amount</th>
                                        <th className="py-4 px-4 text-center">Note</th>
                                        <th className="py-4 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentExpenses.map((expense, index) => (
                                        <tr key={expense._id || index} className="hover:bg-rose-50/40 transition duration-150">
                                            <td className="py-4 px-4 font-medium text-gray-400">{indexOfFirstItem + index + 1}</td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{expense.date || 'N/A'}</td>
                                            <td className="py-4 px-4 font-mono text-xs text-rose-600 font-semibold">{expense.invoiceNumber || 'N/A'}</td>
                                            <td className="py-4 px-4 font-bold text-gray-800">{expense.expenseCategory || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600">{expense.name || 'N/A'}</td>
                                            <td className="py-4 px-4">
                                                {expense.accountType === 'Mobile Banking' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-amber-700 text-sm">
                                                            {expense.accountName || 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                            Mobile Banking
                                                        </span>
                                                    </div>
                                                ) : expense.accountType === 'Bank' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-rose-700 text-sm">
                                                            {expense.bankName || 'N/A'}
                                                        </span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                                            Bank
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 rounded-full font-semibold text-xs whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                        {expense.accountType || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-500">
                                                {hasAccountDetails(expense) ? (
                                                    <div className="space-y-0.5">
                                                        {expense.accountNumber && <p><strong className="text-gray-700">A/C:</strong> {expense.accountNumber}</p>}
                                                        {expense.accountBranch && <p><strong className="text-gray-700">Branch:</strong> {expense.accountBranch}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Cash</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-rose-600 whitespace-nowrap">৳ {expense.amount ?? 'N/A'}</td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleViewNote(expense.note)}
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
                                                            setEditingExpense(expense);
                                                            setShowForm(true);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Edit Expense"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(expense._id)}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Delete Expense"
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
                    {!loading && filteredExpenses.length > 0 && (
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
                                        : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 shadow-sm cursor-pointer'
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
                                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
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
                                        : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 shadow-sm cursor-pointer'
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

export default Expense;