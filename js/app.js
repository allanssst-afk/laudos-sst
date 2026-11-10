// Navegação, eventos e exportação.

const ABAS = [
  ["inicio", "Início"], ["empresa", "Empresa"], ["grupos", "Grupos"], ["riscos", "Riscos"], ["pericul", "Periculosidade"],
  ["ergo", "Ergonomia"], ["plano", "Plano de ação"], ["documentos", "Documentos"], ["normas", "Normas"],
];
const rota = () => {
  const r = location.hash.replace("#/", "");
  return TELAS[r] ? r : "inicio";
};

function render() {
  P = projeto();
  let r = rota();
  if (!P && r !== "inicio" && r !== "normas") r = "inicio";
  document.getElementById("empresa-atual").textContent = P ? P.empresa.razao || "Sem nome" : "";
  document.getElementById("abas").innerHTML = ABAS.filter(([k]) => P || k === "inicio" || k === "normas")
    .map(([k, t]) => `<a href="#/${k}" class="${k === r ? "ativo" : ""}">${t}</a>`).join("");
  document.getElementById("tela").innerHTML = (erroSalvar ? `<p class="aviso">${e(erroSalvar)}</p>` : "") + TELAS[r]();
  document.querySelector("#abas .ativo")?.scrollIntoView({ block: "nearest", inline: "center" });
}

function baixar(nome, conteudo, tipo) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const nomeArquivo = (s) => String(s || "empresa").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// Estilo embutido no arquivo do Word (o Word não lê a folha de estilo do app).
const CSS_WORD = `body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000}
h1{font-size:22pt;text-align:center}h2{font-size:13pt;margin-top:18pt;border-bottom:1px solid #999}h3{font-size:11.5pt;margin-top:12pt}
table{border-collapse:collapse;width:100%;margin:6pt 0}th,td{border:1px solid #777;padding:3pt 5pt;font-size:9.5pt;vertical-align:top;text-align:left}
thead th{background:#e6e6e6}.kv th{width:30%;background:#f1f1f1}small{font-size:8.5pt;color:#444}
.capa{text-align:center;page-break-after:always;padding-top:120pt}.capa-tipo{font-size:12pt;letter-spacing:1pt}.capa-empresa{font-size:16pt;font-weight:bold;margin-top:60pt}
.n-baixo{background:#cfe8d5}.n-medio{background:#f7e7a6}.n-alto{background:#f5c191}.n-critico{background:#eea39a}
.assinaturas div{margin-top:50pt;text-align:center}.assinaturas span{display:block;border-top:1px solid #000;width:260pt;margin:0 auto 4pt}`;

const ACOES = {
  novo() {
    const p = novoProjeto("");
    estado.projetos.push(p); estado.atual = p.id; salvar();
    location.hash = "#/empresa";
  },
  exemplo() {
    const p = projetoExemplo();
    estado.projetos.push(p); estado.atual = p.id; salvar();
    location.hash = "#/documentos"; render();
  },
  abrir(id) { estado.atual = id; salvar(); location.hash = "#/empresa"; render(); },
  duplicar(id) {
    const o = estado.projetos.find((p) => p.id === id);
    const c = JSON.parse(JSON.stringify(o));
    c.id = uid(); c.empresa.razao = (c.empresa.razao || "") + " (cópia)";
    estado.projetos.push(c); salvar(); render();
  },
  excluirProjeto(id) {
    const o = estado.projetos.find((p) => p.id === id);
    if (!confirm(`Excluir "${o.empresa.razao || "Sem nome"}" e todos os seus dados? Não dá para desfazer.`)) return;
    estado.projetos = estado.projetos.filter((p) => p.id !== id);
    if (estado.atual === id) estado.atual = null;
    salvar(); render();
  },
  backup() { baixar(`backup-sst-${hojeISO()}.json`, JSON.stringify(estado, null, 1), "application/json"); },

  novoGhe() {
    const g = { id: uid(), nome: `GHE ${String(P.ghes.length + 1).padStart(2, "0")} – ` };
    P.ghes.push(g); ui.abertos.add("g:" + g.id); salvar(); render();
  },
  excluirGhe(i) {
    const g = P.ghes[i];
    if (!confirm(`Excluir "${g.nome}" com seus riscos, atividades perigosas e avaliação ergonômica?`)) return;
    P.ghes.splice(i, 1);
    P.riscos = P.riscos.filter((r) => r.gheId !== g.id);
    P.pericul = P.pericul.filter((a) => a.gheId !== g.id);
    delete P.ergo[g.id];
    salvar(); render();
  },
  novoRisco(gheId) {
    const r = { id: uid(), gheId, grupo: "fisico", exposicao: "permanente", tipoAval: "qualitativa" };
    P.riscos.push(r); ui.abertos.add("r:" + r.id); salvar(); render();
  },
  excluirRisco(i) { if (confirm("Excluir este risco?")) { P.riscos.splice(i, 1); salvar(); render(); } },
  novoPericul(gheId) {
    const a = { id: uid(), gheId };
    P.pericul.push(a); ui.abertos.add("p:" + a.id); salvar(); render();
  },
  excluirPericul(i) { if (confirm("Excluir esta atividade?")) { P.pericul.splice(i, 1); salvar(); render(); } },
  novaAcao() {
    const a = { id: uid(), status: "pendente" };
    P.plano.push(a); ui.abertos.add("a:" + a.id); salvar(); render();
  },
  excluirAcao(i) { if (confirm("Excluir esta ação?")) { P.plano.splice(i, 1); salvar(); render(); } },
  sugerirPlano() {
    let n = 0;
    const tem = (origem) => P.plano.some((a) => a.origem === origem);
    P.riscos.forEach((r) => {
      const nv = nivelDe(r), g = P.ghes.find((x) => x.id === r.gheId);
      if (!nv || nv.v < 10 || tem("r:" + r.id)) return;
      P.plano.push({ id: uid(), origem: "r:" + r.id, status: "pendente", medida: `Definir e implantar medida de prevenção para: ${r.agente}`,
        risco: `${r.agente} – ${g ? g.nome : ""} (nível ${nv.t.toLowerCase()})`, acompanhamento: "Reavaliar o risco depois da implantação" });
      n++;
    });
    P.ghes.forEach((g) => Object.entries((P.ergo[g.id] || {}).itens || {}).forEach(([k, it]) => {
      if (!(it.rec || "").trim() || tem(`e:${g.id}:${k}`)) return;
      P.plano.push({ id: uid(), origem: `e:${g.id}:${k}`, status: "pendente", medida: it.rec, risco: `Ergonomia – ${g.nome}`, acompanhamento: "Verificação no posto e relato dos trabalhadores" });
      n++;
    }));
    salvar(); render();
    alert(n ? `${n} ${n === 1 ? "ação incluída" : "ações incluídas"}. Complete responsável e prazo.` : "Nenhuma ação nova a sugerir.");
  },

  verDoc(k) { ui.doc = k; render(); },
  imprimir() {
    const antes = document.title;
    document.title = `${DOCUMENTOS[ui.doc].t} - ${P.empresa.razao || "empresa"}`;
    window.print();
    document.title = antes;
  },
  word() {
    const d = DOCUMENTOS[ui.doc];
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${e(d.nome)}</title><style>${CSS_WORD}</style></head><body>${d.gerar(P)}</body></html>`;
    baixar(`${d.t}-${nomeArquivo(P.empresa.razao)}.doc`, "﻿" + html, "application/msword");
  },
};

document.addEventListener("input", (ev) => {
  const el = ev.target.closest("[data-bind]");
  if (!el || !P) return;
  set(P, el.dataset.bind, el.value);
  salvarDepois();
  if (el.dataset.bind === "empresa.razao") document.getElementById("empresa-atual").textContent = el.value;
});

document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset.catalogo !== undefined && el.value !== "") {
    const c = CATALOGO[+el.value], r = P.riscos[+el.dataset.catalogo];
    Object.assign(r, { agente: c.agente, lesoes: c.lesoes || "", tecnica: c.tecnica || "", via: c.via || "", unidade: c.unidade || "", limite: c.limite || "",
      anexo15: c.anexo15 || "", grau: "", tipoAval: c.unidade ? "quantitativa" : "qualitativa" });
    salvar(); render();
  } else if (el.dataset.importar !== undefined && el.files[0]) {
    el.files[0].text().then((t) => {
      const novo = JSON.parse(t);
      if (!novo || !Array.isArray(novo.projetos)) throw new Error("arquivo sem empresas");
      if (estado.projetos.length && !confirm(`Substituir as ${estado.projetos.length} empresas deste aparelho pelas ${novo.projetos.length} do backup?`)) return;
      estado = novo; salvar(); render();
    }).catch((err) => alert("Não foi possível ler o backup: " + err.message));
  } else if (el.dataset.re !== undefined) { salvar(); render(); }
});

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-acao]");
  if (!el) return;
  const [nome, ...args] = el.dataset.acao.split(":");
  if (ACOES[nome]) ACOES[nome](...args);
});

// Lembra quais cartões estão abertos quando a tela é redesenhada.
document.addEventListener("toggle", (ev) => {
  const id = ev.target.dataset && ev.target.dataset.det;
  if (id) ev.target.open ? ui.abertos.add(id) : ui.abertos.delete(id);
}, true);

window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
window.addEventListener("pagehide", salvar);
render();

if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/^(localhost|127\.)/.test(location.hostname)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
