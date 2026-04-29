import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { ProductCapability } from './ProductCapability';
import { AdminMenu } from './AdminMenu';
import { Scenario } from './Scenario';
import { Terminal } from './Terminal';

/**
 * 产品实体
 * 存储产品基础信息
 */
@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  code?: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  teamId?: number;

  @Column({ default: 0 })
  status!: number; // 0-草稿 1-已发布 2-已下架

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ProductCapability, (pc) => pc.product)
  productCapabilities?: ProductCapability[];

  @OneToMany(() => AdminMenu, (menu) => menu.product)
  adminMenus?: AdminMenu[];

  @OneToMany(() => Scenario, (scenario) => scenario.product)
  scenarios?: Scenario[];

  @OneToMany(() => Terminal, (terminal) => terminal.product)
  terminals?: Terminal[];
}
