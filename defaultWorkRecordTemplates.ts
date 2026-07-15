import { WorkRecord, WorkRecordGroup } from './types';

/**
 * 預設工作記錄模板與群組。
 * 僅在 Firebase 尚未初始化工作記錄時載入；內容與目前線上設定一致。
 */
export const DEFAULT_WORK_RECORD_GROUPS: WorkRecordGroup[] = [
  {
    "id": "wg_1771230381099",
    "title": "最近常用"
  },
  {
    "id": "wg_1771238444777 ",
    "title": "車輛保養"
  },
  {
    "id": "wg_1771233561122",
    "title": "外勤/宣導"
  },
  {
    "id": "wg_1771233570653",
    "title": "救災"
  },
  {
    "id": "wg_1771235001133 ",
    "title": "常用網站"
  }
];
export const DEFAULT_WORK_RECORDS: WorkRecord[] = [
  {
    "content": "1.車輛:KED-3085\n2.駕駛人:                    \n3.督導人:\n4.行駛路線:轄內\n5.訓練情形:良好.路口提早打方向燈.並注意車輛行駛狀況\n6.訓練成果:良好\n",
    "groupId": "wg_1771238444777 ",
    "id": "wr_1771233911287",
    "link": "https://eip.tccfd.gov.tw/login.php\nhttp://car.tccf.gov.tw/car/index.php",
    "title": "駕駛訓練"
  },
  {
    "content": "上述時間進行   車週/月保養，保養工作項目:\n■清洗車身\t       ■各種油電水檢查\n□至轄內試車良好     □本週行駛達5公里無須試車\n□幫浦操作試水良好   □DPD除碳\n■分隊車輛行車紀錄器影像功能正常，時間正確。\n■檢查零件有無損壞__________________\n",
    "groupId": "wg_1771238444777 ",
    "id": "wr_1771233924804",
    "link": "http://car.tccf.gov.tw/car/index.php",
    "title": "車輛週/月保養(週、月、半年不需打工作了)"
  },
  {
    "content": "測試內容",
    "groupId": "wg_1771235001133 ",
    "id": "wr_1771234800220",
    "link": "https://elearn.hrd.gov.tw/mooc/index.php",
    "title": "E 等公務園"
  },
  {
    "content": "一、本局於115年 月 日 時 分受理太平區OO火警，派遣車籠埔11.16共2車人員3名，由分隊長陳煜欣帶隊前往。\n\n二、現場為...起火燃燒，出一水線撲滅火勢，燃燒面積約  平方公尺，無財損，無人員受傷，人員收拾裝備返隊待命。",
    "groupId": "wg_1771233570653",
    "id": "wr_1771261898422 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "火警"
  },
  {
    "content": "一、項目:○○場所防火宣導。\n二、對象人數:約○○人。\n三、內容:住宅防火宣導、用火用電宣導、住警器宣導、火場避難逃生、防焰物品宣導…等\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238234133 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "防火宣導"
  },
  {
    "content": "一、項目:\n二、訓練情形:良好\n三、人員:備勤全體同仁。\n",
    "groupId": "wg_1771230381099",
    "id": "wr_1771238140858 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "體技能訓練"
  },
  {
    "content": "一、項目:環境整理。\n二、地點:廳舍全棟。\n三、人員:備勤全體同仁。\n",
    "id": "wr_1771238157504 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "環境整理(項目選其他)"
  },
  {
    "content": "一、於上述時間前往第O梯次水源檢查。\n二、檢查編號000-000號消防栓外觀及放水測試皆良好。\n    (檢查編號000號地下消防栓遭埋沒…..)\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238126131 ",
    "link": "https://eip.tccfd.gov.tw/login.php\nhttps://water.tccfd.gov.tw/tccfdinfo/login.asp?sessionId=",
    "title": "水源檢查"
  },
  {
    "content": "一、項目:爆竹煙火宣導。\n二、其他:轄內宮廟宣導狀況正常。\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238166454 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "爆竹煙火宣導/巡邏"
  },
  {
    "content": "一、項目:爆竹煙火攔查。\n二、攔查情況:攔查狀況均正常 123-XYZ(車牌)。\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238197651 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "轄內爆竹煙火攔查"
  },
  {
    "content": "一、於上述時間前往轄內第五公墓、內城公墓、第一花園公墓巡邏及宣導。\n二、其他:轄內公墓巡邏狀況良好(未發現人員掃墓…等)。\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238223141 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "公墓巡邏"
  },
  {
    "content": "一、項目:公墓駐點宣導。\n二、其他:轄內公墓宣導狀況正常。\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238211108 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "公墓駐點宣導"
  },
  {
    "content": "依據氣象署針對頭汴坑溪發佈雷雨警報，車籠埔分隊針對頭汴坑溪水域巡邏，水位正常，無民眾戲水、釣魚及逗留溪邊。",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238256374 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "水域巡邏"
  },
  {
    "content": "抽查救護車影像\n一、抽查救護車輛:救護車、車牌(BZG-8605、BRJ-7180)。\n二、抽查日期:114年月日、時分\n三、執行勤務: 救護\n四、抽查情形:駕駛   依規定安全行駛及遇紅燈減速至停止，均有繫上安全帶。\n五、分隊車輛行車紀錄器影像功能正常，時間正確。\n抽查救災車影像\n一、抽查救災車輛:水箱車、車牌()。\n二、抽查日期:115年月日、時分\n三、執行勤務:\n四、抽查情形:駕駛    依規定安全行駛,均有繫上安全帶。\n五、分隊車輛行車紀錄器影像功能正常，時間正確。\n\n車籠埔分隊\n抽查救災車影像\n一、抽查救災車輛:水箱車。\n二、抽查日期:115年月日\n三、執行勤務:本日無出勤\n四、分隊車輛行車紀錄器影像功能正常，時間正確。\n",
    "groupId": "wg_1771230381099",
    "id": "wr_1771238278891 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "行車影像抽查"
  },
  {
    "content": "一、於左述時間前往轄內搶救演練。\n二、地點:○○○○\n三、利用水帶佈線、TIC熱顯像儀輔助搶救、SCBA消防裝備器材強    \n    化搶救訓練。\n",
    "groupId": "wg_1771233561122",
    "id": "wr_1771238327465 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "搶救演練"
  },
  {
    "content": "一、上述時間測試衛星電話。\n二、測試人員:隊員 \n三、指揮中心接線人員-莊珮樺\n四、檢查結果：良好。\n",
    "id": "wr_1771238338957 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "衛星電話測試"
  },
  {
    "content": "一、於左述時間前往太平區OO路OO號執行OHCA救護。\n二、現場患者一名男性，年OO歲，主訴OHCA，給予CPR、\n   AED不建議電擊、BVM、LMA4號、LUCAS，送往OO醫院急救。\n三、返隊後進行救護車及裝備清消。\n",
    "groupId": "wg_1771233570653",
    "id": "wr_1771238087328 ",
    "link": "https://eip.tccfd.gov.tw/login.php",
    "title": "救護(ALS、敏感案件)"
  },
  {
    "content": "",
    "groupId": "wg_1771235001133 ",
    "id": "wr_1771297055967 ",
    "link": "http://car.tccf.gov.tw/car/index.php",
    "title": "車輛系統"
  },
  {
    "content": "一、上述時間至光興隆大橋，執行爆竹煙火暨公墓巡邏宣導。\n二、宣導情形:良好。\n三、人員:隊員 。",
    "groupId": "wg_1771230381099",
    "id": "wr_1772284203819 ",
    "link": "https://eip.tccfd.gov.tw/login.php\nhttp://car.tccf.gov.tw/car/index.php",
    "title": "爆竹煙火暨公墓巡邏宣導"
  },
  {
    "content": "一、前往一帶安裝住警器。\n二、前往共  戶，實際安裝  戶。",
    "groupId": "wg_1771230381099",
    "id": "wr_1774353583052 ",
    "link": "https://eip.tccfd.gov.tw/login.php\nhttp://car.tccf.gov.tw/car/index.php",
    "title": "住警器安裝"
  }
];
