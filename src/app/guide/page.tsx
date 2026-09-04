import fs from "node:fs";
import path from "node:path";
import { ArrowLeft, BookOpen } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Markdown } from "@/components/arena/markdown";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "User Guide — OmniEval",
  description:
    "A friendly, non-technical guide to understanding and using OmniEval.",
};

/** Load the guide source from the repo root so it stays in sync with the file. */
function loadGuide(): string {
  try {
    const filePath = path.join(process.cwd(), "USER_GUIDE.md");
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "The user guide could not be loaded. Please try again later.";
  }
}

export default function GuidePage() {
  const content = loadGuide();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-8">
      <AppHeader
        subtitle="User Guide"
        icon={BookOpen}
        nav={{ href: "/", label: "Home", icon: ArrowLeft }}
        hideGuide
      />

      <Separator />

      <main className="flex flex-col gap-8">
        <article className="rounded-xl border bg-card p-6 sm:p-10">
          <Markdown content={content} />
        </article>
      </main>

      <footer className="mt-auto text-center text-xs text-muted-foreground">
        OmniEval · A friendly guide for first-time users
      </footer>
    </div>
  );
}
