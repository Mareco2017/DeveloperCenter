import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Scenario } from './Scenario';
import { Capability } from './Capability';

/**
 * 场景能力配置实体
 * 存储场景方案中启用的能力
 */
@Entity('scenario_capability')
export class ScenarioCapability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  scenarioId!: number;

  @Column()
  capabilityId!: number;

  @Column({ default: 1 })
  status!: number; // 0-禁用 1-启用

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Scenario, (scenario) => scenario.scenarioCapabilities)
  @JoinColumn({ name: 'scenarioId' })
  scenario?: Scenario;

  @ManyToOne(() => Capability, (capability) => capability.scenarioCapabilities)
  @JoinColumn({ name: 'capabilityId' })
  capability?: Capability;
}
