import React, { useEffect, useRef } from 'react';

const ACTIVE = {
    brand: 'bg-brand-600 text-white shadow-sm',
    rose: 'bg-rose-600 text-white shadow-sm',
};

/**
 * tabs: [{ key, label, icon (react-icon component বা emoji string), active, onClick, tone: 'brand'|'rose' }]
 * বা { divider: true, key } = আলাদা করার দাগ
 * bare = বাইরের container ছাড়া (DamageAll, ProfitTabAll এ ব্যবহার হয়)
 * wrap = lg স্ক্রিনে tab গুলো একাধিক সারিতে সাজাবে (বেশি tab এর report এর জন্য), ছোট স্ক্রিনে scroll
 */
const TabBar = ({ tabs = [], bare = false, align = 'left', wrap = false }) => {
    const activeRef = useRef(null);
    const activeKey = tabs.find((t) => t.active)?.key;

    useEffect(() => {
        activeRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
    }, [activeKey]);

    if (!tabs.filter((t) => !t.divider).length) return null;

    const bar = (
        <div
            className={`overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${wrap ? 'lg:overflow-visible' : ''
                } ${align === 'center' ? 'text-center' : ''}`}
        >
            <div
                className={`items-center gap-1 p-1 bg-white/80 border border-slate-200 ${wrap
                    ? 'inline-flex rounded-full lg:flex lg:flex-wrap lg:rounded-3xl lg:justify-start'
                    : 'inline-flex rounded-full'
                    }`}
            >
                {tabs.map((t) => {
                    if (t.divider) return <span key={t.key} className="w-px h-5 bg-slate-200 mx-0.5" />;
                    const Icon = t.icon;
                    const isIconComp = typeof Icon === 'function' || (Icon && typeof Icon === 'object');
                    return (
                        <button
                            key={t.key}
                            ref={t.active ? activeRef : null}
                            type="button"
                            onClick={t.onClick}
                            aria-current={t.active ? 'page' : undefined}
                            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer ${t.active
                                ? ACTIVE[t.tone] || ACTIVE.brand
                                : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                                }`}
                        >
                            {Icon && (isIconComp ? <Icon size={13} /> : <span aria-hidden="true">{Icon}</span>)}
                            {t.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    if (bare) return bar;
    return <div className="max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 pt-3 sm:pt-5">{bar}</div>;
};

export default TabBar;