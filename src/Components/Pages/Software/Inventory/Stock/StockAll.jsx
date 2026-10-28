import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const TABS = [
    { key: 'products', path: '/stock-products', label: 'Stock Products', icon: '📦' },
    { key: 'purchase', path: '/stock-purchase', label: 'Stock Purchase', icon: '🧾' },
    { key: 'adjustment', path: '/stock-adjustment', label: 'Stock Adjustment', icon: '⚖️' },
    { key: 'alert', path: '/stock-alert', label: 'Stock Alert', icon: '🔔' },
];

const StockAll = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const matched = TABS.find((t) => t.path === location.pathname);
    const activeTab = matched ? matched.key : null;

    return (
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="flex justify-center pt-6 px-4">
                <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-indigo-100 shadow-md">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => navigate(t.path)}
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === t.key
                                ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200'
                                : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
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