import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaUserShield, FaShieldAlt } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../hooks/permissionConfig';

const TABS = [
    { key: 'user', path: '/user', label: 'All User', icon: FaUsers, module: 'user_list' },
    { key: 'assign', path: '/user-assign', label: 'User Assign', icon: FaUserShield, module: 'user_assign' },
    { key: 'role', path: '/user-role', label: 'All Role', icon: FaShieldAlt, module: 'user_role' },
];

const UserAll = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    // staff হলে শুধু View permission আছে এমন tab দেখাবে, dealer সব দেখবে
    const visibleTabs = clientUser?.isStaff
        ? TABS.filter((t) => hasAction(clientUser.permissions, t.module, 'get'))
        : TABS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="overflow-x-auto pb-1">
                    <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                        {visibleTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = location.pathname === tab.path;
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

export default UserAll;