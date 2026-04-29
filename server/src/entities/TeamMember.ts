import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Team } from './Team';
import { User } from './User';

/**
 * 团队成员实体
 * 存储团队成员关系
 */
@Entity('team_member')
export class TeamMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  teamId!: number;

  @Column()
  userId!: number;

  @Column({ default: 2 })
  role!: number; // 1-管理员 2-开发者 3-运营

  @Column({ default: 1 })
  status!: number; // 0-待接受 1-已加入 2-已退出

  @Column({ nullable: true })
  joinedAt?: Date;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: 'teamId' })
  team?: Team;

  @ManyToOne(() => User, (user) => user.teamMemberships)
  @JoinColumn({ name: 'userId' })
  user?: User;
}
