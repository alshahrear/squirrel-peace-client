import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCan from '../../../../../hooks/useCan';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../../hooks/permissionConfig';

const STOCK_TABS = [
    { key: 'invoice', path: '/damage-stock-invoice', label: 'Damage Stock Invoice', icon: '🧾' },
    { key: 'singleInvoice', path: '/damage-stock-single-invoice', label: 'Damage Single Invoice', icon: '🗂️' },
    { key: 'products', path: '/damage-stock-products', label: 'Damage Stock Products', icon: '📦' },
];

const RETURN_TABS = [
    { key: 'returnInvoice', path: '/damage-return-invoice', label: 'Damage Return Invoice', icon: '↩️' },
    { key: 'returnProducts', path: '/damage-return-products', label: 'Damage Return Products', icon: '📋' },
];

const DamageAll = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clientUser } = useClientAuth();
    const addStock = useCan('damage_stock_invoice');
    const addReturn = useCan('damage_return_invoice');

    // staff হলে শুধু যে tab এর View permission আছে সেগুলো দেখাবে
    const canSee = (t) => !clientUser?.isStaff || canAccessPath(clientUser.permissions, t.path);
    const stockTabs = STOCK_TABS.filter(canSee);
    const returnTabs = RETURN_TABS.filter(canSee);
    const allTabs = [...stockTabs, ...returnTabs];
    const matched = allTabs.find((t) => t.path === location.pathname);
    const activeTab = matched ? matched.key : null;

    // /damage-products -> state.tab onujayi sothik tab e redirect
    useEffect(() => {
        if (location.pathname === '/damage-products') {
            const t =
                allTabs.find((x) => x.key === location.state?.tab) ||
                allTabs.find((x) => x.key === 'products') ||
                allTabs[0];
            if (t) navigate(t.path, { replace: true });
        }
        // eslint-disable-next-line
    }, [location.pathname]);

    const renderTab = (t, activeCls) => (
        <button
            key={t.key}
            type="button"
            onClick={() => navigate(t.path)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${activeTab === t.key
                ? activeCls
                : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
        >
            <span>{t.icon}</span>
            {t.label}
        </button>
    );

    return (
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 px-4">
                <button
                    type="button"
                    onClick={() => (addStock.canAdd ? navigate('/damage-add') : toast.error('আপনার Add করার অনুমতি নেই!'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-xs whitespace-nowrap shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                >
                    + New Damage
                </button>

                <div className="inline-flex flex-wrap items-center gap-0.5 p-1 rounded-xl bg-white border border-indigo-100 shadow-md">
                    {stockTabs.map((t) =>
                        renderTab(t, 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200')
                    )}
                    {stockTabs.length > 0 && returnTabs.length > 0 && <span className="w-px h-5 bg-indigo-100 mx-0.5" />}
                    {returnTabs.map((t) =>
                        renderTab(t, 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-200')
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => (addReturn.canAdd ? navigate('/damage-return-add') : toast.error('আপনার Add করার অনুমতি নেই!'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-semibold text-xs whitespace-nowrap shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                >
                    ↩ Return Damage
                </button>
            </div>

            {/* Active Page */}
            <div>
                <Outlet />
            </div>
        </div>
    );
};

export default DamageAll;