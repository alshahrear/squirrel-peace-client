import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaWallet, FaReceipt, FaRoute, FaExchangeAlt } from 'react-icons/fa';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const TABS = [
    { key: 'openinginvestment', path: '/opening-investment', label: 'Opening Investment', icon: FaWallet },
    { key: 'income', path: '/income', label: 'Income', icon: FaMoneyBillWave },
    { key: 'expense', path: '/expense', label: 'Expense', icon: FaReceipt },
    { key: 'routeexpense', path: '/route-expense', label: 'Route Expense', icon: FaRoute },
    { key: 'transfer', path: '/transfer', label: 'Transfer', icon: FaExchangeAlt },
];

const AccountInsideAll = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    const tabs = TABS.filter(
        (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path)
    ).map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        active: location.pathname === t.path,
        onClick: () => navigate(t.path),
    }));

    return (
        <div>
            <TabBar tabs={tabs} />
            <Outlet />
        </div>
    );
};

export default AccountInsideAll;