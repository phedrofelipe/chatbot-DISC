export interface Option {
  text: string;
  type: 'D' | 'I' | 'S' | 'C';
}

export interface Question {
  text: string;
  opts: Option[];
}

export const questions: Question[] = [
  {
    text: 'Quando recebe uma tarefa nova no trabalho, qual é sua primeira reação?',
    opts: [
      { text: 'Assumo logo e busco resolver do meu jeito, sem esperar direcionamento.', type: 'D' },
      { text: 'Fico animado(a) e comento com a equipe, puxando energia para começar.', type: 'I' },
      {
        text: 'Busco entender bem o processo antes de agir, seguindo o que foi combinado.',
        type: 'S',
      },
      { text: 'Analiso os detalhes, quero ter certeza antes de dar qualquer passo.', type: 'C' },
    ],
  },
  {
    text: 'Como você costuma reagir diante de um conflito com um colega de trabalho?',
    opts: [
      { text: 'Falo direto o que penso e quero resolver rápido — sem rodeios.', type: 'D' },
      { text: 'Tento conversar de forma leve, usar o humor e manter o clima bom.', type: 'I' },
      { text: 'Evito o confronto, prefiro ceder um pouco para manter a paz.', type: 'S' },
      {
        text: 'Avalio a situação com calma, busco entender os dois lados antes de agir.',
        type: 'C',
      },
    ],
  },
  {
    text: 'Qual dessas formas melhor descreve como você trabalha em equipe?',
    opts: [
      { text: 'Gosto de liderar, delegar e manter o grupo focado no resultado.', type: 'D' },
      { text: 'Sou o(a) motivador(a), conecto pessoas e crio um ambiente animado.', type: 'I' },
      { text: 'Sou confiável, consistente e apoio quem precisa sem querer holofotes.', type: 'S' },
      {
        text: 'Prefiro trabalhar com precisão, analiso os dados e entrego algo bem feito.',
        type: 'C',
      },
    ],
  },
  {
    text: 'Diante de um prazo apertado e pressão alta, como você se comporta?',
    opts: [
      {
        text: 'Entro em modo foco total — pressão me dá energia para agir mais rápido.',
        type: 'D',
      },
      {
        text: 'Fico agitado(a), mas contagio a equipe com otimismo para passar juntos.',
        type: 'I',
      },
      { text: 'Me esforço para manter a calma e a rotina, mesmo sob pressão.', type: 'S' },
      { text: 'Organizo tudo em detalhes, faço listas e sigo o plano rigorosamente.', type: 'C' },
    ],
  },
  {
    text: 'O que mais te motiva no ambiente de trabalho?',
    opts: [
      { text: 'Autonomia para decidir e desafios que me façam superar limites.', type: 'D' },
      { text: 'Reconhecimento, interação com pessoas e um clima leve e positivo.', type: 'I' },
      { text: 'Estabilidade, rotina previsível e harmonia com a equipe.', type: 'S' },
      { text: 'Qualidade, precisão e ser reconhecido(a) pela excelência técnica.', type: 'C' },
    ],
  },
  {
    text: 'Como você reage quando comete um erro no trabalho?',
    opts: [
      {
        text: 'Enfrento o erro, assumo a responsabilidade e já penso em como corrigir.',
        type: 'D',
      },
      {
        text: 'Fico constrangido(a), mas costumo deixar pra lá — o importante é seguir.',
        type: 'I',
      },
      {
        text: 'Fico abalado(a) internamente, mas me esforço para não prejudicar a equipe.',
        type: 'S',
      },
      {
        text: 'Analiso o que deu errado com cuidado para não repetir o mesmo problema.',
        type: 'C',
      },
    ],
  },
  {
    text: 'Como você prefere receber feedbacks sobre seu desempenho?',
    opts: [
      { text: 'De forma direta e objetiva — sem rodeios, só os pontos principais.', type: 'D' },
      {
        text: 'Com elogio antes, e os pontos de melhoria de forma leve e motivacional.',
        type: 'I',
      },
      { text: 'Com calma, de maneira gentil e em ambiente privado.', type: 'S' },
      { text: 'Com exemplos concretos, dados e argumentação bem fundamentada.', type: 'C' },
    ],
  },
  {
    text: 'Qual das situações abaixo mais te incomoda no trabalho?',
    opts: [
      { text: 'Ter minha autonomia limitada ou ficar esperando decisões de outros.', type: 'D' },
      { text: 'Trabalhar isolado(a), sem interação e sem espaço para me expressar.', type: 'I' },
      { text: 'Mudanças repentinas e imprevisibilidade constante.', type: 'S' },
      { text: 'Erros por descuido, desorganização ou falta de padrão.', type: 'C' },
    ],
  },
  {
    text: 'Como você costuma tomar decisões importantes?',
    opts: [
      { text: 'Rápido e confiante — confio no meu instinto e assumo os riscos.', type: 'D' },
      {
        text: 'Com base nas pessoas ao redor, consulto quem confio e sigo meu feeling.',
        type: 'I',
      },
      { text: 'Com cautela, prefiro esperar mais informações antes de decidir.', type: 'S' },
      {
        text: 'Analiso todas as opções, pesquiso bastante e só decido com dados sólidos.',
        type: 'C',
      },
    ],
  },
  {
    text: 'Qual frase melhor te define no trabalho?',
    opts: [
      { text: '"Eu assumo, resolvo e entrego — resultados falam mais que palavras."', type: 'D' },
      { text: '"Eu conecto pessoas, crio energia e faço o ambiente ser melhor."', type: 'I' },
      { text: '"Eu sou constante, confiável e estou sempre disponível para ajudar."', type: 'S' },
      { text: '"Eu faço bem-feito, sigo padrões e entrego com qualidade e precisão."', type: 'C' },
    ],
  },
];

export const DISC_NAMES = { D: 'Executor', I: 'Comunicador', S: 'Planejador', C: 'Analista' };
export const DISC_FULL = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
};
