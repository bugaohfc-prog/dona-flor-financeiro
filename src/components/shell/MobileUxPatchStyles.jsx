export default function MobileUxPatchStyles() {
  return (
    <style>{`
      @media (max-width: 979px) {
        .dashboard-open-list .dashboard-account-row {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) auto !important;
          align-items: center !important;
          gap: 10px 12px !important;
          padding: 14px !important;
          border-radius: 18px !important;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .045) !important;
        }

        .dashboard-open-list .dashboard-account-row.account-row-pendente {
          background: #fffdf2 !important;
          border-color: #fde68a !important;
          border-left-color: #fbbf24 !important;
        }

        .dashboard-open-list .dashboard-account-row.account-row-vencido {
          background: #fff7f7 !important;
          border-color: #fecaca !important;
          border-left-color: #f87171 !important;
        }

        .dashboard-open-list .dashboard-account-row > div:first-child {
          grid-column: 1 / 2 !important;
          min-width: 0 !important;
          align-self: center !important;
        }

        .dashboard-open-list .dashboard-account-row-actions {
          grid-column: 2 / 3 !important;
          width: auto !important;
          min-width: 116px !important;
          display: grid !important;
          grid-template-columns: auto auto !important;
          grid-template-areas:
            "valor valor"
            "status pago" !important;
          align-items: center !important;
          justify-content: end !important;
          gap: 6px 8px !important;
          margin-left: 0 !important;
        }

        .dashboard-open-list .dashboard-account-value {
          grid-area: valor !important;
          text-align: right !important;
          font-size: 17px !important;
          line-height: 1.15 !important;
        }

        .dashboard-open-list .status-pill {
          grid-area: status !important;
          min-width: auto !important;
          padding: 4px 9px !important;
          font-size: 11px !important;
          line-height: 1 !important;
        }

        .dashboard-open-list .dashboard-paid-button {
          grid-area: pago !important;
          min-width: 68px !important;
          height: 34px !important;
          min-height: 34px !important;
          padding: 0 14px !important;
          box-shadow: 0 6px 12px rgba(15, 118, 110, .10) !important;
        }

        .account-card-desktop {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-left: 5px solid #cbd5e1 !important;
          border-radius: 18px !important;
          padding: 16px !important;
          box-shadow: 0 8px 20px rgba(15, 23, 42, .045) !important;
        }

        .account-card-desktop.account-card-pendente {
          background: #fffdf2 !important;
          border-color: #fde68a !important;
          border-left-color: #fbbf24 !important;
        }

        .account-card-desktop.account-card-vencida {
          background: #fff7f7 !important;
          border-color: #fecaca !important;
          border-left-color: #f87171 !important;
        }

        .account-card-desktop.account-card-paga {
          background: #f0fdf4 !important;
          border-color: #bbf7d0 !important;
          border-left-color: #86efac !important;
        }

        .account-card-desktop .account-actions {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 10px !important;
          width: 100% !important;
          margin-top: 12px !important;
        }

        .account-card-desktop .account-actions button {
          width: 100% !important;
          min-width: 0 !important;
          min-height: 48px !important;
          border-radius: 14px !important;
          box-shadow: 0 6px 14px rgba(15, 23, 42, .06) !important;
        }

        .status-pill.status-pendente {
          background: #fef3c7 !important;
          color: #92400e !important;
        }

        .status-pill.status-vencido {
          background: #fee2e2 !important;
          color: #991b1b !important;
        }

        .status-pill.status-pago {
          background: #dcfce7 !important;
          color: #166534 !important;
        }

        .relatorios-page .report-status-tabs {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 10px !important;
        }

        .relatorios-page .report-status-tabs button {
          width: 100% !important;
          min-height: 48px !important;
          margin: 0 !important;
          border-radius: 14px !important;
        }

        .user-badge,
        .roleBadge {
          display: inline-flex !important;
          align-items: center !important;
          width: fit-content !important;
          border: 1px solid rgba(15, 23, 42, .06) !important;
          box-shadow: 0 4px 10px rgba(15, 23, 42, .045) !important;
        }

        .roleBadge.admin { background: #f3e8ff !important; color: #7e22ce !important; }
        .roleBadge.gerente { background: #e0f2fe !important; color: #0369a1 !important; }
        .roleBadge.operador { background: #f1f5f9 !important; color: #475569 !important; }
        .user-badge-self { background: #dcfce7 !important; color: #166534 !important; }
        .user-badge-pending { background: #fef3c7 !important; color: #92400e !important; }
      }

      @media (max-width: 390px) {
        .dashboard-open-list .dashboard-account-row {
          grid-template-columns: 1fr !important;
        }
        .dashboard-open-list .dashboard-account-row-actions {
          grid-column: 1 / -1 !important;
          width: 100% !important;
          justify-content: stretch !important;
          grid-template-columns: 1fr auto !important;
        }
        .dashboard-open-list .dashboard-account-value {
          text-align: left !important;
        }
      }

      @media (min-width: 980px) {
        .trash-card small {
          display: block !important;
          color: #64748b !important;
          font-weight: 700 !important;
          line-height: 1.45 !important;
          margin: 8px 0 0 !important;
        }
      }
    `}</style>
  )
}
