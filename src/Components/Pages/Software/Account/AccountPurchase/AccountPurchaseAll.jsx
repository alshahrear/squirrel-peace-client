import React, { useState, useEffect } from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import PurchaseAccountMon from './PurchaseAccountMon';
import PurchaseReturnAcMon from './PurchaseReturnAcMon';
import PurchaseBulkReturnAcMon from './PurchaseBulkReturnAcMon';
import PurchaseDamageReturnAcMon from './PurchaseDamageReturnAcMon';
import PurchaseCompanyDueAcMon from './PurchaseCompanyDueAcMon';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';

const TABS = [
    { key: 'purchaseaccountmon', label: 'Purchase Account', icon: FaMoneyCheckAlt },
    { key: 'purchasereturnacmon', label: 'Purchase Return', icon: FaMoneyCheckAlt },
    { key: 'purchasebulkreturnacmon', label: 'Bulk Return', icon: FaMoneyCheckAlt },
    { key: 'purchasedamagereturnacmon', label: 'Damage Return', icon: FaMoneyCheckAlt },
    { key: 'purchasecompanydueacmon', label: 'Due Payment', icon: FaMoneyCheckAlt },
];

const TAB_MODULE = {
    purchaseaccountmon: 'account_purchase',
    purchasereturnacmon: 'account_purchase_return',
    purchasebulkreturnacmon: 'account_purchase_bulk_return',
    purchasedamagereturnacmon: 'account_purchase_damage_return',
    purchasecompanydueacmon: 'account_purchase_due',
};

const AccountPurchaseAll = () => {
    const { clientUser } = useClientAuth();
    const visibleTabs = TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [savedTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('accountPurchaseTab') || 'purchaseaccountmon';
        } catch (e) {
            return 'purchaseaccountmon';
        }
    });

    const activeTab = visibleTabs.some((t) => t.key === savedTab) ? savedTab : visibleTabs[0]?.key;

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
                    {visibleTabs.map((tab) => {
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
            {activeTab === 'purchasereturnacmon' && <PurchaseReturnAcMon />}
            {activeTab === 'purchasebulkreturnacmon' && <PurchaseBulkReturnAcMon />}
            {activeTab === 'purchasedamagereturnacmon' && <PurchaseDamageReturnAcMon />}
            {activeTab === 'purchasecompanydueacmon' && <PurchaseCompanyDueAcMon />}
        </div>
    );
};

export default AccountPurchaseAll;