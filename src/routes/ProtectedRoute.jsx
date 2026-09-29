import { Navigate, Outlet } from "react-router-dom";

import { useAppSelector } from "../app/hooks";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useAppSelector(
    (state) => state.auth
  );

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;