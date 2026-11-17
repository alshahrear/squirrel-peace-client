import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useCan from '../../../../hooks/useCan';

const API_BASE = 'http://localhost:5000';

// নতুন feature যোগ করতে শুধু এই লিস্টে আইটেম যোগ করুন (key = database key)
// এক group = এক card। items এ একাধিক toggle থাকতে পারে।
const GROUPS = [
    {
        title: 'Stock Borrow (Main / Free)',
        description:
            'স্টক কম পড়লে এক ধরনের স্টক থেকে অন্য ধরনের স্টকে নেওয়া যাবে কিনা তা এখান থেকে ঠিক করুন। ON থাকলে ডেলিভারির সময় নিশ্চিত করতে বলবে, OFF থাকলে ডেলিভারি হবে না।',
        items: [
            {
                key: 'mainFromFreeStock',
                title: 'Main Product এর জন্য Free Stock থেকে নেওয়া',
                description: 'Main স্টক কম পড়লে Free স্টক থেকে নেওয়া যাবে।',
            },
            {
                key: 'freeFromMainStock',
                title: 'Free Product এর জন্য Main Stock থেকে নেওয়া',
                description: 'Free স্টক কম পড়লে Main স্টক থেকে নেওয়া যাবে।',
            },
        ],
    },
    {
        title: 'Multi Return',
        description:
            'OFF থাকলে একটা Invoice থেকে মাত্র একবার Return করা যাবে। ON করলে একই Invoice থেকে যতবার খুশি Return করা যাবে।',
        items: [
            {
                key: 'purchaseMultiReturn',
                title: 'Purchase Multi Return',
                description: 'ON করলে একই Purchase Invoice থেকে যতবার খুশি Return করা যাবে।',
            },
            {
                key: 'salesMultiReturn',
                title: 'Sales Multi Return',
                description: 'ON করলে একই Sales Invoice থেকে যতবার খুশি Return করা যাবে।',
            },
        ],
    },
    {
        title: 'Save Draft',
        description:
            'ON করলে Navbar এ Save Draft toggle দেখাবে। Toggle ON থাকলে ফর্মে দেওয়া ডেটা অন্য পেজে গেলে বা সফটওয়্যার বন্ধ করলেও ৩ ঘণ্টা পর্যন্ত সেভ থাকবে।',
        items: [{ key: 'saveDraft', title: 'Save Draft', description: '' }],
    },
];

const ToggleRow = ({ item, isOn, isSaving, onToggle }) => (
    <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-3">
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                >
                    {isOn ? 'ON' : 'OFF'}
                </span>
            </div>
            {item.description && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
            )}
        </div>

        <button
            type="button"
            onClick={() => onToggle(item.key)}
            disabled={isSaving}
            aria-pressed={isOn}
            aria-label={item.title}
            title={isOn ? 'Click to turn OFF' : 'Click to turn ON'}
            className="shrink-0 p-1 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span
                className={`relative inline-block w-12 h-7 rounded-full transition-colors duration-200 ${
                    isOn ? 'bg-brand-600' : 'bg-slate-300'
                }`}
            >
                <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        isOn ? 'translate-x-5' : ''
                    }`}
                />
            </span>
        </button>
    </div>
);

const Feature = () => {
    const { canEdit } = useCan('features');
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState(null);

    // Fetch features
    useEffect(() => {
        fetch(`${API_BASE}/feature`)
            .then((res) => res.json())
            .then((data) => setFeatures(data || {}))
            .catch((error) => {
                console.error('Error fetching features:', error);
                toast.error('Failed to load features!');
            })
            .finally(() => setLoading(false));
    }, []);

    // Toggle feature
    const handleToggle = async (key) => {
        if (!canEdit) {
            toast.error('আপনার Edit করার অনুমতি নেই!');
            return;
        }
        const newValue = !features[key];
        setSavingKey(key);

        // আগে UI তে বদলে দেওয়া (Optimistic)
        setFeatures((prev) => ({ ...prev, [key]: newValue }));

        try {
            const res = await fetch(`${API_BASE}/feature/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newValue }),
            });

            if (!res.ok) throw new Error('Failed to update feature');

            toast.success(`Feature ${newValue ? 'enabled' : 'disabled'} successfully!`);

            // Navbar কে জানিয়ে দেওয়া (রিফ্রেশ ছাড়াই আপডেট হবে)
            window.dispatchEvent(new Event('feature-change'));
        } catch (error) {
            console.error('Error updating feature:', error);
            // ব্যর্থ হলে আগের অবস্থায় ফেরত
            setFeatures((prev) => ({ ...prev, [key]: !newValue }));
            toast.error('Failed to update feature!');
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Features</h2>
                    <p className="text-slate-500 text-sm mt-1">Turn software features on or off</p>
                </div>

                {/* Feature cards */}
                {loading ? (
                    <div className="space-y-4" aria-busy="true">
                        {[1, 2, 3].map((n) => (
                            <div
                                key={n}
                                className="h-32 rounded-2xl bg-white/70 border border-slate-200 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    GROUPS.map((group) => (
                        <div
                            key={group.title}
                            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 transition-shadow hover:shadow-lg"
                        >
                            <h3 className="text-base sm:text-lg font-bold text-slate-800">{group.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{group.description}</p>

                            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60">
                                {group.items.map((item) => (
                                    <ToggleRow
                                        key={item.key}
                                        item={item}
                                        isOn={features[item.key] === true}
                                        isSaving={savingKey === item.key}
                                        onToggle={handleToggle}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Feature;