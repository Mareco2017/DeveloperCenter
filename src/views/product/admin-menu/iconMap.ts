/**
 * Element Plus 图标名称候选。
 * 场景：属性面板提供可视化图标选择，图标已在 main.ts 全局注册。
 */
export const menuIconOptions = [
  'Menu',
  'House',
  'Reading',
  'Notebook',
  'Document',
  'Collection',
  'Folder',
  'Tickets',
  'DocumentChecked',
  'DataAnalysis',
  'TrendCharts',
  'PieChart',
  'Histogram',
  'User',
  'Medal',
  'Stamp',
  'UploadFilled',
  'EditPen',
  'Monitor',
  'School',
  'Calendar',
  'Setting'
]

const iconAliases: Record<string, string> = {
  GraduationCap: 'Reading',
  BookOpen: 'Notebook',
  FileText: 'Document',
  Users: 'User',
  ClipboardList: 'Tickets',
  ClipboardCheck: 'Finished',
  BadgeCheck: 'Medal',
  PanelsTopLeft: 'Grid',
  Database: 'Coin',
  Map: 'MapLocation',
  Mic: 'Microphone',
  Video: 'VideoCamera',
  Clipboard: 'Tickets'
}

/**
 * 解析菜单图标名称。
 * 场景：mock 数据沿用参考项目部分图标命名，运行时映射到 Element Plus 图标。
 */
export const resolveMenuIcon = (iconName?: string | null): string => {
  if (!iconName) return 'Folder'
  return iconAliases[iconName] ?? iconName
}
