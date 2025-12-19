# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI人生引擎 - 基于大语言模型的动态叙事TRPG桌面应用。使用 Tauri 2 + React + TypeScript 构建的单机桌面应用,结合传统TRPG数值判定与AI叙事生成能力。

## 核心命令

### 开发
```bash
npm run tauri:dev    # 启动开发模式(Vite + Tauri窗口,支持热重载)
npm run dev          # 仅启动Vite开发服务器
npm run build        # 构建前端代码
npm run lint         # 运行ESLint检查
```

### 构建
```bash
npm run tauri:build  # 构建生产版本(输出在 src-tauri/target/release/)
```

### Tauri 特定命令
```bash
npm run tauri        # 直接调用Tauri CLI
```

## 架构核心特点

### 1. 桌面应用架构
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: Tauri 2 (Rust) - 提供文件系统访问和系统API
- **状态管理**: Zustand - 轻量级状态管理
- **路由**: React Router v7
- **数据存储**: 本地JSON文件 (存储在 `~/Documents/AI-TRPG/`)

### 2. 前后端通信模式
前端通过 Tauri invoke 调用 Rust 命令:
```typescript
import { invoke } from '@tauri-apps/api/tauri';
const result = await invoke('save_game', { filename, data });
```

**已注册的 Rust 命令** (定义在 `src-tauri/src/commands.rs`):
- `save_game(filename, data)` - 保存游戏存档
- `load_game(filename)` - 加载游戏存档
- `list_saves()` - 列出所有存档
- `delete_save(filename)` - 删除存档
- `save_config(config)` - 保存应用配置
- `load_config()` - 加载应用配置(不存在时返回默认配置)

### 3. 数据流设计

**运行时数据** (前端Zustand stores):
- `characterStore` - 角色创建流程和当前角色状态
- `gameStore` - 游戏会话、对话历史、判定记录

**持久化数据**:
- `~/Documents/AI-TRPG/config.json` - 应用配置(AI设置、游戏偏好)
- `~/Documents/AI-TRPG/saves/*.json` - 存档文件

**静态数据** (打包进应用):
- `src/data/worldlines.json` - 世界线配置
- `src/data/talents.json` - 天赋池
- `src/data/backgrounds.json` - 背景身份
- `src/data/prompts/` - AI提示词模板

### 4. 游戏核心机制

**属性系统** (五维属性,0-100):
- `constitution` - 体魄
- `perception` - 感知
- `adaptability` - 适应
- `familyBond` - 家族联系
- `latentTalent` - 潜在天赋

属性生成使用Box-Muller变换实现正态分布随机数,参数来自世界线配置。

**判定系统**:
- 生成0-100随机骰值
- 根据骰值与属性值比较判定结果:
  - 0-5: 大成功 (criticalSuccess)
  - 5-属性值: 成功 (success)
  - 属性值-95: 失败 (failure)
  - 95-100: 大失败 (criticalFailure)

**天赋系统**:
- 天赋通过AI提示词影响叙事,不直接修改数值
- 角色创建时从天赋池按稀有度加权随机抽取9个天赋(分3组)
- 玩家从每组选择1个,最终获得3个天赋
- 稀有度权重: common(50), uncommon(25), rare(15), epic(8), legendary(2)

## 重要类型定义

所有类型定义在 `src/utils/types.ts`:
- `Worldline` - 世界线配置(包含历史背景、属性生成参数、天赋池引用)
- `Talent` - 天赋(包含aiPromptFragment用于影响AI叙事)
- `Character` - 角色数据
- `GameSession` - 游戏会话(对话历史、判定记录、事件日志)
- `Check` - 判定记录
- `Message` - 对话消息
- `SaveData` - 完整存档数据结构
- `AppConfig` - 应用配置

## 开发注意事项

### Rust 后端修改
1. 修改 `src-tauri/src/commands.rs` 添加新命令
2. 在 `src-tauri/src/lib.rs` 的 `invoke_handler` 中注册新命令
3. 前端通过 `invoke('command_name', { args })` 调用

### 添加新数据类型
1. 在 `src/utils/types.ts` 定义类型
2. 如需持久化,考虑是存档文件还是配置文件
3. 如需静态数据,在 `src/data/` 添加JSON文件

### AI集成方式
- AI调用在前端直接进行(从config读取API密钥)
- 提示词管理: 基础模板 + 世界线背景 + 角色信息 + 天赋特质 + 判定结果
- 对话历史需要滑动窗口管理避免超出token限制

### 文件操作安全
- 所有文件操作必须通过Tauri命令
- Rust后端自动将数据目录限制在 `~/Documents/AI-TRPG/`
- 不要在前端直接操作文件系统

### 状态管理模式
- 使用Zustand stores管理运行时状态
- 关键状态变化后调用Tauri命令持久化
- 避免在组件内部维护复杂状态

## 目录结构关键说明

```
src/
├── components/          # UI组件(按功能分组)
│   ├── character/      # 角色相关组件
│   ├── game/           # 游戏界面组件
│   ├── worldline/      # 世界线选择组件
│   └── common/         # 通用组件
├── pages/              # 页面级组件
│   ├── Landing.tsx     # 启动页
│   ├── Config.tsx      # 配置页
│   ├── CharacterCreation.tsx  # 角色创建页
│   └── GameMain.tsx    # 游戏主界面
├── stores/             # Zustand状态管理
│   ├── characterStore.ts
│   └── gameStore.ts
├── services/           # 业务逻辑服务
│   └── characterService.ts  # 角色生成相关算法
├── utils/              # 工具函数
│   ├── types.ts        # 类型定义
│   ├── random.ts       # 随机数生成(Box-Muller等)
│   └── tauri.ts        # Tauri API封装
└── data/               # 静态数据文件

src-tauri/
├── src/
│   ├── main.rs         # Rust主程序入口
│   ├── lib.rs          # Tauri应用配置和命令注册
│   └── commands.rs     # Tauri命令实现(文件操作)
├── Cargo.toml          # Rust依赖配置
└── tauri.conf.json     # Tauri应用配置(窗口大小、权限等)
```

## 技术栈版本

- Tauri: 2.9.6
- React: 19.2.0
- TypeScript: 5.9.3
- Vite: 7.2.4
- Zustand: 5.0.9
- React Router: 7.11.0
- Tailwind CSS: 4.1.18

## 调试技巧

### 开发环境日志
- **前端日志**: 在浏览器DevTools控制台查看
- **Rust日志**: 在启动 `npm run tauri:dev` 的终端查看
- **详细日志**: 设置环境变量 `RUST_LOG=debug`

### Tauri窗口调试
开发模式下窗口自动启用DevTools,可以像调试Web应用一样调试。

### 测试数据路径
配置和存档位于: `C:\Users\<用户名>\Documents\AI-TRPG\` (Windows)

## 常见任务

### 添加新世界线
1. 在 `src/data/worldlines.json` 添加配置
2. 确保 `attributeParams` 参数合理(mu约50,sigma约15)
3. 引用现有天赋池或创建新天赋池

### 添加新天赋
1. 在 `src/data/talents.json` 添加天赋
2. 确保 `poolId` 与世界线的 `talentPoolIds` 匹配
3. `aiPromptFragment` 描述天赋如何影响叙事

### 修改窗口配置
编辑 `src-tauri/tauri.conf.json` 的 `app.windows` 部分。

### 添加新Rust依赖
在 `src-tauri/Cargo.toml` 的 `[dependencies]` 添加,然后运行构建命令自动安装。
