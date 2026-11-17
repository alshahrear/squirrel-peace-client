import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaBoxes, FaChartBar, FaListOl, FaBookOpen, FaUndoAlt, FaUserTag, FaTruck, FaMoneyBillWave, FaUserTie, FaCalendarDay } from 'react-icons/fa';
import WholesalesRepo from './WholesalesRepo';
import SaleProductWiseRepo from './SaleProductWiseRepo';
import SaleDateWiseTopChart from './SaleDateWiseTopChart';
import SaleNetDeliveryRepo from './SaleNetDeliveryRepo';
import SalesTopSheet from './SalesTopSheet';
import SaleCustomerLedgerRepo from './SaleCustomerLedgerRepo';
import SaleCustomerDueRepo from './SaleCustomerDueRepo';
import SaleSrDsrDueRepo from './SaleSrDsrDueRepo';
import SaleCustomerReturnRepo from './SaleCustomerReturnRepo';
import SaleCustomerWiseInvoiceRepo from './SaleCustomerWiseInvoiceRepo';
import SaleTodaysOrder from './SaleTodaysOrder';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const ALL_TABS = [
    { key: 'wholesales', label: 'Wholesales Report', icon: FaFileInvoice },
    { key: 'todaysale', label: 'Todays Sale', icon: FaCalendarDay },
    { key: 'customerinvoice', label: 'Customer Invoice Summary', icon: FaUserTag },
    { key: 'productwise', label: 'Product Wise Sales', icon: FaBoxes },
    { key: 'datewisetop', label: 'Date Wise Top Chart', icon: FaChartBar },
    { key: 'netdelivery', label: 'Net Delivery', icon: FaTruck },
    { key: 'salestopsheet', label: 'Sales Top Sheet', icon: FaListOl },
    { key: 'customerledger', label: 'Customer Ledger', icon: FaBookOpen },
    { key: 'customerdue', label: 'Customer Due Report', icon: FaMoneyBillWave },
    { key: 'srdsrdue', label: 'SR & DSR Due Report', icon: FaUserTie },
    { key: 'salesreturn', label: 'Sales Return Report', icon: FaUndoAlt },
];

const TAB_MODULE = {
    wholesales: 'sales_report_wholesales',
    todaysale: 'sales_report_todays',
    customerinvoice: 'sales_report_customer_invoice',
    productwise: 'sales_report_product_wise',
    datewisetop: 'sales_report_date_top',
    netdelivery: 'sales_report_net_delivery',
    salestopsheet: 'sales_report_top_sheet',
    customerledger: 'sales_report_customer_ledger',
    customerdue: 'sales_report_customer_due',
    srdsrdue: 'sales_report_sr_dsr_due',
    salesreturn: 'sales_report_return',
};

const SalesReportAll = () => {
    const { clientUser } = useClientAuth();
    const TABS = ALL_TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const saved = sessionStorage.getItem('salesReportTab');
            return TABS.some((t) => t.key === saved) ? saved : (TABS[0]?.key || 'wholesales');
        } catch (e) {
            return 'wholesales';
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem('salesReportTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

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

            {activeTab === 'wholesales' && <WholesalesRepo />}
            {activeTab === 'todaysale' && <SaleTodaysOrder />}
            {activeTab === 'customerinvoice' && <SaleCustomerWiseInvoiceRepo />}
            {activeTab === 'productwise' && <SaleProductWiseRepo />}
            {activeTab === 'datewisetop' && <SaleDateWiseTopChart />}
            {activeTab === 'netdelivery' && <SaleNetDeliveryRepo />}
            {activeTab === 'salestopsheet' && <SalesTopSheet />}
            {activeTab === 'customerledger' && <SaleCustomerLedgerRepo />}
            {activeTab === 'customerdue' && <SaleCustomerDueRepo />}
            {activeTab === 'srdsrdue' && <SaleSrDsrDueRepo />}
            {activeTab === 'salesreturn' && <SaleCustomerReturnRepo />}
        </div>
    );
};

export default SalesReportAll;