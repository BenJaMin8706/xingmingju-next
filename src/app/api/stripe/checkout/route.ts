import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-server";
import { getStripe } from "@/lib/stripe";

const CREDIT_PRICES: Record<string, { credits: number; name: string; price: number }> = {
  "100": { credits: 100, name: "100 星币", price: 1000 }, // ¥10 = 100 credits
  "500": { credits: 500, name: "500 星币", price: 4500 }, // ¥45 = 500 credits (10% off)
  "1200": { credits: 1200, name: "1200 星币", price: 9900 }, // ¥99 = 1200 credits (18% off)
  "monthly": { credits: 300, name: "月度会员", price: 3900 }, // ¥39/month
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { packageId } = await request.json();
    const priceConfig = CREDIT_PRICES[packageId];
    if (!priceConfig) {
      return NextResponse.json({ error: "无效的套餐" }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Stripe not configured - fallback: simulate success
      return NextResponse.json({
        success: true,
        demo: true,
        message: "演示模式：已充值 " + priceConfig.credits + " 星币",
      });
    }

    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: packageId === "monthly" ? "subscription" : "payment",
      line_items: [
        {
          price_data: {
            currency: "cny",
            product_data: { name: priceConfig.name },
            unit_amount: priceConfig.price,
            ...(packageId === "monthly"
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: { userId, packageId, credits: String(priceConfig.credits) },
      success_url: `${origin}/?payment=success&credits=${priceConfig.credits}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "支付创建失败" }, { status: 500 });
  }
}
