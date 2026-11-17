import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaFileInvoice, FaUndoAlt, FaLayerGroup, FaMoneyBillWave } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';
import TabBar from '../../../../hooks/TabBar';

const TABS = [
    { key: 'add', path: '/add-purchase', label: 'Add Purchase', icon: FaPlusCircle },
    { key: 'purchase', path: '/purchase', label: 'All Purchase', icon: FaFileInvoice },
    { key: 'return', path: '/purchase-return', label: 'Purchase Return', icon: FaUndoAlt },
    { key: 'bulk', path: '/purchase-bulk-return', label: 'Bulk Return', icon: FaLayerGroup },
    { key: 'due', path: '/purchase-due-payment', label: 'Due Payment', icon: FaMoneyBillWave },
];

const PurchaseAll = ({ children }) => {
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

export default PurchaseAll;