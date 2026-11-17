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
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const ALL_TABS = [
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

const TAB_MODULE = {
    daybook: 'account_report_daybook',
    cashbook: 'account_report_cashbook',
    mobilebanking: 'account_report_mobile',
    bank: 'account_report_bank',
    income: 'account_report_income',
    expense: 'account_report_expense',
    routeexpense: 'account_report_route_expense',
    transfer: 'account_report_transfer',
    topbuypay: 'account_report_top_buy',
    topsellproduct: 'account_report_top_sell',
    saleswiseprofit: 'account_report_sales_profit',
    overunderrate: 'account_report_over_under',
    dailystatement: 'account_report_daily_statement',
    incomestatement: 'account_report_income_statement',
};

const AccountReportAll = () => {
    const { clientUser } = useClientAuth();
    const TABS = ALL_TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const saved = sessionStorage.getItem('accountReportTab');
            return TABS.some((t) => t.key === saved) ? saved : (TABS[0]?.key || 'daybook');
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