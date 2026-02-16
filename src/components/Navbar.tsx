import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { isAdmin, setIsAdmin } = useAppState();
  const navigate = useNavigate();

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

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdmin(false)}
                className="gap-1.5 text-muted-foreground text-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
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
