import { ArrowLeft, FlaskConical, Swords } from "lucide-react";
import { BlindArena } from "@/components/arena/blind-arena";
import { AppHeader } from "@/components/app-header";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Arena Mode — OmniEval",
  description:
    "Blind A/B testing: pit two random models against each other, vote on the winner, and climb the Elo leaderboard.",
};

export default function ArenaPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <AppHeader
        subtitle="Arena Mode"
        icon={Swords}
        nav={{ href: "/", label: "Home", icon: ArrowLeft }}
      />

      <Separator />

      <main className="flex flex-col gap-4">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Arena Mode
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Two random models battle head-to-head on your prompt. Responses
              are shown blindly — vote for the better one, then identities,
              latency, and cost are revealed and the Elo ratings are updated
              (K=32).
            </p>
          </div>
          <BlindArena />
        </section>
      </main>

      <footer className="mt-auto flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <FlaskConical className="size-3" />
        Elo ratings are computed server-side from{" "}
        <code className="font-mono">ArenaMatchup</code> and stored in{" "}
        <code className="font-mono">ModelElo</code>.
      </footer>
    </div>
  );
}
