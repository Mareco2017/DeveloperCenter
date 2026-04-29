import {
  createCustomGroupNode,
  createMenuNodeFromTemplate,
  type FactoryMenuNode,
  type FactoryMenuPreset,
  type FactoryPageOption,
  type FactorySystemMenu
} from './menuTree'

/**
 * 出厂菜单 mock 模板。
 * 场景：本期只实现前端预设体验，后续可替换为真实能力/页面接口。
 */
export const mockSystemMenus: FactorySystemMenu[] = [
  {
    menuId: 'menu_course_mgmt',
    featureId: 'course_mgmt',
    menuName: '课程管理',
    menuNameI18n: { 'zh-CN': '课程管理', 'en-US': 'Course Management' },
    menuType: 'group',
    menuIcon: 'Notebook',
    isSystem: false,
    defaultSortOrder: 1,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_course_list',
    featureId: 'course_mgmt',
    menuName: '课程列表',
    menuNameI18n: { 'zh-CN': '课程列表', 'en-US': 'Course List' },
    menuType: 'group',
    menuPath: '/courses/list',
    menuIcon: 'Document',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_course_mgmt',
    defaultSortOrder: 1,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_course_all',
    featureId: 'course_mgmt',
    menuName: '全部课程',
    menuNameI18n: { 'zh-CN': '全部课程', 'en-US': 'All Courses' },
    menuType: 'function',
    menuPath: '/courses/list/all',
    menuIcon: 'Document',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_course_list',
    defaultSortOrder: 1,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_course_online',
    featureId: 'course_mgmt',
    menuName: '线上课程',
    menuNameI18n: { 'zh-CN': '线上课程', 'en-US': 'Online Courses' },
    menuType: 'function',
    menuPath: '/courses/list/online',
    menuIcon: 'Monitor',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_course_list',
    defaultSortOrder: 2,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_course_offline',
    featureId: 'course_mgmt',
    menuName: '线下课程',
    menuNameI18n: { 'zh-CN': '线下课程', 'en-US': 'Offline Courses' },
    menuType: 'function',
    menuPath: '/courses/list/offline',
    menuIcon: 'School',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_course_list',
    defaultSortOrder: 3,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_course_create',
    featureId: 'course_mgmt',
    menuName: '创建课程',
    menuNameI18n: { 'zh-CN': '创建课程', 'en-US': 'Create Course' },
    menuType: 'function',
    menuPath: '/courses/create',
    menuIcon: 'Plus',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_course_mgmt',
    defaultSortOrder: 2,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_learning_center',
    featureId: 'learning_center',
    menuName: '学习中心',
    menuNameI18n: { 'zh-CN': '学习中心', 'en-US': 'Learning Center' },
    menuType: 'group',
    menuIcon: 'Reading',
    isSystem: false,
    defaultSortOrder: 2,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_practice_mgmt',
    featureId: 'homework_mgmt',
    menuName: '练习管理',
    menuNameI18n: { 'zh-CN': '练习管理', 'en-US': 'Practice Management' },
    menuType: 'group',
    menuIcon: 'EditPen',
    isSystem: false,
    parentMenuId: 'menu_learning_center',
    defaultSortOrder: 1,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_exercise_mgmt',
    featureId: 'homework_mgmt',
    menuName: '习题管理',
    menuNameI18n: { 'zh-CN': '习题管理', 'en-US': 'Exercise Management' },
    menuType: 'function',
    menuPath: '/learning/practice/exercises',
    menuIcon: 'Edit',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_practice_mgmt',
    defaultSortOrder: 1,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_exercise_import',
    featureId: 'homework_mgmt',
    menuName: '习题导入',
    menuNameI18n: { 'zh-CN': '习题导入', 'en-US': 'Exercise Import' },
    menuType: 'function',
    menuPath: '/learning/practice/import',
    menuIcon: 'Upload',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_practice_mgmt',
    defaultSortOrder: 2,
    applicationName: '培训应用',
    poolItem: true
  },
  {
    menuId: 'menu_homework_mgmt',
    featureId: 'homework_mgmt',
    menuName: '作业管理',
    menuNameI18n: { 'zh-CN': '作业管理', 'en-US': 'Homework Management' },
    menuType: 'group',
    menuIcon: 'Tickets',
    isSystem: false,
    defaultSortOrder: 3,
    applicationName: '作业',
    poolItem: true
  },
  {
    menuId: 'menu_homework_list',
    featureId: 'homework_mgmt',
    menuName: '作业列表',
    menuNameI18n: { 'zh-CN': '作业列表', 'en-US': 'Homework List' },
    menuType: 'function',
    menuPath: '/homework/list',
    menuIcon: 'List',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_homework_mgmt',
    defaultSortOrder: 1,
    applicationName: '作业',
    poolItem: true
  },
  {
    menuId: 'menu_homework_create',
    featureId: 'homework_mgmt',
    menuName: '创建作业',
    menuNameI18n: { 'zh-CN': '创建作业', 'en-US': 'Create Homework' },
    menuType: 'function',
    menuPath: '/homework/create',
    menuIcon: 'CirclePlus',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_homework_mgmt',
    defaultSortOrder: 2,
    applicationName: '作业',
    poolItem: true
  },
  {
    menuId: 'menu_homework_stats',
    featureId: 'homework_mgmt',
    menuName: '作业统计',
    menuNameI18n: { 'zh-CN': '作业统计', 'en-US': 'Homework Statistics' },
    menuType: 'function',
    menuPath: '/homework/stats',
    menuIcon: 'TrendCharts',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_homework_mgmt',
    defaultSortOrder: 3,
    applicationName: '作业',
    poolItem: true
  },
  {
    menuId: 'menu_exam_mgmt',
    featureId: 'exam_mgmt',
    menuName: '考试管理',
    menuNameI18n: { 'zh-CN': '考试管理', 'en-US': 'Exam Management' },
    menuType: 'group',
    menuIcon: 'DocumentChecked',
    isSystem: false,
    defaultSortOrder: 1,
    applicationName: '考试',
    poolItem: true
  },
  {
    menuId: 'menu_exam_list',
    featureId: 'exam_mgmt',
    menuName: '考试列表',
    menuNameI18n: { 'zh-CN': '考试列表', 'en-US': 'Exam List' },
    menuType: 'function',
    menuPath: '/exams/list',
    menuIcon: 'Memo',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_exam_mgmt',
    defaultSortOrder: 1,
    applicationName: '考试',
    poolItem: true
  },
  {
    menuId: 'menu_exam_create',
    featureId: 'exam_mgmt',
    menuName: '创建考试',
    menuNameI18n: { 'zh-CN': '创建考试', 'en-US': 'Create Exam' },
    menuType: 'function',
    menuPath: '/exams/create',
    menuIcon: 'CirclePlus',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_exam_mgmt',
    defaultSortOrder: 2,
    applicationName: '考试',
    poolItem: true
  },
  {
    menuId: 'menu_exam_signup',
    featureId: 'signup_mgmt',
    menuName: '考试报名',
    menuNameI18n: { 'zh-CN': '考试报名', 'en-US': 'Exam Registration' },
    menuType: 'function',
    menuPath: '/exams/signup',
    menuIcon: 'Finished',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_exam_mgmt',
    defaultSortOrder: 3,
    applicationName: '考试',
    poolItem: true
  },
  {
    menuId: 'menu_grade_mgmt',
    featureId: 'exam_mgmt',
    menuName: '成绩管理',
    menuNameI18n: { 'zh-CN': '成绩管理', 'en-US': 'Grade Management' },
    menuType: 'function',
    menuPath: '/exams/grades',
    menuIcon: 'DataAnalysis',
    isSystem: false,
    requiredPermission: 'use',
    defaultSortOrder: 2,
    applicationName: '考试',
    poolItem: true
  },
  {
    menuId: 'menu_learning_stats',
    featureId: 'report_mgmt',
    menuName: '学习统计',
    menuNameI18n: { 'zh-CN': '学习统计', 'en-US': 'Learning Statistics' },
    menuType: 'group',
    menuIcon: 'TrendCharts',
    isSystem: false,
    defaultSortOrder: 1,
    applicationName: '数据应用',
    poolItem: true
  },
  {
    menuId: 'menu_stats_overview',
    featureId: 'report_mgmt',
    menuName: '统计概览',
    menuNameI18n: { 'zh-CN': '统计概览', 'en-US': 'Statistics Overview' },
    menuType: 'function',
    menuPath: '/learning/stats/overview',
    menuIcon: 'PieChart',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_learning_stats',
    defaultSortOrder: 1,
    applicationName: '数据应用',
    poolItem: true
  },
  {
    menuId: 'menu_report',
    featureId: 'report_mgmt',
    menuName: '自定义报表',
    menuNameI18n: { 'zh-CN': '自定义报表', 'en-US': 'Custom Report' },
    menuType: 'function',
    menuPath: '/reports/custom',
    menuIcon: 'Histogram',
    isSystem: false,
    requiredPermission: 'use',
    defaultSortOrder: 2,
    applicationName: '数据应用',
    poolItem: true
  },
  {
    menuId: 'menu_student_mgmt',
    featureId: 'student_mgmt',
    menuName: '学员管理',
    menuNameI18n: { 'zh-CN': '学员管理', 'en-US': 'Student Management' },
    menuType: 'function',
    menuPath: '/students',
    menuIcon: 'User',
    isSystem: false,
    requiredPermission: 'use',
    defaultSortOrder: 1,
    applicationName: '组织应用',
    poolItem: true
  },
  {
    menuId: 'menu_certificate_mgmt',
    featureId: 'certificate_mgmt',
    menuName: '证书管理',
    menuNameI18n: { 'zh-CN': '证书管理', 'en-US': 'Certificate Management' },
    menuType: 'group',
    menuIcon: 'Medal',
    isSystem: false,
    defaultSortOrder: 1,
    applicationName: '证书',
    poolItem: true,
    releaseTag: 'NEW'
  },
  {
    menuId: 'menu_certificate_list',
    featureId: 'certificate_mgmt',
    menuName: '证书列表',
    menuNameI18n: { 'zh-CN': '证书列表', 'en-US': 'Certificate List' },
    menuType: 'function',
    menuPath: '/certificates/list',
    menuIcon: 'Collection',
    isSystem: false,
    requiredPermission: 'use',
    parentMenuId: 'menu_certificate_mgmt',
    defaultSortOrder: 1,
    applicationName: '证书',
    poolItem: true
  },
  {
    menuId: 'menu_certificate_issue',
    featureId: 'certificate_mgmt',
    menuName: '颁发证书',
    menuNameI18n: { 'zh-CN': '颁发证书', 'en-US': 'Issue Certificate' },
    menuType: 'function',
    menuPath: '/certificates/issue',
    menuIcon: 'Stamp',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_certificate_mgmt',
    defaultSortOrder: 2,
    applicationName: '证书',
    poolItem: true
  },
  {
    menuId: 'menu_file_mgmt',
    featureId: 'file_mgmt',
    menuName: '文件管理',
    menuNameI18n: { 'zh-CN': '文件管理', 'en-US': 'File Management' },
    menuType: 'group',
    menuIcon: 'Folder',
    isSystem: false,
    defaultSortOrder: 1,
    applicationName: '文件',
    poolItem: true
  },
  {
    menuId: 'menu_file_upload',
    featureId: 'file_mgmt',
    menuName: '文件上传',
    menuNameI18n: { 'zh-CN': '文件上传', 'en-US': 'File Upload' },
    menuType: 'function',
    menuPath: '/files/upload',
    menuIcon: 'UploadFilled',
    isSystem: false,
    requiredPermission: 'create',
    parentMenuId: 'menu_file_mgmt',
    defaultSortOrder: 1,
    applicationName: '文件',
    poolItem: true
  }
]

export const pageOptions: FactoryPageOption[] = mockSystemMenus
  .filter((menu) => Boolean(menu.menuPath))
  .map((menu) => ({
    id: menu.menuId,
    label: menu.menuName,
    path: menu.menuPath as string
  }))

const trainingCenterNode: FactoryMenuNode = {
  ...createCustomGroupNode('培训中心', 'Reading', 'custom_group_training_center'),
  sortOrder: 1,
  children: [
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_course_mgmt'),
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_learning_center'),
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_homework_mgmt'),
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_exam_mgmt')
  ]
}

const dataCenterNode: FactoryMenuNode = {
  ...createCustomGroupNode('数据中心', 'TrendCharts', 'custom_group_data_center'),
  sortOrder: 2,
  children: [
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_learning_stats'),
    createMenuNodeFromTemplate(mockSystemMenus, 'menu_report')
  ]
}

const orgNode = createMenuNodeFromTemplate(mockSystemMenus, 'menu_student_mgmt')
orgNode.sortOrder = 3

/**
 * 产品出厂预设默认值。
 * 场景：首次打开产品菜单配置页，或 localStorage 数据损坏时回退。
 */
export const defaultFactoryMenuPreset: FactoryMenuPreset = {
  defaultMenuTree: {
    children: [trainingCenterNode, dataCenterNode, orgNode]
  },
  updatedAt: '2026-04-29T00:00:00.000Z',
  updatedBy: 'mock_admin'
}
