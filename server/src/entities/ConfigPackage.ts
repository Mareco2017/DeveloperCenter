import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Capability } from './Capability';
import { ConfigPackageItem } from './ConfigPackageItem';

/**
 * 配置包实体
 * 存储配置包信息
 */
@Entity('config_package')
export class ConfigPackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  capabilityId!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Capability, (capability) => capability.configPackages)
  @JoinColumn({ name: 'capabilityId' })
  capability?: Capability;

  @OneToMany(() => ConfigPackageItem, (item) => item.configPackage)
  items?: ConfigPackageItem[];
}
