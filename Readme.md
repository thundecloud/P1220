# AI人生引擎 - 桌面应用技术文档

## 项目概述

AI人生引擎是一个基于大语言模型的动态叙事TRPG桌面应用。系统将传统TRPG的数值判定机制与AI叙事生成能力相结合，在历史背景的世界线中创造沉浸式的角色扮演体验。

**核心机制**：
- **COC风格属性系统**：8项基础属性(力量/体质/敏捷/智力/教育/意志/魅力/幸运) + 派生属性(HP/SAN/MP/MOV)
- **天赋特质系统**：通过AI提示词影响叙事走向
- **Lorebook世界知识库**：采用SillyTavern风格的动态上下文注入系统，支持关键词触发、递归扫描、条件过滤
- **Cassette Futurism视觉风格**：1970-90年代复古未来主义美学，温暖塑料材质、实体按钮、单色显示器
- 系统间独立运作又相互配合，创造既有规则约束又富有叙事灵活性的游戏体验

## 技术架构

### 架构模式
- **桌面应用** - 单机运行，无需服务器
- **前端界面** - 现代化UI框架（React/Vue）
- **本地后端** - Tauri的Rust后端提供系统级功能
- **本地存储** - JSON文件存储所有数据
- **AI集成** - 直接调用外部AI API

### 架构优势
```
桌面应用架构：
┌─────────────────────────────────┐
│         Tauri 应用窗口           │
├─────────────────────────────────┤
│  前端界面 (React/Vue)            │
│  - UI组件和交互逻辑              │
│  - 状态管理                      │
│  - 本地业务逻辑                  │
├─────────────────────────────────┤
│  Tauri Core (Rust后端)           │
│  - 文件系统操作                  │
│  - 系统API调用                   │
│  - 安全的存储访问                │
└─────────────────────────────────┘
         ↓ HTTPS
    AI API 服务器
```

## 技术栈

### 核心框架
- **桌面框架**：Tauri 2.0+
  - 轻量级（比Electron小10倍）
  - 基于系统WebView
  - Rust后端，高性能且安全
  - 原生系统API访问

### 前端技术
- **框架**：React 19.2.0
- **构建工具**：Vite 7.2.4
- **路由**：React Router 7.11.0
- **状态管理**：Zustand 5.0.9
- **样式方案**：Tailwind CSS 4.1.18 (全新 @theme 语法)
- **视觉风格**：Cassette Futurism - 复古未来主义美学
  - 温暖塑料米色色调 (oklch color space)
  - 实体按钮凸起效果 (box-shadow bevels)
  - 点阵字体 (Press Start 2P + IBM Plex Mono)
  - CRT扫描线效果 (subtle scanlines)
  - 物理LED指示灯动画
- **HTTP客户端**：Fetch API（调用AI API用）

### 本地后端（Tauri）
- **语言**：Rust（Tauri自带，无需额外编写太多代码）
- **功能**：
  - 文件系统访问（读写存档文件）
  - 系统对话框（保存/打开文件）
  - 应用配置管理
  - 安全的API密钥存储

### 数据存储
- **格式**：JSON文件
- **位置**：用户文档目录（如 `~/Documents/AI-TRPG/`）
- **结构**：
  - `config.json` - 应用配置和AI设置
  - `saves/` - 存档文件目录
  - `data/` - 静态数据（世界线、天赋等）

### AI集成
- **模型接口**：OpenAI兼容的HTTP API
- **支持模型**：DeepSeek v3.2 / GPT-4 / Claude / 其他兼容模型
- **提示词管理**：模板字符串 + JSON配置文件
- **对话管理**：前端内存管理 + JSON持久化

### 开发工具
- **包管理器**：pnpm / npm
- **代码规范**：ESLint + Prettier
- **类型检查**：TypeScript（推荐）
- **版本控制**：Git
- **Rust工具链**：rustc + cargo（Tauri CLI会自动安装）

## 项目结构

```
ai-trpg-engine/
├── src-tauri/               # Tauri后端（Rust）
│   ├── src/
│   │   ├── main.rs          # Rust主程序入口
│   │   ├── commands.rs      # Tauri命令（前端调用的Rust函数）
│   │   └── lib.rs           # Rust库文件
│   ├── Cargo.toml           # Rust依赖配置
│   ├── tauri.conf.json      # Tauri应用配置
│   └── icons/               # 应用图标
│
├── src/                     # 前端源码
│   ├── components/          # UI组件
│   │   ├── common/          # 通用组件（按钮、卡片等）
│   │   ├── character/       # 角色相关组件
│   │   │   ├── AttributeDisplay.tsx   # COC属性展示
│   │   │   ├── TalentCard.tsx         # 天赋卡片
│   │   │   └── CharacterSheet.tsx     # 角色面板
│   │   ├── game/            # 游戏界面组件
│   │   │   ├── StoryDisplay.tsx       # 故事文本展示
│   │   │   ├── CheckRoller.tsx        # 判定UI
│   │   │   └── ActionInput.tsx        # 行动输入
│   │   ├── worldline/       # 世界线组件
│   │   │   └── WorldlineCard.tsx      # 世界线选择卡片
│   │   └── lorebook/        # Lorebook组件 (★新增)
│   │       ├── LorebookEditor.tsx     # Lorebook主编辑器
│   │       ├── LorebookEntryCard.tsx  # 条目卡片
│   │       ├── LorebookEntryForm.tsx  # 条目编辑表单
│   │       └── index.ts               # 组件导出
│   ├── pages/               # 页面组件
│   │   ├── Landing.tsx      # 启动页
│   │   ├── Config.tsx       # 配置页
│   │   ├── CharacterCreation.tsx  # 角色创建页
│   │   ├── GameMain.tsx     # 游戏主界面
│   │   └── LorebookManagement.tsx  # Lorebook管理页 (★新增)
│   ├── stores/              # 状态管理
│   │   ├── gameStore.ts     # 游戏状态
│   │   └── characterStore.ts # 角色状态
│   ├── services/            # 业务逻辑服务
│   │   ├── characterService.ts  # 角色生成逻辑
│   │   ├── lorebookService.ts   # Lorebook激活逻辑 (★已实现)
│   │   ├── diceService.ts       # 判定系统
│   │   ├── aiService.ts         # AI调用封装
│   │   └── promptService.ts     # 提示词管理
│   ├── utils/               # 工具函数
│   │   ├── types.ts         # TypeScript类型定义 (★完整)
│   │   ├── random.ts        # 随机数生成（正态分布等）
│   │   └── tauri.ts         # Tauri API封装
│   ├── data/                # 静态数据（打包进应用）
│   │   ├── worldlines.json  # 世界线配置
│   │   ├── talents.json     # 天赋池
│   │   ├── backgrounds.json # 身份背景
│   │   └── prompts/         # 提示词模板
│   │       ├── base.txt     # 基础系统提示
│   │       └── worldline/   # 各世界线的提示词
│   ├── assets/              # 资源文件
│   │   ├── images/          # 图片资源
│   │   └── styles/          # 全局样式
│   ├── App.jsx              # 应用根组件
│   ├── main.jsx             # 前端入口
│   └── tauri.js             # Tauri API封装
│
├── public/                  # 静态资源
├── package.json             # 前端依赖
├── vite.config.js           # Vite配置
└── tailwind.config.js       # Tailwind配置
README.md                # 本文档
```

### 运行时数据目录结构（用户文档目录）

应用会在用户文档目录创建数据文件夹：

```
~/Documents/AI-TRPG/        # Windows: %USERPROFILE%\Documents\AI-TRPG
├── config.json             # 应用配置
│   └── {
│       "aiProvider": "deepseek",
│       "apiKey": "sk-xxx",
│       "apiBaseUrl": "https://api.deepseek.com/v1",
│       "modelName": "deepseek-chat",
│       "backupUrl": "...",
│       "dmStyle": "humanistic",
│       "autoSave": true,
│       "autoSaveInterval": 30
│     }
│
├── saves/                  # 存档目录
│   ├── character_1.json    # 角色存档
│   ├── character_2.json
│   └── ...
│
└── logs/                   # 日志文件（可选）
    └── app.log
```

### 存档文件格式示例

```json
{
  "version": "1.0",
  "character": {
    "id": "char_123",
    "name": "法丽达",
    "birthYear": 1075,
    "gender": "female",
    "worldlineId": "byzantine_1075",
    "backgrounds": ["山民后代", "城堡依附者"],
    "attributes": {
      "constitution": 49,
      "perception": 52,
      "adaptability": 53,
      "familyBond": 54,
      "latentTalent": 44
    },
    "talents": [
      {
        "id": "talent_tradition",
        "name": "保持传统与主义者",
        "rarity": "common"
      }
    ],
    "currentAge": 1
  },
  "gameSession": {
    "currentTurn": 5,
    "dialogueHistory": [
      {
        "role": "assistant",
        "content": "【出生：伊斯兰历468年】...",
        "timestamp": "2024-12-19T10:30:00Z"
      }
    ],
    "eventLog": ["出生于阿勒颇", "开始学习编织"],
    "checkHistory": [
      {
        "turn": 3,
        "attribute": "adaptability",
        "diceValue": 45,
        "result": "success"
      }
    ]
  },
  "metadata": {
    "createdAt": "2024-12-19T10:00:00Z",
    "lastSavedAt": "2024-12-19T10:45:00Z",
    "playTime": 2700
  }
}
```

## 核心功能模块

### 1. 世界线系统 + Lorebook
**功能**：管理不同的历史时期背景设定，并为每个世界线提供动态知识库

**数据结构**：
- 世界线ID、名称、时代、地理描述
- 文化特征、历史背景文本
- COC风格8维属性生成参数（μ和σ值）
- 该世界特有的天赋池和技能池引用
- **嵌入式Lorebook**：每个世界线可配置独立的知识库

**Lorebook系统**（基于SillyTavern规范）：
- **触发机制**：关键词匹配（支持正则表达式、大小写敏感）
- **次级过滤**：AND_ANY / AND_ALL / NOT_ANY / NOT_ALL 逻辑
- **递归扫描**：激活的条目内容可以触发其他条目（最多3层深度）
- **时序控制**：
  - Sticky: 激活后保持N条消息
  - Cooldown: 激活后N条消息内不可重新触发
  - Delay: 至少有N条消息才可激活
- **包含组**：同组内仅一个条目被激活（避免冲突）
- **插入顺序**：控制上下文注入的优先级

**实现要点**：
- 世界线数据存储在JSON配置文件中
- Lorebook服务 (`lorebookService.ts`) 处理动态激活
- 支持动态加载和扩展
- 前端展示为选择卡片，包含详细信息

**Lorebook 编辑界面** (★已实现)：
完整的 Lorebook 管理和编辑系统，包含以下组件：

1. **LorebookManagement 页面** (`src/pages/LorebookManagement.tsx`)
   - Lorebook 列表视图
   - 创建、删除、选择知识库
   - 知识库统计信息展示

2. **LorebookEditor 组件** (`src/components/lorebook/LorebookEditor.tsx`)
   - 全局设置编辑（扫描深度、递归扫描、Token预算）
   - 条目搜索和过滤
   - 条目列表管理
   - 条目状态切换（启用/禁用）

3. **LorebookEntryCard 组件** (`src/components/lorebook/LorebookEntryCard.tsx`)
   - 条目信息展示（标题、关键词、内容预览）
   - 高级选项指示器（次级过滤、Sticky、Cooldown等）
   - 快速操作（编辑、删除、启用/禁用）
   - Cassette Futurism 风格UI

4. **LorebookEntryForm 组件** (`src/components/lorebook/LorebookEntryForm.tsx`)
   - 分标签页编辑（基础设置、高级选项、时序控制）
   - 关键词管理（支持正则表达式、大小写敏感）
   - 次级关键词和过滤逻辑
   - 包含组和权重设置
   - Sticky/Cooldown/Delay 时序控制

**编辑界面特性**：
- 实时搜索和过滤条目
- 拖放式关键词管理
- 可视化高级选项指示器
- 模态框编辑表单
- 完整的表单验证
- Cassette Futurism 设计风格

**大型设定集支持** (★已实现)：
完整支持导入和管理大型世界设定文档（如45KB+的复杂设定集）

1. **WorldlineManager 组件** (`src/components/worldline/WorldlineManager.tsx`)
   - 自定义世界线创建和管理
   - **三种导入模式**：
     - **📁 文件夹导入（推荐）**：选择包含多个.md/.txt文件的目录，自动递归读取全部内容
     - 单个文件上传（.txt, .md）
     - 文本粘贴
   - 自动检测文件格式（Markdown/纯文本）
   - 设定文档大小显示（KB/MB）

2. **文件夹导入功能** (`src/services/settingImportService.ts`)：
   - **Tauri 后端支持**：`read_directory_structure` 命令递归读取目录
   - **保留目录层次**：将文件夹结构转换为 `SettingCategory` 层次结构
   - **智能文档识别**：自动识别.md和.txt文件，提取标题和标签
   - **批量处理**：一次性导入整个设定集文件夹，支持数十个文件
   - **文件统计**：显示导入的文件数量和总大小

3. **自动拆分为 Lorebook**：
   - 将大型设定文档自动拆分为多个 Lorebook 条目
   - 按段落智能分割（每个文档最多10个段落，总计可达数百条目）
   - 自动提取关键词（每段落前5个有意义词汇）
   - 自动设置插入优先级（100+范围）
   - 限制单条目长度（最大500字符）

4. **自由世界观支持** (`src/utils/types.ts`)：
   - **世界类型**：historical（历史）、alternate_history（架空历史）、fantasy（奇幻）、sci-fi（科幻）、cyberpunk（赛博朋克）、post_apocalyptic（末日废土）、custom（自定义）
   - **物理规则**：自定义世界的物理法则（如"魔法存在"、"赛博改造普及"）
   - **科技水平**：从"石器时代"到"星际文明"任意设定
   - **魔法体系**：描述魔法/超自然力量的运作方式
   - **社会结构**：政治体制、阶级结构等
   - **货币系统**：金币、信用点、以太币等任意设定
   - **独特特性**：世界的特殊规则和现象

5. **数据结构扩展**：
   - `SettingDocument`: 单个大型设定文档（支持Markdown和纯文本）
   - `SettingCategory`: 分层级的设定集合结构（支持无限嵌套）
   - Worldline 扩展字段：
     - `settingDocument`: 完整设定文本
     - `settingCategories`: 层次化设定分类
     - `settingSize`: 设定大小（字节）
     - `settingFileCount`: 文件数量
     - `settingAutoSplit`: 是否启用自动拆分
     - `worldType`, `physicsRules`, `magicSystem`: 自由世界观字段
     - `version`, `author`, `createdAt`, `updatedAt`: 版本控制

6. **持久化支持**：
   - 通过 Tauri 命令保存/加载自定义世界线
   - JSON 格式存储在 `~/Documents/AI-TRPG/worldlines/`
   - 完整保留原始设定文档、目录结构和生成的 Lorebook

**使用场景**：
- 导入完整的世界观设定集（如赛博朋克2077设定集、克苏鲁神话背景）
- 复杂历史背景资料（如拜占庭帝国全史）
- 自创世界的详细设定（地理、历史、文化、政治等，多个.md文件组织）
- 完全架空的世界（奇幻世界、星际文明、末日废土等）
- AI 可根据对话内容动态加载相关设定片段，无需一次性加载全部内容

**导入示例**：
```
MyWorld/
├── 世界观.md
├── 历史/
│   ├── 上古时代.md
│   └── 现代.md
├── 地理/
│   ├── 大陆.md
│   └── 城市.md
└── 种族/
    ├── 人类.md
    └── 精灵.md
```
选择 `MyWorld` 文件夹，系统自动读取全部6个文件，构建为3层 SettingCategory 结构。

### 2. 角色生成系统（COC风格 + SillyTavern Character Card V2兼容）
**功能**：基于世界线参数生成角色初始属性和天赋，支持导出为标准Character Card格式

**COC风格属性系统**：
- **基础属性** (8项，0-100)：
  - STR (力量)、CON (体质)、DEX (敏捷)、INT (智力)
  - EDU (教育)、POW (意志)、CHA (魅力)、LUC (幸运)
- **派生属性**：
  - HP = (CON + STR) / 2
  - SAN = POW
  - MP = POW / 5
  - MOV = 根据年龄和DEX/STR计算
- **技能系统**：通用技能 + 世界线特有技能

**核心算法**：
- 属性生成：使用Box-Muller变换实现正态分布随机数
- 参数来源：世界线配置的μ（均值）和σ（标准差）
- 属性范围：0-100，超出范围截断处理

**天赋抽取机制**：
- 从天赋池中按稀有度加权随机抽取9个天赋
- 稀有度权重：common(50), uncommon(25), rare(15), epic(8), legendary(2)
- 分为3组，每组3选1
- 用户选择3个天赋作为角色核心特质

**Character Card V2兼容**：
角色数据可导出为SillyTavern Character Card V2格式，包含：
- 基础字段：name, description, personality, scenario, first_mes, mes_example
- V2扩展：system_prompt, post_history_instructions, alternate_greetings
- 嵌入式character_book (Lorebook)
- tags, creator, character_version, extensions

**简历级详细信息** (★已实现)：
角色创建支持可选的详细履历信息（折叠在"高级设置"中）：

1. **DetailedProfile 数据结构** (`src/utils/types.ts`)：
   - **外貌描述**：身高、体重、发色、瞳色、肤色、显著特征、总体描述
   - **教育经历**：教育机构、学位、专业领域、起止年份、描述
   - **工作经历**：组织、职位、起止年份、职责描述、成就
   - **人际关系**：名称、关系类型、描述、状态、影响
   - **性格特征**：特征名称、描述、强度（0-100）
   - **信仰与价值观**：信仰列表、核心价值观列表
   - **恐惧与弱点**：恐惧列表、弱点列表
   - **目标与动机**：人生目标、内在动机
   - **爱好与兴趣**：爱好列表、兴趣领域
   - **语言能力**：语言及熟练度（native/fluent/conversational/basic）
   - **财产与资源**：财富等级、财产列表、人脉资源
   - **重要事件**：年份、事件、影响
   - **其他备注**：自由文本

2. **DetailedProfileEditor 组件** (`src/components/character/DetailedProfileEditor.tsx`)：
   - 折叠式高级设置面板（点击展开/收起）
   - LED 指示灯显示面板状态
   - 结构化输入表单（外貌、目标、信仰、恐惧等）
   - 列表管理组件（支持添加/删除多个条目）
   - Cassette Futurism 风格设计

**前端交互**：
- 角色名称、性别、年龄、身份背景输入
- 属性展示（COC风格属性面板）
- 天赋选择UI：3组9宫格，每组必选1个
- **高级设置折叠面板**：可选填写详细履历信息
- 只有完成所有选择后"开始游戏"按钮才可用

### 3. 判定系统
**功能**：提供基于属性的随机判定机制

**判定流程**：
1. 用户选择使用哪个属性进行判定（或系统自动指定）
2. 生成0-100随机数作为骰值
3. 根据骰值和属性值判定结果：
   - 0-5：大成功（Critical Success）
   - 5-属性值：成功（Success）
   - 属性值-95：失败（Failure）
   - 95-100：大失败（Critical Failure）
4. 将判定结果返回给AI作为上下文

**实现要点**：
- 前端显示判定动画（骰子滚动效果）
- 判定结果以视觉化方式呈现（颜色编码）
- 判定历史记录存储用于回顾

### 4. 天赋系统
**功能**：通过AI提示词影响游戏叙事

**设计理念**：
- 天赋特质**不直接**修改数值属性
- 天赋通过注入AI系统提示词来影响叙事内容
- 数值判定和叙事影响是两个独立但互补的系统

**数据结构**：
- 天赋ID、名称、描述文本
- 稀有度等级（普通、稀有、史诗、传说）
- AI提示词片段（描述该天赋如何影响角色行为和命运）

**实现方式**：
- 角色的3个天赋在每次AI调用时注入系统提示词
- 提示词描述："角色拥有[天赋名]特质，这意味着..."
- AI根据这些特质调整叙事风格和事件走向

### 5. AI叙事引擎
**功能**：生成动态故事内容并响应玩家行动

**提示词架构**：
```
系统提示词结构：
├── 基础角色定义（DM身份、游戏规则）
├── 世界线背景（历史时期、文化特征）
├── 角色信息
│   ├── 基础资料（姓名、年龄、身份）
│   ├── 五维属性当前值
│   └── 天赋特质描述（核心影响部分）
├── 游戏状态
│   ├── 当前年龄/回合数
│   ├── 重要事件摘要
│   └── 最近的判定结果
└── 交互指令（如何响应判定、如何推进故事）
```

**对话管理**：
- 维护完整的对话历史数组
- 实现滑动窗口或智能摘要避免超出token限制
- 关键事件标记为"重要"，优先保留在上下文中

**API调用策略**：
- 主节点配置 + 备用节点列表
- 失败自动重试和切换
- 流式响应（SSE）提升用户体验（可选）

### 6. 游戏主循环
**功能**：管理游戏的进行流程

**流程设计**：
```
1. AI生成当前情境叙事
   ↓
2. 玩家阅读并决定行动
   ↓
3. 两种行动方式：
   a. 选择属性进行判定（系统生成判定结果）
   b. 输入自定义行动描述（可能触发判定或直接推进）
   ↓
4. 将行动和判定结果发送给AI
   ↓
5. AI根据结果生成后续叙事
   ↓
回到步骤1
```

**状态同步**：
- 每个回合的状态变化实时保存
- 关键节点自动创建存档点
- 支持手动保存/读取

### 7. 存档系统
**功能**：保存和恢复游戏进度到本地文件

**文件操作通过Tauri**：
```javascript
// 前端调用Tauri命令保存存档
import { invoke } from '@tauri-apps/api/tauri';

// 保存存档
await invoke('save_game', {
  filename: 'character_1.json',
  data: JSON.stringify(saveData)
});

// 读取存档
const saveData = await invoke('load_game', {
  filename: 'character_1.json'
});

// 列出所有存档
const saves = await invoke('list_saves');
```

**Rust后端命令**（在`src-tauri/src/commands.rs`中）：
```rust
use std::fs;
use std::path::PathBuf;
use tauri::api::path::document_dir;

#[tauri::command]
fn save_game(filename: String, data: String) -> Result<(), String> {
    let save_dir = get_save_directory()?;
    fs::create_dir_all(&save_dir).map_err(|e| e.to_string())?;
    
    let file_path = save_dir.join(filename);
    fs::write(file_path, data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_game(filename: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    let file_path = save_dir.join(filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

fn get_save_directory() -> Result<PathBuf, String> {
    let doc_dir = document_dir().ok_or("无法获取文档目录")?;
    Ok(doc_dir.join("AI-TRPG").join("saves"))
}
```

**实现要点**：
- 自动保存：游戏进行中每N个回合自动保存
- 手动保存：用户可随时保存当前进度
- 导出/导入：使用系统文件对话框选择位置
- 存档列表：扫描saves目录，显示存档元数据

## 数据模型设计

所有数据模型都以JSON格式存储和传输，不涉及数据库。

### Worldline（世界线）- 静态数据
存储在 `src/data/worldlines.json`

```json
{
  "id": "byzantine1075",
  "name": "十字军阴影下的波斯山区 (AD 1075)",
  "description": "这里是11世纪的波斯北部...",
  "culture": ["伊斯兰文化", "山地部落", "商队贸易"],
  "special":{ //特色内容
    "none"
  }
  "attributeParams": {
    "constitution": { "mu": 50, "sigma": 15 },
    ......
  },
  "talentPoolIds": ["medieval_common", "mountain_life", "trade_skills"]
}
```

### Talent（天赋）- 静态数据
存储在 `src/data/talents.json`

```json
{
  "id": "talent_tradition",
  "name": "保持传统与主义者",
  "description": "倾向于延续社群传统，避免外部争端",
  "aiPromptFragment": "角色天生具有保守的性格，重视传统价值观和社群稳定，在面对外来文化冲突时倾向于维护本地传统。这会影响角色在遭遇文化冲突、宗教争端、社会变革时的反应和选择。",
  "rarity": "common",
  "category": "社会适应",
  "icon": "🛡️"
}
```

### Character（角色）- 运行时数据
存储在前端状态 + 存档文件

```typescript
interface Character {
  id: string;
  name: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other';
  worldlineId: string;
  backgrounds: string[];
  attributes: {
    constitution: number;      //1-100
    ......
  };
  talents: {
    id: string;
    name: string;
    description: string;
    aiPromptFragment: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }[];
  currentAge: number;
  createdAt: string;
}
```

### GameSession（游戏会话）- 运行时数据
存储在前端状态 + 存档文件

```typescript
interface GameSession {
  id: string;
  characterId: string;
  dialogueHistory: Message[];
  eventLog: string[];
  checkHistory: Check[];
  currentTurn: number;
  status: 'active' | 'paused' | 'ended';
  lastSavedAt: string;
}

interface Message {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
  metadata?: {
    checkResult?: Check;
    eventType?: string;
  };
}

interface Check {
  turn: number;
  attribute: 'constitution' | 'perception' | 'adaptability' | 'familyBond' | 'latentTalent';
  diceValue: number;
  attributeValue: number;
  result: 'criticalSuccess' | 'success' | 'failure' | 'criticalFailure';
  context: string;
  timestamp: string;
}
```

### AppConfig（应用配置）- 持久化数据
存储在 `~/Documents/AI-TRPG/config.json`

```typescript
interface AppConfig {
  ai: {
    provider: string;          // 'deepseek' | 'openai' | 'custom'
    apiKey: string;
    apiBaseUrl: string;
    modelName: string;
    backupUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  game: {
    dmStyle: string;           // 'humanistic' | 'realistic' | 'dramatic'
    autoSave: boolean;
    autoSaveInterval: number;  // 秒
    language: string;          // 'zh-CN' | 'en-US'
  };
  ui: {
    theme: string;             // 'dark' | 'light'
    fontSize: number;
    animationEnabled: boolean;
  };
}
```

## 开发路线图

### Phase 1: 项目初始化和Tauri配置（1天）
- [ ] 创建Vite + React/Vue项目
- [ ] 添加Tauri依赖：`npm install -D @tauri-apps/cli`
- [ ] 初始化Tauri：`npm run tauri init`
- [ ] 配置`tauri.conf.json`（应用名称、窗口大小等）
- [ ] 配置Tailwind CSS和UI组件库
- [ ] 测试Tauri基础功能（能否成功启动应用窗口）
- [ ] 配置开发环境（ESLint、Prettier）

### Phase 2: 静态数据准备（1天）
- [ ] 创建世界线配置JSON文件（至少3个世界线）
- [ ] 创建天赋池JSON文件（每个稀有度至少10个天赋）
- [ ] 创建身份背景JSON文件
- [ ] 设计提示词模板结构
- [ ] 准备UI资源（图标、主题颜色等）

### Phase 3: 基础UI和路由（2天）
- [ ] 实现启动页（Logo + 开始按钮）
- [ ] 建立路由系统（4个主要页面）
- [ ] 实现世界线选择页面
  - [ ] 世界线卡片组件
  - [ ] 性别选择
  - [ ] 转生按钮
- [ ] 设计和实现深色主题样式
- [ ] 实现页面间导航逻辑

### Phase 4: 角色生成系统（2-3天）
- [ ] 实现正态分布随机数生成器（Box-Muller算法）
- [ ] 开发五维属性生成算法
- [ ] 创建属性可视化组件
  - [ ] 雷达图（可使用Chart.js或Recharts）
  - [ ] 进度条展示
- [ ] 实现天赋抽取算法（加权随机）
- [ ] 开发天赋选择UI（3x3网格，三选一机制）
- [ ] 实现角色创建表单
  - [ ] 名字输入
  - [ ] 身份背景多选
- [ ] 前端状态管理：角色创建流程
- [ ] "开始游戏"按钮激活逻辑

### Phase 5: Tauri文件操作集成（1-2天）
- [ ] 编写Rust命令：`save_game`
- [ ] 编写Rust命令：`load_game`
- [ ] 编写Rust命令：`list_saves`
- [ ] 编写Rust命令：`save_config`
- [ ] 编写Rust命令：`load_config`
- [ ] 前端封装文件服务（`fileService.js`）
- [ ] 测试文件读写功能
- [ ] 实现自动创建数据目录

### Phase 6: 判定系统（1-2天）
- [ ] 实现判定逻辑（`diceService.js`）
  - [ ] 骰值生成（0-100随机数）
  - [ ] 结果计算（大成功/成功/失败/大失败）
- [ ] 开发判定UI组件
  - [ ] 属性选择器
  - [ ] 骰子动画（可选）
  - [ ] 结果展示（颜色编码）
- [ ] 判定历史记录功能
- [ ] 集成到游戏主循环

### Phase 7: AI服务集成（2-3天）
- [ ] 设计提示词模板系统（`promptService.js`）
  - [ ] 基础系统提示
  - [ ] 世界线背景注入
  - [ ] 角色信息注入
  - [ ] 天赋特质注入
  - [ ] 判定结果注入
- [ ] 实现AI调用服务（`aiService.js`）
  - [ ] HTTP请求封装
  - [ ] 重试机制
  - [ ] 错误处理
  - [ ] 多节点切换
- [ ] 对话历史管理
  - [ ] 滑动窗口（保留最近N条）
  - [ ] 关键事件标记
- [ ] 测试和优化提示词效果

### Phase 8: 游戏主界面（3-4天）
- [ ] 实现游戏主界面布局（左右分栏）
- [ ] 左侧角色信息面板
  - [ ] 角色基础信息展示
  - [ ] 五维属性实时显示
  - [ ] 天赋列表（悬停显示详情）
  - [ ] 当前状态（年龄、回合数）
- [ ] 右侧游戏区域
  - [ ] 故事文本展示区
    - [ ] 消息列表
    - [ ] 自动滚动到最新
    - [ ] 角色区分（AI/玩家）
  - [ ] 判定/行动区域
    - [ ] 判定按钮组
    - [ ] 自定义行动输入框
    - [ ] 提交按钮
- [ ] 实现游戏主循环逻辑
  - [ ] AI生成 → 玩家行动 → 判定 → AI响应
- [ ] 加载状态和错误提示
- [ ] AI响应打字机效果（可选）

### Phase 9: 配置系统（1天）
- [ ] 配置页面UI实现
  - [ ] AI提供商选择
  - [ ] API密钥输入（安全显示）
  - [ ] 模型配置
  - [ ] DM风格选择
  - [ ] 界面设置
- [ ] 配置加载和保存逻辑
- [ ] 首次运行向导（引导用户配置API）
- [ ] 配置验证（测试API连接）

### Phase 10: 存档系统完善（1-2天）
- [ ] 实现自动保存功能
  - [ ] 定时保存（可配置间隔）
  - [ ] 状态变化触发保存
- [ ] 实现手动保存功能
  - [ ] 保存按钮
  - [ ] 保存成功提示
- [ ] 实现存档列表UI
  - [ ] 扫描并显示所有存档
  - [ ] 显示存档元数据（角色名、时间等）
  - [ ] 继续游戏按钮
  - [ ] 删除存档按钮
- [ ] 导出/导入功能
  - [ ] 使用Tauri的文件对话框
  - [ ] 导出为任意位置
  - [ ] 从任意位置导入

### Phase 11: 优化和细节打磨（2-3天）
- [ ] 完整游戏流程测试
- [ ] 性能优化
  - [ ] 组件懒加载
  - [ ] 虚拟滚动（长对话历史）
  - [ ] 图片资源优化
- [ ] 错误边界和异常处理
- [ ] 用户体验优化
  - [ ] 按键快捷键（保存、回退等）
  - [ ] 界面动画和过渡
  - [ ] 响应式布局适配
- [ ] AI提示词迭代优化
- [ ] 边界情况处理（网络失败、存档损坏等）

### Phase 12: 打包和测试（1天）
- [ ] 使用`npm run tauri build`构建应用
- [ ] 测试打包后的应用
- [ ] 检查应用体积和性能
- [ ] 准备应用图标
- [ ] 编写用户使用文档（README）
- [ ] 测试在干净系统上的运行情况

**总预计时间：2-3周**

## 关键技术决策

### 桌面框架选择
**决定：Tauri 2.0**

理由：
- **体积小**：打包体积只有5-15MB，比Electron小10倍
- **性能好**：使用系统原生WebView，内存占用低
- **安全性高**：Rust后端，类型安全且内存安全
- **开发体验**：前端使用熟悉的Web技术栈
- **跨平台**：Windows、macOS、Linux一套代码

替代方案：
- Electron：更成熟但体积大（100MB+）
- NW.js：生态较小

### 前端框架选择
**建议：React + Vite**

理由：
- React生态成熟，组件库丰富
- Vite提供极快的开发体验
- 便于后期集成各种动画和可视化库
- Tauri官方示例多使用React

替代方案：
- Vue 3：同样优秀，看个人偏好
- Svelte：更轻量但生态较小

### 状态管理方案
**建议：Zustand**

理由：
- 轻量级（<1KB），API简洁
- 不需要Provider包裹
- 支持TypeScript
- 适合中小型项目

替代方案：
- Redux Toolkit：更重量级，适合大型项目
- Jotai/Recoil：原子化状态，学习曲线稍高

### 数据存储策略
**决定：本地JSON文件**

理由：
- **简单直接**：无需配置数据库
- **便于调试**：可以直接查看和编辑JSON
- **易于备份**：用户可以直接复制文件
- **透明度高**：用户完全掌控自己的数据

数据量评估：
- 单个存档：10-100KB（包含完整对话历史）
- 配置文件：1-5KB
- 对于单机TRPG应用，文件存储完全足够

### AI接口设计
**决定：直接从前端调用AI API**

理由：
- 桌面应用中API密钥存储在本地配置文件中
- 不存在密钥暴露风险（不像Web前端）
- 简化架构，无需后端转发
- Tauri可以安全地存储敏感配置

实现方式：
```javascript
// 从配置读取API密钥
const config = await invoke('load_config');

// 直接调用AI API
const response = await fetch(config.ai.apiBaseUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.ai.apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

### 提示词管理策略
**决定：混合式管理**

- **基础提示词**：代码中的模板字符串（便于版本控制）
- **世界线提示词**：静态数据JSON文件中
- **用户自定义**：配置文件中，允许用户调整DM风格
- **运行时组装**：在`promptService.js`中动态组合

## Tauri配置

### tauri.conf.json 配置示例

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "AI人生引擎",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "scope": ["$DOCUMENT/*"]
      },
      "dialog": {
        "all": true
      },
      "path": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "identifier": "com.aitrpg.engine",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "AI人生引擎",
        "width": 1400,
        "height": 900,
        "resizable": true,
        "fullscreen": false,
        "minWidth": 1200,
        "minHeight": 800
      }
    ]
  }
}
```

### Rust依赖配置（Cargo.toml）

大部分依赖由Tauri CLI自动生成，可能需要手动添加：

```toml
[dependencies]
tauri = { version = "2.0", features = ["dialog-all", "fs-all", "path-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## Tauri命令（前端调用Rust函数）

桌面应用不需要HTTP API，前端通过Tauri命令直接调用Rust后端函数。

### 文件操作命令

```rust
// src-tauri/src/commands.rs

use std::fs;
use std::path::PathBuf;
use tauri::api::path::document_dir;

// 保存游戏存档
#[tauri::command]
fn save_game(filename: String, data: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    fs::create_dir_all(&save_dir).map_err(|e| e.to_string())?;
    
    let file_path = save_dir.join(&filename);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;
    
    Ok(format!("存档已保存: {}", filename))
}

// 读取游戏存档
#[tauri::command]
fn load_game(filename: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    let file_path = save_dir.join(&filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// 列出所有存档
#[tauri::command]
fn list_saves() -> Result<Vec<String>, String> {
    let save_dir = get_save_directory()?;
    
    if !save_dir.exists() {
        return Ok(Vec::new());
    }
    
    let entries = fs::read_dir(save_dir).map_err(|e| e.to_string())?;
    let saves: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|s| s.to_str()) == Some("json"))
        .filter_map(|e| e.file_name().to_str().map(String::from))
        .collect();
    
    Ok(saves)
}

// 删除存档
#[tauri::command]
fn delete_save(filename: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    let file_path = save_dir.join(&filename);
    fs::remove_file(file_path).map_err(|e| e.to_string())?;
    Ok(format!("存档已删除: {}", filename))
}

// 保存配置
#[tauri::command]
fn save_config(config: String) -> Result<(), String> {
    let config_path = get_config_path()?;
    fs::write(config_path, config).map_err(|e| e.to_string())
}

// 读取配置
#[tauri::command]
fn load_config() -> Result<String, String> {
    let config_path = get_config_path()?;
    
    if !config_path.exists() {
        // 返回默认配置
        return Ok(get_default_config());
    }
    
    fs::read_to_string(config_path).map_err(|e| e.to_string())
}

// 辅助函数
fn get_save_directory() -> Result<PathBuf, String> {
    let doc_dir = document_dir().ok_or("无法获取文档目录")?;
    Ok(doc_dir.join("AI-TRPG").join("saves"))
}

fn get_config_path() -> Result<PathBuf, String> {
    let doc_dir = document_dir().ok_or("无法获取文档目录")?;
    Ok(doc_dir.join("AI-TRPG").join("config.json"))
}

fn get_default_config() -> String {
    r#"{
        "ai": {
            "provider": "deepseek",
            "apiKey": "",
            "apiBaseUrl": "https://api.deepseek.com/v1",
            "modelName": "deepseek-chat"
        },
        "game": {
            "dmStyle": "humanistic",
            "autoSave": true,
            "autoSaveInterval": 30
        }
    }"#.to_string()
}
```

### 在main.rs中注册命令

```rust
// src-tauri/src/main.rs

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::save_game,
            commands::load_game,
            commands::list_saves,
            commands::delete_save,
            commands::save_config,
            commands::load_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 前端调用示例

```javascript
// src/services/fileService.js
import { invoke } from '@tauri-apps/api/tauri';

export const fileService = {
  // 保存游戏
  async saveGame(filename, gameData) {
    try {
      const result = await invoke('save_game', {
        filename,
        data: JSON.stringify(gameData, null, 2)
      });
      return { success: true, message: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  // 加载游戏
  async loadGame(filename) {
    try {
      const data = await invoke('load_game', { filename });
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      return { success: false, error };
    }
  },

  // 列出存档
  async listSaves() {
    try {
      const saves = await invoke('list_saves');
      return { success: true, saves };
    } catch (error) {
      return { success: false, error };
    }
  },

  // 删除存档
  async deleteSave(filename) {
    try {
      const result = await invoke('delete_save', { filename });
      return { success: true, message: result };
    } catch (error) {
      return { success: false, error };
    }
  },

  // 保存配置
  async saveConfig(config) {
    try {
      await invoke('save_config', {
        config: JSON.stringify(config, null, 2)
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // 加载配置
  async loadConfig() {
    try {
      const data = await invoke('load_config');
      return { success: true, config: JSON.parse(data) };
    } catch (error) {
      return { success: false, error };
    }
  }
};
```

## 测试策略

### 单元测试
- 判定系统算法测试
- 正态分布随机数生成测试
- 天赋抽取算法测试
- 提示词构建函数测试

### 集成测试
- API端点测试
- 数据库操作测试
- AI调用流程测试

### 端到端测试
- 完整游戏流程测试（从角色创建到游戏进行）
- 存档保存和读取测试
- 错误场景测试（网络失败、AI调用失败等）

## 性能优化

### 前端优化
- **代码分割**：按路由分割（React.lazy + Suspense）
- **虚拟滚动**：对话历史很长时使用（react-window）
- **图片优化**：压缩静态资源，使用WebP格式
- **防抖节流**：用户输入、AI调用频率限制
- **内存管理**：定期清理旧对话历史（保留最近N条）

### AI调用优化
- **对话历史压缩**：保留最近20-30条消息，早期消息摘要化
- **并发控制**：限制同时只有一个AI调用
- **超时处理**：设置30秒超时，避免长时间等待
- **缓存机制**：相同输入缓存结果（谨慎使用，可能影响叙事多样性）

### 文件操作优化
- **延迟写入**：自动保存使用防抖，避免频繁写文件
- **增量保存**：只保存变化的部分（可选，初期可全量保存）
- **压缩存储**：对话历史很长时考虑gzip压缩（可选）

## 扩展性设计

### 功能扩展
- **新世界线**：通过添加JSON配置文件轻松扩展
- **自定义天赋**：支持用户创建和导入天赋包
- **模组系统**：支持第三方内容包（世界线+天赋+提示词）
- **多结局系统**：根据玩家选择记录不同的结局分支

### 技术扩展
- **云同步**（可选）：支持存档云备份（需要后端服务）
- **多语言**：使用i18n框架支持国际化
- **主题系统**：支持自定义UI主题
- **插件系统**：支持第三方功能插件

### AI能力扩展
- **多模型支持**：同时支持多个AI提供商，可切换
- **模型混用**：不同场景使用不同模型（叙事用大模型，快速判定用小模型）
- **本地模型**：支持Ollama等本地模型
- **多模态**：集成图像生成（角色肖像、场景插画）

## 安全考虑

### API密钥安全
- **本地存储**：API密钥存储在用户文档目录的配置文件中
- **文件权限**：配置文件应设置适当的访问权限（仅当前用户可读）
- **不要硬编码**：永远不要将API密钥硬编码在源代码中
- **密钥加密**（可选）：使用操作系统密钥链存储API密钥（高级功能）

### 用户输入安全
- **提示词注入防护**：清理用户输入，移除特殊控制字符
- **输入长度限制**：限制单次输入的最大长度
- **内容过滤**：可选地实现敏感内容检测

### 文件操作安全
- **路径验证**：Tauri的文件API自动限制访问范围
- **文件大小限制**：防止存档文件过大
- **备份机制**：保存前备份原文件，失败可恢复

## 开发工作流

### 分支策略
- `main` - 生产环境分支
- `develop` - 开发环境分支
- `feature/*` - 功能开发分支
- `bugfix/*` - 错误修复分支

### 提交规范
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具配置

### 代码审查
- 所有功能开发需要PR
- 至少一位审查者批准后合并
- 自动化测试通过要求

## 日志和调试

### 开发环境日志
- **浏览器控制台**：前端日志直接输出到DevTools
- **Rust日志**：在终端中查看Tauri后端日志
- **详细日志**：设置`RUST_LOG=debug`环境变量

### 生产环境日志（可选）
- **日志文件**：写入`~/Documents/AI-TRPG/logs/app.log`
- **日志级别**：ERROR, WARN, INFO
- **日志轮转**：按大小或日期轮转日志文件

### 错误追踪
- **本地错误日志**：捕获并记录未处理异常
- **用户反馈**：提供错误报告功能（复制错误信息）
- **调试模式**：开发构建包含详细错误堆栈

## 构建和运行

### 开发环境运行

1. **前提条件**
   - Node.js 18+
   - Rust（Tauri CLI会提示安装）
   - 系统特定依赖：
     - Windows: WebView2 (通常已预装)
     - macOS: 无额外要求
     - Linux: `webkit2gtk`, `libappindicator`

2. **安装依赖**
```bash
npm install
```

3. **开发模式启动**
```bash
npm run tauri dev
```

这会同时启动Vite开发服务器和Tauri应用窗口，支持热重载。

### 生产环境构建

1. **构建应用**
```bash
npm run tauri build
```

2. **构建产物位置**
   - Windows: `src-tauri/target/release/ai-trpg-engine.exe`
   - macOS: `src-tauri/target/release/bundle/dmg/AI人生引擎.dmg`
   - Linux: `src-tauri/target/release/bundle/appimage/ai-trpg-engine.AppImage`

3. **应用体积**
   - 预期大小：5-15MB（取决于前端资源大小）

### 首次运行设置

应用首次运行时会：
1. 自动创建数据目录 `~/Documents/AI-TRPG/`
2. 生成默认配置文件
3. 引导用户配置AI API密钥

## 故障排查指南

### 常见问题

**问题1：AI调用失败**
- 检查API密钥配置
- 检查网络连接和防火墙
- 查看AI服务状态
- 尝试切换备用节点

**问题2：判定结果不符合预期**
- 检查随机数生成器实现
- 验证判定逻辑（边界条件）
- 查看属性值是否正确传递

**问题3：对话历史丢失**
- 检查数据库连接
- 验证自动保存功能是否正常
- 查看浏览器控制台错误

**问题4：前端页面白屏**
- 检查浏览器控制台错误
- 验证API端点配置
- 检查路由配置

## 后续优化方向(不用做)

### 用户体验提升
- **成就系统**：记录玩家达成的特殊成就
- **回放功能**：回顾历史对话，支持分支重选
- **统计面板**：展示角色成长轨迹、判定统计等
- **快捷键**：支持键盘快捷操作

### 内容增强
- **角色关系网**：记录遇到的NPC和关系变化
- **世界状态追踪**：记录世界线的历史事件
- **多结局收集**：记录已达成的不同结局
- **剧情分支可视化**：树状图展示故事走向

### 技术优化
- **TypeScript迁移**：提升代码质量和可维护性
- **性能监控**：内置性能分析工具
- **自动更新**：支持应用内检查和更新
- **跨平台优化**：针对不同平台优化UI和体验

### AI增强
- **RAG集成**：引入知识库增强历史准确性
- **记忆系统**：AI记住长期游戏中的关键信息
- **情感分析**：分析玩家情绪调整叙事风格
- **角色语音**：集成TTS，为对话添加语音

### 社区功能（需要后端）
- **存档分享**：分享有趣的游戏历程
- **世界线工坊**：用户创作的世界线市场
- **排行榜**：基于特定成就的排行
- **社区讨论**：玩家交流游戏心得

---

## 最近更新 (2025-12-20)

### Lorebook 编辑界面实现 ✅
- 完整的 Lorebook 管理和编辑系统
- 4个主要组件：LorebookManagement, LorebookEditor, LorebookEntryCard, LorebookEntryForm
- 支持全部 SillyTavern World Info 特性
- Cassette Futurism 设计风格
- TypeScript 完整类型支持
- 项目构建测试通过

---

**文档版本**: 1.1
**最后更新**: 2025-12-20
**维护者**: Cinder
**许可证**: MIT（或根据项目需求选择）