import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut, Info, ShieldCheck } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { isAdmin, logout } = useAppState();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">R</span>
          </div>
          <span className="font-heading text-xl text-foreground">
            RoadmapAI
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link to="/about">
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">About</span>
            </Button>
          </Link>

          {isAdmin ? (
            <>
              {/* Prominent admin badge */}
              <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 dark:bg-emerald-900/40">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Admin
                </span>
              </div>

              <Link to="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
