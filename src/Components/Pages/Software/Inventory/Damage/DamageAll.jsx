import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCan from '../../../../../hooks/useCan';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { canAccessPath } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

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

    const SHORT_LABEL = {
        invoice: 'Stock Invoice',
        singleInvoice: 'Single Invoice',
        products: 'Stock Products',
        returnInvoice: 'Return Invoice',
        returnProducts: 'Return Products',
    };

    const toItem = (t, tone) => ({
        key: t.key,
        label: SHORT_LABEL[t.key] || t.label,
        icon: t.icon,
        tone,
        active: location.pathname === t.path,
        onClick: () => navigate(t.path),
    });

    const tabs = [
        ...stockTabs.map((t) => toItem(t, 'brand')),
        ...(stockTabs.length > 0 && returnTabs.length > 0 ? [{ key: 'sep', divider: true }] : []),
        ...returnTabs.map((t) => toItem(t, 'rose')),
    ];

    return (
        <div>
            <div className="max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 pt-3 sm:pt-5">
                <div className="grid grid-cols-2 lg:flex lg:flex-nowrap items-center gap-2 lg:gap-3">
                    <button
                        type="button"
                        onClick={() => (addStock.canAdd ? navigate('/damage-add') : toast.error('আপনার Add করার অনুমতি নেই!'))}
                        className="order-2 lg:order-1 min-h-[38px] px-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer lg:shrink-0"
                    >
                        + New Damage
                    </button>

                    <div className="order-1 lg:order-2 col-span-2 lg:col-span-1 w-full lg:w-auto lg:flex-1 min-w-0">
                        <TabBar tabs={tabs} bare align="center" />
                    </div>

                    <button
                        type="button"
                        onClick={() => (addReturn.canAdd ? navigate('/damage-return-add') : toast.error('আপনার Add করার অনুমতি নেই!'))}
                        className="order-3 lg:order-3 min-h-[38px] px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer lg:shrink-0"
                    >
                        ↩ Return Damage
                    </button>
                </div>
            </div>

            <Outlet />
        </div>
    );
};

export default DamageAll;