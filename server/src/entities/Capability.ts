import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { ConfigPackage } from './ConfigPackage';
import { ScenarioCapability } from './ScenarioCapability';

/**
 * 能力实体
 * 存储能力信息
 */
@Entity('capability')
export class Capability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  code!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @Column({ nullable: true })
  teamId?: number; // NULL表示平台预设

  @Column({ nullable: true })
  epassFuncId?: string;

  @Column({ default: 0 })
  status!: number; // 0-草稿 1-已发布 2-已下架

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => ConfigPackage, (pkg) => pkg.capability)
  configPackages?: ConfigPackage[];

  @OneToMany(() => ScenarioCapability, (sc) => sc.capability)
  scenarioCapabilities?: ScenarioCapability[];
}
