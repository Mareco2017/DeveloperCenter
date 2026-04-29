import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Product } from './Product';
import { ScenarioCapability } from './ScenarioCapability';

/**
 * 场景方案实体
 * 存储产品场景方案配置
 */
@Entity('scenario')
export class Scenario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column({ nullable: false })
  code!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  loginIdentityConfig?: string; // JSON格式

  @Column({ nullable: true, type: 'text' })
  h5PortalConfig?: string; // JSON格式

  @Column({ nullable: true, type: 'text' })
  pcPortalConfig?: string; // JSON格式

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Product, (product) => product.scenarios)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @OneToMany(() => ScenarioCapability, (sc) => sc.scenario)
  scenarioCapabilities?: ScenarioCapability[];
}
