import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaStickyNote, FaTimes, FaEye, FaPlus, FaMinus, FaClock, FaFilter, FaRedo } from 'react-icons/fa';
import CustomerForm from './CustomersFrom';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [routes, setRoutes] = useState([]); // Routes state
    const [editingId, setEditingId] = useState(null);

    // Toggle Form State (Default false/off)
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Modal State for Note
    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        customerType: '',
        businessName: '',
        email: '',
        contactNumber: '',
        contactName: '',
        businessNumber: '',
        address: '',
        route: ''
    });

    // Form state with new fields and default customerType
    const [formData, setFormData] = useState({
        customerType: 'Wholesale Customer',
        businessName: '',
        contactNumber: '',
        email: '',
        contactName: '',
        businessNumber: '',
        openingBalance: '',
        creditLimit: '',
        address: '',
        route: '',
        note: ''
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Helper function to format date & time like: 26/08/2026, 3:19:09 pm
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

    // Fetch customers data
    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:5000/customer');
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Fetch routes data from API
    const fetchRoutes = async () => {
        try {
            const res = await fetch('http://localhost:5000/route');
            const data = await res.json();
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchRoutes();
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // If customerType changes to Retail, clear route
            if (name === 'customerType' && value === 'Retail Customer') {
                updated.route = '';
            }
            return updated;
        });
    };

    // Helper function to format ISO date (YYYY-MM-DD) to "05 Aug 2026"
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options);
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
            customerType: '',
            businessName: '',
            email: '',
            contactNumber: '',
            contactName: '',
            businessNumber: '',
            address: '',
            route: ''
        });
    };

    // Handle Form Submit (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const submissionData = editingId
            ? formData
            : { ...formData, createdAt: formatDateTime(new Date()) };

        const url = editingId
            ? `http://localhost:5000/customer/${editingId}`
            : 'http://localhost:5000/customer';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const data = await res.json();
            if (data.insertedId || data.modifiedCount > 0) {
                Swal.fire({
                    icon: 'success',
                    title: editingId ? 'Customer Updated Successfully!' : 'Customer Added Successfully!',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#f0fdf4',
                    color: '#166534'
                });

                // Reset form & Close it
                setFormData({
                    customerType: 'Wholesale Customer',
                    businessName: '',
                    contactNumber: '',
                    email: '',
                    contactName: '',
                    businessNumber: '',
                    openingBalance: '',
                    creditLimit: '',
                    address: '',
                    route: '',
                    note: ''
                });
                setEditingId(null);
                setIsFormOpen(false);
                fetchCustomers();
            }
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    };

    // Handle Delete with SweetAlert
    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:5000/customer/${id}`, {
                        method: 'DELETE',
                    });
                    const data = await res.json();
                    if (data.deletedCount > 0) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Your customer has been deleted.",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        });
                        fetchCustomers();
                    }
                } catch (error) {
                    console.error('Error deleting customer:', error);
                }
            }
        });
    };

    // Handle Edit (Load data to form & Open form)
    const handleEdit = (customer) => {
        setFormData({
            customerType: customer.customerType || 'Wholesale Customer',
            businessName: customer.businessName || '',
            contactNumber: customer.contactNumber || '',
            email: customer.email || '',
            contactName: customer.contactName || '',
            businessNumber: customer.businessNumber || '',
            openingBalance: customer.openingBalance || '',
            creditLimit: customer.creditLimit || '',
            address: customer.address || '',
            route: customer.route || '',
            note: customer.note || ''
        });
        setEditingId(customer._id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            customerType: 'Wholesale Customer',
            businessName: '',
            contactNumber: '',
            email: '',
            contactName: '',
            businessNumber: '',
            openingBalance: '',
            creditLimit: '',
            address: '',
            route: '',
            note: ''
        });
        setIsFormOpen(false);
    };

    // Open Note Modal
    const handleOpenModal = (noteText) => {
        setSelectedNote(noteText || 'No note available for this customer.');
        setIsModalOpen(true);
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredCustomers = customers.filter((customer) => {
        if (filters.startDate || filters.endDate) {
            if (!customer.createdAt) return false;

            const datePart = customer.createdAt.split(',')[0].trim();
            const [cDay, cMonth, cYear] = datePart.split('/');
            const customerDate = new Date(`${cYear}-${cMonth}-${cDay}`);

            if (filters.startDate) {
                const startDateObj = new Date(filters.startDate);
                if (!isNaN(startDateObj) && customerDate < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = new Date(filters.endDate);
                if (!isNaN(endDateObj) && customerDate > endDateObj) return false;
            }
        }
        if (filters.customerType && customer.customerType !== filters.customerType) {
            return false;
        }
        if (filters.businessName && !customer.businessName?.toLowerCase().includes(filters.businessName.toLowerCase())) {
            return false;
        }
        if (filters.email && !customer.email?.toLowerCase().includes(filters.email.toLowerCase())) {
            return false;
        }
        if (filters.contactNumber && !customer.contactNumber?.toLowerCase().includes(filters.contactNumber.toLowerCase())) {
            return false;
        }
        if (filters.contactName && !customer.contactName?.toLowerCase().includes(filters.contactName.toLowerCase())) {
            return false;
        }
        if (filters.businessNumber && !customer.businessNumber?.toLowerCase().includes(filters.businessNumber.toLowerCase())) {
            return false;
        }
        if (filters.address && !customer.address?.toLowerCase().includes(filters.address.toLowerCase())) {
            return false;
        }
        if (filters.route && customer.route !== filters.route) {
            return false;
        }

        return true;
    });




















































    

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Title & Add New Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Customer Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your customer contacts, balances, and details efficiently.</p>
                    </div>

                    <button
                        onClick={() => {
                            if (isFormOpen && editingId) {
                                handleCancelEdit();
                            } else {
                                setIsFormOpen(!isFormOpen);
                            }
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${isFormOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus /> Close Form</> : <><FaPlus /> Add New Customer</>}
                    </button>
                </div>

                {/* Smooth Collapsible Form Component */}
                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isFormOpen ? 'max-h-[1200px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'
                        }`}
                >
                    <CustomerForm
                        formData={formData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        editingId={editingId}
                        handleCancelEdit={handleCancelEdit}
                        routes={routes}
                    />
                </div>

                {/* Filter & Search Panel */}
                <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FaFilter className="text-indigo-600" /> Filter & Search Panel
                        </h3>
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold"
                        >
                            <FaRedo size={11} /> Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Customer Type Select */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer Type</label>
                            <select
                                name="customerType"
                                value={filters.customerType}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700"
                            >
                                <option value="">All Types</option>
                                <option value="Wholesale Customer">Wholesale Customer</option>
                                <option value="Retail Customer">Retail Customer</option>
                            </select>
                        </div>

                        {/* Business Name Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Business Name</label>
                            <input
                                type="text"
                                name="businessName"
                                placeholder="Search business..."
                                value={filters.businessName}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Email Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Email</label>
                            <input
                                type="text"
                                name="email"
                                placeholder="Search email..."
                                value={filters.email}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Contact Number Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                placeholder="Search number..."
                                value={filters.contactNumber}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Contact Name Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Contact Name</label>
                            <input
                                type="text"
                                name="contactName"
                                placeholder="Search contact name..."
                                value={filters.contactName}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Business Number Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Business Number</label>
                            <input
                                type="text"
                                name="businessNumber"
                                placeholder="Search business no..."
                                value={filters.businessNumber}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Address Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Address</label>
                            <input
                                type="text"
                                name="address"
                                placeholder="Search address..."
                                value={filters.address}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Route Select (Active only) */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Route</label>
                            <select
                                name="route"
                                value={filters.route}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700"
                            >
                                <option value="">All Routes</option>
                                {routes
                                    .filter(r => r.isActive !== false) // ইনঅ্যাক্টিভ রুট ফিল্টার করে বাদ দেওয়া হলো
                                    .map((r, idx) => {
                                        const routeName = r.routeName || r.name || r;
                                        return (
                                            <option key={idx} value={routeName}>
                                                {routeName}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold">Customer Directory</h2>
                        <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                            Showing: {filteredCustomers.length} / {customers.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Bal.</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Credit Limit</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer._id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                <span className={`px-2 py-1 rounded-full font-semibold ${customer.customerType === 'Wholesale Customer'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {customer.customerType || 'Wholesale'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {customer.businessName}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                    {customer.contactNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {customer.email || <span className="text-gray-400 italic text-xs">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                {customer.contactName || <span className="text-gray-400 italic text-xs">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {customer.businessNumber || <span className="text-gray-400 italic text-xs">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {customer.route ? (
                                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                        {customer.route}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                ৳ {customer.openingBalance ? Number(customer.openingBalance).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-amber-600">
                                                ৳ {customer.creditLimit ? Number(customer.creditLimit).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {customer.address || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => handleOpenModal(customer.note)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all text-xs font-semibold shadow-sm"
                                                >
                                                    <FaEye size={12} /> View Note
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {customer.createdAt ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FaClock className="text-indigo-400" size={11} /> {customer.createdAt}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer._id)}
                                                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="13" className="text-center py-10 text-gray-400 text-sm">
                                            No matching customers found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Smooth Note Modal */}
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <div
                        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaStickyNote className="text-indigo-600" /> Customer Note
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
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

export default Customers;