// Token counts come from Gemini's usage report on every call. Cost is only shown
// when an admin has entered the model's price on the LLM models page.
export type Price = { model_key: string; input_cost_per_million: number | null; output_cost_per_million: number | null };

export function costOf(prices: Price[], model: string, promptTokens: number | null, outputTokens: number | null) {
  const p = prices.find((x) => x.model_key === model);
  if (!p || p.input_cost_per_million == null || p.output_cost_per_million == null) return null;
  return ((promptTokens ?? 0) * Number(p.input_cost_per_million) + (outputTokens ?? 0) * Number(p.output_cost_per_million)) / 1e6;
}

export const fmtCost = (usd: number | null) => (usd == null ? null : usd < 0.01 ? `$${usd.toFixed(5)}` : `$${usd.toFixed(3)}`);
export const fmtTokens = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString("en-US"));
