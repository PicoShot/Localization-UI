#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(all(desktop, not(debug_assertions)))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            use tauri::Manager;

            let window = app.get_webview_window("main").expect("no main window");
            let _ = window.unminimize();
            let _ = window.set_focus();
        }));
    }

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder = builder.plugin(tauri_plugin_os::init());
    builder = builder.plugin(tauri_plugin_keyring::init());
    builder = builder.plugin(tauri_plugin_websocket::init());
    builder = builder.plugin(tauri_plugin_clipboard_manager::init());
    builder = builder.plugin(tauri_plugin_http::init());
    builder = builder.plugin(tauri_plugin_fs::init());
    builder = builder.plugin(tauri_plugin_persisted_scope::init());
    builder = builder.plugin(tauri_plugin_dialog::init());

    builder
        .run(tauri::generate_context!())
        .expect("error while running application");
}
