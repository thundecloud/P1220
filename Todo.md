# AI 人生引擎 - 开发任务清单

## 项目概况
基于 Tauri 2 + React + TypeScript 的 TRPG 桌面应用，结合 COC 风格属性系统与 AI 叙事生成能力。

## 最近更新 (2025-12-20)

### ✅ 已完成
- **SillyTavern 系统对齐**
  - [x] Lorebook 系统完整实现（lorebookService.ts）
  - [x] Character Card V2 类型兼容
  - [x] Cassette Futurism 视觉风格完整实现

- **Lorebook 编辑界面**
  - [x] LorebookEditor 主编辑器组件
  - [x] LorebookEntryCard 条目卡片组件
  - [x] LorebookEntryForm 条目编辑表单组件
  - [x] LorebookManagement 管理页面
  - [x] 组件索引和导出
  - [x] TypeScript 类型检查通过
  - [x] 项目构建成功

- **大型设定集支持**
  - [x] SettingDocument 和 SettingCategory 类型定义
  - [x] Worldline 扩展支持大型设定文档
  - [x] WorldlineManager 组件实现
  - [x] 文件导入和文本粘贴两种模式
  - [x] 自动将大型设定拆分为 Lorebook 条目
  - [x] 修复 CharacterCreation 页面"管理自定义世界线"按钮
  - [x] 集成世界线保存/删除功能
  - [x] **文件夹导入功能**（选择文件夹，自动递归读取所有.md/.txt文件）
  - [x] SettingImportService 服务（目录结构解析为 SettingCategory 层次）
  - [x] Tauri 目录读取命令（read_directory_structure）
  - [x] 文件夹选择对话框集成

- **自由世界观支持**
  - [x] Worldline 类型扩展：世界类型、物理规则、魔法体系等
  - [x] 支持完全架空世界（科幻、奇幻、赛博朋克等）
  - [x] 社会结构、货币系统等自定义字段

- **简历级角色详细信息**
  - [x] DetailedProfile 类型定义
  - [x] 教育经历、工作经历、人际关系等结构化数据
  - [x] 性格特征、外貌描述、信仰价值观
  - [x] 恐惧弱点、目标动机、爱好兴趣
  - [x] DetailedProfileEditor 组件（高级设置折叠面板）
  - [ ] CharacterCreation 集成 DetailedProfileEditor

- **角色创建模式系统**（★SillyTavern 风格对齐）
  - [x] CharacterCreationMode 类型（narrative/coc/hybrid）
  - [x] NarrativeDescription 类型（描述、性格、场景等）
  - [x] Character 类型灵活化（COC字段全部改为可选）
  - [x] CreationModeSelector 组件（模式选择卡片）
  - [x] NarrativeDescriptionEditor 组件（叙事描述编辑器）
  - [x] CharacterCreation STEP2 重构：支持三种模式
  - [x] 灵活验证逻辑：根据模式验证不同字段
  - [ ] 创建角色逻辑更新：保存 narrativeDescription 和 creationMode

## 当前开发阶段

### Phase 1: 核心功能完善 (进行中)

#### 1.1 Lorebook 系统集成
- [x] Lorebook 数据结构定义
- [x] Lorebook 触发和激活服务
- [x] Lorebook 编辑界面组件
- [ ] 路由配置集成（添加 /lorebook 路由）
- [ ] Tauri 命令：保存/加载 Lorebook
- [ ] 世界线与 Lorebook 关联
- [ ] 游戏运行时 Lorebook 激活测试

#### 1.2 Character Card V2 导入导出
- [x] V2 数据类型定义
- [ ] Character Card 导出功能
- [ ] Character Card 导入功能
- [ ] PNG 元数据嵌入（可选）

#### 1.3 世界线系统扩展
- [ ] 添加更多历史世界线（至少 5 个）
- [ ] 世界线 Lorebook 内容填充
- [ ] 世界线特有技能池定义
- [ ] 世界线封面图资源

#### 1.4 角色创建流程优化
- [ ] 角色创建页面 Cassette Futurism 风格更新
- [ ] 技能选择界面实现
- [ ] Character Card 数据生成
- [ ] 角色头像上传功能

### Phase 2: 游戏主循环 (待启动)

#### 2.1 游戏主界面
- [ ] 游戏主界面布局（Cassette Futurism 风格）
- [ ] 左侧角色信息面板
  - [ ] COC 属性显示
  - [ ] 技能列表
  - [ ] 天赋特质
- [ ] 右侧游戏区域
  - [ ] 对话历史展示
  - [ ] 判定UI（骰子动画）
  - [ ] 行动输入框

#### 2.2 AI 叙事集成
- [ ] AI 调用服务实现（支持多提供商）
- [ ] 提示词管理系统
  - [ ] 基础系统提示
  - [ ] 世界线背景注入
  - [ ] 角色信息注入
  - [ ] Lorebook 动态注入
  - [ ] 判定结果注入
- [ ] 对话历史管理（滑动窗口）
- [ ] 流式响应支持（可选）

#### 2.3 判定系统
- [ ] COC 风格判定逻辑
- [ ] 判定UI组件
- [ ] 判定历史记录
- [ ] 判定结果可视化

### Phase 3: 存档与配置 (部分完成)

#### 3.1 存档系统
- [x] Tauri 文件操作命令（已有基础）
- [ ] 自动保存功能
- [ ] 手动保存/加载
- [ ] 存档列表展示
- [ ] 存档删除/导出/导入

#### 3.2 配置系统
- [x] 配置页面基础（已实现）
- [ ] Lorebook 管理入口（从配置页跳转）
- [ ] AI 提供商配置
- [ ] DM 风格和提示词配置
- [ ] UI 主题设置

### Phase 4: 优化与打磨 (未开始)

#### 4.1 性能优化
- [ ] 组件懒加载
- [ ] 虚拟滚动（长对话历史）
- [ ] 图片资源优化
- [ ] 内存管理

#### 4.2 用户体验
- [ ] 键盘快捷键
- [ ] 过渡动画
- [ ] 响应式布局
- [ ] 错误边界和异常处理

#### 4.3 文档完善
- [ ] 用户使用手册
- [ ] 开发者文档
- [ ] API 文档
- [ ] Lorebook 创作指南

## 技术债务

### 优先级：高
- [ ] 路由配置（添加 Lorebook 管理页面路由）
- [ ] Lorebook 持久化（Tauri 命令）
- [ ] Character Card V2 完整实现

### 优先级：中
- [ ] 单元测试覆盖
- [ ] E2E 测试
- [ ] 错误日志系统
- [ ] 性能监控

### 优先级：低
- [ ] 国际化 (i18n)
- [ ] 插件系统
- [ ] 云同步（可选）

## 数据内容

### 世界线内容
- [x] 示例世界线数据结构
- [ ] 拜占庭 1075 年完整内容
- [ ] 其他历史时期（宋朝、江户时代、维多利亚时代等）

### 天赋池
- [ ] 通用天赋扩展（至少 50 个）
- [ ] 稀有度平衡调整
- [ ] 天赋 AI 提示词优化

### Lorebook 内容
- [ ] 世界线背景知识
- [ ] 历史事件条目
- [ ] 人物和组织条目
- [ ] 文化和习俗条目

## 已知问题

### Bug
- 无已知 bug

### 功能缺失
1. Lorebook 管理页面未集成到路由
2. Lorebook 数据无法持久化（缺少 Tauri 命令）
3. Character Card V2 仅有类型定义，无实际导入导出功能
4. 游戏主循环未实现
5. AI 调用服务未实现

## 下一步行动计划

### 本周目标 (Week 1)
1. ✅ 完成 Lorebook 编辑界面
2. [ ] 集成 Lorebook 管理到应用路由
3. [ ] 实现 Lorebook 持久化（Tauri 命令）
4. [ ] 测试 Lorebook 完整流程

### 下周目标 (Week 2)
1. [ ] 实现 AI 调用服务
2. [ ] 实现提示词管理系统
3. [ ] 开发游戏主界面基础布局
4. [ ] 实现简单的对话循环

## 版本规划

### v0.1.0 (MVP - 目标：1 月底)
- [x] 基础框架搭建
- [x] Lorebook 系统
- [x] Cassette Futurism 风格
- [ ] 角色创建流程
- [ ] 简单游戏循环
- [ ] 本地存档

### v0.2.0 (Alpha - 目标：2 月)
- [ ] 完整游戏循环
- [ ] 多世界线支持
- [ ] Character Card V2 导入导出
- [ ] 优化用户体验

### v0.3.0 (Beta - 目标：3 月)
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 文档完善
- [ ] 打包和分发

### v1.0.0 (正式版 - 目标：4 月)
- [ ] 功能完整
- [ ] 稳定性验证
- [ ] 用户反馈整合
- [ ] 公开发布

## 参考资料
- SillyTavern Lorebook: https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- Character Card V2: https://github.com/malfoyslastname/character-card-spec-v2
- Cassette Futurism: https://aesthetics.fandom.com/wiki/Cassette_Futurism
- COC 7版规则: Call of Cthulhu 7th Edition

---

**最后更新**: 2025-12-20
**当前版本**: v0.1.0-dev
**构建状态**: ✅ 通过
