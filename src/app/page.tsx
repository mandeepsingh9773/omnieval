import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/app-header";
import { KeyVaultStatus } from "@/components/byok/key-vault-status";
import { ModelArena } from "@/components/arena/model-arena";
import { FlaskConical, Gauge, ShieldCheck, Swords } from "lucide-react";

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
      <AppHeader
        subtitle="Multi-model LLM benchmarking"
        nav={{ href: "/arena", label: "Arena Mode", icon: Swords }}
      />

      <Separator />

      <main className="flex flex-col gap-8">
        <section className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Benchmark models. Keep your keys.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Compare OpenAI, Anthropic, Gemini, and Groq head-to-head — run the
            same prompt, measure latency and cost, and vote in blind battles.
            Keys stay encrypted in your browser.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Model Arena
            </h2>
            <p className="text-sm text-muted-foreground">
              Run the same prompt across up to four models in parallel and
              compare quality, latency, and cost.
            </p>
          </div>
          <ModelArena />
        </section>

        <Separator />

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
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
          </div>

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
      </main>

      <footer className="mt-auto text-center text-xs text-muted-foreground">
        OmniEval · Prisma data model: User · PromptHistory · ModelRun ·
        ArenaMatchup · ModelElo
      </footer>
    </div>
  );
}
