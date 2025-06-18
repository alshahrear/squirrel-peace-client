import { useState } from "react";
import { Helmet } from "react-helmet";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");

    const handleForgotPassword = (e) => {
        e.preventDefault();

        // এখানে আপনি Firebase বা অন্য auth system দিয়ে কাজ করতে পারেন
        if (!email) {
            toast.error("Please enter a valid email address.");
            return;
        }

        // আপনি এখানে API call করতে পারেন
        toast.success("If this email is registered, reset instructions will be sent.", {
            position: "top-right",
            autoClose: 3000,
        });

        setEmail("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <Helmet>
                <title>Forgot Password - Storial Peace</title>
            </Helmet>

            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-green-600 mb-6">Reset Your Password</h2>
                <form onSubmit={handleForgotPassword}>
                    <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                    />

                    <button
                        type="submit"
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md shadow"
                    >
                        Send Reset Link
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-600">
                    Remembered your password?
                    <Link to="/login" className="text-green-600 font-medium ml-1 hover:underline">
                        Go back to login
                    </Link>
                </p>

                <ToastContainer />
            </div>
        </div>
    );
};

export default ForgotPassword;
