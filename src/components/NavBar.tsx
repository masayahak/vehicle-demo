import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // NavLinkエレメントは 表示中のURLとto先URLを比較し、classNameに渡した関数へ isActive を注入する
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-bold underline" : "hover:underline";

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="px-4 py-2 border-b border-gray-300 bg-gray-100 flex items-center gap-6">
      <span className="text-lg font-medium">Vehicle Demo</span>
      <nav className="flex gap-4 text-sm">
        {/* end： isActive のデフォルト判定は前方一致（これだと /about も / で一致）これを完全一致へ */}
        <NavLink to="/" end className={linkClass}>
          ホーム
        </NavLink>
        <NavLink to="/vehicles" className={linkClass}>
          車両表示
        </NavLink>
        <NavLink to="/about" className={linkClass}>
          About
        </NavLink>
      </nav>
      {user && (
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-gray-700">
            {user.name}（{user.role ?? "user"}）
          </span>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:underline"
          >
            ログアウト
          </button>
        </div>
      )}
    </header>
  );
}
