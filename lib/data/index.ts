import { MOCK_MODE } from "@/lib/mock";
import { mockDataSource } from "./mock";
import type { DataSource } from "./source";
import { supabaseDataSource } from "./supabase";

/** Sample data in mock mode, the signed-in user's real data otherwise. */
export const dataSource: DataSource = MOCK_MODE ? mockDataSource : supabaseDataSource;

export type { DataSource, SaveProfileInput } from "./source";
