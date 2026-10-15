type SeedService = {
  id: string;
  name: string;
  minutes: number;
  price: number;
  kind?: "individual" | "collective";
  modality?: "online" | "in_person";
  capacity?: number;
  step?: number;
  bufferBefore?: number;
  bufferAfter?: number;
  professionals?: string[];
};
type SeedBusiness = {
  slug: string;
  name: string;
  category: string;
  city: string;
  initials: string;
  color: string;
  tag: string;
  description: string;
  services: SeedService[];
  professionals: string[];
  online: boolean;
  approvalMode?: "automatic" | "manual";
  future?: boolean;
};
export const businesses: SeedBusiness[] = [
  {
    slug: "studio-aurora",
    name: "Studio Aurora",
    category: "Beleza",
    city: "São Paulo, SP",
    initials: "au",
    color: "#eadfd7",
    tag: "Salão de beleza",
    description:
      "Um tempo para você. Beleza, cuidado e boas conversas em um espaço feito para desacelerar.",
    services: [
      { id: "corte", name: "Corte e finalização", minutes: 60, price: 9000 },
      { id: "escova", name: "Escova", minutes: 45, price: 6000 },
      {
        id: "manicure",
        name: "Manicure e pedicure",
        minutes: 75,
        price: 8500,
        step: 15,
        professionals: ["Fernanda Melo"],
        bufferAfter: 15,
      },
      {
        id: "avaliacao",
        name: "Avaliação de coloração",
        minutes: 20,
        price: 0,
        step: 15,
        professionals: ["Marina Costa"],
      },
    ],
    professionals: ["Marina Costa", "Julia Almeida", "Fernanda Melo"],
    online: false,
  },
  {
    slug: "barbearia-essencia",
    name: "Barbearia Essência",
    category: "Barbearia",
    city: "Campinas, SP",
    initials: "es",
    color: "#dce7da",
    tag: "Barbearia",
    description:
      "Seu estilo encontra o seu momento. Cortes e cuidados com atenção em cada detalhe.",
    services: [
      { id: "corte", name: "Corte de cabelo", minutes: 30, price: 5000 },
      { id: "barba", name: "Barba e acabamento", minutes: 30, price: 3500 },
      {
        id: "combo",
        name: "Corte + barba",
        minutes: 60,
        price: 8000,
        bufferAfter: 10,
      },
    ],
    professionals: ["Lucas Santos", "Pedro Lima"],
    online: false,
  },
  {
    slug: "movimento-yoga",
    name: "Movimento Yoga",
    category: "Bem-estar",
    city: "Online",
    initials: "mo",
    color: "#e5dff0",
    tag: "Yoga e bem-estar",
    description:
      "Respire, encontre seu equilíbrio e movimente-se no seu ritmo.",
    services: [
      {
        id: "yoga",
        name: "Yoga em grupo",
        minutes: 60,
        price: 0,
        kind: "collective",
        capacity: 10,
      },
      {
        id: "individual",
        name: "Yoga individual online",
        minutes: 45,
        price: 10000,
        kind: "individual",
        step: 15,
      },
      {
        id: "respiracao",
        name: "Respiração e meditação",
        minutes: 30,
        price: 2500,
        kind: "collective",
        capacity: 20,
      },
    ],
    professionals: ["Beatriz Oliveira"],
    online: true,
  },
  {
    slug: "clinica-viva",
    name: "Clínica Viva",
    category: "Saúde",
    city: "São Paulo, SP",
    initials: "vi",
    color: "#dbe9e9",
    tag: "Saúde e cuidado",
    description: "Cuidado próximo e atenção de verdade para o seu bem-estar.",
    services: [
      { id: "limpeza", name: "Limpeza nos dentes", minutes: 60, price: 12000 },
      {
        id: "avaliacao",
        name: "Avaliação odontológica",
        minutes: 30,
        price: 0,
        professionals: ["Dr. Rafael Torres"],
      },
      {
        id: "nutricao",
        name: "Consulta nutricional",
        minutes: 60,
        price: 18000,
        professionals: ["Camila Rocha"],
        modality: "online",
      },
      {
        id: "fisio",
        name: "Sessão de fisioterapia",
        minutes: 50,
        price: 15000,
        step: 15,
        bufferAfter: 10,
        professionals: ["André Martins"],
      },
    ],
    professionals: [
      "Dra. Ana Ribeiro",
      "Dr. Rafael Torres",
      "Camila Rocha",
      "André Martins",
    ],
    online: false,
    approvalMode: "manual",
  },
  {
    slug: "atelier-linha-fina",
    name: "Ateliê Linha Fina",
    category: "Outro",
    city: "Curitiba, PR",
    initials: "lf",
    color: "#ecdfe5",
    tag: "Tatuagem",
    description:
      "Projetos autorais e histórias que ficam na pele. Atendimento com tempo para cada detalhe.",
    professionals: ["Isabela Nunes"],
    online: false,
    approvalMode: "manual",
    future: true,
    services: [
      {
        id: "conversa",
        name: "Conversa sobre seu projeto",
        minutes: 30,
        price: 0,
        modality: "online",
        kind: "individual",
      },
      {
        id: "fine-line",
        name: "Tatuagem fine line",
        minutes: 120,
        price: 35000,
        bufferBefore: 15,
        bufferAfter: 30,
        step: 60,
      },
      {
        id: "autoral",
        name: "Sessão de tatuagem autoral",
        minutes: 240,
        price: 85000,
        bufferBefore: 30,
        bufferAfter: 30,
        step: 60,
      },
    ],
  },
  {
    slug: "casa-do-movimento",
    name: "Casa do Movimento",
    category: "Bem-estar",
    city: "Belo Horizonte, MG",
    initials: "cm",
    color: "#e2e8d3",
    tag: "Movimento e bem-estar",
    description:
      "Pilates, dança e movimento para todos os ritmos. Turmas pequenas e atenção individual.",
    professionals: [
      "Luiza Campos",
      "Gabriel Souza",
      "Renata Dias",
      "Bruno Freitas",
      "Paula Azevedo",
    ],
    online: false,
    services: [
      {
        id: "pilates",
        name: "Pilates em dupla",
        minutes: 50,
        price: 7000,
        kind: "collective",
        capacity: 2,
        professionals: ["Luiza Campos"],
      },
      {
        id: "danca",
        name: "Dança em grupo",
        minutes: 60,
        price: 3500,
        kind: "collective",
        capacity: 12,
        professionals: ["Gabriel Souza"],
      },
      {
        id: "alongamento",
        name: "Alongamento ao ar livre",
        minutes: 45,
        price: 0,
        kind: "collective",
        capacity: 15,
        professionals: ["Renata Dias"],
      },
      {
        id: "funcional",
        name: "Treino funcional individual",
        minutes: 60,
        price: 9000,
        professionals: ["Bruno Freitas"],
      },
      {
        id: "mobilidade",
        name: "Avaliação de mobilidade",
        minutes: 30,
        price: 6000,
        professionals: ["Paula Azevedo"],
        step: 15,
      },
    ],
  },
  {
    slug: "conecta-idiomas",
    name: "Conecta Idiomas",
    category: "Educação",
    city: "Online",
    initials: "ci",
    color: "#dce5f5",
    tag: "Aulas de idiomas",
    description:
      "Aprenda com aulas que combinam com você. Conversação, reforço e turmas online.",
    professionals: ["Carolina Mendes", "Diego Ramos"],
    online: true,
    services: [
      {
        id: "ingles",
        name: "Inglês individual",
        minutes: 60,
        price: 8500,
        kind: "individual",
        professionals: ["Carolina Mendes"],
      },
      {
        id: "espanhol",
        name: "Espanhol individual",
        minutes: 45,
        price: 7500,
        kind: "individual",
        professionals: ["Diego Ramos"],
        step: 15,
      },
      {
        id: "conversacao",
        name: "Clube de conversação em inglês",
        minutes: 60,
        price: 3000,
        kind: "collective",
        capacity: 8,
        professionals: ["Carolina Mendes"],
      },
      {
        id: "nivelamento",
        name: "Teste de nivelamento",
        minutes: 20,
        price: 0,
        kind: "individual",
        step: 15,
      },
    ],
  },
  {
    slug: "norte-consultoria",
    name: "Norte Consultoria",
    category: "Consultoria",
    city: "Porto Alegre, RS",
    initials: "nc",
    color: "#e5e0d8",
    tag: "Consultoria para negócios",
    description:
      "Clareza para os próximos passos do seu negócio. Conversas práticas, online ou presenciais.",
    professionals: ["Eduardo Pires"],
    online: false,
    approvalMode: "manual",
    services: [
      {
        id: "diagnostico",
        name: "Diagnóstico inicial",
        minutes: 30,
        price: 0,
        modality: "online",
        kind: "individual",
      },
      {
        id: "estrategia",
        name: "Consultoria de estratégia",
        minutes: 90,
        price: 25000,
        modality: "online",
        kind: "individual",
        step: 30,
        bufferAfter: 15,
      },
      {
        id: "presencial",
        name: "Planejamento presencial",
        minutes: 120,
        price: 40000,
        kind: "individual",
        step: 60,
      },
      {
        id: "oficina",
        name: "Oficina para microempreendedores",
        minutes: 60,
        price: 5000,
        kind: "collective",
        capacity: 6,
      },
    ],
  },
];
export const money = (cents: number) =>
  cents === 0
    ? "Gratuito"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cents / 100);
