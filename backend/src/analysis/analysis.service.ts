import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AnalysisService {
  private readonly groqApiKey: string;
  private readonly groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('GROQ_API_KEY');
    if (!key) {
      throw new Error('GROQ_API_KEY não configurada no .env');
    }
    this.groqApiKey = key;
  }

  async generateDashboardAnalysis(users: any[]) {
    const totalUsers = users.length;
    if (totalUsers === 0) return { stats: {}, analysis: null };

    // Contagem de perfis dominantes
    const profileCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const sectorDistribution: Record<string, number> = {};

    users.forEach((user) => {
      if (user.analiseResult) {
        try {
          // O analiseResult é salvo como string JSON
          const res = JSON.parse(user.analiseResult);
          // O perfil dominante é o primeiro mencionado na descrição ou deduzido dos scores (aqui vamos simplificar pegando o perfil primário do headline se possível, ou melhor, passaríamos os scores salvos)
          // Como salvamos apenas o resultado da análise, vamos pedir para a IA analisar a cultura baseada no volume de usuários.
        } catch (e) {}
      }
      sectorDistribution[user.setor] = (sectorDistribution[user.setor] || 0) + 1;
    });

    const prompt = `Você é um consultor sênior de Cultura Organizacional e Liderança.
Dados da Empresa:
- Total de Colaboradores Mapeados: ${totalUsers}
- Distribuição por Setores: ${JSON.stringify(sectorDistribution)}

Tarefa: Gere uma análise estratégica para a Liderança sobre o clima e a cultura organizacional baseada no modelo DISC. Como não temos os scores individuais de todos aqui, foque em como gerir uma equipe de ${totalUsers} pessoas distribuídas nestes setores.

Gere um relatório em JSON com esta estrutura:
{
  "culture_summary": "resumo de 2-3 frases sobre a força de trabalho atual",
  "leadership_focus": ["ponto 1 de foco para líderes", "ponto 2", "ponto 3"],
  "strategic_advice": "conselho de alto nível sobre como otimizar a performance desta equipe",
  "potential_risks": "riscos culturais ou operacionais baseados na estrutura atual",
  "growth_opportunities": "onde a empresa pode evoluir em termos de capital humano"
}`;

    try {
      const response = await axios.post(
        this.groqUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Você é um consultor estratégico de RH e Liderança.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.groqApiKey}`,
          },
        },
      );

      return {
        totalUsers,
        sectorDistribution,
        analysis: JSON.parse(response.data.choices[0].message.content),
      };
    } catch (error) {
      console.error('Erro na análise do dashboard:', error);
      throw new Error('Falha ao gerar análise do dashboard');
    }
  }

  async generateAnalysis(scores: any, answers: any[]) {
    const scoreValues: number[] = Object.values(scores);
    const total: number = scoreValues.reduce(
      (a: number, b: number) => a + b,
      0,
    );

    const sorted = Object.entries(scores).sort((a: any, b: any) => b[1] - a[1]);
    const [primary, secondary] = sorted;

    const DISC_NAMES: Record<string, string> = {
      D: 'Executor',
      I: 'Comunicador',
      S: 'Planejador',
      C: 'Analista',
    };

    const answersText = answers
      .map((a, i) => `${i + 1}. ${a.q}\n   Resposta: "${a.a}" [${a.type}]`)
      .join('\n');

    const prompt = `Você é um especialista em comportamento humano e análise DISC, baseado na teoria original de William Moulton Marston (1928).

O colaborador completou o questionário DISC e os resultados foram:
- D (Dominância / Executor): ${scores.D} ponto(s) — ${Math.round((scores.D / total) * 100)}%
- I (Influência / Comunicador): ${scores.I} ponto(s) — ${Math.round((scores.I / total) * 100)}%
- S (Estabilidade / Planejador): ${scores.S} ponto(s) — ${Math.round((scores.S / total) * 100)}%
- C (Conformidade / Analista): ${scores.C} ponto(s) — ${Math.round((scores.C / total) * 100)}%

Perfil primário: ${primary[0]} (${DISC_NAMES[primary[0]]})
Perfil secundário: ${secondary[0]} (${DISC_NAMES[secondary[0]]})

Respostas detalhadas:
${answersText}

Gere um relatório em JSON com exatamente esta estrutura (responda SOMENTE o JSON, sem markdown):
{
  "headline": "frase marcante de 5-8 palavras que captura a essência deste perfil",
  "description": "parágrafo de 3-4 frases descrevendo o perfil combinado ${primary[0]}+${secondary[0]} no contexto profissional. Tom direto, humano e perspicaz.",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3", "ponto forte 4", "ponto forte 5"],
  "challenges": ["desafio 1", "desafio 2", "desafio 3", "desafio 4"],
  "management_tips": ["dica 1 para o gestor", "dica 2", "dica 3", "dica 4"],
  "ideal_roles": "descrição de 2-3 frases sobre os tipos de função e ambiente onde este perfil se destaca",
  "combo_insight": "insight específico sobre a combinação ${primary[0]}+${secondary[0]}: como esses dois traços interagem na prática"
}`;

    try {
      const response = await axios.post(
        this.groqUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise DISC.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.groqApiKey}`,
          },
        },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error: any) {
      console.error(
        'Erro na chamada ao Groq:',
        error.response?.data || error.message,
      );
      throw new Error('Falha ao gerar análise');
    }
  }
}
