import { getSupabase } from "./supabase";

type CreditAdjustment = {
  success: boolean;
  newBalance: number;
  duplicate: boolean;
};

export async function adjustUserCredits(
  userId: string,
  delta: number,
  reason: string,
  eventId: string,
): Promise<CreditAdjustment | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("adjust_user_credits", {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
    p_event_id: eventId,
  });

  if (error) {
    console.error("[credits] adjustment failed:", error.message);
    return null;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return null;

  return {
    success: Boolean(result.success),
    newBalance: Number(result.new_balance) || 0,
    duplicate: Boolean(result.duplicate),
  };
}