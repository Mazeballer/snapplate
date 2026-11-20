"use client";

import { AlertTriangle, Check, Copy, Info } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { SettingsPage } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { buildShortcutPrompt, FIX_UP_PROMPT, SHORTCUT_NAME, WORKOUTS_PROMPT } from "@/lib/health-shortcut";
import { cn } from "@/lib/utils";

function Part({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="text-lg font-bold">{title}</h2>
        {intro ? <p className="text-sm text-muted-foreground">{intro}</p> : null}
      </div>
      <ol className="flex flex-col gap-3">{children}</ol>
    </section>
  );
}

function Step({ n, title, children, see }: { n: number | string; title: string; children: ReactNode; see?: string }) {
  return (
    <li className="flex gap-3 rounded-[18px] border border-border bg-card p-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background" aria-hidden>
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">{children}</div>
        {see ? (
          <p className="flex gap-2 rounded-xl bg-success/12 px-3 py-2 text-[0.8rem] text-success">
            <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{see}</span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Callout({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return (
    <p className={cn("flex gap-2 rounded-2xl p-3 text-sm", tone === "warn" ? "bg-warning/20" : "bg-muted")}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function Field({ label, value }: { label: string; value: string }) {
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
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[0.7rem] text-muted-foreground">{label}</span>
        <span className="block break-all font-mono text-[0.8rem] text-foreground select-all">{value}</span>
      </span>
      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-full" onClick={() => void copy()} aria-label={`Copy ${label}`}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function PromptBox({ label, text }: { label: string; text: string }) {
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
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
      <pre className="max-h-56 overflow-y-auto font-sans text-[0.8rem] leading-relaxed whitespace-pre-wrap text-foreground select-all" aria-label={label}>
        {text}
      </pre>
      <Button type="button" variant="outline" size="sm" className="gap-1.5 self-end rounded-full" onClick={() => void copy()} aria-label={`Copy ${label}`}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

const PROBLEMS: { problem: string; fix: string }[] = [
  {
    problem: "The result says invalid_token, or “That key isn't valid”.",
    fix: "The key was typed wrong or has been replaced. Check that the header value is Bearer, one space, then the key. If in doubt, tap New key on the Apple Health screen and paste the new one.",
  },
  {
    problem: "The result says nothing_to_sync, or invalid_steps.",
    fix: "The steps and activeKcal fields didn't receive a number. Check each is set to Number and that its value is the Sum from the matching Calculate Statistics step, not the word “Statistics”.",
  },
  {
    problem: "Steps or energy show 0.",
    fix: "Shortcuts doesn't have permission to read that Health data. In the Health app tap your picture, Apps, Shortcuts, and turn on Steps and Active Energy. Also check the Start Date filter says is Today.",
  },
  {
    problem: "Nothing happens when I open Snapplate.",
    fix: "The automation might be set to ask first. Open it in Shortcuts, turn off Ask Before Running, and use Run Immediately. If Snapplate isn't in the app list, use the Time of Day automations instead.",
  },
  {
    problem: "The Sync now button does nothing.",
    fix: `The shortcut must be named exactly “${SHORTCUT_NAME}”, including the capital letters and the space.`,
  },
  {
    problem: "The numbers on Home look old.",
    fix: "Run the shortcut, then come back to Snapplate. Home refreshes when you return to the app. Today's numbers keep rising as you move, so the shortcut should run again later in the day.",
  },
];

/** A step-by-step guide to the iPhone Shortcut that sends steps and active energy to Snapplate. */
export function AppleHealthGuide() {
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const endpoint = `${origin}/api/health-sync`;

  return (
    <SettingsPage title="Setup guide" backHref="/settings/apple-health">
      <section className="flex flex-col gap-2 rounded-[18px] border border-border bg-card p-5">
        <h2 className="text-lg font-bold">What this does</h2>
        <p className="text-sm text-muted-foreground">
          A web app can&apos;t read Apple Health. So you make a small shortcut on your iPhone that reads your <b className="text-foreground">steps</b> and{" "}
          <b className="text-foreground">active calories</b> (which already include your workouts) and sends them to Snapplate. They show on Home, and if you
          turn on “Add calories burned back”, they raise your daily goal.
        </p>
        <p className="text-sm text-muted-foreground">It takes about 10 minutes, once. It&apos;s free and the numbers only go to your own Snapplate.</p>
      </section>

      <Part title="Before you start">
        <Step n={1} title="Use your iPhone, in the installed app">
          <p>
            Do this on the iPhone that holds your Health data, with Snapplate open from its <b>Home Screen icon</b> (not a Safari tab), so the address below is
            your real one.
          </p>
        </Step>
        <Step n={2} title="Make your key">
          <p>
            Go back to <Link href="/settings/apple-health" className="font-semibold text-foreground underline underline-offset-2">Apple Health</Link> and tap{" "}
            <b>Create my key</b>, then tap <b>Copy</b>. The key is shown only once. You&apos;ll paste it in step 5, so don&apos;t close the page until you
            have.
          </p>
          <Callout>If the key disappears before you used it, no problem. Tap New key for a fresh one.</Callout>
        </Step>
        <Step n={3} title="Your address">
          <p>This is where the shortcut sends your numbers.</p>
          <Field label="Address" value={endpoint} />
        </Step>
      </Part>

      <Part
        title="Option 1: Let Apple Intelligence build it"
        intro="On iOS 27 the Shortcuts app can build a shortcut from a written description. It's the quickest way, but check what it builds."
      >
        <Step n={1} title="Copy the prompt">
          <p>This message has your address filled in and tells it exactly what to build, including the automation. It does not contain your key.</p>
          <PromptBox label="Prompt" text={buildShortcutPrompt(endpoint)} />
        </Step>
        <Step n={2} title="Give it to Shortcuts">
          <p>
            Open the <b>Shortcuts</b> app, tap <b>+</b> and choose the option to <b>describe</b> what you want (or ask Siri to create a shortcut). Paste the prompt and
            send it. Accept the shortcut it proposes.
          </p>
          <Callout>If it asks a question, answer with the rule from the prompt, for example &ldquo;use Active Energy, not Exercise Minutes&rdquo;.</Callout>
        </Step>
        <Step n={3} title="Add your key yourself">
          <p>
            Open the shortcut, tap <b>Get Contents of URL</b> and <b>Show More</b>. In the header, replace <b>PASTE_MY_KEY_HERE</b> with the key you copied. Keep the word{" "}
            <b>Bearer</b> and one space before it.
          </p>
          <Callout tone="warn">Don&apos;t send your key to the assistant. Only you should type it, so it never goes through a prompt.</Callout>
        </Step>
        <Step n={4} title="Check it, and fix it if needed" see="Two Number fields named steps and activeKcal, a header named Authorization, and Method POST.">
          <p>Look over the actions against the list in the guide below. If something is off, send this follow-up:</p>
          <PromptBox label="Fix-up message" text={FIX_UP_PROMPT} />
        </Step>
        <Step n={5} title="Optional: add your named workouts">
          <p>Your calories are already right without this. It only lists each workout by name.</p>
          <PromptBox label="Workouts message" text={WORKOUTS_PROMPT} />
        </Step>
        <Step n={6} title="Test it, then check the automation">
          <p>
            Continue with <b>Part 2: Test it</b> below. In the Automation tab you should see the automation it made, set to Run Immediately. If not, follow Part 3.
          </p>
        </Step>
      </Part>

      <h2 className="px-1 pt-2 text-xl font-bold">Option 2: Build it by hand</h2>

      <Part title="Part 1: Build the shortcut" intro="Open the Shortcuts app (the purple and pink icon). If you can't find it, swipe down on the Home Screen and search.">
        <Step n={1} title="Start a new shortcut">
          <p>
            On the <b>Shortcuts</b> tab tap <b>+</b> at the top right. Tap the name at the top, choose <b>Rename</b>, and call it exactly:
          </p>
          <Field label="Shortcut name" value={SHORTCUT_NAME} />
        </Step>

        <Step n={2} title="Read today's steps" see="You'll see two actions: Find Health Samples, then Calculate Statistics.">
          <p>
            Tap <b>Add Action</b>, search <b>Find Health Samples</b> and add it.
          </p>
          <p>
            Set <b>Type</b> to <b>Steps</b>. Add a filter <b>Start Date</b> <b>is Today</b>.
          </p>
          <p>
            Add another action: <b>Calculate Statistics</b>. Set the statistic to <b>Sum</b>.
          </p>
        </Step>

        <Step n={3} title="Read today's active calories" see="Now you have two Find Health Samples and two Calculate Statistics, in pairs.">
          <p>
            Add <b>Find Health Samples</b> again. Set <b>Type</b> to <b>Active Energy</b> and the filter <b>Start Date is Today</b>.
          </p>
          <p>
            Add <b>Calculate Statistics</b> again, set to <b>Sum</b>.
          </p>
          <Callout>Active Energy already includes the calories from your workouts, so you don&apos;t need anything extra for an accurate total.</Callout>
        </Step>

        <Step n={4} title="Send them to Snapplate" see="The action shows a URL, then Method, Headers and Request Body once you tap Show More.">
          <p>
            Add the action <b>Get Contents of URL</b>. Paste the address from above into the URL.
          </p>
          <p>
            Tap <b>Show More</b>. Set <b>Method</b> to <b>POST</b>.
          </p>
        </Step>

        <Step n={5} title="Add your key" see="The header reads Authorization on the left and Bearer followed by your key on the right.">
          <p>
            Under <b>Headers</b> tap <b>Add new header</b>. For the key type <b>Authorization</b>. For the text type <b>Bearer</b>, then one space, then paste your key.
          </p>
          <Callout tone="warn">There must be a space after the word Bearer, and nothing else after the key.</Callout>
        </Step>

        <Step n={6} title="Add the numbers" see="Request Body shows JSON with two fields: steps and activeKcal.">
          <p>
            Set <b>Request Body</b> to <b>JSON</b>. Tap <b>Add new field</b> and choose <b>Number</b>.
          </p>
          <p>
            Field 1: name it <b>steps</b>. For the value, tap the box and choose the <b>Statistics</b> result from step 2 of this part (the one after the Steps samples).
          </p>
          <p>
            Field 2: add another Number named <b>activeKcal</b>, and choose the <b>Statistics</b> result from step 3 (after the Active Energy samples).
          </p>
          <Callout>If both fields show the same name, tap them and check each points to the right Calculate Statistics. The first is steps, the second is active energy.</Callout>
        </Step>

        <Step n={7} title="Show the reply (to check it works)">
          <p>
            Add a last action: <b>Show Result</b>. It shows what Snapplate answers, which helps while setting up. You can delete it later.
          </p>
        </Step>
      </Part>

      <Part title="Part 2: Test it">
        <Step n={1} title="Run it once" see={`The result shows "ok": true with your date, steps and activeKcal.`}>
          <p>
            Tap the <b>play</b> button. The first time, iOS asks to let Shortcuts read your Health data and to send data to your Snapplate address. Tap{" "}
            <b>Allow</b> (or <b>Always Allow</b>) for each.
          </p>
        </Step>
        <Step n={2} title="Check Snapplate" see="Settings, Apple Health says Connected with a recent time, and Home shows your steps.">
          <p>Open Snapplate. Home refreshes when you come back to it.</p>
        </Step>
      </Part>

      <Part title="Part 3: Make it run by itself" intro="Pick whichever works on your phone. You can use more than one.">
        <Step n="A" title="Every time you open Snapplate (best)">
          <p>
            In Shortcuts open the <b>Automation</b> tab, tap <b>+</b>, then <b>App</b>. Tap <b>Choose</b>, pick <b>Snapplate</b>, and leave <b>Is Opened</b>
            selected. Tap <b>Next</b>.
          </p>
          <p>
            Choose <b>Run Shortcut</b>, select <b>{SHORTCUT_NAME}</b>, tap <b>Next</b>, then choose <b>Run Immediately</b> and tap <b>Done</b>.
          </p>
          <Callout>If Snapplate isn&apos;t in the list of apps, iOS doesn&apos;t treat Home Screen web apps as apps here. Use B instead.</Callout>
        </Step>
        <Step n="B" title="A few times a day">
          <p>
            In Automation tap <b>+</b>, then <b>Time of Day</b>. Pick a time, set it to <b>Daily</b>, choose the shortcut, and choose <b>Run Immediately</b>.
          </p>
          <p>Make a few, for example 8:00 am, 1:00 pm, 6:00 pm and 10:00 pm, so your numbers stay close to current.</p>
        </Step>
        <Step n="C" title="Sync on demand">
          <p>
            Anytime, open <Link href="/settings/apple-health" className="font-semibold text-foreground underline underline-offset-2">Settings, Apple Health</Link>{" "}
            and tap <b>Sync now</b>. It runs the shortcut and brings you back.
          </p>
        </Step>
      </Part>

      <Part
        title="Part 4 (optional): Add your named workouts"
        intro="Your calories are already right without this. It only adds each workout, like “Running, 32 min”, to your day's list. It's fiddly, so skip it if you like."
      >
        <Step n={1} title="Find today's workouts">
          <p>
            Before <b>Get Contents of URL</b>, add <b>Find Health Samples</b> with <b>Type</b> <b>Workouts</b> and <b>Start Date is Today</b>.
          </p>
        </Step>
        <Step n={2} title="Describe each workout">
          <p>
            Add <b>Repeat with Each</b>. Inside it add a <b>Dictionary</b> with four Text items: <b>name</b> (the workout&apos;s type), <b>startedAt</b> (its start date),{" "}
            <b>durationMin</b> (its duration) and <b>calories</b> (its active energy).
          </p>
          <p>
            Before the Dictionary, add <b>Format Date</b> on the start date with the format <b>ISO 8601</b>, and use that for <b>startedAt</b>. Snapplate needs the date in that form.
          </p>
          <p>
            After the Dictionary add <b>Add to Variable</b> and name the variable <b>Workouts</b>.
          </p>
        </Step>
        <Step n={3} title="Send the list too">
          <p>
            In the JSON body of <b>Get Contents of URL</b>, add one more field of type <b>List</b> named <b>workouts</b>, with the <b>Workouts</b> variable as its value.
          </p>
          <Callout>Snapplate ignores a workout it has already received, so running the shortcut many times a day won&apos;t duplicate anything.</Callout>
        </Step>
      </Part>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-lg font-bold">If something goes wrong</h2>
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card">
          {PROBLEMS.map((p) => (
            <li key={p.problem} className="flex flex-col gap-1 px-4 py-3">
              <span className="text-sm font-semibold">{p.problem}</span>
              <span className="text-sm text-muted-foreground">{p.fix}</span>
            </li>
          ))}
        </ul>
        <p className="px-1 text-xs text-muted-foreground">
          The exact names of buttons in Shortcuts can differ a little between iOS versions. If a word doesn&apos;t match, look for the closest one.
        </p>
      </section>
    </SettingsPage>
  );
}
