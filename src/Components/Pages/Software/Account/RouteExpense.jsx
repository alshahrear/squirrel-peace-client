import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaFilter, FaRedo } from 'react-icons/fa';
import RouteExpenseForm from './RouteExpenseForm';
import { FiEye } from 'react-icons/fi';

const RouteExpense = () => {
    const [routeExpenses, setRouteExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Form & Edit Modal States
    const [showForm, setShowForm] = useState(false);
    const [editingRouteExpense, setEditingRouteExpense] = useState(null);

    // Filter Dropdown source data
    const [deliveryMen, setDeliveryMen] = useState([]);
    const [routes, setRoutes] = useState([]);

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        deliveredBy: '',
        routeName: '',
        category: '',
        name: '',
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Table section ref for auto scrolling
    const tableSectionRef = useRef(null);

    // Helper function to format ISO date (YYYY-MM-DD) to "05 Aug 2026"
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options);
    };

    // Fetch Route Expenses
    const fetchRouteExpenses = async () => {
        try {
            const response = await fetch('http://localhost:5000/routeExpense');
            const data = await response.json();
            setRouteExpenses(data);
        } catch (error) {
            console.error('Error fetching route expenses:', error);
            showToast('Failed to load route expenses!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Delivery Men (for filter dropdown)
    const fetchDeliveryMen = async () => {
        try {
            const res = await fetch('http://localhost:5000/user');
            const data = await res.json();
            const filtered = data.filter(
                (user) => user.role === 'Delivery Man' && user.isActive === true
            );
            setDeliveryMen(filtered);
        } catch (error) {
            console.error('Error fetching delivery men:', error);
        }
    };

    // Fetch Routes (for filter dropdown)
    const fetchRoutes = async () => {
        try {
            const res = await fetch('http://localhost:5000/route');
            const data = await res.json();
            const filtered = data.filter((route) => route.isActive === true);
            setRoutes(filtered);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    useEffect(() => {
        fetchRouteExpenses();
        fetchDeliveryMen();
        fetchRoutes();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // Handle Filter input change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            deliveredBy: '',
            routeName: '',
            category: '',
            name: '',
        });
    };

    // View Note Handler with SweetAlert2
    const handleViewNote = (note) => {
        Swal.fire({
            title: '<span class="text-xl font-bold text-gray-800">Route Expense Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#0891b2',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-white'
            }
        });
    };

    // Delete Route Expense Handler with SweetAlert2
    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0891b2',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/routeExpense/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Route Expense deleted successfully!', 'success');
                        setRouteExpenses(prevRouteExpenses => prevRouteExpenses.filter(routeExpense => routeExpense._id !== id));
                    } else {
                        showToast('Failed to delete route expense!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting route expense:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredRouteExpenses = routeExpenses.filter((routeExpense) => {
        // Date Range Filter (date format: "02 Sept 2026")
        if (filters.startDate || filters.endDate) {
            if (!routeExpense.date) return false;

            const parsedDate = new Date(routeExpense.date);
            if (isNaN(parsedDate)) return false;

            if (filters.startDate) {
                const startDateObj = new Date(filters.startDate);
                if (!isNaN(startDateObj) && parsedDate < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = new Date(filters.endDate);
                if (!isNaN(endDateObj) && parsedDate > endDateObj) return false;
            }
        }

        // Delivered By Filter (exact match from select dropdown)
        if (filters.deliveredBy && routeExpense.deliveredBy !== filters.deliveredBy) {
            return false;
        }

        // Route Name Filter (exact match from select dropdown)
        if (filters.routeName && routeExpense.routeName !== filters.routeName) {
            return false;
        }

        // Category Filter (text search)
        if (filters.category && !routeExpense.routeExpenseCategory?.toLowerCase().includes(filters.category.toLowerCase())) {
            return false;
        }

        // Name Filter (text search)
        if (filters.name && !routeExpense.name?.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }

        return true;
    });

    // কোনো account detail field আছে কিনা চেক করার হেল্পার (bankName না থাকলেও accountNumber/accountName/accountBranch থাকতে পারে)
    const hasAccountDetails = (routeExpense) =>
        Boolean(routeExpense.bankName || routeExpense.accountNumber || routeExpense.accountBranch || routeExpense.accountName);

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-50 to-sky-100 p-6 md:p-8 relative">
            
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
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                            Route Expense Management
                        </h2>
                    </div>

                    <button
                        onClick={() => {
                            setEditingRouteExpense(null);
                            setShowForm(!showForm);
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
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
                                Add New Route Expense
                            </>
                        )}
                    </button>
                </div>

                {/* Collapsible Form Component */}
                {showForm && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                        <RouteExpenseForm 
                            fetchRouteExpenses={fetchRouteExpenses}
                            setShowForm={setShowForm}
                            editingRouteExpense={editingRouteExpense}
                            setEditingRouteExpense={setEditingRouteExpense}
                            showToast={showToast}
                            scrollToTable={() => {
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Separate Multi-Search Filter Panel (Above Table) */}
                <div className="bg-white shadow-lg rounded-2xl p-5 border border-cyan-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FaFilter className="text-cyan-600" /> Filter & Search Panel
                        </h3>
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold"
                        >
                            <FaRedo size={11} /> Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Start Date */}
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* End Date */}
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Delivered By Select */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Delivered By</label>
                            <select
                                name="deliveredBy"
                                value={filters.deliveredBy}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                            >
                                <option value="">All Delivery Men</option>
                                {deliveryMen.map((user) => (
                                    <option key={user._id} value={user.name}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Route Select */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Route</label>
                            <select
                                name="routeName"
                                value={filters.routeName}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                            >
                                <option value="">All Routes</option>
                                {routes.map((route) => (
                                    <option key={route._id} value={route.name}>
                                        {route.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Category</label>
                            <input
                                type="text"
                                name="category"
                                placeholder="Search category..."
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Name Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Search name..."
                                value={filters.name}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none bg-gray-50/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Card Section */}
                <div ref={tableSectionRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 border border-white space-y-6">
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                       <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Route Expense Records</h3>
                            <span className="px-3 py-1 bg-cyan-50 border border-cyan-100 text-cyan-700 font-semibold text-xs rounded-full shadow-sm">
                                Showing: {filteredRouteExpenses.length} of {routeExpenses.length}
                            </span>
                            <span className="px-3 py-3  bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs rounded-full shadow-sm">
                                Total Route Expense: ৳ {filteredRouteExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading route expenses...</div>
                    ) : filteredRouteExpenses.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No route expense records found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1500px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-4">#</th>
                                        <th className="py-4 px-4">Date</th>
                                        <th className="py-4 px-4">Invoice</th>
                                        <th className="py-4 px-4">Delivered By</th>
                                        <th className="py-4 px-4">Route Name</th>
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
                                    {filteredRouteExpenses.map((routeExpense, index) => (
                                        <tr key={routeExpense._id || index} className="hover:bg-cyan-50/40 transition duration-150">
                                            <td className="py-4 px-4 font-medium text-gray-400">{index + 1}</td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{routeExpense.date || 'N/A'}</td>
                                            <td className="py-4 px-4 font-mono text-xs text-cyan-600 font-semibold">{routeExpense.invoiceNumber || 'N/A'}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full font-semibold text-xs whitespace-nowrap">
                                                    {routeExpense.deliveredBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{routeExpense.routeName || 'N/A'}</td>
                                            <td className="py-4 px-4 font-bold text-gray-800">{routeExpense.routeExpenseCategory || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600">{routeExpense.name || 'N/A'}</td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-xs whitespace-nowrap">
                                                    {routeExpense.accountType || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-500">
                                                {hasAccountDetails(routeExpense) ? (
                                                    <div className="space-y-0.5">
                                                        {routeExpense.bankName && <p><strong className="text-gray-700">Bank:</strong> {routeExpense.bankName}</p>}
                                                        {routeExpense.accountNumber && <p><strong className="text-gray-700">A/C:</strong> {routeExpense.accountNumber}</p>}
                                                        {routeExpense.accountBranch && <p><strong className="text-gray-700">Branch:</strong> {routeExpense.accountBranch}</p>}
                                                        {routeExpense.accountName && <p><strong className="text-gray-700">Holder:</strong> {routeExpense.accountName}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 font-bold text-cyan-600 whitespace-nowrap">৳ {routeExpense.amount ?? 'N/A'}</td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleViewNote(routeExpense.note)}
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
                                                            setEditingRouteExpense(routeExpense);
                                                            setShowForm(true);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Edit Route Expense"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDelete(routeExpense._id)}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Delete Route Expense"
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

export default RouteExpense;