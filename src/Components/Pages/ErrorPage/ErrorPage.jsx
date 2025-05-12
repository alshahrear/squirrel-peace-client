import { NavLink } from "react-router-dom";
import Footer from "../../Layout/Footer/Footer";
import Navbar from "../Home/Navbar/Navbar";

const ErrorPage = () => {
    return (
        <div>
            <Navbar></Navbar>
            <section className="flex items-center h-full p-16 dark:text-gray-800 bg-gradient-to-r from-green-100 via-green-200 to-teal-100 ">
                <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">  
                    <div className="max-w-md text-center">
                        <h2 className="mb-8 font-extrabold text-9xl text-[#2acb35]">
                            404
                        </h2>
                        <p className="text-2xl font-semibold md:text-3xl">Oops! <span className="text-[#2acb35]">Page</span> Not Found!</p>
                        <p className="mt-4 mb-8 font-medium dark:text-gray-600">But dont worry, Try to Search for the Best Match or Visit our Home Page</p>
                        <NavLink to="/">
                            <button className="btn uppercase bg-[#2acb35] text-white rounded-xl py-5 hover:bg-[#222426]">
                                Go to Homepage
                            </button>
                        </NavLink>
                    </div>
                </div>
            </section>
            <Footer></Footer>
        </div>
    );
};

export default ErrorPage;