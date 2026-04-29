import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany
} from 'typeorm';
import { EnterpriseAuth } from './EnterpriseAuth';
import { TeamMember } from './TeamMember';

/**
 * 用户实体
 * 存储用户基础信息
 */
@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ unique: true, nullable: true })
  phone?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  realName?: string;

  @Column({ default: 1 })
  status!: number; // 0-禁用 1-启用

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => EnterpriseAuth, (auth) => auth.user)
  enterpriseAuth?: EnterpriseAuth;

  @OneToMany(() => TeamMember, (member) => member.user)
  teamMemberships?: TeamMember[];
}
