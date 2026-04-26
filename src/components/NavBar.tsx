import { NavLink } from "react-router-dom";

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-bold underline" : "hover:underline";

  return (
    <header className="px-4 py-2 border-b border-gray-300 bg-gray-100 flex items-center gap-6">
      <span className="text-lg font-medium">Vehicle Demo</span>
      <nav className="flex gap-4 text-sm">
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
