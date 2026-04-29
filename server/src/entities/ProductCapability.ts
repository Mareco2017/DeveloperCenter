import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { Product } from './Product';
import { Capability } from './Capability';
import { ConfigPackage } from './ConfigPackage';

/**
 * 产品能力关联实体
 * 存储产品与能力的关联关系
 */
@Entity('product_capability')
export class ProductCapability {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column()
  capabilityId!: number;

  @Column({ nullable: true })
  configPackageId?: number;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ default: 1 })
  status!: number; // 0-禁用 1-启用

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Product, (product) => product.productCapabilities)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @ManyToOne(() => Capability)
  @JoinColumn({ name: 'capabilityId' })
  capability?: Capability;

  @ManyToOne(() => ConfigPackage)
  @JoinColumn({ name: 'configPackageId' })
  configPackage?: ConfigPackage;
}
