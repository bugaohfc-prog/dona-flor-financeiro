import{r as c,j as e,a as ts,b as as,R as os}from"./vendor-react-CdkWbty6.js";import{c as rs}from"./vendor-supabase-D2gm834s.js";import{R as va,L as ii,C as so,X as lo,Y as co,T as ja,a as oo,B as yi,b as wi,P as ki,c as Ci,d as Ni}from"./vendor-charts-CfInRp4A.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function o(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(n){if(n.ep)return;n.ep=!0;const l=o(n);fetch(n.href,l)}})();const is=void 0;function ns(){return!!is}function ss(){return ns()?"":"Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o sistema."}const T=rs("https://placeholder.supabase.co","placeholder-anon-key",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}});function Zt(t){const a=String(t||"").toLowerCase().trim();return["admin","adm","administrador","master","owner"].includes(a)?"admin":["gerente","gerencia","gestor","manager"].includes(a)?"gerente":["financeiro","financas","finanças","financial"].includes(a)?"financeiro":["operacional","operacao","operação","atendente"].includes(a)?"operacional":["visualizacao","visualização","viewer","leitura","consulta"].includes(a)?"visualizacao":(["operador","usuario","usuário","user"].includes(a),"operador")}function ls(t=[],a=null){const o=(t||[]).map(n=>({...n,empresa_id:n.empresa_id||a,email:String(n.email||"").trim().toLowerCase(),perfil:Zt(n.perfil)})).filter(n=>!a||n.empresa_id===a),i=new Map;for(const n of o){const l=n.user_id||n.email||n.id,d=i.get(l);if(!d){i.set(l,n);continue}i.set(l,{...d,...n,id:d.id||n.id,nome:d.nome||n.nome,email:d.email||n.email,user_id:d.user_id||n.user_id,perfil:d.perfil==="admin"?d.perfil:n.perfil,created_at:d.created_at||n.created_at})}return Array.from(i.values())}async function ds(t){const{data:a,error:o}=await T.functions.invoke("listar-usuarios-empresa",{body:{empresaId:t}});if(o)throw o;if((a==null?void 0:a.ok)===!1)throw new Error((a==null?void 0:a.message)||"Não foi possível listar usuários pela Edge Function.");return ls((a==null?void 0:a.usuarios)||[],t)}async function cs(t){return t?ds(t):[]}async function ps({empresaId:t,email:a,nome:o,perfil:i,senhaProvisoria:n,criarAuthManual:l=!1}){const d=String(a||"").trim().toLowerCase(),m=String(o||"").trim()||d.split("@")[0],f=Zt(i),b=String(n||"").trim();if(!t)throw new Error("Empresa não identificada.");if(!d||!d.includes("@"))throw new Error("Informe um e-mail válido.");if(l&&b.length<6)throw new Error("Informe uma senha provisória com pelo menos 6 caracteres.");if(l){const{data:z,error:E}=await T.functions.invoke("criar-usuario-manual",{body:{empresaId:t,email:d,nome:m,perfil:f,senhaProvisoria:b}});if(E){const K=String((E==null?void 0:E.message)||(E==null?void 0:E.details)||"");throw K.includes("Failed to send a request")?new Error("Não foi possível conectar à Edge Function criar-usuario-manual. Confirme se ela foi publicada no Supabase e se o projeto está correto."):new Error(K||"A Edge Function criar-usuario-manual retornou erro. Verifique os logs no Supabase.")}if((z==null?void 0:z.ok)===!1)throw new Error((z==null?void 0:z.message)||"Não foi possível criar o usuário manualmente.");return(z==null?void 0:z.usuario)||(z==null?void 0:z.vinculo)||{empresa_id:t,email:d,nome:m,perfil:f,user_id:(z==null?void 0:z.userId)||null}}const{data:S,error:k}=await T.from("df_usuarios_empresas").select("id, email, user_id").eq("empresa_id",t).eq("email",d).maybeSingle();if(k)throw k;if(S)throw new Error("Este e-mail já está cadastrado nesta empresa.");const N={empresa_id:t,user_id:null,email:d,nome:m,perfil:f},{data:g,error:M}=await T.from("df_usuarios_empresas").insert([N]).select("*").single();if(M)throw M;return g}async function ms({empresaId:t,usuario:a,perfil:o}){const i=Zt(o);let n=T.from("df_usuarios_empresas").update({perfil:i}).eq("empresa_id",t);a.id?n=n.eq("id",a.id):a.user_id?n=n.eq("user_id",a.user_id):n=n.eq("email",a.email);const{error:l}=await n;if(l)throw l}async function us({empresaId:t,usuario:a}){let o=T.from("df_usuarios_empresas").delete().eq("empresa_id",t);a.id?o=o.eq("id",a.id):a.user_id?o=o.eq("user_id",a.user_id):o=o.eq("email",a.email);const{error:i}=await o;if(i)throw i}async function fs({usuario:t}){const a=String((t==null?void 0:t.email)||"").trim().toLowerCase();if(!a||!a.includes("@"))throw new Error("Este usuário não possui e-mail válido para envio de acesso.");const o=`${window.location.origin}/reset-password`,{data:i,error:n}=await T.functions.invoke("convidar-usuario",{body:{email:a,nome:t.nome||"",redirectTo:o}});if(!n)return{tipo:"convite",mensagem:(i==null?void 0:i.message)||"Convite enviado para o e-mail do usuário."};const{error:l}=await T.auth.resetPasswordForEmail(a,{redirectTo:o});if(l)throw l;return{tipo:"reset",mensagem:"Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha."}}async function xs({userId:t,email:a,nome:o}){const i=String(o||"").trim(),n=String(a||"").trim().toLowerCase();if(!t)throw new Error("Usuário não identificado.");if(i.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");const l=[],{error:d}=await T.from("profiles").upsert({id:t,name:i},{onConflict:"id"});d&&l.push(d);const{error:m}=await T.from("df_usuarios_empresas").update({nome:i}).eq("user_id",t);if(m&&l.push(m),n){const{error:f}=await T.from("df_usuarios_empresas").update({nome:i}).eq("email",n);f&&l.push(f)}if(l.length>0)throw l[0];return{nome:i}}async function hs(t){if(!t)return[];const{data:a,error:o}=await T.from("df_usuarios_filiais").select("id, empresa_id, usuario_id, filial_id, created_at").eq("empresa_id",t);if(o)throw o;return a||[]}async function gs({empresaId:t,usuario:a,filialIds:o}){if(!t)throw new Error("Empresa não identificada.");if(!(a!=null&&a.id))throw new Error("Usuário da empresa não identificado.");const i=Array.from(new Set((o||[]).filter(Boolean))),{error:n}=await T.from("df_usuarios_filiais").delete().eq("empresa_id",t).eq("usuario_id",a.id);if(n)throw n;if(i.length===0)return[];const l=i.map(f=>({empresa_id:t,usuario_id:a.id,filial_id:f})),{data:d,error:m}=await T.from("df_usuarios_filiais").insert(l).select("id, empresa_id, usuario_id, filial_id, created_at");if(m)throw m;return d||[]}function kt(t){return t?String(t).charAt(0).toUpperCase()+String(t).slice(1):""}function nt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Pt(t){return t?new Date(String(t).slice(0,10)+"T00:00:00").toLocaleDateString("pt-BR"):"-"}function ro(t){if(!t)return null;const a=String(t).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(/^\d{2}\/\d{2}\/\d{4}$/.test(a)){const[o,i,n]=a.split("/");return`${n}-${i}-${o}`}return a.slice(0,10)}function Io(t){if(!t)return"";const a=String(t);if(a.includes("-"))return a.slice(0,10);const o=a.replace(/\D/g,"").slice(0,8);return o.length<=2?o:o.length<=4?`${o.slice(0,2)}/${o.slice(2)}`:`${o.slice(0,2)}/${o.slice(2,4)}/${o.slice(4,8)}`}function Si(t){const a=String(t||"").trim();if(!a)return 0;const o=a.replace(/[^\d,.-]/g,""),n=o.includes(",")?o.replace(/\./g,"").replace(",","."):o.replace(/,/g,""),l=Number(n);return Number.isFinite(l)?l:0}function oe(t){return nt(t)}function io(t){return Pt(t)}const bs=";";function _i(t,a){if(!(a instanceof Blob))throw new Error("Arquivo de exportação inválido.");const o=URL.createObjectURL(a),i=document.createElement("a");i.href=o,i.download=t,i.rel="noopener",document.body.appendChild(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(o),1200)}function vs(t,a){const o=Array.isArray(a)?a:[],i=[t,...o].map(n=>n.map(ys).join(bs)).join(`\r
`);return new Blob([`\uFEFF${i}`],{type:"text/csv;charset=utf-8"})}function js({filename:t,headers:a,rows:o}){_i(t,vs(a,o))}function ys(t){return`"${String(t??"").replace(/\r|\n/g," ").replace(/"/g,'""')}"`}function ws(t,a){if(!t||typeof t!="string"){a==null||a(new Error("Conteúdo de impressão vazio."));return}const o=document.createElement("iframe");o.title="Relatório para impressão",o.style.position="fixed",o.style.left="-10000px",o.style.top="0",o.style.width="794px",o.style.height="1123px",o.style.border="0",o.style.background="#ffffff",o.style.opacity="0.01",o.setAttribute("aria-hidden","true");let i=!1,n,l;const d=()=>{window.clearTimeout(n),window.clearTimeout(l),l=window.setTimeout(()=>o.remove(),3e3)},m=()=>{if(!i){i=!0;try{const S=o.contentWindow;if(!S)throw new Error("Janela de impressão indisponível.");S.focus(),S.print(),d()}catch(S){d(),a==null||a(S)}}},f=async(S=0)=>{var g,M,z;if(i)return;const k=o.contentDocument;if(!!!((M=(g=k==null?void 0:k.body)==null?void 0:g.innerText)!=null&&M.trim())){if(S<12){n=window.setTimeout(()=>f(S+1),250);return}d(),a==null||a(new Error("Documento de impressão não foi renderizado."));return}try{(z=k.fonts)!=null&&z.ready&&await k.fonts.ready;const E=Array.from(k.images||[]);await Promise.all(E.map(K=>K.complete?Promise.resolve():new Promise(ne=>{K.onload=ne,K.onerror=ne}))),window.requestAnimationFrame(()=>{window.setTimeout(m,350)})}catch(E){if(S<12){n=window.setTimeout(()=>f(S+1),250);return}d(),a==null||a(E)}};o.onload=()=>f(),document.body.appendChild(o);const b=o.contentDocument;if(!b){d(),a==null||a(new Error("Documento de impressão indisponível."));return}b.open(),b.write(t),b.close(),n=window.setTimeout(()=>f(),500)}function ks(t){const a=(Array.isArray(t)?t:[]).map(f=>({name:_s(f.name),rows:Array.isArray(f.rows)?f.rows:[]}));a.length===0&&a.push({name:"Relatório",rows:[["Sem dados para exportar"]]});const o=ba(`
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${a.map((f,b)=>`<sheet name="${Ei(f.name)}" sheetId="${b+1}" r:id="rId${b+1}"/>`).join("")}
  </sheets>
</workbook>`),i=ba(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${a.map((f,b)=>`<Relationship Id="rId${b+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${b+1}.xml"/>`).join("")}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),n=ba(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),l=ba(`
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${a.map((f,b)=>`<Override PartName="/xl/worksheets/sheet${b+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`),d=ba(`
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs>
</styleSheet>`),m=[{path:"[Content_Types].xml",content:l},{path:"_rels/.rels",content:n},{path:"xl/workbook.xml",content:o},{path:"xl/_rels/workbook.xml.rels",content:i},{path:"xl/styles.xml",content:d},...a.map((f,b)=>({path:`xl/worksheets/sheet${b+1}.xml`,content:Cs(f.rows)}))];return new Blob([Es(m)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}function Cs(t){const a=t.reduce((n,l)=>Math.max(n,(l==null?void 0:l.length)||0),0),o=Array.from({length:a},(n,l)=>{const d=Math.min(Math.max(...t.map(m=>String((m==null?void 0:m[l])??"").length),10)+2,38);return`<col min="${l+1}" max="${l+1}" width="${d}" customWidth="1"/>`}).join(""),i=t.map((n,l)=>{const d=(n||[]).map((m,f)=>Ns(m,f,l)).join("");return`<row r="${l+1}">${d}</row>`}).join("");return ba(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${o}</cols>
  <sheetData>${i}</sheetData>
</worksheet>`)}function Ns(t,a,o){const i=`${Ss(a)}${o+1}`,n=o===0,l=typeof t=="number"&&Number.isFinite(t),d=n?l?3:1:l?2:0;return l?`<c r="${i}" s="${d}"><v>${t}</v></c>`:`<c r="${i}" t="inlineStr" s="${d}"><is><t>${Ei(t)}</t></is></c>`}function Ss(t){let a="",o=t+1;for(;o>0;){const i=(o-1)%26;a=String.fromCharCode(65+i)+a,o=Math.floor((o-i)/26)}return a}function _s(t){return String(t||"Planilha").replace(/[\\/?*\[\]:]/g," ").slice(0,31)||"Planilha"}function Ei(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}function ba(t){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${t}`}function Es(t){const a=new TextEncoder,o=[],i=[];let n=0;t.forEach(f=>{const b=a.encode(f.path),S=a.encode(f.content),k=zs(S),N=new Uint8Array(30+b.length),g=new DataView(N.buffer);g.setUint32(0,67324752,!0),g.setUint16(4,20,!0),g.setUint16(6,0,!0),g.setUint16(8,0,!0),g.setUint16(10,0,!0),g.setUint16(12,0,!0),g.setUint32(14,k,!0),g.setUint32(18,S.length,!0),g.setUint32(22,S.length,!0),g.setUint16(26,b.length,!0),g.setUint16(28,0,!0),N.set(b,30),o.push(N,S);const M=new Uint8Array(46+b.length),z=new DataView(M.buffer);z.setUint32(0,33639248,!0),z.setUint16(4,20,!0),z.setUint16(6,20,!0),z.setUint16(8,0,!0),z.setUint16(10,0,!0),z.setUint16(12,0,!0),z.setUint16(14,0,!0),z.setUint32(16,k,!0),z.setUint32(20,S.length,!0),z.setUint32(24,S.length,!0),z.setUint16(28,b.length,!0),z.setUint16(30,0,!0),z.setUint16(32,0,!0),z.setUint16(34,0,!0),z.setUint16(36,0,!0),z.setUint32(38,0,!0),z.setUint32(42,n,!0),M.set(b,46),i.push(M),n+=N.length+S.length});const l=n;i.forEach(f=>{o.push(f),n+=f.length});const d=new Uint8Array(22),m=new DataView(d.buffer);return m.setUint32(0,101010256,!0),m.setUint16(8,t.length,!0),m.setUint16(10,t.length,!0),m.setUint32(12,n-l,!0),m.setUint32(16,l,!0),o.push(d),new Blob(o)}function zs(t){let a=-1;for(let o=0;o<t.length;o+=1)a=a>>>8^Ps[(a^t[o])&255];return(a^-1)>>>0}const Ps=(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let i=0;i<8;i+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Qt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Ut(t){return`${Number(t||0).toFixed(1)}%`}function Rs(t){return t>=84?"saudável":t>=68?"em atenção":"crítico"}function Fs({total:t=0,pago:a=0,pendente:o=0,vencido:i=0,taxaPago:n=0,taxaVencido:l=0,score:d=0,centroCritico:m=null,total7Dias:f=0,tendenciaMensal:b=[]}={}){if(!t)return{parecer:"A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.",liquidez:"Sem volume suficiente para medir liquidez operacional.",concentracao:"Sem centro de custo dominante identificado.",curtoPrazo:"Sem pressão de curto prazo detectada no recorte atual.",comportamento:"Histórico insuficiente para leitura comportamental.",anomalias:["Base financeira insuficiente para detectar anomalias."],drivers:["Ampliar base de contas e centros classificados."]};const S=Rs(d),k=b||[],N=k[k.length-1],g=k[k.length-2],M=N&&g&&g.total?(N.total-g.total)/g.total*100:null,z=i>0?`O cenário financeiro está ${S}, com ${Qt(i)} vencido representando ${Ut(l)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`:`O cenário financeiro está ${S}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`,E=n<35?`A liquidez operacional está pressionada: somente ${Ut(n)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`:n<70?`A liquidez exige acompanhamento: ${Ut(n)} do volume foi realizado, mas ainda existe margem relevante em aberto (${Qt(o)}).`:`A liquidez apresenta leitura positiva, com ${Ut(n)} já realizado e menor dependência de liquidações futuras.`,K=m?m.peso>=60?`Há concentração elevada no centro ${m.nome}, que representa ${m.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`:`O centro ${m.nome} lidera o recorte com ${m.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`:"Não há concentração relevante por centro de custo no recorte atual.",ne=f>0?`O curto prazo exige reserva de caixa de ${Qt(f)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`:"Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.",G=M===null?"Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.":M>15?`O volume analisado cresceu ${Ut(M)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`:M<-15?`O volume analisado caiu ${Ut(Math.abs(M))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`:`O comportamento mensal está relativamente estável, com variação de ${Ut(M)} frente ao mês anterior.`,q=[];l>=40&&q.push(`Vencidos acima de 40% do recorte (${Ut(l)}), sinalizando risco operacional elevado.`),n<20&&q.push(`Realização abaixo de 20% (${Ut(n)}), indicando baixa conversão em pagamento/baixa.`),(m==null?void 0:m.peso)>=60&&q.push(`Concentração extrema no centro ${m.nome} (${m.peso}%).`),f>a&&f>0&&q.push(`Vencimentos de 7 dias (${Qt(f)}) superam o realizado atual (${Qt(a)}).`),q.length||q.push("Nenhuma anomalia crítica detectada no recorte atual.");const se=[i>0?`Reduzir vencidos de ${Qt(i)} para aliviar o score.`:"Preservar cenário sem vencidos críticos.",m?`Revisar o centro ${m.nome}, principal driver do recorte.`:"Classificar centros para melhorar rastreabilidade.",f>0?`Proteger ${Qt(f)} no caixa semanal.`:"Usar a folga de curto prazo para planejamento.",o>0?`Acelerar baixa/renegociação de ${Qt(o)} em aberto.`:"Manter ritmo de realização."];return{parecer:z,liquidez:E,concentracao:K,curtoPrazo:ne,comportamento:G,anomalias:q,drivers:se}}function la(t){return Number((t==null?void 0:t.valor)||0)}function Wo(t,a){if(!t||a==="pago")return!1;const o=new Date;o.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<o}function $s(t){if(!t)return 999;const a=new Date;a.setHours(0,0,0,0);const o=new Date(`${t}T00:00:00`);return o.setHours(0,0,0,0),Math.ceil((o-a)/(1e3*60*60*24))}function st(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Ao(t){return`${Number(t||0).toFixed(1)}%`}function Ms(t){var a;return((a=t==null?void 0:t.df_centros_custo)==null?void 0:a.nome)||(t==null?void 0:t.centro_custo_nome)||(t==null?void 0:t.centro)||"Sem centro"}function Ts(t){return String((t==null?void 0:t.data_vencimento)||(t==null?void 0:t.created_at)||"").slice(0,7)||"Sem mês"}function Ds(t=[]){const a=new Map;return t.forEach(o=>{const i=Ms(o),n=a.get(i)||{nome:i,total:0,pago:0,pendente:0,vencido:0,quantidade:0},l=la(o);n.total+=l,n.quantidade+=1,o.status==="pago"?n.pago+=l:n.pendente+=l,Wo(o.data_vencimento,o.status)&&(n.vencido+=l),a.set(i,n)}),Array.from(a.values()).map(o=>({...o,risco:o.total?Math.round(o.vencido/o.total*100):0,peso:0})).sort((o,i)=>i.total-o.total)}function Is(t=[]){const a=new Map;return t.forEach(o=>{const i=Ts(o),n=a.get(i)||{mes:i,total:0,pago:0,pendente:0,vencido:0},l=la(o);n.total+=l,o.status==="pago"?n.pago+=l:n.pendente+=l,Wo(o.data_vencimento,o.status)&&(n.vencido+=l),a.set(i,n)}),Array.from(a.values()).sort((o,i)=>o.mes.localeCompare(i.mes)).slice(-6)}function As({total:t,pendente:a,vencido:o,taxaVencido:i,contasVencidas:n,contasPendentes:l}){if(!t)return 82;let d=100;return d-=Math.min(42,i*1.1),d-=Math.min(22,a/t*18),d-=Math.min(16,n.length*4),d-=Math.min(10,l.length*.8),Math.max(0,Math.min(100,Math.round(d)))}function Bs(t){return t>=84?{label:"Saudável",tone:"success"}:t>=68?{label:"Atenção",tone:"warning"}:{label:"Crítico",tone:"danger"}}function qs({total:t,pago:a,pendente:o,vencido:i,taxaPago:n,taxaVencido:l,score:d,status:m,centroCritico:f,vencemEm7Dias:b}){if(!t)return"Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.";const S=`O recorte atual soma ${st(t)}, com ${st(a)} realizado e ${st(o)} ainda em aberto.`,k=i>0?`O principal ponto de atenção é o vencido de ${st(i)}, equivalente a ${Ao(l)} do volume analisado.`:"Não há vencido crítico identificado no recorte atual.",N=n>=70?`A eficiência de realização está positiva, com ${Ao(n)} já liquidado.`:`A eficiência de realização está pressionada, com apenas ${Ao(n)} liquidado.`,g=f?`O centro de maior peso é ${f.nome}, concentrando ${st(f.total)}.`:"Não há concentração relevante por centro de custo.",M=b.length?`${b.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`:"Não há concentração expressiva de vencimentos nos próximos 7 dias.";return`${S} ${k} ${N} ${g} ${M} O score financeiro está em ${d}/100, classificado como ${m.label.toLowerCase()}.`}function zi({contas:t=[],contasFiltradas:a=[]}={}){const o=a.length?a:t,i=o.reduce(($,X)=>$+la(X),0),n=o.filter($=>$.status==="pago"),l=o.filter($=>$.status!=="pago"),d=o.filter($=>Wo($.data_vencimento,$.status)),m=n.reduce(($,X)=>$+la(X),0),f=l.reduce(($,X)=>$+la(X),0),b=d.reduce(($,X)=>$+la(X),0),S=i?m/i*100:0,k=i?b/i*100:0,N=Ds(o).map($=>({...$,peso:i?Math.round($.total/i*100):0})),g=N[0]||null,M=Is(o),z=l.filter($=>{const X=$s($.data_vencimento);return X>=0&&X<=7}),E=z.reduce(($,X)=>$+la(X),0),K=As({total:i,pendente:f,vencido:b,taxaVencido:k,contasVencidas:d,contasPendentes:l}),ne=Bs(K),G=[];b>0&&G.push({level:"Alta",title:"Regularizar contas vencidas",description:`${d.length} conta(s) em atraso somando ${st(b)}.`,action:"Abrir Financeiro > Contas",impact:st(b),tone:"danger"}),z.length&&G.push({level:"Alta",title:"Antecipar vencimentos próximos",description:`${z.length} obrigação(ões) vencem nos próximos 7 dias.`,action:"Priorizar caixa semanal",impact:st(E),tone:"warning"}),g&&i&&g.total/i>=.35&&G.push({level:"Média",title:`Revisar centro ${g.nome}`,description:`Este centro concentra ${g.peso}% do valor analisado.`,action:"Abrir Relatórios",impact:st(g.total),tone:"info"}),G.length||G.push({level:"Baixa",title:"Manter rotina de acompanhamento",description:"Nenhum risco operacional crítico foi identificado no recorte atual.",action:"Revisão semanal",impact:"Controle",tone:"success"});const q=qs({total:i,pago:m,pendente:f,vencido:b,taxaPago:S,taxaVencido:k,score:K,status:ne,centroCritico:g,vencemEm7Dias:z}),se=Fs({total:i,pago:m,pendente:f,vencido:b,taxaPago:S,taxaVencido:k,score:K,centroCritico:g,total7Dias:E,tendenciaMensal:M}),W=[b>0?`Priorizar a quitação ou renegociação dos vencidos (${st(b)}) antes de novas despesas.`:"Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.",E>0?`Reservar ${st(E)} para vencimentos dos próximos 7 dias.`:"Usar a folga dos próximos 7 dias para revisar centros de maior peso.",g?`Auditar lançamentos do centro ${g.nome}, que representa ${g.peso}% do recorte.`:"Classificar centros de custo para melhorar a qualidade analítica.",S<50?"Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.":"Preservar o ritmo de baixas e acompanhar desvios por centro."],re={"Qual meu maior risco agora?":b>0?`O maior risco agora é o saldo vencido de ${st(b)}, distribuído em ${d.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`:`O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${st(E)} vencendo em até 7 dias.`,"Onde estou gastando mais?":g?`O maior peso financeiro está em ${g.nome}, com ${st(g.total)} (${g.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`:"Ainda não há centro de custo dominante no recorte atual.","Como melhorar meu caixa?":`Priorize três movimentos: reduzir vencidos (${st(b)}), reservar caixa para 7 dias (${st(E)}) e revisar o centro de maior peso${g?` (${g.nome})`:""}.`,"Gerar resumo executivo":q},D=[se.liquidez,se.concentracao,se.curtoPrazo,se.comportamento];return{score:K,status:ne,executiveSummary:q,narrativa:se,totals:{total:i,pago:m,pendente:f,vencido:b,taxaPago:S,taxaVencido:k,total7Dias:E},priorities:G.slice(0,4),insights:D,recomendacoes:W,rankingCentros:N.slice(0,5),tendenciaMensal:M,respostas:re,quickQuestions:Object.keys(re)}}function Ls({voltar:t,empresaId:a,mostrarAviso:o}){var rt,bt,Rt,Gt,At,Ze,mt,Bt,qt,ut,vt,jt;function i(s){return`${Number(s||0).toFixed(1)}%`}function n(s,v){if(!s||v==="pago")return!1;const U=new Date;U.setHours(0,0,0,0);const le=new Date(s+"T00:00:00");return le.setHours(0,0,0,0),le<U}function l(s){return s?String(s).slice(0,7):""}function d(){const s=new Date;return`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`}function m(s){if(!s)return"";const[v,U]=s.split("-").map(Number),le=new Date(v,U-2,1);return`${le.getFullYear()}-${String(le.getMonth()+1).padStart(2,"0")}`}function f(s){if(!s)return"Todos";const[v,U]=s.split("-").map(Number);return new Date(v,U-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}function b(s){return s>=50?"#dc3545":s>=20?"#f59f00":"#12b886"}function S(s){return s==="critico"?"🚨":s==="risco"?"⚠️":s==="queda"?"✅":s==="alta"?"📈":s==="acao"?"🎯":s==="previsao"?"🔮":s==="meta"?"🎯":"ℹ️"}const[k,N]=c.useState([]),[g,M]=c.useState([]),[z,E]=c.useState([]),[K,ne]=c.useState(!0),[G,q]=c.useState(d()),[se,W]=c.useState("todas"),[re,D]=c.useState(""),[$,X]=c.useState(""),[je,pe]=c.useState("dre"),[ge,Ce]=c.useState("");c.useEffect(()=>{ie()},[a]);async function ie(){if(!a){N([]),M([]),E([]),ne(!1);return}ne(!0);const{data:s,error:v}=await T.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",a).order("data_vencimento",{ascending:!0}),{data:U,error:le}=await T.from("df_centros_custo").select("*").eq("empresa_id",a).order("nome",{ascending:!0}),{data:ye,error:ve}=await T.from("df_filiais").select("*").eq("empresa_id",a).order("nome",{ascending:!0});v&&(o==null||o(v.message,"erro")),le&&(o==null||o(le.message,"erro")),ve&&(o==null||o(ve.message,"erro")),N((s||[]).filter(be=>!be.excluido_em&&!be.deleted_at)),M(U||[]),E(ye||[]),ne(!1)}const y=c.useMemo(()=>k.filter(s=>se==="pendentes"?s.status!=="pago":se==="pagas"?s.status==="pago":se==="vencidas"?n(s.data_vencimento,s.status):!0).filter(s=>G?l(s.data_vencimento)===G:!0).filter(s=>re?s.centro_custo_id===re:!0).filter(s=>$?s.filial_id===$:!0),[k,G,se,re,$]),me=c.useMemo(()=>{const s=m(G||d());return k.filter(v=>l(v.data_vencimento)===s).filter(v=>re?v.centro_custo_id===re:!0).filter(v=>$?v.filial_id===$:!0)},[k,G,re,$]),I=y.reduce((s,v)=>s+Number(v.valor||0),0),te=y.filter(s=>s.status==="pago").reduce((s,v)=>s+Number(v.valor||0),0),Y=y.filter(s=>n(s.data_vencimento,s.status)).reduce((s,v)=>s+Number(v.valor||0),0),J=I-te,C=me.reduce((s,v)=>s+Number(v.valor||0),0),Z=I-C,Te=C?Z/C*100:0,Ee=C?Math.max(I+Z,0):I,we=Number(String(ge||"").replace(",",".")),O=!isNaN(we)&&we>0,fe=O?I/we*100:0,Be=I?te/I*100:0,A=I?Y/I*100:0,V=y.reduce((s,v)=>{const U=v.centro_custo_id||"sem-centro";return s[U]||(s[U]=[]),s[U].push(v),s},{}),_e=Object.keys(V).map(s=>{const v=V[s],U=g.find(be=>be.id===s),le=v.reduce((be,Fe)=>be+Number(Fe.valor||0),0),ye=v.filter(be=>be.status==="pago").reduce((be,Fe)=>be+Number(Fe.valor||0),0),ve=v.filter(be=>n(be.data_vencimento,be.status)).reduce((be,Fe)=>be+Number(Fe.valor||0),0);return{id:s,nome:(U==null?void 0:U.nome)||"Sem centro",total:le,pago:ye,pendente:le-ye,vencido:ve,percentual:I?le/I*100:0}}).sort((s,v)=>v.total-s.total),he=_e[0]||null,F=((rt=_e[0])==null?void 0:rt.total)||0,ee=g.find(s=>s.id===re),He=y.filter(s=>s.centro_custo_id).length,Pe=y.filter(s=>!s.centro_custo_id).length,qe=y.length?He/y.length*100:0,It=_e.find(s=>s.id==="sem-centro"),Qe=!!(It&&It.total>0),lt=[...y].sort((s,v)=>Number(v.valor||0)-Number(s.valor||0)).slice(0,5);let Le=100;Y>0&&(Le-=30),(he==null?void 0:he.percentual)>=60&&(Le-=20),qe<40&&y.length>0&&(Le-=25),Z>0&&Te>=20&&(Le-=15),O&&fe>100&&(Le-=25),J>te&&I>0&&(Le-=10),Le=Math.max(Le,0);let pt={titulo:"Saúde financeira boa",etiqueta:"Saudável",emoji:"✅",cor:"#12b886",descricao:"Os indicadores estão equilibrados para o filtro atual."};Le<75&&Le>=45&&(pt={titulo:"Saúde financeira em atenção",etiqueta:"Atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Existem pontos que merecem acompanhamento: concentração, variação mensal, meta e classificação."}),Le<45&&(pt={titulo:"Saúde financeira crítica",etiqueta:"Crítico",emoji:"🚨",cor:"#dc3545",descricao:"Há sinais relevantes de risco. Priorize vencidos, metas estouradas, concentração e contas sem centro."});let _t={titulo:"Qualidade dos dados boa",emoji:"✅",cor:"#12b886",descricao:"A maioria das contas está classificada por centro de custo."};qe<80&&qe>=40&&(_t={titulo:"Qualidade dos dados em atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Parte das contas ainda está sem centro. A análise pode ficar parcialmente limitada."}),qe<40&&y.length>0&&(_t={titulo:"Qualidade dos dados crítica",emoji:"🚨",cor:"#dc3545",descricao:"Grande parte das contas está sem centro. Classifique as despesas para liberar análises confiáveis."});const Je=[];if(qe<40&&y.length>0&&Je.push({tipo:"critico",texto:"A análise gerencial está limitada porque a maior parte das despesas está sem centro de custo. Classifique os lançamentos antes de tomar decisões estratégicas."}),O&&(fe>100?Je.push({tipo:"meta",texto:`Meta mensal estourada: o total filtrado atingiu ${i(fe)} da meta de ${oe(we)}.`}):fe>=80?Je.push({tipo:"meta",texto:`Atenção à meta: você já consumiu ${i(fe)} da meta mensal.`}):Je.push({tipo:"meta",texto:`Meta sob controle: consumo atual em ${i(fe)} da meta mensal.`})),Y>0){const s=y.filter(v=>n(v.data_vencimento,v.status)).length;Je.push({tipo:"risco",texto:`Contas vencidas detectadas: ${s} conta(s), somando ${oe(Y)}. Priorize pagamento para evitar juros.`})}!re&&(he==null?void 0:he.percentual)>=60&&he.id!=="sem-centro"&&Je.push({tipo:"risco",texto:`Alto risco de concentração: ${he.nome} representa ${i(he.percentual)} dos custos filtrados.`}),G&&I>0&&(C===0?Je.push({tipo:"previsao",texto:`${f(G)} tem ${oe(I)} em contas. Ainda não há base anterior suficiente para tendência.`}):Z>0?Je.push({tipo:"alta",texto:`Crescimento de ${oe(Z)} frente a ${f(m(G))}, variação de ${i(Te)}.`}):Z<0&&Je.push({tipo:"queda",texto:`Redução de ${oe(Math.abs(Z))} frente ao mês anterior, queda de ${i(Math.abs(Te))}.`}),Je.push({tipo:"previsao",texto:`Se o padrão continuar, o próximo mês pode fechar próximo de ${oe(Ee)}.`})),Je.length===0&&Je.push({tipo:"info",texto:"Nenhum alerta relevante encontrado para os filtros selecionados."});const Vt=c.useMemo(()=>{const s={};return k.forEach(v=>{if(re&&v.centro_custo_id!==re||$&&v.filial_id!==$)return;const U=l(v.data_vencimento);if(!U)return;s[U]||(s[U]={mes:U,total:0,pago:0,pendente:0,vencido:0});const le=Number(v.valor||0);s[U].total+=le,v.status==="pago"?s[U].pago+=le:s[U].pendente+=le,n(v.data_vencimento,v.status)&&(s[U].vencido+=le)}),Object.values(s).sort((v,U)=>v.mes.localeCompare(U.mes)).slice(-6)},[k,re,$]),gt=c.useMemo(()=>{const s={};return y.forEach(v=>{var ve;const U=v.filial_id||"sem-filial",le=((ve=v.df_filiais)==null?void 0:ve.nome)||"Sem filial";s[U]||(s[U]={id:U,nome:le,total:0,pago:0,pendente:0,vencido:0,qtd:0});const ye=Number(v.valor||0);s[U].total+=ye,s[U].qtd+=1,v.status==="pago"?s[U].pago+=ye:s[U].pendente+=ye,n(v.data_vencimento,v.status)&&(s[U].vencido+=ye)}),Object.values(s).map(v=>({...v,percentual:I?v.total/I*100:0})).sort((v,U)=>U.total-v.total)},[y,I]),ea=c.useMemo(()=>{const s=te,v=J,U=Y,le=Ee,ye=I?Math.max(0,100-A):100;return[{linha:"Realizado",valor:s,descricao:"Contas pagas no filtro"},{linha:"A realizar",valor:v,descricao:"Pendências abertas"},{linha:"Risco vencido",valor:U,descricao:"Parte atrasada que exige ação"},{linha:"Previsão próximo mês",valor:le,descricao:"Tendência gerencial simples"},{linha:"Eficiência",valor:ye,descricao:"Quanto menor o vencido, melhor",percentual:!0}]},[te,J,Y,Ee,I,A]),Se=c.useMemo(()=>[{name:"Pago",value:te,color:"#12b886"},{name:"Pendente",value:Math.max(J-Y,0),color:"#f59f00"},{name:"Vencido",value:Y,color:"#dc3545"}].filter(s=>s.value>0),[te,J,Y]),Q=c.useMemo(()=>_e.slice(0,6).map(s=>({nome:s.nome.length>14?`${s.nome.slice(0,14)}…`:s.nome,total:Number(s.total.toFixed(2))})),[_e]),L=c.useMemo(()=>{const s=y.length?I/y.length:0,v=y.filter(Ie=>Ie.status!=="pago"),U=y.filter(Ie=>n(Ie.data_vencimento,Ie.status)),le=lt[0]||null,ye=le&&I?Number(le.valor||0)/I*100:0,ve=lt.slice(0,3).reduce((Ie,tt)=>Ie+Number(tt.valor||0),0),be=I?ve/I*100:0,de=y.filter(Ie=>{var tt;return(tt=Ie.df_contas_recorrentes)==null?void 0:tt.tipo_recorrencia}).reduce((Ie,tt)=>Ie+Number(tt.valor||0),0),De=I?de/I*100:0,at=(he==null?void 0:he.percentual)||0,xe=I?(J+Y)/I*100:0,dt=y.filter(Ie=>s>0&&Number(Ie.valor||0)>=s*2.5).sort((Ie,tt)=>Number(tt.valor||0)-Number(Ie.valor||0)).slice(0,5);let Ct="baixo",ft="#12b886",xt="Inteligência financeira saudável";Le<45||xe>=55||A>=25?(Ct="alto",ft="#dc3545",xt="Inteligência financeira em alerta"):(Le<75||xe>=30||at>=50||qe<80)&&(Ct="medio",ft="#f59f00",xt="Inteligência financeira em atenção");const et=[];U.length>0&&et.push(`Priorizar ${U.length} conta(s) vencida(s), somando ${oe(Y)}.`),qe<80&&Pe>0&&et.push(`Classificar ${Pe} conta(s) sem centro para aumentar a confiabilidade do motor.`),he&&he.id!=="sem-centro"&&at>=50&&et.push(`Revisar concentração em ${he.nome}, que representa ${i(at)} do filtro.`),O&&fe>=80&&et.push(fe>100?"Revisar meta mensal: o limite foi ultrapassado.":"Acompanhar meta mensal: consumo acima de 80%."),dt.length>0&&et.push(`Auditar ${dt.length} lançamento(s) acima de 2,5x o ticket médio.`),et.length===0&&et.push("Manter acompanhamento semanal dos indicadores e revisar centros de maior valor.");const Ft=[{label:"Próximo mês",value:Ee,sub:"projeção por tendência simples"},{label:"Risco em aberto",value:J+Y,sub:`${i(xe)} do total filtrado`},{label:"Recorrente",value:de,sub:`${i(De)} do total`},{label:"Top 3 despesas",value:ve,sub:`${i(be)} do total`}];return{titulo:xt,nivel:Ct,cor:ft,ticketMedio:s,riscoCaixa:xe,paretoTop3:ve,paretoTop3Percentual:be,percentualRecorrente:De,maiorDespesa:le,maiorDespesaPercentual:ye,anomalias:dt,acoes:et,previsoes:Ft,pendentesAbertas:v.length}},[y,I,J,Y,A,Le,he,qe,Pe,O,fe,lt,Ee]),B=c.useMemo(()=>zi({contas:k,contasFiltradas:y}),[k,y]),ue=c.useMemo(()=>{const s=Vt.length?Vt:[],v=s.map(et=>Number(et.total||0)),U=v.length?v.reduce((et,Ft)=>et+Ft,0)/v.length:I,le=v.length?v[v.length-1]:I,ye=v.length>1?v[v.length-2]:le,ve=le-ye,be=I?Math.min((Y+J)/I,1.5):0,Fe=Math.max(le+ve*.35,0),de=Math.max(Fe+ve*.55,0),De=Math.max(de+ve*.75,0),at=Math.min(100,Math.max(0,A+be*35+((he==null?void 0:he.percentual)>=60?12:0)+(qe<80?10:0))),xe=at>=65?"Alto":at>=35?"Moderado":"Baixo",dt=at>=65?"#dc3545":at>=35?"#f59f00":"#12b886",Ct=ve>0?"alta":ve<0?"queda":"estável",ft=O?{meta:we,atual:I,falta:Math.max(we-I,0),projetado:Fe,chance:Fe<=we?"Alta":Fe<=we*1.15?"Média":"Baixa",percentualProjetado:we?Fe/we*100:0}:null,xt=[];return at>=65&&xt.push("Risco projetado alto para os próximos 30 dias. Priorize vencidos e reduza concentração."),De>Math.max(U,1)*1.25&&xt.push("Forecast 90 dias indica possível aceleração de despesas acima da média histórica."),ft&&ft.percentualProjetado>100&&xt.push("A previsão de 30 dias pode ultrapassar a meta mensal cadastrada."),qe<80&&y.length>0&&xt.push("A qualidade da previsão melhora após classificar contas sem centro de custo."),xt.length===0&&xt.push("Cenário projetado controlado para os filtros atuais."),{mediaMovel:U,variacao:ve,tendencia:Ct,previsao30:Fe,previsao60:de,previsao90:De,riscoProjetado:at,statusRisco:xe,corRisco:dt,metaForecast:ft,alertas:xt,serie:[...s.map(et=>({mes:et.mes,realizado:et.total,previsto:null})),{mes:"+30d",realizado:null,previsto:Fe},{mes:"+60d",realizado:null,previsto:de},{mes:"+90d",realizado:null,previsto:De}]}},[Vt,I,Y,J,A,he,qe,O,we,y.length]);function Re(){return y.map(s=>{var v,U,le;return[s.descricao||"Sem descrição",Number(s.valor||0),io(s.data_vencimento),n(s.data_vencimento,s.status)?"vencido":s.status,((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro",((U=s.df_filiais)==null?void 0:U.nome)||"Sem filial",((le=s.df_contas_recorrentes)==null?void 0:le.tipo_recorrencia)||"Não recorrente"]})}function Ke(){var be,Fe,de,De,at;const s=ea.map(xe=>`
      <tr>
        <td>${Ge(xe.linha)}</td>
        <td class="valor">${xe.percentual?i(xe.valor):oe(xe.valor)}</td>
        <td>${Ge(xe.descricao)}</td>
      </tr>
    `).join(""),v=Re().map(xe=>`
      <tr>${xe.map((dt,Ct)=>`<td class="${Ct===1?"valor":""}">${Ct===1?oe(dt):Ge(dt)}</td>`).join("")}</tr>
    `).join(""),U=_e.map(xe=>`
      <tr>
        <td>${Ge(xe.nome)}</td>
        <td class="valor">${oe(xe.total)}</td>
        <td class="valor">${oe(xe.pago)}</td>
        <td class="valor">${oe(xe.pendente)}</td>
        <td class="valor">${oe(xe.vencido)}</td>
        <td class="valor">${i(xe.percentual)}</td>
      </tr>
    `).join(""),le=B.priorities.map(xe=>`
      <tr>
        <td>${Ge(xe.level)}</td>
        <td>${Ge(xe.title)}</td>
        <td>${Ge(xe.description)}</td>
        <td class="valor">${Ge(xe.impact)}</td>
        <td>${Ge(xe.action)}</td>
      </tr>
    `).join(""),ye=B.recomendacoes.map((xe,dt)=>`
      <div class="insight"><strong>${dt+1}.</strong> ${Ge(xe)}</div>
    `).join(""),ve=`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório Financeiro - Dona Flor</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; background: #fff; }
            h1 { margin: 0 0 4px; font-size: 24px; }
            h2 { margin: 24px 0 10px; font-size: 17px; color: #0f766e; }
            .meta { color: #64748b; margin-bottom: 18px; font-size: 12px; }
            .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; }
            .numero { display: block; font-size: 18px; font-weight: 800; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; vertical-align: top; }
            th { background: #ecfdf5; color: #065f46; }
            .valor { text-align: right; white-space: nowrap; }
            .insight { border-left: 4px solid #0d9488; padding: 8px 10px; background: #f0fdfa; margin: 6px 0; }
            .narrative { border: 1px solid #c7d2fe; border-radius: 14px; padding: 12px; background: #eef2ff; margin: 8px 0; }
            .narrative strong { display: block; color: #3730a3; margin-bottom: 4px; }
            .cover { border-radius: 18px; padding: 18px; background: linear-gradient(135deg, #052e2b, #0f766e); color: #fff; margin-bottom: 16px; }
            .cover h1 { color: #fff; }
            .cover .meta { color: rgba(255,255,255,.78); margin-bottom: 0; }
            .score { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.12); font-weight: 800; }
            .footer { margin-top: 24px; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @page { size: A4; margin: 12mm; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="cover">
            <h1>PDF Executive Premium — Copilot IA 11.8</h1>
            <div class="meta">
              Gerado em ${new Date().toLocaleString("pt-BR")} • ${Ge(f(G||d()))}<br />
              Centro: ${Ge(re?(ee==null?void 0:ee.nome)||"Selecionado":"Todos")} • Filial: ${Ge($?((be=z.find(xe=>xe.id===$))==null?void 0:be.nome)||"Selecionada":"Todas")} • Status: ${Ge(se)}
            </div>
            <div class="score">Score Copilot: ${B.score}/100 • ${Ge(B.status.label)}</div>
          </div>
          <h2>Executive AI Summary</h2>
          <div class="insight">${Ge(B.executiveSummary)}</div>
          <h2>AI Narrative & Insights 11.8</h2>
          <div class="narrative"><strong>Parecer executivo contextual</strong>${Ge(((Fe=B.narrativa)==null?void 0:Fe.parecer)||B.executiveSummary)}</div>
          <div class="narrative"><strong>Liquidez</strong>${Ge(((de=B.narrativa)==null?void 0:de.liquidez)||"")}</div>
          <div class="narrative"><strong>Concentração</strong>${Ge(((De=B.narrativa)==null?void 0:De.concentracao)||"")}</div>
          <div class="narrative"><strong>Curto prazo</strong>${Ge(((at=B.narrativa)==null?void 0:at.curtoPrazo)||"")}</div>
          <div class="cards">
            <div class="card"><span class="label">Total</span><span class="numero">${oe(I)}</span></div>
            <div class="card"><span class="label">Pago</span><span class="numero">${oe(te)}</span></div>
            <div class="card"><span class="label">Pendente</span><span class="numero">${oe(J)}</span></div>
            <div class="card"><span class="label">Vencido</span><span class="numero">${oe(Y)}</span></div>
          </div>
          <h2>Smart Priority Engine</h2>
          <table><thead><tr><th>Nível</th><th>Prioridade</th><th>Leitura</th><th>Impacto</th><th>Ação</th></tr></thead><tbody>${le||'<tr><td colspan="5">Nenhuma prioridade crítica encontrada.</td></tr>'}</tbody></table>
          <h2>Recomendações acionáveis</h2>
          ${ye}
          <h2>DRE Gerencial</h2>
          <table><thead><tr><th>Linha</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>${s}</tbody></table>
          <h2>Insights executivos</h2>
          ${Je.map(xe=>`<div class="insight">${Ge(xe.texto)}</div>`).join("")}
          <h2>Ranking por centro</h2>
          <table><thead><tr><th>Centro</th><th>Total</th><th>Pago</th><th>Pendente</th><th>Vencido</th><th>Participação</th></tr></thead><tbody>${U||'<tr><td colspan="6">Nenhum centro encontrado.</td></tr>'}</tbody></table>
          <h2>Contas filtradas</h2>
          <table><thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Centro</th><th>Filial</th><th>Recorrência</th></tr></thead><tbody>${v||'<tr><td colspan="7">Nenhuma conta encontrada.</td></tr>'}</tbody></table>
          <div class="footer">Relatório gerado pelo Sistema Dona Flor Financeiro.</div>
        </body>
      </html>`;ws(ve,()=>o==null?void 0:o("Não foi possível abrir a impressão do relatório.","erro"))}function Ye(){const s=["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],v=Re().map(U=>[U[0],Number(U[1]||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}),U[2],U[3],U[4],U[5],U[6]]);js({filename:"relatorio-financeiro-dona-flor.csv",headers:s,rows:v})}function Ue(){var v,U,le,ye,ve,be,Fe;const s=[{name:"Resumo",rows:[["Relatório Avançado 11.8 - AI Narrative & Insights"],["Gerado em",new Date().toLocaleString("pt-BR")],["Mês",G||"Todos"],["Centro",re?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"],["Filial",$?((v=z.find(de=>de.id===$))==null?void 0:v.nome)||"Selecionada":"Todas"],[],["Indicador","Valor"],["Total",I],["Pago",te],["Pendente",J],["Vencido",Y],["Score Copilot IA",B.score],["Status Copilot IA",B.status.label],["Nível inteligência 11.3",L.nivel],["Risco caixa %",L.riscoCaixa],["Ticket médio",L.ticketMedio]]},{name:"DRE",rows:[["Linha","Valor","Descrição"],...ea.map(de=>[de.linha,de.valor,de.descricao])]},{name:"Contas",rows:[["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],...Re()]},{name:"Ranking",rows:[["Centro","Total","Pago","Pendente","Vencido","Participação"],..._e.map(de=>[de.nome,de.total,de.pago,de.pendente,de.vencido,`${i(de.percentual)}`])]},{name:"Inteligencia 11.3",rows:[["Indicador","Valor","Observação"],["Nível",L.nivel,L.titulo],["Ticket médio",L.ticketMedio,"Média por conta filtrada"],["Risco caixa %",L.riscoCaixa,"Pendente + vencido sobre total"],["Top 3 despesas",L.paretoTop3,`${i(L.paretoTop3Percentual)} do total`],["Recorrente %",L.percentualRecorrente,"Peso das contas recorrentes"],[],["Ações recomendadas"],...L.acoes.map((de,De)=>[De+1,de])]},{name:"Copilot IA 11.8",rows:[["Executive AI Summary"],[B.executiveSummary],[],["Score",B.score,B.status.label],[],["AI Narrative 11.8"],["Parecer contextual",((U=B.narrativa)==null?void 0:U.parecer)||""],["Liquidez",((le=B.narrativa)==null?void 0:le.liquidez)||""],["Concentração",((ye=B.narrativa)==null?void 0:ye.concentracao)||""],["Curto prazo",((ve=B.narrativa)==null?void 0:ve.curtoPrazo)||""],["Comportamento",((be=B.narrativa)==null?void 0:be.comportamento)||""],[],["Anomalias contextuais"],...(((Fe=B.narrativa)==null?void 0:Fe.anomalias)||[]).map((de,De)=>[De+1,de]),[],["Total",B.totals.total],["Pago",B.totals.pago],["Pendente",B.totals.pendente],["Vencido",B.totals.vencido],[],["Smart Priority Engine"],["Nível","Prioridade","Descrição","Impacto","Ação"],...B.priorities.map(de=>[de.level,de.title,de.description,de.impact,de.action]),[],["Recomendações acionáveis"],...B.recomendacoes.map((de,De)=>[De+1,de]),[],["Drill-down analytics"],["Centro","Total","Pendente","Vencido","Peso","Risco"],...B.rankingCentros.map(de=>[de.nome,de.total,de.pendente,de.vencido,`${de.peso}%`,`${de.risco}%`])]},{name:"Preditiva 11.4",rows:[["Indicador","Valor","Observação"],["Forecast 30 dias",ue.previsao30,ue.tendencia],["Forecast 60 dias",ue.previsao60,"Projeção intermediária"],["Forecast 90 dias",ue.previsao90,"Projeção estendida"],["Risco projetado %",ue.riscoProjetado,ue.statusRisco],["Média móvel",ue.mediaMovel,"Histórico filtrado"],["Variação base",ue.variacao,"Último mês vs anterior"],[],["Alertas preditivos"],...ue.alertas.map((de,De)=>[De+1,de])]}];_i("relatorio-avancado-dona-flor.xlsx",ks(s))}function Xe(){q(""),W("todas"),D(""),X(""),Ce("")}const We=qe<40?"A análise gerencial está limitada por falta de classificação em centros de custo.":Y>0?"Existem pendências vencidas que devem ser priorizadas.":O&&fe>100?"A meta mensal foi ultrapassada no filtro atual.":Z>0?"Os custos cresceram em relação ao mês anterior. Acompanhe os maiores centros.":"O cenário atual está controlado para os filtros selecionados.";return e.jsxs("div",{className:"relatorios-page",style:u.page,children:[e.jsx("style",{children:Vs}),e.jsx("style",{children:Os}),e.jsxs("div",{className:"relatorio-print-header",children:[e.jsx("h1",{children:"Relatório Financeiro Gerencial"}),e.jsx("p",{children:"Empresa: Dona Flor"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]}),e.jsxs("p",{children:["Centro: ",re?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"," • Filial: ",$?((bt=z.find(s=>s.id===$))==null?void 0:bt.nome)||"Selecionada":"Todas"," • Mês: ",G||"Todos"," • Status: ",se]})]}),e.jsx("div",{className:"relatorio-print-footer",children:"Relatório gerado pelo Sistema Dona Flor Financeiro"}),e.jsxs("header",{className:"no-print",style:u.hero,children:[e.jsxs("div",{children:[e.jsxs("div",{style:u.actionsTop,children:[e.jsx("button",{style:u.btnVoltar,onClick:t,children:"← Voltar"}),e.jsx("button",{style:u.btnExcel,onClick:Ue,children:"Excel"}),e.jsx("button",{style:u.btnPDF,onClick:Ke,children:"PDF"}),e.jsx("button",{style:u.btnCSV,onClick:Ye,children:"CSV"})]}),e.jsx("h1",{style:u.titulo,children:"📊 Relatórios Gerenciais"}),e.jsx("p",{style:u.descricaoTela,children:"Fase 11.8: AI Narrative & Insights com parecer executivo contextual, anomalias e recomendações inteligentes."})]}),e.jsxs("div",{style:u.heroBadge,children:[e.jsx("span",{children:pt.emoji}),e.jsxs("strong",{children:[Le,"/100"]}),e.jsx("small",{children:pt.etiqueta})]})]}),e.jsxs("section",{className:"no-print relatorio-sticky-filtros",style:u.filtrosBox,children:[e.jsxs("div",{style:u.filtroHeader,children:[e.jsx("strong",{children:"🎛️ Filtros"}),e.jsxs("span",{style:u.filtroResumo,children:[f(G||d())," • ",re?(ee==null?void 0:ee.nome)||"Centro selecionado":"Todos os centros"," • ",$?((Rt=z.find(s=>s.id===$))==null?void 0:Rt.nome)||"Filial selecionada":"Todas as filiais"]}),e.jsx("button",{style:u.btnLimpar,onClick:Xe,children:"Limpar"})]}),e.jsxs("div",{style:u.filtrosGrid,children:[e.jsx("input",{style:u.input,placeholder:"Meta mensal. Ex: 5000",value:ge,onChange:s=>Ce(s.target.value)}),e.jsxs("select",{style:u.input,value:re,onChange:s=>D(s.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),g.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:u.input,value:$,onChange:s=>X(s.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),z.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:u.input,value:je,onChange:s=>pe(s.target.value),children:[e.jsx("option",{value:"dre",children:"Visão DRE"}),e.jsx("option",{value:"graficos",children:"Visão Gráficos"}),e.jsx("option",{value:"filiais",children:"Visão Filiais"}),e.jsx("option",{value:"inteligencia",children:"Inteligência 11.3"}),e.jsx("option",{value:"preditiva",children:"Preditiva 11.4"}),e.jsx("option",{value:"copilot",children:"Copilot IA 11.8"})]}),e.jsx("input",{style:u.input,type:"month",value:G,onChange:s=>q(s.target.value)})]}),e.jsx("div",{style:u.filtros,children:[["todas","Todas"],["pendentes","Pendentes"],["pagas","Pagas"],["vencidas","Vencidas"]].map(([s,v])=>e.jsx("button",{style:se===s?u.filtroAtivo:u.filtro,onClick:()=>W(s),children:v},s))})]}),K?e.jsx(Us,{}):e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:u.kpiGrid,children:[e.jsx(no,{titulo:"Total",valor:oe(I),detalhe:`${y.length} conta(s)`,emoji:"💼",cor:"#364fc7",progresso:100}),e.jsx(no,{titulo:"Pago",valor:oe(te),detalhe:`${i(Be)} do total`,emoji:"✅",cor:"#12b886",progresso:Be}),e.jsx(no,{titulo:"Pendente",valor:oe(J),detalhe:I?`${i(J/I*100)} das despesas`:"Sem pendência",emoji:"🟡",cor:"#f59f00",progresso:I?J/I*100:0}),e.jsx(no,{titulo:"Vencido",valor:oe(Y),detalhe:Y>0?`${i(A)} em atraso`:"Sem vencidos",emoji:"🚨",cor:"#dc3545",progresso:A})]}),e.jsxs("section",{style:u.advancedPanel,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"📈 Relatórios Avançados 11.1"}),e.jsx("p",{style:u.muted,children:"DRE gerencial, gráficos executivos, tendência, multiunidade, inteligência 11.3, preditiva 11.4 e AI Narrative 11.8."})]}),e.jsx("span",{style:u.badge,children:"Enterprise"})]}),je==="dre"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ae,{titulo:"DRE gerencial",emoji:"🧮",children:ea.map(s=>e.jsxs("div",{style:u.dreLinha,children:[e.jsxs("div",{style:u.dreTexto,children:[e.jsx("strong",{style:u.dreTitulo,children:s.linha}),e.jsx("small",{style:u.dreDescricao,children:s.descricao})]}),e.jsx("strong",{style:u.dreValor,children:s.percentual?i(s.valor):oe(s.valor)})]},s.linha))}),e.jsx(Ae,{titulo:"Tendência 6 meses",emoji:"📉",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:220,children:e.jsxs(ii,{data:Vt,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"mes"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>oe(s)}),e.jsx(oo,{type:"monotone",dataKey:"total",stroke:"#0d9488",strokeWidth:3,dot:!1}),e.jsx(oo,{type:"monotone",dataKey:"vencido",stroke:"#dc3545",strokeWidth:2,dot:!1})]})})})})]}),je==="graficos"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ae,{titulo:"Centros por valor",emoji:"📊",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:240,children:e.jsxs(yi,{data:Q,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"nome"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>oe(s)}),e.jsx(wi,{dataKey:"total",fill:"#0d9488",radius:[8,8,0,0]})]})})})}),e.jsx(Ae,{titulo:"Status financeiro",emoji:"🧭",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:240,children:e.jsxs(ki,{children:[e.jsx(Ci,{data:Se,dataKey:"value",nameKey:"name",outerRadius:85,label:!0,children:Se.map(s=>e.jsx(Ni,{fill:s.color},s.name))}),e.jsx(ja,{formatter:s=>oe(s)})]})})})})]}),je==="filiais"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ae,{titulo:"Ranking multiunidade",emoji:"🏢",children:[gt.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhuma filial encontrada nos filtros."}),gt.map((s,v)=>e.jsxs("div",{style:u.dreLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[v+1,". ",s.nome]}),e.jsxs("small",{children:[s.qtd," conta(s) • ",i(s.percentual)]})]}),e.jsx("strong",{children:oe(s.total)})]},s.id))]}),e.jsxs(Ae,{titulo:"Insight executivo",emoji:"🧠",children:[e.jsx("p",{style:u.executivoTexto,children:gt[0]?`${gt[0].nome} concentra ${i(gt[0].percentual)} do total filtrado. Use esta leitura para comparar unidades e priorizar gestão.`:"Sem dados multiunidade para o filtro atual."}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx(Me,{label:"Filiais",value:gt.length}),e.jsx(Me,{label:"Maior unidade",value:((Gt=gt[0])==null?void 0:Gt.nome)||"-"}),e.jsx(Me,{label:"Valor",value:gt[0]?oe(gt[0].total):"-"})]})]})]}),je==="inteligencia"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ae,{titulo:L.titulo,emoji:"🧠",badge:L.nivel.toUpperCase(),badgeColor:L.cor,children:[e.jsx("p",{style:u.executivoTexto,children:"Motor 11.3 analisando risco de caixa, concentração, tendência, recorrência, Pareto e qualidade dos dados para os filtros atuais."}),e.jsx(Tt,{value:Le,color:L.cor}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx(Me,{label:"Ticket médio",value:oe(L.ticketMedio)}),e.jsx(Me,{label:"Risco caixa",value:i(L.riscoCaixa)}),e.jsx(Me,{label:"Pendências",value:L.pendentesAbertas})]})]}),e.jsxs(Ae,{titulo:"Previsões e Pareto",emoji:"🔮",children:[e.jsx("div",{style:u.compareGrid,children:L.previsoes.map(s=>e.jsx(Me,{label:s.label,value:oe(s.value),sub:s.sub},s.label))}),L.maiorDespesa&&e.jsxs("p",{style:u.muted,children:["Maior despesa: ",e.jsx("strong",{children:L.maiorDespesa.descricao})," representa ",i(L.maiorDespesaPercentual)," do total filtrado."]})]}),e.jsx(Ae,{titulo:"Ações recomendadas",emoji:"✅",children:e.jsx("div",{style:u.insightList,children:L.acoes.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:v+1}),e.jsx("p",{children:s})]},v))})}),e.jsxs(Ae,{titulo:"Anomalias financeiras",emoji:"🕵️",children:[L.anomalias.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhuma anomalia acima de 2,5x o ticket médio foi encontrada."}),L.anomalias.map(s=>{var v;return e.jsxs("div",{style:u.topItem,children:[e.jsx("div",{style:u.medalha,children:"!"}),e.jsxs("div",{style:u.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[io(s.data_vencimento)," • ",((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro"]})]}),e.jsx("strong",{children:oe(s.valor)})]},s.id)})]})]}),je==="copilot"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ae,{titulo:"Executive AI Summary",emoji:"✨",badge:`${B.score}/100`,badgeColor:B.status.tone==="danger"?"#dc3545":B.status.tone==="warning"?"#f59f00":"#12b886",children:[e.jsx("p",{style:u.executivoTexto,children:B.executiveSummary}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx(Me,{label:"Total",value:oe(B.totals.total)}),e.jsx(Me,{label:"Pendente",value:oe(B.totals.pendente)}),e.jsx(Me,{label:"Vencido",value:oe(B.totals.vencido)})]})]}),e.jsxs(Ae,{titulo:"AI Narrative & Insights 11.8",emoji:"🧠",badge:"Contextual",badgeColor:"#7c3aed",children:[e.jsx("p",{style:u.executivoTexto,children:((At=B.narrativa)==null?void 0:At.parecer)||B.executiveSummary}),e.jsx("div",{style:u.insightList,children:[(Ze=B.narrativa)==null?void 0:Ze.liquidez,(mt=B.narrativa)==null?void 0:mt.concentracao,(Bt=B.narrativa)==null?void 0:Bt.curtoPrazo,(qt=B.narrativa)==null?void 0:qt.comportamento].filter(Boolean).map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"✦"}),e.jsx("p",{children:s})]},`${s}-${v}`))})]}),e.jsx(Ae,{titulo:"Anomalias contextuais",emoji:"⚠️",badge:`${((vt=(ut=B.narrativa)==null?void 0:ut.anomalias)==null?void 0:vt.length)||0} sinais`,badgeColor:"#dc3545",children:e.jsx("div",{style:u.insightList,children:(((jt=B.narrativa)==null?void 0:jt.anomalias)||[]).map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"!"}),e.jsx("p",{children:s})]},`${s}-${v}`))})}),e.jsx(Ae,{titulo:"Smart Priority Engine",emoji:"🚦",badge:`${B.priorities.length} ações`,badgeColor:"#0f766e",children:e.jsx("div",{style:u.insightList,children:B.priorities.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:v+1}),e.jsxs("p",{children:[e.jsx("strong",{children:s.title}),e.jsx("br",{}),s.description,e.jsx("br",{}),e.jsxs("small",{children:[s.level," impacto • ",s.impact," • ",s.action]})]})]},`${s.title}-${v}`))})}),e.jsx(Ae,{titulo:"Recomendações acionáveis",emoji:"✅",children:e.jsx("div",{style:u.insightList,children:B.recomendacoes.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"✓"}),e.jsx("p",{children:s})]},`${s}-${v}`))})}),e.jsxs(Ae,{titulo:"Drill-down analytics",emoji:"🔎",children:[B.rankingCentros.length===0&&e.jsx("p",{style:u.vazio,children:"Sem centros suficientes para análise."}),B.rankingCentros.map(s=>e.jsxs("div",{style:u.itemGrafico,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:oe(s.total)})]}),e.jsx(Tt,{value:Math.max(s.peso,4),color:b(s.peso)}),e.jsxs("small",{children:[s.peso,"% do recorte • risco ",s.risco,"% • vencido ",oe(s.vencido)]})]},s.nome))]})]})]}),e.jsxs("section",{style:u.dashboardGrid,children:[e.jsxs(Ae,{titulo:"Resumo executivo",emoji:"📌",destaque:!0,children:[e.jsx("p",{style:u.executivoTexto,children:We}),e.jsxs("div",{style:u.miniStats,children:[e.jsx(Me,{label:"Mês",value:f(G||d())}),e.jsx(Me,{label:"Centro",value:re?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"}),e.jsx(Me,{label:"Status",value:se})]})]}),e.jsxs(Ae,{titulo:pt.titulo,emoji:pt.emoji,badge:pt.etiqueta,badgeColor:pt.cor,children:[e.jsx("p",{style:u.muted,children:pt.descricao}),e.jsx(Tt,{value:Le,color:pt.cor}),e.jsxs("small",{children:[Le,"/100 pontos de saúde financeira"]})]}),e.jsxs(Ae,{titulo:_t.titulo,emoji:_t.emoji,badge:i(qe),badgeColor:_t.cor,children:[e.jsx("p",{style:u.muted,children:_t.descricao}),e.jsx(Tt,{value:qe,color:_t.cor}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx(Me,{label:"Total",value:y.length}),e.jsx(Me,{label:"Com centro",value:He}),e.jsx(Me,{label:"Sem centro",value:Pe})]})]}),e.jsx(Ae,{titulo:"Comparativo mensal",emoji:"📅",children:e.jsxs("div",{style:u.compareGrid,children:[e.jsx(Me,{label:"Mês atual",value:oe(I),sub:f(G||d())}),e.jsx(Me,{label:"Mês anterior",value:oe(C),sub:f(m(G||d()))}),e.jsx(Me,{label:"Variação",value:`${Z>0?"↑ +":Z<0?"↓ ":""}${oe(Z)}`,sub:i(Te)}),e.jsx(Me,{label:"Previsão",value:oe(Ee),sub:"próximo mês"})]})})]}),e.jsxs("section",{style:u.predictivePanel,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🔮 Predictive Intelligence Layer 11.4"}),e.jsx("p",{style:u.muted,children:"Forecast financeiro 30/60/90 dias, risco projetado e leitura preditiva da meta."})]}),e.jsx("span",{style:{...u.badge,color:ue.corRisco},children:ue.statusRisco})]}),e.jsxs("div",{style:u.predictiveGrid,children:[e.jsx(Me,{label:"Forecast 30d",value:oe(ue.previsao30),sub:ue.tendencia}),e.jsx(Me,{label:"Forecast 60d",value:oe(ue.previsao60),sub:"projeção"}),e.jsx(Me,{label:"Forecast 90d",value:oe(ue.previsao90),sub:"cenário"}),e.jsx(Me,{label:"Risco projetado",value:`${i(ue.riscoProjetado)}`,sub:ue.statusRisco})]}),e.jsx(Tt,{value:ue.riscoProjetado,color:ue.corRisco}),e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ae,{titulo:"Curva preditiva",emoji:"📈",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:230,children:e.jsxs(ii,{data:ue.serie,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"mes"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>s==null?"-":oe(s)}),e.jsx(oo,{type:"monotone",dataKey:"realizado",stroke:"#0d9488",strokeWidth:3,connectNulls:!0,dot:!1}),e.jsx(oo,{type:"monotone",dataKey:"previsto",stroke:"#7c3aed",strokeWidth:3,strokeDasharray:"6 4",connectNulls:!0,dot:!0})]})})})}),e.jsxs(Ae,{titulo:"Alertas preditivos",emoji:"🚦",children:[e.jsx("div",{style:u.insightList,children:ue.alertas.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"🔎"}),e.jsx("p",{children:s})]},v))}),ue.metaForecast&&e.jsxs("div",{style:u.metaForecastBox,children:[e.jsx("strong",{children:"🎯 Meta forecast"}),e.jsxs("small",{children:["Chance de cumprir: ",ue.metaForecast.chance]}),e.jsxs("small",{children:["Falta: ",oe(ue.metaForecast.falta)]}),e.jsx(Tt,{value:Math.min(ue.metaForecast.percentualProjetado,100),color:ue.metaForecast.percentualProjetado>100?"#dc3545":"#12b886"})]})]})]})]}),Qe&&e.jsxs("section",{className:"print-card",style:u.cardAlerta,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🚨 Ação prioritária"}),e.jsxs("p",{children:[i(It.percentual)," das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise."]})]}),e.jsx("button",{className:"no-print",style:u.btnAcao,onClick:t,children:"Ir para contas"})]}),O&&e.jsxs("section",{className:"print-card",style:u.cardMeta,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsx("strong",{children:"🎯 Meta mensal"}),e.jsx("span",{style:u.badge,children:i(fe)})]}),e.jsxs("p",{children:["Meta: ",oe(we)," • Atual: ",oe(I)]}),e.jsx(Tt,{value:Math.min(fe,100),color:fe>100?"#dc3545":fe>=80?"#f59f00":"#12b886"})]}),e.jsxs("section",{style:u.twoColumns,children:[e.jsx(Ae,{titulo:"Insights automáticos",emoji:"💡",children:e.jsx("div",{style:u.insightList,children:Je.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:S(s.tipo)}),e.jsx("p",{children:s.texto})]},v))})}),!re&&_e.length>0&&e.jsx(Ae,{titulo:"Distribuição por centro",emoji:"📊",children:_e.slice(0,5).map(s=>e.jsxs("div",{style:u.itemGrafico,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:i(s.percentual)})]}),e.jsx(Tt,{value:Math.max(s.percentual,4),color:b(s.percentual)}),e.jsxs("small",{children:[oe(s.total)," ",s.id==="sem-centro"&&e.jsx("b",{style:u.alertaTexto,children:" • Classificar"})]})]},s.id))})]}),e.jsxs("section",{style:u.twoColumns,children:[lt.length>0&&e.jsx(Ae,{titulo:"Top despesas",emoji:"🔥",children:lt.map((s,v)=>{var U;return e.jsxs("div",{style:u.topItem,children:[e.jsx("div",{style:u.medalha,children:v+1}),e.jsxs("div",{style:u.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[io(s.data_vencimento)," • ",((U=s.df_centros_custo)==null?void 0:U.nome)||"Sem centro"]})]}),e.jsx("strong",{children:oe(s.valor)})]},s.id)})}),e.jsx(Ae,{titulo:"Resultado do filtro",emoji:"🧾",children:e.jsxs("div",{style:u.resultGrid,children:[e.jsx(Me,{label:"Centros",value:_e.length}),e.jsx(Me,{label:"Contas",value:y.length}),e.jsx(Me,{label:"Dominante",value:he?he.nome:"-",sub:he?i(he.percentual):""})]})})]}),!re&&e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"🏆 Ranking por Centro"}),_e.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhum dado encontrado."}),e.jsx("div",{style:u.rankingGrid,children:_e.map((s,v)=>e.jsxs("div",{className:"print-card",style:u.cardRanking,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[v+1,". ",s.nome,s.id==="sem-centro"?" ⚠️":""]}),v===0&&e.jsx("small",{style:u.maiorCusto,children:"🔝 Maior custo"}),e.jsxs("small",{children:[i(s.percentual)," do total"]})]}),e.jsx("strong",{children:oe(s.total)})]}),e.jsx(Tt,{value:Math.max(F?s.total/F*100:0,4),color:b(s.percentual)}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",oe(s.pago)]}),e.jsxs("small",{children:["Pend: ",oe(s.pendente)]}),e.jsxs("small",{children:["Venc: ",oe(s.vencido)]})]})]},s.id))})]}),re&&e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"📊 Resumo do Centro"}),e.jsxs("div",{className:"print-card",style:u.cardRanking,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("strong",{children:(ee==null?void 0:ee.nome)||"Centro selecionado"}),e.jsx("strong",{children:oe(I)})]}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",oe(te)]}),e.jsxs("small",{children:["Pend: ",oe(J)]}),e.jsxs("small",{children:["Venc: ",oe(Y)]})]})]})]}),e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"📄 Contas do relatório"}),e.jsx("div",{style:u.contasGrid,children:y.map(s=>{var v;return e.jsxs("div",{className:"print-card",style:u.cardConta,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("strong",{children:s.descricao}),e.jsx("span",{children:oe(s.valor)})]}),e.jsxs("small",{children:[io(s.data_vencimento)," • ",((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro"," • ",n(s.data_vencimento,s.status)?"VENCIDO":s.status]})]},s.id)})})]})]})]})}function Us(){return e.jsxs("div",{style:u.skeletonArea,"aria-busy":"true","aria-label":"Carregando relatório",children:[e.jsx("section",{style:u.skeletonGrid,children:[1,2,3,4].map(t=>e.jsx("div",{style:u.skeletonCard},t))}),e.jsxs("section",{style:u.skeletonPanel,children:[e.jsx("div",{style:u.skeletonLineGrande}),e.jsx("div",{style:u.skeletonLine}),e.jsx("div",{style:u.skeletonLineCurta})]}),e.jsx("section",{style:u.skeletonGrid,children:[1,2].map(t=>e.jsx("div",{style:u.skeletonCardAlto},t))})]})}function Ge(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let i=0;i<8;i+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Ae({titulo:t,emoji:a,badge:o,badgeColor:i="#0d9488",children:n,destaque:l}){return e.jsxs("section",{className:"print-card",style:l?{...u.card,...u.cardDestaque}:u.card,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("strong",{children:[a," ",t]}),o&&e.jsx("span",{style:{...u.badge,color:i,borderColor:i},children:o})]}),n]})}function no({titulo:t,valor:a,detalhe:o,emoji:i,cor:n,progresso:l}){return e.jsxs("section",{className:"print-card",style:u.kpiCard,children:[e.jsx("div",{style:u.kpiIcon,children:i}),e.jsx("span",{style:u.kpiTitulo,children:t}),e.jsx("strong",{style:u.kpiValor,children:a}),e.jsx("small",{style:u.muted,children:o}),e.jsx(Tt,{value:Math.min(Math.max(l||0,0),100),color:n})]})}function Me({label:t,value:a,sub:o}){return e.jsxs("div",{style:u.miniStat,children:[e.jsx("small",{children:t}),e.jsx("strong",{children:a}),o&&e.jsx("span",{children:o})]})}function Tt({value:t,color:a}){return e.jsx("div",{style:u.barraFundo,children:e.jsx("div",{style:{...u.barraValor,width:`${Math.min(Math.max(t||0,3),100)}%`,background:a}})})}const Os=`
  /* FASE 11.0D — Anti Flicker real
     O pisca-pisca vinha das animações globais herdadas da Fase 7.7
     aplicadas em .relatorios-page > section a cada entrada na rota. */
  .relatorios-page,
  .relatorios-page *,
  .relatorios-page > section,
  .relatorios-page > header {
    animation: none !important;
    animation-delay: 0s !important;
    transition-property: background-color, border-color, color, box-shadow !important;
    filter: none !important;
  }

  .relatorios-page > section,
  .relatorios-page > header {
    opacity: 1 !important;
    transform: none !important;
    will-change: auto !important;
  }

  .relatorios-page .relatorio-sticky-filtros {
    position: relative !important;
    top: auto !important;
    z-index: 1 !important;
    transform: none !important;
    backface-visibility: visible !important;
    contain: layout paint !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .relatorios-page,
    .relatorios-page * {
      scroll-behavior: auto !important;
      animation: none !important;
      transition: none !important;
    }
  }
`,Vs=`
  .relatorio-print-header, .relatorio-print-footer { display: none; }
  @media (max-width: 900px) {
    .relatorios-page { padding: 12px !important; }
  }
  @media print {
    html, body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .relatorios-page { background: #fff !important; padding: 0 !important; color: #111 !important; max-width: none !important; font-size: 11px !important; }
    .relatorios-page h1 { font-size: 20px !important; margin: 0 0 4px 0 !important; }
    .relatorios-page h2 { font-size: 15px !important; margin: 14px 0 8px 0 !important; }
    .relatorios-page p { margin: 4px 0 !important; line-height: 1.35 !important; }
    .relatorio-print-header { display: block !important; text-align: center; border-bottom: 1px solid #ddd; margin-bottom: 12px; padding-bottom: 8px; }
    .relatorio-print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 5px; background: #fff; }
    .relatorio-print-footer::after { content: " • Página " counter(page); }
    .print-card { page-break-inside: avoid; break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; margin-bottom: 8px !important; padding: 8px !important; }
    section { page-break-inside: avoid; break-inside: avoid; }
    @page { size: A4; margin: 10mm 10mm 16mm 10mm; }
  }
`,u={page:{padding:20,maxWidth:1180,margin:"auto",fontFamily:"Inter, Arial, sans-serif",background:"linear-gradient(180deg, #f8fbfb 0%, #eef7f5 100%)",minHeight:"100vh",paddingBottom:90,color:"#0f172a"},hero:{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:14,flexWrap:"wrap"},actionsTop:{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"},titulo:{fontSize:30,margin:0},descricaoTela:{fontSize:14,color:"#64748b",marginTop:4,marginBottom:0},heroBadge:{minWidth:130,background:"#fff",border:"1px solid #dbeafe",borderRadius:20,padding:16,boxShadow:"0 10px 30px rgba(15,23,42,0.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:3},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:20},filtrosBox:{...Mt(),position:"relative",top:"auto",zIndex:1,border:"1px solid #e2e8f0",marginBottom:12,padding:12,boxShadow:"0 8px 22px rgba(15,23,42,0.05)",background:"rgba(255,255,255,0.92)"},filtroHeader:{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:10,marginBottom:8},filtroResumo:{color:"#64748b",fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},filtrosGrid:{display:"grid",gridTemplateColumns:"1.05fr 1.2fr 1.2fr 0.9fr 0.9fr",gap:8,alignItems:"center"},input:{width:"100%",padding:"9px 11px",borderRadius:11,border:"1px solid #d1d5db",boxSizing:"border-box",background:"#fff",minHeight:38,fontWeight:700,color:"#0f172a"},filtros:{display:"flex",gap:7,flexWrap:"wrap",marginTop:8},filtro:{border:"1px solid #d1d5db",background:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800,color:"#334155"},filtroAtivo:{border:"1px solid #0d9488",background:"#0d9488",color:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800},kpiGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14,marginBottom:16},kpiCard:{...Mt(),minHeight:130},kpiIcon:{width:38,height:38,borderRadius:14,background:"#f1f5f9",display:"grid",placeItems:"center",fontSize:20,marginBottom:8},kpiTitulo:{color:"#64748b",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:.3},kpiValor:{display:"block",fontSize:22,marginTop:4,marginBottom:4},dashboardGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:14,marginBottom:14},advancedPanel:{...Mt(),marginBottom:16,border:"1px solid #bfdbfe",background:"linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"},advancedGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14},dreLinha:{display:"grid",gridTemplateColumns:"1fr auto",gap:18,padding:"12px 0",borderBottom:"1px solid #eef2f7",alignItems:"center"},dreTexto:{display:"flex",flexDirection:"column",gap:4,minWidth:0},dreTitulo:{fontSize:16,lineHeight:1.2},dreDescricao:{color:"#64748b",fontSize:13,lineHeight:1.25,display:"block"},dreValor:{fontSize:16,whiteSpace:"nowrap",textAlign:"right"},chartBox:{width:"100%",height:250,minWidth:0},twoColumns:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14,marginBottom:14},card:Mt(),cardDestaque:{background:"linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)",border:"1px solid #ccfbf1"},cardAlerta:{...Mt(),background:"#fff5f5",border:"1px solid #fecaca",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},cardMeta:{...Mt(),border:"1px solid #fef3c7"},predictivePanel:{...Mt(),marginBottom:16,border:"1px solid #ddd6fe",background:"linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"},predictiveGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:10,marginBottom:8},metaForecastBox:{marginTop:12,padding:12,borderRadius:16,background:"#f8fafc",border:"1px solid #e2e8f0",display:"grid",gap:4},widgetHeader:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"},executivoTexto:{fontSize:16,lineHeight:1.5,margin:"6px 0 12px 0"},miniStats:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:8},miniStat:{background:"#f8fafc",border:"1px solid #eef2f7",borderRadius:14,padding:10,display:"flex",flexDirection:"column",gap:2,minWidth:0},grid3Compacto:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))",gap:8,marginTop:10},compareGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10},resultGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:10},badge:{border:"1px solid",borderRadius:999,padding:"5px 9px",fontSize:12,fontWeight:800,background:"#fff"},barraFundo:{height:9,background:"#e2e8f0",borderRadius:99,overflow:"hidden",margin:"10px 0"},barraValor:{height:"100%",borderRadius:99},insightList:{display:"grid",gap:8},insightItem:{display:"grid",gridTemplateColumns:"30px 1fr",gap:8,alignItems:"flex-start",background:"#f8fafc",borderRadius:14,padding:10,fontSize:14},insightEmoji:{width:30,height:30,borderRadius:12,background:"#fff",display:"grid",placeItems:"center"},itemGrafico:{marginTop:10},topItem:{display:"grid",gridTemplateColumns:"34px 1fr auto",gap:10,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #eef2f7"},medalha:{width:30,height:30,borderRadius:999,background:"#eef2ff",color:"#3730a3",display:"grid",placeItems:"center",fontWeight:800},topText:{display:"flex",flexDirection:"column",gap:2},rankingGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:12},cardRanking:Mt(),contasGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:10},cardConta:Mt(),cardLinha:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"},maiorCusto:{display:"block",color:"#12b886",fontWeight:"bold",fontSize:12},alertaTexto:{color:"#dc3545",fontWeight:"bold"},vazio:{opacity:.7,fontSize:14},skeletonArea:{display:"grid",gap:14,marginTop:12},skeletonGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14},skeletonCard:{height:130,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonCardAlto:{height:250,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonPanel:{...Mt(),display:"grid",gap:12},skeletonLineGrande:{height:22,width:"55%",borderRadius:999,background:"#e2e8f0"},skeletonLine:{height:14,width:"80%",borderRadius:999,background:"#e2e8f0"},skeletonLineCurta:{height:14,width:"35%",borderRadius:999,background:"#e2e8f0"},muted:{color:"#64748b",lineHeight:1.45},btnVoltar:xa("#64748b"),btnExcel:xa("#16a34a"),btnPDF:xa("#7c3aed"),btnCSV:xa("#0d9488"),btnLimpar:{...xa("#64748b"),padding:"7px 10px"},btnAcao:xa("#dc3545")};function Mt(){return{background:"#fff",padding:16,borderRadius:20,marginBottom:0,boxShadow:"0 12px 30px rgba(15,23,42,0.07)",border:"1px solid rgba(226,232,240,0.9)"}}function xa(t){return{background:t,color:"#fff",border:"none",padding:"9px 13px",borderRadius:12,fontWeight:800,cursor:"pointer"}}function Ta(t){if(!t)return null;const a=String(t).slice(0,10);return new Date(a+"T00:00:00")}function ha(t){const a=new Date;a.setHours(0,0,0,0);const o=Ta(t);if(!o)return 999999;const i=o-a;return Math.round(i/(1e3*60*60*24))}function Gs(t){const a=Ta(t);if(!a)return!1;const o=new Date;return a.getMonth()===o.getMonth()&&a.getFullYear()===o.getFullYear()}function Ws(t,a,o){const i=new Date(t,a,0).getDate(),n=Math.min(Number(o||1),i);return`${t}-${String(a).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function Hs(t,a,o){if(!(t!=null&&t.ativo)||(t.tipo_recorrencia||t.frequencia||"mensal")!=="mensal")return!1;const i=t.data_inicio?Ta(t.data_inicio):null;if(!i)return!0;const n=new Date(a,o-1,1),l=new Date(a,o,0);return i<=l&&n>=new Date(i.getFullYear(),i.getMonth(),1)}function Pi(t){var o;const a=((o=t==null?void 0:t.df_contas_recorrentes)==null?void 0:o.tipo_recorrencia)||(t==null?void 0:t.tipo_recorrencia)||"";return String(a||"mensal")}function Ri(t){const a=String(t||"mensal").toLowerCase();return{mensal:"Mensal",semanal:"Semanal",anual:"Anual",quinzenal:"Quinzenal"}[a]||kt(a)}function Ks({styles:t,formatarValor:a,navegarPara:o,contasAbertasDashboard:i,mostrarContasDashboard:n,setMostrarContasDashboard:l,busca:d,setBusca:m,estaVencida:f,formatarData:b,abrirConfirmacao:S,marcarComoPago:k}){return e.jsxs("section",{className:`dashboard-open-accounts content-block ${n?"accounts-expanded":"accounts-collapsed"}`,style:t.bloco,children:[e.jsxs("div",{className:"dashboard-section-header dashboard-section-header-accounts",children:[e.jsxs("div",{className:"dashboard-section-title-wrap",children:[e.jsx("strong",{children:"💳 Contas em aberto"}),e.jsxs("small",{children:["Mais novas primeiro • ",i.length," conta(s)"]})]}),e.jsxs("div",{className:"dashboard-section-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>o("contas"),children:"Ver todas"}),e.jsx("button",{className:"note-toggle-small",type:"button",onClick:()=>l(!n),title:n?"Recolher contas em aberto":"Expandir contas em aberto","aria-label":n?"Recolher contas em aberto":"Expandir contas em aberto",children:n?"−":"+"})]})]}),n&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"dashboard-inline-filter",children:e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro ou observação...",value:d,onChange:N=>m(N.target.value)})}),i.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma conta em aberto para os filtros atuais."}),e.jsx("div",{className:"dashboard-open-list",children:i.slice(0,8).map(N=>{var M;const g=f(N.data_vencimento,N.status);return e.jsxs("div",{className:`dashboard-account-row ${g?"account-row-vencido":"account-row-pendente"}`,children:[e.jsxs("div",{children:[e.jsx("strong",{children:N.descricao}),e.jsxs("div",{className:"dashboard-account-meta",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",b(N.data_vencimento)]}),e.jsx("span",{className:"account-center-label",children:((M=N.df_centros_custo)==null?void 0:M.nome)||"Sem centro"}),N.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",Ri(Pi(N))]})]}),N.observacao&&e.jsxs("small",{className:"account-note-preview",children:["Obs: ",N.observacao]})]}),e.jsxs("div",{className:"dashboard-account-row-actions",children:[e.jsx("span",{className:"dashboard-account-value",children:a(N.valor)}),e.jsx("span",{className:`status-pill ${g?"status-vencido":"status-pendente"}`,children:g?"Vencido":"Pendente"}),e.jsx("button",{className:"dashboard-paid-button",style:t.btnPago,onClick:()=>S({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${N.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>k(N.id)}),children:"Pago"})]})]},N.id)})})]})]})}function Ys({styles:t,navegarPara:a,notasPendentes:o,notasCriticas:i,notasUrgentes:n,mostrarNotas:l,setMostrarNotas:d,formatarData:m,alternarNotaConcluida:f,abrirEdicaoNota:b,abrirConfirmacao:S,excluirNota:k}){return e.jsxs("section",{className:`no-print dashboard-notes-card ${l?"notes-expanded":"notes-collapsed"}`,children:[e.jsxs("div",{style:t.notasHeaderNovo,className:"notes-header-clean dashboard-notes-content",children:[e.jsxs("div",{className:"notes-title-wrap",children:[e.jsx("strong",{className:"notes-title",children:"📝 Bloco de Notas"}),e.jsxs("div",{className:"notes-stats-row",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[o.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[i," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[n," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-header-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>a("notas"),children:"Ver notas"}),e.jsx("button",{className:"note-toggle-small",onClick:()=>d(!l),title:l?"Recolher bloco de notas":"Expandir bloco de notas","aria-label":l?"Recolher bloco de notas":"Expandir bloco de notas",children:l?"−":"+"})]})]}),o.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma nota pendente no momento."}),l&&e.jsx("div",{style:t.notasListaNova,className:"notes-list-dashboard",children:o.slice(0,6).map(N=>{const g=N.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${g}`,style:{...t.cardNotaAcao,...g==="critico"?t.cardNotaCritico:g==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:N.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:N.concluida?"line-through":"none"},children:N.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${g}`,style:{...t.badgePrioridade,...g==="critico"?t.badgeCritico:g==="urgente"?t.badgeUrgente:t.badgeNormal},children:g==="critico"?"Crítico":g==="urgente"?"Urgente":"Normal"})]}),N.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",m(N.data_evento)]}),N.conteudo&&e.jsx("p",{style:t.textoNota,children:N.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>f(N),children:N.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>b(N),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>S({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${N.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>k(N.id)}),children:"Excluir"})]})]},N.id)})})]})}function ht({className:t="",style:a={}}){return e.jsx("div",{className:`df-skeleton ${t}`.trim(),style:a,"aria-hidden":"true"})}function Xs({items:t=4}){return e.jsx("div",{className:"summary-grid df-skeleton-summary","aria-label":"Carregando resumo",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-summary-card",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-lg"})]},o))})}function Fi({items:t=3}){return e.jsx("div",{className:"df-skeleton-list","aria-label":"Carregando contas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-account-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-value"})]}),e.jsxs("div",{className:"df-skeleton-chip-row",children:[e.jsx(ht,{className:"df-skeleton-chip"}),e.jsx(ht,{className:"df-skeleton-chip"}),e.jsx(ht,{className:"df-skeleton-chip"})]}),e.jsxs("div",{className:"df-skeleton-actions-row",children:[e.jsx(ht,{className:"df-skeleton-button"}),e.jsx(ht,{className:"df-skeleton-button"})]})]},o))})}function Qs({items:t=3}){return e.jsx("div",{className:"notes-page-grid df-skeleton-notes","aria-label":"Carregando notas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-note-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ht,{className:"df-skeleton-pill"})]}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-full"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-mid"})]},o))})}function Js({styles:t,formatarValor:a,total:o,pago:i,pendente:n,vencido:l,contas:d,diferencaDias:m,navegarPara:f,contasAbertasDashboard:b,mostrarContasDashboard:S,setMostrarContasDashboard:k,busca:N,setBusca:g,estaVencida:M,formatarData:z,abrirConfirmacao:E,marcarComoPago:K,notasPendentes:ne,notasCriticas:G,notasUrgentes:q,mostrarNotas:se,setMostrarNotas:W,alternarNotaConcluida:re,abrirEdicaoNota:D,excluirNota:$,loading:X=!1,nomeUsuario:je="usuário",filiais:pe=[],filtroFilial:ge="",setFiltroFilial:Ce=()=>{},contasOperacionaisFiliais:ie=[]}){const y=F=>Number(F||0),me=(pe||[]).find(F=>F.id===ge);d.filter(F=>F.status==="pago"),d.filter(F=>F.status!=="pago");const I=ie&&ie.length>0?ie:d,te=(pe||[]).map(F=>{const ee=I.filter(Qe=>Qe.filial_id===F.id),He=ee.reduce((Qe,lt)=>Qe+y(lt.valor),0),Pe=ee.filter(Qe=>Qe.status==="pago").reduce((Qe,lt)=>Qe+y(lt.valor),0),qe=ee.filter(Qe=>M(Qe.data_vencimento,Qe.status)).reduce((Qe,lt)=>Qe+y(lt.valor),0),It=He-Pe;return{id:F.id,nome:F.nome||"Filial sem nome",total:He,pago:Pe,pendente:It,vencido:qe,contas:ee.length}}).filter(F=>F.total>0||F.contas>0).sort((F,ee)=>ee.total-F.total),Y=te[0],J=[...te].sort((F,ee)=>ee.pendente-F.pendente)[0],C=[...te].sort((F,ee)=>ee.vencido-F.vencido)[0],Z=[{name:"Pago",value:y(i),color:"#22c55e"},{name:"Pendente",value:Math.max(y(n)-y(l),0),color:"#f59e0b"},{name:"Vencido",value:y(l),color:"#ef4444"}].filter(F=>F.value>0),Te=[{name:"Pago",valor:y(i)},{name:"Aberto",valor:y(n)},{name:"Vencido",valor:y(l)}],Ee=Object.values(d.reduce((F,ee)=>{var Pe;const He=((Pe=ee.df_centros_custo)==null?void 0:Pe.nome)||"Sem centro";return F[He]||(F[He]={name:He,valor:0}),F[He].valor+=y(ee.valor),F},{})).sort((F,ee)=>ee.valor-F.valor).slice(0,5),we=o>0?Math.round(i/o*100):0,O=o>0?Math.round(l/o*100):0,fe=d.filter(F=>F.status!=="pago").sort((F,ee)=>m(F.data_vencimento)-m(ee.data_vencimento)),Be=fe.filter(F=>m(F.data_vencimento)===0),A=fe.filter(F=>{const ee=m(F.data_vencimento);return ee>0&&ee<=7}),V=fe.find(F=>m(F.data_vencimento)>=0)||fe[0],_e=Be.reduce((F,ee)=>F+y(ee.valor),0),he=A.reduce((F,ee)=>F+y(ee.valor),0);return e.jsxs(e.Fragment,{children:[e.jsx("section",{className:"dashboard-branch-filter no-print","aria-label":"Filtro de filial do dashboard",children:e.jsxs("div",{className:"dashboard-branch-filter-card",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Visão por filial"}),e.jsx("strong",{children:me?me.nome:"Todas as filiais"}),e.jsx("small",{children:"Os KPIs, gráficos e contas em aberto respeitam a filial selecionada."})]}),e.jsxs("select",{style:t.input,value:ge,onChange:F=>Ce(F.target.value),"aria-label":"Filtrar dashboard por filial",children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(pe||[]).map(F=>e.jsx("option",{value:F.id,children:F.nome},F.id))]})]})}),e.jsx("section",{className:"dashboard-kpi-row","aria-label":"Resumo financeiro",children:X?e.jsx(Xs,{items:4}):e.jsxs("div",{className:"summary-grid",style:t.resumo,children:[e.jsxs("div",{style:t.boxTotal,children:[e.jsx("span",{children:"Total"}),e.jsx("strong",{children:a(o)})]}),e.jsxs("div",{style:t.boxPago,children:[e.jsx("span",{children:"Pago"}),e.jsx("strong",{children:a(i)})]}),e.jsxs("div",{style:t.boxPendente,children:[e.jsx("span",{children:"Pendente"}),e.jsx("strong",{children:a(n)})]}),e.jsxs("div",{style:t.boxVencido,children:[e.jsx("span",{children:"Vencido"}),e.jsx("strong",{children:a(l)})]})]})}),!X&&e.jsxs("section",{className:"dashboard-operational-grid no-print","aria-label":"Dashboard operacional por filial",children:[e.jsxs("article",{className:"dashboard-operational-card highlight",children:[e.jsx("span",{className:"analytics-kicker",children:"Ranking de unidades"}),e.jsx("strong",{children:Y?Y.nome:"Sem movimento"}),e.jsx("small",{children:Y?`${a(Y.total)} em volume financeiro`:"Cadastre contas vinculadas às filiais."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Maior pendência"}),e.jsx("strong",{children:J?J.nome:"Sem pendências"}),e.jsx("small",{children:J?a(J.pendente):"Nenhuma conta pendente encontrada."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Risco vencido"}),e.jsx("strong",{children:C&&C.vencido>0?C.nome:"Sem vencidos"}),e.jsx("small",{children:C&&C.vencido>0?a(C.vencido):"Operação sem vencidos no filtro atual."})]}),e.jsxs("article",{className:"dashboard-operational-card ranking",children:[e.jsxs("div",{className:"analytics-card-header compact",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Comparativo por filial"}),e.jsx("strong",{children:"Top unidades"})]}),e.jsx("span",{className:"analytics-badge neutral",children:te.length})]}),te.length>0?e.jsx("div",{className:"branch-ranking-list",children:te.slice(0,5).map((F,ee)=>{const He=(Y==null?void 0:Y.total)>0?Math.max(5,Math.round(F.total/Y.total*100)):0;return e.jsxs("div",{className:"branch-ranking-row",children:[e.jsxs("div",{className:"branch-ranking-info",children:[e.jsx("span",{children:ee+1}),e.jsxs("div",{children:[e.jsx("strong",{children:F.nome}),e.jsxs("small",{children:[F.contas," conta(s) • pendente ",a(F.pendente)]})]})]}),e.jsxs("div",{className:"branch-ranking-value",children:[e.jsx("strong",{children:a(F.total)}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${He}%`}})})]})]},F.id)})}):e.jsx("div",{className:"analytics-empty",children:"Sem contas com filial no filtro atual."})]})]}),!X&&e.jsxs("section",{className:"dashboard-analytics-grid no-print",children:[e.jsxs("div",{className:"dashboard-analytics-card dashboard-analytics-card-primary",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Saúde financeira"}),e.jsx("strong",{children:"Distribuição das contas"})]}),e.jsxs("span",{className:"analytics-badge",children:[we,"% pago"]})]}),Z.length>0?e.jsxs("div",{className:"analytics-chart-row",children:[e.jsxs("div",{className:"donut-chart-wrap",children:[e.jsx(va,{width:"100%",height:190,children:e.jsxs(ki,{children:[e.jsx(Ci,{data:Z,dataKey:"value",nameKey:"name",innerRadius:54,outerRadius:82,paddingAngle:3,children:Z.map(F=>e.jsx(Ni,{fill:F.color},F.name))}),e.jsx(ja,{formatter:F=>a(F)})]})}),e.jsxs("div",{className:"donut-center-label",children:[e.jsxs("strong",{children:[we,"%"]}),e.jsx("span",{children:"quitado"})]})]}),e.jsx("div",{className:"analytics-legend",children:Z.map(F=>e.jsxs("div",{children:[e.jsx("span",{style:{background:F.color}}),e.jsx("small",{children:F.name}),e.jsx("strong",{children:a(F.value)})]},F.name))})]}):e.jsx("div",{className:"analytics-empty",children:"Sem dados financeiros para montar o gráfico."})]}),e.jsxs("div",{className:"dashboard-analytics-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Fluxo atual"}),e.jsx("strong",{children:"Pago x Aberto x Vencido"})]}),e.jsxs("span",{className:O>0?"analytics-badge danger":"analytics-badge success",children:[O,"% risco"]})]}),e.jsx(va,{width:"100%",height:220,children:e.jsxs(yi,{data:Te,margin:{top:14,right:18,left:24,bottom:4},children:[e.jsx(so,{strokeDasharray:"3 3",vertical:!1}),e.jsx(lo,{dataKey:"name",tickLine:!1,axisLine:!1}),e.jsx(co,{width:82,tickLine:!1,axisLine:!1,tickMargin:10,tickFormatter:F=>`R$ ${Math.round(F/1e3)}k`}),e.jsx(ja,{formatter:F=>a(F)}),e.jsx(wi,{dataKey:"valor",radius:[10,10,4,4],fill:"#0f766e"})]})})]}),e.jsxs("div",{className:"dashboard-analytics-card dashboard-cost-center-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Centros de custo"}),e.jsx("strong",{children:"Top 5 por volume financeiro"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[Ee.length," centros"]})]}),Ee.length>0?e.jsx("div",{className:"cost-center-bars",children:Ee.map(F=>{const ee=o>0?Math.max(4,Math.round(F.valor/o*100)):0;return e.jsxs("div",{className:"cost-center-row",children:[e.jsxs("div",{children:[e.jsx("strong",{children:F.name}),e.jsx("span",{children:a(F.valor)})]}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${ee}%`}})})]},F.name)})}):e.jsx("div",{className:"analytics-empty",children:"Cadastre centros de custo para visualizar o ranking."})]}),e.jsxs("div",{className:"dashboard-analytics-card executive-agenda-widget",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Agenda executiva"}),e.jsx("strong",{children:"Próximos vencimentos"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[fe.length," abertas"]})]}),e.jsxs("div",{className:"executive-agenda-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Hoje"}),e.jsx("strong",{children:a(_e)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"7 dias"}),e.jsx("strong",{children:a(he)})]})]}),V?e.jsxs("div",{className:"executive-agenda-next",children:[e.jsx("span",{children:"Próximo compromisso"}),e.jsx("strong",{children:V.descricao}),e.jsxs("small",{children:[z(V.data_vencimento)," • ",a(V.valor)]})]}):e.jsx("div",{className:"analytics-empty executive-agenda-empty",children:"Agenda financeira limpa."}),e.jsx("button",{className:"executive-agenda-cta",onClick:()=>f("agenda"),children:"Abrir agenda completa"})]})]}),X?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"dashboard-section-header-accounts",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"💰 Contas em aberto"}),e.jsx("p",{style:t.textoNota,children:"Carregando contas e vencimentos..."})]})}),e.jsx(Fi,{items:2})]}):e.jsx(Ks,{styles:t,formatarValor:a,navegarPara:f,contasAbertasDashboard:b,mostrarContasDashboard:S,setMostrarContasDashboard:k,busca:N,setBusca:g,estaVencida:M,formatarData:z,abrirConfirmacao:E,marcarComoPago:K}),X?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"notes-header-clean",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Carregando lembretes..."})]})}),e.jsx(Qs,{items:2})]}):e.jsx(Ys,{styles:t,navegarPara:f,notasPendentes:ne,notasCriticas:G,notasUrgentes:q,mostrarNotas:se,setMostrarNotas:W,formatarData:z,alternarNotaConcluida:re,abrirEdicaoNota:D,abrirConfirmacao:E,excluirNota:$})]})}function Zs(t){return e.jsx(Js,{...t})}function el({icon:t,title:a,description:o,actionLabel:i,onAction:n}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o}),i&&n&&e.jsx("button",{className:"empty-state-action",onClick:n,children:i})]})}function tl({styles:t,busca:a,setBusca:o,mostrarFiltros:i,setMostrarFiltros:n,limparFiltros:l,imprimirPDF:d,exportarCSV:m,filtroStatus:f,setFiltroStatus:b,centros:S,filtroCentro:k,setFiltroCentro:N,filiais:g,filtroFilial:M,setFiltroFilial:z,filtroMes:E,setFiltroMes:K,dataInicial:ne,setDataInicial:G,dataFinal:q,setDataFinal:se,limitarDataInput:W,contasFiltradas:re,total:D,formatarValor:$,loading:X,HeaderExpansivel:je,mostrarContas:pe,setMostrarContas:ge,estaVencida:Ce,formatarData:ie,formatarTipoRecorrencia:y,obterTipoRecorrenciaConta:me,abrirConfirmacao:I,marcarComoPago:te,voltarParaPendente:Y,abrirEdicaoConta:J,excluirConta:C,navegarPara:Z}){function Te(){var Ee,we;return e.jsxs(e.Fragment,{children:[e.jsxs("section",{className:"no-print filters-desktop",style:t.filtrosBox,children:[e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro, observação ou status...",value:a,onChange:O=>o(O.target.value)}),e.jsx("button",{className:"filter-toggle-button",onClick:()=>n(!i),children:i?"Ocultar filtros":"Filtros"}),e.jsxs("div",{className:"export-actions",style:t.acoes,children:[e.jsx("button",{style:t.btnCinza,onClick:l,children:"Limpar"}),e.jsx("button",{style:t.btnRoxo,onClick:d,children:"PDF"}),e.jsx("button",{style:t.btnVerde,onClick:m,children:"CSV"})]}),i&&e.jsxs("div",{className:"advanced-filters",children:[e.jsxs("div",{className:"status-tabs filter-tabs-fixed",style:t.filtros,children:[e.jsx("button",{style:f==="todas"?t.filtroAtivo:t.filtro,onClick:()=>b("todas"),children:"Todas"}),e.jsx("button",{style:f==="pendentes"?t.filtroAtivo:t.filtro,onClick:()=>b("pendentes"),children:"Pendentes"}),e.jsx("button",{style:f==="pagas"?t.filtroAtivo:t.filtro,onClick:()=>b("pagas"),children:"Pagas"}),e.jsx("button",{style:f==="vencidas"?t.filtroAtivo:t.filtro,onClick:()=>b("vencidas"),children:"Vencidas"})]}),e.jsxs("select",{style:t.input,value:M,onChange:O=>z(O.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(g||[]).map(O=>e.jsx("option",{value:O.id,children:O.nome},O.id))]}),e.jsxs("select",{style:t.input,value:k,onChange:O=>N(O.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),S.map(O=>e.jsx("option",{value:O.id,children:O.nome},O.id))]}),e.jsx("input",{style:t.input,type:"month",value:E,onChange:O=>K(O.target.value)}),e.jsx("input",{style:t.input,type:"date",value:ne,onChange:O=>G(W(O.target.value))}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:O=>se(W(O.target.value))})]})]}),e.jsxs("section",{className:"result-summary",style:t.resumoFiltro,children:[e.jsx("strong",{children:"Resultado filtrado"}),e.jsxs("span",{children:[re.length," conta(s) • Total ",$(D)]}),e.jsxs("small",{children:["Filial: ",M?((Ee=(g||[]).find(O=>O.id===M))==null?void 0:Ee.nome)||"Selecionada":"Todas"," • Centro: ",k?((we=S.find(O=>O.id===k))==null?void 0:we.nome)||"Selecionado":"Todos"," • Status: ",f," • Mês: ",E||"Todos"]})]}),e.jsxs("section",{className:"content-block",style:t.bloco,children:[X&&e.jsx(Fi,{items:3}),e.jsx(je,{titulo:"💰 Contas",aberto:pe,onClick:()=>ge(!pe)}),!X&&pe&&re.length===0&&e.jsx(el,{icon:"💳",title:"Nenhuma conta encontrada",description:"Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa."}),!X&&pe&&re.map(O=>{var Be,A;const fe=Ce(O.data_vencimento,O.status);return e.jsxs("div",{className:`print-card account-card-desktop ${fe?"account-card-vencida":O.status==="pago"?"account-card-paga":"account-card-pendente"}`,style:{...t.cardConta,background:O.status==="pago"?"#d4edda":fe?"#ffb3b3":"#fff3cd"},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{children:O.descricao}),e.jsx("span",{children:$(O.valor)})]}),e.jsxs("div",{style:t.cardInfo,className:"account-meta-line",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",ie(O.data_vencimento)]}),e.jsx("span",{children:((Be=O.df_filiais)==null?void 0:Be.nome)||"Sem filial"}),e.jsx("span",{children:((A=O.df_centros_custo)==null?void 0:A.nome)||"-"}),O.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",y(me(O))]}),e.jsx("span",{className:`status-pill ${fe?"status-vencido":O.status==="pago"?"status-pago":"status-pendente"}`,children:fe?"Vencido":O.status==="pago"?"Pago":"Pendente"})]}),e.jsxs("div",{className:"account-actions",style:t.acoes,children:[O.status!=="pago"?e.jsx("button",{style:t.btnPago,onClick:()=>I({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${O.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>te(O.id)}),children:"Pago"}):e.jsx("button",{style:t.btnVoltar,onClick:()=>I({titulo:"Voltar para pendente",mensagem:`Deseja voltar a conta ${O.descricao} para pendente?`,textoConfirmar:"Voltar",tipo:"aviso",acao:()=>Y(O.id)}),children:"Voltar"}),e.jsx("button",{style:t.btnEditar,onClick:()=>J(O),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>I({titulo:"Mover para lixeira",mensagem:`Deseja mover a conta ${O.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>C(O.id)}),children:"Excluir"})]})]},O.id)})]})]})}return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"💳 Contas"}),e.jsx("p",{style:t.textoNota,children:"Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>Z("dashboard"),children:"← Dashboard"})})]}),Te()]})}function al({icon:t,title:a,description:o}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o})]})}function ol({styles:t,navegarPara:a,notasFiltradas:o,notasPendentes:i,notasCriticas:n,notasUrgentes:l,buscaNota:d,setBuscaNota:m,formatarData:f,alternarNotaConcluida:b,abrirEdicaoNota:S,abrirConfirmacao:k,excluirNota:N,filtroFilial:g,setFiltroFilial:M,filiais:z}){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>a("dashboard"),children:"← Dashboard"})})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"notes-page-section",children:[e.jsxs("div",{className:"notes-page-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Todas as notas"}),e.jsxs("p",{style:t.textoNota,children:[o.length," nota(s) encontrada(s) • ",i.length," pendente(s)"]})]}),e.jsxs("div",{className:"notes-page-stats",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[i.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[n," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[l," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-toolbar",children:[e.jsxs("select",{style:t.input,value:g,onChange:E=>M(E.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(z||[]).map(E=>e.jsx("option",{value:E.id,children:E.nome},E.id))]}),e.jsx("input",{style:t.input,placeholder:"Buscar por título, conteúdo ou prioridade...",value:d,onChange:E=>m(E.target.value)})]}),o.length===0&&e.jsx(al,{icon:"📝",title:"Nenhuma nota encontrada",description:"Use as notas para registrar pendências, lembretes e prioridades da operação."}),e.jsx("div",{className:"notes-page-grid",children:o.map(E=>{var ne;const K=E.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${K}`,style:{...t.cardNotaAcao,...K==="critico"?t.cardNotaCritico:K==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:E.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:E.concluida?"line-through":"none"},children:E.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${K}`,style:{...t.badgePrioridade,...K==="critico"?t.badgeCritico:K==="urgente"?t.badgeUrgente:t.badgeNormal},children:K==="critico"?"Crítico":K==="urgente"?"Urgente":"Normal"})]}),E.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",f(E.data_evento)]}),((ne=E.df_filiais)==null?void 0:ne.nome)&&e.jsxs("small",{className:"note-event-date",children:["🏢 ",E.df_filiais.nome]}),E.conteudo&&e.jsx("p",{style:t.textoNota,children:E.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>b(E),children:E.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>S(E),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>k({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${E.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>N(E.id)}),children:"Excluir"})]})]},E.id)})})]})]})}function Oo(t){return String(t||"").trim().replace(/\s+/g," ")}async function rl(){const{data:t,error:a}=await T.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(a)throw a;const{data:o,error:i}=await T.from("df_usuarios_empresas").select("empresa_id, user_id, email, perfil");if(i)throw i;const n=new Map;return(o||[]).forEach(l=>{if(!(l!=null&&l.empresa_id))return;const d=l.user_id||String(l.email||"").trim().toLowerCase();if(!d)return;const m=n.get(l.empresa_id)||new Set;m.add(d),n.set(l.empresa_id,m)}),(t||[]).map(l=>{var d;return{...l,totalUsuarios:((d=n.get(l.id))==null?void 0:d.size)||0}})}async function il({nome:t,masterUserId:a,masterEmail:o,masterNome:i}){const n=Oo(t);if(n.length<2)throw new Error("Informe o nome da empresa.");const{data:l,error:d}=await T.from("df_empresas").select("id, nome").ilike("nome",n).limit(1);if(d)throw d;if(Array.isArray(l)&&l.length>0)throw new Error("Já existe uma empresa com esse nome.");const{data:m,error:f}=await T.from("df_empresas").insert([{nome:n}]).select("id, nome, created_at").single();if(f)throw f;if(o||a){const b={empresa_id:m.id,user_id:a||null,email:String(o||"").trim().toLowerCase()||null,nome:Oo(i)||String(o||"").split("@")[0]||"Administrador",perfil:"admin"},{error:S}=await T.from("df_usuarios_empresas").insert([b]);S&&console.warn("Empresa criada, mas não foi possível vincular o master automaticamente:",S.message)}return m}async function nl({empresaId:t,nome:a}){const o=Oo(a);if(!t)throw new Error("Empresa não identificada.");if(o.length<2)throw new Error("Informe o nome da empresa.");const{data:i,error:n}=await T.from("df_empresas").update({nome:o}).eq("id",t).select("id, nome, created_at").single();if(n)throw n;return i}function $i(t){return String(t||"").trim().replace(/\s+/g," ")}function Mi(t){const a=String(t||"").trim();if(!a)throw new Error("Empresa não identificada para gerenciar filiais.");return a}async function Ho(t){const a=Mi(t),{data:o,error:i}=await T.from("df_filiais").select("id, empresa_id, nome, ativo, created_at").eq("empresa_id",a).order("nome",{ascending:!0});if(i)throw i;return o||[]}async function sl({empresaId:t,nome:a}){const o=Mi(t),i=$i(a);if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:l}=await T.from("df_filiais").select("id, nome").eq("empresa_id",o).ilike("nome",i).limit(1);if(l)throw l;if(Array.isArray(n)&&n.length>0)throw new Error("Já existe uma filial com esse nome nesta empresa.");const{data:d,error:m}=await T.from("df_filiais").insert([{empresa_id:o,nome:i,ativo:!0}]).select("id, empresa_id, nome, ativo, created_at").single();if(m)throw m;return d}async function ll({filialId:t,nome:a}){const o=String(t||"").trim(),i=$i(a);if(!o)throw new Error("Filial não identificada.");if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:l}=await T.from("df_filiais").update({nome:i}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(l)throw l;return n}async function dl({filialId:t,ativo:a}){const o=String(t||"").trim();if(!o)throw new Error("Filial não identificada.");const{data:i,error:n}=await T.from("df_filiais").update({ativo:!!a}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(n)throw n;return i}function cl(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function pl({styles:t,usuarioLogado:a,nomeUsuarioCompleto:o,empresaId:i,empresasDisponiveis:n=[],trocarEmpresaAtiva:l,trocandoEmpresa:d,mostrarAviso:m,onEmpresasAtualizadas:f,voltarPainel:b,abaInicial:S="empresas"}){const[k,N]=c.useState(S==="filiais"?"filiais":"empresas"),[g,M]=c.useState([]),[z,E]=c.useState(""),[K,ne]=c.useState(""),[G,q]=c.useState(!1),[se,W]=c.useState(!0),[re,D]=c.useState(null),[$,X]=c.useState(""),[je,pe]=c.useState([]),[ge,Ce]=c.useState(""),[ie,y]=c.useState(""),[me,I]=c.useState(!1),[te,Y]=c.useState(null),[J,C]=c.useState(""),Z=c.useMemo(()=>n.find(A=>A.id===i)||g.find(A=>A.id===i)||null,[i,g,n]);async function Te(){W(!0);try{const A=await rl();M(A)}catch(A){m==null||m((A==null?void 0:A.message)||"Não foi possível carregar empresas.","erro")}finally{W(!1)}}async function Ee(){if(!i){pe([]);return}I(!0);try{const A=await Ho(i);pe(A)}catch(A){m==null||m((A==null?void 0:A.message)||"Não foi possível carregar filiais.","erro")}finally{I(!1)}}c.useEffect(()=>{Te()},[]),c.useEffect(()=>{k==="filiais"&&Ee()},[k,i]);const we=c.useMemo(()=>{const A=String(z||"").trim().toLowerCase();return A?g.filter(V=>String(V.nome||"").toLowerCase().includes(A)):g},[z,g]);c.useMemo(()=>{const A=String(ge||"").trim().toLowerCase();return A?je.filter(V=>String(V.nome||"").toLowerCase().includes(A)):je},[ge,je]);async function O(A){if(A.preventDefault(),!G){q(!0);try{await il({nome:K,masterUserId:a==null?void 0:a.id,masterEmail:a==null?void 0:a.email,masterNome:o==null?void 0:o()}),ne(""),await Te(),await(f==null?void 0:f()),m==null||m("Empresa criada com sucesso.","sucesso")}catch(V){m==null||m((V==null?void 0:V.message)||"Não foi possível criar a empresa.","erro")}finally{q(!1)}}}async function fe(A){if(!(!(A!=null&&A.id)||G)){q(!0);try{await nl({empresaId:A.id,nome:$}),D(null),X(""),await Te(),await(f==null?void 0:f()),m==null||m("Empresa atualizada com sucesso.","sucesso")}catch(V){m==null||m((V==null?void 0:V.message)||"Não foi possível atualizar a empresa.","erro")}finally{q(!1)}}}function Be(){return e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova empresa"}),e.jsx("p",{style:t.textoNota,children:"Crie um novo tenant e vincule automaticamente seu usuário master."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:O,children:[e.jsx("input",{style:t.input,value:K,onChange:A=>ne(A.target.value),placeholder:"Nome da empresa"}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:G,children:G?"Salvando...":"Criar empresa"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Empresas cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Controle inicial das empresas disponíveis no SaaS."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:z,onChange:A=>E(A.target.value),placeholder:"Buscar empresa"})]}),se?e.jsx("p",{style:t.textoNota,children:"Carregando empresas..."}):we.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏢"}),e.jsx("strong",{children:"Nenhuma empresa encontrada"}),e.jsx("p",{children:"Crie a primeira empresa ou ajuste a busca."})]}):e.jsx("div",{className:"master-companies-list",children:we.map(A=>{const V=A.id===i,_e=re===A.id;return e.jsxs("article",{className:`master-company-card ${V?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏢"}),e.jsxs("div",{children:[_e?e.jsx("input",{style:t.input,value:$,onChange:he=>X(he.target.value),autoFocus:!0}):e.jsx("h3",{children:A.nome||"Empresa sem nome"}),e.jsxs("small",{children:["ID: ",A.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:[A.totalUsuarios||0," usuário(s)"]}),e.jsxs("span",{children:["Criada em ",cl(A.created_at)]}),V&&e.jsx("strong",{children:"Ativa"})]}),e.jsx("div",{className:"master-company-actions",children:_e?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:G,onClick:()=>fe(A),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{D(null),X("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{D(A.id),X(A.nome||"")},children:"Editar"}),!V&&e.jsx("button",{style:t.btnSalvar,type:"button",disabled:d,onClick:()=>l==null?void 0:l(A.id),children:"Ativar"})]})})]},A.id)})})]})]})}return e.jsxs("div",{className:"master-panel-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Painel Master SaaS"}),e.jsx("h1",{style:t.titulo,children:"🏢 Painel Master"}),e.jsx("p",{style:t.textoNota,children:"Gerencie empresas e tenants da plataforma. Filiais ficam nas Configurações de cada empresa."})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:b,children:"← Dashboard"})]}),e.jsxs("div",{className:"master-stats-grid",children:[e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresas cadastradas"}),e.jsx("strong",{children:g.length})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresa ativa"}),e.jsx("strong",{children:(Z==null?void 0:Z.nome)||"—"})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Administração SaaS"}),e.jsx("strong",{children:"Tenants"})]})]}),Be()]})}function ml(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function ul({styles:t,empresaId:a,empresaNome:o,mostrarAviso:i,voltarPainel:n}){const[l,d]=c.useState([]),[m,f]=c.useState(""),[b,S]=c.useState(""),[k,N]=c.useState(!0),[g,M]=c.useState(!1),[z,E]=c.useState(null),[K,ne]=c.useState("");async function G(){if(!a){d([]),N(!1);return}N(!0);try{const D=await Ho(a);d(D)}catch(D){i==null||i((D==null?void 0:D.message)||"Não foi possível carregar filiais.","erro")}finally{N(!1)}}c.useEffect(()=>{G()},[a]);const q=c.useMemo(()=>{const D=String(m||"").trim().toLowerCase();return D?l.filter($=>String($.nome||"").toLowerCase().includes(D)):l},[m,l]);async function se(D){if(D.preventDefault(),!g){M(!0);try{await sl({empresaId:a,nome:b}),S(""),await G(),i==null||i("Filial criada com sucesso.","sucesso")}catch($){i==null||i(($==null?void 0:$.message)||"Não foi possível criar a filial.","erro")}finally{M(!1)}}}async function W(D){if(!(!(D!=null&&D.id)||g)){M(!0);try{await ll({filialId:D.id,nome:K}),E(null),ne(""),await G(),i==null||i("Filial atualizada com sucesso.","sucesso")}catch($){i==null||i(($==null?void 0:$.message)||"Não foi possível atualizar a filial.","erro")}finally{M(!1)}}}async function re(D){if(!(!(D!=null&&D.id)||g)){M(!0);try{await dl({filialId:D.id,ativo:!D.ativo}),await G(),i==null||i(D.ativo?"Filial desativada.":"Filial ativada.","sucesso")}catch($){i==null||i(($==null?void 0:$.message)||"Não foi possível alterar a filial.","erro")}finally{M(!1)}}}return e.jsxs("div",{className:"branches-settings-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Configurações da empresa"}),e.jsx("h1",{style:t.titulo,children:"🏬 Filiais / Unidades"}),e.jsx("p",{style:t.textoNota,children:"Cadastre unidades operacionais dentro da empresa ativa. As próximas fases ligarão contas e relatórios a essas filiais."}),e.jsxs("small",{style:t.textoAjuda,children:["Empresa ativa: ",e.jsx("strong",{children:o||"—"})]})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:n,children:"← Configurações"})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova filial"}),e.jsx("p",{style:t.textoNota,children:"Use nomes como Loja Centro, Loja Shopping, Produção, Delivery ou Administração."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:se,children:[e.jsx("input",{style:t.input,value:b,onChange:D=>S(D.target.value),placeholder:"Nome da filial",disabled:!a}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:g||!a,children:g?"Salvando...":"Criar filial"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Filiais cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Cada empresa enxerga apenas suas próprias unidades."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:m,onChange:D=>f(D.target.value),placeholder:"Buscar filial"})]}),k?e.jsx("p",{style:t.textoNota,children:"Carregando filiais..."}):q.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏬"}),e.jsx("strong",{children:"Nenhuma filial encontrada"}),e.jsx("p",{children:"Crie unidades para organizar contas por local de operação."})]}):e.jsx("div",{className:"master-companies-list",children:q.map(D=>{const $=z===D.id;return e.jsxs("article",{className:`master-company-card ${D.ativo?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏬"}),e.jsxs("div",{children:[$?e.jsx("input",{style:t.input,value:K,onChange:X=>ne(X.target.value),autoFocus:!0}):e.jsx("h3",{children:D.nome||"Filial sem nome"}),e.jsxs("small",{children:["ID: ",D.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:["Criada em ",ml(D.created_at)]}),e.jsx("strong",{children:D.ativo?"Ativa":"Inativa"})]}),e.jsx("div",{className:"master-company-actions",children:$?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:g,onClick:()=>W(D),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{E(null),ne("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{E(D.id),ne(D.nome||"")},children:"Editar"}),e.jsx("button",{style:D.ativo?t.btnCinza:t.btnSalvar,type:"button",disabled:g,onClick:()=>re(D),children:D.ativo?"Desativar":"Ativar"})]})})]},D.id)})})]})]})}const da=[{codigo:"starter",nome:"Starter",descricao:"Base para operação pequena com uma unidade.",limite_filiais:1,limite_usuarios:3,valor_mensal:0,recursos:["1 filial","3 usuários","Contas e notas","Dashboard básico"]},{codigo:"profissional",nome:"Profissional",descricao:"Operação multiunidade com dashboard operacional.",limite_filiais:5,limite_usuarios:15,valor_mensal:149,recursos:["Até 5 filiais","Até 15 usuários","Dashboard operacional","Relatórios gerenciais"]},{codigo:"enterprise",nome:"Enterprise",descricao:"Estrutura avançada para redes, permissões e expansão SaaS.",limite_filiais:null,limite_usuarios:null,valor_mensal:null,recursos:["Filiais ilimitadas","Usuários ilimitados","Permissões avançadas","Suporte prioritário"]}];function Ti(t){const a=String((t==null?void 0:t.message)||"").toLowerCase();return(t==null?void 0:t.code)==="42P01"||a.includes("does not exist")||a.includes("schema cache")}function fl(t="profissional"){return da.find(a=>a.codigo===t)||da[1]}async function xl(){const{data:t,error:a}=await T.from("df_planos").select("id, codigo, nome, descricao, limite_filiais, limite_usuarios, valor_mensal, ativo").eq("ativo",!0).order("valor_mensal",{ascending:!0,nullsFirst:!1});if(a){if(Ti(a))return da;throw a}return!Array.isArray(t)||t.length===0?da:t.map(o=>({...o,recursos:vl(o)}))}async function hl(t){if(!t)return null;const{data:a,error:o}=await T.from("df_assinaturas").select("id, empresa_id, plano_codigo, status, trial_inicio, trial_fim, assinatura_inicio, assinatura_fim, limite_filiais, limite_usuarios").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(o){if(Ti(o))return null;throw o}return a||null}async function gl(t){const[a,o]=await Promise.all([xl(),hl(t)]),i=a.find(n=>n.codigo===(o==null?void 0:o.plano_codigo))||fl(o==null?void 0:o.plano_codigo);return{planos:a,assinatura:o,planoAtual:{...i,limite_filiais:(o==null?void 0:o.limite_filiais)??i.limite_filiais,limite_usuarios:(o==null?void 0:o.limite_usuarios)??i.limite_usuarios}}}async function bl({empresaId:t,planoCodigo:a,limiteFiliais:o,limiteUsuarios:i,status:n="trial"}){if(!t)throw new Error("Empresa não identificada.");if(!a)throw new Error("Selecione um plano.");const l={empresa_id:t,plano_codigo:a,status:n,limite_filiais:o,limite_usuarios:i,updated_at:new Date().toISOString()},{data:d,error:m}=await T.from("df_assinaturas").select("id").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(m)throw m;if(d!=null&&d.id){const{data:S,error:k}=await T.from("df_assinaturas").update(l).eq("id",d.id).select("*").single();if(k)throw k;return S}const{data:f,error:b}=await T.from("df_assinaturas").insert([{...l,trial_inicio:new Date().toISOString().slice(0,10)}]).select("*").single();if(b)throw b;return f}function vl(t){const a=[];return a.push(t.limite_filiais?`Até ${t.limite_filiais} filial(is)`:"Filiais ilimitadas"),a.push(t.limite_usuarios?`Até ${t.limite_usuarios} usuário(s)`:"Usuários ilimitados"),a.push("Dashboard operacional"),a.push("Base para billing SaaS"),a}function ni(t,a,o){if(t==null||t==="")return"Ilimitado";const i=Number(t);return Number.isFinite(i)?`${i} ${i===1?a:o}`:"Ilimitado"}function si(t){return t==null?"Sob consulta":Number(t)===0?"R$ 0,00":Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function ga(t){return t==null?"":String(t)}function jl(t){if(!t)return"";const a=new Date(t);return Number.isNaN(a.getTime())?String(t):a.toLocaleDateString("pt-BR")}function yl({styles:t,empresaId:a,empresaNome:o,filiais:i=[],usuarios:n=[],mostrarAviso:l,podeEditar:d=!1,voltarPainel:m}){const[f,b]=c.useState(!0),[S,k]=c.useState(!1),[N,g]=c.useState(da),[M,z]=c.useState(null),[E,K]=c.useState("profissional"),[ne,G]=c.useState("trial"),[q,se]=c.useState(5),[W,re]=c.useState(15),[D,$]=c.useState(null);c.useEffect(()=>{let C=!0;async function Z(){var Te,Ee,we,O,fe,Be;if(a){b(!0);try{const A=await gl(a);if(!C)return;g(A.planos||da),z(A.assinatura);const V=((Te=A.assinatura)==null?void 0:Te.plano_codigo)||((Ee=A.assinatura)==null?void 0:Ee.plano_slug)||((we=A.planoAtual)==null?void 0:we.codigo)||"profissional",_e=((O=A.assinatura)==null?void 0:O.status)||"trial",he=((fe=A.planoAtual)==null?void 0:fe.limite_filiais)??"",F=((Be=A.planoAtual)==null?void 0:Be.limite_usuarios)??"";K(V),G(_e),se(he),re(F),$({planoSelecionado:V,statusSelecionado:_e,limiteFiliais:ga(he),limiteUsuarios:ga(F)})}catch(A){console.error("Erro ao carregar billing:",A),C&&(l==null||l("Não foi possível carregar o billing: "+A.message,"erro"))}finally{C&&b(!1)}}}return Z(),()=>{C=!1}},[a,l]);const X=c.useMemo(()=>N.find(C=>C.codigo===E)||da.find(C=>C.codigo==="profissional"),[N,E]),je=i.length,pe=n.length,ge=q===""?null:Number(q),Ce=W===""?null:Number(W),ie=ge?Math.min(100,Math.round(je/ge*100)):100,y=Ce?Math.min(100,Math.round(pe/Ce*100)):100,me=ge!==null&&je>=ge,I=Ce!==null&&pe>=Ce,te=!!D&&(D.planoSelecionado!==E||D.statusSelecionado!==ne||D.limiteFiliais!==ga(q)||D.limiteUsuarios!==ga(W));function Y(C){const Z=N.find(Te=>Te.codigo===C);K(C),se((Z==null?void 0:Z.limite_filiais)??""),re((Z==null?void 0:Z.limite_usuarios)??"")}async function J(){if(d){k(!0);try{const C=await bl({empresaId:a,planoCodigo:E,status:ne,limiteFiliais:q===""?null:Number(q),limiteUsuarios:W===""?null:Number(W)});z(C),$({planoSelecionado:E,statusSelecionado:ne,limiteFiliais:ga(q),limiteUsuarios:ga(W)}),l==null||l("Billing atualizado com sucesso.","info")}catch(C){console.error("Erro ao salvar billing:",C),l==null||l("Erro ao salvar billing: "+C.message,"erro")}finally{k(!1)}}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"💼 Billing Foundation"}),e.jsx("button",{style:t.btnCinza,onClick:m,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"billing-hero",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Base comercial SaaS"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"})," • Status: ",e.jsx("strong",{children:(M==null?void 0:M.status)||"trial estrutural"})]}),e.jsx("p",{style:t.textoAjuda,children:"Esta fase cria a fundação de planos, limites e assinatura. Ainda não bloqueia o uso do app; os bloqueios comerciais ficam para o hardening posterior."})]}),e.jsxs("div",{className:"billing-current-plan",children:[e.jsx("span",{children:"Plano atual"}),e.jsx("strong",{children:(X==null?void 0:X.nome)||"Profissional"}),e.jsxs("small",{children:[si(X==null?void 0:X.valor_mensal)," / mês"]})]})]}),e.jsxs("section",{className:"billing-kpi-grid",children:[e.jsxs("div",{className:`billing-kpi-card ${me?"warning":""}`,children:[e.jsx("span",{children:"Filiais em uso"}),e.jsx("strong",{children:je}),e.jsx("small",{children:ni(ge,"filial liberada","filiais liberadas")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${ie}%`}})})]}),e.jsxs("div",{className:`billing-kpi-card ${I?"warning":""}`,children:[e.jsx("span",{children:"Usuários em uso"}),e.jsx("strong",{children:pe}),e.jsx("small",{children:ni(Ce,"usuário liberado","usuários liberados")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${y}%`}})})]}),e.jsxs("div",{className:"billing-kpi-card",children:[e.jsx("span",{children:"Status comercial"}),e.jsx("strong",{children:ne}),e.jsx("small",{children:M!=null&&M.trial_fim?`Trial até ${jl(M.trial_fim)}`:"Trial preparado"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Planos disponíveis"}),e.jsx("div",{className:"billing-plan-grid",children:N.map(C=>e.jsxs("button",{type:"button",className:`billing-plan-card ${E===C.codigo?"selected":""}`,onClick:()=>Y(C.codigo),disabled:!d,children:[e.jsx("span",{children:C.nome}),e.jsx("strong",{children:si(C.valor_mensal)}),e.jsx("small",{children:C.descricao}),e.jsx("ul",{children:(C.recursos||[]).map(Z=>e.jsx("li",{children:Z},Z))})]},C.codigo))})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"billing-section-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Assinatura e limites"}),e.jsx("p",{style:t.textoNota,children:"Defina os limites comerciais da empresa sem alterar os dados operacionais já validados."})]}),!d&&e.jsx("span",{className:"billing-readonly",children:"Somente leitura"}),d&&te&&e.jsx("span",{className:"billing-pending",children:"● Alterações pendentes"})]}),e.jsxs("div",{className:"billing-form-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Plano"}),e.jsx("select",{style:t.input,value:E,disabled:!d,onChange:C=>Y(C.target.value),children:N.map(C=>e.jsx("option",{value:C.codigo,children:C.nome},C.codigo))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Status"}),e.jsxs("select",{style:t.input,value:ne,disabled:!d,onChange:C=>G(C.target.value),children:[e.jsx("option",{value:"trial",children:"Trial"}),e.jsx("option",{value:"ativa",children:"Ativa"}),e.jsx("option",{value:"pausada",children:"Pausada"}),e.jsx("option",{value:"cancelada",children:"Cancelada"})]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de filiais"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:q,disabled:!d,onChange:C=>se(C.target.value)})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de usuários"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:W,disabled:!d,onChange:C=>re(C.target.value)})]})]}),d&&e.jsx("button",{style:{...t.btnSalvar,opacity:f||S||!te?.65:1},disabled:f||S||!te,onClick:J,children:S?"Salvando...":te?"Salvar alterações do billing":"Billing salvo"})]})]})}function wl(){return new Date().toISOString().slice(0,10)}function Bo(t){return String(t||"").trim().replace(/\s+/g," ")}function Fa({numero:t,titulo:a,descricao:o,concluido:i,ativo:n,children:l}){return e.jsxs("section",{className:`onboarding-step-card ${i?"done":""} ${n?"active":""}`,children:[e.jsxs("div",{className:"onboarding-step-head",children:[e.jsx("div",{className:"onboarding-step-number",children:i?"✓":t}),e.jsxs("div",{children:[e.jsx("span",{children:i?"Concluído":n?"Próximo passo":"Pendente"}),e.jsx("h3",{children:a}),e.jsx("p",{children:o})]})]}),n&&e.jsx("div",{className:"onboarding-step-body",children:l})]})}function kl({styles:t,empresaId:a,empresaNome:o,filiais:i=[],centros:n=[],contas:l=[],mostrarAviso:d,onRefresh:m,voltarPainel:f,abrirDashboard:b}){var Y,J;const[S,k]=c.useState(!1),[N,g]=c.useState("Loja Centro"),[M,z]=c.useState("Operacional"),[E,K]=c.useState("Primeira conta de teste"),[ne,G]=c.useState("100,00"),[q,se]=c.useState(wl()),[W,re]=c.useState(""),[D,$]=c.useState(""),X=c.useMemo(()=>i.filter(C=>(C==null?void 0:C.ativo)!==!1),[i]),je=c.useMemo(()=>l.filter(C=>(C==null?void 0:C.excluido)!==!0),[l]),pe={empresa:!!a,filial:X.length>0,centro:n.length>0,conta:je.length>0},ge=Math.round([pe.empresa,pe.filial,pe.centro,pe.conta].filter(Boolean).length/4*100),Ce=ge===100,ie=pe.empresa?pe.filial?pe.centro?pe.conta?"dashboard":"conta":"centro":"filial":"empresa";async function y(){await(m==null?void 0:m())}async function me(){const C=Bo(N);if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");if(C.length<2)return d==null?void 0:d("Informe o nome da primeira filial.","erro");k(!0);try{const{error:Z}=await T.from("df_filiais").insert([{empresa_id:a,nome:C,ativo:!0}]);if(Z)throw Z;d==null||d("Primeira filial criada com sucesso.","info"),await y()}catch(Z){d==null||d("Erro ao criar filial: "+Z.message,"erro")}finally{k(!1)}}async function I(){const C=Bo(M);if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");if(C.length<2)return d==null?void 0:d("Informe o nome do primeiro centro de custo.","erro");k(!0);try{const{error:Z}=await T.from("df_centros_custo").insert([{empresa_id:a,nome:C}]);if(Z)throw Z;d==null||d("Centro de custo criado com sucesso.","info"),await y()}catch(Z){d==null||d("Erro ao criar centro de custo: "+Z.message,"erro")}finally{k(!1)}}async function te(){var we,O;if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");const C=Bo(E),Z=Si(ne),Te=W||((we=X[0])==null?void 0:we.id)||null,Ee=D||((O=n[0])==null?void 0:O.id)||null;if(C.length<2)return d==null?void 0:d("Informe a descrição da primeira conta.","erro");if(!Z||Z<=0)return d==null?void 0:d("Informe um valor válido para a primeira conta.","erro");if(!q)return d==null?void 0:d("Informe o vencimento da primeira conta.","erro");k(!0);try{const fe={empresa_id:a,descricao:C,valor:Z,data_vencimento:q,vencimento:q,status:"pendente",centro_custo_id:Ee,filial_id:Te,excluido:!1},{error:Be}=await T.from("df_contas").insert([fe]);if(Be)throw Be;d==null||d("Primeira conta criada. Dashboard pronto para uso.","info"),await y()}catch(fe){d==null||d("Erro ao criar primeira conta: "+fe.message,"erro")}finally{k(!1)}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"🚀 Onboarding SaaS"}),e.jsx("button",{style:t.btnCinza,onClick:f,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"onboarding-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"onboarding-eyebrow",children:"Configuração inicial"}),e.jsx("h2",{style:t.subtitulo,children:"Deixe a empresa pronta para operar"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"}),". Este fluxo prepara a primeira unidade, centro de custo e conta para liberar o dashboard operacional."]})]}),e.jsxs("div",{className:"onboarding-progress-box",children:[e.jsxs("span",{children:[ge,"%"]}),e.jsx("small",{children:Ce?"Onboarding completo":"Em implantação"}),e.jsx("div",{className:"onboarding-progress",children:e.jsx("i",{style:{width:`${ge}%`}})})]})]}),e.jsxs("section",{className:"onboarding-kpi-grid",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Filiais"}),e.jsx("strong",{children:X.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Centros de custo"}),e.jsx("strong",{children:n.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Contas ativas"}),e.jsx("strong",{children:je.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Status"}),e.jsx("strong",{children:Ce?"Pronto":"Guiado"})]})]}),e.jsxs("div",{className:"onboarding-steps-grid",children:[e.jsx(Fa,{numero:"1",titulo:"Empresa ativa",descricao:"A empresa atual já está definida no tenant selecionado.",concluido:pe.empresa,ativo:ie==="empresa",children:e.jsx("p",{style:t.textoNota,children:"Selecione ou crie uma empresa pelo Painel Master antes de continuar."})}),e.jsxs(Fa,{numero:"2",titulo:"Primeira filial",descricao:"Crie a unidade inicial para separar operação e indicadores.",concluido:pe.filial,ativo:ie==="filial",children:[e.jsx("input",{style:t.input,value:N,onChange:C=>g(C.target.value),placeholder:"Ex: Loja Centro"}),e.jsx("button",{style:t.btnSalvar,disabled:S,onClick:me,children:S?"Criando...":"Criar primeira filial"})]}),e.jsxs(Fa,{numero:"3",titulo:"Centro de custo",descricao:"Crie uma classificação financeira básica para as primeiras contas.",concluido:pe.centro,ativo:ie==="centro",children:[e.jsx("input",{style:t.input,value:M,onChange:C=>z(C.target.value),placeholder:"Ex: Operacional"}),e.jsx("button",{style:t.btnSalvar,disabled:S,onClick:I,children:S?"Criando...":"Criar centro de custo"})]}),e.jsxs(Fa,{numero:"4",titulo:"Primeira conta",descricao:"Registre uma conta inicial para alimentar KPIs, ranking e dashboard.",concluido:pe.conta,ativo:ie==="conta",children:[e.jsxs("div",{className:"onboarding-form-grid",children:[e.jsx("input",{style:t.input,value:E,onChange:C=>K(C.target.value),placeholder:"Descrição"}),e.jsx("input",{style:t.input,value:ne,onChange:C=>G(C.target.value),placeholder:"Valor"}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:C=>se(C.target.value)}),e.jsxs("select",{style:t.input,value:W,onChange:C=>re(C.target.value),children:[e.jsx("option",{value:"",children:((Y=X[0])==null?void 0:Y.nome)||"Filial padrão"}),X.map(C=>e.jsx("option",{value:C.id,children:C.nome},C.id))]}),e.jsxs("select",{style:t.input,value:D,onChange:C=>$(C.target.value),children:[e.jsx("option",{value:"",children:((J=n[0])==null?void 0:J.nome)||"Centro padrão"}),n.map(C=>e.jsx("option",{value:C.id,children:C.nome},C.id))]})]}),e.jsx("button",{style:t.btnSalvar,disabled:S,onClick:te,children:S?"Criando...":"Criar primeira conta"})]}),e.jsxs(Fa,{numero:"5",titulo:"Dashboard pronto",descricao:"A operação inicial já pode ser acompanhada no dashboard.",concluido:Ce,ativo:ie==="dashboard",children:[e.jsx("p",{style:t.textoNota,children:"Base inicial concluída. Revise os KPIs, ranking de unidades e filtros por filial."}),e.jsx("button",{style:t.btnSalvar,onClick:b,children:"Ir para o dashboard"})]})]})]})}function Cl({novoEmailUsuario:t,setNovoEmailUsuario:a,novaSenhaUsuario:o,setNovaSenhaUsuario:i,confirmarNovaSenhaUsuario:n,setConfirmarNovaSenhaUsuario:l,salvarMeuEmail:d,salvarMinhaSenha:m,styles:f}){return e.jsxs("div",{className:"users-account-grid users-security-grid",children:[e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar e-mail"}),e.jsx("small",{style:f.textoAjuda,children:"Confirmação pode ser solicitada."})]}),e.jsx("input",{style:f.input,type:"email",placeholder:"Novo e-mail",value:t,onChange:b=>a(b.target.value)}),e.jsx("button",{style:f.btnSalvar,onClick:d,children:"Atualizar e-mail"})]}),e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar senha"}),e.jsx("small",{style:f.textoAjuda,children:"Mínimo de 6 caracteres."})]}),e.jsxs("div",{className:"users-security-password-grid",children:[e.jsx("input",{style:f.input,type:"password",placeholder:"Nova senha",value:o,onChange:b=>i(b.target.value)}),e.jsx("input",{style:f.input,type:"password",placeholder:"Confirmar nova senha",value:n,onChange:b=>l(b.target.value)})]}),e.jsx("button",{style:f.btnSalvar,onClick:m,children:"Atualizar senha"})]})]})}const li=[{value:"admin",label:"Admin"},{value:"gerente",label:"Gerente"},{value:"financeiro",label:"Financeiro"},{value:"operacional",label:"Operacional"},{value:"visualizacao",label:"Visualização"},{value:"operador",label:"Operador"}];function Nl({styles:t,EmptyState:a,podeAcessarConfiguracoes:o,podeAdministrarUsuarios:i,navegarPara:n,usuarioLogado:l,normalizarPerfil:d,perfilUsuario:m,permissoesUsuario:f,novoEmailUsuario:b,setNovoEmailUsuario:S,novaSenhaUsuario:k,setNovaSenhaUsuario:N,confirmarNovaSenhaUsuario:g,setConfirmarNovaSenhaUsuario:M,salvarMeuEmail:z,salvarMinhaSenha:E,empresasDisponiveis:K,empresaId:ne,trocandoEmpresa:G,trocarEmpresaAtiva:q,buscarUsuariosEmpresa:se,primeiraLetraMaiuscula:W,nomeConviteUsuario:re,setNomeConviteUsuario:D,emailConviteUsuario:$,setEmailConviteUsuario:X,senhaConviteUsuario:je,setSenhaConviteUsuario:pe,perfilConviteUsuario:ge,setPerfilConviteUsuario:Ce,criandoUsuarioManual:ie,adicionarUsuarioEmpresa:y,usuariosCarregando:me,usuariosInicializados:I,usuariosErro:te,usuariosEmpresa:Y,filiais:J,filiaisUsuariosEmpresa:C,salvandoFilialUsuario:Z,liberarTodasFiliaisUsuario:Te,alternarFilialUsuario:Ee,atualizarPerfilUsuarioEmpresa:we,enviarAcessoUsuarioEmpresa:O,removerUsuarioEmpresa:fe}){if(!o())return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Usuários"}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:t.textoNota,children:"Seu perfil atual não permite acessar a gestão de usuários."}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("contas"),children:"← Voltar"})]})]});const Be=(l==null?void 0:l.email)||"",A=i();return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Gestão de usuários"}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsx("h2",{style:t.subtitulo,children:"Minha conta"}),e.jsxs("p",{style:t.textoNota,children:["Usuário conectado: ",e.jsx("strong",{children:Be})," • Perfil: ",e.jsx("strong",{children:d(m)}),f!=null&&f.isMaster?e.jsxs(e.Fragment,{children:[" • Global: ",e.jsx("strong",{children:"master"})]}):null]}),e.jsx(Cl,{novoEmailUsuario:b,setNovoEmailUsuario:S,novaSenhaUsuario:k,setNovaSenhaUsuario:N,confirmarNovaSenhaUsuario:g,setConfirmarNovaSenhaUsuario:M,salvarMeuEmail:z,salvarMinhaSenha:E,styles:t})]}),(f==null?void 0:f.canSwitchCompany)&&K.length>1&&e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsxs("div",{className:"users-header-row",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"🏢 Empresas disponíveis"}),e.jsx("p",{style:t.textoNota,children:"Troque a empresa ativa para recarregar os usuários e dados do tenant selecionado."})]}),e.jsx("span",{className:"roleBadge admin",children:"master"})]}),e.jsx("select",{style:t.input,value:ne||"",disabled:G,onChange:V=>q(V.target.value),children:K.map(V=>e.jsx("option",{value:V.id,children:V.nome||V.id},V.id))})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section users-management-section",children:[e.jsxs("div",{className:"users-header-row users-management-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Usuários da empresa"}),e.jsx("p",{style:t.textoNota,children:"Defina perfil e escopo por filial. Sem filial marcada = acesso a todas as filiais da empresa."})]}),e.jsx("button",{style:t.btnCinza,onClick:()=>se(),children:"Atualizar"})]}),e.jsxs("div",{className:"users-permission-guide users-permission-guide-compact",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Admin:"})," acesso total"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Gerente:"})," gestão operacional"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Financeiro:"})," contas e relatórios"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Operacional:"})," contas e notas"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Visualização:"})," consulta"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Filiais:"})," escopo por unidade"]})]}),A&&e.jsxs("div",{className:"users-add-card users-add-card-compact",children:[e.jsx("input",{style:t.input,type:"text",placeholder:"Nome do usuário",value:re,onChange:V=>D(W(V.target.value))}),e.jsx("input",{style:t.input,type:"email",placeholder:"E-mail do usuário",value:$,onChange:V=>X(V.target.value)}),e.jsx("input",{style:t.input,type:"text",placeholder:"Senha provisória",value:je,onChange:V=>pe(V.target.value)}),e.jsx("select",{style:t.input,value:ge,onChange:V=>Ce(V.target.value),children:li.slice().reverse().map(V=>e.jsx("option",{value:V.value,children:V.label},V.value))}),e.jsx("button",{style:t.btnSalvar,onClick:y,disabled:ie,children:ie?"Criando...":"Criar acesso"}),e.jsx("small",{style:t.textoNota,children:"Sem envio de e-mail: o admin entrega o e-mail e a senha provisória manualmente."})]}),e.jsxs("div",{className:"users-list users-list-stable","aria-busy":me,children:[me&&!I&&e.jsx(a,{icon:"⏳",title:"Carregando usuários",description:"Buscando acessos cadastrados nesta empresa."}),!me&&te&&e.jsx(a,{icon:"⚠️",title:"Não foi possível carregar usuários",description:te}),!me&&!te&&I&&Y.length===0&&e.jsx(a,{icon:"👥",title:"Nenhum usuário cadastrado",description:"Adicione usuários para dividir a operação com segurança e níveis de acesso."}),Y.map(V=>{const _e=V.user_id&&(l==null?void 0:l.id)&&V.user_id===l.id,he=!V.user_id,F=d(V.perfil),ee=C[V.id]||[],He=ee.length===0;return e.jsxs("article",{className:"user-card userCard users-user-card",children:[e.jsxs("div",{className:"users-user-card-header",children:[e.jsxs("div",{className:"user-main-info userInfo users-user-identity",children:[e.jsx("strong",{children:V.nome||V.email||"Usuário sem nome"}),e.jsx("small",{children:V.email||V.user_id||"Sem e-mail vinculado"}),e.jsxs("div",{className:"users-user-status-row",children:[_e&&e.jsx("span",{className:"user-badge user-badge-self",children:"Você"}),he&&e.jsx("span",{className:"user-badge user-badge-pending",children:"Pendente de vínculo"})]})]}),e.jsxs("div",{className:"users-user-controls",children:[e.jsx("span",{className:`roleBadge ${F}`,children:F}),e.jsx("select",{className:"user-role-select users-role-select",style:t.input,value:F,disabled:!A,onChange:Pe=>we(V,Pe.target.value),children:li.map(Pe=>e.jsx("option",{value:Pe.value,children:Pe.label},Pe.value))})]})]}),e.jsxs("div",{className:"user-branch-scope users-branch-scope-compact",children:[e.jsxs("div",{className:"user-branch-scope-header users-branch-header-compact",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Filiais permitidas"}),e.jsx("small",{children:He?"Acesso a todas as filiais da empresa.":`${ee.length} filial(is) selecionada(s).`})]}),e.jsx("button",{type:"button",className:"user-branch-clear",disabled:!A||Z===V.id,onClick:()=>Te(V),title:"Deixar o usuário com acesso a todas as filiais da empresa",children:"Todas"})]}),e.jsx("div",{className:"user-branch-list users-branch-chip-list",children:J.length===0?e.jsx("small",{children:"Nenhuma filial ativa cadastrada."}):J.map(Pe=>{const qe=ee.includes(Pe.id);return e.jsxs("label",{className:`user-branch-chip users-branch-chip ${qe?"selected":""}`,children:[e.jsx("input",{type:"checkbox",checked:qe,disabled:!A||Z===V.id,onChange:()=>Ee(V,Pe.id)}),e.jsx("span",{children:Pe.nome||Pe.nome_filial||Pe.descricao||"Filial"})]},Pe.id)})})]}),A&&e.jsxs("div",{className:"user-actions users-user-actions",children:[e.jsx("button",{style:t.btnSecundario,onClick:()=>O(V),title:"Fallback por e-mail. O acesso principal agora é criação manual com senha provisória.",children:"Enviar link"}),e.jsx("button",{style:t.btnExcluir,disabled:_e,onClick:()=>fe(V),title:_e?"Você não pode remover o próprio acesso.":"Remover usuário",children:"Remover"})]})]},V.id||V.user_id||V.email)})]})]})]})}const Di=c.createContext(null),Vo="df_empresa_ativa";function Sl(){if(typeof window>"u")return null;try{return JSON.parse(window.localStorage.getItem(Vo)||"null")}catch{return null}}function di(t){if(!(typeof window>"u")){if(!(t!=null&&t.id)){window.localStorage.removeItem(Vo);return}window.localStorage.setItem(Vo,JSON.stringify(t))}}const _l={sucesso:"Sucesso",success:"Sucesso",erro:"Atenção",error:"Atenção",alerta:"Atenção",warning:"Atenção",info:"Aviso"};function El(t){return t==="success"?"sucesso":t==="error"?"erro":t==="warning"?"alerta":t||"info"}function zl({children:t}){const[a,o]=c.useState(!1),[i,n]=c.useState(()=>Sl()),[l,d]=c.useState([]),[m,f]=c.useState(null),b=c.useRef(null),S=c.useCallback(E=>{const K=E!=null&&E.id?{id:E.id,nome:E.nome||"",perfil:E.perfil||"operador"}:null;n(K),di(K)},[]),k=c.useCallback(()=>{n(null),di(null)},[]),N=c.useCallback(()=>{b.current&&(window.clearTimeout(b.current),b.current=null),f(null)},[]),g=c.useCallback((E,K="info",ne={})=>{if(!E)return;const G=El(K),q=ne.duration??5200;b.current&&window.clearTimeout(b.current),f({id:Date.now(),message:String(E),type:G,title:ne.title||_l[G]||"Aviso"}),b.current=window.setTimeout(()=>{f(null),b.current=null},q)},[]),M=c.useCallback(async E=>{o(!0);try{return await E()}finally{o(!1)}},[]),z=c.useMemo(()=>({globalLoading:a,setGlobalLoading:o,empresaAtiva:i,empresaId:(i==null?void 0:i.id)||null,perfilEmpresaAtiva:(i==null?void 0:i.perfil)||"",setEmpresaAtiva:S,limparEmpresaAtiva:k,empresasDisponiveis:l,setEmpresasDisponiveis:d,toast:m,showToast:g,hideToast:N,runWithLoading:M}),[a,i,l,m,g,N,M,S,k]);return e.jsx(Di.Provider,{value:z,children:t})}function Ii(){const t=c.useContext(Di);if(!t)throw new Error("useApp deve ser usado dentro do AppProvider");return t}function Pl({onLogin:t}){const{showToast:a}=Ii(),[o,i]=c.useState(""),[n,l]=c.useState(""),[d,m]=c.useState(!1);async function f(b){if(b.preventDefault(),!o||!n){a("Informe e-mail e senha","erro");return}const S=ss();if(S){a(S,"erro");return}m(!0);const{data:k,error:N}=await T.auth.signInWithPassword({email:o,password:n});if(m(!1),N){a("E-mail ou senha inválidos","erro");return}const{error:g}=await T.rpc("vincular_usuario_logado");g&&console.warn("Não foi possível executar vínculo automático:",g.message),t(k.user)}return e.jsx("div",{style:Jt.page,children:e.jsxs("form",{style:Jt.card,onSubmit:f,children:[e.jsx("h1",{style:Jt.titulo,children:"Dona Flor Financeiro"}),e.jsx("p",{style:Jt.subtitulo,children:"Acesse sua conta para continuar"}),e.jsx("input",{style:Jt.input,type:"email",placeholder:"E-mail",value:o,onChange:b=>i(b.target.value)}),e.jsx("input",{style:Jt.input,type:"password",placeholder:"Senha",value:n,onChange:b=>l(b.target.value)}),e.jsx("button",{style:Jt.botao,disabled:d,children:d?"Entrando...":"Entrar"}),e.jsx("small",{style:Jt.ajuda,children:"Login seguro via Supabase Auth."})]})})}const Jt={page:{minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Arial"},card:{width:"100%",maxWidth:360,background:"#fff",borderRadius:18,padding:20,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:10},titulo:{margin:0,fontSize:26},subtitulo:{margin:"0 0 10px",color:"#666",fontSize:14},input:{width:"100%",padding:12,borderRadius:10,border:"1px solid #ccc",boxSizing:"border-box",fontSize:15},botao:{width:"100%",padding:12,borderRadius:10,border:"none",background:"#198754",color:"#fff",fontWeight:"bold",fontSize:15},ajuda:{color:"#666",textAlign:"center",marginTop:8}};function Rl({styles:t,nomeEmpresa:a,navegarPara:o,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,canSwitchCompany:l=!1,empresasDisponiveis:d=[],empresaId:m="",trocarEmpresaAtiva:f,trocandoEmpresa:b=!1,nomeUsuario:S,abrirPerfilUsuario:k,sairDoSistema:N}){const g=l&&d.length>0,M=d.find(z=>z.id===m);return e.jsxs("section",{className:"no-print top-shell top-shell-clean",style:t.usuarioTopo,children:[e.jsx("div",{className:"top-shell-context",children:e.jsxs("button",{className:"top-shell-logo",style:t.logoMarca,onClick:()=>o("dashboard"),title:"Ir para o dashboard",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:t.logoImagem}),e.jsxs("span",{children:[e.jsx("strong",{children:a||"Dona Flor"}),e.jsx("small",{children:"Gestão Financeira"})]})]})}),e.jsxs("div",{className:"top-shell-actions",style:t.usuarioAcoes,children:[g&&(d.length>1?e.jsxs("label",{className:"company-switcher",title:"Trocar empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("select",{value:m||"",disabled:b,onChange:z=>f==null?void 0:f(z.target.value),"aria-label":"Empresa ativa",children:d.map(z=>e.jsx("option",{value:z.id,children:z.nome||z.id},z.id))})]}):e.jsxs("div",{className:"company-switcher company-switcher-static",title:"Empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("strong",{children:(M==null?void 0:M.nome)||a||"Empresa ativa"})]})),e.jsx("button",{type:"button",className:"top-user-profile-button top-user-profile-icon",title:`Meu perfil${typeof S=="function"?`: ${S()}`:""}`,onClick:()=>k==null?void 0:k(),"aria-label":"Abrir meu perfil",children:e.jsx("span",{"aria-hidden":"true",children:"👤"})}),e.jsx("button",{className:"mobile-menu-trigger",style:t.btnMenuTopo,onClick:()=>n(!i),children:"☰"})]})]})}function Fl({tela:t,icon:a,label:o,telaAtual:i,sidebarCompacta:n,navegarPara:l}){const d=t&&i===t;return e.jsxs("button",{className:d?"active":"",title:o,onClick:()=>l(t),children:[e.jsx("span",{className:"menu-icon",children:a}),!n&&e.jsx("span",{className:"menu-text",children:o})]})}function $l({id:t,titulo:a,children:o,sidebarCompacta:i,gruposMenu:n,toggleGrupoMenu:l}){return e.jsxs("div",{className:"sidebar-group-clean",children:[e.jsxs("button",{className:"sidebar-group-toggle",onClick:()=>l(t),title:a,children:[e.jsx("span",{children:i?"•":a}),!i&&e.jsx("strong",{children:n[t]?"−":"+"})]}),(i||n[t])&&e.jsx("nav",{className:"desktop-sidebar-nav",children:o})]})}function Ml({sidebarCompacta:t,setSidebarCompacta:a,nomeUsuario:o,normalizarPerfil:i,perfilUsuario:n,menuSections:l,telaAtual:d,navegarPara:m,gruposMenu:f,toggleGrupoMenu:b,sairDoSistema:S}){const k=o(),N=i(n||"usuário");return e.jsxs("aside",{className:`desktop-sidebar no-print ${t?"compacta":""}`,children:[e.jsxs("div",{className:"desktop-sidebar-brand sidebar-brand-clean",title:"DF Gestão Financeira",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira"}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:"DF Gestão"}),e.jsx("small",{children:"Painel financeiro"})]})]}),e.jsxs("div",{className:"desktop-sidebar-user sidebar-user-clean",title:`${k} • ${N}`,children:[e.jsx("span",{className:"sidebar-user-avatar",children:String(k||"U").slice(0,1).toUpperCase()}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:k}),e.jsx("small",{children:N})]})]}),e.jsx("button",{className:"sidebar-collapse-btn sidebar-collapse-icon",onClick:()=>a(!t),title:t?"Expandir menu":"Recolher menu","aria-label":t?"Expandir menu":"Recolher menu",children:e.jsx("span",{className:"sidebar-collapse-arrow",children:t?"→":"←"})}),e.jsx("div",{className:"desktop-sidebar-scroll",children:l.map(g=>e.jsx($l,{id:g.id,titulo:g.titulo,sidebarCompacta:t,gruposMenu:f,toggleGrupoMenu:b,children:g.items.map(M=>e.jsx(Fl,{tela:M.tela,icon:M.icon,label:M.label,telaAtual:d,sidebarCompacta:t,navegarPara:m},M.tela))},g.id))}),e.jsx("div",{className:"desktop-sidebar-spacer"}),e.jsx("nav",{className:"desktop-sidebar-nav sidebar-exit",children:e.jsxs("button",{onClick:S,title:"Sair",children:[e.jsx("span",{className:"menu-icon",children:"🚪"}),!t&&e.jsx("span",{children:"Sair"})]})})]})}function Tl({visible:t,styles:a,setMenuNavegacaoAberto:o,nomeUsuario:i,nomeUsuarioAtual:n,normalizarPerfil:l,perfilUsuario:d,menuSections:m,navegarPara:f,sairDoSistema:b,canSwitchCompany:S=!1,empresasDisponiveis:k=[],empresaId:N="",trocarEmpresaAtiva:g,trocandoEmpresa:M=!1,abrirPerfilUsuario:z}){if(!t)return null;const E=S&&k.length>0,K=k.find(q=>q.id===N),ne=n||(typeof i=="function"?i():i)||"usuário",G=(q,se,W,re)=>e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:re,children:[e.jsx("span",{children:q}),e.jsxs("div",{children:[e.jsx("strong",{children:se}),e.jsx("small",{children:W})]})]});return e.jsx("div",{className:"no-print mobile-menu-backdrop",style:a.menuBackdrop,onClick:()=>o(!1),onTouchMove:q=>q.preventDefault(),children:e.jsxs("div",{className:"mobile-menu-panel",style:a.menuNavegacao,role:"dialog","aria-label":"Menu de navegação",onClick:q=>q.stopPropagation(),onWheel:q=>q.stopPropagation(),onTouchMove:q=>q.stopPropagation(),children:[e.jsxs("div",{style:a.menuPerfil,children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:a.menuPerfilIcone}),e.jsxs("div",{children:[e.jsx("strong",{children:ne}),e.jsx("small",{children:l(d||"usuário")})]})]}),E&&e.jsxs("div",{className:"mobile-company-switcher",style:{margin:"12px 0 18px",padding:"12px 14px",border:"1px solid rgba(20, 184, 166, 0.22)",borderRadius:18,background:"rgba(240, 253, 250, 0.9)",display:"grid",gap:8},children:[e.jsx("span",{style:{fontSize:11,fontWeight:900,color:"#0f766e",textTransform:"uppercase",letterSpacing:".08em"},children:"Empresa ativa"}),k.length>1?e.jsx("select",{value:N||"",disabled:M,onChange:q=>{g==null||g(q.target.value),o(!1)},"aria-label":"Empresa ativa",style:{width:"100%",border:"0",background:"transparent",color:"#111827",fontWeight:900,fontSize:15,outline:"none"},children:k.map(q=>e.jsx("option",{value:q.id,children:q.nome||q.id},q.id))}):e.jsx("strong",{style:{color:"#111827",fontSize:15},children:(K==null?void 0:K.nome)||"Empresa ativa"})]}),e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:()=>{o(!1),z==null||z()},children:[e.jsx("span",{children:"👤"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Meu perfil"}),e.jsx("small",{children:"Editar nome do usuário"})]})]}),m.map((q,se)=>e.jsxs("details",{className:"mobile-menu-group",open:se===0,children:[e.jsx("summary",{children:q.titulo}),q.items.map(W=>G(W.icon,W.label,W.desc,()=>f(W.tela))),q.id==="sistema"&&e.jsxs("button",{type:"button",style:a.menuSairItem,onClick:b,children:[e.jsx("span",{children:"🚪"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Sair"}),e.jsx("small",{children:"Encerrar sessão"})]})]})]},q.id))]})})}function Dl({styles:t,editandoContaId:a,descricao:o,setDescricao:i,valor:n,setValor:l,dataVencimento:d,setDataVencimento:m,centroCustoId:f,setCentroCustoId:b,centros:S,filialId:k,setFilialId:N,filiais:g,observacaoConta:M,setObservacaoConta:z,contaRecorrente:E,setContaRecorrente:K,tipoRecorrencia:ne,setTipoRecorrencia:G,diaVencimentoRecorrencia:q,setDiaVencimentoRecorrencia:se,fecharConta:W,salvarConta:re,primeiraLetraMaiuscula:D,limitarDataInput:$,formatarDataParaBanco:X,fecharNota:je,setModalCentro:pe,setMenuAberto:ge,setMenuNavegacaoAberto:Ce}){function ie(){W(),je(),pe(!1),ge(!1),Ce(!1)}return e.jsx("div",{style:t.overlay,onClick:ie,children:e.jsxs("div",{style:t.modal,onClick:y=>y.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Conta":"Nova Conta"}),e.jsx("input",{style:t.inputModal,placeholder:"Descrição",value:o,onChange:y=>i(D(y.target.value))}),e.jsx("input",{style:t.inputModal,placeholder:"Valor. Ex: 150,90",value:n,onChange:y=>l(y.target.value)}),e.jsx("input",{style:t.inputModal,type:"date",value:d,onChange:y=>m($(y.target.value))}),e.jsxs("select",{style:t.inputModal,value:k,onChange:y=>N(y.target.value),children:[e.jsx("option",{value:"",children:"Filial / unidade"}),(g||[]).map(y=>e.jsx("option",{value:y.id,children:y.nome},y.id))]}),e.jsxs("select",{style:t.inputModal,value:f,onChange:y=>b(y.target.value),children:[e.jsx("option",{value:"",children:"Centro de custo"}),S.map(y=>e.jsx("option",{value:y.id,children:y.nome},y.id))]}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Observação ou comentário da conta...",value:M,onChange:y=>z(D(y.target.value))}),e.jsxs("div",{className:"recurrence-box",style:t.blocoRecorrenciaConta,children:[e.jsxs("label",{className:"checkbox-row-fix",style:t.switchLinhaCompacta,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"🔁 Conta recorrente"}),e.jsx("small",{style:t.textoAjuda,children:"Ideal para aluguel, internet, sistema, mensalidades e contas fixas."})]}),e.jsx("input",{type:"checkbox",checked:E,onChange:y=>{const me=y.target.checked;K(me),me&&d&&se(String(Number(X(d).slice(8,10))))}})]}),E&&e.jsxs("div",{className:"recurrence-fields",children:[e.jsx("select",{style:t.inputModal,value:ne,onChange:y=>G(y.target.value),children:e.jsx("option",{value:"mensal",children:"Mensal"})}),e.jsx("input",{style:t.inputModal,type:"number",min:"1",max:"31",placeholder:"Dia de vencimento mensal. Ex: 5",value:q||(d?String(Number(X(d).slice(8,10))):""),onChange:y=>se(y.target.value)}),e.jsx("small",{style:t.textoAjuda,children:"O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir."})]})]}),e.jsx("button",{style:t.btnSalvar,type:"button",onClick:y=>{y.preventDefault(),y.stopPropagation(),re()},children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,type:"button",onClick:W,children:"Cancelar"})]})})}function Il({styles:t,editandoNotaId:a,tituloNota:o,setTituloNota:i,prioridadeNota:n,setPrioridadeNota:l,dataEventoNota:d,setDataEventoNota:m,conteudoNota:f,setConteudoNota:b,filialNotaId:S,setFilialNotaId:k,filiais:N,salvarNota:g,fecharNota:M,fecharConta:z,setModalCentro:E,setMenuAberto:K,setMenuNavegacaoAberto:ne,primeiraLetraMaiuscula:G,limitarDataInput:q}){function se(){z(),M(),E(!1),K(!1),ne(!1)}return e.jsx("div",{style:t.overlay,onClick:se,children:e.jsxs("div",{style:t.modal,onClick:W=>W.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Nota":"Nova Nota"}),e.jsx("input",{style:t.inputModal,placeholder:"Título",value:o,onChange:W=>i(G(W.target.value))}),e.jsxs("select",{style:t.inputModal,value:n,onChange:W=>l(W.target.value),children:[e.jsx("option",{value:"normal",children:"Prioridade normal"}),e.jsx("option",{value:"urgente",children:"Urgente"}),e.jsx("option",{value:"critico",children:"Crítico"})]}),e.jsxs("select",{style:t.inputModal,value:S,onChange:W=>k(W.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(N||[]).map(W=>e.jsx("option",{value:W.id,children:W.nome},W.id))]}),e.jsx("input",{style:t.inputModal,type:"date",value:d,onChange:W=>m(q(W.target.value))}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Conteúdo...",value:f,onChange:W=>b(W.target.value)}),e.jsx("button",{style:t.btnSalvar,onClick:g,children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,onClick:M,children:"Cancelar"})]})})}function Al({styles:t,novoCentro:a,setNovoCentro:o,salvarCentro:i,centros:n,abrirConfirmacao:l,excluirCentro:d,fecharConta:m,fecharNota:f,setModalCentro:b,setMenuAberto:S,setMenuNavegacaoAberto:k}){function N(){m(),f(),b(!1),S(!1),k(!1)}return e.jsx("div",{style:t.overlay,onClick:N,children:e.jsxs("div",{style:t.modal,onClick:g=>g.stopPropagation(),children:[e.jsx("h3",{children:"Centros de Custo"}),e.jsx("input",{style:t.inputModal,placeholder:"Novo centro",value:a,onChange:g=>o(g.target.value),autoFocus:!0}),e.jsx("button",{style:t.btnSalvar,onClick:i,children:"Salvar Centro"}),n.map(g=>e.jsxs("div",{style:t.itemCentro,children:[e.jsx("span",{children:g.nome}),e.jsx("button",{style:t.btnMiniExcluir,onClick:()=>l({titulo:"Excluir centro de custo",mensagem:`Deseja excluir o centro ${g.nome}?`,textoConfirmar:"Excluir",tipo:"perigo",acao:()=>d(g.id)}),children:"excluir"})]},g.id)),e.jsx("button",{style:t.btnCancelar,onClick:()=>b(!1),children:"Fechar"})]})})}function Bl({styles:t,confirmacao:a,fecharConfirmacao:o,executarConfirmacao:i}){return a!=null&&a.aberto?e.jsx("div",{style:t.overlayConfirmacao,children:e.jsxs("div",{style:t.modalConfirmacao,children:[e.jsx("div",{style:t.confirmacaoIcone,children:a.tipo==="perigo"?"⚠️":a.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:t.confirmacaoTitulo,children:a.titulo}),e.jsx("p",{style:t.confirmacaoTexto,children:a.mensagem}),e.jsxs("div",{style:t.confirmacaoAcoes,children:[e.jsx("button",{style:t.btnConfirmarCancelar,onClick:o,children:"Cancelar"}),e.jsx("button",{style:{...t.btnConfirmarAcao,background:a.tipo==="perigo"?"#dc3545":a.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:i,children:a.textoConfirmar})]})]})}):null}function ql({nome:t,setNome:a,email:o,salvando:i,onClose:n,onSave:l}){return e.jsx("div",{className:"profile-modal-backdrop",role:"presentation",onClick:n,children:e.jsxs("div",{className:"profile-modal-card",role:"dialog","aria-modal":"true","aria-label":"Meu perfil",onClick:d=>d.stopPropagation(),children:[e.jsxs("div",{className:"profile-modal-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Perfil"}),e.jsx("h2",{children:"Meu perfil"})]}),e.jsx("button",{type:"button",onClick:n,"aria-label":"Fechar",children:"×"})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"Nome de exibição"}),e.jsx("input",{value:t,onChange:d=>a(d.target.value),placeholder:"Digite seu nome",autoFocus:!0,maxLength:80})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"E-mail"}),e.jsx("input",{value:o||"",readOnly:!0})]}),e.jsxs("div",{className:"profile-modal-actions",children:[e.jsx("button",{type:"button",className:"profile-modal-cancel",onClick:n,disabled:i,children:"Cancelar"}),e.jsx("button",{type:"button",className:"profile-modal-save",onClick:l,disabled:i,children:i?"Salvando...":"Salvar perfil"})]})]})})}function ci({visible:t,message:a="Carregando..."}){return t?e.jsx("div",{className:"global-loader-overlay",role:"status","aria-live":"polite",children:e.jsxs("div",{className:"global-loader-card",children:[e.jsx("div",{className:"global-loader-spinner"}),e.jsx("span",{children:a})]})}):null}function qo({toast:t,onClose:a}){if(!t)return null;const o=t.type||"info",i=e.jsxs("div",{className:`app-toast app-toast-${o} app-toast-global`,role:o==="erro"?"alert":"status","aria-live":o==="erro"?"assertive":"polite",onClick:a,children:[e.jsx("div",{className:`app-toast-icon app-toast-icon-${o}`,children:o==="erro"?"!":o==="sucesso"?"✓":o==="alerta"?"!":"i"}),e.jsxs("div",{className:"app-toast-content",children:[e.jsx("strong",{children:t.title||(o==="erro"?"Atenção":"Aviso")}),e.jsx("span",{children:t.message})]}),e.jsx("button",{type:"button",className:"app-toast-close","aria-label":"Fechar aviso",onClick:n=>{n.stopPropagation(),a==null||a()},children:"×"})]});return typeof document>"u"?i:ts.createPortal(i,document.body)}const Ai=c.createContext(null);function pi({children:t,contas:a=[],contasFiltradas:o=[],navegarPara:i}){const[n,l]=c.useState(!1),[d,m]=c.useState(""),f=c.useMemo(()=>zi({contas:a,contasFiltradas:o}),[a,o]),b=c.useMemo(()=>({open:n,setOpen:l,toggle:()=>l(S=>!S),close:()=>l(!1),intelligence:f,lastQuestion:d,setLastQuestion:m,navegarPara:i}),[n,f,d,i]);return e.jsx(Ai.Provider,{value:b,children:t})}function Dt(){const t=c.useContext(Ai);if(!t)throw new Error("useCopilot deve ser usado dentro de CopilotProvider");return t}function mi(){const{open:t,toggle:a,intelligence:o}=Dt(),i=o.totals.vencido>0;return t?null:e.jsxs("button",{className:`copilot-floating-button no-print ${i?"has-risk":""}`,type:"button",onClick:n=>{n.preventDefault(),n.stopPropagation(),a()},"aria-label":"Abrir Copilot IA",children:[e.jsx("span",{children:"✨"}),e.jsx("strong",{children:"Copilot IA"}),i&&e.jsx("i",{})]})}function po(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Ll(){const{intelligence:t}=Dt(),{score:a,status:o,executiveSummary:i,totals:n}=t;return e.jsxs("section",{className:`copilot-card copilot-score-${o.tone}`,children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Executive AI Summary"}),e.jsxs("strong",{children:[a,"/100"]})]}),e.jsx("p",{children:i}),e.jsxs("div",{className:"copilot-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Total"}),e.jsx("b",{children:po(n.total)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Pendente"}),e.jsx("b",{children:po(n.pendente)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Vencido"}),e.jsx("b",{children:po(n.vencido)})]})]})]})}function Ul(){const{intelligence:t,navegarPara:a,close:o}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Smart Priority Engine"}),e.jsx("strong",{children:t.priorities.length})]}),e.jsx("div",{className:"copilot-priority-list",children:t.priorities.map((i,n)=>e.jsxs("article",{className:`copilot-priority copilot-priority-${i.tone}`,children:[e.jsxs("div",{children:[e.jsxs("small",{children:[i.level," impacto · ",i.impact]}),e.jsx("strong",{children:i.title}),e.jsx("p",{children:i.description})]}),e.jsx("button",{type:"button",onClick:()=>{a==null||a(i.action.includes("Relatórios")?"relatorios":"contas"),o()},children:i.action})]},`${i.title}-${n}`))})]})}function Ol(){const{intelligence:t}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Insights IA"}),e.jsx("strong",{children:"Live"})]}),e.jsx("div",{className:"copilot-insights",children:t.insights.map(a=>e.jsxs("p",{children:["✦ ",a]},a))})]})}function Vl(){const{intelligence:t}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Recomendações acionáveis"}),e.jsx("strong",{children:t.recomendacoes.length})]}),e.jsx("div",{className:"copilot-recommendations",children:t.recomendacoes.map((a,o)=>e.jsxs("p",{children:[e.jsx("b",{children:o+1}),a]},`${a}-${o}`))})]})}function Gl(){const{intelligence:t}=Dt(),a=t.rankingCentros||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Drill-down analytics"}),e.jsxs("strong",{children:["Top ",a.length||0]})]}),e.jsx("div",{className:"copilot-drilldown",children:a.length?a.map(o=>e.jsxs("article",{children:[e.jsxs("div",{children:[e.jsx("strong",{children:o.nome}),e.jsxs("small",{children:[po(o.total)," · ",o.peso,"% do recorte · risco ",o.risco,"%"]})]}),e.jsx("span",{style:{width:`${Math.max(6,o.peso)}%`}})]},o.nome)):e.jsx("p",{children:"Sem centros suficientes para drill-down no recorte atual."})})]})}function Wl(){const{intelligence:t}=Dt(),a=t.narrativa||{},o=[["Liquidez",a.liquidez],["Concentração",a.concentracao],["Curto prazo",a.curtoPrazo],["Comportamento",a.comportamento]].filter(([,i])=>i);return e.jsxs("section",{className:"copilot-card copilot-narrative-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"AI Narrative 11.8"}),e.jsx("strong",{children:"Contextual"})]}),e.jsx("p",{children:a.parecer||t.executiveSummary}),e.jsx("div",{className:"copilot-insights",children:o.map(([i,n])=>e.jsxs("p",{children:[e.jsxs("b",{children:[i,":"]})," ",n]},i))})]})}function Hl(){var o;const{intelligence:t}=Dt(),a=((o=t.narrativa)==null?void 0:o.anomalias)||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Anomalias contextuais"}),e.jsx("strong",{children:a.length})]}),e.jsx("div",{className:"copilot-insights",children:a.map((i,n)=>e.jsxs("p",{children:["⚠ ",i]},`${i}-${n}`))})]})}function Kl(){const{intelligence:t,setLastQuestion:a}=Dt();return e.jsxs("section",{className:"copilot-card copilot-questions-card",children:[e.jsx("span",{className:"copilot-mini-label",children:"Perguntas rápidas"}),e.jsx("div",{className:"copilot-questions",children:t.quickQuestions.map(o=>e.jsx("button",{type:"button",onClick:()=>a(o),children:o},o))})]})}function ui(){var n;const{open:t,close:a,intelligence:o,lastQuestion:i}=Dt();return t?e.jsxs("div",{className:"copilot-shell no-print",onClick:l=>l.stopPropagation(),children:[e.jsx("button",{className:"copilot-backdrop",type:"button","aria-label":"Fechar Copilot",onClick:a}),e.jsxs("aside",{className:"copilot-drawer","aria-label":"Painel Copilot IA",children:[e.jsxs("header",{className:"copilot-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Copilot IA 11.8"}),e.jsx("h2",{children:"Sistema Operacional Financeiro Inteligente"}),e.jsxs("p",{children:["Status: ",o.status.label," · Score ",o.score,"/100"]}),e.jsxs("div",{className:"copilot-live-indicator",children:[e.jsx("b",{})," Analisando dados em tempo real"]})]}),e.jsx("button",{type:"button",onClick:a,"aria-label":"Fechar",children:"×"})]}),e.jsxs("main",{className:"copilot-content",children:[e.jsx(Ll,{}),e.jsx(Wl,{}),e.jsx(Ul,{}),e.jsx(Hl,{}),e.jsx(Gl,{}),e.jsx(Vl,{}),e.jsx(Ol,{}),i&&e.jsxs("section",{className:"copilot-card copilot-answer",children:[e.jsx("span",{className:"copilot-mini-label",children:"Pergunta selecionada"}),e.jsx("strong",{children:i}),e.jsx("p",{children:((n=o.respostas)==null?void 0:n[i])||"Resposta executiva gerada a partir dos KPIs atuais."})]}),e.jsx(Kl,{})]})]})]}):null}function fi(){return e.jsx("style",{children:`
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
    `})}const Yl={semEmpresa:"Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar."};function Xl(t){var a,o;return t!=null&&t.empresa_id?{empresaId:t.empresa_id,perfil:Zt(t.perfil),nomeEmpresa:t.nome_empresa||((a=t.empresas)==null?void 0:a.nome)||((o=t.df_empresas)==null?void 0:o.nome)||"",origem:"df_usuarios_empresas"}:null}async function Ql(){const{error:t}=await T.rpc("vincular_usuario_logado");t&&console.warn("Não foi possível executar vínculo automático:",t.message)}async function Jl(t){if(!t)return null;const{data:a,error:o}=await T.from("df_usuarios_empresas").select("empresa_id, perfil").eq("user_id",t).limit(1);if(o)throw o;const i=Array.isArray(a)?a[0]:a;if(!(i!=null&&i.empresa_id))return null;let n="";const{data:l,error:d}=await T.from("df_empresas").select("nome").eq("id",i.empresa_id).limit(1);if(d)console.warn("Não foi possível carregar o nome da empresa ativa:",d.message);else{const m=Array.isArray(l)?l[0]:l;n=(m==null?void 0:m.nome)||""}return Xl({...i,nome_empresa:n})}async function xi(t){if(!t)return"";const{data:a,error:o}=await T.from("profiles").select("name").eq("id",t).limit(1);if(o)return console.warn("Não foi possível carregar o nome do perfil:",o.message),"";const i=Array.isArray(a)?a[0]:a;return(i==null?void 0:i.name)||""}function Ot(t){if(!t)throw new Error("Empresa não identificada para esta operação.");return t}function Bi(t){if(!(t!=null&&t.empresa_id))throw new Error("Operação bloqueada: empresa_id ausente no payload.");return t}function Zl(t){return!Array.isArray(t)||t.length===0||t.forEach(Bi),t}function ya(t,a,o,i="*"){return Ot(o),t.from(a).select(i).eq("empresa_id",o)}function Da(t,a,o,i={}){Bi(o);let n=t.from(a).insert([o]);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function ed(t,a,o,i={}){Zl(o);let n=t.from(a).insert(o);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function Ia(t,a,o,i,n){return Ot(i),t.from(a).update(n).eq("id",o).eq("empresa_id",i)}function td(t,a,o,i){return Ot(i),t.from(a).delete().eq("id",o).eq("empresa_id",i)}async function ad(t,a){return Ot(a),ya(t,"df_contas",a,"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("excluido",!1).order("data_vencimento")}async function od(t,a){return Ot(a),ya(t,"df_contas_recorrentes",a).eq("ativo",!0)}async function rd(t,a,o){if(!a)return null;Ot(o);const{data:i,error:n}=await t.from("df_centros_custo").select("id").eq("id",a).eq("empresa_id",o).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function id(t,a,o){if(!a)return null;Ot(o);const{data:i,error:n}=await t.from("df_filiais").select("id").eq("id",a).eq("empresa_id",o).eq("ativo",!0).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function nd(t,a){return ed(t,"df_contas",a,{select:"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)"})}async function sd(t,a){return Da(t,"df_contas",a,{select:!0})}async function uo(t,a,o,i){return Ia(t,"df_contas",a,o,i)}async function ld(t,a,o){return Ot(o),ya(t,"df_contas_recorrentes",o).eq("id",a).maybeSingle()}async function dd(t,a,o){return Ot(a),ya(t,"df_contas_recorrentes",a).eq("ativo",!0).eq("dia_vencimento",o).order("created_at",{ascending:!1})}async function hi(t,a){const o=await Da(t,"df_contas_recorrentes",a,{select:!0});return Li(o.error,a)?Da(t,"df_contas_recorrentes",Ui(a),{select:!0}):o}async function qi(t,a,o,i){const n=await Ia(t,"df_contas_recorrentes",a,o,i);return Li(n.error,i)?Ia(t,"df_contas_recorrentes",a,o,Ui(i)):n}async function $a(t,a,o,i){return uo(t,a,o,{recorrencia_id:i})}async function cd(t,a,o){return qi(t,a,o,{ativo:!1})}async function gi(t,a,o,i){return uo(t,a,o,{status:i})}async function pd(t,a,o){return uo(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}function Li(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&md(t))}function md(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Ui(t){const{filial_id:a,...o}=t||{};return o}function ud(){const[t,a]=c.useState([]),[o,i]=c.useState([]),[n,l]=c.useState(""),[d,m]=c.useState("todas"),[f,b]=c.useState(""),[S,k]=c.useState(""),[N,g]=c.useState(""),[M,z]=c.useState(""),[E,K]=c.useState(""),[ne,G]=c.useState(!0),[q,se]=c.useState(!1),[W,re]=c.useState(null),[D,$]=c.useState(""),[X,je]=c.useState(""),[pe,ge]=c.useState(""),[Ce,ie]=c.useState(""),[y,me]=c.useState(""),[I,te]=c.useState(""),[Y,J]=c.useState(!1),[C,Z]=c.useState(!1),[Te,Ee]=c.useState(!1),[we,O]=c.useState("1"),[fe,Be]=c.useState(!1),[A,V]=c.useState("mensal"),[_e,he]=c.useState(""),[F,ee]=c.useState(null);function He(){re(null),$(""),je(""),ge(""),ie(""),me(""),te(""),J(!1),Z(!1),Ee(!1),O("1"),Be(!1),V("mensal"),he(""),ee(null)}async function Pe(Se,Q,L){return L?rd(Se,L,Q):null}async function qe(Se,Q,L){return L?id(Se,L,Q):null}async function It({supabase:Se,empresaAtual:Q,contasAtuais:L,configWhatsapp:B,configEmail:ue,configPush:Re,diasAlertaContas:Ke,diasAvisoPadrao:Ye}){const Ue=new Date,Xe=Ue.getFullYear(),We=Ue.getMonth()+1,{data:rt,error:bt}=await od(Se,Q);if(bt)return console.warn("Não foi possível carregar contas recorrentes:",bt.message),L;const Rt=[];for(const Ze of rt||[]){if(!Hs(Ze,Xe,We))continue;const mt=Ws(Xe,We,Ze.dia_vencimento);if(L.some(vt=>String(vt.descricao||"").trim().toLowerCase()===String(Ze.descricao||"").trim().toLowerCase()&&vt.data_vencimento===mt))continue;const qt=await Pe(Se,Q,Ze.centro_custo_id),ut=await qe(Se,Q,Ze.filial_id);Rt.push({empresa_id:Q,descricao:Ze.descricao,valor:Number(Ze.valor||0),data_vencimento:mt,vencimento:mt,centro_custo_id:qt,filial_id:ut,observacao:Ze.observacao||null,recorrencia_id:Ze.id,status:"pendente",excluido:!1,enviar_whatsapp:B,enviar_email:ue,enviar_push:Re,dias_aviso:Number(Ke||Ye||1)})}if(Rt.length===0)return L;const{data:Gt,error:At}=await nd(Se,Rt);return At?(console.warn("Não foi possível gerar contas recorrentes:",At.message),L):[...L,...Gt||[]].sort((Ze,mt)=>String(Ze.data_vencimento||"").localeCompare(String(mt.data_vencimento||"")))}async function Qe(Se){const{supabase:Q,empresaAtual:L,avisarErro:B,configWhatsapp:ue,configEmail:Re,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ue}=Se;if(!L)return;const{data:Xe,error:We}=await ad(Q,L);if(We){B(We);return}const bt=await It({supabase:Q,empresaAtual:L,contasAtuais:Xe||[],configWhatsapp:ue,configEmail:Re,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ue});a(bt)}function lt(Se){const{setMenuAberto:Q,setMenuNavegacaoAberto:L,configWhatsapp:B,configEmail:ue,configPush:Re,diasAvisoPadrao:Ke}=Se;Q(!1),L(!1),He(),J(B),Z(ue),Ee(Re),O(String(Ke||1)),se(!0)}async function Le({supabase:Se,empresaId:Q,conta:L,dataBanco:B,descricaoConta:ue}){if(!Se||!Q||!L)return null;if(L.recorrencia_id){const{data:We,error:rt}=await ld(Se,L.recorrencia_id,Q);if(!rt&&We)return We}const Re=Number(String(B||L.data_vencimento||"").slice(8,10));if(!Re)return null;const{data:Ke,error:Ye}=await dd(Se,Q,Re);if(Ye||!Array.isArray(Ke))return null;const Ue=String(ue||L.descricao||"").trim().toLowerCase(),Xe=Number(L.valor||0);return Ke.find(We=>{const rt=String(We.descricao||"").trim().toLowerCase()===Ue,bt=Number(We.valor||0)===Xe;return rt&&bt})||null}async function pt(Se){const{conta:Q,supabase:L,empresaId:B,diasAvisoPadrao:ue,formatarDataParaBanco:Re}=Se,Ke=Re(Q.data_vencimento||""),Ye=Ke?String(Number(String(Ke).slice(8,10))):"";re(Q.id),$(Q.descricao||""),je(Q.valor||""),ge(Q.data_vencimento||""),ie(Q.centro_custo_id||""),me(Q.filial_id||""),te(Q.observacao||""),J(Q.enviar_whatsapp??!1),Z(Q.enviar_email??!1),Ee(Q.enviar_push??!1),O(String(Q.dias_aviso??ue??1)),Be(!!Q.recorrencia_id),ee(Q.recorrencia_id||null),V("mensal"),he(Ye),se(!0);const Ue=await Le({supabase:L,empresaId:B,conta:Q,dataBanco:Ke,descricaoConta:Q.descricao});Ue&&(Be(!0),ee(Ue.id),V(Ue.frequencia||Ue.tipo_recorrencia||"mensal"),he(String(Ue.dia_vencimento||Ye||"")),!Q.recorrencia_id&&Ue.id&&await $a(L,Q.id,B,Ue.id))}function _t(){se(!1),He()}async function Je(Se){const{supabase:Q,empresaId:L,mostrarAviso:B,configWhatsapp:ue,configEmail:Re,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ue,primeiraLetraMaiuscula:Xe,converterValor:We,formatarDataParaBanco:rt,erroEhSessaoExpirada:bt,limparEstadoAutenticacao:Rt,setUsuarioLogado:Gt,buscarContas:At,fecharConta:Ze}=Se;if(!L){B("Usuário sem empresa vinculada.","erro");return}if(!D||!X||!pe){B("Preencha descrição, valor e vencimento.","erro");return}const mt=await Pe(Q,L,Ce),Bt=await qe(Q,L,y),qt={descricao:Xe(D.trim()),valor:We(X),data_vencimento:rt(pe),vencimento:rt(pe),centro_custo_id:mt,filial_id:Bt,observacao:I.trim()||null,enviar_whatsapp:Y,enviar_email:C,enviar_push:Te,dias_aviso:Number(we||Ye||Ue||1),empresa_id:L};let ut;if(W){if(ut=(await uo(Q,W,L,qt)).error,!ut){const jt=rt(pe),s=Number(_e||String(jt).slice(8,10));if(fe){if(!s||s<1||s>31){B("Informe um dia válido para a recorrência.","erro");return}const v={empresa_id:L,descricao:Xe(D.trim()),valor:We(X),centro_custo_id:mt,filial_id:Bt,tipo_recorrencia:A||"mensal",dia_vencimento:s,data_inicio:jt,ativo:!0};if(F){const{error:U}=await qi(Q,F,L,v);if(U){B("A conta foi atualizada, mas a recorrência não foi salva: "+U.message,"erro");return}const{error:le}=await $a(Q,W,L,F);if(le){B("A recorrência foi atualizada, mas não foi vinculada à conta: "+le.message,"erro");return}}else{const{data:U,error:le}=await hi(Q,v);if(le){B("A conta foi atualizada, mas a recorrência não foi salva: "+le.message,"erro");return}const ye=Array.isArray(U)?U[0]:U;let ve=ye==null?void 0:ye.id;if(!ve){const Fe=await Le({supabase:Q,empresaId:L,conta:{descricao:Xe(D.trim()),valor:We(X),data_vencimento:jt},dataBanco:jt,descricaoConta:Xe(D.trim())});ve=Fe==null?void 0:Fe.id}if(!ve){B("A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.","erro");return}const{error:be}=await $a(Q,W,L,ve);if(be){B("A recorrência foi criada, mas não foi vinculada à conta: "+be.message,"erro");return}ee(ve),a(Fe=>Fe.map(de=>de.id===W?{...de,recorrencia_id:ve}:de))}}else F&&(await cd(Q,F,L),await $a(Q,W,L,null))}}else{const vt=await sd(Q,{...qt,status:"pendente",excluido:!1});if(ut=vt.error,!ut&&fe){const jt=rt(pe),s=Number(_e||String(jt).slice(8,10));if(!s||s<1||s>31){B("Informe um dia válido para a recorrência.","erro");return}const{data:v,error:U}=await hi(Q,{empresa_id:L,descricao:Xe(D.trim()),valor:We(X),centro_custo_id:mt,filial_id:Bt,tipo_recorrencia:A||"mensal",dia_vencimento:s,data_inicio:jt,ativo:!0});if(U)B("A conta foi criada, mas a recorrência não foi salva: "+U.message,"erro");else{const le=Array.isArray(v)?v[0]:v,ye=Array.isArray(vt.data)?vt.data[0]:vt.data;let ve=le==null?void 0:le.id;if(!ve&&(ye!=null&&ye.id)){const be=await Le({supabase:Q,empresaId:L,conta:ye,dataBanco:jt,descricaoConta:Xe(D.trim())});ve=be==null?void 0:be.id}if(ve&&(ye!=null&&ye.id)){const{error:be}=await $a(Q,ye.id,L,ve);if(be){B("A recorrência foi criada, mas não foi vinculada à conta: "+be.message,"erro");return}}}}}if(ut){bt(ut)?(await Q.auth.signOut(),Rt(),Gt(null),B("Sua sessão expirou. Faça login novamente.","erro")):B(ut.message,"erro");return}Ze(),await At(),B(W?"Conta atualizada com sucesso.":"Conta criada com sucesso.","sucesso")}async function Vt(Se){const{supabase:Q,id:L,empresaId:B,buscarContas:ue,mostrarAviso:Re}=Se;await gi(Q,L,B,"pago"),await ue(),Re==null||Re("Conta marcada como paga.","sucesso")}async function gt(Se){const{supabase:Q,id:L,empresaId:B,buscarContas:ue,mostrarAviso:Re}=Se;await gi(Q,L,B,"pendente"),await ue(),Re==null||Re("Conta voltou para pendente.","sucesso")}async function ea(Se){const{supabase:Q,id:L,empresaId:B,avisarErro:ue,buscarContas:Re,buscarLixeira:Ke,mostrarAviso:Ye}=Se,{error:Ue}=await pd(Q,L,B);if(Ue){ue(Ue);return}await Promise.all([Re(),Ke()]),Ye==null||Ye("Conta enviada para a lixeira.","sucesso")}return{contas:t,setContas:a,contasLixeira:o,setContasLixeira:i,busca:n,setBusca:l,filtroStatus:d,setFiltroStatus:m,filtroCentro:f,setFiltroCentro:b,filtroFilial:S,setFiltroFilial:k,filtroMes:N,setFiltroMes:g,dataInicial:M,setDataInicial:z,dataFinal:E,setDataFinal:K,loading:ne,setLoading:G,modalConta:q,setModalConta:se,editandoContaId:W,setEditandoContaId:re,descricao:D,setDescricao:$,valor:X,setValor:je,dataVencimento:pe,setDataVencimento:ge,centroCustoId:Ce,setCentroCustoId:ie,filialId:y,setFilialId:me,observacaoConta:I,setObservacaoConta:te,contaWhatsapp:Y,setContaWhatsapp:J,contaEmail:C,setContaEmail:Z,contaPush:Te,setContaPush:Ee,contaDiasAviso:we,setContaDiasAviso:O,contaRecorrente:fe,setContaRecorrente:Be,tipoRecorrencia:A,setTipoRecorrencia:V,diaVencimentoRecorrencia:_e,setDiaVencimentoRecorrencia:he,recorrenciaContaId:F,setRecorrenciaContaId:ee,buscarContas:Qe,abrirNovaConta:lt,abrirEdicaoConta:pt,fecharConta:_t,salvarConta:Je,marcarComoPago:Vt,voltarParaPendente:gt,excluirConta:ea}}async function fd(t,a){return ya(t,"df_notas",a).eq("excluido",!1).order("created_at",{ascending:!1})}async function xd(t,a){return ya(t,"df_notas",a).eq("excluido",!0).order("excluido_em",{ascending:!1})}async function hd(t,a){const o=await Da(t,"df_notas",a);return Oi(o.error,a)?Da(t,"df_notas",Vi(a)):o}async function fo(t,a,o,i){const n=await Ia(t,"df_notas",a,o,i);return Oi(n.error,i)?Ia(t,"df_notas",a,o,Vi(i)):n}async function gd(t,a,o){return fo(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}async function bd(t,a,o){return fo(t,a.id,o,{concluida:!a.concluida})}async function vd(t,a,o){return fo(t,a,o,{excluido:!1,excluido_em:null})}async function jd(t,a,o){return td(t,"df_notas",a,o)}function Oi(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&yd(t))}function yd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Vi(t){const{filial_id:a,...o}=t||{};return o}function bi(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}:${a.titulo||""}`).join("|")}function wd(t,a=[]){t((o=[])=>bi(o)===bi(a)?o:a)}function kd(){const[t,a]=c.useState([]),[o,i]=c.useState([]),[n,l]=c.useState(""),[d,m]=c.useState(!1),[f,b]=c.useState(null),[S,k]=c.useState(""),[N,g]=c.useState(""),[M,z]=c.useState("normal"),[E,K]=c.useState(""),[ne,G]=c.useState("");function q(){b(null),k(""),g(""),z("normal"),K(""),G("")}async function se({supabase:ie,empresaAtual:y,avisarErro:me}){if(!y)return;const{data:I,error:te}=await fd(ie,y);if(te){me(te);return}a(I||[])}async function W({supabase:ie,empresaAtual:y,avisarErro:me}){if(!y)return;const{data:I,error:te}=await xd(ie,y);if(te){me(te);return}wd(i,I||[])}function re({setMenuAberto:ie,setMenuNavegacaoAberto:y}){ie(!1),y(!1),q(),m(!0)}function D(ie){b(ie.id),k(ie.titulo||""),g(ie.conteudo||""),z(ie.prioridade||"normal"),K(ie.data_evento||""),G(ie.filial_id||""),m(!0)}function $(){m(!1),q()}async function X({supabase:ie,empresaId:y,mostrarAviso:me,avisarErro:I,buscarNotas:te}){if(!y){me("Usuário sem empresa vinculada.","erro");return}if(!S.trim()){me("Digite o título da nota.","erro");return}const Y={titulo:kt(S.trim()),conteudo:N.trim(),prioridade:M||"normal",data_evento:E||null,concluida:!1,empresa_id:y,filial_id:ne||null};let J;if(f?J=(await fo(ie,f,y,Y)).error:J=(await hd(ie,Y)).error,J){I(J);return}$(),await te(),me(f?"Nota atualizada com sucesso.":"Nota criada com sucesso.","sucesso")}async function je({supabase:ie,id:y,empresaId:me,avisarErro:I,buscarNotas:te,buscarLixeira:Y,mostrarAviso:J}){const{error:C}=await gd(ie,y,me);if(C){I(C);return}await Promise.all([te(),Y()]),J==null||J("Nota enviada para a lixeira.","sucesso")}async function pe({supabase:ie,nota:y,empresaId:me,avisarErro:I,buscarNotas:te,mostrarAviso:Y}){const{error:J}=await bd(ie,y,me);if(J){I(J);return}await te(),Y==null||Y(y.concluida?"Nota reaberta.":"Nota concluída.","sucesso")}async function ge({supabase:ie,id:y,empresaId:me,avisarErro:I,buscarNotas:te,buscarLixeira:Y,mostrarAviso:J}){const{error:C}=await vd(ie,y,me);if(C){I(C);return}await Promise.all([te(),Y()]),J==null||J("Nota restaurada com sucesso.","sucesso")}async function Ce({supabase:ie,nota:y,empresaId:me,avisarErro:I,buscarLixeira:te,mostrarAviso:Y}){const{error:J}=await jd(ie,y.id,me);if(J){I(J);return}await te(),Y==null||Y("Nota excluída definitivamente.","sucesso")}return{notas:t,setNotas:a,notasLixeira:o,setNotasLixeira:i,buscaNota:n,setBuscaNota:l,modalNota:d,setModalNota:m,editandoNotaId:f,setEditandoNotaId:b,tituloNota:S,setTituloNota:k,conteudoNota:N,setConteudoNota:g,prioridadeNota:M,setPrioridadeNota:z,dataEventoNota:E,setDataEventoNota:K,filialNotaId:ne,setFilialNotaId:G,buscarNotas:se,buscarNotasLixeira:W,abrirNovaNota:re,abrirEdicaoNota:D,fecharNota:$,salvarNota:X,excluirNota:je,alternarNotaConcluida:pe,restaurarNota:ge,excluirNotaDefinitivo:Ce}}const mo={MASTER:"master",ADMIN:"admin",GERENTE:"gerente",OPERADOR:"operador"},Cd=new Set(["donafloradm@outlook.com"]);function Go(t){return String(t||"").trim().toLowerCase()}function Nd(t){const a=String(t).toLowerCase().trim();return["master","super_admin","superadmin","owner","dono"].includes(a)?mo.MASTER:["admin","adm","administrador"].includes(a)?mo.ADMIN:Zt(a)}function Sd(t){return!(!t||t.ativo===!1||t.status&&String(t.status).toLowerCase()!=="ativo")}function Ma({perfilEmpresa:t="operador",master:a=null}={}){const o=Zt(t),i=a!=null&&a.isMaster?mo.MASTER:o;return{perfilEmpresa:o,perfilGlobal:i,isMaster:!!(a!=null&&a.isMaster),canManageUsers:!!(a!=null&&a.isMaster||o==="admin"),canAccessSettings:!!(a!=null&&a.isMaster||["admin","gerente"].includes(o)),canManageCompanies:!!(a!=null&&a.isMaster),canSwitchCompany:!!(a!=null&&a.isMaster)}}async function Lo({userId:t,email:a,perfilEmpresa:o="operador"}={}){const i=Go(a),n=Ma({perfilEmpresa:o});if(Cd.has(i))return Ma({perfilEmpresa:o,master:{isMaster:!0}});if(!t&&!i)return n;try{const{data:l,error:d}=await T.from("df_usuarios_master").select("*").limit(100);if(d)return console.warn("Não foi possível consultar df_usuarios_master:",d.message),n;const m=(l||[]).find(f=>{const b=t&&f.user_id&&f.user_id===t,S=i&&Go(f.email)===i;return(b||S)&&Sd(f)});return m?Ma({perfilEmpresa:o,master:{isMaster:!0,perfil:Nd(m.perfil||m.tipo||mo.MASTER)}}):n}catch(l){return console.warn("Falha ao carregar permissões globais:",l.message),n}}async function _d({isMaster:t}={}){if(!t)return[];const{data:a,error:o}=await T.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(o)throw o;return a||[]}async function vi({userId:t,email:a,isMaster:o}={}){if(o)return _d({isMaster:o});const i=Go(a);if(!t&&!i)return[];let n=T.from("df_usuarios_empresas").select("empresa_id, perfil, nome, email, user_id");t&&i?n=n.or(`user_id.eq.${t},email.eq.${i}`):t?n=n.eq("user_id",t):n=n.eq("email",i);const{data:l,error:d}=await n;if(d)throw d;const m=new Map;(l||[]).forEach(k=>{if(!(k!=null&&k.empresa_id))return;const N=Zt(k.perfil),g=m.get(k.empresa_id);m.set(k.empresa_id,{id:k.empresa_id,nome:(g==null?void 0:g.nome)||"",perfil:(g==null?void 0:g.perfil)==="admin"?g.perfil:N})});const f=Array.from(m.keys());if(f.length===0)return[];const{data:b,error:S}=await T.from("df_empresas").select("id, nome, created_at").in("id",f).order("nome",{ascending:!0});if(S)throw S;return(b||[]).forEach(k=>{const N=m.get(k.id);N&&m.set(k.id,{...N,nome:k.nome||N.nome||"Empresa",created_at:k.created_at})}),Array.from(m.values()).sort((k,N)=>String(k.nome||"").localeCompare(String(N.nome||"")))}const x={usuarioTopo:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",border:"1px solid #d8eee9",borderRadius:18,padding:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 10px 24px rgba(15,118,110,0.10)",position:"relative",zIndex:20},logoMarca:{display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",padding:0,textAlign:"left",color:"#064e3b"},logoIcone:{width:42,height:42,borderRadius:14,background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 0 0 1px #cfe8da"},logoImagem:{width:48,height:48,borderRadius:16,objectFit:"cover",background:"#0f766e",boxShadow:"0 8px 18px rgba(20,184,166,0.28)"},logoTexto:{display:"flex",flexDirection:"column",gap:2,lineHeight:1.05},usuarioAcoes:{display:"flex",alignItems:"center",gap:8},usuarioTexto:{display:"flex",flexDirection:"column",alignItems:"flex-end",fontSize:13,color:"#1f2937"},btnMenuTopo:{width:44,height:44,borderRadius:14,border:"1px solid #e5e7eb",background:"#ffffff",color:"#0f172a",fontSize:22,fontWeight:"bold",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 16px rgba(15,23,42,0.08)"},menuBackdrop:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.22)",zIndex:4e3,display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:"76px 12px 12px 12px"},menuNavegacao:{width:"min(360px, 94vw)",height:"auto",maxHeight:"calc(100dvh - 96px)",overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",background:"#ffffff",border:"1px solid #d8eee9",borderRadius:22,padding:14,display:"grid",gap:8,boxShadow:"0 24px 60px rgba(15,23,42,0.25)"},menuPerfil:{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:18,background:"linear-gradient(135deg, #ecfdf5, #f0fdfa)",color:"#064e3b",marginBottom:4},menuPerfilIcone:{width:46,height:46,borderRadius:16,objectFit:"cover",background:"#0f766e"},menuSecaoTitulo:{fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:800,color:"#6b7280",padding:"10px 8px 2px"},menuNavItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#f8faf9",border:"1px solid #edf1ef",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#064e3b"},menuSairItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#be123c",fontWeight:700},agendaResumoCard:{background:"#ffffff",border:"1px solid #dfe7e2",borderLeft:"5px solid #14b8a6",padding:14,borderRadius:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"grid",gap:10},agendaResumoGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,color:"#374151"},btnAgendaCompleta:{border:"none",borderRadius:10,background:"#14b8a6",color:"#fff",padding:"10px 12px",fontWeight:"bold"},uploadExcelBox:{border:"2px dashed #99f6e4",background:"#f0fdfa",borderRadius:16,padding:24,textAlign:"center",display:"grid",gap:6,color:"#0f766e",cursor:"pointer"},importDicasGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"},previewImportacao:{display:"grid",gap:8,marginBottom:12},previewLinha:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:10,display:"grid",gap:4},alertaSucesso:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:10,fontWeight:"bold"},btnSair:{background:"#fee2e2",color:"#ef4444",border:"none",padding:"8px 12px",borderRadius:8,fontWeight:"bold"},overlayConfirmacao:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:3e3},modalConfirmacao:{background:"#fff",borderRadius:18,padding:18,width:"100%",maxWidth:360,boxShadow:"0 12px 30px rgba(0,0,0,0.25)",textAlign:"center"},confirmacaoIcone:{fontSize:38,marginBottom:8},confirmacaoTitulo:{margin:"4px 0 8px",fontSize:20},confirmacaoTexto:{margin:"0 0 16px",color:"#444",lineHeight:1.4},confirmacaoAcoes:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},btnConfirmarCancelar:{border:"none",borderRadius:10,padding:11,background:"#6c757d",color:"#fff",fontWeight:"bold"},btnConfirmarAcao:{border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:"bold"},headerExpansivel:{width:"100%",background:"#fff",border:"1px solid #e5e5e5",borderRadius:14,padding:"12px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:20,fontWeight:"bold",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},page:{padding:16,maxWidth:700,margin:"auto",fontFamily:"Arial",background:"#f8fafc",minHeight:"100vh",paddingBottom:100},titulo:{fontSize:28,marginBottom:12},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:24},resumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},boxTotal:{background:"#fff",padding:12,borderRadius:14,display:"flex",flexDirection:"column",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},boxPago:{background:"#d4edda",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxPendente:{background:"#fff3cd",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxVencido:{background:"#f8d7da",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},filtrosBox:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:8,boxSizing:"border-box"},datas:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},filtros:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},filtro:{border:"1px solid #ccc",background:"#fff",padding:"7px 11px",borderRadius:10,fontWeight:800,cursor:"pointer"},filtroAtivo:{border:"none",background:"#0d6efd",color:"#fff",padding:"7px 11px",borderRadius:8},resumoFiltro:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:4,fontSize:14},cardConta:{padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},cardTopo:{display:"flex",justifyContent:"space-between",fontSize:18,marginBottom:4},cardInfo:{fontSize:13,opacity:.75},cardDashboard:{background:"#fff",padding:12,borderRadius:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},dashboardGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6,fontSize:13},cardConfiguracao:{background:"#fff",padding:14,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},switchLinha:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #eee"},configResumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,background:"#f8fafc",padding:10,borderRadius:10},cardAgenda:{background:"#fff",padding:12,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},itemAgenda:{background:"#f8fafc",padding:10,borderRadius:10,marginTop:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"},agendaDireita:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},textoAgenda:{display:"block",marginTop:5,color:"#444",fontWeight:"bold"},textoVencidoAgenda:{display:"block",marginTop:5,color:"#dc3545",fontWeight:"bold"},cardLixeira:{background:"#fff",padding:12,borderRadius:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},textoQuarentena:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},textoLiberado:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},cardNota:{background:"#eef2ff",padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},textoNota:{fontSize:14,whiteSpace:"pre-wrap"},acoes:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8},mensagemVazia:{fontSize:13,opacity:.7},btnPago:{minHeight:38,minWidth:74,background:"#0f766e",color:"#fff",border:"1px solid #0f766e",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnVoltar:{minHeight:38,minWidth:74,background:"#f8fafc",color:"#475569",border:"1px solid #cbd5e1",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnEditar:{minHeight:38,minWidth:74,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnExcluir:{minHeight:38,minWidth:74,background:"#fff1f2",color:"#e11d48",border:"1px solid #fecdd3",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnSecundario:{background:"#f8fafc",color:"#0f766e",border:"1px solid #99f6e4",padding:"6px 10px",borderRadius:8,fontWeight:800,cursor:"pointer"},btnCinza:{background:"#64748b",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnRoxo:{background:"#6f42c1",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnVerde:{background:"#14b8a6",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},fab:{position:"fixed",right:22,bottom:22,width:54,height:54,borderRadius:18,background:"linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.22)",fontSize:28,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(15, 118, 110, 0.28)",zIndex:3e3,cursor:"pointer"},menuFab:{position:"fixed",right:20,bottom:86,display:"flex",flexDirection:"column",gap:8,zIndex:3001},menuItem:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"0 14px",minWidth:190,width:190,height:48,fontSize:14,fontWeight:800,boxShadow:"0 10px 24px rgba(15,23,42,0.14)",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,color:"#0f172a",whiteSpace:"nowrap",overflow:"visible",cursor:"pointer"},menuItemIcone:{display:"inline-flex",width:26,minWidth:26,justifyContent:"center",fontSize:18,lineHeight:1},menuItemTexto:{display:"inline-block",color:"#0f172a",fontSize:14,fontWeight:800,lineHeight:1},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",justifyContent:"center",alignItems:"center",padding:16,zIndex:999},blocoNotificacaoConta:{background:"#f8fafc",border:"1px solid #e5e5e5",borderRadius:12,padding:10,marginBottom:10},blocoRecorrenciaConta:{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:12,padding:10,marginBottom:10},switchLinhaCompacta:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #e5e5e5",fontSize:14},textoAjuda:{display:"block",color:"#666",fontSize:11,marginTop:4},notificacaoChips:{display:"flex",gap:6,flexWrap:"wrap",marginTop:6},chipNotif:{background:"#eef6ff",color:"#0d6efd",border:"1px solid #b6d4fe",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:"bold"},modal:{background:"#fff",padding:18,borderRadius:14,width:"100%",maxWidth:360},inputModal:{width:"100%",padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box"},textareaModal:{width:"100%",minHeight:110,padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box",fontFamily:"Arial"},btnGhostAction:{width:"auto",background:"#fff",color:"#374151",border:"1px solid #d1d5db",padding:"7px 12px",borderRadius:999,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:0},btnSalvar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#14b8a6",color:"#fff",marginBottom:8},btnCancelar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#6c757d",color:"#fff"},itemCentro:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f1f1f1",padding:8,borderRadius:8,marginBottom:6,fontSize:13},btnMiniExcluir:{background:"#fee2e2",color:"#ef4444",border:"1px solid #f87171",borderRadius:999,padding:"8px 10px",fontSize:11},notasHeaderNovo:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10},btnMiniVerde:{background:"#0f766e",color:"#fff",border:"none",borderRadius:12,padding:"6px 11px",fontWeight:"900",fontSize:18,lineHeight:1},notasListaNova:{display:"grid",gap:10},cardNotaAcao:{padding:12,borderRadius:16,marginBottom:10,border:"1px solid #e5e7eb",boxShadow:"0 8px 20px rgba(15,23,42,0.06)"},cardNotaNormal:{background:"#f8fafc",borderColor:"#e5e7eb"},cardNotaUrgente:{background:"#fffbeb",borderColor:"#fde68a"},cardNotaCritico:{background:"#fff7f7",borderColor:"#fecaca"},badgePrioridade:{borderRadius:999,padding:"4px 8px",fontSize:12,fontWeight:"900"},badgeNormal:{background:"#f1f5f9",color:"#475569"},badgeUrgente:{background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a"},badgeCritico:{background:"#fff7f7",color:"#991b1b",border:"1px solid #fecaca"}},Ed=[{id:"principal",titulo:"Principal",items:[{tela:"dashboard",icon:"🏠",label:"Dashboard",desc:"Resumo financeiro"},{tela:"agenda",icon:"📅",label:"Agenda",desc:"Vencimentos e previsões"},{tela:"notas",icon:"📝",label:"Bloco de Notas",desc:"Pendências e histórico de notas"}]},{id:"financeiro",titulo:"Financeiro",items:[{tela:"contas",icon:"💳",label:"Contas",desc:"Contas a pagar e filtros"}]},{id:"analise",titulo:"Análise",items:[{tela:"relatorios",icon:"📊",label:"Relatórios",desc:"Análises e indicadores"}]},{id:"master",titulo:"Master",items:[{tela:"master-empresas",icon:"🏢",label:"Painel Master",desc:"Empresas e tenants SaaS",masterOnly:!0}]},{id:"sistema",titulo:"Sistema",items:[{tela:"usuarios",icon:"👥",label:"Usuários",desc:"Perfis, acessos e senhas"},{tela:"configuracoes",icon:"⚙️",label:"Configurações",desc:"Preferências da empresa"},{tela:"filiais",icon:"🏬",label:"Filiais",desc:"Unidades da empresa"},{tela:"billing",icon:"💼",label:"Billing",desc:"Planos, limites e assinatura"},{tela:"onboarding",icon:"🚀",label:"Onboarding",desc:"Implantação inicial SaaS"},{tela:"importar",icon:"📥",label:"Importar CSV",desc:"Trazer histórico do Excel"},{tela:"lixeira",icon:"🗑️",label:"Lixeira",desc:"Restaurar ou excluir definitivo"}]}],Ko="df_sessao_segura",zd=8*60*60*1e3,Pd=30*60*1e3,Rd=25*60*1e3;function Uo(){try{return JSON.parse(localStorage.getItem(Ko)||"{}")}catch{return{}}}function ji(t){localStorage.setItem(Ko,JSON.stringify(t))}function Fd(){localStorage.removeItem(Ko)}function $d(){const t=c.useRef(!1),a=c.useRef(!1),o=c.useRef(null),{globalLoading:i,toast:n,showToast:l,hideToast:d,empresaAtiva:m,setEmpresaAtiva:f,limparEmpresaAtiva:b,empresasDisponiveis:S,setEmpresasDisponiveis:k}=Ii();function N(r){const p=String((r==null?void 0:r.message)||r||"").toLowerCase();return p.includes("jwt")||p.includes("expired")||p.includes("unauthorized")||p.includes("session")}function g(r,p){if(!r||p==="pago")return!1;const h=new Date;h.setHours(0,0,0,0);const j=new Date(r+"T00:00:00");return j.setHours(0,0,0,0),j<h}function M(r){return r?String(r).slice(0,7):""}function z(r){if(!r)return 0;const p=new Date(r),j=new Date-p;return Math.max(0,Math.floor(j/(1e3*60*60*24)))}function E(r){return!0}function K(r=[]){return r.map(p=>`${p.id||""}:${p.excluido_em||""}:${p.updated_at||""}`).join("|")}function ne(r,p=[]){r((h=[])=>K(h)===K(p)?h:p)}const{contas:G,setContas:q,contasLixeira:se,setContasLixeira:W,busca:re,setBusca:D,filtroStatus:$,setFiltroStatus:X,filtroCentro:je,setFiltroCentro:pe,filtroFilial:ge,setFiltroFilial:Ce,filtroMes:ie,setFiltroMes:y,dataInicial:me,setDataInicial:I,dataFinal:te,setDataFinal:Y,loading:J,setLoading:C,modalConta:Z,setModalConta:Te,editandoContaId:Ee,descricao:we,setDescricao:O,valor:fe,setValor:Be,dataVencimento:A,setDataVencimento:V,centroCustoId:_e,setCentroCustoId:he,filialId:F,setFilialId:ee,observacaoConta:He,setObservacaoConta:Pe,contaRecorrente:qe,setContaRecorrente:It,tipoRecorrencia:Qe,setTipoRecorrencia:lt,diaVencimentoRecorrencia:Le,setDiaVencimentoRecorrencia:pt,buscarContas:_t,abrirNovaConta:Je,abrirEdicaoConta:Vt,fecharConta:gt,salvarConta:ea,marcarComoPago:Se,voltarParaPendente:Q,excluirConta:L}=ud(),{notas:B,setNotas:ue,notasLixeira:Re,setNotasLixeira:Ke,buscaNota:Ye,setBuscaNota:Ue,modalNota:Xe,setModalNota:We,editandoNotaId:rt,tituloNota:bt,setTituloNota:Rt,conteudoNota:Gt,setConteudoNota:At,prioridadeNota:Ze,setPrioridadeNota:mt,dataEventoNota:Bt,setDataEventoNota:qt,filialNotaId:ut,setFilialNotaId:vt,buscarNotas:jt,buscarNotasLixeira:s,abrirNovaNota:v,abrirEdicaoNota:U,fecharNota:le,salvarNota:ye,excluirNota:ve,alternarNotaConcluida:be,restaurarNota:Fe,excluirNotaDefinitivo:de}=kd(),[De,at]=c.useState([]),[xe,dt]=c.useState([]),[Ct,ft]=c.useState(!1),[xt,et]=c.useState(""),[Ft,Ie]=c.useState(!1),[tt,Et]=c.useState(!1),[Gi,Wi]=c.useState(!1),[Hi,Ki]=c.useState({principal:!0,financeiro:!0,analise:!0,sistema:!0}),[it,ca]=c.useState("dashboard"),[P,zt]=c.useState(null),[Yi,wa]=c.useState(!0),[H,ka]=c.useState(null),[Ca,Yo]=c.useState(!1),[Aa,Na]=c.useState(""),[Ne,Ba]=c.useState(()=>Ma()),[xo,pa]=c.useState(""),[Xi,ho]=c.useState(!1),[Xo,Qo]=c.useState(""),[Qi,Jo]=c.useState(!1),[Zo,qa]=c.useState(""),[La,go]=c.useState([]),[Ji,er]=c.useState(!1),[Zi,bo]=c.useState(!1),[en,vo]=c.useState(""),[tr,ar]=c.useState(!1),[or,Ua]=c.useState({}),[tn,rr]=c.useState(""),[ir,nr]=c.useState(""),[sr,lr]=c.useState(""),[dr,cr]=c.useState("operador"),[pr,mr]=c.useState(""),[ur,fr]=c.useState(""),[Sa,xr]=c.useState(""),[hr,gr]=c.useState(""),[an,on]=c.useState(!1),[rn,nn]=c.useState(!0),[sn,ln]=c.useState(!0),[dn,cn]=c.useState(()=>typeof window>"u"?!0:window.innerWidth>=980),[jo,pn]=c.useState(!0),[yo,mn]=c.useState(!0),[Oa,un]=c.useState(!0),[wo,fn]=c.useState(!0),[Va,Ga]=c.useState(null),[ko,Co]=c.useState(!0),[ta,br]=c.useState(!0),[aa,vr]=c.useState(!0),[oa,jr]=c.useState(!1),[ma,No]=c.useState("1"),[Wa,So]=c.useState("1"),[yr,_o]=c.useState(!0),[wr,Eo]=c.useState(!0),[kr,zo]=c.useState("3"),[Cr,Po]=c.useState(!0),[ra,Ro]=c.useState(""),[Nr,Fo]=c.useState(""),[Sr,$o]=c.useState(""),[yt,_r]=c.useState({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null}),[Er,Mo]=c.useState(null),[Wt,Ha]=c.useState([]),[zr,_a]=c.useState("");function ae(r,p="info"){l(r,p)}function ze(r,p="Não foi possível concluir a operação."){const h=(r==null?void 0:r.message)||r||p;if(N(r)){if(a.current)return;a.current=!0,T.auth.signOut().finally(()=>{Ht(),zt(null),ca("dashboard"),wa(!1),ae("Sua sessão expirou. Faça login novamente.","erro"),window.setTimeout(()=>{a.current=!1},1200)});return}ae(String(h),"erro")}function Pr(){q([]),ue([]),at([]),dt([]),W([]),Ke([]),go([]),vo(""),bo(!1),Ga(null),Te(!1),We(!1),ft(!1),Ie(!1),Et(!1),D(""),Ue(""),X("todas"),pe(""),Ce(""),y(""),I(""),Y(""),Mo(null),Ha([]),_a("")}function Ht(){Pr(),k([]),ka(null),b(),Na(""),Ua({}),pa(""),qa(""),C(!1),Fd()}async function xn(){var r,p;if(P!=null&&P.id)try{const j=await xi(P.id)||((r=P==null?void 0:P.user_metadata)==null?void 0:r.name)||((p=P==null?void 0:P.user_metadata)==null?void 0:p.full_name)||"";j&&j!==xo&&pa(j)}catch(h){console.warn("Falha ao sincronizar nome do perfil:",(h==null?void 0:h.message)||h)}}c.useEffect(()=>{let r=!0;async function p(){try{const j=new Promise(R=>{window.setTimeout(()=>R({data:{session:null},error:new Error("Timeout ao validar sessão")}),8e3)}),{data:w,error:_}=await Promise.race([T.auth.getSession(),j]);if(!r)return;if(_||!(w!=null&&w.session)){Ht(),zt(null);return}zt(w.session.user)}catch(j){if(!r)return;console.warn("Falha ao validar sessão:",(j==null?void 0:j.message)||j),Ht(),zt(null)}finally{r&&wa(!1)}}p();const{data:h}=T.auth.onAuthStateChange((j,w)=>{wa(!1),zt((w==null?void 0:w.user)||null),w||Ht()});return()=>{r=!1,h.subscription.unsubscribe()}},[]),c.useEffect(()=>{if(!P)return;const r=Date.now(),p=Uo();ji({inicio:p.inicio||r,ultimaAtividade:r});function h(){const ce=Uo();ji({inicio:ce.inicio||Date.now(),ultimaAtividade:Date.now()}),t.current=!1}async function j(ce){a.current||(a.current=!0,Ht(),zt(null),ca("dashboard"),wa(!1),await T.auth.signOut(),ae(ce,"erro"),window.setTimeout(()=>{a.current=!1},1200))}function w(){const ce=Uo(),Ve=Number(ce.inicio||Date.now()),ct=Number(ce.ultimaAtividade||Date.now()),ke=Date.now(),Oe=ke-Ve,Lt=ke-ct;if(Oe>=zd){j("Sua sessão expirou por segurança. Faça login novamente.");return}if(Lt>=Pd){j("Sua sessão foi encerrada por inatividade. Faça login novamente.");return}Lt>=Rd&&!t.current&&(t.current=!0,wt({titulo:"Sessão quase expirada",mensagem:"Sua sessão vai expirar por segurança. Deseja continuar conectado?",textoConfirmar:"Continuar conectado",tipo:"padrao",acao:async()=>h()}))}const _=["click","keydown","mousemove","scroll","touchstart"];_.forEach(ce=>window.addEventListener(ce,h,{passive:!0}));const R=window.setInterval(w,60*1e3);return()=>{_.forEach(ce=>window.removeEventListener(ce,h)),window.clearInterval(R)}},[P]),c.useEffect(()=>{if(!P){C(!1);return}hn(P.id)},[P]),c.useEffect(()=>{if(!(P!=null&&P.id)||!H)return;let r=!1;async function p(){if(!r)try{await Promise.allSettled([Kt(H),Xa(H),Tr(H),Yt(H)])}catch(_){console.warn("Falha ao sincronizar dados do tenant:",(_==null?void 0:_.message)||_)}}function h(){window.clearTimeout(o.current),o.current=window.setTimeout(p,350)}function j(){document.visibilityState==="visible"&&h()}window.addEventListener("focus",h),document.addEventListener("visibilitychange",j);const w=T.channel(`tenant-sync-${H}`).on("postgres_changes",{event:"*",schema:"public",table:"df_centros_custo",filter:`empresa_id=eq.${H}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_filiais",filter:`empresa_id=eq.${H}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_contas",filter:`empresa_id=eq.${H}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_contas_recorrentes",filter:`empresa_id=eq.${H}`},h).subscribe();return()=>{r=!0,window.clearTimeout(o.current),window.removeEventListener("focus",h),document.removeEventListener("visibilitychange",j),T.removeChannel(w)}},[P==null?void 0:P.id,H]),c.useEffect(()=>{!tt||!(P!=null&&P.id)||xn()},[tt,P==null?void 0:P.id]),c.useEffect(()=>{window.history.replaceState({tela:it},"",window.location.href);function r(p){var j;const h=((j=p.state)==null?void 0:j.tela)||"dashboard";Ie(!1),Et(!1),ca(h)}return window.addEventListener("popstate",r),()=>window.removeEventListener("popstate",r)},[]),c.useEffect(()=>{it==="usuarios"&&H&&ua(H)},[it,H]),c.useEffect(()=>{function r(p){if(p.key==="Escape"){if(yt.aberto){eo();return}Z&&Pa(),Xe&&Za(),Ct&&ft(!1),Ft&&Ie(!1),tt&&Et(!1)}}return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[yt.aberto,Z,Xe,Ct,Ft,tt]),c.useEffect(()=>{const r=document.body.style.overflow,p=document.documentElement.style.overflow,h=document.body.style.position,j=document.body.style.width,w=window.scrollY;return tt&&(document.body.classList.add("mobile-nav-open"),document.documentElement.classList.add("mobile-nav-open"),document.body.style.overflow="hidden",document.documentElement.style.overflow="hidden",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.top=`-${w}px`),()=>{document.body.classList.remove("mobile-nav-open"),document.documentElement.classList.remove("mobile-nav-open"),document.body.style.overflow=r,document.documentElement.style.overflow=p,document.body.style.position=h,document.body.style.width=j,document.body.style.top="",tt&&window.scrollTo(0,w)}},[tt]);async function hn(r){var p,h,j,w;C(!0),qa("");try{await Ql();const _=await Jl(r),R=await xi(r),ce=await Lo({userId:r,email:P==null?void 0:P.email,perfilEmpresa:(_==null?void 0:_.perfil)||"operador"}),Ve=await vi({userId:r,email:P==null?void 0:P.email,isMaster:ce.isMaster});if(!(_!=null&&_.empresaId)&&!ce.isMaster){ka(null),b(),Na(""),Ba(Ma()),pa(""),qa(Yl.semEmpresa);return}if(ce.isMaster&&Ve.length===0){ka(null),b(),Na("master"),Ba({...ce,canSwitchCompany:!0,canManageCompanies:!0}),pa(R||((p=P==null?void 0:P.user_metadata)==null?void 0:p.name)||((h=P==null?void 0:P.user_metadata)==null?void 0:h.full_name)||""),qa("Nenhuma empresa cadastrada em df_empresas para o usuário master.");return}const ke=Ve.find(na=>na.id===(m==null?void 0:m.id))||Ve.find(na=>na.id===(_==null?void 0:_.empresaId))||Ve[0]||{id:_==null?void 0:_.empresaId,nome:(_==null?void 0:_.nomeEmpresa)||"Dona Flor",perfil:(_==null?void 0:_.perfil)||"operador"},Oe=ke.perfil||(_==null?void 0:_.perfil)||(ce.isMaster?"master":"operador"),Lt=ce.isMaster?{...ce,perfilEmpresa:Nt(Oe),canSwitchCompany:!0,canManageCompanies:!0}:await Lo({userId:r,email:P==null?void 0:P.email,perfilEmpresa:Oe});k(Ve.length>0?Ve:[ke]),ka(ke.id),f({id:ke.id,nome:ke.nome||(_==null?void 0:_.nomeEmpresa)||"Dona Flor",perfil:Oe}),Na(Oe),Ba(Lt),pa(R||((j=P==null?void 0:P.user_metadata)==null?void 0:j.name)||((w=P==null?void 0:P.user_metadata)==null?void 0:w.full_name)||""),await Ka(ke.id)}catch(_){N(_)?(await T.auth.signOut(),Ht(),zt(null),ae("Sua sessão expirou. Faça login novamente.","erro")):ae(_.message,"erro")}finally{C(!1)}}async function Ka(r=H){r&&await Promise.all([Kt(r),za(r),Xa(r),Tr(r),Yt(r),Sn(r)])}function Nt(r){return Zt(r)}function Rr(r=[]){if(Ne!=null&&Ne.isMaster)return!0;const p=Nt(Aa);return r.includes(p)}function ia(){return!!(Ne!=null&&Ne.canManageUsers||Rr(["admin"]))}function Ea(){return!!(Ne!=null&&Ne.canAccessSettings||Rr(["admin","gerente"]))}function Fr(){return Ed.map(r=>({...r,items:r.items.filter(p=>!p.masterOnly||(Ne==null?void 0:Ne.canManageCompanies))})).filter(r=>r.items.length>0)}async function gn(){if(P)try{const r=await vi({userId:P.id,email:P.email,isMaster:Ne==null?void 0:Ne.isMaster});k(r)}catch(r){console.warn("Não foi possível atualizar a lista de empresas:",r.message)}}async function Ya(r){if(!r||Ca)return;const p=S.find(h=>h.id===r);if(!p){ae("Empresa selecionada não encontrada para este usuário.","erro");return}if(p.id!==H){Yo(!0),C(!0);try{const h=p.perfil||(Ne!=null&&Ne.isMaster?"master":"operador"),j=Ne!=null&&Ne.isMaster?{...Ne,perfilEmpresa:Nt(h),canSwitchCompany:!0,canManageCompanies:!0,canManageUsers:!0,canAccessSettings:!0}:await Lo({userId:P==null?void 0:P.id,email:P==null?void 0:P.email,perfilEmpresa:h});Pr(),ka(p.id),f({id:p.id,nome:p.nome||"Empresa",perfil:h}),Na(h),Ba(j),ca("dashboard"),await Ka(p.id),ae(`Empresa ativa: ${p.nome||"Empresa"}`,"sucesso")}catch(h){ze(h,"Não foi possível trocar a empresa ativa.")}finally{Yo(!1),C(!1)}}}async function ua(r=H,p={}){if(!r)return;const h=!!(p!=null&&p.silencioso);h||er(!0),vo("");try{const[j,w]=await Promise.all([cs(r),hs(r)]),_={};(w||[]).forEach(R=>{!(R!=null&&R.usuario_id)||!(R!=null&&R.filial_id)||(_[R.usuario_id]||(_[R.usuario_id]=[]),_[R.usuario_id].push(R.filial_id))}),go(j),Ua(_),bo(!0)}catch(j){console.warn("Não foi possível carregar usuários:",j.message),go([]),Ua({}),bo(!0),vo((j==null?void 0:j.message)||"Não foi possível carregar os usuários da empresa.")}finally{h||er(!1)}}async function bn(){if(tr)return;if(!H){ae("Empresa não identificada.","erro");return}if(!ia()){ae("Apenas administradores podem adicionar usuários.","erro");return}const r=ir.trim().toLowerCase();if(!r||!r.includes("@")){ae("Informe um e-mail válido.","erro");return}const p=pr.trim();if(p.length<6){ae("Informe uma senha provisória com pelo menos 6 caracteres.","erro");return}const h=Nt(dr);try{ar(!0),await ps({empresaId:H,email:r,nome:sr,perfil:h,senhaProvisoria:p,criarAuthManual:!0}),await ua(H,{silencioso:!0})}catch(j){ze(j);return}finally{ar(!1)}nr(""),lr(""),mr(""),cr("operador"),ae("Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.","sucesso")}async function vn(r){if(!ia()){ae("Apenas administradores podem enviar acesso ou reset de senha.","erro");return}const p=r.nome||r.email||"este usuário";wt({titulo:"Enviar acesso",mensagem:`Deseja enviar um link de acesso/redefinição de senha para ${p}?`,textoConfirmar:"Enviar link",tipo:"padrao",acao:async()=>{try{const h=await fs({usuario:r});ae(h.mensagem,"info")}catch(h){ze(h)}}})}async function jn(r,p){if(!ia()){ae("Apenas administradores podem alterar perfis.","erro");return}const h=Nt(p);if(r.user_id&&(P==null?void 0:P.id)&&r.user_id===P.id&&h!=="admin"&&La.filter(ce=>Nt(ce.perfil)==="admin").length<=1){ae("Você não pode remover o último administrador da empresa.","erro");return}if(h===Nt(r.perfil))return;const w=r.nome||r.email||"este usuário",_=kt(h);wt({titulo:"Alterar perfil",mensagem:`Deseja alterar o perfil de ${w} para ${_}?`,textoConfirmar:"Confirmar alteração",tipo:h==="admin"?"perigo":"padrao",acao:async()=>{try{await ms({empresaId:H,usuario:r,perfil:h})}catch(R){ze(R);return}await ua(),ae("Perfil do usuário atualizado.","sucesso")}})}async function $r(r,p){if(!ia()){ae("Apenas administradores podem alterar filiais dos usuários.","erro");return}if(!(r!=null&&r.id)){ae("Este usuário precisa estar cadastrado na empresa para receber filiais.","erro");return}const h=r.id;rr(h);try{await gs({empresaId:H,usuario:r,filialIds:p}),Ua(j=>({...j,[r.id]:p})),ae("Filiais do usuário atualizadas.","sucesso")}catch(j){ze(j,"Não foi possível atualizar as filiais do usuário.")}finally{rr("")}}function yn(r,p){const h=or[r.id]||[],w=h.includes(p)?h.filter(_=>_!==p):[...h,p];$r(r,w)}function wn(r){$r(r,[])}async function kn(r){if(!ia()){ae("Apenas administradores podem remover usuários.","erro");return}if(r.user_id&&(P==null?void 0:P.id)&&r.user_id===P.id){ae("Você não pode remover o próprio acesso por aqui.","erro");return}if(Nt(r.perfil)==="admin"&&La.filter(j=>Nt(j.perfil)==="admin").length<=1){ae("Você não pode remover o último administrador da empresa.","erro");return}wt({titulo:"Remover usuário",mensagem:`Deseja remover ${r.nome||r.email||"este usuário"} desta empresa?`,textoConfirmar:"Remover",tipo:"perigo",acao:async()=>{try{await us({empresaId:H,usuario:r})}catch(h){ze(h);return}await ua()}})}async function Cn(){const r=ur.trim().toLowerCase();if(!r||!r.includes("@")){ae("Informe um e-mail válido.","erro");return}const{error:p}=await T.auth.updateUser({email:r},{emailRedirectTo:window.location.origin});if(p){ze(p);return}fr(""),ae("Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.","sucesso")}async function Nn(){if(!Sa||Sa.length<6){ae("A senha precisa ter pelo menos 6 caracteres.","erro");return}if(Sa!==hr){ae("As senhas não conferem.","erro");return}const{error:r}=await T.auth.updateUser({password:Sa});if(r){ze(r);return}xr(""),gr(""),ae("Senha atualizada com sucesso.","sucesso")}async function Kt(r=H){return _t({supabase:T,empresaAtual:r,avisarErro:ze,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAlertaContas:Wa,diasAvisoPadrao:ma})}async function za(r=H){return jt({supabase:T,empresaAtual:r,avisarErro:ze})}async function Mr(r=H){if(!r)return;const{data:p,error:h}=await T.from("df_configuracoes_alertas").select("*").eq("empresa_id",r).maybeSingle();if(h){console.warn("Não foi possível carregar alertas globais:",h.message);return}if(p){So(String(p.dias_alerta_contas??1)),_o(p.alertar_contas_vencidas??!0),Eo(p.destacar_contas_criticas??!0),zo(String(p.dias_alerta_notas??3)),Po(p.destacar_notas_urgentes??!0);return}const j={empresa_id:r,dias_alerta_contas:1,alertar_contas_vencidas:!0,destacar_contas_criticas:!0,dias_alerta_notas:3,destacar_notas_urgentes:!0},{data:w,error:_}=await T.from("df_configuracoes_alertas").insert([j]).select().maybeSingle();if(_){console.warn("Não foi possível criar alertas globais:",_.message);return}w&&(So(String(w.dias_alerta_contas??1)),_o(w.alertar_contas_vencidas??!0),Eo(w.destacar_contas_criticas??!0),zo(String(w.dias_alerta_notas??3)),Po(w.destacar_notas_urgentes??!0))}async function Sn(r=H){if(!r)return;const{data:p,error:h}=await T.from("df_configuracoes").select("*").eq("empresa_id",r).limit(1);if(h){ze(h);return}const j=Array.isArray(p)?p[0]:p;if(j){Ga(j),Co(j.notificacoes_ativas??!0),br(j.enviar_whatsapp??!0),vr(j.enviar_email??!0),jr(j.enviar_push??!1),No(String(j.dias_aviso_padrao??1)),Ro(j.nome_empresa||""),Fo(j.whatsapp_padrao||""),$o(j.email_padrao||""),await Mr(r);return}const{data:w,error:_}=await T.from("df_configuracoes").insert([{notificacoes_ativas:!0,enviar_whatsapp:!0,enviar_email:!0,enviar_push:!1,dias_aviso_padrao:1,nome_empresa:"DF Gestão Financeira",empresa_id:r}]).select();if(_){ze(_);return}const R=Array.isArray(w)?w[0]:w;Ga(R),Co((R==null?void 0:R.notificacoes_ativas)??!0),br((R==null?void 0:R.enviar_whatsapp)??!0),vr((R==null?void 0:R.enviar_email)??!0),jr((R==null?void 0:R.enviar_push)??!1),No(String((R==null?void 0:R.dias_aviso_padrao)??1)),Ro((R==null?void 0:R.nome_empresa)||""),Fo((R==null?void 0:R.whatsapp_padrao)||""),$o((R==null?void 0:R.email_padrao)||""),await Mr(r)}async function Yt(r=H){if(!r)return;const{data:p,error:h}=await T.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",r).eq("excluido",!0).order("excluido_em",{ascending:!1});h&&ze(h),ne(W,p||[]),await s({supabase:T,empresaAtual:r,avisarErro:ze})}async function Xa(r=H){if(!r)return;const{data:p,error:h}=await T.from("df_centros_custo").select("*").eq("empresa_id",r).order("nome");if(h){ze(h);return}at(p||[])}async function Tr(r=H){if(!r){dt([]);return}try{const p=await Ho(r);dt((p||[]).filter(h=>h.ativo!==!1))}catch(p){ze(p),dt([])}}const St=G.filter(r=>$==="pendentes"?r.status!=="pago":$==="pagas"?r.status==="pago":$==="vencidas"?g(r.data_vencimento,r.status):!0).filter(r=>!je||r.centro_custo_id===je).filter(r=>!ge||r.filial_id===ge).filter(r=>!ie||M(r.data_vencimento)===ie).filter(r=>!(me&&r.data_vencimento<me||te&&r.data_vencimento>te)).filter(r=>{var R,ce;const p=re.trim().toLowerCase();if(!p)return!0;const h=((R=r.df_centros_custo)==null?void 0:R.nome)||"",j=((ce=r.df_filiais)==null?void 0:ce.nome)||"",w=r.status==="pago"?"pago":g(r.data_vencimento,r.status)?"vencido":"pendente";return[r.descricao,r.observacao,r.categoria,r.forma_pagamento,h,j,w,Pt(r.data_vencimento),r.data_vencimento].filter(Boolean).some(Ve=>String(Ve).toLowerCase().includes(p))}),Dr=G.filter(r=>$==="pendentes"?r.status!=="pago":$==="pagas"?r.status==="pago":$==="vencidas"?g(r.data_vencimento,r.status):!0).filter(r=>!je||r.centro_custo_id===je).filter(r=>!ie||M(r.data_vencimento)===ie).filter(r=>!(me&&r.data_vencimento<me||te&&r.data_vencimento>te)).filter(r=>{var R,ce;const p=re.trim().toLowerCase();if(!p)return!0;const h=((R=r.df_centros_custo)==null?void 0:R.nome)||"",j=((ce=r.df_filiais)==null?void 0:ce.nome)||"",w=r.status==="pago"?"pago":g(r.data_vencimento,r.status)?"vencido":"pendente";return[r.descricao,r.observacao,r.categoria,r.forma_pagamento,h,j,w,Pt(r.data_vencimento),r.data_vencimento].filter(Boolean).some(Ve=>String(Ve).toLowerCase().includes(p))}),Qa=St.reduce((r,p)=>r+Number(p.valor||0),0),To=St.filter(r=>r.status==="pago").reduce((r,p)=>r+Number(p.valor||0),0),Ir=St.filter(r=>g(r.data_vencimento,r.status)).reduce((r,p)=>r+Number(p.valor||0),0),Ar=Qa-To,_n=St.filter(r=>r.status!=="pago").sort((r,p)=>String(p.created_at||p.data_vencimento||"").localeCompare(String(r.created_at||r.data_vencimento||"")));De.map(r=>{const p=St.filter(_=>_.centro_custo_id===r.id),h=p.reduce((_,R)=>_+Number(R.valor||0),0),j=p.filter(_=>_.status==="pago").reduce((_,R)=>_+Number(R.valor||0),0),w=p.filter(_=>g(_.data_vencimento,_.status)).reduce((_,R)=>_+Number(R.valor||0),0);return{id:r.id,nome:r.nome,total:h,pago:j,pendente:h-j,vencido:w}}).filter(r=>r.total>0||r.pago>0||r.pendente>0||r.vencido>0);const Br={critico:0,urgente:1,normal:2},qr=B.filter(r=>(!ge||r.filial_id===ge)&&`${r.titulo||""} ${r.conteudo||""}`.toLowerCase().includes(Ye.toLowerCase())).sort((r,p)=>{const h=r.concluida?1:0,j=p.concluida?1:0;if(h!==j)return h-j;const w=Br[r.prioridade||"normal"]??2,_=Br[p.prioridade||"normal"]??2;if(w!==_)return w-_;const R=r.data_evento||"9999-12-31",ce=p.data_evento||"9999-12-31";return String(R).localeCompare(String(ce))}),Ja=qr.filter(r=>!r.concluida),Lr=Ja.filter(r=>r.prioridade==="critico").length,Ur=Ja.filter(r=>r.prioridade==="urgente").length;function En(){return Je({setMenuAberto:Ie,setMenuNavegacaoAberto:Et,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAvisoPadrao:ma})}async function zn(r){return Vt({conta:r,supabase:T,empresaId:H,diasAvisoPadrao:ma,formatarDataParaBanco:ro})}function Pa(){return gt()}async function Pn(){return ea({supabase:T,empresaId:H,mostrarAviso:ae,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAlertaContas:Wa,diasAvisoPadrao:ma,primeiraLetraMaiuscula:kt,converterValor:Si,formatarDataParaBanco:ro,erroEhSessaoExpirada:N,limparEstadoAutenticacao:Ht,setUsuarioLogado:zt,buscarContas:Kt,fecharConta:Pa})}async function Do(r){return Se({supabase:T,id:r,empresaId:H,buscarContas:Kt,mostrarAviso:ae})}async function Rn(r){return Q({supabase:T,id:r,empresaId:H,buscarContas:Kt,mostrarAviso:ae})}async function Fn(r){return L({supabase:T,id:r,empresaId:H,avisarErro:ze,buscarContas:Kt,buscarLixeira:Yt,mostrarAviso:ae})}function $n(){return v({setMenuAberto:Ie,setMenuNavegacaoAberto:Et})}function Or(r){return U(r)}function Za(){return le()}async function Mn(){return ye({supabase:T,empresaId:H,mostrarAviso:ae,avisarErro:ze,buscarNotas:za})}async function Vr(r){return ve({supabase:T,id:r,empresaId:H,avisarErro:ze,buscarNotas:za,buscarLixeira:Yt,mostrarAviso:ae})}async function Gr(r){return be({supabase:T,nota:r,empresaId:H,avisarErro:ze,buscarNotas:za,mostrarAviso:ae})}async function Tn(){if(!H){ae("Usuário sem empresa vinculada.","erro");return}const r=Number(ma),p=Number(Wa),h=Number(kr);if(isNaN(r)||r<0||isNaN(p)||p<0||isNaN(h)||h<0){ae("Informe uma quantidade válida para os dias de alerta.","erro");return}const j={notificacoes_ativas:ko,enviar_whatsapp:ta,enviar_email:aa,enviar_push:oa,dias_aviso_padrao:r,nome_empresa:ra.trim()||null,whatsapp_padrao:Nr.trim()||null,email_padrao:Sr.trim()||null,empresa_id:H};let w;if(Va!=null&&Va.id?w=await T.from("df_configuracoes").update(j).eq("id",Va.id).eq("empresa_id",H).select():w=await T.from("df_configuracoes").insert([j]).select(),w.error){ze(w.error);return}const _=Array.isArray(w.data)?w.data[0]:w.data;Ga(_);const{error:R}=await T.from("df_configuracoes_alertas").upsert([{empresa_id:H,dias_alerta_contas:p,alertar_contas_vencidas:yr,destacar_contas_criticas:wr,dias_alerta_notas:h,destacar_notas_urgentes:Cr}],{onConflict:"empresa_id"});if(R){ae("Configurações principais salvas, mas os alertas globais não foram atualizados: "+R.message,"erro");return}ae("Configurações salvas com sucesso.","info")}async function Dn(r){const{error:p}=await T.from("df_contas").update({excluido:!1,excluido_em:null}).eq("id",r).eq("empresa_id",H);if(p){ze(p);return}Kt(),Yt(),ae("Conta restaurada com sucesso.","sucesso")}async function In(r){return Fe({supabase:T,id:r,empresaId:H,avisarErro:ze,buscarNotas:za,buscarLixeira:Yt,mostrarAviso:ae})}async function An(r){const{error:p}=await T.from("df_contas").delete().eq("id",r.id).eq("empresa_id",H);if(p){ze(p);return}Yt(),ae("Conta excluída definitivamente.","sucesso")}async function Bn(r){return de({supabase:T,nota:r,empresaId:H,avisarErro:ze,buscarLixeira:Yt,mostrarAviso:ae})}async function qn(){if(!H){ae("Usuário sem empresa vinculada.","erro");return}const r=kt(xt.trim());if(!r){ae("Digite o centro de custo.","erro");return}if(De.some(w=>String(w.nome||"").trim().toLowerCase()===r.toLowerCase())){ae("Este centro de custo já existe nesta empresa.","erro");return}const{data:h,error:j}=await T.from("df_centros_custo").insert([{nome:r,empresa_id:H}]).select("*").single();if(j){ze(j);return}et(""),at(w=>[...w.filter(R=>R.id!==h.id),h].sort((R,ce)=>String(R.nome||"").localeCompare(String(ce.nome||"")))),await Xa(H),ae("Centro de custo criado com sucesso.","sucesso")}async function Ln(r){const{error:p}=await T.from("df_centros_custo").delete().eq("id",r).eq("empresa_id",H);if(p){ae("Não foi possível excluir. Verifique se existem contas usando este centro.","erro");return}Xa(),Kt()}function Un(){const r=["Descricao","Valor","Vencimento","Status","Filial","Centro"],p=St.map(R=>{var ce,Ve;return[R.descricao||"",Number(R.valor||0).toFixed(2).replace(".",","),Pt(R.data_vencimento),g(R.data_vencimento,R.status)?"vencido":R.status,((ce=R.df_filiais)==null?void 0:ce.nome)||"",((Ve=R.df_centros_custo)==null?void 0:Ve.nome)||""]}),h=[r,...p].map(R=>R.map(ce=>`"${String(ce).replaceAll('"','""')}"`).join(";")).join(`
`),j=new Blob([h],{type:"text/csv;charset=utf-8;"}),w=URL.createObjectURL(j),_=document.createElement("a");_.href=w,_.download="relatorio-contas.csv",_.click(),URL.revokeObjectURL(w)}function On(){const r=w=>String(w??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),p=St.map(w=>{var R,ce;const _=g(w.data_vencimento,w.status)?"Vencido":w.status==="pago"?"Pago":"Pendente";return`
        <tr>
          <td>
            <strong>${r(w.descricao||"-")}</strong>
            ${w.observacao?`<small>Obs: ${r(w.observacao)}</small>`:""}
          </td>
          <td>${r(((R=w.df_filiais)==null?void 0:R.nome)||"-")}</td>
          <td>${r(((ce=w.df_centros_custo)==null?void 0:ce.nome)||"-")}</td>
          <td>${r(Pt(w.data_vencimento))}</td>
          <td><span class="status ${_.toLowerCase()}">${_}</span></td>
          <td class="valor">${r(nt(w.valor))}</td>
        </tr>
      `}).join(""),h=`
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
                <div class="empresa">${r(ra||"DF Gestão Financeira")}</div>
              </div>
              <div class="data">Gerado em ${new Date().toLocaleDateString("pt-BR")}<br/>${St.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${r(nt(Qa))}</strong></div>
              <div class="box"><span>Pago</span><strong>${r(nt(To))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${r(nt(Ar))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${r(nt(Ir))}</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Conta</th><th>Filial</th><th>Centro</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  ${p||'<tr><td colspan="6">Nenhuma conta encontrada.</td></tr>'}
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
    `,j=window.open("","_blank");if(!j){ae("O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.","erro");return}j.document.open(),j.document.write(h),j.document.close()}function Vn(){D(""),X("todas"),pe(""),Ce(""),y(""),I(""),Y("")}function wt({titulo:r,mensagem:p,textoConfirmar:h="Confirmar",tipo:j="padrao",acao:w}){_r({aberto:!0,titulo:r,mensagem:p,textoConfirmar:h,tipo:j,acao:w})}function eo(){_r({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null})}async function Wr(){typeof yt.acao=="function"&&await yt.acao(),eo()}function Hr(r){return String(r||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Ra(r,p){const h=Object.entries(r||{});for(const j of p){const w=Hr(j),_=h.find(([R])=>Hr(R)===w);if(_)return _[1]}return""}function Gn(r){if(!r)return null;if(typeof r=="number"){const h=new Date(Date.UTC(1899,11,30));return h.setUTCDate(h.getUTCDate()+r),h.toISOString().slice(0,10)}const p=String(r).trim();if(!p)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(p))return p;if(/^\d{2}\/\d{2}\/\d{4}$/.test(p)){const[h,j,w]=p.split("/");return`${w}-${j}-${h}`}return ro(p)}function Wn(r){if(typeof r=="number")return r;const p=String(r||"").replace(/R\$/gi,"").replace(/\./g,"").replace(",",".").trim();return Number(p||0)}function Kr(r){const p=[];let h="",j=!1;for(let w=0;w<r.length;w+=1){const _=r[w],R=r[w+1];if(_==='"'&&R==='"'){h+='"',w+=1;continue}if(_==='"'){j=!j;continue}if((_===";"||_===",")&&!j){p.push(h.trim()),h="";continue}h+=_}return p.push(h.trim()),p}function Hn(r){const p=String(r||"").replace(/^﻿/,"").split(/\r?\n/).filter(j=>j.trim());if(p.length<2)return[];const h=Kr(p[0]);return p.slice(1).map(j=>{const w=Kr(j);return h.reduce((_,R,ce)=>(_[R]=w[ce]||"",_),{})})}async function Kn(r){var w,_;const p=(w=r.target.files)==null?void 0:w[0];if(Mo(p||null),Ha([]),_a(""),!p)return;if(((_=p.name.split(".").pop())==null?void 0:_.toLowerCase())!=="csv"){_a("Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.");return}const j=new FileReader;j.onload=R=>{const Ve=Hn(R.target.result).map((ct,ke)=>{const Oe=Ra(ct,["descricao","descrição","conta","nome","fornecedor"]),Lt=Ra(ct,["valor","valor pago","total"]),na=Ra(ct,["vencimento","data vencimento","data_vencimento","data"]),$t=String(Ra(ct,["status","situacao","situação"])||"pendente").toLowerCase(),sa=Ra(ct,["centro","centro de custo","categoria","setor"]);return{linha:ke+2,descricao:kt(String(Oe||"").trim()),valor:Wn(Lt),data_vencimento:Gn(na),status:$t.includes("pag")?"pago":"pendente",centro:String(sa||"").trim()}}).filter(ct=>ct.descricao||ct.valor||ct.data_vencimento);Ha(Ve),_a(`${Ve.length} linha(s) preparada(s) para revisão.`)},j.readAsText(p,"UTF-8")}async function Yn(){if(!H){ae("Usuário sem empresa vinculada.","erro");return}const r=Wt.filter(w=>!w.descricao||!w.valor||!w.data_vencimento);if(r.length>0){ae(`Existem ${r.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`,"erro");return}const p={...Object.fromEntries(De.map(w=>[w.nome.toLowerCase(),w.id]))};for(const w of Wt)if(w.centro&&!p[w.centro.toLowerCase()]){const{data:_,error:R}=await T.from("df_centros_custo").insert([{nome:kt(w.centro),empresa_id:H}]).select();if(R){ze(R);return}const ce=Array.isArray(_)?_[0]:_;p[w.centro.toLowerCase()]=ce==null?void 0:ce.id}const h=Wt.map(w=>({descricao:w.descricao,valor:w.valor,data_vencimento:w.data_vencimento,vencimento:w.data_vencimento,status:w.status,centro_custo_id:w.centro&&p[w.centro.toLowerCase()]||null,enviar_whatsapp:ta,enviar_email:aa,enviar_push:oa,dias_aviso:Number(ma||1),empresa_id:H})),{error:j}=await T.from("df_contas").insert(h);if(j){ze(j);return}_a(`${h.length} conta(s) importada(s) com sucesso.`),Mo(null),Ha([]),await Ka(H),$e("contas")}async function to(){Ht(),zt(null),wa(!1),ca("contas"),await T.auth.signOut()}function fa({titulo:r,aberto:p,onClick:h}){const j=String(r||"").split(" "),w=j[0]||"",_=j.slice(1).join(" ")||r;return e.jsxs("button",{style:x.headerExpansivel,onClick:h,children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:10,color:"#0f172a",fontWeight:900,lineHeight:1.1},children:[e.jsx("span",{style:{fontSize:24,lineHeight:1},children:w}),e.jsx("span",{children:_})]}),e.jsx("strong",{style:{color:"#0f172a"},children:p?"−":"+"})]})}function $e(r){var p;Ie(!1),Et(!1),ca(r),((p=window.history.state)==null?void 0:p.tela)!==r&&window.history.pushState({tela:r},"",window.location.href)}function Xn(){$e("dashboard")}function Xt(){var h,j;const r=xo||((h=P==null?void 0:P.user_metadata)==null?void 0:h.name)||((j=P==null?void 0:P.user_metadata)==null?void 0:j.full_name);if(r)return String(r).split(" ")[0];const p=(P==null?void 0:P.email)||"usuário";return kt(p.split("@")[0])}function Yr(){var h,j;const r=xo||((h=P==null?void 0:P.user_metadata)==null?void 0:h.name)||((j=P==null?void 0:P.user_metadata)==null?void 0:j.full_name);if(r)return String(r).trim();const p=(P==null?void 0:P.email)||"";return p?kt(p.split("@")[0]):""}function Xr(){Qo(Yr()),ho(!0)}async function Qn(){const r=String(Xo||"").trim().replace(/\s+/g," ");if(r.length<2){ae("Informe um nome com pelo menos 2 caracteres.","erro");return}Jo(!0);try{await xs({userId:P==null?void 0:P.id,email:P==null?void 0:P.email,nome:r}),pa(r),zt(p=>p&&{...p,user_metadata:{...p.user_metadata||{},name:r,full_name:r}}),H&&await ua(H),ho(!1),ae("Perfil atualizado com sucesso.","sucesso")}catch(p){ze(p,"Não foi possível atualizar o perfil.")}finally{Jo(!1)}}function Jn(){return yt.aberto?e.jsx("div",{style:x.overlayConfirmacao,children:e.jsxs("div",{style:x.modalConfirmacao,children:[e.jsx("div",{style:x.confirmacaoIcone,children:yt.tipo==="perigo"?"⚠️":yt.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:x.confirmacaoTitulo,children:yt.titulo}),e.jsx("p",{style:x.confirmacaoTexto,children:yt.mensagem}),e.jsxs("div",{style:x.confirmacaoAcoes,children:[e.jsx("button",{style:x.btnConfirmarCancelar,onClick:eo,children:"Cancelar"}),e.jsx("button",{style:{...x.btnConfirmarAcao,background:yt.tipo==="perigo"?"#dc3545":yt.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:Wr,children:yt.textoConfirmar})]})]})}):null}function Qr(){return e.jsxs(e.Fragment,{children:[Z&&e.jsx(Dl,{styles:x,editandoContaId:Ee,descricao:we,setDescricao:O,valor:fe,setValor:Be,dataVencimento:A,setDataVencimento:V,centroCustoId:_e,setCentroCustoId:he,centros:De,filialId:F,setFilialId:ee,filiais:xe,observacaoConta:He,setObservacaoConta:Pe,contaRecorrente:qe,setContaRecorrente:It,tipoRecorrencia:Qe,setTipoRecorrencia:lt,diaVencimentoRecorrencia:Le,setDiaVencimentoRecorrencia:pt,fecharConta:Pa,salvarConta:Pn,primeiraLetraMaiuscula:kt,limitarDataInput:Io,formatarDataParaBanco:ro,fecharNota:Za,setModalCentro:ft,setMenuAberto:Ie,setMenuNavegacaoAberto:Et}),Xe&&e.jsx(Il,{styles:x,editandoNotaId:rt,tituloNota:bt,setTituloNota:Rt,prioridadeNota:Ze,setPrioridadeNota:mt,dataEventoNota:Bt,setDataEventoNota:qt,conteudoNota:Gt,setConteudoNota:At,filialNotaId:ut,setFilialNotaId:vt,filiais:xe,salvarNota:Mn,fecharNota:Za,fecharConta:Pa,setModalCentro:ft,setMenuAberto:Ie,setMenuNavegacaoAberto:Et,primeiraLetraMaiuscula:kt,limitarDataInput:Io}),Ct&&e.jsx(Al,{styles:x,novoCentro:xt,setNovoCentro:et,salvarCentro:qn,centros:De,abrirConfirmacao:wt,excluirCentro:Ln,fecharConta:Pa,fecharNota:Za,setModalCentro:ft,setMenuAberto:Ie,setMenuNavegacaoAberto:Et}),Xi&&e.jsx(ql,{nome:Xo,setNome:Qo,email:P==null?void 0:P.email,salvando:Qi,onClose:()=>ho(!1),onSave:Qn})]})}function Jr(){return e.jsx(Rl,{styles:x,nomeEmpresa:ra,navegarPara:$e,menuNavegacaoAberto:tt,setMenuNavegacaoAberto:Et,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:S,empresaId:H,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,nomeUsuario:Xt,abrirPerfilUsuario:Xr,sairDoSistema:to})}function Zr(){return e.jsxs(e.Fragment,{children:[Ft&&e.jsxs("div",{className:"global-fab-menu",style:x.menuFab,onClick:r=>r.stopPropagation(),children:[e.jsxs("button",{style:x.menuItem,type:"button",onClick:r=>{r.preventDefault(),r.stopPropagation(),En()},"aria-label":"Nova conta",children:[e.jsx("span",{style:x.menuItemIcone,children:"💰"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova conta"})]}),e.jsxs("button",{style:x.menuItem,type:"button",onClick:r=>{r.preventDefault(),r.stopPropagation(),$n()},"aria-label":"Nova nota",children:[e.jsx("span",{style:x.menuItemIcone,children:"📝"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova nota"})]})]}),e.jsx("button",{className:"global-fab",style:x.fab,onClick:r=>{r.stopPropagation(),Ie(!Ft)},children:Ft?"×":"+"})]})}function ei(){return e.jsx("style",{children:`
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
      `})}function Zn(){return e.jsx("style",{children:`
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
      `})}function ti(){return e.jsx("style",{children:`
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
      `})}function ot(r){return e.jsx(pi,{contas:G,contasFiltradas:St,navegarPara:$e,children:e.jsxs("div",{className:"app-page app-frame",style:x.page,children:[e.jsx("style",{children:`

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

      `}),ti(),ei(),e.jsx(fi,{}),Zn(),Jr(),ai(),oi(),e.jsx("main",{className:"app-frame-content",children:r}),Zr(),e.jsx(mi,{}),e.jsx(ui,{}),Jn(),Qr(),e.jsx(ci,{visible:i}),e.jsx(qo,{toast:n,onClose:d})]})})}function ao({icon:r,title:p,description:h}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:r}),e.jsx("strong",{children:p}),e.jsx("p",{children:h})]})}function es(r){Ki(p=>({...p,[r]:!p[r]}))}function ai(){return e.jsx(Ml,{sidebarCompacta:Gi,setSidebarCompacta:Wi,nomeUsuario:Xt,nomeUsuarioAtual:Xt(),normalizarPerfil:Nt,perfilUsuario:Aa,menuSections:Fr(),telaAtual:it,navegarPara:$e,gruposMenu:Hi,toggleGrupoMenu:es,sairDoSistema:to})}function oi(){return e.jsx(Tl,{visible:tt,styles:x,setMenuNavegacaoAberto:Et,nomeUsuario:Xt,nomeUsuarioAtual:Xt(),normalizarPerfil:Nt,perfilUsuario:Aa,menuSections:Fr(),navegarPara:$e,sairDoSistema:to,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:S,empresaId:H,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,abrirPerfilUsuario:Xr})}if(Yi)return e.jsx("div",{style:x.page,children:e.jsx("h2",{children:"Carregando..."})});if(!P)return e.jsxs(e.Fragment,{children:[e.jsx(Pl,{onLogin:zt}),e.jsx(qo,{toast:n,onClose:d})]});if(Zo)return e.jsxs("div",{style:x.page,children:[e.jsx("h2",{children:"⚠️ Empresa não vinculada"}),e.jsx("p",{children:Zo}),e.jsx("button",{style:x.btnSair,onClick:to,children:"Sair"})]});if(it==="contas")return ot(e.jsx(tl,{styles:x,busca:re,setBusca:D,mostrarFiltros:an,setMostrarFiltros:on,limparFiltros:Vn,imprimirPDF:On,exportarCSV:Un,filtroStatus:$,setFiltroStatus:X,centros:De,filtroCentro:je,setFiltroCentro:pe,filiais:xe,filtroFilial:ge,setFiltroFilial:Ce,filtroMes:ie,setFiltroMes:y,dataInicial:me,setDataInicial:I,dataFinal:te,setDataFinal:Y,limitarDataInput:Io,contasFiltradas:St,total:Qa,formatarValor:nt,loading:J,HeaderExpansivel:fa,mostrarContas:rn,setMostrarContas:nn,estaVencida:g,formatarData:Pt,formatarTipoRecorrencia:Ri,obterTipoRecorrenciaConta:Pi,abrirConfirmacao:wt,marcarComoPago:Do,voltarParaPendente:Rn,abrirEdicaoConta:zn,excluirConta:Fn,navegarPara:$e}));if(it==="relatorios")return ot(e.jsx(Ls,{voltar:()=>$e("contas"),empresaId:H,usuario:P,mostrarAviso:ae}));if(it==="notas")return ot(e.jsx(ol,{styles:x,navegarPara:$e,notasFiltradas:qr,notasPendentes:Ja,notasCriticas:Lr,notasUrgentes:Ur,buscaNota:Ye,setBuscaNota:Ue,formatarData:Pt,alternarNotaConcluida:Gr,abrirEdicaoNota:Or,abrirConfirmacao:wt,excluirNota:Vr,loading:J,nomeUsuario:Xt(),filiais:xe,filtroFilial:ge,setFiltroFilial:Ce,contasOperacionaisFiliais:Dr}));if(it==="importar")return ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📥 Importar planilha"}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"1. Enviar arquivo"}),e.jsx("p",{style:x.textoNota,children:"Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app."}),e.jsxs("label",{style:x.uploadExcelBox,children:[e.jsx("strong",{children:"📊 Selecionar arquivo CSV"}),e.jsx("small",{children:"No Excel: Arquivo > Salvar como > CSV UTF-8"}),e.jsx("input",{type:"file",accept:".csv",onChange:Kn,style:{display:"none"}})]}),Er&&e.jsxs("p",{style:x.textoNota,children:["Arquivo: ",e.jsx("strong",{children:Er.name})]}),zr&&e.jsx("p",{style:x.alertaSucesso,children:zr})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"2. Colunas esperadas"}),e.jsxs("div",{style:x.importDicasGrid,children:[e.jsx("span",{children:"Descrição"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Vencimento"}),e.jsx("span",{children:"Status"}),e.jsx("span",{children:"Centro de custo"})]}),e.jsx("p",{style:x.textoAjuda,children:"O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação."})]}),Wt.length>0&&e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"3. Revisar dados"}),e.jsx("div",{style:x.previewImportacao,children:Wt.slice(0,8).map(r=>e.jsxs("div",{style:x.previewLinha,children:[e.jsx("strong",{children:r.descricao||`Linha ${r.linha}`}),e.jsxs("small",{children:[Pt(r.data_vencimento)," • ",nt(r.valor)," • ",r.status," • ",r.centro||"Sem centro"]})]},r.linha))}),Wt.length>8&&e.jsxs("small",{style:x.textoAjuda,children:["Mostrando 8 de ",Wt.length," linhas."]}),e.jsxs("button",{style:x.btnSalvar,onClick:Yn,children:["Importar ",Wt.length," conta(s)"]})]})]}));if(it==="master-empresas")return Ne!=null&&Ne.canManageCompanies?ot(e.jsx(pl,{styles:x,usuarioLogado:P,nomeUsuarioCompleto:Yr,empresaId:H,empresasDisponiveis:S,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,mostrarAviso:ae,onEmpresasAtualizadas:gn,voltarPainel:Xn,abaInicial:"empresas"})):ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏢 Painel Master"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o painel master."}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"})]})]}));if(it==="onboarding")return Ea()?ot(e.jsx(kl,{styles:x,empresaId:H,empresaNome:ra,filiais:xe,centros:De,contas:G,mostrarAviso:ae,onRefresh:()=>Ka(H),voltarPainel:()=>$e("configuracoes"),abrirDashboard:()=>$e("dashboard")})):ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🚀 Onboarding SaaS"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o onboarding."}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"})]})]}));if(it==="billing")return Ea()?ot(e.jsx(yl,{styles:x,empresaId:H,empresaNome:ra,filiais:xe,usuarios:La,mostrarAviso:ae,podeEditar:ia(),voltarPainel:()=>$e("configuracoes")})):ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"💼 Billing"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o billing."}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"})]})]}));if(it==="filiais")return Ea()?ot(e.jsx(ul,{styles:x,empresaId:H,empresaNome:ra,mostrarAviso:ae,voltarPainel:()=>$e("configuracoes")})):ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏬 Filiais"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite gerenciar filiais."}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"})]})]}));if(it==="usuarios")return ot(e.jsx(Nl,{styles:x,EmptyState:ao,podeAcessarConfiguracoes:Ea,podeAdministrarUsuarios:ia,navegarPara:$e,usuarioLogado:P,normalizarPerfil:Nt,perfilUsuario:Aa,permissoesUsuario:Ne,novoEmailUsuario:ur,setNovoEmailUsuario:fr,novaSenhaUsuario:Sa,setNovaSenhaUsuario:xr,confirmarNovaSenhaUsuario:hr,setConfirmarNovaSenhaUsuario:gr,salvarMeuEmail:Cn,salvarMinhaSenha:Nn,empresasDisponiveis:S,empresaId:H,trocandoEmpresa:Ca,trocarEmpresaAtiva:Ya,buscarUsuariosEmpresa:ua,primeiraLetraMaiuscula:kt,nomeConviteUsuario:sr,setNomeConviteUsuario:lr,emailConviteUsuario:ir,setEmailConviteUsuario:nr,senhaConviteUsuario:pr,setSenhaConviteUsuario:mr,perfilConviteUsuario:dr,setPerfilConviteUsuario:cr,criandoUsuarioManual:tr,adicionarUsuarioEmpresa:bn,usuariosCarregando:Ji,usuariosInicializados:Zi,usuariosErro:en,usuariosEmpresa:La,filiais:xe,filiaisUsuariosEmpresa:or,salvandoFilialUsuario:tn,liberarTodasFiliaisUsuario:wn,alternarFilialUsuario:yn,atualizarPerfilUsuarioEmpresa:jn,enviarAcessoUsuarioEmpresa:vn,removerUsuarioEmpresa:kn}));if(it==="configuracoes")return Ea()?ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🔔 Notificações",aberto:yo,onClick:()=>mn(!yo)}),yo&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificações ativas"}),e.jsx("small",{children:"Controle geral dos disparos automáticos da empresa."})]}),e.jsx("input",{type:"checkbox",checked:ko,onChange:r=>Co(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Contas"}),e.jsx("span",{children:"Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar contas antes do vencimento. Ex: 1",value:Wa,onChange:r=>{So(r.target.value),No(r.target.value)}}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificar contas vencidas"}),e.jsx("small",{children:"Exibir contas em atraso nas notificações e destaques."})]}),e.jsx("input",{type:"checkbox",checked:yr,onChange:r=>_o(r.target.checked)})]}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar contas críticas"}),e.jsx("small",{children:"Dar prioridade visual para contas vencidas ou muito próximas do vencimento."})]}),e.jsx("input",{type:"checkbox",checked:wr,onChange:r=>Eo(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Notas"}),e.jsx("span",{children:"Regras para pendências e prioridades do bloco de notas."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar notas pendentes após quantos dias. Ex: 3",value:kr,onChange:r=>zo(r.target.value)}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar notas urgentes"}),e.jsx("small",{children:"Manter notas urgentes e críticas no topo do acompanhamento."})]}),e.jsx("input",{type:"checkbox",checked:Cr,onChange:r=>Po(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Canais preparados"}),e.jsxs("span",{children:["WhatsApp: ",ta?"Ligado":"Desligado"," • E-mail: ",aa?"Ligado":"Desligado"," • Push: ",oa?"Ligado":"Desligado"]})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏢 Dados do negócio",aberto:jo,onClick:()=>pn(!jo)}),jo&&e.jsxs(e.Fragment,{children:[e.jsx("input",{style:x.input,placeholder:"Nome da empresa",value:ra,onChange:r=>Ro(kt(r.target.value))}),e.jsx("input",{style:x.input,placeholder:"WhatsApp padrão. Ex: 5511999999999",value:Nr,onChange:r=>Fo(r.target.value)}),e.jsx("input",{style:x.input,placeholder:"E-mail padrão",value:Sr,onChange:r=>$o(r.target.value)})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🔁 Recorrências",aberto:wo,onClick:()=>fn(!wo)}),wo&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Padrão atual"}),e.jsx("span",{children:"Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir."})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏷 Centros de custo",aberto:Oa,onClick:()=>un(!Oa)}),Oa&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"Cadastre e gerencie os centros usados nas contas e nos relatórios."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Total de centros: ",De.length]}),e.jsx("span",{children:"Uso nos filtros e relatórios"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>ft(!0),children:"Gerenciar centros"})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏬 Filiais / Unidades",aberto:Oa,onClick:()=>$e("filiais")}),e.jsx("p",{style:x.textoNota,children:"Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("span",{children:"Organização: empresa → filial → centro de custo → conta"}),e.jsx("span",{children:"Isolamento por empresa ativo"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>$e("filiais"),children:"Gerenciar filiais"})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"🧠 Como o sistema vai usar"}),e.jsx("p",{style:x.textoNota,children:"O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos e as contas/notas passam a obedecer ao mesmo padrão configurado aqui."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Geral: ",ko?"Ligado":"Desligado"]}),e.jsxs("span",{children:["WhatsApp: ",ta?"Ligado":"Desligado"]}),e.jsxs("span",{children:["E-mail: ",aa?"Ligado":"Desligado"]}),e.jsxs("span",{children:["Push: ",oa?"Ligado":"Desligado"]})]})]}),e.jsx("button",{style:x.btnSalvar,onClick:Tn,children:"Salvar configurações"})]})):ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar configurações."}),e.jsx("button",{style:x.btnCinza,onClick:()=>$e("contas"),children:"← Voltar"})]})]}));if(it==="agenda"){let r=function({titulo:ke,total:Oe,lista:Lt,cor:na}){return e.jsxs("section",{style:x.cardAgenda,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:ke}),e.jsx("span",{children:nt(Oe)})]}),Lt.length===0&&e.jsx(ao,{icon:"✅",title:"Agenda limpa",description:"Não há contas neste grupo de vencimento no momento."}),Lt.map($t=>{var ri;const sa=ha($t.data_vencimento);return e.jsxs("div",{style:{...x.itemAgenda,borderLeft:`5px solid ${na}`},children:[e.jsxs("div",{children:[e.jsx("strong",{children:$t.descricao}),e.jsxs("div",{style:x.cardInfo,children:[Pt($t.data_vencimento)," • ",((ri=$t.df_centros_custo)==null?void 0:ri.nome)||"Sem centro"]}),e.jsx("small",{style:sa<0?x.textoVencidoAgenda:x.textoAgenda,children:sa<0?`Vencida há ${Math.abs(sa)} dia(s)`:sa===0?"Vence hoje":`Vence em ${sa} dia(s)`})]}),e.jsxs("div",{style:x.agendaDireita,children:[e.jsx("strong",{children:nt($t.valor)}),e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${$t.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>Do($t.id)}),children:"Pago"})]})]},$t.id)})]})};const p=[...G].filter(ke=>ke.status!=="pago").sort((ke,Oe)=>Ta(ke.data_vencimento)-Ta(Oe.data_vencimento)),h=p.filter(ke=>ha(ke.data_vencimento)<0),j=p.filter(ke=>ha(ke.data_vencimento)===0),w=p.filter(ke=>{const Oe=ha(ke.data_vencimento);return Oe>0&&Oe<=7}),_=p.filter(ke=>ha(ke.data_vencimento)>7&&Gs(ke.data_vencimento)),R=h.reduce((ke,Oe)=>ke+Number(Oe.valor||0),0),ce=j.reduce((ke,Oe)=>ke+Number(Oe.valor||0),0),Ve=w.reduce((ke,Oe)=>ke+Number(Oe.valor||0),0),ct=_.reduce((ke,Oe)=>ke+Number(Oe.valor||0),0);return ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📅 Agenda Financeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"agenda-summary-grid",style:x.resumo,children:[e.jsxs("div",{style:x.boxVencido,children:[e.jsx("span",{children:"Vencidas"}),e.jsx("strong",{children:nt(R)})]}),e.jsxs("div",{style:x.boxPendente,children:[e.jsx("span",{children:"Hoje"}),e.jsx("strong",{children:nt(ce)})]}),e.jsxs("div",{style:x.boxTotal,children:[e.jsx("span",{children:"7 dias"}),e.jsx("strong",{children:nt(Ve)})]}),e.jsxs("div",{style:x.boxPago,children:[e.jsx("span",{children:"Mês"}),e.jsx("strong",{children:nt(ct)})]})]}),e.jsxs("div",{className:"agenda-page-grid",children:[e.jsx(r,{titulo:"🚨 Vencidas",total:R,lista:h,cor:"#dc3545"}),e.jsx(r,{titulo:"📌 Vencem hoje",total:ce,lista:j,cor:"#ffc107"}),e.jsx(r,{titulo:"🗓️ Próximos 7 dias",total:Ve,lista:w,cor:"#0d6efd"}),e.jsx(r,{titulo:"📆 Restante do mês",total:ct,lista:_,cor:"#14b8a6"})]})]}))}return it==="lixeira"?ot(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🗑️ Lixeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>$e("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"trash-section trash-section-accounts",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"💰 Contas excluídas"}),se.length===0&&e.jsx(ao,{icon:"🧹",title:"Nenhuma conta na lixeira",description:"As contas excluídas aparecerão aqui durante o período de quarentena."}),se.map(r=>{var h;const p=z(r.excluido_em);return E(r.excluido_em),e.jsxs("div",{className:"trash-card trash-card-account",style:x.cardLixeira,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:r.descricao}),e.jsx("span",{children:nt(r.valor)})]}),e.jsxs("div",{style:x.cardInfo,children:["Venc.: ",Pt(r.data_vencimento)," • Centro: ",((h=r.df_centros_custo)==null?void 0:h.nome)||"Sem centro"," • Lixeira há ",p," dia(s)"]}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Restaurar conta",mensagem:`Deseja restaurar a conta ${r.descricao}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Dn(r.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>wt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a conta ${r.descricao}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>An(r)}),children:"Excluir definitivo"})]})]},r.id)})]}),e.jsxs("section",{className:"trash-section trash-section-notes",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"📝 Notas excluídas"}),Re.length===0&&e.jsx(ao,{icon:"🗒️",title:"Nenhuma nota na lixeira",description:"As notas excluídas aparecerão aqui antes da remoção definitiva."}),Re.map(r=>{const p=z(r.excluido_em);return E(r.excluido_em),e.jsxs("div",{className:"trash-card trash-card-note",style:x.cardLixeira,children:[e.jsx("strong",{children:r.titulo}),r.conteudo&&e.jsx("p",{style:x.textoNota,children:r.conteudo}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Restaurar nota",mensagem:`Deseja restaurar a nota ${r.titulo}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>In(r.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>wt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a nota ${r.titulo}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>Bn(r)}),children:"Excluir definitivo"})]})]},r.id)})]})]})):e.jsx(pi,{contas:G,contasFiltradas:St,navegarPara:$e,children:e.jsxs("div",{className:"app-page",style:x.page,onClick:()=>{Ft&&Ie(!1)},children:[e.jsx("style",{children:`
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
        `}),ti(),ei(),e.jsx(fi,{}),e.jsxs("div",{className:"print-header",children:[e.jsx("h1",{children:"Relatório Financeiro"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]})]}),e.jsx("div",{className:"print-footer",children:"Relatório gerado pelo Sistema DF Gestão Financeira"}),Jr(),ai(),oi(),Zr(),e.jsx(mi,{}),e.jsx(ui,{}),e.jsx("style",{children:`
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
      `}),e.jsx("section",{className:"dashboard-page-context","aria-label":"Contexto da página",children:e.jsxs("h1",{className:"dashboard-greeting-title",children:["Olá, ",Xt()]})}),e.jsx(Zs,{styles:x,formatarValor:nt,total:Qa,pago:To,pendente:Ar,vencido:Ir,contas:St,diferencaDias:ha,navegarPara:$e,contasAbertasDashboard:_n,mostrarContasDashboard:sn,setMostrarContasDashboard:ln,busca:re,setBusca:D,estaVencida:g,formatarData:Pt,abrirConfirmacao:wt,marcarComoPago:Do,notasPendentes:Ja,notasCriticas:Lr,notasUrgentes:Ur,mostrarNotas:dn,setMostrarNotas:cn,alternarNotaConcluida:Gr,abrirEdicaoNota:Or,excluirNota:Vr,loading:J,nomeUsuario:Xt(),filiais:xe,filtroFilial:ge,setFiltroFilial:Ce,contasOperacionaisFiliais:Dr}),Qr(),e.jsx(ci,{visible:i}),e.jsx(qo,{toast:n,onClose:d}),e.jsx(Bl,{styles:x,confirmacao:yt,fecharConfirmacao:eo,executarConfirmacao:Wr})]})})}as.createRoot(document.getElementById("root")).render(e.jsx(os.StrictMode,{children:e.jsx(zl,{children:e.jsx($d,{})})}));
