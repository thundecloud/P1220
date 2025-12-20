use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// 获取存档目录路径
fn get_save_directory() -> Result<PathBuf, String> {
    let home_dir = dirs::document_dir().ok_or("无法获取文档目录")?;
    Ok(home_dir.join("AI-TRPG").join("saves"))
}

// 获取配置文件路径
fn get_config_path() -> Result<PathBuf, String> {
    let home_dir = dirs::document_dir().ok_or("无法获取文档目录")?;
    Ok(home_dir.join("AI-TRPG").join("config.json"))
}

// 获取默认配置
fn get_default_config() -> String {
    r#"{
  "ai": {
    "provider": "deepseek",
    "apiKey": "",
    "apiBaseUrl": "https://api.deepseek.com/v1",
    "modelName": "deepseek-chat",
    "temperature": 0.7,
    "maxTokens": 2000,
    "topP": 1.0,
    "presencePenalty": 0,
    "frequencyPenalty": 0
  },
  "game": {
    "dmStyle": "humanistic",
    "dmPrompt": "你是一位经验丰富的桌面角色扮演游戏(TRPG)的游戏主持人(Dungeon Master)。\n\n你的职责是：\n1. 根据角色的世界线背景、属性、天赋，创造沉浸式的叙事体验\n2. 描述场景时要生动、具体，调动玩家的感官体验\n3. 尊重历史背景的真实性，同时保持故事的戏剧性\n4. 根据判定结果(大成功/成功/失败/大失败)给出合理的叙事发展\n5. 让玩家的选择真正影响故事走向\n\n叙事风格：\n- 使用第二人称(\"你\")与玩家互动\n- 段落简洁有力，避免冗长描写\n- 在关键时刻给玩家选择的机会\n- 平衡叙事节奏，有张有弛\n\n请记住：你不是在写小说，而是在与玩家共同创造故事。",
    "autoSave": true,
    "autoSaveInterval": 60,
    "language": "zh-CN"
  },
  "ui": {
    "theme": "cassette-futurism",
    "fontSize": 14,
    "animationEnabled": true
  }
}"#
    .to_string()
}

// 保存游戏存档
#[tauri::command]
pub fn save_game(filename: String, data: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    fs::create_dir_all(&save_dir).map_err(|e| e.to_string())?;

    let file_path = save_dir.join(&filename);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(format!("存档已保存: {}", filename))
}

// 读取游戏存档
#[tauri::command]
pub fn load_game(filename: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    let file_path = save_dir.join(&filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// 列出所有存档
#[tauri::command]
pub fn list_saves() -> Result<Vec<String>, String> {
    let save_dir = get_save_directory()?;

    if !save_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(save_dir).map_err(|e| e.to_string())?;
    let saves: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|s| s.to_str())
                == Some("json")
        })
        .filter_map(|e| e.file_name().to_str().map(String::from))
        .collect();

    Ok(saves)
}

// 删除存档
#[tauri::command]
pub fn delete_save(filename: String) -> Result<String, String> {
    let save_dir = get_save_directory()?;
    let file_path = save_dir.join(&filename);
    fs::remove_file(file_path).map_err(|e| e.to_string())?;
    Ok(format!("存档已删除: {}", filename))
}

// 保存配置
#[tauri::command]
pub fn save_config(config: String) -> Result<(), String> {
    let config_path = get_config_path()?;
    let config_dir = config_path.parent().ok_or("无法获取配置目录")?;
    fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    fs::write(config_path, config).map_err(|e| e.to_string())
}

// 读取配置
#[tauri::command]
pub fn load_config() -> Result<String, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        // 返回默认配置
        return Ok(get_default_config());
    }

    fs::read_to_string(config_path).map_err(|e| e.to_string())
}

// ============ 世界线管理 ============

// 获取世界线目录路径
fn get_worldlines_directory() -> Result<PathBuf, String> {
    let home_dir = dirs::document_dir().ok_or("无法获取文档目录")?;
    Ok(home_dir.join("AI-TRPG").join("worldlines"))
}

// 保存自定义世界线
#[tauri::command]
pub fn save_worldline(filename: String, data: String) -> Result<String, String> {
    let worldlines_dir = get_worldlines_directory()?;
    fs::create_dir_all(&worldlines_dir).map_err(|e| e.to_string())?;

    let file_path = worldlines_dir.join(&filename);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(format!("世界线已保存: {}", filename))
}

// 读取自定义世界线
#[tauri::command]
pub fn load_worldline(filename: String) -> Result<String, String> {
    let worldlines_dir = get_worldlines_directory()?;
    let file_path = worldlines_dir.join(&filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// 列出所有自定义世界线
#[tauri::command]
pub fn list_worldlines() -> Result<Vec<String>, String> {
    let worldlines_dir = get_worldlines_directory()?;

    if !worldlines_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(worldlines_dir).map_err(|e| e.to_string())?;
    let worldlines: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|s| s.to_str())
                == Some("json")
        })
        .filter_map(|e| e.file_name().to_str().map(String::from))
        .collect();

    Ok(worldlines)
}

// 删除自定义世界线
#[tauri::command]
pub fn delete_worldline(filename: String) -> Result<String, String> {
    let worldlines_dir = get_worldlines_directory()?;
    let file_path = worldlines_dir.join(&filename);
    fs::remove_file(file_path).map_err(|e| e.to_string())?;
    Ok(format!("世界线已删除: {}", filename))
}

// 导出世界线（返回JSON字符串）
#[tauri::command]
pub fn export_worldline(filename: String) -> Result<String, String> {
    load_worldline(filename)
}

// 导入世界线（从JSON字符串）
#[tauri::command]
pub fn import_worldline(filename: String, data: String) -> Result<String, String> {
    save_worldline(filename, data)
}

// ============ Lorebook 管理 ============

// 获取 Lorebook 目录路径
fn get_lorebooks_directory() -> Result<PathBuf, String> {
    let home_dir = dirs::document_dir().ok_or("无法获取文档目录")?;
    Ok(home_dir.join("AI-TRPG").join("lorebooks"))
}

// 保存 Lorebook
#[tauri::command]
pub fn save_lorebook(filename: String, data: String) -> Result<String, String> {
    let lorebooks_dir = get_lorebooks_directory()?;
    fs::create_dir_all(&lorebooks_dir).map_err(|e| e.to_string())?;

    let file_path = lorebooks_dir.join(&filename);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(format!("Lorebook 已保存: {}", filename))
}

// 读取 Lorebook
#[tauri::command]
pub fn load_lorebook(filename: String) -> Result<String, String> {
    let lorebooks_dir = get_lorebooks_directory()?;
    let file_path = lorebooks_dir.join(&filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// 列出所有 Lorebook
#[tauri::command]
pub fn list_lorebooks() -> Result<Vec<String>, String> {
    let lorebooks_dir = get_lorebooks_directory()?;

    if !lorebooks_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(lorebooks_dir).map_err(|e| e.to_string())?;
    let lorebooks: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|s| s.to_str())
                == Some("json")
        })
        .filter_map(|e| e.file_name().to_str().map(String::from))
        .collect();

    Ok(lorebooks)
}

// 删除 Lorebook
#[tauri::command]
pub fn delete_lorebook(filename: String) -> Result<String, String> {
    let lorebooks_dir = get_lorebooks_directory()?;
    let file_path = lorebooks_dir.join(&filename);
    fs::remove_file(file_path).map_err(|e| e.to_string())?;
    Ok(format!("Lorebook 已删除: {}", filename))
}

// ============ 设定集目录导入 ============

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub content: Option<String>,  // 文件内容（仅对.md和.txt文件）
    pub children: Option<Vec<FileNode>>,  // 子节点（仅对目录）
}

// 递归读取目录结构和文件内容
#[tauri::command]
pub fn read_directory_structure(dir_path: String) -> Result<FileNode, String> {
    let path = PathBuf::from(&dir_path);

    if !path.exists() {
        return Err(format!("路径不存在: {}", dir_path));
    }

    read_dir_recursive(&path)
}

fn read_dir_recursive(path: &PathBuf) -> Result<FileNode, String> {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    if metadata.is_dir() {
        // 读取目录
        let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
        let mut children = Vec::new();

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let child_path = entry.path();

            // 递归读取子节点
            match read_dir_recursive(&child_path) {
                Ok(node) => children.push(node),
                Err(_) => continue,  // 跳过无法读取的文件
            }
        }

        Ok(FileNode {
            name: file_name,
            path: path.to_str().unwrap_or("").to_string(),
            is_dir: true,
            content: None,
            children: Some(children),
        })
    } else {
        // 读取文件
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");

        let content = if extension == "md" || extension == "txt" || extension == "markdown" {
            match fs::read_to_string(path) {
                Ok(text) => Some(text),
                Err(_) => None,
            }
        } else {
            None
        };

        Ok(FileNode {
            name: file_name,
            path: path.to_str().unwrap_or("").to_string(),
            is_dir: false,
            content,
            children: None,
        })
    }
}
