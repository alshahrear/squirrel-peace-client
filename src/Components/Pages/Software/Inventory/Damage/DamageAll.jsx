import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DamageProducts from './DamageStockProducts';
import DamageInvoice from './DamageStockInvoice';
import DamageReturnInvoice from './DamageReturnInvoice';
import DamageReturnProducts from './DamageReturnProducts';

const STOCK_TABS = [
    { key: 'invoice', label: 'Damage Stock Invoice', icon: '🧾' },
    { key: 'products', label: 'Damage Stock Products', icon: '📦' },
];

const RETURN_TABS = [
    { key: 'returnInvoice', label: 'Damage Return Invoice', icon: '↩️' },
    { key: 'returnProducts', label: 'Damage Return Products', icon: '📋' },
];

const DamageAll = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'products');
    const [focusEvent, setFocusEvent] = useState(null);

    // History theke Open: Stock In -> Damage Stock Invoice, Stock Out -> Damage Return Invoice
    const handleOpenHistory = (e) => {
        setFocusEvent(e);
        setActiveTab(e.type === 'in' ? 'invoice' : 'returnInvoice');
    };
    const navigate = useNavigate();

    const renderTab = (t, activeCls) => (
        <button
            key={t.key}
            type="button"
            onClick={() => { setActiveTab(t.key); setFocusEvent(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === t.key
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
                    onClick={() => navigate('/damage-add')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                >
                    + New Damage
                </button>

                <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-indigo-100 shadow-md">
                    {STOCK_TABS.map((t) =>
                        renderTab(t, 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200')
                    )}
                    <span className="w-px h-7 bg-indigo-100 mx-1" />
                    {RETURN_TABS.map((t) =>
                        renderTab(t, 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-200')
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/damage-return-add')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                >
                    ↩ Return Damage
                </button>
            </div>

            {/* Active Page */}
            <div>
                {activeTab === 'invoice' && <DamageInvoice focusEvent={focusEvent} />}
                {activeTab === 'products' && <DamageProducts onOpenHistory={handleOpenHistory} />}
                {activeTab === 'returnInvoice' && <DamageReturnInvoice focusEvent={focusEvent} />}
                {activeTab === 'returnProducts' && <DamageReturnProducts />}
            </div>
        </div>
    );
};

export default DamageAll;