import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaTags, FaRuler } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';

const TABS = [
    { key: 'product', path: '/product', label: 'Products', icon: FaBoxOpen },
    { key: 'category', path: '/category', label: 'Category', icon: FaTags },
    { key: 'units', path: '/units', label: 'Units', icon: FaRuler },
];

const ProductAll = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    const tabs = TABS.filter(
        (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path)
    );

    return (
        <div className="min-h-screen">
            <div className="max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 pt-3 sm:pt-5">
                <div className="overflow-x-auto pb-1 -mx-1 px-1">
                    <nav aria-label="Product tabs" className="inline-flex gap-1 bg-white rounded-2xl border border-slate-200 p-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = location.pathname === tab.path;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    aria-current={isActive ? 'page' : undefined}
                                    onClick={() => navigate(tab.path)}
                                    className={`flex items-center gap-2 px-4 min-h-[40px] text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap rounded-full ${isActive
                                        ? 'bg-brand-600 text-white'
                                        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                                        }`}
                                >
                                    <Icon size={13} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {children}
        </div>
    );
};

export default ProductAll;