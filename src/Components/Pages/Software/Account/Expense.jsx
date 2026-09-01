import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import ExpenseForm from './ExpenseForm';
import { FiEye } from 'react-icons/fi';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    
    // Search, Form & Edit Modal States
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

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

    // কোনো account detail field আছে কিনা চেক করার হেল্পার (bankName না থাকলেও accountNumber/accountName/accountBranch থাকতে পারে)
    const hasAccountDetails = (expense) =>
        Boolean(expense.bankName || expense.accountNumber || expense.accountBranch || expense.accountName);

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-6 md:p-8 relative">
            
            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
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
                                Total: {filteredExpenses.length}
                            </span>
                            <span className="px-3 py-3  bg-amber-50 border border-amber-100 text-amber-700 font-bold text-xs rounded-full shadow-sm">
                                Total Expense: ৳ {filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}
                            </span>
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
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                    {filteredExpenses.map((expense, index) => (
                                        <tr key={expense._id || index} className="hover:bg-rose-50/40 transition duration-150">
                                            <td className="py-4 px-4 font-medium text-gray-400">{index + 1}</td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{expense.date || 'N/A'}</td>
                                            <td className="py-4 px-4 font-mono text-xs text-rose-600 font-semibold">{expense.invoiceNumber || 'N/A'}</td>
                                            <td className="py-4 px-4 font-bold text-gray-800">{expense.expenseCategory || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600">{expense.name || 'N/A'}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold text-xs whitespace-nowrap">
                                                    {expense.accountType || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-500">
                                                {hasAccountDetails(expense) ? (
                                                    <div className="space-y-0.5">
                                                        {expense.bankName && <p><strong className="text-gray-700">Bank:</strong> {expense.bankName}</p>}
                                                        {expense.accountNumber && <p><strong className="text-gray-700">A/C:</strong> {expense.accountNumber}</p>}
                                                        {expense.accountBranch && <p><strong className="text-gray-700">Branch:</strong> {expense.accountBranch}</p>}
                                                        {expense.accountName && <p><strong className="text-gray-700">Holder:</strong> {expense.accountName}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
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
                </div>
            </div>
        </div>
    );
};

export default Expense;