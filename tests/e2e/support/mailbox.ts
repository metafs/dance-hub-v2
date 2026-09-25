import { expect } from "@playwright/test";

// The local Supabase stack delivers Auth email to Mailpit (supabase start).
const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailpitSummary = { ID: string; Created: string };

/**
 * The /auth/confirm link in the newest message to `address`, rebased onto
 * `baseURL`: the email is built from Supabase's site_url, which need not be the
 * host the tests run against.
 */
export async function latestAuthLink(address: string, baseURL: string, after: Date): Promise<string> {
  let link: string | null = null;
  await expect.poll(async () => {
    const search = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
    if (!search.ok) return null;
    const { messages } = await search.json() as { messages: MailpitSummary[] };
    const newest = messages
      .filter((message) => Date.parse(message.Created) >= after.getTime() - 2_000)
      .sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created))[0];
    if (!newest) return null;
    const message = await (await fetch(`${mailpit}/api/v1/message/${newest.ID}`)).json() as { HTML: string };
    const href = message.HTML.match(/href="([^"]*\/auth\/confirm\?[^"]*)"/)?.[1];
    link = href ? href.replaceAll("&amp;", "&") : null;
    return link;
  }, { message: `an account email to ${address}`, timeout: 20_000 }).not.toBeNull();

  const url = new URL(link!);
  return new URL(`${url.pathname}${url.search}`, baseURL).toString();
}
