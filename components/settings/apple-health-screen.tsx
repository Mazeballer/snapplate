"use client";

import { BookOpen, Check, CloudOff, Copy, KeyRound, RefreshCw, Unplug } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { SettingsGroup, SettingsLinkRow, SettingsPage } from "@/components/settings/settings-ui";
import { EmptyState } from "@/components/snapplate/empty-state";
import { Button } from "@/components/ui/button";
import { useCreateHealthToken, useHealthSync, useRevokeHealthToken } from "@/hooks/use-data";
import { RUN_SHORTCUT_URL } from "@/lib/health-shortcut";

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86_400), "day");
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Press and hold the text to copy it.");
    }
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block break-all font-mono text-[0.8rem] select-all">{value}</span>
      </span>
      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-full" onClick={() => void copy()} aria-label={`Copy ${label}`}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/** Connect Apple Health: make a personal key, then set up the Shortcut that sends steps and energy. */
export function AppleHealthScreen() {
  const status = useHealthSync();
  const create = useCreateHealthToken();
  const revoke = useRevokeHealthToken();
  // The address the Shortcut posts to: this site's own address, so it is right wherever it is hosted.
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const endpoint = `${origin}/api/health-sync`;
  const local = /localhost|127\.0\.0\.1/.test(origin);
  const [key, setKey] = useState<string | null>(null);

  function makeKey() {
    create.mutate(undefined, {
      onSuccess: (token) => setKey(token),
      onError: (error) => toast.error(`Couldn't make a key: ${error instanceof Error ? error.message : "unknown error"}`),
    });
  }

  function disconnect() {
    revoke.mutate(undefined, {
      onSuccess: () => {
        setKey(null);
        toast("Apple Health disconnected");
      },
      onError: () => toast.error("Couldn't disconnect. Please try again."),
    });
  }

  if (status.isError) {
    return (
      <SettingsPage title="Apple Health">
        <EmptyState icon={CloudOff} title="Couldn't load this page">
          Check your connection and try again.
        </EmptyState>
      </SettingsPage>
    );
  }

  const connected = status.data?.connected ?? false;
  const lastSync = status.data?.lastSyncAt ?? null;

  return (
    <SettingsPage title="Apple Health">
      <section className="flex flex-col gap-1 rounded-[18px] border border-border bg-card p-5" aria-label="Status">
        <span className="text-lg font-bold">{status.isPending ? "Checking…" : connected ? (lastSync ? "Connected" : "Key made, waiting for the first sync") : "Not connected"}</span>
        <span className="text-sm text-muted-foreground">
          {connected
            ? lastSync
              ? `Last sync ${relativeTime(lastSync)}.`
              : "Finish the shortcut (see the setup guide below), then run it once."
            : "Snapplate can't read Apple Health directly. A free Shortcut on your iPhone sends your steps and active calories here."}
        </span>
      </section>

      {local ? (
        <p className="rounded-2xl bg-warning/20 p-4 text-sm" role="note">
          You&apos;re on a local address. Open Snapplate from its real web address on your iPhone, so the Shortcut can reach it.
        </p>
      ) : null}

      {!connected && !key ? (
        <Button size="lg" className="h-12 gap-2 rounded-full text-base font-semibold" disabled={create.isPending} onClick={makeKey}>
          <KeyRound aria-hidden />
          {create.isPending ? "Making your key…" : "Create my key"}
        </Button>
      ) : null}

      {key ? (
        <section className="flex flex-col gap-2" aria-label="Your key">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">Your key and address</h2>
          <SettingsGroup>
            <CopyRow label="Key" value={key} />
            <CopyRow label="Address" value={endpoint} />
          </SettingsGroup>
          <p className="px-1 text-xs text-muted-foreground">Copy the key now. For your safety it can&apos;t be shown again; if you lose it, make a new one.</p>
        </section>
      ) : connected ? (
        <SettingsGroup title="Address">
          <CopyRow label="Address" value={endpoint} />
        </SettingsGroup>
      ) : null}

      {connected || key ? (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-12 gap-2 rounded-full text-base font-semibold"
            nativeButton={false}
            render={<a href={RUN_SHORTCUT_URL} />}
          >
            <RefreshCw aria-hidden />
            Sync now
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" className="h-11 gap-2 rounded-full" disabled={create.isPending} onClick={makeKey}>
              <KeyRound aria-hidden />
              New key
            </Button>
            <Button variant="outline" size="lg" className="h-11 gap-2 rounded-full text-destructive" disabled={revoke.isPending} onClick={disconnect}>
              <Unplug aria-hidden />
              Disconnect
            </Button>
          </div>
        </div>
      ) : null}

      <SettingsGroup title="Help">
        <SettingsLinkRow href="/settings/apple-health/guide" icon={BookOpen} label="Setup guide" value="Step by step" />
      </SettingsGroup>
    </SettingsPage>
  );
}
