export default function DesktopRefinementStyles() {
  return (
    <style>{`
      @media (min-width: 980px) {
        .top-shell .mobile-menu-trigger { display: none !important; }
        .desktop-sidebar.no-print {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 18px 44px rgba(15, 23, 42, .08) !important;
        }
        .desktop-sidebar-brand { border-bottom: 1px solid #e2e8f0 !important; }
        .desktop-sidebar-brand img { background: #f0fdfa !important; border: 1px solid #ccfbf1 !important; }
        .desktop-sidebar-brand strong, .desktop-sidebar-user strong { color: #0f172a !important; }
        .desktop-sidebar-brand small, .desktop-sidebar-user small { color: #64748b !important; }
        .desktop-sidebar-user.sidebar-user-clean { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
        .sidebar-user-avatar { background: #f0fdfa !important; color: #0f766e !important; border: 1px solid #ccfbf1 !important; }
        .sidebar-collapse-btn {
          width: 42px !important; height: 42px !important; min-height: 42px !important; padding: 0 !important; margin: 8px auto 14px !important;
          display: inline-flex !important; align-items: center !important; justify-content: center !important; align-self: center !important;
          background: #f0fdfa !important; color: #0f766e !important; border: 1px solid #99f6e4 !important;
          box-shadow: 0 8px 18px rgba(15, 118, 110, .10) !important;
          transition: transform .18s ease, background .18s ease, box-shadow .18s ease !important;
        }
        .sidebar-collapse-btn:hover { background: #ccfbf1 !important; transform: translateY(-1px) !important; box-shadow: 0 12px 24px rgba(15, 118, 110, .14) !important; }
        .sidebar-collapse-btn small { display: none !important; }
        .sidebar-collapse-btn small, .sidebar-collapse-arrow { color: #0f766e !important; font-weight: 900 !important; }
        .sidebar-collapse-arrow { width: 22px !important; height: 22px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; border-radius: 999px !important; background: #ffffff !important; }
        .sidebar-group-toggle { color: #94a3b8 !important; }
        .sidebar-group-toggle strong { background: #f1f5f9 !important; color: #64748b !important; }
        .desktop-sidebar-nav button { color: #64748b !important; background: transparent !important; border: 1px solid transparent !important; font-weight: 700 !important; }
        .desktop-sidebar-nav button:hover { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #0f172a !important; }
        .desktop-sidebar-nav button.active { background: #f0fdfa !important; border-color: #99f6e4 !important; color: #0f766e !important; box-shadow: inset 3px 0 0 #0f766e !important; }
        .desktop-sidebar-nav button.active .menu-icon, .desktop-sidebar-nav button:hover .menu-icon { color: #0f766e !important; }

        .summary-grid > div, .result-summary, .content-block, .agenda-card-polished, [class*="users-page-section"] {
          border: 1px solid #f1f5f9 !important; box-shadow: 0 12px 28px rgba(15, 23, 42, .055) !important;
        }
        .account-card-desktop { background: #ffffff !important; border: 1px solid #f1f5f9 !important; box-shadow: 0 10px 24px rgba(15, 23, 42, .045) !important; border-left: 4px solid transparent !important; }
        .account-card-desktop.account-card-vencida { border-left-color: #f87171 !important; background: #ffffff !important; }
        .account-card-desktop.account-card-paga { border-left-color: #86efac !important; background: #ffffff !important; }
        .account-card-desktop.account-card-pendente { border-left-color: #cbd5e1 !important; background: #ffffff !important; }
        .account-card-desktop strong { color: #0f172a !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: block !important; }
        .account-meta-line { color: #64748b !important; min-width: 0 !important; flex-wrap: wrap !important; }
        .status-pill { border-radius: 999px !important; padding: 4px 10px !important; font-size: 12px !important; font-weight: 800 !important; }
        .status-pago { background: #dcfce7 !important; color: #166534 !important; }
        .status-pendente { background: #f1f5f9 !important; color: #475569 !important; }
        .status-vencido { background: #fee2e2 !important; color: #b91c1c !important; }

        .notes-list-dashboard p, .trash-card p { white-space: pre-wrap !important; overflow-wrap: anywhere !important; }
        .notes-list-dashboard > div { background: #ffffff !important; border: 1px solid #f1f5f9 !important; border-radius: 16px !important; box-shadow: 0 8px 20px rgba(15, 23, 42, .04) !important; }
        .notes-list-dashboard button:last-child { background: transparent !important; border-color: transparent !important; color: #94a3b8 !important; box-shadow: none !important; }
        .notes-list-dashboard button:last-child:hover { background: #fee2e2 !important; color: #dc2626 !important; }

        .users-page-section { gap: 14px !important; padding: 18px 20px !important; border-radius: 18px !important; }
        .users-account-grid { grid-template-columns: repeat(2, minmax(280px, 1fr)) !important; gap: 14px !important; }
        .users-form-card, .users-add-card, .users-permission-guide { box-shadow: none !important; background: #ffffff !important; border-color: #e2e8f0 !important; }
        .users-form-card { padding: 14px !important; border-radius: 14px !important; gap: 10px !important; }
        .users-form-card input, .users-add-card input, .users-add-card select { min-height: 42px !important; }
        .users-form-card button, .users-add-card button { min-height: 42px !important; }
        .users-permission-guide { padding: 12px !important; border-radius: 16px !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .users-permission-guide span { min-height: 54px !important; padding: 10px 12px !important; border-radius: 12px !important; background: #f8fafc !important; display: flex !important; align-items: center !important; line-height: 1.25 !important; }
        .users-add-card { grid-template-columns: minmax(170px, .9fr) minmax(220px, 1.1fr) 160px auto !important; gap: 10px !important; padding: 12px !important; border-radius: 16px !important; }
        .users-list { gap: 8px !important; }
        .userCard { display: grid !important; grid-template-columns: minmax(220px, 1fr) auto 150px auto !important; align-items: center !important; gap: 12px !important; background: #ffffff !important; border-radius: 14px !important; border: 1px solid #f1f5f9 !important; padding: 12px 14px !important; box-shadow: none !important; }
        .userInfo { min-width: 0 !important; }
        .userInfo strong, .userInfo small { display: block !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
        .roleBadge { padding: 5px 11px !important; border-radius: 999px !important; font-size: 12px !important; font-weight: 800 !important; text-transform: capitalize !important; white-space: nowrap !important; }
        .roleBadge.admin { background: #f3e8ff !important; color: #7e22ce !important; }
        .roleBadge.gerente { background: #e0f2fe !important; color: #0369a1 !important; }
        .roleBadge.operador { background: #f1f5f9 !important; color: #475569 !important; }
        .user-role-select { max-width: 150px !important; margin: 0 !important; min-height: 38px !important; }
        .user-actions { gap: 6px !important; }
        .user-actions button { min-height: 32px !important; padding: 6px 10px !important; font-size: 12px !important; border-radius: 9px !important; }
        .user-actions button:disabled { opacity: .42 !important; cursor: not-allowed !important; filter: grayscale(1) !important; }

        .trash-card { background: #fcfcfd !important; border: 1px dashed #cbd5e1 !important; border-radius: 18px !important; color: #64748b !important; box-shadow: none !important; }
        .trash-card strong { color: #64748b !important; text-decoration: line-through !important; }
        .agenda-page-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; }
        .relatorios-page [style*="grid-template-columns: 1fr 1fr 1fr"], .relatorios-page [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; }
      }
    `}</style>
  )
}
