import { Signal } from '../types/signals.type';

export class RecursoSignals {
  static START_SIGNALS: Signal[] = [
    {
      name: 'titulo_recurso_generico',
      regex: /(^|\n)\s*RECURSO\s*($|\n)/i,
      weight: 900,
    },
    {
      name: 'titulo_recurso_especial',
      regex: /(^|\n)\s*RECURSO\s+ESPECIAL\s*($|\n)/i,
      weight: 1800,
    },
    {
      name: 'titulo_recurso_extraordinario',
      regex: /(^|\n)\s*RECURSO\s+EXTRAORDIN[ÁA]RIO\s*($|\n)/i,
      weight: 1800,
    },
    {
      name: 'titulo_apelacao',
      regex: /(^|\n)\s*APELA[ÇC][ÃA]O\s*($|\n)/i,
      weight: 1700,
    },
    {
      name: 'titulo_agravo_instrumento',
      regex: /(^|\n)\s*AGRAVO\s+DE\s+INSTRUMENTO\s*($|\n)/i,
      weight: 1700,
    },
    {
      name: 'titulo_agravo_interno',
      regex: /(^|\n)\s*AGRAVO\s+INTERNO\s*($|\n)/i,
      weight: 1600,
    },
    {
      name: 'titulo_agravo_regimental',
      regex: /(^|\n)\s*AGRAVO\s+REGIMENTAL\s*($|\n)/i,
      weight: 1500,
    },
    {
      name: 'titulo_embargos_declaracao',
      regex: /(^|\n)\s*EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\s*($|\n)/i,
      weight: 1600,
    },
    {
      name: 'titulo_recurso_inominado',
      regex: /(^|\n)\s*RECURSO\s+INOMINADO\s*($|\n)/i,
      weight: 1600,
    },
    {
      name: 'titulo_recurso_ordinario',
      regex: /(^|\n)\s*RECURSO\s+ORDIN[ÁA]RIO\s*($|\n)/i,
      weight: 1500,
    },
    {
      name: 'titulo_razoes_recursais',
      regex: /(^|\n)\s*RAZ[ÕO]ES\s+RECURSAIS\s*($|\n)/i,
      weight: 1300,
    },
    {
      name: 'interpor_presente_recurso',
      regex:
        /\b(?:vem|vêm),?\s+(?:respeitosamente,?\s+)?(?:por\s+(?:seu|sua|seus|suas)\s+advogad[oa]s?.{0,250})?(?:interpor|opor)\s+(?:o\s+)?presente\s+(?:recurso|apela[çc][ãa]o|agravo|embargos)\b/i,
      weight: 1500,
    },
    {
      name: 'interpor_recurso_especial',
      regex: /\binterpor\s+(?:o\s+)?presente\s+RECURSO\s+ESPECIAL\b/i,
      weight: 1800,
    },
    {
      name: 'interpor_recurso_extraordinario',
      regex: /\binterpor\s+(?:o\s+)?presente\s+RECURSO\s+EXTRAORDIN[ÁA]RIO\b/i,
      weight: 1800,
    },
    {
      name: 'opor_embargos_declaracao',
      regex:
        /\b(?:opor|opõe|op[õo]e)\s+(?:os\s+)?(?:presentes\s+)?EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\b/i,
      weight: 1600,
    },
    {
      name: 'recorrente_recorrido_cabecalho',
      regex: /\bRECORRENTE\s*:\s*[\s\S]{0,250}\bRECORRID[OA]\s*:/i,
      weight: 1300,
    },
    {
      name: 'agravante_agravado_cabecalho',
      regex: /\bAGRAVANTE\s*:\s*[\s\S]{0,250}\bAGRAVAD[OA]\s*:/i,
      weight: 1200,
    },
    {
      name: 'apelante_apelado_cabecalho',
      regex: /\bAPELANTE\s*:\s*[\s\S]{0,250}\bAPELAD[OA]\s*:/i,
      weight: 1200,
    },
    {
      name: 'irresignado_com_decisao',
      regex:
        /\birresignad[oa]\s+com\s+(?:a|o)\s+(?:r\.?\s*)?(?:senten[çc]a|decis[ãa]o|ac[óo]rd[ãa]o)\b/i,
      weight: 900,
    },
    {
      name: 'exclusao_sentenca',
      regex: /(^|\n)\s*SENTEN[ÇC]A\s*($|\n)/i,
      weight: -2200,
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
      name: 'exclusao_mandado_seguranca_inicial',
      regex: /(^|\n)\s*MANDADO\s+DE\s+SEGURAN[ÇC]A\s*($|\n)/i,
      weight: -1200,
    },
    {
      name: 'exclusao_parecer',
      regex: /(^|\n)\s*PARECER\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'exclusao_manifestacao_mp',
      regex:
        /(^|\n)\s*MANIFESTA[ÇC][ÃA]O\s+DO\s+MINIST[ÉE]RIO\s+P[ÚU]BLICO\s*($|\n)/i,
      weight: -1600,
    },
  ];

  static MIDDLE_SIGNALS: Signal[] = [
    {
      name: 'admissibilidade_recurso',
      regex:
        /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?ADMISSIBILIDADE\s+DO\s+(?:PRESENTE\s+)?RECURSO\b/i,
      weight: 900,
    },
    {
      name: 'tempestividade_preparo',
      regex:
        /\b(?:tempestividade|preparo|regularidade\s+formal|cabimento)\b[\s\S]{0,250}\b(?:recurso|recursal|recorrente)\b/i,
      weight: 600,
    },
    {
      name: 'cabimento_do_recurso',
      regex: /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?CABIMENTO\s+DO\s+RECURSO\b/i,
      weight: 700,
    },
    {
      name: 'prequestionamento',
      regex: /\bprequestionamento\b/i,
      weight: 600,
    },
    {
      name: 'repercussao_geral',
      regex: /\brepercuss[ãa]o\s+geral\b/i,
      weight: 450,
    },
    {
      name: 'divergencia_jurisprudencial',
      regex: /\bdiverg[êe]ncia\s+jurisprudencial\b/i,
      weight: 450,
    },
    {
      name: 'violacao_dispositivo_legal',
      regex:
        /\b(?:viola[çc][ãa]o|violou|contrariedade|contrariou)\s+(?:ao|à|aos|às)?\s*(?:art\.?|artigo|dispositivo|norma)\b/i,
      weight: 400,
    },
    {
      name: 'decisao_recorrida',
      regex: /\b(?:decis[ãa]o|senten[çc]a|ac[óo]rd[ãa]o)\s+recorrid[oa]\b/i,
      weight: 550,
    },
    {
      name: 'razoes_do_recurso',
      regex:
        /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?(?:DAS\s+RAZ[ÕO]ES\s+DO\s+RECURSO|RAZ[ÕO]ES\s+RECURSAIS|DO\s+M[ÉE]RITO\s+RECURSAL)\b/i,
      weight: 700,
    },
    {
      name: 'reforma_da_decisao',
      regex:
        /\b(?:reforma|reformar|cass[açc][ãa]o|cassar|anula[çc][ãa]o|anular)\s+(?:da|a)\s+(?:senten[çc]a|decis[ãa]o|ac[óo]rd[ãa]o)\b/i,
      weight: 650,
    },
    {
      name: 'tribunal_superior',
      regex:
        /\b(?:SUPREMO\s+TRIBUNAL\s+FEDERAL|SUPERIOR\s+TRIBUNAL\s+DE\s+JUSTI[ÇC]A|EGR[ÉE]GIO\s+TRIBUNAL|COLENDO\s+TRIBUNAL)\b/i,
      weight: 300,
    },
    {
      name: 'artigo_102_105_cf',
      regex:
        /\bart\.?\s*(?:102|105),?\s*inciso\s*III\b|\bartigo\s*(?:102|105),?\s*inciso\s*III\b/i,
      weight: 550,
    },
    {
      name: 'artigo_1029_cpc',
      regex: /\bart\.?\s*1\.?029\b|\bartigo\s*1\.?029\b/i,
      weight: 500,
    },
    {
      name: 'efeito_suspensivo',
      regex: /\befeito\s+suspensivo\b/i,
      weight: 300,
    },
    {
      name: 'contrarrazoes',
      regex: /(^|\n)\s*CONTRARRAZ[ÕO]ES\s+(?:AO|DE)\s+RECURSO\b/i,
      weight: 900,
    },
    {
      name: 'exclusao_e_relatorio_decido',
      regex:
        /\b[ÉE]\s+o\s+relat[óo]rio,?\s+(?:em\s+s[ií]ntese\.?\s*)?Decido\b/i,
      weight: -1800,
    },
    {
      name: 'exclusao_cuida_se_sentenca',
      regex:
        /\bCuida-se\s+de\s+(?:mandado\s+de\s+seguran[çc]a|a[çc][ãa]o|processo|demanda)[\s\S]{0,300}\bpartes\s+qualificadas\b/i,
      weight: -800,
    },
    {
      name: 'exclusao_vem_propor_acao',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:por\s+(?:seu|sua|seus|suas)\s+advogad[oa]s?.{0,250})?(?:propor|ajuizar|impetrar)\s+(?:a\s+presente\s+)?(?:a[çc][ãa]o|mandado\s+de\s+seguran[çc]a)\b/i,
      weight: -1000,
    },
    {
      name: 'exclusao_vem_apresentar_contestacao',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:apresentar|oferecer|propor)\s+(?:a\s+presente\s+)?CONTESTA[ÇC][ÃA]O\b/i,
      weight: -1200,
    },
  ];

  static END_SIGNALS: Signal[] = [
    {
      name: 'pedido_conhecimento_provimento',
      regex:
        /\brequer(?:-se)?[\s\S]{0,500}(?:conhecimento|conhecido)\s+(?:e|,)?\s*(?:provimento|provido)\s+(?:do\s+)?(?:presente\s+)?recurso\b/i,
      weight: 1000,
    },
    {
      name: 'pedido_provimento_recurso',
      regex:
        /\b(?:dar|seja\s+dado|requer\s+o)\s+provimento\s+(?:ao|do)\s+(?:presente\s+)?recurso\b/i,
      weight: 900,
    },
    {
      name: 'pedido_reforma_decisao',
      regex:
        /\brequer(?:-se)?[\s\S]{0,500}(?:reforma|cass[açc][ãa]o|anula[çc][ãa]o)\s+(?:da|do)\s+(?:senten[çc]a|decis[ãa]o|ac[óo]rd[ãa]o)\b/i,
      weight: 900,
    },
    {
      name: 'pedido_admissao_remessa_tribunal',
      regex:
        /\brequer(?:-se)?[\s\S]{0,500}(?:admitido|processado|remetido|submetido)[\s\S]{0,300}(?:tribunal|STJ|STF|inst[âa]ncia\s+superior)\b/i,
      weight: 800,
    },
    {
      name: 'pedido_novo_julgamento',
      regex:
        /\brequer(?:-se)?[\s\S]{0,500}(?:novo\s+julgamento|retorno\s+dos\s+autos|rean[aá]lise)\b/i,
      weight: 500,
    },
    {
      name: 'termos_pede_deferimento',
      regex:
        /\bNestes\s+Termos[\s\S]{0,100}(?:Pede|Pedem|Requer|Espera)\s+Deferimento\b/i,
      weight: 250,
    },
    {
      name: 'assinatura_oab',
      regex: /\bOAB\/?[A-Z]{0,2}\s*n?[ºo]?\s*[\d.]+/i,
      weight: 180,
    },

    // Exclusões no final
    {
      name: 'exclusao_ante_exposto_concedo',
      regex:
        /\bAnte\s+o\s+exposto[\s\S]{0,300}\b(?:CONCEDO|DENEGO)\s+A\s+SEGURAN[ÇC]A\b/i,
      weight: -2200,
    },
    {
      name: 'exclusao_ante_exposto_julgo',
      regex:
        /\bAnte\s+o\s+exposto[\s\S]{0,300}\b(?:JULGO|EXTINGO|HOMOLOGO|DECLARO)\b/i,
      weight: -1800,
    },
    {
      name: 'exclusao_pri',
      regex: /(^|\n)\s*P\.?\s*R\.?\s*I\.?\s*($|\n)/i,
      weight: -1000,
    },
    {
      name: 'exclusao_juiz_direito',
      regex: /\bJuiz\s+de\s+Direito\b/i,
      weight: -1200,
    },
    {
      name: 'exclusao_improcedencia_pedidos_autor',
      regex:
        /\bimproced[êe]ncia\s+dos\s+pedidos?\s+formulados?\s+pelo\s+(?:autor|requerente)\b/i,
      weight: -700,
    },
  ];
}
