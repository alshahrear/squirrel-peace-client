import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

// নতুন feature যোগ করতে শুধু এই লিস্টে একটা আইটেম যোগ করুন (key = database key)
const FEATURES = [
    {
        key: 'saveDraft',
        title: 'Save Draft',
        description: 'ON করলে Navbar এ Save Draft toggle দেখাবে। Toggle ON থাকলে ফর্মে দেওয়া ডেটা অন্য পেজে গেলে বা সফটওয়্যার বন্ধ করলেও ৩ ঘণ্টা পর্যন্ত সেভ থাকবে।',
    },
];

const Feature = () => {
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
    };

    // Fetch features
    useEffect(() => {
        fetch(`${API_BASE}/feature`)
            .then((res) => res.json())
            .then((data) => setFeatures(data || {}))
            .catch((error) => {
                console.error('Error fetching features:', error);
                showToast('Failed to load features!', 'error');
            })
            .finally(() => setLoading(false));
    }, []);

    // Toggle feature
    const handleToggle = async (key) => {
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

            showToast(`Feature ${newValue ? 'enabled' : 'disabled'} successfully!`, 'success');

            // Navbar কে জানিয়ে দেওয়া (রিফ্রেশ ছাড়াই আপডেট হবে)
            window.dispatchEvent(new Event('feature-change'));
        } catch (error) {
            console.error('Error updating feature:', error);
            // ব্যর্থ হলে আগের অবস্থায় ফেরত
            setFeatures((prev) => ({ ...prev, [key]: !newValue }));
            showToast('Failed to update feature!', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Features
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Turn software features on or off</p>
                </div>

                {/* Feature List */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-4">
                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading features...</div>
                    ) : (
                        FEATURES.map((feature) => {
                            const isOn = features[feature.key] === true;
                            const isSaving = savingKey === feature.key;

                            return (
                                <div
                                    key={feature.key}
                                    className="flex items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                                            <span className={`px-3 py-1 rounded-full font-semibold text-xs ${isOn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {isOn ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleToggle(feature.key)}
                                        disabled={isSaving}
                                        className="shrink-0 cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={isOn ? 'Click to turn OFF' : 'Click to turn ON'}
                                    >
                                        <span className={`relative inline-block w-12 h-7 rounded-full transition-colors duration-200 ${isOn ? 'bg-gradient-to-r from-indigo-600 to-pink-600' : 'bg-gray-300'}`}>
                                            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOn ? 'translate-x-5' : ''}`} />
                                        </span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feature;