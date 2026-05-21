import { Signal } from '../types/signals.type';

export class ContestacaoSignals {
  static START_SIGNALS: Signal[] = [
    {
      name: 'contestacao_titulo_isolado',
      regex: /(^|\n)\s*DEFESA\s*DO\s+REQUERIDO\s*($|\n)/i,
      weight: 1200,
    },
    {
      name: 'apresenta_contestacao',
      regex: /APRESENTA[R]?\s+(SUA\s+)?DEFESA/i,
      weight: 1000,
    },
    {
      name: 'vem_apresentar_contestacao',
      regex:
        /VEM[,]?\s+RESPEITOSAMENTE[,]?.{0,300}APRESENTA[R]?\s+(SUA\s+)?DEFESA/i,
      weight: 900,
    },
    {
      name: 'excelentissimo_senhor',
      regex: /EXCELENTISSIM[OA]\s+SENHOR[A]?/i,
      weight: 80,
    },
    {
      name: 'ao_juizo',
      regex: /AO\s+JUIZO/i,
      weight: 60,
    },
  ];

  static MIDDLE_SIGNALS: Signal[] = [
    {
      name: 'preliminarmente',
      regex: /\bPRELIMINARMENTE\b/i,
      weight: 120,
    },
    {
      name: 'dos_fatos',
      regex: /DOS\s+FATOS/i,
      weight: 100,
    },
    {
      name: 'do_merito',
      regex: /DO\s+M[EÉ]RITO/i,
      weight: 140,
    },
    {
      name: 'da_impugnacao',
      regex: /DA\s+IMPUGNACAO/i,
      weight: 120,
    },
    {
      name: 'improcedencia_dos_pedidos',
      regex: /IMPROCEDENCIA\s+(TOTAL\s+)?DOS\s+PEDIDOS/i,
      weight: 200,
    },
  ];

  static END_SIGNALS: Signal[] = [
    {
      name: 'requer_improcedencia',
      regex: /REQUER.*?IMPROCEDENCIA/i,
      weight: 300,
    },
    {
      name: 'julgar_improcedente',
      regex: /JULGAR\s+(TOTALMENTE\s+)?IMPROCEDENTE/i,
      weight: 280,
    },
    {
      name: 'pede_deferimento',
      regex: /PEDE\s+DEFERIMENTO/i,
      weight: 120,
    },
    {
      name: 'oab',
      regex: /OAB\s*\/?\s*[A-Z]{2}\s*[Nº°]?\s*\d+/i,
      weight: 40,
    },
  ];

  static NEGATIVE_SIGNALS: Signal[] = [
    {
      name: 'acordao',
      regex: /\bACORDAO\b/i,
      weight: -1000,
    },
    {
      name: 'voto',
      regex: /\bVOTO\b/i,
      weight: -700,
    },
    {
      name: 'relatorio',
      regex: /\bRELATORIO\b/i,
      weight: -500,
    },
    {
      name: 'sentenca',
      regex: /\bSENTENÇA\b/i,
      weight: -500,
    },
    {
      name: 'decisao_tribunal',
      regex: /\bDECISAO\b/i,
      weight: -500,
    },
  ];
}
