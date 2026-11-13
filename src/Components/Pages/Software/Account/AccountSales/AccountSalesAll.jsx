import React, { useState, useEffect } from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import AccountWholesaleMon from './AccountWholesaleMon';
import SalesReturnAcMon from './SalesReturnAcMon';
import SalesBulkReturnAcMon from './SalesBulkReturnAcMon';
import SalesDamageReturnAcMon from './SalesDamageReturnAcMon';
import SalesCustomerDueAcMon from './SalesCustomerDueAcMon';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';

const TABS = [
    { key: 'accountwholesalemon', label: 'Wholesale Account', icon: FaMoneyCheckAlt },
    { key: 'salesreturnacmon', label: 'Sales Return', icon: FaMoneyCheckAlt },
    { key: 'salesbulkreturnacmon', label: 'Sales Bulk Return', icon: FaMoneyCheckAlt },
    { key: 'salesdamagereturnacmon', label: 'Sales Damage Return', icon: FaMoneyCheckAlt },
    { key: 'salescustomerdueacmon', label: 'Due Payment', icon: FaMoneyCheckAlt },
];

const TAB_MODULE = {
    accountwholesalemon: 'account_sales',
    salesreturnacmon: 'account_sales_return',
    salesbulkreturnacmon: 'account_sales_bulk_return',
    salesdamagereturnacmon: 'account_sales_damage_return',
    salescustomerdueacmon: 'account_sales_due',
};

const AccountSalesAll = () => {
    const { clientUser } = useClientAuth();
    const visibleTabs = TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [savedTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('accountSalesTab') || 'accountwholesalemon';
        } catch (e) {
            return 'accountwholesalemon';
        }
    });

    const activeTab = visibleTabs.some((t) => t.key === savedTab) ? savedTab : visibleTabs[0]?.key;

    useEffect(() => {
        try {
            sessionStorage.setItem('accountSalesTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
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

            {activeTab === 'accountwholesalemon' && <AccountWholesaleMon />}
            {activeTab === 'salesreturnacmon' && <SalesReturnAcMon />}
            {activeTab === 'salesbulkreturnacmon' && <SalesBulkReturnAcMon />}
            {activeTab === 'salesdamagereturnacmon' && <SalesDamageReturnAcMon />}
            {activeTab === 'salescustomerdueacmon' && <SalesCustomerDueAcMon />}
        </div>
    );
};

export default AccountSalesAll;