mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
