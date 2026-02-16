import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressInsightProps {
  roleName: string;
  topics: string[];
}

export default function ProgressInsight({ roleName, topics }: ProgressInsightProps) {
  const storageKey = `progress-${roleName.toLowerCase().replace(/\s+/g, "-")}`;

  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...completed]));
  }, [completed, storageKey]);

  const toggle = (topic: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const percentage = topics.length > 0 ? Math.round((completed.size / topics.length) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-heading text-3xl text-foreground">
        Progress — {roleName}
      </h2>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {completed.size} of {topics.length} topics completed
          </span>
          <span className="text-2xl font-heading text-primary">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2.5 bg-secondary [&>div]:bg-primary [&>div]:rounded-full" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const done = completed.has(topic);
          return (
            <button
              key={topic}
              onClick={() => toggle(topic)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${
                done
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border bg-card text-secondary-foreground hover:border-primary/20 hover:shadow-sm"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
