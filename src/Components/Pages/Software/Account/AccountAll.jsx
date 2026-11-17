import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaWallet, FaPiggyBank, FaTruck, FaStore } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';
import TabBar from '../../../../hooks/TabBar';

const TABS = [
    { key: 'balance', path: '/account-balance', label: 'Account Balance', icon: FaWallet, match: ['/account-balance'] },
    { key: 'investment', path: '/opening-investment', label: 'Investment', icon: FaPiggyBank, match: ['/opening-investment', '/income', '/expense', '/route-expense', '/transfer'] },
    { key: 'purchase', path: '/account-purchase', label: 'Purchase Account', icon: FaTruck, match: ['/account-purchase'] },
    { key: 'sales', path: '/account-sales', label: 'Sales Account', icon: FaStore, match: ['/account-sales'] },
];

const INSIDE = ['/opening-investment', '/income', '/expense', '/route-expense', '/transfer'];

const AccountAll = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();

    // staff হলে শুধু যে tab এর View permission আছে সেগুলো দেখাবে
    const tabs = TABS.map((t) => {
        if (t.key !== 'investment' || !clientUser?.isStaff) return t;
        const first = INSIDE.find((p) => canAccessPath(clientUser.permissions, p));
        return { ...t, path: first || t.path };
    })
        .filter((t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path))
        .map((t) => ({
            key: t.key,
            label: t.label,
            icon: t.icon,
            active: t.match.includes(location.pathname),
            onClick: () => navigate(t.path),
        }));

    return (
        <div>
            <TabBar tabs={tabs} />
            {children}
        </div>
    );
};

export default AccountAll;