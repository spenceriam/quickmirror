// QuickMirror System Tray Application
// Basic Tauri v2 application setup

// Command for frontend to hide window
#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

// Command for frontend to show window
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .on_window_event(|event| {
            match event.event() {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Hide the window instead of closing (system tray behavior)
                    api.prevent_close();
                    let _ = event.window().hide();
                    println!("Window hidden to simulate system tray behavior");
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![hide_window, show_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
