import {
  INTERACTION_TYPES,
  LEAD_STATUSES,
  WEBSITE_STATUSES
} from "@/lib/constants";

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export type LeadFilters = {
  q?: string;
  status?: string;
  industry?: string;
  websiteStatus?: string;
  followUp?: "today" | "overdue" | "upcoming";
};
