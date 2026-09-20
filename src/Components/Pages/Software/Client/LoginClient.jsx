import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from 'react-icons/fa';

const LoginClient = () => {
    const [email, setEmail] = useState(''); // ইমেইল ইনপুট নেওয়ার জন্য
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // ইতিমধ্যে লগইন করা থাকলে লগইন পেজে ঢুকতে না দিয়ে ড্যাশবোর্ডে রিডাইরেক্ট করা
    useEffect(() => {
        const storedUser = localStorage.getItem('clientUser');
        if (storedUser) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    // টোস্ট নোটিফিকেশন কনফিগারেশন (SweetAlert2 Mixin)
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // সরাসরি ব্যাকএন্ডের লগইন এপিআই-তে রিকোয়েস্ট পাঠানো
            const loginRes = await fetch('http://localhost:5000/client/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const loginData = await loginRes.json();

            // ব্যাকএন্ড থেকে কোনো এরর আসলে (যেমন: Wrong password, Not found, Inactive)
            if (!loginRes.ok) {
                Toast.fire({
                    icon: 'error',
                    title: loginData.message || 'Login failed!'
                });
                setLoading(false);
                return;
            }

            // সফল লগইন হলে
            Toast.fire({
                icon: 'success',
                title: 'Login successful!'
            });

          // টোকেন এবং ক্লায়েন্টের তথ্য localStorage-এ সেভ করার আগে ব্যাকএন্ডে স্ট্যাটাস 'yes' করে নেওয়া বা পাঠানো নিশ্চিত করা
            const clientId = loginData.client._id || loginData.client.id;
            await fetch(`http://localhost:5000/client/login-status/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: 'yes' })
            });

            localStorage.setItem('clientToken', loginData.token);
            const updatedClientLogin = { ...loginData.client, login: 'yes' };
            localStorage.setItem('clientUser', JSON.stringify(updatedClientLogin));

            // অন্যান্য কম্পোনেন্ট আপডেট করার জন্য ইভেন্ট ডিসপ্যাচ করা
            window.dispatchEvent(new Event('clientUserUpdated'));

            // ড্যাশবোর্ডে নেভিগেট করা
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            Toast.fire({
                icon: 'error',
                title: 'Something went wrong. Try again!'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#090d16] p-4">
            <div className="max-w-md w-full mx-auto p-8 bg-[#1e293b]/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-500/20 transition-all duration-300">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 mb-4 text-2xl font-bold">
                        C
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Welcome Back</h2>
                    <p className="text-sm text-slate-400 mt-1">Please sign in to your client account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <FaEnvelope size={16} />
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-[#0f172a]/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm placeholder-slate-500"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* Password Field with Eye Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                <FaLock size={16} />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-12 py-3 bg-[#0f172a]/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm placeholder-slate-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-400 focus:outline-none transition-colors"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform active:scale-[0.98] ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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