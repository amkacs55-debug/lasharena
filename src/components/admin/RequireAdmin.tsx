import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Spinner } from "@/components/ui/primitives";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F]">
        <Spinner className="text-[#FF4FA0]" />
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
