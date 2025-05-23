import { Outlet } from "react-router-dom";
import Navbar from "../Pages/Home/Navbar/Navbar";
import Footer from "./Footer/Footer";
import SocialContact from "../SocialContact/SocialContact";

const Main = () => {
    return (
        <div>
            <SocialContact></SocialContact>
            <Navbar></Navbar>
            <Outlet></Outlet>
            <Footer></Footer>
        </div>
    );
};

export default Main;