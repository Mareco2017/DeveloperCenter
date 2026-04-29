import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { TeamMember } from './TeamMember';

/**
 * 团队实体
 * 存储团队信息
 */
@Entity('team')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column()
  ownerId!: number;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => TeamMember, (member) => member.team)
  members?: TeamMember[];
}
