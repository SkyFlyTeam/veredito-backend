import { Signal } from '../types/signals.type';

export class SentencaSignals {
  static START_SIGNALS: Signal[] = [
    {
      name: 'titulo_sentenca',
      regex: /(^|\n)\s*SENTEN[ÇC]A\s*($|\n)/i,
      weight: 2000,
    },
    {
      name: 'processo_mandado_seguranca_partes',
      regex:
        /\bPROCESSO\s+N[ºO]\s*[\d.-]+[\s\S]{0,600}\bMANDADO\s+DE\s+SEGURAN[ÇC]A\b[\s\S]{0,600}\bIMPETRANTE\b[\s\S]{0,600}\bIMPETRADO\b/i,
      weight: 1400,
    },
    {
      name: 'cabecalho_poder_judiciario_juizo',
      regex:
        /\bPODER\s+JUDICI[ÁA]RIO\b[\s\S]{0,500}\bJu[ií]zo\s+de\b[\s\S]{0,500}\bVara\b/i,
      weight: 700,
    },
    {
      name: 'cuida_se_mandado_seguranca',
      regex:
        /\bCuida-se\s+de\s+mandado\s+de\s+seguran[çc]a\s+impetrado\s+por\b/i,
      weight: 1500,
    },
    {
      name: 'em_face_secretario_fazenda',
      regex:
        /\bem\s+face\s+do\s+SECRET[ÁA]RIO\s+DE\s+FAZENDA\s+DO\s+MUNIC[IÍ]PIO\b/i,
      weight: 900,
    },
    {
      name: 'partes_qualificadas',
      regex: /\bpartes\s+qualificadas\b/i,
      weight: 500,
    },
    {
      name: 'aduz_impetrante_em_sintese',
      regex: /\bAduz\s+a\s+impetrante,?\s+em\s+s[ií]ntese\b/i,
      weight: 1000,
    },
    {
      name: 'exclusao_peticao_inicial',
      regex: /(^|\n)\s*PETI[ÇC][ÃA]O\s+INICIAL\s*($|\n)/i,
      weight: -1800,
    },
    {
      name: 'exclusao_contestacao',
      regex: /(^|\n)\s*CONTESTA[ÇC][ÃA]O\s*($|\n)/i,
      weight: -1800,
    },
    {
      name: 'exclusao_embargos',
      regex: /(^|\n)\s*EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\s*($|\n)/i,
      weight: -1800,
    },
    {
      name: 'exclusao_recurso_especial',
      regex: /(^|\n)\s*RECURSO\s+ESPECIAL\s*($|\n)/i,
      weight: -1800,
    },
    {
      name: 'exclusao_recurso_extraordinario',
      regex: /(^|\n)\s*RECURSO\s+EXTRAORDIN[ÁA]RIO\s*($|\n)/i,
      weight: -1800,
    },
    {
      name: 'exclusao_memoriais',
      regex: /(^|\n)\s*MEMORIAIS\s*($|\n)/i,
      weight: -1400,
    },
  ];

  static MIDDLE_SIGNALS: Signal[] = [
    {
      name: 'pedido_liminar_indeferido',
      regex:
        /\bA\s+decis[ãa]o\s+lan[çc]ada\s+no\s+id\.?\s*\d+\s+indeferiu\s+a\s+liminar\b/i,
      weight: 900,
    },
    {
      name: 'embargos_rejeitados',
      regex:
        /\bOs\s+embargos\s+de\s+declara[çc][ãa]o[\s\S]{0,200}\bforam\s+rejeitados\b/i,
      weight: 800,
    },
    {
      name: 'informacoes_prestadas_id',
      regex:
        /\bAs\s+informa[çc][õo]es\s+foram\s+prestadas\s+no\s+id\.?\s*\d+\b/i,
      weight: 700,
    },
    {
      name: 'mpe_entendeu_desnecessidade',
      regex:
        /\bO\s+MPE\s+entendeu\s+pela\s+desnecessidade\s+de\s+sua\s+interven[çc][ãa]o\b/i,
      weight: 700,
    },
    {
      name: 'deposito_integral_imposto',
      regex:
        /\ba\s+impetrante\s+evidencia\s+o\s+dep[óo]sito\s+do\s+valor\s+integral\s+do\s+imposto\b/i,
      weight: 600,
    },
    {
      name: 'suspensao_exigibilidade_credito',
      regex:
        /\bsuspens[ãa]o\s+da\s+exigibilidade\s+do\s+cr[eé]dit[oa]\s+tribut[áa]ri[oa]\b/i,
      weight: 500,
    },
    {
      name: 'vieram_autos_conclusos',
      regex: /\bVieram\s+os\s+autos\s+conclusos\b/i,
      weight: 1200,
    },
    {
      name: 'e_relatorio_decido',
      regex: /\b[ÉE]\s+o\s+relat[óo]rio,?\s+em\s+s[ií]ntese\.?\s+Decido\b/i,
      weight: 1800,
    },
    {
      name: 'almeja_impetrante_reconhecimento',
      regex: /\bAlmeja\s+a\s+impetrante\s+o\s+reconhecimento\b/i,
      weight: 700,
    },
    {
      name: 'defende_imunidade_absoluta',
      regex: /\bDefende\s+que\s+a\s+imunidade\s+deve\s+ser\s+absoluta\b/i,
      weight: 600,
    },
    {
      name: 'ao_julgar_recurso_extraordinario_tema',
      regex:
        /\bAo\s+julgar\s+o\s+Recurso\s+Extraordin[áa]rio\s+n[ºo]\s*796\.376\b[\s\S]{0,200}\bTema\s+796\b/i,
      weight: 700,
    },
    {
      name: 'stf_decidiu_que',
      regex: /\bo\s+STF\s+decidiu\s+que\b[\s\S]{0,300}\ba\s+imunidade\b/i,
      weight: 500,
    },
    {
      name: 'no_caso_em_exame',
      regex: /\bNo\s+caso\s+em\s+exame\b/i,
      weight: 500,
    },
    {
      name: 'esta_evidenciado_nos_autos',
      regex: /\best[áa]\s+evidenciado\s+nos\s+autos\b/i,
      weight: 500,
    },
    {
      name: 'exclusao_vem_impetrar',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:por\s+(?:seu|sua|seus|suas)\s+advogad[oa]s?.{0,250})?impetrar\s+(?:o\s+presente\s+)?mandado\s+de\s+seguran[çc]a\b/i,
      weight: -1300,
    },
    {
      name: 'exclusao_vem_propor_acao',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:propor|ajuizar)\s+a\s+presente\s+a[çc][ãa]o\b/i,
      weight: -1200,
    },
    {
      name: 'exclusao_vem_apresentar_contestacao',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:apresentar|oferecer|propor)\s+(?:a\s+presente\s+)?contesta[çc][ãa]o\b/i,
      weight: -1300,
    },
    {
      name: 'exclusao_pelos_fatos_direitos_expor',
      regex:
        /\bpelos\s+fatos\s+e\s+(?:direitos|fundamentos)\s+que\s+passa\s+a\s+expor\b/i,
      weight: -600,
    },
  ];

  static END_SIGNALS: Signal[] = [
    {
      name: 'ante_exposto',
      regex: /\bAnte\s+o\s+exposto\b/i,
      weight: 900,
    },
    {
      name: 'concedo_seguranca',
      regex: /\bCONCEDO\s+A\s+SEGURAN[ÇC]A\b/i,
      weight: 1800,
    },
    {
      name: 'denego_seguranca',
      regex: /\bDENEGO\s+A\s+SEGURAN[ÇC]A\b/i,
      weight: 1600,
    },
    {
      name: 'concedo_para_declarar',
      regex: /\bCONCEDO\s+A\s+SEGURAN[ÇC]A\s+para\s+DECLARAR\b/i,
      weight: 2000,
    },
    {
      name: 'declarar_incidencia_imunidade',
      regex:
        /\bDECLARAR\s+a\s+incid[êe]ncia\s+de\s+imunidade\s+constitucional\b/i,
      weight: 1200,
    },
    {
      name: 'autoridade_abster_exigir_itbi',
      regex:
        /\bdevendo\s+a\s+autoridade\s+impetrada\s+abster-se\s+de\s+exigir\s+o\s+ITBI\b/i,
      weight: 1000,
    },
    {
      name: 'custas_ex_lege_municipio',
      regex: /\bCustas\s+ex\s+lege\s+pelo\s+MUNIC[IÍ]PIO\b/i,
      weight: 650,
    },
    {
      name: 'sem_condenacao_honorarios',
      regex: /\bSem\s+condena[çc][ãa]o\s+em\s+honor[áa]rios\b/i,
      weight: 650,
    },
    {
      name: 'sumulas_512_105',
      regex: /\bS[úu]mulas?\s+512\/STF\s+e\s+105\/STJ\b/i,
      weight: 700,
    },
    {
      name: 'sentenca_reexame_necessario',
      regex: /\bSenten[çc]a\s+sujeita\s+ao\s+reexame\s+necess[áa]rio\b/i,
      weight: 1000,
    },
    {
      name: 'transito_julgado_levantada_caucao',
      regex:
        /\bCom\s+o\s+tr[âa]nsito\s+(?:o|em)\s+julgado[\s\S]{0,300}\blevantada\s+a\s+cau[çc][ãa]o\b/i,
      weight: 650,
    },
    {
      name: 'arquivem_baixas_anotacoes',
      regex:
        /\barquivem-se\s+com\s+as\s+baixas\s+e\s+anota[çc][õo]es\s+de\s+estilo\b/i,
      weight: 700,
    },
    {
      name: 'pri',
      regex: /(^|\n)\s*P\.?\s*R\.?\s*I\.?\s*($|\n)/i,
      weight: 700,
    },
    {
      name: 'local_data_juiz',
      regex:
        /\bGUARAPARI-ES,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}\b[\s\S]{0,300}\bJuiz\s+de\s+Direito\b/i,
      weight: 900,
    },
    {
      name: 'assinatura_juiz_direito',
      regex: /\bJuiz\s+de\s+Direito\b/i,
      weight: 800,
    },
    {
      name: 'exclusao_nestes_termos_deferimento_oab',
      regex:
        /\bNestes\s+Termos[\s\S]{0,120}(?:Pede|Requer|Espera|solicita)\s+Deferimento\b[\s\S]{0,400}\bOAB\b/i,
      weight: -1200,
    },
    {
      name: 'exclusao_requer_concessao_seguranca',
      regex:
        /\brequer(?:-se)?[\s\S]{0,400}concess[ãa]o\s+(?:definitiva\s+)?da\s+seguran[çc]a\b/i,
      weight: -900,
    },
    {
      name: 'exclusao_requer_liminar',
      regex:
        /\brequer(?:-se)?[\s\S]{0,400}(?:deferimento|concess[ãa]o)\s+(?:da\s+)?(?:medida\s+)?liminar\b/i,
      weight: -900,
    },
    {
      name: 'exclusao_total_improcedencia_pedidos_autor',
      regex:
        /\btotal\s+improced[êe]ncia\s+dos\s+pedidos?\s+formulados?\s+pelo\s+(?:autor|requerente)\b/i,
      weight: -1000,
    },
  ];
}
