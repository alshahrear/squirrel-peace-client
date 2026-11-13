import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaWallet, FaPiggyBank, FaTruck, FaStore } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';

const TABS = [
    { key: 'balance', path: '/account-balance', label: 'Account Balance', icon: FaWallet, match: ['/account-balance'] },
    { key: 'investment', path: '/opening-investment', label: 'Investment', icon: FaPiggyBank, match: ['/opening-investment', '/income', '/expense', '/route-expense', '/transfer'] },
    { key: 'purchase', path: '/account-purchase', label: 'Purchase Account', icon: FaTruck, match: ['/account-purchase'] },
    { key: 'sales', path: '/account-sales', label: 'Sales Account', icon: FaStore, match: ['/account-sales'] },
];

const AccountAll = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    // staff হলে শুধু যে tab এর View permission আছে সেগুলো দেখাবে
        const INSIDE = ['/opening-investment', '/income', '/expense', '/route-expense', '/transfer'];
    const tabs = TABS.map((t) => {
        if (t.key !== 'investment' || !clientUser?.isStaff) return t;
        const first = INSIDE.find((p) => canAccessPath(clientUser.permissions, p));
        return { ...t, path: first || t.path };
    }).filter(
        (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path)
    );

    return (
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="overflow-x-auto pb-1">
                    <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab.match.includes(location.pathname);
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => navigate(tab.path)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
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
            </div>

            {children}
        </div>
    );
};

export default AccountAll;