import type { Metadata } from "next";

import PublicListingPolicyPage from "@/features/moderation/components/public-listing-policy-page";

export const metadata: Metadata = {
  title: "掲載基準",
  description: "p8ce が掲載する Event、承認する主催者、掲載を取り下げる場合の基準です。作品の質やジャンルでは判断しません。",
};

export default function ListingPolicy() {
  return <PublicListingPolicyPage />;
}
