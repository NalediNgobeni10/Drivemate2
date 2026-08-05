import { Bell, Search, LogOut, Car } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function AppHeader({ onSearch }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || "L L")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#0f172a]/85 backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex items-center justify-between px-6 lg:px-10 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1D6A4A] flex items-center justify-center">
            <Car className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="hidden sm:block">
            <div className="font-heading font-bold text-base leading-tight">DriveMate</div>
            <div className="font-mono-tech text-[9px] text-slate-400 uppercase tracking-widest">
              Instructor Portal
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <Input
              data-testid="header-search-input"
              placeholder="Search students, slots…"
              onChange={(e) => onSearch?.(e.target.value)}
              className="pl-10 h-10 bg-white/5 border-white/10 focus:border-[#10b981]/50 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="header-notifications-btn"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-[#10b981]/40 transition-colors relative"
          >
            <Bell className="w-4 h-4 text-slate-300" strokeWidth={1.5} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#10b981]" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="header-user-menu"
                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#10b981]/40 transition-colors"
              >
                <Avatar className="w-8 h-8 border border-[#10b981]/40">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback className="bg-[#1D6A4A] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-100 leading-tight">
                    {user?.name || "Lesego Lebese"}
                  </div>
                  <div className="text-[10px] text-[#10b981] font-mono-tech uppercase tracking-wider">
                    {user?.title || (user?.role === "admin" ? "Technical Lead" : user?.role || "Instructor")}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-100 min-w-[220px]">
              <DropdownMenuLabel>
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-slate-400 font-normal">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                data-testid="header-logout-btn"
                onClick={logout}
                className="cursor-pointer focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
