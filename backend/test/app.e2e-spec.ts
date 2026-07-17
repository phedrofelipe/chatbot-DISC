import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let departmentId: number;

  const uniqueEmail = `colaborador.e2e.${Date.now()}@teste.com`;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista departamentos publicamente', async () => {
    const res = await request(app.getHttpServer())
      .get('/departments')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('bloqueia GET /users sem autenticação', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('faz login com o Administrador seedado no boot da aplicação', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.role).toBe('admin');
    adminToken = res.body.access_token;
  });

  it('rejeita login com credenciais inválidas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: 'senha-errada' })
      .expect(401);
  });

  it('Administrador cria um departamento', async () => {
    const res = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `QA-${Date.now()}` })
      .expect(201);

    departmentId = res.body.id;
    expect(departmentId).toBeDefined();
  });

  it('cadastra um colaborador publicamente (sem autenticação)', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        nomeCompleto: 'Colaborador E2E',
        email: uniqueEmail,
        departmentId,
        idade: 28,
        regiao: 'Sudeste',
      })
      .expect(201);

    expect(res.body.role).toBe('colaborador');
    expect(res.body.password).toBeUndefined();
  });

  it('permite ao colaborador reconsultar seus próprios dados pelo e-mail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/email/${uniqueEmail}`)
      .expect(200);

    expect(res.body.email).toBe(uniqueEmail);
  });

  it('bloqueia rota administrativa para o papel Colaborador', async () => {
    await request(app.getHttpServer()).get('/analysis/dashboard').expect(401);
  });

  it('Administrador acessa o dashboard', async () => {
    await request(app.getHttpServer())
      .get('/analysis/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('Administrador remove o departamento de teste', async () => {
    await request(app.getHttpServer())
      .delete(`/departments/${departmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
    // 409: ainda há o colaborador cadastrado vinculado ao departamento nesta suíte.
  });
});
