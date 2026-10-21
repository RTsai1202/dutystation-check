# 變更紀錄 (Changelog)

## 2026-10-21

### 🔒 RTDB 改為需匿名登入才能讀寫

**起因：** 2026-02-23 的規則僅限制路徑，`dutystation` 仍是 `.read/.write: true`，任何人不需登入即可讀寫分隊值班資料。

**修正方式：**
- `database.rules.json`：`dutystation` 的 `.read/.write` 改為 `auth != null`，其餘路徑預設拒絕；新增 `firebase.json`、`.firebaserc`（project `dutystation-check`）。
- `firebase.ts`：新增 `ensureSignedIn()`（`signInAnonymously`）；`useFirebaseSync.ts` 在首次 `get()`／`onValue` 前先 `await ensureSignedIn()`，失敗時顯示「連線失敗」畫面而非空資料。
- 已用 firebase-tools 部署規則（`GOOGLE_CLOUD_QUOTA_PROJECT=dutystation-check npx firebase-tools deploy --only database`）。
- **前置條件：** Firebase Console → Authentication → Sign-in method 必須啟用「匿名」，否則前端無法登入。

## 2026-02-23

### 🔒 Firebase Realtime Database 安全規則修正

**起因：** 收到 Firebase 官方警告信，通知資料庫 `dutystation-check-default-rtdb` 的安全性規則過於寬鬆——任何人都能讀取及寫入資料庫中的所有內容。

**風險：** 任何知道資料庫網址的人，可以繞過網站的密碼驗證，直接透過 API 讀取、修改或刪除所有資料，甚至塞入大量垃圾資料導致超額收費。

**修正方式：** 在 Firebase Console → Realtime Database → 規則，將安全規則從完全開放改為僅允許存取 `dutystation` 路徑：

```diff
- {
-   "rules": {
-     ".read": true,
-     ".write": true
-   }
- }
+ {
+   "rules": {
+     "dutystation": {
+       ".read": true,
+       ".write": true
+     }
+   }
+ }
```

**影響範圍：** 此變更僅在 Firebase Console 上操作，未修改任何專案程式碼。網站的正常運作及多裝置同步功能不受影響。

**備註：** 網站前端的密碼驗證（`PasswordGate`）與 Firebase 安全規則是兩個獨立的安全層。前者僅控制網頁 UI 的顯示，後者才是真正保護資料庫的機制。
