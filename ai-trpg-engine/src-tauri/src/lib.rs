mod commands;

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::sync::Mutex;
use chrono::Local;

// 全局日志文件句柄
static LOG_FILE: Mutex<Option<std::fs::File>> = Mutex::new(None);

// 初始化日志文件
fn init_log_file() -> Result<(), Box<dyn std::error::Error>> {
    let home_dir = dirs::document_dir().ok_or("无法获取文档目录")?;
    let log_dir = home_dir.join("AI-TRPG").join("logs");
    fs::create_dir_all(&log_dir)?;

    // 创建按日期命名的日志文件
    let log_filename = format!("ai-trpg-{}.log", Local::now().format("%Y-%m-%d"));
    let log_path = log_dir.join(log_filename);

    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)?;

    let mut log_file = LOG_FILE.lock().unwrap();
    *log_file = Some(file);

    Ok(())
}

// 写入日志到文件
pub fn write_log_to_file(level: &str, message: &str) {
    if let Ok(mut log_file) = LOG_FILE.lock() {
        if let Some(ref mut file) = *log_file {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
            let log_line = format!("[{}] [{}] {}\n", timestamp, level, message);
            let _ = file.write_all(log_line.as_bytes());
            let _ = file.flush();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志文件
    if let Err(e) = init_log_file() {
        eprintln!("初始化日志文件失败: {}", e);
    }

    // 初始化日志系统
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Debug)
        .format(|buf, record| {
            let level = record.level().to_string();
            let message = format!("{}", record.args());

            // 同时写入文件
            write_log_to_file(&level, &message);

            // 输出到控制台
            writeln!(buf, "[{}] [{}] {}",
                Local::now().format("%H:%M:%S%.3f"),
                level,
                message
            )
        })
        .init();

    log::info!("AI-TRPG Engine 启动中...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_game,
            commands::load_game,
            commands::list_saves,
            commands::delete_save,
            commands::save_config,
            commands::load_config,
            commands::save_worldline,
            commands::load_worldline,
            commands::list_worldlines,
            commands::delete_worldline,
            commands::export_worldline,
            commands::import_worldline,
            commands::read_directory_structure,
            commands::save_lorebook,
            commands::load_lorebook,
            commands::list_lorebooks,
            commands::delete_lorebook,
            commands::log_debug,
            commands::log_info,
            commands::log_warn,
            commands::log_error,
            commands::get_log_files,
            commands::read_log_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
