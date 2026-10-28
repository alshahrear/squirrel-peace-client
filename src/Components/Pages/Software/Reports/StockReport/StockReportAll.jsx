import React, { useState, useEffect } from 'react';
import { FaBoxes, FaExclamationTriangle } from 'react-icons/fa';
import StockCurrentRepo from './StockCurrentRepo';
import StockDamageDailyRepo from './StockDamageDailyRepo';
import StockDamageSummeryRepo from './StockDamageSummeryRepo';
import StockDamReturnRepo from './StockDamReturnRepo';
import StockDamReturnSummeryRepo from './StockDamReturnSummeryRepo';

const TABS = [
    { key: 'currentstock', label: 'Current Stock', icon: FaBoxes },
    { key: 'damagedaily', label: 'Daily Damage Report', icon: FaExclamationTriangle },
    { key: 'damagesummery', label: 'Damage Summery', icon: FaExclamationTriangle },
    { key: 'damreturn', label: 'Damage Return Repo', icon: FaExclamationTriangle },
    { key: 'damreturnsummery', label: 'Damage Return Summery', icon: FaExclamationTriangle },
];

const StockReportAll = () => {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('stockReportTab') || 'currentstock';
        } catch (e) {
            return 'currentstock';
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem('stockReportTab', activeTab);
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
            {activeTab === 'currentstock' && <StockCurrentRepo />}
            {activeTab === 'damagedaily' && <StockDamageDailyRepo />}
            {activeTab === 'damagesummery' && <StockDamageSummeryRepo />}
            {activeTab === 'damreturn' && <StockDamReturnRepo />}
            {activeTab === 'damreturnsummery' && <StockDamReturnSummeryRepo />}
        </div>
    );
};

export default StockReportAll;