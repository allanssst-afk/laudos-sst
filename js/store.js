// Dados no próprio aparelho (localStorage). Sem servidor e sem login.

const CHAVE = "sstdocs:v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const hojeISO = () => new Date().toISOString().slice(0, 10);

function novoProjeto(nome) {
  return {
    id: uid(),
    empresa: { razao: nome || "Nova empresa" },
    rt: {},
    doc: { dataEmissao: hojeISO(), dataAvaliacao: hojeISO(), tipoLaudo: "coletivo" },
    ghes: [],
    riscos: [],
    pericul: [],
    ergo: {},
    plano: [],
  };
}

let estado = (() => {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE));
    if (bruto && Array.isArray(bruto.projetos)) return bruto;
  } catch {}
  return { projetos: [], atual: null };
})();

const projeto = () => estado.projetos.find((p) => p.id === estado.atual) || null;

let erroSalvar = "";
function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    erroSalvar = "";
  } catch (err) {
    erroSalvar = "Não foi possível salvar neste aparelho (" + err.message + "). Baixe um backup.";
  }
}
let relogio;
function salvarDepois() {
  clearTimeout(relogio);
  relogio = setTimeout(salvar, 300);
}

function get(obj, caminho) {
  const v = caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  return v == null ? "" : v;
}
function set(obj, caminho, valor) {
  const partes = caminho.split(".");
  let o = obj;
  for (let i = 0; i < partes.length - 1; i++) {
    if (o[partes[i]] == null || typeof o[partes[i]] !== "object") o[partes[i]] = {};
    o = o[partes[i]];
  }
  o[partes[partes.length - 1]] = valor;
}

// Empresa fictícia, para ver o app e os documentos preenchidos.
function projetoExemplo() {
  const p = novoProjeto("Metalúrgica Exemplo Ltda. (dados fictícios)");
  Object.assign(p.empresa, {
    fantasia: "Metalúrgica Exemplo", cnpj: "00.000.000/0001-00", cnae: "25.39-0-01 – Serviços de usinagem, tornearia e solda",
    grauRisco: "3", endereco: "Rua das Indústrias, 100 – Distrito Industrial", cidadeUF: "Joinville/SC", nEmpregados: "42",
    representante: "Maria de Souza – Diretora", processo:
      "Fabricação de estruturas metálicas sob encomenda. O processo começa no recebimento e corte de chapas e perfis de aço, segue para a caldeiraria e a solda MIG/MAG, o acabamento com esmerilhadeiras e a pintura, e termina na expedição. A manutenção elétrica e mecânica atende a todo o galpão. O escritório fica em mezanino separado da produção.",
  });
  p.rt = { nome: "Nome do Responsável Técnico", titulo: "Engenheiro de Segurança do Trabalho", registro: "CREA-SC 000000-0", art: "0000000-0" };
  p.doc.instrumentos = "Dosímetro de ruído classe 2, calibrado em campo antes e depois das medições; bomba de amostragem de ar com filtro de membrana; calibrador acústico. Certificados de calibração anexos.";
  const [adm, solda, manut] = [uid(), uid(), uid()];
  p.ghes = [
    { id: adm, nome: "GHE 01 – Administrativo", setor: "Escritório", funcoes: "Auxiliar administrativo, analista financeiro, comprador", nTrab: "8",
      jornada: "44 h semanais, das 8h às 18h, com 1h12 de intervalo", ambiente: "Sala em mezanino de alvenaria, 60 m², piso vinílico, climatizada, iluminação por LED e janelas.",
      atividades: "Rotinas administrativas com uso de computador, atendimento telefônico e arquivo de documentos." },
    { id: solda, nome: "GHE 02 – Caldeiraria e solda", setor: "Produção", funcoes: "Soldador, caldeireiro, ajudante de produção", nTrab: "18",
      jornada: "44 h semanais, das 7h às 17h, com 1h12 de intervalo", ambiente: "Galpão industrial de 1.200 m², pé-direito de 8 m, cobertura metálica, ventilação natural por lanternim e exaustores de parede, piso de concreto.",
      atividades: "Corte, montagem e solda MIG/MAG de estruturas de aço carbono; esmerilhamento e acabamento das peças; movimentação de peças com ponte rolante e manualmente." },
    { id: manut, nome: "GHE 03 – Manutenção elétrica", setor: "Manutenção", funcoes: "Eletricista de manutenção", nTrab: "2",
      jornada: "44 h semanais, das 7h às 17h, com 1h12 de intervalo", ambiente: "Oficina de manutenção de 40 m² e todas as áreas do galpão, inclusive a cabine primária e os painéis de distribuição.",
      atividades: "Manutenção preventiva e corretiva de painéis, motores e instalações elétricas em baixa tensão (até 440 V), com intervenções em circuitos energizados no sistema elétrico de consumo." },
  ];
  const r = (o) => Object.assign({ id: uid(), exposicao: "permanente", tipoAval: "qualitativa", sev: "2", prob: "2" }, o);
  p.riscos = [
    r({ gheId: adm, grupo: "ergonomico", agente: "Postura sentada por longos períodos", fonte: "Trabalho contínuo com computador", lesoes: "Lombalgia, dores cervicais, distúrbios circulatórios",
      tecnica: "Avaliação ergonômica preliminar – NR-17", adm: "Orientação postural na integração", sev: "2", prob: "3" }),
    r({ gheId: solda, grupo: "fisico", agente: "Ruído contínuo ou intermitente", fonte: "Esmerilhadeiras, lixadeiras e impacto de peças metálicas", lesoes: "Perda auditiva induzida por níveis de pressão sonora elevados (PAIR), zumbido",
      via: "Auditiva (via aérea)", tipoAval: "quantitativa", valor: "91,4", unidade: "dB(A)", limite: "85", anexo15: "1",
      tecnica: "Dosimetria de jornada – NHO-01 da Fundacentro (NEN) e Anexo 1 da NR-15", epi: "Protetor auditivo tipo concha, NRRsf 21 dB", ca: "00000", epiEficaz: "sim",
      adm: "PCA com audiometrias periódicas e treinamento de uso do protetor", sev: "4", prob: "3" }),
    r({ gheId: solda, grupo: "quimico", agente: "Fumos metálicos de solda (manganês e seus compostos)", fonte: "Solda MIG/MAG em aço carbono", lesoes: "Manganismo, irritação das vias respiratórias, febre dos fumos metálicos",
      via: "Respiratória", tipoAval: "quantitativa", valor: "0,32", unidade: "mg/m³", limite: "1", anexo15: "12",
      tecnica: "Amostragem de ar na zona respiratória com filtro de membrana; Anexo 12 da NR-15", epc: "Exaustores de parede", epi: "Respirador PFF2", ca: "00000", epiEficaz: "sim", sev: "3", prob: "2" }),
    r({ gheId: solda, grupo: "fisico", agente: "Radiações não ionizantes (ultravioleta de solda, micro-ondas, laser)", fonte: "Arco elétrico da solda", lesoes: "Queimaduras de pele, ceratoconjuntivite",
      via: "Pele e olhos", anexo15: "7", tecnica: "Inspeção no local de trabalho – Anexo 7 da NR-15", epc: "Biombos entre os postos de solda",
      epi: "Máscara de solda com escurecimento automático, avental, mangote e luvas de raspa", ca: "00000", epiEficaz: "sim", insal: "neutralizada", especial: "nao", sev: "3", prob: "2" }),
    r({ gheId: solda, grupo: "ergonomico", agente: "Levantamento e transporte manual de cargas", fonte: "Posicionamento manual de peças de até 25 kg nas bancadas", lesoes: "Lombalgia, hérnia de disco, distensões musculares",
      tecnica: "Avaliação ergonômica preliminar – NR-17, item 17.5", epc: "Ponte rolante de 2 t para peças maiores", sev: "3", prob: "4" }),
    r({ gheId: solda, grupo: "acidente", agente: "Partes móveis de máquinas e equipamentos", fonte: "Esmerilhadeiras angulares e serra de fita", lesoes: "Cortes, projeção de partículas nos olhos, amputações",
      tecnica: "Apreciação de riscos de máquinas – NR-12", epc: "Coifas de proteção nas esmerilhadeiras", epi: "Óculos de segurança, protetor facial, luvas", ca: "00000", sev: "4", prob: "2" }),
    r({ gheId: manut, grupo: "acidente", agente: "Choque elétrico e arco elétrico", fonte: "Painéis e circuitos energizados até 440 V", lesoes: "Queimaduras, parada cardiorrespiratória, morte",
      exposicao: "intermitente", tecnica: "Análise de risco e prontuário das instalações – NR-10", adm: "Treinamento NR-10 básico em dia; procedimento de bloqueio e etiquetagem",
      epi: "Luvas isolantes classe 0, vestimenta contra arco elétrico, calçado isolante", ca: "00000", sev: "5", prob: "2" }),
  ];
  p.pericul = [
    { id: uid(), gheId: manut, anexo: "4", atividade: "Manutenção corretiva e medições em painéis e circuitos energizados de baixa tensão no sistema elétrico de consumo, sem possibilidade de desenergização em parte das intervenções.",
      area: "Painéis de distribuição, cabine primária e quadros de comando das máquinas", permanencia: "intermitente", enquadra: "sim",
      fundamento: "Atividade com instalações energizadas em baixa tensão no sistema elétrico de consumo, em desacordo com as condições de exclusão do Anexo 4 da NR-16." },
  ];
  p.ergo[adm] = { metodo: "Observação dos postos, entrevista com os trabalhadores e lista de verificação da NR-17.", ouvidos: "5 trabalhadores entrevistados em 03/11/2026.",
    queixas: "Dois relatos de dor lombar no fim da jornada.", aet: "nao",
    itens: { ritmo: { sit: "ok" }, pausas: { sit: "atencao", obs: "Sem pausas formais além do almoço.", rec: "Instituir micropausas de 5 minutos a cada hora de digitação." },
      conteudo: { sit: "ok" }, psico: { sit: "ok" }, plano: { sit: "ok" }, assento: { sit: "inadequado", obs: "Três cadeiras sem regulagem de altura e sem apoio lombar.", rec: "Substituir as cadeiras por modelos com regulagem de altura e encosto lombar (17.6.6)." },
      telas: { sit: "atencao", obs: "Notebooks usados sem suporte.", rec: "Fornecer suporte, teclado e mouse externos." }, iluminacao: { sit: "ok" }, ruido: { sit: "ok" }, temperatura: { sit: "ok" },
      carga: { sit: "na" }, alcance: { sit: "na" }, meios: { sit: "na" } } };
  p.ergo[solda] = { metodo: "Observação da atividade em dois turnos, entrevista com os trabalhadores e lista de verificação da NR-17.", ouvidos: "8 trabalhadores entrevistados em 04/11/2026.",
    queixas: "Queixas de dor lombar ao posicionar peças nas bancadas.", aet: "sim", aetMotivo: "Manuseio frequente de peças de até 25 kg com flexão de tronco; a avaliação preliminar não basta para definir as medidas (17.3.2, alínea a).",
    itens: { carga: { sit: "inadequado", obs: "Peças de até 25 kg erguidas do piso à bancada, cerca de 40 vezes por turno.", rec: "Instalar mesas elevatórias e talhas nos postos de solda." },
      alcance: { sit: "atencao", obs: "Peças depositadas no piso.", rec: "Usar paletes elevados para o estoque intermediário." }, meios: { sit: "atencao", obs: "Ponte rolante disputada entre os postos." },
      pausas: { sit: "ok" }, ritmo: { sit: "ok" }, alternancia: { sit: "ok" }, ferramentas: { sit: "ok" }, iluminacao: { sit: "ok" }, temperatura: { sit: "na" } } };
  p.plano = [
    { id: uid(), medida: "Enclausurar o posto de esmerilhamento com painéis acústicos e trocar os discos por modelos de baixo ruído", tipo: "epc", risco: "Ruído – GHE 02", responsavel: "Gerente de produção", prazo: "2027-02-28",
      acompanhamento: "Nova dosimetria depois da instalação", status: "andamento" },
    { id: uid(), medida: "Substituir as cadeiras sem regulagem do escritório", tipo: "epc", risco: "Postura sentada – GHE 01", responsavel: "Compras", prazo: "2026-12-20", acompanhamento: "Verificação no posto e relato dos trabalhadores", status: "pendente" },
  ];
  return p;
}
