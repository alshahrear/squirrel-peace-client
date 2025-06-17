import { Navigate, useLocation } from "react-router";
import useAuth from "../useAuth";
import Loader from "../../Components/Loader";

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loader />;
    }

    if (user) {
        return children;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
