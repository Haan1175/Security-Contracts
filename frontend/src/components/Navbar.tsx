import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const links = [
  { to: "/", label: "Contracts" },
  { to: "/tools", label: "Security Tools" },
  { to: "/archived", label: "Archived" },
  { to: "/reports", label: "Reports" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="bg-brand-700 text-white shadow-md">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <ShieldCheck size={22} />
          Security Contracts
        </Link>
        <nav className="flex gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                (to === "/" ? pathname === "/" : pathname.startsWith(to))
                  ? "bg-white/20"
                  : "hover:bg-white/10 text-white/80"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
