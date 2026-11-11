import { Navigate, useLocation } from "react-router-dom";
import { useClientAuth } from "./ClientAuthContext";
import Loader from './Loader';
import { canAccessPath, firstAllowedPath } from "./permissionConfig";

const ClientRoute = ({ children }) => {
    const { clientUser, isChecking } = useClientAuth();
    const location = useLocation();

    // ডাটা চেক হওয়া পর্যন্ত লোডার দেখাবে, রিডাইরেক্ট করবে না
    if (isChecking) {
        return <Loader />;
    }

    if (!clientUser) {
        return <Navigate to="/login-client" replace />;
    }

    // staff (SR / Manager / Delivery Man) এর permission না থাকলে অনুমতি পাওয়া প্রথম পেজে পাঠাবে
    if (clientUser.isStaff && !canAccessPath(clientUser.permissions, location.pathname)) {
        return <Navigate to={firstAllowedPath(clientUser.permissions)} replace />;
    }

    return children;
};

export default ClientRoute;