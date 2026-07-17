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
  analiseResult: string; // Guardaremos o JSON da análise aqui

  @Column({ nullable: true })
  scoreD: number;

  @Column({ nullable: true })
  scoreI: number;

  @Column({ nullable: true })
  scoreS: number;

  @Column({ nullable: true })
  scoreC: number;

  @Column({ length: 1, nullable: true })
  primaryType: string;

  @Column({ length: 1, nullable: true })
  secondaryType: string;

  @CreateDateColumn()
  createdAt: Date;
}
