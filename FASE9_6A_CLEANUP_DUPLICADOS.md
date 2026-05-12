# FASE 9.6A — Cleanup seguro de duplicados

Removidos apenas arquivos antigos/duplicados na raiz do projeto.

O app real continua usando os arquivos dentro de `src/`, conforme `index.html`:

```html
<script type="module" src="/src/main.jsx"></script>
```

Arquivos removidos da raiz:

- AccountModal.jsx
- App.jsx
- AppContext.jsx
- ConfirmModal.jsx
- ContasPage.jsx
- DashboardHome.jsx
- DashboardPage.jsx
- GlobalToast.jsx
- MobileMenu.jsx
- NotasPage.jsx
- NoteModal.jsx
- OpenAccountsList.jsx
- Skeletons.jsx
- Topbar.jsx
- contasService.js
- dates.js
- main.jsx
- notasService.js
- recorrencia.js
- supabase.js
- useContas.js
- styles.css

Arquivos preservados:

- `src/**`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- assets públicos
- SQLs e documentação histórica

Nenhuma regra visual ou lógica validada foi alterada.
