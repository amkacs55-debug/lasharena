import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAppData } from "@/context/AppDataContext";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/bookings", label: "Bookings", icon: "📅" },
  { to: "/admin/services", label: "Services", icon: "💎" },
  { to: "/admin/gallery", label: "Gallery", icon: "🖼️" },
  { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminLayout() {
  const { session, logout } = useAdminAuth();
  const { settings } = useAppData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0F0F0F]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#141014] p-6 text-white md:flex">
        <div className="mb-10 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FF4FA0] to-[#d43c86] font-display text-sm text-white">
            {settings.salon_name.charAt(0)}
          </span>
          <div>
            <p className="font-display text-base font-semibold leading-tight">{settings.salon_name}</p>
            <p className="text-[10px] uppercase tracking-widest text-white/40">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#FF4FA0] to-[#d43c86] text-white shadow-lg shadow-[#FF4FA0]/20"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/40">{session?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-xl border border-white/15 px-4 py-2.5 text-left text-sm font-medium text-white/80 hover:border-[#FF4FA0]/40 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0F0F0F]/90 px-5 py-4 backdrop-blur-sm md:hidden">
          <p className="font-display text-lg font-semibold text-white">{settings.salon_name}</p>
          <button onClick={handleLogout} className="text-xs font-semibold text-white/50">
            Log out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 bg-[#141014] px-3 py-2 no-scrollbar md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
                  isActive ? "bg-gradient-to-r from-[#FF4FA0] to-[#d43c86] text-white" : "text-white/50"
                }`
              }
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
