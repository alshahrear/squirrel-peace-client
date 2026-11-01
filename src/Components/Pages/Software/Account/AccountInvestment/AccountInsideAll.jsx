import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaWallet, FaReceipt, FaRoute, FaExchangeAlt, FaSitemap } from 'react-icons/fa';

const TABS = [
    { key: 'openinginvestment', path: '/opening-investment', label: 'Opening Investment', icon: FaWallet },
    { key: 'income', path: '/income', label: 'Income', icon: FaMoneyBillWave },
    { key: 'expense', path: '/expense', label: 'Expense', icon: FaReceipt },
    { key: 'routeexpense', path: '/route-expense', label: 'Route Expense', icon: FaRoute },
    { key: 'transfer', path: '/transfer', label: 'Transfer', icon: FaExchangeAlt },
    { key: 'accountheads', path: '/account-heads', label: 'Account Heads', icon: FaSitemap },
];

const AccountInsideAll = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = location.pathname === tab.path;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => navigate(tab.path)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                            >
                                <Icon size={11} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <Outlet />
        </div>
    );
};

export default AccountInsideAll;