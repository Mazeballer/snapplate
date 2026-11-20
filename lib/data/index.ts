import type { DataSource } from "./source";
import { supabaseDataSource } from "./supabase";

/** The signed-in user's real data. */
export const dataSource: DataSource = supabaseDataSource;

export type { DataSource, SaveProfileInput } from "./source";
