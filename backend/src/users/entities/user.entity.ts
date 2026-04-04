import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomeCompleto: string;

  @Column({ unique: true })
  email: string;

  @Column()
  setor: string;

  @Column()
  idade: number;

  @Column()
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