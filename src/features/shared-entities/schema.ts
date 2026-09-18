import type { Database } from "@/lib/db/database.types";

export type ArtistType = Database["public"]["Enums"]["artist_type"];
export type Prefecture = Database["public"]["Enums"]["prefecture_code"];

export const artistTypes = [
  "individual",
  "company",
  "collective",
  "other",
] as const satisfies readonly ArtistType[];

export const prefectures = ["TOKYO", "KANAGAWA"] as const satisfies readonly Prefecture[];

export function isArtistType(value: string): value is ArtistType {
  return artistTypes.some((artistType) => artistType === value);
}

export function isPrefecture(value: string): value is Prefecture {
  return prefectures.some((prefecture) => prefecture === value);
}
