import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../../hooks/permissionConfig';

const TABS = [
    { key: 'purchase', path: '/stock-purchase', label: 'Stock Purchase', icon: '🧾' },
    { key: 'products', path: '/stock-products', label: 'Stock Products', icon: '📦' },
    { key: 'adjustment', path: '/stock-adjustment', label: 'Stock Adjustment', icon: '⚖️' },
    { key: 'alert', path: '/stock-alert', label: 'Stock Alert', icon: '🔔' },
];

const StockAll = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    // staff হলে শুধু যে tab এর View permission আছে সেগুলো দেখাবে
    const tabs = TABS.filter(
        (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path)
    );
    const matched = tabs.find((t) => t.path === location.pathname);
    const activeTab = matched ? matched.key : null;

    return (
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="overflow-x-auto pb-1">
                    <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => navigate(t.path)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === t.key
                                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                            >
                                <span>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Page */}
            <div>
                <Outlet />
            </div>
        </div>
    );
};

export default StockAll;