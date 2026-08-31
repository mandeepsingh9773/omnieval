"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { maskSecret } from "@/lib/byok/crypto";
import { useKeyVault } from "@/lib/byok/key-vault";
import { PROVIDER_METADATA, PROVIDER_LIST } from "@/lib/byok/providers";
import { KEY_PROVIDERS } from "@/lib/byok/types";
import type { KeyProvider, ValidationResult, ValidationStatus } from "@/lib/byok/types";

/**
 * shadcn Dialog for managing BYOK provider keys.
 *
 * - Keys are encrypted in the browser and stored only in localStorage.
 * - The vault exposes masked, in-memory keys to the rest of the app.
 * - Validation is performed client-side against the provider's public API.
 */

const STATUS_META: Record<
  Exclude<ValidationStatus, "idle" | "validating">,
  { title: string; description: string }
> = {
  valid: {
    title: "Key validated",
    description: "The key is active and the provider accepted it.",
  },
  invalid: {
    title: "Invalid key",
    description: "The provider rejected this key. Double-check it and try again.",
  },
  error: {
    title: "Could not validate",
    description: "Validation could not be completed. The key was still saved locally.",
  },
};

function ProviderKeyPanel({ provider }: { provider: KeyProvider }) {
  const { keys, hasKey, isReady, setKey, removeKey, validateKey } = useKeyVault();
  const meta = PROVIDER_METADATA[provider];

  const [draft, setDraft] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [result, setResult] = useState<ValidationResult | null>(null);

  const configured = hasKey(provider);
  const storedValue = keys[provider];

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;

    setBusy("save");
    setStatus("validating");
    try {
      await setKey(provider, trimmed);
      const validation = await validateKey(provider);
      setResult(validation);
      setStatus(validation.status);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      setResult({ ok: false, status: "error", message });
      setStatus("error");
    } finally {
      setDraft("");
      setBusy(null);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy("remove");
    try {
      await removeKey(provider);
      setStatus("idle");
      setResult(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      setResult({ ok: false, status: "error", message });
      setStatus("error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {configured ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              Configured
            </Badge>
            <code className="truncate text-xs text-muted-foreground">
              {storedValue ? maskSecret(storedValue) : "••••"}
            </code>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${meta.label} key`}
            disabled={busy !== null}
            onClick={handleRemove}
          >
            {busy === "remove" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Trash2 />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {meta.label} key stored yet.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`key-${provider}`}>
          {configured ? "Replace key" : `${meta.label} API key`}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={`key-${provider}`}
              type={showDraft ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder={meta.placeholder}
              value={draft}
              disabled={!isReady || busy !== null}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSave();
              }}
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowDraft((prev) => !prev)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showDraft ? "Hide key" : "Show key"}
              tabIndex={-1}
            >
              {showDraft ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button
            variant="outline"
            disabled={!isReady || busy !== null || !draft.trim()}
            onClick={handleSave}
          >
            {busy === "save" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Save &amp; Validate
          </Button>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{meta.help}</span>
          <a
            href={meta.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            Get a key <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {status === "validating" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" />
          Validating key against {meta.label}…
        </div>
      )}

      {(status === "valid" || status === "invalid" || status === "error") && (
        <Alert variant={status === "valid" ? "default" : "destructive"}>
          {status === "valid" ? (
            <CheckCircle2 />
          ) : status === "invalid" ? (
            <XCircle />
          ) : (
            <AlertCircle />
          )}
          <AlertTitle>{STATUS_META[status].title}</AlertTitle>
          <AlertDescription>
            {result?.message ?? STATUS_META[status].description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export interface KeyVaultDialogProps {
  /** Replace the default "API Keys" trigger button. */
  trigger?: React.ReactNode;
  /** Optional controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyVaultDialog({
  trigger,
  open,
  onOpenChange,
}: KeyVaultDialogProps = {}) {
  const { keys, isReady } = useKeyVault();
  const configuredCount = KEY_PROVIDERS.filter((provider) => Boolean(keys[provider])).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={!isReady}>
            <KeyRound />
            API Keys
            <Badge variant="secondary">{configuredCount}/{KEY_PROVIDERS.length}</Badge>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Your API Keys</DialogTitle>
          <DialogDescription>
            Bring your own keys. Keys are AES-encrypted and stored only in your
            browser&apos;s localStorage — they are never sent to OmniEval servers,
            never logged, and never stored in the database. When a run is
            executed, your key is used directly against the provider from this
            browser.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="openai">
          <TabsList className="w-full">
            {PROVIDER_LIST.map((meta) => (
              <TabsTrigger key={meta.id} value={meta.id}>
                {meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {PROVIDER_LIST.map((meta) => (
            <TabsContent key={meta.id} value={meta.id} className="pt-2">
              <ProviderKeyPanel provider={meta.id} />
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter showCloseButton className="flex-col-reverse sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground sm:justify-start">
            Stored locally · encrypted at rest
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
