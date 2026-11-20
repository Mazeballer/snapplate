"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

/**
 * Next keeps a page you left in memory so going back is instant, which would bring a finished
 * flow (a saved meal, a photo already analysed) back exactly as it was. Leaving the page
 * remounts the content, so the next visit starts clean, and the camera is released while away.
 */
export function FreshOnVisit({ children }: { children: ReactNode }) {
  const [visit, setVisit] = useState(0);
  useEffect(() => () => setVisit((v) => v + 1), []);
  return <Fragment key={visit}>{children}</Fragment>;
}
