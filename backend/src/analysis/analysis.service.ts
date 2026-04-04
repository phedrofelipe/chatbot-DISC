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

    const sectorDistribution: Record<string, number> = {};
    users.forEach((user) => {
      sectorDistribution[user.setor] = (sectorDistribution[user.setor] || 0) + 1;
    });

    const discCounts = {
      D: users.filter((u) => u.primaryType === 'D').length,
      I: users.filter((u) => u.primaryType === 'I').length,
      S: users.filter((u) => u.primaryType === 'S').length,
      C: users.filter((u) => u.primaryType === 'C').length,
    };

    const discDistribution = [
      { name: 'D - Executor', value: discCounts.D },
      { name: 'I - Comunicador', value: discCounts.I },
      { name: 'S - Planejador', value: discCounts.S },
      { name: 'C - Analista', value: discCounts.C },
    ];

    const dominantProfile = Object.entries(discCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const sectorData = Object.entries(sectorDistribution).map(
      ([name, value]) => ({ name, value }),
    );

    const prompt = `
## DADOS DA EQUIPE (${totalUsers} colaboradores mapeados)

Distribuição DISC:
- D (Executor): ${discCounts.D} pessoas (${Math.round((discCounts.D / totalUsers) * 100)}%)
- I (Comunicador): ${discCounts.I} pessoas (${Math.round((discCounts.I / totalUsers) * 100)}%)
- S (Planejador): ${discCounts.S} pessoas (${Math.round((discCounts.S / totalUsers) * 100)}%)
- C (Analista): ${discCounts.C} pessoas (${Math.round((discCounts.C / totalUsers) * 100)}%)

Perfil dominante da equipe: ${dominantProfile}
Distribuição por setor: ${JSON.stringify(sectorDistribution, null, 2)}

## SUA TAREFA
Você é um consultor sênior de cultura organizacional contratado por esta empresa.
Com base nos dados acima, produza uma análise estratégica REAL e ESPECÍFICA.
NÃO produza análises genéricas que servem para qualquer empresa.
Cada insight deve ser diretamente derivável dos números acima.

Regras:
- "culture_summary": cite os percentuais reais na análise
- "leadership_focus": 3 ações concretas baseadas no perfil dominante ${dominantProfile}
- "potential_risks": identifique o gap mais perigoso entre os perfis (ex: poucos C = risco de qualidade)
- "growth_opportunities": baseado no perfil MENOS representado na equipe

## FORMATO DE SAÍDA (JSON)
{
  "culture_summary": "",
  "leadership_focus": ["", "", ""],
  "strategic_advice": "",
  "potential_risks": "",
  "growth_opportunities": ""
}`;

    try {
      const response = await axios.post(
        this.groqUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é Dr. Marcus Viana, consultor sênior de cultura organizacional com especialização em times de alta performance e modelo DISC. Você escreve exclusivamente para CEOs, diretores e gestores de RH. Sua linguagem é executiva: objetiva, orientada a dados e sem rodeios. NUNCA produza análises genéricas que servem para qualquer empresa. NUNCA use linguagem acadêmica ou corporativa vaga como "alavancar sinergias". Cada frase deve ser diretamente derivável dos números fornecidos.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
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
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.analiseResult) {
      try {
        return JSON.parse(user.analiseResult);
      } catch (e) {
        console.warn('Falha ao parsear analiseResult existente:', e);
      }
    }

    const scoreMap = scores as Record<string, number>;
    const total = Object.values(scoreMap).reduce((a, b) => a + b, 0);

    if (total === 0) {
      throw new Error('Scores inválidos — total não pode ser zero');
    }

    const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
    const [primary, secondary] = sorted;

    const DISC_NAMES: Record<string, string> = {
      D: 'Executor',
      I: 'Comunicador',
      S: 'Planejador',
      C: 'Analista',
    };

    const prompt = `
## DADOS DO COLABORADOR
- Perfil primário: ${primary[0]} — ${DISC_NAMES[primary[0]]} (${Math.round((scoreMap[primary[0]] / total) * 100)}%)
- Perfil secundário: ${secondary[0]} — ${DISC_NAMES[secondary[0]]} (${Math.round((scoreMap[secondary[0]] / total) * 100)}%)
- Scores completos: D=${scoreMap.D} | I=${scoreMap.I} | S=${scoreMap.S} | C=${scoreMap.C}

## RESPOSTAS DO QUESTIONÁRIO
${answers.map((a, i) => `${i + 1}. ${a.q}\n   ➜ "${a.a}"`).join('\n')}

## SUA TAREFA
Com base EXCLUSIVAMENTE nos dados acima, gere uma análise comportamental
no formato JSON abaixo. Cada campo deve ser único, específico e não repetir
informações dos outros campos.

Regras obrigatórias:
- "headline": máximo 8 palavras, deve capturar a TENSÃO entre ${primary[0]} e ${secondary[0]}
- "strengths": liste apenas pontos verificáveis pelas respostas acima, não genéricos
- "challenges": seja honesto sobre os riscos reais deste perfil, sem suavizar
- "management_tips": verbos de ação concretos (ex: "Dê prazos curtos", não "Considere dar...")
- "combo_insight": explique especificamente como ${primary[0]} e ${secondary[0]} se TENSIONAM ou se COMPLEMENTAM

## FORMATO DE SAÍDA (JSON)
{
  "headline": "",
  "description": "",
  "strengths": ["", "", "", "", ""],
  "challenges": ["", "", "", ""],
  "management_tips": ["", "", "", ""],
  "ideal_roles": "",
  "combo_insight": ""
}`;

    try {
      const response = await axios.post(
        this.groqUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é Dra. Ana Rocha, psicóloga organizacional com 15 anos de experiência em assessment comportamental baseado no modelo DISC de William Moulton Marston (1928). Sua comunicação é direta, empática e livre de jargões acadêmicos desnecessários. Você escreve para gestores e profissionais de RH, não para acadêmicos. NUNCA use frases genéricas como "este perfil é único" ou "cada pessoa é diferente". NUNCA repita informações entre campos do JSON. Seja específico, perspicaz e acionável em cada campo.`,
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

      await this.usersService.updateAnalysis(
        user.id,
        result,
        scoreMap,
        primary[0],
        secondary[0],
      );

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
