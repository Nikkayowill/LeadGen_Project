import { DEFAULT_PRICING } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Lead } from "@/lib/types/database";

export function generatePitchMessages(lead: Lead) {
  const price = formatCurrency(lead.quoted_price ?? DEFAULT_PRICING.oneTimePrice);
  const monthly = formatCurrency(lead.monthly_fee ?? DEFAULT_PRICING.monthlyPrice);
  const business = lead.business_name;
  const industry = lead.industry ?? "your business";
  const location = lead.location ? ` in ${lead.location}` : "";

  return {
    facebook: `Hi ${lead.contact_name ?? "there"}, I was looking at ${business} and noticed an opportunity to make it easier for local customers${location} to find you, trust you, and contact you online. I build clean small-business websites starting at ${price} plus ${monthly}/month for hosting and care. Would it be worth a quick chat this week?`,
    phone: `Hi, is this ${lead.contact_name ?? `someone from ${business}`}? My name is [Your Name]. I help local ${industry} businesses turn visitors into calls and quote requests with simple, professional websites. I had a couple ideas for ${business} and wanted to see if improving your online presence is something you are considering this month.`,
    followUp: `Hi ${lead.contact_name ?? "there"}, just following up on my note about ${business}. I can send over a simple website plan with pricing and a few examples. The usual starting point is ${price} plus ${monthly}/month, and I can tailor it around what you actually need.`
  };
}
