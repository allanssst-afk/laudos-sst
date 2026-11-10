// Base normativa do app: premissas tiradas das NRs e da legislação previdenciária.
// Tudo aqui é apoio à decisão do profissional habilitado; conferir sempre o texto vigente da norma.

const GRUPOS = {
  fisico: "Físico",
  quimico: "Químico",
  biologico: "Biológico",
  ergonomico: "Ergonômico / psicossocial",
  acidente: "Acidente (mecânico)",
};
const AMBIENTAIS = ["fisico", "quimico", "biologico"];

const EXPOSICOES = [
  ["permanente", "Habitual e permanente"],
  ["intermitente", "Habitual e intermitente"],
  ["eventual", "Eventual / ocasional"],
];

// NR-15: anexos, grau de insalubridade e tipo de avaliação.
// grau null = varia conforme o agente (o profissional escolhe).
const ANEXOS15 = {
  "1": { t: "Anexo 1 – Ruído contínuo ou intermitente", grau: "medio", quant: true },
  "2": { t: "Anexo 2 – Ruído de impacto", grau: "medio", quant: true },
  "3": { t: "Anexo 3 – Calor", grau: "medio", quant: true },
  "5": { t: "Anexo 5 – Radiações ionizantes", grau: "maximo", quant: true },
  "6": { t: "Anexo 6 – Condições hiperbáricas", grau: "maximo", quant: false },
  "7": { t: "Anexo 7 – Radiações não ionizantes", grau: "medio", quant: false },
  "8": { t: "Anexo 8 – Vibrações", grau: "medio", quant: true },
  "9": { t: "Anexo 9 – Frio", grau: "medio", quant: false },
  "10": { t: "Anexo 10 – Umidade", grau: "medio", quant: false },
  "11": { t: "Anexo 11 – Agentes químicos com limite de tolerância", grau: null, quant: true },
  "12": { t: "Anexo 12 – Poeiras minerais", grau: "maximo", quant: true },
  "13": { t: "Anexo 13 – Agentes químicos (avaliação qualitativa)", grau: null, quant: false },
  "14": { t: "Anexo 14 – Agentes biológicos", grau: null, quant: false },
};
const GRAUS = {
  minimo: { t: "mínimo", pct: 10 },
  medio: { t: "médio", pct: 20 },
  maximo: { t: "máximo", pct: 40 },
};

// NR-16: atividades e operações perigosas.
const ANEXOS16 = {
  "1": "Anexo 1 – Atividades e operações perigosas com explosivos",
  "2": "Anexo 2 – Atividades e operações perigosas com inflamáveis",
  "3": "Anexo 3 – Exposição a roubos ou outras espécies de violência física (segurança pessoal ou patrimonial)",
  "4": "Anexo 4 – Atividades e operações perigosas com energia elétrica",
  "5": "Anexo 5 – Atividades perigosas em motocicleta",
  "RI": "Anexo (*) – Radiações ionizantes ou substâncias radioativas (Portaria 518/2003)",
};

// Catálogo para preencher um risco com um toque. Limites da NR-15; conferir o texto vigente.
const CATALOGO = [
  { grupo: "fisico", agente: "Ruído contínuo ou intermitente", unidade: "dB(A)", limite: "85", anexo15: "1",
    tecnica: "Dosimetria de jornada – NHO-01 da Fundacentro (NEN) e Anexo 1 da NR-15", via: "Auditiva (via aérea)",
    lesoes: "Perda auditiva induzida por níveis de pressão sonora elevados (PAIR), zumbido, estresse" },
  { grupo: "fisico", agente: "Ruído de impacto", unidade: "dB(C)", limite: "120", anexo15: "2",
    tecnica: "Medição de pico em circuito de resposta rápida, compensação C – Anexo 2 da NR-15 (130 dB em linear)", via: "Auditiva (via aérea)",
    lesoes: "Trauma acústico, perda auditiva" },
  { grupo: "fisico", agente: "Calor", unidade: "°C IBUTG", limite: "", anexo15: "3",
    tecnica: "IBUTG médio ponderado e taxa metabólica – NHO-06 da Fundacentro e Anexo 3 da NR-15 (limite conforme a taxa metabólica)", via: "Corpo inteiro",
    lesoes: "Sobrecarga térmica, desidratação, câimbras, exaustão pelo calor" },
  { grupo: "fisico", agente: "Vibração de mãos e braços (VMB)", unidade: "m/s² (aren)", limite: "5", anexo15: "8",
    tecnica: "Aceleração resultante de exposição normalizada – NHO-10 da Fundacentro e Anexo 8 da NR-15", via: "Mãos e braços",
    lesoes: "Síndrome da vibração de mãos e braços, distúrbios vasculares e osteoarticulares" },
  { grupo: "fisico", agente: "Vibração de corpo inteiro (VCI)", unidade: "m/s² (aren)", limite: "1,1", anexo15: "8",
    tecnica: "aren e VDVR – NHO-09 da Fundacentro e Anexo 8 da NR-15 (aren 1,1 m/s² ou VDVR 21,0 m/s^1,75)", via: "Corpo inteiro",
    lesoes: "Lombalgia, distúrbios da coluna vertebral" },
  { grupo: "fisico", agente: "Radiações não ionizantes (ultravioleta de solda, micro-ondas, laser)", anexo15: "7",
    tecnica: "Inspeção no local de trabalho – Anexo 7 da NR-15", via: "Pele e olhos",
    lesoes: "Queimaduras de pele, ceratoconjuntivite, catarata" },
  { grupo: "fisico", agente: "Radiações ionizantes", unidade: "mSv/ano", limite: "", anexo15: "5",
    tecnica: "Monitoração individual – Norma CNEN NN-3.01 e Anexo 5 da NR-15", via: "Corpo inteiro",
    lesoes: "Efeitos determinísticos e estocásticos (neoplasias)" },
  { grupo: "fisico", agente: "Frio (câmaras frigoríficas ou similares)", anexo15: "9",
    tecnica: "Inspeção no local de trabalho – Anexo 9 da NR-15 e art. 253 da CLT", via: "Corpo inteiro",
    lesoes: "Hipotermia, doenças respiratórias, lesões de pele" },
  { grupo: "fisico", agente: "Umidade (locais alagados ou encharcados)", anexo15: "10",
    tecnica: "Inspeção no local de trabalho – Anexo 10 da NR-15", via: "Pele",
    lesoes: "Dermatoses, doenças respiratórias e reumáticas" },
  { grupo: "quimico", agente: "Agente químico com limite de tolerância (informar a substância)", unidade: "ppm", limite: "", anexo15: "11",
    tecnica: "Amostragem de ar na zona respiratória – métodos NIOSH/OSHA e NHO-08; Anexo 11 da NR-15", via: "Respiratória e cutânea",
    lesoes: "Conforme a ficha de segurança (FDS) da substância" },
  { grupo: "quimico", agente: "Poeira respirável com sílica livre cristalizada", unidade: "mg/m³", limite: "", anexo15: "12",
    tecnica: "Gravimetria de poeira respirável e difração de raios X – NHO-08; limite calculado pelo % de quartzo (Anexo 12 da NR-15)", via: "Respiratória",
    lesoes: "Silicose, doença pulmonar obstrutiva, câncer de pulmão" },
  { grupo: "quimico", agente: "Fumos metálicos de solda (manganês e seus compostos)", unidade: "mg/m³", limite: "1", anexo15: "12",
    tecnica: "Amostragem de ar na zona respiratória com filtro de membrana; Anexo 12 da NR-15", via: "Respiratória",
    lesoes: "Manganismo, irritação das vias respiratórias, febre dos fumos metálicos" },
  { grupo: "quimico", agente: "Hidrocarbonetos e outros compostos de carbono (óleos minerais, graxas, solventes)", anexo15: "13",
    tecnica: "Inspeção no local de trabalho – Anexo 13 da NR-15", via: "Cutânea e respiratória",
    lesoes: "Dermatites, irritação das vias respiratórias, efeitos sistêmicos conforme a substância" },
  { grupo: "biologico", agente: "Agentes biológicos (vírus, bactérias, fungos, parasitas)", anexo15: "14",
    tecnica: "Avaliação qualitativa da atividade – Anexo 14 da NR-15", via: "Contato, respiratória, percutânea",
    lesoes: "Doenças infectocontagiosas" },
  { grupo: "ergonomico", agente: "Postura sentada por longos períodos", lesoes: "Lombalgia, dores cervicais, distúrbios circulatórios",
    tecnica: "Avaliação ergonômica preliminar – NR-17" },
  { grupo: "ergonomico", agente: "Levantamento e transporte manual de cargas", lesoes: "Lombalgia, hérnia de disco, distensões musculares",
    tecnica: "Avaliação ergonômica preliminar – NR-17, item 17.5" },
  { grupo: "ergonomico", agente: "Movimentos repetitivos de membros superiores", lesoes: "Distúrbios osteomusculares relacionados ao trabalho (LER/DORT)",
    tecnica: "Avaliação ergonômica preliminar – NR-17, item 17.4" },
  { grupo: "ergonomico", agente: "Fatores psicossociais: sobrecarga, metas e pressão de tempo", lesoes: "Estresse, ansiedade, esgotamento, transtornos mentais relacionados ao trabalho",
    tecnica: "Avaliação das exigências da atividade e da organização do trabalho – NR-01, item 1.5.3.1.4, e NR-17" },
  { grupo: "acidente", agente: "Queda de altura (trabalho acima de 2 m)", lesoes: "Fraturas, traumatismos, morte", tecnica: "Análise de risco e inspeção – NR-35" },
  { grupo: "acidente", agente: "Choque elétrico e arco elétrico", lesoes: "Queimaduras, parada cardiorrespiratória, morte", tecnica: "Análise de risco e prontuário das instalações – NR-10" },
  { grupo: "acidente", agente: "Partes móveis de máquinas e equipamentos", lesoes: "Cortes, esmagamentos, amputações", tecnica: "Apreciação de riscos de máquinas – NR-12" },
  { grupo: "acidente", agente: "Incêndio e explosão", lesoes: "Queimaduras, intoxicação por fumaça, morte", tecnica: "Inspeção e análise de risco – NR-20 e NR-23" },
  { grupo: "acidente", agente: "Atropelamento e colisão com veículos e empilhadeiras", lesoes: "Contusões, fraturas, morte", tecnica: "Inspeção e análise de risco – NR-11" },
  { grupo: "acidente", agente: "Espaço confinado", lesoes: "Asfixia, intoxicação, morte", tecnica: "Permissão de entrada e trabalho – NR-33" },
];

// Matriz de risco 5 × 5. A NR-01 não impõe uma matriz: a organização escolhe a ferramenta (1.5.4.4.2.1).
const SEVERIDADES = [
  [1, "Leve", "Lesão ou agravo leve, reversível, sem afastamento"],
  [2, "Moderada", "Lesão ou agravo reversível, com afastamento de até 15 dias"],
  [3, "Séria", "Lesão ou agravo com afastamento superior a 15 dias, sem sequela permanente"],
  [4, "Grave", "Lesão ou doença irreversível, incapacidade permanente parcial"],
  [5, "Gravíssima", "Morte ou incapacidade permanente total; pode atingir várias pessoas"],
];
const PROBABILIDADES = [
  [1, "Rara", "Exposição eventual, abaixo do nível de ação; medidas de prevenção eficazes e mantidas"],
  [2, "Pouco provável", "Exposição baixa; medidas existentes e adequadas, com falhas pouco frequentes"],
  [3, "Possível", "Exposição perto do nível de ação ou do limite; medidas com falhas ou que dependem do comportamento"],
  [4, "Provável", "Exposição acima do limite ou frequente; medidas insuficientes"],
  [5, "Muito provável", "Exposição muito acima do limite ou contínua; sem medidas de prevenção"],
];
const NIVEIS = [
  { max: 4, id: "baixo", t: "Baixo", acao: "Manter as medidas existentes e monitorar. Sem ação adicional obrigatória." },
  { max: 9, id: "medio", t: "Médio", acao: "Planejar melhorias; implantar medidas em até 12 meses e acompanhar." },
  { max: 16, id: "alto", t: "Alto", acao: "Implantar medidas de prevenção em até 90 dias; adotar medidas provisórias de imediato." },
  { max: 25, id: "critico", t: "Crítico", acao: "Ação imediata. Interromper a atividade se não houver controle; medidas definitivas com prioridade máxima." },
];

// Avaliação ergonômica preliminar: itens observados, com o item da NR-17 que os fundamenta.
const ERGO_ITENS = [
  { g: "Organização do trabalho (17.4)", itens: [
    ["ritmo", "Ritmo, exigência de tempo e normas de produção compatíveis com a atividade", "17.4.1"],
    ["pausas", "Pausas e alternância de tarefas em atividades com sobrecarga muscular ou repetitividade", "17.4.3 e 17.4.3.1"],
    ["conteudo", "Conteúdo das tarefas e exigência cognitiva (atenção, memória, tomada de decisão)", "17.4.1 e 17.4.2"],
    ["desempenho", "Avaliação de desempenho e metas levam em conta a saúde dos trabalhadores", "17.4.4"],
    ["psico", "Fatores psicossociais: carga de trabalho, autonomia, apoio da chefia, relações e prevenção de assédio", "NR-01, 1.5.3.1.4"],
  ]},
  { g: "Levantamento, transporte e descarga de cargas (17.5)", itens: [
    ["carga", "Peso, frequência e duração do manuseio de cargas compatíveis com a capacidade do trabalhador", "17.5.1 e 17.5.4"],
    ["alcance", "Pega e depósito das cargas sem torção de tronco e com alcance horizontal de até 60 cm", "17.5.2 e 17.5.2.1"],
    ["meios", "Meios técnicos de auxílio (carrinhos, talhas, mesas elevatórias) disponíveis e em uso", "17.5.4"],
  ]},
  { g: "Mobiliário dos postos de trabalho (17.6)", itens: [
    ["alternancia", "Posto permite alternar as posições sentada e em pé, ou há assento para descanso", "17.6.2 e 17.6.7"],
    ["plano", "Bancada ou mesa com altura, área de alcance e espaço para as pernas adequados", "17.6.3"],
    ["assento", "Assento com altura ajustável, borda arredondada e encosto com apoio lombar", "17.6.6"],
    ["pes", "Apoio para os pés quando os pés não alcançam o piso", "17.6.4"],
  ]},
  { g: "Máquinas, equipamentos e ferramentas manuais (17.7)", itens: [
    ["telas", "Telas com ajuste de posição, sem reflexos, e teclado e mouse independentes (inclusive em notebooks)", "17.7.3 e 17.7.3.2"],
    ["comandos", "Comandos e painéis ao alcance, com informação clara para o operador", "17.7.2"],
    ["ferramentas", "Ferramentas manuais adequadas à tarefa, com empunhadura que evite esforço e compressão", "17.7.5 e 17.7.6"],
  ]},
  { g: "Condições de conforto no ambiente (17.8)", itens: [
    ["iluminacao", "Iluminação adequada à tarefa, sem ofuscamento, sombras ou reflexos (níveis da NHO-11)", "17.8.1 a 17.8.3"],
    ["ruido", "Ruído de fundo compatível com a atenção exigida (referência de até 65 dB(A))", "17.8.4.1"],
    ["temperatura", "Temperatura do ar entre 18 e 25 °C em ambientes climatizados, sem correntes de ar sobre as pessoas", "17.8.4.2"],
  ]},
];
const ERGO_SIT = [["", "Não avaliado"], ["ok", "Adequado"], ["atencao", "Requer atenção"], ["inadequado", "Inadequado"], ["na", "Não se aplica"]];

// Premissas mostradas na aba Normas e citadas nos documentos.
const PREMISSAS = [
  { doc: "PGR", base: "NR-01 (redação da Portaria MTE 1.419/2024), itens 1.5.3 a 1.5.8", pontos: [
    "O PGR contém, no mínimo, o inventário de riscos e o plano de ação (1.5.7.1).",
    "Abrange agentes físicos, químicos e biológicos, riscos de acidentes e fatores ergonômicos, incluídos os psicossociais relacionados ao trabalho (1.5.3.1.4).",
    "O inventário traz: processos e ambientes; atividades; perigos com fontes ou circunstâncias; possíveis lesões e agravos; grupos expostos; medidas de prevenção existentes; caracterização da exposição; dados das avaliações ambientais e da ergonomia (NR-17); e a avaliação dos riscos com a classificação (1.5.7.3.2).",
    "Cada risco recebe um nível, pela combinação de severidade e probabilidade (1.5.4.4.2). A norma não impõe uma matriz: a organização escolhe a ferramenta.",
    "O plano de ação define medidas, cronograma, responsáveis e formas de acompanhamento e aferição dos resultados (1.5.5.2). O número de trabalhadores atingidos aumenta a prioridade.",
    "A avaliação de riscos é revista a cada dois anos (três, com sistema de gestão certificado) ou quando houver mudança, acidente, doença, medida ineficaz ou pedido justificado dos trabalhadores ou da CIPA.",
    "Documentos datados e assinados, disponíveis aos trabalhadores, sindicatos e à Inspeção do Trabalho (1.5.7.2). Histórico do inventário guardado por 20 anos (1.5.7.3.3).",
  ]},
  { doc: "LTCAT", base: "Lei 8.213/1991, art. 58; Decreto 3.048/1999, arts. 64 a 68 e Anexo IV; IN PRES/INSS 128/2022, arts. 276 e 277", pontos: [
    "Finalidade previdenciária: comprovar a exposição a agentes prejudiciais à saúde para fins de aposentadoria especial e embasar o PPP.",
    "Elementos básicos (IN 128/2022, art. 276): se individual ou coletivo; identificação da empresa; setor e função; descrição da atividade; agente prejudicial arrolado na legislação previdenciária; localização das possíveis fontes geradoras; via e periodicidade de exposição; metodologia e procedimentos de avaliação; medidas de controle existentes; conclusão; assinatura e identificação do médico do trabalho ou engenheiro de segurança do trabalho; e data da avaliação ambiental.",
    "Emitido por médico do trabalho ou engenheiro de segurança do trabalho (Lei 8.213/1991, art. 58, § 1º).",
    "Ruído: nível de exposição normalizado (NEN) acima de 85 dB(A), pela metodologia da NHO-01 da Fundacentro (Decreto 4.882/2003).",
    "A informação sobre EPC e EPI eficaz consta do laudo. Para ruído acima do limite, a declaração de EPI eficaz não descaracteriza o tempo especial (STF, ARE 664.335, Tema 555).",
    "Outros documentos (PGR, PGRTR, PCMAT, PPRA antigo) podem substituir ou complementar o LTCAT se trouxerem os mesmos elementos (art. 277).",
    "Atualizar sempre que houver mudança no ambiente de trabalho ou na organização: layout, máquinas, tecnologia de proteção, nível de exposição.",
  ]},
  { doc: "Laudo de insalubridade", base: "CLT, arts. 189 a 192 e 195; NR-15 e seus anexos", pontos: [
    "Insalubre é a atividade acima dos limites de tolerância (Anexos 1, 2, 3, 5, 8, 11 e 12), as dos Anexos 6, 13 e 14, e as comprovadas por laudo de inspeção nos Anexos 7, 9 e 10 (15.1).",
    "Adicional sobre o salário mínimo: 40% no grau máximo, 20% no médio e 10% no mínimo (15.2).",
    "Com mais de um fator de insalubridade, vale o de grau mais elevado; não se acumulam (15.3).",
    "A eliminação ou neutralização, por medidas no ambiente ou por EPI, cessa o pagamento do adicional (15.4 e 15.4.1).",
    "Caracterização por perícia de médico do trabalho ou engenheiro de segurança do trabalho (CLT, art. 195).",
    "O laudo fica disponível aos trabalhadores, aos sindicatos e à Inspeção do Trabalho (item 15.4.1.3, incluído pela Portaria MTE 2.021/2025).",
  ]},
  { doc: "Laudo de periculosidade", base: "CLT, arts. 193 a 195; NR-16 e seus anexos", pontos: [
    "São perigosas as atividades e operações dos anexos da NR-16: explosivos, inflamáveis, segurança pessoal ou patrimonial, energia elétrica, motocicleta e radiações ionizantes ou substâncias radioativas.",
    "Adicional de 30% sobre o salário, sem gratificações, prêmios ou participação nos lucros (16.2).",
    "Caracterização por laudo técnico de médico do trabalho ou engenheiro de segurança do trabalho (16.3).",
    "O empregado opta pelo adicional de insalubridade quando também devido (16.2.1; CLT, art. 193, § 2º).",
    "Contato eventual (fortuito) ou por tempo extremamente reduzido não gera o adicional (Súmula 364 do TST).",
    "O laudo fica disponível aos trabalhadores, aos sindicatos e à Inspeção do Trabalho (item 16.3.1, incluído pela Portaria MTE 2.021/2025, que também aprovou novo Anexo 5, de motocicletas). Conferir o texto vigente do anexo.",
  ]},
  { doc: "Laudo ergonômico (AEP)", base: "NR-17 (redação da Portaria MTP 423/2021) e NR-01", pontos: [
    "A organização faz a avaliação ergonômica preliminar (AEP) das situações de trabalho, por abordagem qualitativa, semiquantitativa, quantitativa ou combinada, e a registra (17.3.1).",
    "A análise ergonômica do trabalho (AET) é exigida quando: for preciso aprofundar a avaliação; as ações adotadas forem inadequadas ou insuficientes; o PCMSO sugerir; ou a análise de acidentes e doenças do PGR apontar causa ligada às condições de trabalho (17.3.2).",
    "Etapas da AET: análise da demanda; análise do funcionamento da organização, dos processos e da atividade; métodos e técnicas; diagnóstico; recomendações; e restituição, validação e revisão com os trabalhadores (17.3.3).",
    "Os resultados da AEP entram no inventário de riscos do PGR, e as medidas, no plano de ação (17.3.5 e 17.3.6).",
    "Os trabalhadores são ouvidos na AEP e na AET (17.3.8). O relatório da AET é guardado por 20 anos (17.3.7).",
    "Conforto: ruído de fundo de até 65 dB(A), temperatura de 18 a 25 °C em ambientes climatizados e iluminação conforme a NHO-11 (17.8).",
  ]},
];
