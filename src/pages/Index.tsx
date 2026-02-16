import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RoleCard from "@/components/RoleCard";
import { useAppState } from "@/context/AppContext";
import { Search, ArrowRight, Sparkles } from "lucide-react";

export default function Index() {
  const { roles } = useAppState();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      const roleId = search.trim().toLowerCase().replace(/\s+/g, "-");
      navigate(`/role/${roleId}?name=${encodeURIComponent(search.trim())}`);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const showQuickGenerate = search.trim() && !filteredRoles.some(
    (r) => r.name.toLowerCase() === search.trim().toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <div className="mb-14 text-center animate-fade-in">
          <h1 className="font-heading text-5xl leading-tight text-foreground sm:text-6xl md:text-7xl">
            Your engineering<br />
            <span className="text-gradient italic">career roadmap</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Generate roadmaps, mindmaps, and track your progress for any engineering role — all in one place.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="mx-auto mb-4 max-w-xl animate-fade-in">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or type any role to generate..."
              className="w-full rounded-2xl border border-border bg-card px-12 py-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </form>

        {/* Quick generate prompt */}
        {showQuickGenerate && (
          <button
            onClick={handleSubmit as any}
            className="mx-auto mb-10 flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md animate-fade-in"
          >
            <Sparkles className="h-4 w-4" />
            Generate roadmap for "{search}"
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        {!showQuickGenerate && <div className="mb-10" />}

        {/* Roles section */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-2xl text-foreground">
            Explore roles
          </h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {filteredRoles.length} {filteredRoles.length === 1 ? "role" : "roles"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role, i) => (
            <div key={role.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <RoleCard role={role} />
            </div>
          ))}
        </div>

        {filteredRoles.length === 0 && search && !showQuickGenerate && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">
              No matching roles found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
