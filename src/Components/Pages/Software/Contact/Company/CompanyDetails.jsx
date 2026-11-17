import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaBuilding, FaPhoneAlt, FaEnvelope, FaUser, FaIdCard,
    FaMapMarkerAlt, FaStickyNote, FaClock, FaWallet,
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-brand-50 text-brand-600' }) => (
    <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 transition hover:border-brand-200">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">{label}</p>
            <div className="text-sm font-semibold text-slate-800 break-words">{children}</div>
        </div>
    </div>
);

const NA = () => <span className="text-slate-400 italic font-normal">N/A</span>;

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

const DetailsSkeleton = () => (
    <div className="min-h-screen p-3 sm:p-5 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4 animate-pulse" aria-busy="true">
            <div className="h-9 w-40 rounded-full bg-white/70"></div>
            <div className="h-36 rounded-3xl bg-white/70"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/70"></div>)}
            </div>
        </div>
    </div>
);

const CompanyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch('http://localhost:5000/company', { cache: 'no-store' });
                const data = await res.json();
                const found = (Array.isArray(data) ? data : []).find((c) => String(c._id) === String(id));
                if (found) setCompany(found);
                else setNotFound(true);
            } catch (error) {
                console.error('Error fetching company:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    if (loading) return <DetailsSkeleton />;

    if (notFound || !company) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaBuilding size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Company Not Found</h2>
                    <p className="text-sm text-slate-500 mb-6">This company does not exist or has been deleted.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/company')}
                        className="inline-flex items-center justify-center gap-2 min-h-[42px] px-6 bg-brand-600 text-white text-sm font-semibold cursor-pointer"
                    >
                        <FaArrowLeft size={12} /> Back to Companies
                    </button>
                </div>
            </div>
        );
    }

    const initials = (company.businessName || 'C').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const balance = company.openingBalance ? Number(company.openingBalance).toLocaleString() : '0';

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-6xl mx-auto space-y-4">
                <button
                    type="button"
                    onClick={() => navigate('/company')}
                    className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full bg-white text-brand-700 text-xs font-bold border border-slate-200 hover:bg-brand-50 transition cursor-pointer"
                >
                    <FaArrowLeft size={11} /> Back to Companies
                </button>

                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 px-5 py-6 sm:px-8 sm:py-7">
                    <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-3xl font-extrabold text-white break-words leading-tight">{company.businessName}</h1>
                            <p className="text-brand-100 text-sm mt-1">Contact Person: {company.contactName || 'N/A'}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                {company.contactNumber && (
                                    <a href={'tel:' + company.contactNumber} className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition">
                                        <FaPhoneAlt size={10} /> {company.contactNumber}
                                    </a>
                                )}
                                {company.email && (
                                    <a href={'mailto:' + company.email} className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition break-all">
                                        <FaEnvelope size={10} /> {company.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaBuilding size={15} />} label="Business Name">{company.businessName || <NA />}</InfoCard>
                    <InfoCard icon={<FaUser size={15} />} label="Contact Name" iconBg="bg-violet-50 text-violet-600">{company.contactName || <NA />}</InfoCard>
                    <InfoCard icon={<FaPhoneAlt size={15} />} label="Contact Number" iconBg="bg-emerald-50 text-emerald-600">{company.contactNumber || <NA />}</InfoCard>
                    <InfoCard icon={<FaEnvelope size={15} />} label="Email" iconBg="bg-sky-50 text-sky-600">{company.email || <NA />}</InfoCard>
                    <InfoCard icon={<FaIdCard size={15} />} label="Business Number" iconBg="bg-amber-50 text-amber-600">{company.businessNumber || <NA />}</InfoCard>
                    <InfoCard icon={<FaWallet size={15} />} label="Opening Balance" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">৳ {balance}</span>
                        {company.openingBalanceType && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${company.openingBalanceType === 'Get' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {company.openingBalanceType}
                            </span>
                        )}
                    </InfoCard>
                    <InfoCard icon={<FaMapMarkerAlt size={15} />} label="Address" iconBg="bg-rose-50 text-rose-600">{company.address || <NA />}</InfoCard>
                    <InfoCard icon={<FaClock size={15} />} label="Created At">{company.createdAt ? formatCreatedDate(company.createdAt) : <NA />}</InfoCard>
                </div>

                {/* Note */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><FaStickyNote size={14} /></div>
                        <h3 className="text-sm font-bold text-slate-800">Note</h3>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {company.note || <span className="text-slate-400 italic">No note available for this company.</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetails;