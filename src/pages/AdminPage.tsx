import { useState } from "react";
import { useAppState } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ListPlus, Settings } from "lucide-react";
import BulkAddRolesDialog from "@/components/BulkAddRolesDialog";
import DeleteRoleDialog from "@/components/DeleteRoleDialog";

export default function AdminPage() {
  const { isAdmin, roles } = useAppState();
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage roles and roadmaps</p>
            </div>
          </div>
        </div>

        {/* Add Roles Section */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Add Roles
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setBulkAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
            <Button onClick={() => setBulkAddOpen(true)} variant="outline" className="gap-2">
              <ListPlus className="h-4 w-4" />
              Bulk Add Roles
            </Button>
          </div>
        </div>

        {/* Manage Roles */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Manage Roles
            </h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              {roles.length} {roles.length === 1 ? "role" : "roles"}
            </span>
          </div>
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                    {role.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{role.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({role.department})</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget({ id: role.id, name: role.name })}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No roles yet. Add some to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BulkAddRolesDialog isOpen={bulkAddOpen} onClose={() => setBulkAddOpen(false)} />
      {deleteTarget && (
        <DeleteRoleDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          role={deleteTarget}
        />
      )}
    </div>
  );
}
