export type PromoResult = {
  ok: boolean;
  error?: string;
  id?: string;
  name?: string;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  discount_idr?: number;
};

type PromoClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: PromoResult | null; error: { message?: string } | null }>;
};

export function birthdayTotals(subtotal: number, discount: number) {
  const base = Math.max(0, Math.round(Number(subtotal) || 0));
  const off = Math.max(0, Math.min(base, Math.round(Number(discount) || 0)));
  const net = base - off;
  const service = Math.round(net * 0.05);
  const tax = Math.round((net + service) * 0.1);
  const total = net + service + tax;
  return {
    subtotal: base,
    discount: off,
    service,
    tax,
    total,
    dp30: Math.round(total * 0.3),
  };
}

export async function callPromo(
  supabase: PromoClient,
  fn: "preview_promotion" | "redeem_promotion",
  code: string,
  channel: string,
  amount: number,
): Promise<PromoResult> {
  const { data, error } = await supabase.rpc(fn, {
    p_code: code,
    p_channel: channel,
    p_amount: Math.max(0, Math.round(amount)),
  });
  if (error || !data) return { ok: false, error: "Could not check that promo code." };
  return data;
}

export async function releasePromo(supabase: PromoClient, id: string) {
  if (!id) return;
  await supabase.rpc("release_promotion", { p_id: id });
}
