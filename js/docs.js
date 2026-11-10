// Análise dos riscos e montagem dos documentos (HTML pronto para imprimir ou abrir no Word).

const e = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const txt = (s, vazio = "—") => (String(s ?? "").trim() ? e(s).replace(/\n/g, "<br>") : vazio);
const num = (s) => {
  let t = String(s ?? "").trim();
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
};
const dataBR = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("/") : iso || "—");
const rotulo = (pares, v) => (pares.find((x) => String(x[0]) === String(v)) || [0, "—"])[1];

function nivelDe(r) {
  const s = num(r.sev), p = num(r.prob);
  if (!s || !p) return null;
  const v = s * p;
  return { v, ...NIVEIS.find((n) => v <= n.max) };
}

// Compara o valor medido com o limite. null = sem dados para comparar.
function acimaDoLimite(r) {
  if (r.tipoAval !== "quantitativa") return null;
  const v = num(r.valor), l = num(r.limite);
  return v == null || l == null ? null : v > l;
}

// Insalubridade (NR-15). "sugestao" é o que os dados indicam; "final" é a escolha do profissional, se houver.
function insalubridade(r) {
  const a = ANEXOS15[r.anexo15];
  if (!a) return { final: "nao", motivo: "Agente sem enquadramento nos anexos da NR-15." };
  const acima = acimaDoLimite(r);
  let sugestao = "pendente", motivo;
  if (a.quant) {
    if (acima == null) motivo = "Faltam o valor medido e o limite de tolerância para concluir.";
    else if (!acima) { sugestao = "nao"; motivo = "Exposição abaixo do limite de tolerância."; }
    else if (r.epiEficaz === "sim") { sugestao = "neutralizada"; motivo = "Exposição acima do limite, neutralizada por medida de controle eficaz (NR-15, item 15.4.1)."; }
    else { sugestao = "sim"; motivo = "Exposição acima do limite de tolerância, sem neutralização comprovada."; }
  } else motivo = "Anexo de avaliação qualitativa: a caracterização depende da inspeção do profissional no local.";
  const final = r.insal && r.insal !== "auto" ? r.insal : sugestao;
  const grau = final === "sim" ? r.grau || a.grau || null : null;
  return { sugestao, final, motivo, grau, anexo: a };
}
const INSAL_T = { sim: "Insalubre", nao: "Não insalubre", neutralizada: "Neutralizada", pendente: "A definir pelo profissional" };

// Aposentadoria especial (LTCAT). Só agentes físicos, químicos e biológicos.
function especial(r) {
  if (!AMBIENTAIS.includes(r.grupo)) return { final: "nao" };
  const acima = acimaDoLimite(r);
  const ruido = /ru[ií]do/i.test(r.agente || "");
  let sugestao = "pendente", motivo;
  if (r.tipoAval === "quantitativa") {
    if (acima == null) motivo = "Faltam o valor medido e o limite para concluir.";
    else if (!acima) { sugestao = "nao"; motivo = "Exposição abaixo do limite de tolerância."; }
    else if (ruido) { sugestao = "sim"; motivo = "Ruído acima do limite. A declaração de EPI eficaz não descaracteriza o tempo especial (STF, Tema 555)."; }
    else if (r.epiEficaz === "sim") { sugestao = "nao"; motivo = "Exposição acima do limite, com EPI ou EPC eficaz. Agentes reconhecidamente cancerígenos pedem análise à parte."; }
    else { sugestao = "sim"; motivo = "Exposição acima do limite, sem proteção eficaz."; }
  } else motivo = "Avaliação qualitativa: o enquadramento no Anexo IV do Decreto 3.048/1999 depende do juízo do profissional.";
  const final = r.especial && r.especial !== "auto" ? r.especial : sugestao;
  return { sugestao, final, motivo };
}
const ESP_T = { sim: "Sim", nao: "Não", pendente: "A definir pelo profissional" };

const riscosDo = (p, g) => p.riscos.filter((r) => r.gheId === g.id);
const medidasDe = (r) => {
  const partes = [];
  if ((r.epc || "").trim()) partes.push("<b>Coletivas:</b> " + e(r.epc));
  if ((r.adm || "").trim()) partes.push("<b>Administrativas:</b> " + e(r.adm));
  if ((r.epi || "").trim()) partes.push("<b>EPI:</b> " + e(r.epi) + (r.ca ? " (CA " + e(r.ca) + ")" : "") + (r.epiEficaz === "sim" ? " – eficaz" : r.epiEficaz === "nao" ? " – não eficaz" : ""));
  return partes.join("<br>") || "Nenhuma medida registrada";
};
const avaliacaoDe = (r) =>
  r.tipoAval === "quantitativa"
    ? `${txt(r.valor)} ${e(r.unidade || "")}<br><small>Limite: ${txt(r.limite)} ${e(r.unidade || "")}</small>`
    : "Qualitativa";

// O que falta para o documento sair completo.
function pendencias(p, tipo) {
  const f = [];
  const em = p.empresa;
  if (!em.cnpj) f.push("CNPJ da empresa");
  if (!em.endereco) f.push("Endereço do estabelecimento");
  if (!p.rt.nome || !p.rt.registro) f.push("Nome e registro profissional do responsável técnico");
  if (!p.ghes.length) f.push("Nenhum grupo de exposição (GHE) cadastrado");
  p.ghes.forEach((g) => {
    if (!(g.atividades || "").trim()) f.push(`${g.nome}: descrição das atividades`);
    if (tipo !== "pericul" && tipo !== "ergo" && !riscosDo(p, g).length) f.push(`${g.nome}: nenhum risco cadastrado`);
  });
  p.riscos.forEach((r) => {
    const g = p.ghes.find((x) => x.id === r.gheId);
    const nome = `${r.agente || "Risco sem nome"} (${g ? g.nome : "sem GHE"})`;
    if (tipo === "pgr" && !nivelDe(r)) f.push(`${nome}: severidade e probabilidade`);
    if (r.tipoAval === "quantitativa" && acimaDoLimite(r) == null && tipo !== "ergo" && tipo !== "pericul") f.push(`${nome}: valor medido e limite`);
    if (tipo === "insal" && ANEXOS15[r.anexo15]) {
      const i = insalubridade(r);
      if (i.final === "pendente") f.push(`${nome}: conclusão de insalubridade`);
      if (i.final === "sim" && !i.grau) f.push(`${nome}: grau de insalubridade`);
    }
    if (tipo === "ltcat" && AMBIENTAIS.includes(r.grupo)) {
      if (especial(r).final === "pendente") f.push(`${nome}: enquadramento para aposentadoria especial`);
      if (!(r.fonte || "").trim()) f.push(`${nome}: fonte geradora`);
      if (!(r.tecnica || "").trim()) f.push(`${nome}: metodologia de avaliação`);
    }
  });
  if (tipo === "pgr" && !p.plano.length) f.push("Plano de ação vazio");
  if (tipo === "pgr") p.plano.forEach((a) => { if (!a.responsavel || !a.prazo) f.push(`Plano de ação "${a.medida || "sem descrição"}": responsável e prazo`); });
  if (tipo === "ergo") p.ghes.forEach((g) => { if (!Object.values(p.ergo[g.id]?.itens || {}).some((i) => i.sit)) f.push(`${g.nome}: avaliação ergonômica não preenchida`); });
  if ((tipo === "ltcat" || tipo === "insal") && !(p.doc.instrumentos || "").trim()) f.push("Instrumentos de medição e calibração");
  return f;
}

// ---------- peças comuns ----------
let _n = 0;
const sec = (titulo, html) => `<h2>${++_n}. ${titulo}</h2>${html}`;
const tabela = (cab, linhas, cls = "") =>
  `<table class="${cls}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${
    linhas.length ? linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cab.length}">Nenhum registro.</td></tr>`
  }</tbody></table>`;
const kv = (pares) => `<table class="kv"><tbody>${pares.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</tbody></table>`;
const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;

function capa(p, titulo, sub) {
  const em = p.empresa;
  return `<section class="capa">
    <p class="capa-tipo">${sub}</p>
    <h1>${titulo}</h1>
    <p class="capa-empresa">${txt(em.razao)}</p>
    <p>${em.cnpj ? "CNPJ " + e(em.cnpj) : ""}</p>
    <p>${txt(em.endereco, "")}${em.cidadeUF ? " – " + e(em.cidadeUF) : ""}</p>
    <p class="capa-data">Emissão: ${dataBR(p.doc.dataEmissao)}</p>
    <p>Responsável técnico: ${txt(p.rt.nome)}${p.rt.registro ? " – " + e(p.rt.registro) : ""}</p>
  </section>`;
}
function identificacao(p) {
  const em = p.empresa;
  return kv([
    ["Razão social", txt(em.razao)], ["Nome fantasia", txt(em.fantasia)], ["CNPJ", txt(em.cnpj)],
    ["CNAE e atividade principal", txt(em.cnae)], ["Grau de risco (NR-04)", txt(em.grauRisco)],
    ["Endereço", txt(em.endereco) + (em.cidadeUF ? " – " + e(em.cidadeUF) : "")],
    ["Número de empregados", txt(em.nEmpregados)], ["Representante legal", txt(em.representante)],
  ]);
}
function responsavel(p) {
  return kv([
    ["Nome", txt(p.rt.nome)], ["Habilitação", txt(p.rt.titulo)], ["Registro profissional", txt(p.rt.registro)],
    ["ART / documento de responsabilidade", txt(p.rt.art)], ["Data da avaliação no local", dataBR(p.doc.dataAvaliacao)],
  ]);
}
function assinaturas(p, comEmpresa) {
  const local = (p.empresa.cidadeUF || "").split("/")[0];
  return `<p class="local-data">${e(local || "Local")}, ${dataBR(p.doc.dataEmissao)}.</p>
  <div class="assinaturas">
    <div><span></span>${txt(p.rt.nome, "Responsável técnico")}<br>${txt(p.rt.titulo, "")}<br>${txt(p.rt.registro, "")}</div>
    ${comEmpresa ? `<div><span></span>${txt(p.empresa.representante, "Representante legal")}<br>${txt(p.empresa.razao, "")}</div>` : ""}
  </div>`;
}
function fichaGhe(g) {
  return kv([
    ["Setor", txt(g.setor)], ["Funções (cargos)", txt(g.funcoes)], ["Trabalhadores expostos", txt(g.nTrab)],
    ["Jornada", txt(g.jornada)], ["Ambiente de trabalho", txt(g.ambiente)], ["Atividades", txt(g.atividades)],
  ]);
}
const chipNivel = (n) => (n ? `<span class="nivel n-${n.id}">${n.t} (${n.v})</span>` : "—");

// ---------- PGR ----------
function docPGR(p) {
  _n = 0;
  const matriz = `<table class="matriz"><thead><tr><th>Severidade ↓ / Probabilidade →</th>${PROBABILIDADES.map((x) => `<th>${x[0]} – ${x[1]}</th>`).join("")}</tr></thead><tbody>${
    [...SEVERIDADES].reverse().map((s) => `<tr><th>${s[0]} – ${s[1]}</th>${PROBABILIDADES.map((x) => {
      const v = s[0] * x[0], n = NIVEIS.find((k) => v <= k.max);
      return `<td class="n-${n.id}">${v}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table>`;

  const inventario = p.ghes.map((g, i) => {
    const rs = riscosDo(p, g);
    return `<h3>${_n}.${i + 1} ${e(g.nome)}</h3>${fichaGhe(g)}${tabela(
      ["Grupo", "Perigo e fonte ou circunstância", "Possíveis lesões ou agravos", "Exposição", "Medidas de prevenção existentes", "Avaliação", "S", "P", "Nível de risco"],
      rs.map((r) => [
        GRUPOS[r.grupo] || "—", `<b>${txt(r.agente)}</b><br>${txt(r.fonte, "")}`, txt(r.lesoes),
        rotulo(EXPOSICOES, r.exposicao) + (r.via ? `<br><small>${e(r.via)}</small>` : ""), medidasDe(r),
        avaliacaoDe(r) + (r.tecnica ? `<br><small>${e(r.tecnica)}</small>` : ""), txt(r.sev), txt(r.prob), chipNivel(nivelDe(r)),
      ]), "inv")}`;
  }).join("");

  const tipos = { eliminacao: "Eliminação", epc: "Proteção coletiva", adm: "Administrativa", epi: "EPI" };
  const status = { pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída" };

  return capa(p, "Programa de Gerenciamento de Riscos", "PGR – NR-01") +
    sec("Identificação da organização", identificacao(p)) +
    sec("Objetivo e abrangência", `<p>Este Programa de Gerenciamento de Riscos (PGR) materializa o gerenciamento de riscos ocupacionais (GRO) do estabelecimento, conforme o item 1.5 da Norma Regulamentadora nº 01. Reúne o inventário de riscos e o plano de ação, e orienta a prevenção de lesões e agravos à saúde dos trabalhadores.</p>
      <p>O programa abrange os riscos que decorrem de agentes físicos, químicos e biológicos, os riscos de acidentes e os relacionados a fatores ergonômicos, incluídos os fatores de risco psicossociais relacionados ao trabalho (NR-01, item 1.5.3.1.4), em todas as atividades e ambientes descritos neste documento.</p>`) +
    sec("Referências normativas", lista([
      "NR-01 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais, com a redação da Portaria MTE nº 1.419/2024;",
      "NR-06 – Equipamentos de Proteção Individual; NR-07 – Programa de Controle Médico de Saúde Ocupacional;",
      "NR-09 – Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos;",
      "NR-15 – Atividades e Operações Insalubres; NR-17 – Ergonomia;",
      "Normas de Higiene Ocupacional (NHO) da Fundacentro e demais normas regulamentadoras aplicáveis às atividades.",
    ])) +
    sec("Responsabilidades", lista([
      "<b>Organização:</b> implementar o GRO, fornecer os recursos, cumprir o plano de ação e manter o PGR atualizado e disponível aos trabalhadores, aos sindicatos e à Inspeção do Trabalho (1.5.7.2);",
      "<b>Lideranças:</b> acompanhar a execução das medidas de prevenção em suas áreas e comunicar mudanças que criem ou alterem riscos;",
      "<b>Trabalhadores:</b> cumprir as orientações de segurança, usar os equipamentos de proteção e comunicar situações de risco; são consultados sobre a percepção dos riscos (1.5.3.3);",
      "<b>Responsável técnico:</b> conduzir a identificação de perigos e a avaliação dos riscos, e orientar a escolha das medidas de prevenção.",
    ])) +
    sec("Metodologia de avaliação dos riscos", `<p>O processo seguiu as etapas do item 1.5.4 da NR-01: levantamento preliminar de perigos, identificação de perigos com as fontes ou circunstâncias e os grupos expostos, e avaliação dos riscos. As exposições a agentes físicos, químicos e biológicos foram avaliadas conforme a NR-09 e, quando quantitativas, comparadas com os limites da NR-15. As condições de trabalho foram avaliadas conforme a NR-17.</p>
      <p>Para cada risco foi indicado o nível de risco ocupacional, pela combinação da severidade das possíveis lesões ou agravos com a probabilidade de sua ocorrência (1.5.4.4.2). A probabilidade considera os requisitos das normas, as medidas de prevenção implementadas, as exigências da atividade e a comparação do perfil de exposição com os valores de referência. A ferramenta adotada é a matriz 5 × 5 abaixo.</p>
      ${tabela(["Severidade", "Descrição", "Critério"], SEVERIDADES.map((s) => [s[0], s[1], s[2]]))}
      ${tabela(["Probabilidade", "Descrição", "Critério"], PROBABILIDADES.map((s) => [s[0], s[1], s[2]]))}
      ${matriz}
      ${tabela(["Nível de risco", "Pontuação", "Ação requerida"], NIVEIS.map((n, i) => [`<span class="nivel n-${n.id}">${n.t}</span>`, `${i ? NIVEIS[i - 1].max + 1 : 1} a ${n.max}`, n.acao]))}
      <p>As medidas de prevenção seguem a ordem de prioridade da NR-01 (item 1.4.1, alínea g): eliminação dos fatores de risco; medidas de proteção coletiva; medidas administrativas ou de organização do trabalho; e, por último, equipamento de proteção individual.</p>`) +
    sec("Caracterização dos processos e ambientes de trabalho", `<p>${txt(p.empresa.processo, "Descrever o processo produtivo na tela Empresa.")}</p>` +
      tabela(["Grupo de exposição", "Setor", "Ambiente de trabalho", "Trabalhadores"], p.ghes.map((g) => [e(g.nome), txt(g.setor), txt(g.ambiente), txt(g.nTrab)]))) +
    sec("Inventário de riscos ocupacionais", `<p>Inventário elaborado conforme o item 1.5.7.3.2 da NR-01, por grupo de trabalhadores expostos. S = severidade; P = probabilidade.</p>${inventario || "<p>Nenhum grupo cadastrado.</p>"}`) +
    sec("Plano de ação", `<p>Medidas de prevenção a introduzir, aprimorar ou manter, com cronograma, responsáveis e formas de acompanhamento e aferição dos resultados (NR-01, item 1.5.5.2). A prioridade considera o nível de risco e o número de trabalhadores atingidos.</p>` +
      tabela(["Medida de prevenção", "Tipo", "Risco relacionado", "Responsável", "Prazo", "Acompanhamento e aferição", "Situação"],
        p.plano.map((a) => [txt(a.medida), tipos[a.tipo] || "—", txt(a.risco), txt(a.responsavel), dataBR(a.prazo), txt(a.acompanhamento), status[a.status] || "Pendente"]))) +
    sec("Acompanhamento, revisão e guarda", `<p>O desempenho das medidas de prevenção é acompanhado de forma planejada, com verificação da execução das ações, inspeções dos locais de trabalho e monitoramento das exposições e da saúde dos trabalhadores, em articulação com o PCMSO (NR-07).</p>
      <p>A avaliação de riscos é um processo contínuo e será revista a cada dois anos, ou antes disso: depois da implementação das medidas de prevenção, para avaliar os riscos residuais; depois de mudanças em tecnologias, ambientes, processos, condições, procedimentos ou organização do trabalho; quando as medidas se mostrarem inadequadas, insuficientes ou ineficazes; na ocorrência de acidentes ou doenças relacionadas ao trabalho; quando mudarem os requisitos legais; ou por solicitação justificada dos trabalhadores ou da CIPA (NR-01, item 1.5.4.4.6).</p>
      <p>O inventário de riscos é mantido atualizado, e o histórico das atualizações é guardado por no mínimo 20 anos (item 1.5.7.3.3).</p>`) +
    sec("Encerramento", `<p>Este PGR foi elaborado sob a responsabilidade da organização e é composto pelo inventário de riscos e pelo plano de ação acima.</p>${assinaturas(p, true)}`);
}

// ---------- LTCAT ----------
function docLTCAT(p) {
  _n = 0;
  const porGhe = p.ghes.map((g, i) => {
    const rs = riscosDo(p, g).filter((r) => AMBIENTAIS.includes(r.grupo));
    return `<h3>${_n}.${i + 1} ${e(g.nome)}</h3>${fichaGhe(g)}${rs.length ? tabela(
      ["Agente prejudicial", "Fonte geradora", "Via e periodicidade da exposição", "Metodologia e procedimento", "Intensidade ou concentração", "Medidas de controle existentes", "Enquadra para aposentadoria especial"],
      rs.map((r) => {
        const s = especial(r);
        return [`<b>${txt(r.agente)}</b><br><small>${GRUPOS[r.grupo]}${r.esocial ? " – eSocial " + e(r.esocial) : ""}</small>`, txt(r.fonte),
          `${txt(r.via)}<br>${rotulo(EXPOSICOES, r.exposicao)}`, txt(r.tecnica), avaliacaoDe(r), medidasDe(r),
          `<b>${ESP_T[s.final]}</b><br><small>${e(r.obsLtcat || s.motivo || "")}</small>`];
      }), "inv") : "<p>Não foram identificados agentes físicos, químicos ou biológicos prejudiciais à saúde neste grupo.</p>"}`;
  }).join("");

  const resumo = p.ghes.map((g) => {
    const rs = riscosDo(p, g).filter((r) => AMBIENTAIS.includes(r.grupo));
    const sim = rs.filter((r) => especial(r).final === "sim");
    const pend = rs.some((r) => especial(r).final === "pendente");
    return [e(g.nome), txt(g.funcoes), sim.length ? sim.map((r) => e(r.agente)).join("; ") : "Ausência de agente prejudicial acima dos limites",
      sim.length ? "<b>Sim</b>" : pend ? "A definir pelo profissional" : "Não"];
  });

  return capa(p, "Laudo Técnico das Condições Ambientais do Trabalho", "LTCAT – Lei 8.213/1991, art. 58") +
    sec("Identificação da empresa", identificacao(p)) +
    sec("Objetivo e fundamentação legal", `<p>Este laudo registra as condições ambientais do trabalho e a exposição dos trabalhadores a agentes prejudiciais à saúde, físicos, químicos e biológicos, ou à associação desses agentes, para fins de comprovação da atividade especial perante a Previdência Social e para embasar o Perfil Profissiográfico Previdenciário (PPP).</p>
      <p>Fundamentos: Lei nº 8.213/1991, arts. 57 e 58; Decreto nº 3.048/1999, arts. 64 a 68 e Anexo IV; Instrução Normativa PRES/INSS nº 128/2022, arts. 276 e 277; NR-15 e Normas de Higiene Ocupacional da Fundacentro quanto à metodologia e aos limites de tolerância.</p>`) +
    sec("Tipo de laudo e responsável técnico", `<p>Laudo <b>${p.doc.tipoLaudo === "individual" ? "individual" : "coletivo"}</b>, ${p.doc.tipoLaudo === "individual" ? "referente ao trabalhador indicado" : "elaborado por grupos homogêneos de exposição (GHE): trabalhadores com o mesmo perfil de exposição, de modo que a avaliação de parte do grupo representa todos"}.</p>${responsavel(p)}`) +
    sec("Metodologia e instrumentos", `<p>As avaliações foram feitas nos locais de trabalho, em condições normais de operação, com acompanhamento das atividades de cada grupo. Os agentes com limite de tolerância foram avaliados de forma quantitativa, pela metodologia e pelos procedimentos das Normas de Higiene Ocupacional da Fundacentro, com os limites da NR-15. O ruído foi expresso em nível de exposição normalizado (NEN), conforme a NHO-01. Os agentes sem limite de tolerância foram avaliados de forma qualitativa, pela descrição da atividade, das fontes e da forma de contato.</p>
      <p><b>Instrumentos:</b> ${txt(p.doc.instrumentos, "informar os instrumentos e os certificados de calibração na tela Empresa.")}</p>`) +
    sec("Avaliação por setor e função", porGhe || "<p>Nenhum grupo cadastrado.</p>") +
    sec("Quadro-resumo", tabela(["Grupo de exposição", "Funções", "Agentes que enquadram", "Condição especial"], resumo) +
      `<p><small>A existência de condição especial obriga a empresa ao recolhimento da contribuição adicional do art. 57, § 6º, da Lei 8.213/1991 e à informação correspondente no eSocial (evento S-2240).</small></p>`) +
    sec("Conclusão", `<p>Com base nas avaliações descritas, conclui-se pela exposição a agentes prejudiciais à saúde, de modo habitual e permanente e acima dos limites de tolerância, apenas nos grupos indicados com condição especial no quadro-resumo. Nos demais, não há exposição que caracterize atividade especial nos termos do Anexo IV do Decreto nº 3.048/1999.</p>
      <p>${txt(p.doc.conclusaoLtcat, "")}</p>
      <p>Este laudo deve ser atualizado sempre que houver mudança no ambiente de trabalho ou em sua organização: alteração de layout, substituição de máquinas ou equipamentos, adoção ou alteração de tecnologia de proteção coletiva, ou alcance dos níveis de ação.</p>${assinaturas(p)}`);
}

// ---------- Insalubridade ----------
function docInsal(p) {
  _n = 0;
  const porGhe = p.ghes.map((g, i) => {
    const rs = riscosDo(p, g).filter((r) => ANEXOS15[r.anexo15]);
    return `<h3>${_n}.${i + 1} ${e(g.nome)}</h3>${fichaGhe(g)}${rs.length ? tabela(
      ["Agente e fonte", "Enquadramento na NR-15", "Exposição", "Avaliação", "Medidas de controle e EPI", "Conclusão"],
      rs.map((r) => {
        const s = insalubridade(r);
        return [`<b>${txt(r.agente)}</b><br>${txt(r.fonte, "")}`, e(s.anexo.t), rotulo(EXPOSICOES, r.exposicao),
          avaliacaoDe(r) + (r.tecnica ? `<br><small>${e(r.tecnica)}</small>` : ""), medidasDe(r),
          `<b>${INSAL_T[s.final]}${s.grau ? " – grau " + GRAUS[s.grau].t : ""}</b><br><small>${e(r.obsInsal || s.motivo || "")}</small>`];
      }), "inv") : "<p>Não foram identificados agentes enquadráveis nos anexos da NR-15 neste grupo.</p>"}`;
  }).join("");

  const ordem = ["minimo", "medio", "maximo"];
  const resumo = p.ghes.map((g) => {
    const an = riscosDo(p, g).filter((r) => ANEXOS15[r.anexo15]).map((r) => ({ r, s: insalubridade(r) }));
    const sim = an.filter((x) => x.s.final === "sim");
    const maior = sim.map((x) => x.s.grau).filter(Boolean).sort((a, b) => ordem.indexOf(b) - ordem.indexOf(a))[0];
    const pend = an.some((x) => x.s.final === "pendente");
    return [e(g.nome), txt(g.funcoes), sim.length ? sim.map((x) => e(x.r.agente)).join("; ") : "—",
      sim.length ? `<b>Insalubre</b>${maior ? ` – grau ${GRAUS[maior].t} (${GRAUS[maior].pct}%)` : " – grau a definir"}` : pend ? "A definir pelo profissional" : "Não insalubre"];
  });

  return capa(p, "Laudo Técnico de Insalubridade", "NR-15 – Atividades e Operações Insalubres") +
    sec("Identificação da empresa", identificacao(p)) +
    sec("Objetivo", `<p>Verificar se as atividades e operações do estabelecimento expõem os trabalhadores a agentes nocivos à saúde acima dos limites de tolerância ou nas condições descritas nos anexos da NR-15 e, quando for o caso, indicar o grau de insalubridade.</p>`) +
    sec("Fundamentação legal", `<p>Consolidação das Leis do Trabalho, arts. 189 a 192 e 195, e Norma Regulamentadora nº 15. Conforme a NR-15:</p>` + lista([
      "são insalubres as atividades que se desenvolvem acima dos limites de tolerância dos Anexos 1, 2, 3, 5, 8, 11 e 12, as mencionadas nos Anexos 6, 13 e 14 e as comprovadas por laudo de inspeção do local de trabalho nos Anexos 7, 9 e 10 (item 15.1);",
      "o exercício de trabalho em condições insalubres assegura adicional sobre o salário mínimo de 40% no grau máximo, 20% no grau médio e 10% no grau mínimo (item 15.2);",
      "na incidência de mais de um fator de insalubridade, considera-se apenas o de grau mais elevado, vedada a percepção cumulativa (item 15.3);",
      "a eliminação ou neutralização da insalubridade, por medidas que conservem o ambiente dentro dos limites de tolerância ou pelo uso de equipamento de proteção individual, determina a cessação do pagamento do adicional (itens 15.4 e 15.4.1).",
    ])) +
    sec("Responsável técnico e metodologia", responsavel(p) + `<p>A inspeção foi feita nos locais de trabalho, em condições normais de operação. Os agentes com limite de tolerância foram medidos conforme os anexos da NR-15 e as Normas de Higiene Ocupacional da Fundacentro; os demais foram avaliados por inspeção, com descrição da atividade e da forma de contato. A eficácia dos equipamentos de proteção considerou o certificado de aprovação, a adequação ao risco, o fornecimento, o treinamento e a fiscalização do uso (NR-06).</p>
      <p><b>Instrumentos:</b> ${txt(p.doc.instrumentos, "informar os instrumentos e os certificados de calibração na tela Empresa.")}</p>`) +
    sec("Análise por grupo de exposição", porGhe || "<p>Nenhum grupo cadastrado.</p>") +
    sec("Quadro-resumo", tabela(["Grupo de exposição", "Funções", "Agentes caracterizadores", "Conclusão"], resumo)) +
    sec("Conclusão", `<p>As atividades dos grupos indicados como insalubres no quadro-resumo enquadram-se nos anexos da NR-15 no grau apontado. As demais atividades avaliadas não são insalubres, por não haver exposição acima dos limites de tolerância ou por estar a exposição neutralizada pelas medidas de controle descritas.</p>
      <p>${txt(p.doc.conclusaoInsal, "")}</p>
      <p>A conclusão vale enquanto se mantiverem as condições encontradas na data da avaliação. Este laudo deve permanecer disponível aos trabalhadores, aos sindicatos das categorias profissionais e à Inspeção do Trabalho (NR-15, item 15.4.1.3).</p>${assinaturas(p)}`);
}

// ---------- Periculosidade ----------
const PERM_T = [["permanente", "Habitual e permanente"], ["intermitente", "Habitual e intermitente"], ["eventual", "Eventual (fortuita) ou por tempo extremamente reduzido"]];
function docPericul(p) {
  _n = 0;
  const porGhe = p.ghes.map((g, i) => {
    const as = p.pericul.filter((a) => a.gheId === g.id);
    return `<h3>${_n}.${i + 1} ${e(g.nome)}</h3>${fichaGhe(g)}${as.length ? tabela(
      ["Enquadramento analisado", "Atividade ou operação", "Área de risco", "Permanência", "Conclusão e fundamento"],
      as.map((a) => [e(ANEXOS16[a.anexo] || "—"), txt(a.atividade), txt(a.area), rotulo(PERM_T, a.permanencia),
        `<b>${a.enquadra === "sim" ? "Perigosa" : a.enquadra === "nao" ? "Não perigosa" : "A definir pelo profissional"}</b><br><small>${txt(a.fundamento, "")}</small>`]), "inv")
      : "<p>Não foram identificadas atividades ou operações previstas nos anexos da NR-16 neste grupo.</p>"}`;
  }).join("");
  const resumo = p.ghes.map((g) => {
    const sim = p.pericul.filter((a) => a.gheId === g.id && a.enquadra === "sim");
    const pend = p.pericul.some((a) => a.gheId === g.id && !a.enquadra);
    return [e(g.nome), txt(g.funcoes), sim.length ? sim.map((a) => e(ANEXOS16[a.anexo] || "")).join("; ") : "—",
      sim.length ? "<b>Atividade perigosa</b> – adicional de 30%" : pend ? "A definir pelo profissional" : "Não perigosa"];
  });

  return capa(p, "Laudo Técnico de Periculosidade", "NR-16 – Atividades e Operações Perigosas") +
    sec("Identificação da empresa", identificacao(p)) +
    sec("Objetivo", `<p>Verificar se as atividades e operações do estabelecimento se enquadram como perigosas, nos termos do art. 193 da CLT e dos anexos da NR-16.</p>`) +
    sec("Fundamentação legal", `<p>Consolidação das Leis do Trabalho, arts. 193 a 195, e Norma Regulamentadora nº 16:</p>` + lista([
      "são consideradas perigosas as atividades e operações constantes dos anexos da NR-16: explosivos (Anexo 1), inflamáveis (Anexo 2), exposição a roubos ou outras espécies de violência física nas atividades de segurança pessoal ou patrimonial (Anexo 3), energia elétrica (Anexo 4), motocicleta (Anexo 5) e radiações ionizantes ou substâncias radioativas;",
      "o trabalho em condições de periculosidade assegura adicional de 30% sobre o salário, sem os acréscimos de gratificações, prêmios ou participação nos lucros (item 16.2);",
      "o empregado pode optar pelo adicional de insalubridade que porventura lhe seja devido (item 16.2.1);",
      "a caracterização é feita por laudo técnico de médico do trabalho ou engenheiro de segurança do trabalho (item 16.3);",
      "o contato eventual, assim considerado o fortuito, ou o que, sendo habitual, se dá por tempo extremamente reduzido, não gera o adicional (Súmula 364 do TST).",
    ])) +
    sec("Responsável técnico e metodologia", responsavel(p) + `<p>A inspeção foi feita nos locais de trabalho, com acompanhamento das atividades, entrevista com trabalhadores e lideranças, verificação dos produtos, quantidades e instalações e delimitação das áreas de risco conforme os anexos da NR-16.</p>`) +
    sec("Análise por grupo de exposição", porGhe || "<p>Nenhum grupo cadastrado.</p>") +
    sec("Quadro-resumo", tabela(["Grupo de exposição", "Funções", "Enquadramento", "Conclusão"], resumo)) +
    sec("Conclusão", `<p>As atividades dos grupos indicados como perigosos no quadro-resumo enquadram-se nos anexos da NR-16 ali citados. As demais atividades avaliadas não são perigosas, por não se enquadrarem nas hipóteses da norma ou por ocorrerem fora das áreas de risco.</p>
      <p>${txt(p.doc.conclusaoPericul, "")}</p>
      <p>A conclusão vale enquanto se mantiverem as condições encontradas na data da avaliação. Este laudo deve permanecer disponível aos trabalhadores, aos sindicatos das categorias profissionais e à Inspeção do Trabalho (NR-16, item 16.3.1).</p>${assinaturas(p)}`);
}

// ---------- Ergonomia (AEP) ----------
function docErgo(p) {
  _n = 0;
  const recs = [];
  const porGhe = p.ghes.map((g, i) => {
    const eg = p.ergo[g.id] || {};
    const linhas = [];
    ERGO_ITENS.forEach((grupo) => grupo.itens.forEach(([k, t, ref]) => {
      const it = (eg.itens || {})[k] || {};
      if (!it.sit) return;
      linhas.push([e(grupo.g.split(" (")[0]), `${e(t)}<br><small>${ref.startsWith("NR-") ? "" : "NR-17, "}${e(ref)}</small>`,
        `<span class="sit s-${it.sit}">${rotulo(ERGO_SIT, it.sit)}</span>`, txt(it.obs, ""), txt(it.rec, "")]);
      if ((it.rec || "").trim()) recs.push([e(g.nome), e(t), txt(it.rec), it.sit === "inadequado" ? "Alta" : "Média"]);
    }));
    const rs = riscosDo(p, g).filter((r) => r.grupo === "ergonomico");
    return `<h3>${_n}.${i + 1} ${e(g.nome)}</h3>${fichaGhe(g)}
      ${kv([["Método e técnicas", txt(eg.metodo)], ["Trabalhadores ouvidos (17.3.8)", txt(eg.ouvidos)], ["Queixas, afastamentos e dados de saúde", txt(eg.queixas)]])}
      ${tabela(["Tema", "Item avaliado", "Situação", "O que foi observado", "Recomendação"], linhas, "inv")}
      ${rs.length ? `<p><b>Riscos ergonômicos levados ao inventário do PGR:</b></p>` + tabela(["Perigo", "Fonte ou circunstância", "Possíveis agravos", "Nível de risco"],
        rs.map((r) => [txt(r.agente), txt(r.fonte), txt(r.lesoes), chipNivel(nivelDe(r))])) : ""}
      <p><b>Necessidade de análise ergonômica do trabalho (AET):</b> ${eg.aet === "sim" ? "Sim. " + txt(eg.aetMotivo, "") : eg.aet === "nao" ? "Não, com base nas condições encontradas." : "A definir pelo profissional."}</p>
      ${(eg.conclusao || "").trim() ? `<p><b>Conclusão do grupo:</b> ${txt(eg.conclusao)}</p>` : ""}`;
  }).join("");

  return capa(p, "Laudo Ergonômico", "Avaliação Ergonômica Preliminar (AEP) – NR-17") +
    sec("Identificação da empresa", identificacao(p)) +
    sec("Objetivo e fundamentação", `<p>Este documento registra a avaliação ergonômica preliminar (AEP) das situações de trabalho, exigida pelo item 17.3.1 da NR-17, para verificar a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores e indicar medidas de prevenção. A NR-17 não usa a expressão "laudo ergonômico"; o termo é mantido por ser o nome corrente do documento.</p>
      <p>Foram avaliados a organização do trabalho, o levantamento, transporte e descarga de cargas, o mobiliário, o trabalho com máquinas, equipamentos e ferramentas manuais e as condições de conforto do ambiente, além dos fatores de risco psicossociais relacionados ao trabalho (NR-01, item 1.5.3.1.4). Os resultados integram o inventário de riscos do PGR, e as medidas, o plano de ação (NR-17, itens 17.3.5 e 17.3.6).</p>`) +
    sec("Responsável técnico e metodologia", responsavel(p) + `<p>A avaliação combinou observação das atividades nos postos de trabalho, entrevistas com os trabalhadores e lideranças e lista de verificação baseada nos itens da NR-17, em abordagem qualitativa (item 17.3.1.1). Cada item foi classificado como adequado, requer atenção ou inadequado.</p>`) +
    sec("Avaliação por grupo de exposição", porGhe || "<p>Nenhum grupo cadastrado.</p>") +
    sec("Recomendações", tabela(["Grupo", "Item", "Recomendação", "Prioridade"], recs) + `<p>As recomendações devem ser incluídas no plano de ação do PGR, com responsáveis e prazos.</p>`) +
    sec("Conclusão", `<p>As situações classificadas como inadequadas ou que requerem atenção pedem as medidas indicadas nas recomendações. Nos grupos em que se indicou a necessidade de análise ergonômica do trabalho (AET), ela deve seguir as etapas do item 17.3.3 da NR-17: análise da demanda; análise do funcionamento da organização, dos processos, das situações de trabalho e da atividade; descrição e justificativa dos métodos; diagnóstico; recomendações; e restituição dos resultados, validação e revisão das intervenções com a participação dos trabalhadores.</p>
      <p>${txt(p.doc.conclusaoErgo, "")}</p>${assinaturas(p)}`);
}

const DOCUMENTOS = {
  pgr: { t: "PGR", nome: "Programa de Gerenciamento de Riscos", base: "NR-01", gerar: docPGR },
  ltcat: { t: "LTCAT", nome: "Laudo Técnico das Condições Ambientais do Trabalho", base: "Lei 8.213 e IN 128/2022", gerar: docLTCAT },
  insal: { t: "Insalubridade", nome: "Laudo Técnico de Insalubridade", base: "NR-15", gerar: docInsal },
  pericul: { t: "Periculosidade", nome: "Laudo Técnico de Periculosidade", base: "NR-16", gerar: docPericul },
  ergo: { t: "Ergonomia", nome: "Laudo Ergonômico (AEP)", base: "NR-17", gerar: docErgo },
};
