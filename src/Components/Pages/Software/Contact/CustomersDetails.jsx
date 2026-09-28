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

const InfoCard = ({ icon, label, children, iconBg = 'bg-indigo-50 text-indigo-600' }) => (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-md hover:shadow-xl transition-all p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <div className="text-sm font-semibold text-gray-800 break-words">{children}</div>
        </div>
    </div>
);

const NA = () => <span className="text-gray-400 italic font-normal">N/A</span>;

const CustomersDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const res = await fetch('http://localhost:5000/customer');
                const data = await res.json();
                const found = data.find((c) => c._id === id);
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-indigo-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !customer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
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
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const isWholesale = customer.customerType === 'Wholesale Customer';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/customers')}
                    className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white text-indigo-600 text-sm font-bold shadow-md border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                    <FaArrowLeft size={12} /> Back to Customers
                </button>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-2xl p-6 sm:p-8 mb-8">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/10 rounded-full"></div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${isWholesale ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {customer.customerType || 'Wholesale Customer'}
                                </span>
                                {customer.route && (
                                    <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                                        Route: {customer.route}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white break-words">
                                {customer.businessName}
                            </h1>
                            <p className="text-indigo-100 text-sm mt-1">
                                Contact Person: {customer.contactName || 'N/A'}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                                {customer.contactNumber && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'tel:' + customer.contactNumber; }}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaPhoneAlt size={11} /> {customer.contactNumber}
                                    </button>
                                )}
                                {customer.email && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'mailto:' + customer.email; }}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaEnvelope size={11} /> {customer.email}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Balance Badges */}
                        <div className="flex sm:flex-col gap-3">
                            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Opening Balance</p>
                                <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                                    ৳ {customer.openingBalance ? Number(customer.openingBalance).toLocaleString() : '0'}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Credit Limit</p>
                                <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                                    ৳ {customer.creditLimit ? Number(customer.creditLimit).toLocaleString() : '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoCard icon={<FaUserTag size={18} />} label="Customer Type" iconBg="bg-purple-50 text-purple-600">
                        {customer.customerType || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaStore size={18} />} label="Business Name">
                        {customer.businessName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaUser size={18} />} label="Contact Name" iconBg="bg-purple-50 text-purple-600">
                        {customer.contactName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaPhoneAlt size={18} />} label="Contact Number" iconBg="bg-emerald-50 text-emerald-600">
                        {customer.contactNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaEnvelope size={18} />} label="Email" iconBg="bg-sky-50 text-sky-600">
                        {customer.email || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaIdCard size={18} />} label="Business Number" iconBg="bg-amber-50 text-amber-600">
                        {customer.businessNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaRoute size={18} />} label="Route" iconBg="bg-indigo-50 text-indigo-600">
                        {customer.route || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaMapMarkerAlt size={18} />} label="Address" iconBg="bg-rose-50 text-rose-600">
                        {customer.address || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaWallet size={18} />} label="Opening Balance" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">
                            ৳ {customer.openingBalance ? Number(customer.openingBalance).toLocaleString() : '0'}
                        </span>
                    </InfoCard>

                    <InfoCard icon={<FaCreditCard size={18} />} label="Credit Limit" iconBg="bg-amber-50 text-amber-600">
                        <span className="text-amber-600">
                            ৳ {customer.creditLimit ? Number(customer.creditLimit).toLocaleString() : '0'}
                        </span>
                    </InfoCard>

                    <div className="md:col-span-2">
                        <InfoCard icon={<FaClock size={18} />} label="Created At" iconBg="bg-indigo-50 text-indigo-600">
                            {customer.createdAt || <NA />}
                        </InfoCard>
                    </div>
                </div>

                {/* Note Section */}
                <div className="mt-5 bg-white rounded-2xl border border-indigo-100 shadow-md p-5">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaStickyNote size={18} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">Note</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                        {customer.note || <span className="text-gray-400 italic">No note available for this customer.</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomersDetails;