import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KeyVaultDialog } from "@/components/byok/key-vault-dialog";
import { KeyVaultStatus } from "@/components/byok/key-vault-status";
import { ModelArena } from "@/components/arena/model-arena";
import { FlaskConical, Gauge, ShieldCheck, Swords } from "lucide-react";
import Link from "next/link";

const FOUNDATION = [
  {
    icon: ShieldCheck,
    title: "BYOK Key Vault",
    body: "Provider keys are AES-encrypted with Web Crypto and kept in this browser's localStorage. They never touch the database or our servers.",
  },
  {
    icon: FlaskConical,
    title: "Prompt History",
    body: "PromptHistory stores prompt, system prompt, temperature, and timestamp. ModelRun captures output, TTFT, latency, token usage, and estimated cost.",
  },
  {
    icon: Swords,
    title: "Arena + Elo",
    body: "ArenaMatchup records head-to-head winners per prompt; ModelElo tracks a live rating per model (default 1500).",
  },
  {
    icon: Gauge,
    title: "Benchmark Metrics",
    body: "TTFT, total latency, input/output tokens, and estimated USD cost are persisted per run for apples-to-apples comparison.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">OmniEval</p>
            <p className="text-xs text-muted-foreground">
              Multi-model LLM benchmarking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/arena">
              <Swords />
              Arena Mode
            </Link>
          </Button>
          <KeyVaultDialog />
        </div>
      </header>

      <Separator />

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Model Arena
          </h2>
          <p className="text-sm text-muted-foreground">
            Run the same prompt across up to four models in parallel and compare
            quality, latency, and cost.
          </p>
        </div>
        <ModelArena />
      </section>

      <Separator />

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <main className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Benchmark models. Keep your keys.
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              OmniEval: Next.js 15 App Router, TypeScript, Tailwind CSS,
              shadcn/ui, Prisma with PostgreSQL, and the Vercel AI SDK.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FOUNDATION.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <item.icon className="size-4 text-muted-foreground" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.body}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <aside className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bring Your Own Key</CardTitle>
              <CardDescription>
                Keys are stored encrypted in this browser only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeyVaultStatus />
            </CardContent>
          </Card>
        </aside>
      </section>

      <footer className="mt-auto text-center text-xs text-muted-foreground">
        OmniEval · Prisma data model: User · PromptHistory · ModelRun ·
        ArenaMatchup · ModelElo
      </footer>
    </div>
  );
}
