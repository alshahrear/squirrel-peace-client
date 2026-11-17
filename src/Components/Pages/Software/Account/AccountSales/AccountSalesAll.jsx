import React, { useState, useEffect } from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import AccountWholesaleMon from './AccountWholesaleMon';
import SalesReturnAcMon from './SalesReturnAcMon';
import SalesBulkReturnAcMon from './SalesBulkReturnAcMon';
import SalesDamageReturnAcMon from './SalesDamageReturnAcMon';
import SalesCustomerDueAcMon from './SalesCustomerDueAcMon';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

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
        if (!activeTab) return;
        try {
            sessionStorage.setItem('accountSalesTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    const tabs = visibleTabs.map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        active: activeTab === t.key,
        onClick: () => setActiveTab(t.key),
    }));

    return (
        <div>
            <TabBar tabs={tabs} />

            {activeTab === 'accountwholesalemon' && <AccountWholesaleMon />}
            {activeTab === 'salesreturnacmon' && <SalesReturnAcMon />}
            {activeTab === 'salesbulkreturnacmon' && <SalesBulkReturnAcMon />}
            {activeTab === 'salesdamagereturnacmon' && <SalesDamageReturnAcMon />}
            {activeTab === 'salescustomerdueacmon' && <SalesCustomerDueAcMon />}
        </div>
    );
};

export default AccountSalesAll;