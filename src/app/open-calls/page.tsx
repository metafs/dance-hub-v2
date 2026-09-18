import type { Metadata } from "next";

import OpenCallPage from "@/features/discovery/components/open-call-page";

export const metadata: Metadata = {
  title: "募集中",
  description: "オーディション、公募、レジデンスを応募締切の近い順に掲載しています。",
};

export default function OpenCalls() {
  return <OpenCallPage />;
}
