"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { SettingsPage } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { buildShortcutPrompt, SHORTCUT_NAME } from "@/lib/health-shortcut";

function CopyBox({ label, text, mono = false }: { label: string; text: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Press and hold the text to copy it.");
    }
  }
  return (
    <div className="mt-2 flex items-start gap-2 rounded-xl border border-border bg-background p-3">
      <pre
        className={`max-h-40 min-w-0 flex-1 overflow-y-auto text-[0.8rem] whitespace-pre-wrap break-all text-foreground select-all ${mono ? "font-mono" : "font-sans"}`}
        aria-label={label}
      >
        {text}
      </pre>
      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-full" onClick={() => void copy()} aria-label={`Copy ${label}`}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function Steps({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="px-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
      <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card text-sm [&_b]:font-semibold">{children}</ol>
    </section>
  );
}

function Step({ n, children, check }: { n: number; children: ReactNode; check?: string }) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background" aria-hidden>
        {n}
      </span>
      <span className="min-w-0 flex-1">
        {children}
        {check ? <span className="mt-1 block text-xs text-success">You should see: {check}</span> : null}
      </span>
    </li>
  );
}

/** A short guide to the iPhone Shortcut that sends steps and active calories to Snapplate. */
export function AppleHealthGuide() {
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const endpoint = `${origin}/api/health-sync`;

  return (
    <SettingsPage title="Setup guide" backHref="/settings/apple-health">
      <p className="px-1 text-sm text-muted-foreground">
        A shortcut on your iPhone sends today&apos;s steps and active calories to Snapplate. About 5 minutes, once. Use your iPhone, in the Snapplate app.
      </p>

      <Steps title="1. Get your key and address">
        <Step n={1}>
          Go to <Link href="/settings/apple-health" className="font-semibold underline underline-offset-2">Apple Health</Link>, tap <b>Create my key</b>, and copy it. It is shown only once.
        </Step>
        <Step n={2}>
          Copy this address:
          <CopyBox label="Address" text={endpoint} mono />
        </Step>
      </Steps>

      <Steps title="2. Build the shortcut" note="Open the Shortcuts app and tap +. For every action: tap the Search box at the bottom, type the name, tap the result.">
        <Step n={1}>
          Name the shortcut exactly:
          <CopyBox label="Shortcut name" text={SHORTCUT_NAME} mono />
        </Step>
        <Step n={2} check="Type is Steps, Start Date is today, Unit count.">
          Type <b>Find Health Samples</b>. Pick Type <b>Steps</b> and Start Date <b>is today</b>. Not &quot;Log Health Sample&quot;, which writes data.
        </Step>
        <Step n={3} check="Calculate the Sum of Health Samples.">
          Type <b>Calculate Statistics</b>. Change the statistic to <b>Sum</b>.
        </Step>
        <Step n={4} check="Type is Active Energy, Start Date is today, Unit kcal.">
          Type <b>Find Health Samples</b> again. Change Type to <b>Active Energy</b>, Start Date <b>is today</b>, and Unit to <b>kcal</b> (not kJ).
        </Step>
        <Step n={5}>
          Type <b>Calculate Statistics</b> again. Change the statistic to <b>Sum</b>.
        </Step>
        <Step n={6} check="Method, Headers and Request Body rows appear.">
          Type <b>Get Contents of URL</b>. Paste the address as the URL, then tap the small circle arrow next to it. Set Method to <b>POST</b>.
        </Step>
        <Step n={7} check="The header name shows Authorization with a z.">
          Under Headers tap <b>Add new header</b>. Name: <b>Authorization</b>. Value: <b>Bearer</b>, a space, then your key. Check autocorrect didn&apos;t change the spelling.
        </Step>
        <Step n={8} check="steps and activeKcal each show a blue Sum, not 0.">
          Set Request Body to <b>JSON</b>. Tap <b>Add new field</b> twice and name them <b>steps</b> and <b>activeKcal</b> (choose Number if asked). For each, delete the 0 and tap a blue <b>Sum</b> above the keyboard: the first Sum for steps, the second for activeKcal.
        </Step>
        <Step n={9}>
          Type <b>Show Result</b> to add it last, so you can see Snapplate&apos;s reply.
        </Step>
      </Steps>

      <Steps title="3. Test it">
        <Step n={1} check="Allow prompt for sending health samples.">
          Tap the play button. Tap <b>Allow Once</b>.
        </Step>
        <Step n={2} check={`"ok" : true with your steps and activeKcal.`}>
          Read the reply.
        </Step>
        <Step n={3}>
          Run it once more and tap <b>Always Allow</b>.
        </Step>
        <Step n={4}>
          Open Snapplate. Apple Health should say <b>Connected</b> and Home should show your steps.
        </Step>
      </Steps>

      <Steps title="4. Syncing" note="Snapplate is a Home Screen web app, so iOS can't run the shortcut when you open it.">
        <Step n={1}>
          Whenever you want fresh numbers, tap <b>Sync now</b> on the Apple Health screen. It runs the shortcut.
        </Step>
        <Step n={2}>
          Optional: in the shortcut, add a <b>Time of Day</b> trigger (Search, tap Automation) so it also runs by itself a few times a day.
        </Step>
      </Steps>

      <Steps title="Or let Apple Intelligence build it" note="Only if your Shortcuts can build from a description (iOS 27). Send this, then add your key yourself.">
        <li className="px-3 pb-3">
          <CopyBox label="Prompt" text={buildShortcutPrompt(endpoint)} />
        </li>
      </Steps>

      <section className="flex flex-col gap-1 rounded-[18px] border border-border bg-card px-4 py-3 text-sm">
        <h2 className="font-bold">Not working?</h2>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
          <li>Invalid key: check the space after Bearer, and the spelling Authorization. Or make a new key.</li>
          <li>Steps are 0 or very high: the Sum chips are in the wrong fields, or Unit isn&apos;t kcal.</li>
          <li>Steps are 0: in the Health app, allow Shortcuts to read Steps and Active Energy.</li>
          <li>Sync now does nothing: the shortcut must be named exactly {SHORTCUT_NAME}.</li>
        </ul>
      </section>
    </SettingsPage>
  );
}
