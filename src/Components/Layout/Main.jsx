import { Outlet } from "react-router-dom";
import Navbar from "../Pages/Home/Navbar/Navbar";
import Footer from "./Footer/Footer";
import SocialContact from "../SocialContact/SocialContact";
import ScrollToTop from "./ScrollToTop";
import ScrollToTopButton from "../ScrollToTopButton";
import NewsletterFloatingPopup from "./NewsletterFloatingPopup";
import { Toaster } from "react-hot-toast";

const Main = () => {
    return (
        <div>
            <ScrollToTop />
            <ScrollToTopButton />
            <SocialContact />
            <Navbar />
            <Outlet />
            <Footer />
            <NewsletterFloatingPopup />
            
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
