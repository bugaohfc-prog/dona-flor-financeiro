# Dona Flor Financeiro — Fase 2 Dashboard Componentizado

## O que foi feito

- Criado `src/components/dashboard/DashboardHome.jsx`.
- Extraída a tela principal do Dashboard para componente próprio.
- `App.jsx` passou a importar e renderizar `DashboardHome`.
- Nenhuma regra financeira foi alterada.
- Nenhum CSS aprovado foi alterado.
- `styles.css` consolidado e validado foi mantido.

## Validação técnica

- `npm run build` executado com sucesso.
- Alerta de chunk acima de 500 kB permanece esperado enquanto o App ainda contém telas, modais e lógica centralizada.

## O que validar

1. Dashboard abre normalmente.
2. Resumos Total/Pago/Pendente/Vencido aparecem corretos.
3. Próximos vencimentos aparece correto.
4. Contas em aberto aparecem e recolhem/expandem.
5. Botão Pago funciona.
6. Notas aparecem e recolhem/expandem.
7. Concluir, editar e excluir nota funcionam.
8. Mobile e desktop mantêm o mesmo visual aprovado.
