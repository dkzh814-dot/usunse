import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PRODUCTS = {
  fiveElements: {
    priceId: process.env.STRIPE_PRICE_FIVE_ELEMENTS!,
    name: "Five Elements Analysis",
    price: 100, // $1.00
    description: "Your elemental blueprint decoded.",
  },
  compatibility: {
    priceId: process.env.STRIPE_PRICE_COMPATIBILITY!,
    name: "Detailed Compatibility",
    price: 100, // $1.00
    description: "Check anyone's compatibility with you.",
  },
  compat: {
    priceId: process.env.STRIPE_PRICE_COMPATIBILITY!,
    name: "Are we compatible?",
    price: 100, // $1.00
    description: "See what your charts say about each other.",
  },
  fullReading: {
    priceId: process.env.STRIPE_PRICE_FULL_READING!,
    name: "Full Saju Life Reading",
    price: 900, // $9.00
    description: "Your complete destiny map.",
  },
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: "Monthly Fortune",
    price: 500, // $5.00/month
    description: "What's ahead each month.",
  },
};
