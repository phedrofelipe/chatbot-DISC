import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { AnalysisService } from './analysis.service';
import { UsersService } from '../users/users.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AnalysisService', () => {
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let configService: any;
  let service: AnalysisService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      updateAnalysis: jest.fn(),
      verifyAccessCode: jest.fn(),
    };
    configService = { get: jest.fn().mockReturnValue('fake-groq-key') };
    service = new AnalysisService(
      configService,
      usersService as unknown as UsersService,
    );
    jest.clearAllMocks();
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(
      service.generateAnalysis({
        email: 'nao-existe@teste.com',
        scores: { D: 1, I: 1, S: 1, C: 1 } as any,
        answers: [],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejeita buscar análise em cache sem accessCode', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      analiseResult: JSON.stringify({ headline: 'Já processado' }),
    });

    await expect(
      service.generateAnalysis({
        email: 'ja-tem@teste.com',
        scores: { D: 5, I: 2, S: 1, C: 2 } as any,
        answers: [],
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('retorna a análise em cache sem chamar a API do Groq quando o accessCode é válido', async () => {
    const cached = { headline: 'Já processado' };
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      analiseResult: JSON.stringify(cached),
    });
    (usersService.verifyAccessCode as jest.Mock).mockResolvedValue({ id: 1 });

    const result = await service.generateAnalysis({
      email: 'ja-tem@teste.com',
      scores: { D: 5, I: 2, S: 1, C: 2 } as any,
      answers: [],
      accessCode: 'ABCD-1234',
    });

    expect(result).toEqual(cached);
    expect(usersService.verifyAccessCode).toHaveBeenCalledWith(
      'ja-tem@teste.com',
      'ABCD-1234',
    );
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('lança BadRequestException quando o total de scores é zero', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      analiseResult: null,
    });
    await expect(
      service.generateAnalysis({
        email: 'zerado@teste.com',
        scores: { D: 0, I: 0, S: 0, C: 0 } as any,
        answers: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('gera e persiste a análise via Groq quando não há cache', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 7,
      analiseResult: null,
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          { message: { content: JSON.stringify({ headline: 'Novo perfil' }) } },
        ],
      },
    } as any);

    const result = await service.generateAnalysis({
      email: 'novo@teste.com',
      scores: { D: 6, I: 2, S: 1, C: 1 } as any,
      answers: [{ q: 'Pergunta 1', a: 'Resposta A', type: 'D' }],
    });

    expect(result).toEqual({ headline: 'Novo perfil' });
    expect(usersService.updateAnalysis).toHaveBeenCalledWith(
      7,
      { headline: 'Novo perfil' },
      { D: 6, I: 2, S: 1, C: 1 },
      'D',
      'I',
    );
  });

  describe('generateDashboardAnalysis', () => {
    const buildUser = (
      id: number,
      nomeCompleto: string,
      departmentName: string,
      primaryType: string,
      secondaryType = '',
    ) =>
      ({
        id,
        nomeCompleto,
        primaryType,
        secondaryType,
        department: { name: departmentName },
      }) as any;

    it('retorna analysis nulo quando não há colaboradores', async () => {
      const result = await service.generateDashboardAnalysis([], {
        label: 'toda a organização',
      });
      expect(result.analysis).toBeNull();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('não chama a IA e retorna aviso de amostra pequena com menos de 3 colaboradores', async () => {
      const users = [
        buildUser(1, 'Ana', 'TI', 'D'),
        buildUser(2, 'Bia', 'TI', 'I'),
      ];
      const result = await service.generateDashboardAnalysis(users, {
        label: 'a equipe do departamento TI',
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(result.totalUsers).toBe(2);
      expect(result.analysis?.attention_needed).toEqual([]);
      expect(result.analysis?.culture_summary).toMatch(/amostra/i);
    });

    it('chama a IA e retorna attention_needed com 3+ colaboradores', async () => {
      const users = [
        buildUser(1, 'Ana', 'Vendas', 'D'),
        buildUser(2, 'Bia', 'Vendas', 'D'),
        buildUser(3, 'Caio', 'Vendas', 'I'),
      ];
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  culture_summary: 'resumo',
                  leadership_focus: ['a'],
                  strategic_advice: 'b',
                  potential_risks: 'c',
                  growth_opportunities: 'd',
                  attention_needed: ['Vendas não tem nenhum perfil C'],
                }),
              },
            },
          ],
        },
      } as any);

      const result = await service.generateDashboardAnalysis(users, {
        label: 'a equipe do departamento Vendas',
      });

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(result.analysis?.attention_needed).toEqual([
        'Vendas não tem nenhum perfil C',
      ]);

      const [, body] = mockedAxios.post.mock.calls[0];
      const userPrompt = (body as any).messages[1].content as string;
      expect(userPrompt).toContain('Ana (Vendas): perfil D');
      expect(userPrompt).toContain('"Vendas"');
    });
  });
});
