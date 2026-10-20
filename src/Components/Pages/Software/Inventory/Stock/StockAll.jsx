import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import StockProducts from './StockProducts';
import StockPurchase from './StockPurchase';
import StockAdjustment from './StockAdjustment';
import StockAlert from './StockAlert';

const TABS = [
    { key: 'products', label: 'Stock Products', icon: '📦' },
    { key: 'purchase', label: 'Stock Purchase', icon: '🧾' },
    { key: 'adjustment', label: 'Stock Adjustment', icon: '⚖️' },
    { key: 'alert', label: 'Stock Alert', icon: '🔔' },
];

const StockAll = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'products');
    const [focusEvent, setFocusEvent] = useState(null);

    // History theke Open click korle Stock Purchase tab e niye jabe
    const handleOpenHistory = (e) => {
        setFocusEvent({ ...e, nonce: Date.now() });
        setActiveTab('purchase');
    };

    return (
        <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            {/* Tab Bar */}
            <div className="flex justify-center pt-6 px-4">
                <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-indigo-100 shadow-md">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => { setFocusEvent(null); setActiveTab(t.key); }}
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${activeTab === t.key
                                ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200'
                                : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Page */}
            <div>
                {activeTab === 'products' ? (
                    <StockProducts onOpenHistory={handleOpenHistory} />
                ) : activeTab === 'purchase' ? (
                    <StockPurchase focusEvent={focusEvent} />
                ) : activeTab === 'adjustment' ? (
                    <StockAdjustment />
                ) : (
                    <StockAlert />
                )}
            </div>
        </div>
    );
};

export default StockAll;