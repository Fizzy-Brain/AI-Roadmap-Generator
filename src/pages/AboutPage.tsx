import Navbar from "@/components/Navbar";
import { Lightbulb, Cpu, Mail, Sparkles } from "lucide-react";

const sections = [
  {
    icon: <Lightbulb className="h-5 w-5" />,
    title: "Our Mission",
    content: [
      "RoadmapAI was created with a simple but powerful mission: to make professional learning paths accessible to everyone. We believe that clear, structured guidance is essential for anyone looking to enter or advance in engineering fields.",
      "By leveraging artificial intelligence, we provide personalized roadmaps that adapt to the specific needs of each learner, helping them navigate the complex landscape of skills, technologies, and knowledge required for success.",
    ],
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "How It Works",
    content: [
      "RoadmapAI uses advanced AI models to generate comprehensive learning roadmaps for various engineering disciplines and job roles. Our system analyzes the skills, technologies, and knowledge areas required for specific roles and organizes them into a structured, progressive learning path.",
      "Each roadmap includes a detailed description of the role, the essential skills required, and a step-by-step guide to acquiring those skills. Whether you're just starting your journey or looking to advance your career, RoadmapAI provides the guidance you need.",
    ],
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "Our Technology",
    content: [
      "RoadmapAI is powered by state-of-the-art language models and AI technologies. We use Google Gemini to ensure our roadmaps are comprehensive, accurate, and up-to-date with the latest industry trends and requirements.",
      "Our platform is built using modern web technologies, including React + Vite for the frontend and Python FastAPI for the backend AI processing. This architecture allows us to deliver fast, responsive experiences while generating detailed, personalized content.",
    ],
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Contact Us",
    content: [
      "We're always looking to improve RoadmapAI and would love to hear your feedback. If you have questions, suggestions, or just want to say hello, please reach out to us.",
    ],
    links: [
      { label: "Email", href: "mailto:info@roadmapai.com", text: "info@roadmapai.com" },
      { label: "Twitter", href: "https://twitter.com/roadmapai", text: "@roadmapai" },
      { label: "LinkedIn", href: "https://linkedin.com/company/roadmapai", text: "RoadmapAI" },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 animate-fade-in">
          <h1 className="font-heading text-4xl text-foreground md:text-5xl">About</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Learn more about what powers your career roadmaps.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <div
              key={section.title}
              className="animate-fade-in rounded-xl border border-border bg-card p-6 transition-all hover:shadow-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  {section.icon}
                </div>
                <h2 className="font-heading text-xl text-foreground">{section.title}</h2>
              </div>

              <div className="space-y-3">
                {section.content.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>

              {section.links && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {section.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                    >
                      {link.label}: {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
