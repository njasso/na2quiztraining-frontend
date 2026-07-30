import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const isDev = process.env.REACT_APP_DEV_MODE === "true";

  if (!user && !isDev) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
