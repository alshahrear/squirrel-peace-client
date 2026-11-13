import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaStore, FaUndoAlt, FaLayerGroup, FaMoneyBillWave, FaBullseye } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';

const TABS = [
    { key: 'order', path: '/create-order', label: 'Create Order', icon: FaPlusCircle },
    { key: 'wholesale', path: '/wholesale', label: 'Wholesale', icon: FaStore },
    { key: 'return', path: '/sales-return', label: 'Sales Return', icon: FaUndoAlt },
    { key: 'bulk', path: '/sales-bulk-return', label: 'Bulk Return', icon: FaLayerGroup },
    { key: 'due', path: '/sales-due-payment', label: 'Due Payment', icon: FaMoneyBillWave },
    { key: 'target', path: '/sales-sr-target', label: 'SR Target', icon: FaBullseye },
];

const SalesAll = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    const tabs = TABS.filter(
        (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="overflow-x-auto pb-1">
                    <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                        {tabs.map((tab) => {
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

export default SalesAll;