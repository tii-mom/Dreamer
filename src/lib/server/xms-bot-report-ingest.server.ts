export function wantsLongReport(text: string) {
  const keys = ["report", "full", "detail"];
  return keys.some((key) => text.toLowerCase().includes(key));
}

export type ClawbotIngestBody = {
  provider?: string;
  providerUserId?: string;
  content?: string;
  rawPayload?: unknown;
};
