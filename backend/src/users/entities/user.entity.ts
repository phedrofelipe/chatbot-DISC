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

  @CreateDateColumn()
  createdAt: Date;
}