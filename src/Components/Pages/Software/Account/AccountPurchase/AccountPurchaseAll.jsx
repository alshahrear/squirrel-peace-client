import React, { useState, useEffect } from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import PurchaseAccountMon from './PurchaseAccountMon';

const TABS = [
    { key: 'purchaseaccountmon', label: 'Purchase Account', icon: FaMoneyCheckAlt },
];

const AccountPurchaseAll = () => {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('accountPurchaseTab') || 'purchaseaccountmon';
        } catch (e) {
            return 'purchaseaccountmon';
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem('accountPurchaseTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
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
            {activeTab === 'purchaseaccountmon' && <PurchaseAccountMon />}
        </div>
    );
};

export default AccountPurchaseAll;