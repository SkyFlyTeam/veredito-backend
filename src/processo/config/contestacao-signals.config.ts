import { Signal } from '../types/signals.type';

export class ContestacaoSignals {
  static START_SIGNALS: Signal[] = [
    {
      name: 'titulo_contestacao_isolado',
      regex:
        /(^|\n)\s*C\s*O\s*N\s*T\s*E\s*S\s*T\s*A\s*[ÇC]\s*[ÃA]\s*O\s*($|\n)/i,
      weight: 1600,
    },
    {
      name: 'titulo_contestacao_normal',
      regex: /(^|\n)\s*CONTESTA[ÇC][ÃA]O\s*($|\n)/i,
      weight: 1500,
    },
    {
      name: 'propor_presente_contestacao',
      regex:
        /\b(?:propor|apresentar|oferecer)\s+a\s+presente\s+CONTESTA[ÇC][ÃA]O\b/i,
      weight: 1400,
    },
    {
      name: 'vem_apresentar_contestacao',
      regex:
        /\bvem\s+(?:respeitosamente,?\s+)?(?:por\s+interm[eé]dio\s+de\s+(?:seu|sua)\s+advogad[oa].*?,?\s+)?(?:apresentar|oferecer|propor)\s+(?:a\s+presente\s+)?CONTESTA[ÇC][ÃA]O\b/i,
      weight: 1300,
    },
    {
      name: 'contestacao_em_acao',
      regex:
        /\bCONTESTA[ÇC][ÃA]O\s+(?:em|nos\s+autos\s+da|à|a)\s+(?:a[çc][ãa]o|demanda|processo)\b/i,
      weight: 1000,
    },
    {
      name: 'defesa_do_requerido',
      regex: /(^|\n)\s*DEFESA\s+DO\s+(?:REQUERIDO|R[ÉE]U)\s*($|\n)/i,
      weight: 900,
    },
    {
      name: 'recurso_extraordinario',
      regex: /(^|\n)\s*RECURSO\s+EXTRAORDIN[ÁA]RIO\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'recurso_especial',
      regex: /(^|\n)\s*RECURSO\s+ESPECIAL\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'embargos_de_declaracao',
      regex: /(^|\n)\s*EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'mandado_de_seguranca',
      regex: /(^|\n)\s*MANDADO\s+DE\s+SEGURAN[ÇC]A\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'memoriais',
      regex: /(^|\n)\s*MEMORIAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'razoes_recursais',
      regex: /(^|\n)\s*RAZ[ÕO]ES\s+RECURSAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'sentenca_acordao_parecer',
      regex: /(^|\n)\s*(SENTEN[ÇC]A|AC[ÓO]RD[ÃA]O|PARECER)\s*($|\n)/i,
      weight: -1500,
    },
  ];

  static MIDDLE_SIGNALS: Signal[] = [
    {
      name: 'sintese_da_demanda',
      regex: /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DA\s+S[IÍ]NTESE\s+DA\s+DEMANDA\b/i,
      weight: 180,
    },
    {
      name: 'impugnacao_especifica_dos_fatos',
      regex:
        /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DA\s+IMPUGNA[ÇC][ÃA]O\s+ESPEC[IÍ]FICA\s+DOS\s+FATOS\b/i,
      weight: 350,
    },
    {
      name: 'impugnacao_dos_fatos',
      regex:
        /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DA\s+IMPUGNA[ÇC][ÃA]O\s+(?:AOS|DOS)\s+FATOS\b/i,
      weight: 280,
    },
    {
      name: 'do_merito',
      regex: /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DO\s+M[ÉE]RITO\b/i,
      weight: 180,
    },
    {
      name: 'autor_reu_contexto',
      regex:
        /\b(?:autor|requerente)\b[\s\S]{0,300}\b(?:r[ée]u|requerido)\b|\b(?:r[ée]u|requerido)\b[\s\S]{0,300}\b(?:autor|requerente)\b/i,
      weight: 120,
    },
    {
      name: 'pedidos_formulados_pelo_autor',
      regex: /\bpedidos?\s+formulados?\s+pelo\s+(?:autor|requerente)\b/i,
      weight: 220,
    },
    {
      name: 'ausencia_de_autorizacao_ou_impugnacao',
      regex:
        /\b(?:aus[eê]ncia\s+de\s+autoriza[çc][ãa]o|impugna(?:-se|r)|n[ãa]o\s+procede|n[ãa]o\s+merece\s+prosperar)\b/i,
      weight: 140,
    },
    {
      name: 'das_provas',
      regex: /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DAS\s+PROVAS\b/i,
      weight: 120,
    },
    {
      name: 'protesta_por_provas',
      regex: /\bprotesta\s+por\s+todos\s+os\s+meios\s+de\s+prova\b/i,
      weight: 120,
    },
    {
      name: 'preliminarmente',
      regex: /\bPRELIMINARMENTE\b/i,
      weight: 100,
    },
    {
      name: 'recurso_extraordinario',
      regex: /(^|\n)\s*RECURSO\s+EXTRAORDIN[ÁA]RIO\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'recurso_especial',
      regex: /(^|\n)\s*RECURSO\s+ESPECIAL\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'embargos_de_declaracao',
      regex: /(^|\n)\s*EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'mandado_de_seguranca',
      regex: /(^|\n)\s*MANDADO\s+DE\s+SEGURAN[ÇC]A\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'memoriais',
      regex: /(^|\n)\s*MEMORIAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'razoes_recursais',
      regex: /(^|\n)\s*RAZ[ÕO]ES\s+RECURSAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'sentenca_acordao_parecer',
      regex: /(^|\n)\s*(SENTEN[ÇC]A|AC[ÓO]RD[ÃA]O|PARECER)\s*($|\n)/i,
      weight: -1500,
    },
  ];

  static END_SIGNALS: Signal[] = [
    {
      name: 'pedidos_finais',
      regex: /(^|\n)\s*(?:[IVXLCDM]+[-.\s]*)?DOS\s+PEDIDOS\s+FINAIS\b/i,
      weight: 250,
    },
    {
      name: 'requer_total_improcedencia',
      regex:
        /\brequer(?:-se)?[\s\S]{0,300}(?:total\s+)?improced[êe]ncia\s+dos\s+pedidos?\s+formulados?\s+pelo\s+(?:autor|requerente)\b/i,
      weight: 650,
    },
    {
      name: 'improcedencia_dos_pedidos',
      regex: /\b(?:total\s+)?improced[êe]ncia\s+dos\s+pedidos?\b/i,
      weight: 500,
    },
    {
      name: 'condenacao_autor_custas_honorarios',
      regex:
        /\bcondena[çc][ãa]o\s+d[oa]\s+(?:autor|requerente)\s+ao\s+pagamento\s+d[aeo]s?\s+custas[\s\S]{0,150}honor[aá]rios\b/i,
      weight: 350,
    },
    {
      name: 'nestes_termos_deferimento',
      regex: /\bNestes\s+Termos[\s\S]{0,80}(?:Pede|solicita)\s+Deferimento\b/i,
      weight: 120,
    },
    {
      name: 'recurso_extraordinario',
      regex: /(^|\n)\s*RECURSO\s+EXTRAORDIN[ÁA]RIO\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'recurso_especial',
      regex: /(^|\n)\s*RECURSO\s+ESPECIAL\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'embargos_de_declaracao',
      regex: /(^|\n)\s*EMBARGOS\s+DE\s+DECLARA[ÇC][ÃA]O\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'mandado_de_seguranca',
      regex: /(^|\n)\s*MANDADO\s+DE\s+SEGURAN[ÇC]A\s*($|\n)/i,
      weight: -2000,
    },
    {
      name: 'memoriais',
      regex: /(^|\n)\s*MEMORIAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'razoes_recursais',
      regex: /(^|\n)\s*RAZ[ÕO]ES\s+RECURSAIS\s*($|\n)/i,
      weight: -1600,
    },
    {
      name: 'sentenca_acordao_parecer',
      regex: /(^|\n)\s*(SENTEN[ÇC]A|AC[ÓO]RD[ÃA]O|PARECER)\s*($|\n)/i,
      weight: -1500,
    },
  ];
}
