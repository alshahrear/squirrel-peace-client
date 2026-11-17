import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBuilding, FaBalanceScale, FaStore, FaUserCheck, FaRoute } from 'react-icons/fa';
import { useClientAuth } from '../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../hooks/permissionConfig';
import TabBar from '../../../../hooks/TabBar';

const TABS = [
    { key: 'company', path: '/company', label: 'Company', icon: FaBuilding },
    { key: 'companyaccount', path: '/company-account', label: 'Company Account', icon: FaBalanceScale },
    { key: 'customers', path: '/customers', label: 'Customers', icon: FaStore },
    { key: 'customeraccount', path: '/customer-account', label: 'Customer Account', icon: FaUserCheck },
    { key: 'routes', path: '/routes', label: 'Route', icon: FaRoute },
];

const ContactAll = ({ children }) => {
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

export default ContactAll;