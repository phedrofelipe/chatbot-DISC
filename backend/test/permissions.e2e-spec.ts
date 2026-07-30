import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

describe('Permissionamento (RBAC) e2e', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let usersService: UsersService;

  let adminToken: string;
  let gestorToken: string;
  let liderAToken: string;

  let deptA: number;
  let deptB: number;
  let colabAId: number;
  let colabBId: number;
  let colabAEmail: string;
  let colabBEmail: string;
  let colabBAccessCode: string;

  const ts = Date.now();
  const STAFF_PASSWORD = 'senhaSeguraDeTeste123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
    server = app.getHttpServer();
    usersService = app.get(UsersService);

    const adminLogin = await request(server)
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      })
      .expect(200);
    adminToken = adminLogin.body.access_token;

    const deptARes = await request(server)
      .post('/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Perm-A-${ts}` })
      .expect(201);
    deptA = deptARes.body.id;

    const deptBRes = await request(server)
      .post('/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Perm-B-${ts}` })
      .expect(201);
    deptB = deptBRes.body.id;

    await request(server)
      .post('/users/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nomeCompleto: 'Gestor Perm',
        email: `gestor.perm.${ts}@teste.com`,
        password: STAFF_PASSWORD,
        role: 'gestor',
      })
      .expect(201);
    gestorToken = (
      await request(server)
        .post('/auth/login')
        .send({
          email: `gestor.perm.${ts}@teste.com`,
          password: STAFF_PASSWORD,
        })
        .expect(200)
    ).body.access_token;

    await request(server)
      .post('/users/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nomeCompleto: 'Lider A',
        email: `lider.a.${ts}@teste.com`,
        password: STAFF_PASSWORD,
        role: 'lider',
        departmentId: deptA,
      })
      .expect(201);
    liderAToken = (
      await request(server)
        .post('/auth/login')
        .send({ email: `lider.a.${ts}@teste.com`, password: STAFF_PASSWORD })
        .expect(200)
    ).body.access_token;

    colabAEmail = `colab.a.${ts}@teste.com`;
    colabBEmail = `colab.b.${ts}@teste.com`;

    const colabARes = await request(server)
      .post('/users')
      .send({
        nomeCompleto: 'Colab A',
        email: colabAEmail,
        departmentId: deptA,
        idade: 30,
        regiao: 'Sul',
      })
      .expect(201);
    colabAId = colabARes.body.id;

    const colabBRes = await request(server)
      .post('/users')
      .send({
        nomeCompleto: 'Colab B',
        email: colabBEmail,
        departmentId: deptB,
        idade: 31,
        regiao: 'Norte',
      })
      .expect(201);
    colabBId = colabBRes.body.id;
    colabBAccessCode = colabBRes.body.accessCode;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Endpoints públicos do fluxo do colaborador', () => {
    it('GET /departments não exige token', async () => {
      await request(server).get('/departments').expect(200);
    });

    it('POST /users cria colaborador sem token e devolve um código de acesso, sem dados sensíveis', async () => {
      const res = await request(server)
        .post('/users')
        .send({
          nomeCompleto: 'Colab Public',
          email: `colab.public.${ts}@teste.com`,
          departmentId: deptA,
          idade: 22,
          regiao: 'Norte',
        })
        .expect(201);

      expect(res.body.accessCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(res.body.password).toBeUndefined();
      expect(res.body.analiseResult).toBeUndefined();
    });

    it('GET /users/email/:email nunca expõe analiseResult/scores (só confirma existência)', async () => {
      const res = await request(server)
        .get(`/users/email/${colabBEmail}`)
        .expect(200);

      expect(res.body.email).toBe(colabBEmail);
      expect(res.body).toHaveProperty('hasResult');
      expect(res.body.analiseResult).toBeUndefined();
      expect(res.body.scoreD).toBeUndefined();
      expect(res.body.primaryType).toBeUndefined();
    });

    it('GET /users/email/:email não erra (200) para e-mail inexistente e não retorna dados', async () => {
      const res = await request(server)
        .get(`/users/email/nao.existe.${ts}@teste.com`)
        .expect(200);
      // Controller devolve `null`; sem ClassSerializer/Nest emitindo corpo, chega vazio no fio.
      expect(res.text).toBe('');
    });

    it('POST /users/verify-access rejeita código incorreto', async () => {
      await request(server)
        .post('/users/verify-access')
        .send({ email: colabBEmail, accessCode: 'WRON-GCOD' })
        .expect(401);
    });

    it('POST /users/verify-access rejeita e-mail inexistente sem distinguir a causa', async () => {
      const res = await request(server)
        .post('/users/verify-access')
        .send({ email: `nao.existe.${ts}@teste.com`, accessCode: 'WHAT-EVER' })
        .expect(401);
      expect(res.body.message).toBe('E-mail ou código de acesso inválidos');
    });

    it('POST /users/verify-access aceita o código correto e devolve o resultado completo', async () => {
      const res = await request(server)
        .post('/users/verify-access')
        .send({ email: colabBEmail, accessCode: colabBAccessCode })
        .expect(200);
      expect(res.body.email).toBe(colabBEmail);
      expect(res.body).toHaveProperty('analiseResult');
    });
  });

  describe('POST /analysis — proteção do resultado já salvo', () => {
    beforeAll(async () => {
      // Simula uma análise já concluída sem depender da API externa do Groq.
      await usersService.updateAnalysis(
        colabBId,
        {
          headline: 'Teste',
          description: 'x',
          strengths: [],
          challenges: [],
          management_tips: [],
          ideal_roles: 'x',
          combo_insight: 'x',
        },
        { D: 1, I: 2, S: 3, C: 4 },
        'C',
        'S',
      );
    });

    it('rejeita buscar análise já salva sem accessCode', async () => {
      await request(server)
        .post('/analysis')
        .send({
          email: colabBEmail,
          scores: { D: 1, I: 1, S: 1, C: 1 },
          answers: [],
        })
        .expect(401);
    });

    it('rejeita buscar análise já salva com accessCode errado', async () => {
      await request(server)
        .post('/analysis')
        .send({
          email: colabBEmail,
          scores: { D: 1, I: 1, S: 1, C: 1 },
          answers: [],
          accessCode: 'WRON-GCOD',
        })
        .expect(401);
    });

    it('devolve a análise em cache com o accessCode correto', async () => {
      const res = await request(server)
        .post('/analysis')
        .send({
          email: colabBEmail,
          scores: { D: 1, I: 1, S: 1, C: 1 },
          answers: [],
          accessCode: colabBAccessCode,
        })
        .expect(201);
      expect(res.body.headline).toBe('Teste');
    });
  });

  describe('Autenticação de staff', () => {
    it('Colaborador não consegue logar via /auth/login (não possui senha)', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: colabAEmail, password: 'qualquer-coisa' })
        .expect(401);
    });

    it('bloqueia rotas protegidas sem token', async () => {
      await request(server).get('/users').expect(401);
      await request(server).get('/analysis/dashboard').expect(401);
    });

    it('bloqueia token malformado/inválido', async () => {
      await request(server)
        .get('/users')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('GET /users — visibilidade por papel', () => {
    it('Admin e Gestor veem colaboradores de todos os departamentos', async () => {
      for (const token of [adminToken, gestorToken]) {
        const res = await request(server)
          .get('/users')
          .set('Authorization', `Bearer ${token}`)
          .query({ limit: 200 })
          .expect(200);
        const emails = res.body.data.map((u: { email: string }) => u.email);
        expect(emails).toContain(colabAEmail);
        expect(emails).toContain(colabBEmail);
      }
    });

    it('Líder só vê colaboradores do próprio departamento', async () => {
      const res = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${liderAToken}`)
        .query({ limit: 200 })
        .expect(200);
      const emails = res.body.data.map((u: { email: string }) => u.email);
      expect(emails).toContain(colabAEmail);
      expect(emails).not.toContain(colabBEmail);
    });
  });

  describe('Mutações de usuários — somente ADMIN', () => {
    it('Gestor não pode criar staff', async () => {
      await request(server)
        .post('/users/staff')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          nomeCompleto: 'X',
          email: `x.gestor.${ts}@teste.com`,
          password: STAFF_PASSWORD,
          role: 'lider',
          departmentId: deptA,
        })
        .expect(403);
    });

    it('Líder não pode criar staff', async () => {
      await request(server)
        .post('/users/staff')
        .set('Authorization', `Bearer ${liderAToken}`)
        .send({
          nomeCompleto: 'X',
          email: `x.lider.${ts}@teste.com`,
          password: STAFF_PASSWORD,
          role: 'lider',
          departmentId: deptA,
        })
        .expect(403);
    });

    it('Gestor não pode editar usuário', async () => {
      await request(server)
        .patch(`/users/${colabAId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({ nomeCompleto: 'Hackeado' })
        .expect(403);
    });

    it('Líder não pode editar usuário', async () => {
      await request(server)
        .patch(`/users/${colabAId}`)
        .set('Authorization', `Bearer ${liderAToken}`)
        .send({ nomeCompleto: 'Hackeado' })
        .expect(403);
    });

    it('Gestor não pode remover usuário', async () => {
      await request(server)
        .delete(`/users/${colabAId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(403);
    });

    it('Líder não pode remover usuário', async () => {
      await request(server)
        .delete(`/users/${colabAId}`)
        .set('Authorization', `Bearer ${liderAToken}`)
        .expect(403);
    });

    it('Admin pode editar usuário', async () => {
      await request(server)
        .patch(`/users/${colabAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ regiao: 'Sudeste' })
        .expect(200);
    });
  });

  describe('Departamentos — somente ADMIN muta', () => {
    it('Gestor não pode criar departamento', async () => {
      await request(server)
        .post('/departments')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({ name: `Should-Fail-Gestor-${ts}` })
        .expect(403);
    });

    it('Líder não pode criar departamento', async () => {
      await request(server)
        .post('/departments')
        .set('Authorization', `Bearer ${liderAToken}`)
        .send({ name: `Should-Fail-Lider-${ts}` })
        .expect(403);
    });

    it('Gestor e Líder não podem remover departamento', async () => {
      for (const token of [gestorToken, liderAToken]) {
        await request(server)
          .delete(`/departments/${deptB}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });
  });

  describe('GET /analysis/dashboard — escopo por papel', () => {
    it('Gestor acessa o dashboard global', async () => {
      // Escopo global chama a IA (Groq) de verdade quando há ≥3 colaboradores no banco.
      await request(server)
        .get('/analysis/dashboard')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);
    }, 30000);

    it('Líder A recebe apenas os colaboradores do próprio departamento', async () => {
      const res = await request(server)
        .get('/analysis/dashboard')
        .set('Authorization', `Bearer ${liderAToken}`)
        .expect(200);
      // deptA tem exatamente Colab A + Colab Public (criado no describe anterior)
      expect(res.body.totalUsers).toBe(2);
    });
  });

  describe('Reset de respostas — somente ADMIN, e ação em massa exige confirmação', () => {
    it('Gestor e Líder não podem reiniciar respostas de um colaborador', async () => {
      for (const token of [gestorToken, liderAToken]) {
        await request(server)
          .patch(`/users/${colabBId}/reset-analysis`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      }
    });

    it('Gestor e Líder não podem disparar o reset em massa', async () => {
      for (const token of [gestorToken, liderAToken]) {
        await request(server)
          .post('/users/reset-all-analysis')
          .set('Authorization', `Bearer ${token}`)
          .send({ confirm: true })
          .expect(403);
      }
    });

    it('Admin não reinicia em massa sem confirmação explícita (confirm: true)', async () => {
      await request(server)
        .post('/users/reset-all-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirm: false })
        .expect(400);
    });

    // Propositalmente não exercitamos o caminho `confirm: true` aqui: esta suíte
    // roda contra o banco real do ambiente (não um banco de teste isolado), e essa
    // chamada zeraria o resultado de TODOS os colaboradores já cadastrados nele.

    it('Admin reinicia as respostas de um colaborador e recebe um novo código de acesso', async () => {
      const res = await request(server)
        .patch(`/users/${colabBId}/reset-analysis`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.hasResult).toBe(false);
      expect(res.body.accessCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(res.body.accessCode).not.toBe(colabBAccessCode);

      // o código antigo deixa de funcionar — foi substituído pelo novo
      await request(server)
        .post('/users/verify-access')
        .send({ email: colabBEmail, accessCode: colabBAccessCode })
        .expect(401);

      await request(server)
        .post('/users/verify-access')
        .send({ email: colabBEmail, accessCode: res.body.accessCode })
        .expect(200);
    });
  });

  describe('Limpeza total de dados — somente ADMIN, exige a frase de confirmação exata', () => {
    it('Gestor e Líder não podem disparar a limpeza total', async () => {
      for (const token of [gestorToken, liderAToken]) {
        await request(server)
          .post('/users/wipe-data')
          .set('Authorization', `Bearer ${token}`)
          .send({ confirmationPhrase: 'APAGAR TUDO' })
          .expect(403);
      }
    });

    it('Admin não limpa os dados sem a frase de confirmação exata', async () => {
      await request(server)
        .post('/users/wipe-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmationPhrase: 'apagar tudo' }) // case incorreto — não deve bater
        .expect(400);

      await request(server)
        .post('/users/wipe-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmationPhrase: '' })
        .expect(400);
    });

    // Propositalmente NUNCA exercitamos o caminho de sucesso (frase correta) aqui:
    // esta suíte roda contra o banco real do ambiente, e essa chamada apagaria
    // permanentemente TODOS os colaboradores, líderes, gestores e departamentos
    // já cadastrados nele — não só os fixtures criados por este arquivo.
  });
});
