// src/petition/config/petition-signals.config.ts

export type PetitionSignal = {
  name: string;
  regex: RegExp;
  weight: number;
};

export const START_SIGNALS: PetitionSignal[] = [
  {
    name: 'excelentissimo_senhor',
    regex: /EXCELENT[IÍ]SSIM[OA]\s+SENHOR[A]?/i,
    weight: 10,
  },
  {
    name: 'exmo_sr',
    regex: /EXM[OA]\.?\s+SR[A]?\.?/i,
    weight: 8,
  },
  {
    name: 'ao_juizo',
    regex: /AO\s+JU[IÍ]ZO\s+DA?/i,
    weight: 8,
  },
  {
    name: 'ao_douto_juizo',
    regex: /AO\s+DOUTO\s+JU[IÍ]ZO/i,
    weight: 8,
  },
];

export const MIDDLE_SIGNALS: PetitionSignal[] = [
  {
    name: 'acao_de',
    regex: /A[CÇ][AÃ]O\s+DE/i,
    weight: 6,
  },
  {
    name: 'em_face_de',
    regex: /EM\s+FACE\s+DE/i,
    weight: 6,
  },
  {
    name: 'dos_fatos',
    regex: /DOS\s+FATOS/i,
    weight: 5,
  },
  {
    name: 'do_direito',
    regex: /DO\s+DIREITO/i,
    weight: 5,
  },
  {
    name: 'dos_pedidos',
    regex: /DOS\s+PEDIDOS/i,
    weight: 7,
  },
  {
    name: 'valor_da_causa',
    regex: /VALOR\s+DA\s+CAUSA/i,
    weight: 7,
  },
  {
    name: 'requer',
    regex: /REQUER/i,
    weight: 3,
  },
];

export const END_SIGNALS: PetitionSignal[] = [
  {
    name: 'pede_deferimento',
    regex: /PEDE\s+DEFERIMENTO/i,
    weight: 10,
  },
  {
    name: 'nestes_termos_pede_deferimento',
    regex: /NESTES\s+TERMOS[,]?\s+PEDE\s+DEFERIMENTO/i,
    weight: 12,
  },
  {
    name: 'termos_em_que_pede_deferimento',
    regex: /TERMOS\s+EM\s+QUE[,]?\s+PEDE\s+DEFERIMENTO/i,
    weight: 12,
  },
  {
    name: 'oab',
    regex: /OAB\s*\/?\s*[A-Z]{2}\s*[Nº°]?\s*\d+/i,
    weight: 5,
  },
];
