import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from './Product';

/**
 * 终端版本实体
 * 存储产品终端版本配置
 */
@Entity('terminal')
export class Terminal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  type!: number; // 1-APP 2-小程序 3-PC

  @Column({ nullable: true })
  platform?: number; // 1-iOS 2-Android 3-Windows 4-Mac 5-Linux 6-微信小程序 7-支付宝小程序 8-抖音小程序

  @Column({ nullable: true })
  version?: string;

  @Column({ nullable: true })
  downloadUrl?: string;

  @Column({ default: false })
  forceUpdate!: boolean;

  @Column({ nullable: true, type: 'text' })
  updateDesc?: string;

  @Column({ default: 0 })
  status!: number; // 0-草稿 1-已发布 2-已下架

  @Column({ nullable: true, type: 'text' })
  loginConfig?: string; // JSON格式

  @Column({ nullable: true, type: 'text' })
  brandConfig?: string; // JSON格式

  @Column({ nullable: true })
  scenarioId?: number; // 关联的场景方案ID

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Product, (product) => product.terminals)
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
