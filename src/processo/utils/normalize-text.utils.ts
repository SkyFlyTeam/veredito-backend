/* eslint-disable no-control-regex */
// src/petition/utils/normalize-text.ts

export function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, ' ') // Remove null bytes
    .replace(/-\s*\n\s*/g, '') // Join broken words with hyphen at line breaks
    .replace(/\s+/g, ' ') // Normalize all whitespace to a single space
    .trim(); // Remove leading/trailing whitespace
}

export function normalizeForMatch(text: string): string {
  return normalizeText(text)
    .normalize('NFD') // Normalize text to NFD (decomposed form)
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toUpperCase(); // Convert text to uppercase for case-insensitive comparison
}
