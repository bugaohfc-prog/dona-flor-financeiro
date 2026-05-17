export default function AppShellStyles() {
  return (
    <>
      <style>
              {`
                .print-header,
                .print-footer {
                  display: none;
                }
      
                .desktop-sidebar { display: none; }
                .desktop-quick-actions { display: none; }
      
                @media (min-width: 980px) {
                  body { background: #eef7f5 !important; }
      
                  .app-page {
                    max-width: none !important;
                    width: 100% !important;
                    min-height: 100vh !important;
                    margin: 0 !important;
                    padding: 24px 32px 80px 300px !important;
                    box-sizing: border-box !important;
                    background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%) !important;
                  }
      
                  .desktop-sidebar {
                    display: flex !important;
                    position: fixed;
                    left: 24px;
                    top: 24px;
                    bottom: 24px;
                    width: 244px;
                    padding: 18px;
                    border-radius: 24px;
                    background: linear-gradient(180deg, #064e3b 0%, #0f766e 48%, #14b8a6 100%);
                    color: white;
                    box-shadow: 0 24px 60px rgba(15, 118, 110, 0.28);
                    z-index: 60;
                    flex-direction: column;
                    gap: 14px;
                    box-sizing: border-box;
                  }
      
                  .desktop-sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 14px;
                    border-bottom: 1px solid rgba(255,255,255,.18);
                  }
      
                  .desktop-sidebar-brand img {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: white;
                  }
      
                  .desktop-sidebar-brand strong { display: block; font-size: 17px; }
                  .desktop-sidebar-brand small { color: rgba(255,255,255,.78); }
      
                  .desktop-sidebar-section-label {
                    margin: 12px 4px 4px;
                    font-size: 10px;
                    letter-spacing: .9px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.62);
                    font-weight: 900;
                  }
                  .desktop-sidebar-nav { display: grid; gap: 6px; margin-top: 2px; }
                  .desktop-sidebar-nav button {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    border: 1px solid transparent;
                    background: transparent;
                    color: rgba(255,255,255,.92);
                    border-radius: 14px;
                    padding: 11px 12px;
                    text-align: left;
                    font-weight: 800;
                    cursor: pointer;
                  }
                  .desktop-sidebar-nav button:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.12); }
                  .desktop-sidebar-nav button.active { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.18); box-shadow: inset 3px 0 0 rgba(255,255,255,.8); }
                  .desktop-sidebar-spacer { flex: 1; }
                  .desktop-sidebar-user {
                    border-radius: 18px;
                    padding: 12px;
                    background: rgba(255,255,255,.12);
                    border: 1px solid rgba(255,255,255,.16);
                  }
                  .desktop-sidebar-user strong { display:block; }
                  .desktop-sidebar-user small { color: rgba(255,255,255,.8); }
      
                  .top-shell {
                    max-width: 1280px;
                    margin: 0 auto 22px auto !important;
                    padding: 16px 18px !important;
                    border-radius: 24px !important;
                  }
      
                  .mobile-menu-trigger { display: none !important; }
      
                  .desktop-quick-actions {
                    display: flex !important;
                    gap: 10px;
                    align-items: center;
                  }
      
                  .desktop-quick-actions button {
                    border: none;
                    border-radius: 13px;
                    padding: 10px 14px;
                    color: white;
                    font-weight: 800;
                    cursor: pointer;
                    box-shadow: 0 10px 22px rgba(20,184,166,.22);
                  }
      
                  .desktop-quick-actions .primary { background: linear-gradient(135deg, #14b8a6, #0f766e); }
                  .desktop-quick-actions .secondary { background: #111827; }
      
                  .dashboard-title-row {
                    max-width: 1280px;
                    margin: 0 auto !important;
                    display: flex;
                    align-items: end;
                    justify-content: space-between;
                    gap: 20px;
                  }
      
                  .main-title { font-size: 34px !important; margin: 0 0 16px 0 !important; }
      
                  .summary-grid {
                    max-width: 1280px;
                    margin: 0 auto 18px auto !important;
                    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                    gap: 14px !important;
                  }
                  .summary-grid > div {
                    min-height: 96px;
                    border: 1px solid rgba(15, 118, 110, 0.08);
                    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important;
                  }
                  .summary-grid span { font-size: 13px; color: #475569; }
                  .summary-grid strong { font-size: 25px; margin-top: 6px; }
      
                  .agenda-card-polished {
                    max-width: 1280px;
                    margin: 0 auto 18px auto !important;
                    grid-template-columns: 1fr auto auto !important;
                    align-items: center !important;
                    padding: 18px 20px !important;
                    border-radius: 22px !important;
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%) !important;
                  }
                  .agenda-card-polished > div:first-child strong { display:block; font-size: 18px; }
                  .agenda-card-polished > div:first-child small { display:block; margin-top: 3px; color:#64748b; }
                  .agenda-card-polished button { min-width: 170px; height: 42px; }
                  .agenda-compact-items { display:flex !important; gap: 10px; align-items:center; }
                  .agenda-pill { min-width: 112px; padding: 9px 12px; border-radius: 14px; background: rgba(255,255,255,.86); border:1px solid #ccfbf1; }
                  .agenda-pill small { display:block; font-size:11px; color:#64748b; font-weight:800; }
                  .agenda-pill strong { display:block; margin-top:2px; color:#0f172a; }
      
                  .filters-desktop {
                    max-width: 1280px;
                    margin: 0 auto 16px auto !important;
                    display: grid !important;
                    grid-template-columns: 1fr auto auto !important;
                    align-items: center;
                    gap: 10px !important;
                    padding: 14px !important;
                    border-radius: 22px !important;
                  }
                  .filters-desktop input, .filters-desktop select { height: 42px !important; margin-bottom: 0 !important; }
                  .filters-desktop .status-tabs { grid-column: 1 / -1; display:none !important; }
                  .filters-desktop .advanced-filters { grid-column: 1 / -1; display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding-top: 4px; }
                  .filters-desktop .export-actions { justify-content: flex-end; margin-top: 0 !important; }
                  .filter-toggle-button { height:42px; border:none; border-radius:12px; padding:0 14px; font-weight:900; background:#ecfeff; color:#0f766e; border:1px solid #99f6e4; cursor:pointer; }
                  .export-dropdown { position: relative; }
                  .export-dropdown > button { height:42px; border:none; border-radius:12px; padding:0 14px; font-weight:900; background:#111827; color:white; cursor:pointer; }
      
                  .result-summary, .content-block {
                    max-width: 1280px;
                    margin-left: auto !important;
                    margin-right: auto !important;
                  }
      
                  .content-block {
                    margin-top: 18px !important;
                  }
      
                  .account-card-desktop {
                    display: grid !important;
                    grid-template-columns: minmax(240px, 1.5fr) 180px 1fr auto;
                    align-items: center;
                    gap: 14px;
                    padding: 16px !important;
                    border-radius: 18px !important;
                  }
                  .account-card-desktop > div { margin: 0 !important; }
                  .account-card-desktop .account-actions { justify-content: flex-end; margin-top: 0 !important; }
      
                  .notes-block { max-width: 1280px; margin-left: auto !important; margin-right: auto !important; }
                  .notes-panel { position: fixed; right: 32px; top: 180px; width: 320px; max-height: calc(100vh - 220px); overflow: auto; z-index: 20; }
                  .filters-desktop, .agenda-card-polished, .dashboard-title-row, .summary-grid, .result-summary, .content-block { max-width: calc(1280px - 360px) !important; margin-left: auto !important; margin-right: 360px !important; }
      
      
      
                  /* ===== CORRECAO FINAL DESKTOP DASHBOARD ===== */
                  .dashboard-title-row {
                    max-width: none !important;
                    margin: 0 360px 20px 0 !important;
                    display: block !important;
                  }
      
                  .dashboard-title-row .main-title {
                    display: block !important;
                    width: 100% !important;
                    max-width: none !important;
                    line-height: 1.1 !important;
                    margin: 0 0 18px 0 !important;
                    white-space: normal !important;
                  }
      
                  .dashboard-title-row .summary-grid,
                  .summary-grid {
                    display: grid !important;
                    grid-template-columns: repeat(4, minmax(150px, 1fr)) !important;
                    gap: 14px !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                  }
      
                  .summary-grid > div {
                    min-width: 0 !important;
                    min-height: 92px !important;
                    padding: 16px !important;
                    border-radius: 18px !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: flex-start !important;
                    overflow: hidden !important;
                  }
      
                  .summary-grid span {
                    display: block !important;
                    width: 100% !important;
                    font-size: 13px !important;
                    line-height: 1.2 !important;
                    margin: 0 0 4px 0 !important;
                    white-space: nowrap !important;
                  }
      
                  .summary-grid strong {
                    display: block !important;
                    width: 100% !important;
                    font-size: 22px !important;
                    line-height: 1.1 !important;
                    margin: 0 !important;
                    white-space: nowrap !important;
                  }
      
                  .agenda-card-polished,
                  .filters-desktop,
                  .result-summary,
                  .content-block {
                    max-width: none !important;
                    margin-left: 0 !important;
                    margin-right: 360px !important;
                    width: auto !important;
                  }
      
                  .notes-panel {
                    position: fixed !important;
                    right: 32px !important;
                    top: 150px !important;
                    width: 320px !important;
                    max-height: calc(100vh - 180px) !important;
                    overflow: auto !important;
                    z-index: 20 !important;
                    background: #ffffff !important;
                    border-radius: 22px !important;
                    padding: 16px !important;
                    box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
                    border: 1px solid rgba(15,118,110,.10) !important;
                  }
      
                  .top-shell {
                    max-width: none !important;
                    margin: 0 0 28px 0 !important;
                  }
      
                  @media (min-width: 980px) and (max-width: 1220px) {
                    .dashboard-title-row,
                    .agenda-card-polished,
                    .filters-desktop,
                    .result-summary,
                    .content-block {
                      margin-right: 0 !important;
                    }
      
                    .notes-panel {
                      position: static !important;
                      width: auto !important;
                      max-height: none !important;
                      margin: 18px 0 !important;
                    }
                  }
      
                  .mobile-fab, .mobile-fab-menu { display: none !important; }
                }
      
      
      
                /* ===== DF GESTAO — LAYOUT LIMPO E BLINDADO ===== */
                @media (min-width: 980px) {
                  .app-page, .app-frame {
                    padding-left: 300px !important;
                    transition: padding-left .25s ease !important;
                  }
                  body:has(.desktop-sidebar.compacta) .app-page,
                  body:has(.desktop-sidebar.compacta) .app-frame {
                    padding-left: 112px !important;
                  }
                  .desktop-sidebar {
                    width: 244px !important;
                    overflow: hidden !important;
                    gap: 10px !important;
                  }
                  .desktop-sidebar.compacta {
                    width: 72px !important;
                    padding: 14px 10px !important;
                    align-items: center !important;
                  }
                  .desktop-sidebar.compacta .desktop-sidebar-brand {
                    justify-content: center !important;
                    padding-bottom: 10px !important;
                  }
                  .desktop-sidebar.compacta .desktop-sidebar-brand img {
                    width: 44px !important;
                    height: 44px !important;
                  }
                  .sidebar-collapse-btn {
                    display:flex; align-items:center; justify-content:center; gap:8px;
                    width:100%; border:1px solid rgba(255,255,255,.16); border-radius:14px;
                    background:rgba(255,255,255,.10); color:white; font-weight:900;
                    padding:9px 10px; cursor:pointer;
                  }
                  .desktop-sidebar-scroll {
                    width: 100%; overflow-y: auto; overflow-x: hidden; padding-right: 2px;
                    display: grid; gap: 8px;
                  }
                  .desktop-sidebar-scroll::-webkit-scrollbar { width: 4px; }
                  .desktop-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 999px; }
                  .sidebar-group-clean { display:grid; gap:5px; width:100%; }
                  .sidebar-group-toggle {
                    display:flex; align-items:center; justify-content:space-between;
                    width:100%; border:0; background:transparent; color:rgba(255,255,255,.70);
                    text-transform:uppercase; letter-spacing:.7px; font-size:10px; font-weight:900;
                    padding:8px 8px 2px; cursor:pointer;
                  }
                  .desktop-sidebar.compacta .sidebar-group-toggle { justify-content:center; padding:6px 0; }
                  .desktop-sidebar-nav button {
                    min-height: 42px !important; padding:10px 11px !important; border-radius:14px !important;
                    white-space: nowrap !important;
                  }
                  .desktop-sidebar.compacta .desktop-sidebar-nav button { justify-content:center !important; padding:10px 0 !important; }
                  .menu-icon { width:22px; text-align:center; flex:0 0 22px; }
                  .desktop-sidebar.compacta .menu-icon { width:auto; flex:auto; }
                  .desktop-sidebar.compacta .desktop-sidebar-user { width:44px !important; height:44px !important; border-radius:16px !important; padding:0 !important; display:flex; align-items:center; justify-content:center; }
                  .desktop-sidebar.compacta .sidebar-exit { width:100%; }
                  .top-shell { background:#ffffff !important; }
                  .top-shell strong, .desktop-sidebar-brand strong { letter-spacing:.1px; }
                  .dashboard-title-row { margin-right: 360px !important; }
                  body:has(.desktop-sidebar.compacta) .dashboard-title-row,
                  body:has(.desktop-sidebar.compacta) .summary-grid,
                  body:has(.desktop-sidebar.compacta) .agenda-card-polished,
                  body:has(.desktop-sidebar.compacta) .filters-desktop,
                  body:has(.desktop-sidebar.compacta) .result-summary,
                  body:has(.desktop-sidebar.compacta) .content-block { margin-right: 360px !important; }
                  .notes-panel {
                    right: 28px !important; top: 158px !important; width: 330px !important;
                    padding: 18px !important; border-radius: 24px !important;
                    box-shadow: 0 18px 40px rgba(15,23,42,.08) !important;
                  }
                  .quick-actions-card {
                    display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:14px; border-radius:18px;
                    background:linear-gradient(135deg,#f8fafc,#ecfeff); border:1px solid #ccfbf1; margin-bottom:14px;
                  }
                  .quick-actions-card strong { grid-column:1/-1; font-size:15px; }
                  .quick-actions-card button { border:0; border-radius:12px; padding:11px 10px; color:white; font-weight:900; cursor:pointer; }
                  .quick-actions-card button:nth-of-type(1) { background:linear-gradient(135deg,#14b8a6,#0f766e); }
                  .quick-actions-card button:nth-of-type(2) { background:#111827; }
                  .account-card-desktop .account-actions { display:flex !important; gap:8px !important; flex-wrap:nowrap !important; }
                  .account-card-desktop .account-actions button { min-width:74px !important; margin:0 !important; }
                  .note-event-date { display:inline-flex; margin:6px 0; padding:4px 8px; border-radius:999px; background:#eef2ff; color:#3730a3; font-weight:800; font-size:12px; }
                }
      
                @media (max-width: 979px) {
                  .mobile-menu-panel { padding-bottom: 24px !important; }
                  .mobile-menu-group { margin-top: 12px !important; }
                  .mobile-menu-group summary { padding: 10px 4px !important; font-weight:900; color:#0f766e; }
                  .mobile-fab-menu { display:grid !important; gap:10px !important; }
                  .notes-panel { position: static !important; width:auto !important; max-height:none !important; overflow:visible !important; }
                  .quick-actions-card { display:none !important; }
                }
      
      
      
                /* ===== AJUSTE LIMPO: NOTAS NO FLUXO DO DASHBOARD ===== */
                @media (min-width: 980px) {
                  .dashboard-title-row,
                  .agenda-card-polished,
                  .filters-desktop,
                  .result-summary,
                  .content-block,
                  .dashboard-notes-card {
                    max-width: 1280px !important;
                    width: 100% !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    box-sizing: border-box !important;
                  }
      
                  body:has(.desktop-sidebar.compacta) .dashboard-title-row,
                  body:has(.desktop-sidebar.compacta) .summary-grid,
                  body:has(.desktop-sidebar.compacta) .agenda-card-polished,
                  body:has(.desktop-sidebar.compacta) .filters-desktop,
                  body:has(.desktop-sidebar.compacta) .result-summary,
                  body:has(.desktop-sidebar.compacta) .content-block {
                    margin-right: auto !important;
                  }
      
                  .dashboard-notes-card {
                    position: static !important;
                    display: grid !important;
                    grid-template-columns: minmax(240px, 320px) minmax(0, 1fr) !important;
                    gap: 16px !important;
                    padding: 18px !important;
                    margin-top: 18px !important;
                    margin-bottom: 18px !important;
                    border-radius: 24px !important;
                    background: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
                    overflow: visible !important;
                    white-space: normal !important;
                    z-index: auto !important;
                  }
      
                  .dashboard-notes-card .quick-actions-card {
                    margin: 0 !important;
                    align-self: start !important;
                  }
      
                  .dashboard-notes-card .notes-header-clean,
                  .dashboard-notes-card .notes-list-dashboard,
                  .dashboard-notes-card .notes-see-all,
                  .dashboard-notes-card > p {
                    grid-column: 2 !important;
                    min-width: 0 !important;
                  }
      
                  .dashboard-notes-card .notes-header-clean {
                    display: flex !important;
                    align-items: flex-start !important;
                    justify-content: space-between !important;
                    flex-wrap: wrap !important;
                    gap: 12px !important;
                    margin-bottom: 10px !important;
                  }
      
                  .dashboard-notes-card .notes-stats-row {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                    margin-top: 8px !important;
                  }
      
                  .dashboard-notes-card .notes-list-dashboard {
                    display: grid !important;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
                    gap: 12px !important;
                  }
      
                  .dashboard-notes-card .notes-list-dashboard > div {
                    margin: 0 !important;
                    min-width: 0 !important;
                    overflow: hidden !important;
                  }
      
                  .dashboard-notes-card .notes-see-all {
                    justify-self: start !important;
                    margin-top: 4px !important;
                  }
                }
      
                @media (max-width: 979px) {
                  .dashboard-notes-card {
                    position: static !important;
                    width: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    margin: 14px 0 18px !important;
                    padding: 16px !important;
                    border-radius: 22px !important;
                    background: #ffffff !important;
                    border: 1px solid #e5e7eb !important;
                    box-shadow: 0 12px 28px rgba(15,23,42,.08) !important;
                    white-space: normal !important;
                  }
                }
      
                @media print {
                  html,
                  body {
                    background: #ffffff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    overflow: visible !important;
                  }
      
                  .app-page {
                    min-height: auto !important;
                    padding-bottom: 0 !important;
                    background: #ffffff !important;
                  }
      
                  button,
                  .no-print {
                    display: none !important;
                  }
      
                  .print-header {
                    display: block !important;
                    text-align: center;
                    margin-bottom: 14px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                  }
      
                  .print-header h1 {
                    font-size: 20px;
                    margin: 0 0 4px 0;
                  }
      
                  .print-header p {
                    font-size: 11px;
                    margin: 0;
                    color: #555;
                  }
      
                  .print-footer {
                    display: block !important;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 6px;
                    background: #fff;
                  }
      
                  .print-card {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    box-shadow: none !important;
                    border: 1px solid #ddd;
                  }
      
                  @page {
                    size: A4;
                    margin: 12mm 12mm 18mm 12mm;
                  }
                }
              `}
            </style>
      <style>{`
              /* ===== CORRECAO ESTRUTURAL DEFINITIVA: DASHBOARD + NOTAS ===== */
              @media (min-width: 980px) {
                html, body, #root {
                  max-width: 100%;
                  overflow-x: hidden !important;
                }
      
                .app-page,
                .app-frame {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow-x: hidden !important;
                }
      
                .app-frame-content {
                  width: 100% !important;
                  max-width: 1280px !important;
                  margin-left: auto !important;
                  margin-right: auto !important;
                  overflow-x: hidden !important;
                }
      
                .dashboard-title-row,
                .agenda-card-polished,
                .filters-desktop,
                .result-summary,
                .content-block,
                .dashboard-notes-card {
                  max-width: 1280px !important;
                  width: 100% !important;
                  margin-left: auto !important;
                  margin-right: auto !important;
                  box-sizing: border-box !important;
                }
      
                body:has(.desktop-sidebar.compacta) .dashboard-title-row,
                body:has(.desktop-sidebar.compacta) .summary-grid,
                body:has(.desktop-sidebar.compacta) .agenda-card-polished,
                body:has(.desktop-sidebar.compacta) .filters-desktop,
                body:has(.desktop-sidebar.compacta) .result-summary,
                body:has(.desktop-sidebar.compacta) .content-block,
                body:has(.desktop-sidebar.compacta) .dashboard-notes-card {
                  margin-left: auto !important;
                  margin-right: auto !important;
                }
      
                .dashboard-title-row {
                  display: block !important;
                  margin-top: 0 !important;
                  margin-bottom: 18px !important;
                }
      
                .dashboard-title-row .main-title {
                  width: 100% !important;
                  margin: 0 0 16px 0 !important;
                  white-space: normal !important;
                }
      
                .dashboard-title-row .summary-grid,
                .summary-grid {
                  display: grid !important;
                  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                  gap: 14px !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                }
      
                .summary-grid > div {
                  min-width: 0 !important;
                  overflow: hidden !important;
                }
      
                .dashboard-notes-card,
                .notes-panel {
                  position: static !important;
                  inset: auto !important;
                  right: auto !important;
                  top: auto !important;
                  left: auto !important;
                  bottom: auto !important;
                  width: 100% !important;
                  max-width: 1280px !important;
                  max-height: none !important;
                  overflow: hidden !important;
                  z-index: auto !important;
                }
      
                .dashboard-notes-card {
                  display: grid !important;
                  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr) !important;
                  gap: 16px !important;
                  align-items: start !important;
                  padding: 18px !important;
                  margin-top: 18px !important;
                  margin-bottom: 18px !important;
                  border-radius: 24px !important;
                  background: #ffffff !important;
                  border: 1px solid #e5e7eb !important;
                  box-shadow: 0 18px 44px rgba(15,23,42,.08) !important;
                  box-sizing: border-box !important;
                }
      
                .dashboard-notes-card .quick-actions-card {
                  grid-column: 1 !important;
                  grid-row: 1 / span 4 !important;
                  margin: 0 !important;
                  min-width: 0 !important;
                }
      
                .dashboard-notes-card .notes-header-clean,
                .dashboard-notes-card .notes-list-dashboard,
                .dashboard-notes-card .notes-see-all,
                .dashboard-notes-card > p {
                  grid-column: 2 !important;
                  min-width: 0 !important;
                }
      
                .dashboard-notes-card .notes-list-dashboard {
                  display: grid !important;
                  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
                  gap: 12px !important;
                  overflow: hidden !important;
                }
      
                .dashboard-notes-card .notes-list-dashboard > div,
                .dashboard-notes-card .notes-header-clean,
                .dashboard-notes-card .notes-title-wrap {
                  min-width: 0 !important;
                  max-width: 100% !important;
                  overflow-wrap: anywhere !important;
                }
      
                .dashboard-notes-card .notes-see-all {
                  justify-self: start !important;
                }
              }
      
              @media (min-width: 980px) and (max-width: 1180px) {
                .dashboard-title-row .summary-grid,
                .summary-grid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
      
                .dashboard-notes-card {
                  grid-template-columns: 1fr !important;
                }
      
                .dashboard-notes-card .quick-actions-card,
                .dashboard-notes-card .notes-header-clean,
                .dashboard-notes-card .notes-list-dashboard,
                .dashboard-notes-card .notes-see-all,
                .dashboard-notes-card > p {
                  grid-column: 1 !important;
                  grid-row: auto !important;
                }
              }
      
              @media (max-width: 979px) {
                .dashboard-notes-card,
                .notes-panel {
                  position: static !important;
                  width: auto !important;
                  max-width: 100% !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
              }
      
      
              /* ===== REFINAMENTO PRODUTO: BOTOES, MENU E NOTAS ===== */
              @media (min-width: 980px) {
                .dashboard-heading-actions {
                  display:flex !important;
                  align-items:flex-start !important;
                  justify-content:space-between !important;
                  gap:14px !important;
                  width:100% !important;
                  margin-bottom:16px !important;
                }
                .dashboard-heading-actions .main-title { margin:0 !important; }
                .btn-dashboard-primary,
                .btn-action-ghost,
                .note-add-small,
                .note-toggle-small,
                .notes-see-all {
                  border:1px solid #d1d5db !important;
                  background:#ffffff !important;
                  color:#374151 !important;
                  border-radius:999px !important;
                  padding:7px 12px !important;
                  font-size:13px !important;
                  font-weight:800 !important;
                  line-height:1 !important;
                  box-shadow:none !important;
                  width:auto !important;
                  min-width:auto !important;
                  cursor:pointer !important;
                  transition:background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease !important;
                }
                .btn-dashboard-primary:hover,
                .btn-action-ghost:hover,
                .note-add-small:hover,
                .note-toggle-small:hover,
                .notes-see-all:hover {
                  background:#f9fafb !important;
                  border-color:#9ca3af !important;
                  color:#111827 !important;
                  transform:translateY(-1px) !important;
                }
                .sidebar-collapse-btn {
                  background:transparent !important;
                  border:1px solid rgba(255,255,255,.10) !important;
                  color:rgba(255,255,255,.82) !important;
                  opacity:.72 !important;
                  min-height:34px !important;
                  padding:6px 8px !important;
                }
                .sidebar-collapse-btn small { font-size:11px !important; color:rgba(255,255,255,.68) !important; }
                .sidebar-collapse-btn:hover { opacity:1 !important; background:rgba(255,255,255,.08) !important; }
                .dashboard-notes-card {
                  display:block !important;
                  grid-template-columns:1fr !important;
                  padding:18px !important;
                }
                .dashboard-notes-card .notes-header-clean,
                .dashboard-notes-card .notes-list-dashboard,
                .dashboard-notes-card .notes-see-all,
                .dashboard-notes-card > p {
                  grid-column:auto !important;
                }
                .notes-header-actions { display:flex !important; align-items:center !important; gap:8px !important; flex-wrap:wrap !important; }
                .notes-page-grid .btn-action-ghost { justify-self:start; }
                .account-actions button,
                .notes-page-grid button,
                .content-block button {
                  font-weight:800 !important;
                  border-radius:10px !important;
                  cursor:pointer !important;
                }
              }
              @media (max-width: 979px) {
                .dashboard-heading-actions { display:grid !important; gap:10px !important; }
                .btn-dashboard-primary,
                .btn-action-ghost,
                .note-add-small,
                .note-toggle-small,
                .notes-see-all {
                  width:auto !important;
                  border:1px solid #d1d5db !important;
                  background:#ffffff !important;
                  color:#374151 !important;
                  border-radius:999px !important;
                  padding:7px 12px !important;
                  font-size:13px !important;
                  font-weight:800 !important;
                }
              }
              @media (max-width: 979px) {
                html, body, #root {
                  max-width: 100% !important;
                  overflow-x: hidden !important;
                }
      
                .app-page,
                .app-frame {
                  width: 100% !important;
                  max-width: 430px !important;
                  margin: 0 auto !important;
                  overflow-x: hidden !important;
                  box-sizing: border-box !important;
                }
      
                .top-shell {
                  margin: 0 0 14px 0 !important;
                  padding: 12px !important;
                  border-radius: 18px !important;
                  box-shadow: 0 10px 24px rgba(15,23,42,.06) !important;
                }
      
                .mobile-menu-trigger {
                  width: 40px !important;
                  height: 40px !important;
                  border-radius: 14px !important;
                  background: #ffffff !important;
                  color: #0f172a !important;
                  border: 1px solid #e5e7eb !important;
                  box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
                }
      
                .mobile-menu-panel {
                  width: min(92vw, 360px) !important;
                  max-height: calc(100vh - 28px) !important;
                  overflow-y: auto !important;
                  border-radius: 24px !important;
                  padding: 16px !important;
                  box-sizing: border-box !important;
                }
      
                .mobile-menu-group {
                  margin-top: 12px !important;
                }
      
                .mobile-menu-group summary {
                  list-style: none !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: space-between !important;
                  padding: 8px 2px !important;
                  color: #0f766e !important;
                  font-size: 12px !important;
                  font-weight: 900 !important;
                  letter-spacing: .05em !important;
                  text-transform: uppercase !important;
                }
      
                .mobile-menu-group summary::-webkit-details-marker { display: none !important; }
      
                .mobile-menu-group button,
                .mobile-menu-panel button {
                  border-radius: 16px !important;
                  background: #ffffff !important;
                  border: 1px solid #e5e7eb !important;
                  color: #0f172a !important;
                  box-shadow: none !important;
                }
      
                .mobile-menu-group button span:first-child {
                  width: 34px !important;
                  height: 34px !important;
                  display: inline-flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  border-radius: 12px !important;
                  background: #f0fdfa !important;
                }
      
                .dashboard-title-row,
                .summary-grid,
                .agenda-card-polished,
                .filters-desktop,
                .result-summary,
                .content-block,
                .dashboard-notes-card {
                  width: 100% !important;
                  max-width: 100% !important;
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  box-sizing: border-box !important;
                }
      
                .summary-grid {
                  display: grid !important;
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                  gap: 10px !important;
                }
      
                .summary-grid > div,
                .agenda-card-polished,
                .result-summary,
                .content-block,
                .dashboard-notes-card {
                  border-radius: 18px !important;
                }
      
                .agenda-card-polished,
                .filters-desktop {
                  display: grid !important;
                  grid-template-columns: 1fr !important;
                  gap: 12px !important;
                }
      
                .agenda-compact-items,
                .export-actions,
                .account-actions,
                .notes-list-dashboard .account-actions {
                  display: flex !important;
                  gap: 8px !important;
                  flex-wrap: wrap !important;
                }
      
                .advanced-filters {
                  display: grid !important;
                  grid-template-columns: 1fr !important;
                  gap: 10px !important;
                }
      
                .dashboard-notes-card {
                  padding: 14px !important;
                  overflow: visible !important;
                }
      
                .notes-header-clean {
                  align-items: flex-start !important;
                  gap: 12px !important;
                }
      
                .notes-list-dashboard {
                  display: grid !important;
                  grid-template-columns: 1fr !important;
                  gap: 10px !important;
                }
      
                .global-fab {
                  right: 18px !important;
                  bottom: max(20px, env(safe-area-inset-bottom)) !important;
                  width: 50px !important;
                  height: 50px !important;
                  border-radius: 18px !important;
                  font-size: 26px !important;
                  background: #ffffff !important;
                  color: #0f172a !important;
                  border: 1px solid #e5e7eb !important;
                  box-shadow: 0 12px 30px rgba(15,23,42,.16) !important;
                  z-index: 5000 !important;
                }
      
                .global-fab-menu {
                  right: 18px !important;
                  bottom: calc(76px + env(safe-area-inset-bottom)) !important;
                  z-index: 5001 !important;
                }
      
                .global-fab-menu button {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  border: 1px solid #e5e7eb !important;
                  box-shadow: 0 10px 26px rgba(15,23,42,.14) !important;
                }
      
                .content-block {
                  padding-bottom: 84px !important;
                }
              }
      
      
      
              /* HOTFIX VALIDACAO: contas em aberto, PDF, FAB global e menu mobile */
              .dashboard-section-header-accounts {
                display:flex !important;
                align-items:flex-start !important;
                justify-content:space-between !important;
                gap:12px !important;
                flex-wrap:wrap !important;
              }
              .dashboard-section-title-wrap {
                display:grid !important;
                gap:4px !important;
                min-width:0 !important;
                flex:1 1 190px !important;
              }
              .dashboard-section-actions {
                display:flex !important;
                align-items:center !important;
                justify-content:flex-end !important;
                gap:8px !important;
                flex:0 0 auto !important;
              }
              .dashboard-see-all-link {
                border:1px solid #d1d5db !important;
                background:#fff !important;
                color:#374151 !important;
                border-radius:999px !important;
                padding:7px 11px !important;
                font-size:12px !important;
                font-weight:900 !important;
                min-height:34px !important;
                box-shadow:none !important;
                white-space:nowrap !important;
              }
              .dashboard-open-accounts.accounts-collapsed {
                padding-bottom:16px !important;
              }
              .mobile-menu-trigger {
                display:inline-flex !important;
                align-items:center !important;
                justify-content:center !important;
                line-height:1 !important;
                padding:0 !important;
              }
              .mobile-menu-panel {
                overscroll-behavior: contain !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: pan-y !important;
              }
              .mobile-menu-panel * {
                touch-action: pan-y !important;
              }
              @media (max-width: 979px) {
                .page-title-actions {
                  margin-top: 10px !important;
                }
                .dashboard-section-header-accounts {
                  align-items:center !important;
                }
                .dashboard-section-actions {
                  margin-left:auto !important;
                }
                .dashboard-see-all-link {
                  padding:6px 10px !important;
                  font-size:12px !important;
                }
                .note-toggle-small {
                  min-width:42px !important;
                  width:42px !important;
                  height:42px !important;
                  padding:0 !important;
                  display:inline-flex !important;
                  align-items:center !important;
                  justify-content:center !important;
                  border-radius:999px !important;
                }
              }
      
      
              /* PADRONIZACAO FINAL: links de ver paginas, busca ampla e status visual */
              .dashboard-notes-card .dashboard-section-actions,
              .notes-header-actions {
                display:flex !important;
                align-items:center !important;
                justify-content:flex-end !important;
                gap:8px !important;
                flex:0 0 auto !important;
              }
              .dashboard-open-list {
                display:grid !important;
                gap:10px !important;
              }
              .dashboard-account-row {
                border:1px solid #e5e7eb !important;
                border-left:5px solid #f59e0b !important;
                background:#fffbeb !important;
                border-radius:18px !important;
                padding:14px !important;
                display:flex !important;
                align-items:center !important;
                justify-content:space-between !important;
                gap:12px !important;
              }
              .dashboard-account-row.account-row-vencido {
                border-left-color:#ef4444 !important;
                background:#fff1f2 !important;
              }
              .dashboard-account-row.account-row-pendente {
                border-left-color:#f59e0b !important;
                background:#fffbeb !important;
              }
              .dashboard-account-row > div:first-child {
                display:grid !important;
                gap:4px !important;
                min-width:0 !important;
              }
              .dashboard-account-row > div:first-child small {
                color:#64748b !important;
                font-weight:700 !important;
              }
              .dashboard-account-row-actions {
                display:flex !important;
                align-items:center !important;
                justify-content:flex-end !important;
                gap:8px !important;
                flex-wrap:wrap !important;
              }
              .dashboard-account-row-actions > span:first-child {
                font-size:18px !important;
                font-weight:900 !important;
                color:#0f172a !important;
              }
              .status-pill.status-pendente {
                background:#fef3c7 !important;
                color:#92400e !important;
              }
              .status-pill.status-vencido {
                background:#fee2e2 !important;
                color:#991b1b !important;
              }
              .status-pill.status-pago {
                background:#dcfce7 !important;
                color:#166534 !important;
              }
              @media (max-width: 979px) {
                .dashboard-account-row {
                  align-items:flex-start !important;
                  flex-direction:column !important;
                }
                .dashboard-account-row-actions {
                  width:100% !important;
                  justify-content:flex-start !important;
                }
                .dashboard-section-header,
                .notes-header-clean {
                  gap:10px !important;
                }
                .dashboard-see-all-link {
                  min-width:auto !important;
                }
              }
      
              /* Identidade visual única para botões do produto */
              .filter-toggle-button,
              .export-actions button,
              .account-actions button,
              .notes-list-dashboard button,
              .notes-page-section button,
              .users-page-section button,
              .btn-back-page,
              .agenda-card-polished button,
              .notes-see-all,
              .note-toggle-small {
                border-radius: 999px !important;
                padding: 8px 12px !important;
                min-height: 36px !important;
                font-size: 13px !important;
                font-weight: 800 !important;
                border: 1px solid #d1d5db !important;
                background: #ffffff !important;
                color: #374151 !important;
                box-shadow: none !important;
              }
      
              .account-actions button:hover,
              .notes-list-dashboard button:hover,
              .export-actions button:hover,
              .filter-toggle-button:hover,
              .notes-see-all:hover,
              .note-toggle-small:hover {
                background: #f8fafc !important;
                border-color: #94a3b8 !important;
                color: #0f172a !important;
              }
      
              .account-actions button:first-child,
              .notes-list-dashboard button:first-child,
              .agenda-card-polished button {
                border-color: #99f6e4 !important;
                background: #f0fdfa !important;
                color: #0f766e !important;
              }
      
              .account-actions button:last-child,
              .notes-list-dashboard button:last-child,
              .users-page-section button[title*="Remover"] {
                border-color: #fecaca !important;
                background: #fff1f2 !important;
                color: #be123c !important;
              }
      
              /* FECHAMENTO MOBILE: alinhamentos, header, chips e menu */
              .top-shell-clean {
                background: #ffffff !important;
                border: 1px solid #e5e7eb !important;
                box-shadow: 0 6px 18px rgba(15,23,42,.06) !important;
              }
              .top-shell-logo span {
                display: grid !important;
                gap: 1px !important;
                line-height: 1.1 !important;
              }
              .top-shell-logo strong {
                display: block !important;
                white-space: normal !important;
                font-size: 15px !important;
              }
              .top-shell-logo small {
                display: block !important;
                font-size: 12px !important;
                color: #64748b !important;
                font-weight: 700 !important;
              }
              .dashboard-open-accounts.content-block,
              .dashboard-notes-card {
                padding: 16px !important;
                border-radius: 20px !important;
                overflow: visible !important;
              }
              .dashboard-section-header-accounts,
              .notes-header-clean {
                display: flex !important;
                align-items: flex-start !important;
                justify-content: space-between !important;
                gap: 12px !important;
              }
              .dashboard-section-title-wrap,
              .notes-title-wrap {
                padding-top: 2px !important;
                min-width: 0 !important;
                flex: 1 1 auto !important;
              }
              .dashboard-section-title-wrap strong,
              .notes-title {
                display: block !important;
                line-height: 1.25 !important;
                margin-bottom: 4px !important;
              }
              .dashboard-section-actions,
              .notes-header-actions {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: flex-end !important;
                gap: 8px !important;
                margin-top: 0 !important;
              }
              .dashboard-see-all-link,
              .note-toggle-small {
                height: 36px !important;
                min-height: 36px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .note-toggle-small {
                width: 36px !important;
                min-width: 36px !important;
                padding: 0 !important;
                font-size: 18px !important;
                line-height: 1 !important;
              }
              .notes-stats-row,
              .notes-page-stats {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 6px !important;
              }
              .note-stat {
                background: #f8fafc !important;
                border: 1px solid #e5e7eb !important;
                color: #475569 !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                padding: 4px 8px !important;
                border-radius: 999px !important;
              }
              .note-stat-critico { border-color: #fecaca !important; color: #991b1b !important; background: #fff7f7 !important; }
              .note-stat-urgente { border-color: #fde68a !important; color: #92400e !important; background: #fffbeb !important; }
              .mobile-menu-trigger {
                background: #ffffff !important;
                color: #0f766e !important;
                border: 1px solid #d8eee9 !important;
                box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0 !important;
                line-height: 1 !important;
              }
              .mobile-menu-panel {
                max-height: calc(100dvh - 104px) !important;
                overflow-y: auto !important;
                overscroll-behavior: contain !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: auto !important;
              }
              .mobile-menu-panel * { touch-action: auto !important; }
              @media (max-width: 979px) {
                .app-frame-content,
                .app-page { padding-bottom: 92px !important; }
                .dashboard-section-header-accounts,
                .notes-header-clean { align-items: flex-start !important; }
              }
            `}</style>
    </>
  )
}
