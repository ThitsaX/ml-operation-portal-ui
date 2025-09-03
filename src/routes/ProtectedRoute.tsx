import { Navigate, Outlet } from "react-router-dom";
import { useGetUserState } from "@store/hooks";
import React from "react";
import { menuIds } from "../configs/menu-ids";

interface ProtectedRouteProps {
    allowedMenuId: keyof typeof menuIds;
    children?: React.ReactNode;
}

const ProtectedRoute = ({ allowedMenuId, children }: ProtectedRouteProps) => {
    const { data } = useGetUserState();

    if (data === undefined) {
        return null;
    }

    const userMenuIds: number[] = data?.accessMenuList ?? [];
    const allowedId = menuIds[allowedMenuId];
    const hasPermission = userMenuIds.includes(allowedId);

    if (!hasPermission) {
        return <Navigate to="/home" replace />;
    }

    return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
