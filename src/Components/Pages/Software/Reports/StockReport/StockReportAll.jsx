import React, { useState, useEffect } from 'react';
import { FaBoxes, FaExclamationTriangle } from 'react-icons/fa';
import StockCurrentRepo from './StockCurrentRepo';
import StockDamageDailyRepo from './StockDamageDailyRepo';
import StockDamageSummeryRepo from './StockDamageSummeryRepo';
import StockDamReturnRepo from './StockDamReturnRepo';
import StockDamReturnSummeryRepo from './StockDamReturnSummeryRepo';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const ALL_TABS = [
    { key: 'currentstock', label: 'Current Stock', icon: FaBoxes },
    { key: 'damagedaily', label: 'Daily Damage Report', icon: FaExclamationTriangle },
    { key: 'damagesummery', label: 'Damage Summery', icon: FaExclamationTriangle },
    { key: 'damreturn', label: 'Damage Return Repo', icon: FaExclamationTriangle },
    { key: 'damreturnsummery', label: 'Damage Return Summery', icon: FaExclamationTriangle },
];

const TAB_MODULE = {
    currentstock: 'stock_report_current',
    damagedaily: 'stock_report_damage_daily',
    damagesummery: 'stock_report_damage_summery',
    damreturn: 'stock_report_dam_return',
    damreturnsummery: 'stock_report_dam_return_summery',
};

const StockReportAll = () => {
    const { clientUser } = useClientAuth();
    const TABS = ALL_TABS.filter(
        (t) => !clientUser?.isStaff || hasAction(clientUser.permissions, TAB_MODULE[t.key], 'get')
    );
    const [activeTab, setActiveTab] = useState(() => {
        try {
            const saved = sessionStorage.getItem('stockReportTab');
            return TABS.some((t) => t.key === saved) ? saved : (TABS[0]?.key || 'currentstock');
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

            {activeTab === 'currentstock' && <StockCurrentRepo />}
            {activeTab === 'damagedaily' && <StockDamageDailyRepo />}
            {activeTab === 'damagesummery' && <StockDamageSummeryRepo />}
            {activeTab === 'damreturn' && <StockDamReturnRepo />}
            {activeTab === 'damreturnsummery' && <StockDamReturnSummeryRepo />}
        </div>
    );
};

export default StockReportAll;