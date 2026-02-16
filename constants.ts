import { ShiftSection, TaskItem } from './types';

/**
 * 週期性任務配置說明：
 * - showOnDays: [0-6] 指定星期幾顯示 (0=週日, 1=週一...)
 * - showInMonths: [1-12] 指定哪幾個月顯示 (1=一月...)
 * 若未設定則代表每天/每月都顯示。
 */

// Basic Items (Top Section)
export const BASIC_TASKS: TaskItem[] = [
  { id: 'basic_radio_vol', label: '確認無線電音量' },
  { id: 'basic_broadcast_vol', label: '確認廣播音量', subtext: '一、上述時間值班無異狀。' },
  { id: 'basic_external_line', label: '開紅外線', subtext: '二、維護駐地安全、值班室清潔，無線電通訊良好。' },
  { id: 'basic_dispatch_sys', label: '登入派遣系統' },
  { id: 'basic_check_radio_tablet', label: '簽值班、確認無線電、平板數量' },
  { id: 'basic_check_vehicle_key', label: '確認車輛、鑰匙' },
  { id: 'basic_update_org', label: '更新電子作戰編組表', link: 'https://docs.google.com/spreadsheets/d/1_1ymAgWqbUUO_1WuLw60aDls340fBYnr/edit?gid=1776323409#gid=1776323409' },
  { id: 'basic_confirm_staff', label: '再次確認派遣台上班人員 (人力即時戰力維護)' },
  { id: 'basic_log_work', label: '登打工作紀錄', link: 'https://eip.tccfd.gov.tw/login.php' },
  { id: 'basic_handover', label: '簽交班、確認無線電、平板數量' },
  { id: 'basic_check_vehicle_key_end', label: '確認車輛、鑰匙' },
];

// Shift Specific Sections
export const SHIFT_SECTIONS: ShiftSection[] = [
  {
    id: 'shift_0812',
    title: '08-12 值班',
    timeRange: '08:00 - 12:00',
    colorClass: 'bg-blue-600',
    tasks: [
      { id: 's1_flag_raise', label: '升國旗' },
      { id: 's1_reboot_pc', label: '電腦重開機', showOnDays: [1] },
      { id: 's1_lunch', label: '點午餐 (注意外勤、救護)' },
      { id: 's1_tuesday', label: '今天是禮拜二 (車輛週、月保養點選)', isHeader: true, link: 'http://car.tccf.gov.tw/car/index.php', showOnDays: [2] },
      { id: 's1_maintenance_winter', label: '保溫 (10-3月 每日兩次)', showInMonths: [10, 11, 12, 1, 2, 3] },
      { id: 's1_maintenance_summer', label: '保溫 (4-9月 每日一次)', showInMonths: [4, 5, 6, 7, 8, 9] },
      { id: 's1_remind_maint', label: '提醒週保養的人打工作、系統', link: 'http://car.tccf.gov.tw/car/index.php' },
      { id: 's1_radio_test', label: '09:00 無線電測試 救護台' },
      { id: 's1_lunch_check', label: '點午餐 (注意外勤、救護)' },
      { id: 's1_login_audit', label: '登打&審核 救護車每日檢查表，用當日主管帳號登入審核', link: 'http://10.19.4.35/' },
      { id: 's1_confirm_dispatch', label: '確認派遣台上班人員 (人力即時戰力維護)' },
      { id: 's1_help_count', label: '幫大家點點勤', link: 'https://eip.tccfd.gov.tw/login.php' },
    ]
  },
  {
    id: 'shift_1218',
    title: '12-18 值班',
    timeRange: '12:00 - 18:00',
    colorClass: 'bg-green-600',
    tasks: [
      { id: 's2_noon_report', label: '收中午通報', link: 'http://inside.fire.taichung.gov.tw/notice/login.asp' },
      { id: 's2_maintenance_winter', label: '保溫 (10-3月 每日第二次)', showInMonths: [10, 11, 12, 1, 2, 3] },
      { id: 's2_skills', label: '14:50 廣播體技能訓練' },
      { id: 's2_remind_instructor', label: '16:00 提醒教官體技能工作', link: 'https://eip.tccfd.gov.tw/login.php' },
      { id: 's2_dinner', label: '訂晚餐 (注意外勤、救護)' },
    ]
  },
  {
    id: 'shift_1822',
    title: '18-22 值班',
    timeRange: '18:00 - 22:00',
    colorClass: 'bg-orange-600',
    tasks: [
      { id: 's3_flag_lower', label: '18 值班者降旗' },
      { id: 's3_eve_report', label: '收晚上通報', link: 'http://inside.fire.taichung.gov.tw/notice/login.asp' },
      { id: 's3_duty_notes', label: '值勤記事資料確認', link: 'https://docs.google.com/spreadsheets/d/1kgj4k4F4J8xJJPFLomPdgIRenD68UB8f4VkE2l_F_9c/edit?gid=1224097373#gid=1224097373' },
      { id: 's3_upload_roster', label: '上傳隔天勤務表 (核章後掃描PDF) 到大隊交換系統', link: 'http://inside.fire.taichung.gov.tw/fms/login.asp' },
      { id: 's3_upload_new_sys', label: '上傳新系統勤務表截圖 (CTRL+SHIFT+S) 到大隊交換系統', subtext: '注意：要用 edge 瀏覽器', link: 'http://inside.fire.taichung.gov.tw/fms/login.asp' },
      { id: 's3_upload_bureau', label: '上傳隔天勤務表 (核章後掃描PDF) 到局(指揮中心)交換系統', link: 'http://inside.fire.taichung.gov.tw/fms/login.asp' },
      { id: 's3_upload_line', label: '上傳隔天勤務表到 分隊 LINE 群組' },
      { id: 's3_control_fill', label: '21:00 執勤管制填寫 (12/1起 20:00)', link: 'http://inside.fire.taichung.gov.tw/person2/index.asp' },
      { id: 's3_disaster_test', label: '21:00 救災台試話' },
    ]
  },
  {
    id: 'shift_2206',
    title: '22-06 值宿',
    timeRange: '22:00 - 06:00',
    colorClass: 'bg-indigo-600',
    tasks: [
      { id: 's4_shutter', label: '關滑升門' },
      { id: 's4_lock', label: '門上鎖' },
      { id: 's4_close_garage', label: '關機車棚' },
      { id: 's4_clear_menu', label: '清除值班台點菜單' },
    ]
  },
];