import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from './Product';

/**
 * 管理后台菜单实体
 * 存储产品管理后台菜单配置
 */
@Entity('admin_menu')
export class AdminMenu {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  productId!: number;

  @Column({ default: 0 })
  parentId!: number; // 父菜单ID，0为根

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ nullable: true })
  visibleRoles?: string; // 可见角色（逗号分隔）

  @ManyToOne(() => Product, (product) => product.adminMenus)
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
