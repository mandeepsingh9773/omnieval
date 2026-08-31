import { ArrowLeft, FlaskConical, Swords } from "lucide-react";
import Link from "next/link";
import { BlindArena } from "@/components/arena/blind-arena";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KeyVaultDialog } from "@/components/byok/key-vault-dialog";

export const metadata = {
  title: "Arena Mode — OmniEval",
  description:
    "Blind A/B testing: pit two random models against each other, vote on the winner, and climb the Elo leaderboard.",
};

export default function ArenaPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Swords className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">OmniEval</p>
            <p className="text-xs text-muted-foreground">Arena Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft />
              Home
            </Link>
          </Button>
          <KeyVaultDialog />
        </div>
      </header>

      <Separator />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Arena Mode
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Two random models battle head-to-head on your prompt. Responses are
            shown blindly — vote for the better one, then identities, latency,
            and cost are revealed and the Elo ratings are updated (K=32).
          </p>
        </div>
        <BlindArena />
      </section>

      <footer className="mt-auto flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <FlaskConical className="size-3" />
        Elo ratings are computed server-side from <code className="font-mono">ArenaMatchup</code> and
        stored in <code className="font-mono">ModelElo</code>.
      </footer>
    </div>
  );
}
