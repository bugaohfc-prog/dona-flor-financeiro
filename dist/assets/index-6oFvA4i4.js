const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/DashboardRouteComposition-DMs-0q0K.js","assets/vendor-react-CdkWbty6.js","assets/Skeletons-eKyR2h5r.js","assets/vendor-charts-CPrmKtzC.js","assets/vendor-supabase-D2gm834s.js","assets/ContasPage-Bd3UmwXK.js","assets/Relatorios-D9GNHxxX.js","assets/NotasPage-D7HbC0m1.js","assets/MasterPanelPage-JGEZnq0O.js","assets/OnboardingPage-CwRaH0D8.js","assets/BillingPage-CSzMd91S.js","assets/FiliaisPage-DCB0EXS_.js","assets/UsuariosPage-Bn1X-D3O.js","assets/CopilotDrawer-D_QFFgEp.js"])))=>i.map(i=>d[i]);
import{r as s,j as e,a as Rn,b as Pn,R as Fn}from"./vendor-react-CdkWbty6.js";import{c as Dn}from"./vendor-supabase-D2gm834s.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const c of n)if(c.type==="childList")for(const l of c.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function r(n){const c={};return n.integrity&&(c.integrity=n.integrity),n.referrerPolicy&&(c.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?c.credentials="include":n.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function i(n){if(n.ep)return;n.ep=!0;const c=r(n);fetch(n.href,c)}})();const Tn=void 0;function In(){return!!Tn}function $n(){return In()?"":"Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o sistema."}const S=Dn("https://placeholder.supabase.co","placeholder-anon-key",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}});function ae(t){const a=String(t||"").toLowerCase().trim();return["admin","adm","administrador","master","owner"].includes(a)?"admin":["gerente","gerencia","gestor","manager"].includes(a)?"gerente":["financeiro","financas","finanças","financial"].includes(a)?"financeiro":["operacional","operacao","operação","atendente"].includes(a)?"operacional":["visualizacao","visualização","viewer","leitura","consulta"].includes(a)?"visualizacao":(["operador","usuario","usuário","user"].includes(a),"operador")}function Ln(t=[],a=null){const r=(t||[]).map(n=>({...n,empresa_id:n.empresa_id||a,email:String(n.email||"").trim().toLowerCase(),perfil:ae(n.perfil)})).filter(n=>!a||n.empresa_id===a),i=new Map;for(const n of r){const c=n.user_id||n.email||n.id,l=i.get(c);if(!l){i.set(c,n);continue}i.set(c,{...l,...n,id:l.id||n.id,nome:l.nome||n.nome,email:l.email||n.email,user_id:l.user_id||n.user_id,perfil:l.perfil==="admin"?l.perfil:n.perfil,created_at:l.created_at||n.created_at})}return Array.from(i.values())}async function qn(t){const{data:a,error:r}=await S.functions.invoke("listar-usuarios-empresa",{body:{empresaId:t}});if(r)throw r;if((a==null?void 0:a.ok)===!1)throw new Error((a==null?void 0:a.message)||"Não foi possível listar usuários pela Edge Function.");return Ln((a==null?void 0:a.usuarios)||[],t)}async function On(t){return t?qn(t):[]}async function Bn({empresaId:t,email:a,nome:r,perfil:i,senhaProvisoria:n,criarAuthManual:c=!1}){const l=String(a||"").trim().toLowerCase(),u=String(r||"").trim()||l.split("@")[0],h=ae(i),k=String(n||"").trim();if(!t)throw new Error("Empresa não identificada.");if(!l||!l.includes("@"))throw new Error("Informe um e-mail válido.");if(c&&k.length<6)throw new Error("Informe uma senha provisória com pelo menos 6 caracteres.");if(c){const{data:E,error:_}=await S.functions.invoke("criar-usuario-manual",{body:{empresaId:t,email:l,nome:u,perfil:h,senhaProvisoria:k}});if(_){const P=String((_==null?void 0:_.message)||(_==null?void 0:_.details)||"");throw P.includes("Failed to send a request")?new Error("Não foi possível conectar à Edge Function criar-usuario-manual. Confirme se ela foi publicada no Supabase e se o projeto está correto."):new Error(P||"A Edge Function criar-usuario-manual retornou erro. Verifique os logs no Supabase.")}if((E==null?void 0:E.ok)===!1)throw new Error((E==null?void 0:E.message)||"Não foi possível criar o usuário manualmente.");return(E==null?void 0:E.usuario)||(E==null?void 0:E.vinculo)||{empresa_id:t,email:l,nome:u,perfil:h,user_id:(E==null?void 0:E.userId)||null}}const{data:j,error:y}=await S.from("df_usuarios_empresas").select("id, email, user_id").eq("empresa_id",t).eq("email",l).maybeSingle();if(y)throw y;if(j)throw new Error("Este e-mail já está cadastrado nesta empresa.");const C={empresa_id:t,user_id:null,email:l,nome:u,perfil:h},{data:w,error:R}=await S.from("df_usuarios_empresas").insert([C]).select("*").single();if(R)throw R;return w}async function Un({empresaId:t,usuario:a,perfil:r}){const i=ae(r);let n=S.from("df_usuarios_empresas").update({perfil:i}).eq("empresa_id",t);a.id?n=n.eq("id",a.id):a.user_id?n=n.eq("user_id",a.user_id):n=n.eq("email",a.email);const{error:c}=await n;if(c)throw c}async function Vn({empresaId:t,usuario:a}){let r=S.from("df_usuarios_empresas").delete().eq("empresa_id",t);a.id?r=r.eq("id",a.id):a.user_id?r=r.eq("user_id",a.user_id):r=r.eq("email",a.email);const{error:i}=await r;if(i)throw i}async function Wn({usuario:t}){const a=String((t==null?void 0:t.email)||"").trim().toLowerCase();if(!a||!a.includes("@"))throw new Error("Este usuário não possui e-mail válido para envio de acesso.");const r=`${window.location.origin}/reset-password`,{data:i,error:n}=await S.functions.invoke("convidar-usuario",{body:{email:a,nome:t.nome||"",redirectTo:r}});if(!n)return{tipo:"convite",mensagem:(i==null?void 0:i.message)||"Convite enviado para o e-mail do usuário."};const{error:c}=await S.auth.resetPasswordForEmail(a,{redirectTo:r});if(c)throw c;return{tipo:"reset",mensagem:"Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha."}}async function Hn({userId:t,email:a,nome:r}){const i=String(r||"").trim(),n=String(a||"").trim().toLowerCase();if(!t)throw new Error("Usuário não identificado.");if(i.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");const c=[],{error:l}=await S.from("profiles").upsert({id:t,name:i},{onConflict:"id"});l&&c.push(l);const{error:u}=await S.from("df_usuarios_empresas").update({nome:i}).eq("user_id",t);if(u&&c.push(u),n){const{error:h}=await S.from("df_usuarios_empresas").update({nome:i}).eq("email",n);h&&c.push(h)}if(c.length>0)throw c[0];return{nome:i}}async function Gn(t){if(!t)return[];const{data:a,error:r}=await S.from("df_usuarios_filiais").select("id, empresa_id, usuario_id, filial_id, created_at").eq("empresa_id",t);if(r)throw r;return a||[]}async function Yn({empresaId:t,usuario:a,filialIds:r}){if(!t)throw new Error("Empresa não identificada.");if(!(a!=null&&a.id))throw new Error("Usuário da empresa não identificado.");const i=Array.from(new Set((r||[]).filter(Boolean))),{error:n}=await S.from("df_usuarios_filiais").delete().eq("empresa_id",t).eq("usuario_id",a.id);if(n)throw n;if(i.length===0)return[];const c=i.map(h=>({empresa_id:t,usuario_id:a.id,filial_id:h})),{data:l,error:u}=await S.from("df_usuarios_filiais").insert(c).select("id, empresa_id, usuario_id, filial_id, created_at");if(u)throw u;return l||[]}function Jn({styles:t,nomeEmpresa:a,navegarPara:r,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,canSwitchCompany:c=!1,empresasDisponiveis:l=[],empresaId:u="",trocarEmpresaAtiva:h,trocandoEmpresa:k=!1,nomeUsuario:j,nomeUsuarioAtual:y,abrirPerfilUsuario:C}){const w=c&&l.length>0,R=s.useMemo(()=>l.find($=>$.id===u),[u,l]),E=s.useMemo(()=>{const $=y||(typeof j=="function"?j():"");return`Meu perfil${$?`: ${$}`:""}`},[j,y]),_=s.useCallback(()=>{r("dashboard")},[r]),P=s.useCallback(()=>{n($=>!$)},[n]),B=s.useCallback(()=>{C==null||C()},[C]);return e.jsxs("section",{className:"no-print top-shell top-shell-clean",style:t.usuarioTopo,children:[e.jsx("div",{className:"top-shell-context",children:e.jsxs("button",{className:"top-shell-logo",style:t.logoMarca,onClick:_,title:"Ir para o dashboard",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:t.logoImagem}),e.jsxs("span",{children:[e.jsx("strong",{children:a||"Dona Flor"}),e.jsx("small",{children:"Gestão Financeira"})]})]})}),e.jsxs("div",{className:"top-shell-actions",style:t.usuarioAcoes,children:[w&&(l.length>1?e.jsxs("label",{className:"company-switcher",title:"Trocar empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("select",{value:u||"",disabled:k,onChange:$=>h==null?void 0:h($.target.value),"aria-label":"Empresa ativa",children:l.map($=>e.jsx("option",{value:$.id,children:$.nome||$.id},$.id))})]}):e.jsxs("div",{className:"company-switcher company-switcher-static",title:"Empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("strong",{children:(R==null?void 0:R.nome)||a||"Empresa ativa"})]})),e.jsx("button",{type:"button",className:"top-user-profile-button top-user-profile-icon",title:E,onClick:B,"aria-label":"Abrir meu perfil",children:e.jsx("span",{"aria-hidden":"true",children:"👤"})}),e.jsx("button",{className:"mobile-menu-trigger",style:t.btnMenuTopo,onClick:P,"aria-expanded":i,children:"☰"})]})]})}const Kn=s.memo(Jn),Qn=s.memo(function({tela:a,icon:r,label:i,telaAtual:n,sidebarCompacta:c,navegarPara:l,onPreloadRoute:u}){const h=a&&n===a;return e.jsxs("button",{className:h?"active":"",title:i,onPointerEnter:()=>u==null?void 0:u(a),onFocus:()=>u==null?void 0:u(a),onClick:()=>l(a),children:[e.jsx("span",{className:"menu-icon",children:r}),!c&&e.jsx("span",{className:"menu-text",children:i})]})}),Xn=s.memo(function({id:a,titulo:r,children:i,sidebarCompacta:n,gruposMenu:c,toggleGrupoMenu:l}){return e.jsxs("div",{className:"sidebar-group-clean",children:[e.jsxs("button",{className:"sidebar-group-toggle",onClick:()=>l(a),title:r,children:[e.jsx("span",{children:n?"•":r}),!n&&e.jsx("strong",{children:c[a]?"−":"+"})]}),(n||c[a])&&e.jsx("nav",{className:"desktop-sidebar-nav",children:i})]})});function Zn({sidebarCompacta:t,setSidebarCompacta:a,nomeUsuario:r,nomeUsuarioAtual:i,normalizarPerfil:n,perfilUsuario:c,menuSections:l,telaAtual:u,navegarPara:h,gruposMenu:k,toggleGrupoMenu:j,sairDoSistema:y,onPreloadRoute:C}){const w=s.useMemo(()=>i||(typeof r=="function"?r():r),[r,i]),R=s.useMemo(()=>n(c||"usuário"),[n,c]),E=s.useCallback(()=>{a(_=>!_)},[a]);return e.jsxs("aside",{className:`desktop-sidebar no-print ${t?"compacta":""}`,children:[e.jsxs("div",{className:"desktop-sidebar-brand sidebar-brand-clean",title:"DF Gestão Financeira",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira"}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:"DF Gestão"}),e.jsx("small",{children:"Painel financeiro"})]})]}),e.jsxs("div",{className:"desktop-sidebar-user sidebar-user-clean",title:`${w} • ${R}`,children:[e.jsx("span",{className:"sidebar-user-avatar",children:String(w||"U").slice(0,1).toUpperCase()}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:w}),e.jsx("small",{children:R})]})]}),e.jsx("button",{className:"sidebar-collapse-btn sidebar-collapse-icon",onClick:E,title:t?"Expandir menu":"Recolher menu","aria-label":t?"Expandir menu":"Recolher menu",children:e.jsx("span",{className:"sidebar-collapse-arrow",children:t?"→":"←"})}),e.jsx("div",{className:"desktop-sidebar-scroll",children:l.map(_=>e.jsx(Xn,{id:_.id,titulo:_.titulo,sidebarCompacta:t,gruposMenu:k,toggleGrupoMenu:j,children:_.items.map(P=>e.jsx(Qn,{tela:P.tela,icon:P.icon,label:P.label,telaAtual:u,sidebarCompacta:t,navegarPara:h,onPreloadRoute:C},P.tela))},_.id))}),e.jsx("div",{className:"desktop-sidebar-spacer"}),e.jsx("nav",{className:"desktop-sidebar-nav sidebar-exit",children:e.jsxs("button",{onClick:y,title:"Sair",children:[e.jsx("span",{className:"menu-icon",children:"🚪"}),!t&&e.jsx("span",{children:"Sair"})]})})]})}const ts=s.memo(Zn),es={margin:"12px 0 18px",padding:"12px 14px",border:"1px solid rgba(20, 184, 166, 0.22)",borderRadius:18,background:"rgba(240, 253, 250, 0.9)",display:"grid",gap:8},as={fontSize:11,fontWeight:900,color:"#0f766e",textTransform:"uppercase",letterSpacing:".08em"},os={width:"100%",border:"0",background:"transparent",color:"#111827",fontWeight:900,fontSize:15,outline:"none"},rs={color:"#111827",fontSize:15},is=s.memo(function({item:a,styles:r,navegarPara:i,onPreloadRoute:n}){const c=s.useCallback(()=>{i(a.tela)},[a.tela,i]),l=s.useCallback(()=>{n==null||n(a.tela)},[a.tela,n]);return e.jsxs("button",{type:"button",style:r.menuNavItem,onPointerEnter:l,onFocus:l,onTouchStart:l,onClick:c,children:[e.jsx("span",{children:a.icon}),e.jsxs("div",{children:[e.jsx("strong",{children:a.label}),e.jsx("small",{children:a.desc})]})]})});function ns({visible:t,styles:a,setMenuNavegacaoAberto:r,nomeUsuario:i,nomeUsuarioAtual:n,normalizarPerfil:c,perfilUsuario:l,menuSections:u,navegarPara:h,sairDoSistema:k,canSwitchCompany:j=!1,empresasDisponiveis:y=[],empresaId:C="",trocarEmpresaAtiva:w,trocandoEmpresa:R=!1,abrirPerfilUsuario:E,onPreloadRoute:_}){const P=j&&y.length>0,B=s.useMemo(()=>y.find(T=>T.id===C),[C,y]),$=s.useMemo(()=>n||(typeof i=="function"?i():i)||"usuário",[i,n]),L=s.useMemo(()=>c(l||"usuário"),[c,l]),U=s.useCallback(()=>{r(!1)},[r]),I=s.useCallback(()=>{U(),E==null||E()},[E,U]),ct=s.useCallback(T=>{w==null||w(T.target.value),U()},[U,w]);return t?e.jsx("div",{className:"no-print mobile-menu-backdrop",style:a.menuBackdrop,onClick:U,onTouchMove:T=>T.preventDefault(),children:e.jsxs("div",{className:"mobile-menu-panel",style:a.menuNavegacao,role:"dialog","aria-label":"Menu de navegação",onClick:T=>T.stopPropagation(),onWheel:T=>T.stopPropagation(),onTouchMove:T=>T.stopPropagation(),children:[e.jsxs("div",{style:a.menuPerfil,children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:a.menuPerfilIcone}),e.jsxs("div",{children:[e.jsx("strong",{children:$}),e.jsx("small",{children:L})]})]}),P&&e.jsxs("div",{className:"mobile-company-switcher",style:es,children:[e.jsx("span",{style:as,children:"Empresa ativa"}),y.length>1?e.jsx("select",{value:C||"",disabled:R,onChange:ct,"aria-label":"Empresa ativa",style:os,children:y.map(T=>e.jsx("option",{value:T.id,children:T.nome||T.id},T.id))}):e.jsx("strong",{style:rs,children:(B==null?void 0:B.nome)||"Empresa ativa"})]}),e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:I,children:[e.jsx("span",{children:"👤"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Meu perfil"}),e.jsx("small",{children:"Editar nome do usuário"})]})]}),u.map((T,q)=>e.jsxs("details",{className:"mobile-menu-group",open:q===0,children:[e.jsx("summary",{children:T.titulo}),T.items.map(O=>e.jsx(is,{item:O,styles:a,navegarPara:h,onPreloadRoute:_},O.tela)),T.id==="sistema"&&e.jsxs("button",{type:"button",style:a.menuSairItem,onClick:k,children:[e.jsx("span",{children:"🚪"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Sair"}),e.jsx("small",{children:"Encerrar sessão"})]})]})]},T.id))]})}):null}const ss=s.memo(ns);function ds({styles:t,menuAberto:a,setMenuAberto:r,abrirNovaConta:i,abrirNovaNota:n}){return e.jsxs(e.Fragment,{children:[a&&e.jsxs("div",{className:"global-fab-menu",style:t.menuFab,onClick:c=>c.stopPropagation(),children:[e.jsxs("button",{style:t.menuItem,type:"button",onClick:c=>{c.preventDefault(),c.stopPropagation(),i()},"aria-label":"Nova conta",children:[e.jsx("span",{style:t.menuItemIcone,children:"💰"}),e.jsx("span",{style:t.menuItemTexto,children:"Nova conta"})]}),e.jsxs("button",{style:t.menuItem,type:"button",onClick:c=>{c.preventDefault(),c.stopPropagation(),n()},"aria-label":"Nova nota",children:[e.jsx("span",{style:t.menuItemIcone,children:"📝"}),e.jsx("span",{style:t.menuItemTexto,children:"Nova nota"})]})]}),e.jsx("button",{className:"global-fab",style:t.fab,onClick:c=>{c.stopPropagation(),r(!a)},children:a?"×":"+"})]})}function Re({styles:t,titulo:a,aberto:r,onClick:i}){const n=String(a||"").split(" "),c=n[0]||"",l=n.slice(1).join(" ")||a;return e.jsxs("button",{style:t.headerExpansivel,onClick:i,children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:10,color:"#0f172a",fontWeight:900,lineHeight:1.1},children:[e.jsx("span",{style:{fontSize:24,lineHeight:1},children:c}),e.jsx("span",{children:l})]}),e.jsx("strong",{style:{color:"#0f172a"},children:r?"−":"+"})]})}const ai=s.createContext(null),yo="df_empresa_ativa";function cs(){if(typeof window>"u")return null;try{return JSON.parse(window.localStorage.getItem(yo)||"null")}catch{return null}}function Or(t){if(!(typeof window>"u")){if(!(t!=null&&t.id)){window.localStorage.removeItem(yo);return}window.localStorage.setItem(yo,JSON.stringify(t))}}const ls={sucesso:"Sucesso",success:"Sucesso",erro:"Atenção",error:"Atenção",alerta:"Atenção",warning:"Atenção",info:"Aviso"};function ps(t){return t==="success"?"sucesso":t==="error"?"erro":t==="warning"?"alerta":t||"info"}function ms({children:t}){const[a,r]=s.useState(!1),[i,n]=s.useState(()=>cs()),[c,l]=s.useState([]),[u,h]=s.useState(null),k=s.useRef(null),j=s.useCallback(_=>{const P=_!=null&&_.id?{id:_.id,nome:_.nome||"",perfil:_.perfil||"operador"}:null;n(P),Or(P)},[]),y=s.useCallback(()=>{n(null),Or(null)},[]),C=s.useCallback(()=>{k.current&&(window.clearTimeout(k.current),k.current=null),h(null)},[]),w=s.useCallback((_,P="info",B={})=>{if(!_)return;const $=ps(P),L=B.duration??5200;k.current&&window.clearTimeout(k.current),h({id:Date.now(),message:String(_),type:$,title:B.title||ls[$]||"Aviso"}),k.current=window.setTimeout(()=>{h(null),k.current=null},L)},[]),R=s.useCallback(async _=>{r(!0);try{return await _()}finally{r(!1)}},[]),E=s.useMemo(()=>({globalLoading:a,setGlobalLoading:r,empresaAtiva:i,empresaId:(i==null?void 0:i.id)||null,perfilEmpresaAtiva:(i==null?void 0:i.perfil)||"",setEmpresaAtiva:j,limparEmpresaAtiva:y,empresasDisponiveis:c,setEmpresasDisponiveis:l,toast:u,showToast:w,hideToast:C,runWithLoading:R}),[a,i,c,u,w,C,R,j,y]);return e.jsx(ai.Provider,{value:E,children:t})}function oi(){const t=s.useContext(ai);if(!t)throw new Error("useApp deve ser usado dentro do AppProvider");return t}function us({onLogin:t}){const{showToast:a}=oi(),[r,i]=s.useState(""),[n,c]=s.useState(""),[l,u]=s.useState(!1);async function h(k){if(k.preventDefault(),!r||!n){a("Informe e-mail e senha","erro");return}const j=$n();if(j){a(j,"erro");return}u(!0);const{data:y,error:C}=await S.auth.signInWithPassword({email:r,password:n});if(u(!1),C){a("E-mail ou senha inválidos","erro");return}const{error:w}=await S.rpc("vincular_usuario_logado");w&&console.warn("Não foi possível executar vínculo automático:",w.message),t(y.user)}return e.jsx("div",{style:te.page,children:e.jsxs("form",{style:te.card,onSubmit:h,children:[e.jsx("h1",{style:te.titulo,children:"Dona Flor Financeiro"}),e.jsx("p",{style:te.subtitulo,children:"Acesse sua conta para continuar"}),e.jsx("input",{style:te.input,type:"email",placeholder:"E-mail",value:r,onChange:k=>i(k.target.value)}),e.jsx("input",{style:te.input,type:"password",placeholder:"Senha",value:n,onChange:k=>c(k.target.value)}),e.jsx("button",{style:te.botao,disabled:l,children:l?"Entrando...":"Entrar"}),e.jsx("small",{style:te.ajuda,children:"Login seguro via Supabase Auth."})]})})}const te={page:{minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Arial"},card:{width:"100%",maxWidth:360,background:"#fff",borderRadius:18,padding:20,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:10},titulo:{margin:0,fontSize:26},subtitulo:{margin:"0 0 10px",color:"#666",fontSize:14},input:{width:"100%",padding:12,borderRadius:10,border:"1px solid #ccc",boxSizing:"border-box",fontSize:15},botao:{width:"100%",padding:12,borderRadius:10,border:"none",background:"#198754",color:"#fff",fontWeight:"bold",fontSize:15},ajuda:{color:"#666",textAlign:"center",marginTop:8}};function ri({toast:t,onClose:a}){if(!t)return null;const r=t.type||"info",i=e.jsxs("div",{className:`app-toast app-toast-${r} app-toast-global`,role:r==="erro"?"alert":"status","aria-live":r==="erro"?"assertive":"polite",onClick:a,children:[e.jsx("div",{className:`app-toast-icon app-toast-icon-${r}`,children:r==="erro"?"!":r==="sucesso"?"✓":r==="alerta"?"!":"i"}),e.jsxs("div",{className:"app-toast-content",children:[e.jsx("strong",{children:t.title||(r==="erro"?"Atenção":"Aviso")}),e.jsx("span",{children:t.message})]}),e.jsx("button",{type:"button",className:"app-toast-close","aria-label":"Fechar aviso",onClick:n=>{n.stopPropagation(),a==null||a()},children:"×"})]});return typeof document>"u"?i:Rn.createPortal(i,document.body)}function fs({carregandoAuth:t,usuarioLogado:a,erroEmpresa:r,styles:i,setUsuarioLogado:n,globalToast:c,hideToast:l,sairDoSistema:u,children:h}){return t?e.jsx("div",{style:i.page,children:e.jsx("h2",{children:"Carregando..."})}):a?r?e.jsxs("div",{style:i.page,children:[e.jsx("h2",{children:"⚠️ Empresa não vinculada"}),e.jsx("p",{children:r}),e.jsx("button",{style:i.btnSair,onClick:u,children:"Sair"})]}):h:e.jsxs(e.Fragment,{children:[e.jsx(us,{onLogin:n}),e.jsx(ri,{toast:c,onClose:l})]})}function ko({children:t}){return e.jsx(s.Suspense,{fallback:e.jsx("div",{className:"app-route-loading",children:"Carregando módulo..."}),children:t})}function gs({styles:t,editandoContaId:a,descricao:r,setDescricao:i,valor:n,setValor:c,dataVencimento:l,setDataVencimento:u,centroCustoId:h,setCentroCustoId:k,centros:j,filialId:y,setFilialId:C,filiais:w,observacaoConta:R,setObservacaoConta:E,contaRecorrente:_,setContaRecorrente:P,tipoRecorrencia:B,setTipoRecorrencia:$,diaVencimentoRecorrencia:L,setDiaVencimentoRecorrencia:U,fecharConta:I,salvarConta:ct,primeiraLetraMaiuscula:T,limitarDataInput:q,formatarDataParaBanco:O,fecharNota:St,setModalCentro:bt,setMenuAberto:ht,setMenuNavegacaoAberto:$t}){function H(){I(),St(),bt(!1),ht(!1),$t(!1)}return e.jsx("div",{style:t.overlay,onClick:H,children:e.jsxs("div",{style:t.modal,onClick:M=>M.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Conta":"Nova Conta"}),e.jsx("input",{style:t.inputModal,placeholder:"Descrição",value:r,onChange:M=>i(T(M.target.value))}),e.jsx("input",{style:t.inputModal,placeholder:"Valor. Ex: 150,90",value:n,onChange:M=>c(M.target.value)}),e.jsx("input",{style:t.inputModal,type:"date",value:l,onChange:M=>u(q(M.target.value))}),e.jsxs("select",{style:t.inputModal,value:y,onChange:M=>C(M.target.value),children:[e.jsx("option",{value:"",children:"Filial / unidade"}),(w||[]).map(M=>e.jsx("option",{value:M.id,children:M.nome},M.id))]}),e.jsxs("select",{style:t.inputModal,value:h,onChange:M=>k(M.target.value),children:[e.jsx("option",{value:"",children:"Centro de custo"}),j.map(M=>e.jsx("option",{value:M.id,children:M.nome},M.id))]}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Observação ou comentário da conta...",value:R,onChange:M=>E(T(M.target.value))}),e.jsxs("div",{className:"recurrence-box",style:t.blocoRecorrenciaConta,children:[e.jsxs("label",{className:"checkbox-row-fix",style:t.switchLinhaCompacta,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"🔁 Conta recorrente"}),e.jsx("small",{style:t.textoAjuda,children:"Ideal para aluguel, internet, sistema, mensalidades e contas fixas."})]}),e.jsx("input",{type:"checkbox",checked:_,onChange:M=>{const X=M.target.checked;P(X),X&&l&&U(String(Number(O(l).slice(8,10))))}})]}),_&&e.jsxs("div",{className:"recurrence-fields",children:[e.jsx("select",{style:t.inputModal,value:B,onChange:M=>$(M.target.value),children:e.jsx("option",{value:"mensal",children:"Mensal"})}),e.jsx("input",{style:t.inputModal,type:"number",min:"1",max:"31",placeholder:"Dia de vencimento mensal. Ex: 5",value:L||(l?String(Number(O(l).slice(8,10))):""),onChange:M=>U(M.target.value)}),e.jsx("small",{style:t.textoAjuda,children:"O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir."})]})]}),e.jsx("button",{style:t.btnSalvar,type:"button",onClick:M=>{M.preventDefault(),M.stopPropagation(),ct()},children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,type:"button",onClick:I,children:"Cancelar"})]})})}function xs({styles:t,editandoNotaId:a,tituloNota:r,setTituloNota:i,prioridadeNota:n,setPrioridadeNota:c,dataEventoNota:l,setDataEventoNota:u,conteudoNota:h,setConteudoNota:k,filialNotaId:j,setFilialNotaId:y,filiais:C,salvarNota:w,fecharNota:R,fecharConta:E,setModalCentro:_,setMenuAberto:P,setMenuNavegacaoAberto:B,primeiraLetraMaiuscula:$,limitarDataInput:L}){function U(){E(),R(),_(!1),P(!1),B(!1)}return e.jsx("div",{style:t.overlay,onClick:U,children:e.jsxs("div",{style:t.modal,onClick:I=>I.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Nota":"Nova Nota"}),e.jsx("input",{style:t.inputModal,placeholder:"Título",value:r,onChange:I=>i($(I.target.value))}),e.jsxs("select",{style:t.inputModal,value:n,onChange:I=>c(I.target.value),children:[e.jsx("option",{value:"normal",children:"Prioridade normal"}),e.jsx("option",{value:"urgente",children:"Urgente"}),e.jsx("option",{value:"critico",children:"Crítico"})]}),e.jsxs("select",{style:t.inputModal,value:j,onChange:I=>y(I.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(C||[]).map(I=>e.jsx("option",{value:I.id,children:I.nome},I.id))]}),e.jsx("input",{style:t.inputModal,type:"date",value:l,onChange:I=>u(L(I.target.value))}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Conteúdo...",value:h,onChange:I=>k(I.target.value)}),e.jsx("button",{style:t.btnSalvar,onClick:w,children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,onClick:R,children:"Cancelar"})]})})}function bs({styles:t,novoCentro:a,setNovoCentro:r,salvarCentro:i,centros:n,abrirConfirmacao:c,excluirCentro:l,fecharConta:u,fecharNota:h,setModalCentro:k,setMenuAberto:j,setMenuNavegacaoAberto:y}){function C(){u(),h(),k(!1),j(!1),y(!1)}return e.jsx("div",{style:t.overlay,onClick:C,children:e.jsxs("div",{style:t.modal,onClick:w=>w.stopPropagation(),children:[e.jsx("h3",{children:"Centros de Custo"}),e.jsx("input",{style:t.inputModal,placeholder:"Novo centro",value:a,onChange:w=>r(w.target.value),autoFocus:!0}),e.jsx("button",{style:t.btnSalvar,onClick:i,children:"Salvar Centro"}),n.map(w=>e.jsxs("div",{style:t.itemCentro,children:[e.jsx("span",{children:w.nome}),e.jsx("button",{style:t.btnMiniExcluir,onClick:()=>c({titulo:"Excluir centro de custo",mensagem:`Deseja excluir o centro ${w.nome}?`,textoConfirmar:"Excluir",tipo:"perigo",acao:()=>l(w.id)}),children:"excluir"})]},w.id)),e.jsx("button",{style:t.btnCancelar,onClick:()=>k(!1),children:"Fechar"})]})})}function hs({nome:t,setNome:a,email:r,salvando:i,onClose:n,onSave:c}){return e.jsx("div",{className:"profile-modal-backdrop",role:"presentation",onClick:n,children:e.jsxs("div",{className:"profile-modal-card",role:"dialog","aria-modal":"true","aria-label":"Meu perfil",onClick:l=>l.stopPropagation(),children:[e.jsxs("div",{className:"profile-modal-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Perfil"}),e.jsx("h2",{children:"Meu perfil"})]}),e.jsx("button",{type:"button",onClick:n,"aria-label":"Fechar",children:"×"})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"Nome de exibição"}),e.jsx("input",{value:t,onChange:l=>a(l.target.value),placeholder:"Digite seu nome",autoFocus:!0,maxLength:80})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"E-mail"}),e.jsx("input",{value:r||"",readOnly:!0})]}),e.jsxs("div",{className:"profile-modal-actions",children:[e.jsx("button",{type:"button",className:"profile-modal-cancel",onClick:n,disabled:i,children:"Cancelar"}),e.jsx("button",{type:"button",className:"profile-modal-save",onClick:c,disabled:i,children:i?"Salvando...":"Salvar perfil"})]})]})})}function ws({styles:t,modalConta:a,contaProps:r,modalNota:i,notaProps:n,modalCentro:c,centroProps:l,modalPerfilUsuario:u,perfilProps:h}){return e.jsxs(e.Fragment,{children:[a&&e.jsx(gs,{styles:t,...r}),i&&e.jsx(xs,{styles:t,...n}),c&&e.jsx(bs,{styles:t,...l}),u&&e.jsx(hs,{...h})]})}function vs({styles:t,confirmacao:a,fecharConfirmacao:r,executarConfirmacao:i}){return a!=null&&a.aberto?e.jsx("div",{style:t.overlayConfirmacao,children:e.jsxs("div",{style:t.modalConfirmacao,children:[e.jsx("div",{style:t.confirmacaoIcone,children:a.tipo==="perigo"?"⚠️":a.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:t.confirmacaoTitulo,children:a.titulo}),e.jsx("p",{style:t.confirmacaoTexto,children:a.mensagem}),e.jsxs("div",{style:t.confirmacaoAcoes,children:[e.jsx("button",{style:t.btnConfirmarCancelar,onClick:r,children:"Cancelar"}),e.jsx("button",{style:{...t.btnConfirmarAcao,background:a.tipo==="perigo"?"#dc3545":a.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:i,children:a.textoConfirmar})]})]})}):null}function ys({visible:t,message:a="Carregando..."}){return t?e.jsx("div",{className:"global-loader-overlay",role:"status","aria-live":"polite",children:e.jsxs("div",{className:"global-loader-card",children:[e.jsx("div",{className:"global-loader-spinner"}),e.jsx("span",{children:a})]})}):null}function ks({styles:t,globalLoading:a,globalToast:r,hideToast:i,confirmacao:n,fecharConfirmacao:c,executarConfirmacao:l}){return e.jsxs(e.Fragment,{children:[e.jsx(ys,{visible:a}),e.jsx(ri,{toast:r,onClose:i}),e.jsx(vs,{styles:t,confirmacao:n,fecharConfirmacao:c,executarConfirmacao:l})]})}function ee(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Gt(t){return`${Number(t||0).toFixed(1)}%`}function _s(t){return t>=84?"saudável":t>=68?"em atenção":"crítico"}function js({total:t=0,pago:a=0,pendente:r=0,vencido:i=0,taxaPago:n=0,taxaVencido:c=0,score:l=0,centroCritico:u=null,total7Dias:h=0,tendenciaMensal:k=[]}={}){if(!t)return{parecer:"A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.",liquidez:"Sem volume suficiente para medir liquidez operacional.",concentracao:"Sem centro de custo dominante identificado.",curtoPrazo:"Sem pressão de curto prazo detectada no recorte atual.",comportamento:"Histórico insuficiente para leitura comportamental.",anomalias:["Base financeira insuficiente para detectar anomalias."],drivers:["Ampliar base de contas e centros classificados."]};const j=_s(l),y=k||[],C=y[y.length-1],w=y[y.length-2],R=C&&w&&w.total?(C.total-w.total)/w.total*100:null,E=i>0?`O cenário financeiro está ${j}, com ${ee(i)} vencido representando ${Gt(c)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`:`O cenário financeiro está ${j}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`,_=n<35?`A liquidez operacional está pressionada: somente ${Gt(n)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`:n<70?`A liquidez exige acompanhamento: ${Gt(n)} do volume foi realizado, mas ainda existe margem relevante em aberto (${ee(r)}).`:`A liquidez apresenta leitura positiva, com ${Gt(n)} já realizado e menor dependência de liquidações futuras.`,P=u?u.peso>=60?`Há concentração elevada no centro ${u.nome}, que representa ${u.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`:`O centro ${u.nome} lidera o recorte com ${u.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`:"Não há concentração relevante por centro de custo no recorte atual.",B=h>0?`O curto prazo exige reserva de caixa de ${ee(h)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`:"Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.",$=R===null?"Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.":R>15?`O volume analisado cresceu ${Gt(R)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`:R<-15?`O volume analisado caiu ${Gt(Math.abs(R))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`:`O comportamento mensal está relativamente estável, com variação de ${Gt(R)} frente ao mês anterior.`,L=[];c>=40&&L.push(`Vencidos acima de 40% do recorte (${Gt(c)}), sinalizando risco operacional elevado.`),n<20&&L.push(`Realização abaixo de 20% (${Gt(n)}), indicando baixa conversão em pagamento/baixa.`),(u==null?void 0:u.peso)>=60&&L.push(`Concentração extrema no centro ${u.nome} (${u.peso}%).`),h>a&&h>0&&L.push(`Vencimentos de 7 dias (${ee(h)}) superam o realizado atual (${ee(a)}).`),L.length||L.push("Nenhuma anomalia crítica detectada no recorte atual.");const U=[i>0?`Reduzir vencidos de ${ee(i)} para aliviar o score.`:"Preservar cenário sem vencidos críticos.",u?`Revisar o centro ${u.nome}, principal driver do recorte.`:"Classificar centros para melhorar rastreabilidade.",h>0?`Proteger ${ee(h)} no caixa semanal.`:"Usar a folga de curto prazo para planejamento.",r>0?`Acelerar baixa/renegociação de ${ee(r)} em aberto.`:"Manter ritmo de realização."];return{parecer:E,liquidez:_,concentracao:P,curtoPrazo:B,comportamento:$,anomalias:L,drivers:U}}function me(t){return Number((t==null?void 0:t.valor)||0)}function jo(t,a){if(!t||a==="pago")return!1;const r=new Date;r.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<r}function Cs(t){if(!t)return 999;const a=new Date;a.setHours(0,0,0,0);const r=new Date(`${t}T00:00:00`);return r.setHours(0,0,0,0),Math.ceil((r-a)/(1e3*60*60*24))}function kt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function fo(t){return`${Number(t||0).toFixed(1)}%`}function Ss(t){var a;return((a=t==null?void 0:t.df_centros_custo)==null?void 0:a.nome)||(t==null?void 0:t.centro_custo_nome)||(t==null?void 0:t.centro)||"Sem centro"}function Es(t){return String((t==null?void 0:t.data_vencimento)||(t==null?void 0:t.created_at)||"").slice(0,7)||"Sem mês"}function Ns(t=[]){const a=new Map;return t.forEach(r=>{const i=Ss(r),n=a.get(i)||{nome:i,total:0,pago:0,pendente:0,vencido:0,quantidade:0},c=me(r);n.total+=c,n.quantidade+=1,r.status==="pago"?n.pago+=c:n.pendente+=c,jo(r.data_vencimento,r.status)&&(n.vencido+=c),a.set(i,n)}),Array.from(a.values()).map(r=>({...r,risco:r.total?Math.round(r.vencido/r.total*100):0,peso:0})).sort((r,i)=>i.total-r.total)}function zs(t=[]){const a=new Map;return t.forEach(r=>{const i=Es(r),n=a.get(i)||{mes:i,total:0,pago:0,pendente:0,vencido:0},c=me(r);n.total+=c,r.status==="pago"?n.pago+=c:n.pendente+=c,jo(r.data_vencimento,r.status)&&(n.vencido+=c),a.set(i,n)}),Array.from(a.values()).sort((r,i)=>r.mes.localeCompare(i.mes)).slice(-6)}function As({total:t,pendente:a,vencido:r,taxaVencido:i,contasVencidas:n,contasPendentes:c}){if(!t)return 82;let l=100;return l-=Math.min(42,i*1.1),l-=Math.min(22,a/t*18),l-=Math.min(16,n.length*4),l-=Math.min(10,c.length*.8),Math.max(0,Math.min(100,Math.round(l)))}function Ms(t){return t>=84?{label:"Saudável",tone:"success"}:t>=68?{label:"Atenção",tone:"warning"}:{label:"Crítico",tone:"danger"}}function Rs({total:t,pago:a,pendente:r,vencido:i,taxaPago:n,taxaVencido:c,score:l,status:u,centroCritico:h,vencemEm7Dias:k}){if(!t)return"Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.";const j=`O recorte atual soma ${kt(t)}, com ${kt(a)} realizado e ${kt(r)} ainda em aberto.`,y=i>0?`O principal ponto de atenção é o vencido de ${kt(i)}, equivalente a ${fo(c)} do volume analisado.`:"Não há vencido crítico identificado no recorte atual.",C=n>=70?`A eficiência de realização está positiva, com ${fo(n)} já liquidado.`:`A eficiência de realização está pressionada, com apenas ${fo(n)} liquidado.`,w=h?`O centro de maior peso é ${h.nome}, concentrando ${kt(h.total)}.`:"Não há concentração relevante por centro de custo.",R=k.length?`${k.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`:"Não há concentração expressiva de vencimentos nos próximos 7 dias.";return`${j} ${y} ${C} ${w} ${R} O score financeiro está em ${l}/100, classificado como ${u.label.toLowerCase()}.`}function Ps({contas:t=[],contasFiltradas:a=[]}={}){const r=a.length?a:t,i=r.reduce((q,O)=>q+me(O),0),n=r.filter(q=>q.status==="pago"),c=r.filter(q=>q.status!=="pago"),l=r.filter(q=>jo(q.data_vencimento,q.status)),u=n.reduce((q,O)=>q+me(O),0),h=c.reduce((q,O)=>q+me(O),0),k=l.reduce((q,O)=>q+me(O),0),j=i?u/i*100:0,y=i?k/i*100:0,C=Ns(r).map(q=>({...q,peso:i?Math.round(q.total/i*100):0})),w=C[0]||null,R=zs(r),E=c.filter(q=>{const O=Cs(q.data_vencimento);return O>=0&&O<=7}),_=E.reduce((q,O)=>q+me(O),0),P=As({total:i,pendente:h,vencido:k,taxaVencido:y,contasVencidas:l,contasPendentes:c}),B=Ms(P),$=[];k>0&&$.push({level:"Alta",title:"Regularizar contas vencidas",description:`${l.length} conta(s) em atraso somando ${kt(k)}.`,action:"Abrir Financeiro > Contas",impact:kt(k),tone:"danger"}),E.length&&$.push({level:"Alta",title:"Antecipar vencimentos próximos",description:`${E.length} obrigação(ões) vencem nos próximos 7 dias.`,action:"Priorizar caixa semanal",impact:kt(_),tone:"warning"}),w&&i&&w.total/i>=.35&&$.push({level:"Média",title:`Revisar centro ${w.nome}`,description:`Este centro concentra ${w.peso}% do valor analisado.`,action:"Abrir Relatórios",impact:kt(w.total),tone:"info"}),$.length||$.push({level:"Baixa",title:"Manter rotina de acompanhamento",description:"Nenhum risco operacional crítico foi identificado no recorte atual.",action:"Revisão semanal",impact:"Controle",tone:"success"});const L=Rs({total:i,pago:u,pendente:h,vencido:k,taxaPago:j,taxaVencido:y,score:P,status:B,centroCritico:w,vencemEm7Dias:E}),U=js({total:i,pago:u,pendente:h,vencido:k,taxaPago:j,taxaVencido:y,score:P,centroCritico:w,total7Dias:_,tendenciaMensal:R}),I=[k>0?`Priorizar a quitação ou renegociação dos vencidos (${kt(k)}) antes de novas despesas.`:"Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.",_>0?`Reservar ${kt(_)} para vencimentos dos próximos 7 dias.`:"Usar a folga dos próximos 7 dias para revisar centros de maior peso.",w?`Auditar lançamentos do centro ${w.nome}, que representa ${w.peso}% do recorte.`:"Classificar centros de custo para melhorar a qualidade analítica.",j<50?"Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.":"Preservar o ritmo de baixas e acompanhar desvios por centro."],ct={"Qual meu maior risco agora?":k>0?`O maior risco agora é o saldo vencido de ${kt(k)}, distribuído em ${l.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`:`O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${kt(_)} vencendo em até 7 dias.`,"Onde estou gastando mais?":w?`O maior peso financeiro está em ${w.nome}, com ${kt(w.total)} (${w.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`:"Ainda não há centro de custo dominante no recorte atual.","Como melhorar meu caixa?":`Priorize três movimentos: reduzir vencidos (${kt(k)}), reservar caixa para 7 dias (${kt(_)}) e revisar o centro de maior peso${w?` (${w.nome})`:""}.`,"Gerar resumo executivo":L},T=[U.liquidez,U.concentracao,U.curtoPrazo,U.comportamento];return{score:P,status:B,executiveSummary:L,narrativa:U,totals:{total:i,pago:u,pendente:h,vencido:k,taxaPago:j,taxaVencido:y,total7Dias:_},priorities:$.slice(0,4),insights:T,recomendacoes:I,rankingCentros:C.slice(0,5),tendenciaMensal:R,respostas:ct,quickQuestions:Object.keys(ct)}}const ii=s.createContext(null);function Fs({children:t,contas:a=[],contasFiltradas:r=[],navegarPara:i}){const[n,c]=s.useState(!1),[l,u]=s.useState(""),h=s.useMemo(()=>Ps({contas:a,contasFiltradas:r}),[a,r]),k=s.useCallback(()=>c(C=>!C),[]),j=s.useCallback(()=>c(!1),[]),y=s.useMemo(()=>({open:n,setOpen:c,toggle:k,close:j,intelligence:h,lastQuestion:l,setLastQuestion:u,navegarPara:i}),[j,h,l,i,n,k]);return e.jsx(ii.Provider,{value:y,children:t})}function ni(){const t=s.useContext(ii);if(!t)throw new Error("useCopilot deve ser usado dentro de CopilotProvider");return t}function si({children:t,contas:a,contasFiltradas:r,navegarPara:i}){return e.jsx(Fs,{contas:a,contasFiltradas:r,navegarPara:i,children:t})}function Ds(){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
            `})]})}function Ts({contas:t,contasFiltradas:a,navegarPara:r,menuAberto:i,setMenuAberto:n,pageStyle:c,children:l}){const u=s.useCallback(()=>{i&&n(!1)},[i,n]);return e.jsx(si,{contas:t,contasFiltradas:a,navegarPara:r,children:e.jsxs("div",{className:"app-page",style:c,onClick:u,children:[e.jsx(Ds,{}),l]})})}function Is({onPreload:t}){const{open:a,toggle:r,intelligence:i}=ni(),n=i.totals.vencido>0,c=s.useCallback(l=>{l.preventDefault(),l.stopPropagation(),r()},[r]);return a?null:e.jsxs("button",{className:`copilot-floating-button no-print ${n?"has-risk":""}`,type:"button",onPointerEnter:t,onFocus:t,onTouchStart:t,onClick:c,"aria-label":"Abrir Copilot IA",children:[e.jsx("span",{children:"✨"}),e.jsx("strong",{children:"Copilot IA"}),n&&e.jsx("i",{})]})}const Br=s.memo(Is);function Ur(){return e.jsx("style",{children:`
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
    `})}const $s={semEmpresa:"Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar."};function Ls(t){var a,r;return t!=null&&t.empresa_id?{empresaId:t.empresa_id,perfil:ae(t.perfil),nomeEmpresa:t.nome_empresa||((a=t.empresas)==null?void 0:a.nome)||((r=t.df_empresas)==null?void 0:r.nome)||"",origem:"df_usuarios_empresas"}:null}async function qs(){const{error:t}=await S.rpc("vincular_usuario_logado");t&&console.warn("Não foi possível executar vínculo automático:",t.message)}async function Os(t){if(!t)return null;const{data:a,error:r}=await S.from("df_usuarios_empresas").select("empresa_id, perfil").eq("user_id",t).limit(1);if(r)throw r;const i=Array.isArray(a)?a[0]:a;if(!(i!=null&&i.empresa_id))return null;let n="";const{data:c,error:l}=await S.from("df_empresas").select("nome").eq("id",i.empresa_id).limit(1);if(l)console.warn("Não foi possível carregar o nome da empresa ativa:",l.message);else{const u=Array.isArray(c)?c[0]:c;n=(u==null?void 0:u.nome)||""}return Ls({...i,nome_empresa:n})}async function Vr(t){if(!t)return"";const{data:a,error:r}=await S.from("profiles").select("name").eq("id",t).limit(1);if(r)return console.warn("Não foi possível carregar o nome do perfil:",r.message),"";const i=Array.isArray(a)?a[0]:a;return(i==null?void 0:i.name)||""}function Ut(t){if(!t)throw new Error("Empresa não identificada para esta operação.");return t}function di(t){if(!(t!=null&&t.empresa_id))throw new Error("Operação bloqueada: empresa_id ausente no payload.");return t}function Bs(t){return!Array.isArray(t)||t.length===0||t.forEach(di),t}function ue(t,a,r,i="*"){return Ut(r),t.from(a).select(i).eq("empresa_id",r)}function aa(t,a,r,i={}){di(r);let n=t.from(a).insert([r]);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function Us(t,a,r,i={}){Bs(r);let n=t.from(a).insert(r);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function oa(t,a,r,i,n){return Ut(i),t.from(a).update(n).eq("id",r).eq("empresa_id",i)}function Vs(t,a,r,i){return Ut(i),t.from(a).delete().eq("id",r).eq("empresa_id",i)}async function Ws(t,a){return Ut(a),ue(t,"df_contas",a,"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").or("excluido.is.null,excluido.eq.false").order("data_vencimento")}async function Hs(t,a,r,i){return Ut(a),ue(t,"df_contas",a,"id, descricao, valor, data_vencimento, recorrencia_id, excluido, excluido_em").gte("data_vencimento",r).lte("data_vencimento",i)}async function Gs(t,a){return Ut(a),ue(t,"df_contas_recorrentes",a).eq("ativo",!0)}async function Ys(t,a,r){if(!a)return null;Ut(r);const{data:i,error:n}=await t.from("df_centros_custo").select("id").eq("id",a).eq("empresa_id",r).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function Js(t,a,r){if(!a)return null;Ut(r);const{data:i,error:n}=await t.from("df_filiais").select("id").eq("id",a).eq("empresa_id",r).eq("ativo",!0).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function Ks(t,a){return Us(t,"df_contas",a,{select:"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)"})}async function Qs(t,a){return aa(t,"df_contas",a,{select:!0})}async function Da(t,a,r,i){return oa(t,"df_contas",a,r,i)}async function Xs(t,a,r){return Ut(r),ue(t,"df_contas_recorrentes",r).eq("id",a).maybeSingle()}async function Zs(t,a,r){return Ut(a),ue(t,"df_contas_recorrentes",a).eq("ativo",!0).eq("dia_vencimento",r).order("created_at",{ascending:!1})}async function Wr(t,a){const r=await aa(t,"df_contas_recorrentes",a,{select:!0});return li(r.error,a)?aa(t,"df_contas_recorrentes",pi(a),{select:!0}):r}async function ci(t,a,r,i){const n=await oa(t,"df_contas_recorrentes",a,r,i);return li(n.error,i)?oa(t,"df_contas_recorrentes",a,r,pi(i)):n}async function ta(t,a,r,i){return Da(t,a,r,{recorrencia_id:i})}async function td(t,a,r){return ci(t,a,r,{ativo:!1})}async function Hr(t,a,r,i){return Da(t,a,r,{status:i})}async function ed(t,a,r){return Da(t,a,r,{excluido:!0,excluido_em:new Date().toISOString()})}function li(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&ad(t))}function ad(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function pi(t){const{filial_id:a,...r}=t||{};return r}function ra(t){if(!t)return null;const a=String(t).slice(0,10);return new Date(a+"T00:00:00")}function Pe(t){const a=new Date;a.setHours(0,0,0,0);const r=ra(t);if(!r)return 999999;const i=r-a;return Math.round(i/(1e3*60*60*24))}function od(t){const a=ra(t);if(!a)return!1;const r=new Date;return a.getMonth()===r.getMonth()&&a.getFullYear()===r.getFullYear()}function Mt(t){return t?String(t).charAt(0).toUpperCase()+String(t).slice(1):""}function yt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Tt(t){return t?new Date(String(t).slice(0,10)+"T00:00:00").toLocaleDateString("pt-BR"):"-"}function Pa(t){if(!t)return null;const a=String(t).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(/^\d{2}\/\d{2}\/\d{4}$/.test(a)){const[r,i,n]=a.split("/");return`${n}-${i}-${r}`}return a.slice(0,10)}function go(t){if(!t)return"";const a=String(t);if(a.includes("-"))return a.slice(0,10);const r=a.replace(/\D/g,"").slice(0,8);return r.length<=2?r:r.length<=4?`${r.slice(0,2)}/${r.slice(2)}`:`${r.slice(0,2)}/${r.slice(2,4)}/${r.slice(4,8)}`}function rd(t){const a=String(t||"").trim();if(!a)return 0;const r=a.replace(/[^\d,.-]/g,""),n=r.includes(",")?r.replace(/\./g,"").replace(",","."):r.replace(/,/g,""),c=Number(n);return Number.isFinite(c)?c:0}function tc(t){return yt(t)}function ec(t){return Tt(t)}function id(t,a,r){const i=new Date(t,a,0).getDate(),n=Math.min(Number(r||1),i);return`${t}-${String(a).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function nd(t,a,r){if(!(t!=null&&t.ativo)||(t.tipo_recorrencia||t.frequencia||"mensal")!=="mensal")return!1;const i=t.data_inicio?ra(t.data_inicio):null;if(!i)return!0;const n=new Date(a,r-1,1),c=new Date(a,r,0);return i<=c&&n>=new Date(i.getFullYear(),i.getMonth(),1)}function sd(t){var r;const a=((r=t==null?void 0:t.df_contas_recorrentes)==null?void 0:r.tipo_recorrencia)||(t==null?void 0:t.tipo_recorrencia)||"";return String(a||"mensal")}function dd(t){const a=String(t||"mensal").toLowerCase();return{mensal:"Mensal",semanal:"Semanal",anual:"Anual",quinzenal:"Quinzenal"}[a]||Mt(a)}function cd(){const[t,a]=s.useState([]),[r,i]=s.useState([]),[n,c]=s.useState(""),[l,u]=s.useState("todas"),[h,k]=s.useState(""),[j,y]=s.useState(""),[C,w]=s.useState(""),[R,E]=s.useState(""),[_,P]=s.useState(""),[B,$]=s.useState(!0),[L,U]=s.useState(!1),[I,ct]=s.useState(null),[T,q]=s.useState(""),[O,St]=s.useState(""),[bt,ht]=s.useState(""),[$t,H]=s.useState(""),[M,X]=s.useState(""),[lt,et]=s.useState(""),[dt,Q]=s.useState(!1),[Rt,fe]=s.useState(!1),[ia,ge]=s.useState(!1),[na,xe]=s.useState("1"),[Fe,be]=s.useState(!1),[De,he]=s.useState("mensal"),[Te,we]=s.useState(""),[Yt,oe]=s.useState(null);function sa(){ct(null),q(""),St(""),ht(""),H(""),X(""),et(""),Q(!1),fe(!1),ge(!1),xe("1"),be(!1),he("mensal"),we(""),oe(null)}async function da(G,z,F){return F?Ys(G,F,z):null}async function ca(G,z,F){return F?Js(G,F,z):null}async function Ia({supabase:G,empresaAtual:z,contasAtuais:F,configWhatsapp:W,configEmail:pt,configPush:Z,diasAlertaContas:gt,diasAvisoPadrao:wt}){const at=new Date,mt=at.getFullYear(),ot=at.getMonth()+1,{data:Et,error:Lt}=await Gs(G,z);if(Lt)return console.warn("Não foi possível carregar contas recorrentes:",Lt.message),F;const Le=`${mt}-${String(ot).padStart(2,"0")}-01`,qe=`${mt}-${String(ot).padStart(2,"0")}-${String(new Date(mt,ot,0).getDate()).padStart(2,"0")}`,{data:ve,error:ye}=await Hs(G,z,Le,qe);ye&&console.warn("Não foi possível validar contas recorrentes existentes:",ye.message);const re=Array.isArray(ve)?ve:F,Vt=[];for(const rt of Et||[]){if(!nd(rt,mt,ot))continue;const vt=id(mt,ot,rt.dia_vencimento);if(re.some(ut=>{const ft=rt.id&&ut.recorrencia_id===rt.id,st=String(ut.descricao||"").trim().toLowerCase()===String(rt.descricao||"").trim().toLowerCase();return ut.data_vencimento===vt&&(ft||st)}))continue;const Ft=await da(G,z,rt.centro_custo_id),nt=await ca(G,z,rt.filial_id);Vt.push({empresa_id:z,descricao:rt.descricao,valor:Number(rt.valor||0),data_vencimento:vt,vencimento:vt,centro_custo_id:Ft,filial_id:nt,observacao:rt.observacao||null,recorrencia_id:rt.id,status:"pendente",excluido:!1,enviar_whatsapp:W,enviar_email:pt,enviar_push:Z,dias_aviso:Number(gt||wt||1)})}if(Vt.length===0)return F;const{data:ke,error:Pt}=await Ks(G,Vt);return Pt?(console.warn("Não foi possível gerar contas recorrentes:",Pt.message),F):[...F,...ke||[]].sort((rt,vt)=>String(rt.data_vencimento||"").localeCompare(String(vt.data_vencimento||"")))}async function $a(G){const{supabase:z,empresaAtual:F,avisarErro:W,configWhatsapp:pt,configEmail:Z,configPush:gt,diasAlertaContas:wt,diasAvisoPadrao:at}=G;if(!F)return;const{data:mt,error:ot}=await Ws(z,F);if(ot){W(ot);return}const Lt=await Ia({supabase:z,empresaAtual:F,contasAtuais:mt||[],configWhatsapp:pt,configEmail:Z,configPush:gt,diasAlertaContas:wt,diasAvisoPadrao:at});a(Lt)}function La(G){const{setMenuAberto:z,setMenuNavegacaoAberto:F,configWhatsapp:W,configEmail:pt,configPush:Z,diasAvisoPadrao:gt}=G;z(!1),F(!1),sa(),Q(W),fe(pt),ge(Z),xe(String(gt||1)),U(!0)}async function Ie({supabase:G,empresaId:z,conta:F,dataBanco:W,descricaoConta:pt}){if(!G||!z||!F)return null;if(F.recorrencia_id){const{data:ot,error:Et}=await Xs(G,F.recorrencia_id,z);if(!Et&&ot)return ot}const Z=Number(String(W||F.data_vencimento||"").slice(8,10));if(!Z)return null;const{data:gt,error:wt}=await Zs(G,z,Z);if(wt||!Array.isArray(gt))return null;const at=String(pt||F.descricao||"").trim().toLowerCase(),mt=Number(F.valor||0);return gt.find(ot=>{const Et=String(ot.descricao||"").trim().toLowerCase()===at,Lt=Number(ot.valor||0)===mt;return Et&&Lt})||null}async function la(G){const{conta:z,supabase:F,empresaId:W,diasAvisoPadrao:pt,formatarDataParaBanco:Z}=G,gt=Z(z.data_vencimento||""),wt=gt?String(Number(String(gt).slice(8,10))):"";ct(z.id),q(z.descricao||""),St(z.valor||""),ht(z.data_vencimento||""),H(z.centro_custo_id||""),X(z.filial_id||""),et(z.observacao||""),Q(z.enviar_whatsapp??!1),fe(z.enviar_email??!1),ge(z.enviar_push??!1),xe(String(z.dias_aviso??pt??1)),be(!!z.recorrencia_id),oe(z.recorrencia_id||null),he("mensal"),we(wt),U(!0);const at=await Ie({supabase:F,empresaId:W,conta:z,dataBanco:gt,descricaoConta:z.descricao});at&&(be(!0),oe(at.id),he(at.frequencia||at.tipo_recorrencia||"mensal"),we(String(at.dia_vencimento||wt||"")),!z.recorrencia_id&&at.id&&await ta(F,z.id,W,at.id))}function qa(){U(!1),sa()}async function pa(G){const{supabase:z,empresaId:F,mostrarAviso:W,configWhatsapp:pt,configEmail:Z,configPush:gt,diasAlertaContas:wt,diasAvisoPadrao:at,primeiraLetraMaiuscula:mt,converterValor:ot,formatarDataParaBanco:Et,erroEhSessaoExpirada:Lt,limparEstadoAutenticacao:Le,setUsuarioLogado:qe,buscarContas:ve,fecharConta:ye}=G;if(!F){W("Usuário sem empresa vinculada.","erro");return}if(!T||!O||!bt){W("Preencha descrição, valor e vencimento.","erro");return}const re=await da(z,F,$t),Vt=await ca(z,F,M),ke={descricao:mt(T.trim()),valor:ot(O),data_vencimento:Et(bt),vencimento:Et(bt),centro_custo_id:re,filial_id:Vt,observacao:lt.trim()||null,enviar_whatsapp:dt,enviar_email:Rt,enviar_push:ia,dias_aviso:Number(na||wt||at||1),empresa_id:F};let Pt;if(I){if(Pt=(await Da(z,I,F,ke)).error,!Pt){const vt=Et(bt),it=Number(Te||String(vt).slice(8,10));if(Fe){if(!it||it<1||it>31){W("Informe um dia válido para a recorrência.","erro");return}const Ft={empresa_id:F,descricao:mt(T.trim()),valor:ot(O),centro_custo_id:re,filial_id:Vt,tipo_recorrencia:De||"mensal",dia_vencimento:it,data_inicio:vt,ativo:!0};if(Yt){const{error:nt}=await ci(z,Yt,F,Ft);if(nt){W("A conta foi atualizada, mas a recorrência não foi salva: "+nt.message,"erro");return}const{error:ut}=await ta(z,I,F,Yt);if(ut){W("A recorrência foi atualizada, mas não foi vinculada à conta: "+ut.message,"erro");return}}else{const{data:nt,error:ut}=await Wr(z,Ft);if(ut){W("A conta foi atualizada, mas a recorrência não foi salva: "+ut.message,"erro");return}const ft=Array.isArray(nt)?nt[0]:nt;let st=ft==null?void 0:ft.id;if(!st){const Jt=await Ie({supabase:z,empresaId:F,conta:{descricao:mt(T.trim()),valor:ot(O),data_vencimento:vt},dataBanco:vt,descricaoConta:mt(T.trim())});st=Jt==null?void 0:Jt.id}if(!st){W("A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.","erro");return}const{error:Dt}=await ta(z,I,F,st);if(Dt){W("A recorrência foi criada, mas não foi vinculada à conta: "+Dt.message,"erro");return}oe(st),a(Jt=>Jt.map(Kt=>Kt.id===I?{...Kt,recorrencia_id:st}:Kt))}}else Yt&&(await td(z,Yt,F),await ta(z,I,F,null))}}else{const rt=await Qs(z,{...ke,status:"pendente",excluido:!1});if(Pt=rt.error,!Pt&&Fe){const vt=Et(bt),it=Number(Te||String(vt).slice(8,10));if(!it||it<1||it>31){W("Informe um dia válido para a recorrência.","erro");return}const{data:Ft,error:nt}=await Wr(z,{empresa_id:F,descricao:mt(T.trim()),valor:ot(O),centro_custo_id:re,filial_id:Vt,tipo_recorrencia:De||"mensal",dia_vencimento:it,data_inicio:vt,ativo:!0});if(nt)W("A conta foi criada, mas a recorrência não foi salva: "+nt.message,"erro");else{const ut=Array.isArray(Ft)?Ft[0]:Ft,ft=Array.isArray(rt.data)?rt.data[0]:rt.data;let st=ut==null?void 0:ut.id;if(!st&&(ft!=null&&ft.id)){const Dt=await Ie({supabase:z,empresaId:F,conta:ft,dataBanco:vt,descricaoConta:mt(T.trim())});st=Dt==null?void 0:Dt.id}if(st&&(ft!=null&&ft.id)){const{error:Dt}=await ta(z,ft.id,F,st);if(Dt){W("A recorrência foi criada, mas não foi vinculada à conta: "+Dt.message,"erro");return}}}}}if(Pt){Lt(Pt)?(await z.auth.signOut(),Le(),qe(null),W("Sua sessão expirou. Faça login novamente.","erro")):W(Pt.message,"erro");return}ye(),await ve(),W(I?"Conta atualizada com sucesso.":"Conta criada com sucesso.","sucesso")}async function Oa(G){const{supabase:z,id:F,empresaId:W,buscarContas:pt,mostrarAviso:Z}=G;await Hr(z,F,W,"pago"),await pt(),Z==null||Z("Conta marcada como paga.","sucesso")}async function $e(G){const{supabase:z,id:F,empresaId:W,buscarContas:pt,mostrarAviso:Z}=G;await Hr(z,F,W,"pendente"),await pt(),Z==null||Z("Conta voltou para pendente.","sucesso")}async function ma(G){const{supabase:z,id:F,empresaId:W,avisarErro:pt,buscarContas:Z,buscarLixeira:gt,mostrarAviso:wt}=G,{error:at}=await ed(z,F,W);if(at){pt(at);return}await Promise.all([Z(),gt()]),wt==null||wt("Conta enviada para a lixeira.","sucesso")}return{contas:t,setContas:a,contasLixeira:r,setContasLixeira:i,busca:n,setBusca:c,filtroStatus:l,setFiltroStatus:u,filtroCentro:h,setFiltroCentro:k,filtroFilial:j,setFiltroFilial:y,filtroMes:C,setFiltroMes:w,dataInicial:R,setDataInicial:E,dataFinal:_,setDataFinal:P,loading:B,setLoading:$,modalConta:L,setModalConta:U,editandoContaId:I,setEditandoContaId:ct,descricao:T,setDescricao:q,valor:O,setValor:St,dataVencimento:bt,setDataVencimento:ht,centroCustoId:$t,setCentroCustoId:H,filialId:M,setFilialId:X,observacaoConta:lt,setObservacaoConta:et,contaWhatsapp:dt,setContaWhatsapp:Q,contaEmail:Rt,setContaEmail:fe,contaPush:ia,setContaPush:ge,contaDiasAviso:na,setContaDiasAviso:xe,contaRecorrente:Fe,setContaRecorrente:be,tipoRecorrencia:De,setTipoRecorrencia:he,diaVencimentoRecorrencia:Te,setDiaVencimentoRecorrencia:we,recorrenciaContaId:Yt,setRecorrenciaContaId:oe,buscarContas:$a,abrirNovaConta:La,abrirEdicaoConta:la,fecharConta:qa,salvarConta:pa,marcarComoPago:Oa,voltarParaPendente:$e,excluirConta:ma}}async function ld(t,a){return ue(t,"df_notas",a).eq("excluido",!1).order("created_at",{ascending:!1})}async function pd(t,a){return ue(t,"df_notas",a).eq("excluido",!0).order("excluido_em",{ascending:!1})}async function md(t,a){const r=await aa(t,"df_notas",a);return mi(r.error,a)?aa(t,"df_notas",ui(a)):r}async function Ta(t,a,r,i){const n=await oa(t,"df_notas",a,r,i);return mi(n.error,i)?oa(t,"df_notas",a,r,ui(i)):n}async function ud(t,a,r){return Ta(t,a,r,{excluido:!0,excluido_em:new Date().toISOString()})}async function fd(t,a,r){return Ta(t,a.id,r,{concluida:!a.concluida})}async function gd(t,a,r){return Ta(t,a,r,{excluido:!1,excluido_em:null})}async function xd(t,a,r){return Vs(t,"df_notas",a,r)}function mi(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&bd(t))}function bd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function ui(t){const{filial_id:a,...r}=t||{};return r}function Gr(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}:${a.titulo||""}`).join("|")}function hd(t,a=[]){t((r=[])=>Gr(r)===Gr(a)?r:a)}function wd(){const[t,a]=s.useState([]),[r,i]=s.useState([]),[n,c]=s.useState(""),[l,u]=s.useState(!1),[h,k]=s.useState(null),[j,y]=s.useState(""),[C,w]=s.useState(""),[R,E]=s.useState("normal"),[_,P]=s.useState(""),[B,$]=s.useState("");function L(){k(null),y(""),w(""),E("normal"),P(""),$("")}async function U({supabase:H,empresaAtual:M,avisarErro:X}){if(!M)return;const{data:lt,error:et}=await ld(H,M);if(et){X(et);return}a(lt||[])}async function I({supabase:H,empresaAtual:M,avisarErro:X}){if(!M)return;const{data:lt,error:et}=await pd(H,M);if(et){X(et);return}hd(i,lt||[])}function ct({setMenuAberto:H,setMenuNavegacaoAberto:M}){H(!1),M(!1),L(),u(!0)}function T(H){k(H.id),y(H.titulo||""),w(H.conteudo||""),E(H.prioridade||"normal"),P(H.data_evento||""),$(H.filial_id||""),u(!0)}function q(){u(!1),L()}async function O({supabase:H,empresaId:M,mostrarAviso:X,avisarErro:lt,buscarNotas:et}){if(!M){X("Usuário sem empresa vinculada.","erro");return}if(!j.trim()){X("Digite o título da nota.","erro");return}const dt={titulo:Mt(j.trim()),conteudo:C.trim(),prioridade:R||"normal",data_evento:_||null,concluida:!1,empresa_id:M,filial_id:B||null};let Q;if(h?Q=(await Ta(H,h,M,dt)).error:Q=(await md(H,dt)).error,Q){lt(Q);return}q(),await et(),X(h?"Nota atualizada com sucesso.":"Nota criada com sucesso.","sucesso")}async function St({supabase:H,id:M,empresaId:X,avisarErro:lt,buscarNotas:et,buscarLixeira:dt,mostrarAviso:Q}){const{error:Rt}=await ud(H,M,X);if(Rt){lt(Rt);return}await Promise.all([et(),dt()]),Q==null||Q("Nota enviada para a lixeira.","sucesso")}async function bt({supabase:H,nota:M,empresaId:X,avisarErro:lt,buscarNotas:et,mostrarAviso:dt}){const{error:Q}=await fd(H,M,X);if(Q){lt(Q);return}await et(),dt==null||dt(M.concluida?"Nota reaberta.":"Nota concluída.","sucesso")}async function ht({supabase:H,id:M,empresaId:X,avisarErro:lt,buscarNotas:et,buscarLixeira:dt,mostrarAviso:Q}){const{error:Rt}=await gd(H,M,X);if(Rt){lt(Rt);return}await Promise.all([et(),dt()]),Q==null||Q("Nota restaurada com sucesso.","sucesso")}async function $t({supabase:H,nota:M,empresaId:X,avisarErro:lt,buscarLixeira:et,mostrarAviso:dt}){const{error:Q}=await xd(H,M.id,X);if(Q){lt(Q);return}await et(),dt==null||dt("Nota excluída definitivamente.","sucesso")}return{notas:t,setNotas:a,notasLixeira:r,setNotasLixeira:i,buscaNota:n,setBuscaNota:c,modalNota:l,setModalNota:u,editandoNotaId:h,setEditandoNotaId:k,tituloNota:j,setTituloNota:y,conteudoNota:C,setConteudoNota:w,prioridadeNota:R,setPrioridadeNota:E,dataEventoNota:_,setDataEventoNota:P,filialNotaId:B,setFilialNotaId:$,buscarNotas:U,buscarNotasLixeira:I,abrirNovaNota:ct,abrirEdicaoNota:T,fecharNota:q,salvarNota:O,excluirNota:St,alternarNotaConcluida:bt,restaurarNota:ht,excluirNotaDefinitivo:$t}}const Co="df_sessao_segura",vd=8*60*60*1e3,yd=30*60*1e3,kd=25*60*1e3;function xo(){try{return JSON.parse(localStorage.getItem(Co)||"{}")}catch{return{}}}function Yr(t){localStorage.setItem(Co,JSON.stringify(t))}function _d(){localStorage.removeItem(Co)}function jd({onClearAuthData:t,onSessionWarning:a,onShowMessage:r,onNavigateHome:i}={}){const n=s.useRef(!1),c=s.useRef(!1),[l,u]=s.useState(null),[h,k]=s.useState(!0),j=s.useCallback(()=>{const C=xo();Yr({inicio:C.inicio||Date.now(),ultimaAtividade:Date.now()}),n.current=!1},[]),y=s.useCallback(async(C,w="erro")=>{if(!c.current){c.current=!0,t==null||t(),u(null),k(!1),i==null||i();try{await S.auth.signOut()}finally{C&&(r==null||r(C,w)),window.setTimeout(()=>{c.current=!1},1200)}}},[t,i,r]);return s.useEffect(()=>{let C=!0;async function w(){try{const E=new Promise(B=>{window.setTimeout(()=>B({data:{session:null},error:new Error("Timeout ao validar sessão")}),8e3)}),{data:_,error:P}=await Promise.race([S.auth.getSession(),E]);if(!C)return;if(P||!(_!=null&&_.session)){t==null||t(),u(null);return}u(_.session.user)}catch(E){if(!C)return;console.warn("Falha ao validar sessão:",(E==null?void 0:E.message)||E),t==null||t(),u(null)}finally{C&&k(!1)}}w();const{data:R}=S.auth.onAuthStateChange((E,_)=>{k(!1),u((_==null?void 0:_.user)||null),_||t==null||t()});return()=>{C=!1,R.subscription.unsubscribe()}},[t]),s.useEffect(()=>{if(!l)return;const C=Date.now(),w=xo();Yr({inicio:w.inicio||C,ultimaAtividade:C});function R(){const P=xo(),B=Number(P.inicio||Date.now()),$=Number(P.ultimaAtividade||Date.now()),L=Date.now(),U=L-B,I=L-$;if(U>=vd){y("Sua sessão expirou por segurança. Faça login novamente.");return}if(I>=yd){y("Sua sessão foi encerrada por inatividade. Faça login novamente.");return}I>=kd&&!n.current&&(n.current=!0,a==null||a(j))}const E=["click","keydown","mousemove","scroll","touchstart"];E.forEach(P=>window.addEventListener(P,j,{passive:!0}));const _=window.setInterval(R,60*1e3);return()=>{E.forEach(P=>window.removeEventListener(P,j)),window.clearInterval(_)}},[y,a,j,l]),{usuarioLogado:l,setUsuarioLogado:u,carregandoAuth:h,setCarregandoAuth:k,encerrarSessao:y,registrarAtividadeSessao:j}}const Cd={aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null};function Sd(){const[t,a]=s.useState(!1),[r,i]=s.useState(""),[n,c]=s.useState(!1),[l,u]=s.useState(!1),[h,k]=s.useState(!0),[j,y]=s.useState(!0),[C,w]=s.useState(()=>typeof window>"u"?!0:window.innerWidth>=980),[R,E]=s.useState(!0),[_,P]=s.useState(!0),[B,$]=s.useState(!0),[L,U]=s.useState(!0),[I,ct]=s.useState(Cd),[T,q]=s.useState(null),[O,St]=s.useState([]),[bt,ht]=s.useState("");return{modalPerfilUsuario:t,setModalPerfilUsuario:a,nomePerfilEditando:r,setNomePerfilEditando:i,salvandoPerfilUsuario:n,setSalvandoPerfilUsuario:c,mostrarFiltros:l,setMostrarFiltros:u,mostrarContas:h,setMostrarContas:k,mostrarContasDashboard:j,setMostrarContasDashboard:y,mostrarNotas:C,setMostrarNotas:w,mostrarConfigNegocio:R,setMostrarConfigNegocio:E,mostrarConfigNotificacoes:_,setMostrarConfigNotificacoes:P,mostrarConfigCentros:B,setMostrarConfigCentros:$,mostrarConfigRecorrencias:L,setMostrarConfigRecorrencias:U,confirmacao:I,setConfirmacao:ct,arquivoImportacao:T,setArquivoImportacao:q,linhasImportacao:O,setLinhasImportacao:St,statusImportacao:bt,setStatusImportacao:ht}}const Ed={principal:!0,financeiro:!0,analise:!0,sistema:!0};function Nd(t="dashboard"){const[a,r]=s.useState(!1),[i,n]=s.useState(!1),[c,l]=s.useState(!1),[u,h]=s.useState(Ed),[k,j]=s.useState(t),y=s.useCallback(()=>{r(!1),n(!1)},[]),C=s.useCallback(w=>{var R;y(),s.startTransition(()=>{j(w)}),typeof window<"u"&&((R=window.history.state)==null?void 0:R.tela)!==w&&window.history.pushState({tela:w},"",window.location.href)},[y]);return s.useEffect(()=>{if(typeof window>"u")return;window.history.replaceState({tela:t},"",window.location.href);function w(R){var _;const E=((_=R.state)==null?void 0:_.tela)||t;y(),s.startTransition(()=>{j(E)})}return window.addEventListener("popstate",w),()=>window.removeEventListener("popstate",w)},[y,t]),s.useEffect(()=>{if(typeof window>"u")return;const w=document.body.style.overflow,R=document.documentElement.style.overflow,E=document.body.style.position,_=document.body.style.width,P=window.scrollY;return i&&(document.body.classList.add("mobile-nav-open"),document.documentElement.classList.add("mobile-nav-open"),document.body.style.overflow="hidden",document.documentElement.style.overflow="hidden",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.top=`-${P}px`),()=>{document.body.classList.remove("mobile-nav-open"),document.documentElement.classList.remove("mobile-nav-open"),document.body.style.overflow=w,document.documentElement.style.overflow=R,document.body.style.position=E,document.body.style.width=_,document.body.style.top="",i&&window.scrollTo(0,P)}},[i]),{menuAberto:a,setMenuAberto:r,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,sidebarCompacta:c,setSidebarCompacta:l,gruposMenu:u,setGruposMenu:h,telaAtual:k,setTelaAtualState:j,fecharMenus:y,navegarPara:C}}const Fa={MASTER:"master",ADMIN:"admin",GERENTE:"gerente",OPERADOR:"operador"},zd=new Set(["donafloradm@outlook.com"]);function _o(t){return String(t||"").trim().toLowerCase()}function Ad(t){const a=String(t).toLowerCase().trim();return["master","super_admin","superadmin","owner","dono"].includes(a)?Fa.MASTER:["admin","adm","administrador"].includes(a)?Fa.ADMIN:ae(a)}function Md(t){return!(!t||t.ativo===!1||t.status&&String(t.status).toLowerCase()!=="ativo")}function ea({perfilEmpresa:t="operador",master:a=null}={}){const r=ae(t),i=a!=null&&a.isMaster?Fa.MASTER:r;return{perfilEmpresa:r,perfilGlobal:i,isMaster:!!(a!=null&&a.isMaster),canManageUsers:!!(a!=null&&a.isMaster||r==="admin"),canAccessSettings:!!(a!=null&&a.isMaster||["admin","gerente"].includes(r)),canManageCompanies:!!(a!=null&&a.isMaster),canSwitchCompany:!!(a!=null&&a.isMaster)}}async function bo({userId:t,email:a,perfilEmpresa:r="operador"}={}){const i=_o(a),n=ea({perfilEmpresa:r});if(zd.has(i))return ea({perfilEmpresa:r,master:{isMaster:!0}});if(!t&&!i)return n;try{const{data:c,error:l}=await S.from("df_usuarios_master").select("*").limit(100);if(l)return console.warn("Não foi possível consultar df_usuarios_master:",l.message),n;const u=(c||[]).find(h=>{const k=t&&h.user_id&&h.user_id===t,j=i&&_o(h.email)===i;return(k||j)&&Md(h)});return u?ea({perfilEmpresa:r,master:{isMaster:!0,perfil:Ad(u.perfil||u.tipo||Fa.MASTER)}}):n}catch(c){return console.warn("Falha ao carregar permissões globais:",c.message),n}}async function Rd({isMaster:t}={}){if(!t)return[];const{data:a,error:r}=await S.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(r)throw r;return a||[]}async function Jr({userId:t,email:a,isMaster:r}={}){if(r)return Rd({isMaster:r});const i=_o(a);if(!t&&!i)return[];let n=S.from("df_usuarios_empresas").select("empresa_id, perfil, nome, email, user_id");t&&i?n=n.or(`user_id.eq.${t},email.eq.${i}`):t?n=n.eq("user_id",t):n=n.eq("email",i);const{data:c,error:l}=await n;if(l)throw l;const u=new Map;(c||[]).forEach(y=>{if(!(y!=null&&y.empresa_id))return;const C=ae(y.perfil),w=u.get(y.empresa_id);u.set(y.empresa_id,{id:y.empresa_id,nome:(w==null?void 0:w.nome)||"",perfil:(w==null?void 0:w.perfil)==="admin"?w.perfil:C})});const h=Array.from(u.keys());if(h.length===0)return[];const{data:k,error:j}=await S.from("df_empresas").select("id, nome, created_at").in("id",h).order("nome",{ascending:!0});if(j)throw j;return(k||[]).forEach(y=>{const C=u.get(y.id);C&&u.set(y.id,{...C,nome:y.nome||C.nome||"Empresa",created_at:y.created_at})}),Array.from(u.values()).sort((y,C)=>String(y.nome||"").localeCompare(String(C.nome||"")))}function Pd(){const[t,a]=s.useState(null),[r,i]=s.useState(!1),[n,c]=s.useState(""),[l,u]=s.useState(()=>ea()),[h,k]=s.useState("");return{empresaId:t,setEmpresaId:a,trocandoEmpresa:r,setTrocandoEmpresa:i,perfilUsuario:n,setPerfilUsuario:c,permissoesUsuario:l,setPermissoesUsuario:u,erroEmpresa:h,setErroEmpresa:k}}function Ot(t,a){if(!t||a==="pago")return!1;const r=new Date;r.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<r}function Kr(t){return t?String(t).slice(0,7):""}function Qr(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}`).join("|")}function Xr(t){if(!t)return 0;const a=new Date(t),i=new Date-a;return Math.max(0,Math.floor(i/(1e3*60*60*24)))}function Zr(){return!0}function Fd(t,a=[]){t((r=[])=>Qr(r)===Qr(a)?r:a)}function ho(t){const a=String((t==null?void 0:t.message)||t||"").toLowerCase();return a.includes("jwt")||a.includes("expired")||a.includes("unauthorized")||a.includes("session")}function fi(t){return String(t||"").trim().replace(/\s+/g," ")}function gi(t){const a=String(t||"").trim();if(!a)throw new Error("Empresa não identificada para gerenciar filiais.");return a}async function Dd(t){const a=gi(t),{data:r,error:i}=await S.from("df_filiais").select("id, empresa_id, nome, ativo, created_at").eq("empresa_id",a).order("nome",{ascending:!0});if(i)throw i;return r||[]}async function ac({empresaId:t,nome:a}){const r=gi(t),i=fi(a);if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:c}=await S.from("df_filiais").select("id, nome").eq("empresa_id",r).ilike("nome",i).limit(1);if(c)throw c;if(Array.isArray(n)&&n.length>0)throw new Error("Já existe uma filial com esse nome nesta empresa.");const{data:l,error:u}=await S.from("df_filiais").insert([{empresa_id:r,nome:i,ativo:!0}]).select("id, empresa_id, nome, ativo, created_at").single();if(u)throw u;return l}async function oc({filialId:t,nome:a}){const r=String(t||"").trim(),i=fi(a);if(!r)throw new Error("Filial não identificada.");if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:c}=await S.from("df_filiais").update({nome:i}).eq("id",r).select("id, empresa_id, nome, ativo, created_at").single();if(c)throw c;return n}async function rc({filialId:t,ativo:a}){const r=String(t||"").trim();if(!r)throw new Error("Filial não identificada.");const{data:i,error:n}=await S.from("df_filiais").update({ativo:!!a}).eq("id",r).select("id, empresa_id, nome, ativo, created_at").single();if(n)throw n;return i}const p={usuarioTopo:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",border:"1px solid #d8eee9",borderRadius:18,padding:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 10px 24px rgba(15,118,110,0.10)",position:"relative",zIndex:20},logoMarca:{display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",padding:0,textAlign:"left",color:"#064e3b"},logoIcone:{width:42,height:42,borderRadius:14,background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 0 0 1px #cfe8da"},logoImagem:{width:48,height:48,borderRadius:16,objectFit:"cover",background:"#0f766e",boxShadow:"0 8px 18px rgba(20,184,166,0.28)"},logoTexto:{display:"flex",flexDirection:"column",gap:2,lineHeight:1.05},usuarioAcoes:{display:"flex",alignItems:"center",gap:8},usuarioTexto:{display:"flex",flexDirection:"column",alignItems:"flex-end",fontSize:13,color:"#1f2937"},btnMenuTopo:{width:44,height:44,borderRadius:14,border:"1px solid #e5e7eb",background:"#ffffff",color:"#0f172a",fontSize:22,fontWeight:"bold",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 16px rgba(15,23,42,0.08)"},menuBackdrop:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.22)",zIndex:4e3,display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:"76px 12px 12px 12px"},menuNavegacao:{width:"min(360px, 94vw)",height:"auto",maxHeight:"calc(100dvh - 96px)",overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",background:"#ffffff",border:"1px solid #d8eee9",borderRadius:22,padding:14,display:"grid",gap:8,boxShadow:"0 24px 60px rgba(15,23,42,0.25)"},menuPerfil:{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:18,background:"linear-gradient(135deg, #ecfdf5, #f0fdfa)",color:"#064e3b",marginBottom:4},menuPerfilIcone:{width:46,height:46,borderRadius:16,objectFit:"cover",background:"#0f766e"},menuSecaoTitulo:{fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:800,color:"#6b7280",padding:"10px 8px 2px"},menuNavItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#f8faf9",border:"1px solid #edf1ef",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#064e3b"},menuSairItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#be123c",fontWeight:700},agendaResumoCard:{background:"#ffffff",border:"1px solid #dfe7e2",borderLeft:"5px solid #14b8a6",padding:14,borderRadius:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"grid",gap:10},agendaResumoGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,color:"#374151"},btnAgendaCompleta:{border:"none",borderRadius:10,background:"#14b8a6",color:"#fff",padding:"10px 12px",fontWeight:"bold"},uploadExcelBox:{border:"2px dashed #99f6e4",background:"#f0fdfa",borderRadius:16,padding:24,textAlign:"center",display:"grid",gap:6,color:"#0f766e",cursor:"pointer"},importDicasGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"},previewImportacao:{display:"grid",gap:8,marginBottom:12},previewLinha:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:10,display:"grid",gap:4},alertaSucesso:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:10,fontWeight:"bold"},btnSair:{background:"#fee2e2",color:"#ef4444",border:"none",padding:"8px 12px",borderRadius:8,fontWeight:"bold"},overlayConfirmacao:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:3e3},modalConfirmacao:{background:"#fff",borderRadius:18,padding:18,width:"100%",maxWidth:360,boxShadow:"0 12px 30px rgba(0,0,0,0.25)",textAlign:"center"},confirmacaoIcone:{fontSize:38,marginBottom:8},confirmacaoTitulo:{margin:"4px 0 8px",fontSize:20},confirmacaoTexto:{margin:"0 0 16px",color:"#444",lineHeight:1.4},confirmacaoAcoes:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},btnConfirmarCancelar:{border:"none",borderRadius:10,padding:11,background:"#6c757d",color:"#fff",fontWeight:"bold"},btnConfirmarAcao:{border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:"bold"},headerExpansivel:{width:"100%",background:"#fff",border:"1px solid #e5e5e5",borderRadius:14,padding:"12px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:20,fontWeight:"bold",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},page:{padding:16,maxWidth:700,margin:"auto",fontFamily:"Arial",background:"#f8fafc",minHeight:"100vh",paddingBottom:100},titulo:{fontSize:28,marginBottom:12},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:24},resumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},boxTotal:{background:"#fff",padding:12,borderRadius:14,display:"flex",flexDirection:"column",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},boxPago:{background:"#d4edda",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxPendente:{background:"#fff3cd",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxVencido:{background:"#f8d7da",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},filtrosBox:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:8,boxSizing:"border-box"},datas:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},filtros:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},filtro:{border:"1px solid #ccc",background:"#fff",padding:"7px 11px",borderRadius:10,fontWeight:800,cursor:"pointer"},filtroAtivo:{border:"none",background:"#0d6efd",color:"#fff",padding:"7px 11px",borderRadius:8},resumoFiltro:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:4,fontSize:14},cardConta:{padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},cardTopo:{display:"flex",justifyContent:"space-between",fontSize:18,marginBottom:4},cardInfo:{fontSize:13,opacity:.75},cardDashboard:{background:"#fff",padding:12,borderRadius:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},dashboardGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6,fontSize:13},cardConfiguracao:{background:"#fff",padding:14,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},switchLinha:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #eee"},configResumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,background:"#f8fafc",padding:10,borderRadius:10},cardAgenda:{background:"#fff",padding:12,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},itemAgenda:{background:"#f8fafc",padding:10,borderRadius:10,marginTop:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"},agendaDireita:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},textoAgenda:{display:"block",marginTop:5,color:"#444",fontWeight:"bold"},textoVencidoAgenda:{display:"block",marginTop:5,color:"#dc3545",fontWeight:"bold"},cardLixeira:{background:"#fff",padding:12,borderRadius:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},textoQuarentena:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},textoLiberado:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},cardNota:{background:"#eef2ff",padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},textoNota:{fontSize:14,whiteSpace:"pre-wrap"},acoes:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8},mensagemVazia:{fontSize:13,opacity:.7},btnPago:{minHeight:38,minWidth:74,background:"#0f766e",color:"#fff",border:"1px solid #0f766e",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnVoltar:{minHeight:38,minWidth:74,background:"#f8fafc",color:"#475569",border:"1px solid #cbd5e1",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnEditar:{minHeight:38,minWidth:74,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnExcluir:{minHeight:38,minWidth:74,background:"#fff1f2",color:"#e11d48",border:"1px solid #fecdd3",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnSecundario:{background:"#f8fafc",color:"#0f766e",border:"1px solid #99f6e4",padding:"6px 10px",borderRadius:8,fontWeight:800,cursor:"pointer"},btnCinza:{background:"#64748b",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnRoxo:{background:"#6f42c1",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnVerde:{background:"#14b8a6",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},fab:{position:"fixed",right:22,bottom:22,width:54,height:54,borderRadius:18,background:"linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.22)",fontSize:28,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(15, 118, 110, 0.28)",zIndex:3e3,cursor:"pointer"},menuFab:{position:"fixed",right:20,bottom:86,display:"flex",flexDirection:"column",gap:8,zIndex:3001},menuItem:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"0 14px",minWidth:190,width:190,height:48,fontSize:14,fontWeight:800,boxShadow:"0 10px 24px rgba(15,23,42,0.14)",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,color:"#0f172a",whiteSpace:"nowrap",overflow:"visible",cursor:"pointer"},menuItemIcone:{display:"inline-flex",width:26,minWidth:26,justifyContent:"center",fontSize:18,lineHeight:1},menuItemTexto:{display:"inline-block",color:"#0f172a",fontSize:14,fontWeight:800,lineHeight:1},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",justifyContent:"center",alignItems:"center",padding:16,zIndex:999},blocoNotificacaoConta:{background:"#f8fafc",border:"1px solid #e5e5e5",borderRadius:12,padding:10,marginBottom:10},blocoRecorrenciaConta:{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:12,padding:10,marginBottom:10},switchLinhaCompacta:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #e5e5e5",fontSize:14},textoAjuda:{display:"block",color:"#666",fontSize:11,marginTop:4},notificacaoChips:{display:"flex",gap:6,flexWrap:"wrap",marginTop:6},chipNotif:{background:"#eef6ff",color:"#0d6efd",border:"1px solid #b6d4fe",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:"bold"},modal:{background:"#fff",padding:18,borderRadius:14,width:"100%",maxWidth:360},inputModal:{width:"100%",padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box"},textareaModal:{width:"100%",minHeight:110,padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box",fontFamily:"Arial"},btnGhostAction:{width:"auto",background:"#fff",color:"#374151",border:"1px solid #d1d5db",padding:"7px 12px",borderRadius:999,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:0},btnSalvar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#14b8a6",color:"#fff",marginBottom:8},btnCancelar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#6c757d",color:"#fff"},itemCentro:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f1f1f1",padding:8,borderRadius:8,marginBottom:6,fontSize:13},btnMiniExcluir:{background:"#fee2e2",color:"#ef4444",border:"1px solid #f87171",borderRadius:999,padding:"8px 10px",fontSize:11},notasHeaderNovo:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10},btnMiniVerde:{background:"#0f766e",color:"#fff",border:"none",borderRadius:12,padding:"6px 11px",fontWeight:"900",fontSize:18,lineHeight:1},notasListaNova:{display:"grid",gap:10},cardNotaAcao:{padding:12,borderRadius:16,marginBottom:10,border:"1px solid #e5e7eb",boxShadow:"0 8px 20px rgba(15,23,42,0.06)"},cardNotaNormal:{background:"#f8fafc",borderColor:"#e5e7eb"},cardNotaUrgente:{background:"#fffbeb",borderColor:"#fde68a"},cardNotaCritico:{background:"#fff7f7",borderColor:"#fecaca"},badgePrioridade:{borderRadius:999,padding:"4px 8px",fontSize:12,fontWeight:"900"},badgeNormal:{background:"#f1f5f9",color:"#475569"},badgeUrgente:{background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a"},badgeCritico:{background:"#fff7f7",color:"#991b1b",border:"1px solid #fecaca"}},Td=[{id:"principal",titulo:"Principal",items:[{tela:"dashboard",icon:"🏠",label:"Dashboard",desc:"Resumo financeiro"},{tela:"agenda",icon:"📅",label:"Agenda",desc:"Vencimentos e previsões"},{tela:"notas",icon:"📝",label:"Bloco de Notas",desc:"Pendências e histórico de notas"}]},{id:"financeiro",titulo:"Financeiro",items:[{tela:"contas",icon:"💳",label:"Contas",desc:"Contas a pagar e filtros"}]},{id:"analise",titulo:"Análise",items:[{tela:"relatorios",icon:"📊",label:"Relatórios",desc:"Análises e indicadores"}]},{id:"master",titulo:"Master",items:[{tela:"master-empresas",icon:"🏢",label:"Painel Master",desc:"Empresas e tenants SaaS",masterOnly:!0}]},{id:"sistema",titulo:"Sistema",items:[{tela:"usuarios",icon:"👥",label:"Usuários",desc:"Perfis, acessos e senhas"},{tela:"configuracoes",icon:"⚙️",label:"Configurações",desc:"Preferências da empresa"},{tela:"filiais",icon:"🏬",label:"Filiais",desc:"Unidades da empresa"},{tela:"billing",icon:"💼",label:"Billing",desc:"Planos, limites e assinatura"},{tela:"onboarding",icon:"🚀",label:"Onboarding",desc:"Implantação inicial SaaS"},{tela:"importar",icon:"📥",label:"Importar CSV",desc:"Trazer histórico do Excel"},{tela:"lixeira",icon:"🗑️",label:"Lixeira",desc:"Restaurar ou excluir definitivo"}]}],Id="modulepreload",$d=function(t){return"/"+t},ti={},Bt=function(a,r,i){let n=Promise.resolve();if(r&&r.length>0){document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),u=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));n=Promise.allSettled(r.map(h=>{if(h=$d(h),h in ti)return;ti[h]=!0;const k=h.endsWith(".css"),j=k?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${h}"]${j}`))return;const y=document.createElement("link");if(y.rel=k?"stylesheet":Id,k||(y.as="script"),y.crossOrigin="",y.href=h,u&&y.setAttribute("nonce",u),document.head.appendChild(y),k)return new Promise((C,w)=>{y.addEventListener("load",C),y.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${h}`)))})}))}function c(l){const u=new Event("vite:preloadError",{cancelable:!0});if(u.payload=l,window.dispatchEvent(u),!u.defaultPrevented)throw l}return n.then(l=>{for(const u of l||[])u.status==="rejected"&&c(u.reason);return a().catch(c)})},It={dashboard:()=>Bt(()=>import("./DashboardRouteComposition-DMs-0q0K.js"),__vite__mapDeps([0,1,2,3,4])),contas:()=>Bt(()=>import("./ContasPage-Bd3UmwXK.js"),__vite__mapDeps([5,1,2])),relatorios:()=>Bt(()=>import("./Relatorios-D9GNHxxX.js"),__vite__mapDeps([6,1,3,4])),notas:()=>Bt(()=>import("./NotasPage-D7HbC0m1.js"),__vite__mapDeps([7,1])),masterPanel:()=>Bt(()=>import("./MasterPanelPage-JGEZnq0O.js"),__vite__mapDeps([8,1,4])),onboarding:()=>Bt(()=>import("./OnboardingPage-CwRaH0D8.js"),__vite__mapDeps([9,1,4])),billing:()=>Bt(()=>import("./BillingPage-CSzMd91S.js"),__vite__mapDeps([10,1,4])),filiais:()=>Bt(()=>import("./FiliaisPage-DCB0EXS_.js"),__vite__mapDeps([11,1,4])),usuarios:()=>Bt(()=>import("./UsuariosPage-Bn1X-D3O.js"),__vite__mapDeps([12,1])),copilotDrawer:()=>Bt(()=>import("./CopilotDrawer-D_QFFgEp.js"),__vite__mapDeps([13,1,4]))},Ld={dashboard:"dashboard",contas:"contas",relatorios:"relatorios",notas:"notas",master:"masterPanel",onboarding:"onboarding",billing:"billing",filiais:"filiais",usuarios:"usuarios"};function qd(t){return Ld[t]||null}const Od=s.lazy(It.dashboard),Bd=s.lazy(It.contas),Ud=s.lazy(It.relatorios),Vd=s.lazy(It.notas),Wd=s.lazy(It.masterPanel),Hd=s.lazy(It.onboarding),Gd=s.lazy(It.billing),Yd=s.lazy(It.filiais),Jd=s.lazy(It.usuarios),Kd=s.lazy(It.copilotDrawer),wo=new Set;function vo(t){const a=It[t];return!a||wo.has(t)?Promise.resolve():(wo.add(t),a().catch(r=>{wo.delete(t),console.warn(`Falha ao pré-carregar módulo ${t}:`,(r==null?void 0:r.message)||r)}))}function ei(){const{open:t}=ni();return t?e.jsx(ko,{children:e.jsx(Kd,{})}):null}function Qd(){var Tr,Ir,$r,Lr;const t=s.useRef(null),{globalLoading:a,toast:r,showToast:i,hideToast:n,empresaAtiva:c,setEmpresaAtiva:l,limparEmpresaAtiva:u,empresasDisponiveis:h,setEmpresasDisponiveis:k}=oi(),{contas:j,setContas:y,contasLixeira:C,setContasLixeira:w,busca:R,setBusca:E,filtroStatus:_,setFiltroStatus:P,filtroCentro:B,setFiltroCentro:$,filtroFilial:L,setFiltroFilial:U,filtroMes:I,setFiltroMes:ct,dataInicial:T,setDataInicial:q,dataFinal:O,setDataFinal:St,loading:bt,setLoading:ht,modalConta:$t,setModalConta:H,editandoContaId:M,descricao:X,setDescricao:lt,valor:et,setValor:dt,dataVencimento:Q,setDataVencimento:Rt,centroCustoId:fe,setCentroCustoId:ia,filialId:ge,setFilialId:na,observacaoConta:xe,setObservacaoConta:Fe,contaRecorrente:be,setContaRecorrente:De,tipoRecorrencia:he,setTipoRecorrencia:Te,diaVencimentoRecorrencia:we,setDiaVencimentoRecorrencia:Yt,buscarContas:oe,abrirNovaConta:sa,abrirEdicaoConta:da,fecharConta:ca,salvarConta:Ia,marcarComoPago:$a,voltarParaPendente:La,excluirConta:Ie}=cd(),{notas:la,setNotas:qa,notasLixeira:pa,setNotasLixeira:Oa,buscaNota:$e,setBuscaNota:ma,modalNota:G,setModalNota:z,editandoNotaId:F,tituloNota:W,setTituloNota:pt,conteudoNota:Z,setConteudoNota:gt,prioridadeNota:wt,setPrioridadeNota:at,dataEventoNota:mt,setDataEventoNota:ot,filialNotaId:Et,setFilialNotaId:Lt,buscarNotas:Le,buscarNotasLixeira:qe,abrirNovaNota:ve,abrirEdicaoNota:ye,fecharNota:re,salvarNota:Vt,excluirNota:ke,alternarNotaConcluida:Pt,restaurarNota:rt,excluirNotaDefinitivo:vt}=wd(),[it,Ft]=s.useState([]),[nt,ut]=s.useState([]),[ft,st]=s.useState(!1),[Dt,Jt]=s.useState(""),{menuAberto:Kt,setMenuAberto:Wt,menuNavegacaoAberto:_e,setMenuNavegacaoAberto:Ht,sidebarCompacta:xi,setSidebarCompacta:bi,gruposMenu:hi,setGruposMenu:So,telaAtual:_t,setTelaAtualState:ua,navegarPara:K}=Nd(),{empresaId:N,setEmpresaId:Oe,trocandoEmpresa:Be,setTrocandoEmpresa:Eo,perfilUsuario:Ue,setPerfilUsuario:Ve,permissoesUsuario:D,setPermissoesUsuario:fa,erroEmpresa:No,setErroEmpresa:ga}=Pd(),[We,je]=s.useState(""),{modalPerfilUsuario:wi,setModalPerfilUsuario:xa,nomePerfilEditando:zo,setNomePerfilEditando:Ba,salvandoPerfilUsuario:vi,setSalvandoPerfilUsuario:Ao,mostrarFiltros:yi,setMostrarFiltros:ki,mostrarContas:_i,setMostrarContas:ji,mostrarContasDashboard:Ci,setMostrarContasDashboard:Si,mostrarNotas:Ei,setMostrarNotas:Ni,mostrarConfigNegocio:Ua,setMostrarConfigNegocio:zi,mostrarConfigNotificacoes:Va,setMostrarConfigNotificacoes:Ai,mostrarConfigCentros:ba,setMostrarConfigCentros:Mi,mostrarConfigRecorrencias:Wa,setMostrarConfigRecorrencias:Ri,confirmacao:Ce,setConfirmacao:ha,arquivoImportacao:Mo,setArquivoImportacao:Ha,linhasImportacao:Qt,setLinhasImportacao:wa,statusImportacao:Ro,setStatusImportacao:He}=Sd(),[va,Ga]=s.useState([]),[Pi,Po]=s.useState(!1),[Fi,Ya]=s.useState(!1),[Di,Ja]=s.useState(""),[Fo,Do]=s.useState(!1),[To,ya]=s.useState({}),[Ti,Io]=s.useState(""),[$o,Lo]=s.useState(""),[qo,Oo]=s.useState(""),[Bo,Uo]=s.useState("operador"),[Vo,Wo]=s.useState(""),[Ho,Go]=s.useState(""),[Ge,Yo]=s.useState(""),[Jo,Ko]=s.useState(""),[ka,_a]=s.useState(null),[Ka,Qa]=s.useState(!0),[ie,Qo]=s.useState(!0),[ne,Xo]=s.useState(!0),[se,Zo]=s.useState(!1),[Se,Xa]=s.useState("1"),[ja,Za]=s.useState("1"),[tr,to]=s.useState(!0),[er,eo]=s.useState(!0),[ar,ao]=s.useState("3"),[or,oo]=s.useState(!0),[de,ro]=s.useState(""),[rr,io]=s.useState(""),[ir,no]=s.useState("");function A(o,d="info"){i(o,d)}function J(o,d="Não foi possível concluir a operação."){const m=(o==null?void 0:o.message)||o||d;if(ho(o)){qi("Sua sessão expirou. Faça login novamente.");return}A(String(m),"erro")}function nr(){y([]),qa([]),Ft([]),ut([]),w([]),Oa([]),Ga([]),Ja(""),Ya(!1),_a(null),H(!1),z(!1),st(!1),Wt(!1),Ht(!1),E(""),ma(""),P("todas"),$(""),U(""),ct(""),q(""),St(""),Ha(null),wa([]),He("")}function so(){nr(),k([]),Oe(null),u(),Ve(""),ya({}),je(""),ga(""),ht(!1),_d()}const co=s.useCallback(()=>{so()},[]),Ii=s.useCallback(()=>{ua("dashboard")},[]),$i=s.useCallback((o,d="info")=>{A(o,d)},[i]),Li=s.useCallback(o=>{zt({titulo:"Sessão quase expirada",mensagem:"Sua sessão vai expirar por segurança. Deseja continuar conectado?",textoConfirmar:"Continuar conectado",tipo:"padrao",acao:async()=>o()})},[]),{usuarioLogado:f,setUsuarioLogado:Ee,carregandoAuth:sr,setCarregandoAuth:dr,encerrarSessao:qi}=jd({onClearAuthData:co,onNavigateHome:Ii,onShowMessage:$i,onSessionWarning:Li});async function Oi(){var o,d;if(f!=null&&f.id)try{const g=await Vr(f.id)||((o=f==null?void 0:f.user_metadata)==null?void 0:o.name)||((d=f==null?void 0:f.user_metadata)==null?void 0:d.full_name)||"";g&&g!==We&&je(g)}catch(m){console.warn("Falha ao sincronizar nome do perfil:",(m==null?void 0:m.message)||m)}}s.useEffect(()=>{if(!f){ht(!1);return}Bi(f.id)},[f]),s.useEffect(()=>{if(!(f!=null&&f.id)||!N)return;let o=!1;async function d(){if(!o)try{await Promise.allSettled([Xt(N),Na(N),mr(N),Zt(N)])}catch(b){console.warn("Falha ao sincronizar dados do tenant:",(b==null?void 0:b.message)||b)}}function m(){window.clearTimeout(t.current),t.current=window.setTimeout(d,350)}function g(){document.visibilityState==="visible"&&m()}window.addEventListener("focus",m),document.addEventListener("visibilitychange",g);const x=S.channel(`tenant-sync-${N}`).on("postgres_changes",{event:"*",schema:"public",table:"df_centros_custo",filter:`empresa_id=eq.${N}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_filiais",filter:`empresa_id=eq.${N}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_contas",filter:`empresa_id=eq.${N}`},m).on("postgres_changes",{event:"*",schema:"public",table:"df_contas_recorrentes",filter:`empresa_id=eq.${N}`},m).subscribe();return()=>{o=!0,window.clearTimeout(t.current),window.removeEventListener("focus",m),document.removeEventListener("visibilitychange",g),S.removeChannel(x)}},[f==null?void 0:f.id,N]),s.useEffect(()=>{!_e||!(f!=null&&f.id)||Oi()},[_e,f==null?void 0:f.id]),s.useEffect(()=>{_t==="usuarios"&&N&&Ne(N)},[_t,N]),s.useEffect(()=>{function o(d){if(d.key==="Escape"){if(Ce.aberto){Aa();return}$t&&Ke(),G&&za(),ft&&st(!1),Kt&&Wt(!1),_e&&Ht(!1)}}return window.addEventListener("keydown",o),()=>window.removeEventListener("keydown",o)},[Ce.aberto,$t,G,ft,Kt,_e]);async function Bi(o){var d,m,g,x;ht(!0),ga("");try{await qs();const b=await Os(o),v=await Vr(o),V=await bo({userId:o,email:f==null?void 0:f.email,perfilEmpresa:(b==null?void 0:b.perfil)||"operador"}),Ct=await Jr({userId:o,email:f==null?void 0:f.email,isMaster:V.isMaster});if(!(b!=null&&b.empresaId)&&!V.isMaster){Oe(null),u(),Ve(""),fa(ea()),je(""),ga($s.semEmpresa);return}if(V.isMaster&&Ct.length===0){Oe(null),u(),Ve("master"),fa({...V,canSwitchCompany:!0,canManageCompanies:!0}),je(v||((d=f==null?void 0:f.user_metadata)==null?void 0:d.name)||((m=f==null?void 0:f.user_metadata)==null?void 0:m.full_name)||""),ga("Nenhuma empresa cadastrada em df_empresas para o usuário master.");return}const Y=Ct.find(le=>le.id===(c==null?void 0:c.id))||Ct.find(le=>le.id===(b==null?void 0:b.empresaId))||Ct[0]||{id:b==null?void 0:b.empresaId,nome:(b==null?void 0:b.nomeEmpresa)||"Dona Flor",perfil:(b==null?void 0:b.perfil)||"operador"},tt=Y.perfil||(b==null?void 0:b.perfil)||(V.isMaster?"master":"operador"),Me=V.isMaster?{...V,perfilEmpresa:Nt(tt),canSwitchCompany:!0,canManageCompanies:!0}:await bo({userId:o,email:f==null?void 0:f.email,perfilEmpresa:tt});k(Ct.length>0?Ct:[Y]),Oe(Y.id),l({id:Y.id,nome:Y.nome||(b==null?void 0:b.nomeEmpresa)||"Dona Flor",perfil:tt}),Ve(tt),fa(Me),je(v||((g=f==null?void 0:f.user_metadata)==null?void 0:g.name)||((x=f==null?void 0:f.user_metadata)==null?void 0:x.full_name)||""),await Ca(Y.id)}catch(b){ho(b)?(await S.auth.signOut(),so(),Ee(null),A("Sua sessão expirou. Faça login novamente.","erro")):A(b.message,"erro")}finally{ht(!1)}}async function Ca(o=N){o&&await Promise.all([Xt(o),Je(o),Na(o),mr(o),Zt(o),Xi(o)])}const Nt=s.useCallback(o=>ae(o),[]),Sa=s.useCallback((o=[])=>{if(D!=null&&D.isMaster)return!0;const d=Nt(Ue);return o.includes(d)},[Nt,Ue,D==null?void 0:D.isMaster]),ce=s.useCallback(()=>!!(D!=null&&D.canManageUsers||Sa(["admin"])),[D==null?void 0:D.canManageUsers,Sa]),Ye=s.useCallback(()=>!!(D!=null&&D.canAccessSettings||Sa(["admin","gerente"])),[D==null?void 0:D.canAccessSettings,Sa]),cr=s.useMemo(()=>Td.map(o=>({...o,items:o.items.filter(d=>!d.masterOnly||(D==null?void 0:D.canManageCompanies))})).filter(o=>o.items.length>0),[D==null?void 0:D.canManageCompanies]);async function Ui(){if(f)try{const o=await Jr({userId:f.id,email:f.email,isMaster:D==null?void 0:D.isMaster});k(o)}catch(o){console.warn("Não foi possível atualizar a lista de empresas:",o.message)}}async function Ea(o){if(!o||Be)return;const d=h.find(m=>m.id===o);if(!d){A("Empresa selecionada não encontrada para este usuário.","erro");return}if(d.id!==N){Eo(!0),ht(!0);try{const m=d.perfil||(D!=null&&D.isMaster?"master":"operador"),g=D!=null&&D.isMaster?{...D,perfilEmpresa:Nt(m),canSwitchCompany:!0,canManageCompanies:!0,canManageUsers:!0,canAccessSettings:!0}:await bo({userId:f==null?void 0:f.id,email:f==null?void 0:f.email,perfilEmpresa:m});nr(),Oe(d.id),l({id:d.id,nome:d.nome||"Empresa",perfil:m}),Ve(m),fa(g),ua("dashboard"),await Ca(d.id),A(`Empresa ativa: ${d.nome||"Empresa"}`,"sucesso")}catch(m){J(m,"Não foi possível trocar a empresa ativa.")}finally{Eo(!1),ht(!1)}}}async function Ne(o=N,d={}){if(!o)return;const m=!!(d!=null&&d.silencioso);m||Po(!0),Ja("");try{const[g,x]=await Promise.all([On(o),Gn(o)]),b={};(x||[]).forEach(v=>{!(v!=null&&v.usuario_id)||!(v!=null&&v.filial_id)||(b[v.usuario_id]||(b[v.usuario_id]=[]),b[v.usuario_id].push(v.filial_id))}),Ga(g),ya(b),Ya(!0)}catch(g){console.warn("Não foi possível carregar usuários:",g.message),Ga([]),ya({}),Ya(!0),Ja((g==null?void 0:g.message)||"Não foi possível carregar os usuários da empresa.")}finally{m||Po(!1)}}async function Vi(){if(Fo)return;if(!N){A("Empresa não identificada.","erro");return}if(!ce()){A("Apenas administradores podem adicionar usuários.","erro");return}const o=$o.trim().toLowerCase();if(!o||!o.includes("@")){A("Informe um e-mail válido.","erro");return}const d=Vo.trim();if(d.length<6){A("Informe uma senha provisória com pelo menos 6 caracteres.","erro");return}const m=Nt(Bo);try{Do(!0),await Bn({empresaId:N,email:o,nome:qo,perfil:m,senhaProvisoria:d,criarAuthManual:!0}),await Ne(N,{silencioso:!0})}catch(g){J(g);return}finally{Do(!1)}Lo(""),Oo(""),Wo(""),Uo("operador"),A("Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.","sucesso")}async function Wi(o){if(!ce()){A("Apenas administradores podem enviar acesso ou reset de senha.","erro");return}const d=o.nome||o.email||"este usuário";zt({titulo:"Enviar acesso",mensagem:`Deseja enviar um link de acesso/redefinição de senha para ${d}?`,textoConfirmar:"Enviar link",tipo:"padrao",acao:async()=>{try{const m=await Wn({usuario:o});A(m.mensagem,"info")}catch(m){J(m)}}})}async function Hi(o,d){if(!ce()){A("Apenas administradores podem alterar perfis.","erro");return}const m=Nt(d);if(o.user_id&&(f==null?void 0:f.id)&&o.user_id===f.id&&m!=="admin"&&va.filter(V=>Nt(V.perfil)==="admin").length<=1){A("Você não pode remover o último administrador da empresa.","erro");return}if(m===Nt(o.perfil))return;const x=o.nome||o.email||"este usuário",b=Mt(m);zt({titulo:"Alterar perfil",mensagem:`Deseja alterar o perfil de ${x} para ${b}?`,textoConfirmar:"Confirmar alteração",tipo:m==="admin"?"perigo":"padrao",acao:async()=>{try{await Un({empresaId:N,usuario:o,perfil:m})}catch(v){J(v);return}await Ne(),A("Perfil do usuário atualizado.","sucesso")}})}async function lr(o,d){if(!ce()){A("Apenas administradores podem alterar filiais dos usuários.","erro");return}if(!(o!=null&&o.id)){A("Este usuário precisa estar cadastrado na empresa para receber filiais.","erro");return}const m=o.id;Io(m);try{await Yn({empresaId:N,usuario:o,filialIds:d}),ya(g=>({...g,[o.id]:d})),A("Filiais do usuário atualizadas.","sucesso")}catch(g){J(g,"Não foi possível atualizar as filiais do usuário.")}finally{Io("")}}function Gi(o,d){const m=To[o.id]||[],x=m.includes(d)?m.filter(b=>b!==d):[...m,d];lr(o,x)}function Yi(o){lr(o,[])}async function Ji(o){if(!ce()){A("Apenas administradores podem remover usuários.","erro");return}if(o.user_id&&(f==null?void 0:f.id)&&o.user_id===f.id){A("Você não pode remover o próprio acesso por aqui.","erro");return}if(Nt(o.perfil)==="admin"&&va.filter(g=>Nt(g.perfil)==="admin").length<=1){A("Você não pode remover o último administrador da empresa.","erro");return}zt({titulo:"Remover usuário",mensagem:`Deseja remover ${o.nome||o.email||"este usuário"} desta empresa?`,textoConfirmar:"Remover",tipo:"perigo",acao:async()=>{try{await Vn({empresaId:N,usuario:o})}catch(m){J(m);return}await Ne()}})}async function Ki(){const o=Ho.trim().toLowerCase();if(!o||!o.includes("@")){A("Informe um e-mail válido.","erro");return}const{error:d}=await S.auth.updateUser({email:o},{emailRedirectTo:window.location.origin});if(d){J(d);return}Go(""),A("Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.","sucesso")}async function Qi(){if(!Ge||Ge.length<6){A("A senha precisa ter pelo menos 6 caracteres.","erro");return}if(Ge!==Jo){A("As senhas não conferem.","erro");return}const{error:o}=await S.auth.updateUser({password:Ge});if(o){J(o);return}Yo(""),Ko(""),A("Senha atualizada com sucesso.","sucesso")}async function Xt(o=N){return oe({supabase:S,empresaAtual:o,avisarErro:J,configWhatsapp:ie,configEmail:ne,configPush:se,diasAlertaContas:ja,diasAvisoPadrao:Se})}async function Je(o=N){return Le({supabase:S,empresaAtual:o,avisarErro:J})}async function pr(o=N){if(!o)return;const{data:d,error:m}=await S.from("df_configuracoes_alertas").select("*").eq("empresa_id",o).maybeSingle();if(m){console.warn("Não foi possível carregar alertas globais:",m.message);return}if(d){Za(String(d.dias_alerta_contas??1)),to(d.alertar_contas_vencidas??!0),eo(d.destacar_contas_criticas??!0),ao(String(d.dias_alerta_notas??3)),oo(d.destacar_notas_urgentes??!0);return}const g={empresa_id:o,dias_alerta_contas:1,alertar_contas_vencidas:!0,destacar_contas_criticas:!0,dias_alerta_notas:3,destacar_notas_urgentes:!0},{data:x,error:b}=await S.from("df_configuracoes_alertas").insert([g]).select().maybeSingle();if(b){console.warn("Não foi possível criar alertas globais:",b.message);return}x&&(Za(String(x.dias_alerta_contas??1)),to(x.alertar_contas_vencidas??!0),eo(x.destacar_contas_criticas??!0),ao(String(x.dias_alerta_notas??3)),oo(x.destacar_notas_urgentes??!0))}async function Xi(o=N){if(!o)return;const{data:d,error:m}=await S.from("df_configuracoes").select("*").eq("empresa_id",o).limit(1);if(m){J(m);return}const g=Array.isArray(d)?d[0]:d;if(g){_a(g),Qa(g.notificacoes_ativas??!0),Qo(g.enviar_whatsapp??!0),Xo(g.enviar_email??!0),Zo(g.enviar_push??!1),Xa(String(g.dias_aviso_padrao??1)),ro(g.nome_empresa||""),io(g.whatsapp_padrao||""),no(g.email_padrao||""),await pr(o);return}const{data:x,error:b}=await S.from("df_configuracoes").insert([{notificacoes_ativas:!0,enviar_whatsapp:!0,enviar_email:!0,enviar_push:!1,dias_aviso_padrao:1,nome_empresa:"DF Gestão Financeira",empresa_id:o}]).select();if(b){J(b);return}const v=Array.isArray(x)?x[0]:x;_a(v),Qa((v==null?void 0:v.notificacoes_ativas)??!0),Qo((v==null?void 0:v.enviar_whatsapp)??!0),Xo((v==null?void 0:v.enviar_email)??!0),Zo((v==null?void 0:v.enviar_push)??!1),Xa(String((v==null?void 0:v.dias_aviso_padrao)??1)),ro((v==null?void 0:v.nome_empresa)||""),io((v==null?void 0:v.whatsapp_padrao)||""),no((v==null?void 0:v.email_padrao)||""),await pr(o)}async function Zt(o=N){if(!o)return;const{data:d,error:m}=await S.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",o).eq("excluido",!0).order("excluido_em",{ascending:!1});m&&J(m),Fd(w,d||[]),await qe({supabase:S,empresaAtual:o,avisarErro:J})}async function Na(o=N){if(!o)return;const{data:d,error:m}=await S.from("df_centros_custo").select("*").eq("empresa_id",o).order("nome");if(m){J(m);return}Ft(d||[])}async function mr(o=N){if(!o){ut([]);return}try{const d=await Dd(o);ut((d||[]).filter(m=>m.ativo!==!1))}catch(d){J(d),ut([])}}const ze=s.useMemo(()=>R.trim().toLowerCase(),[R]),jt=s.useMemo(()=>j.filter(o=>_==="pendentes"?o.status!=="pago":_==="pagas"?o.status==="pago":_==="vencidas"?Ot(o.data_vencimento,o.status):!0).filter(o=>!B||o.centro_custo_id===B).filter(o=>!L||o.filial_id===L).filter(o=>!I||Kr(o.data_vencimento)===I).filter(o=>!(T&&o.data_vencimento<T||O&&o.data_vencimento>O)).filter(o=>{var b,v;if(!ze)return!0;const d=((b=o.df_centros_custo)==null?void 0:b.nome)||"",m=((v=o.df_filiais)==null?void 0:v.nome)||"",g=o.status==="pago"?"pago":Ot(o.data_vencimento,o.status)?"vencido":"pendente";return[o.descricao,o.observacao,o.categoria,o.forma_pagamento,d,m,g,Tt(o.data_vencimento),o.data_vencimento].filter(Boolean).some(V=>String(V).toLowerCase().includes(ze))}),[j,O,T,B,L,I,_,ze]),ur=s.useMemo(()=>j.filter(o=>_==="pendentes"?o.status!=="pago":_==="pagas"?o.status==="pago":_==="vencidas"?Ot(o.data_vencimento,o.status):!0).filter(o=>!B||o.centro_custo_id===B).filter(o=>!I||Kr(o.data_vencimento)===I).filter(o=>!(T&&o.data_vencimento<T||O&&o.data_vencimento>O)).filter(o=>{var b,v;if(!ze)return!0;const d=((b=o.df_centros_custo)==null?void 0:b.nome)||"",m=((v=o.df_filiais)==null?void 0:v.nome)||"",g=o.status==="pago"?"pago":Ot(o.data_vencimento,o.status)?"vencido":"pendente";return[o.descricao,o.observacao,o.categoria,o.forma_pagamento,d,m,g,Tt(o.data_vencimento),o.data_vencimento].filter(Boolean).some(V=>String(V).toLowerCase().includes(ze))}),[j,O,T,B,I,_,ze]),Zi=s.useMemo(()=>{const o=jt.reduce((g,x)=>g+Number(x.valor||0),0),d=jt.filter(g=>g.status==="pago").reduce((g,x)=>g+Number(x.valor||0),0),m=jt.filter(g=>Ot(g.data_vencimento,g.status)).reduce((g,x)=>g+Number(x.valor||0),0);return{total:o,pago:d,vencido:m,pendente:o-d}},[jt]),{total:lo,pago:fr,vencido:gr,pendente:xr}=Zi,tn=s.useMemo(()=>jt.filter(o=>o.status!=="pago").sort((o,d)=>String(d.created_at||d.data_vencimento||"").localeCompare(String(o.created_at||o.data_vencimento||""))),[jt]);s.useMemo(()=>it.map(o=>{const d=jt.filter(b=>b.centro_custo_id===o.id),m=d.reduce((b,v)=>b+Number(v.valor||0),0),g=d.filter(b=>b.status==="pago").reduce((b,v)=>b+Number(v.valor||0),0),x=d.filter(b=>Ot(b.data_vencimento,b.status)).reduce((b,v)=>b+Number(v.valor||0),0);return{id:o.id,nome:o.nome,total:m,pago:g,pendente:m-g,vencido:x}}).filter(o=>o.total>0||o.pago>0||o.pendente>0||o.vencido>0),[it,jt]);const br={critico:0,urgente:1,normal:2},hr=s.useMemo(()=>$e.toLowerCase(),[$e]),po=s.useMemo(()=>la.filter(o=>(!L||o.filial_id===L)&&`${o.titulo||""} ${o.conteudo||""}`.toLowerCase().includes(hr)).sort((o,d)=>{const m=o.concluida?1:0,g=d.concluida?1:0;if(m!==g)return m-g;const x=br[o.prioridade||"normal"]??2,b=br[d.prioridade||"normal"]??2;if(x!==b)return x-b;const v=o.data_evento||"9999-12-31",V=d.data_evento||"9999-12-31";return String(v).localeCompare(String(V))}),[la,L,hr]),Ae=s.useMemo(()=>po.filter(o=>!o.concluida),[po]),wr=s.useMemo(()=>Ae.filter(o=>o.prioridade==="critico").length,[Ae]),vr=s.useMemo(()=>Ae.filter(o=>o.prioridade==="urgente").length,[Ae]);function en(){return sa({setMenuAberto:Wt,setMenuNavegacaoAberto:Ht,configWhatsapp:ie,configEmail:ne,configPush:se,diasAvisoPadrao:Se})}async function an(o){return da({conta:o,supabase:S,empresaId:N,diasAvisoPadrao:Se,formatarDataParaBanco:Pa})}function Ke(){return ca()}async function on(){return Ia({supabase:S,empresaId:N,mostrarAviso:A,configWhatsapp:ie,configEmail:ne,configPush:se,diasAlertaContas:ja,diasAvisoPadrao:Se,primeiraLetraMaiuscula:Mt,converterValor:rd,formatarDataParaBanco:Pa,erroEhSessaoExpirada:ho,limparEstadoAutenticacao:so,setUsuarioLogado:Ee,buscarContas:Xt,fecharConta:Ke})}async function mo(o){return $a({supabase:S,id:o,empresaId:N,buscarContas:Xt,mostrarAviso:A})}async function rn(o){return La({supabase:S,id:o,empresaId:N,buscarContas:Xt,mostrarAviso:A})}async function nn(o){return Ie({supabase:S,id:o,empresaId:N,avisarErro:J,buscarContas:Xt,buscarLixeira:Zt,mostrarAviso:A})}function sn(){return ve({setMenuAberto:Wt,setMenuNavegacaoAberto:Ht})}function yr(o){return ye(o)}function za(){return re()}async function dn(){return Vt({supabase:S,empresaId:N,mostrarAviso:A,avisarErro:J,buscarNotas:Je})}async function kr(o){return ke({supabase:S,id:o,empresaId:N,avisarErro:J,buscarNotas:Je,buscarLixeira:Zt,mostrarAviso:A})}async function _r(o){return Pt({supabase:S,nota:o,empresaId:N,avisarErro:J,buscarNotas:Je,mostrarAviso:A})}async function cn(){if(!N){A("Usuário sem empresa vinculada.","erro");return}const o=Number(Se),d=Number(ja),m=Number(ar);if(isNaN(o)||o<0||isNaN(d)||d<0||isNaN(m)||m<0){A("Informe uma quantidade válida para os dias de alerta.","erro");return}const g={notificacoes_ativas:Ka,enviar_whatsapp:ie,enviar_email:ne,enviar_push:se,dias_aviso_padrao:o,nome_empresa:de.trim()||null,whatsapp_padrao:rr.trim()||null,email_padrao:ir.trim()||null,empresa_id:N};let x;if(ka!=null&&ka.id?x=await S.from("df_configuracoes").update(g).eq("id",ka.id).eq("empresa_id",N).select():x=await S.from("df_configuracoes").insert([g]).select(),x.error){J(x.error);return}const b=Array.isArray(x.data)?x.data[0]:x.data;_a(b);const{error:v}=await S.from("df_configuracoes_alertas").upsert([{empresa_id:N,dias_alerta_contas:d,alertar_contas_vencidas:tr,destacar_contas_criticas:er,dias_alerta_notas:m,destacar_notas_urgentes:or}],{onConflict:"empresa_id"});if(v){A("Configurações principais salvas, mas os alertas globais não foram atualizados: "+v.message,"erro");return}A("Configurações salvas com sucesso.","info")}async function ln(o){const{error:d}=await S.from("df_contas").update({excluido:!1,excluido_em:null}).eq("id",o).eq("empresa_id",N);if(d){J(d);return}Xt(),Zt(),A("Conta restaurada com sucesso.","sucesso")}async function pn(o){return rt({supabase:S,id:o,empresaId:N,avisarErro:J,buscarNotas:Je,buscarLixeira:Zt,mostrarAviso:A})}async function mn(o){const{error:d}=await S.from("df_contas").delete().eq("id",o.id).eq("empresa_id",N);if(d){J(d);return}Zt(),A("Conta excluída definitivamente.","sucesso")}async function un(o){return vt({supabase:S,nota:o,empresaId:N,avisarErro:J,buscarLixeira:Zt,mostrarAviso:A})}async function fn(){if(!N){A("Usuário sem empresa vinculada.","erro");return}const o=Mt(Dt.trim());if(!o){A("Digite o centro de custo.","erro");return}if(it.some(x=>String(x.nome||"").trim().toLowerCase()===o.toLowerCase())){A("Este centro de custo já existe nesta empresa.","erro");return}const{data:m,error:g}=await S.from("df_centros_custo").insert([{nome:o,empresa_id:N}]).select("*").single();if(g){J(g);return}Jt(""),Ft(x=>[...x.filter(v=>v.id!==m.id),m].sort((v,V)=>String(v.nome||"").localeCompare(String(V.nome||"")))),await Na(N),A("Centro de custo criado com sucesso.","sucesso")}async function gn(o){const{error:d}=await S.from("df_centros_custo").delete().eq("id",o).eq("empresa_id",N);if(d){A("Não foi possível excluir. Verifique se existem contas usando este centro.","erro");return}Na(),Xt()}function xn(){const o=["Descricao","Valor","Vencimento","Status","Filial","Centro"],d=jt.map(v=>{var V,Ct;return[v.descricao||"",Number(v.valor||0).toFixed(2).replace(".",","),Tt(v.data_vencimento),Ot(v.data_vencimento,v.status)?"vencido":v.status,((V=v.df_filiais)==null?void 0:V.nome)||"",((Ct=v.df_centros_custo)==null?void 0:Ct.nome)||""]}),m=[o,...d].map(v=>v.map(V=>`"${String(V).replaceAll('"','""')}"`).join(";")).join(`
`),g=new Blob([m],{type:"text/csv;charset=utf-8;"}),x=URL.createObjectURL(g),b=document.createElement("a");b.href=x,b.download="relatorio-contas.csv",b.click(),URL.revokeObjectURL(x)}function bn(){const o=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),d=jt.map(x=>{var v,V;const b=Ot(x.data_vencimento,x.status)?"Vencido":x.status==="pago"?"Pago":"Pendente";return`
        <tr>
          <td>
            <strong>${o(x.descricao||"-")}</strong>
            ${x.observacao?`<small>Obs: ${o(x.observacao)}</small>`:""}
          </td>
          <td>${o(((v=x.df_filiais)==null?void 0:v.nome)||"-")}</td>
          <td>${o(((V=x.df_centros_custo)==null?void 0:V.nome)||"-")}</td>
          <td>${o(Tt(x.data_vencimento))}</td>
          <td><span class="status ${b.toLowerCase()}">${b}</span></td>
          <td class="valor">${o(yt(x.valor))}</td>
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
              <div class="data">Gerado em ${new Date().toLocaleDateString("pt-BR")}<br/>${jt.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${o(yt(lo))}</strong></div>
              <div class="box"><span>Pago</span><strong>${o(yt(fr))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${o(yt(xr))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${o(yt(gr))}</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Conta</th><th>Filial</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  ${d||'<tr><td colspan="6">Nenhuma conta encontrada.</td></tr>'}
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
    `,g=window.open("","_blank");if(!g){A("O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.","erro");return}g.document.open(),g.document.write(m),g.document.close()}const hn=s.useCallback(()=>{E(""),P("todas"),$(""),U(""),ct(""),q(""),St("")},[]),zt=s.useCallback(({titulo:o,mensagem:d,textoConfirmar:m="Confirmar",tipo:g="padrao",acao:x})=>{ha({aberto:!0,titulo:o,mensagem:d,textoConfirmar:m,tipo:g,acao:x})},[ha]),Aa=s.useCallback(()=>{ha({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null})},[ha]),wn=s.useCallback(async()=>{typeof Ce.acao=="function"&&await Ce.acao(),Aa()},[Ce.acao,Aa]);function jr(o){return String(o||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Qe(o,d){const m=Object.entries(o||{});for(const g of d){const x=jr(g),b=m.find(([v])=>jr(v)===x);if(b)return b[1]}return""}function vn(o){if(!o)return null;if(typeof o=="number"){const m=new Date(Date.UTC(1899,11,30));return m.setUTCDate(m.getUTCDate()+o),m.toISOString().slice(0,10)}const d=String(o).trim();if(!d)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(d))return d;if(/^\d{2}\/\d{2}\/\d{4}$/.test(d)){const[m,g,x]=d.split("/");return`${x}-${g}-${m}`}return Pa(d)}function yn(o){if(typeof o=="number")return o;const d=String(o||"").replace(/R\$/gi,"").replace(/\./g,"").replace(",",".").trim();return Number(d||0)}function Cr(o){const d=[];let m="",g=!1;for(let x=0;x<o.length;x+=1){const b=o[x],v=o[x+1];if(b==='"'&&v==='"'){m+='"',x+=1;continue}if(b==='"'){g=!g;continue}if((b===";"||b===",")&&!g){d.push(m.trim()),m="";continue}m+=b}return d.push(m.trim()),d}function kn(o){const d=String(o||"").replace(/^﻿/,"").split(/\r?\n/).filter(g=>g.trim());if(d.length<2)return[];const m=Cr(d[0]);return d.slice(1).map(g=>{const x=Cr(g);return m.reduce((b,v,V)=>(b[v]=x[V]||"",b),{})})}async function _n(o){var x,b;const d=(x=o.target.files)==null?void 0:x[0];if(Ha(d||null),wa([]),He(""),!d)return;if(((b=d.name.split(".").pop())==null?void 0:b.toLowerCase())!=="csv"){He("Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.");return}const g=new FileReader;g.onload=v=>{const Ct=kn(v.target.result).map((At,Y)=>{const tt=Qe(At,["descricao","descrição","conta","nome","fornecedor"]),Me=Qe(At,["valor","valor pago","total"]),le=Qe(At,["vencimento","data vencimento","data_vencimento","data"]),qt=String(Qe(At,["status","situacao","situação"])||"pendente").toLowerCase(),pe=Qe(At,["centro","centro de custo","categoria","setor"]);return{linha:Y+2,descricao:Mt(String(tt||"").trim()),valor:yn(Me),data_vencimento:vn(le),status:qt.includes("pag")?"pago":"pendente",centro:String(pe||"").trim()}}).filter(At=>At.descricao||At.valor||At.data_vencimento);wa(Ct),He(`${Ct.length} linha(s) preparada(s) para revisão.`)},g.readAsText(d,"UTF-8")}async function jn(){if(!N){A("Usuário sem empresa vinculada.","erro");return}const o=Qt.filter(x=>!x.descricao||!x.valor||!x.data_vencimento);if(o.length>0){A(`Existem ${o.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`,"erro");return}const d={...Object.fromEntries(it.map(x=>[x.nome.toLowerCase(),x.id]))};for(const x of Qt)if(x.centro&&!d[x.centro.toLowerCase()]){const{data:b,error:v}=await S.from("df_centros_custo").insert([{nome:Mt(x.centro),empresa_id:N}]).select();if(v){J(v);return}const V=Array.isArray(b)?b[0]:b;d[x.centro.toLowerCase()]=V==null?void 0:V.id}const m=Qt.map(x=>({descricao:x.descricao,valor:x.valor,data_vencimento:x.data_vencimento,vencimento:x.data_vencimento,status:x.status,centro_custo_id:x.centro&&d[x.centro.toLowerCase()]||null,enviar_whatsapp:ie,enviar_email:ne,enviar_push:se,dias_aviso:Number(Se||1),empresa_id:N})),{error:g}=await S.from("df_contas").insert(m);if(g){J(g);return}He(`${m.length} conta(s) importada(s) com sucesso.`),Ha(null),wa([]),await Ca(N),K("contas")}const uo=s.useCallback(async()=>{co(),Ee(null),dr(!1),ua("contas"),await S.auth.signOut()},[co,dr,ua,Ee]);function Cn(){K("dashboard")}const Xe=s.useMemo(()=>{var m,g;const o=We||((m=f==null?void 0:f.user_metadata)==null?void 0:m.name)||((g=f==null?void 0:f.user_metadata)==null?void 0:g.full_name);if(o)return String(o).split(" ")[0];const d=(f==null?void 0:f.email)||"usuário";return Mt(d.split("@")[0])},[We,f==null?void 0:f.email,(Tr=f==null?void 0:f.user_metadata)==null?void 0:Tr.full_name,(Ir=f==null?void 0:f.user_metadata)==null?void 0:Ir.name]),Ma=s.useMemo(()=>{var m,g;const o=We||((m=f==null?void 0:f.user_metadata)==null?void 0:m.name)||((g=f==null?void 0:f.user_metadata)==null?void 0:g.full_name);if(o)return String(o).trim();const d=(f==null?void 0:f.email)||"";return d?Mt(d.split("@")[0]):""},[We,f==null?void 0:f.email,($r=f==null?void 0:f.user_metadata)==null?void 0:$r.full_name,(Lr=f==null?void 0:f.user_metadata)==null?void 0:Lr.name]),Ze=s.useCallback(()=>Xe,[Xe]),Sn=s.useCallback(()=>Ma,[Ma]),Sr=s.useCallback(()=>{Ba(Ma),xa(!0)},[Ma,xa,Ba]);async function En(){const o=String(zo||"").trim().replace(/\s+/g," ");if(o.length<2){A("Informe um nome com pelo menos 2 caracteres.","erro");return}Ao(!0);try{await Hn({userId:f==null?void 0:f.id,email:f==null?void 0:f.email,nome:o}),je(o),Ee(d=>d&&{...d,user_metadata:{...d.user_metadata||{},name:o,full_name:o}}),N&&await Ne(N),xa(!1),A("Perfil atualizado com sucesso.","sucesso")}catch(d){J(d,"Não foi possível atualizar o perfil.")}finally{Ao(!1)}}function Er(){return e.jsx(ws,{styles:p,modalConta:$t,contaProps:{editandoContaId:M,descricao:X,setDescricao:lt,valor:et,setValor:dt,dataVencimento:Q,setDataVencimento:Rt,centroCustoId:fe,setCentroCustoId:ia,centros:it,filialId:ge,setFilialId:na,filiais:nt,observacaoConta:xe,setObservacaoConta:Fe,contaRecorrente:be,setContaRecorrente:De,tipoRecorrencia:he,setTipoRecorrencia:Te,diaVencimentoRecorrencia:we,setDiaVencimentoRecorrencia:Yt,fecharConta:Ke,salvarConta:on,primeiraLetraMaiuscula:Mt,limitarDataInput:go,formatarDataParaBanco:Pa,fecharNota:za,setModalCentro:st,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht},modalNota:G,notaProps:{editandoNotaId:F,tituloNota:W,setTituloNota:pt,prioridadeNota:wt,setPrioridadeNota:at,dataEventoNota:mt,setDataEventoNota:ot,conteudoNota:Z,setConteudoNota:gt,filialNotaId:Et,setFilialNotaId:Lt,filiais:nt,salvarNota:dn,fecharNota:za,fecharConta:Ke,setModalCentro:st,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht,primeiraLetraMaiuscula:Mt,limitarDataInput:go},modalCentro:ft,centroProps:{novoCentro:Dt,setNovoCentro:Jt,salvarCentro:fn,centros:it,abrirConfirmacao:zt,excluirCentro:gn,fecharConta:Ke,fecharNota:za,setModalCentro:st,setMenuAberto:Wt,setMenuNavegacaoAberto:Ht},modalPerfilUsuario:wi,perfilProps:{nome:zo,setNome:Ba,email:f==null?void 0:f.email,salvando:vi,onClose:()=>xa(!1),onSave:En}})}function Nr(){return e.jsx(ks,{styles:p,globalLoading:a,globalToast:r,hideToast:n,confirmacao:Ce,fecharConfirmacao:Aa,executarConfirmacao:wn})}function zr(){return e.jsx(Kn,{styles:p,nomeEmpresa:de,navegarPara:K,menuNavegacaoAberto:_e,setMenuNavegacaoAberto:Ht,canSwitchCompany:D==null?void 0:D.canSwitchCompany,empresasDisponiveis:h,empresaId:N,trocarEmpresaAtiva:D!=null&&D.canSwitchCompany?Ea:void 0,trocandoEmpresa:Be,nomeUsuario:Ze,nomeUsuarioAtual:Xe,abrirPerfilUsuario:Sr})}function Ar(){return e.jsx(ds,{styles:p,menuAberto:Kt,setMenuAberto:Wt,abrirNovaConta:en,abrirNovaNota:sn})}function Mr(){return e.jsx("style",{children:`
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
      `})}function Nn(){return e.jsx("style",{children:`
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
      `})}function Rr(){return e.jsx("style",{children:`
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
      `})}function xt(o){return e.jsx(si,{contas:j,contasFiltradas:jt,navegarPara:K,children:e.jsxs("div",{className:"app-page app-frame",style:p.page,children:[e.jsx("style",{children:`

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

      `}),Rr(),Mr(),e.jsx(Ur,{}),Nn(),zr(),Fr(),Dr(),e.jsx("main",{className:"app-frame-content",children:e.jsx(ko,{children:o})}),Ar(),e.jsx(Br,{onPreload:()=>vo("copilotDrawer")}),e.jsx(ei,{}),Er(),Nr()]})})}function Ra({icon:o,title:d,description:m}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:o}),e.jsx("strong",{children:d}),e.jsx("p",{children:m})]})}const zn=s.useCallback(o=>{So(d=>({...d,[o]:!d[o]}))},[So]),Pr=s.useCallback(o=>{const d=qd(o);d&&vo(d)},[]),An=s.useCallback(o=>e.jsx(Re,{styles:p,...o}),[]);function Fr(){return e.jsx(ts,{sidebarCompacta:xi,setSidebarCompacta:bi,nomeUsuario:Ze,nomeUsuarioAtual:Xe,normalizarPerfil:Nt,perfilUsuario:Ue,menuSections:cr,telaAtual:_t,navegarPara:K,gruposMenu:hi,toggleGrupoMenu:zn,sairDoSistema:uo,onPreloadRoute:Pr})}function Dr(){return e.jsx(ss,{visible:_e,styles:p,setMenuNavegacaoAberto:Ht,nomeUsuario:Ze,nomeUsuarioAtual:Xe,normalizarPerfil:Nt,perfilUsuario:Ue,menuSections:cr,navegarPara:K,sairDoSistema:uo,canSwitchCompany:D==null?void 0:D.canSwitchCompany,empresasDisponiveis:h,empresaId:N,trocarEmpresaAtiva:D!=null&&D.canSwitchCompany?Ea:void 0,trocandoEmpresa:Be,abrirPerfilUsuario:Sr,onPreloadRoute:Pr})}const Mn={carregandoAuth:sr,usuarioLogado:f,erroEmpresa:No,styles:p,setUsuarioLogado:Ee,globalToast:r,hideToast:n,sairDoSistema:uo};if(sr||!f||No)return e.jsx(fs,{...Mn});if(_t==="contas")return xt(e.jsx(Bd,{styles:p,busca:R,setBusca:E,mostrarFiltros:yi,setMostrarFiltros:ki,limparFiltros:hn,imprimirPDF:bn,exportarCSV:xn,filtroStatus:_,setFiltroStatus:P,centros:it,filtroCentro:B,setFiltroCentro:$,filiais:nt,filtroFilial:L,setFiltroFilial:U,filtroMes:I,setFiltroMes:ct,dataInicial:T,setDataInicial:q,dataFinal:O,setDataFinal:St,limitarDataInput:go,contasFiltradas:jt,total:lo,formatarValor:yt,loading:bt,HeaderExpansivel:An,mostrarContas:_i,setMostrarContas:ji,estaVencida:Ot,formatarData:Tt,formatarTipoRecorrencia:dd,obterTipoRecorrenciaConta:sd,abrirConfirmacao:zt,marcarComoPago:mo,voltarParaPendente:rn,abrirEdicaoConta:an,excluirConta:nn,navegarPara:K}));if(_t==="relatorios")return xt(e.jsx(Ud,{voltar:()=>K("contas"),empresaId:N,usuario:f,mostrarAviso:A}));if(_t==="notas")return xt(e.jsx(Vd,{styles:p,navegarPara:K,notasFiltradas:po,notasPendentes:Ae,notasCriticas:wr,notasUrgentes:vr,buscaNota:$e,setBuscaNota:ma,formatarData:Tt,alternarNotaConcluida:_r,abrirEdicaoNota:yr,abrirConfirmacao:zt,excluirNota:kr,loading:bt,nomeUsuario:Ze(),filiais:nt,filtroFilial:L,setFiltroFilial:U,contasOperacionaisFiliais:ur}));if(_t==="importar")return xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"📥 Importar planilha"}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"1. Enviar arquivo"}),e.jsx("p",{style:p.textoNota,children:"Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app."}),e.jsxs("label",{style:p.uploadExcelBox,children:[e.jsx("strong",{children:"📊 Selecionar arquivo CSV"}),e.jsx("small",{children:"No Excel: Arquivo > Salvar como > CSV UTF-8"}),e.jsx("input",{type:"file",accept:".csv",onChange:_n,style:{display:"none"}})]}),Mo&&e.jsxs("p",{style:p.textoNota,children:["Arquivo: ",e.jsx("strong",{children:Mo.name})]}),Ro&&e.jsx("p",{style:p.alertaSucesso,children:Ro})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"2. Colunas esperadas"}),e.jsxs("div",{style:p.importDicasGrid,children:[e.jsx("span",{children:"Descrição"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Vencimento"}),e.jsx("span",{children:"Status"}),e.jsx("span",{children:"Centro de custo"})]}),e.jsx("p",{style:p.textoAjuda,children:"O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação."})]}),Qt.length>0&&e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"3. Revisar dados"}),e.jsx("div",{style:p.previewImportacao,children:Qt.slice(0,8).map(o=>e.jsxs("div",{style:p.previewLinha,children:[e.jsx("strong",{children:o.descricao||`Linha ${o.linha}`}),e.jsxs("small",{children:[Tt(o.data_vencimento)," • ",yt(o.valor)," • ",o.status," • ",o.centro||"Sem centro"]})]},o.linha))}),Qt.length>8&&e.jsxs("small",{style:p.textoAjuda,children:["Mostrando 8 de ",Qt.length," linhas."]}),e.jsxs("button",{style:p.btnSalvar,onClick:jn,children:["Importar ",Qt.length," conta(s)"]})]})]}));if(_t==="master-empresas")return D!=null&&D.canManageCompanies?xt(e.jsx(Wd,{styles:p,usuarioLogado:f,nomeUsuarioCompleto:Sn,empresaId:N,empresasDisponiveis:h,trocarEmpresaAtiva:Ea,trocandoEmpresa:Be,mostrarAviso:A,onEmpresasAtualizadas:Ui,voltarPainel:Cn,abaInicial:"empresas"})):xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"🏢 Painel Master"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:p.textoNota,children:"Seu perfil atual não permite acessar o painel master."}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"})]})]}));if(_t==="onboarding")return Ye()?xt(e.jsx(Hd,{styles:p,empresaId:N,empresaNome:de,filiais:nt,centros:it,contas:j,mostrarAviso:A,onRefresh:()=>Ca(N),voltarPainel:()=>K("configuracoes"),abrirDashboard:()=>K("dashboard")})):xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"🚀 Onboarding SaaS"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:p.textoNota,children:"Seu perfil atual não permite acessar o onboarding."}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"})]})]}));if(_t==="billing")return Ye()?xt(e.jsx(Gd,{styles:p,empresaId:N,empresaNome:de,filiais:nt,usuarios:va,mostrarAviso:A,podeEditar:ce(),voltarPainel:()=>K("configuracoes")})):xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"💼 Billing"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:p.textoNota,children:"Seu perfil atual não permite acessar o billing."}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"})]})]}));if(_t==="filiais")return Ye()?xt(e.jsx(Yd,{styles:p,empresaId:N,empresaNome:de,mostrarAviso:A,voltarPainel:()=>K("configuracoes")})):xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"🏬 Filiais"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:p.textoNota,children:"Seu perfil atual não permite gerenciar filiais."}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"})]})]}));if(_t==="usuarios")return xt(e.jsx(Jd,{styles:p,EmptyState:Ra,podeAcessarConfiguracoes:Ye,podeAdministrarUsuarios:ce,navegarPara:K,usuarioLogado:f,normalizarPerfil:Nt,perfilUsuario:Ue,permissoesUsuario:D,novoEmailUsuario:Ho,setNovoEmailUsuario:Go,novaSenhaUsuario:Ge,setNovaSenhaUsuario:Yo,confirmarNovaSenhaUsuario:Jo,setConfirmarNovaSenhaUsuario:Ko,salvarMeuEmail:Ki,salvarMinhaSenha:Qi,empresasDisponiveis:h,empresaId:N,trocandoEmpresa:Be,trocarEmpresaAtiva:Ea,buscarUsuariosEmpresa:Ne,primeiraLetraMaiuscula:Mt,nomeConviteUsuario:qo,setNomeConviteUsuario:Oo,emailConviteUsuario:$o,setEmailConviteUsuario:Lo,senhaConviteUsuario:Vo,setSenhaConviteUsuario:Wo,perfilConviteUsuario:Bo,setPerfilConviteUsuario:Uo,criandoUsuarioManual:Fo,adicionarUsuarioEmpresa:Vi,usuariosCarregando:Pi,usuariosInicializados:Fi,usuariosErro:Di,usuariosEmpresa:va,filiais:nt,filiaisUsuariosEmpresa:To,salvandoFilialUsuario:Ti,liberarTodasFiliaisUsuario:Yi,alternarFilialUsuario:Gi,atualizarPerfilUsuarioEmpresa:Hi,enviarAcessoUsuarioEmpresa:Wi,removerUsuarioEmpresa:Ji}));if(_t==="configuracoes")return Ye()?xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"⚙️ Configurações"}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx(Re,{styles:p,titulo:"🔔 Notificações",aberto:Va,onClick:()=>Ai(!Va)}),Va&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{className:"checkbox-row-fix",style:p.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificações ativas"}),e.jsx("small",{children:"Controle geral dos disparos automáticos da empresa."})]}),e.jsx("input",{type:"checkbox",checked:Ka,onChange:o=>Qa(o.target.checked)})]}),e.jsxs("div",{style:p.configResumo,children:[e.jsx("strong",{children:"Contas"}),e.jsx("span",{children:"Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário."})]}),e.jsx("input",{style:p.input,type:"number",min:"0",placeholder:"Avisar contas antes do vencimento. Ex: 1",value:ja,onChange:o=>{Za(o.target.value),Xa(o.target.value)}}),e.jsxs("label",{className:"checkbox-row-fix",style:p.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificar contas vencidas"}),e.jsx("small",{children:"Exibir contas em atraso nas notificações e destaques."})]}),e.jsx("input",{type:"checkbox",checked:tr,onChange:o=>to(o.target.checked)})]}),e.jsxs("label",{className:"checkbox-row-fix",style:p.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar contas críticas"}),e.jsx("small",{children:"Dar prioridade visual para contas vencidas ou muito próximas do vencimento."})]}),e.jsx("input",{type:"checkbox",checked:er,onChange:o=>eo(o.target.checked)})]}),e.jsxs("div",{style:p.configResumo,children:[e.jsx("strong",{children:"Notas"}),e.jsx("span",{children:"Regras para pendências e prioridades do bloco de notas."})]}),e.jsx("input",{style:p.input,type:"number",min:"0",placeholder:"Avisar notas pendentes após quantos dias. Ex: 3",value:ar,onChange:o=>ao(o.target.value)}),e.jsxs("label",{className:"checkbox-row-fix",style:p.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar notas urgentes"}),e.jsx("small",{children:"Manter notas urgentes e críticas no topo do acompanhamento."})]}),e.jsx("input",{type:"checkbox",checked:or,onChange:o=>oo(o.target.checked)})]}),e.jsxs("div",{style:p.configResumo,children:[e.jsx("strong",{children:"Canais preparados"}),e.jsxs("span",{children:["WhatsApp: ",ie?"Ligado":"Desligado"," • E-mail: ",ne?"Ligado":"Desligado"," • Push: ",se?"Ligado":"Desligado"]})]})]})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx(Re,{styles:p,titulo:"🏢 Dados do negócio",aberto:Ua,onClick:()=>zi(!Ua)}),Ua&&e.jsxs(e.Fragment,{children:[e.jsx("input",{style:p.input,placeholder:"Nome da empresa",value:de,onChange:o=>ro(Mt(o.target.value))}),e.jsx("input",{style:p.input,placeholder:"WhatsApp padrão. Ex: 5511999999999",value:rr,onChange:o=>io(o.target.value)}),e.jsx("input",{style:p.input,placeholder:"E-mail padrão",value:ir,onChange:o=>no(o.target.value)})]})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx(Re,{styles:p,titulo:"🔁 Recorrências",aberto:Wa,onClick:()=>Ri(!Wa)}),Wa&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:p.textoNota,children:"As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original."}),e.jsxs("div",{style:p.configResumo,children:[e.jsx("strong",{children:"Padrão atual"}),e.jsx("span",{children:"Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir."})]})]})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx(Re,{styles:p,titulo:"🏷 Centros de custo",aberto:ba,onClick:()=>Mi(!ba)}),ba&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:p.textoNota,children:"Cadastre e gerencie os centros usados nas contas e nos relatórios."}),e.jsxs("div",{style:p.configResumo,children:[e.jsxs("span",{children:["Total de centros: ",it.length]}),e.jsx("span",{children:"Uso nos filtros e relatórios"})]}),e.jsx("button",{style:p.btnSalvar,onClick:()=>st(!0),children:"Gerenciar centros"})]})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx(Re,{styles:p,titulo:"🏬 Filiais / Unidades",aberto:ba,onClick:()=>K("filiais")}),e.jsx("p",{style:p.textoNota,children:"Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial."}),e.jsxs("div",{style:p.configResumo,children:[e.jsx("span",{children:"Organização: empresa → filial → centro de custo → conta"}),e.jsx("span",{children:"Isolamento por empresa ativo"})]}),e.jsx("button",{style:p.btnSalvar,onClick:()=>K("filiais"),children:"Gerenciar filiais"})]}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"🧠 Como o sistema vai usar"}),e.jsx("p",{style:p.textoNota,children:"O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos e as contas/notas passam a obedecer ao mesmo padrão configurado aqui."}),e.jsxs("div",{style:p.configResumo,children:[e.jsxs("span",{children:["Geral: ",Ka?"Ligado":"Desligado"]}),e.jsxs("span",{children:["WhatsApp: ",ie?"Ligado":"Desligado"]}),e.jsxs("span",{children:["E-mail: ",ne?"Ligado":"Desligado"]}),e.jsxs("span",{children:["Push: ",se?"Ligado":"Desligado"]})]})]}),e.jsx("button",{style:p.btnSalvar,onClick:cn,children:"Salvar configurações"})]})):xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"⚙️ Configurações"}),e.jsxs("section",{style:p.cardConfiguracao,children:[e.jsx("h2",{style:p.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:p.textoNota,children:"Seu perfil atual não permite acessar configurações."}),e.jsx("button",{style:p.btnCinza,onClick:()=>K("contas"),children:"← Voltar"})]})]}));if(_t==="agenda"){let o=function({titulo:Y,total:tt,lista:Me,cor:le}){return e.jsxs("section",{style:p.cardAgenda,children:[e.jsxs("div",{style:p.cardTopo,children:[e.jsx("strong",{children:Y}),e.jsx("span",{children:yt(tt)})]}),Me.length===0&&e.jsx(Ra,{icon:"✅",title:"Agenda limpa",description:"Não há contas neste grupo de vencimento no momento."}),Me.map(qt=>{var qr;const pe=Pe(qt.data_vencimento);return e.jsxs("div",{style:{...p.itemAgenda,borderLeft:`5px solid ${le}`},children:[e.jsxs("div",{children:[e.jsx("strong",{children:qt.descricao}),e.jsxs("div",{style:p.cardInfo,children:[Tt(qt.data_vencimento)," • ",((qr=qt.df_centros_custo)==null?void 0:qr.nome)||"Sem centro"]}),e.jsx("small",{style:pe<0?p.textoVencidoAgenda:p.textoAgenda,children:pe<0?`Vencida há ${Math.abs(pe)} dia(s)`:pe===0?"Vence hoje":`Vence em ${pe} dia(s)`})]}),e.jsxs("div",{style:p.agendaDireita,children:[e.jsx("strong",{children:yt(qt.valor)}),e.jsx("button",{style:p.btnPago,onClick:()=>zt({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${qt.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>mo(qt.id)}),children:"Pago"})]})]},qt.id)})]})};const d=[...j].filter(Y=>Y.status!=="pago").sort((Y,tt)=>ra(Y.data_vencimento)-ra(tt.data_vencimento)),m=d.filter(Y=>Pe(Y.data_vencimento)<0),g=d.filter(Y=>Pe(Y.data_vencimento)===0),x=d.filter(Y=>{const tt=Pe(Y.data_vencimento);return tt>0&&tt<=7}),b=d.filter(Y=>Pe(Y.data_vencimento)>7&&od(Y.data_vencimento)),v=m.reduce((Y,tt)=>Y+Number(tt.valor||0),0),V=g.reduce((Y,tt)=>Y+Number(tt.valor||0),0),Ct=x.reduce((Y,tt)=>Y+Number(tt.valor||0),0),At=b.reduce((Y,tt)=>Y+Number(tt.valor||0),0);return xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"📅 Agenda Financeira"}),e.jsx("button",{className:"btn-back-page",style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"agenda-summary-grid",style:p.resumo,children:[e.jsxs("div",{style:p.boxVencido,children:[e.jsx("span",{children:"Vencidas"}),e.jsx("strong",{children:yt(v)})]}),e.jsxs("div",{style:p.boxPendente,children:[e.jsx("span",{children:"Hoje"}),e.jsx("strong",{children:yt(V)})]}),e.jsxs("div",{style:p.boxTotal,children:[e.jsx("span",{children:"7 dias"}),e.jsx("strong",{children:yt(Ct)})]}),e.jsxs("div",{style:p.boxPago,children:[e.jsx("span",{children:"Mês"}),e.jsx("strong",{children:yt(At)})]})]}),e.jsxs("div",{className:"agenda-page-grid",children:[e.jsx(o,{titulo:"🚨 Vencidas",total:v,lista:m,cor:"#dc3545"}),e.jsx(o,{titulo:"📌 Vencem hoje",total:V,lista:g,cor:"#ffc107"}),e.jsx(o,{titulo:"🗓️ Próximos 7 dias",total:Ct,lista:x,cor:"#0d6efd"}),e.jsx(o,{titulo:"📆 Restante do mês",total:At,lista:b,cor:"#14b8a6"})]})]}))}return _t==="lixeira"?xt(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:p.titulo,children:"🗑️ Lixeira"}),e.jsx("button",{className:"btn-back-page",style:p.btnCinza,onClick:()=>K("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"trash-section trash-section-accounts",style:p.bloco,children:[e.jsx("h2",{style:p.subtitulo,children:"💰 Contas excluídas"}),C.length===0&&e.jsx(Ra,{icon:"🧹",title:"Nenhuma conta na lixeira",description:"As contas excluídas aparecerão aqui durante o período de quarentena."}),C.map(o=>{var m;const d=Xr(o.excluido_em);return Zr(o.excluido_em),e.jsxs("div",{className:"trash-card trash-card-account",style:p.cardLixeira,children:[e.jsxs("div",{style:p.cardTopo,children:[e.jsx("strong",{children:o.descricao}),e.jsx("span",{children:yt(o.valor)})]}),e.jsxs("div",{style:p.cardInfo,children:["Venc.: ",Tt(o.data_vencimento)," • Centro: ",((m=o.df_centros_custo)==null?void 0:m.nome)||"Sem centro"," • Lixeira há ",d," dia(s)"]}),e.jsxs("small",{style:p.textoLiberado,children:["Excluída há ",d," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:p.acoes,children:[e.jsx("button",{style:p.btnPago,onClick:()=>zt({titulo:"Restaurar conta",mensagem:`Deseja restaurar a conta ${o.descricao}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>ln(o.id)}),children:"Restaurar"}),e.jsx("button",{style:p.btnExcluir,onClick:()=>zt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a conta ${o.descricao}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>mn(o)}),children:"Excluir definitivo"})]})]},o.id)})]}),e.jsxs("section",{className:"trash-section trash-section-notes",style:p.bloco,children:[e.jsx("h2",{style:p.subtitulo,children:"📝 Notas excluídas"}),pa.length===0&&e.jsx(Ra,{icon:"🗒️",title:"Nenhuma nota na lixeira",description:"As notas excluídas aparecerão aqui antes da remoção definitiva."}),pa.map(o=>{const d=Xr(o.excluido_em);return Zr(o.excluido_em),e.jsxs("div",{className:"trash-card trash-card-note",style:p.cardLixeira,children:[e.jsx("strong",{children:o.titulo}),o.conteudo&&e.jsx("p",{style:p.textoNota,children:o.conteudo}),e.jsxs("small",{style:p.textoLiberado,children:["Excluída há ",d," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:p.acoes,children:[e.jsx("button",{style:p.btnPago,onClick:()=>zt({titulo:"Restaurar nota",mensagem:`Deseja restaurar a nota ${o.titulo}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>pn(o.id)}),children:"Restaurar"}),e.jsx("button",{style:p.btnExcluir,onClick:()=>zt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a nota ${o.titulo}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>un(o)}),children:"Excluir definitivo"})]})]},o.id)})]})]})):e.jsxs(Ts,{contas:j,contasFiltradas:jt,navegarPara:K,menuAberto:Kt,setMenuAberto:Wt,pageStyle:p.page,children:[Rr(),Mr(),e.jsx(Ur,{}),e.jsxs("div",{className:"print-header",children:[e.jsx("h1",{children:"Relatório Financeiro"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]})]}),e.jsx("div",{className:"print-footer",children:"Relatório gerado pelo Sistema DF Gestão Financeira"}),zr(),Fr(),Dr(),Ar(),e.jsx(Br,{onPreload:()=>vo("copilotDrawer")}),e.jsx(ei,{}),e.jsx(ko,{children:e.jsx(Od,{routeProps:{styles:p,nomeUsuario:Ze(),formatarValor:yt,total:lo,pago:fr,pendente:xr,vencido:gr,contas:jt,diferencaDias:Pe,navegarPara:K,contasAbertasDashboard:tn,mostrarContasDashboard:Ci,setMostrarContasDashboard:Si,busca:R,setBusca:E,estaVencida:Ot,formatarData:Tt,abrirConfirmacao:zt,marcarComoPago:mo,notasPendentes:Ae,notasCriticas:wr,notasUrgentes:vr,mostrarNotas:Ei,setMostrarNotas:Ni,alternarNotaConcluida:_r,abrirEdicaoNota:yr,excluirNota:kr,loading:bt,filiais:nt,filtroFilial:L,setFiltroFilial:U,contasOperacionaisFiliais:ur}})}),Er(),Nr()]})}Pn.createRoot(document.getElementById("root")).render(e.jsx(Fn.StrictMode,{children:e.jsx(ms,{children:e.jsx(Qd,{})})}));export{ac as a,rc as b,rd as c,ec as d,dd as f,Ps as g,Dd as l,tc as m,sd as o,oc as r,S as s,ni as u};
