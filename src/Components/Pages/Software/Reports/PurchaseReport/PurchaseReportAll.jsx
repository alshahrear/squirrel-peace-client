import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaBoxes, FaCalendarAlt, FaClipboardList, FaTrophy, FaBook, FaUndoAlt, FaMoneyBillWave } from 'react-icons/fa';
import PurchaseWiseRepo from './PurInvoiceWiseRepo';
import ProductWisePurchaseRepo from './PurProductWiseRepo';
import PurVsRecDateRepo from './PurVsRecDateRepo';
import PurVsRecSumRepo from './PurVsRecSumRepo';
import PurTopChartRepo from './PurTopChartRepo';
import PurCompanyLedgerRepo from './PurCompanyLedgerRepo';
import PurCompanyDueRepo from './PurCompanyDueRepo';
import PurCompanyReturnRepo from './PurCompanyReturnRepo';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const ALL_TABS = [
    { key: 'purchase', label: 'Invoice Wise Purchase', icon: FaFileInvoice },
    { key: 'product', label: 'Product Wise Purchase', icon: FaBoxes },
    { key: 'purvsrec', label: 'Purchase & Receive Date Wise', icon: FaCalendarAlt },
    { key: 'purvsrecsum', label: 'Purchase vs Receive Summary', icon: FaClipboardList },
    { key: 'topchart', label: 'Purchase Top Chart', icon: FaTrophy },
    { key: 'ledger', label: 'Company Ledger', icon: FaBook },
    { key: 'purdue', label: 'Purchase Due Report', icon: FaMoneyBillWave },
    { key: 'purreturn', label: 'Purchase Return Report', icon: FaUndoAlt },
];

const TAB_MODULE = {
    purchase: 'purchase_report_invoice',
    product: 'purchase_report_product',
    purvsrec: 'purchase_report_vs_rec_date',
    purvsrecsum: 'purchase_report_vs_rec_sum',
    topchart: 'purchase_report_top_chart',
    ledger: 'purchase_report_ledger',
    purdue: 'purchase_report_due',
    purreturn: 'purchase_report_return',
};

const PurchaseReportAll = () => {
    const { clientUser } = useClientAuth();
    const TABS = ALL_TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [activeTab, setActiveTab] = useState(
        () => {
            const s = sessionStorage.getItem('purchaseReportActiveTab');
            return TABS.some((t) => t.key === s) ? s : TABS[0]?.key || 'purchase';
        }
    );

    useEffect(() => {
        sessionStorage.setItem('purchaseReportActiveTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        const clearTab = () => sessionStorage.removeItem('purchaseReportActiveTab');
        return clearTab;
    }, []);

    useEffect(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const isReload = nav && nav.type === 'reload';
        if (!isReload && !sessionStorage.getItem('purchaseReportMounted')) {
            sessionStorage.setItem('purchaseReportActiveTab', TABS[0]?.key || 'purchase');
            setActiveTab(TABS[0]?.key || 'purchase');
        }
        sessionStorage.setItem('purchaseReportMounted', '1');
        return () => sessionStorage.removeItem('purchaseReportMounted');
    }, []);

    const tabs = TABS.map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        active: activeTab === t.key,
        onClick: () => setActiveTab(t.key),
    }));

    return (
        <div>
            <TabBar tabs={tabs} wrap />

            {activeTab === 'purchase' && <PurchaseWiseRepo />}
            {activeTab === 'product' && <ProductWisePurchaseRepo />}
            {activeTab === 'purvsrec' && <PurVsRecDateRepo />}
            {activeTab === 'purvsrecsum' && <PurVsRecSumRepo />}
            {activeTab === 'topchart' && <PurTopChartRepo />}
            {activeTab === 'ledger' && <PurCompanyLedgerRepo />}
            {activeTab === 'purdue' && <PurCompanyDueRepo />}
            {activeTab === 'purreturn' && <PurCompanyReturnRepo />}
        </div>
    );
};

export default PurchaseReportAll;