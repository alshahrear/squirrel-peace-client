import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaStore,
    FaPhoneAlt,
    FaEnvelope,
    FaUser,
    FaIdCard,
    FaMapMarkerAlt,
    FaStickyNote,
    FaClock,
    FaWallet,
    FaRoute,
    FaCreditCard,
    FaUserTag,
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-indigo-50 text-indigo-600', className = '' }) => (
    <div className={`bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all px-3.5 py-3 flex items-center gap-3 ${className}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{label}</p>
            <div className="text-[13px] font-semibold text-gray-800 truncate" title={typeof children === 'string' ? children : undefined}>
                {children}
            </div>
        </div>
    </div>
);

const NA = () => <span className="text-gray-400 italic font-normal">N/A</span>;

// "23/10/2026, 8:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CustomersDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const res = await fetch('https://squirrel-peace-server.onrender.com/customer', { cache: 'no-store' });
                const data = await res.json();
                const found = (Array.isArray(data) ? data : []).find((c) => String(c._id) === String(id));
                if (found) {
                    setCustomer(found);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Error fetching customer:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-indigo-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !customer) {
        return (
            <div className="min-h-[60vh] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaStore size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Customer Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">This customer does not exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/customers')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FaArrowLeft size={12} /> Back to Customers
                    </button>
                </div>
            </div>
        );
    }

    const initials = (customer.businessName || 'C')
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const isWholesale = customer.customerType === 'Wholesale Customer';
    const openingBalance = customer.openingBalance ? Number(customer.openingBalance).toLocaleString() : '0';
    const creditLimit = customer.creditLimit ? Number(customer.creditLimit).toLocaleString() : '0';

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 px-4 sm:px-5 lg:px-12">
            <div className="w-full space-y-4">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/customers')}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-indigo-600 text-xs font-bold shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                    <FaArrowLeft size={11} /> Back to Customers
                </button>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg px-5 py-4">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-14 -left-8 w-44 h-44 bg-white/10 rounded-full"></div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isWholesale ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {customer.customerType || 'Wholesale Customer'}
                                </span>
                                {customer.route && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md">
                                        Route: {customer.route}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white break-words leading-tight">
                                {customer.businessName}
                            </h1>
                            <p className="text-indigo-100 text-xs mt-0.5">
                                Contact Person: {customer.contactName || 'N/A'}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
                                {customer.contactNumber && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'tel:' + customer.contactNumber; }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaPhoneAlt size={10} /> {customer.contactNumber}
                                    </button>
                                )}
                                {customer.email && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'mailto:' + customer.email; }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaEnvelope size={10} /> {customer.email}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaUserTag size={15} />} label="Customer Type" iconBg="bg-purple-50 text-purple-600">
                        {customer.customerType || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaStore size={15} />} label="Business Name">
                        {customer.businessName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaUser size={15} />} label="Contact Name" iconBg="bg-purple-50 text-purple-600">
                        {customer.contactName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaPhoneAlt size={15} />} label="Contact Number" iconBg="bg-emerald-50 text-emerald-600">
                        {customer.contactNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaEnvelope size={15} />} label="Email" iconBg="bg-sky-50 text-sky-600">
                        {customer.email || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaIdCard size={15} />} label="Business Number" iconBg="bg-amber-50 text-amber-600">
                        {customer.businessNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaRoute size={15} />} label="Route" iconBg="bg-indigo-50 text-indigo-600">
                        {customer.route || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaMapMarkerAlt size={15} />} label="Address" iconBg="bg-rose-50 text-rose-600">
                        {customer.address || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaWallet size={15} />} label="Opening Balance" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">৳ {openingBalance}</span>
                    </InfoCard>

                    <InfoCard icon={<FaCreditCard size={15} />} label="Credit Limit" iconBg="bg-amber-50 text-amber-600">
                        <span className="text-amber-600">৳ {creditLimit}</span>
                    </InfoCard>

                    <InfoCard
                        icon={<FaClock size={15} />}
                        label="Created At"
                        iconBg="bg-indigo-50 text-indigo-600"
                        className="sm:col-span-2"
                    >
                        {customer.createdAt ? formatCreatedDate(customer.createdAt) : <NA />}
                    </InfoCard>
                </div>

                {/* Note Section */}
                <div className="bg-white rounded-xl border border-indigo-100 shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaStickyNote size={14} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Note</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[13px] text-gray-700 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {customer.note || <span className="text-gray-400 italic">No note available for this customer.</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomersDetails;