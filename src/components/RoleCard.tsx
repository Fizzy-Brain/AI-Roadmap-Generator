import { RoleInfo } from "@/types/roadmap";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface RoleCardProps {
  role: RoleInfo;
}

export default function RoleCard({ role }: RoleCardProps) {
  return (
    <Link
      to={`/role/${role.id}?name=${encodeURIComponent(role.name)}`}
      className="group flex items-start justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div>
        <span className="mb-2 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {role.department}
        </span>
        <h3 className="font-heading text-xl text-foreground">
          {role.name}
        </h3>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
