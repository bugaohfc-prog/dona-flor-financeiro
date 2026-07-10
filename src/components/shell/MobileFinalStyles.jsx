export default function MobileFinalStyles() {
  return (
    <style>{`
      @media (max-width: 979px) {
        html.mobile-nav-open,
        body.mobile-nav-open {
          overflow: hidden !important;
          overscroll-behavior: none !important;
          touch-action: none !important;
        }

        .mobile-menu-backdrop {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          touch-action: none !important;
          padding: calc(env(safe-area-inset-top, 0px) + 76px) 12px calc(env(safe-area-inset-bottom, 0px) + 12px) 12px !important;
          align-items: flex-start !important;
        }

        .mobile-menu-panel {
          width: min(92vw, 372px) !important;
          height: auto !important;
          max-height: calc(100dvh - 96px - env(safe-area-inset-bottom, 0px)) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior-y: contain !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          scrollbar-width: thin !important;
          display: block !important;
          padding: 14px 14px 18px !important;
        }

        .mobile-menu-panel * {
          touch-action: auto !important;
        }

        .mobile-menu-panel .mobile-menu-group:last-child {
          padding-bottom: 18px !important;
        }

        .mobile-menu-group[open] {
          display: block !important;
        }

        .mobile-menu-group summary {
          min-height: 40px !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
          background: #ffffff !important;
        }

        .mobile-menu-group button,
        .mobile-menu-panel button {
          width: 100% !important;
          min-height: 54px !important;
          margin: 6px 0 !important;
          box-sizing: border-box !important;
        }

        .filters-desktop {
          display: grid !important;
          gap: 10px !important;
        }

        .filters-desktop .filter-toggle-button,
        .filters-desktop .export-actions button {
          height: 44px !important;
          min-height: 44px !important;
          padding: 0 14px !important;
          border-radius: 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          box-sizing: border-box !important;
          white-space: nowrap !important;
        }

        .filters-desktop .export-actions {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
          align-items: center !important;
          width: 100% !important;
          margin: 0 !important;
        }

        .filters-desktop .advanced-filters,
        .filters-desktop .status-tabs {
          width: 100% !important;
        }

        .dashboard-account-row {
          align-items: stretch !important;
          gap: 12px !important;
          padding: 13px !important;
        }

        .dashboard-account-row > div:first-child {
          min-width: 0 !important;
        }

        .dashboard-account-row > div:first-child strong,
        .dashboard-account-row > div:first-child small {
          overflow-wrap: anywhere !important;
        }

        .dashboard-account-row-actions {
          min-width: 112px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-end !important;
          justify-content: center !important;
          gap: 6px !important;
          margin-left: auto !important;
          flex: 0 0 auto !important;
        }

        .dashboard-account-row-actions .dashboard-account-value {
          font-size: 14px !important;
          font-weight: 900 !important;
          color: #0f172a !important;
          white-space: nowrap !important;
        }

        .dashboard-account-row-actions .status-pill {
          min-width: 82px !important;
          text-align: center !important;
          justify-content: center !important;
        }

        .dashboard-paid-button {
          min-width: 82px !important;
          height: 36px !important;
          min-height: 36px !important;
          padding: 0 12px !important;
          border-radius: 999px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
        }

        .trash-card {
          padding: 13px !important;
          gap: 10px !important;
        }

        .trash-card small {
          color: #64748b !important;
          font-weight: 700 !important;
          line-height: 1.45 !important;
        }

        .trash-card .userActions,
        .trash-card [style*="display: flex"] {
          gap: 8px !important;
        }

        .trash-card button {
          min-height: 40px !important;
          border-radius: 12px !important;
        }

        .trash-card button:last-child {
          background: #fff7f7 !important;
          color: #b91c1c !important;
          border: 1px solid #fecaca !important;
        }
      }
    `}</style>
  )
}
