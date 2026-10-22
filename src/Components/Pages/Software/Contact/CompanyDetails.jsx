import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaBuilding,
    FaPhoneAlt,
    FaEnvelope,
    FaUser,
    FaIdCard,
    FaMapMarkerAlt,
    FaStickyNote,
    FaClock,
    FaWallet,
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-indigo-50 text-indigo-600' }) => (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all px-3.5 py-3 flex items-center gap-3">
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

const CompanyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch('https://squirrel-peace-server.onrender.com/company', { cache: 'no-store' });
                const data = await res.json();
                const found = (Array.isArray(data) ? data : []).find((c) => String(c._id) === String(id));
                if (found) {
                    setCompany(found);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Error fetching company:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
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

    if (notFound || !company) {
        return (
            <div className="min-h-[60vh] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaBuilding size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Company Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">This company does not exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/company')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FaArrowLeft size={12} /> Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    const initials = (company.businessName || 'C')
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const balance = company.openingBalance ? Number(company.openingBalance).toLocaleString() : '0';

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 px-4 sm:px-5 lg:px-12">
            <div className="w-full space-y-4">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/company')}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-indigo-600 text-xs font-bold shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                    <FaArrowLeft size={11} /> Back to Companies
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
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white break-words leading-tight">
                                {company.businessName}
                            </h1>
                            <p className="text-indigo-100 text-xs mt-0.5">
                                Contact Person: {company.contactName || 'N/A'}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
                                {company.contactNumber && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'tel:' + company.contactNumber; }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaPhoneAlt size={10} /> {company.contactNumber}
                                    </button>
                                )}
                                {company.email && (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = 'mailto:' + company.email; }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                                    >
                                        <FaEnvelope size={10} /> {company.email}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaBuilding size={15} />} label="Business Name">
                        {company.businessName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaUser size={15} />} label="Contact Name" iconBg="bg-purple-50 text-purple-600">
                        {company.contactName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaPhoneAlt size={15} />} label="Contact Number" iconBg="bg-emerald-50 text-emerald-600">
                        {company.contactNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaEnvelope size={15} />} label="Email" iconBg="bg-sky-50 text-sky-600">
                        {company.email || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaIdCard size={15} />} label="Business Number" iconBg="bg-amber-50 text-amber-600">
                        {company.businessNumber || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaWallet size={15} />} label="Opening Balance" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">৳ {balance}</span>
                    </InfoCard>

                    <InfoCard icon={<FaMapMarkerAlt size={15} />} label="Address" iconBg="bg-rose-50 text-rose-600">
                        {company.address || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaClock size={15} />} label="Created At" iconBg="bg-indigo-50 text-indigo-600">
                        {company.createdAt || <NA />}
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
                        {company.note || <span className="text-gray-400 italic">No note available for this company.</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompanyDetails;