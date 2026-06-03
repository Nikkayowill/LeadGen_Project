export const LEAD_STATUSES = [
  "Not Contacted",
  "Called",
  "Messaged",
  "Follow-Up",
  "Demo Booked",
  "Won",
  "Lost"
] as const;

export const WEBSITE_STATUSES = [
  "No Website",
  "Outdated Website",
  "Good Website",
  "Unknown"
] as const;

export const INTERACTION_TYPES = [
  "Call",
  "Facebook Message",
  "Instagram Message",
  "Email",
  "Demo",
  "Note"
] as const;

export const DEFAULT_PRICING = {
  oneTimePrice: 500,
  monthlyPrice: 20
};
