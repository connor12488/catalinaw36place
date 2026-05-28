import { getQaSource } from "@/lib/env";
import { listQaEntries, listActiveQaEntries } from "@/lib/qa";
import { listYamlQaEntries } from "@/lib/loadYamlQa";
import type { QaEntry } from "@/lib/types";

export async function listRuntimeQaEntries(): Promise<QaEntry[]> {
  if (getQaSource() === "db") {
    return listActiveQaEntries();
  }

  return listYamlQaEntries();
}

export async function listDashboardQaEntries(): Promise<QaEntry[]> {
  if (getQaSource() === "db") {
    return listQaEntries();
  }

  return listYamlQaEntries();
}
