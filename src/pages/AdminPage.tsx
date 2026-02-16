import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function AdminPage() {
  const { isAdmin, roles, addRole, removeRole } = useAppState();
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");

  if (!isAdmin) return <Navigate to="/login" replace />;

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    addRole({ id, name: newName.trim(), department: newDept.trim() || "General" });
    setNewName("");
    setNewDept("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 font-heading text-3xl text-foreground">Admin Panel</h1>

        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add New Role</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Role name"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="Department (optional)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={handleAdd} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Manage Roles ({roles.length})
          </h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <div>
                  <span className="font-medium text-foreground">{role.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({role.department})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRole(role.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
