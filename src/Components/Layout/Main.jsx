import { Outlet } from "react-router-dom";
import Navbar from "../Pages/Home/Navbar/Navbar";
import Footer from "./Footer/Footer";
import SocialContact from "../SocialContact/SocialContact";
import ScrollToTop from "./ScrollToTop";
import ScrollToTopButton from "../ScrollToTopButton";

const Main = () => {
    return (
        <div>
            <ScrollToTop></ScrollToTop>
            <ScrollToTopButton />      
            <SocialContact />
            <Navbar></Navbar>
            <Outlet></Outlet>
            <Footer></Footer>
        </div>
    );
};

export default Main;