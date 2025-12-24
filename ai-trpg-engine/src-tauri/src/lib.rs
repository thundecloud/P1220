mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志系统
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Debug)
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
