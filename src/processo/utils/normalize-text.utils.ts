/* eslint-disable no-control-regex */

export function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/-\s*\n\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeForMatch(text: string): string {
  return normalizeText(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}
