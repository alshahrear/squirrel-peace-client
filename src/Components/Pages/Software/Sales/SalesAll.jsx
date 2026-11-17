import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaStore, FaUndoAlt, FaLayerGroup, FaMoneyBillWave, FaBullseye } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';
import TabBar from '../../../../hooks/TabBar';

const TABS = [
    { key: 'order', path: '/create-order', label: 'Create Order', icon: FaPlusCircle },
    { key: 'wholesale', path: '/wholesale', label: 'Wholesale', icon: FaStore },
    { key: 'return', path: '/sales-return', label: 'Sales Return', icon: FaUndoAlt },
    { key: 'bulk', path: '/sales-bulk-return', label: 'Bulk Return', icon: FaLayerGroup },
    { key: 'due', path: '/sales-due-payment', label: 'Due Payment', icon: FaMoneyBillWave },
    { key: 'target', path: '/sales-sr-target', label: 'SR Target', icon: FaBullseye },
];

const SalesAll = ({ children }) => {
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
            {children}
        </div>
    );
};

export default SalesAll;