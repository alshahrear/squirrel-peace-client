import { Navigate } from "react-router-dom";
import { getTenantSlug } from "./getTenantSlug";
import Home from "../Components/Pages/Home/Home";

const TenantHome = () => {
    return getTenantSlug() ? <Navigate to="/dashboard" replace /> : <Home />;
};

export default TenantHome;