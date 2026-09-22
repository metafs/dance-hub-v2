import type { Database } from "@/lib/database.types";

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

const artistTypeLabels: Record<ArtistType, string> = {
  individual: "個人",
  company: "カンパニー",
  collective: "コレクティブ",
  other: "その他",
};

export function artistTypeLabel(artistType: string): string {
  return artistTypeLabels[artistType as ArtistType] ?? artistType;
}

export const artistTypeOptions = artistTypes.map((value) => ({
  value,
  label: artistTypeLabels[value],
}));

const prefectureLabels: Record<Prefecture, string> = {
  TOKYO: "東京都",
  KANAGAWA: "神奈川県",
};

export function prefectureName(prefecture: string): string {
  return prefectureLabels[prefecture as Prefecture] ?? prefecture;
}

export const prefectureOptions = prefectures.map((value) => ({
  value,
  label: prefectureLabels[value],
}));

export type CandidateStatus = Database["public"]["Enums"]["candidate_status"];

const candidateStatusLabels: Record<CandidateStatus, string> = {
  pending: "審査待ち",
  activated: "登録済み",
  rejected: "却下",
  merged: "統合済み",
};

export function candidateStatusLabel(status: string): string {
  return candidateStatusLabels[status as CandidateStatus] ?? status;
}
