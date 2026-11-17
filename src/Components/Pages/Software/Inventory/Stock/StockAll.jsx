import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const TABS = [
    { key: 'purchase', path: '/stock-purchase', label: 'Stock Purchase', icon: '🧾' },
    { key: 'products', path: '/stock-products', label: 'Stock Products', icon: '📦' },
    { key: 'adjustment', path: '/stock-adjustment', label: 'Stock Adjustment', icon: '⚖️' },
    { key: 'alert', path: '/stock-alert', label: 'Stock Alert', icon: '🔔' },
];

const StockAll = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    // staff হলে শুধু যে tab এর View permission আছে সেগুলো দেখাবে
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

export default StockAll;