import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, ListPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/context/AppContext";

interface BulkAddRolesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkAddRolesDialog({ isOpen, onClose }: BulkAddRolesDialogProps) {
  const { toast } = useToast();
  const { addRole, addRoles } = useAppState();
  const [activeTab, setActiveTab] = useState("single");
  const [singleRole, setSingleRole] = useState("");
  const [bulkRoles, setBulkRoles] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const makeId = (name: string) => name.trim().toLowerCase().replace(/\s+/g, "-");

  const handleAddSingleRole = () => {
    if (!singleRole.trim()) {
      toast({ title: "Role name required", description: "Please enter a role name", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const name = singleRole.trim();
      addRole({ id: makeId(name), name, department: "Job Roles" });
      toast({ title: "Role added", description: `${name} has been added` });
      setSingleRole("");
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to add role", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBulkRoles = () => {
    if (!bulkRoles.trim()) {
      toast({ title: "Roles required", description: "Please enter at least one role", variant: "destructive" });
      return;
    }

    const rolesList = bulkRoles
      .split(/[,\n]/)
      .map((r) => r.trim())
      .filter(Boolean);

    if (rolesList.length === 0) {
      toast({ title: "Invalid input", description: "Please enter valid role names separated by commas or new lines", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const newRoles = rolesList.map((name) => ({
        id: makeId(name),
        name,
        department: "Job Roles",
      }));
      addRoles(newRoles);
      toast({
        title: `${rolesList.length} role${rolesList.length !== 1 ? "s" : ""} added`,
        description: `Successfully added ${rolesList.length} role${rolesList.length !== 1 ? "s" : ""}`,
      });
      setBulkRoles("");
      onClose();
    } catch {
      toast({ title: "Error", description: "An error occurred while adding roles", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (activeTab === "single") handleAddSingleRole();
    else handleAddBulkRoles();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeTab === "bulk" ? <ListPlus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            Add Role{activeTab === "bulk" ? "s" : ""}
          </DialogTitle>
          <DialogDescription>
            Add {activeTab === "bulk" ? "multiple roles at once" : "a new role"}.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Role</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role Name</label>
              <Input
                placeholder="e.g. Cloud Architect"
                value={singleRole}
                onChange={(e) => setSingleRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSingleRole()}
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role Names</label>
              <Textarea
                placeholder={`Enter multiple roles separated by commas or new lines\n\nExample:\nFrontend Developer\nBackend Developer, DevOps Engineer\nUI/UX Designer`}
                value={bulkRoles}
                onChange={(e) => setBulkRoles(e.target.value)}
                className="min-h-[140px]"
              />
              <p className="text-xs text-muted-foreground">
                Separate role names with commas or new lines
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${activeTab === "bulk" ? "Roles" : "Role"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
