<!DOCTYPE html>
<html lang="ckb" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>پانێڵی بەڕێوەبردن | Kurd Technology</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;800&family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="admin.css">
</head>
<body>

  <div class="bg"></div>

  <!-- Top bar -->
  <header class="topbar">
    <a href="services.html" class="brand">
      <div class="back-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <span class="brand-title">Kurd Technology</span>
    </a>
    <span class="owner-pill">پانێڵی سەرۆک</span>
  </header>

  <!-- Main Wrap -->
  <main class="wrap">

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box">
        <b id="kpiTotalUsers">0</b>
        <span>سەرجەم بەکارهێنەران</span>
      </div>
      <div class="stat-box">
        <b id="kpiAdmins" style="color: #4ADE80;">0</b>
        <span>بەڕێوەبەران</span>
      </div>
      <div class="stat-box">
        <b id="kpiBanned" style="color: #FF6B7A;">0</b>
        <span>بەندکراوەکان</span>
      </div>
    </div>

    <!-- User List -->
    <div class="section-title">بەکارهێنەرانی سیستم</div>
    <div class="user-list" id="usersList">
      <div class="loading-hint">باردەکرێت...</div>
    </div>

  </main>

  <!-- User Detail Sheet Modal -->
  <div class="admin-overlay" id="userOverlay">
    <div class="admin-sheet">
      <button class="admin-close" id="closeSheetBtn">✕</button>

      <div class="user-detail-head">
        <div class="user-detail-avatar" id="sheetAvatar">؟</div>
        <div class="user-detail-name" id="sheetName">ناو</div>
        <div class="user-detail-role" id="sheetEmail">ئیمەیڵ</div>
      </div>

      <div class="admin-tab-panel">
        <div class="manage-block">
          <div class="manage-row">
            <span>ڕۆڵ:</span>
            <b id="sheetRoleText">user</b>
          </div>
          <div class="manage-row">
            <span>دۆخ:</span>
            <b id="sheetStatusText">چالاک</b>
          </div>
          <div class="manage-row">
            <span>بەرواری دروستبوون:</span>
            <span id="sheetCreatedAt" style="font-size:11px; color:rgba(255,255,255,.6);">...</span>
          </div>

          <button class="btn-ban" id="sheetBanBtn">بەندکردنی بەکارهێنەر</button>
        </div>
      </div>

    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
  <script src="guard.js"></script>
  <script src="admin.js"></script>
</body>
</html>
