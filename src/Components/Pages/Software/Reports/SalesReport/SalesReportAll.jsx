import React, { useState, useEffect } from 'react';
import { FaFileInvoice, FaBoxes, FaChartBar, FaListOl, FaBookOpen, FaUndoAlt, FaUserTag, FaTruck } from 'react-icons/fa';
import WholesalesRepo from './WholesalesRepo';
import SaleProductWiseRepo from './SaleProductWiseRepo';
import SaleDateWiseTopChart from './SaleDateWiseTopChart';
import SaleNetDeliveryRepo from './SaleNetDeliveryRepo';
import SalesTopSheet from './SalesTopSheet';
import SaleCustomerLedgerRepo from './SaleCustomerLedgerRepo';
import SaleCustomerReturnRepo from './SaleCustomerReturnRepo';
import SaleCustomerWiseInvoiceRepo from './SaleCustomerWiseInvoiceRepo';


const TABS = [
    { key: 'wholesales', label: 'Wholesales Report', icon: FaFileInvoice },
    { key: 'customerinvoice', label: 'Customer Invoice Summary', icon: FaUserTag },
    { key: 'productwise', label: 'Product Wise Sales', icon: FaBoxes },
    { key: 'datewisetop', label: 'Date Wise Top Chart', icon: FaChartBar },
    { key: 'netdelivery', label: 'Net Delivery', icon: FaTruck },
    { key: 'salestopsheet', label: 'Sales Top Sheet', icon: FaListOl },
    { key: 'customerledger', label: 'Customer Ledger', icon: FaBookOpen },
    { key: 'salesreturn', label: 'Sales Return Report', icon: FaUndoAlt },
];

const SalesReportAll = () => {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('salesReportTab') || 'wholesales';
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
            {activeTab === 'wholesales' && <WholesalesRepo />}
            {activeTab === 'customerinvoice' && <SaleCustomerWiseInvoiceRepo />}
            {activeTab === 'productwise' && <SaleProductWiseRepo />}
            {activeTab === 'datewisetop' && <SaleDateWiseTopChart />}
            {activeTab === 'netdelivery' && <SaleNetDeliveryRepo />}
            {activeTab === 'salestopsheet' && <SalesTopSheet />}
            {activeTab === 'customerledger' && <SaleCustomerLedgerRepo />}
            {activeTab === 'salesreturn' && <SaleCustomerReturnRepo />}
        </div>
    );
};

export default SalesReportAll;