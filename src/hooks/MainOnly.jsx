import { Navigate } from "react-router-dom";
import { getTenantSlug } from "./getTenantSlug";

const MainOnly = ({ children }) => {
    return getTenantSlug() ? <Navigate to="/" replace /> : children;
};

export default MainOnly;