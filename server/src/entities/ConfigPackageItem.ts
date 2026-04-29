import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ConfigPackage } from './ConfigPackage';

/**
 * 配置包参数项实体
 * 存储配置包中的参数
 */
@Entity('config_package_item')
export class ConfigPackageItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  packageId!: number;

  @Column({ nullable: false })
  paramKey!: string;

  @Column({ nullable: true })
  paramName?: string;

  @Column({ nullable: false })
  paramType!: number; // 1-字符 2-布尔 3-日期

  @Column({ nullable: true })
  paramValue?: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @ManyToOne(() => ConfigPackage, (pkg) => pkg.items)
  @JoinColumn({ name: 'packageId' })
  configPackage?: ConfigPackage;
}
