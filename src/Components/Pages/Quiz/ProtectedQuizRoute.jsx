// ProtectedQuizRoute.jsx
import { Navigate } from "react-router-dom";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import Loader from "../../Loader";

const ProtectedQuizRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, isAdminLoading] = useAdmin();

  if (loading || isAdminLoading) return <p><Loader></Loader></p>;

  // ✅ Admin সবসময় ঢুকতে পারবে
  if (isAdmin) return children;

  // ✅ Normal user check
  const canAccess = sessionStorage.getItem("quizAccess") === "true";

  if (canAccess) {
    return children;
  } else {
    return <Navigate to="/quiz" replace />;
  }
};

export default ProtectedQuizRoute;
