import { NavLink } from "react-router-dom";

export default function NavBar() {
  // NavLinkエレメントは 表示中のURLとto先URLを比較し、classNameに渡した関数へ isActive を注入する
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-bold underline" : "hover:underline";

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
    </header>
  );
}
