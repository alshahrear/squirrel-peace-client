import React, { useState } from 'react';
import { FaFileInvoice, FaBoxes, FaCalendarAlt, FaClipboardList, FaTrophy, FaBook, FaUndoAlt } from 'react-icons/fa';
import PurchaseWiseRepo from './PurInvoiceWiseRepo';
import ProductWisePurchaseRepo from './PurProductWiseRepo';
import PurVsRecDateRepo from './PurVsRecDateRepo';
import PurVsRecSumRepo from './PurVsRecSumRepo';
import PurTopChartRepo from './PurTopChartRepo';
import PurCompanyLedgerRepo from './PurCompanyLedgerRepo';
import PurCompanyReturnRepo from './PurCompanyReturnRepo';


const TABS = [
    { key: 'purchase', label: 'Invoice Wise Purchase', icon: FaFileInvoice },
    { key: 'product', label: 'Product Wise Purchase', icon: FaBoxes },
    { key: 'purvsrec', label: 'Purchase & Receive Date Wise', icon: FaCalendarAlt },
    { key: 'purvsrecsum', label: 'Purchase vs Receive Summary', icon: FaClipboardList },
    { key: 'topchart', label: 'Purchase Top Chart', icon: FaTrophy },
    { key: 'ledger', label: 'Company Ledger', icon: FaBook },
    { key: 'purreturn', label: 'Purchase Return Report', icon: FaUndoAlt },
];

const PurchaseReportAll = () => {
    const [activeTab, setActiveTab] = useState('purchase');

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
            {activeTab === 'purchase' && <PurchaseWiseRepo />}
            {activeTab === 'product' && <ProductWisePurchaseRepo />}
            {activeTab === 'purvsrec' && <PurVsRecDateRepo />}
            {activeTab === 'purvsrecsum' && <PurVsRecSumRepo />}
            {activeTab === 'topchart' && <PurTopChartRepo />}
            {activeTab === 'ledger' && <PurCompanyLedgerRepo />}
            {activeTab === 'purreturn' && <PurCompanyReturnRepo />}
        </div>
    );
};

export default PurchaseReportAll;