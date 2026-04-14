function normalize(text: string): string {
  return text
    ?.normalize('NFD') // separate accents
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim();
}

export default normalize;
