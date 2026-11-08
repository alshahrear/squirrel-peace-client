import React, { useState, useEffect } from 'react';
import { FaBook, FaMoneyBillWave, FaMobileAlt, FaUniversity, FaHandHoldingUsd, FaFileInvoiceDollar, FaRoute, FaExchangeAlt, FaTrophy, FaChartLine, FaCoins, FaBalanceScale, FaClipboardList, FaFileAlt } from 'react-icons/fa';
import AcDayBookRepo from './AcDayBookRepo';
import AcCashBookRepo from './AcCashBookRepo';
import AcMobileBankingRepo from './AcMobileBankingRepo';
import AcBankRepo from './AcBankRepo';
import AccountIncomeRepo from './AccountIncomeRepo';
import AccountExpenseRepo from './AccountExpenseRepo';
import AcRouteExpenseRepo from './AcRouteExpenseRepo';
import AcTransferRepo from './AcTransferRepo';
import AcTopBuyPayCustomers from './AcTopBuyPayCustomers';
import AcTopSellProductRepo from './AcTopSellProductRepo';
import AcSalesWiseProfitRepo from './AcSalesWiseProfitRepo';
import AcOverUnderRateRepo from './AcOverUnderRateRepo';
import AcDailyStatementRepo from './AcDailyStatementRepo';
import AcIncomeStatementRepo from './AcIncomeStatementRepo';

const TABS = [
    { key: 'daybook', label: 'Day Book', icon: FaBook },
    { key: 'cashbook', label: 'Cash Book', icon: FaMoneyBillWave },
    { key: 'mobilebanking', label: 'Mobile Banking', icon: FaMobileAlt },
    { key: 'bank', label: 'Bank', icon: FaUniversity },
    { key: 'income', label: 'Income', icon: FaHandHoldingUsd },
    { key: 'expense', label: 'Expense', icon: FaFileInvoiceDollar },
    { key: 'routeexpense', label: 'Route Expense', icon: FaRoute },
    { key: 'transfer', label: 'Transfer', icon: FaExchangeAlt },
    { key: 'topbuypay', label: 'Top Buy/Pay Customers', icon: FaTrophy },
    { key: 'topsellproduct', label: 'Top Sell Products', icon: FaChartLine },
    { key: 'saleswiseprofit', label: 'Sales Wise Profit', icon: FaCoins },
    { key: 'overunderrate', label: 'Over Rate & Under Rate', icon: FaBalanceScale },
    { key: 'dailystatement', label: 'Daily Statement', icon: FaClipboardList },
    { key: 'incomestatement', label: 'Income Statement', icon: FaFileAlt },
];

const AccountReportAll = () => {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('accountReportTab') || 'daybook';
        } catch (e) {
            return 'daybook';
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem('accountReportTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6">
                <div className="grid grid-cols-7 gap-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1.5">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
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
            {activeTab === 'daybook' && <AcDayBookRepo />}
            {activeTab === 'cashbook' && <AcCashBookRepo />}
            {activeTab === 'mobilebanking' && <AcMobileBankingRepo />}
            {activeTab === 'bank' && <AcBankRepo />}
            {activeTab === 'income' && <AccountIncomeRepo />}
            {activeTab === 'expense' && <AccountExpenseRepo />}
            {activeTab === 'routeexpense' && <AcRouteExpenseRepo />}
            {activeTab === 'transfer' && <AcTransferRepo />}
            {activeTab === 'topbuypay' && <AcTopBuyPayCustomers />}
            {activeTab === 'topsellproduct' && <AcTopSellProductRepo />}
            {activeTab === 'saleswiseprofit' && <AcSalesWiseProfitRepo />}
            {activeTab === 'overunderrate' && <AcOverUnderRateRepo />}
            {activeTab === 'dailystatement' && <AcDailyStatementRepo />}
            {activeTab === 'incomestatement' && <AcIncomeStatementRepo />}
        </div>
    );
};

export default AccountReportAll;