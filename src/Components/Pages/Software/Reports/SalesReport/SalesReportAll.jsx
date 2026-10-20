import React, { useState } from 'react';
import { FaFileInvoice, FaBoxes, FaChartBar, FaRoute, FaListOl, FaBookOpen } from 'react-icons/fa';
import WholesalesRepo from './WholesalesRepo';
import SaleProductWiseRepo from './SaleProductWiseRepo';
import SaleDateWiseTopChart from './SaleDateWiseTopChart';
import RouteWiseTopChart from './RouteWiseTopChart';
import SalesTopSheet from './SalesTopSheet';
import SaleCustomerLedgerRepo from './SaleCustomerLedgerRepo';


const TABS = [
    { key: 'wholesales', label: 'Wholesales Report', icon: FaFileInvoice },
    { key: 'productwise', label: 'Product Wise Sales', icon: FaBoxes },
    { key: 'datewisetop', label: 'Date Wise Top Chart', icon: FaChartBar },
    { key: 'routewisetop', label: 'Route Wise Top Chart', icon: FaRoute },
    { key: 'salestopsheet', label: 'Sales Top Sheet', icon: FaListOl },
    { key: 'customerledger', label: 'Customer Ledger', icon: FaBookOpen },
];

const SalesReportAll = () => {
    const [activeTab, setActiveTab] = useState('wholesales');

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
            {activeTab === 'productwise' && <SaleProductWiseRepo />}
            {activeTab === 'datewisetop' && <SaleDateWiseTopChart />}
            {activeTab === 'routewisetop' && <RouteWiseTopChart />}
            {activeTab === 'salestopsheet' && <SalesTopSheet />}
            {activeTab === 'customerledger' && <SaleCustomerLedgerRepo />}
        </div>
    );
};

export default SalesReportAll;