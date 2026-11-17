import { NavLink } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "../Components/Pages/Home/Navbar/Navbar";

const ErrorPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <section className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 px-6 py-10 sm:px-10 text-center">
                    <h2 className="text-7xl sm:text-8xl font-extrabold leading-none bg-gradient-to-br from-brand-500 to-brand-800 bg-clip-text text-transparent">
                        404
                    </h2>
                    <p className="mt-4 text-xl sm:text-2xl font-bold text-slate-800">
                        Oops! Page Not Found
                    </p>
                    <p className="mt-2 mb-7 text-sm text-slate-500">
                        The page you are looking for does not exist or was moved.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="min-h-[42px] px-5 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Go Back
                        </button>
                        <NavLink
                            to="/"
                            className="inline-flex items-center justify-center min-h-[42px] px-6 bg-brand-600 text-white text-sm font-semibold"
                        >
                            Go to Homepage
                        </NavLink>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ErrorPage;