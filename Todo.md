# AI 人生引擎 - 开发任务清单

## 项目概况
基于 Tauri 2 + React + TypeScript 的 TRPG 桌面应用，结合 COC 风格属性系统与 AI 叙事生成能力。

## 最近更新 (2025-12-24 晚)

### ✅ 已完成
- **Tauri v2 迁移**
  - [x] 修复 Cargo.toml 中的 feature flags（移除 dialog-all, fs-all, path-all）
  - [x] 添加 Tauri v2 插件依赖（tauri-plugin-dialog, tauri-plugin-fs）
  - [x] 更新 lib.rs 初始化插件
  - [x] 更新 tauri.conf.json 配置插件权限
  - [x] 安装 Rust 工具链（rustc 1.92.0）

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
  - [x] CharacterCreation 集成 DetailedProfileEditor

- **角色创建模式系统**（★SillyTavern 风格对齐）
  - [x] CharacterCreationMode 类型（narrative/coc/hybrid）
  - [x] NarrativeDescription 类型（描述、性格、场景等）
  - [x] Character 类型灵活化（COC字段全部改为可选）
  - [x] CreationModeSelector 组件（模式选择卡片）
  - [x] NarrativeDescriptionEditor 组件（叙事描述编辑器）
  - [x] CharacterCreation STEP2 重构：支持三种模式
  - [x] 灵活验证逻辑：根据模式验证不同字段
  - [x] 创建角色逻辑更新：保存 narrativeDescription 和 creationMode

## 当前开发阶段

### Phase 1: 核心功能完善 (进行中)

#### 1.1 Lorebook 系统集成
- [x] Lorebook 数据结构定义
- [x] Lorebook 触发和激活服务
- [x] Lorebook 编辑界面组件
- [x] 路由配置集成（添加 /lorebook 路由）
- [x] Tauri 命令：保存/加载 Lorebook
- [ ] 世界线与 Lorebook 关联
- [ ] 游戏运行时 Lorebook 激活测试

#### 1.2 Character Card V2 导入导出 ✅
- [x] V2 数据类型定义
- [x] characterCardService.ts 服务实现
- [x] Character 到 CharacterCardV2 转换
- [x] CharacterCardV2 到 Character 转换
- [x] Character Card 导出功能（JSON）
- [x] Character Card 导入功能（JSON/PNG）
- [x] PNG 元数据嵌入（tEXt chunk）
- [x] PNG 元数据提取
- [x] CharacterManagement 页面
- [x] 路由集成（/character-management）
- [x] Config 页面入口按钮

#### 1.3 世界线系统扩展
- [x] 添加更多历史世界线（至少 5 个）✅ 2025-12-21
  - 拜占庭君士坦丁堡 1075（紫金之城）
  - 北宋汴京 1100（汴京繁华）
  - 佛罗伦萨 1490（美第奇之光）
  - 美国西部 1880（荒野镖客）
  - 魏玛柏林 1925（黄金年代）
- [x] 世界线 Lorebook 内容填充（每个世界线 5 个条目）
- [ ] 世界线特有技能池定义
- [ ] 世界线封面图资源

#### 1.4 角色创建流程优化
- [ ] 角色创建页面 Cassette Futurism 风格更新
- [ ] 技能选择界面实现
- [ ] Character Card 数据生成
- [x] 角色头像上传功能 ✅ 2025-12-21
  - AvatarUpload.tsx 组件（base64 图片）
  - 文件验证（类型、2MB 限制）
  - CharacterCreation 集成

### Phase 2: 游戏主循环 ✅ (2025-12-21 完成核心功能)

#### 2.1 游戏主界面 ✅
- [x] 游戏主界面布局（Cassette Futurism 风格）✅ 2025-12-21
- [x] 左侧角色信息面板 ✅ 2025-12-21
  - [x] COC 属性显示（基础属性 + 派生属性）
  - [x] 技能列表（支持滚动）
  - [x] 天赋特质展示
  - [x] 角色头像显示
- [x] 右侧游戏区域 ✅ 2025-12-21
  - [x] 对话历史展示（玩家/DM/系统消息分类）
  - [x] 行动输入框（支持 Enter 发送、Shift+Enter 换行）
  - [x] 自动滚动到最新消息
  - [x] 处理状态指示
- [x] GameMain.tsx 主页面完整实现 ✅ 2025-12-21
  - [x] 角色加载（从 state 或 localStorage）
  - [x] 配置加载
  - [x] 游戏初始化（AI 开场白）
  - [x] 错误处理和用户提示

#### 2.2 AI 叙事集成 ✅
- [x] AI 调用服务实现（支持多提供商）✅ 2025-12-21
  - [x] aiService.ts 统一接口
  - [x] Gemini API 完整支持
  - [x] OpenAI API 支持
  - [x] Anthropic (Claude) API 支持
  - [x] 自定义端点支持
- [x] 提示词管理系统 ✅ 2025-12-24
  - [x] 基础系统提示（DM 角色提示词）
  - [x] 角色信息注入（属性、天赋、叙事描述）
  - [x] 对话历史管理（完整消息历史）
  - [x] Lorebook 动态注入 ✅ 2025-12-24
  - [ ] 判定结果注入（待实现）
  - [ ] 流式响应支持（可选，待实现）
- [x] Config 页面 AI 配置增强 ✅ 2025-12-21
  - [x] 多提供商预设选择（Gemini/OpenAI/Anthropic）
  - [x] API 连接测试功能
  - [x] Gemini API Key 获取链接

#### 2.3 判定系统 ✅
- [x] COC 风格判定逻辑 ✅ 2025-12-24
  - [x] checkService.ts 完整实现
  - [x] 1d100 判定机制
  - [x] 三种难度（普通/困难/极难）
  - [x] 四种结果（大成功/成功/失败/大失败）
  - [x] 技能判定、属性判定、对抗判定
  - [x] 幸运判定、理智判定
  - [x] 多重判定支持
- [ ] 判定UI组件
- [ ] 判定历史记录UI
- [ ] 判定结果可视化

### Phase 3: 存档与配置 ✅

#### 3.1 存档系统 ✅
- [x] Tauri 文件操作命令（已有基础）
- [x] saveService.ts 完整实现 ✅ 2025-12-24
  - [x] 自动保存功能（可配置间隔）
  - [x] 手动保存/加载
  - [x] 快速保存（覆盖当前存档）
  - [x] 存档列表功能
  - [x] 存档删除功能
  - [x] 获取最近存档
- [ ] 存档UI界面
- [ ] 存档导出/导入

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
- [x] 路由配置（添加 Lorebook 管理页面路由）
- [x] Lorebook 持久化（Tauri 命令）
- [x] Character Card V2 完整实现

### 优先级：中
- [ ] 单元测试覆盖
- [ ] E2E 测试
- [x] 错误日志系统 ✅ 2025-12-24
  - [x] logService.ts（前端日志）
  - [x] Rust log + env_logger（后端日志）
  - [x] Tauri 日志命令（log_debug/info/warn/error）
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
1. 游戏主循环未实现
2. AI 调用服务未实现
3. 角色持久化存储（需要 Tauri 命令）

## 下一步行动计划

### 本周目标 (Week 1)
1. ✅ 完成 Lorebook 编辑界面
2. ✅ 集成 Lorebook 管理到应用路由
3. ✅ 实现 Lorebook 持久化（Tauri 命令）
4. ✅ CharacterCreation 集成 DetailedProfileEditor
5. ✅ 创建角色逻辑更新（支持多种创建模式）
6. ✅ 完成 Character Card V2 导入导出（Phase 1.2）
7. [ ] 测试 Lorebook 完整流程

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

**最后更新**: 2025-12-24 晚
**当前版本**: v0.1.0-dev
**Tauri 版本**: 2.9.x（已完成 v2 迁移）
**Rust 版本**: 1.92.0
**构建状态**: ✅ 构建成功

## 2025-12-24 晚间更新

### 用户体验改进
1. **UI 颜色对比度优化**
   - 提高 `--color-muted-foreground` 对比度（#c4b5a0 → #d4c4b0）
   - 提高 `--color-primary` 亮度（#d4a574 → #e8b973）
   - 优化所有 accent 颜色的可读性：
     - Amber: #e8b973 → #f0c878
     - Crimson: #8b2e2e → #b83e3e
     - Sapphire: #1e3a5f → #3d5a8f
     - Emerald: #2d5747 → #4a7d64

2. **AI 模型预设更新**
   - 默认模型改为 DeepSeek v3（通过 OpenAI API 兼容）
   - 新增模型：
     - DeepSeek v3 (推荐)
     - Claude 4 Opus (推荐)
     - Claude 3.7 Sonnet
     - Gemini 2.0 Flash (推荐)
   - 更新模型顺序：推荐模型置顶

3. **日志查看器页面**（新增 `/logs`）
   - 完整的日志查看界面
   - 日志级别过滤（DEBUG/INFO/WARN/ERROR）
   - 关键词搜索功能
   - 自动滚动选项
   - 日志导出功能（.txt）
   - 统计信息面板
   - 从配置页面快速访问（"🐛 查看日志"按钮）

4. **预设角色系统**（数据层完成）
   - presetCharacters.ts 数据文件
   - 6个经典角色原型：
     - 流浪剑客（叙事模式）
     - 神秘学者（叙事模式）
     - 街头小偷（叙事模式）
     - 私家侦探（混合模式）
     - 神秘学家（混合模式）
     - 退伍军人（COC模式）
     - 医生（COC模式）
   - 支持三种创建模式（narrative/coc/hybrid）
   - 完整的角色属性、技能、叙事描述
   - 待完成：UI集成到角色创建页面

### 文件变更
- 新增：`src/data/presetCharacters.ts`
- 新增：`src/pages/LogViewer.tsx`
- 修改：`src/index.css`（颜色优化）
- 修改：`src/services/aiService.ts`（模型预设）
- 修改：`src/pages/Config.tsx`（日志入口）
- 修改：`src/App.tsx`（路由）

## 2025-12-24 更新内容

### 新增核心服务系统
1. **日志系统（Debug支持）**
   - 前端 logService.ts：统一日志接口，支持多级别日志
   - 后端 Rust log + env_logger：生产级日志框架
   - Tauri 日志命令：前后端日志桥接
   - 开发模式下同时输出到浏览器控制台

2. **COC判定系统（checkService.ts）**
   - 完整 COC 7版判定机制
   - 1d100 骰子系统
   - 三种难度：普通/困难/极难
   - 四种结果：大成功/成功/失败/大失败
   - 支持：技能判定、属性判定、对抗判定、幸运判定、理智判定
   - 多重判定（取最好/最差结果）

3. **Lorebook动态注入（aiService.ts增强）**
   - generateGameResponse：智能生成游戏AI响应
   - buildSystemPrompt：构建完整系统提示词
   - buildCharacterPrompt：角色信息格式化
   - Lorebook条目自动激活与注入
   - 支持叙事模式/COC模式/混合模式

4. **自动存档系统（saveService.ts）**
   - 自动保存（可配置间隔）
   - 手动保存/加载
   - 快速保存（覆盖当前存档）
   - 获取最近存档
   - SaveData完整类型支持

### 技术改进
- 修复 TypeScript 编译问题（enum → const as）
- 所有服务均提供完整的日志记录
- 错误处理优化
- 类型安全增强

### 已达成目标
✅ 最低限度可玩所需的核心系统已全部完成：
- ✅ 角色创建系统
- ✅ 世界线系统（含Lorebook）
- ✅ AI叙事系统（含Lorebook动态注入）
- ✅ 判定系统
- ✅ 存档系统
- ✅ 日志系统

### 下一步
- 游戏主界面集成新服务
- 判定UI组件开发
- 存档UI界面开发
- 完整游戏流程端到端测试
