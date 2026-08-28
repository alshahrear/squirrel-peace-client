import { Navigate, useLocation } from "react-router-dom";
import { useClientAuth } from "../../Provider/ClientAuthContext"; 
import Loader from '../../Loader';

 const ClientRoute = ({ children }) => {
    const { clientUser, isChecking } = useClientAuth();

    // ডাটা চেক হওয়া পর্যন্ত লোডার দেখাবে, রিডাইরেক্ট করবে না
    if (isChecking) {
        return <Loader />;
    }

    if (clientUser) {
        return children;
    }
    
    return <Navigate to="/login-client" replace />;
};

export default ClientRoute;