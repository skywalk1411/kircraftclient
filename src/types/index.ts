export interface Settings {
  [key: string]: any;
  base_url: string;
  auto_fullscreen: boolean;
  discord_rpc: boolean;
  unlimited_fps: boolean;
  in_process_gpu: boolean;
  menu_keybind: string;
  menu_theme: string;
  menu_opacity: string;
  custom_theme_bg: string;
  custom_theme_text: string;
  custom_theme_accent: string;
  custom_theme_border: string;
  custom_theme_danger: string;
  custom_theme_font: string;
  custom_theme_custom_font: string;
  css_link: string;
  css_enabled: boolean;
  advanced_css: string;
}

export interface NotificationData {
  message: string;
  icon?: string;
}

export interface SettingsChangedEvent extends CustomEvent {
  detail: {
    setting: string;
    value: any;
  };
}
