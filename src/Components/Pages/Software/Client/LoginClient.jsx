import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaGlobe } from 'react-icons/fa';
import { getTenantSlug } from '../../../../hooks/getTenantSlug';

const LoginClient = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const slug = getTenantSlug();

    // ইতিমধ্যে লগইন করা থাকলে ড্যাশবোর্ডে পাঠানো
    useEffect(() => {
        const storedUser = localStorage.getItem('clientUser');
        if (storedUser) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            if (!getTenantSlug()) {
                toast.error('Please open your own company link to login.');
                return;
            }
            const loginRes = await fetch('http://localhost:5000/client/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, slug: getTenantSlug() })
            });

            const loginData = await loginRes.json();

            if (!loginRes.ok) {
                toast.error(loginData.message || 'Login failed!');
                return;
            }

            toast.success('Login successful!');

            localStorage.setItem('clientToken', loginData.token);
            const updatedClientLogin = { ...loginData.client, login: 'yes' };
            localStorage.setItem('clientUser', JSON.stringify(updatedClientLogin));

            window.dispatchEvent(new Event('clientUserUpdated'));

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Something went wrong. Try again!');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition';

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-130px)] p-3 sm:p-5 md:p-8">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-2xl font-extrabold shadow-lg shadow-brand-600/30 mb-4">
                        B
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome Back</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your Bashay Bazar account</p>

                    {slug ? (
                        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                            <FaGlobe size={10} /> {slug}.bashaybazar.com
                        </span>
                    ) : (
                        <p className="mt-3 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            Please open your own company link to login.
                        </p>
                    )}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-medium text-slate-600 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                <FaEnvelope size={15} />
                            </span>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                                className={inputCls}
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="login-password" className="block text-xs font-medium text-slate-600 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                <FaLock size={15} />
                            </span>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className={`${inputCls} pr-12`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-400 hover:text-brand-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? <FaEyeSlash size={17} /> : <FaEye size={17} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full min-h-[44px] bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 transition active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginClient;