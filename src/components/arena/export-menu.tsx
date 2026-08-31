"use client";

import { useState } from "react";
import { Check, Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EXPORT_FORMAT_META,
  type ExportFormat,
  type ExportFile,
  type ExportSession,
} from "@/lib/export/types";
import { serializeSession } from "@/lib/export/serialize";

const FORMAT_ICONS: Record<ExportFormat, typeof FileJson> = {
  json: FileJson,
  csv: FileSpreadsheet,
  markdown: FileText,
};

/** Trigger a browser download of a generated export file. */
function download(file: ExportFile) {
  const blob = new Blob([file.content], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export interface ExportMenuProps {
  /** The evaluation session snapshot to export. */
  session: ExportSession;
  /** Disable the menu until there is at least one settled run. */
  disabled?: boolean;
}

export function ExportMenu({ session, disabled = false }: ExportMenuProps) {
  const [lastFormat, setLastFormat] = useState<ExportFormat | null>(null);

  function handleExport(format: ExportFormat) {
    download(serializeSession(session, format));
    setLastFormat(format);
    window.setTimeout(() => setLastFormat((current) => (current === format ? null : current)), 1600);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export evaluation session</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(EXPORT_FORMAT_META) as ExportFormat[]).map((format) => {
          const Icon = FORMAT_ICONS[format];
          const meta = EXPORT_FORMAT_META[format];
          const active = lastFormat === format;
          return (
            <DropdownMenuItem key={format} onSelect={() => handleExport(format)}>
              {active ? (
                <Check className="text-emerald-500" />
              ) : (
                <Icon className="text-muted-foreground" />
              )}
              {meta.label}
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                .{meta.extension}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
