import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { GenerateAnalysisDto } from './dto/generate-analysis.dto';

interface GroqChatCompletionResponse {
  choices: { message: { content: string } }[];
}

export interface DashboardAnalysisResult {
  culture_summary: string;
  leadership_focus: string[];
  strategic_advice: string;
  potential_risks: string;
  growth_opportunities: string;
  attention_needed: string[];
}

export interface DashboardScope {
  /** Descreve para quem a análise é escrita, ex: "a equipe do departamento Vendas" ou "toda a organização". */
  label: string;
}

const MIN_USERS_FOR_CULTURE_ANALYSIS = 3;
const COLLABORATOR_BRIEF_LIMIT = 40;
const DISC_TYPES = ['D', 'I', 'S', 'C'] as const;

export interface CollaboratorAnalysisResult {
  headline: string;
  description: string;
  strengths: string[];
  challenges: string[];
  management_tips: string[];
  ideal_roles: string;
  combo_insight: string;
}

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

  async generateDashboardAnalysis(
    users: User[],
    scope: DashboardScope = { label: 'toda a organização' },
  ) {
    const totalUsers = users.length;
    if (totalUsers === 0)
      return {
        totalUsers: 0,
        sectorDistribution: {},
        discDistribution: [],
        sectorData: [],
        analysis: null,
      };

    const sectorDistribution: Record<string, number> = {};
    const departmentBreakdown: Record<
      string,
      Record<(typeof DISC_TYPES)[number], number>
    > = {};
    users.forEach((user) => {
      const sectorName = user.department?.name ?? 'Sem departamento';
      sectorDistribution[sectorName] =
        (sectorDistribution[sectorName] || 0) + 1;

      if (!departmentBreakdown[sectorName]) {
        departmentBreakdown[sectorName] = { D: 0, I: 0, S: 0, C: 0 };
      }
      if (
        user.primaryType &&
        (DISC_TYPES as readonly string[]).includes(user.primaryType)
      ) {
        departmentBreakdown[sectorName][
          user.primaryType as (typeof DISC_TYPES)[number]
        ] += 1;
      }
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

    const sectorData = Object.entries(sectorDistribution).map(
      ([name, value]) => ({ name, value }),
    );

    // Amostra pequena demais para qualquer leitura estatística confiável de "cultura" —
    // evita gastar a chamada de IA gerando uma narrativa fabricada a partir de 1-2 pessoas.
    if (totalUsers < MIN_USERS_FOR_CULTURE_ANALYSIS) {
      return {
        totalUsers,
        sectorDistribution,
        discDistribution,
        sectorData,
        analysis: {
          culture_summary: `Apenas ${totalUsers} colaborador(es) mapeado(s) neste escopo. Uma amostra tão pequena não permite conclusões estatísticas confiáveis sobre cultura — os percentuais abaixo refletem indivíduos, não um padrão de equipe.`,
          leadership_focus: [
            'Incentive mais colaboradores deste escopo a concluir o questionário DISC antes de agir sobre estes dados.',
          ],
          strategic_advice:
            'Trate os resultados individuais (aba de colaboradores) como referência para conversas 1:1, não como diagnóstico de cultura ainda.',
          potential_risks:
            'Nenhum risco de cultura pode ser inferido com confiança a partir de uma amostra tão pequena.',
          growth_opportunities:
            'Aumentar a taxa de resposta ao questionário é o próximo passo para desbloquear uma análise de cultura real.',
          attention_needed: [],
        },
      };
    }

    const dominantProfile = Object.entries(discCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const collaboratorsWithProfile = users.filter((u) => u.primaryType);
    const collaboratorsBrief = collaboratorsWithProfile
      .slice(0, COLLABORATOR_BRIEF_LIMIT)
      .map(
        (u) =>
          `- ${u.nomeCompleto} (${u.department?.name ?? 'Sem departamento'}): perfil ${u.primaryType}${u.secondaryType ? '+' + u.secondaryType : ''}`,
      )
      .join('\n');
    const truncatedNotice =
      collaboratorsWithProfile.length > COLLABORATOR_BRIEF_LIMIT
        ? `\n(lista truncada — mostrando ${COLLABORATOR_BRIEF_LIMIT} de ${collaboratorsWithProfile.length} colaboradores com perfil mapeado)`
        : '';

    const prompt = `
## DADOS DA EQUIPE (${totalUsers} colaboradores mapeados)

Distribuição DISC:
- D (Executor): ${discCounts.D} pessoas (${Math.round((discCounts.D / totalUsers) * 100)}%)
- I (Comunicador): ${discCounts.I} pessoas (${Math.round((discCounts.I / totalUsers) * 100)}%)
- S (Planejador): ${discCounts.S} pessoas (${Math.round((discCounts.S / totalUsers) * 100)}%)
- C (Analista): ${discCounts.C} pessoas (${Math.round((discCounts.C / totalUsers) * 100)}%)

Perfil dominante da equipe: ${dominantProfile}

## DISTRIBUIÇÃO POR DEPARTAMENTO (contagem de perfil primário por área)
${JSON.stringify(departmentBreakdown, null, 2)}

## COLABORADORES MAPEADOS (nome, departamento e perfil primário+secundário)
${collaboratorsBrief || '(nenhum colaborador com perfil concluído ainda)'}${truncatedNotice}

## SUA TAREFA
Você é um consultor sênior de cultura organizacional contratado por esta empresa.
Com base nos dados acima, produza uma análise estratégica REAL e ESPECÍFICA.
NÃO produza análises genéricas que servem para qualquer empresa.
Cada insight deve ser diretamente derivável dos números, departamentos e nomes acima.

Regras:
- "culture_summary": cite os percentuais reais na análise
- "leadership_focus": 3 ações concretas baseadas no perfil dominante ${dominantProfile}
- "potential_risks": identifique o gap mais perigoso entre os perfis (ex: poucos C = risco de qualidade), citando o departamento afetado quando a distribuição por departamento tornar isso possível
- "growth_opportunities": baseado no perfil MENOS representado na equipe
- "attention_needed": liste de 0 a 4 alertas ESPECÍFICOS e ACIONÁVEIS citando departamento(s) ou colaborador(es) reais (pelos nomes fornecidos) que merecem atenção prioritária da liderança — ex: um departamento sem nenhum perfil C, ou um colaborador com perfil oposto ao resto do time em que atua. Nunca invente nomes fora da lista fornecida. Se nada crítico se destacar, retorne uma lista vazia.

## FORMATO DE SAÍDA (JSON)
{
  "culture_summary": "",
  "leadership_focus": ["", "", ""],
  "strategic_advice": "",
  "potential_risks": "",
  "growth_opportunities": "",
  "attention_needed": []
}`;

    try {
      const response = await axios.post<GroqChatCompletionResponse>(
        this.groqUrl,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Você é Dr. Marcus Viana, consultor sênior de cultura organizacional com especialização em times de alta performance e modelo DISC. Você escreve para o(a) líder responsável por ${scope.label} — adapte o tom e o escopo das recomendações a essa audiência (um Líder de uma única equipe recebe conselhos táticos e imediatos; alguém responsável por toda a organização recebe uma leitura mais estratégica entre departamentos). Sua linguagem é executiva: objetiva, orientada a dados e sem rodeios. NUNCA produza análises genéricas que servem para qualquer empresa. NUNCA use linguagem acadêmica ou corporativa vaga como "alavancar sinergias". Cada frase deve ser diretamente derivável dos números, departamentos e nomes fornecidos — prefira citar um departamento ou colaborador específico a falar apenas em percentuais agregados.`,
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
        analysis: JSON.parse(
          response.data.choices[0].message.content,
        ) as DashboardAnalysisResult,
      };
    } catch (error) {
      console.error('Erro na análise do dashboard:', error);
      throw new InternalServerErrorException(
        'Falha ao gerar análise do dashboard',
      );
    }
  }

  async generateAnalysis(
    dto: GenerateAnalysisDto,
  ): Promise<CollaboratorAnalysisResult> {
    const { email, scores, answers } = dto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.analiseResult) {
      try {
        return JSON.parse(user.analiseResult) as CollaboratorAnalysisResult;
      } catch {
        // análise salva corrompida — regenera abaixo
      }
    }

    const scoreMap = scores as unknown as Record<string, number>;
    const total = Object.values(scoreMap).reduce((a, b) => a + b, 0);

    if (total === 0) {
      throw new BadRequestException(
        'Scores inválidos — total não pode ser zero',
      );
    }

    const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
    const [primary, secondary] = sorted;

    const DISC_NAMES: Record<string, string> = {
      D: 'Executor',
      I: 'Comunicador',
      S: 'Planejador',
      C: 'Analista',
    };

    const departmentLine = user.department?.name
      ? `- Departamento: ${user.department.name}\n`
      : '';

    const prompt = `
## DADOS DO COLABORADOR
${departmentLine}- Perfil primário: ${primary[0]} — ${DISC_NAMES[primary[0]]} (${Math.round((scoreMap[primary[0]] / total) * 100)}%)
- Perfil secundário: ${secondary[0]} — ${DISC_NAMES[secondary[0]]} (${Math.round((scoreMap[secondary[0]] / total) * 100)}%)
- Scores completos: D=${scoreMap.D} | I=${scoreMap.I} | S=${scoreMap.S} | C=${scoreMap.C}

## RESPOSTAS DO QUESTIONÁRIO
${answers.map((a, i) => `${i + 1}. ${a.q}\n   ➜ "${a.a}"`).join('\n')}

## SUA TAREFA
Com base EXCLUSIVAMENTE nos dados acima, gere uma análise comportamental
no formato JSON abaixo, escrita para o Líder/Gestor direto deste colaborador
usar em conversas 1:1 e decisões de gestão do dia a dia. Cada campo deve ser
único, específico e não repetir informações dos outros campos.

Regras obrigatórias:
- "headline": máximo 8 palavras, deve capturar a TENSÃO entre ${primary[0]} e ${secondary[0]}
- "strengths": liste apenas pontos verificáveis pelas respostas acima, não genéricos
- "challenges": seja honesto sobre os riscos reais deste perfil, sem suavizar
- "management_tips": verbos de ação concretos que o gestor direto pode aplicar já na próxima semana (ex: "Dê prazos curtos", não "Considere dar..."); adapte à rotina do departamento informado quando isso fizer diferença prática
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
      const response = await axios.post<GroqChatCompletionResponse>(
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

      const result = JSON.parse(
        response.data.choices[0].message.content,
      ) as CollaboratorAnalysisResult;

      await this.usersService.updateAnalysis(
        user.id,
        result,
        scores,
        primary[0],
        secondary[0],
      );

      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        'Erro na chamada ao Groq:',
        axiosError.response?.data || axiosError.message,
      );
      throw new InternalServerErrorException('Falha ao gerar análise');
    }
  }
}
