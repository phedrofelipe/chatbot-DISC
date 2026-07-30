import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Department } from '../../departments/entities/department.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomeCompleto: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.COLABORADOR })
  role: UserRole;

  // Somente contas de staff (Administrador/Gestor/Líder) possuem senha.
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  password: string | null;

  // Somente colaboradores possuem código de acesso (substitui a senha para
  // permitir recuperar o resultado do quiz sem expor dados por e-mail sozinho).
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  accessCodeHash: string | null;

  @ManyToOne(() => Department, {
    nullable: true,
    eager: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department | null;

  @Column({ nullable: true })
  departmentId: number | null;

  @Column({ nullable: true })
  idade: number;

  @Column({ nullable: true })
  regiao: string;

  @Column({ type: 'text', nullable: true })
  analiseResult: string | null; // Guardaremos o JSON da análise aqui

  @Column({ type: 'int', nullable: true })
  scoreD: number | null;

  @Column({ type: 'int', nullable: true })
  scoreI: number | null;

  @Column({ type: 'int', nullable: true })
  scoreS: number | null;

  @Column({ type: 'int', nullable: true })
  scoreC: number | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  primaryType: string | null;

  @Column({ type: 'varchar', length: 1, nullable: true })
  secondaryType: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
