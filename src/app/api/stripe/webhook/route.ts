import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Stripe Webhook handler.
 * Verifies Stripe signature, then processes completed checkout sessions
 * to add credits to the user's Supabase Auth metadata.
 *
 * To set up:
 * 1. Deploy this endpoint
 * 2. Go to Stripe Dashboard > Webhooks > Add endpoint
 * 3. URL: https://xingmingju-next.vercel.app/api/stripe/webhook
 * 4. Select event: checkout.session.completed
 * 5. Copy the "Signing secret" and set STRIPE_WEBHOOK_SECRET in Vercel env vars
 */

const CREDIT_MAP: Record<string, number> = {
  "100": 100,
  "500": 500,
  "1200": 1200,
  monthly: 300,
};

async function addCreditsToUser(userId: string, credits: number): Promise<boolean> {
  if (!userId || userId === "anonymous") {
    console.warn("Webhook received payment for anonymous user, skipping");
    return false;
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error("Supabase not configured for webhook credit update");
    return false;
  }

  try {
    // Get current credits from auth metadata
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    if (getUserError || !userData?.user) {
      console.error("Failed to get user for credit update:", getUserError?.message);
      return false;
    }

    const currentCredits = (userData.user.user_metadata as Record<string, unknown>)?.credits as number || 0;
    const newCredits = currentCredits + credits;

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { credits: newCredits },
    });

    if (updateError) {
      console.error("Failed to update user credits:", updateError.message);
      return false;
    }

    console.log(`Added ${credits} credits to user ${userId}, balance: ${newCredits}`);
    return true;
  } catch (err) {
    console.error("Error in webhook credit update:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("STRIPE_WEBHOOK_SECRET not set, accepting unverified webhook (insecure)");
    // Fall back to basic parsing without signature verification
    try {
      const body = await request.json();
      if (body.type === "checkout.session.completed") {
        const session = body.data?.object;
        const userId = session?.metadata?.userId || session?.client_reference_id;
        const packageId = session?.metadata?.packageId;
        const credits = CREDIT_MAP[packageId] || parseInt(session?.metadata?.credits || "0", 10);

        if (userId && credits > 0) {
          await addCreditsToUser(userId, credits);
        }
      }
      return NextResponse.json({ received: true });
    } catch {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
  }

  // Verified webhook path
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId || session.client_reference_id || "";
      const packageId = session.metadata?.packageId || "";
      const credits = CREDIT_MAP[packageId] || parseInt(session.metadata?.credits || "0", 10);

      if (userId && credits > 0) {
        const success = await addCreditsToUser(userId, credits);
        if (!success) {
          console.error(`Failed to credit ${credits} to user ${userId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
