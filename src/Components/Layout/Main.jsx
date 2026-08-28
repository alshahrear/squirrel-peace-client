import { Outlet } from "react-router-dom";
import Navbar from "../Pages/Home/Navbar/Navbar";
import Footer from "./Footer/Footer";
import ScrollToTop from "./ScrollToTop";
import ScrollToTopButton from "../ScrollToTopButton";
import { Toaster } from "react-hot-toast";

const Main = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <ScrollToTopButton />
           <div className="sticky top-0 z-50 bg-white shadow-sm">
                <Navbar />
            </div>
            
            {/* Main content area will take up all available space, pushing the footer down */}
            <div className="flex-grow">
                <Outlet />
            </div>

            <Footer />
            
            <Toaster 
                position="top-right"
                toastOptions={{
                    style: { fontSize: '16px', zIndex: 999999 },
                }}
            />
        </div>
    );
};

export default Main;