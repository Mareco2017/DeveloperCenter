import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User';

/**
 * 企业认证实体
 * 存储企业认证信息
 */
@Entity('enterprise_auth')
export class EnterpriseAuth {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ nullable: false })
  enterpriseName!: string;

  @Column({ nullable: true })
  creditCode?: string;

  @Column({ nullable: true })
  licenseUrl?: string;

  @Column({ nullable: true })
  legalPerson?: string;

  @Column({ default: 0 })
  status!: number; // 0-未认证 1-审核中 2-已认证 3-认证失败

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => User, (user) => user.enterpriseAuth)
  @JoinColumn({ name: 'userId' })
  user?: User;
}
