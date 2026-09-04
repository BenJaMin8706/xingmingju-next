import { NextRequest, NextResponse } from "next/server";
import { adjustUserCredits } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";

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

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Refuse to process unverified webhooks — forged events could grant free credits.
    console.error("STRIPE_WEBHOOK_SECRET not set, rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
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
      const credits = CREDIT_MAP[packageId] || 0;

      if (userId && credits > 0) {
        const adjustment = await adjustUserCredits(userId, credits, "stripe_payment", `stripe:${event.id}`);
        if (!adjustment?.success) {
          console.error(`Failed to credit ${credits} to user ${userId}`);
          return NextResponse.json({ error: "Credit update failed" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
