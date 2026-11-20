// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PersistedCache } from "@/components/snapplate/persisted-cache";
import { cacheKeyFor, clearSavedCaches } from "@/lib/persist";

function Name() {
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => new Promise<string>(() => undefined), // the network never answers
  });
  return <p>{data ?? "loading"}</p>;
}

function Seed({ value }: { value: string }) {
  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => Promise.resolve(value) });
  return <p>{data ?? "loading"}</p>;
}

function tree(userId: string, child: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } } });
  return (
    <QueryClientProvider client={client}>
      <PersistedCache userId={userId}>{child}</PersistedCache>
    </QueryClientProvider>
  );
}

const sleep = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("saved copy of the app's data", () => {
  it("shows last session's data instantly, only for the same account, and is wiped on logout", async () => {
    // Session one loads the profile, which is saved to the device.
    const first = render(tree("user-1", <Seed value="Darryl" />));
    expect(await screen.findByText("Darryl")).toBeTruthy();
    await sleep(1800);
    first.unmount();
    expect(localStorage.getItem(cacheKeyFor("user-1"))).toContain("Darryl");

    // Session two: the network never answers, yet the saved name shows straight away.
    const second = render(tree("user-1", <Name />));
    expect(await screen.findByText("Darryl")).toBeTruthy();
    second.unmount();

    // A different account on the same device sees nothing of it.
    const other = render(tree("user-2", <Name />));
    await sleep(100);
    expect(screen.getByText("loading")).toBeTruthy();
    other.unmount();

    // Logging out removes the saved copy.
    clearSavedCaches(localStorage);
    expect(localStorage.getItem(cacheKeyFor("user-1"))).toBeNull();
    const after = render(tree("user-1", <Name />));
    await sleep(100);
    expect(screen.getByText("loading")).toBeTruthy();
    after.unmount();
  }, 15000);
});
