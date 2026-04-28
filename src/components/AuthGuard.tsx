import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type Props = { children: React.ReactNode };

export default function AuthGuard({ children }: Props) {
  const { user, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
