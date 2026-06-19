import type { KeywordRule } from "../types";

/**
 * Pure function: given a comment's text and the active rules, return the first
 * matching rule (or null). Case-insensitive, whitespace-tolerant, whole-word.
 *
 * Whole-word so "GUIDE" doesn't fire on "guidelines". Accents are normalized so
 * "café" matches "cafe".
 */
export function matchKeyword(
  text: string,
  rules: KeywordRule[],
): KeywordRule | null {
  const normalized = normalize(text);
  for (const rule of rules) {
    if (!rule.active) continue;
    const kw = normalize(rule.keyword);
    if (!kw) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(kw)}\\b`);
    if (pattern.test(normalized)) return rule;
  }
  return null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
