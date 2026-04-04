import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UsersService } from '../users/users.service';

@Injectable()
export class AnalysisService {
  private readonly groqApiKey: string;
  private readonly groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const key = this.configService.get<string>('GROQ_API_KEY');
    if (!key) {
      throw new Error('GROQ_API_KEY não configurada no .env');
    }
    this.groqApiKey = key;
  }

  async generateDashboardAnalysis(users: any[]) {
    const totalUsers = users.length;
    if (totalUsers === 0) return { stats: {}, analysis: null };

    const profileCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const sectorDistribution: Record<string, number> = {};

    users.forEach((user) => {
      // Tentar deduzir o perfil dominante do analiseResult
      if (user.analiseResult) {
        try {
          const res = JSON.parse(user.analiseResult);
          // O perfil primário costuma estar no "subtitle" ou podemos inferir.
          // Aqui, como salvamos o JSON da IA, vamos procurar a primeira letra DISC no headline ou descrição se possível,
          // mas o ideal seria salvar os scores separadamente.
          // Por agora, vamos apenas contar os setores.
        } catch (e) {}
      }
      sectorDistribution[user.setor] = (sectorDistribution[user.setor] || 0) + 1;
    });

    const discDistribution = [
      { name: 'D - Executor', value: users.filter(u => u.analiseResult?.includes('"headline":"') && (u.analiseResult.includes('Executor') || u.analiseResult.includes('Dominância'))).length },
      { name: 'I - Comunicador', value: users.filter(u => u.analiseResult?.includes('"headline":"') && (u.analiseResult.includes('Comunicador') || u.analiseResult.includes('Influência'))).length },
      { name: 'S - Planejador', value: users.filter(u => u.analiseResult?.includes('"headline":"') && (u.analiseResult.includes('Planejador') || u.analiseResult.includes('Estabilidade'))).length },
      { name: 'C - Analista', value: users.filter(u => u.analiseResult?.includes('"headline":"') && (u.analiseResult.includes('Analista') || u.analiseResult.includes('Conformidade'))).length },
    ];

    const sectorData = Object.entries(sectorDistribution).map(([name, value]) => ({ name, value }));

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
        discDistribution,
        sectorData,
        analysis: JSON.parse(response.data.choices[0].message.content),
      };
    } catch (error) {
      console.error('Erro na análise do dashboard:', error);
      throw new Error('Falha ao gerar análise do dashboard');
    }
  }

  async generateAnalysis(email: string, scores: any, answers: any[]) {
    // 1. Verificação no Backend para evitar re-teste (Item 6)
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.analiseResult) {
      try {
        return JSON.parse(user.analiseResult);
      } catch (e) {
        // Se falhar o parse, continua para gerar nova análise
      }
    }

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

      const result = JSON.parse(response.data.choices[0].message.content);

      // Salva o resultado automaticamente no banco de dados (Item 1 & 6)
      await this.usersService.updateAnalysis(user.id, result);

      return result;
    } catch (error: any) {
      console.error(
        'Erro na chamada ao Groq:',
        error.response?.data || error.message,
      );
      throw new Error('Falha ao gerar análise');
    }
  }
}
