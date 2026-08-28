import Loader from '../../../Loader';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../../../Provider/ClientAuthContext';

const Dashboard = () => {
    // কনটেক্সট থেকে clientUser ডেটা বের করে আনা হলো
    const { clientUser } = useClientAuth();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    // লোকালস্টোরেজ বা কনটেক্সট থেকে ডাটা চেক হতে সামান্য সময় দেওয়ার জন্য
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 500); // ৫০ মিলি সেকেন্ড বা আধা সেকেন্ড সময় দিয়ে চেক করা হবে

        return () => clearTimeout(timer);
    }, []);

    // লগইন না করা থাকলে সরাসরি /login-client পেজে রিডাইরেক্ট করার জন্য
    useEffect(() => {
        if (!isChecking && !clientUser) {
            navigate('/login-client', { replace: true });
        }
    }, [clientUser, isChecking, navigate]);

    // ডাটা লোড বা চেক হওয়ার সময় Loader দেখাবে
    if (isChecking || !clientUser) {
        return <Loader />;
    }


    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Welcome to our Dashboard</h1>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold text-[#2acb35] mb-4">ক্লায়েন্ট প্রোফাইল তথ্য</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">ক্লায়েন্ট আইডি (ID)</p>
                        <p className="font-medium text-gray-800">{clientUser._id || clientUser.id || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">নাম (Name)</p>
                        <p className="font-medium text-gray-800">{clientUser.name || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">ইমেইল (Email)</p>
                        <p className="font-medium text-gray-800">{clientUser.email || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500">ফোন নম্বর (Phone Number)</p>
                        <p className="font-medium text-gray-800">{clientUser.phone || clientUser.phoneNumber || 'N/A'}</p>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm border border-gray-100 md:col-span-2">
                        <p className="text-sm text-gray-500">ঠিকানা (Address)</p>
                        <p className="font-medium text-gray-800">{clientUser.address || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;