const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/DashboardRouteComposition-wdbZyJ6x.js","assets/vendor-react-CdkWbty6.js","assets/Skeletons-eKyR2h5r.js","assets/vendor-charts-CPrmKtzC.js","assets/vendor-supabase-D2gm834s.js","assets/ContasPage-Bd3UmwXK.js","assets/Relatorios-0WJdnexj.js","assets/NotasPage-D7HbC0m1.js","assets/MasterPanelPage-Cxf3Xx1o.js","assets/OnboardingPage-C5SpOuKD.js","assets/BillingPage-DWslAjTX.js","assets/FiliaisPage-KNn8MpaS.js","assets/UsuariosPage-Bn1X-D3O.js","assets/CopilotDrawer-BJgQ9xZx.js"])))=>i.map(i=>d[i]);
import{j as e,r as d,a as wn,b as vn,R as yn}from"./vendor-react-CdkWbty6.js";import{c as kn}from"./vendor-supabase-D2gm834s.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const c of n)if(c.type==="childList")for(const p of c.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&i(p)}).observe(document,{childList:!0,subtree:!0});function r(n){const c={};return n.integrity&&(c.integrity=n.integrity),n.referrerPolicy&&(c.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?c.credentials="include":n.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function i(n){if(n.ep)return;n.ep=!0;const c=r(n);fetch(n.href,c)}})();const jn=void 0;function _n(){return!!jn}function Sn(){return _n()?"":"Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o sistema."}const S=kn("https://placeholder.supabase.co","placeholder-anon-key",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}});function ae(t){const a=String(t||"").toLowerCase().trim();return["admin","adm","administrador","master","owner"].includes(a)?"admin":["gerente","gerencia","gestor","manager"].includes(a)?"gerente":["financeiro","financas","finanças","financial"].includes(a)?"financeiro":["operacional","operacao","operação","atendente"].includes(a)?"operacional":["visualizacao","visualização","viewer","leitura","consulta"].includes(a)?"visualizacao":(["operador","usuario","usuário","user"].includes(a),"operador")}function Cn(t=[],a=null){const r=(t||[]).map(n=>({...n,empresa_id:n.empresa_id||a,email:String(n.email||"").trim().toLowerCase(),perfil:ae(n.perfil)})).filter(n=>!a||n.empresa_id===a),i=new Map;for(const n of r){const c=n.user_id||n.email||n.id,p=i.get(c);if(!p){i.set(c,n);continue}i.set(c,{...p,...n,id:p.id||n.id,nome:p.nome||n.nome,email:p.email||n.email,user_id:p.user_id||n.user_id,perfil:p.perfil==="admin"?p.perfil:n.perfil,created_at:p.created_at||n.created_at})}return Array.from(i.values())}async function Nn(t){const{data:a,error:r}=await S.functions.invoke("listar-usuarios-empresa",{body:{empresaId:t}});if(r)throw r;if((a==null?void 0:a.ok)===!1)throw new Error((a==null?void 0:a.message)||"Não foi possível listar usuários pela Edge Function.");return Cn((a==null?void 0:a.usuarios)||[],t)}async function En(t){return t?Nn(t):[]}async function zn({empresaId:t,email:a,nome:r,perfil:i,senhaProvisoria:n,criarAuthManual:c=!1}){const p=String(a||"").trim().toLowerCase(),u=String(r||"").trim()||p.split("@")[0],v=ae(i),k=String(n||"").trim();if(!t)throw new Error("Empresa não identificada.");if(!p||!p.includes("@"))throw new Error("Informe um e-mail válido.");if(c&&k.length<6)throw new Error("Informe uma senha provisória com pelo menos 6 caracteres.");if(c){const{data:j,error:_}=await S.functions.invoke("criar-usuario-manual",{body:{empresaId:t,email:p,nome:u,perfil:v,senhaProvisoria:k}});if(_){const I=String((_==null?void 0:_.message)||(_==null?void 0:_.details)||"");throw I.includes("Failed to send a request")?new Error("Não foi possível conectar à Edge Function criar-usuario-manual. Confirme se ela foi publicada no Supabase e se o projeto está correto."):new Error(I||"A Edge Function criar-usuario-manual retornou erro. Verifique os logs no Supabase.")}if((j==null?void 0:j.ok)===!1)throw new Error((j==null?void 0:j.message)||"Não foi possível criar o usuário manualmente.");return(j==null?void 0:j.usuario)||(j==null?void 0:j.vinculo)||{empresa_id:t,email:p,nome:u,perfil:v,user_id:(j==null?void 0:j.userId)||null}}const{data:N,error:y}=await S.from("df_usuarios_empresas").select("id, email, user_id").eq("empresa_id",t).eq("email",p).maybeSingle();if(y)throw y;if(N)throw new Error("Este e-mail já está cadastrado nesta empresa.");const E={empresa_id:t,user_id:null,email:p,nome:u,perfil:v},{data:h,error:P}=await S.from("df_usuarios_empresas").insert([E]).select("*").single();if(P)throw P;return h}async function An({empresaId:t,usuario:a,perfil:r}){const i=ae(r);let n=S.from("df_usuarios_empresas").update({perfil:i}).eq("empresa_id",t);a.id?n=n.eq("id",a.id):a.user_id?n=n.eq("user_id",a.user_id):n=n.eq("email",a.email);const{error:c}=await n;if(c)throw c}async function Rn({empresaId:t,usuario:a}){let r=S.from("df_usuarios_empresas").delete().eq("empresa_id",t);a.id?r=r.eq("id",a.id):a.user_id?r=r.eq("user_id",a.user_id):r=r.eq("email",a.email);const{error:i}=await r;if(i)throw i}async function Pn({usuario:t}){const a=String((t==null?void 0:t.email)||"").trim().toLowerCase();if(!a||!a.includes("@"))throw new Error("Este usuário não possui e-mail válido para envio de acesso.");const r=`${window.location.origin}/reset-password`,{data:i,error:n}=await S.functions.invoke("convidar-usuario",{body:{email:a,nome:t.nome||"",redirectTo:r}});if(!n)return{tipo:"convite",mensagem:(i==null?void 0:i.message)||"Convite enviado para o e-mail do usuário."};const{error:c}=await S.auth.resetPasswordForEmail(a,{redirectTo:r});if(c)throw c;return{tipo:"reset",mensagem:"Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha."}}async function Mn({userId:t,email:a,nome:r}){const i=String(r||"").trim(),n=String(a||"").trim().toLowerCase();if(!t)throw new Error("Usuário não identificado.");if(i.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");const c=[],{error:p}=await S.from("profiles").upsert({id:t,name:i},{onConflict:"id"});p&&c.push(p);const{error:u}=await S.from("df_usuarios_empresas").update({nome:i}).eq("user_id",t);if(u&&c.push(u),n){const{error:v}=await S.from("df_usuarios_empresas").update({nome:i}).eq("email",n);v&&c.push(v)}if(c.length>0)throw c[0];return{nome:i}}async function Dn(t){if(!t)return[];const{data:a,error:r}=await S.from("df_usuarios_filiais").select("id, empresa_id, usuario_id, filial_id, created_at").eq("empresa_id",t);if(r)throw r;return a||[]}async function Fn({empresaId:t,usuario:a,filialIds:r}){if(!t)throw new Error("Empresa não identificada.");if(!(a!=null&&a.id))throw new Error("Usuário da empresa não identificado.");const i=Array.from(new Set((r||[]).filter(Boolean))),{error:n}=await S.from("df_usuarios_filiais").delete().eq("empresa_id",t).eq("usuario_id",a.id);if(n)throw n;if(i.length===0)return[];const c=i.map(v=>({empresa_id:t,usuario_id:a.id,filial_id:v})),{data:p,error:u}=await S.from("df_usuarios_filiais").insert(c).select("id, empresa_id, usuario_id, filial_id, created_at");if(u)throw u;return p||[]}function In({styles:t,nomeEmpresa:a,navegarPara:r,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,canSwitchCompany:c=!1,empresasDisponiveis:p=[],empresaId:u="",trocarEmpresaAtiva:v,trocandoEmpresa:k=!1,nomeUsuario:N,abrirPerfilUsuario:y,sairDoSistema:E}){const h=c&&p.length>0,P=p.find(j=>j.id===u);return e.jsxs("section",{className:"no-print top-shell top-shell-clean",style:t.usuarioTopo,children:[e.jsx("div",{className:"top-shell-context",children:e.jsxs("button",{className:"top-shell-logo",style:t.logoMarca,onClick:()=>r("dashboard"),title:"Ir para o dashboard",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:t.logoImagem}),e.jsxs("span",{children:[e.jsx("strong",{children:a||"Dona Flor"}),e.jsx("small",{children:"Gestão Financeira"})]})]})}),e.jsxs("div",{className:"top-shell-actions",style:t.usuarioAcoes,children:[h&&(p.length>1?e.jsxs("label",{className:"company-switcher",title:"Trocar empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("select",{value:u||"",disabled:k,onChange:j=>v==null?void 0:v(j.target.value),"aria-label":"Empresa ativa",children:p.map(j=>e.jsx("option",{value:j.id,children:j.nome||j.id},j.id))})]}):e.jsxs("div",{className:"company-switcher company-switcher-static",title:"Empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("strong",{children:(P==null?void 0:P.nome)||a||"Empresa ativa"})]})),e.jsx("button",{type:"button",className:"top-user-profile-button top-user-profile-icon",title:`Meu perfil${typeof N=="function"?`: ${N()}`:""}`,onClick:()=>y==null?void 0:y(),"aria-label":"Abrir meu perfil",children:e.jsx("span",{"aria-hidden":"true",children:"👤"})}),e.jsx("button",{className:"mobile-menu-trigger",style:t.btnMenuTopo,onClick:()=>n(!i),children:"☰"})]})]})}function Tn({tela:t,icon:a,label:r,telaAtual:i,sidebarCompacta:n,navegarPara:c}){const p=t&&i===t;return e.jsxs("button",{className:p?"active":"",title:r,onClick:()=>c(t),children:[e.jsx("span",{className:"menu-icon",children:a}),!n&&e.jsx("span",{className:"menu-text",children:r})]})}function $n({id:t,titulo:a,children:r,sidebarCompacta:i,gruposMenu:n,toggleGrupoMenu:c}){return e.jsxs("div",{className:"sidebar-group-clean",children:[e.jsxs("button",{className:"sidebar-group-toggle",onClick:()=>c(t),title:a,children:[e.jsx("span",{children:i?"•":a}),!i&&e.jsx("strong",{children:n[t]?"−":"+"})]}),(i||n[t])&&e.jsx("nav",{className:"desktop-sidebar-nav",children:r})]})}function Ln({sidebarCompacta:t,setSidebarCompacta:a,nomeUsuario:r,normalizarPerfil:i,perfilUsuario:n,menuSections:c,telaAtual:p,navegarPara:u,gruposMenu:v,toggleGrupoMenu:k,sairDoSistema:N}){const y=r(),E=i(n||"usuário");return e.jsxs("aside",{className:`desktop-sidebar no-print ${t?"compacta":""}`,children:[e.jsxs("div",{className:"desktop-sidebar-brand sidebar-brand-clean",title:"DF Gestão Financeira",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira"}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:"DF Gestão"}),e.jsx("small",{children:"Painel financeiro"})]})]}),e.jsxs("div",{className:"desktop-sidebar-user sidebar-user-clean",title:`${y} • ${E}`,children:[e.jsx("span",{className:"sidebar-user-avatar",children:String(y||"U").slice(0,1).toUpperCase()}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:y}),e.jsx("small",{children:E})]})]}),e.jsx("button",{className:"sidebar-collapse-btn sidebar-collapse-icon",onClick:()=>a(!t),title:t?"Expandir menu":"Recolher menu","aria-label":t?"Expandir menu":"Recolher menu",children:e.jsx("span",{className:"sidebar-collapse-arrow",children:t?"→":"←"})}),e.jsx("div",{className:"desktop-sidebar-scroll",children:c.map(h=>e.jsx($n,{id:h.id,titulo:h.titulo,sidebarCompacta:t,gruposMenu:v,toggleGrupoMenu:k,children:h.items.map(P=>e.jsx(Tn,{tela:P.tela,icon:P.icon,label:P.label,telaAtual:p,sidebarCompacta:t,navegarPara:u},P.tela))},h.id))}),e.jsx("div",{className:"desktop-sidebar-spacer"}),e.jsx("nav",{className:"desktop-sidebar-nav sidebar-exit",children:e.jsxs("button",{onClick:N,title:"Sair",children:[e.jsx("span",{className:"menu-icon",children:"🚪"}),!t&&e.jsx("span",{children:"Sair"})]})})]})}function qn({visible:t,styles:a,setMenuNavegacaoAberto:r,nomeUsuario:i,nomeUsuarioAtual:n,normalizarPerfil:c,perfilUsuario:p,menuSections:u,navegarPara:v,sairDoSistema:k,canSwitchCompany:N=!1,empresasDisponiveis:y=[],empresaId:E="",trocarEmpresaAtiva:h,trocandoEmpresa:P=!1,abrirPerfilUsuario:j}){if(!t)return null;const _=N&&y.length>0,I=y.find(A=>A.id===E),G=n||(typeof i=="function"?i():i)||"usuário",B=(A,L,F,lt)=>e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:lt,children:[e.jsx("span",{children:A}),e.jsxs("div",{children:[e.jsx("strong",{children:L}),e.jsx("small",{children:F})]})]});return e.jsx("div",{className:"no-print mobile-menu-backdrop",style:a.menuBackdrop,onClick:()=>r(!1),onTouchMove:A=>A.preventDefault(),children:e.jsxs("div",{className:"mobile-menu-panel",style:a.menuNavegacao,role:"dialog","aria-label":"Menu de navegação",onClick:A=>A.stopPropagation(),onWheel:A=>A.stopPropagation(),onTouchMove:A=>A.stopPropagation(),children:[e.jsxs("div",{style:a.menuPerfil,children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:a.menuPerfilIcone}),e.jsxs("div",{children:[e.jsx("strong",{children:G}),e.jsx("small",{children:c(p||"usuário")})]})]}),_&&e.jsxs("div",{className:"mobile-company-switcher",style:{margin:"12px 0 18px",padding:"12px 14px",border:"1px solid rgba(20, 184, 166, 0.22)",borderRadius:18,background:"rgba(240, 253, 250, 0.9)",display:"grid",gap:8},children:[e.jsx("span",{style:{fontSize:11,fontWeight:900,color:"#0f766e",textTransform:"uppercase",letterSpacing:".08em"},children:"Empresa ativa"}),y.length>1?e.jsx("select",{value:E||"",disabled:P,onChange:A=>{h==null||h(A.target.value),r(!1)},"aria-label":"Empresa ativa",style:{width:"100%",border:"0",background:"transparent",color:"#111827",fontWeight:900,fontSize:15,outline:"none"},children:y.map(A=>e.jsx("option",{value:A.id,children:A.nome||A.id},A.id))}):e.jsx("strong",{style:{color:"#111827",fontSize:15},children:(I==null?void 0:I.nome)||"Empresa ativa"})]}),e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:()=>{r(!1),j==null||j()},children:[e.jsx("span",{children:"👤"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Meu perfil"}),e.jsx("small",{children:"Editar nome do usuário"})]})]}),u.map((A,L)=>e.jsxs("details",{className:"mobile-menu-group",open:L===0,children:[e.jsx("summary",{children:A.titulo}),A.items.map(F=>B(F.icon,F.label,F.desc,()=>v(F.tela))),A.id==="sistema"&&e.jsxs("button",{type:"button",style:a.menuSairItem,onClick:k,children:[e.jsx("span",{children:"🚪"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Sair"}),e.jsx("small",{children:"Encerrar sessão"})]})]})]},A.id))]})})}function On({styles:t,menuAberto:a,setMenuAberto:r,abrirNovaConta:i,abrirNovaNota:n}){return e.jsxs(e.Fragment,{children:[a&&e.jsxs("div",{className:"global-fab-menu",style:t.menuFab,onClick:c=>c.stopPropagation(),children:[e.jsxs("button",{style:t.menuItem,type:"button",onClick:c=>{c.preventDefault(),c.stopPropagation(),i()},"aria-label":"Nova conta",children:[e.jsx("span",{style:t.menuItemIcone,children:"💰"}),e.jsx("span",{style:t.menuItemTexto,children:"Nova conta"})]}),e.jsxs("button",{style:t.menuItem,type:"button",onClick:c=>{c.preventDefault(),c.stopPropagation(),n()},"aria-label":"Nova nota",children:[e.jsx("span",{style:t.menuItemIcone,children:"📝"}),e.jsx("span",{style:t.menuItemTexto,children:"Nova nota"})]})]}),e.jsx("button",{className:"global-fab",style:t.fab,onClick:c=>{c.stopPropagation(),r(!a)},children:a?"×":"+"})]})}function ze({styles:t,titulo:a,aberto:r,onClick:i}){const n=String(a||"").split(" "),c=n[0]||"",p=n.slice(1).join(" ")||a;return e.jsxs("button",{style:t.headerExpansivel,onClick:i,children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:10,color:"#0f172a",fontWeight:900,lineHeight:1.1},children:[e.jsx("span",{style:{fontSize:24,lineHeight:1},children:c}),e.jsx("span",{children:p})]}),e.jsx("strong",{style:{color:"#0f172a"},children:r?"−":"+"})]})}const Br=d.createContext(null),mo="df_empresa_ativa";function Un(){if(typeof window>"u")return null;try{return JSON.parse(window.localStorage.getItem(mo)||"null")}catch{return null}}function Er(t){if(!(typeof window>"u")){if(!(t!=null&&t.id)){window.localStorage.removeItem(mo);return}window.localStorage.setItem(mo,JSON.stringify(t))}}const Bn={sucesso:"Sucesso",success:"Sucesso",erro:"Atenção",error:"Atenção",alerta:"Atenção",warning:"Atenção",info:"Aviso"};function Vn(t){return t==="success"?"sucesso":t==="error"?"erro":t==="warning"?"alerta":t||"info"}function Wn({children:t}){const[a,r]=d.useState(!1),[i,n]=d.useState(()=>Un()),[c,p]=d.useState([]),[u,v]=d.useState(null),k=d.useRef(null),N=d.useCallback(_=>{const I=_!=null&&_.id?{id:_.id,nome:_.nome||"",perfil:_.perfil||"operador"}:null;n(I),Er(I)},[]),y=d.useCallback(()=>{n(null),Er(null)},[]),E=d.useCallback(()=>{k.current&&(window.clearTimeout(k.current),k.current=null),v(null)},[]),h=d.useCallback((_,I="info",G={})=>{if(!_)return;const B=Vn(I),A=G.duration??5200;k.current&&window.clearTimeout(k.current),v({id:Date.now(),message:String(_),type:B,title:G.title||Bn[B]||"Aviso"}),k.current=window.setTimeout(()=>{v(null),k.current=null},A)},[]),P=d.useCallback(async _=>{r(!0);try{return await _()}finally{r(!1)}},[]),j=d.useMemo(()=>({globalLoading:a,setGlobalLoading:r,empresaAtiva:i,empresaId:(i==null?void 0:i.id)||null,perfilEmpresaAtiva:(i==null?void 0:i.perfil)||"",setEmpresaAtiva:N,limparEmpresaAtiva:y,empresasDisponiveis:c,setEmpresasDisponiveis:p,toast:u,showToast:h,hideToast:E,runWithLoading:P}),[a,i,c,u,h,E,P,N,y]);return e.jsx(Br.Provider,{value:j,children:t})}function Vr(){const t=d.useContext(Br);if(!t)throw new Error("useApp deve ser usado dentro do AppProvider");return t}function Hn({onLogin:t}){const{showToast:a}=Vr(),[r,i]=d.useState(""),[n,c]=d.useState(""),[p,u]=d.useState(!1);async function v(k){if(k.preventDefault(),!r||!n){a("Informe e-mail e senha","erro");return}const N=Sn();if(N){a(N,"erro");return}u(!0);const{data:y,error:E}=await S.auth.signInWithPassword({email:r,password:n});if(u(!1),E){a("E-mail ou senha inválidos","erro");return}const{error:h}=await S.rpc("vincular_usuario_logado");h&&console.warn("Não foi possível executar vínculo automático:",h.message),t(y.user)}return e.jsx("div",{style:te.page,children:e.jsxs("form",{style:te.card,onSubmit:v,children:[e.jsx("h1",{style:te.titulo,children:"Dona Flor Financeiro"}),e.jsx("p",{style:te.subtitulo,children:"Acesse sua conta para continuar"}),e.jsx("input",{style:te.input,type:"email",placeholder:"E-mail",value:r,onChange:k=>i(k.target.value)}),e.jsx("input",{style:te.input,type:"password",placeholder:"Senha",value:n,onChange:k=>c(k.target.value)}),e.jsx("button",{style:te.botao,disabled:p,children:p?"Entrando...":"Entrar"}),e.jsx("small",{style:te.ajuda,children:"Login seguro via Supabase Auth."})]})})}const te={page:{minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Arial"},card:{width:"100%",maxWidth:360,background:"#fff",borderRadius:18,padding:20,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:10},titulo:{margin:0,fontSize:26},subtitulo:{margin:"0 0 10px",color:"#666",fontSize:14},input:{width:"100%",padding:12,borderRadius:10,border:"1px solid #ccc",boxSizing:"border-box",fontSize:15},botao:{width:"100%",padding:12,borderRadius:10,border:"none",background:"#198754",color:"#fff",fontWeight:"bold",fontSize:15},ajuda:{color:"#666",textAlign:"center",marginTop:8}};function Wr({toast:t,onClose:a}){if(!t)return null;const r=t.type||"info",i=e.jsxs("div",{className:`app-toast app-toast-${r} app-toast-global`,role:r==="erro"?"alert":"status","aria-live":r==="erro"?"assertive":"polite",onClick:a,children:[e.jsx("div",{className:`app-toast-icon app-toast-icon-${r}`,children:r==="erro"?"!":r==="sucesso"?"✓":r==="alerta"?"!":"i"}),e.jsxs("div",{className:"app-toast-content",children:[e.jsx("strong",{children:t.title||(r==="erro"?"Atenção":"Aviso")}),e.jsx("span",{children:t.message})]}),e.jsx("button",{type:"button",className:"app-toast-close","aria-label":"Fechar aviso",onClick:n=>{n.stopPropagation(),a==null||a()},children:"×"})]});return typeof document>"u"?i:wn.createPortal(i,document.body)}function Gn({carregandoAuth:t,usuarioLogado:a,erroEmpresa:r,styles:i,setUsuarioLogado:n,globalToast:c,hideToast:p,sairDoSistema:u,children:v}){return t?e.jsx("div",{style:i.page,children:e.jsx("h2",{children:"Carregando..."})}):a?r?e.jsxs("div",{style:i.page,children:[e.jsx("h2",{children:"⚠️ Empresa não vinculada"}),e.jsx("p",{children:r}),e.jsx("button",{style:i.btnSair,onClick:u,children:"Sair"})]}):v:e.jsxs(e.Fragment,{children:[e.jsx(Hn,{onLogin:n}),e.jsx(Wr,{toast:c,onClose:p})]})}function uo({children:t}){return e.jsx(d.Suspense,{fallback:e.jsx("div",{className:"app-route-loading",children:"Carregando módulo..."}),children:t})}function Yn({styles:t,editandoContaId:a,descricao:r,setDescricao:i,valor:n,setValor:c,dataVencimento:p,setDataVencimento:u,centroCustoId:v,setCentroCustoId:k,centros:N,filialId:y,setFilialId:E,filiais:h,observacaoConta:P,setObservacaoConta:j,contaRecorrente:_,setContaRecorrente:I,tipoRecorrencia:G,setTipoRecorrencia:B,diaVencimentoRecorrencia:A,setDiaVencimentoRecorrencia:L,fecharConta:F,salvarConta:lt,primeiraLetraMaiuscula:X,limitarDataInput:$,formatarDataParaBanco:O,fecharNota:St,setModalCentro:ht,setMenuAberto:wt,setMenuNavegacaoAberto:Tt}){function V(){F(),St(),ht(!1),wt(!1),Tt(!1)}return e.jsx("div",{style:t.overlay,onClick:V,children:e.jsxs("div",{style:t.modal,onClick:M=>M.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Conta":"Nova Conta"}),e.jsx("input",{style:t.inputModal,placeholder:"Descrição",value:r,onChange:M=>i(X(M.target.value))}),e.jsx("input",{style:t.inputModal,placeholder:"Valor. Ex: 150,90",value:n,onChange:M=>c(M.target.value)}),e.jsx("input",{style:t.inputModal,type:"date",value:p,onChange:M=>u($(M.target.value))}),e.jsxs("select",{style:t.inputModal,value:y,onChange:M=>E(M.target.value),children:[e.jsx("option",{value:"",children:"Filial / unidade"}),(h||[]).map(M=>e.jsx("option",{value:M.id,children:M.nome},M.id))]}),e.jsxs("select",{style:t.inputModal,value:v,onChange:M=>k(M.target.value),children:[e.jsx("option",{value:"",children:"Centro de custo"}),N.map(M=>e.jsx("option",{value:M.id,children:M.nome},M.id))]}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Observação ou comentário da conta...",value:P,onChange:M=>j(X(M.target.value))}),e.jsxs("div",{className:"recurrence-box",style:t.blocoRecorrenciaConta,children:[e.jsxs("label",{className:"checkbox-row-fix",style:t.switchLinhaCompacta,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"🔁 Conta recorrente"}),e.jsx("small",{style:t.textoAjuda,children:"Ideal para aluguel, internet, sistema, mensalidades e contas fixas."})]}),e.jsx("input",{type:"checkbox",checked:_,onChange:M=>{const Q=M.target.checked;I(Q),Q&&p&&L(String(Number(O(p).slice(8,10))))}})]}),_&&e.jsxs("div",{className:"recurrence-fields",children:[e.jsx("select",{style:t.inputModal,value:G,onChange:M=>B(M.target.value),children:e.jsx("option",{value:"mensal",children:"Mensal"})}),e.jsx("input",{style:t.inputModal,type:"number",min:"1",max:"31",placeholder:"Dia de vencimento mensal. Ex: 5",value:A||(p?String(Number(O(p).slice(8,10))):""),onChange:M=>L(M.target.value)}),e.jsx("small",{style:t.textoAjuda,children:"O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir."})]})]}),e.jsx("button",{style:t.btnSalvar,type:"button",onClick:M=>{M.preventDefault(),M.stopPropagation(),lt()},children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,type:"button",onClick:F,children:"Cancelar"})]})})}function Jn({styles:t,editandoNotaId:a,tituloNota:r,setTituloNota:i,prioridadeNota:n,setPrioridadeNota:c,dataEventoNota:p,setDataEventoNota:u,conteudoNota:v,setConteudoNota:k,filialNotaId:N,setFilialNotaId:y,filiais:E,salvarNota:h,fecharNota:P,fecharConta:j,setModalCentro:_,setMenuAberto:I,setMenuNavegacaoAberto:G,primeiraLetraMaiuscula:B,limitarDataInput:A}){function L(){j(),P(),_(!1),I(!1),G(!1)}return e.jsx("div",{style:t.overlay,onClick:L,children:e.jsxs("div",{style:t.modal,onClick:F=>F.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Nota":"Nova Nota"}),e.jsx("input",{style:t.inputModal,placeholder:"Título",value:r,onChange:F=>i(B(F.target.value))}),e.jsxs("select",{style:t.inputModal,value:n,onChange:F=>c(F.target.value),children:[e.jsx("option",{value:"normal",children:"Prioridade normal"}),e.jsx("option",{value:"urgente",children:"Urgente"}),e.jsx("option",{value:"critico",children:"Crítico"})]}),e.jsxs("select",{style:t.inputModal,value:N,onChange:F=>y(F.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(E||[]).map(F=>e.jsx("option",{value:F.id,children:F.nome},F.id))]}),e.jsx("input",{style:t.inputModal,type:"date",value:p,onChange:F=>u(A(F.target.value))}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Conteúdo...",value:v,onChange:F=>k(F.target.value)}),e.jsx("button",{style:t.btnSalvar,onClick:h,children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,onClick:P,children:"Cancelar"})]})})}function Kn({styles:t,novoCentro:a,setNovoCentro:r,salvarCentro:i,centros:n,abrirConfirmacao:c,excluirCentro:p,fecharConta:u,fecharNota:v,setModalCentro:k,setMenuAberto:N,setMenuNavegacaoAberto:y}){function E(){u(),v(),k(!1),N(!1),y(!1)}return e.jsx("div",{style:t.overlay,onClick:E,children:e.jsxs("div",{style:t.modal,onClick:h=>h.stopPropagation(),children:[e.jsx("h3",{children:"Centros de Custo"}),e.jsx("input",{style:t.inputModal,placeholder:"Novo centro",value:a,onChange:h=>r(h.target.value),autoFocus:!0}),e.jsx("button",{style:t.btnSalvar,onClick:i,children:"Salvar Centro"}),n.map(h=>e.jsxs("div",{style:t.itemCentro,children:[e.jsx("span",{children:h.nome}),e.jsx("button",{style:t.btnMiniExcluir,onClick:()=>c({titulo:"Excluir centro de custo",mensagem:`Deseja excluir o centro ${h.nome}?`,textoConfirmar:"Excluir",tipo:"perigo",acao:()=>p(h.id)}),children:"excluir"})]},h.id)),e.jsx("button",{style:t.btnCancelar,onClick:()=>k(!1),children:"Fechar"})]})})}function Qn({nome:t,setNome:a,email:r,salvando:i,onClose:n,onSave:c}){return e.jsx("div",{className:"profile-modal-backdrop",role:"presentation",onClick:n,children:e.jsxs("div",{className:"profile-modal-card",role:"dialog","aria-modal":"true","aria-label":"Meu perfil",onClick:p=>p.stopPropagation(),children:[e.jsxs("div",{className:"profile-modal-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Perfil"}),e.jsx("h2",{children:"Meu perfil"})]}),e.jsx("button",{type:"button",onClick:n,"aria-label":"Fechar",children:"×"})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"Nome de exibição"}),e.jsx("input",{value:t,onChange:p=>a(p.target.value),placeholder:"Digite seu nome",autoFocus:!0,maxLength:80})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"E-mail"}),e.jsx("input",{value:r||"",readOnly:!0})]}),e.jsxs("div",{className:"profile-modal-actions",children:[e.jsx("button",{type:"button",className:"profile-modal-cancel",onClick:n,disabled:i,children:"Cancelar"}),e.jsx("button",{type:"button",className:"profile-modal-save",onClick:c,disabled:i,children:i?"Salvando...":"Salvar perfil"})]})]})})}function Xn({styles:t,modalConta:a,contaProps:r,modalNota:i,notaProps:n,modalCentro:c,centroProps:p,modalPerfilUsuario:u,perfilProps:v}){return e.jsxs(e.Fragment,{children:[a&&e.jsx(Yn,{styles:t,...r}),i&&e.jsx(Jn,{styles:t,...n}),c&&e.jsx(Kn,{styles:t,...p}),u&&e.jsx(Qn,{...v})]})}function Zn({styles:t,confirmacao:a,fecharConfirmacao:r,executarConfirmacao:i}){return a!=null&&a.aberto?e.jsx("div",{style:t.overlayConfirmacao,children:e.jsxs("div",{style:t.modalConfirmacao,children:[e.jsx("div",{style:t.confirmacaoIcone,children:a.tipo==="perigo"?"⚠️":a.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:t.confirmacaoTitulo,children:a.titulo}),e.jsx("p",{style:t.confirmacaoTexto,children:a.mensagem}),e.jsxs("div",{style:t.confirmacaoAcoes,children:[e.jsx("button",{style:t.btnConfirmarCancelar,onClick:r,children:"Cancelar"}),e.jsx("button",{style:{...t.btnConfirmarAcao,background:a.tipo==="perigo"?"#dc3545":a.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:i,children:a.textoConfirmar})]})]})}):null}function ts({visible:t,message:a="Carregando..."}){return t?e.jsx("div",{className:"global-loader-overlay",role:"status","aria-live":"polite",children:e.jsxs("div",{className:"global-loader-card",children:[e.jsx("div",{className:"global-loader-spinner"}),e.jsx("span",{children:a})]})}):null}function es({styles:t,globalLoading:a,globalToast:r,hideToast:i,confirmacao:n,fecharConfirmacao:c,executarConfirmacao:p}){return e.jsxs(e.Fragment,{children:[e.jsx(ts,{visible:a}),e.jsx(Wr,{toast:r,onClose:i}),e.jsx(Zn,{styles:t,confirmacao:n,fecharConfirmacao:c,executarConfirmacao:p})]})}function ee(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Gt(t){return`${Number(t||0).toFixed(1)}%`}function as(t){return t>=84?"saudável":t>=68?"em atenção":"crítico"}function os({total:t=0,pago:a=0,pendente:r=0,vencido:i=0,taxaPago:n=0,taxaVencido:c=0,score:p=0,centroCritico:u=null,total7Dias:v=0,tendenciaMensal:k=[]}={}){if(!t)return{parecer:"A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.",liquidez:"Sem volume suficiente para medir liquidez operacional.",concentracao:"Sem centro de custo dominante identificado.",curtoPrazo:"Sem pressão de curto prazo detectada no recorte atual.",comportamento:"Histórico insuficiente para leitura comportamental.",anomalias:["Base financeira insuficiente para detectar anomalias."],drivers:["Ampliar base de contas e centros classificados."]};const N=as(p),y=k||[],E=y[y.length-1],h=y[y.length-2],P=E&&h&&h.total?(E.total-h.total)/h.total*100:null,j=i>0?`O cenário financeiro está ${N}, com ${ee(i)} vencido representando ${Gt(c)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`:`O cenário financeiro está ${N}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`,_=n<35?`A liquidez operacional está pressionada: somente ${Gt(n)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`:n<70?`A liquidez exige acompanhamento: ${Gt(n)} do volume foi realizado, mas ainda existe margem relevante em aberto (${ee(r)}).`:`A liquidez apresenta leitura positiva, com ${Gt(n)} já realizado e menor dependência de liquidações futuras.`,I=u?u.peso>=60?`Há concentração elevada no centro ${u.nome}, que representa ${u.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`:`O centro ${u.nome} lidera o recorte com ${u.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`:"Não há concentração relevante por centro de custo no recorte atual.",G=v>0?`O curto prazo exige reserva de caixa de ${ee(v)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`:"Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.",B=P===null?"Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.":P>15?`O volume analisado cresceu ${Gt(P)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`:P<-15?`O volume analisado caiu ${Gt(Math.abs(P))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`:`O comportamento mensal está relativamente estável, com variação de ${Gt(P)} frente ao mês anterior.`,A=[];c>=40&&A.push(`Vencidos acima de 40% do recorte (${Gt(c)}), sinalizando risco operacional elevado.`),n<20&&A.push(`Realização abaixo de 20% (${Gt(n)}), indicando baixa conversão em pagamento/baixa.`),(u==null?void 0:u.peso)>=60&&A.push(`Concentração extrema no centro ${u.nome} (${u.peso}%).`),v>a&&v>0&&A.push(`Vencimentos de 7 dias (${ee(v)}) superam o realizado atual (${ee(a)}).`),A.length||A.push("Nenhuma anomalia crítica detectada no recorte atual.");const L=[i>0?`Reduzir vencidos de ${ee(i)} para aliviar o score.`:"Preservar cenário sem vencidos críticos.",u?`Revisar o centro ${u.nome}, principal driver do recorte.`:"Classificar centros para melhorar rastreabilidade.",v>0?`Proteger ${ee(v)} no caixa semanal.`:"Usar a folga de curto prazo para planejamento.",r>0?`Acelerar baixa/renegociação de ${ee(r)} em aberto.`:"Manter ritmo de realização."];return{parecer:j,liquidez:_,concentracao:I,curtoPrazo:G,comportamento:B,anomalias:A,drivers:L}}function ue(t){return Number((t==null?void 0:t.valor)||0)}function go(t,a){if(!t||a==="pago")return!1;const r=new Date;r.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<r}function rs(t){if(!t)return 999;const a=new Date;a.setHours(0,0,0,0);const r=new Date(`${t}T00:00:00`);return r.setHours(0,0,0,0),Math.ceil((r-a)/(1e3*60*60*24))}function jt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function no(t){return`${Number(t||0).toFixed(1)}%`}function is(t){var a;return((a=t==null?void 0:t.df_centros_custo)==null?void 0:a.nome)||(t==null?void 0:t.centro_custo_nome)||(t==null?void 0:t.centro)||"Sem centro"}function ns(t){return String((t==null?void 0:t.data_vencimento)||(t==null?void 0:t.created_at)||"").slice(0,7)||"Sem mês"}function ss(t=[]){const a=new Map;return t.forEach(r=>{const i=is(r),n=a.get(i)||{nome:i,total:0,pago:0,pendente:0,vencido:0,quantidade:0},c=ue(r);n.total+=c,n.quantidade+=1,r.status==="pago"?n.pago+=c:n.pendente+=c,go(r.data_vencimento,r.status)&&(n.vencido+=c),a.set(i,n)}),Array.from(a.values()).map(r=>({...r,risco:r.total?Math.round(r.vencido/r.total*100):0,peso:0})).sort((r,i)=>i.total-r.total)}function ds(t=[]){const a=new Map;return t.forEach(r=>{const i=ns(r),n=a.get(i)||{mes:i,total:0,pago:0,pendente:0,vencido:0},c=ue(r);n.total+=c,r.status==="pago"?n.pago+=c:n.pendente+=c,go(r.data_vencimento,r.status)&&(n.vencido+=c),a.set(i,n)}),Array.from(a.values()).sort((r,i)=>r.mes.localeCompare(i.mes)).slice(-6)}function cs({total:t,pendente:a,vencido:r,taxaVencido:i,contasVencidas:n,contasPendentes:c}){if(!t)return 82;let p=100;return p-=Math.min(42,i*1.1),p-=Math.min(22,a/t*18),p-=Math.min(16,n.length*4),p-=Math.min(10,c.length*.8),Math.max(0,Math.min(100,Math.round(p)))}function ls(t){return t>=84?{label:"Saudável",tone:"success"}:t>=68?{label:"Atenção",tone:"warning"}:{label:"Crítico",tone:"danger"}}function ps({total:t,pago:a,pendente:r,vencido:i,taxaPago:n,taxaVencido:c,score:p,status:u,centroCritico:v,vencemEm7Dias:k}){if(!t)return"Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.";const N=`O recorte atual soma ${jt(t)}, com ${jt(a)} realizado e ${jt(r)} ainda em aberto.`,y=i>0?`O principal ponto de atenção é o vencido de ${jt(i)}, equivalente a ${no(c)} do volume analisado.`:"Não há vencido crítico identificado no recorte atual.",E=n>=70?`A eficiência de realização está positiva, com ${no(n)} já liquidado.`:`A eficiência de realização está pressionada, com apenas ${no(n)} liquidado.`,h=v?`O centro de maior peso é ${v.nome}, concentrando ${jt(v.total)}.`:"Não há concentração relevante por centro de custo.",P=k.length?`${k.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`:"Não há concentração expressiva de vencimentos nos próximos 7 dias.";return`${N} ${y} ${E} ${h} ${P} O score financeiro está em ${p}/100, classificado como ${u.label.toLowerCase()}.`}function ms({contas:t=[],contasFiltradas:a=[]}={}){const r=a.length?a:t,i=r.reduce(($,O)=>$+ue(O),0),n=r.filter($=>$.status==="pago"),c=r.filter($=>$.status!=="pago"),p=r.filter($=>go($.data_vencimento,$.status)),u=n.reduce(($,O)=>$+ue(O),0),v=c.reduce(($,O)=>$+ue(O),0),k=p.reduce(($,O)=>$+ue(O),0),N=i?u/i*100:0,y=i?k/i*100:0,E=ss(r).map($=>({...$,peso:i?Math.round($.total/i*100):0})),h=E[0]||null,P=ds(r),j=c.filter($=>{const O=rs($.data_vencimento);return O>=0&&O<=7}),_=j.reduce(($,O)=>$+ue(O),0),I=cs({total:i,pendente:v,vencido:k,taxaVencido:y,contasVencidas:p,contasPendentes:c}),G=ls(I),B=[];k>0&&B.push({level:"Alta",title:"Regularizar contas vencidas",description:`${p.length} conta(s) em atraso somando ${jt(k)}.`,action:"Abrir Financeiro > Contas",impact:jt(k),tone:"danger"}),j.length&&B.push({level:"Alta",title:"Antecipar vencimentos próximos",description:`${j.length} obrigação(ões) vencem nos próximos 7 dias.`,action:"Priorizar caixa semanal",impact:jt(_),tone:"warning"}),h&&i&&h.total/i>=.35&&B.push({level:"Média",title:`Revisar centro ${h.nome}`,description:`Este centro concentra ${h.peso}% do valor analisado.`,action:"Abrir Relatórios",impact:jt(h.total),tone:"info"}),B.length||B.push({level:"Baixa",title:"Manter rotina de acompanhamento",description:"Nenhum risco operacional crítico foi identificado no recorte atual.",action:"Revisão semanal",impact:"Controle",tone:"success"});const A=ps({total:i,pago:u,pendente:v,vencido:k,taxaPago:N,taxaVencido:y,score:I,status:G,centroCritico:h,vencemEm7Dias:j}),L=os({total:i,pago:u,pendente:v,vencido:k,taxaPago:N,taxaVencido:y,score:I,centroCritico:h,total7Dias:_,tendenciaMensal:P}),F=[k>0?`Priorizar a quitação ou renegociação dos vencidos (${jt(k)}) antes de novas despesas.`:"Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.",_>0?`Reservar ${jt(_)} para vencimentos dos próximos 7 dias.`:"Usar a folga dos próximos 7 dias para revisar centros de maior peso.",h?`Auditar lançamentos do centro ${h.nome}, que representa ${h.peso}% do recorte.`:"Classificar centros de custo para melhorar a qualidade analítica.",N<50?"Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.":"Preservar o ritmo de baixas e acompanhar desvios por centro."],lt={"Qual meu maior risco agora?":k>0?`O maior risco agora é o saldo vencido de ${jt(k)}, distribuído em ${p.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`:`O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${jt(_)} vencendo em até 7 dias.`,"Onde estou gastando mais?":h?`O maior peso financeiro está em ${h.nome}, com ${jt(h.total)} (${h.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`:"Ainda não há centro de custo dominante no recorte atual.","Como melhorar meu caixa?":`Priorize três movimentos: reduzir vencidos (${jt(k)}), reservar caixa para 7 dias (${jt(_)}) e revisar o centro de maior peso${h?` (${h.nome})`:""}.`,"Gerar resumo executivo":A},X=[L.liquidez,L.concentracao,L.curtoPrazo,L.comportamento];return{score:I,status:G,executiveSummary:A,narrativa:L,totals:{total:i,pago:u,pendente:v,vencido:k,taxaPago:N,taxaVencido:y,total7Dias:_},priorities:B.slice(0,4),insights:X,recomendacoes:F,rankingCentros:E.slice(0,5),tendenciaMensal:P,respostas:lt,quickQuestions:Object.keys(lt)}}const Hr=d.createContext(null);function us({children:t,contas:a=[],contasFiltradas:r=[],navegarPara:i}){const[n,c]=d.useState(!1),[p,u]=d.useState(""),v=d.useMemo(()=>ms({contas:a,contasFiltradas:r}),[a,r]),k=d.useMemo(()=>({open:n,setOpen:c,toggle:()=>c(N=>!N),close:()=>c(!1),intelligence:v,lastQuestion:p,setLastQuestion:u,navegarPara:i}),[n,v,p,i]);return e.jsx(Hr.Provider,{value:k,children:t})}function Gr(){const t=d.useContext(Hr);if(!t)throw new Error("useCopilot deve ser usado dentro de CopilotProvider");return t}function Yr({children:t,contas:a,contasFiltradas:r,navegarPara:i}){return e.jsx(us,{contas:a,contasFiltradas:r,navegarPara:i,children:t})}function fs(){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
              `}),e.jsx("style",{children:`
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
            `})]})}function gs({contas:t,contasFiltradas:a,navegarPara:r,menuAberto:i,setMenuAberto:n,pageStyle:c,children:p}){function u(){i&&n(!1)}return e.jsx(Yr,{contas:t,contasFiltradas:a,navegarPara:r,children:e.jsxs("div",{className:"app-page",style:c,onClick:u,children:[e.jsx(fs,{}),p]})})}function zr(){const{open:t,toggle:a,intelligence:r}=Gr(),i=r.totals.vencido>0;return t?null:e.jsxs("button",{className:`copilot-floating-button no-print ${i?"has-risk":""}`,type:"button",onClick:n=>{n.preventDefault(),n.stopPropagation(),a()},"aria-label":"Abrir Copilot IA",children:[e.jsx("span",{children:"✨"}),e.jsx("strong",{children:"Copilot IA"}),i&&e.jsx("i",{})]})}function Ar(){return e.jsx("style",{children:`
      .copilot-floating-button {
        position: fixed;
        right: 88px;
        bottom: max(24px, env(safe-area-inset-bottom));
        z-index: 4990;
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: #ffffff;
        background: linear-gradient(135deg, #111827 0%, #0f766e 48%, #14b8a6 100%);
        box-shadow: 0 20px 48px rgba(15, 118, 110, .34);
        cursor: pointer;
        font-weight: 900;
      }
      .copilot-floating-button span { font-size: 18px; }
      .copilot-floating-button strong { font-size: 13px; letter-spacing: .2px; }
      .copilot-floating-button i {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #f97316;
        box-shadow: 0 0 0 6px rgba(249, 115, 22, .18);
      }
      .copilot-floating-button.has-risk { animation: copilotPulse 2.4s infinite; }
      @keyframes copilotPulse {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .copilot-shell { position: fixed; inset: 0; z-index: 4900; pointer-events: none; }
      .copilot-backdrop { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, .28); backdrop-filter: blur(3px); pointer-events: auto; cursor: default; }
      .copilot-drawer {
        position: absolute;
        top: 18px;
        right: 18px;
        bottom: 92px;
        width: min(440px, calc(100vw - 28px));
        max-height: calc(100vh - 110px);
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(240,253,250,.98));
        border: 1px solid rgba(15, 118, 110, .14);
        box-shadow: 0 28px 80px rgba(15, 23, 42, .28);
        overflow: hidden;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
      }
      .copilot-header {
        padding: 22px;
        color: #ffffff;
        background: radial-gradient(circle at top right, rgba(45, 212, 191, .48), transparent 30%), linear-gradient(135deg, #052e2b, #0f766e 58%, #14b8a6);
        display: flex;
        justify-content: space-between;
        gap: 14px;
      }
      .copilot-header span { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; color: rgba(255,255,255,.74); }
      .copilot-header h2 { margin: 7px 0 8px; font-size: 22px; line-height: 1.1; }
      .copilot-header p { margin: 0; color: rgba(255,255,255,.82); font-size: 13px; font-weight: 700; }
      .copilot-live-indicator { margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.88); font-size: 11px; font-weight: 850; }
      .copilot-live-indicator b { width: 7px; height: 7px; border-radius: 999px; background: #34d399; box-shadow: 0 0 0 6px rgba(52, 211, 153, .16); }
      .copilot-header button { width: 36px; height: 36px; min-width: 36px; border: 1px solid rgba(255,255,255,.25); border-radius: 14px; background: rgba(255,255,255,.12); color: #fff; font-size: 24px; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0 0 2px; }
      .copilot-content { padding: 16px; overflow-y: auto; display: grid; gap: 12px; }
      .copilot-card {
        border-radius: 22px;
        padding: 16px;
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(15, 118, 110, .10);
        box-shadow: 0 12px 34px rgba(15, 23, 42, .07);
      }
      .copilot-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
      .copilot-card-head span, .copilot-mini-label { font-size: 12px; font-weight: 950; color: #0f766e; text-transform: uppercase; letter-spacing: .8px; }
      .copilot-card-head strong { font-size: 20px; color: #0f172a; }
      .copilot-card p { margin: 0; color: #475569; line-height: 1.48; font-weight: 650; }
      .copilot-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
      .copilot-metrics div { padding: 10px; border-radius: 16px; background: #f8fafc; border: 1px solid #e5e7eb; min-width: 0; }
      .copilot-metrics small { display: block; color: #64748b; font-size: 11px; font-weight: 800; }
      .copilot-metrics b { display: block; margin-top: 4px; color: #0f172a; font-size: 12px; overflow-wrap: anywhere; }
      .copilot-score-danger { border-color: rgba(220, 38, 38, .18); }
      .copilot-score-warning { border-color: rgba(245, 158, 11, .22); }
      .copilot-score-success { border-color: rgba(16, 185, 129, .20); }
      .copilot-priority-list { display: grid; gap: 10px; }
      .copilot-priority { padding: 12px; border-radius: 18px; background: #f8fafc; border: 1px solid #e5e7eb; display: grid; gap: 10px; }
      .copilot-priority small { color: #64748b; font-weight: 900; font-size: 11px; }
      .copilot-priority strong { display: block; margin-top: 3px; color: #0f172a; }
      .copilot-priority p { margin-top: 4px; font-size: 13px; }
      .copilot-priority button, .copilot-questions button { border: 0; border-radius: 14px; padding: 10px 12px; font-weight: 900; cursor: pointer; background: #0f766e; color: white; }
      .copilot-priority-danger { border-color: #fecaca; background: #fff7f7; }
      .copilot-priority-warning { border-color: #fde68a; background: #fffbeb; }
      .copilot-priority-success { border-color: #bbf7d0; background: #f0fdf4; }

      .copilot-recommendations { display: grid; gap: 9px; }
      .copilot-recommendations p { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 15px; background: #f8fafc; border: 1px solid #e5e7eb; }
      .copilot-recommendations b { width: 22px; height: 22px; min-width: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #0f766e; color: #fff; font-size: 12px; }
      .copilot-drilldown { display: grid; gap: 10px; }
      .copilot-drilldown article { display: grid; gap: 8px; padding: 11px 12px; border-radius: 16px; background: #f8fafc; border: 1px solid #e5e7eb; overflow: hidden; }
      .copilot-drilldown article strong { display: block; color: #0f172a; font-size: 13px; }
      .copilot-drilldown article small { display: block; margin-top: 3px; color: #64748b; font-size: 11px; font-weight: 800; }
      .copilot-drilldown article span { display: block; height: 7px; min-width: 7px; border-radius: 999px; background: linear-gradient(90deg, #0f766e, #14b8a6); }
      .copilot-insights { display: grid; gap: 8px; }
      .copilot-insights p { padding: 10px 12px; border-radius: 15px; background: #f8fafc; border: 1px solid #e5e7eb; }
      .copilot-questions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .copilot-questions button { background: #111827; font-size: 12px; }
      .copilot-answer strong { display: block; margin: 8px 0 6px; color: #111827; }
      @media (max-width: 640px) {
        .copilot-floating-button { right: 82px; bottom: max(18px, env(safe-area-inset-bottom)); padding: 12px 14px; }
        .copilot-floating-button strong { display: none; }
        .copilot-drawer { top: 10px; right: 10px; left: 10px; bottom: 82px; width: auto; max-height: calc(100vh - 92px); border-radius: 24px; }
        .copilot-metrics { grid-template-columns: 1fr; }
      }


      /* Dona Flor 11.7.1 — Executive UX & Mobile Premium */
      :root {
        --df-ease-premium: cubic-bezier(.22, 1, .36, 1);
        --df-shadow-premium: 0 18px 50px rgba(15, 23, 42, .10);
        --df-shadow-hover: 0 24px 70px rgba(15, 23, 42, .15);
      }
      .card, .summary-card, .metric-card, .report-card, .account-card, .note-card, .dashboard-card,
      [class*="card"], .glass, .panel, .table-wrap {
        transition: transform .28s var(--df-ease-premium), box-shadow .28s var(--df-ease-premium), border-color .28s var(--df-ease-premium), background .28s var(--df-ease-premium);
      }
      @media (hover: hover) and (pointer: fine) {
        .card:hover, .summary-card:hover, .metric-card:hover, .report-card:hover, .account-card:hover, .note-card:hover, .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--df-shadow-hover);
        }
        button:not(:disabled), a, .sidebar-item, .nav-item { transition: transform .22s var(--df-ease-premium), box-shadow .22s var(--df-ease-premium), background .22s var(--df-ease-premium), color .22s var(--df-ease-premium); }
        button:not(:disabled):hover { transform: translateY(-1px); }
      }
      .df-skeleton, .df-premium-skeleton {
        position: relative;
        overflow: hidden;
        background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 45%, #eef2f7 100%);
        background-size: 220% 100%;
        animation: dfSkeletonFlow 1.25s ease-in-out infinite;
        border-radius: 14px;
      }
      @keyframes dfSkeletonFlow { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
      @keyframes dfFadeUp { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes dfSoftGlow { 0%, 100% { box-shadow: 0 20px 56px rgba(15, 118, 110, .24); } 50% { box-shadow: 0 24px 70px rgba(20, 184, 166, .34); } }
      .copilot-drawer { animation: dfFadeUp .34s var(--df-ease-premium) both; }
      .copilot-card { animation: dfFadeUp .38s var(--df-ease-premium) both; }
      .copilot-card:nth-child(2) { animation-delay: .03s; }
      .copilot-card:nth-child(3) { animation-delay: .06s; }
      .copilot-card:nth-child(4) { animation-delay: .09s; }
      .copilot-card:nth-child(5) { animation-delay: .12s; }
      .copilot-floating-button { animation: dfSoftGlow 3s ease-in-out infinite; }
      .copilot-floating-button.has-risk { animation: copilotPulse 2.4s infinite, dfSoftGlow 3s ease-in-out infinite; }
      .copilot-card, .copilot-drawer {
        -webkit-font-smoothing: antialiased;
      }
      .copilot-content::-webkit-scrollbar { width: 10px; }
      .copilot-content::-webkit-scrollbar-track { background: rgba(15, 118, 110, .06); border-radius: 999px; }
      .copilot-content::-webkit-scrollbar-thumb { background: rgba(15, 118, 110, .34); border-radius: 999px; border: 3px solid rgba(255,255,255,.86); }
      .copilot-card-head strong { letter-spacing: -.03em; }
      .copilot-priority button, .copilot-questions button {
        box-shadow: 0 10px 24px rgba(15, 118, 110, .20);
      }
      .copilot-questions button {
        background: linear-gradient(135deg, #111827, #0f766e);
      }
      .copilot-priority button:active, .copilot-questions button:active, .copilot-floating-button:active { transform: translateY(1px) scale(.99); }
      @media (max-width: 900px) {
        body { -webkit-tap-highlight-color: transparent; }
        .summary-grid, .dashboard-grid, .reports-grid, .analytics-grid { grid-template-columns: 1fr !important; }
        .table-wrap, .table-responsive, table { max-width: 100%; }
        .table-wrap, .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      }
      @media (max-width: 640px) {
        .copilot-backdrop { backdrop-filter: blur(5px); background: rgba(15, 23, 42, .34); }
        .copilot-drawer {
          top: max(8px, env(safe-area-inset-top));
          right: 8px;
          left: 8px;
          bottom: max(76px, env(safe-area-inset-bottom));
          max-height: none;
          border-radius: 26px 26px 22px 22px;
        }
        .copilot-header { padding: 18px; position: sticky; top: 0; z-index: 2; }
        .copilot-header h2 { font-size: 19px; }
        .copilot-header p { font-size: 12px; }
        .copilot-header button { width: 38px; height: 38px; min-width: 38px; border-radius: 16px; font-size: 25px; }
        .copilot-content { padding: 12px; gap: 10px; }
        .copilot-card { padding: 14px; border-radius: 20px; }
        .copilot-card p { font-size: 14px; }
        .copilot-questions { display: grid; grid-template-columns: 1fr; }
        .copilot-questions button, .copilot-priority button { width: 100%; min-height: 42px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
      }

      @media print { .copilot-floating-button, .copilot-shell { display: none !important; } }
    `})}const xs={semEmpresa:"Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar."};function bs(t){var a,r;return t!=null&&t.empresa_id?{empresaId:t.empresa_id,perfil:ae(t.perfil),nomeEmpresa:t.nome_empresa||((a=t.empresas)==null?void 0:a.nome)||((r=t.df_empresas)==null?void 0:r.nome)||"",origem:"df_usuarios_empresas"}:null}async function hs(){const{error:t}=await S.rpc("vincular_usuario_logado");t&&console.warn("Não foi possível executar vínculo automático:",t.message)}async function ws(t){if(!t)return null;const{data:a,error:r}=await S.from("df_usuarios_empresas").select("empresa_id, perfil").eq("user_id",t).limit(1);if(r)throw r;const i=Array.isArray(a)?a[0]:a;if(!(i!=null&&i.empresa_id))return null;let n="";const{data:c,error:p}=await S.from("df_empresas").select("nome").eq("id",i.empresa_id).limit(1);if(p)console.warn("Não foi possível carregar o nome da empresa ativa:",p.message);else{const u=Array.isArray(c)?c[0]:c;n=(u==null?void 0:u.nome)||""}return bs({...i,nome_empresa:n})}async function Rr(t){if(!t)return"";const{data:a,error:r}=await S.from("profiles").select("name").eq("id",t).limit(1);if(r)return console.warn("Não foi possível carregar o nome do perfil:",r.message),"";const i=Array.isArray(a)?a[0]:a;return(i==null?void 0:i.name)||""}function Ut(t){if(!t)throw new Error("Empresa não identificada para esta operação.");return t}function Jr(t){if(!(t!=null&&t.empresa_id))throw new Error("Operação bloqueada: empresa_id ausente no payload.");return t}function vs(t){return!Array.isArray(t)||t.length===0||t.forEach(Jr),t}function fe(t,a,r,i="*"){return Ut(r),t.from(a).select(i).eq("empresa_id",r)}function Ke(t,a,r,i={}){Jr(r);let n=t.from(a).insert([r]);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function ys(t,a,r,i={}){vs(r);let n=t.from(a).insert(r);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function Qe(t,a,r,i,n){return Ut(i),t.from(a).update(n).eq("id",r).eq("empresa_id",i)}function ks(t,a,r,i){return Ut(i),t.from(a).delete().eq("id",r).eq("empresa_id",i)}async function js(t,a){return Ut(a),fe(t,"df_contas",a,"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").or("excluido.is.null,excluido.eq.false").order("data_vencimento")}async function _s(t,a,r,i){return Ut(a),fe(t,"df_contas",a,"id, descricao, valor, data_vencimento, recorrencia_id, excluido, excluido_em").gte("data_vencimento",r).lte("data_vencimento",i)}async function Ss(t,a){return Ut(a),fe(t,"df_contas_recorrentes",a).eq("ativo",!0)}async function Cs(t,a,r){if(!a)return null;Ut(r);const{data:i,error:n}=await t.from("df_centros_custo").select("id").eq("id",a).eq("empresa_id",r).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function Ns(t,a,r){if(!a)return null;Ut(r);const{data:i,error:n}=await t.from("df_filiais").select("id").eq("id",a).eq("empresa_id",r).eq("ativo",!0).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function Es(t,a){return ys(t,"df_contas",a,{select:"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)"})}async function zs(t,a){return Ke(t,"df_contas",a,{select:!0})}async function Ea(t,a,r,i){return Qe(t,"df_contas",a,r,i)}async function As(t,a,r){return Ut(r),fe(t,"df_contas_recorrentes",r).eq("id",a).maybeSingle()}async function Rs(t,a,r){return Ut(a),fe(t,"df_contas_recorrentes",a).eq("ativo",!0).eq("dia_vencimento",r).order("created_at",{ascending:!1})}async function Pr(t,a){const r=await Ke(t,"df_contas_recorrentes",a,{select:!0});return Qr(r.error,a)?Ke(t,"df_contas_recorrentes",Xr(a),{select:!0}):r}async function Kr(t,a,r,i){const n=await Qe(t,"df_contas_recorrentes",a,r,i);return Qr(n.error,i)?Qe(t,"df_contas_recorrentes",a,r,Xr(i)):n}async function Ye(t,a,r,i){return Ea(t,a,r,{recorrencia_id:i})}async function Ps(t,a,r){return Kr(t,a,r,{ativo:!1})}async function Mr(t,a,r,i){return Ea(t,a,r,{status:i})}async function Ms(t,a,r){return Ea(t,a,r,{excluido:!0,excluido_em:new Date().toISOString()})}function Qr(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&Ds(t))}function Ds(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Xr(t){const{filial_id:a,...r}=t||{};return r}function Xe(t){if(!t)return null;const a=String(t).slice(0,10);return new Date(a+"T00:00:00")}function Ae(t){const a=new Date;a.setHours(0,0,0,0);const r=Xe(t);if(!r)return 999999;const i=r-a;return Math.round(i/(1e3*60*60*24))}function Fs(t){const a=Xe(t);if(!a)return!1;const r=new Date;return a.getMonth()===r.getMonth()&&a.getFullYear()===r.getFullYear()}function zt(t){return t?String(t).charAt(0).toUpperCase()+String(t).slice(1):""}function kt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function It(t){return t?new Date(String(t).slice(0,10)+"T00:00:00").toLocaleDateString("pt-BR"):"-"}function Ca(t){if(!t)return null;const a=String(t).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(/^\d{2}\/\d{2}\/\d{4}$/.test(a)){const[r,i,n]=a.split("/");return`${n}-${i}-${r}`}return a.slice(0,10)}function so(t){if(!t)return"";const a=String(t);if(a.includes("-"))return a.slice(0,10);const r=a.replace(/\D/g,"").slice(0,8);return r.length<=2?r:r.length<=4?`${r.slice(0,2)}/${r.slice(2)}`:`${r.slice(0,2)}/${r.slice(2,4)}/${r.slice(4,8)}`}function Is(t){const a=String(t||"").trim();if(!a)return 0;const r=a.replace(/[^\d,.-]/g,""),n=r.includes(",")?r.replace(/\./g,"").replace(",","."):r.replace(/,/g,""),c=Number(n);return Number.isFinite(c)?c:0}function Ad(t){return kt(t)}function Rd(t){return It(t)}function Ts(t,a,r){const i=new Date(t,a,0).getDate(),n=Math.min(Number(r||1),i);return`${t}-${String(a).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function $s(t,a,r){if(!(t!=null&&t.ativo)||(t.tipo_recorrencia||t.frequencia||"mensal")!=="mensal")return!1;const i=t.data_inicio?Xe(t.data_inicio):null;if(!i)return!0;const n=new Date(a,r-1,1),c=new Date(a,r,0);return i<=c&&n>=new Date(i.getFullYear(),i.getMonth(),1)}function Ls(t){var r;const a=((r=t==null?void 0:t.df_contas_recorrentes)==null?void 0:r.tipo_recorrencia)||(t==null?void 0:t.tipo_recorrencia)||"";return String(a||"mensal")}function qs(t){const a=String(t||"mensal").toLowerCase();return{mensal:"Mensal",semanal:"Semanal",anual:"Anual",quinzenal:"Quinzenal"}[a]||zt(a)}function Os(){const[t,a]=d.useState([]),[r,i]=d.useState([]),[n,c]=d.useState(""),[p,u]=d.useState("todas"),[v,k]=d.useState(""),[N,y]=d.useState(""),[E,h]=d.useState(""),[P,j]=d.useState(""),[_,I]=d.useState(""),[G,B]=d.useState(!0),[A,L]=d.useState(!1),[F,lt]=d.useState(null),[X,$]=d.useState(""),[O,St]=d.useState(""),[ht,wt]=d.useState(""),[Tt,V]=d.useState(""),[M,Q]=d.useState(""),[pt,et]=d.useState(""),[st,K]=d.useState(!1),[At,ge]=d.useState(!1),[Ze,xe]=d.useState(!1),[ta,be]=d.useState("1"),[Re,he]=d.useState(!1),[Pe,we]=d.useState("mensal"),[Me,ve]=d.useState(""),[Yt,oe]=d.useState(null);function ea(){lt(null),$(""),St(""),wt(""),V(""),Q(""),et(""),K(!1),ge(!1),xe(!1),be("1"),he(!1),we("mensal"),ve(""),oe(null)}async function aa(W,z,D){return D?Cs(W,D,z):null}async function oa(W,z,D){return D?Ns(W,D,z):null}async function Aa({supabase:W,empresaAtual:z,contasAtuais:D,configWhatsapp:q,configEmail:mt,configPush:Z,diasAlertaContas:xt,diasAvisoPadrao:vt}){const at=new Date,ut=at.getFullYear(),ot=at.getMonth()+1,{data:Ct,error:$t}=await Ss(W,z);if($t)return console.warn("Não foi possível carregar contas recorrentes:",$t.message),D;const Fe=`${ut}-${String(ot).padStart(2,"0")}-01`,Ie=`${ut}-${String(ot).padStart(2,"0")}-${String(new Date(ut,ot,0).getDate()).padStart(2,"0")}`,{data:ye,error:ke}=await _s(W,z,Fe,Ie);ke&&console.warn("Não foi possível validar contas recorrentes existentes:",ke.message);const re=Array.isArray(ye)?ye:D,Vt=[];for(const rt of Ct||[]){if(!$s(rt,ut,ot))continue;const yt=Ts(ut,ot,rt.dia_vencimento);if(re.some(ft=>{const gt=rt.id&&ft.recorrencia_id===rt.id,nt=String(ft.descricao||"").trim().toLowerCase()===String(rt.descricao||"").trim().toLowerCase();return ft.data_vencimento===yt&&(gt||nt)}))continue;const Pt=await aa(W,z,rt.centro_custo_id),it=await oa(W,z,rt.filial_id);Vt.push({empresa_id:z,descricao:rt.descricao,valor:Number(rt.valor||0),data_vencimento:yt,vencimento:yt,centro_custo_id:Pt,filial_id:it,observacao:rt.observacao||null,recorrencia_id:rt.id,status:"pendente",excluido:!1,enviar_whatsapp:q,enviar_email:mt,enviar_push:Z,dias_aviso:Number(xt||vt||1)})}if(Vt.length===0)return D;const{data:je,error:Rt}=await Es(W,Vt);return Rt?(console.warn("Não foi possível gerar contas recorrentes:",Rt.message),D):[...D,...je||[]].sort((rt,yt)=>String(rt.data_vencimento||"").localeCompare(String(yt.data_vencimento||"")))}async function Ra(W){const{supabase:z,empresaAtual:D,avisarErro:q,configWhatsapp:mt,configEmail:Z,configPush:xt,diasAlertaContas:vt,diasAvisoPadrao:at}=W;if(!D)return;const{data:ut,error:ot}=await js(z,D);if(ot){q(ot);return}const $t=await Aa({supabase:z,empresaAtual:D,contasAtuais:ut||[],configWhatsapp:mt,configEmail:Z,configPush:xt,diasAlertaContas:vt,diasAvisoPadrao:at});a($t)}function Pa(W){const{setMenuAberto:z,setMenuNavegacaoAberto:D,configWhatsapp:q,configEmail:mt,configPush:Z,diasAvisoPadrao:xt}=W;z(!1),D(!1),ea(),K(q),ge(mt),xe(Z),be(String(xt||1)),L(!0)}async function De({supabase:W,empresaId:z,conta:D,dataBanco:q,descricaoConta:mt}){if(!W||!z||!D)return null;if(D.recorrencia_id){const{data:ot,error:Ct}=await As(W,D.recorrencia_id,z);if(!Ct&&ot)return ot}const Z=Number(String(q||D.data_vencimento||"").slice(8,10));if(!Z)return null;const{data:xt,error:vt}=await Rs(W,z,Z);if(vt||!Array.isArray(xt))return null;const at=String(mt||D.descricao||"").trim().toLowerCase(),ut=Number(D.valor||0);return xt.find(ot=>{const Ct=String(ot.descricao||"").trim().toLowerCase()===at,$t=Number(ot.valor||0)===ut;return Ct&&$t})||null}async function Ma(W){const{conta:z,supabase:D,empresaId:q,diasAvisoPadrao:mt,formatarDataParaBanco:Z}=W,xt=Z(z.data_vencimento||""),vt=xt?String(Number(String(xt).slice(8,10))):"";lt(z.id),$(z.descricao||""),St(z.valor||""),wt(z.data_vencimento||""),V(z.centro_custo_id||""),Q(z.filial_id||""),et(z.observacao||""),K(z.enviar_whatsapp??!1),ge(z.enviar_email??!1),xe(z.enviar_push??!1),be(String(z.dias_aviso??mt??1)),he(!!z.recorrencia_id),oe(z.recorrencia_id||null),we("mensal"),ve(vt),L(!0);const at=await De({supabase:D,empresaId:q,conta:z,dataBanco:xt,descricaoConta:z.descricao});at&&(he(!0),oe(at.id),we(at.frequencia||at.tipo_recorrencia||"mensal"),ve(String(at.dia_vencimento||vt||"")),!z.recorrencia_id&&at.id&&await Ye(D,z.id,q,at.id))}function Da(){L(!1),ea()}async function ra(W){const{supabase:z,empresaId:D,mostrarAviso:q,configWhatsapp:mt,configEmail:Z,configPush:xt,diasAlertaContas:vt,diasAvisoPadrao:at,primeiraLetraMaiuscula:ut,converterValor:ot,formatarDataParaBanco:Ct,erroEhSessaoExpirada:$t,limparEstadoAutenticacao:Fe,setUsuarioLogado:Ie,buscarContas:ye,fecharConta:ke}=W;if(!D){q("Usuário sem empresa vinculada.","erro");return}if(!X||!O||!ht){q("Preencha descrição, valor e vencimento.","erro");return}const re=await aa(z,D,Tt),Vt=await oa(z,D,M),je={descricao:ut(X.trim()),valor:ot(O),data_vencimento:Ct(ht),vencimento:Ct(ht),centro_custo_id:re,filial_id:Vt,observacao:pt.trim()||null,enviar_whatsapp:st,enviar_email:At,enviar_push:Ze,dias_aviso:Number(ta||vt||at||1),empresa_id:D};let Rt;if(F){if(Rt=(await Ea(z,F,D,je)).error,!Rt){const yt=Ct(ht),dt=Number(Me||String(yt).slice(8,10));if(Re){if(!dt||dt<1||dt>31){q("Informe um dia válido para a recorrência.","erro");return}const Pt={empresa_id:D,descricao:ut(X.trim()),valor:ot(O),centro_custo_id:re,filial_id:Vt,tipo_recorrencia:Pe||"mensal",dia_vencimento:dt,data_inicio:yt,ativo:!0};if(Yt){const{error:it}=await Kr(z,Yt,D,Pt);if(it){q("A conta foi atualizada, mas a recorrência não foi salva: "+it.message,"erro");return}const{error:ft}=await Ye(z,F,D,Yt);if(ft){q("A recorrência foi atualizada, mas não foi vinculada à conta: "+ft.message,"erro");return}}else{const{data:it,error:ft}=await Pr(z,Pt);if(ft){q("A conta foi atualizada, mas a recorrência não foi salva: "+ft.message,"erro");return}const gt=Array.isArray(it)?it[0]:it;let nt=gt==null?void 0:gt.id;if(!nt){const Jt=await De({supabase:z,empresaId:D,conta:{descricao:ut(X.trim()),valor:ot(O),data_vencimento:yt},dataBanco:yt,descricaoConta:ut(X.trim())});nt=Jt==null?void 0:Jt.id}if(!nt){q("A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.","erro");return}const{error:Mt}=await Ye(z,F,D,nt);if(Mt){q("A recorrência foi criada, mas não foi vinculada à conta: "+Mt.message,"erro");return}oe(nt),a(Jt=>Jt.map(Kt=>Kt.id===F?{...Kt,recorrencia_id:nt}:Kt))}}else Yt&&(await Ps(z,Yt,D),await Ye(z,F,D,null))}}else{const rt=await zs(z,{...je,status:"pendente",excluido:!1});if(Rt=rt.error,!Rt&&Re){const yt=Ct(ht),dt=Number(Me||String(yt).slice(8,10));if(!dt||dt<1||dt>31){q("Informe um dia válido para a recorrência.","erro");return}const{data:Pt,error:it}=await Pr(z,{empresa_id:D,descricao:ut(X.trim()),valor:ot(O),centro_custo_id:re,filial_id:Vt,tipo_recorrencia:Pe||"mensal",dia_vencimento:dt,data_inicio:yt,ativo:!0});if(it)q("A conta foi criada, mas a recorrência não foi salva: "+it.message,"erro");else{const ft=Array.isArray(Pt)?Pt[0]:Pt,gt=Array.isArray(rt.data)?rt.data[0]:rt.data;let nt=ft==null?void 0:ft.id;if(!nt&&(gt!=null&&gt.id)){const Mt=await De({supabase:z,empresaId:D,conta:gt,dataBanco:yt,descricaoConta:ut(X.trim())});nt=Mt==null?void 0:Mt.id}if(nt&&(gt!=null&&gt.id)){const{error:Mt}=await Ye(z,gt.id,D,nt);if(Mt){q("A recorrência foi criada, mas não foi vinculada à conta: "+Mt.message,"erro");return}}}}}if(Rt){$t(Rt)?(await z.auth.signOut(),Fe(),Ie(null),q("Sua sessão expirou. Faça login novamente.","erro")):q(Rt.message,"erro");return}ke(),await ye(),q(F?"Conta atualizada com sucesso.":"Conta criada com sucesso.","sucesso")}async function Fa(W){const{supabase:z,id:D,empresaId:q,buscarContas:mt,mostrarAviso:Z}=W;await Mr(z,D,q,"pago"),await mt(),Z==null||Z("Conta marcada como paga.","sucesso")}async function ia(W){const{supabase:z,id:D,empresaId:q,buscarContas:mt,mostrarAviso:Z}=W;await Mr(z,D,q,"pendente"),await mt(),Z==null||Z("Conta voltou para pendente.","sucesso")}async function na(W){const{supabase:z,id:D,empresaId:q,avisarErro:mt,buscarContas:Z,buscarLixeira:xt,mostrarAviso:vt}=W,{error:at}=await Ms(z,D,q);if(at){mt(at);return}await Promise.all([Z(),xt()]),vt==null||vt("Conta enviada para a lixeira.","sucesso")}return{contas:t,setContas:a,contasLixeira:r,setContasLixeira:i,busca:n,setBusca:c,filtroStatus:p,setFiltroStatus:u,filtroCentro:v,setFiltroCentro:k,filtroFilial:N,setFiltroFilial:y,filtroMes:E,setFiltroMes:h,dataInicial:P,setDataInicial:j,dataFinal:_,setDataFinal:I,loading:G,setLoading:B,modalConta:A,setModalConta:L,editandoContaId:F,setEditandoContaId:lt,descricao:X,setDescricao:$,valor:O,setValor:St,dataVencimento:ht,setDataVencimento:wt,centroCustoId:Tt,setCentroCustoId:V,filialId:M,setFilialId:Q,observacaoConta:pt,setObservacaoConta:et,contaWhatsapp:st,setContaWhatsapp:K,contaEmail:At,setContaEmail:ge,contaPush:Ze,setContaPush:xe,contaDiasAviso:ta,setContaDiasAviso:be,contaRecorrente:Re,setContaRecorrente:he,tipoRecorrencia:Pe,setTipoRecorrencia:we,diaVencimentoRecorrencia:Me,setDiaVencimentoRecorrencia:ve,recorrenciaContaId:Yt,setRecorrenciaContaId:oe,buscarContas:Ra,abrirNovaConta:Pa,abrirEdicaoConta:Ma,fecharConta:Da,salvarConta:ra,marcarComoPago:Fa,voltarParaPendente:ia,excluirConta:na}}async function Us(t,a){return fe(t,"df_notas",a).eq("excluido",!1).order("created_at",{ascending:!1})}async function Bs(t,a){return fe(t,"df_notas",a).eq("excluido",!0).order("excluido_em",{ascending:!1})}async function Vs(t,a){const r=await Ke(t,"df_notas",a);return Zr(r.error,a)?Ke(t,"df_notas",ti(a)):r}async function za(t,a,r,i){const n=await Qe(t,"df_notas",a,r,i);return Zr(n.error,i)?Qe(t,"df_notas",a,r,ti(i)):n}async function Ws(t,a,r){return za(t,a,r,{excluido:!0,excluido_em:new Date().toISOString()})}async function Hs(t,a,r){return za(t,a.id,r,{concluida:!a.concluida})}async function Gs(t,a,r){return za(t,a,r,{excluido:!1,excluido_em:null})}async function Ys(t,a,r){return ks(t,"df_notas",a,r)}function Zr(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&Js(t))}function Js(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function ti(t){const{filial_id:a,...r}=t||{};return r}function Dr(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}:${a.titulo||""}`).join("|")}function Ks(t,a=[]){t((r=[])=>Dr(r)===Dr(a)?r:a)}function Qs(){const[t,a]=d.useState([]),[r,i]=d.useState([]),[n,c]=d.useState(""),[p,u]=d.useState(!1),[v,k]=d.useState(null),[N,y]=d.useState(""),[E,h]=d.useState(""),[P,j]=d.useState("normal"),[_,I]=d.useState(""),[G,B]=d.useState("");function A(){k(null),y(""),h(""),j("normal"),I(""),B("")}async function L({supabase:V,empresaAtual:M,avisarErro:Q}){if(!M)return;const{data:pt,error:et}=await Us(V,M);if(et){Q(et);return}a(pt||[])}async function F({supabase:V,empresaAtual:M,avisarErro:Q}){if(!M)return;const{data:pt,error:et}=await Bs(V,M);if(et){Q(et);return}Ks(i,pt||[])}function lt({setMenuAberto:V,setMenuNavegacaoAberto:M}){V(!1),M(!1),A(),u(!0)}function X(V){k(V.id),y(V.titulo||""),h(V.conteudo||""),j(V.prioridade||"normal"),I(V.data_evento||""),B(V.filial_id||""),u(!0)}function $(){u(!1),A()}async function O({supabase:V,empresaId:M,mostrarAviso:Q,avisarErro:pt,buscarNotas:et}){if(!M){Q("Usuário sem empresa vinculada.","erro");return}if(!N.trim()){Q("Digite o título da nota.","erro");return}const st={titulo:zt(N.trim()),conteudo:E.trim(),prioridade:P||"normal",data_evento:_||null,concluida:!1,empresa_id:M,filial_id:G||null};let K;if(v?K=(await za(V,v,M,st)).error:K=(await Vs(V,st)).error,K){pt(K);return}$(),await et(),Q(v?"Nota atualizada com sucesso.":"Nota criada com sucesso.","sucesso")}async function St({supabase:V,id:M,empresaId:Q,avisarErro:pt,buscarNotas:et,buscarLixeira:st,mostrarAviso:K}){const{error:At}=await Ws(V,M,Q);if(At){pt(At);return}await Promise.all([et(),st()]),K==null||K("Nota enviada para a lixeira.","sucesso")}async function ht({supabase:V,nota:M,empresaId:Q,avisarErro:pt,buscarNotas:et,mostrarAviso:st}){const{error:K}=await Hs(V,M,Q);if(K){pt(K);return}await et(),st==null||st(M.concluida?"Nota reaberta.":"Nota concluída.","sucesso")}async function wt({supabase:V,id:M,empresaId:Q,avisarErro:pt,buscarNotas:et,buscarLixeira:st,mostrarAviso:K}){const{error:At}=await Gs(V,M,Q);if(At){pt(At);return}await Promise.all([et(),st()]),K==null||K("Nota restaurada com sucesso.","sucesso")}async function Tt({supabase:V,nota:M,empresaId:Q,avisarErro:pt,buscarLixeira:et,mostrarAviso:st}){const{error:K}=await Ys(V,M.id,Q);if(K){pt(K);return}await et(),st==null||st("Nota excluída definitivamente.","sucesso")}return{notas:t,setNotas:a,notasLixeira:r,setNotasLixeira:i,buscaNota:n,setBuscaNota:c,modalNota:p,setModalNota:u,editandoNotaId:v,setEditandoNotaId:k,tituloNota:N,setTituloNota:y,conteudoNota:E,setConteudoNota:h,prioridadeNota:P,setPrioridadeNota:j,dataEventoNota:_,setDataEventoNota:I,filialNotaId:G,setFilialNotaId:B,buscarNotas:L,buscarNotasLixeira:F,abrirNovaNota:lt,abrirEdicaoNota:X,fecharNota:$,salvarNota:O,excluirNota:St,alternarNotaConcluida:ht,restaurarNota:wt,excluirNotaDefinitivo:Tt}}const xo="df_sessao_segura",Xs=8*60*60*1e3,Zs=30*60*1e3,td=25*60*1e3;function co(){try{return JSON.parse(localStorage.getItem(xo)||"{}")}catch{return{}}}function Fr(t){localStorage.setItem(xo,JSON.stringify(t))}function ed(){localStorage.removeItem(xo)}function ad({onClearAuthData:t,onSessionWarning:a,onShowMessage:r,onNavigateHome:i}={}){const n=d.useRef(!1),c=d.useRef(!1),[p,u]=d.useState(null),[v,k]=d.useState(!0),N=d.useCallback(()=>{const E=co();Fr({inicio:E.inicio||Date.now(),ultimaAtividade:Date.now()}),n.current=!1},[]),y=d.useCallback(async(E,h="erro")=>{if(!c.current){c.current=!0,t==null||t(),u(null),k(!1),i==null||i();try{await S.auth.signOut()}finally{E&&(r==null||r(E,h)),window.setTimeout(()=>{c.current=!1},1200)}}},[t,i,r]);return d.useEffect(()=>{let E=!0;async function h(){try{const j=new Promise(G=>{window.setTimeout(()=>G({data:{session:null},error:new Error("Timeout ao validar sessão")}),8e3)}),{data:_,error:I}=await Promise.race([S.auth.getSession(),j]);if(!E)return;if(I||!(_!=null&&_.session)){t==null||t(),u(null);return}u(_.session.user)}catch(j){if(!E)return;console.warn("Falha ao validar sessão:",(j==null?void 0:j.message)||j),t==null||t(),u(null)}finally{E&&k(!1)}}h();const{data:P}=S.auth.onAuthStateChange((j,_)=>{k(!1),u((_==null?void 0:_.user)||null),_||t==null||t()});return()=>{E=!1,P.subscription.unsubscribe()}},[t]),d.useEffect(()=>{if(!p)return;const E=Date.now(),h=co();Fr({inicio:h.inicio||E,ultimaAtividade:E});function P(){const I=co(),G=Number(I.inicio||Date.now()),B=Number(I.ultimaAtividade||Date.now()),A=Date.now(),L=A-G,F=A-B;if(L>=Xs){y("Sua sessão expirou por segurança. Faça login novamente.");return}if(F>=Zs){y("Sua sessão foi encerrada por inatividade. Faça login novamente.");return}F>=td&&!n.current&&(n.current=!0,a==null||a(N))}const j=["click","keydown","mousemove","scroll","touchstart"];j.forEach(I=>window.addEventListener(I,N,{passive:!0}));const _=window.setInterval(P,60*1e3);return()=>{j.forEach(I=>window.removeEventListener(I,N)),window.clearInterval(_)}},[y,a,N,p]),{usuarioLogado:p,setUsuarioLogado:u,carregandoAuth:v,setCarregandoAuth:k,encerrarSessao:y,registrarAtividadeSessao:N}}const od={aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null};function rd(){const[t,a]=d.useState(!1),[r,i]=d.useState(""),[n,c]=d.useState(!1),[p,u]=d.useState(!1),[v,k]=d.useState(!0),[N,y]=d.useState(!0),[E,h]=d.useState(()=>typeof window>"u"?!0:window.innerWidth>=980),[P,j]=d.useState(!0),[_,I]=d.useState(!0),[G,B]=d.useState(!0),[A,L]=d.useState(!0),[F,lt]=d.useState(od),[X,$]=d.useState(null),[O,St]=d.useState([]),[ht,wt]=d.useState("");return{modalPerfilUsuario:t,setModalPerfilUsuario:a,nomePerfilEditando:r,setNomePerfilEditando:i,salvandoPerfilUsuario:n,setSalvandoPerfilUsuario:c,mostrarFiltros:p,setMostrarFiltros:u,mostrarContas:v,setMostrarContas:k,mostrarContasDashboard:N,setMostrarContasDashboard:y,mostrarNotas:E,setMostrarNotas:h,mostrarConfigNegocio:P,setMostrarConfigNegocio:j,mostrarConfigNotificacoes:_,setMostrarConfigNotificacoes:I,mostrarConfigCentros:G,setMostrarConfigCentros:B,mostrarConfigRecorrencias:A,setMostrarConfigRecorrencias:L,confirmacao:F,setConfirmacao:lt,arquivoImportacao:X,setArquivoImportacao:$,linhasImportacao:O,setLinhasImportacao:St,statusImportacao:ht,setStatusImportacao:wt}}const id={principal:!0,financeiro:!0,analise:!0,sistema:!0};function nd(t="dashboard"){const[a,r]=d.useState(!1),[i,n]=d.useState(!1),[c,p]=d.useState(!1),[u,v]=d.useState(id),[k,N]=d.useState(t),y=d.useCallback(()=>{r(!1),n(!1)},[]),E=d.useCallback(h=>{var P;y(),N(h),typeof window<"u"&&((P=window.history.state)==null?void 0:P.tela)!==h&&window.history.pushState({tela:h},"",window.location.href)},[y]);return d.useEffect(()=>{if(typeof window>"u")return;window.history.replaceState({tela:t},"",window.location.href);function h(P){var _;const j=((_=P.state)==null?void 0:_.tela)||t;y(),N(j)}return window.addEventListener("popstate",h),()=>window.removeEventListener("popstate",h)},[y,t]),d.useEffect(()=>{if(typeof window>"u")return;const h=document.body.style.overflow,P=document.documentElement.style.overflow,j=document.body.style.position,_=document.body.style.width,I=window.scrollY;return i&&(document.body.classList.add("mobile-nav-open"),document.documentElement.classList.add("mobile-nav-open"),document.body.style.overflow="hidden",document.documentElement.style.overflow="hidden",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.top=`-${I}px`),()=>{document.body.classList.remove("mobile-nav-open"),document.documentElement.classList.remove("mobile-nav-open"),document.body.style.overflow=h,document.documentElement.style.overflow=P,document.body.style.position=j,document.body.style.width=_,document.body.style.top="",i&&window.scrollTo(0,I)}},[i]),{menuAberto:a,setMenuAberto:r,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,sidebarCompacta:c,setSidebarCompacta:p,gruposMenu:u,setGruposMenu:v,telaAtual:k,setTelaAtualState:N,fecharMenus:y,navegarPara:E}}const Na={MASTER:"master",ADMIN:"admin",GERENTE:"gerente",OPERADOR:"operador"},sd=new Set(["donafloradm@outlook.com"]);function fo(t){return String(t||"").trim().toLowerCase()}function dd(t){const a=String(t).toLowerCase().trim();return["master","super_admin","superadmin","owner","dono"].includes(a)?Na.MASTER:["admin","adm","administrador"].includes(a)?Na.ADMIN:ae(a)}function cd(t){return!(!t||t.ativo===!1||t.status&&String(t.status).toLowerCase()!=="ativo")}function Je({perfilEmpresa:t="operador",master:a=null}={}){const r=ae(t),i=a!=null&&a.isMaster?Na.MASTER:r;return{perfilEmpresa:r,perfilGlobal:i,isMaster:!!(a!=null&&a.isMaster),canManageUsers:!!(a!=null&&a.isMaster||r==="admin"),canAccessSettings:!!(a!=null&&a.isMaster||["admin","gerente"].includes(r)),canManageCompanies:!!(a!=null&&a.isMaster),canSwitchCompany:!!(a!=null&&a.isMaster)}}async function lo({userId:t,email:a,perfilEmpresa:r="operador"}={}){const i=fo(a),n=Je({perfilEmpresa:r});if(sd.has(i))return Je({perfilEmpresa:r,master:{isMaster:!0}});if(!t&&!i)return n;try{const{data:c,error:p}=await S.from("df_usuarios_master").select("*").limit(100);if(p)return console.warn("Não foi possível consultar df_usuarios_master:",p.message),n;const u=(c||[]).find(v=>{const k=t&&v.user_id&&v.user_id===t,N=i&&fo(v.email)===i;return(k||N)&&cd(v)});return u?Je({perfilEmpresa:r,master:{isMaster:!0,perfil:dd(u.perfil||u.tipo||Na.MASTER)}}):n}catch(c){return console.warn("Falha ao carregar permissões globais:",c.message),n}}async function ld({isMaster:t}={}){if(!t)return[];const{data:a,error:r}=await S.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(r)throw r;return a||[]}async function Ir({userId:t,email:a,isMaster:r}={}){if(r)return ld({isMaster:r});const i=fo(a);if(!t&&!i)return[];let n=S.from("df_usuarios_empresas").select("empresa_id, perfil, nome, email, user_id");t&&i?n=n.or(`user_id.eq.${t},email.eq.${i}`):t?n=n.eq("user_id",t):n=n.eq("email",i);const{data:c,error:p}=await n;if(p)throw p;const u=new Map;(c||[]).forEach(y=>{if(!(y!=null&&y.empresa_id))return;const E=ae(y.perfil),h=u.get(y.empresa_id);u.set(y.empresa_id,{id:y.empresa_id,nome:(h==null?void 0:h.nome)||"",perfil:(h==null?void 0:h.perfil)==="admin"?h.perfil:E})});const v=Array.from(u.keys());if(v.length===0)return[];const{data:k,error:N}=await S.from("df_empresas").select("id, nome, created_at").in("id",v).order("nome",{ascending:!0});if(N)throw N;return(k||[]).forEach(y=>{const E=u.get(y.id);E&&u.set(y.id,{...E,nome:y.nome||E.nome||"Empresa",created_at:y.created_at})}),Array.from(u.values()).sort((y,E)=>String(y.nome||"").localeCompare(String(E.nome||"")))}function pd(){const[t,a]=d.useState(null),[r,i]=d.useState(!1),[n,c]=d.useState(""),[p,u]=d.useState(()=>Je()),[v,k]=d.useState("");return{empresaId:t,setEmpresaId:a,trocandoEmpresa:r,setTrocandoEmpresa:i,perfilUsuario:n,setPerfilUsuario:c,permissoesUsuario:p,setPermissoesUsuario:u,erroEmpresa:v,setErroEmpresa:k}}function qt(t,a){if(!t||a==="pago")return!1;const r=new Date;r.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<r}function Tr(t){return t?String(t).slice(0,7):""}function $r(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}`).join("|")}function Lr(t){if(!t)return 0;const a=new Date(t),i=new Date-a;return Math.max(0,Math.floor(i/(1e3*60*60*24)))}function qr(){return!0}function md(t,a=[]){t((r=[])=>$r(r)===$r(a)?r:a)}function po(t){const a=String((t==null?void 0:t.message)||t||"").toLowerCase();return a.includes("jwt")||a.includes("expired")||a.includes("unauthorized")||a.includes("session")}function ei(t){return String(t||"").trim().replace(/\s+/g," ")}function ai(t){const a=String(t||"").trim();if(!a)throw new Error("Empresa não identificada para gerenciar filiais.");return a}async function ud(t){const a=ai(t),{data:r,error:i}=await S.from("df_filiais").select("id, empresa_id, nome, ativo, created_at").eq("empresa_id",a).order("nome",{ascending:!0});if(i)throw i;return r||[]}async function Pd({empresaId:t,nome:a}){const r=ai(t),i=ei(a);if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:c}=await S.from("df_filiais").select("id, nome").eq("empresa_id",r).ilike("nome",i).limit(1);if(c)throw c;if(Array.isArray(n)&&n.length>0)throw new Error("Já existe uma filial com esse nome nesta empresa.");const{data:p,error:u}=await S.from("df_filiais").insert([{empresa_id:r,nome:i,ativo:!0}]).select("id, empresa_id, nome, ativo, created_at").single();if(u)throw u;return p}async function Md({filialId:t,nome:a}){const r=String(t||"").trim(),i=ei(a);if(!r)throw new Error("Filial não identificada.");if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:c}=await S.from("df_filiais").update({nome:i}).eq("id",r).select("id, empresa_id, nome, ativo, created_at").single();if(c)throw c;return n}async function Dd({filialId:t,ativo:a}){const r=String(t||"").trim();if(!r)throw new Error("Filial não identificada.");const{data:i,error:n}=await S.from("df_filiais").update({ativo:!!a}).eq("id",r).select("id, empresa_id, nome, ativo, created_at").single();if(n)throw n;return i}const l={usuarioTopo:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",border:"1px solid #d8eee9",borderRadius:18,padding:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 10px 24px rgba(15,118,110,0.10)",position:"relative",zIndex:20},logoMarca:{display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",padding:0,textAlign:"left",color:"#064e3b"},logoIcone:{width:42,height:42,borderRadius:14,background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 0 0 1px #cfe8da"},logoImagem:{width:48,height:48,borderRadius:16,objectFit:"cover",background:"#0f766e",boxShadow:"0 8px 18px rgba(20,184,166,0.28)"},logoTexto:{display:"flex",flexDirection:"column",gap:2,lineHeight:1.05},usuarioAcoes:{display:"flex",alignItems:"center",gap:8},usuarioTexto:{display:"flex",flexDirection:"column",alignItems:"flex-end",fontSize:13,color:"#1f2937"},btnMenuTopo:{width:44,height:44,borderRadius:14,border:"1px solid #e5e7eb",background:"#ffffff",color:"#0f172a",fontSize:22,fontWeight:"bold",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 16px rgba(15,23,42,0.08)"},menuBackdrop:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.22)",zIndex:4e3,display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:"76px 12px 12px 12px"},menuNavegacao:{width:"min(360px, 94vw)",height:"auto",maxHeight:"calc(100dvh - 96px)",overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",background:"#ffffff",border:"1px solid #d8eee9",borderRadius:22,padding:14,display:"grid",gap:8,boxShadow:"0 24px 60px rgba(15,23,42,0.25)"},menuPerfil:{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:18,background:"linear-gradient(135deg, #ecfdf5, #f0fdfa)",color:"#064e3b",marginBottom:4},menuPerfilIcone:{width:46,height:46,borderRadius:16,objectFit:"cover",background:"#0f766e"},menuSecaoTitulo:{fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:800,color:"#6b7280",padding:"10px 8px 2px"},menuNavItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#f8faf9",border:"1px solid #edf1ef",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#064e3b"},menuSairItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#be123c",fontWeight:700},agendaResumoCard:{background:"#ffffff",border:"1px solid #dfe7e2",borderLeft:"5px solid #14b8a6",padding:14,borderRadius:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"grid",gap:10},agendaResumoGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,color:"#374151"},btnAgendaCompleta:{border:"none",borderRadius:10,background:"#14b8a6",color:"#fff",padding:"10px 12px",fontWeight:"bold"},uploadExcelBox:{border:"2px dashed #99f6e4",background:"#f0fdfa",borderRadius:16,padding:24,textAlign:"center",display:"grid",gap:6,color:"#0f766e",cursor:"pointer"},importDicasGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"},previewImportacao:{display:"grid",gap:8,marginBottom:12},previewLinha:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:10,display:"grid",gap:4},alertaSucesso:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:10,fontWeight:"bold"},btnSair:{background:"#fee2e2",color:"#ef4444",border:"none",padding:"8px 12px",borderRadius:8,fontWeight:"bold"},overlayConfirmacao:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:3e3},modalConfirmacao:{background:"#fff",borderRadius:18,padding:18,width:"100%",maxWidth:360,boxShadow:"0 12px 30px rgba(0,0,0,0.25)",textAlign:"center"},confirmacaoIcone:{fontSize:38,marginBottom:8},confirmacaoTitulo:{margin:"4px 0 8px",fontSize:20},confirmacaoTexto:{margin:"0 0 16px",color:"#444",lineHeight:1.4},confirmacaoAcoes:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},btnConfirmarCancelar:{border:"none",borderRadius:10,padding:11,background:"#6c757d",color:"#fff",fontWeight:"bold"},btnConfirmarAcao:{border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:"bold"},headerExpansivel:{width:"100%",background:"#fff",border:"1px solid #e5e5e5",borderRadius:14,padding:"12px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:20,fontWeight:"bold",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},page:{padding:16,maxWidth:700,margin:"auto",fontFamily:"Arial",background:"#f8fafc",minHeight:"100vh",paddingBottom:100},titulo:{fontSize:28,marginBottom:12},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:24},resumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},boxTotal:{background:"#fff",padding:12,borderRadius:14,display:"flex",flexDirection:"column",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},boxPago:{background:"#d4edda",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxPendente:{background:"#fff3cd",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxVencido:{background:"#f8d7da",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},filtrosBox:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:8,boxSizing:"border-box"},datas:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},filtros:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},filtro:{border:"1px solid #ccc",background:"#fff",padding:"7px 11px",borderRadius:10,fontWeight:800,cursor:"pointer"},filtroAtivo:{border:"none",background:"#0d6efd",color:"#fff",padding:"7px 11px",borderRadius:8},resumoFiltro:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:4,fontSize:14},cardConta:{padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},cardTopo:{display:"flex",justifyContent:"space-between",fontSize:18,marginBottom:4},cardInfo:{fontSize:13,opacity:.75},cardDashboard:{background:"#fff",padding:12,borderRadius:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},dashboardGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6,fontSize:13},cardConfiguracao:{background:"#fff",padding:14,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},switchLinha:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #eee"},configResumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,background:"#f8fafc",padding:10,borderRadius:10},cardAgenda:{background:"#fff",padding:12,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},itemAgenda:{background:"#f8fafc",padding:10,borderRadius:10,marginTop:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"},agendaDireita:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},textoAgenda:{display:"block",marginTop:5,color:"#444",fontWeight:"bold"},textoVencidoAgenda:{display:"block",marginTop:5,color:"#dc3545",fontWeight:"bold"},cardLixeira:{background:"#fff",padding:12,borderRadius:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},textoQuarentena:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},textoLiberado:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},cardNota:{background:"#eef2ff",padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},textoNota:{fontSize:14,whiteSpace:"pre-wrap"},acoes:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8},mensagemVazia:{fontSize:13,opacity:.7},btnPago:{minHeight:38,minWidth:74,background:"#0f766e",color:"#fff",border:"1px solid #0f766e",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnVoltar:{minHeight:38,minWidth:74,background:"#f8fafc",color:"#475569",border:"1px solid #cbd5e1",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnEditar:{minHeight:38,minWidth:74,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnExcluir:{minHeight:38,minWidth:74,background:"#fff1f2",color:"#e11d48",border:"1px solid #fecdd3",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnSecundario:{background:"#f8fafc",color:"#0f766e",border:"1px solid #99f6e4",padding:"6px 10px",borderRadius:8,fontWeight:800,cursor:"pointer"},btnCinza:{background:"#64748b",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnRoxo:{background:"#6f42c1",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnVerde:{background:"#14b8a6",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},fab:{position:"fixed",right:22,bottom:22,width:54,height:54,borderRadius:18,background:"linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.22)",fontSize:28,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(15, 118, 110, 0.28)",zIndex:3e3,cursor:"pointer"},menuFab:{position:"fixed",right:20,bottom:86,display:"flex",flexDirection:"column",gap:8,zIndex:3001},menuItem:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"0 14px",minWidth:190,width:190,height:48,fontSize:14,fontWeight:800,boxShadow:"0 10px 24px rgba(15,23,42,0.14)",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,color:"#0f172a",whiteSpace:"nowrap",overflow:"visible",cursor:"pointer"},menuItemIcone:{display:"inline-flex",width:26,minWidth:26,justifyContent:"center",fontSize:18,lineHeight:1},menuItemTexto:{display:"inline-block",color:"#0f172a",fontSize:14,fontWeight:800,lineHeight:1},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",justifyContent:"center",alignItems:"center",padding:16,zIndex:999},blocoNotificacaoConta:{background:"#f8fafc",border:"1px solid #e5e5e5",borderRadius:12,padding:10,marginBottom:10},blocoRecorrenciaConta:{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:12,padding:10,marginBottom:10},switchLinhaCompacta:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #e5e5e5",fontSize:14},textoAjuda:{display:"block",color:"#666",fontSize:11,marginTop:4},notificacaoChips:{display:"flex",gap:6,flexWrap:"wrap",marginTop:6},chipNotif:{background:"#eef6ff",color:"#0d6efd",border:"1px solid #b6d4fe",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:"bold"},modal:{background:"#fff",padding:18,borderRadius:14,width:"100%",maxWidth:360},inputModal:{width:"100%",padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box"},textareaModal:{width:"100%",minHeight:110,padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box",fontFamily:"Arial"},btnGhostAction:{width:"auto",background:"#fff",color:"#374151",border:"1px solid #d1d5db",padding:"7px 12px",borderRadius:999,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:0},btnSalvar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#14b8a6",color:"#fff",marginBottom:8},btnCancelar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#6c757d",color:"#fff"},itemCentro:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f1f1f1",padding:8,borderRadius:8,marginBottom:6,fontSize:13},btnMiniExcluir:{background:"#fee2e2",color:"#ef4444",border:"1px solid #f87171",borderRadius:999,padding:"8px 10px",fontSize:11},notasHeaderNovo:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10},btnMiniVerde:{background:"#0f766e",color:"#fff",border:"none",borderRadius:12,padding:"6px 11px",fontWeight:"900",fontSize:18,lineHeight:1},notasListaNova:{display:"grid",gap:10},cardNotaAcao:{padding:12,borderRadius:16,marginBottom:10,border:"1px solid #e5e7eb",boxShadow:"0 8px 20px rgba(15,23,42,0.06)"},cardNotaNormal:{background:"#f8fafc",borderColor:"#e5e7eb"},cardNotaUrgente:{background:"#fffbeb",borderColor:"#fde68a"},cardNotaCritico:{background:"#fff7f7",borderColor:"#fecaca"},badgePrioridade:{borderRadius:999,padding:"4px 8px",fontSize:12,fontWeight:"900"},badgeNormal:{background:"#f1f5f9",color:"#475569"},badgeUrgente:{background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a"},badgeCritico:{background:"#fff7f7",color:"#991b1b",border:"1px solid #fecaca"}},fd=[{id:"principal",titulo:"Principal",items:[{tela:"dashboard",icon:"🏠",label:"Dashboard",desc:"Resumo financeiro"},{tela:"agenda",icon:"📅",label:"Agenda",desc:"Vencimentos e previsões"},{tela:"notas",icon:"📝",label:"Bloco de Notas",desc:"Pendências e histórico de notas"}]},{id:"financeiro",titulo:"Financeiro",items:[{tela:"contas",icon:"💳",label:"Contas",desc:"Contas a pagar e filtros"}]},{id:"analise",titulo:"Análise",items:[{tela:"relatorios",icon:"📊",label:"Relatórios",desc:"Análises e indicadores"}]},{id:"master",titulo:"Master",items:[{tela:"master-empresas",icon:"🏢",label:"Painel Master",desc:"Empresas e tenants SaaS",masterOnly:!0}]},{id:"sistema",titulo:"Sistema",items:[{tela:"usuarios",icon:"👥",label:"Usuários",desc:"Perfis, acessos e senhas"},{tela:"configuracoes",icon:"⚙️",label:"Configurações",desc:"Preferências da empresa"},{tela:"filiais",icon:"🏬",label:"Filiais",desc:"Unidades da empresa"},{tela:"billing",icon:"💼",label:"Billing",desc:"Planos, limites e assinatura"},{tela:"onboarding",icon:"🚀",label:"Onboarding",desc:"Implantação inicial SaaS"},{tela:"importar",icon:"📥",label:"Importar CSV",desc:"Trazer histórico do Excel"},{tela:"lixeira",icon:"🗑️",label:"Lixeira",desc:"Restaurar ou excluir definitivo"}]}],gd="modulepreload",xd=function(t){return"/"+t},Or={},Ot=function(a,r,i){let n=Promise.resolve();if(r&&r.length>0){document.getElementsByTagName("link");const p=document.querySelector("meta[property=csp-nonce]"),u=(p==null?void 0:p.nonce)||(p==null?void 0:p.getAttribute("nonce"));n=Promise.allSettled(r.map(v=>{if(v=xd(v),v in Or)return;Or[v]=!0;const k=v.endsWith(".css"),N=k?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${v}"]${N}`))return;const y=document.createElement("link");if(y.rel=k?"stylesheet":gd,k||(y.as="script"),y.crossOrigin="",y.href=v,u&&y.setAttribute("nonce",u),document.head.appendChild(y),k)return new Promise((E,h)=>{y.addEventListener("load",E),y.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${v}`)))})}))}function c(p){const u=new Event("vite:preloadError",{cancelable:!0});if(u.payload=p,window.dispatchEvent(u),!u.defaultPrevented)throw p}return n.then(p=>{for(const u of p||[])u.status==="rejected"&&c(u.reason);return a().catch(c)})},Bt={dashboard:()=>Ot(()=>import("./DashboardRouteComposition-wdbZyJ6x.js"),__vite__mapDeps([0,1,2,3,4])),contas:()=>Ot(()=>import("./ContasPage-Bd3UmwXK.js"),__vite__mapDeps([5,1,2])),relatorios:()=>Ot(()=>import("./Relatorios-0WJdnexj.js"),__vite__mapDeps([6,1,3,4])),notas:()=>Ot(()=>import("./NotasPage-D7HbC0m1.js"),__vite__mapDeps([7,1])),masterPanel:()=>Ot(()=>import("./MasterPanelPage-Cxf3Xx1o.js"),__vite__mapDeps([8,1,4])),onboarding:()=>Ot(()=>import("./OnboardingPage-C5SpOuKD.js"),__vite__mapDeps([9,1,4])),billing:()=>Ot(()=>import("./BillingPage-DWslAjTX.js"),__vite__mapDeps([10,1,4])),filiais:()=>Ot(()=>import("./FiliaisPage-KNn8MpaS.js"),__vite__mapDeps([11,1,4])),usuarios:()=>Ot(()=>import("./UsuariosPage-Bn1X-D3O.js"),__vite__mapDeps([12,1])),copilotDrawer:()=>Ot(()=>import("./CopilotDrawer-BJgQ9xZx.js"),__vite__mapDeps([13,1,4]))},bd=d.lazy(Bt.dashboard),hd=d.lazy(Bt.contas),wd=d.lazy(Bt.relatorios),vd=d.lazy(Bt.notas),yd=d.lazy(Bt.masterPanel),kd=d.lazy(Bt.onboarding),jd=d.lazy(Bt.billing),_d=d.lazy(Bt.filiais),Sd=d.lazy(Bt.usuarios),Cd=d.lazy(Bt.copilotDrawer);function Ur(){const{open:t}=Gr();return t?e.jsx(uo,{children:e.jsx(Cd,{})}):null}function Nd(){const t=d.useRef(null),{globalLoading:a,toast:r,showToast:i,hideToast:n,empresaAtiva:c,setEmpresaAtiva:p,limparEmpresaAtiva:u,empresasDisponiveis:v,setEmpresasDisponiveis:k}=Vr(),{contas:N,setContas:y,contasLixeira:E,setContasLixeira:h,busca:P,setBusca:j,filtroStatus:_,setFiltroStatus:I,filtroCentro:G,setFiltroCentro:B,filtroFilial:A,setFiltroFilial:L,filtroMes:F,setFiltroMes:lt,dataInicial:X,setDataInicial:$,dataFinal:O,setDataFinal:St,loading:ht,setLoading:wt,modalConta:Tt,setModalConta:V,editandoContaId:M,descricao:Q,setDescricao:pt,valor:et,setValor:st,dataVencimento:K,setDataVencimento:At,centroCustoId:ge,setCentroCustoId:Ze,filialId:xe,setFilialId:ta,observacaoConta:be,setObservacaoConta:Re,contaRecorrente:he,setContaRecorrente:Pe,tipoRecorrencia:we,setTipoRecorrencia:Me,diaVencimentoRecorrencia:ve,setDiaVencimentoRecorrencia:Yt,buscarContas:oe,abrirNovaConta:ea,abrirEdicaoConta:aa,fecharConta:oa,salvarConta:Aa,marcarComoPago:Ra,voltarParaPendente:Pa,excluirConta:De}=Os(),{notas:Ma,setNotas:Da,notasLixeira:ra,setNotasLixeira:Fa,buscaNota:ia,setBuscaNota:na,modalNota:W,setModalNota:z,editandoNotaId:D,tituloNota:q,setTituloNota:mt,conteudoNota:Z,setConteudoNota:xt,prioridadeNota:vt,setPrioridadeNota:at,dataEventoNota:ut,setDataEventoNota:ot,filialNotaId:Ct,setFilialNotaId:$t,buscarNotas:Fe,buscarNotasLixeira:Ie,abrirNovaNota:ye,abrirEdicaoNota:ke,fecharNota:re,salvarNota:Vt,excluirNota:je,alternarNotaConcluida:Rt,restaurarNota:rt,excluirNotaDefinitivo:yt}=Qs(),[dt,Pt]=d.useState([]),[it,ft]=d.useState([]),[gt,nt]=d.useState(!1),[Mt,Jt]=d.useState(""),{menuAberto:Kt,setMenuAberto:Wt,menuNavegacaoAberto:_e,setMenuNavegacaoAberto:Ht,sidebarCompacta:oi,setSidebarCompacta:ri,gruposMenu:ii,setGruposMenu:ni,telaAtual:_t,setTelaAtualState:Ia,navegarPara:J}=nd(),{empresaId:C,setEmpresaId:Te,trocandoEmpresa:$e,setTrocandoEmpresa:bo,perfilUsuario:sa,setPerfilUsuario:Le,permissoesUsuario:U,setPermissoesUsuario:da,erroEmpresa:ho,setErroEmpresa:ca}=pd(),[Ta,Se]=d.useState(""),{modalPerfilUsuario:si,setModalPerfilUsuario:$a,nomePerfilEditando:wo,setNomePerfilEditando:vo,salvandoPerfilUsuario:di,setSalvandoPerfilUsuario:yo,mostrarFiltros:ci,setMostrarFiltros:li,mostrarContas:pi,setMostrarContas:mi,mostrarContasDashboard:ui,setMostrarContasDashboard:fi,mostrarNotas:gi,setMostrarNotas:xi,mostrarConfigNegocio:La,setMostrarConfigNegocio:bi,mostrarConfigNotificacoes:qa,setMostrarConfigNotificacoes:hi,mostrarConfigCentros:la,setMostrarConfigCentros:wi,mostrarConfigRecorrencias:Oa,setMostrarConfigRecorrencias:vi,confirmacao:qe,setConfirmacao:ko,arquivoImportacao:jo,setArquivoImportacao:Ua,linhasImportacao:Qt,setLinhasImportacao:pa,statusImportacao:_o,setStatusImportacao:Oe}=rd(),[ma,Ba]=d.useState([]),[yi,So]=d.useState(!1),[ki,Va]=d.useState(!1),[ji,Wa]=d.useState(""),[Co,No]=d.useState(!1),[Eo,ua]=d.useState({}),[_i,zo]=d.useState(""),[Ao,Ro]=d.useState(""),[Po,Mo]=d.useState(""),[Do,Fo]=d.useState("operador"),[Io,To]=d.useState(""),[$o,Lo]=d.useState(""),[Ue,qo]=d.useState(""),[Oo,Uo]=d.useState(""),[fa,ga]=d.useState(null),[Ha,Ga]=d.useState(!0),[ie,Bo]=d.useState(!0),[ne,Vo]=d.useState(!0),[se,Wo]=d.useState(!1),[Ce,Ya]=d.useState("1"),[xa,Ja]=d.useState("1"),[Ho,Ka]=d.useState(!0),[Go,Qa]=d.useState(!0),[Yo,Xa]=d.useState("3"),[Jo,Za]=d.useState(!0),[de,to]=d.useState(""),[Ko,eo]=d.useState(""),[Qo,ao]=d.useState("");function R(o,s="info"){i(o,s)}function Y(o,s="Não foi possível concluir a operação."){const m=(o==null?void 0:o.message)||o||s;if(po(o)){Ai("Sua sessão expirou. Faça login novamente.");return}R(String(m),"erro")}function Xo(){y([]),Da([]),Pt([]),ft([]),h([]),Fa([]),Ba([]),Wa(""),Va(!1),ga(null),V(!1),z(!1),nt(!1),Wt(!1),Ht(!1),j(""),na(""),I("todas"),B(""),L(""),lt(""),$(""),St(""),Ua(null),pa([]),Oe("")}function ba(){Xo(),k([]),Te(null),u(),Le(""),ua({}),Se(""),ca(""),wt(!1),ed()}const Si=d.useCallback(()=>{ba()},[]),Ci=d.useCallback(()=>{Ia("dashboard")},[]),Ni=d.useCallback((o,s="info")=>{R(o,s)},[i]),Ei=d.useCallback(o=>{Nt({titulo:"Sessão quase expirada",mensagem:"Sua sessão vai expirar por segurança. Deseja continuar conectado?",textoConfirmar:"Continuar conectado",tipo:"padrao",acao:async()=>o()})},[]),{usuarioLogado:x,setUsuarioLogado:Be,carregandoAuth:Zo,setCarregandoAuth:zi,encerrarSessao:Ai}=ad({onClearAuthData:Si,onNavigateHome:Ci,onShowMessage:Ni,onSessionWarning:Ei});async function Ri(){var o,s;if(x!=null&&x.id)try{const b=await Rr(x.id)||((o=x==null?void 0:x.user_metadata)==null?void 0:o.name)||((s=x==null?void 0:x.user_metadata)==null?void 0:s.full_name)||"";b&&b!==Ta&&Se(b)}catch(m){console.warn("Falha ao sincronizar nome do perfil:",(m==null?void 0:m.message)||m)}}d.useEffect(()=>{if(!x){wt(!1);return}Pi(x.id)},[x]),d.useEffect(()=>{if(!(x!=null&&x.id)||!C)return;let o=!1;async function s(){if(!o)try{await Promise.allSettled([Xt(C),va(C),rr(C),Zt(C)])}catch(g){console.warn("Falha ao sincronizar dados do tenant:",(g==null?void 0:g.message)||g)}}function m(){window.clearTimeout(t.current),t.current=window.setTimeout(s,350)}function b(){document.visibilityState==="visible"&&m()}window.addEventListener("focus",m),document.addEventListener("visibilitychange",b);const f=S.channel(`tenant-sync-${C}`).on("postgres_changes",{event:"*",schema:"public",table:"df_centros_custo",filter:`empresa_id=eq.${C}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_filiais",filter:`empresa_id=eq.${C}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_contas",filter:`empresa_id=eq.${C}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_contas_recorrentes",filter:`empresa_id=eq.${C}`},m).subscribe();return()=>{o=!0,window.clearTimeout(t.current),window.removeEventListener("focus",m),document.removeEventListener("visibilitychange",b),S.removeChannel(f)}},[x==null?void 0:x.id,C]),d.useEffect(()=>{!_e||!(x!=null&&x.id)||Ri()},[_e,x==null?void 0:x.id]),d.useEffect(()=>{_t==="usuarios"&&C&&Ne(C)},[_t,C]),d.useEffect(()=>{function o(s){if(s.key==="Escape"){if(qe.aberto){io();return}Tt&&He(),W&&ja(),gt&&nt(!1),Kt&&Wt(!1),_e&&Ht(!1)}}return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[qe.aberto,Tt,W,gt,Kt,_e]);async function Pi(o){var s,m,b,f;wt(!0),ca("");try{await hs();const g=await ws(o),w=await Rr(o),T=await lo({userId:o,email:x==null?void 0:x.email,perfilEmpresa:(g==null?void 0:g.perfil)||"operador"}),ct=await Ir({userId:o,email:x==null?void 0:x.email,isMaster:T.isMaster});if(!(g!=null&&g.empresaId)&&!T.isMaster){Te(null),u(),Le(""),da(Je()),Se(""),ca(xs.semEmpresa);return}if(T.isMaster&&ct.length===0){Te(null),u(),Le("master"),da({...T,canSwitchCompany:!0,canManageCompanies:!0}),Se(w||((s=x==null?void 0:x.user_metadata)==null?void 0:s.name)||((m=x==null?void 0:x.user_metadata)==null?void 0:m.full_name)||""),ca("Nenhuma empresa cadastrada em df_empresas para o usuário master.");return}const H=ct.find(pe=>pe.id===(c==null?void 0:c.id))||ct.find(pe=>pe.id===(g==null?void 0:g.empresaId))||ct[0]||{id:g==null?void 0:g.empresaId,nome:(g==null?void 0:g.nomeEmpresa)||"Dona Flor",perfil:(g==null?void 0:g.perfil)||"operador"},tt=H.perfil||(g==null?void 0:g.perfil)||(T.isMaster?"master":"operador"),Ee=T.isMaster?{...T,perfilEmpresa:Dt(tt),canSwitchCompany:!0,canManageCompanies:!0}:await lo({userId:o,email:x==null?void 0:x.email,perfilEmpresa:tt});k(ct.length>0?ct:[H]),Te(H.id),p({id:H.id,nome:H.nome||(g==null?void 0:g.nomeEmpresa)||"Dona Flor",perfil:tt}),Le(tt),da(Ee),Se(w||((b=x==null?void 0:x.user_metadata)==null?void 0:b.name)||((f=x==null?void 0:x.user_metadata)==null?void 0:f.full_name)||""),await ha(H.id)}catch(g){po(g)?(await S.auth.signOut(),ba(),Be(null),R("Sua sessão expirou. Faça login novamente.","erro")):R(g.message,"erro")}finally{wt(!1)}}async function ha(o=C){o&&await Promise.all([Xt(o),We(o),va(o),rr(o),Zt(o),Ui(o)])}function Dt(o){return ae(o)}function tr(o=[]){if(U!=null&&U.isMaster)return!0;const s=Dt(sa);return o.includes(s)}function ce(){return!!(U!=null&&U.canManageUsers||tr(["admin"]))}function Ve(){return!!(U!=null&&U.canAccessSettings||tr(["admin","gerente"]))}function er(){return fd.map(o=>({...o,items:o.items.filter(s=>!s.masterOnly||(U==null?void 0:U.canManageCompanies))})).filter(o=>o.items.length>0)}async function Mi(){if(x)try{const o=await Ir({userId:x.id,email:x.email,isMaster:U==null?void 0:U.isMaster});k(o)}catch(o){console.warn("Não foi possível atualizar a lista de empresas:",o.message)}}async function wa(o){if(!o||$e)return;const s=v.find(m=>m.id===o);if(!s){R("Empresa selecionada não encontrada para este usuário.","erro");return}if(s.id!==C){bo(!0),wt(!0);try{const m=s.perfil||(U!=null&&U.isMaster?"master":"operador"),b=U!=null&&U.isMaster?{...U,perfilEmpresa:Dt(m),canSwitchCompany:!0,canManageCompanies:!0,canManageUsers:!0,canAccessSettings:!0}:await lo({userId:x==null?void 0:x.id,email:x==null?void 0:x.email,perfilEmpresa:m});Xo(),Te(s.id),p({id:s.id,nome:s.nome||"Empresa",perfil:m}),Le(m),da(b),Ia("dashboard"),await ha(s.id),R(`Empresa ativa: ${s.nome||"Empresa"}`,"sucesso")}catch(m){Y(m,"Não foi possível trocar a empresa ativa.")}finally{bo(!1),wt(!1)}}}async function Ne(o=C,s={}){if(!o)return;const m=!!(s!=null&&s.silencioso);m||So(!0),Wa("");try{const[b,f]=await Promise.all([En(o),Dn(o)]),g={};(f||[]).forEach(w=>{!(w!=null&&w.usuario_id)||!(w!=null&&w.filial_id)||(g[w.usuario_id]||(g[w.usuario_id]=[]),g[w.usuario_id].push(w.filial_id))}),Ba(b),ua(g),Va(!0)}catch(b){console.warn("Não foi possível carregar usuários:",b.message),Ba([]),ua({}),Va(!0),Wa((b==null?void 0:b.message)||"Não foi possível carregar os usuários da empresa.")}finally{m||So(!1)}}async function Di(){if(Co)return;if(!C){R("Empresa não identificada.","erro");return}if(!ce()){R("Apenas administradores podem adicionar usuários.","erro");return}const o=Ao.trim().toLowerCase();if(!o||!o.includes("@")){R("Informe um e-mail válido.","erro");return}const s=Io.trim();if(s.length<6){R("Informe uma senha provisória com pelo menos 6 caracteres.","erro");return}const m=Dt(Do);try{No(!0),await zn({empresaId:C,email:o,nome:Po,perfil:m,senhaProvisoria:s,criarAuthManual:!0}),await Ne(C,{silencioso:!0})}catch(b){Y(b);return}finally{No(!1)}Ro(""),Mo(""),To(""),Fo("operador"),R("Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.","sucesso")}async function Fi(o){if(!ce()){R("Apenas administradores podem enviar acesso ou reset de senha.","erro");return}const s=o.nome||o.email||"este usuário";Nt({titulo:"Enviar acesso",mensagem:`Deseja enviar um link de acesso/redefinição de senha para ${s}?`,textoConfirmar:"Enviar link",tipo:"padrao",acao:async()=>{try{const m=await Pn({usuario:o});R(m.mensagem,"info")}catch(m){Y(m)}}})}async function Ii(o,s){if(!ce()){R("Apenas administradores podem alterar perfis.","erro");return}const m=Dt(s);if(o.user_id&&(x==null?void 0:x.id)&&o.user_id===x.id&&m!=="admin"&&ma.filter(T=>Dt(T.perfil)==="admin").length<=1){R("Você não pode remover o último administrador da empresa.","erro");return}if(m===Dt(o.perfil))return;const f=o.nome||o.email||"este usuário",g=zt(m);Nt({titulo:"Alterar perfil",mensagem:`Deseja alterar o perfil de ${f} para ${g}?`,textoConfirmar:"Confirmar alteração",tipo:m==="admin"?"perigo":"padrao",acao:async()=>{try{await An({empresaId:C,usuario:o,perfil:m})}catch(w){Y(w);return}await Ne(),R("Perfil do usuário atualizado.","sucesso")}})}async function ar(o,s){if(!ce()){R("Apenas administradores podem alterar filiais dos usuários.","erro");return}if(!(o!=null&&o.id)){R("Este usuário precisa estar cadastrado na empresa para receber filiais.","erro");return}const m=o.id;zo(m);try{await Fn({empresaId:C,usuario:o,filialIds:s}),ua(b=>({...b,[o.id]:s})),R("Filiais do usuário atualizadas.","sucesso")}catch(b){Y(b,"Não foi possível atualizar as filiais do usuário.")}finally{zo("")}}function Ti(o,s){const m=Eo[o.id]||[],f=m.includes(s)?m.filter(g=>g!==s):[...m,s];ar(o,f)}function $i(o){ar(o,[])}async function Li(o){if(!ce()){R("Apenas administradores podem remover usuários.","erro");return}if(o.user_id&&(x==null?void 0:x.id)&&o.user_id===x.id){R("Você não pode remover o próprio acesso por aqui.","erro");return}if(Dt(o.perfil)==="admin"&&ma.filter(b=>Dt(b.perfil)==="admin").length<=1){R("Você não pode remover o último administrador da empresa.","erro");return}Nt({titulo:"Remover usuário",mensagem:`Deseja remover ${o.nome||o.email||"este usuário"} desta empresa?`,textoConfirmar:"Remover",tipo:"perigo",acao:async()=>{try{await Rn({empresaId:C,usuario:o})}catch(m){Y(m);return}await Ne()}})}async function qi(){const o=$o.trim().toLowerCase();if(!o||!o.includes("@")){R("Informe um e-mail válido.","erro");return}const{error:s}=await S.auth.updateUser({email:o},{emailRedirectTo:window.location.origin});if(s){Y(s);return}Lo(""),R("Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.","sucesso")}async function Oi(){if(!Ue||Ue.length<6){R("A senha precisa ter pelo menos 6 caracteres.","erro");return}if(Ue!==Oo){R("As senhas não conferem.","erro");return}const{error:o}=await S.auth.updateUser({password:Ue});if(o){Y(o);return}qo(""),Uo(""),R("Senha atualizada com sucesso.","sucesso")}async function Xt(o=C){return oe({supabase:S,empresaAtual:o,avisarErro:Y,configWhatsapp:ie,configEmail:ne,configPush:se,diasAlertaContas:xa,diasAvisoPadrao:Ce})}async function We(o=C){return Fe({supabase:S,empresaAtual:o,avisarErro:Y})}async function or(o=C){if(!o)return;const{data:s,error:m}=await S.from("df_configuracoes_alertas").select("*").eq("empresa_id",o).maybeSingle();if(m){console.warn("Não foi possível carregar alertas globais:",m.message);return}if(s){Ja(String(s.dias_alerta_contas??1)),Ka(s.alertar_contas_vencidas??!0),Qa(s.destacar_contas_criticas??!0),Xa(String(s.dias_alerta_notas??3)),Za(s.destacar_notas_urgentes??!0);return}const b={empresa_id:o,dias_alerta_contas:1,alertar_contas_vencidas:!0,destacar_contas_criticas:!0,dias_alerta_notas:3,destacar_notas_urgentes:!0},{data:f,error:g}=await S.from("df_configuracoes_alertas").insert([b]).select().maybeSingle();if(g){console.warn("Não foi possível criar alertas globais:",g.message);return}f&&(Ja(String(f.dias_alerta_contas??1)),Ka(f.alertar_contas_vencidas??!0),Qa(f.destacar_contas_criticas??!0),Xa(String(f.dias_alerta_notas??3)),Za(f.destacar_notas_urgentes??!0))}async function Ui(o=C){if(!o)return;const{data:s,error:m}=await S.from("df_configuracoes").select("*").eq("empresa_id",o).limit(1);if(m){Y(m);return}const b=Array.isArray(s)?s[0]:s;if(b){ga(b),Ga(b.notificacoes_ativas??!0),Bo(b.enviar_whatsapp??!0),Vo(b.enviar_email??!0),Wo(b.enviar_push??!1),Ya(String(b.dias_aviso_padrao??1)),to(b.nome_empresa||""),eo(b.whatsapp_padrao||""),ao(b.email_padrao||""),await or(o);return}const{data:f,error:g}=await S.from("df_configuracoes").insert([{notificacoes_ativas:!0,enviar_whatsapp:!0,enviar_email:!0,enviar_push:!1,dias_aviso_padrao:1,nome_empresa:"DF Gestão Financeira",empresa_id:o}]).select();if(g){Y(g);return}const w=Array.isArray(f)?f[0]:f;ga(w),Ga((w==null?void 0:w.notificacoes_ativas)??!0),Bo((w==null?void 0:w.enviar_whatsapp)??!0),Vo((w==null?void 0:w.enviar_email)??!0),Wo((w==null?void 0:w.enviar_push)??!1),Ya(String((w==null?void 0:w.dias_aviso_padrao)??1)),to((w==null?void 0:w.nome_empresa)||""),eo((w==null?void 0:w.whatsapp_padrao)||""),ao((w==null?void 0:w.email_padrao)||""),await or(o)}async function Zt(o=C){if(!o)return;const{data:s,error:m}=await S.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",o).eq("excluido",!0).order("excluido_em",{ascending:!1});m&&Y(m),md(h,s||[]),await Ie({supabase:S,empresaAtual:o,avisarErro:Y})}async function va(o=C){if(!o)return;const{data:s,error:m}=await S.from("df_centros_custo").select("*").eq("empresa_id",o).order("nome");if(m){Y(m);return}Pt(s||[])}async function rr(o=C){if(!o){ft([]);return}try{const s=await ud(o);ft((s||[]).filter(m=>m.ativo!==!1))}catch(s){Y(s),ft([])}}const Ft=N.filter(o=>_==="pendentes"?o.status!=="pago":_==="pagas"?o.status==="pago":_==="vencidas"?qt(o.data_vencimento,o.status):!0).filter(o=>!G||o.centro_custo_id===G).filter(o=>!A||o.filial_id===A).filter(o=>!F||Tr(o.data_vencimento)===F).filter(o=>!(X&&o.data_vencimento<X||O&&o.data_vencimento>O)).filter(o=>{var w,T;const s=P.trim().toLowerCase();if(!s)return!0;const m=((w=o.df_centros_custo)==null?void 0:w.nome)||"",b=((T=o.df_filiais)==null?void 0:T.nome)||"",f=o.status==="pago"?"pago":qt(o.data_vencimento,o.status)?"vencido":"pendente";return[o.descricao,o.observacao,o.categoria,o.forma_pagamento,m,b,f,It(o.data_vencimento),o.data_vencimento].filter(Boolean).some(ct=>String(ct).toLowerCase().includes(s))}),ir=N.filter(o=>_==="pendentes"?o.status!=="pago":_==="pagas"?o.status==="pago":_==="vencidas"?qt(o.data_vencimento,o.status):!0).filter(o=>!G||o.centro_custo_id===G).filter(o=>!F||Tr(o.data_vencimento)===F).filter(o=>!(X&&o.data_vencimento<X||O&&o.data_vencimento>O)).filter(o=>{var w,T;const s=P.trim().toLowerCase();if(!s)return!0;const m=((w=o.df_centros_custo)==null?void 0:w.nome)||"",b=((T=o.df_filiais)==null?void 0:T.nome)||"",f=o.status==="pago"?"pago":qt(o.data_vencimento,o.status)?"vencido":"pendente";return[o.descricao,o.observacao,o.categoria,o.forma_pagamento,m,b,f,It(o.data_vencimento),o.data_vencimento].filter(Boolean).some(ct=>String(ct).toLowerCase().includes(s))}),ya=Ft.reduce((o,s)=>o+Number(s.valor||0),0),oo=Ft.filter(o=>o.status==="pago").reduce((o,s)=>o+Number(s.valor||0),0),nr=Ft.filter(o=>qt(o.data_vencimento,o.status)).reduce((o,s)=>o+Number(s.valor||0),0),sr=ya-oo,Bi=Ft.filter(o=>o.status!=="pago").sort((o,s)=>String(s.created_at||s.data_vencimento||"").localeCompare(String(o.created_at||o.data_vencimento||"")));dt.map(o=>{const s=Ft.filter(g=>g.centro_custo_id===o.id),m=s.reduce((g,w)=>g+Number(w.valor||0),0),b=s.filter(g=>g.status==="pago").reduce((g,w)=>g+Number(w.valor||0),0),f=s.filter(g=>qt(g.data_vencimento,g.status)).reduce((g,w)=>g+Number(w.valor||0),0);return{id:o.id,nome:o.nome,total:m,pago:b,pendente:m-b,vencido:f}}).filter(o=>o.total>0||o.pago>0||o.pendente>0||o.vencido>0);const dr={critico:0,urgente:1,normal:2},cr=Ma.filter(o=>(!A||o.filial_id===A)&&`${o.titulo||""} ${o.conteudo||""}`.toLowerCase().includes(ia.toLowerCase())).sort((o,s)=>{const m=o.concluida?1:0,b=s.concluida?1:0;if(m!==b)return m-b;const f=dr[o.prioridade||"normal"]??2,g=dr[s.prioridade||"normal"]??2;if(f!==g)return f-g;const w=o.data_evento||"9999-12-31",T=s.data_evento||"9999-12-31";return String(w).localeCompare(String(T))}),ka=cr.filter(o=>!o.concluida),lr=ka.filter(o=>o.prioridade==="critico").length,pr=ka.filter(o=>o.prioridade==="urgente").length;function Vi(){return ea({setMenuAberto:Wt,setMenuNavegacaoAberto:Ht,configWhatsapp:ie,configEmail:ne,configPush:se,diasAvisoPadrao:Ce})}async function Wi(o){return aa({conta:o,supabase:S,empresaId:C,diasAvisoPadrao:Ce,formatarDataParaBanco:Ca})}function He(){return oa()}async function Hi(){return Aa({supabase:S,empresaId:C,mostrarAviso:R,configWhatsapp:ie,configEmail:ne,configPush:se,diasAlertaContas:xa,diasAvisoPadrao:Ce,primeiraLetraMaiuscula:zt,converterValor:Is,formatarDataParaBanco:Ca,erroEhSessaoExpirada:po,limparEstadoAutenticacao:ba,setUsuarioLogado:Be,buscarContas:Xt,fecharConta:He})}async function ro(o){return Ra({supabase:S,id:o,empresaId:C,buscarContas:Xt,mostrarAviso:R})}async function Gi(o){return Pa({supabase:S,id:o,empresaId:C,buscarContas:Xt,mostrarAviso:R})}async function Yi(o){return De({supabase:S,id:o,empresaId:C,avisarErro:Y,buscarContas:Xt,buscarLixeira:Zt,mostrarAviso:R})}function Ji(){return ye({setMenuAberto:Wt,setMenuNavegacaoAberto:Ht})}function mr(o){return ke(o)}function ja(){return re()}async function Ki(){return Vt({supabase:S,empresaId:C,mostrarAviso:R,avisarErro:Y,buscarNotas:We})}async function ur(o){return je({supabase:S,id:o,empresaId:C,avisarErro:Y,buscarNotas:We,buscarLixeira:Zt,mostrarAviso:R})}async function fr(o){return Rt({supabase:S,nota:o,empresaId:C,avisarErro:Y,buscarNotas:We,mostrarAviso:R})}async function Qi(){if(!C){R("Usuário sem empresa vinculada.","erro");return}const o=Number(Ce),s=Number(xa),m=Number(Yo);if(isNaN(o)||o<0||isNaN(s)||s<0||isNaN(m)||m<0){R("Informe uma quantidade válida para os dias de alerta.","erro");return}const b={notificacoes_ativas:Ha,enviar_whatsapp:ie,enviar_email:ne,enviar_push:se,dias_aviso_padrao:o,nome_empresa:de.trim()||null,whatsapp_padrao:Ko.trim()||null,email_padrao:Qo.trim()||null,empresa_id:C};let f;if(fa!=null&&fa.id?f=await S.from("df_configuracoes").update(b).eq("id",fa.id).eq("empresa_id",C).select():f=await S.from("df_configuracoes").insert([b]).select(),f.error){Y(f.error);return}const g=Array.isArray(f.data)?f.data[0]:f.data;ga(g);const{error:w}=await S.from("df_configuracoes_alertas").upsert([{empresa_id:C,dias_alerta_contas:s,alertar_contas_vencidas:Ho,destacar_contas_criticas:Go,dias_alerta_notas:m,destacar_notas_urgentes:Jo}],{onConflict:"empresa_id"});if(w){R("Configurações principais salvas, mas os alertas globais não foram atualizados: "+w.message,"erro");return}R("Configurações salvas com sucesso.","info")}async function Xi(o){const{error:s}=await S.from("df_contas").update({excluido:!1,excluido_em:null}).eq("id",o).eq("empresa_id",C);if(s){Y(s);return}Xt(),Zt(),R("Conta restaurada com sucesso.","sucesso")}async function Zi(o){return rt({supabase:S,id:o,empresaId:C,avisarErro:Y,buscarNotas:We,buscarLixeira:Zt,mostrarAviso:R})}async function tn(o){const{error:s}=await S.from("df_contas").delete().eq("id",o.id).eq("empresa_id",C);if(s){Y(s);return}Zt(),R("Conta excluída definitivamente.","sucesso")}async function en(o){return yt({supabase:S,nota:o,empresaId:C,avisarErro:Y,buscarLixeira:Zt,mostrarAviso:R})}async function an(){if(!C){R("Usuário sem empresa vinculada.","erro");return}const o=zt(Mt.trim());if(!o){R("Digite o centro de custo.","erro");return}if(dt.some(f=>String(f.nome||"").trim().toLowerCase()===o.toLowerCase())){R("Este centro de custo já existe nesta empresa.","erro");return}const{data:m,error:b}=await S.from("df_centros_custo").insert([{nome:o,empresa_id:C}]).select("*").single();if(b){Y(b);return}Jt(""),Pt(f=>[...f.filter(w=>w.id!==m.id),m].sort((w,T)=>String(w.nome||"").localeCompare(String(T.nome||"")))),await va(C),R("Centro de custo criado com sucesso.","sucesso")}async function on(o){const{error:s}=await S.from("df_centros_custo").delete().eq("id",o).eq("empresa_id",C);if(s){R("Não foi possível excluir. Verifique se existem contas usando este centro.","erro");return}va(),Xt()}function rn(){const o=["Descricao","Valor","Vencimento","Status","Filial","Centro"],s=Ft.map(w=>{var T,ct;return[w.descricao||"",Number(w.valor||0).toFixed(2).replace(".",","),It(w.data_vencimento),qt(w.data_vencimento,w.status)?"vencido":w.status,((T=w.df_filiais)==null?void 0:T.nome)||"",((ct=w.df_centros_custo)==null?void 0:ct.nome)||""]}),m=[o,...s].map(w=>w.map(T=>`"${String(T).replaceAll('"','""')}"`).join(";")).join(`
`),b=new Blob([m],{type:"text/csv;charset=utf-8;"}),f=URL.createObjectURL(b),g=document.createElement("a");g.href=f,g.download="relatorio-contas.csv",g.click(),URL.revokeObjectURL(f)}function nn(){const o=f=>String(f??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),s=Ft.map(f=>{var w,T;const g=qt(f.data_vencimento,f.status)?"Vencido":f.status==="pago"?"Pago":"Pendente";return`
        <tr>
          <td>
            <strong>${o(f.descricao||"-")}</strong>
            ${f.observacao?`<small>Obs: ${o(f.observacao)}</small>`:""}
          </td>
          <td>${o(((w=f.df_filiais)==null?void 0:w.nome)||"-")}</td>
          <td>${o(((T=f.df_centros_custo)==null?void 0:T.nome)||"-")}</td>
          <td>${o(It(f.data_vencimento))}</td>
          <td><span class="status ${g.toLowerCase()}">${g}</span></td>
          <td class="valor">${o(kt(f.valor))}</td>
        </tr>
      `}).join(""),m=`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Relatório de contas</title>
          <style>
            * { box-sizing: border-box; }
            html, body { width: 100%; min-height: 100%; }
            body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; -webkit-text-size-adjust: 100%; }
            .page { width: min(100%, 920px); margin: 0 auto; padding: 18px; background: #fff; min-height: 100vh; }
            header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; border-bottom: 2px solid #ccfbf1; padding-bottom: 18px; margin-bottom: 18px; }
            h1 { margin: 0; font-size: 24px; color: #0f766e; }
            .empresa { margin-top: 6px; color: #475569; font-size: 14px; }
            .data { text-align: right; color: #64748b; font-size: 13px; }
            .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #f8fafc; }
            .box span { display: block; font-size: 12px; color: #64748b; font-weight: 700; }
            .box strong { display: block; margin-top: 4px; font-size: 17px; }
            .table-wrap { width: 100%; overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 16px; }
            footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 12px; display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
            table { width: 100%; border-collapse: collapse; min-width: 620px; }
            th { background: #f0fdfa; color: #0f766e; text-align: left; padding: 11px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
            td { border-bottom: 1px solid #e5e7eb; padding: 11px; vertical-align: top; font-size: 13px; }
            td small { display: block; color: #64748b; margin-top: 4px; line-height: 1.35; }
            .valor { text-align: right; font-weight: 700; white-space: nowrap; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
            .status.pago { background: #dcfce7; color: #166534; }
            .status.pendente { background: #fef3c7; color: #92400e; }
            .status.vencido { background: #fee2e2; color: #991b1b; }
            .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 10px; margin: -18px -18px 14px; padding: 12px 18px; background: rgba(255,255,255,.96); border-bottom: 1px solid #e5e7eb; z-index: 5; }
            button { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 999px; padding: 10px 14px; font-weight: 800; cursor: pointer; font-size: 13px; }
            button.primary { background: #0f766e; border-color: #0f766e; color: white; }
            @media print {
              body { background: #fff; }
              .page { margin: 0; border: 0; border-radius: 0; max-width: none; }
              .toolbar { display: none; }
            }
            @media (max-width: 760px) {
              .page { width: 100%; margin: 0; border-radius: 0; padding: 16px; }
              .toolbar { margin: -16px -16px 14px; padding: 12px 16px; justify-content: space-between; }
              header { display: block; }
              h1 { font-size: 22px; }
              .data { text-align: left; margin-top: 8px; }
              .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .box strong { font-size: 15px; }
              th:nth-child(2), td:nth-child(2) { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="toolbar">
              <button onclick="window.close()">Fechar</button>
              <button class="primary" onclick="window.print()">Imprimir / salvar PDF</button>
            </div>
            <header>
              <div>
                <h1>Relatório de Contas</h1>
                <div class="empresa">${o(de||"DF Gestão Financeira")}</div>
              </div>
              <div class="data">Gerado em ${new Date().toLocaleDateString("pt-BR")}<br/>${Ft.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${o(kt(ya))}</strong></div>
              <div class="box"><span>Pago</span><strong>${o(kt(oo))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${o(kt(sr))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${o(kt(nr))}</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Conta</th><th>Filial</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  ${s||'<tr><td colspan="6">Nenhuma conta encontrada.</td></tr>'}
                </tbody>
              </table>
            </div>
            <footer>
              <span>Gerado pelo DF Gestão Financeira</span>
              <span>${new Date().toLocaleString("pt-BR")}</span>
            </footer>
          </div>
        </body>
      </html>
    `,b=window.open("","_blank");if(!b){R("O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.","erro");return}b.document.open(),b.document.write(m),b.document.close()}function sn(){j(""),I("todas"),B(""),L(""),lt(""),$(""),St("")}function Nt({titulo:o,mensagem:s,textoConfirmar:m="Confirmar",tipo:b="padrao",acao:f}){ko({aberto:!0,titulo:o,mensagem:s,textoConfirmar:m,tipo:b,acao:f})}function io(){ko({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null})}async function dn(){typeof qe.acao=="function"&&await qe.acao(),io()}function gr(o){return String(o||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Ge(o,s){const m=Object.entries(o||{});for(const b of s){const f=gr(b),g=m.find(([w])=>gr(w)===f);if(g)return g[1]}return""}function cn(o){if(!o)return null;if(typeof o=="number"){const m=new Date(Date.UTC(1899,11,30));return m.setUTCDate(m.getUTCDate()+o),m.toISOString().slice(0,10)}const s=String(o).trim();if(!s)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const[m,b,f]=s.split("/");return`${f}-${b}-${m}`}return Ca(s)}function ln(o){if(typeof o=="number")return o;const s=String(o||"").replace(/R\$/gi,"").replace(/\./g,"").replace(",",".").trim();return Number(s||0)}function xr(o){const s=[];let m="",b=!1;for(let f=0;f<o.length;f+=1){const g=o[f],w=o[f+1];if(g==='"'&&w==='"'){m+='"',f+=1;continue}if(g==='"'){b=!b;continue}if((g===";"||g===",")&&!b){s.push(m.trim()),m="";continue}m+=g}return s.push(m.trim()),s}function pn(o){const s=String(o||"").replace(/^﻿/,"").split(/\r?\n/).filter(b=>b.trim());if(s.length<2)return[];const m=xr(s[0]);return s.slice(1).map(b=>{const f=xr(b);return m.reduce((g,w,T)=>(g[w]=f[T]||"",g),{})})}async function mn(o){var f,g;const s=(f=o.target.files)==null?void 0:f[0];if(Ua(s||null),pa([]),Oe(""),!s)return;if(((g=s.name.split(".").pop())==null?void 0:g.toLowerCase())!=="csv"){Oe("Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.");return}const b=new FileReader;b.onload=w=>{const ct=pn(w.target.result).map((Et,H)=>{const tt=Ge(Et,["descricao","descrição","conta","nome","fornecedor"]),Ee=Ge(Et,["valor","valor pago","total"]),pe=Ge(Et,["vencimento","data vencimento","data_vencimento","data"]),Lt=String(Ge(Et,["status","situacao","situação"])||"pendente").toLowerCase(),me=Ge(Et,["centro","centro de custo","categoria","setor"]);return{linha:H+2,descricao:zt(String(tt||"").trim()),valor:ln(Ee),data_vencimento:cn(pe),status:Lt.includes("pag")?"pago":"pendente",centro:String(me||"").trim()}}).filter(Et=>Et.descricao||Et.valor||Et.data_vencimento);pa(ct),Oe(`${ct.length} linha(s) preparada(s) para revisão.`)},b.readAsText(s,"UTF-8")}async function un(){if(!C){R("Usuário sem empresa vinculada.","erro");return}const o=Qt.filter(f=>!f.descricao||!f.valor||!f.data_vencimento);if(o.length>0){R(`Existem ${o.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`,"erro");return}const s={...Object.fromEntries(dt.map(f=>[f.nome.toLowerCase(),f.id]))};for(const f of Qt)if(f.centro&&!s[f.centro.toLowerCase()]){const{data:g,error:w}=await S.from("df_centros_custo").insert([{nome:zt(f.centro),empresa_id:C}]).select();if(w){Y(w);return}const T=Array.isArray(g)?g[0]:g;s[f.centro.toLowerCase()]=T==null?void 0:T.id}const m=Qt.map(f=>({descricao:f.descricao,valor:f.valor,data_vencimento:f.data_vencimento,vencimento:f.data_vencimento,status:f.status,centro_custo_id:f.centro&&s[f.centro.toLowerCase()]||null,enviar_whatsapp:ie,enviar_email:ne,enviar_push:se,dias_aviso:Number(Ce||1),empresa_id:C})),{error:b}=await S.from("df_contas").insert(m);if(b){Y(b);return}Oe(`${m.length} conta(s) importada(s) com sucesso.`),Ua(null),pa([]),await ha(C),J("contas")}async function _a(){ba(),Be(null),zi(!1),Ia("contas"),await S.auth.signOut()}function fn(){J("dashboard")}function le(){var m,b;const o=Ta||((m=x==null?void 0:x.user_metadata)==null?void 0:m.name)||((b=x==null?void 0:x.user_metadata)==null?void 0:b.full_name);if(o)return String(o).split(" ")[0];const s=(x==null?void 0:x.email)||"usuário";return zt(s.split("@")[0])}function br(){var m,b;const o=Ta||((m=x==null?void 0:x.user_metadata)==null?void 0:m.name)||((b=x==null?void 0:x.user_metadata)==null?void 0:b.full_name);if(o)return String(o).trim();const s=(x==null?void 0:x.email)||"";return s?zt(s.split("@")[0]):""}function hr(){vo(br()),$a(!0)}async function gn(){const o=String(wo||"").trim().replace(/\s+/g," ");if(o.length<2){R("Informe um nome com pelo menos 2 caracteres.","erro");return}yo(!0);try{await Mn({userId:x==null?void 0:x.id,email:x==null?void 0:x.email,nome:o}),Se(o),Be(s=>s&&{...s,user_metadata:{...s.user_metadata||{},name:o,full_name:o}}),C&&await Ne(C),$a(!1),R("Perfil atualizado com sucesso.","sucesso")}catch(s){Y(s,"Não foi possível atualizar o perfil.")}finally{yo(!1)}}function wr(){return e.jsx(Xn,{styles:l,modalConta:Tt,contaProps:{editandoContaId:M,descricao:Q,setDescricao:pt,valor:et,setValor:st,dataVencimento:K,setDataVencimento:At,centroCustoId:ge,setCentroCustoId:Ze,centros:dt,filialId:xe,setFilialId:ta,filiais:it,observacaoConta:be,setObservacaoConta:Re,contaRecorrente:he,setContaRecorrente:Pe,tipoRecorrencia:we,setTipoRecorrencia:Me,diaVencimentoRecorrencia:ve,setDiaVencimentoRecorrencia:Yt,fecharConta:He,salvarConta:Hi,primeiraLetraMaiuscula:zt,limitarDataInput:so,formatarDataParaBanco:Ca,fecharNota:ja,setModalCentro:nt,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht},modalNota:W,notaProps:{editandoNotaId:D,tituloNota:q,setTituloNota:mt,prioridadeNota:vt,setPrioridadeNota:at,dataEventoNota:ut,setDataEventoNota:ot,conteudoNota:Z,setConteudoNota:xt,filialNotaId:Ct,setFilialNotaId:$t,filiais:it,salvarNota:Ki,fecharNota:ja,fecharConta:He,setModalCentro:nt,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht,primeiraLetraMaiuscula:zt,limitarDataInput:so},modalCentro:gt,centroProps:{novoCentro:Mt,setNovoCentro:Jt,salvarCentro:an,centros:dt,abrirConfirmacao:Nt,excluirCentro:on,fecharConta:He,fecharNota:ja,setModalCentro:nt,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht},modalPerfilUsuario:si,perfilProps:{nome:wo,setNome:vo,email:x==null?void 0:x.email,salvando:di,onClose:()=>$a(!1),onSave:gn}})}function vr(){return e.jsx(es,{styles:l,globalLoading:a,globalToast:r,hideToast:n,confirmacao:qe,fecharConfirmacao:io,executarConfirmacao:dn})}function yr(){return e.jsx(In,{styles:l,nomeEmpresa:de,navegarPara:J,menuNavegacaoAberto:_e,setMenuNavegacaoAberto:Ht,canSwitchCompany:U==null?void 0:U.canSwitchCompany,empresasDisponiveis:v,empresaId:C,trocarEmpresaAtiva:wa,trocandoEmpresa:$e,nomeUsuario:le,abrirPerfilUsuario:hr,sairDoSistema:_a})}function kr(){return e.jsx(On,{styles:l,menuAberto:Kt,setMenuAberto:Wt,abrirNovaConta:Vi,abrirNovaNota:Ji})}function jr(){return e.jsx("style",{children:`
        /* ===== MOBILE FINAL — SCROLL, ALINHAMENTO E LIXEIRA ===== */
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
      `})}function xn(){return e.jsx("style",{children:`
        /* ===== UX FINAL — MOBILE COM IDENTIDADE DO DESKTOP ===== */
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
      `})}function _r(){return e.jsx("style",{children:`
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
      `})}function bt(o){return e.jsx(Yr,{contas:N,contasFiltradas:Ft,navegarPara:J,children:e.jsxs("div",{className:"app-page app-frame",style:l.page,children:[e.jsx("style",{children:`

          .app-toast {
            position: fixed;
            left: 50%;
            bottom: 92px;
            transform: translateX(-50%);
            z-index: 5000;
            width: min(360px, calc(100vw - 32px));
            padding: 12px 14px;
            border-radius: 16px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 18px 45px rgba(15,23,42,.20);
            display: grid;
            gap: 3px;
            color: #111827;
          }
          .app-toast strong { font-size: 13px; }
          .app-toast span { font-size: 13px; color: #4b5563; }
          .app-toast-erro { border-left: 5px solid #ef4444; }
          .app-toast-info { border-left: 5px solid #14b8a6; }
          .master-page-hero {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }
          .master-kicker {
            display: inline-flex;
            align-items: center;
            width: fit-content;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(20, 184, 166, .10);
            color: #0f766e;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
            margin-bottom: 8px;
          }

          .master-tabs {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: -4px 0 18px;
            padding: 6px;
            width: fit-content;
            border-radius: 999px;
            background: #f1f5f9;
            border: 1px solid rgba(15, 23, 42, .06);
          }
          .master-tabs button {
            min-height: 36px;
            border: 0;
            border-radius: 999px;
            padding: 8px 14px;
            background: transparent;
            color: #64748b;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            transition: all .18s ease;
          }
          .master-tabs button.active {
            background: #ffffff;
            color: #0f766e;
            box-shadow: 0 8px 22px rgba(15, 23, 42, .08);
          }
          .master-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 18px;
          }
          .master-stat-card {
            border: 1px solid rgba(15, 23, 42, .08);
            border-radius: 22px;
            background: linear-gradient(135deg, #ffffff, #f8fafc);
            box-shadow: 0 14px 34px rgba(15, 23, 42, .06);
            padding: 18px;
            display: grid;
            gap: 8px;
          }
          .master-stat-card small {
            color: #64748b;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .06em;
            font-size: 11px;
          }
          .master-stat-card strong {
            color: #0f172a;
            font-size: 24px;
            font-weight: 950;
            line-height: 1.1;
          }
          .master-create-card,
          .master-create-form,
          .master-list-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
          }
          .master-create-form { flex: 1; max-width: 560px; }
          .master-create-form input { margin: 0 !important; }
          .master-search-input { max-width: 320px; margin: 0 !important; }
          .master-companies-list {
            display: grid;
            gap: 12px;
            margin-top: 16px;
          }
          .master-company-card {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) auto auto;
            gap: 14px;
            align-items: center;
            border: 1px solid rgba(15, 23, 42, .08);
            border-radius: 20px;
            background: #ffffff;
            padding: 14px;
            box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
          }
          .master-company-card.active {
            border-color: rgba(20, 184, 166, .32);
            background: linear-gradient(135deg, #ffffff, #f0fdfa);
          }
          .master-company-main {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .master-company-icon {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(20, 184, 166, .10);
            flex: 0 0 42px;
          }
          .master-company-main h3 {
            margin: 0 0 4px;
            color: #0f172a;
            font-size: 16px;
          }
          .master-company-main small {
            display: block;
            max-width: 360px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #64748b;
          }
          .master-company-meta {
            display: grid;
            gap: 4px;
            color: #64748b;
            font-size: 12px;
          }
          .master-company-meta strong {
            color: #0f766e;
            font-weight: 900;
          }
          .master-company-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
          }
          .master-company-actions button {
            min-height: 36px !important;
            padding: 8px 12px !important;
            margin: 0 !important;
          }
          @media (max-width: 860px) {
            .master-page-hero,
            .master-create-card,
            .master-create-form,
            .master-list-header {
              display: grid;
              align-items: stretch;
            }
            .master-tabs { width: 100%; }
            .master-tabs button { flex: 1; }
            .master-stats-grid { grid-template-columns: 1fr; }
            .master-create-form { max-width: none; }
            .master-search-input { max-width: none; }
            .master-company-card {
              grid-template-columns: 1fr;
              align-items: stretch;
            }
            .master-company-actions { justify-content: flex-start; flex-wrap: wrap; }
          }
          .top-shell-clean {
            min-height: 72px !important;
            box-sizing: border-box !important;
          }
          @media (max-width: 979px) {
            .top-shell-clean {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 10px !important;
              margin: 0 0 14px 0 !important;
              padding: 10px 12px !important;
              border-radius: 20px !important;
              background: #ffffff !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 10px 24px rgba(15,23,42,.06) !important;
            }
            .top-shell-logo {
              min-width: 0 !important;
              flex: 1 !important;
              overflow: hidden !important;
            }
            .top-shell-logo img {
              width: 42px !important;
              height: 42px !important;
              flex: 0 0 42px !important;
            }
            .top-shell-logo strong {
              display: block !important;
              max-width: 190px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
              font-size: 15px !important;
              line-height: 1.1 !important;
            }
            .top-shell-logo small {
              display: block !important;
              font-size: 11px !important;
              line-height: 1.1 !important;
              color: #64748b !important;
            }
            .mobile-menu-trigger {
              flex: 0 0 42px !important;
              width: 42px !important;
              height: 42px !important;
              border-radius: 14px !important;
              background: #ffffff !important;
              color: #0f172a !important;
              border: 1px solid #e5e7eb !important;
              box-shadow: 0 6px 16px rgba(15,23,42,.08) !important;
            }
          }

          .desktop-sidebar { display: none; }
          @media (min-width: 980px) {
            body { background: #eef7f5 !important; }
            .app-frame { max-width: none !important; width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 24px 32px 80px 300px !important; box-sizing: border-box !important; background: linear-gradient(180deg, #f8fafc 0%, #eef7f5 100%) !important; }
            .app-frame-content { max-width: 1280px; margin: 0 auto; }
            .app-frame-content > h1 { font-size: 34px !important; margin: 0 0 16px 0 !important; }
            .app-frame-content > section { border-radius: 22px !important; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07) !important; }
            .relatorios-page { max-width: 1280px !important; width: 100% !important; padding: 0 !important; margin: 0 !important; background: transparent !important; }
            .relatorios-page [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
            .desktop-sidebar { display: flex !important; position: fixed; left: 24px; top: 24px; bottom: 24px; width: 244px; padding: 18px; border-radius: 24px; background: linear-gradient(180deg, #064e3b 0%, #0f766e 48%, #14b8a6 100%); color: white; box-shadow: 0 24px 60px rgba(15, 118, 110, 0.28); z-index: 60; flex-direction: column; gap: 14px; box-sizing: border-box; }
            .desktop-sidebar-brand { display:flex; align-items:center; gap:12px; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.18); }
            .desktop-sidebar-brand img { width:48px; height:48px; border-radius:16px; background:white; }
            .desktop-sidebar-brand strong { display:block; font-size:17px; }
            .desktop-sidebar-brand small { color:rgba(255,255,255,.78); }
            .desktop-sidebar-section-label { margin:12px 4px 4px; font-size:10px; letter-spacing:.9px; text-transform:uppercase; color:rgba(255,255,255,.62); font-weight:900; }
            .desktop-sidebar-nav { display:grid; gap:6px; margin-top:2px; }
            .desktop-sidebar-nav button { display:flex; align-items:center; gap:10px; width:100%; border:1px solid transparent; background:transparent; color:rgba(255,255,255,.92); border-radius:14px; padding:11px 12px; text-align:left; font-weight:800; cursor:pointer; }
            .desktop-sidebar-nav button:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.12); }
            .desktop-sidebar-nav button.active { background:rgba(255,255,255,.22); border-color:rgba(255,255,255,.18); box-shadow:inset 3px 0 0 rgba(255,255,255,.8); }
            .desktop-sidebar-spacer { flex:1; }
            .desktop-sidebar-user { border-radius:18px; padding:12px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); }
            .desktop-sidebar-user strong { display:block; }
            .desktop-sidebar-user small { color:rgba(255,255,255,.8); }
            .top-shell { max-width:1280px; margin:0 auto 22px auto !important; padding:16px 18px !important; border-radius:24px !important; }
            .mobile-menu-trigger { display:none !important; }
            .agenda-page-grid { display:grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:16px; }
          }
          @media (max-width: 979px) { .app-frame { max-width: 430px; margin:auto; } }
          .note-card-action { transition:.2s; }

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
              width:100%; border:1px solid rgba(255,255,255,.14); border-radius:14px;
              background:rgba(255,255,255,.08); color:white; font-weight:900;
              padding:8px 10px; cursor:pointer; opacity:.88;
            }
            .sidebar-collapse-btn:hover { opacity:1; background:rgba(255,255,255,.14); }
            .sidebar-collapse-btn small { font-size:12px; color:rgba(255,255,255,.78); font-weight:800; }
            .sidebar-user-clean { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,.14) !important; }
            .sidebar-user-avatar { width:34px; height:34px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#ffffff; color:#0f766e; font-weight:900; flex:0 0 34px; }
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


          /* MOBILE: bloco de notas visível e FAB funcional */
          @media (max-width: 979px) {
            .notes-panel {
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
            }
            .note-add-small {
              width: 38px !important;
              height: 38px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .mobile-fab, .mobile-fab-menu { z-index: 3000 !important; }
            .mobile-fab-menu button { touch-action: manipulation !important; }
          }

  

        /* PARIDADE MOBILE/DESKTOP + CSS SUAVE */
        .relatorios-page [style*="grid-template-columns: 1fr 1fr 1fr"],
        .relatorios-page [style*="grid-template-columns: repeat(3"],
        .relatorios-page .report-grid-fluid,
        .summary-grid,
        .metrics-grid,
        .dashboard-grid-fluid {
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
        }
        .app-frame-content > section,
        .content-block,
        .print-card,
        .modal,
        .dashboard-notes-card,
        .dashboard-open-accounts {
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06) !important;
        }
        button.danger,
        .btn-danger,
        .account-actions button:last-child,
        .notes-list-dashboard button:last-child {
          background: #fee2e2 !important;
          color: #ef4444 !important;
          border: 1px solid #f87171 !important;
        }
        @media (max-width: 979px) {
          button,
          .desktop-sidebar-nav button,
          .mobile-menu-panel button,
          .filter-toggle-button,
          .dashboard-see-all-link,
          .note-toggle-small,
          .account-actions button,
          .export-actions button {
            min-height: 44px !important;
          }
          .btnMiniExcluir,
          [style*="padding: 4px 7px"] {
            min-width: 44px !important;
            min-height: 44px !important;
          }
          .dashboard-notes-card.mobile-collapsed-default {
            margin-top: 10px !important;
          }
        }

      `}),_r(),jr(),e.jsx(Ar,{}),xn(),yr(),Sr(),Cr(),e.jsx("main",{className:"app-frame-content",children:e.jsx(uo,{children:o})}),kr(),e.jsx(zr,{}),e.jsx(Ur,{}),wr(),vr()]})})}function Sa({icon:o,title:s,description:m}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:o}),e.jsx("strong",{children:s}),e.jsx("p",{children:m})]})}function bn(o){ni(s=>({...s,[o]:!s[o]}))}function Sr(){return e.jsx(Ln,{sidebarCompacta:oi,setSidebarCompacta:ri,nomeUsuario:le,nomeUsuarioAtual:le(),normalizarPerfil:Dt,perfilUsuario:sa,menuSections:er(),telaAtual:_t,navegarPara:J,gruposMenu:ii,toggleGrupoMenu:bn,sairDoSistema:_a})}function Cr(){return e.jsx(qn,{visible:_e,styles:l,setMenuNavegacaoAberto:Ht,nomeUsuario:le,nomeUsuarioAtual:le(),normalizarPerfil:Dt,perfilUsuario:sa,menuSections:er(),navegarPara:J,sairDoSistema:_a,canSwitchCompany:U==null?void 0:U.canSwitchCompany,empresasDisponiveis:v,empresaId:C,trocarEmpresaAtiva:wa,trocandoEmpresa:$e,abrirPerfilUsuario:hr})}const hn={carregandoAuth:Zo,usuarioLogado:x,erroEmpresa:ho,styles:l,setUsuarioLogado:Be,globalToast:r,hideToast:n,sairDoSistema:_a};if(Zo||!x||ho)return e.jsx(Gn,{...hn});if(_t==="contas")return bt(e.jsx(hd,{styles:l,busca:P,setBusca:j,mostrarFiltros:ci,setMostrarFiltros:li,limparFiltros:sn,imprimirPDF:nn,exportarCSV:rn,filtroStatus:_,setFiltroStatus:I,centros:dt,filtroCentro:G,setFiltroCentro:B,filiais:it,filtroFilial:A,setFiltroFilial:L,filtroMes:F,setFiltroMes:lt,dataInicial:X,setDataInicial:$,dataFinal:O,setDataFinal:St,limitarDataInput:so,contasFiltradas:Ft,total:ya,formatarValor:kt,loading:ht,HeaderExpansivel:o=>e.jsx(ze,{styles:l,...o}),mostrarContas:pi,setMostrarContas:mi,estaVencida:qt,formatarData:It,formatarTipoRecorrencia:qs,obterTipoRecorrenciaConta:Ls,abrirConfirmacao:Nt,marcarComoPago:ro,voltarParaPendente:Gi,abrirEdicaoConta:Wi,excluirConta:Yi,navegarPara:J}));if(_t==="relatorios")return bt(e.jsx(wd,{voltar:()=>J("contas"),empresaId:C,usuario:x,mostrarAviso:R}));if(_t==="notas")return bt(e.jsx(vd,{styles:l,navegarPara:J,notasFiltradas:cr,notasPendentes:ka,notasCriticas:lr,notasUrgentes:pr,buscaNota:ia,setBuscaNota:na,formatarData:It,alternarNotaConcluida:fr,abrirEdicaoNota:mr,abrirConfirmacao:Nt,excluirNota:ur,loading:ht,nomeUsuario:le(),filiais:it,filtroFilial:A,setFiltroFilial:L,contasOperacionaisFiliais:ir}));if(_t==="importar")return bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"📥 Importar planilha"}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"1. Enviar arquivo"}),e.jsx("p",{style:l.textoNota,children:"Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app."}),e.jsxs("label",{style:l.uploadExcelBox,children:[e.jsx("strong",{children:"📊 Selecionar arquivo CSV"}),e.jsx("small",{children:"No Excel: Arquivo > Salvar como > CSV UTF-8"}),e.jsx("input",{type:"file",accept:".csv",onChange:mn,style:{display:"none"}})]}),jo&&e.jsxs("p",{style:l.textoNota,children:["Arquivo: ",e.jsx("strong",{children:jo.name})]}),_o&&e.jsx("p",{style:l.alertaSucesso,children:_o})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"2. Colunas esperadas"}),e.jsxs("div",{style:l.importDicasGrid,children:[e.jsx("span",{children:"Descrição"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Vencimento"}),e.jsx("span",{children:"Status"}),e.jsx("span",{children:"Centro de custo"})]}),e.jsx("p",{style:l.textoAjuda,children:"O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação."})]}),Qt.length>0&&e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"3. Revisar dados"}),e.jsx("div",{style:l.previewImportacao,children:Qt.slice(0,8).map(o=>e.jsxs("div",{style:l.previewLinha,children:[e.jsx("strong",{children:o.descricao||`Linha ${o.linha}`}),e.jsxs("small",{children:[It(o.data_vencimento)," • ",kt(o.valor)," • ",o.status," • ",o.centro||"Sem centro"]})]},o.linha))}),Qt.length>8&&e.jsxs("small",{style:l.textoAjuda,children:["Mostrando 8 de ",Qt.length," linhas."]}),e.jsxs("button",{style:l.btnSalvar,onClick:un,children:["Importar ",Qt.length," conta(s)"]})]})]}));if(_t==="master-empresas")return U!=null&&U.canManageCompanies?bt(e.jsx(yd,{styles:l,usuarioLogado:x,nomeUsuarioCompleto:br,empresaId:C,empresasDisponiveis:v,trocarEmpresaAtiva:wa,trocandoEmpresa:$e,mostrarAviso:R,onEmpresasAtualizadas:Mi,voltarPainel:fn,abaInicial:"empresas"})):bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"🏢 Painel Master"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:l.textoNota,children:"Seu perfil atual não permite acessar o painel master."}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"})]})]}));if(_t==="onboarding")return Ve()?bt(e.jsx(kd,{styles:l,empresaId:C,empresaNome:de,filiais:it,centros:dt,contas:N,mostrarAviso:R,onRefresh:()=>ha(C),voltarPainel:()=>J("configuracoes"),abrirDashboard:()=>J("dashboard")})):bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"🚀 Onboarding SaaS"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:l.textoNota,children:"Seu perfil atual não permite acessar o onboarding."}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"})]})]}));if(_t==="billing")return Ve()?bt(e.jsx(jd,{styles:l,empresaId:C,empresaNome:de,filiais:it,usuarios:ma,mostrarAviso:R,podeEditar:ce(),voltarPainel:()=>J("configuracoes")})):bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"💼 Billing"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:l.textoNota,children:"Seu perfil atual não permite acessar o billing."}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"})]})]}));if(_t==="filiais")return Ve()?bt(e.jsx(_d,{styles:l,empresaId:C,empresaNome:de,mostrarAviso:R,voltarPainel:()=>J("configuracoes")})):bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"🏬 Filiais"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:l.textoNota,children:"Seu perfil atual não permite gerenciar filiais."}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"})]})]}));if(_t==="usuarios")return bt(e.jsx(Sd,{styles:l,EmptyState:Sa,podeAcessarConfiguracoes:Ve,podeAdministrarUsuarios:ce,navegarPara:J,usuarioLogado:x,normalizarPerfil:Dt,perfilUsuario:sa,permissoesUsuario:U,novoEmailUsuario:$o,setNovoEmailUsuario:Lo,novaSenhaUsuario:Ue,setNovaSenhaUsuario:qo,confirmarNovaSenhaUsuario:Oo,setConfirmarNovaSenhaUsuario:Uo,salvarMeuEmail:qi,salvarMinhaSenha:Oi,empresasDisponiveis:v,empresaId:C,trocandoEmpresa:$e,trocarEmpresaAtiva:wa,buscarUsuariosEmpresa:Ne,primeiraLetraMaiuscula:zt,nomeConviteUsuario:Po,setNomeConviteUsuario:Mo,emailConviteUsuario:Ao,setEmailConviteUsuario:Ro,senhaConviteUsuario:Io,setSenhaConviteUsuario:To,perfilConviteUsuario:Do,setPerfilConviteUsuario:Fo,criandoUsuarioManual:Co,adicionarUsuarioEmpresa:Di,usuariosCarregando:yi,usuariosInicializados:ki,usuariosErro:ji,usuariosEmpresa:ma,filiais:it,filiaisUsuariosEmpresa:Eo,salvandoFilialUsuario:_i,liberarTodasFiliaisUsuario:$i,alternarFilialUsuario:Ti,atualizarPerfilUsuarioEmpresa:Ii,enviarAcessoUsuarioEmpresa:Fi,removerUsuarioEmpresa:Li}));if(_t==="configuracoes")return Ve()?bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"⚙️ Configurações"}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx(ze,{styles:l,titulo:"🔔 Notificações",aberto:qa,onClick:()=>hi(!qa)}),qa&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{className:"checkbox-row-fix",style:l.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificações ativas"}),e.jsx("small",{children:"Controle geral dos disparos automáticos da empresa."})]}),e.jsx("input",{type:"checkbox",checked:Ha,onChange:o=>Ga(o.target.checked)})]}),e.jsxs("div",{style:l.configResumo,children:[e.jsx("strong",{children:"Contas"}),e.jsx("span",{children:"Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário."})]}),e.jsx("input",{style:l.input,type:"number",min:"0",placeholder:"Avisar contas antes do vencimento. Ex: 1",value:xa,onChange:o=>{Ja(o.target.value),Ya(o.target.value)}}),e.jsxs("label",{className:"checkbox-row-fix",style:l.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificar contas vencidas"}),e.jsx("small",{children:"Exibir contas em atraso nas notificações e destaques."})]}),e.jsx("input",{type:"checkbox",checked:Ho,onChange:o=>Ka(o.target.checked)})]}),e.jsxs("label",{className:"checkbox-row-fix",style:l.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar contas críticas"}),e.jsx("small",{children:"Dar prioridade visual para contas vencidas ou muito próximas do vencimento."})]}),e.jsx("input",{type:"checkbox",checked:Go,onChange:o=>Qa(o.target.checked)})]}),e.jsxs("div",{style:l.configResumo,children:[e.jsx("strong",{children:"Notas"}),e.jsx("span",{children:"Regras para pendências e prioridades do bloco de notas."})]}),e.jsx("input",{style:l.input,type:"number",min:"0",placeholder:"Avisar notas pendentes após quantos dias. Ex: 3",value:Yo,onChange:o=>Xa(o.target.value)}),e.jsxs("label",{className:"checkbox-row-fix",style:l.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar notas urgentes"}),e.jsx("small",{children:"Manter notas urgentes e críticas no topo do acompanhamento."})]}),e.jsx("input",{type:"checkbox",checked:Jo,onChange:o=>Za(o.target.checked)})]}),e.jsxs("div",{style:l.configResumo,children:[e.jsx("strong",{children:"Canais preparados"}),e.jsxs("span",{children:["WhatsApp: ",ie?"Ligado":"Desligado"," • E-mail: ",ne?"Ligado":"Desligado"," • Push: ",se?"Ligado":"Desligado"]})]})]})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx(ze,{styles:l,titulo:"🏢 Dados do negócio",aberto:La,onClick:()=>bi(!La)}),La&&e.jsxs(e.Fragment,{children:[e.jsx("input",{style:l.input,placeholder:"Nome da empresa",value:de,onChange:o=>to(zt(o.target.value))}),e.jsx("input",{style:l.input,placeholder:"WhatsApp padrão. Ex: 5511999999999",value:Ko,onChange:o=>eo(o.target.value)}),e.jsx("input",{style:l.input,placeholder:"E-mail padrão",value:Qo,onChange:o=>ao(o.target.value)})]})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx(ze,{styles:l,titulo:"🔁 Recorrências",aberto:Oa,onClick:()=>vi(!Oa)}),Oa&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:l.textoNota,children:"As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original."}),e.jsxs("div",{style:l.configResumo,children:[e.jsx("strong",{children:"Padrão atual"}),e.jsx("span",{children:"Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir."})]})]})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx(ze,{styles:l,titulo:"🏷 Centros de custo",aberto:la,onClick:()=>wi(!la)}),la&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:l.textoNota,children:"Cadastre e gerencie os centros usados nas contas e nos relatórios."}),e.jsxs("div",{style:l.configResumo,children:[e.jsxs("span",{children:["Total de centros: ",dt.length]}),e.jsx("span",{children:"Uso nos filtros e relatórios"})]}),e.jsx("button",{style:l.btnSalvar,onClick:()=>nt(!0),children:"Gerenciar centros"})]})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx(ze,{styles:l,titulo:"🏬 Filiais / Unidades",aberto:la,onClick:()=>J("filiais")}),e.jsx("p",{style:l.textoNota,children:"Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial."}),e.jsxs("div",{style:l.configResumo,children:[e.jsx("span",{children:"Organização: empresa → filial → centro de custo → conta"}),e.jsx("span",{children:"Isolamento por empresa ativo"})]}),e.jsx("button",{style:l.btnSalvar,onClick:()=>J("filiais"),children:"Gerenciar filiais"})]}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"🧠 Como o sistema vai usar"}),e.jsx("p",{style:l.textoNota,children:"O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos e as contas/notas passam a obedecer ao mesmo padrão configurado aqui."}),e.jsxs("div",{style:l.configResumo,children:[e.jsxs("span",{children:["Geral: ",Ha?"Ligado":"Desligado"]}),e.jsxs("span",{children:["WhatsApp: ",ie?"Ligado":"Desligado"]}),e.jsxs("span",{children:["E-mail: ",ne?"Ligado":"Desligado"]}),e.jsxs("span",{children:["Push: ",se?"Ligado":"Desligado"]})]})]}),e.jsx("button",{style:l.btnSalvar,onClick:Qi,children:"Salvar configurações"})]})):bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"⚙️ Configurações"}),e.jsxs("section",{style:l.cardConfiguracao,children:[e.jsx("h2",{style:l.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:l.textoNota,children:"Seu perfil atual não permite acessar configurações."}),e.jsx("button",{style:l.btnCinza,onClick:()=>J("contas"),children:"← Voltar"})]})]}));if(_t==="agenda"){let o=function({titulo:H,total:tt,lista:Ee,cor:pe}){return e.jsxs("section",{style:l.cardAgenda,children:[e.jsxs("div",{style:l.cardTopo,children:[e.jsx("strong",{children:H}),e.jsx("span",{children:kt(tt)})]}),Ee.length===0&&e.jsx(Sa,{icon:"✅",title:"Agenda limpa",description:"Não há contas neste grupo de vencimento no momento."}),Ee.map(Lt=>{var Nr;const me=Ae(Lt.data_vencimento);return e.jsxs("div",{style:{...l.itemAgenda,borderLeft:`5px solid ${pe}`},children:[e.jsxs("div",{children:[e.jsx("strong",{children:Lt.descricao}),e.jsxs("div",{style:l.cardInfo,children:[It(Lt.data_vencimento)," • ",((Nr=Lt.df_centros_custo)==null?void 0:Nr.nome)||"Sem centro"]}),e.jsx("small",{style:me<0?l.textoVencidoAgenda:l.textoAgenda,children:me<0?`Vencida há ${Math.abs(me)} dia(s)`:me===0?"Vence hoje":`Vence em ${me} dia(s)`})]}),e.jsxs("div",{style:l.agendaDireita,children:[e.jsx("strong",{children:kt(Lt.valor)}),e.jsx("button",{style:l.btnPago,onClick:()=>Nt({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${Lt.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>ro(Lt.id)}),children:"Pago"})]})]},Lt.id)})]})};const s=[...N].filter(H=>H.status!=="pago").sort((H,tt)=>Xe(H.data_vencimento)-Xe(tt.data_vencimento)),m=s.filter(H=>Ae(H.data_vencimento)<0),b=s.filter(H=>Ae(H.data_vencimento)===0),f=s.filter(H=>{const tt=Ae(H.data_vencimento);return tt>0&&tt<=7}),g=s.filter(H=>Ae(H.data_vencimento)>7&&Fs(H.data_vencimento)),w=m.reduce((H,tt)=>H+Number(tt.valor||0),0),T=b.reduce((H,tt)=>H+Number(tt.valor||0),0),ct=f.reduce((H,tt)=>H+Number(tt.valor||0),0),Et=g.reduce((H,tt)=>H+Number(tt.valor||0),0);return bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"📅 Agenda Financeira"}),e.jsx("button",{className:"btn-back-page",style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"agenda-summary-grid",style:l.resumo,children:[e.jsxs("div",{style:l.boxVencido,children:[e.jsx("span",{children:"Vencidas"}),e.jsx("strong",{children:kt(w)})]}),e.jsxs("div",{style:l.boxPendente,children:[e.jsx("span",{children:"Hoje"}),e.jsx("strong",{children:kt(T)})]}),e.jsxs("div",{style:l.boxTotal,children:[e.jsx("span",{children:"7 dias"}),e.jsx("strong",{children:kt(ct)})]}),e.jsxs("div",{style:l.boxPago,children:[e.jsx("span",{children:"Mês"}),e.jsx("strong",{children:kt(Et)})]})]}),e.jsxs("div",{className:"agenda-page-grid",children:[e.jsx(o,{titulo:"🚨 Vencidas",total:w,lista:m,cor:"#dc3545"}),e.jsx(o,{titulo:"📌 Vencem hoje",total:T,lista:b,cor:"#ffc107"}),e.jsx(o,{titulo:"🗓️ Próximos 7 dias",total:ct,lista:f,cor:"#0d6efd"}),e.jsx(o,{titulo:"📆 Restante do mês",total:Et,lista:g,cor:"#14b8a6"})]})]}))}return _t==="lixeira"?bt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:l.titulo,children:"🗑️ Lixeira"}),e.jsx("button",{className:"btn-back-page",style:l.btnCinza,onClick:()=>J("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"trash-section trash-section-accounts",style:l.bloco,children:[e.jsx("h2",{style:l.subtitulo,children:"💰 Contas excluídas"}),E.length===0&&e.jsx(Sa,{icon:"🧹",title:"Nenhuma conta na lixeira",description:"As contas excluídas aparecerão aqui durante o período de quarentena."}),E.map(o=>{var m;const s=Lr(o.excluido_em);return qr(o.excluido_em),e.jsxs("div",{className:"trash-card trash-card-account",style:l.cardLixeira,children:[e.jsxs("div",{style:l.cardTopo,children:[e.jsx("strong",{children:o.descricao}),e.jsx("span",{children:kt(o.valor)})]}),e.jsxs("div",{style:l.cardInfo,children:["Venc.: ",It(o.data_vencimento)," • Centro: ",((m=o.df_centros_custo)==null?void 0:m.nome)||"Sem centro"," • Lixeira há ",s," dia(s)"]}),e.jsxs("small",{style:l.textoLiberado,children:["Excluída há ",s," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:l.acoes,children:[e.jsx("button",{style:l.btnPago,onClick:()=>Nt({titulo:"Restaurar conta",mensagem:`Deseja restaurar a conta ${o.descricao}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Xi(o.id)}),children:"Restaurar"}),e.jsx("button",{style:l.btnExcluir,onClick:()=>Nt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a conta ${o.descricao}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>tn(o)}),children:"Excluir definitivo"})]})]},o.id)})]}),e.jsxs("section",{className:"trash-section trash-section-notes",style:l.bloco,children:[e.jsx("h2",{style:l.subtitulo,children:"📝 Notas excluídas"}),ra.length===0&&e.jsx(Sa,{icon:"🗒️",title:"Nenhuma nota na lixeira",description:"As notas excluídas aparecerão aqui antes da remoção definitiva."}),ra.map(o=>{const s=Lr(o.excluido_em);return qr(o.excluido_em),e.jsxs("div",{className:"trash-card trash-card-note",style:l.cardLixeira,children:[e.jsx("strong",{children:o.titulo}),o.conteudo&&e.jsx("p",{style:l.textoNota,children:o.conteudo}),e.jsxs("small",{style:l.textoLiberado,children:["Excluída há ",s," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:l.acoes,children:[e.jsx("button",{style:l.btnPago,onClick:()=>Nt({titulo:"Restaurar nota",mensagem:`Deseja restaurar a nota ${o.titulo}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Zi(o.id)}),children:"Restaurar"}),e.jsx("button",{style:l.btnExcluir,onClick:()=>Nt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a nota ${o.titulo}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>en(o)}),children:"Excluir definitivo"})]})]},o.id)})]})]})):e.jsxs(gs,{contas:N,contasFiltradas:Ft,navegarPara:J,menuAberto:Kt,setMenuAberto:Wt,pageStyle:l.page,children:[_r(),jr(),e.jsx(Ar,{}),e.jsxs("div",{className:"print-header",children:[e.jsx("h1",{children:"Relatório Financeiro"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]})]}),e.jsx("div",{className:"print-footer",children:"Relatório gerado pelo Sistema DF Gestão Financeira"}),yr(),Sr(),Cr(),kr(),e.jsx(zr,{}),e.jsx(Ur,{}),e.jsx(uo,{children:e.jsx(bd,{routeProps:{styles:l,nomeUsuario:le(),formatarValor:kt,total:ya,pago:oo,pendente:sr,vencido:nr,contas:Ft,diferencaDias:Ae,navegarPara:J,contasAbertasDashboard:Bi,mostrarContasDashboard:ui,setMostrarContasDashboard:fi,busca:P,setBusca:j,estaVencida:qt,formatarData:It,abrirConfirmacao:Nt,marcarComoPago:ro,notasPendentes:ka,notasCriticas:lr,notasUrgentes:pr,mostrarNotas:gi,setMostrarNotas:xi,alternarNotaConcluida:fr,abrirEdicaoNota:mr,excluirNota:ur,loading:ht,filiais:it,filtroFilial:A,setFiltroFilial:L,contasOperacionaisFiliais:ir}})}),wr(),vr()]})}vn.createRoot(document.getElementById("root")).render(e.jsx(yn.StrictMode,{children:e.jsx(Wn,{children:e.jsx(Nd,{})})}));export{Pd as a,Dd as b,Is as c,Rd as d,qs as f,ms as g,ud as l,Ad as m,Ls as o,Md as r,S as s,Gr as u};
