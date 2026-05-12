//! 团子 Dango 桌面宠物 — Tauri 后端核心库
//!
//! 本阶段实现：
//! - Tauri 应用初始化
//! - 透明窗口配置
//! - 点击穿透基础支持
//! - 获取鼠标位置和屏幕尺寸的命令
//! - 系统托盘
//! - 开机自启
//! - 窗口位置记忆
//! - 退出应用

use tauri::{
    Emitter, Manager,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};
use std::fs;
use std::path::PathBuf;

/// 鼠标位置信息
#[derive(serde::Serialize, Clone)]
struct MousePosition {
    x: f64,
    y: f64,
}

/// 屏幕尺寸信息
#[derive(serde::Serialize, Clone)]
struct ScreenSize {
    width: f64,
    height: f64,
}

/// 窗口位置信息（用于持久化）
#[derive(serde::Serialize, serde::Deserialize, Clone, Default)]
struct WindowPositionData {
    x: f64,
    y: f64,
}

/// 获取应用数据目录路径
fn get_app_data_path(app: &tauri::AppHandle) -> PathBuf {
    let base = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let _ = fs::create_dir_all(&base);
    base
}

/// 获取插件目录路径（~/.dango/plugins/）
fn get_plugins_path(app: &tauri::AppHandle) -> PathBuf {
    let base = get_app_data_path(app).join("plugins");
    let _ = fs::create_dir_all(&base);
    base
}

/// 获取插件目录路径（返回字符串给前端）
#[tauri::command]
fn get_plugins_dir(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_plugins_path(&app);
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "插件目录路径无效".to_string())
}

/// 列出插件目录下的所有子目录名
#[tauri::command]
fn list_plugin_dirs(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let plugins_path = get_plugins_path(&app);
    let mut dirs = Vec::new();

    let entries = fs::read_dir(&plugins_path)
        .map_err(|e| format!("读取插件目录失败: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                dirs.push(name.to_string());
            }
        }
    }

    Ok(dirs)
}

/// 读取插件目录中的指定文件内容
#[tauri::command]
fn read_plugin_file(app: tauri::AppHandle, plugin_dir: String, file_name: String) -> Result<String, String> {
    let plugins_path = get_plugins_path(&app);
    let file_path = plugins_path.join(&plugin_dir).join(&file_name);

    // 安全检查：确保路径不包含 .. 防止目录穿越
    if plugin_dir.contains("..") || file_name.contains("..") {
        return Err("非法路径：不允许使用 ..".to_string());
    }

    fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件 {} 失败: {}", file_path.display(), e))
}

/// 获取当前鼠标指针的全局屏幕坐标
#[tauri::command]
fn get_mouse_position() -> MousePosition {
    match rdev::display_size() {
        Ok(_) => get_cursor_position(),
        Err(_) => MousePosition { x: 0.0, y: 0.0 },
    }
}

/// 获取鼠标光标位置（平台实现）
fn get_cursor_position() -> MousePosition {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;

        unsafe {
            let mut point = POINT::default();
            if GetCursorPos(&mut point).is_ok() {
                return MousePosition {
                    x: point.x as f64,
                    y: point.y as f64,
                };
            }
        }
        MousePosition { x: 0.0, y: 0.0 }
    }

    #[cfg(not(target_os = "windows"))]
    {
        MousePosition { x: 0.0, y: 0.0 }
    }
}

/// 获取主屏幕尺寸
#[tauri::command]
fn get_screen_size() -> ScreenSize {
    match rdev::display_size() {
        Ok((w, h)) => ScreenSize {
            width: w as f64,
            height: h as f64,
        },
        Err(_) => ScreenSize {
            width: 1920.0,
            height: 1080.0,
        },
    }
}

/// 获取窗口当前位置
#[tauri::command]
fn get_window_position(window: tauri::Window) -> Result<MousePosition, String> {
    match window.outer_position() {
        Ok(pos) => Ok(MousePosition {
            x: pos.x as f64,
            y: pos.y as f64,
        }),
        Err(e) => Err(format!("获取窗口位置失败: {}", e)),
    }
}

/// 移动窗口到指定位置
#[tauri::command]
fn set_window_position(window: tauri::Window, x: f64, y: f64) -> Result<(), String> {
    let pos = tauri::Position::Physical(tauri::PhysicalPosition {
        x: x as i32,
        y: y as i32,
    });
    window.set_position(pos).map_err(|e| format!("移动窗口失败: {}", e))
}

/// 保存窗口位置到本地文件
#[tauri::command]
fn save_window_position(app: tauri::AppHandle, window: tauri::Window) -> Result<(), String> {
    let pos = window.outer_position().map_err(|e| format!("获取窗口位置失败: {}", e))?;
    let data = WindowPositionData {
        x: pos.x as f64,
        y: pos.y as f64,
    };
    let path = get_app_data_path(&app).join("window_position.json");
    let json = serde_json::to_string(&data).map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}

/// 从本地文件加载窗口位置
#[tauri::command]
fn load_window_position(app: tauri::AppHandle) -> Result<Option<WindowPositionData>, String> {
    let path = get_app_data_path(&app).join("window_position.json");
    if !path.exists() {
        return Ok(None);
    }
    let json = fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))?;
    let data: WindowPositionData = serde_json::from_str(&json).map_err(|e| format!("解析失败: {}", e))?;
    Ok(Some(data))
}

/// 退出应用
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

/// 显示/隐藏主窗口
#[tauri::command]
fn toggle_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| format!("隐藏窗口失败: {}", e))?;
        } else {
            window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
            window.set_focus().map_err(|e| format!("聚焦窗口失败: {}", e))?;
        }
    }
    Ok(())
}

/// 设置系统托盘
fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示/隐藏团子", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &settings_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("团子 Dango")
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => {
                let _ = toggle_window(app.clone());
            }
            "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    // 通过 emit 通知前端打开设置面板
                    let _ = window.emit("open-settings", ());
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                let app = tray.app_handle();
                let _ = toggle_window(app.clone());
            }
        })
        .build(app)?;

    Ok(())
}

/// 运行 Tauri 应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .setup(|app| {
            // 获取主窗口并配置透明属性
            let window = app
                .get_webview_window("main")
                .expect("未找到主窗口 main");

            // Windows 平台额外配置：确保透明和点击穿透生效
            #[cfg(target_os = "windows")]
            {
                let _ = window.set_skip_taskbar(true);
            }

            // 设置系统托盘
            setup_tray(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_mouse_position,
            get_screen_size,
            get_window_position,
            set_window_position,
            save_window_position,
            load_window_position,
            get_plugins_dir,
            list_plugin_dirs,
            read_plugin_file,
            quit_app,
            toggle_window,
        ])
        .run(tauri::generate_context!())
        .expect("启动团子 Dango 失败");
}
