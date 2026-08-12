const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const TIMEOUT_MS = 6000; // never let a slow AI call hang up a demo

/**
 * Asks DeepSeek for a one-line, human-readable insight about a customer's
 * behavior. Always resolves — falls back to a plain, honest sentence built
 * from the raw numbers if DEEPSEEK_API_KEY is unset, the call times out, or
 * it errors for any reason. This is deliberate: a live demo should never
 * hang or throw because a third-party API had a bad moment.
 */
export async function generateSegmentInsight(summary: {
  segment: string;
  eventCount: number;
  purchaseCount: number;
  topProduct?: string;
  productViewCount?: number;
}): Promise<string> {
  const fallback = buildFallbackInsight(summary);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You write one short, plain-English sentence (under 20 words) summarizing a customer's shopping behavior for a business owner. No preamble, no quotes, just the sentence.",
          },
          {
            role: "user",
            content: `Segment: ${summary.segment}. Total tracked events: ${summary.eventCount}. Purchases: ${summary.purchaseCount}.${
              summary.topProduct
                ? ` Most viewed product: "${summary.topProduct}" (${summary.productViewCount} views).`
                : ""
            }`,
          },
        ],
        max_tokens: 60,
        temperature: 0.4,
      }),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    return text || fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackInsight(summary: {
  segment: string;
  eventCount: number;
  purchaseCount: number;
  topProduct?: string;
}): string {
  if (summary.purchaseCount > 0) {
    return `Has completed ${summary.purchaseCount} purchase${summary.purchaseCount > 1 ? "s" : ""} across ${summary.eventCount} tracked interactions.`;
  }
  if (summary.topProduct) {
    return `Has been browsing actively, most interested in "${summary.topProduct}", but hasn't purchased yet.`;
  }
  return `Tracked ${summary.eventCount} interactions so far with no purchase yet.`;
}
