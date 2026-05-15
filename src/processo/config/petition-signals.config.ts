import { Signal } from '../types/signals.type';

export class PeticionSignals {
  static START_SIGNALS: Signal[] = [
    {
      name: 'peticao_inicial_em_anexo',
      regex: /PETICAO\s+INICIAL\s+EM\s+ANEXO/i,
      weight: 1000,
    },
    {
      name: 'excelentissimo_senhor',
      regex: /EXCELENTISSIM[OA]\s+SENHOR[A]?/i,
      weight: 80,
    },
    {
      name: 'exmo_sr',
      regex: /EXM[OA]\.?\s+SR[A]?\.?/i,
      weight: 50,
    },
    {
      name: 'ao_juizo',
      regex: /AO\s+JUIZO/i,
      weight: 50,
    },
    {
      name: 'ao_douto_juizo',
      regex: /AO\s+DOUTO\s+JUIZO/i,
      weight: 50,
    },
  ];

  static MIDDLE_SIGNALS: Signal[] = [
    {
      name: 'acao_de',
      regex: /ACAO\s+DE/i,
      weight: 40,
    },
    {
      name: 'em_face_de',
      regex: /EM\s+FACE\s+DE/i,
      weight: 40,
    },
    {
      name: 'dos_fatos',
      regex: /DOS\s+FATOS/i,
      weight: 50,
    },
    {
      name: 'do_direito',
      regex: /DO\s+DIREITO/i,
      weight: 50,
    },
    {
      name: 'dos_pedidos',
      regex: /DOS\s+PEDIDOS/i,
      weight: 70,
    },
    {
      name: 'valor_da_causa',
      regex: /VALOR\s+DA\s+CAUSA/i,
      weight: 70,
    },
    {
      name: 'requer',
      regex: /\bREQUER\b/i,
      weight: 15,
    },
  ];

  static END_SIGNALS: Signal[] = [
    {
      name: 'pede_deferimento',
      regex: /PEDE\s+DEFERIMENTO/i,
      weight: 100,
    },
    {
      name: 'nestes_termos_pede_deferimento',
      regex: /NESTES\s+TERMOS[,]?\s+PEDE\s+DEFERIMENTO/i,
      weight: 120,
    },
    {
      name: 'termos_em_que_pede_deferimento',
      regex: /TERMOS\s+EM\s+QUE[,]?\s+PEDE\s+DEFERIMENTO/i,
      weight: 120,
    },
    {
      name: 'oab',
      regex: /OAB\s*\/?\s*[A-Z]{2}\s*[Nº°]?\s*\d+/i,
      weight: 40,
    },
  ];
}
