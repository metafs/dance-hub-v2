import { eventMainImageResponse } from "@/features/media/delivery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  return eventMainImageResponse(eventId);
}
