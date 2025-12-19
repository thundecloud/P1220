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
    "maxTokens": 2000
  },
  "game": {
    "dmStyle": "humanistic",
    "autoSave": true,
    "autoSaveInterval": 30,
    "language": "zh-CN"
  },
  "ui": {
    "theme": "dark",
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
