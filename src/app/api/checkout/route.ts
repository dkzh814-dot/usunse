import { NextRequest, NextResponse } from "next/server";
import { stripe, PRODUCTS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, name, dob, hour, name2, dob2, email, successPath } = body;

    const product = PRODUCTS[tier as keyof typeof PRODUCTS];
    if (!product) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usunse.com";
    const successParams = new URLSearchParams({
      ...(name  ? { name }  : {}),
      ...(dob   ? { dob }   : {}),
      ...(hour  ? { hour }  : {}),
      ...(name2 ? { name2 } : {}),
      ...(dob2  ? { dob2 }  : {}),
      ...(email ? { email } : {}),
      tier,
      success: "1",
    });

    const basePath = successPath ?? `/paid/${tier}`;
    const cancelPath = successPath ?? `/result?${new URLSearchParams({ name: name || "", dob: dob || "", ...(hour ? { hour } : {}) }).toString()}`;

    const isSubscription = tier === "monthly";

    let session;

    if (isSubscription) {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: product.priceId, quantity: 1 }],
        success_url: `${appUrl}${basePath}?${successParams.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${cancelPath}`,
        metadata: { tier, name: name || "", dob: dob || "", hour: hour || "" },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: product.priceId, quantity: 1 }],
        success_url: `${appUrl}${basePath}?${successParams.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${cancelPath}`,
        metadata: { tier, name: name || "", dob: dob || "", hour: hour || "" },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
