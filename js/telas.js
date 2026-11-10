// Telas de preenchimento. Cada campo tem data-bind com o caminho do dado dentro do projeto.

let P = null; // projeto em edição, definido a cada render
const ui = { abertos: new Set(), doc: "pgr" };

const campo = (rot, caminho, o = {}) =>
  `<label class="campo ${o.cls || ""}"><span>${rot}</span><input type="${o.type || "text"}" data-bind="${caminho}" value="${e(get(P, caminho))}" placeholder="${e(o.ph || "")}" ${o.mode ? `inputmode="${o.mode}"` : ""}></label>`;
const area = (rot, caminho, o = {}) =>
  `<label class="campo largo ${o.cls || ""}"><span>${rot}</span><textarea rows="${o.rows || 3}" data-bind="${caminho}" placeholder="${e(o.ph || "")}">${e(get(P, caminho))}</textarea></label>`;
const sel = (rot, caminho, ops, o = {}) => {
  const v = String(get(P, caminho) || o.padrao || "");
  return `<label class="campo ${o.cls || ""}"><span>${rot}</span><select data-bind="${caminho}" ${o.re ? "data-re" : ""}>${ops
    .map(([val, t]) => `<option value="${e(val)}" ${String(val) === v ? "selected" : ""}>${e(t)}</option>`).join("")}</select></label>`;
};
const det = (id, resumo, corpo) =>
  `<details class="cartao" data-det="${id}" ${ui.abertos.has(id) ? "open" : ""}><summary>${resumo}</summary><div class="grade">${corpo}</div></details>`;
const vazio = (t) => `<p class="vazio">${t}</p>`;
const semGhe = () => vazio(`Cadastre primeiro os grupos de exposição na aba <a href="#/grupos">Grupos</a>.`);

const TELAS = {};

TELAS.inicio = () => {
  const lista = estado.projetos.map((p) => `
    <div class="cartao linha ${p.id === estado.atual ? "ativo" : ""}">
      <div><b>${e(p.empresa.razao || "Sem nome")}</b><br><small>${e(p.empresa.cnpj || "CNPJ não informado")} · ${p.ghes.length} grupos · ${p.riscos.length} riscos</small></div>
      <div class="botoes">
        <button class="btn" data-acao="abrir:${p.id}">${p.id === estado.atual ? "Continuar" : "Abrir"}</button>
        <button class="btn sec" data-acao="duplicar:${p.id}">Duplicar</button>
        <button class="btn perigo" data-acao="excluirProjeto:${p.id}">Excluir</button>
      </div>
    </div>`).join("");
  return `
    <h1>Gerador de documentos de SST</h1>
    <p class="sub">Cadastre a empresa, os grupos de exposição e os riscos uma vez. O app monta o PGR, o LTCAT e os laudos de insalubridade, periculosidade e ergonomia a partir dos mesmos dados.</p>
    ${lista || vazio("Nenhuma empresa cadastrada ainda.")}
    <div class="botoes">
      <button class="btn" data-acao="novo">Nova empresa</button>
      <button class="btn sec" data-acao="exemplo">Carregar empresa de exemplo</button>
    </div>
    <h2>Seus dados</h2>
    <p class="sub">Tudo fica salvo só neste aparelho. Baixe um backup para guardar ou levar a outro aparelho.</p>
    <div class="botoes">
      <button class="btn sec" data-acao="backup">Baixar backup</button>
      <label class="btn sec">Carregar backup<input type="file" accept=".json,application/json" data-importar hidden></label>
    </div>
    <p class="aviso">Os documentos gerados são minutas. A conclusão técnica e a assinatura cabem ao profissional legalmente habilitado (engenheiro de segurança do trabalho ou médico do trabalho), que deve conferir os dados e o texto vigente das normas.</p>`;
};

TELAS.empresa = () => `
  <h1>Empresa e responsável técnico</h1>
  <section class="grade">
    ${campo("Razão social", "empresa.razao", { cls: "largo" })}
    ${campo("Nome fantasia", "empresa.fantasia")}
    ${campo("CNPJ", "empresa.cnpj", { ph: "00.000.000/0001-00" })}
    ${campo("CNAE e atividade principal", "empresa.cnae", { cls: "largo" })}
    ${sel("Grau de risco (NR-04)", "empresa.grauRisco", [["", "—"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]])}
    ${campo("Número de empregados", "empresa.nEmpregados", { mode: "numeric" })}
    ${campo("Endereço do estabelecimento", "empresa.endereco", { cls: "largo" })}
    ${campo("Cidade/UF", "empresa.cidadeUF", { ph: "Joinville/SC" })}
    ${campo("Representante legal", "empresa.representante")}
    ${area("Processo produtivo e ambientes (entra no PGR)", "empresa.processo", { rows: 4, ph: "Descreva as etapas do processo, os setores e como se relacionam." })}
  </section>
  <h2>Responsável técnico</h2>
  <section class="grade">
    ${campo("Nome", "rt.nome")}
    ${campo("Habilitação", "rt.titulo", { ph: "Engenheiro de Segurança do Trabalho" })}
    ${campo("Registro profissional", "rt.registro", { ph: "CREA-UF 000000 ou CRM-UF 000000" })}
    ${campo("ART ou documento equivalente", "rt.art")}
  </section>
  <h2>Dados dos documentos</h2>
  <section class="grade">
    ${campo("Data de emissão", "doc.dataEmissao", { type: "date" })}
    ${campo("Data da avaliação no local", "doc.dataAvaliacao", { type: "date" })}
    ${sel("Tipo de LTCAT", "doc.tipoLaudo", [["coletivo", "Coletivo (por GHE)"], ["individual", "Individual"]])}
    ${area("Instrumentos de medição e calibração", "doc.instrumentos", { ph: "Marca, modelo, número de série e certificado de calibração de cada instrumento." })}
    ${area("Complemento da conclusão do LTCAT (opcional)", "doc.conclusaoLtcat", { rows: 2 })}
    ${area("Complemento da conclusão do laudo de insalubridade (opcional)", "doc.conclusaoInsal", { rows: 2 })}
    ${area("Complemento da conclusão do laudo de periculosidade (opcional)", "doc.conclusaoPericul", { rows: 2 })}
    ${area("Complemento da conclusão do laudo ergonômico (opcional)", "doc.conclusaoErgo", { rows: 2 })}
  </section>`;

TELAS.grupos = () => `
  <h1>Grupos homogêneos de exposição</h1>
  <p class="sub">Um GHE reúne trabalhadores com o mesmo perfil de exposição. Todos os documentos são organizados por grupo.</p>
  ${P.ghes.map((g, i) => det("g:" + g.id, `<b>${e(g.nome || "Grupo sem nome")}</b><small>${e(g.setor || "")} · ${e(g.nTrab || "0")} trabalhadores · ${riscosDo(P, g).length} riscos</small>`, `
      ${campo("Nome do grupo", `ghes.${i}.nome`, { ph: "GHE 01 – Administrativo" })}
      ${campo("Setor", `ghes.${i}.setor`)}
      ${campo("Funções (cargos)", `ghes.${i}.funcoes`, { cls: "largo" })}
      ${campo("Trabalhadores expostos", `ghes.${i}.nTrab`, { mode: "numeric" })}
      ${campo("Jornada", `ghes.${i}.jornada`, { ph: "44 h semanais, das 8h às 18h" })}
      ${area("Ambiente de trabalho", `ghes.${i}.ambiente`, { ph: "Área, pé-direito, piso, cobertura, ventilação, iluminação." })}
      ${area("Descrição das atividades", `ghes.${i}.atividades`, { ph: "O que o grupo faz, com que máquinas, ferramentas e produtos." })}
      <div class="botoes largo"><button class="btn perigo" data-acao="excluirGhe:${i}">Excluir grupo</button></div>`)).join("") || vazio("Nenhum grupo cadastrado.")}
  <div class="botoes"><button class="btn" data-acao="novoGhe">Adicionar grupo</button></div>`;

function cartaoRisco(r, i) {
  const n = nivelDe(r);
  const amb = AMBIENTAIS.includes(r.grupo);
  const quant = r.tipoAval === "quantitativa";
  const a15 = ANEXOS15[r.anexo15];
  const ins = a15 ? insalubridade(r) : null;
  const esp = amb ? especial(r) : null;
  const cat = CATALOGO.map((c, k) => [k, c]).filter(([, c]) => c.grupo === r.grupo);
  const acima = acimaDoLimite(r);
  return det("r:" + r.id,
    `<span class="chip g-${r.grupo}">${GRUPOS[r.grupo] || "Grupo"}</span><b>${e(r.agente || "Risco sem nome")}</b>${n ? `<span class="nivel n-${n.id}">${n.t} (${n.v})</span>` : ""}`, `
    ${sel("Grupo de risco", `riscos.${i}.grupo`, Object.entries(GRUPOS), { re: 1 })}
    <label class="campo"><span>Preencher pelo catálogo</span><select data-catalogo="${i}"><option value="">Escolher…</option>${cat.map(([k, c]) => `<option value="${k}">${e(c.agente)}</option>`).join("")}</select></label>
    ${campo("Perigo ou agente", `riscos.${i}.agente`, { cls: "largo" })}
    ${campo("Fonte geradora ou circunstância", `riscos.${i}.fonte`, { cls: "largo" })}
    ${campo("Possíveis lesões ou agravos à saúde", `riscos.${i}.lesoes`, { cls: "largo" })}
    ${sel("Exposição", `riscos.${i}.exposicao`, EXPOSICOES)}
    ${campo("Via de exposição ou parte do corpo", `riscos.${i}.via`)}
    ${sel("Tipo de avaliação", `riscos.${i}.tipoAval`, [["qualitativa", "Qualitativa"], ["quantitativa", "Quantitativa"]], { re: 1 })}
    ${quant ? campo("Valor medido", `riscos.${i}.valor`, { mode: "decimal" }) + campo("Unidade", `riscos.${i}.unidade`) + campo("Limite de tolerância", `riscos.${i}.limite`, { mode: "decimal" }) : ""}
    ${quant && acima != null ? `<p class="dica largo ${acima ? "alerta" : ""}">${acima ? "Valor acima do limite de tolerância." : "Valor dentro do limite de tolerância."}</p>` : ""}
    ${campo("Metodologia e procedimento de avaliação", `riscos.${i}.tecnica`, { cls: "largo" })}
    <h3 class="largo">Medidas de prevenção existentes</h3>
    ${campo("Proteção coletiva", `riscos.${i}.epc`, { cls: "largo" })}
    ${campo("Administrativas e de organização do trabalho", `riscos.${i}.adm`, { cls: "largo" })}
    ${campo("EPI", `riscos.${i}.epi`)}
    ${campo("CA do EPI", `riscos.${i}.ca`)}
    ${sel("As medidas são eficazes?", `riscos.${i}.epiEficaz`, [["", "Não avaliado"], ["sim", "Sim"], ["nao", "Não"]], { re: 1 })}
    <h3 class="largo">Nível de risco (PGR)</h3>
    ${sel("Severidade", `riscos.${i}.sev`, [["", "—"], ...SEVERIDADES.map((s) => [s[0], `${s[0]} – ${s[1]}: ${s[2]}`])], { re: 1 })}
    ${sel("Probabilidade", `riscos.${i}.prob`, [["", "—"], ...PROBABILIDADES.map((s) => [s[0], `${s[0]} – ${s[1]}: ${s[2]}`])], { re: 1 })}
    ${n ? `<p class="dica largo"><span class="nivel n-${n.id}">${n.t} (${n.v})</span> ${n.acao}</p>` : ""}
    ${amb ? `
      <h3 class="largo">Insalubridade (NR-15)</h3>
      ${sel("Anexo da NR-15", `riscos.${i}.anexo15`, [["", "Não se enquadra"], ...Object.entries(ANEXOS15).map(([k, a]) => [k, a.t])], { re: 1, cls: "largo" })}
      ${a15 ? sel("Conclusão", `riscos.${i}.insal`, [["auto", "Seguir a sugestão do app"], ["sim", "Insalubre"], ["nao", "Não insalubre"], ["neutralizada", "Neutralizada por medida de controle"]], { re: 1, padrao: "auto" })
        + sel("Grau", `riscos.${i}.grau`, [["", a15.grau ? `Do anexo: ${GRAUS[a15.grau].t}` : "Escolher…"], ...Object.entries(GRAUS).map(([k, g]) => [k, `${g.t} (${g.pct}%)`])], { re: 1 })
        + `<p class="dica largo ${ins.final === "pendente" ? "alerta" : ""}"><b>${INSAL_T[ins.final]}${ins.grau ? " – grau " + GRAUS[ins.grau].t : ""}.</b> ${e(ins.motivo)}</p>`
        + campo("Observação para o laudo de insalubridade (opcional)", `riscos.${i}.obsInsal`, { cls: "largo" }) : ""}
      <h3 class="largo">Aposentadoria especial (LTCAT)</h3>
      ${sel("Enquadra?", `riscos.${i}.especial`, [["auto", "Seguir a sugestão do app"], ["sim", "Sim"], ["nao", "Não"]], { re: 1, padrao: "auto" })}
      ${campo("Código do agente no eSocial (Tabela 24)", `riscos.${i}.esocial`, { ph: "ex.: 02.01.001" })}
      <p class="dica largo ${esp.final === "pendente" ? "alerta" : ""}"><b>${ESP_T[esp.final]}.</b> ${e(esp.motivo)}</p>
      ${campo("Observação para o LTCAT (opcional)", `riscos.${i}.obsLtcat`, { cls: "largo" })}` : ""}
    <div class="botoes largo"><button class="btn perigo" data-acao="excluirRisco:${i}">Excluir risco</button></div>`);
}

TELAS.riscos = () => {
  if (!P.ghes.length) return `<h1>Riscos</h1>${semGhe()}`;
  return `<h1>Riscos por grupo</h1>
  <p class="sub">Cada risco é cadastrado uma vez e alimenta o inventário do PGR, o LTCAT e o laudo de insalubridade.</p>
  ${P.ghes.map((g) => `
    <h2>${e(g.nome)}</h2>
    ${P.riscos.map((r, i) => (r.gheId === g.id ? cartaoRisco(r, i) : "")).join("") || vazio("Nenhum risco neste grupo.")}
    <div class="botoes"><button class="btn sec" data-acao="novoRisco:${g.id}">Adicionar risco</button></div>`).join("")}`;
};

TELAS.pericul = () => {
  if (!P.ghes.length) return `<h1>Periculosidade</h1>${semGhe()}`;
  return `<h1>Periculosidade (NR-16)</h1>
  <p class="sub">Registre as atividades analisadas contra os anexos da NR-16, inclusive as que não se enquadram. Grupo sem registro sai no laudo como "não perigoso".</p>
  ${P.ghes.map((g) => `
    <h2>${e(g.nome)}</h2>
    ${P.pericul.map((a, i) => (a.gheId !== g.id ? "" : det("p:" + a.id,
      `<b>${e((ANEXOS16[a.anexo] || "Atividade sem anexo").split(" – ").slice(0, 2).join(" – "))}</b><span class="sit s-${a.enquadra === "sim" ? "inadequado" : a.enquadra === "nao" ? "ok" : "atencao"}">${a.enquadra === "sim" ? "Perigosa" : a.enquadra === "nao" ? "Não perigosa" : "A definir"}</span>`, `
      ${sel("Anexo analisado", `pericul.${i}.anexo`, [["", "Escolher…"], ...Object.entries(ANEXOS16)], { re: 1, cls: "largo" })}
      ${area("Atividade ou operação", `pericul.${i}.atividade`, { ph: "O que é feito, com que produto, quantidade, tensão ou equipamento." })}
      ${campo("Área de risco", `pericul.${i}.area`, { cls: "largo", ph: "Local e delimitação conforme o anexo." })}
      ${sel("Permanência na área de risco", `pericul.${i}.permanencia`, [["", "—"], ...PERM_T])}
      ${sel("Conclusão", `pericul.${i}.enquadra`, [["", "A definir pelo profissional"], ["sim", "Perigosa"], ["nao", "Não perigosa"]], { re: 1 })}
      ${area("Fundamento", `pericul.${i}.fundamento`, { rows: 2, ph: "Item do anexo que enquadra ou exclui a atividade." })}
      <div class="botoes largo"><button class="btn perigo" data-acao="excluirPericul:${i}">Excluir</button></div>`))).join("") || vazio("Nenhuma atividade analisada neste grupo.")}
    <div class="botoes"><button class="btn sec" data-acao="novoPericul:${g.id}">Adicionar atividade</button></div>`).join("")}`;
};

TELAS.ergo = () => {
  if (!P.ghes.length) return `<h1>Ergonomia</h1>${semGhe()}`;
  return `<h1>Avaliação ergonômica preliminar (NR-17)</h1>
  <p class="sub">Classifique cada item observado. Só os itens avaliados entram no laudo, e as recomendações podem ir para o plano de ação.</p>
  ${P.ghes.map((g) => {
    const b = `ergo.${g.id}`;
    const itens = (P.ergo[g.id] || {}).itens || {};
    const feitos = Object.values(itens).filter((x) => x.sit).length;
    return det("e:" + g.id, `<b>${e(g.nome)}</b><small>${feitos} itens avaliados</small>`, `
      ${area("Método e técnicas usadas", `${b}.metodo`, { rows: 2 })}
      ${area("Trabalhadores ouvidos (17.3.8)", `${b}.ouvidos`, { rows: 2 })}
      ${area("Queixas, afastamentos e dados de saúde", `${b}.queixas`, { rows: 2 })}
      ${ERGO_ITENS.map((grupo) => `<h3 class="largo">${grupo.g}</h3>${grupo.itens.map(([k, t, ref]) => {
        const sit = (itens[k] || {}).sit || "";
        return `<div class="item-ergo largo"><p>${e(t)} <small>(${e(ref)})</small></p>
          ${sel("Situação", `${b}.itens.${k}.sit`, ERGO_SIT, { re: 1 })}
          ${sit === "atencao" || sit === "inadequado" ? campo("O que foi observado", `${b}.itens.${k}.obs`) + campo("Recomendação", `${b}.itens.${k}.rec`) : ""}</div>`;
      }).join("")}`).join("")}
      <h3 class="largo">Fechamento</h3>
      ${sel("Precisa de análise ergonômica do trabalho (AET)?", `${b}.aet`, [["", "A definir"], ["nao", "Não"], ["sim", "Sim"]], { re: 1 })}
      ${(P.ergo[g.id] || {}).aet === "sim" ? area("Motivo (alíneas do item 17.3.2)", `${b}.aetMotivo`, { rows: 2 }) : ""}
      ${area("Conclusão do grupo (opcional)", `${b}.conclusao`, { rows: 2 })}`);
  }).join("")}`;
};

TELAS.plano = () => `
  <h1>Plano de ação</h1>
  <p class="sub">Medidas de prevenção com cronograma, responsável e forma de acompanhamento (NR-01, 1.5.5.2).</p>
  <div class="botoes"><button class="btn sec" data-acao="sugerirPlano">Sugerir ações a partir dos riscos altos e da ergonomia</button></div>
  ${P.plano.map((a, i) => det("a:" + a.id, `<b>${e(a.medida || "Ação sem descrição")}</b><small>${e(a.responsavel || "sem responsável")} · ${dataBR(a.prazo)}</small>`, `
    ${area("Medida de prevenção", `plano.${i}.medida`, { rows: 2 })}
    ${sel("Tipo (ordem de prioridade da NR-01)", `plano.${i}.tipo`, [["", "—"], ["eliminacao", "1. Eliminação do fator de risco"], ["epc", "2. Proteção coletiva"], ["adm", "3. Administrativa ou de organização"], ["epi", "4. EPI"]])}
    ${campo("Risco relacionado", `plano.${i}.risco`)}
    ${campo("Responsável", `plano.${i}.responsavel`)}
    ${campo("Prazo", `plano.${i}.prazo`, { type: "date" })}
    ${campo("Acompanhamento e aferição do resultado", `plano.${i}.acompanhamento`, { cls: "largo" })}
    ${sel("Situação", `plano.${i}.status`, [["pendente", "Pendente"], ["andamento", "Em andamento"], ["concluida", "Concluída"]])}
    <div class="botoes largo"><button class="btn perigo" data-acao="excluirAcao:${i}">Excluir ação</button></div>`)).join("") || vazio("Nenhuma ação cadastrada.")}
  <div class="botoes"><button class="btn" data-acao="novaAcao">Adicionar ação</button></div>`;

TELAS.documentos = () => {
  const d = DOCUMENTOS[ui.doc] || DOCUMENTOS.pgr;
  const falta = pendencias(P, ui.doc);
  return `<div class="so-tela">
    <h1>Documentos</h1>
    <div class="abas-doc">${Object.entries(DOCUMENTOS).map(([k, x]) => `<button class="${k === ui.doc ? "ativo" : ""}" data-acao="verDoc:${k}">${x.t}<small>${x.base}</small></button>`).join("")}</div>
    ${falta.length ? `<details class="pendencias" data-det="pend" ${ui.abertos.has("pend") ? "open" : ""}><summary>${falta.length} ${falta.length === 1 ? "pendência" : "pendências"} antes de emitir</summary><ul>${falta.map((f) => `<li>${e(f)}</li>`).join("")}</ul></details>` : `<p class="dica ok">Sem pendências de preenchimento. Revise o conteúdo antes de assinar.</p>`}
    <div class="botoes">
      <button class="btn" data-acao="imprimir">Imprimir ou salvar em PDF</button>
      <button class="btn sec" data-acao="word">Baixar para Word (.doc)</button>
    </div>
  </div>
  <article class="doc" id="documento">${d.gerar(P)}</article>`;
};

TELAS.normas = () => `
  <h1>Premissas normativas</h1>
  <p class="sub">O que cada documento precisa conter e de onde vem a exigência. Confira sempre o texto vigente no portal do Ministério do Trabalho e Emprego e do INSS.</p>
  ${PREMISSAS.map((x) => `<section class="cartao bloco"><h2>${x.doc}</h2><p class="sub">${e(x.base)}</p><ul>${x.pontos.map((t) => `<li>${e(t)}</li>`).join("")}</ul></section>`).join("")}
  <section class="cartao bloco"><h2>Matriz de risco adotada</h2><p class="sub">Severidade × probabilidade, 5 × 5. A NR-01 deixa a escolha da ferramenta com a organização.</p>
    <ul>${NIVEIS.map((n, i) => `<li><span class="nivel n-${n.id}">${n.t}</span> ${i ? NIVEIS[i - 1].max + 1 : 1} a ${n.max}: ${n.acao}</li>`).join("")}</ul></section>`;
