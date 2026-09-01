import React, { useState, useEffect, useRef } from 'react';

import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaStickyNote, FaTimes, FaEye, FaPlus, FaMinus, FaClock, FaFilter, FaRedo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import CompanyForm from './CompanyForm';

const Company = () => {
    const [companies, setCompanies] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Toggle Form State (Default false/off)
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Modal State for Note
    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        businessName: '',
        contactNumber: '',
        email: '',
        contactName: '',
        businessNumber: '',
        address: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        businessName: '',
        contactNumber: '',
        email: '',
        contactName: '',
        businessNumber: '',
        openingBalance: '',
        address: '',
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

    // Fetch companies data
    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Helper function to format ISO date (YYYY-MM-DD) to "05 Aug 2026"
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options); // e.g., 05 Aug 2026
    };

    // Handle Filter input change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            businessName: '',
            contactNumber: '',
            email: '',
            contactName: '',
            businessNumber: '',
            address: ''
        });
        setCurrentPage(1);
    };

    // Handle Form Submit (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const submissionData = editingId
            ? formData
            : { ...formData, createdAt: formatDateTime(new Date()) };

        const url = editingId
            ? `http://localhost:5000/company/${editingId}`
            : 'http://localhost:5000/company';

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
                    title: editingId ? 'Company Updated Successfully!' : 'Company Added Successfully!',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#f0fdf4',
                    color: '#166534'
                });

                // Reset form & Close it
                setFormData({
                    businessName: '',
                    contactNumber: '',
                    email: '',
                    contactName: '',
                    businessNumber: '',
                    openingBalance: '',
                    address: '',
                    note: ''
                });
                setEditingId(null);
                setIsFormOpen(false);
                fetchCompanies();
            }
        } catch (error) {
            console.error('Error saving company:', error);
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
                    const res = await fetch(`http://localhost:5000/company/${id}`, {
                        method: 'DELETE',
                    });
                    const data = await res.json();
                    if (data.deletedCount > 0) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Your company has been deleted.",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        });
                        fetchCompanies();
                    }
                } catch (error) {
                    console.error('Error deleting company:', error);
                }
            }
        });
    };

    // Handle Edit (Load data to form & Open form)
    const handleEdit = (company) => {
        setFormData({
            businessName: company.businessName || '',
            contactNumber: company.contactNumber || '',
            email: company.email || '',
            contactName: company.contactName || '',
            businessNumber: company.businessNumber || '',
            openingBalance: company.openingBalance || '',
            address: company.address || '',
            note: company.note || ''
        });
        setEditingId(company._id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ businessName: '', contactNumber: '', email: '', contactName: '', businessNumber: '', openingBalance: '', address: '', note: '' });
        setIsFormOpen(false);
    };

    // Open Note Modal
    const handleOpenModal = (noteText) => {
        setSelectedNote(noteText || 'No note available for this company.');
        setIsModalOpen(true);
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredCompanies = companies.filter((company) => {
        // Date Range Filter (YYYY-MM-DD backend to formatted check)
        if (filters.startDate || filters.endDate) {
            if (!company.createdAt) return false;

            const datePart = company.createdAt.split(',')[0].trim(); // DD/MM/YYYY
            const [cDay, cMonth, cYear] = datePart.split('/');
            const companyDate = new Date(`${cYear}-${cMonth}-${cDay}`);

            if (filters.startDate) {
                const startDateObj = new Date(filters.startDate);
                if (!isNaN(startDateObj) && companyDate < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = new Date(filters.endDate);
                if (!isNaN(endDateObj) && companyDate > endDateObj) return false;
            }
        }

        // Business Name Filter
        if (filters.businessName && !company.businessName?.toLowerCase().includes(filters.businessName.toLowerCase())) {
            return false;
        }
        // Contact Number Filter
        if (filters.contactNumber && !company.contactNumber?.toLowerCase().includes(filters.contactNumber.toLowerCase())) {
            return false;
        }
        // Email Filter
        if (filters.email && !company.email?.toLowerCase().includes(filters.email.toLowerCase())) {
            return false;
        }
        // Contact Name Filter
        if (filters.contactName && !company.contactName?.toLowerCase().includes(filters.contactName.toLowerCase())) {
            return false;
        }
        // Business Number Filter
        if (filters.businessNumber && !company.businessNumber?.toLowerCase().includes(filters.businessNumber.toLowerCase())) {
            return false;
        }
        // Address Filter
        if (filters.address && !company.address?.toLowerCase().includes(filters.address.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCompanies = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Title & Add New Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Company Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your business contacts, balances, and details efficiently.</p>
                    </div>

                    {/* Toggle Button for Form */}
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
                        {isFormOpen ? <><FaMinus /> Close Form</> : <><FaPlus /> Add New Company</>}
                    </button>
                </div>

                {/* Smooth Collapsible Form Component */}
                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isFormOpen ? 'max-h-[1000px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'
                        }`}
                >
                    <CompanyForm
                        formData={formData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        editingId={editingId}
                        handleCancelEdit={handleCancelEdit}
                    />
                </div>

                {/* Separate Multi-Search Filter Panel (Above Table) */}
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

                        {/* Contact Name Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Contact Name</label>
                            <input
                                type="text"
                                name="contactName"
                                placeholder="Search contact..."
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
                                placeholder="Search reg / ID..."
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
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold">Company Directory</h2>
                        <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                            Showing: {filteredCompanies.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredCompanies.length)}` : 0} of {filteredCompanies.length} ({companies.length} total)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Business Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Opening Balance</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentCompanies.length > 0 ? (
                                    currentCompanies.map((company) => (
                                        <tr key={company._id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {company.businessName}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                    {company.contactNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {company.email || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {company.contactName || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {company.businessNumber || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                ৳ {company.openingBalance ? Number(company.openingBalance).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {company.address || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => handleOpenModal(company.note)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all text-xs font-semibold shadow-sm"
                                                >
                                                    <FaEye size={12} /> View Note
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {company.createdAt ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FaClock className="text-indigo-400" size={11} /> {company.createdAt}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(company)}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(company._id)}
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
                                        <td colSpan="10" className="text-center py-10 text-gray-400 text-sm">
                                            No matching companies found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredCompanies.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm'
                                    }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        // Show first, last, current, and surrounding pages
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                                        currentPage === pageNum
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
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        currentPage === totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm'
                                    }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
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
                                <FaStickyNote className="text-indigo-600" /> Company Note
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

export default Company;