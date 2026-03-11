// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // #[cfg(desktop)]
    // {
    //     builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
    //         use tauri::Manager;
    //
    //         let _ = app
    //             .get_webview_window("main")
    //             .expect("no main window")
    //             .set_focus();
    //     }));
    // }

    builder = builder.plugin(tauri_plugin_keyring::init());
    builder = builder.plugin(tauri_plugin_websocket::init());
    builder = builder.plugin(tauri_plugin_clipboard_manager::init());
    builder = builder.plugin(tauri_plugin_http::init());
    builder = builder.plugin(tauri_plugin_fs::init());
    builder = builder.plugin(tauri_plugin_persisted_scope::init());
    builder = builder.plugin(tauri_plugin_dialog::init());
    builder = builder.invoke_handler(tauri::generate_handler![greet]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running application");
}
