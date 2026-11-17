import React, { useState, useEffect } from 'react';
import { FaMoneyCheckAlt } from 'react-icons/fa';
import PurchaseAccountMon from './PurchaseAccountMon';
import PurchaseReturnAcMon from './PurchaseReturnAcMon';
import PurchaseBulkReturnAcMon from './PurchaseBulkReturnAcMon';
import PurchaseDamageReturnAcMon from './PurchaseDamageReturnAcMon';
import PurchaseCompanyDueAcMon from './PurchaseCompanyDueAcMon';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

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
        if (!activeTab) return;
        try {
            sessionStorage.setItem('accountPurchaseTab', activeTab);
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

            {activeTab === 'purchaseaccountmon' && <PurchaseAccountMon />}
            {activeTab === 'purchasereturnacmon' && <PurchaseReturnAcMon />}
            {activeTab === 'purchasebulkreturnacmon' && <PurchaseBulkReturnAcMon />}
            {activeTab === 'purchasedamagereturnacmon' && <PurchaseDamageReturnAcMon />}
            {activeTab === 'purchasecompanydueacmon' && <PurchaseCompanyDueAcMon />}
        </div>
    );
};

export default AccountPurchaseAll;