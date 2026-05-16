import{r as c,j as e,a as es,R as ts}from"./vendor-react-CAFUplbN.js";import{c as as}from"./vendor-supabase-D2gm834s.js";import{R as va,L as rr,C as so,X as lo,Y as co,T as ja,a as oo,B as jr,b as yr,P as wr,c as kr,d as Cr}from"./vendor-charts-BQjpdmhu.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const d of n)if(d.type==="childList")for(const l of d.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function o(n){const d={};return n.integrity&&(d.integrity=n.integrity),n.referrerPolicy&&(d.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?d.credentials="include":n.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function r(n){if(n.ep)return;n.ep=!0;const d=o(n);fetch(n.href,d)}})();const os=void 0;function is(){return!!os}function rs(){return is()?"":"Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o sistema."}const D=as("https://placeholder.supabase.co","placeholder-anon-key",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}});function Zt(t){const a=String(t||"").toLowerCase().trim();return["admin","adm","administrador","master","owner"].includes(a)?"admin":["gerente","gerencia","gestor","manager"].includes(a)?"gerente":["financeiro","financas","finanças","financial"].includes(a)?"financeiro":["operacional","operacao","operação","atendente"].includes(a)?"operacional":["visualizacao","visualização","viewer","leitura","consulta"].includes(a)?"visualizacao":(["operador","usuario","usuário","user"].includes(a),"operador")}function ns(t=[],a=null){const o=(t||[]).map(n=>({...n,empresa_id:n.empresa_id||a,email:String(n.email||"").trim().toLowerCase(),perfil:Zt(n.perfil)})).filter(n=>!a||n.empresa_id===a),r=new Map;for(const n of o){const d=n.user_id||n.email||n.id,l=r.get(d);if(!l){r.set(d,n);continue}r.set(d,{...l,...n,id:l.id||n.id,nome:l.nome||n.nome,email:l.email||n.email,user_id:l.user_id||n.user_id,perfil:l.perfil==="admin"?l.perfil:n.perfil,created_at:l.created_at||n.created_at})}return Array.from(r.values())}async function ss(t){const{data:a,error:o}=await D.functions.invoke("listar-usuarios-empresa",{body:{empresaId:t}});if(o)throw o;if((a==null?void 0:a.ok)===!1)throw new Error((a==null?void 0:a.message)||"Não foi possível listar usuários pela Edge Function.");return ns((a==null?void 0:a.usuarios)||[],t)}async function ls(t){return t?ss(t):[]}async function ds({empresaId:t,email:a,nome:o,perfil:r,senhaProvisoria:n,criarAuthManual:d=!1}){const l=String(a||"").trim().toLowerCase(),m=String(o||"").trim()||l.split("@")[0],f=Zt(r),b=String(n||"").trim();if(!t)throw new Error("Empresa não identificada.");if(!l||!l.includes("@"))throw new Error("Informe um e-mail válido.");if(d&&b.length<6)throw new Error("Informe uma senha provisória com pelo menos 6 caracteres.");if(d){const{data:P,error:z}=await D.functions.invoke("criar-usuario-manual",{body:{empresaId:t,email:l,nome:m,perfil:f,senhaProvisoria:b}});if(z){const H=String((z==null?void 0:z.message)||(z==null?void 0:z.details)||"");throw H.includes("Failed to send a request")?new Error("Não foi possível conectar à Edge Function criar-usuario-manual. Confirme se ela foi publicada no Supabase e se o projeto está correto."):new Error(H||"A Edge Function criar-usuario-manual retornou erro. Verifique os logs no Supabase.")}if((P==null?void 0:P.ok)===!1)throw new Error((P==null?void 0:P.message)||"Não foi possível criar o usuário manualmente.");return(P==null?void 0:P.usuario)||(P==null?void 0:P.vinculo)||{empresa_id:t,email:l,nome:m,perfil:f,user_id:(P==null?void 0:P.userId)||null}}const{data:_,error:k}=await D.from("df_usuarios_empresas").select("id, email, user_id").eq("empresa_id",t).eq("email",l).maybeSingle();if(k)throw k;if(_)throw new Error("Este e-mail já está cadastrado nesta empresa.");const S={empresa_id:t,user_id:null,email:l,nome:m,perfil:f},{data:g,error:T}=await D.from("df_usuarios_empresas").insert([S]).select("*").single();if(T)throw T;return g}async function cs({empresaId:t,usuario:a,perfil:o}){const r=Zt(o);let n=D.from("df_usuarios_empresas").update({perfil:r}).eq("empresa_id",t);a.id?n=n.eq("id",a.id):a.user_id?n=n.eq("user_id",a.user_id):n=n.eq("email",a.email);const{error:d}=await n;if(d)throw d}async function ps({empresaId:t,usuario:a}){let o=D.from("df_usuarios_empresas").delete().eq("empresa_id",t);a.id?o=o.eq("id",a.id):a.user_id?o=o.eq("user_id",a.user_id):o=o.eq("email",a.email);const{error:r}=await o;if(r)throw r}async function ms({usuario:t}){const a=String((t==null?void 0:t.email)||"").trim().toLowerCase();if(!a||!a.includes("@"))throw new Error("Este usuário não possui e-mail válido para envio de acesso.");const o=`${window.location.origin}/reset-password`,{data:r,error:n}=await D.functions.invoke("convidar-usuario",{body:{email:a,nome:t.nome||"",redirectTo:o}});if(!n)return{tipo:"convite",mensagem:(r==null?void 0:r.message)||"Convite enviado para o e-mail do usuário."};const{error:d}=await D.auth.resetPasswordForEmail(a,{redirectTo:o});if(d)throw d;return{tipo:"reset",mensagem:"Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha."}}async function us({userId:t,email:a,nome:o}){const r=String(o||"").trim(),n=String(a||"").trim().toLowerCase();if(!t)throw new Error("Usuário não identificado.");if(r.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");const d=[],{error:l}=await D.from("profiles").upsert({id:t,name:r},{onConflict:"id"});l&&d.push(l);const{error:m}=await D.from("df_usuarios_empresas").update({nome:r}).eq("user_id",t);if(m&&d.push(m),n){const{error:f}=await D.from("df_usuarios_empresas").update({nome:r}).eq("email",n);f&&d.push(f)}if(d.length>0)throw d[0];return{nome:r}}async function fs(t){if(!t)return[];const{data:a,error:o}=await D.from("df_usuarios_filiais").select("id, empresa_id, usuario_id, filial_id, created_at").eq("empresa_id",t);if(o)throw o;return a||[]}async function xs({empresaId:t,usuario:a,filialIds:o}){if(!t)throw new Error("Empresa não identificada.");if(!(a!=null&&a.id))throw new Error("Usuário da empresa não identificado.");const r=Array.from(new Set((o||[]).filter(Boolean))),{error:n}=await D.from("df_usuarios_filiais").delete().eq("empresa_id",t).eq("usuario_id",a.id);if(n)throw n;if(r.length===0)return[];const d=r.map(f=>({empresa_id:t,usuario_id:a.id,filial_id:f})),{data:l,error:m}=await D.from("df_usuarios_filiais").insert(d).select("id, empresa_id, usuario_id, filial_id, created_at");if(m)throw m;return l||[]}function kt(t){return t?String(t).charAt(0).toUpperCase()+String(t).slice(1):""}function rt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Pt(t){return t?new Date(String(t).slice(0,10)+"T00:00:00").toLocaleDateString("pt-BR"):"-"}function io(t){if(!t)return null;const a=String(t).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(/^\d{2}\/\d{2}\/\d{4}$/.test(a)){const[o,r,n]=a.split("/");return`${n}-${r}-${o}`}return a.slice(0,10)}function Io(t){if(!t)return"";const a=String(t);if(a.includes("-"))return a.slice(0,10);const o=a.replace(/\D/g,"").slice(0,8);return o.length<=2?o:o.length<=4?`${o.slice(0,2)}/${o.slice(2)}`:`${o.slice(0,2)}/${o.slice(2,4)}/${o.slice(4,8)}`}function Nr(t){const a=String(t||"").trim();if(!a)return 0;const o=a.replace(/[^\d,.-]/g,""),n=o.includes(",")?o.replace(/\./g,"").replace(",","."):o.replace(/,/g,""),d=Number(n);return Number.isFinite(d)?d:0}function te(t){return rt(t)}function ro(t){return Pt(t)}const hs=";";function Sr(t,a){if(!(a instanceof Blob))throw new Error("Arquivo de exportação inválido.");const o=URL.createObjectURL(a),r=document.createElement("a");r.href=o,r.download=t,r.rel="noopener",document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(o),1200)}function gs(t,a){const o=Array.isArray(a)?a:[],r=[t,...o].map(n=>n.map(vs).join(hs)).join(`\r
`);return new Blob([`\uFEFF${r}`],{type:"text/csv;charset=utf-8"})}function bs({filename:t,headers:a,rows:o}){Sr(t,gs(a,o))}function vs(t){return`"${String(t??"").replace(/\r|\n/g," ").replace(/"/g,'""')}"`}function js(t,a){if(!t||typeof t!="string"){a==null||a(new Error("Conteúdo de impressão vazio."));return}const o=document.createElement("iframe");o.title="Relatório para impressão",o.style.position="fixed",o.style.left="-10000px",o.style.top="0",o.style.width="794px",o.style.height="1123px",o.style.border="0",o.style.background="#ffffff",o.style.opacity="0.01",o.setAttribute("aria-hidden","true");let r=!1,n,d;const l=()=>{window.clearTimeout(n),window.clearTimeout(d),d=window.setTimeout(()=>o.remove(),3e3)},m=()=>{if(!r){r=!0;try{const _=o.contentWindow;if(!_)throw new Error("Janela de impressão indisponível.");_.focus(),_.print(),l()}catch(_){l(),a==null||a(_)}}},f=async(_=0)=>{var g,T,P;if(r)return;const k=o.contentDocument;if(!!!((T=(g=k==null?void 0:k.body)==null?void 0:g.innerText)!=null&&T.trim())){if(_<12){n=window.setTimeout(()=>f(_+1),250);return}l(),a==null||a(new Error("Documento de impressão não foi renderizado."));return}try{(P=k.fonts)!=null&&P.ready&&await k.fonts.ready;const z=Array.from(k.images||[]);await Promise.all(z.map(H=>H.complete?Promise.resolve():new Promise(re=>{H.onload=re,H.onerror=re}))),window.requestAnimationFrame(()=>{window.setTimeout(m,350)})}catch(z){if(_<12){n=window.setTimeout(()=>f(_+1),250);return}l(),a==null||a(z)}};o.onload=()=>f(),document.body.appendChild(o);const b=o.contentDocument;if(!b){l(),a==null||a(new Error("Documento de impressão indisponível."));return}b.open(),b.write(t),b.close(),n=window.setTimeout(()=>f(),500)}function ys(t){const a=(Array.isArray(t)?t:[]).map(f=>({name:Ns(f.name),rows:Array.isArray(f.rows)?f.rows:[]}));a.length===0&&a.push({name:"Relatório",rows:[["Sem dados para exportar"]]});const o=ba(`
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${a.map((f,b)=>`<sheet name="${_r(f.name)}" sheetId="${b+1}" r:id="rId${b+1}"/>`).join("")}
  </sheets>
</workbook>`),r=ba(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${a.map((f,b)=>`<Relationship Id="rId${b+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${b+1}.xml"/>`).join("")}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),n=ba(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),d=ba(`
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${a.map((f,b)=>`<Override PartName="/xl/worksheets/sheet${b+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`),l=ba(`
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs>
</styleSheet>`),m=[{path:"[Content_Types].xml",content:d},{path:"_rels/.rels",content:n},{path:"xl/workbook.xml",content:o},{path:"xl/_rels/workbook.xml.rels",content:r},{path:"xl/styles.xml",content:l},...a.map((f,b)=>({path:`xl/worksheets/sheet${b+1}.xml`,content:ws(f.rows)}))];return new Blob([Ss(m)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}function ws(t){const a=t.reduce((n,d)=>Math.max(n,(d==null?void 0:d.length)||0),0),o=Array.from({length:a},(n,d)=>{const l=Math.min(Math.max(...t.map(m=>String((m==null?void 0:m[d])??"").length),10)+2,38);return`<col min="${d+1}" max="${d+1}" width="${l}" customWidth="1"/>`}).join(""),r=t.map((n,d)=>{const l=(n||[]).map((m,f)=>ks(m,f,d)).join("");return`<row r="${d+1}">${l}</row>`}).join("");return ba(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${o}</cols>
  <sheetData>${r}</sheetData>
</worksheet>`)}function ks(t,a,o){const r=`${Cs(a)}${o+1}`,n=o===0,d=typeof t=="number"&&Number.isFinite(t),l=n?d?3:1:d?2:0;return d?`<c r="${r}" s="${l}"><v>${t}</v></c>`:`<c r="${r}" t="inlineStr" s="${l}"><is><t>${_r(t)}</t></is></c>`}function Cs(t){let a="",o=t+1;for(;o>0;){const r=(o-1)%26;a=String.fromCharCode(65+r)+a,o=Math.floor((o-r)/26)}return a}function Ns(t){return String(t||"Planilha").replace(/[\\/?*\[\]:]/g," ").slice(0,31)||"Planilha"}function _r(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}function ba(t){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${t}`}function Ss(t){const a=new TextEncoder,o=[],r=[];let n=0;t.forEach(f=>{const b=a.encode(f.path),_=a.encode(f.content),k=_s(_),S=new Uint8Array(30+b.length),g=new DataView(S.buffer);g.setUint32(0,67324752,!0),g.setUint16(4,20,!0),g.setUint16(6,0,!0),g.setUint16(8,0,!0),g.setUint16(10,0,!0),g.setUint16(12,0,!0),g.setUint32(14,k,!0),g.setUint32(18,_.length,!0),g.setUint32(22,_.length,!0),g.setUint16(26,b.length,!0),g.setUint16(28,0,!0),S.set(b,30),o.push(S,_);const T=new Uint8Array(46+b.length),P=new DataView(T.buffer);P.setUint32(0,33639248,!0),P.setUint16(4,20,!0),P.setUint16(6,20,!0),P.setUint16(8,0,!0),P.setUint16(10,0,!0),P.setUint16(12,0,!0),P.setUint16(14,0,!0),P.setUint32(16,k,!0),P.setUint32(20,_.length,!0),P.setUint32(24,_.length,!0),P.setUint16(28,b.length,!0),P.setUint16(30,0,!0),P.setUint16(32,0,!0),P.setUint16(34,0,!0),P.setUint16(36,0,!0),P.setUint32(38,0,!0),P.setUint32(42,n,!0),T.set(b,46),r.push(T),n+=S.length+_.length});const d=n;r.forEach(f=>{o.push(f),n+=f.length});const l=new Uint8Array(22),m=new DataView(l.buffer);return m.setUint32(0,101010256,!0),m.setUint16(8,t.length,!0),m.setUint16(10,t.length,!0),m.setUint32(12,n-d,!0),m.setUint32(16,d,!0),o.push(l),new Blob(o)}function _s(t){let a=-1;for(let o=0;o<t.length;o+=1)a=a>>>8^Es[(a^t[o])&255];return(a^-1)>>>0}const Es=(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let r=0;r<8;r+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Qt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Ot(t){return`${Number(t||0).toFixed(1)}%`}function zs(t){return t>=84?"saudável":t>=68?"em atenção":"crítico"}function Ps({total:t=0,pago:a=0,pendente:o=0,vencido:r=0,taxaPago:n=0,taxaVencido:d=0,score:l=0,centroCritico:m=null,total7Dias:f=0,tendenciaMensal:b=[]}={}){if(!t)return{parecer:"A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.",liquidez:"Sem volume suficiente para medir liquidez operacional.",concentracao:"Sem centro de custo dominante identificado.",curtoPrazo:"Sem pressão de curto prazo detectada no recorte atual.",comportamento:"Histórico insuficiente para leitura comportamental.",anomalias:["Base financeira insuficiente para detectar anomalias."],drivers:["Ampliar base de contas e centros classificados."]};const _=zs(l),k=b||[],S=k[k.length-1],g=k[k.length-2],T=S&&g&&g.total?(S.total-g.total)/g.total*100:null,P=r>0?`O cenário financeiro está ${_}, com ${Qt(r)} vencido representando ${Ot(d)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`:`O cenário financeiro está ${_}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`,z=n<35?`A liquidez operacional está pressionada: somente ${Ot(n)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`:n<70?`A liquidez exige acompanhamento: ${Ot(n)} do volume foi realizado, mas ainda existe margem relevante em aberto (${Qt(o)}).`:`A liquidez apresenta leitura positiva, com ${Ot(n)} já realizado e menor dependência de liquidações futuras.`,H=m?m.peso>=60?`Há concentração elevada no centro ${m.nome}, que representa ${m.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`:`O centro ${m.nome} lidera o recorte com ${m.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`:"Não há concentração relevante por centro de custo no recorte atual.",re=f>0?`O curto prazo exige reserva de caixa de ${Qt(f)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`:"Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.",V=T===null?"Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.":T>15?`O volume analisado cresceu ${Ot(T)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`:T<-15?`O volume analisado caiu ${Ot(Math.abs(T))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`:`O comportamento mensal está relativamente estável, com variação de ${Ot(T)} frente ao mês anterior.`,q=[];d>=40&&q.push(`Vencidos acima de 40% do recorte (${Ot(d)}), sinalizando risco operacional elevado.`),n<20&&q.push(`Realização abaixo de 20% (${Ot(n)}), indicando baixa conversão em pagamento/baixa.`),(m==null?void 0:m.peso)>=60&&q.push(`Concentração extrema no centro ${m.nome} (${m.peso}%).`),f>a&&f>0&&q.push(`Vencimentos de 7 dias (${Qt(f)}) superam o realizado atual (${Qt(a)}).`),q.length||q.push("Nenhuma anomalia crítica detectada no recorte atual.");const ne=[r>0?`Reduzir vencidos de ${Qt(r)} para aliviar o score.`:"Preservar cenário sem vencidos críticos.",m?`Revisar o centro ${m.nome}, principal driver do recorte.`:"Classificar centros para melhorar rastreabilidade.",f>0?`Proteger ${Qt(f)} no caixa semanal.`:"Usar a folga de curto prazo para planejamento.",o>0?`Acelerar baixa/renegociação de ${Qt(o)} em aberto.`:"Manter ritmo de realização."];return{parecer:P,liquidez:z,concentracao:H,curtoPrazo:re,comportamento:V,anomalias:q,drivers:ne}}function la(t){return Number((t==null?void 0:t.valor)||0)}function Wo(t,a){if(!t||a==="pago")return!1;const o=new Date;o.setHours(0,0,0,0);const r=new Date(`${t}T00:00:00`);return r.setHours(0,0,0,0),r<o}function Rs(t){if(!t)return 999;const a=new Date;a.setHours(0,0,0,0);const o=new Date(`${t}T00:00:00`);return o.setHours(0,0,0,0),Math.ceil((o-a)/(1e3*60*60*24))}function nt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Ao(t){return`${Number(t||0).toFixed(1)}%`}function Fs(t){var a;return((a=t==null?void 0:t.df_centros_custo)==null?void 0:a.nome)||(t==null?void 0:t.centro_custo_nome)||(t==null?void 0:t.centro)||"Sem centro"}function $s(t){return String((t==null?void 0:t.data_vencimento)||(t==null?void 0:t.created_at)||"").slice(0,7)||"Sem mês"}function Ms(t=[]){const a=new Map;return t.forEach(o=>{const r=Fs(o),n=a.get(r)||{nome:r,total:0,pago:0,pendente:0,vencido:0,quantidade:0},d=la(o);n.total+=d,n.quantidade+=1,o.status==="pago"?n.pago+=d:n.pendente+=d,Wo(o.data_vencimento,o.status)&&(n.vencido+=d),a.set(r,n)}),Array.from(a.values()).map(o=>({...o,risco:o.total?Math.round(o.vencido/o.total*100):0,peso:0})).sort((o,r)=>r.total-o.total)}function Ts(t=[]){const a=new Map;return t.forEach(o=>{const r=$s(o),n=a.get(r)||{mes:r,total:0,pago:0,pendente:0,vencido:0},d=la(o);n.total+=d,o.status==="pago"?n.pago+=d:n.pendente+=d,Wo(o.data_vencimento,o.status)&&(n.vencido+=d),a.set(r,n)}),Array.from(a.values()).sort((o,r)=>o.mes.localeCompare(r.mes)).slice(-6)}function Ds({total:t,pendente:a,vencido:o,taxaVencido:r,contasVencidas:n,contasPendentes:d}){if(!t)return 82;let l=100;return l-=Math.min(42,r*1.1),l-=Math.min(22,a/t*18),l-=Math.min(16,n.length*4),l-=Math.min(10,d.length*.8),Math.max(0,Math.min(100,Math.round(l)))}function Is(t){return t>=84?{label:"Saudável",tone:"success"}:t>=68?{label:"Atenção",tone:"warning"}:{label:"Crítico",tone:"danger"}}function As({total:t,pago:a,pendente:o,vencido:r,taxaPago:n,taxaVencido:d,score:l,status:m,centroCritico:f,vencemEm7Dias:b}){if(!t)return"Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.";const _=`O recorte atual soma ${nt(t)}, com ${nt(a)} realizado e ${nt(o)} ainda em aberto.`,k=r>0?`O principal ponto de atenção é o vencido de ${nt(r)}, equivalente a ${Ao(d)} do volume analisado.`:"Não há vencido crítico identificado no recorte atual.",S=n>=70?`A eficiência de realização está positiva, com ${Ao(n)} já liquidado.`:`A eficiência de realização está pressionada, com apenas ${Ao(n)} liquidado.`,g=f?`O centro de maior peso é ${f.nome}, concentrando ${nt(f.total)}.`:"Não há concentração relevante por centro de custo.",T=b.length?`${b.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`:"Não há concentração expressiva de vencimentos nos próximos 7 dias.";return`${_} ${k} ${S} ${g} ${T} O score financeiro está em ${l}/100, classificado como ${m.label.toLowerCase()}.`}function Er({contas:t=[],contasFiltradas:a=[]}={}){const o=a.length?a:t,r=o.reduce((M,Y)=>M+la(Y),0),n=o.filter(M=>M.status==="pago"),d=o.filter(M=>M.status!=="pago"),l=o.filter(M=>Wo(M.data_vencimento,M.status)),m=n.reduce((M,Y)=>M+la(Y),0),f=d.reduce((M,Y)=>M+la(Y),0),b=l.reduce((M,Y)=>M+la(Y),0),_=r?m/r*100:0,k=r?b/r*100:0,S=Ms(o).map(M=>({...M,peso:r?Math.round(M.total/r*100):0})),g=S[0]||null,T=Ts(o),P=d.filter(M=>{const Y=Rs(M.data_vencimento);return Y>=0&&Y<=7}),z=P.reduce((M,Y)=>M+la(Y),0),H=Ds({total:r,pendente:f,vencido:b,taxaVencido:k,contasVencidas:l,contasPendentes:d}),re=Is(H),V=[];b>0&&V.push({level:"Alta",title:"Regularizar contas vencidas",description:`${l.length} conta(s) em atraso somando ${nt(b)}.`,action:"Abrir Financeiro > Contas",impact:nt(b),tone:"danger"}),P.length&&V.push({level:"Alta",title:"Antecipar vencimentos próximos",description:`${P.length} obrigação(ões) vencem nos próximos 7 dias.`,action:"Priorizar caixa semanal",impact:nt(z),tone:"warning"}),g&&r&&g.total/r>=.35&&V.push({level:"Média",title:`Revisar centro ${g.nome}`,description:`Este centro concentra ${g.peso}% do valor analisado.`,action:"Abrir Relatórios",impact:nt(g.total),tone:"info"}),V.length||V.push({level:"Baixa",title:"Manter rotina de acompanhamento",description:"Nenhum risco operacional crítico foi identificado no recorte atual.",action:"Revisão semanal",impact:"Controle",tone:"success"});const q=As({total:r,pago:m,pendente:f,vencido:b,taxaPago:_,taxaVencido:k,score:H,status:re,centroCritico:g,vencemEm7Dias:P}),ne=Ps({total:r,pago:m,pendente:f,vencido:b,taxaPago:_,taxaVencido:k,score:H,centroCritico:g,total7Dias:z,tendenciaMensal:T}),G=[b>0?`Priorizar a quitação ou renegociação dos vencidos (${nt(b)}) antes de novas despesas.`:"Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.",z>0?`Reservar ${nt(z)} para vencimentos dos próximos 7 dias.`:"Usar a folga dos próximos 7 dias para revisar centros de maior peso.",g?`Auditar lançamentos do centro ${g.nome}, que representa ${g.peso}% do recorte.`:"Classificar centros de custo para melhorar a qualidade analítica.",_<50?"Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.":"Preservar o ritmo de baixas e acompanhar desvios por centro."],ae={"Qual meu maior risco agora?":b>0?`O maior risco agora é o saldo vencido de ${nt(b)}, distribuído em ${l.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`:`O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${nt(z)} vencendo em até 7 dias.`,"Onde estou gastando mais?":g?`O maior peso financeiro está em ${g.nome}, com ${nt(g.total)} (${g.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`:"Ainda não há centro de custo dominante no recorte atual.","Como melhorar meu caixa?":`Priorize três movimentos: reduzir vencidos (${nt(b)}), reservar caixa para 7 dias (${nt(z)}) e revisar o centro de maior peso${g?` (${g.nome})`:""}.`,"Gerar resumo executivo":q},I=[ne.liquidez,ne.concentracao,ne.curtoPrazo,ne.comportamento];return{score:H,status:re,executiveSummary:q,narrativa:ne,totals:{total:r,pago:m,pendente:f,vencido:b,taxaPago:_,taxaVencido:k,total7Dias:z},priorities:V.slice(0,4),insights:I,recomendacoes:G,rankingCentros:S.slice(0,5),tendenciaMensal:T,respostas:ae,quickQuestions:Object.keys(ae)}}function Bs({voltar:t,empresaId:a,mostrarAviso:o}){var ot,bt,Rt,Gt,At,Qe,mt,Bt,qt,ut,vt,jt;function r(s){return`${Number(s||0).toFixed(1)}%`}function n(s,v){if(!s||v==="pago")return!1;const O=new Date;O.setHours(0,0,0,0);const se=new Date(s+"T00:00:00");return se.setHours(0,0,0,0),se<O}function d(s){return s?String(s).slice(0,7):""}function l(){const s=new Date;return`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`}function m(s){if(!s)return"";const[v,O]=s.split("-").map(Number),se=new Date(v,O-2,1);return`${se.getFullYear()}-${String(se.getMonth()+1).padStart(2,"0")}`}function f(s){if(!s)return"Todos";const[v,O]=s.split("-").map(Number);return new Date(v,O-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}function b(s){return s>=50?"#dc3545":s>=20?"#f59f00":"#12b886"}function _(s){return s==="critico"?"🚨":s==="risco"?"⚠️":s==="queda"?"✅":s==="alta"?"📈":s==="acao"?"🎯":s==="previsao"?"🔮":s==="meta"?"🎯":"ℹ️"}const[k,S]=c.useState([]),[g,T]=c.useState([]),[P,z]=c.useState([]),[H,re]=c.useState(!0),[V,q]=c.useState(l()),[ne,G]=c.useState("todas"),[ae,I]=c.useState(""),[M,Y]=c.useState(""),[je,ce]=c.useState("dre"),[he,Ce]=c.useState("");c.useEffect(()=>{oe()},[a]);async function oe(){if(!a){S([]),T([]),z([]),re(!1);return}re(!0);const{data:s,error:v}=await D.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",a).order("data_vencimento",{ascending:!0}),{data:O,error:se}=await D.from("df_centros_custo").select("*").eq("empresa_id",a).order("nome",{ascending:!0}),{data:ye,error:ve}=await D.from("df_filiais").select("*").eq("empresa_id",a).order("nome",{ascending:!0});v&&(o==null||o(v.message,"erro")),se&&(o==null||o(se.message,"erro")),ve&&(o==null||o(ve.message,"erro")),S((s||[]).filter(ge=>!ge.excluido_em&&!ge.deleted_at)),T(O||[]),z(ye||[]),re(!1)}const y=c.useMemo(()=>k.filter(s=>ne==="pendentes"?s.status!=="pago":ne==="pagas"?s.status==="pago":ne==="vencidas"?n(s.data_vencimento,s.status):!0).filter(s=>V?d(s.data_vencimento)===V:!0).filter(s=>ae?s.centro_custo_id===ae:!0).filter(s=>M?s.filial_id===M:!0),[k,V,ne,ae,M]),pe=c.useMemo(()=>{const s=m(V||l());return k.filter(v=>d(v.data_vencimento)===s).filter(v=>ae?v.centro_custo_id===ae:!0).filter(v=>M?v.filial_id===M:!0)},[k,V,ae,M]),A=y.reduce((s,v)=>s+Number(v.valor||0),0),Z=y.filter(s=>s.status==="pago").reduce((s,v)=>s+Number(v.valor||0),0),K=y.filter(s=>n(s.data_vencimento,s.status)).reduce((s,v)=>s+Number(v.valor||0),0),Q=A-Z,N=pe.reduce((s,v)=>s+Number(v.valor||0),0),J=A-N,Me=N?J/N*100:0,_e=N?Math.max(A+J,0):A,we=Number(String(he||"").replace(",",".")),U=!isNaN(we)&&we>0,fe=U?A/we*100:0,Ae=A?Z/A*100:0,C=A?K/A*100:0,be=y.reduce((s,v)=>{const O=v.centro_custo_id||"sem-centro";return s[O]||(s[O]=[]),s[O].push(v),s},{}),ze=Object.keys(be).map(s=>{const v=be[s],O=g.find(ge=>ge.id===s),se=v.reduce((ge,Re)=>ge+Number(Re.valor||0),0),ye=v.filter(ge=>ge.status==="pago").reduce((ge,Re)=>ge+Number(Re.valor||0),0),ve=v.filter(ge=>n(ge.data_vencimento,ge.status)).reduce((ge,Re)=>ge+Number(Re.valor||0),0);return{id:s,nome:(O==null?void 0:O.nome)||"Sem centro",total:se,pago:ye,pendente:se-ye,vencido:ve,percentual:A?se/A*100:0}}).sort((s,v)=>v.total-s.total),me=ze[0]||null,$=((ot=ze[0])==null?void 0:ot.total)||0,ie=g.find(s=>s.id===ae),et=y.filter(s=>s.centro_custo_id).length,st=y.filter(s=>!s.centro_custo_id).length,Oe=y.length?et/y.length*100:0,It=ze.find(s=>s.id==="sem-centro"),Ye=!!(It&&It.total>0),lt=[...y].sort((s,v)=>Number(v.valor||0)-Number(s.valor||0)).slice(0,5);let Be=100;K>0&&(Be-=30),(me==null?void 0:me.percentual)>=60&&(Be-=20),Oe<40&&y.length>0&&(Be-=25),J>0&&Me>=20&&(Be-=15),U&&fe>100&&(Be-=25),Q>Z&&A>0&&(Be-=10),Be=Math.max(Be,0);let pt={titulo:"Saúde financeira boa",etiqueta:"Saudável",emoji:"✅",cor:"#12b886",descricao:"Os indicadores estão equilibrados para o filtro atual."};Be<75&&Be>=45&&(pt={titulo:"Saúde financeira em atenção",etiqueta:"Atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Existem pontos que merecem acompanhamento: concentração, variação mensal, meta e classificação."}),Be<45&&(pt={titulo:"Saúde financeira crítica",etiqueta:"Crítico",emoji:"🚨",cor:"#dc3545",descricao:"Há sinais relevantes de risco. Priorize vencidos, metas estouradas, concentração e contas sem centro."});let _t={titulo:"Qualidade dos dados boa",emoji:"✅",cor:"#12b886",descricao:"A maioria das contas está classificada por centro de custo."};Oe<80&&Oe>=40&&(_t={titulo:"Qualidade dos dados em atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Parte das contas ainda está sem centro. A análise pode ficar parcialmente limitada."}),Oe<40&&y.length>0&&(_t={titulo:"Qualidade dos dados crítica",emoji:"🚨",cor:"#dc3545",descricao:"Grande parte das contas está sem centro. Classifique as despesas para liberar análises confiáveis."});const Xe=[];if(Oe<40&&y.length>0&&Xe.push({tipo:"critico",texto:"A análise gerencial está limitada porque a maior parte das despesas está sem centro de custo. Classifique os lançamentos antes de tomar decisões estratégicas."}),U&&(fe>100?Xe.push({tipo:"meta",texto:`Meta mensal estourada: o total filtrado atingiu ${r(fe)} da meta de ${te(we)}.`}):fe>=80?Xe.push({tipo:"meta",texto:`Atenção à meta: você já consumiu ${r(fe)} da meta mensal.`}):Xe.push({tipo:"meta",texto:`Meta sob controle: consumo atual em ${r(fe)} da meta mensal.`})),K>0){const s=y.filter(v=>n(v.data_vencimento,v.status)).length;Xe.push({tipo:"risco",texto:`Contas vencidas detectadas: ${s} conta(s), somando ${te(K)}. Priorize pagamento para evitar juros.`})}!ae&&(me==null?void 0:me.percentual)>=60&&me.id!=="sem-centro"&&Xe.push({tipo:"risco",texto:`Alto risco de concentração: ${me.nome} representa ${r(me.percentual)} dos custos filtrados.`}),V&&A>0&&(N===0?Xe.push({tipo:"previsao",texto:`${f(V)} tem ${te(A)} em contas. Ainda não há base anterior suficiente para tendência.`}):J>0?Xe.push({tipo:"alta",texto:`Crescimento de ${te(J)} frente a ${f(m(V))}, variação de ${r(Me)}.`}):J<0&&Xe.push({tipo:"queda",texto:`Redução de ${te(Math.abs(J))} frente ao mês anterior, queda de ${r(Math.abs(Me))}.`}),Xe.push({tipo:"previsao",texto:`Se o padrão continuar, o próximo mês pode fechar próximo de ${te(_e)}.`})),Xe.length===0&&Xe.push({tipo:"info",texto:"Nenhum alerta relevante encontrado para os filtros selecionados."});const Vt=c.useMemo(()=>{const s={};return k.forEach(v=>{if(ae&&v.centro_custo_id!==ae||M&&v.filial_id!==M)return;const O=d(v.data_vencimento);if(!O)return;s[O]||(s[O]={mes:O,total:0,pago:0,pendente:0,vencido:0});const se=Number(v.valor||0);s[O].total+=se,v.status==="pago"?s[O].pago+=se:s[O].pendente+=se,n(v.data_vencimento,v.status)&&(s[O].vencido+=se)}),Object.values(s).sort((v,O)=>v.mes.localeCompare(O.mes)).slice(-6)},[k,ae,M]),gt=c.useMemo(()=>{const s={};return y.forEach(v=>{var ve;const O=v.filial_id||"sem-filial",se=((ve=v.df_filiais)==null?void 0:ve.nome)||"Sem filial";s[O]||(s[O]={id:O,nome:se,total:0,pago:0,pendente:0,vencido:0,qtd:0});const ye=Number(v.valor||0);s[O].total+=ye,s[O].qtd+=1,v.status==="pago"?s[O].pago+=ye:s[O].pendente+=ye,n(v.data_vencimento,v.status)&&(s[O].vencido+=ye)}),Object.values(s).map(v=>({...v,percentual:A?v.total/A*100:0})).sort((v,O)=>O.total-v.total)},[y,A]),ea=c.useMemo(()=>{const s=Z,v=Q,O=K,se=_e,ye=A?Math.max(0,100-C):100;return[{linha:"Realizado",valor:s,descricao:"Contas pagas no filtro"},{linha:"A realizar",valor:v,descricao:"Pendências abertas"},{linha:"Risco vencido",valor:O,descricao:"Parte atrasada que exige ação"},{linha:"Previsão próximo mês",valor:se,descricao:"Tendência gerencial simples"},{linha:"Eficiência",valor:ye,descricao:"Quanto menor o vencido, melhor",percentual:!0}]},[Z,Q,K,_e,A,C]),Se=c.useMemo(()=>[{name:"Pago",value:Z,color:"#12b886"},{name:"Pendente",value:Math.max(Q-K,0),color:"#f59f00"},{name:"Vencido",value:K,color:"#dc3545"}].filter(s=>s.value>0),[Z,Q,K]),X=c.useMemo(()=>ze.slice(0,6).map(s=>({nome:s.nome.length>14?`${s.nome.slice(0,14)}…`:s.nome,total:Number(s.total.toFixed(2))})),[ze]),L=c.useMemo(()=>{const s=y.length?A/y.length:0,v=y.filter(De=>De.status!=="pago"),O=y.filter(De=>n(De.data_vencimento,De.status)),se=lt[0]||null,ye=se&&A?Number(se.valor||0)/A*100:0,ve=lt.slice(0,3).reduce((De,Ze)=>De+Number(Ze.valor||0),0),ge=A?ve/A*100:0,le=y.filter(De=>{var Ze;return(Ze=De.df_contas_recorrentes)==null?void 0:Ze.tipo_recorrencia}).reduce((De,Ze)=>De+Number(Ze.valor||0),0),Te=A?le/A*100:0,tt=(me==null?void 0:me.percentual)||0,xe=A?(Q+K)/A*100:0,dt=y.filter(De=>s>0&&Number(De.valor||0)>=s*2.5).sort((De,Ze)=>Number(Ze.valor||0)-Number(De.valor||0)).slice(0,5);let Ct="baixo",ft="#12b886",xt="Inteligência financeira saudável";Be<45||xe>=55||C>=25?(Ct="alto",ft="#dc3545",xt="Inteligência financeira em alerta"):(Be<75||xe>=30||tt>=50||Oe<80)&&(Ct="medio",ft="#f59f00",xt="Inteligência financeira em atenção");const Je=[];O.length>0&&Je.push(`Priorizar ${O.length} conta(s) vencida(s), somando ${te(K)}.`),Oe<80&&st>0&&Je.push(`Classificar ${st} conta(s) sem centro para aumentar a confiabilidade do motor.`),me&&me.id!=="sem-centro"&&tt>=50&&Je.push(`Revisar concentração em ${me.nome}, que representa ${r(tt)} do filtro.`),U&&fe>=80&&Je.push(fe>100?"Revisar meta mensal: o limite foi ultrapassado.":"Acompanhar meta mensal: consumo acima de 80%."),dt.length>0&&Je.push(`Auditar ${dt.length} lançamento(s) acima de 2,5x o ticket médio.`),Je.length===0&&Je.push("Manter acompanhamento semanal dos indicadores e revisar centros de maior valor.");const Ft=[{label:"Próximo mês",value:_e,sub:"projeção por tendência simples"},{label:"Risco em aberto",value:Q+K,sub:`${r(xe)} do total filtrado`},{label:"Recorrente",value:le,sub:`${r(Te)} do total`},{label:"Top 3 despesas",value:ve,sub:`${r(ge)} do total`}];return{titulo:xt,nivel:Ct,cor:ft,ticketMedio:s,riscoCaixa:xe,paretoTop3:ve,paretoTop3Percentual:ge,percentualRecorrente:Te,maiorDespesa:se,maiorDespesaPercentual:ye,anomalias:dt,acoes:Je,previsoes:Ft,pendentesAbertas:v.length}},[y,A,Q,K,C,Be,me,Oe,st,U,fe,lt,_e]),B=c.useMemo(()=>Er({contas:k,contasFiltradas:y}),[k,y]),ue=c.useMemo(()=>{const s=Vt.length?Vt:[],v=s.map(Je=>Number(Je.total||0)),O=v.length?v.reduce((Je,Ft)=>Je+Ft,0)/v.length:A,se=v.length?v[v.length-1]:A,ye=v.length>1?v[v.length-2]:se,ve=se-ye,ge=A?Math.min((K+Q)/A,1.5):0,Re=Math.max(se+ve*.35,0),le=Math.max(Re+ve*.55,0),Te=Math.max(le+ve*.75,0),tt=Math.min(100,Math.max(0,C+ge*35+((me==null?void 0:me.percentual)>=60?12:0)+(Oe<80?10:0))),xe=tt>=65?"Alto":tt>=35?"Moderado":"Baixo",dt=tt>=65?"#dc3545":tt>=35?"#f59f00":"#12b886",Ct=ve>0?"alta":ve<0?"queda":"estável",ft=U?{meta:we,atual:A,falta:Math.max(we-A,0),projetado:Re,chance:Re<=we?"Alta":Re<=we*1.15?"Média":"Baixa",percentualProjetado:we?Re/we*100:0}:null,xt=[];return tt>=65&&xt.push("Risco projetado alto para os próximos 30 dias. Priorize vencidos e reduza concentração."),Te>Math.max(O,1)*1.25&&xt.push("Forecast 90 dias indica possível aceleração de despesas acima da média histórica."),ft&&ft.percentualProjetado>100&&xt.push("A previsão de 30 dias pode ultrapassar a meta mensal cadastrada."),Oe<80&&y.length>0&&xt.push("A qualidade da previsão melhora após classificar contas sem centro de custo."),xt.length===0&&xt.push("Cenário projetado controlado para os filtros atuais."),{mediaMovel:O,variacao:ve,tendencia:Ct,previsao30:Re,previsao60:le,previsao90:Te,riscoProjetado:tt,statusRisco:xe,corRisco:dt,metaForecast:ft,alertas:xt,serie:[...s.map(Je=>({mes:Je.mes,realizado:Je.total,previsto:null})),{mes:"+30d",realizado:null,previsto:Re},{mes:"+60d",realizado:null,previsto:le},{mes:"+90d",realizado:null,previsto:Te}]}},[Vt,A,K,Q,C,me,Oe,U,we,y.length]);function Pe(){return y.map(s=>{var v,O,se;return[s.descricao||"Sem descrição",Number(s.valor||0),ro(s.data_vencimento),n(s.data_vencimento,s.status)?"vencido":s.status,((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro",((O=s.df_filiais)==null?void 0:O.nome)||"Sem filial",((se=s.df_contas_recorrentes)==null?void 0:se.tipo_recorrencia)||"Não recorrente"]})}function We(){var ge,Re,le,Te,tt;const s=ea.map(xe=>`
      <tr>
        <td>${Ve(xe.linha)}</td>
        <td class="valor">${xe.percentual?r(xe.valor):te(xe.valor)}</td>
        <td>${Ve(xe.descricao)}</td>
      </tr>
    `).join(""),v=Pe().map(xe=>`
      <tr>${xe.map((dt,Ct)=>`<td class="${Ct===1?"valor":""}">${Ct===1?te(dt):Ve(dt)}</td>`).join("")}</tr>
    `).join(""),O=ze.map(xe=>`
      <tr>
        <td>${Ve(xe.nome)}</td>
        <td class="valor">${te(xe.total)}</td>
        <td class="valor">${te(xe.pago)}</td>
        <td class="valor">${te(xe.pendente)}</td>
        <td class="valor">${te(xe.vencido)}</td>
        <td class="valor">${r(xe.percentual)}</td>
      </tr>
    `).join(""),se=B.priorities.map(xe=>`
      <tr>
        <td>${Ve(xe.level)}</td>
        <td>${Ve(xe.title)}</td>
        <td>${Ve(xe.description)}</td>
        <td class="valor">${Ve(xe.impact)}</td>
        <td>${Ve(xe.action)}</td>
      </tr>
    `).join(""),ye=B.recomendacoes.map((xe,dt)=>`
      <div class="insight"><strong>${dt+1}.</strong> ${Ve(xe)}</div>
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
              Gerado em ${new Date().toLocaleString("pt-BR")} • ${Ve(f(V||l()))}<br />
              Centro: ${Ve(ae?(ie==null?void 0:ie.nome)||"Selecionado":"Todos")} • Filial: ${Ve(M?((ge=P.find(xe=>xe.id===M))==null?void 0:ge.nome)||"Selecionada":"Todas")} • Status: ${Ve(ne)}
            </div>
            <div class="score">Score Copilot: ${B.score}/100 • ${Ve(B.status.label)}</div>
          </div>
          <h2>Executive AI Summary</h2>
          <div class="insight">${Ve(B.executiveSummary)}</div>
          <h2>AI Narrative & Insights 11.8</h2>
          <div class="narrative"><strong>Parecer executivo contextual</strong>${Ve(((Re=B.narrativa)==null?void 0:Re.parecer)||B.executiveSummary)}</div>
          <div class="narrative"><strong>Liquidez</strong>${Ve(((le=B.narrativa)==null?void 0:le.liquidez)||"")}</div>
          <div class="narrative"><strong>Concentração</strong>${Ve(((Te=B.narrativa)==null?void 0:Te.concentracao)||"")}</div>
          <div class="narrative"><strong>Curto prazo</strong>${Ve(((tt=B.narrativa)==null?void 0:tt.curtoPrazo)||"")}</div>
          <div class="cards">
            <div class="card"><span class="label">Total</span><span class="numero">${te(A)}</span></div>
            <div class="card"><span class="label">Pago</span><span class="numero">${te(Z)}</span></div>
            <div class="card"><span class="label">Pendente</span><span class="numero">${te(Q)}</span></div>
            <div class="card"><span class="label">Vencido</span><span class="numero">${te(K)}</span></div>
          </div>
          <h2>Smart Priority Engine</h2>
          <table><thead><tr><th>Nível</th><th>Prioridade</th><th>Leitura</th><th>Impacto</th><th>Ação</th></tr></thead><tbody>${se||'<tr><td colspan="5">Nenhuma prioridade crítica encontrada.</td></tr>'}</tbody></table>
          <h2>Recomendações acionáveis</h2>
          ${ye}
          <h2>DRE Gerencial</h2>
          <table><thead><tr><th>Linha</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>${s}</tbody></table>
          <h2>Insights executivos</h2>
          ${Xe.map(xe=>`<div class="insight">${Ve(xe.texto)}</div>`).join("")}
          <h2>Ranking por centro</h2>
          <table><thead><tr><th>Centro</th><th>Total</th><th>Pago</th><th>Pendente</th><th>Vencido</th><th>Participação</th></tr></thead><tbody>${O||'<tr><td colspan="6">Nenhum centro encontrado.</td></tr>'}</tbody></table>
          <h2>Contas filtradas</h2>
          <table><thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Centro</th><th>Filial</th><th>Recorrência</th></tr></thead><tbody>${v||'<tr><td colspan="7">Nenhuma conta encontrada.</td></tr>'}</tbody></table>
          <div class="footer">Relatório gerado pelo Sistema Dona Flor Financeiro.</div>
        </body>
      </html>`;js(ve,()=>o==null?void 0:o("Não foi possível abrir a impressão do relatório.","erro"))}function He(){const s=["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],v=Pe().map(O=>[O[0],Number(O[1]||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}),O[2],O[3],O[4],O[5],O[6]]);bs({filename:"relatorio-financeiro-dona-flor.csv",headers:s,rows:v})}function qe(){var v,O,se,ye,ve,ge,Re;const s=[{name:"Resumo",rows:[["Relatório Avançado 11.8 - AI Narrative & Insights"],["Gerado em",new Date().toLocaleString("pt-BR")],["Mês",V||"Todos"],["Centro",ae?(ie==null?void 0:ie.nome)||"Selecionado":"Todos"],["Filial",M?((v=P.find(le=>le.id===M))==null?void 0:v.nome)||"Selecionada":"Todas"],[],["Indicador","Valor"],["Total",A],["Pago",Z],["Pendente",Q],["Vencido",K],["Score Copilot IA",B.score],["Status Copilot IA",B.status.label],["Nível inteligência 11.3",L.nivel],["Risco caixa %",L.riscoCaixa],["Ticket médio",L.ticketMedio]]},{name:"DRE",rows:[["Linha","Valor","Descrição"],...ea.map(le=>[le.linha,le.valor,le.descricao])]},{name:"Contas",rows:[["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],...Pe()]},{name:"Ranking",rows:[["Centro","Total","Pago","Pendente","Vencido","Participação"],...ze.map(le=>[le.nome,le.total,le.pago,le.pendente,le.vencido,`${r(le.percentual)}`])]},{name:"Inteligencia 11.3",rows:[["Indicador","Valor","Observação"],["Nível",L.nivel,L.titulo],["Ticket médio",L.ticketMedio,"Média por conta filtrada"],["Risco caixa %",L.riscoCaixa,"Pendente + vencido sobre total"],["Top 3 despesas",L.paretoTop3,`${r(L.paretoTop3Percentual)} do total`],["Recorrente %",L.percentualRecorrente,"Peso das contas recorrentes"],[],["Ações recomendadas"],...L.acoes.map((le,Te)=>[Te+1,le])]},{name:"Copilot IA 11.8",rows:[["Executive AI Summary"],[B.executiveSummary],[],["Score",B.score,B.status.label],[],["AI Narrative 11.8"],["Parecer contextual",((O=B.narrativa)==null?void 0:O.parecer)||""],["Liquidez",((se=B.narrativa)==null?void 0:se.liquidez)||""],["Concentração",((ye=B.narrativa)==null?void 0:ye.concentracao)||""],["Curto prazo",((ve=B.narrativa)==null?void 0:ve.curtoPrazo)||""],["Comportamento",((ge=B.narrativa)==null?void 0:ge.comportamento)||""],[],["Anomalias contextuais"],...(((Re=B.narrativa)==null?void 0:Re.anomalias)||[]).map((le,Te)=>[Te+1,le]),[],["Total",B.totals.total],["Pago",B.totals.pago],["Pendente",B.totals.pendente],["Vencido",B.totals.vencido],[],["Smart Priority Engine"],["Nível","Prioridade","Descrição","Impacto","Ação"],...B.priorities.map(le=>[le.level,le.title,le.description,le.impact,le.action]),[],["Recomendações acionáveis"],...B.recomendacoes.map((le,Te)=>[Te+1,le]),[],["Drill-down analytics"],["Centro","Total","Pendente","Vencido","Peso","Risco"],...B.rankingCentros.map(le=>[le.nome,le.total,le.pendente,le.vencido,`${le.peso}%`,`${le.risco}%`])]},{name:"Preditiva 11.4",rows:[["Indicador","Valor","Observação"],["Forecast 30 dias",ue.previsao30,ue.tendencia],["Forecast 60 dias",ue.previsao60,"Projeção intermediária"],["Forecast 90 dias",ue.previsao90,"Projeção estendida"],["Risco projetado %",ue.riscoProjetado,ue.statusRisco],["Média móvel",ue.mediaMovel,"Histórico filtrado"],["Variação base",ue.variacao,"Último mês vs anterior"],[],["Alertas preditivos"],...ue.alertas.map((le,Te)=>[Te+1,le])]}];Sr("relatorio-avancado-dona-flor.xlsx",ys(s))}function Ke(){q(""),G("todas"),I(""),Y(""),Ce("")}const Ge=Oe<40?"A análise gerencial está limitada por falta de classificação em centros de custo.":K>0?"Existem pendências vencidas que devem ser priorizadas.":U&&fe>100?"A meta mensal foi ultrapassada no filtro atual.":J>0?"Os custos cresceram em relação ao mês anterior. Acompanhe os maiores centros.":"O cenário atual está controlado para os filtros selecionados.";return e.jsxs("div",{className:"relatorios-page",style:u.page,children:[e.jsx("style",{children:Os}),e.jsx("style",{children:Ls}),e.jsxs("div",{className:"relatorio-print-header",children:[e.jsx("h1",{children:"Relatório Financeiro Gerencial"}),e.jsx("p",{children:"Empresa: Dona Flor"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]}),e.jsxs("p",{children:["Centro: ",ae?(ie==null?void 0:ie.nome)||"Selecionado":"Todos"," • Filial: ",M?((bt=P.find(s=>s.id===M))==null?void 0:bt.nome)||"Selecionada":"Todas"," • Mês: ",V||"Todos"," • Status: ",ne]})]}),e.jsx("div",{className:"relatorio-print-footer",children:"Relatório gerado pelo Sistema Dona Flor Financeiro"}),e.jsxs("header",{className:"no-print",style:u.hero,children:[e.jsxs("div",{children:[e.jsxs("div",{style:u.actionsTop,children:[e.jsx("button",{style:u.btnVoltar,onClick:t,children:"← Voltar"}),e.jsx("button",{style:u.btnExcel,onClick:qe,children:"Excel"}),e.jsx("button",{style:u.btnPDF,onClick:We,children:"PDF"}),e.jsx("button",{style:u.btnCSV,onClick:He,children:"CSV"})]}),e.jsx("h1",{style:u.titulo,children:"📊 Relatórios Gerenciais"}),e.jsx("p",{style:u.descricaoTela,children:"Fase 11.8: AI Narrative & Insights com parecer executivo contextual, anomalias e recomendações inteligentes."})]}),e.jsxs("div",{style:u.heroBadge,children:[e.jsx("span",{children:pt.emoji}),e.jsxs("strong",{children:[Be,"/100"]}),e.jsx("small",{children:pt.etiqueta})]})]}),e.jsxs("section",{className:"no-print relatorio-sticky-filtros",style:u.filtrosBox,children:[e.jsxs("div",{style:u.filtroHeader,children:[e.jsx("strong",{children:"🎛️ Filtros"}),e.jsxs("span",{style:u.filtroResumo,children:[f(V||l())," • ",ae?(ie==null?void 0:ie.nome)||"Centro selecionado":"Todos os centros"," • ",M?((Rt=P.find(s=>s.id===M))==null?void 0:Rt.nome)||"Filial selecionada":"Todas as filiais"]}),e.jsx("button",{style:u.btnLimpar,onClick:Ke,children:"Limpar"})]}),e.jsxs("div",{style:u.filtrosGrid,children:[e.jsx("input",{style:u.input,placeholder:"Meta mensal. Ex: 5000",value:he,onChange:s=>Ce(s.target.value)}),e.jsxs("select",{style:u.input,value:ae,onChange:s=>I(s.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),g.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:u.input,value:M,onChange:s=>Y(s.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),P.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:u.input,value:je,onChange:s=>ce(s.target.value),children:[e.jsx("option",{value:"dre",children:"Visão DRE"}),e.jsx("option",{value:"graficos",children:"Visão Gráficos"}),e.jsx("option",{value:"filiais",children:"Visão Filiais"}),e.jsx("option",{value:"inteligencia",children:"Inteligência 11.3"}),e.jsx("option",{value:"preditiva",children:"Preditiva 11.4"}),e.jsx("option",{value:"copilot",children:"Copilot IA 11.8"})]}),e.jsx("input",{style:u.input,type:"month",value:V,onChange:s=>q(s.target.value)})]}),e.jsx("div",{style:u.filtros,children:[["todas","Todas"],["pendentes","Pendentes"],["pagas","Pagas"],["vencidas","Vencidas"]].map(([s,v])=>e.jsx("button",{style:ne===s?u.filtroAtivo:u.filtro,onClick:()=>G(s),children:v},s))})]}),H?e.jsx(qs,{}):e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:u.kpiGrid,children:[e.jsx(no,{titulo:"Total",valor:te(A),detalhe:`${y.length} conta(s)`,emoji:"💼",cor:"#364fc7",progresso:100}),e.jsx(no,{titulo:"Pago",valor:te(Z),detalhe:`${r(Ae)} do total`,emoji:"✅",cor:"#12b886",progresso:Ae}),e.jsx(no,{titulo:"Pendente",valor:te(Q),detalhe:A?`${r(Q/A*100)} das despesas`:"Sem pendência",emoji:"🟡",cor:"#f59f00",progresso:A?Q/A*100:0}),e.jsx(no,{titulo:"Vencido",valor:te(K),detalhe:K>0?`${r(C)} em atraso`:"Sem vencidos",emoji:"🚨",cor:"#dc3545",progresso:C})]}),e.jsxs("section",{style:u.advancedPanel,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"📈 Relatórios Avançados 11.1"}),e.jsx("p",{style:u.muted,children:"DRE gerencial, gráficos executivos, tendência, multiunidade, inteligência 11.3, preditiva 11.4 e AI Narrative 11.8."})]}),e.jsx("span",{style:u.badge,children:"Enterprise"})]}),je==="dre"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ie,{titulo:"DRE gerencial",emoji:"🧮",children:ea.map(s=>e.jsxs("div",{style:u.dreLinha,children:[e.jsxs("div",{style:u.dreTexto,children:[e.jsx("strong",{style:u.dreTitulo,children:s.linha}),e.jsx("small",{style:u.dreDescricao,children:s.descricao})]}),e.jsx("strong",{style:u.dreValor,children:s.percentual?r(s.valor):te(s.valor)})]},s.linha))}),e.jsx(Ie,{titulo:"Tendência 6 meses",emoji:"📉",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:220,children:e.jsxs(rr,{data:Vt,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"mes"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>te(s)}),e.jsx(oo,{type:"monotone",dataKey:"total",stroke:"#0d9488",strokeWidth:3,dot:!1}),e.jsx(oo,{type:"monotone",dataKey:"vencido",stroke:"#dc3545",strokeWidth:2,dot:!1})]})})})})]}),je==="graficos"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ie,{titulo:"Centros por valor",emoji:"📊",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:240,children:e.jsxs(jr,{data:X,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"nome"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>te(s)}),e.jsx(yr,{dataKey:"total",fill:"#0d9488",radius:[8,8,0,0]})]})})})}),e.jsx(Ie,{titulo:"Status financeiro",emoji:"🧭",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:240,children:e.jsxs(wr,{children:[e.jsx(kr,{data:Se,dataKey:"value",nameKey:"name",outerRadius:85,label:!0,children:Se.map(s=>e.jsx(Cr,{fill:s.color},s.name))}),e.jsx(ja,{formatter:s=>te(s)})]})})})})]}),je==="filiais"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ie,{titulo:"Ranking multiunidade",emoji:"🏢",children:[gt.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhuma filial encontrada nos filtros."}),gt.map((s,v)=>e.jsxs("div",{style:u.dreLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[v+1,". ",s.nome]}),e.jsxs("small",{children:[s.qtd," conta(s) • ",r(s.percentual)]})]}),e.jsx("strong",{children:te(s.total)})]},s.id))]}),e.jsxs(Ie,{titulo:"Insight executivo",emoji:"🧠",children:[e.jsx("p",{style:u.executivoTexto,children:gt[0]?`${gt[0].nome} concentra ${r(gt[0].percentual)} do total filtrado. Use esta leitura para comparar unidades e priorizar gestão.`:"Sem dados multiunidade para o filtro atual."}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx($e,{label:"Filiais",value:gt.length}),e.jsx($e,{label:"Maior unidade",value:((Gt=gt[0])==null?void 0:Gt.nome)||"-"}),e.jsx($e,{label:"Valor",value:gt[0]?te(gt[0].total):"-"})]})]})]}),je==="inteligencia"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ie,{titulo:L.titulo,emoji:"🧠",badge:L.nivel.toUpperCase(),badgeColor:L.cor,children:[e.jsx("p",{style:u.executivoTexto,children:"Motor 11.3 analisando risco de caixa, concentração, tendência, recorrência, Pareto e qualidade dos dados para os filtros atuais."}),e.jsx(Tt,{value:Be,color:L.cor}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx($e,{label:"Ticket médio",value:te(L.ticketMedio)}),e.jsx($e,{label:"Risco caixa",value:r(L.riscoCaixa)}),e.jsx($e,{label:"Pendências",value:L.pendentesAbertas})]})]}),e.jsxs(Ie,{titulo:"Previsões e Pareto",emoji:"🔮",children:[e.jsx("div",{style:u.compareGrid,children:L.previsoes.map(s=>e.jsx($e,{label:s.label,value:te(s.value),sub:s.sub},s.label))}),L.maiorDespesa&&e.jsxs("p",{style:u.muted,children:["Maior despesa: ",e.jsx("strong",{children:L.maiorDespesa.descricao})," representa ",r(L.maiorDespesaPercentual)," do total filtrado."]})]}),e.jsx(Ie,{titulo:"Ações recomendadas",emoji:"✅",children:e.jsx("div",{style:u.insightList,children:L.acoes.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:v+1}),e.jsx("p",{children:s})]},v))})}),e.jsxs(Ie,{titulo:"Anomalias financeiras",emoji:"🕵️",children:[L.anomalias.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhuma anomalia acima de 2,5x o ticket médio foi encontrada."}),L.anomalias.map(s=>{var v;return e.jsxs("div",{style:u.topItem,children:[e.jsx("div",{style:u.medalha,children:"!"}),e.jsxs("div",{style:u.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[ro(s.data_vencimento)," • ",((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro"]})]}),e.jsx("strong",{children:te(s.valor)})]},s.id)})]})]}),je==="copilot"&&e.jsxs("div",{style:u.advancedGrid,children:[e.jsxs(Ie,{titulo:"Executive AI Summary",emoji:"✨",badge:`${B.score}/100`,badgeColor:B.status.tone==="danger"?"#dc3545":B.status.tone==="warning"?"#f59f00":"#12b886",children:[e.jsx("p",{style:u.executivoTexto,children:B.executiveSummary}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx($e,{label:"Total",value:te(B.totals.total)}),e.jsx($e,{label:"Pendente",value:te(B.totals.pendente)}),e.jsx($e,{label:"Vencido",value:te(B.totals.vencido)})]})]}),e.jsxs(Ie,{titulo:"AI Narrative & Insights 11.8",emoji:"🧠",badge:"Contextual",badgeColor:"#7c3aed",children:[e.jsx("p",{style:u.executivoTexto,children:((At=B.narrativa)==null?void 0:At.parecer)||B.executiveSummary}),e.jsx("div",{style:u.insightList,children:[(Qe=B.narrativa)==null?void 0:Qe.liquidez,(mt=B.narrativa)==null?void 0:mt.concentracao,(Bt=B.narrativa)==null?void 0:Bt.curtoPrazo,(qt=B.narrativa)==null?void 0:qt.comportamento].filter(Boolean).map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"✦"}),e.jsx("p",{children:s})]},`${s}-${v}`))})]}),e.jsx(Ie,{titulo:"Anomalias contextuais",emoji:"⚠️",badge:`${((vt=(ut=B.narrativa)==null?void 0:ut.anomalias)==null?void 0:vt.length)||0} sinais`,badgeColor:"#dc3545",children:e.jsx("div",{style:u.insightList,children:(((jt=B.narrativa)==null?void 0:jt.anomalias)||[]).map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"!"}),e.jsx("p",{children:s})]},`${s}-${v}`))})}),e.jsx(Ie,{titulo:"Smart Priority Engine",emoji:"🚦",badge:`${B.priorities.length} ações`,badgeColor:"#0f766e",children:e.jsx("div",{style:u.insightList,children:B.priorities.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:v+1}),e.jsxs("p",{children:[e.jsx("strong",{children:s.title}),e.jsx("br",{}),s.description,e.jsx("br",{}),e.jsxs("small",{children:[s.level," impacto • ",s.impact," • ",s.action]})]})]},`${s.title}-${v}`))})}),e.jsx(Ie,{titulo:"Recomendações acionáveis",emoji:"✅",children:e.jsx("div",{style:u.insightList,children:B.recomendacoes.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"✓"}),e.jsx("p",{children:s})]},`${s}-${v}`))})}),e.jsxs(Ie,{titulo:"Drill-down analytics",emoji:"🔎",children:[B.rankingCentros.length===0&&e.jsx("p",{style:u.vazio,children:"Sem centros suficientes para análise."}),B.rankingCentros.map(s=>e.jsxs("div",{style:u.itemGrafico,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:te(s.total)})]}),e.jsx(Tt,{value:Math.max(s.peso,4),color:b(s.peso)}),e.jsxs("small",{children:[s.peso,"% do recorte • risco ",s.risco,"% • vencido ",te(s.vencido)]})]},s.nome))]})]})]}),e.jsxs("section",{style:u.dashboardGrid,children:[e.jsxs(Ie,{titulo:"Resumo executivo",emoji:"📌",destaque:!0,children:[e.jsx("p",{style:u.executivoTexto,children:Ge}),e.jsxs("div",{style:u.miniStats,children:[e.jsx($e,{label:"Mês",value:f(V||l())}),e.jsx($e,{label:"Centro",value:ae?(ie==null?void 0:ie.nome)||"Selecionado":"Todos"}),e.jsx($e,{label:"Status",value:ne})]})]}),e.jsxs(Ie,{titulo:pt.titulo,emoji:pt.emoji,badge:pt.etiqueta,badgeColor:pt.cor,children:[e.jsx("p",{style:u.muted,children:pt.descricao}),e.jsx(Tt,{value:Be,color:pt.cor}),e.jsxs("small",{children:[Be,"/100 pontos de saúde financeira"]})]}),e.jsxs(Ie,{titulo:_t.titulo,emoji:_t.emoji,badge:r(Oe),badgeColor:_t.cor,children:[e.jsx("p",{style:u.muted,children:_t.descricao}),e.jsx(Tt,{value:Oe,color:_t.cor}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsx($e,{label:"Total",value:y.length}),e.jsx($e,{label:"Com centro",value:et}),e.jsx($e,{label:"Sem centro",value:st})]})]}),e.jsx(Ie,{titulo:"Comparativo mensal",emoji:"📅",children:e.jsxs("div",{style:u.compareGrid,children:[e.jsx($e,{label:"Mês atual",value:te(A),sub:f(V||l())}),e.jsx($e,{label:"Mês anterior",value:te(N),sub:f(m(V||l()))}),e.jsx($e,{label:"Variação",value:`${J>0?"↑ +":J<0?"↓ ":""}${te(J)}`,sub:r(Me)}),e.jsx($e,{label:"Previsão",value:te(_e),sub:"próximo mês"})]})})]}),e.jsxs("section",{style:u.predictivePanel,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🔮 Predictive Intelligence Layer 11.4"}),e.jsx("p",{style:u.muted,children:"Forecast financeiro 30/60/90 dias, risco projetado e leitura preditiva da meta."})]}),e.jsx("span",{style:{...u.badge,color:ue.corRisco},children:ue.statusRisco})]}),e.jsxs("div",{style:u.predictiveGrid,children:[e.jsx($e,{label:"Forecast 30d",value:te(ue.previsao30),sub:ue.tendencia}),e.jsx($e,{label:"Forecast 60d",value:te(ue.previsao60),sub:"projeção"}),e.jsx($e,{label:"Forecast 90d",value:te(ue.previsao90),sub:"cenário"}),e.jsx($e,{label:"Risco projetado",value:`${r(ue.riscoProjetado)}`,sub:ue.statusRisco})]}),e.jsx(Tt,{value:ue.riscoProjetado,color:ue.corRisco}),e.jsxs("div",{style:u.advancedGrid,children:[e.jsx(Ie,{titulo:"Curva preditiva",emoji:"📈",children:e.jsx("div",{style:u.chartBox,children:e.jsx(va,{width:"100%",height:230,children:e.jsxs(rr,{data:ue.serie,children:[e.jsx(so,{strokeDasharray:"3 3"}),e.jsx(lo,{dataKey:"mes"}),e.jsx(co,{}),e.jsx(ja,{formatter:s=>s==null?"-":te(s)}),e.jsx(oo,{type:"monotone",dataKey:"realizado",stroke:"#0d9488",strokeWidth:3,connectNulls:!0,dot:!1}),e.jsx(oo,{type:"monotone",dataKey:"previsto",stroke:"#7c3aed",strokeWidth:3,strokeDasharray:"6 4",connectNulls:!0,dot:!0})]})})})}),e.jsxs(Ie,{titulo:"Alertas preditivos",emoji:"🚦",children:[e.jsx("div",{style:u.insightList,children:ue.alertas.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:"🔎"}),e.jsx("p",{children:s})]},v))}),ue.metaForecast&&e.jsxs("div",{style:u.metaForecastBox,children:[e.jsx("strong",{children:"🎯 Meta forecast"}),e.jsxs("small",{children:["Chance de cumprir: ",ue.metaForecast.chance]}),e.jsxs("small",{children:["Falta: ",te(ue.metaForecast.falta)]}),e.jsx(Tt,{value:Math.min(ue.metaForecast.percentualProjetado,100),color:ue.metaForecast.percentualProjetado>100?"#dc3545":"#12b886"})]})]})]})]}),Ye&&e.jsxs("section",{className:"print-card",style:u.cardAlerta,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🚨 Ação prioritária"}),e.jsxs("p",{children:[r(It.percentual)," das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise."]})]}),e.jsx("button",{className:"no-print",style:u.btnAcao,onClick:t,children:"Ir para contas"})]}),U&&e.jsxs("section",{className:"print-card",style:u.cardMeta,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsx("strong",{children:"🎯 Meta mensal"}),e.jsx("span",{style:u.badge,children:r(fe)})]}),e.jsxs("p",{children:["Meta: ",te(we)," • Atual: ",te(A)]}),e.jsx(Tt,{value:Math.min(fe,100),color:fe>100?"#dc3545":fe>=80?"#f59f00":"#12b886"})]}),e.jsxs("section",{style:u.twoColumns,children:[e.jsx(Ie,{titulo:"Insights automáticos",emoji:"💡",children:e.jsx("div",{style:u.insightList,children:Xe.map((s,v)=>e.jsxs("div",{style:u.insightItem,children:[e.jsx("span",{style:u.insightEmoji,children:_(s.tipo)}),e.jsx("p",{children:s.texto})]},v))})}),!ae&&ze.length>0&&e.jsx(Ie,{titulo:"Distribuição por centro",emoji:"📊",children:ze.slice(0,5).map(s=>e.jsxs("div",{style:u.itemGrafico,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:r(s.percentual)})]}),e.jsx(Tt,{value:Math.max(s.percentual,4),color:b(s.percentual)}),e.jsxs("small",{children:[te(s.total)," ",s.id==="sem-centro"&&e.jsx("b",{style:u.alertaTexto,children:" • Classificar"})]})]},s.id))})]}),e.jsxs("section",{style:u.twoColumns,children:[lt.length>0&&e.jsx(Ie,{titulo:"Top despesas",emoji:"🔥",children:lt.map((s,v)=>{var O;return e.jsxs("div",{style:u.topItem,children:[e.jsx("div",{style:u.medalha,children:v+1}),e.jsxs("div",{style:u.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[ro(s.data_vencimento)," • ",((O=s.df_centros_custo)==null?void 0:O.nome)||"Sem centro"]})]}),e.jsx("strong",{children:te(s.valor)})]},s.id)})}),e.jsx(Ie,{titulo:"Resultado do filtro",emoji:"🧾",children:e.jsxs("div",{style:u.resultGrid,children:[e.jsx($e,{label:"Centros",value:ze.length}),e.jsx($e,{label:"Contas",value:y.length}),e.jsx($e,{label:"Dominante",value:me?me.nome:"-",sub:me?r(me.percentual):""})]})})]}),!ae&&e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"🏆 Ranking por Centro"}),ze.length===0&&e.jsx("p",{style:u.vazio,children:"Nenhum dado encontrado."}),e.jsx("div",{style:u.rankingGrid,children:ze.map((s,v)=>e.jsxs("div",{className:"print-card",style:u.cardRanking,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[v+1,". ",s.nome,s.id==="sem-centro"?" ⚠️":""]}),v===0&&e.jsx("small",{style:u.maiorCusto,children:"🔝 Maior custo"}),e.jsxs("small",{children:[r(s.percentual)," do total"]})]}),e.jsx("strong",{children:te(s.total)})]}),e.jsx(Tt,{value:Math.max($?s.total/$*100:0,4),color:b(s.percentual)}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",te(s.pago)]}),e.jsxs("small",{children:["Pend: ",te(s.pendente)]}),e.jsxs("small",{children:["Venc: ",te(s.vencido)]})]})]},s.id))})]}),ae&&e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"📊 Resumo do Centro"}),e.jsxs("div",{className:"print-card",style:u.cardRanking,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("strong",{children:(ie==null?void 0:ie.nome)||"Centro selecionado"}),e.jsx("strong",{children:te(A)})]}),e.jsxs("div",{style:u.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",te(Z)]}),e.jsxs("small",{children:["Pend: ",te(Q)]}),e.jsxs("small",{children:["Venc: ",te(K)]})]})]})]}),e.jsxs("section",{style:u.bloco,children:[e.jsx("h2",{style:u.subtitulo,children:"📄 Contas do relatório"}),e.jsx("div",{style:u.contasGrid,children:y.map(s=>{var v;return e.jsxs("div",{className:"print-card",style:u.cardConta,children:[e.jsxs("div",{style:u.cardLinha,children:[e.jsx("strong",{children:s.descricao}),e.jsx("span",{children:te(s.valor)})]}),e.jsxs("small",{children:[ro(s.data_vencimento)," • ",((v=s.df_centros_custo)==null?void 0:v.nome)||"Sem centro"," • ",n(s.data_vencimento,s.status)?"VENCIDO":s.status]})]},s.id)})})]})]})]})}function qs(){return e.jsxs("div",{style:u.skeletonArea,"aria-busy":"true","aria-label":"Carregando relatório",children:[e.jsx("section",{style:u.skeletonGrid,children:[1,2,3,4].map(t=>e.jsx("div",{style:u.skeletonCard},t))}),e.jsxs("section",{style:u.skeletonPanel,children:[e.jsx("div",{style:u.skeletonLineGrande}),e.jsx("div",{style:u.skeletonLine}),e.jsx("div",{style:u.skeletonLineCurta})]}),e.jsx("section",{style:u.skeletonGrid,children:[1,2].map(t=>e.jsx("div",{style:u.skeletonCardAlto},t))})]})}function Ve(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let r=0;r<8;r+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Ie({titulo:t,emoji:a,badge:o,badgeColor:r="#0d9488",children:n,destaque:d}){return e.jsxs("section",{className:"print-card",style:d?{...u.card,...u.cardDestaque}:u.card,children:[e.jsxs("div",{style:u.widgetHeader,children:[e.jsxs("strong",{children:[a," ",t]}),o&&e.jsx("span",{style:{...u.badge,color:r,borderColor:r},children:o})]}),n]})}function no({titulo:t,valor:a,detalhe:o,emoji:r,cor:n,progresso:d}){return e.jsxs("section",{className:"print-card",style:u.kpiCard,children:[e.jsx("div",{style:u.kpiIcon,children:r}),e.jsx("span",{style:u.kpiTitulo,children:t}),e.jsx("strong",{style:u.kpiValor,children:a}),e.jsx("small",{style:u.muted,children:o}),e.jsx(Tt,{value:Math.min(Math.max(d||0,0),100),color:n})]})}function $e({label:t,value:a,sub:o}){return e.jsxs("div",{style:u.miniStat,children:[e.jsx("small",{children:t}),e.jsx("strong",{children:a}),o&&e.jsx("span",{children:o})]})}function Tt({value:t,color:a}){return e.jsx("div",{style:u.barraFundo,children:e.jsx("div",{style:{...u.barraValor,width:`${Math.min(Math.max(t||0,3),100)}%`,background:a}})})}const Ls=`
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
`,Os=`
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
`,u={page:{padding:20,maxWidth:1180,margin:"auto",fontFamily:"Inter, Arial, sans-serif",background:"linear-gradient(180deg, #f8fbfb 0%, #eef7f5 100%)",minHeight:"100vh",paddingBottom:90,color:"#0f172a"},hero:{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:14,flexWrap:"wrap"},actionsTop:{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"},titulo:{fontSize:30,margin:0},descricaoTela:{fontSize:14,color:"#64748b",marginTop:4,marginBottom:0},heroBadge:{minWidth:130,background:"#fff",border:"1px solid #dbeafe",borderRadius:20,padding:16,boxShadow:"0 10px 30px rgba(15,23,42,0.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:3},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:20},filtrosBox:{...Mt(),position:"relative",top:"auto",zIndex:1,border:"1px solid #e2e8f0",marginBottom:12,padding:12,boxShadow:"0 8px 22px rgba(15,23,42,0.05)",background:"rgba(255,255,255,0.92)"},filtroHeader:{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:10,marginBottom:8},filtroResumo:{color:"#64748b",fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},filtrosGrid:{display:"grid",gridTemplateColumns:"1.05fr 1.2fr 1.2fr 0.9fr 0.9fr",gap:8,alignItems:"center"},input:{width:"100%",padding:"9px 11px",borderRadius:11,border:"1px solid #d1d5db",boxSizing:"border-box",background:"#fff",minHeight:38,fontWeight:700,color:"#0f172a"},filtros:{display:"flex",gap:7,flexWrap:"wrap",marginTop:8},filtro:{border:"1px solid #d1d5db",background:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800,color:"#334155"},filtroAtivo:{border:"1px solid #0d9488",background:"#0d9488",color:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800},kpiGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14,marginBottom:16},kpiCard:{...Mt(),minHeight:130},kpiIcon:{width:38,height:38,borderRadius:14,background:"#f1f5f9",display:"grid",placeItems:"center",fontSize:20,marginBottom:8},kpiTitulo:{color:"#64748b",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:.3},kpiValor:{display:"block",fontSize:22,marginTop:4,marginBottom:4},dashboardGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:14,marginBottom:14},advancedPanel:{...Mt(),marginBottom:16,border:"1px solid #bfdbfe",background:"linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"},advancedGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14},dreLinha:{display:"grid",gridTemplateColumns:"1fr auto",gap:18,padding:"12px 0",borderBottom:"1px solid #eef2f7",alignItems:"center"},dreTexto:{display:"flex",flexDirection:"column",gap:4,minWidth:0},dreTitulo:{fontSize:16,lineHeight:1.2},dreDescricao:{color:"#64748b",fontSize:13,lineHeight:1.25,display:"block"},dreValor:{fontSize:16,whiteSpace:"nowrap",textAlign:"right"},chartBox:{width:"100%",height:250,minWidth:0},twoColumns:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14,marginBottom:14},card:Mt(),cardDestaque:{background:"linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)",border:"1px solid #ccfbf1"},cardAlerta:{...Mt(),background:"#fff5f5",border:"1px solid #fecaca",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},cardMeta:{...Mt(),border:"1px solid #fef3c7"},predictivePanel:{...Mt(),marginBottom:16,border:"1px solid #ddd6fe",background:"linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"},predictiveGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:10,marginBottom:8},metaForecastBox:{marginTop:12,padding:12,borderRadius:16,background:"#f8fafc",border:"1px solid #e2e8f0",display:"grid",gap:4},widgetHeader:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"},executivoTexto:{fontSize:16,lineHeight:1.5,margin:"6px 0 12px 0"},miniStats:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:8},miniStat:{background:"#f8fafc",border:"1px solid #eef2f7",borderRadius:14,padding:10,display:"flex",flexDirection:"column",gap:2,minWidth:0},grid3Compacto:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))",gap:8,marginTop:10},compareGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10},resultGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:10},badge:{border:"1px solid",borderRadius:999,padding:"5px 9px",fontSize:12,fontWeight:800,background:"#fff"},barraFundo:{height:9,background:"#e2e8f0",borderRadius:99,overflow:"hidden",margin:"10px 0"},barraValor:{height:"100%",borderRadius:99},insightList:{display:"grid",gap:8},insightItem:{display:"grid",gridTemplateColumns:"30px 1fr",gap:8,alignItems:"flex-start",background:"#f8fafc",borderRadius:14,padding:10,fontSize:14},insightEmoji:{width:30,height:30,borderRadius:12,background:"#fff",display:"grid",placeItems:"center"},itemGrafico:{marginTop:10},topItem:{display:"grid",gridTemplateColumns:"34px 1fr auto",gap:10,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #eef2f7"},medalha:{width:30,height:30,borderRadius:999,background:"#eef2ff",color:"#3730a3",display:"grid",placeItems:"center",fontWeight:800},topText:{display:"flex",flexDirection:"column",gap:2},rankingGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:12},cardRanking:Mt(),contasGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:10},cardConta:Mt(),cardLinha:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"},maiorCusto:{display:"block",color:"#12b886",fontWeight:"bold",fontSize:12},alertaTexto:{color:"#dc3545",fontWeight:"bold"},vazio:{opacity:.7,fontSize:14},skeletonArea:{display:"grid",gap:14,marginTop:12},skeletonGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14},skeletonCard:{height:130,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonCardAlto:{height:250,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonPanel:{...Mt(),display:"grid",gap:12},skeletonLineGrande:{height:22,width:"55%",borderRadius:999,background:"#e2e8f0"},skeletonLine:{height:14,width:"80%",borderRadius:999,background:"#e2e8f0"},skeletonLineCurta:{height:14,width:"35%",borderRadius:999,background:"#e2e8f0"},muted:{color:"#64748b",lineHeight:1.45},btnVoltar:xa("#64748b"),btnExcel:xa("#16a34a"),btnPDF:xa("#7c3aed"),btnCSV:xa("#0d9488"),btnLimpar:{...xa("#64748b"),padding:"7px 10px"},btnAcao:xa("#dc3545")};function Mt(){return{background:"#fff",padding:16,borderRadius:20,marginBottom:0,boxShadow:"0 12px 30px rgba(15,23,42,0.07)",border:"1px solid rgba(226,232,240,0.9)"}}function xa(t){return{background:t,color:"#fff",border:"none",padding:"9px 13px",borderRadius:12,fontWeight:800,cursor:"pointer"}}function Ta(t){if(!t)return null;const a=String(t).slice(0,10);return new Date(a+"T00:00:00")}function ha(t){const a=new Date;a.setHours(0,0,0,0);const o=Ta(t);if(!o)return 999999;const r=o-a;return Math.round(r/(1e3*60*60*24))}function Us(t){const a=Ta(t);if(!a)return!1;const o=new Date;return a.getMonth()===o.getMonth()&&a.getFullYear()===o.getFullYear()}function Vs(t,a,o){const r=new Date(t,a,0).getDate(),n=Math.min(Number(o||1),r);return`${t}-${String(a).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function Gs(t,a,o){if(!(t!=null&&t.ativo)||(t.tipo_recorrencia||t.frequencia||"mensal")!=="mensal")return!1;const r=t.data_inicio?Ta(t.data_inicio):null;if(!r)return!0;const n=new Date(a,o-1,1),d=new Date(a,o,0);return r<=d&&n>=new Date(r.getFullYear(),r.getMonth(),1)}function zr(t){var o;const a=((o=t==null?void 0:t.df_contas_recorrentes)==null?void 0:o.tipo_recorrencia)||(t==null?void 0:t.tipo_recorrencia)||"";return String(a||"mensal")}function Pr(t){const a=String(t||"mensal").toLowerCase();return{mensal:"Mensal",semanal:"Semanal",anual:"Anual",quinzenal:"Quinzenal"}[a]||kt(a)}function Ws({styles:t,formatarValor:a,navegarPara:o,contasAbertasDashboard:r,mostrarContasDashboard:n,setMostrarContasDashboard:d,busca:l,setBusca:m,estaVencida:f,formatarData:b,abrirConfirmacao:_,marcarComoPago:k}){return e.jsxs("section",{className:`dashboard-open-accounts content-block ${n?"accounts-expanded":"accounts-collapsed"}`,style:t.bloco,children:[e.jsxs("div",{className:"dashboard-section-header dashboard-section-header-accounts",children:[e.jsxs("div",{className:"dashboard-section-title-wrap",children:[e.jsx("strong",{children:"💳 Contas em aberto"}),e.jsxs("small",{children:["Mais novas primeiro • ",r.length," conta(s)"]})]}),e.jsxs("div",{className:"dashboard-section-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>o("contas"),children:"Ver todas"}),e.jsx("button",{className:"note-toggle-small",type:"button",onClick:()=>d(!n),title:n?"Recolher contas em aberto":"Expandir contas em aberto","aria-label":n?"Recolher contas em aberto":"Expandir contas em aberto",children:n?"−":"+"})]})]}),n&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"dashboard-inline-filter",children:e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro ou observação...",value:l,onChange:S=>m(S.target.value)})}),r.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma conta em aberto para os filtros atuais."}),e.jsx("div",{className:"dashboard-open-list",children:r.slice(0,8).map(S=>{var T;const g=f(S.data_vencimento,S.status);return e.jsxs("div",{className:`dashboard-account-row ${g?"account-row-vencido":"account-row-pendente"}`,children:[e.jsxs("div",{children:[e.jsx("strong",{children:S.descricao}),e.jsxs("div",{className:"dashboard-account-meta",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",b(S.data_vencimento)]}),e.jsx("span",{className:"account-center-label",children:((T=S.df_centros_custo)==null?void 0:T.nome)||"Sem centro"}),S.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",Pr(zr(S))]})]}),S.observacao&&e.jsxs("small",{className:"account-note-preview",children:["Obs: ",S.observacao]})]}),e.jsxs("div",{className:"dashboard-account-row-actions",children:[e.jsx("span",{className:"dashboard-account-value",children:a(S.valor)}),e.jsx("span",{className:`status-pill ${g?"status-vencido":"status-pendente"}`,children:g?"Vencido":"Pendente"}),e.jsx("button",{className:"dashboard-paid-button",style:t.btnPago,onClick:()=>_({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${S.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>k(S.id)}),children:"Pago"})]})]},S.id)})})]})]})}function Hs({styles:t,navegarPara:a,notasPendentes:o,notasCriticas:r,notasUrgentes:n,mostrarNotas:d,setMostrarNotas:l,formatarData:m,alternarNotaConcluida:f,abrirEdicaoNota:b,abrirConfirmacao:_,excluirNota:k}){return e.jsxs("section",{className:`no-print dashboard-notes-card ${d?"notes-expanded":"notes-collapsed"}`,children:[e.jsxs("div",{style:t.notasHeaderNovo,className:"notes-header-clean dashboard-notes-content",children:[e.jsxs("div",{className:"notes-title-wrap",children:[e.jsx("strong",{className:"notes-title",children:"📝 Bloco de Notas"}),e.jsxs("div",{className:"notes-stats-row",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[o.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[r," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[n," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-header-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>a("notas"),children:"Ver notas"}),e.jsx("button",{className:"note-toggle-small",onClick:()=>l(!d),title:d?"Recolher bloco de notas":"Expandir bloco de notas","aria-label":d?"Recolher bloco de notas":"Expandir bloco de notas",children:d?"−":"+"})]})]}),o.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma nota pendente no momento."}),d&&e.jsx("div",{style:t.notasListaNova,className:"notes-list-dashboard",children:o.slice(0,6).map(S=>{const g=S.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${g}`,style:{...t.cardNotaAcao,...g==="critico"?t.cardNotaCritico:g==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:S.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:S.concluida?"line-through":"none"},children:S.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${g}`,style:{...t.badgePrioridade,...g==="critico"?t.badgeCritico:g==="urgente"?t.badgeUrgente:t.badgeNormal},children:g==="critico"?"Crítico":g==="urgente"?"Urgente":"Normal"})]}),S.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",m(S.data_evento)]}),S.conteudo&&e.jsx("p",{style:t.textoNota,children:S.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>f(S),children:S.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>b(S),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>_({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${S.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>k(S.id)}),children:"Excluir"})]})]},S.id)})})]})}function ht({className:t="",style:a={}}){return e.jsx("div",{className:`df-skeleton ${t}`.trim(),style:a,"aria-hidden":"true"})}function Ks({items:t=4}){return e.jsx("div",{className:"summary-grid df-skeleton-summary","aria-label":"Carregando resumo",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-summary-card",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-lg"})]},o))})}function Rr({items:t=3}){return e.jsx("div",{className:"df-skeleton-list","aria-label":"Carregando contas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-account-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-value"})]}),e.jsxs("div",{className:"df-skeleton-chip-row",children:[e.jsx(ht,{className:"df-skeleton-chip"}),e.jsx(ht,{className:"df-skeleton-chip"}),e.jsx(ht,{className:"df-skeleton-chip"})]}),e.jsxs("div",{className:"df-skeleton-actions-row",children:[e.jsx(ht,{className:"df-skeleton-button"}),e.jsx(ht,{className:"df-skeleton-button"})]})]},o))})}function Ys({items:t=3}){return e.jsx("div",{className:"notes-page-grid df-skeleton-notes","aria-label":"Carregando notas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-note-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ht,{className:"df-skeleton-pill"})]}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-full"}),e.jsx(ht,{className:"df-skeleton-line df-skeleton-line-mid"})]},o))})}function Xs({styles:t,formatarValor:a,total:o,pago:r,pendente:n,vencido:d,contas:l,diferencaDias:m,navegarPara:f,contasAbertasDashboard:b,mostrarContasDashboard:_,setMostrarContasDashboard:k,busca:S,setBusca:g,estaVencida:T,formatarData:P,abrirConfirmacao:z,marcarComoPago:H,notasPendentes:re,notasCriticas:V,notasUrgentes:q,mostrarNotas:ne,setMostrarNotas:G,alternarNotaConcluida:ae,abrirEdicaoNota:I,excluirNota:M,loading:Y=!1,nomeUsuario:je="usuário",filiais:ce=[],filtroFilial:he="",setFiltroFilial:Ce=()=>{},contasOperacionaisFiliais:oe=[]}){const y=$=>Number($||0),pe=(ce||[]).find($=>$.id===he);l.filter($=>$.status==="pago"),l.filter($=>$.status!=="pago");const A=oe&&oe.length>0?oe:l,Z=(ce||[]).map($=>{const ie=A.filter(Ye=>Ye.filial_id===$.id),et=ie.reduce((Ye,lt)=>Ye+y(lt.valor),0),st=ie.filter(Ye=>Ye.status==="pago").reduce((Ye,lt)=>Ye+y(lt.valor),0),Oe=ie.filter(Ye=>T(Ye.data_vencimento,Ye.status)).reduce((Ye,lt)=>Ye+y(lt.valor),0),It=et-st;return{id:$.id,nome:$.nome||"Filial sem nome",total:et,pago:st,pendente:It,vencido:Oe,contas:ie.length}}).filter($=>$.total>0||$.contas>0).sort(($,ie)=>ie.total-$.total),K=Z[0],Q=[...Z].sort(($,ie)=>ie.pendente-$.pendente)[0],N=[...Z].sort(($,ie)=>ie.vencido-$.vencido)[0],J=[{name:"Pago",value:y(r),color:"#22c55e"},{name:"Pendente",value:Math.max(y(n)-y(d),0),color:"#f59e0b"},{name:"Vencido",value:y(d),color:"#ef4444"}].filter($=>$.value>0),Me=[{name:"Pago",valor:y(r)},{name:"Aberto",valor:y(n)},{name:"Vencido",valor:y(d)}],_e=Object.values(l.reduce(($,ie)=>{var st;const et=((st=ie.df_centros_custo)==null?void 0:st.nome)||"Sem centro";return $[et]||($[et]={name:et,valor:0}),$[et].valor+=y(ie.valor),$},{})).sort(($,ie)=>ie.valor-$.valor).slice(0,5),we=o>0?Math.round(r/o*100):0,U=o>0?Math.round(d/o*100):0,fe=l.filter($=>$.status!=="pago").sort(($,ie)=>m($.data_vencimento)-m(ie.data_vencimento)),Ae=fe.filter($=>m($.data_vencimento)===0),C=fe.filter($=>{const ie=m($.data_vencimento);return ie>0&&ie<=7}),be=fe.find($=>m($.data_vencimento)>=0)||fe[0],ze=Ae.reduce(($,ie)=>$+y(ie.valor),0),me=C.reduce(($,ie)=>$+y(ie.valor),0);return e.jsxs(e.Fragment,{children:[e.jsx("section",{className:"dashboard-branch-filter no-print","aria-label":"Filtro de filial do dashboard",children:e.jsxs("div",{className:"dashboard-branch-filter-card",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Visão por filial"}),e.jsx("strong",{children:pe?pe.nome:"Todas as filiais"}),e.jsx("small",{children:"Os KPIs, gráficos e contas em aberto respeitam a filial selecionada."})]}),e.jsxs("select",{style:t.input,value:he,onChange:$=>Ce($.target.value),"aria-label":"Filtrar dashboard por filial",children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(ce||[]).map($=>e.jsx("option",{value:$.id,children:$.nome},$.id))]})]})}),e.jsx("section",{className:"dashboard-kpi-row","aria-label":"Resumo financeiro",children:Y?e.jsx(Ks,{items:4}):e.jsxs("div",{className:"summary-grid",style:t.resumo,children:[e.jsxs("div",{style:t.boxTotal,children:[e.jsx("span",{children:"Total"}),e.jsx("strong",{children:a(o)})]}),e.jsxs("div",{style:t.boxPago,children:[e.jsx("span",{children:"Pago"}),e.jsx("strong",{children:a(r)})]}),e.jsxs("div",{style:t.boxPendente,children:[e.jsx("span",{children:"Pendente"}),e.jsx("strong",{children:a(n)})]}),e.jsxs("div",{style:t.boxVencido,children:[e.jsx("span",{children:"Vencido"}),e.jsx("strong",{children:a(d)})]})]})}),!Y&&e.jsxs("section",{className:"dashboard-operational-grid no-print","aria-label":"Dashboard operacional por filial",children:[e.jsxs("article",{className:"dashboard-operational-card highlight",children:[e.jsx("span",{className:"analytics-kicker",children:"Ranking de unidades"}),e.jsx("strong",{children:K?K.nome:"Sem movimento"}),e.jsx("small",{children:K?`${a(K.total)} em volume financeiro`:"Cadastre contas vinculadas às filiais."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Maior pendência"}),e.jsx("strong",{children:Q?Q.nome:"Sem pendências"}),e.jsx("small",{children:Q?a(Q.pendente):"Nenhuma conta pendente encontrada."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Risco vencido"}),e.jsx("strong",{children:N&&N.vencido>0?N.nome:"Sem vencidos"}),e.jsx("small",{children:N&&N.vencido>0?a(N.vencido):"Operação sem vencidos no filtro atual."})]}),e.jsxs("article",{className:"dashboard-operational-card ranking",children:[e.jsxs("div",{className:"analytics-card-header compact",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Comparativo por filial"}),e.jsx("strong",{children:"Top unidades"})]}),e.jsx("span",{className:"analytics-badge neutral",children:Z.length})]}),Z.length>0?e.jsx("div",{className:"branch-ranking-list",children:Z.slice(0,5).map(($,ie)=>{const et=(K==null?void 0:K.total)>0?Math.max(5,Math.round($.total/K.total*100)):0;return e.jsxs("div",{className:"branch-ranking-row",children:[e.jsxs("div",{className:"branch-ranking-info",children:[e.jsx("span",{children:ie+1}),e.jsxs("div",{children:[e.jsx("strong",{children:$.nome}),e.jsxs("small",{children:[$.contas," conta(s) • pendente ",a($.pendente)]})]})]}),e.jsxs("div",{className:"branch-ranking-value",children:[e.jsx("strong",{children:a($.total)}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${et}%`}})})]})]},$.id)})}):e.jsx("div",{className:"analytics-empty",children:"Sem contas com filial no filtro atual."})]})]}),!Y&&e.jsxs("section",{className:"dashboard-analytics-grid no-print",children:[e.jsxs("div",{className:"dashboard-analytics-card dashboard-analytics-card-primary",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Saúde financeira"}),e.jsx("strong",{children:"Distribuição das contas"})]}),e.jsxs("span",{className:"analytics-badge",children:[we,"% pago"]})]}),J.length>0?e.jsxs("div",{className:"analytics-chart-row",children:[e.jsxs("div",{className:"donut-chart-wrap",children:[e.jsx(va,{width:"100%",height:190,children:e.jsxs(wr,{children:[e.jsx(kr,{data:J,dataKey:"value",nameKey:"name",innerRadius:54,outerRadius:82,paddingAngle:3,children:J.map($=>e.jsx(Cr,{fill:$.color},$.name))}),e.jsx(ja,{formatter:$=>a($)})]})}),e.jsxs("div",{className:"donut-center-label",children:[e.jsxs("strong",{children:[we,"%"]}),e.jsx("span",{children:"quitado"})]})]}),e.jsx("div",{className:"analytics-legend",children:J.map($=>e.jsxs("div",{children:[e.jsx("span",{style:{background:$.color}}),e.jsx("small",{children:$.name}),e.jsx("strong",{children:a($.value)})]},$.name))})]}):e.jsx("div",{className:"analytics-empty",children:"Sem dados financeiros para montar o gráfico."})]}),e.jsxs("div",{className:"dashboard-analytics-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Fluxo atual"}),e.jsx("strong",{children:"Pago x Aberto x Vencido"})]}),e.jsxs("span",{className:U>0?"analytics-badge danger":"analytics-badge success",children:[U,"% risco"]})]}),e.jsx(va,{width:"100%",height:220,children:e.jsxs(jr,{data:Me,margin:{top:14,right:18,left:24,bottom:4},children:[e.jsx(so,{strokeDasharray:"3 3",vertical:!1}),e.jsx(lo,{dataKey:"name",tickLine:!1,axisLine:!1}),e.jsx(co,{width:82,tickLine:!1,axisLine:!1,tickMargin:10,tickFormatter:$=>`R$ ${Math.round($/1e3)}k`}),e.jsx(ja,{formatter:$=>a($)}),e.jsx(yr,{dataKey:"valor",radius:[10,10,4,4],fill:"#0f766e"})]})})]}),e.jsxs("div",{className:"dashboard-analytics-card dashboard-cost-center-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Centros de custo"}),e.jsx("strong",{children:"Top 5 por volume financeiro"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[_e.length," centros"]})]}),_e.length>0?e.jsx("div",{className:"cost-center-bars",children:_e.map($=>{const ie=o>0?Math.max(4,Math.round($.valor/o*100)):0;return e.jsxs("div",{className:"cost-center-row",children:[e.jsxs("div",{children:[e.jsx("strong",{children:$.name}),e.jsx("span",{children:a($.valor)})]}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${ie}%`}})})]},$.name)})}):e.jsx("div",{className:"analytics-empty",children:"Cadastre centros de custo para visualizar o ranking."})]}),e.jsxs("div",{className:"dashboard-analytics-card executive-agenda-widget",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Agenda executiva"}),e.jsx("strong",{children:"Próximos vencimentos"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[fe.length," abertas"]})]}),e.jsxs("div",{className:"executive-agenda-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Hoje"}),e.jsx("strong",{children:a(ze)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"7 dias"}),e.jsx("strong",{children:a(me)})]})]}),be?e.jsxs("div",{className:"executive-agenda-next",children:[e.jsx("span",{children:"Próximo compromisso"}),e.jsx("strong",{children:be.descricao}),e.jsxs("small",{children:[P(be.data_vencimento)," • ",a(be.valor)]})]}):e.jsx("div",{className:"analytics-empty executive-agenda-empty",children:"Agenda financeira limpa."}),e.jsx("button",{className:"executive-agenda-cta",onClick:()=>f("agenda"),children:"Abrir agenda completa"})]})]}),Y?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"dashboard-section-header-accounts",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"💰 Contas em aberto"}),e.jsx("p",{style:t.textoNota,children:"Carregando contas e vencimentos..."})]})}),e.jsx(Rr,{items:2})]}):e.jsx(Ws,{styles:t,formatarValor:a,navegarPara:f,contasAbertasDashboard:b,mostrarContasDashboard:_,setMostrarContasDashboard:k,busca:S,setBusca:g,estaVencida:T,formatarData:P,abrirConfirmacao:z,marcarComoPago:H}),Y?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"notes-header-clean",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Carregando lembretes..."})]})}),e.jsx(Ys,{items:2})]}):e.jsx(Hs,{styles:t,navegarPara:f,notasPendentes:re,notasCriticas:V,notasUrgentes:q,mostrarNotas:ne,setMostrarNotas:G,formatarData:P,alternarNotaConcluida:ae,abrirEdicaoNota:I,abrirConfirmacao:z,excluirNota:M})]})}function Qs(t){return e.jsx(Xs,{...t})}function Js({icon:t,title:a,description:o,actionLabel:r,onAction:n}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o}),r&&n&&e.jsx("button",{className:"empty-state-action",onClick:n,children:r})]})}function Zs({styles:t,busca:a,setBusca:o,mostrarFiltros:r,setMostrarFiltros:n,limparFiltros:d,imprimirPDF:l,exportarCSV:m,filtroStatus:f,setFiltroStatus:b,centros:_,filtroCentro:k,setFiltroCentro:S,filiais:g,filtroFilial:T,setFiltroFilial:P,filtroMes:z,setFiltroMes:H,dataInicial:re,setDataInicial:V,dataFinal:q,setDataFinal:ne,limitarDataInput:G,contasFiltradas:ae,total:I,formatarValor:M,loading:Y,HeaderExpansivel:je,mostrarContas:ce,setMostrarContas:he,estaVencida:Ce,formatarData:oe,formatarTipoRecorrencia:y,obterTipoRecorrenciaConta:pe,abrirConfirmacao:A,marcarComoPago:Z,voltarParaPendente:K,abrirEdicaoConta:Q,excluirConta:N,navegarPara:J}){function Me(){var _e,we;return e.jsxs(e.Fragment,{children:[e.jsxs("section",{className:"no-print filters-desktop",style:t.filtrosBox,children:[e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro, observação ou status...",value:a,onChange:U=>o(U.target.value)}),e.jsx("button",{className:"filter-toggle-button",onClick:()=>n(!r),children:r?"Ocultar filtros":"Filtros"}),e.jsxs("div",{className:"export-actions",style:t.acoes,children:[e.jsx("button",{style:t.btnCinza,onClick:d,children:"Limpar"}),e.jsx("button",{style:t.btnRoxo,onClick:l,children:"PDF"}),e.jsx("button",{style:t.btnVerde,onClick:m,children:"CSV"})]}),r&&e.jsxs("div",{className:"advanced-filters",children:[e.jsxs("div",{className:"status-tabs filter-tabs-fixed",style:t.filtros,children:[e.jsx("button",{style:f==="todas"?t.filtroAtivo:t.filtro,onClick:()=>b("todas"),children:"Todas"}),e.jsx("button",{style:f==="pendentes"?t.filtroAtivo:t.filtro,onClick:()=>b("pendentes"),children:"Pendentes"}),e.jsx("button",{style:f==="pagas"?t.filtroAtivo:t.filtro,onClick:()=>b("pagas"),children:"Pagas"}),e.jsx("button",{style:f==="vencidas"?t.filtroAtivo:t.filtro,onClick:()=>b("vencidas"),children:"Vencidas"})]}),e.jsxs("select",{style:t.input,value:T,onChange:U=>P(U.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(g||[]).map(U=>e.jsx("option",{value:U.id,children:U.nome},U.id))]}),e.jsxs("select",{style:t.input,value:k,onChange:U=>S(U.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),_.map(U=>e.jsx("option",{value:U.id,children:U.nome},U.id))]}),e.jsx("input",{style:t.input,type:"month",value:z,onChange:U=>H(U.target.value)}),e.jsx("input",{style:t.input,type:"date",value:re,onChange:U=>V(G(U.target.value))}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:U=>ne(G(U.target.value))})]})]}),e.jsxs("section",{className:"result-summary",style:t.resumoFiltro,children:[e.jsx("strong",{children:"Resultado filtrado"}),e.jsxs("span",{children:[ae.length," conta(s) • Total ",M(I)]}),e.jsxs("small",{children:["Filial: ",T?((_e=(g||[]).find(U=>U.id===T))==null?void 0:_e.nome)||"Selecionada":"Todas"," • Centro: ",k?((we=_.find(U=>U.id===k))==null?void 0:we.nome)||"Selecionado":"Todos"," • Status: ",f," • Mês: ",z||"Todos"]})]}),e.jsxs("section",{className:"content-block",style:t.bloco,children:[Y&&e.jsx(Rr,{items:3}),e.jsx(je,{titulo:"💰 Contas",aberto:ce,onClick:()=>he(!ce)}),!Y&&ce&&ae.length===0&&e.jsx(Js,{icon:"💳",title:"Nenhuma conta encontrada",description:"Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa."}),!Y&&ce&&ae.map(U=>{var Ae,C;const fe=Ce(U.data_vencimento,U.status);return e.jsxs("div",{className:`print-card account-card-desktop ${fe?"account-card-vencida":U.status==="pago"?"account-card-paga":"account-card-pendente"}`,style:{...t.cardConta,background:U.status==="pago"?"#d4edda":fe?"#ffb3b3":"#fff3cd"},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{children:U.descricao}),e.jsx("span",{children:M(U.valor)})]}),e.jsxs("div",{style:t.cardInfo,className:"account-meta-line",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",oe(U.data_vencimento)]}),e.jsx("span",{children:((Ae=U.df_filiais)==null?void 0:Ae.nome)||"Sem filial"}),e.jsx("span",{children:((C=U.df_centros_custo)==null?void 0:C.nome)||"-"}),U.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",y(pe(U))]}),e.jsx("span",{className:`status-pill ${fe?"status-vencido":U.status==="pago"?"status-pago":"status-pendente"}`,children:fe?"Vencido":U.status==="pago"?"Pago":"Pendente"})]}),e.jsxs("div",{className:"account-actions",style:t.acoes,children:[U.status!=="pago"?e.jsx("button",{style:t.btnPago,onClick:()=>A({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${U.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>Z(U.id)}),children:"Pago"}):e.jsx("button",{style:t.btnVoltar,onClick:()=>A({titulo:"Voltar para pendente",mensagem:`Deseja voltar a conta ${U.descricao} para pendente?`,textoConfirmar:"Voltar",tipo:"aviso",acao:()=>K(U.id)}),children:"Voltar"}),e.jsx("button",{style:t.btnEditar,onClick:()=>Q(U),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>A({titulo:"Mover para lixeira",mensagem:`Deseja mover a conta ${U.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>N(U.id)}),children:"Excluir"})]})]},U.id)})]})]})}return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"💳 Contas"}),e.jsx("p",{style:t.textoNota,children:"Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>J("dashboard"),children:"← Dashboard"})})]}),Me()]})}function el({icon:t,title:a,description:o}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o})]})}function tl({styles:t,navegarPara:a,notasFiltradas:o,notasPendentes:r,notasCriticas:n,notasUrgentes:d,buscaNota:l,setBuscaNota:m,formatarData:f,alternarNotaConcluida:b,abrirEdicaoNota:_,abrirConfirmacao:k,excluirNota:S,filtroFilial:g,setFiltroFilial:T,filiais:P}){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>a("dashboard"),children:"← Dashboard"})})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"notes-page-section",children:[e.jsxs("div",{className:"notes-page-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Todas as notas"}),e.jsxs("p",{style:t.textoNota,children:[o.length," nota(s) encontrada(s) • ",r.length," pendente(s)"]})]}),e.jsxs("div",{className:"notes-page-stats",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[r.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[n," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[d," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-toolbar",children:[e.jsxs("select",{style:t.input,value:g,onChange:z=>T(z.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(P||[]).map(z=>e.jsx("option",{value:z.id,children:z.nome},z.id))]}),e.jsx("input",{style:t.input,placeholder:"Buscar por título, conteúdo ou prioridade...",value:l,onChange:z=>m(z.target.value)})]}),o.length===0&&e.jsx(el,{icon:"📝",title:"Nenhuma nota encontrada",description:"Use as notas para registrar pendências, lembretes e prioridades da operação."}),e.jsx("div",{className:"notes-page-grid",children:o.map(z=>{var re;const H=z.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${H}`,style:{...t.cardNotaAcao,...H==="critico"?t.cardNotaCritico:H==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:z.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:z.concluida?"line-through":"none"},children:z.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${H}`,style:{...t.badgePrioridade,...H==="critico"?t.badgeCritico:H==="urgente"?t.badgeUrgente:t.badgeNormal},children:H==="critico"?"Crítico":H==="urgente"?"Urgente":"Normal"})]}),z.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",f(z.data_evento)]}),((re=z.df_filiais)==null?void 0:re.nome)&&e.jsxs("small",{className:"note-event-date",children:["🏢 ",z.df_filiais.nome]}),z.conteudo&&e.jsx("p",{style:t.textoNota,children:z.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>b(z),children:z.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>_(z),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>k({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${z.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>S(z.id)}),children:"Excluir"})]})]},z.id)})})]})]})}function Uo(t){return String(t||"").trim().replace(/\s+/g," ")}async function al(){const{data:t,error:a}=await D.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(a)throw a;const{data:o,error:r}=await D.from("df_usuarios_empresas").select("empresa_id, user_id, email, perfil");if(r)throw r;const n=new Map;return(o||[]).forEach(d=>{if(!(d!=null&&d.empresa_id))return;const l=d.user_id||String(d.email||"").trim().toLowerCase();if(!l)return;const m=n.get(d.empresa_id)||new Set;m.add(l),n.set(d.empresa_id,m)}),(t||[]).map(d=>{var l;return{...d,totalUsuarios:((l=n.get(d.id))==null?void 0:l.size)||0}})}async function ol({nome:t,masterUserId:a,masterEmail:o,masterNome:r}){const n=Uo(t);if(n.length<2)throw new Error("Informe o nome da empresa.");const{data:d,error:l}=await D.from("df_empresas").select("id, nome").ilike("nome",n).limit(1);if(l)throw l;if(Array.isArray(d)&&d.length>0)throw new Error("Já existe uma empresa com esse nome.");const{data:m,error:f}=await D.from("df_empresas").insert([{nome:n}]).select("id, nome, created_at").single();if(f)throw f;if(o||a){const b={empresa_id:m.id,user_id:a||null,email:String(o||"").trim().toLowerCase()||null,nome:Uo(r)||String(o||"").split("@")[0]||"Administrador",perfil:"admin"},{error:_}=await D.from("df_usuarios_empresas").insert([b]);_&&console.warn("Empresa criada, mas não foi possível vincular o master automaticamente:",_.message)}return m}async function il({empresaId:t,nome:a}){const o=Uo(a);if(!t)throw new Error("Empresa não identificada.");if(o.length<2)throw new Error("Informe o nome da empresa.");const{data:r,error:n}=await D.from("df_empresas").update({nome:o}).eq("id",t).select("id, nome, created_at").single();if(n)throw n;return r}function Fr(t){return String(t||"").trim().replace(/\s+/g," ")}function $r(t){const a=String(t||"").trim();if(!a)throw new Error("Empresa não identificada para gerenciar filiais.");return a}async function Ho(t){const a=$r(t),{data:o,error:r}=await D.from("df_filiais").select("id, empresa_id, nome, ativo, created_at").eq("empresa_id",a).order("nome",{ascending:!0});if(r)throw r;return o||[]}async function rl({empresaId:t,nome:a}){const o=$r(t),r=Fr(a);if(r.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:d}=await D.from("df_filiais").select("id, nome").eq("empresa_id",o).ilike("nome",r).limit(1);if(d)throw d;if(Array.isArray(n)&&n.length>0)throw new Error("Já existe uma filial com esse nome nesta empresa.");const{data:l,error:m}=await D.from("df_filiais").insert([{empresa_id:o,nome:r,ativo:!0}]).select("id, empresa_id, nome, ativo, created_at").single();if(m)throw m;return l}async function nl({filialId:t,nome:a}){const o=String(t||"").trim(),r=Fr(a);if(!o)throw new Error("Filial não identificada.");if(r.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:d}=await D.from("df_filiais").update({nome:r}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(d)throw d;return n}async function sl({filialId:t,ativo:a}){const o=String(t||"").trim();if(!o)throw new Error("Filial não identificada.");const{data:r,error:n}=await D.from("df_filiais").update({ativo:!!a}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(n)throw n;return r}function ll(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function dl({styles:t,usuarioLogado:a,nomeUsuarioCompleto:o,empresaId:r,empresasDisponiveis:n=[],trocarEmpresaAtiva:d,trocandoEmpresa:l,mostrarAviso:m,onEmpresasAtualizadas:f,voltarPainel:b,abaInicial:_="empresas"}){const[k,S]=c.useState(_==="filiais"?"filiais":"empresas"),[g,T]=c.useState([]),[P,z]=c.useState(""),[H,re]=c.useState(""),[V,q]=c.useState(!1),[ne,G]=c.useState(!0),[ae,I]=c.useState(null),[M,Y]=c.useState(""),[je,ce]=c.useState([]),[he,Ce]=c.useState(""),[oe,y]=c.useState(""),[pe,A]=c.useState(!1),[Z,K]=c.useState(null),[Q,N]=c.useState(""),J=c.useMemo(()=>n.find(C=>C.id===r)||g.find(C=>C.id===r)||null,[r,g,n]);async function Me(){G(!0);try{const C=await al();T(C)}catch(C){m==null||m((C==null?void 0:C.message)||"Não foi possível carregar empresas.","erro")}finally{G(!1)}}async function _e(){if(!r){ce([]);return}A(!0);try{const C=await Ho(r);ce(C)}catch(C){m==null||m((C==null?void 0:C.message)||"Não foi possível carregar filiais.","erro")}finally{A(!1)}}c.useEffect(()=>{Me()},[]),c.useEffect(()=>{k==="filiais"&&_e()},[k,r]);const we=c.useMemo(()=>{const C=String(P||"").trim().toLowerCase();return C?g.filter(be=>String(be.nome||"").toLowerCase().includes(C)):g},[P,g]);c.useMemo(()=>{const C=String(he||"").trim().toLowerCase();return C?je.filter(be=>String(be.nome||"").toLowerCase().includes(C)):je},[he,je]);async function U(C){if(C.preventDefault(),!V){q(!0);try{await ol({nome:H,masterUserId:a==null?void 0:a.id,masterEmail:a==null?void 0:a.email,masterNome:o==null?void 0:o()}),re(""),await Me(),await(f==null?void 0:f()),m==null||m("Empresa criada com sucesso.","sucesso")}catch(be){m==null||m((be==null?void 0:be.message)||"Não foi possível criar a empresa.","erro")}finally{q(!1)}}}async function fe(C){if(!(!(C!=null&&C.id)||V)){q(!0);try{await il({empresaId:C.id,nome:M}),I(null),Y(""),await Me(),await(f==null?void 0:f()),m==null||m("Empresa atualizada com sucesso.","sucesso")}catch(be){m==null||m((be==null?void 0:be.message)||"Não foi possível atualizar a empresa.","erro")}finally{q(!1)}}}function Ae(){return e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova empresa"}),e.jsx("p",{style:t.textoNota,children:"Crie um novo tenant e vincule automaticamente seu usuário master."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:U,children:[e.jsx("input",{style:t.input,value:H,onChange:C=>re(C.target.value),placeholder:"Nome da empresa"}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:V,children:V?"Salvando...":"Criar empresa"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Empresas cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Controle inicial das empresas disponíveis no SaaS."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:P,onChange:C=>z(C.target.value),placeholder:"Buscar empresa"})]}),ne?e.jsx("p",{style:t.textoNota,children:"Carregando empresas..."}):we.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏢"}),e.jsx("strong",{children:"Nenhuma empresa encontrada"}),e.jsx("p",{children:"Crie a primeira empresa ou ajuste a busca."})]}):e.jsx("div",{className:"master-companies-list",children:we.map(C=>{const be=C.id===r,ze=ae===C.id;return e.jsxs("article",{className:`master-company-card ${be?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏢"}),e.jsxs("div",{children:[ze?e.jsx("input",{style:t.input,value:M,onChange:me=>Y(me.target.value),autoFocus:!0}):e.jsx("h3",{children:C.nome||"Empresa sem nome"}),e.jsxs("small",{children:["ID: ",C.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:[C.totalUsuarios||0," usuário(s)"]}),e.jsxs("span",{children:["Criada em ",ll(C.created_at)]}),be&&e.jsx("strong",{children:"Ativa"})]}),e.jsx("div",{className:"master-company-actions",children:ze?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:V,onClick:()=>fe(C),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{I(null),Y("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{I(C.id),Y(C.nome||"")},children:"Editar"}),!be&&e.jsx("button",{style:t.btnSalvar,type:"button",disabled:l,onClick:()=>d==null?void 0:d(C.id),children:"Ativar"})]})})]},C.id)})})]})]})}return e.jsxs("div",{className:"master-panel-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Painel Master SaaS"}),e.jsx("h1",{style:t.titulo,children:"🏢 Painel Master"}),e.jsx("p",{style:t.textoNota,children:"Gerencie empresas e tenants da plataforma. Filiais ficam nas Configurações de cada empresa."})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:b,children:"← Dashboard"})]}),e.jsxs("div",{className:"master-stats-grid",children:[e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresas cadastradas"}),e.jsx("strong",{children:g.length})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresa ativa"}),e.jsx("strong",{children:(J==null?void 0:J.nome)||"—"})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Administração SaaS"}),e.jsx("strong",{children:"Tenants"})]})]}),Ae()]})}function cl(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function pl({styles:t,empresaId:a,empresaNome:o,mostrarAviso:r,voltarPainel:n}){const[d,l]=c.useState([]),[m,f]=c.useState(""),[b,_]=c.useState(""),[k,S]=c.useState(!0),[g,T]=c.useState(!1),[P,z]=c.useState(null),[H,re]=c.useState("");async function V(){if(!a){l([]),S(!1);return}S(!0);try{const I=await Ho(a);l(I)}catch(I){r==null||r((I==null?void 0:I.message)||"Não foi possível carregar filiais.","erro")}finally{S(!1)}}c.useEffect(()=>{V()},[a]);const q=c.useMemo(()=>{const I=String(m||"").trim().toLowerCase();return I?d.filter(M=>String(M.nome||"").toLowerCase().includes(I)):d},[m,d]);async function ne(I){if(I.preventDefault(),!g){T(!0);try{await rl({empresaId:a,nome:b}),_(""),await V(),r==null||r("Filial criada com sucesso.","sucesso")}catch(M){r==null||r((M==null?void 0:M.message)||"Não foi possível criar a filial.","erro")}finally{T(!1)}}}async function G(I){if(!(!(I!=null&&I.id)||g)){T(!0);try{await nl({filialId:I.id,nome:H}),z(null),re(""),await V(),r==null||r("Filial atualizada com sucesso.","sucesso")}catch(M){r==null||r((M==null?void 0:M.message)||"Não foi possível atualizar a filial.","erro")}finally{T(!1)}}}async function ae(I){if(!(!(I!=null&&I.id)||g)){T(!0);try{await sl({filialId:I.id,ativo:!I.ativo}),await V(),r==null||r(I.ativo?"Filial desativada.":"Filial ativada.","sucesso")}catch(M){r==null||r((M==null?void 0:M.message)||"Não foi possível alterar a filial.","erro")}finally{T(!1)}}}return e.jsxs("div",{className:"branches-settings-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Configurações da empresa"}),e.jsx("h1",{style:t.titulo,children:"🏬 Filiais / Unidades"}),e.jsx("p",{style:t.textoNota,children:"Cadastre unidades operacionais dentro da empresa ativa. As próximas fases ligarão contas e relatórios a essas filiais."}),e.jsxs("small",{style:t.textoAjuda,children:["Empresa ativa: ",e.jsx("strong",{children:o||"—"})]})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:n,children:"← Configurações"})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova filial"}),e.jsx("p",{style:t.textoNota,children:"Use nomes como Loja Centro, Loja Shopping, Produção, Delivery ou Administração."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:ne,children:[e.jsx("input",{style:t.input,value:b,onChange:I=>_(I.target.value),placeholder:"Nome da filial",disabled:!a}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:g||!a,children:g?"Salvando...":"Criar filial"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Filiais cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Cada empresa enxerga apenas suas próprias unidades."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:m,onChange:I=>f(I.target.value),placeholder:"Buscar filial"})]}),k?e.jsx("p",{style:t.textoNota,children:"Carregando filiais..."}):q.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏬"}),e.jsx("strong",{children:"Nenhuma filial encontrada"}),e.jsx("p",{children:"Crie unidades para organizar contas por local de operação."})]}):e.jsx("div",{className:"master-companies-list",children:q.map(I=>{const M=P===I.id;return e.jsxs("article",{className:`master-company-card ${I.ativo?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏬"}),e.jsxs("div",{children:[M?e.jsx("input",{style:t.input,value:H,onChange:Y=>re(Y.target.value),autoFocus:!0}):e.jsx("h3",{children:I.nome||"Filial sem nome"}),e.jsxs("small",{children:["ID: ",I.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:["Criada em ",cl(I.created_at)]}),e.jsx("strong",{children:I.ativo?"Ativa":"Inativa"})]}),e.jsx("div",{className:"master-company-actions",children:M?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:g,onClick:()=>G(I),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{z(null),re("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{z(I.id),re(I.nome||"")},children:"Editar"}),e.jsx("button",{style:I.ativo?t.btnCinza:t.btnSalvar,type:"button",disabled:g,onClick:()=>ae(I),children:I.ativo?"Desativar":"Ativar"})]})})]},I.id)})})]})]})}const da=[{codigo:"starter",nome:"Starter",descricao:"Base para operação pequena com uma unidade.",limite_filiais:1,limite_usuarios:3,valor_mensal:0,recursos:["1 filial","3 usuários","Contas e notas","Dashboard básico"]},{codigo:"profissional",nome:"Profissional",descricao:"Operação multiunidade com dashboard operacional.",limite_filiais:5,limite_usuarios:15,valor_mensal:149,recursos:["Até 5 filiais","Até 15 usuários","Dashboard operacional","Relatórios gerenciais"]},{codigo:"enterprise",nome:"Enterprise",descricao:"Estrutura avançada para redes, permissões e expansão SaaS.",limite_filiais:null,limite_usuarios:null,valor_mensal:null,recursos:["Filiais ilimitadas","Usuários ilimitados","Permissões avançadas","Suporte prioritário"]}];function Mr(t){const a=String((t==null?void 0:t.message)||"").toLowerCase();return(t==null?void 0:t.code)==="42P01"||a.includes("does not exist")||a.includes("schema cache")}function ml(t="profissional"){return da.find(a=>a.codigo===t)||da[1]}async function ul(){const{data:t,error:a}=await D.from("df_planos").select("id, codigo, nome, descricao, limite_filiais, limite_usuarios, valor_mensal, ativo").eq("ativo",!0).order("valor_mensal",{ascending:!0,nullsFirst:!1});if(a){if(Mr(a))return da;throw a}return!Array.isArray(t)||t.length===0?da:t.map(o=>({...o,recursos:gl(o)}))}async function fl(t){if(!t)return null;const{data:a,error:o}=await D.from("df_assinaturas").select("id, empresa_id, plano_codigo, status, trial_inicio, trial_fim, assinatura_inicio, assinatura_fim, limite_filiais, limite_usuarios").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(o){if(Mr(o))return null;throw o}return a||null}async function xl(t){const[a,o]=await Promise.all([ul(),fl(t)]),r=a.find(n=>n.codigo===(o==null?void 0:o.plano_codigo))||ml(o==null?void 0:o.plano_codigo);return{planos:a,assinatura:o,planoAtual:{...r,limite_filiais:(o==null?void 0:o.limite_filiais)??r.limite_filiais,limite_usuarios:(o==null?void 0:o.limite_usuarios)??r.limite_usuarios}}}async function hl({empresaId:t,planoCodigo:a,limiteFiliais:o,limiteUsuarios:r,status:n="trial"}){if(!t)throw new Error("Empresa não identificada.");if(!a)throw new Error("Selecione um plano.");const d={empresa_id:t,plano_codigo:a,status:n,limite_filiais:o,limite_usuarios:r,updated_at:new Date().toISOString()},{data:l,error:m}=await D.from("df_assinaturas").select("id").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(m)throw m;if(l!=null&&l.id){const{data:_,error:k}=await D.from("df_assinaturas").update(d).eq("id",l.id).select("*").single();if(k)throw k;return _}const{data:f,error:b}=await D.from("df_assinaturas").insert([{...d,trial_inicio:new Date().toISOString().slice(0,10)}]).select("*").single();if(b)throw b;return f}function gl(t){const a=[];return a.push(t.limite_filiais?`Até ${t.limite_filiais} filial(is)`:"Filiais ilimitadas"),a.push(t.limite_usuarios?`Até ${t.limite_usuarios} usuário(s)`:"Usuários ilimitados"),a.push("Dashboard operacional"),a.push("Base para billing SaaS"),a}function nr(t,a,o){if(t==null||t==="")return"Ilimitado";const r=Number(t);return Number.isFinite(r)?`${r} ${r===1?a:o}`:"Ilimitado"}function sr(t){return t==null?"Sob consulta":Number(t)===0?"R$ 0,00":Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function ga(t){return t==null?"":String(t)}function bl(t){if(!t)return"";const a=new Date(t);return Number.isNaN(a.getTime())?String(t):a.toLocaleDateString("pt-BR")}function vl({styles:t,empresaId:a,empresaNome:o,filiais:r=[],usuarios:n=[],mostrarAviso:d,podeEditar:l=!1,voltarPainel:m}){const[f,b]=c.useState(!0),[_,k]=c.useState(!1),[S,g]=c.useState(da),[T,P]=c.useState(null),[z,H]=c.useState("profissional"),[re,V]=c.useState("trial"),[q,ne]=c.useState(5),[G,ae]=c.useState(15),[I,M]=c.useState(null);c.useEffect(()=>{let N=!0;async function J(){var Me,_e,we,U,fe,Ae;if(a){b(!0);try{const C=await xl(a);if(!N)return;g(C.planos||da),P(C.assinatura);const be=((Me=C.assinatura)==null?void 0:Me.plano_codigo)||((_e=C.assinatura)==null?void 0:_e.plano_slug)||((we=C.planoAtual)==null?void 0:we.codigo)||"profissional",ze=((U=C.assinatura)==null?void 0:U.status)||"trial",me=((fe=C.planoAtual)==null?void 0:fe.limite_filiais)??"",$=((Ae=C.planoAtual)==null?void 0:Ae.limite_usuarios)??"";H(be),V(ze),ne(me),ae($),M({planoSelecionado:be,statusSelecionado:ze,limiteFiliais:ga(me),limiteUsuarios:ga($)})}catch(C){console.error("Erro ao carregar billing:",C),N&&(d==null||d("Não foi possível carregar o billing: "+C.message,"erro"))}finally{N&&b(!1)}}}return J(),()=>{N=!1}},[a,d]);const Y=c.useMemo(()=>S.find(N=>N.codigo===z)||da.find(N=>N.codigo==="profissional"),[S,z]),je=r.length,ce=n.length,he=q===""?null:Number(q),Ce=G===""?null:Number(G),oe=he?Math.min(100,Math.round(je/he*100)):100,y=Ce?Math.min(100,Math.round(ce/Ce*100)):100,pe=he!==null&&je>=he,A=Ce!==null&&ce>=Ce,Z=!!I&&(I.planoSelecionado!==z||I.statusSelecionado!==re||I.limiteFiliais!==ga(q)||I.limiteUsuarios!==ga(G));function K(N){const J=S.find(Me=>Me.codigo===N);H(N),ne((J==null?void 0:J.limite_filiais)??""),ae((J==null?void 0:J.limite_usuarios)??"")}async function Q(){if(l){k(!0);try{const N=await hl({empresaId:a,planoCodigo:z,status:re,limiteFiliais:q===""?null:Number(q),limiteUsuarios:G===""?null:Number(G)});P(N),M({planoSelecionado:z,statusSelecionado:re,limiteFiliais:ga(q),limiteUsuarios:ga(G)}),d==null||d("Billing atualizado com sucesso.","info")}catch(N){console.error("Erro ao salvar billing:",N),d==null||d("Erro ao salvar billing: "+N.message,"erro")}finally{k(!1)}}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"💼 Billing Foundation"}),e.jsx("button",{style:t.btnCinza,onClick:m,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"billing-hero",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Base comercial SaaS"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"})," • Status: ",e.jsx("strong",{children:(T==null?void 0:T.status)||"trial estrutural"})]}),e.jsx("p",{style:t.textoAjuda,children:"Esta fase cria a fundação de planos, limites e assinatura. Ainda não bloqueia o uso do app; os bloqueios comerciais ficam para o hardening posterior."})]}),e.jsxs("div",{className:"billing-current-plan",children:[e.jsx("span",{children:"Plano atual"}),e.jsx("strong",{children:(Y==null?void 0:Y.nome)||"Profissional"}),e.jsxs("small",{children:[sr(Y==null?void 0:Y.valor_mensal)," / mês"]})]})]}),e.jsxs("section",{className:"billing-kpi-grid",children:[e.jsxs("div",{className:`billing-kpi-card ${pe?"warning":""}`,children:[e.jsx("span",{children:"Filiais em uso"}),e.jsx("strong",{children:je}),e.jsx("small",{children:nr(he,"filial liberada","filiais liberadas")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${oe}%`}})})]}),e.jsxs("div",{className:`billing-kpi-card ${A?"warning":""}`,children:[e.jsx("span",{children:"Usuários em uso"}),e.jsx("strong",{children:ce}),e.jsx("small",{children:nr(Ce,"usuário liberado","usuários liberados")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${y}%`}})})]}),e.jsxs("div",{className:"billing-kpi-card",children:[e.jsx("span",{children:"Status comercial"}),e.jsx("strong",{children:re}),e.jsx("small",{children:T!=null&&T.trial_fim?`Trial até ${bl(T.trial_fim)}`:"Trial preparado"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Planos disponíveis"}),e.jsx("div",{className:"billing-plan-grid",children:S.map(N=>e.jsxs("button",{type:"button",className:`billing-plan-card ${z===N.codigo?"selected":""}`,onClick:()=>K(N.codigo),disabled:!l,children:[e.jsx("span",{children:N.nome}),e.jsx("strong",{children:sr(N.valor_mensal)}),e.jsx("small",{children:N.descricao}),e.jsx("ul",{children:(N.recursos||[]).map(J=>e.jsx("li",{children:J},J))})]},N.codigo))})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"billing-section-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Assinatura e limites"}),e.jsx("p",{style:t.textoNota,children:"Defina os limites comerciais da empresa sem alterar os dados operacionais já validados."})]}),!l&&e.jsx("span",{className:"billing-readonly",children:"Somente leitura"}),l&&Z&&e.jsx("span",{className:"billing-pending",children:"● Alterações pendentes"})]}),e.jsxs("div",{className:"billing-form-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Plano"}),e.jsx("select",{style:t.input,value:z,disabled:!l,onChange:N=>K(N.target.value),children:S.map(N=>e.jsx("option",{value:N.codigo,children:N.nome},N.codigo))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Status"}),e.jsxs("select",{style:t.input,value:re,disabled:!l,onChange:N=>V(N.target.value),children:[e.jsx("option",{value:"trial",children:"Trial"}),e.jsx("option",{value:"ativa",children:"Ativa"}),e.jsx("option",{value:"pausada",children:"Pausada"}),e.jsx("option",{value:"cancelada",children:"Cancelada"})]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de filiais"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:q,disabled:!l,onChange:N=>ne(N.target.value)})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de usuários"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:G,disabled:!l,onChange:N=>ae(N.target.value)})]})]}),l&&e.jsx("button",{style:{...t.btnSalvar,opacity:f||_||!Z?.65:1},disabled:f||_||!Z,onClick:Q,children:_?"Salvando...":Z?"Salvar alterações do billing":"Billing salvo"})]})]})}function jl(){return new Date().toISOString().slice(0,10)}function Bo(t){return String(t||"").trim().replace(/\s+/g," ")}function Fa({numero:t,titulo:a,descricao:o,concluido:r,ativo:n,children:d}){return e.jsxs("section",{className:`onboarding-step-card ${r?"done":""} ${n?"active":""}`,children:[e.jsxs("div",{className:"onboarding-step-head",children:[e.jsx("div",{className:"onboarding-step-number",children:r?"✓":t}),e.jsxs("div",{children:[e.jsx("span",{children:r?"Concluído":n?"Próximo passo":"Pendente"}),e.jsx("h3",{children:a}),e.jsx("p",{children:o})]})]}),n&&e.jsx("div",{className:"onboarding-step-body",children:d})]})}function yl({styles:t,empresaId:a,empresaNome:o,filiais:r=[],centros:n=[],contas:d=[],mostrarAviso:l,onRefresh:m,voltarPainel:f,abrirDashboard:b}){var K,Q;const[_,k]=c.useState(!1),[S,g]=c.useState("Loja Centro"),[T,P]=c.useState("Operacional"),[z,H]=c.useState("Primeira conta de teste"),[re,V]=c.useState("100,00"),[q,ne]=c.useState(jl()),[G,ae]=c.useState(""),[I,M]=c.useState(""),Y=c.useMemo(()=>r.filter(N=>(N==null?void 0:N.ativo)!==!1),[r]),je=c.useMemo(()=>d.filter(N=>(N==null?void 0:N.excluido)!==!0),[d]),ce={empresa:!!a,filial:Y.length>0,centro:n.length>0,conta:je.length>0},he=Math.round([ce.empresa,ce.filial,ce.centro,ce.conta].filter(Boolean).length/4*100),Ce=he===100,oe=ce.empresa?ce.filial?ce.centro?ce.conta?"dashboard":"conta":"centro":"filial":"empresa";async function y(){await(m==null?void 0:m())}async function pe(){const N=Bo(S);if(!a)return l==null?void 0:l("Empresa não identificada para onboarding.","erro");if(N.length<2)return l==null?void 0:l("Informe o nome da primeira filial.","erro");k(!0);try{const{error:J}=await D.from("df_filiais").insert([{empresa_id:a,nome:N,ativo:!0}]);if(J)throw J;l==null||l("Primeira filial criada com sucesso.","info"),await y()}catch(J){l==null||l("Erro ao criar filial: "+J.message,"erro")}finally{k(!1)}}async function A(){const N=Bo(T);if(!a)return l==null?void 0:l("Empresa não identificada para onboarding.","erro");if(N.length<2)return l==null?void 0:l("Informe o nome do primeiro centro de custo.","erro");k(!0);try{const{error:J}=await D.from("df_centros_custo").insert([{empresa_id:a,nome:N}]);if(J)throw J;l==null||l("Centro de custo criado com sucesso.","info"),await y()}catch(J){l==null||l("Erro ao criar centro de custo: "+J.message,"erro")}finally{k(!1)}}async function Z(){var we,U;if(!a)return l==null?void 0:l("Empresa não identificada para onboarding.","erro");const N=Bo(z),J=Nr(re),Me=G||((we=Y[0])==null?void 0:we.id)||null,_e=I||((U=n[0])==null?void 0:U.id)||null;if(N.length<2)return l==null?void 0:l("Informe a descrição da primeira conta.","erro");if(!J||J<=0)return l==null?void 0:l("Informe um valor válido para a primeira conta.","erro");if(!q)return l==null?void 0:l("Informe o vencimento da primeira conta.","erro");k(!0);try{const fe={empresa_id:a,descricao:N,valor:J,data_vencimento:q,vencimento:q,status:"pendente",centro_custo_id:_e,filial_id:Me,excluido:!1},{error:Ae}=await D.from("df_contas").insert([fe]);if(Ae)throw Ae;l==null||l("Primeira conta criada. Dashboard pronto para uso.","info"),await y()}catch(fe){l==null||l("Erro ao criar primeira conta: "+fe.message,"erro")}finally{k(!1)}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"🚀 Onboarding SaaS"}),e.jsx("button",{style:t.btnCinza,onClick:f,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"onboarding-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"onboarding-eyebrow",children:"Configuração inicial"}),e.jsx("h2",{style:t.subtitulo,children:"Deixe a empresa pronta para operar"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"}),". Este fluxo prepara a primeira unidade, centro de custo e conta para liberar o dashboard operacional."]})]}),e.jsxs("div",{className:"onboarding-progress-box",children:[e.jsxs("span",{children:[he,"%"]}),e.jsx("small",{children:Ce?"Onboarding completo":"Em implantação"}),e.jsx("div",{className:"onboarding-progress",children:e.jsx("i",{style:{width:`${he}%`}})})]})]}),e.jsxs("section",{className:"onboarding-kpi-grid",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Filiais"}),e.jsx("strong",{children:Y.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Centros de custo"}),e.jsx("strong",{children:n.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Contas ativas"}),e.jsx("strong",{children:je.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Status"}),e.jsx("strong",{children:Ce?"Pronto":"Guiado"})]})]}),e.jsxs("div",{className:"onboarding-steps-grid",children:[e.jsx(Fa,{numero:"1",titulo:"Empresa ativa",descricao:"A empresa atual já está definida no tenant selecionado.",concluido:ce.empresa,ativo:oe==="empresa",children:e.jsx("p",{style:t.textoNota,children:"Selecione ou crie uma empresa pelo Painel Master antes de continuar."})}),e.jsxs(Fa,{numero:"2",titulo:"Primeira filial",descricao:"Crie a unidade inicial para separar operação e indicadores.",concluido:ce.filial,ativo:oe==="filial",children:[e.jsx("input",{style:t.input,value:S,onChange:N=>g(N.target.value),placeholder:"Ex: Loja Centro"}),e.jsx("button",{style:t.btnSalvar,disabled:_,onClick:pe,children:_?"Criando...":"Criar primeira filial"})]}),e.jsxs(Fa,{numero:"3",titulo:"Centro de custo",descricao:"Crie uma classificação financeira básica para as primeiras contas.",concluido:ce.centro,ativo:oe==="centro",children:[e.jsx("input",{style:t.input,value:T,onChange:N=>P(N.target.value),placeholder:"Ex: Operacional"}),e.jsx("button",{style:t.btnSalvar,disabled:_,onClick:A,children:_?"Criando...":"Criar centro de custo"})]}),e.jsxs(Fa,{numero:"4",titulo:"Primeira conta",descricao:"Registre uma conta inicial para alimentar KPIs, ranking e dashboard.",concluido:ce.conta,ativo:oe==="conta",children:[e.jsxs("div",{className:"onboarding-form-grid",children:[e.jsx("input",{style:t.input,value:z,onChange:N=>H(N.target.value),placeholder:"Descrição"}),e.jsx("input",{style:t.input,value:re,onChange:N=>V(N.target.value),placeholder:"Valor"}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:N=>ne(N.target.value)}),e.jsxs("select",{style:t.input,value:G,onChange:N=>ae(N.target.value),children:[e.jsx("option",{value:"",children:((K=Y[0])==null?void 0:K.nome)||"Filial padrão"}),Y.map(N=>e.jsx("option",{value:N.id,children:N.nome},N.id))]}),e.jsxs("select",{style:t.input,value:I,onChange:N=>M(N.target.value),children:[e.jsx("option",{value:"",children:((Q=n[0])==null?void 0:Q.nome)||"Centro padrão"}),n.map(N=>e.jsx("option",{value:N.id,children:N.nome},N.id))]})]}),e.jsx("button",{style:t.btnSalvar,disabled:_,onClick:Z,children:_?"Criando...":"Criar primeira conta"})]}),e.jsxs(Fa,{numero:"5",titulo:"Dashboard pronto",descricao:"A operação inicial já pode ser acompanhada no dashboard.",concluido:Ce,ativo:oe==="dashboard",children:[e.jsx("p",{style:t.textoNota,children:"Base inicial concluída. Revise os KPIs, ranking de unidades e filtros por filial."}),e.jsx("button",{style:t.btnSalvar,onClick:b,children:"Ir para o dashboard"})]})]})]})}function wl({novoEmailUsuario:t,setNovoEmailUsuario:a,novaSenhaUsuario:o,setNovaSenhaUsuario:r,confirmarNovaSenhaUsuario:n,setConfirmarNovaSenhaUsuario:d,salvarMeuEmail:l,salvarMinhaSenha:m,styles:f}){return e.jsxs("div",{className:"users-account-grid users-security-grid",children:[e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar e-mail"}),e.jsx("small",{style:f.textoAjuda,children:"Confirmação pode ser solicitada."})]}),e.jsx("input",{style:f.input,type:"email",placeholder:"Novo e-mail",value:t,onChange:b=>a(b.target.value)}),e.jsx("button",{style:f.btnSalvar,onClick:l,children:"Atualizar e-mail"})]}),e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar senha"}),e.jsx("small",{style:f.textoAjuda,children:"Mínimo de 6 caracteres."})]}),e.jsxs("div",{className:"users-security-password-grid",children:[e.jsx("input",{style:f.input,type:"password",placeholder:"Nova senha",value:o,onChange:b=>r(b.target.value)}),e.jsx("input",{style:f.input,type:"password",placeholder:"Confirmar nova senha",value:n,onChange:b=>d(b.target.value)})]}),e.jsx("button",{style:f.btnSalvar,onClick:m,children:"Atualizar senha"})]})]})}function kl({styles:t,EmptyState:a,podeAcessarConfiguracoes:o,podeAdministrarUsuarios:r,navegarPara:n,usuarioLogado:d,normalizarPerfil:l,perfilUsuario:m,permissoesUsuario:f,novoEmailUsuario:b,setNovoEmailUsuario:_,novaSenhaUsuario:k,setNovaSenhaUsuario:S,confirmarNovaSenhaUsuario:g,setConfirmarNovaSenhaUsuario:T,salvarMeuEmail:P,salvarMinhaSenha:z,empresasDisponiveis:H,empresaId:re,trocandoEmpresa:V,trocarEmpresaAtiva:q,buscarUsuariosEmpresa:ne,primeiraLetraMaiuscula:G,nomeConviteUsuario:ae,setNomeConviteUsuario:I,emailConviteUsuario:M,setEmailConviteUsuario:Y,senhaConviteUsuario:je,setSenhaConviteUsuario:ce,perfilConviteUsuario:he,setPerfilConviteUsuario:Ce,criandoUsuarioManual:oe,adicionarUsuarioEmpresa:y,usuariosCarregando:pe,usuariosInicializados:A,usuariosErro:Z,usuariosEmpresa:K,filiais:Q,filiaisUsuariosEmpresa:N,salvandoFilialUsuario:J,liberarTodasFiliaisUsuario:Me,alternarFilialUsuario:_e,atualizarPerfilUsuarioEmpresa:we,enviarAcessoUsuarioEmpresa:U,removerUsuarioEmpresa:fe}){if(!o())return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Usuários"}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:t.textoNota,children:"Seu perfil atual não permite acessar a gestão de usuários."}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("contas"),children:"← Voltar"})]})]});const Ae=(d==null?void 0:d.email)||"";return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Gestão de usuários"}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsx("h2",{style:t.subtitulo,children:"Minha conta"}),e.jsxs("p",{style:t.textoNota,children:["Usuário conectado: ",e.jsx("strong",{children:Ae})," • Perfil: ",e.jsx("strong",{children:l(m)}),f!=null&&f.isMaster?e.jsxs(e.Fragment,{children:[" • Global: ",e.jsx("strong",{children:"master"})]}):null]}),e.jsx(wl,{novoEmailUsuario:b,setNovoEmailUsuario:_,novaSenhaUsuario:k,setNovaSenhaUsuario:S,confirmarNovaSenhaUsuario:g,setConfirmarNovaSenhaUsuario:T,salvarMeuEmail:P,salvarMinhaSenha:z,styles:t})]}),(f==null?void 0:f.canSwitchCompany)&&H.length>1&&e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsxs("div",{className:"users-header-row",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"🏢 Empresas disponíveis"}),e.jsx("p",{style:t.textoNota,children:"Troque a empresa ativa para recarregar os usuários e dados do tenant selecionado."})]}),e.jsx("span",{className:"roleBadge admin",children:"master"})]}),e.jsx("select",{style:t.input,value:re||"",disabled:V,onChange:C=>q(C.target.value),children:H.map(C=>e.jsx("option",{value:C.id,children:C.nome||C.id},C.id))})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsxs("div",{className:"users-header-row",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Usuários da empresa"}),e.jsx("p",{style:t.textoNota,children:"Defina perfil e escopo por filial. Sem filial marcada = acesso a todas as filiais da empresa."})]}),e.jsx("button",{style:t.btnCinza,onClick:()=>ne(),children:"Atualizar"})]}),e.jsxs("div",{className:"users-permission-guide",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Admin:"})," acesso total"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Gerente:"})," contas, notas, relatórios e configurações operacionais"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Financeiro:"})," contas, notas e relatórios"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Operacional:"})," contas e notas operacionais"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Visualização:"})," somente consulta"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Operador:"})," compatibilidade com acessos antigos"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Filiais:"})," limita o usuário às unidades selecionadas"]})]}),r()&&e.jsxs("div",{className:"users-add-card",children:[e.jsx("input",{style:t.input,type:"text",placeholder:"Nome do usuário",value:ae,onChange:C=>I(G(C.target.value))}),e.jsx("input",{style:t.input,type:"email",placeholder:"E-mail do usuário",value:M,onChange:C=>Y(C.target.value)}),e.jsx("input",{style:t.input,type:"text",placeholder:"Senha provisória manual",value:je,onChange:C=>ce(C.target.value)}),e.jsxs("select",{style:t.input,value:he,onChange:C=>Ce(C.target.value),children:[e.jsx("option",{value:"visualizacao",children:"Visualização"}),e.jsx("option",{value:"operacional",children:"Operacional"}),e.jsx("option",{value:"financeiro",children:"Financeiro"}),e.jsx("option",{value:"operador",children:"Operador"}),e.jsx("option",{value:"gerente",children:"Gerente"}),e.jsx("option",{value:"admin",children:"Admin"})]}),e.jsx("button",{style:t.btnSalvar,onClick:y,disabled:oe,children:oe?"Criando acesso...":"Criar acesso manual"}),e.jsx("small",{style:t.textoNota,children:"Sem envio de e-mail: o admin entrega o e-mail e a senha provisória manualmente."})]}),e.jsxs("div",{className:"users-list users-list-stable","aria-busy":pe,children:[pe&&!A&&e.jsx(a,{icon:"⏳",title:"Carregando usuários",description:"Buscando acessos cadastrados nesta empresa."}),!pe&&Z&&e.jsx(a,{icon:"⚠️",title:"Não foi possível carregar usuários",description:Z}),!pe&&!Z&&A&&K.length===0&&e.jsx(a,{icon:"👥",title:"Nenhum usuário cadastrado",description:"Adicione usuários para dividir a operação com segurança e níveis de acesso."}),K.map(C=>{const be=C.user_id&&(d==null?void 0:d.id)&&C.user_id===d.id,ze=!C.user_id;return e.jsxs("div",{className:"user-card userCard",children:[e.jsxs("div",{className:"user-main-info userInfo",children:[e.jsx("strong",{children:C.nome||C.email||"Usuário sem nome"}),e.jsx("small",{children:C.email||C.user_id||"Sem e-mail vinculado"}),be&&e.jsx("span",{className:"user-badge user-badge-self",children:"Você"}),ze&&e.jsx("span",{className:"user-badge user-badge-pending",children:"Pendente de vínculo"})]}),e.jsx("span",{className:`roleBadge ${l(C.perfil)}`,children:l(C.perfil)}),e.jsxs("select",{className:"user-role-select",style:t.input,value:l(C.perfil),disabled:!r(),onChange:me=>we(C,me.target.value),children:[e.jsx("option",{value:"admin",children:"Admin"}),e.jsx("option",{value:"gerente",children:"Gerente"}),e.jsx("option",{value:"financeiro",children:"Financeiro"}),e.jsx("option",{value:"operacional",children:"Operacional"}),e.jsx("option",{value:"visualizacao",children:"Visualização"}),e.jsx("option",{value:"operador",children:"Operador"})]}),e.jsxs("div",{className:"user-branch-scope",children:[e.jsxs("div",{className:"user-branch-scope-header",children:[e.jsx("strong",{children:"Filiais permitidas"}),e.jsx("button",{type:"button",className:"user-branch-clear",disabled:!r()||J===C.id,onClick:()=>Me(C),title:"Deixar o usuário com acesso a todas as filiais da empresa",children:"Todas"})]}),e.jsx("div",{className:"user-branch-list",children:Q.length===0?e.jsx("small",{children:"Nenhuma filial ativa cadastrada."}):Q.map(me=>{const $=(N[C.id]||[]).includes(me.id);return e.jsxs("label",{className:`user-branch-chip ${$?"selected":""}`,children:[e.jsx("input",{type:"checkbox",checked:$,disabled:!r()||J===C.id,onChange:()=>_e(C,me.id)}),e.jsx("span",{children:me.nome||"Filial"})]},me.id)})}),(N[C.id]||[]).length===0&&e.jsx("small",{className:"user-branch-all",children:"Acesso a todas as filiais da empresa."})]}),r()&&e.jsxs("div",{className:"user-actions",children:[e.jsx("button",{style:t.btnSecundario,onClick:()=>U(C),title:"Fallback por e-mail. O acesso principal agora é criação manual com senha provisória.",children:"Enviar link"}),e.jsx("button",{style:t.btnExcluir,disabled:be,onClick:()=>fe(C),title:be?"Você não pode remover o próprio acesso.":"Remover usuário",children:"Remover"})]})]},C.id||C.user_id||C.email)})]})]})]})}const Tr=c.createContext(null),Vo="df_empresa_ativa";function Cl(){if(typeof window>"u")return null;try{return JSON.parse(window.localStorage.getItem(Vo)||"null")}catch{return null}}function lr(t){if(!(typeof window>"u")){if(!(t!=null&&t.id)){window.localStorage.removeItem(Vo);return}window.localStorage.setItem(Vo,JSON.stringify(t))}}const Nl={sucesso:"Sucesso",success:"Sucesso",erro:"Atenção",error:"Atenção",alerta:"Atenção",warning:"Atenção",info:"Aviso"};function Sl(t){return t==="success"?"sucesso":t==="error"?"erro":t==="warning"?"alerta":t||"info"}function _l({children:t}){const[a,o]=c.useState(!1),[r,n]=c.useState(()=>Cl()),[d,l]=c.useState([]),[m,f]=c.useState(null),b=c.useRef(null),_=c.useCallback(z=>{const H=z!=null&&z.id?{id:z.id,nome:z.nome||"",perfil:z.perfil||"operador"}:null;n(H),lr(H)},[]),k=c.useCallback(()=>{n(null),lr(null)},[]),S=c.useCallback(()=>{b.current&&(window.clearTimeout(b.current),b.current=null),f(null)},[]),g=c.useCallback((z,H="info",re={})=>{if(!z)return;const V=Sl(H),q=re.duration??5200;b.current&&window.clearTimeout(b.current),f({id:Date.now(),message:String(z),type:V,title:re.title||Nl[V]||"Aviso"}),b.current=window.setTimeout(()=>{f(null),b.current=null},q)},[]),T=c.useCallback(async z=>{o(!0);try{return await z()}finally{o(!1)}},[]),P=c.useMemo(()=>({globalLoading:a,setGlobalLoading:o,empresaAtiva:r,empresaId:(r==null?void 0:r.id)||null,perfilEmpresaAtiva:(r==null?void 0:r.perfil)||"",setEmpresaAtiva:_,limparEmpresaAtiva:k,empresasDisponiveis:d,setEmpresasDisponiveis:l,toast:m,showToast:g,hideToast:S,runWithLoading:T}),[a,r,d,m,g,S,T,_,k]);return e.jsx(Tr.Provider,{value:P,children:t})}function Dr(){const t=c.useContext(Tr);if(!t)throw new Error("useApp deve ser usado dentro do AppProvider");return t}function El({onLogin:t}){const{showToast:a}=Dr(),[o,r]=c.useState(""),[n,d]=c.useState(""),[l,m]=c.useState(!1);async function f(b){if(b.preventDefault(),!o||!n){a("Informe e-mail e senha","erro");return}const _=rs();if(_){a(_,"erro");return}m(!0);const{data:k,error:S}=await D.auth.signInWithPassword({email:o,password:n});if(m(!1),S){a("E-mail ou senha inválidos","erro");return}const{error:g}=await D.rpc("vincular_usuario_logado");g&&console.warn("Não foi possível executar vínculo automático:",g.message),t(k.user)}return e.jsx("div",{style:Jt.page,children:e.jsxs("form",{style:Jt.card,onSubmit:f,children:[e.jsx("h1",{style:Jt.titulo,children:"Dona Flor Financeiro"}),e.jsx("p",{style:Jt.subtitulo,children:"Acesse sua conta para continuar"}),e.jsx("input",{style:Jt.input,type:"email",placeholder:"E-mail",value:o,onChange:b=>r(b.target.value)}),e.jsx("input",{style:Jt.input,type:"password",placeholder:"Senha",value:n,onChange:b=>d(b.target.value)}),e.jsx("button",{style:Jt.botao,disabled:l,children:l?"Entrando...":"Entrar"}),e.jsx("small",{style:Jt.ajuda,children:"Login seguro via Supabase Auth."})]})})}const Jt={page:{minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Arial"},card:{width:"100%",maxWidth:360,background:"#fff",borderRadius:18,padding:20,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:10},titulo:{margin:0,fontSize:26},subtitulo:{margin:"0 0 10px",color:"#666",fontSize:14},input:{width:"100%",padding:12,borderRadius:10,border:"1px solid #ccc",boxSizing:"border-box",fontSize:15},botao:{width:"100%",padding:12,borderRadius:10,border:"none",background:"#198754",color:"#fff",fontWeight:"bold",fontSize:15},ajuda:{color:"#666",textAlign:"center",marginTop:8}};function zl({styles:t,nomeEmpresa:a,navegarPara:o,menuNavegacaoAberto:r,setMenuNavegacaoAberto:n,canSwitchCompany:d=!1,empresasDisponiveis:l=[],empresaId:m="",trocarEmpresaAtiva:f,trocandoEmpresa:b=!1,nomeUsuario:_,abrirPerfilUsuario:k,sairDoSistema:S}){const g=d&&l.length>0,T=l.find(P=>P.id===m);return e.jsxs("section",{className:"no-print top-shell top-shell-clean",style:t.usuarioTopo,children:[e.jsx("div",{className:"top-shell-context",children:e.jsxs("button",{className:"top-shell-logo",style:t.logoMarca,onClick:()=>o("dashboard"),title:"Ir para o dashboard",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:t.logoImagem}),e.jsxs("span",{children:[e.jsx("strong",{children:a||"Dona Flor"}),e.jsx("small",{children:"Gestão Financeira"})]})]})}),e.jsxs("div",{className:"top-shell-actions",style:t.usuarioAcoes,children:[g&&(l.length>1?e.jsxs("label",{className:"company-switcher",title:"Trocar empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("select",{value:m||"",disabled:b,onChange:P=>f==null?void 0:f(P.target.value),"aria-label":"Empresa ativa",children:l.map(P=>e.jsx("option",{value:P.id,children:P.nome||P.id},P.id))})]}):e.jsxs("div",{className:"company-switcher company-switcher-static",title:"Empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("strong",{children:(T==null?void 0:T.nome)||a||"Empresa ativa"})]})),e.jsx("button",{type:"button",className:"top-user-profile-button top-user-profile-icon",title:`Meu perfil${typeof _=="function"?`: ${_()}`:""}`,onClick:()=>k==null?void 0:k(),"aria-label":"Abrir meu perfil",children:e.jsx("span",{"aria-hidden":"true",children:"👤"})}),e.jsx("button",{className:"mobile-menu-trigger",style:t.btnMenuTopo,onClick:()=>n(!r),children:"☰"})]})]})}function Pl({tela:t,icon:a,label:o,telaAtual:r,sidebarCompacta:n,navegarPara:d}){const l=t&&r===t;return e.jsxs("button",{className:l?"active":"",title:o,onClick:()=>d(t),children:[e.jsx("span",{className:"menu-icon",children:a}),!n&&e.jsx("span",{className:"menu-text",children:o})]})}function Rl({id:t,titulo:a,children:o,sidebarCompacta:r,gruposMenu:n,toggleGrupoMenu:d}){return e.jsxs("div",{className:"sidebar-group-clean",children:[e.jsxs("button",{className:"sidebar-group-toggle",onClick:()=>d(t),title:a,children:[e.jsx("span",{children:r?"•":a}),!r&&e.jsx("strong",{children:n[t]?"−":"+"})]}),(r||n[t])&&e.jsx("nav",{className:"desktop-sidebar-nav",children:o})]})}function Fl({sidebarCompacta:t,setSidebarCompacta:a,nomeUsuario:o,normalizarPerfil:r,perfilUsuario:n,menuSections:d,telaAtual:l,navegarPara:m,gruposMenu:f,toggleGrupoMenu:b,sairDoSistema:_}){const k=o(),S=r(n||"usuário");return e.jsxs("aside",{className:`desktop-sidebar no-print ${t?"compacta":""}`,children:[e.jsxs("div",{className:"desktop-sidebar-brand sidebar-brand-clean",title:"DF Gestão Financeira",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira"}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:"DF Gestão"}),e.jsx("small",{children:"Painel financeiro"})]})]}),e.jsxs("div",{className:"desktop-sidebar-user sidebar-user-clean",title:`${k} • ${S}`,children:[e.jsx("span",{className:"sidebar-user-avatar",children:String(k||"U").slice(0,1).toUpperCase()}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:k}),e.jsx("small",{children:S})]})]}),e.jsx("button",{className:"sidebar-collapse-btn sidebar-collapse-icon",onClick:()=>a(!t),title:t?"Expandir menu":"Recolher menu","aria-label":t?"Expandir menu":"Recolher menu",children:e.jsx("span",{className:"sidebar-collapse-arrow",children:t?"→":"←"})}),e.jsx("div",{className:"desktop-sidebar-scroll",children:d.map(g=>e.jsx(Rl,{id:g.id,titulo:g.titulo,sidebarCompacta:t,gruposMenu:f,toggleGrupoMenu:b,children:g.items.map(T=>e.jsx(Pl,{tela:T.tela,icon:T.icon,label:T.label,telaAtual:l,sidebarCompacta:t,navegarPara:m},T.tela))},g.id))}),e.jsx("div",{className:"desktop-sidebar-spacer"}),e.jsx("nav",{className:"desktop-sidebar-nav sidebar-exit",children:e.jsxs("button",{onClick:_,title:"Sair",children:[e.jsx("span",{className:"menu-icon",children:"🚪"}),!t&&e.jsx("span",{children:"Sair"})]})})]})}function $l({visible:t,styles:a,setMenuNavegacaoAberto:o,nomeUsuario:r,nomeUsuarioAtual:n,normalizarPerfil:d,perfilUsuario:l,menuSections:m,navegarPara:f,sairDoSistema:b,canSwitchCompany:_=!1,empresasDisponiveis:k=[],empresaId:S="",trocarEmpresaAtiva:g,trocandoEmpresa:T=!1,abrirPerfilUsuario:P}){if(!t)return null;const z=_&&k.length>0,H=k.find(q=>q.id===S),re=n||(typeof r=="function"?r():r)||"usuário",V=(q,ne,G,ae)=>e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:ae,children:[e.jsx("span",{children:q}),e.jsxs("div",{children:[e.jsx("strong",{children:ne}),e.jsx("small",{children:G})]})]});return e.jsx("div",{className:"no-print mobile-menu-backdrop",style:a.menuBackdrop,onClick:()=>o(!1),onTouchMove:q=>q.preventDefault(),children:e.jsxs("div",{className:"mobile-menu-panel",style:a.menuNavegacao,role:"dialog","aria-label":"Menu de navegação",onClick:q=>q.stopPropagation(),onWheel:q=>q.stopPropagation(),onTouchMove:q=>q.stopPropagation(),children:[e.jsxs("div",{style:a.menuPerfil,children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:a.menuPerfilIcone}),e.jsxs("div",{children:[e.jsx("strong",{children:re}),e.jsx("small",{children:d(l||"usuário")})]})]}),z&&e.jsxs("div",{className:"mobile-company-switcher",style:{margin:"12px 0 18px",padding:"12px 14px",border:"1px solid rgba(20, 184, 166, 0.22)",borderRadius:18,background:"rgba(240, 253, 250, 0.9)",display:"grid",gap:8},children:[e.jsx("span",{style:{fontSize:11,fontWeight:900,color:"#0f766e",textTransform:"uppercase",letterSpacing:".08em"},children:"Empresa ativa"}),k.length>1?e.jsx("select",{value:S||"",disabled:T,onChange:q=>{g==null||g(q.target.value),o(!1)},"aria-label":"Empresa ativa",style:{width:"100%",border:"0",background:"transparent",color:"#111827",fontWeight:900,fontSize:15,outline:"none"},children:k.map(q=>e.jsx("option",{value:q.id,children:q.nome||q.id},q.id))}):e.jsx("strong",{style:{color:"#111827",fontSize:15},children:(H==null?void 0:H.nome)||"Empresa ativa"})]}),e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:()=>{o(!1),P==null||P()},children:[e.jsx("span",{children:"👤"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Meu perfil"}),e.jsx("small",{children:"Editar nome do usuário"})]})]}),m.map((q,ne)=>e.jsxs("details",{className:"mobile-menu-group",open:ne===0,children:[e.jsx("summary",{children:q.titulo}),q.items.map(G=>V(G.icon,G.label,G.desc,()=>f(G.tela))),q.id==="sistema"&&e.jsxs("button",{type:"button",style:a.menuSairItem,onClick:b,children:[e.jsx("span",{children:"🚪"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Sair"}),e.jsx("small",{children:"Encerrar sessão"})]})]})]},q.id))]})})}function Ml({styles:t,editandoContaId:a,descricao:o,setDescricao:r,valor:n,setValor:d,dataVencimento:l,setDataVencimento:m,centroCustoId:f,setCentroCustoId:b,centros:_,filialId:k,setFilialId:S,filiais:g,observacaoConta:T,setObservacaoConta:P,contaRecorrente:z,setContaRecorrente:H,tipoRecorrencia:re,setTipoRecorrencia:V,diaVencimentoRecorrencia:q,setDiaVencimentoRecorrencia:ne,fecharConta:G,salvarConta:ae,primeiraLetraMaiuscula:I,limitarDataInput:M,formatarDataParaBanco:Y,fecharNota:je,setModalCentro:ce,setMenuAberto:he,setMenuNavegacaoAberto:Ce}){function oe(){G(),je(),ce(!1),he(!1),Ce(!1)}return e.jsx("div",{style:t.overlay,onClick:oe,children:e.jsxs("div",{style:t.modal,onClick:y=>y.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Conta":"Nova Conta"}),e.jsx("input",{style:t.inputModal,placeholder:"Descrição",value:o,onChange:y=>r(I(y.target.value))}),e.jsx("input",{style:t.inputModal,placeholder:"Valor. Ex: 150,90",value:n,onChange:y=>d(y.target.value)}),e.jsx("input",{style:t.inputModal,type:"date",value:l,onChange:y=>m(M(y.target.value))}),e.jsxs("select",{style:t.inputModal,value:k,onChange:y=>S(y.target.value),children:[e.jsx("option",{value:"",children:"Filial / unidade"}),(g||[]).map(y=>e.jsx("option",{value:y.id,children:y.nome},y.id))]}),e.jsxs("select",{style:t.inputModal,value:f,onChange:y=>b(y.target.value),children:[e.jsx("option",{value:"",children:"Centro de custo"}),_.map(y=>e.jsx("option",{value:y.id,children:y.nome},y.id))]}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Observação ou comentário da conta...",value:T,onChange:y=>P(I(y.target.value))}),e.jsxs("div",{className:"recurrence-box",style:t.blocoRecorrenciaConta,children:[e.jsxs("label",{className:"checkbox-row-fix",style:t.switchLinhaCompacta,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"🔁 Conta recorrente"}),e.jsx("small",{style:t.textoAjuda,children:"Ideal para aluguel, internet, sistema, mensalidades e contas fixas."})]}),e.jsx("input",{type:"checkbox",checked:z,onChange:y=>{const pe=y.target.checked;H(pe),pe&&l&&ne(String(Number(Y(l).slice(8,10))))}})]}),z&&e.jsxs("div",{className:"recurrence-fields",children:[e.jsx("select",{style:t.inputModal,value:re,onChange:y=>V(y.target.value),children:e.jsx("option",{value:"mensal",children:"Mensal"})}),e.jsx("input",{style:t.inputModal,type:"number",min:"1",max:"31",placeholder:"Dia de vencimento mensal. Ex: 5",value:q||(l?String(Number(Y(l).slice(8,10))):""),onChange:y=>ne(y.target.value)}),e.jsx("small",{style:t.textoAjuda,children:"O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir."})]})]}),e.jsx("button",{style:t.btnSalvar,type:"button",onClick:y=>{y.preventDefault(),y.stopPropagation(),ae()},children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,type:"button",onClick:G,children:"Cancelar"})]})})}function Tl({styles:t,editandoNotaId:a,tituloNota:o,setTituloNota:r,prioridadeNota:n,setPrioridadeNota:d,dataEventoNota:l,setDataEventoNota:m,conteudoNota:f,setConteudoNota:b,filialNotaId:_,setFilialNotaId:k,filiais:S,salvarNota:g,fecharNota:T,fecharConta:P,setModalCentro:z,setMenuAberto:H,setMenuNavegacaoAberto:re,primeiraLetraMaiuscula:V,limitarDataInput:q}){function ne(){P(),T(),z(!1),H(!1),re(!1)}return e.jsx("div",{style:t.overlay,onClick:ne,children:e.jsxs("div",{style:t.modal,onClick:G=>G.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Nota":"Nova Nota"}),e.jsx("input",{style:t.inputModal,placeholder:"Título",value:o,onChange:G=>r(V(G.target.value))}),e.jsxs("select",{style:t.inputModal,value:n,onChange:G=>d(G.target.value),children:[e.jsx("option",{value:"normal",children:"Prioridade normal"}),e.jsx("option",{value:"urgente",children:"Urgente"}),e.jsx("option",{value:"critico",children:"Crítico"})]}),e.jsxs("select",{style:t.inputModal,value:_,onChange:G=>k(G.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(S||[]).map(G=>e.jsx("option",{value:G.id,children:G.nome},G.id))]}),e.jsx("input",{style:t.inputModal,type:"date",value:l,onChange:G=>m(q(G.target.value))}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Conteúdo...",value:f,onChange:G=>b(G.target.value)}),e.jsx("button",{style:t.btnSalvar,onClick:g,children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,onClick:T,children:"Cancelar"})]})})}function Dl({styles:t,novoCentro:a,setNovoCentro:o,salvarCentro:r,centros:n,abrirConfirmacao:d,excluirCentro:l,fecharConta:m,fecharNota:f,setModalCentro:b,setMenuAberto:_,setMenuNavegacaoAberto:k}){function S(){m(),f(),b(!1),_(!1),k(!1)}return e.jsx("div",{style:t.overlay,onClick:S,children:e.jsxs("div",{style:t.modal,onClick:g=>g.stopPropagation(),children:[e.jsx("h3",{children:"Centros de Custo"}),e.jsx("input",{style:t.inputModal,placeholder:"Novo centro",value:a,onChange:g=>o(g.target.value),autoFocus:!0}),e.jsx("button",{style:t.btnSalvar,onClick:r,children:"Salvar Centro"}),n.map(g=>e.jsxs("div",{style:t.itemCentro,children:[e.jsx("span",{children:g.nome}),e.jsx("button",{style:t.btnMiniExcluir,onClick:()=>d({titulo:"Excluir centro de custo",mensagem:`Deseja excluir o centro ${g.nome}?`,textoConfirmar:"Excluir",tipo:"perigo",acao:()=>l(g.id)}),children:"excluir"})]},g.id)),e.jsx("button",{style:t.btnCancelar,onClick:()=>b(!1),children:"Fechar"})]})})}function Il({styles:t,confirmacao:a,fecharConfirmacao:o,executarConfirmacao:r}){return a!=null&&a.aberto?e.jsx("div",{style:t.overlayConfirmacao,children:e.jsxs("div",{style:t.modalConfirmacao,children:[e.jsx("div",{style:t.confirmacaoIcone,children:a.tipo==="perigo"?"⚠️":a.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:t.confirmacaoTitulo,children:a.titulo}),e.jsx("p",{style:t.confirmacaoTexto,children:a.mensagem}),e.jsxs("div",{style:t.confirmacaoAcoes,children:[e.jsx("button",{style:t.btnConfirmarCancelar,onClick:o,children:"Cancelar"}),e.jsx("button",{style:{...t.btnConfirmarAcao,background:a.tipo==="perigo"?"#dc3545":a.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:r,children:a.textoConfirmar})]})]})}):null}function Al({nome:t,setNome:a,email:o,salvando:r,onClose:n,onSave:d}){return e.jsx("div",{className:"profile-modal-backdrop",role:"presentation",onClick:n,children:e.jsxs("div",{className:"profile-modal-card",role:"dialog","aria-modal":"true","aria-label":"Meu perfil",onClick:l=>l.stopPropagation(),children:[e.jsxs("div",{className:"profile-modal-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Perfil"}),e.jsx("h2",{children:"Meu perfil"})]}),e.jsx("button",{type:"button",onClick:n,"aria-label":"Fechar",children:"×"})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"Nome de exibição"}),e.jsx("input",{value:t,onChange:l=>a(l.target.value),placeholder:"Digite seu nome",autoFocus:!0,maxLength:80})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"E-mail"}),e.jsx("input",{value:o||"",readOnly:!0})]}),e.jsxs("div",{className:"profile-modal-actions",children:[e.jsx("button",{type:"button",className:"profile-modal-cancel",onClick:n,disabled:r,children:"Cancelar"}),e.jsx("button",{type:"button",className:"profile-modal-save",onClick:d,disabled:r,children:r?"Salvando...":"Salvar perfil"})]})]})})}function dr({visible:t,message:a="Carregando..."}){return t?e.jsx("div",{className:"global-loader-overlay",role:"status","aria-live":"polite",children:e.jsxs("div",{className:"global-loader-card",children:[e.jsx("div",{className:"global-loader-spinner"}),e.jsx("span",{children:a})]})}):null}function qo({toast:t,onClose:a}){if(!t)return null;const o=t.type||"info";return e.jsxs("div",{className:`app-toast app-toast-${o} app-toast-global`,role:o==="erro"?"alert":"status","aria-live":o==="erro"?"assertive":"polite",onClick:a,children:[e.jsx("div",{className:`app-toast-icon app-toast-icon-${o}`,children:o==="erro"?"!":o==="sucesso"?"✓":o==="alerta"?"!":"i"}),e.jsxs("div",{className:"app-toast-content",children:[e.jsx("strong",{children:t.title||(o==="erro"?"Atenção":"Aviso")}),e.jsx("span",{children:t.message})]}),e.jsx("button",{type:"button",className:"app-toast-close","aria-label":"Fechar aviso",onClick:r=>{r.stopPropagation(),a==null||a()},children:"×"})]})}const Ir=c.createContext(null);function cr({children:t,contas:a=[],contasFiltradas:o=[],navegarPara:r}){const[n,d]=c.useState(!1),[l,m]=c.useState(""),f=c.useMemo(()=>Er({contas:a,contasFiltradas:o}),[a,o]),b=c.useMemo(()=>({open:n,setOpen:d,toggle:()=>d(_=>!_),close:()=>d(!1),intelligence:f,lastQuestion:l,setLastQuestion:m,navegarPara:r}),[n,f,l,r]);return e.jsx(Ir.Provider,{value:b,children:t})}function Dt(){const t=c.useContext(Ir);if(!t)throw new Error("useCopilot deve ser usado dentro de CopilotProvider");return t}function pr(){const{open:t,toggle:a,intelligence:o}=Dt(),r=o.totals.vencido>0;return t?null:e.jsxs("button",{className:`copilot-floating-button no-print ${r?"has-risk":""}`,type:"button",onClick:n=>{n.preventDefault(),n.stopPropagation(),a()},"aria-label":"Abrir Copilot IA",children:[e.jsx("span",{children:"✨"}),e.jsx("strong",{children:"Copilot IA"}),r&&e.jsx("i",{})]})}function po(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Bl(){const{intelligence:t}=Dt(),{score:a,status:o,executiveSummary:r,totals:n}=t;return e.jsxs("section",{className:`copilot-card copilot-score-${o.tone}`,children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Executive AI Summary"}),e.jsxs("strong",{children:[a,"/100"]})]}),e.jsx("p",{children:r}),e.jsxs("div",{className:"copilot-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Total"}),e.jsx("b",{children:po(n.total)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Pendente"}),e.jsx("b",{children:po(n.pendente)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Vencido"}),e.jsx("b",{children:po(n.vencido)})]})]})]})}function ql(){const{intelligence:t,navegarPara:a,close:o}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Smart Priority Engine"}),e.jsx("strong",{children:t.priorities.length})]}),e.jsx("div",{className:"copilot-priority-list",children:t.priorities.map((r,n)=>e.jsxs("article",{className:`copilot-priority copilot-priority-${r.tone}`,children:[e.jsxs("div",{children:[e.jsxs("small",{children:[r.level," impacto · ",r.impact]}),e.jsx("strong",{children:r.title}),e.jsx("p",{children:r.description})]}),e.jsx("button",{type:"button",onClick:()=>{a==null||a(r.action.includes("Relatórios")?"relatorios":"contas"),o()},children:r.action})]},`${r.title}-${n}`))})]})}function Ll(){const{intelligence:t}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Insights IA"}),e.jsx("strong",{children:"Live"})]}),e.jsx("div",{className:"copilot-insights",children:t.insights.map(a=>e.jsxs("p",{children:["✦ ",a]},a))})]})}function Ol(){const{intelligence:t}=Dt();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Recomendações acionáveis"}),e.jsx("strong",{children:t.recomendacoes.length})]}),e.jsx("div",{className:"copilot-recommendations",children:t.recomendacoes.map((a,o)=>e.jsxs("p",{children:[e.jsx("b",{children:o+1}),a]},`${a}-${o}`))})]})}function Ul(){const{intelligence:t}=Dt(),a=t.rankingCentros||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Drill-down analytics"}),e.jsxs("strong",{children:["Top ",a.length||0]})]}),e.jsx("div",{className:"copilot-drilldown",children:a.length?a.map(o=>e.jsxs("article",{children:[e.jsxs("div",{children:[e.jsx("strong",{children:o.nome}),e.jsxs("small",{children:[po(o.total)," · ",o.peso,"% do recorte · risco ",o.risco,"%"]})]}),e.jsx("span",{style:{width:`${Math.max(6,o.peso)}%`}})]},o.nome)):e.jsx("p",{children:"Sem centros suficientes para drill-down no recorte atual."})})]})}function Vl(){const{intelligence:t}=Dt(),a=t.narrativa||{},o=[["Liquidez",a.liquidez],["Concentração",a.concentracao],["Curto prazo",a.curtoPrazo],["Comportamento",a.comportamento]].filter(([,r])=>r);return e.jsxs("section",{className:"copilot-card copilot-narrative-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"AI Narrative 11.8"}),e.jsx("strong",{children:"Contextual"})]}),e.jsx("p",{children:a.parecer||t.executiveSummary}),e.jsx("div",{className:"copilot-insights",children:o.map(([r,n])=>e.jsxs("p",{children:[e.jsxs("b",{children:[r,":"]})," ",n]},r))})]})}function Gl(){var o;const{intelligence:t}=Dt(),a=((o=t.narrativa)==null?void 0:o.anomalias)||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Anomalias contextuais"}),e.jsx("strong",{children:a.length})]}),e.jsx("div",{className:"copilot-insights",children:a.map((r,n)=>e.jsxs("p",{children:["⚠ ",r]},`${r}-${n}`))})]})}function Wl(){const{intelligence:t,setLastQuestion:a}=Dt();return e.jsxs("section",{className:"copilot-card copilot-questions-card",children:[e.jsx("span",{className:"copilot-mini-label",children:"Perguntas rápidas"}),e.jsx("div",{className:"copilot-questions",children:t.quickQuestions.map(o=>e.jsx("button",{type:"button",onClick:()=>a(o),children:o},o))})]})}function mr(){var n;const{open:t,close:a,intelligence:o,lastQuestion:r}=Dt();return t?e.jsxs("div",{className:"copilot-shell no-print",onClick:d=>d.stopPropagation(),children:[e.jsx("button",{className:"copilot-backdrop",type:"button","aria-label":"Fechar Copilot",onClick:a}),e.jsxs("aside",{className:"copilot-drawer","aria-label":"Painel Copilot IA",children:[e.jsxs("header",{className:"copilot-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Copilot IA 11.8"}),e.jsx("h2",{children:"Sistema Operacional Financeiro Inteligente"}),e.jsxs("p",{children:["Status: ",o.status.label," · Score ",o.score,"/100"]}),e.jsxs("div",{className:"copilot-live-indicator",children:[e.jsx("b",{})," Analisando dados em tempo real"]})]}),e.jsx("button",{type:"button",onClick:a,"aria-label":"Fechar",children:"×"})]}),e.jsxs("main",{className:"copilot-content",children:[e.jsx(Bl,{}),e.jsx(Vl,{}),e.jsx(ql,{}),e.jsx(Gl,{}),e.jsx(Ul,{}),e.jsx(Ol,{}),e.jsx(Ll,{}),r&&e.jsxs("section",{className:"copilot-card copilot-answer",children:[e.jsx("span",{className:"copilot-mini-label",children:"Pergunta selecionada"}),e.jsx("strong",{children:r}),e.jsx("p",{children:((n=o.respostas)==null?void 0:n[r])||"Resposta executiva gerada a partir dos KPIs atuais."})]}),e.jsx(Wl,{})]})]})]}):null}function ur(){return e.jsx("style",{children:`
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
    `})}const Hl={semEmpresa:"Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar."};function Kl(t){var a,o;return t!=null&&t.empresa_id?{empresaId:t.empresa_id,perfil:Zt(t.perfil),nomeEmpresa:t.nome_empresa||((a=t.empresas)==null?void 0:a.nome)||((o=t.df_empresas)==null?void 0:o.nome)||"",origem:"df_usuarios_empresas"}:null}async function Yl(){const{error:t}=await D.rpc("vincular_usuario_logado");t&&console.warn("Não foi possível executar vínculo automático:",t.message)}async function Xl(t){if(!t)return null;const{data:a,error:o}=await D.from("df_usuarios_empresas").select("empresa_id, perfil").eq("user_id",t).limit(1);if(o)throw o;const r=Array.isArray(a)?a[0]:a;if(!(r!=null&&r.empresa_id))return null;let n="";const{data:d,error:l}=await D.from("df_empresas").select("nome").eq("id",r.empresa_id).limit(1);if(l)console.warn("Não foi possível carregar o nome da empresa ativa:",l.message);else{const m=Array.isArray(d)?d[0]:d;n=(m==null?void 0:m.nome)||""}return Kl({...r,nome_empresa:n})}async function fr(t){if(!t)return"";const{data:a,error:o}=await D.from("profiles").select("name").eq("id",t).limit(1);if(o)return console.warn("Não foi possível carregar o nome do perfil:",o.message),"";const r=Array.isArray(a)?a[0]:a;return(r==null?void 0:r.name)||""}function Ut(t){if(!t)throw new Error("Empresa não identificada para esta operação.");return t}function Ar(t){if(!(t!=null&&t.empresa_id))throw new Error("Operação bloqueada: empresa_id ausente no payload.");return t}function Ql(t){return!Array.isArray(t)||t.length===0||t.forEach(Ar),t}function ya(t,a,o,r="*"){return Ut(o),t.from(a).select(r).eq("empresa_id",o)}function Da(t,a,o,r={}){Ar(o);let n=t.from(a).insert([o]);return r.select&&(n=n.select(r.select===!0?"*":r.select)),n}function Jl(t,a,o,r={}){Ql(o);let n=t.from(a).insert(o);return r.select&&(n=n.select(r.select===!0?"*":r.select)),n}function Ia(t,a,o,r,n){return Ut(r),t.from(a).update(n).eq("id",o).eq("empresa_id",r)}function Zl(t,a,o,r){return Ut(r),t.from(a).delete().eq("id",o).eq("empresa_id",r)}async function ed(t,a){return Ut(a),ya(t,"df_contas",a,"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("excluido",!1).order("data_vencimento")}async function td(t,a){return Ut(a),ya(t,"df_contas_recorrentes",a).eq("ativo",!0)}async function ad(t,a,o){if(!a)return null;Ut(o);const{data:r,error:n}=await t.from("df_centros_custo").select("id").eq("id",a).eq("empresa_id",o).maybeSingle();return n||!(r!=null&&r.id)?null:r.id}async function od(t,a,o){if(!a)return null;Ut(o);const{data:r,error:n}=await t.from("df_filiais").select("id").eq("id",a).eq("empresa_id",o).eq("ativo",!0).maybeSingle();return n||!(r!=null&&r.id)?null:r.id}async function id(t,a){return Jl(t,"df_contas",a,{select:"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)"})}async function rd(t,a){return Da(t,"df_contas",a,{select:!0})}async function uo(t,a,o,r){return Ia(t,"df_contas",a,o,r)}async function nd(t,a,o){return Ut(o),ya(t,"df_contas_recorrentes",o).eq("id",a).maybeSingle()}async function sd(t,a,o){return Ut(a),ya(t,"df_contas_recorrentes",a).eq("ativo",!0).eq("dia_vencimento",o).order("created_at",{ascending:!1})}async function xr(t,a){const o=await Da(t,"df_contas_recorrentes",a,{select:!0});return qr(o.error,a)?Da(t,"df_contas_recorrentes",Lr(a),{select:!0}):o}async function Br(t,a,o,r){const n=await Ia(t,"df_contas_recorrentes",a,o,r);return qr(n.error,r)?Ia(t,"df_contas_recorrentes",a,o,Lr(r)):n}async function $a(t,a,o,r){return uo(t,a,o,{recorrencia_id:r})}async function ld(t,a,o){return Br(t,a,o,{ativo:!1})}async function hr(t,a,o,r){return uo(t,a,o,{status:r})}async function dd(t,a,o){return uo(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}function qr(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&cd(t))}function cd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Lr(t){const{filial_id:a,...o}=t||{};return o}function pd(){const[t,a]=c.useState([]),[o,r]=c.useState([]),[n,d]=c.useState(""),[l,m]=c.useState("todas"),[f,b]=c.useState(""),[_,k]=c.useState(""),[S,g]=c.useState(""),[T,P]=c.useState(""),[z,H]=c.useState(""),[re,V]=c.useState(!0),[q,ne]=c.useState(!1),[G,ae]=c.useState(null),[I,M]=c.useState(""),[Y,je]=c.useState(""),[ce,he]=c.useState(""),[Ce,oe]=c.useState(""),[y,pe]=c.useState(""),[A,Z]=c.useState(""),[K,Q]=c.useState(!1),[N,J]=c.useState(!1),[Me,_e]=c.useState(!1),[we,U]=c.useState("1"),[fe,Ae]=c.useState(!1),[C,be]=c.useState("mensal"),[ze,me]=c.useState(""),[$,ie]=c.useState(null);function et(){ae(null),M(""),je(""),he(""),oe(""),pe(""),Z(""),Q(!1),J(!1),_e(!1),U("1"),Ae(!1),be("mensal"),me(""),ie(null)}async function st(Se,X,L){return L?ad(Se,L,X):null}async function Oe(Se,X,L){return L?od(Se,L,X):null}async function It({supabase:Se,empresaAtual:X,contasAtuais:L,configWhatsapp:B,configEmail:ue,configPush:Pe,diasAlertaContas:We,diasAvisoPadrao:He}){const qe=new Date,Ke=qe.getFullYear(),Ge=qe.getMonth()+1,{data:ot,error:bt}=await td(Se,X);if(bt)return console.warn("Não foi possível carregar contas recorrentes:",bt.message),L;const Rt=[];for(const Qe of ot||[]){if(!Gs(Qe,Ke,Ge))continue;const mt=Vs(Ke,Ge,Qe.dia_vencimento);if(L.some(vt=>String(vt.descricao||"").trim().toLowerCase()===String(Qe.descricao||"").trim().toLowerCase()&&vt.data_vencimento===mt))continue;const qt=await st(Se,X,Qe.centro_custo_id),ut=await Oe(Se,X,Qe.filial_id);Rt.push({empresa_id:X,descricao:Qe.descricao,valor:Number(Qe.valor||0),data_vencimento:mt,vencimento:mt,centro_custo_id:qt,filial_id:ut,observacao:Qe.observacao||null,recorrencia_id:Qe.id,status:"pendente",excluido:!1,enviar_whatsapp:B,enviar_email:ue,enviar_push:Pe,dias_aviso:Number(We||He||1)})}if(Rt.length===0)return L;const{data:Gt,error:At}=await id(Se,Rt);return At?(console.warn("Não foi possível gerar contas recorrentes:",At.message),L):[...L,...Gt||[]].sort((Qe,mt)=>String(Qe.data_vencimento||"").localeCompare(String(mt.data_vencimento||"")))}async function Ye(Se){const{supabase:X,empresaAtual:L,avisarErro:B,configWhatsapp:ue,configEmail:Pe,configPush:We,diasAlertaContas:He,diasAvisoPadrao:qe}=Se;if(!L)return;const{data:Ke,error:Ge}=await ed(X,L);if(Ge){B(Ge);return}const bt=await It({supabase:X,empresaAtual:L,contasAtuais:Ke||[],configWhatsapp:ue,configEmail:Pe,configPush:We,diasAlertaContas:He,diasAvisoPadrao:qe});a(bt)}function lt(Se){const{setMenuAberto:X,setMenuNavegacaoAberto:L,configWhatsapp:B,configEmail:ue,configPush:Pe,diasAvisoPadrao:We}=Se;X(!1),L(!1),et(),Q(B),J(ue),_e(Pe),U(String(We||1)),ne(!0)}async function Be({supabase:Se,empresaId:X,conta:L,dataBanco:B,descricaoConta:ue}){if(!Se||!X||!L)return null;if(L.recorrencia_id){const{data:Ge,error:ot}=await nd(Se,L.recorrencia_id,X);if(!ot&&Ge)return Ge}const Pe=Number(String(B||L.data_vencimento||"").slice(8,10));if(!Pe)return null;const{data:We,error:He}=await sd(Se,X,Pe);if(He||!Array.isArray(We))return null;const qe=String(ue||L.descricao||"").trim().toLowerCase(),Ke=Number(L.valor||0);return We.find(Ge=>{const ot=String(Ge.descricao||"").trim().toLowerCase()===qe,bt=Number(Ge.valor||0)===Ke;return ot&&bt})||null}async function pt(Se){const{conta:X,supabase:L,empresaId:B,diasAvisoPadrao:ue,formatarDataParaBanco:Pe}=Se,We=Pe(X.data_vencimento||""),He=We?String(Number(String(We).slice(8,10))):"";ae(X.id),M(X.descricao||""),je(X.valor||""),he(X.data_vencimento||""),oe(X.centro_custo_id||""),pe(X.filial_id||""),Z(X.observacao||""),Q(X.enviar_whatsapp??!1),J(X.enviar_email??!1),_e(X.enviar_push??!1),U(String(X.dias_aviso??ue??1)),Ae(!!X.recorrencia_id),ie(X.recorrencia_id||null),be("mensal"),me(He),ne(!0);const qe=await Be({supabase:L,empresaId:B,conta:X,dataBanco:We,descricaoConta:X.descricao});qe&&(Ae(!0),ie(qe.id),be(qe.frequencia||qe.tipo_recorrencia||"mensal"),me(String(qe.dia_vencimento||He||"")),!X.recorrencia_id&&qe.id&&await $a(L,X.id,B,qe.id))}function _t(){ne(!1),et()}async function Xe(Se){const{supabase:X,empresaId:L,mostrarAviso:B,configWhatsapp:ue,configEmail:Pe,configPush:We,diasAlertaContas:He,diasAvisoPadrao:qe,primeiraLetraMaiuscula:Ke,converterValor:Ge,formatarDataParaBanco:ot,erroEhSessaoExpirada:bt,limparEstadoAutenticacao:Rt,setUsuarioLogado:Gt,buscarContas:At,fecharConta:Qe}=Se;if(!L){B("Usuário sem empresa vinculada.","erro");return}if(!I||!Y||!ce){B("Preencha descrição, valor e vencimento.","erro");return}const mt=await st(X,L,Ce),Bt=await Oe(X,L,y),qt={descricao:Ke(I.trim()),valor:Ge(Y),data_vencimento:ot(ce),vencimento:ot(ce),centro_custo_id:mt,filial_id:Bt,observacao:A.trim()||null,enviar_whatsapp:K,enviar_email:N,enviar_push:Me,dias_aviso:Number(we||He||qe||1),empresa_id:L};let ut;if(G){if(ut=(await uo(X,G,L,qt)).error,!ut){const jt=ot(ce),s=Number(ze||String(jt).slice(8,10));if(fe){if(!s||s<1||s>31){B("Informe um dia válido para a recorrência.","erro");return}const v={empresa_id:L,descricao:Ke(I.trim()),valor:Ge(Y),centro_custo_id:mt,filial_id:Bt,tipo_recorrencia:C||"mensal",dia_vencimento:s,data_inicio:jt,ativo:!0};if($){const{error:O}=await Br(X,$,L,v);if(O){B("A conta foi atualizada, mas a recorrência não foi salva: "+O.message,"erro");return}const{error:se}=await $a(X,G,L,$);if(se){B("A recorrência foi atualizada, mas não foi vinculada à conta: "+se.message,"erro");return}}else{const{data:O,error:se}=await xr(X,v);if(se){B("A conta foi atualizada, mas a recorrência não foi salva: "+se.message,"erro");return}const ye=Array.isArray(O)?O[0]:O;let ve=ye==null?void 0:ye.id;if(!ve){const Re=await Be({supabase:X,empresaId:L,conta:{descricao:Ke(I.trim()),valor:Ge(Y),data_vencimento:jt},dataBanco:jt,descricaoConta:Ke(I.trim())});ve=Re==null?void 0:Re.id}if(!ve){B("A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.","erro");return}const{error:ge}=await $a(X,G,L,ve);if(ge){B("A recorrência foi criada, mas não foi vinculada à conta: "+ge.message,"erro");return}ie(ve),a(Re=>Re.map(le=>le.id===G?{...le,recorrencia_id:ve}:le))}}else $&&(await ld(X,$,L),await $a(X,G,L,null))}}else{const vt=await rd(X,{...qt,status:"pendente",excluido:!1});if(ut=vt.error,!ut&&fe){const jt=ot(ce),s=Number(ze||String(jt).slice(8,10));if(!s||s<1||s>31){B("Informe um dia válido para a recorrência.","erro");return}const{data:v,error:O}=await xr(X,{empresa_id:L,descricao:Ke(I.trim()),valor:Ge(Y),centro_custo_id:mt,filial_id:Bt,tipo_recorrencia:C||"mensal",dia_vencimento:s,data_inicio:jt,ativo:!0});if(O)B("A conta foi criada, mas a recorrência não foi salva: "+O.message,"erro");else{const se=Array.isArray(v)?v[0]:v,ye=Array.isArray(vt.data)?vt.data[0]:vt.data;let ve=se==null?void 0:se.id;if(!ve&&(ye!=null&&ye.id)){const ge=await Be({supabase:X,empresaId:L,conta:ye,dataBanco:jt,descricaoConta:Ke(I.trim())});ve=ge==null?void 0:ge.id}if(ve&&(ye!=null&&ye.id)){const{error:ge}=await $a(X,ye.id,L,ve);if(ge){B("A recorrência foi criada, mas não foi vinculada à conta: "+ge.message,"erro");return}}}}}if(ut){bt(ut)?(await X.auth.signOut(),Rt(),Gt(null),B("Sua sessão expirou. Faça login novamente.","erro")):B(ut.message,"erro");return}Qe(),await At(),B(G?"Conta atualizada com sucesso.":"Conta criada com sucesso.","sucesso")}async function Vt(Se){const{supabase:X,id:L,empresaId:B,buscarContas:ue,mostrarAviso:Pe}=Se;await hr(X,L,B,"pago"),await ue(),Pe==null||Pe("Conta marcada como paga.","sucesso")}async function gt(Se){const{supabase:X,id:L,empresaId:B,buscarContas:ue,mostrarAviso:Pe}=Se;await hr(X,L,B,"pendente"),await ue(),Pe==null||Pe("Conta voltou para pendente.","sucesso")}async function ea(Se){const{supabase:X,id:L,empresaId:B,avisarErro:ue,buscarContas:Pe,buscarLixeira:We,mostrarAviso:He}=Se,{error:qe}=await dd(X,L,B);if(qe){ue(qe);return}await Promise.all([Pe(),We()]),He==null||He("Conta enviada para a lixeira.","sucesso")}return{contas:t,setContas:a,contasLixeira:o,setContasLixeira:r,busca:n,setBusca:d,filtroStatus:l,setFiltroStatus:m,filtroCentro:f,setFiltroCentro:b,filtroFilial:_,setFiltroFilial:k,filtroMes:S,setFiltroMes:g,dataInicial:T,setDataInicial:P,dataFinal:z,setDataFinal:H,loading:re,setLoading:V,modalConta:q,setModalConta:ne,editandoContaId:G,setEditandoContaId:ae,descricao:I,setDescricao:M,valor:Y,setValor:je,dataVencimento:ce,setDataVencimento:he,centroCustoId:Ce,setCentroCustoId:oe,filialId:y,setFilialId:pe,observacaoConta:A,setObservacaoConta:Z,contaWhatsapp:K,setContaWhatsapp:Q,contaEmail:N,setContaEmail:J,contaPush:Me,setContaPush:_e,contaDiasAviso:we,setContaDiasAviso:U,contaRecorrente:fe,setContaRecorrente:Ae,tipoRecorrencia:C,setTipoRecorrencia:be,diaVencimentoRecorrencia:ze,setDiaVencimentoRecorrencia:me,recorrenciaContaId:$,setRecorrenciaContaId:ie,buscarContas:Ye,abrirNovaConta:lt,abrirEdicaoConta:pt,fecharConta:_t,salvarConta:Xe,marcarComoPago:Vt,voltarParaPendente:gt,excluirConta:ea}}async function md(t,a){return ya(t,"df_notas",a).eq("excluido",!1).order("created_at",{ascending:!1})}async function ud(t,a){return ya(t,"df_notas",a).eq("excluido",!0).order("excluido_em",{ascending:!1})}async function fd(t,a){const o=await Da(t,"df_notas",a);return Or(o.error,a)?Da(t,"df_notas",Ur(a)):o}async function fo(t,a,o,r){const n=await Ia(t,"df_notas",a,o,r);return Or(n.error,r)?Ia(t,"df_notas",a,o,Ur(r)):n}async function xd(t,a,o){return fo(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}async function hd(t,a,o){return fo(t,a.id,o,{concluida:!a.concluida})}async function gd(t,a,o){return fo(t,a,o,{excluido:!1,excluido_em:null})}async function bd(t,a,o){return Zl(t,"df_notas",a,o)}function Or(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&vd(t))}function vd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Ur(t){const{filial_id:a,...o}=t||{};return o}function gr(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}:${a.titulo||""}`).join("|")}function jd(t,a=[]){t((o=[])=>gr(o)===gr(a)?o:a)}function yd(){const[t,a]=c.useState([]),[o,r]=c.useState([]),[n,d]=c.useState(""),[l,m]=c.useState(!1),[f,b]=c.useState(null),[_,k]=c.useState(""),[S,g]=c.useState(""),[T,P]=c.useState("normal"),[z,H]=c.useState(""),[re,V]=c.useState("");function q(){b(null),k(""),g(""),P("normal"),H(""),V("")}async function ne({supabase:oe,empresaAtual:y,avisarErro:pe}){if(!y)return;const{data:A,error:Z}=await md(oe,y);if(Z){pe(Z);return}a(A||[])}async function G({supabase:oe,empresaAtual:y,avisarErro:pe}){if(!y)return;const{data:A,error:Z}=await ud(oe,y);if(Z){pe(Z);return}jd(r,A||[])}function ae({setMenuAberto:oe,setMenuNavegacaoAberto:y}){oe(!1),y(!1),q(),m(!0)}function I(oe){b(oe.id),k(oe.titulo||""),g(oe.conteudo||""),P(oe.prioridade||"normal"),H(oe.data_evento||""),V(oe.filial_id||""),m(!0)}function M(){m(!1),q()}async function Y({supabase:oe,empresaId:y,mostrarAviso:pe,avisarErro:A,buscarNotas:Z}){if(!y){pe("Usuário sem empresa vinculada.","erro");return}if(!_.trim()){pe("Digite o título da nota.","erro");return}const K={titulo:kt(_.trim()),conteudo:S.trim(),prioridade:T||"normal",data_evento:z||null,concluida:!1,empresa_id:y,filial_id:re||null};let Q;if(f?Q=(await fo(oe,f,y,K)).error:Q=(await fd(oe,K)).error,Q){A(Q);return}M(),await Z(),pe(f?"Nota atualizada com sucesso.":"Nota criada com sucesso.","sucesso")}async function je({supabase:oe,id:y,empresaId:pe,avisarErro:A,buscarNotas:Z,buscarLixeira:K,mostrarAviso:Q}){const{error:N}=await xd(oe,y,pe);if(N){A(N);return}await Promise.all([Z(),K()]),Q==null||Q("Nota enviada para a lixeira.","sucesso")}async function ce({supabase:oe,nota:y,empresaId:pe,avisarErro:A,buscarNotas:Z,mostrarAviso:K}){const{error:Q}=await hd(oe,y,pe);if(Q){A(Q);return}await Z(),K==null||K(y.concluida?"Nota reaberta.":"Nota concluída.","sucesso")}async function he({supabase:oe,id:y,empresaId:pe,avisarErro:A,buscarNotas:Z,buscarLixeira:K,mostrarAviso:Q}){const{error:N}=await gd(oe,y,pe);if(N){A(N);return}await Promise.all([Z(),K()]),Q==null||Q("Nota restaurada com sucesso.","sucesso")}async function Ce({supabase:oe,nota:y,empresaId:pe,avisarErro:A,buscarLixeira:Z,mostrarAviso:K}){const{error:Q}=await bd(oe,y.id,pe);if(Q){A(Q);return}await Z(),K==null||K("Nota excluída definitivamente.","sucesso")}return{notas:t,setNotas:a,notasLixeira:o,setNotasLixeira:r,buscaNota:n,setBuscaNota:d,modalNota:l,setModalNota:m,editandoNotaId:f,setEditandoNotaId:b,tituloNota:_,setTituloNota:k,conteudoNota:S,setConteudoNota:g,prioridadeNota:T,setPrioridadeNota:P,dataEventoNota:z,setDataEventoNota:H,filialNotaId:re,setFilialNotaId:V,buscarNotas:ne,buscarNotasLixeira:G,abrirNovaNota:ae,abrirEdicaoNota:I,fecharNota:M,salvarNota:Y,excluirNota:je,alternarNotaConcluida:ce,restaurarNota:he,excluirNotaDefinitivo:Ce}}const mo={MASTER:"master",ADMIN:"admin",GERENTE:"gerente",OPERADOR:"operador"},wd=new Set(["donafloradm@outlook.com"]);function Go(t){return String(t||"").trim().toLowerCase()}function kd(t){const a=String(t).toLowerCase().trim();return["master","super_admin","superadmin","owner","dono"].includes(a)?mo.MASTER:["admin","adm","administrador"].includes(a)?mo.ADMIN:Zt(a)}function Cd(t){return!(!t||t.ativo===!1||t.status&&String(t.status).toLowerCase()!=="ativo")}function Ma({perfilEmpresa:t="operador",master:a=null}={}){const o=Zt(t),r=a!=null&&a.isMaster?mo.MASTER:o;return{perfilEmpresa:o,perfilGlobal:r,isMaster:!!(a!=null&&a.isMaster),canManageUsers:!!(a!=null&&a.isMaster||o==="admin"),canAccessSettings:!!(a!=null&&a.isMaster||["admin","gerente"].includes(o)),canManageCompanies:!!(a!=null&&a.isMaster),canSwitchCompany:!!(a!=null&&a.isMaster)}}async function Lo({userId:t,email:a,perfilEmpresa:o="operador"}={}){const r=Go(a),n=Ma({perfilEmpresa:o});if(wd.has(r))return Ma({perfilEmpresa:o,master:{isMaster:!0}});if(!t&&!r)return n;try{const{data:d,error:l}=await D.from("df_usuarios_master").select("*").limit(100);if(l)return console.warn("Não foi possível consultar df_usuarios_master:",l.message),n;const m=(d||[]).find(f=>{const b=t&&f.user_id&&f.user_id===t,_=r&&Go(f.email)===r;return(b||_)&&Cd(f)});return m?Ma({perfilEmpresa:o,master:{isMaster:!0,perfil:kd(m.perfil||m.tipo||mo.MASTER)}}):n}catch(d){return console.warn("Falha ao carregar permissões globais:",d.message),n}}async function Nd({isMaster:t}={}){if(!t)return[];const{data:a,error:o}=await D.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(o)throw o;return a||[]}async function br({userId:t,email:a,isMaster:o}={}){if(o)return Nd({isMaster:o});const r=Go(a);if(!t&&!r)return[];let n=D.from("df_usuarios_empresas").select("empresa_id, perfil, nome, email, user_id");t&&r?n=n.or(`user_id.eq.${t},email.eq.${r}`):t?n=n.eq("user_id",t):n=n.eq("email",r);const{data:d,error:l}=await n;if(l)throw l;const m=new Map;(d||[]).forEach(k=>{if(!(k!=null&&k.empresa_id))return;const S=Zt(k.perfil),g=m.get(k.empresa_id);m.set(k.empresa_id,{id:k.empresa_id,nome:(g==null?void 0:g.nome)||"",perfil:(g==null?void 0:g.perfil)==="admin"?g.perfil:S})});const f=Array.from(m.keys());if(f.length===0)return[];const{data:b,error:_}=await D.from("df_empresas").select("id, nome, created_at").in("id",f).order("nome",{ascending:!0});if(_)throw _;return(b||[]).forEach(k=>{const S=m.get(k.id);S&&m.set(k.id,{...S,nome:k.nome||S.nome||"Empresa",created_at:k.created_at})}),Array.from(m.values()).sort((k,S)=>String(k.nome||"").localeCompare(String(S.nome||"")))}const x={usuarioTopo:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",border:"1px solid #d8eee9",borderRadius:18,padding:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 10px 24px rgba(15,118,110,0.10)",position:"relative",zIndex:20},logoMarca:{display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",padding:0,textAlign:"left",color:"#064e3b"},logoIcone:{width:42,height:42,borderRadius:14,background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 0 0 1px #cfe8da"},logoImagem:{width:48,height:48,borderRadius:16,objectFit:"cover",background:"#0f766e",boxShadow:"0 8px 18px rgba(20,184,166,0.28)"},logoTexto:{display:"flex",flexDirection:"column",gap:2,lineHeight:1.05},usuarioAcoes:{display:"flex",alignItems:"center",gap:8},usuarioTexto:{display:"flex",flexDirection:"column",alignItems:"flex-end",fontSize:13,color:"#1f2937"},btnMenuTopo:{width:44,height:44,borderRadius:14,border:"1px solid #e5e7eb",background:"#ffffff",color:"#0f172a",fontSize:22,fontWeight:"bold",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 16px rgba(15,23,42,0.08)"},menuBackdrop:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.22)",zIndex:4e3,display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:"76px 12px 12px 12px"},menuNavegacao:{width:"min(360px, 94vw)",height:"auto",maxHeight:"calc(100dvh - 96px)",overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",background:"#ffffff",border:"1px solid #d8eee9",borderRadius:22,padding:14,display:"grid",gap:8,boxShadow:"0 24px 60px rgba(15,23,42,0.25)"},menuPerfil:{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:18,background:"linear-gradient(135deg, #ecfdf5, #f0fdfa)",color:"#064e3b",marginBottom:4},menuPerfilIcone:{width:46,height:46,borderRadius:16,objectFit:"cover",background:"#0f766e"},menuSecaoTitulo:{fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:800,color:"#6b7280",padding:"10px 8px 2px"},menuNavItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#f8faf9",border:"1px solid #edf1ef",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#064e3b"},menuSairItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#be123c",fontWeight:700},agendaResumoCard:{background:"#ffffff",border:"1px solid #dfe7e2",borderLeft:"5px solid #14b8a6",padding:14,borderRadius:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"grid",gap:10},agendaResumoGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,color:"#374151"},btnAgendaCompleta:{border:"none",borderRadius:10,background:"#14b8a6",color:"#fff",padding:"10px 12px",fontWeight:"bold"},uploadExcelBox:{border:"2px dashed #99f6e4",background:"#f0fdfa",borderRadius:16,padding:24,textAlign:"center",display:"grid",gap:6,color:"#0f766e",cursor:"pointer"},importDicasGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"},previewImportacao:{display:"grid",gap:8,marginBottom:12},previewLinha:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:10,display:"grid",gap:4},alertaSucesso:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:10,fontWeight:"bold"},btnSair:{background:"#fee2e2",color:"#ef4444",border:"none",padding:"8px 12px",borderRadius:8,fontWeight:"bold"},overlayConfirmacao:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:3e3},modalConfirmacao:{background:"#fff",borderRadius:18,padding:18,width:"100%",maxWidth:360,boxShadow:"0 12px 30px rgba(0,0,0,0.25)",textAlign:"center"},confirmacaoIcone:{fontSize:38,marginBottom:8},confirmacaoTitulo:{margin:"4px 0 8px",fontSize:20},confirmacaoTexto:{margin:"0 0 16px",color:"#444",lineHeight:1.4},confirmacaoAcoes:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},btnConfirmarCancelar:{border:"none",borderRadius:10,padding:11,background:"#6c757d",color:"#fff",fontWeight:"bold"},btnConfirmarAcao:{border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:"bold"},headerExpansivel:{width:"100%",background:"#fff",border:"1px solid #e5e5e5",borderRadius:14,padding:"12px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:20,fontWeight:"bold",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},page:{padding:16,maxWidth:700,margin:"auto",fontFamily:"Arial",background:"#f8fafc",minHeight:"100vh",paddingBottom:100},titulo:{fontSize:28,marginBottom:12},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:24},resumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},boxTotal:{background:"#fff",padding:12,borderRadius:14,display:"flex",flexDirection:"column",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},boxPago:{background:"#d4edda",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxPendente:{background:"#fff3cd",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxVencido:{background:"#f8d7da",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},filtrosBox:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:8,boxSizing:"border-box"},datas:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},filtros:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},filtro:{border:"1px solid #ccc",background:"#fff",padding:"7px 11px",borderRadius:10,fontWeight:800,cursor:"pointer"},filtroAtivo:{border:"none",background:"#0d6efd",color:"#fff",padding:"7px 11px",borderRadius:8},resumoFiltro:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:4,fontSize:14},cardConta:{padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},cardTopo:{display:"flex",justifyContent:"space-between",fontSize:18,marginBottom:4},cardInfo:{fontSize:13,opacity:.75},cardDashboard:{background:"#fff",padding:12,borderRadius:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},dashboardGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6,fontSize:13},cardConfiguracao:{background:"#fff",padding:14,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},switchLinha:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #eee"},configResumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,background:"#f8fafc",padding:10,borderRadius:10},cardAgenda:{background:"#fff",padding:12,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},itemAgenda:{background:"#f8fafc",padding:10,borderRadius:10,marginTop:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"},agendaDireita:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},textoAgenda:{display:"block",marginTop:5,color:"#444",fontWeight:"bold"},textoVencidoAgenda:{display:"block",marginTop:5,color:"#dc3545",fontWeight:"bold"},cardLixeira:{background:"#fff",padding:12,borderRadius:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},textoQuarentena:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},textoLiberado:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},cardNota:{background:"#eef2ff",padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},textoNota:{fontSize:14,whiteSpace:"pre-wrap"},acoes:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8},mensagemVazia:{fontSize:13,opacity:.7},btnPago:{minHeight:38,minWidth:74,background:"#0f766e",color:"#fff",border:"1px solid #0f766e",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnVoltar:{minHeight:38,minWidth:74,background:"#f8fafc",color:"#475569",border:"1px solid #cbd5e1",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnEditar:{minHeight:38,minWidth:74,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnExcluir:{minHeight:38,minWidth:74,background:"#fff1f2",color:"#e11d48",border:"1px solid #fecdd3",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnSecundario:{background:"#f8fafc",color:"#0f766e",border:"1px solid #99f6e4",padding:"6px 10px",borderRadius:8,fontWeight:800,cursor:"pointer"},btnCinza:{background:"#64748b",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnRoxo:{background:"#6f42c1",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnVerde:{background:"#14b8a6",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},fab:{position:"fixed",right:22,bottom:22,width:54,height:54,borderRadius:18,background:"linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.22)",fontSize:28,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(15, 118, 110, 0.28)",zIndex:3e3,cursor:"pointer"},menuFab:{position:"fixed",right:20,bottom:86,display:"flex",flexDirection:"column",gap:8,zIndex:3001},menuItem:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"0 14px",minWidth:190,width:190,height:48,fontSize:14,fontWeight:800,boxShadow:"0 10px 24px rgba(15,23,42,0.14)",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,color:"#0f172a",whiteSpace:"nowrap",overflow:"visible",cursor:"pointer"},menuItemIcone:{display:"inline-flex",width:26,minWidth:26,justifyContent:"center",fontSize:18,lineHeight:1},menuItemTexto:{display:"inline-block",color:"#0f172a",fontSize:14,fontWeight:800,lineHeight:1},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",justifyContent:"center",alignItems:"center",padding:16,zIndex:999},blocoNotificacaoConta:{background:"#f8fafc",border:"1px solid #e5e5e5",borderRadius:12,padding:10,marginBottom:10},blocoRecorrenciaConta:{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:12,padding:10,marginBottom:10},switchLinhaCompacta:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #e5e5e5",fontSize:14},textoAjuda:{display:"block",color:"#666",fontSize:11,marginTop:4},notificacaoChips:{display:"flex",gap:6,flexWrap:"wrap",marginTop:6},chipNotif:{background:"#eef6ff",color:"#0d6efd",border:"1px solid #b6d4fe",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:"bold"},modal:{background:"#fff",padding:18,borderRadius:14,width:"100%",maxWidth:360},inputModal:{width:"100%",padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box"},textareaModal:{width:"100%",minHeight:110,padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box",fontFamily:"Arial"},btnGhostAction:{width:"auto",background:"#fff",color:"#374151",border:"1px solid #d1d5db",padding:"7px 12px",borderRadius:999,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:0},btnSalvar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#14b8a6",color:"#fff",marginBottom:8},btnCancelar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#6c757d",color:"#fff"},itemCentro:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f1f1f1",padding:8,borderRadius:8,marginBottom:6,fontSize:13},btnMiniExcluir:{background:"#fee2e2",color:"#ef4444",border:"1px solid #f87171",borderRadius:999,padding:"8px 10px",fontSize:11},notasHeaderNovo:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10},btnMiniVerde:{background:"#0f766e",color:"#fff",border:"none",borderRadius:12,padding:"6px 11px",fontWeight:"900",fontSize:18,lineHeight:1},notasListaNova:{display:"grid",gap:10},cardNotaAcao:{padding:12,borderRadius:16,marginBottom:10,border:"1px solid #e5e7eb",boxShadow:"0 8px 20px rgba(15,23,42,0.06)"},cardNotaNormal:{background:"#f8fafc",borderColor:"#e5e7eb"},cardNotaUrgente:{background:"#fffbeb",borderColor:"#fde68a"},cardNotaCritico:{background:"#fff7f7",borderColor:"#fecaca"},badgePrioridade:{borderRadius:999,padding:"4px 8px",fontSize:12,fontWeight:"900"},badgeNormal:{background:"#f1f5f9",color:"#475569"},badgeUrgente:{background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a"},badgeCritico:{background:"#fff7f7",color:"#991b1b",border:"1px solid #fecaca"}},Sd=[{id:"principal",titulo:"Principal",items:[{tela:"dashboard",icon:"🏠",label:"Dashboard",desc:"Resumo financeiro"},{tela:"agenda",icon:"📅",label:"Agenda",desc:"Vencimentos e previsões"},{tela:"notas",icon:"📝",label:"Bloco de Notas",desc:"Pendências e histórico de notas"}]},{id:"financeiro",titulo:"Financeiro",items:[{tela:"contas",icon:"💳",label:"Contas",desc:"Contas a pagar e filtros"}]},{id:"analise",titulo:"Análise",items:[{tela:"relatorios",icon:"📊",label:"Relatórios",desc:"Análises e indicadores"}]},{id:"master",titulo:"Master",items:[{tela:"master-empresas",icon:"🏢",label:"Painel Master",desc:"Empresas e tenants SaaS",masterOnly:!0}]},{id:"sistema",titulo:"Sistema",items:[{tela:"usuarios",icon:"👥",label:"Usuários",desc:"Perfis, acessos e senhas"},{tela:"configuracoes",icon:"⚙️",label:"Configurações",desc:"Preferências da empresa"},{tela:"filiais",icon:"🏬",label:"Filiais",desc:"Unidades da empresa"},{tela:"billing",icon:"💼",label:"Billing",desc:"Planos, limites e assinatura"},{tela:"onboarding",icon:"🚀",label:"Onboarding",desc:"Implantação inicial SaaS"},{tela:"importar",icon:"📥",label:"Importar CSV",desc:"Trazer histórico do Excel"},{tela:"lixeira",icon:"🗑️",label:"Lixeira",desc:"Restaurar ou excluir definitivo"}]}],Ko="df_sessao_segura",_d=8*60*60*1e3,Ed=30*60*1e3,zd=25*60*1e3;function Oo(){try{return JSON.parse(localStorage.getItem(Ko)||"{}")}catch{return{}}}function vr(t){localStorage.setItem(Ko,JSON.stringify(t))}function Pd(){localStorage.removeItem(Ko)}function Rd(){const t=c.useRef(!1),a=c.useRef(!1),o=c.useRef(null),{globalLoading:r,toast:n,showToast:d,hideToast:l,empresaAtiva:m,setEmpresaAtiva:f,limparEmpresaAtiva:b,empresasDisponiveis:_,setEmpresasDisponiveis:k}=Dr();function S(i){const p=String((i==null?void 0:i.message)||i||"").toLowerCase();return p.includes("jwt")||p.includes("expired")||p.includes("unauthorized")||p.includes("session")}function g(i,p){if(!i||p==="pago")return!1;const h=new Date;h.setHours(0,0,0,0);const j=new Date(i+"T00:00:00");return j.setHours(0,0,0,0),j<h}function T(i){return i?String(i).slice(0,7):""}function P(i){if(!i)return 0;const p=new Date(i),j=new Date-p;return Math.max(0,Math.floor(j/(1e3*60*60*24)))}function z(i){return!0}function H(i=[]){return i.map(p=>`${p.id||""}:${p.excluido_em||""}:${p.updated_at||""}`).join("|")}function re(i,p=[]){i((h=[])=>H(h)===H(p)?h:p)}const{contas:V,setContas:q,contasLixeira:ne,setContasLixeira:G,busca:ae,setBusca:I,filtroStatus:M,setFiltroStatus:Y,filtroCentro:je,setFiltroCentro:ce,filtroFilial:he,setFiltroFilial:Ce,filtroMes:oe,setFiltroMes:y,dataInicial:pe,setDataInicial:A,dataFinal:Z,setDataFinal:K,loading:Q,setLoading:N,modalConta:J,setModalConta:Me,editandoContaId:_e,descricao:we,setDescricao:U,valor:fe,setValor:Ae,dataVencimento:C,setDataVencimento:be,centroCustoId:ze,setCentroCustoId:me,filialId:$,setFilialId:ie,observacaoConta:et,setObservacaoConta:st,contaRecorrente:Oe,setContaRecorrente:It,tipoRecorrencia:Ye,setTipoRecorrencia:lt,diaVencimentoRecorrencia:Be,setDiaVencimentoRecorrencia:pt,buscarContas:_t,abrirNovaConta:Xe,abrirEdicaoConta:Vt,fecharConta:gt,salvarConta:ea,marcarComoPago:Se,voltarParaPendente:X,excluirConta:L}=pd(),{notas:B,setNotas:ue,notasLixeira:Pe,setNotasLixeira:We,buscaNota:He,setBuscaNota:qe,modalNota:Ke,setModalNota:Ge,editandoNotaId:ot,tituloNota:bt,setTituloNota:Rt,conteudoNota:Gt,setConteudoNota:At,prioridadeNota:Qe,setPrioridadeNota:mt,dataEventoNota:Bt,setDataEventoNota:qt,filialNotaId:ut,setFilialNotaId:vt,buscarNotas:jt,buscarNotasLixeira:s,abrirNovaNota:v,abrirEdicaoNota:O,fecharNota:se,salvarNota:ye,excluirNota:ve,alternarNotaConcluida:ge,restaurarNota:Re,excluirNotaDefinitivo:le}=yd(),[Te,tt]=c.useState([]),[xe,dt]=c.useState([]),[Ct,ft]=c.useState(!1),[xt,Je]=c.useState(""),[Ft,De]=c.useState(!1),[Ze,Et]=c.useState(!1),[Vr,Gr]=c.useState(!1),[Wr,Hr]=c.useState({principal:!0,financeiro:!0,analise:!0,sistema:!0}),[it,ca]=c.useState("dashboard"),[R,zt]=c.useState(null),[Kr,wa]=c.useState(!0),[W,ka]=c.useState(null),[Ca,Yo]=c.useState(!1),[Aa,Na]=c.useState(""),[Ne,Ba]=c.useState(()=>Ma()),[xo,pa]=c.useState(""),[Yr,ho]=c.useState(!1),[Xo,Qo]=c.useState(""),[Xr,Jo]=c.useState(!1),[Zo,qa]=c.useState(""),[La,go]=c.useState([]),[Qr,ei]=c.useState(!1),[Jr,bo]=c.useState(!1),[Zr,vo]=c.useState(""),[ti,ai]=c.useState(!1),[oi,Oa]=c.useState({}),[en,ii]=c.useState(""),[ri,ni]=c.useState(""),[si,li]=c.useState(""),[di,ci]=c.useState("operador"),[pi,mi]=c.useState(""),[ui,fi]=c.useState(""),[Sa,xi]=c.useState(""),[hi,gi]=c.useState(""),[tn,an]=c.useState(!1),[on,rn]=c.useState(!0),[nn,sn]=c.useState(!0),[ln,dn]=c.useState(()=>typeof window>"u"?!0:window.innerWidth>=980),[jo,cn]=c.useState(!0),[yo,pn]=c.useState(!0),[Ua,mn]=c.useState(!0),[wo,un]=c.useState(!0),[Va,Ga]=c.useState(null),[ko,Co]=c.useState(!0),[ta,bi]=c.useState(!0),[aa,vi]=c.useState(!0),[oa,ji]=c.useState(!1),[ma,No]=c.useState("1"),[Wa,So]=c.useState("1"),[yi,_o]=c.useState(!0),[wi,Eo]=c.useState(!0),[ki,zo]=c.useState("3"),[Ci,Po]=c.useState(!0),[ia,Ro]=c.useState(""),[Ni,Fo]=c.useState(""),[Si,$o]=c.useState(""),[yt,_i]=c.useState({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null}),[Ei,Mo]=c.useState(null),[Wt,Ha]=c.useState([]),[zi,_a]=c.useState("");function ee(i,p="info"){d(i,p)}function Ee(i,p="Não foi possível concluir a operação."){const h=(i==null?void 0:i.message)||i||p;if(S(i)){if(a.current)return;a.current=!0,D.auth.signOut().finally(()=>{Ht(),zt(null),ca("dashboard"),wa(!1),ee("Sua sessão expirou. Faça login novamente.","erro"),window.setTimeout(()=>{a.current=!1},1200)});return}ee(String(h),"erro")}function Pi(){q([]),ue([]),tt([]),dt([]),G([]),We([]),go([]),vo(""),bo(!1),Ga(null),Me(!1),Ge(!1),ft(!1),De(!1),Et(!1),I(""),qe(""),Y("todas"),ce(""),Ce(""),y(""),A(""),K(""),Mo(null),Ha([]),_a("")}function Ht(){Pi(),k([]),ka(null),b(),Na(""),Oa({}),pa(""),qa(""),N(!1),Pd()}async function fn(){var i,p;if(R!=null&&R.id)try{const j=await fr(R.id)||((i=R==null?void 0:R.user_metadata)==null?void 0:i.name)||((p=R==null?void 0:R.user_metadata)==null?void 0:p.full_name)||"";j&&j!==xo&&pa(j)}catch(h){console.warn("Falha ao sincronizar nome do perfil:",(h==null?void 0:h.message)||h)}}c.useEffect(()=>{let i=!0;async function p(){try{const j=new Promise(F=>{window.setTimeout(()=>F({data:{session:null},error:new Error("Timeout ao validar sessão")}),8e3)}),{data:w,error:E}=await Promise.race([D.auth.getSession(),j]);if(!i)return;if(E||!(w!=null&&w.session)){Ht(),zt(null);return}zt(w.session.user)}catch(j){if(!i)return;console.warn("Falha ao validar sessão:",(j==null?void 0:j.message)||j),Ht(),zt(null)}finally{i&&wa(!1)}}p();const{data:h}=D.auth.onAuthStateChange((j,w)=>{wa(!1),zt((w==null?void 0:w.user)||null),w||Ht()});return()=>{i=!1,h.subscription.unsubscribe()}},[]),c.useEffect(()=>{if(!R)return;const i=Date.now(),p=Oo();vr({inicio:p.inicio||i,ultimaAtividade:i});function h(){const de=Oo();vr({inicio:de.inicio||Date.now(),ultimaAtividade:Date.now()}),t.current=!1}async function j(de){a.current||(a.current=!0,Ht(),zt(null),ca("dashboard"),wa(!1),await D.auth.signOut(),ee(de,"erro"),window.setTimeout(()=>{a.current=!1},1200))}function w(){const de=Oo(),Ue=Number(de.inicio||Date.now()),ct=Number(de.ultimaAtividade||Date.now()),ke=Date.now(),Le=ke-Ue,Lt=ke-ct;if(Le>=_d){j("Sua sessão expirou por segurança. Faça login novamente.");return}if(Lt>=Ed){j("Sua sessão foi encerrada por inatividade. Faça login novamente.");return}Lt>=zd&&!t.current&&(t.current=!0,wt({titulo:"Sessão quase expirada",mensagem:"Sua sessão vai expirar por segurança. Deseja continuar conectado?",textoConfirmar:"Continuar conectado",tipo:"padrao",acao:async()=>h()}))}const E=["click","keydown","mousemove","scroll","touchstart"];E.forEach(de=>window.addEventListener(de,h,{passive:!0}));const F=window.setInterval(w,60*1e3);return()=>{E.forEach(de=>window.removeEventListener(de,h)),window.clearInterval(F)}},[R]),c.useEffect(()=>{if(!R){N(!1);return}xn(R.id)},[R]),c.useEffect(()=>{if(!(R!=null&&R.id)||!W)return;let i=!1;async function p(){if(!i)try{await Promise.allSettled([Kt(W),Xa(W),Ti(W),Yt(W)])}catch(E){console.warn("Falha ao sincronizar dados do tenant:",(E==null?void 0:E.message)||E)}}function h(){window.clearTimeout(o.current),o.current=window.setTimeout(p,350)}function j(){document.visibilityState==="visible"&&h()}window.addEventListener("focus",h),document.addEventListener("visibilitychange",j);const w=D.channel(`tenant-sync-${W}`).on("postgres_changes",{event:"*",schema:"public",table:"df_centros_custo",filter:`empresa_id=eq.${W}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_filiais",filter:`empresa_id=eq.${W}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_contas",filter:`empresa_id=eq.${W}`},h).on("postgres_changes",{event:"*",schema:"public",table:"df_contas_recorrentes",filter:`empresa_id=eq.${W}`},h).subscribe();return()=>{i=!0,window.clearTimeout(o.current),window.removeEventListener("focus",h),document.removeEventListener("visibilitychange",j),D.removeChannel(w)}},[R==null?void 0:R.id,W]),c.useEffect(()=>{!Ze||!(R!=null&&R.id)||fn()},[Ze,R==null?void 0:R.id]),c.useEffect(()=>{window.history.replaceState({tela:it},"",window.location.href);function i(p){var j;const h=((j=p.state)==null?void 0:j.tela)||"dashboard";De(!1),Et(!1),ca(h)}return window.addEventListener("popstate",i),()=>window.removeEventListener("popstate",i)},[]),c.useEffect(()=>{it==="usuarios"&&W&&ua(W)},[it,W]),c.useEffect(()=>{function i(p){if(p.key==="Escape"){if(yt.aberto){eo();return}J&&Pa(),Ke&&Za(),Ct&&ft(!1),Ft&&De(!1),Ze&&Et(!1)}}return window.addEventListener("keydown",i),()=>window.removeEventListener("keydown",i)},[yt.aberto,J,Ke,Ct,Ft,Ze]),c.useEffect(()=>{const i=document.body.style.overflow,p=document.documentElement.style.overflow,h=document.body.style.position,j=document.body.style.width,w=window.scrollY;return Ze&&(document.body.classList.add("mobile-nav-open"),document.documentElement.classList.add("mobile-nav-open"),document.body.style.overflow="hidden",document.documentElement.style.overflow="hidden",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.top=`-${w}px`),()=>{document.body.classList.remove("mobile-nav-open"),document.documentElement.classList.remove("mobile-nav-open"),document.body.style.overflow=i,document.documentElement.style.overflow=p,document.body.style.position=h,document.body.style.width=j,document.body.style.top="",Ze&&window.scrollTo(0,w)}},[Ze]);async function xn(i){var p,h,j,w;N(!0),qa("");try{await Yl();const E=await Xl(i),F=await fr(i),de=await Lo({userId:i,email:R==null?void 0:R.email,perfilEmpresa:(E==null?void 0:E.perfil)||"operador"}),Ue=await br({userId:i,email:R==null?void 0:R.email,isMaster:de.isMaster});if(!(E!=null&&E.empresaId)&&!de.isMaster){ka(null),b(),Na(""),Ba(Ma()),pa(""),qa(Hl.semEmpresa);return}if(de.isMaster&&Ue.length===0){ka(null),b(),Na("master"),Ba({...de,canSwitchCompany:!0,canManageCompanies:!0}),pa(F||((p=R==null?void 0:R.user_metadata)==null?void 0:p.name)||((h=R==null?void 0:R.user_metadata)==null?void 0:h.full_name)||""),qa("Nenhuma empresa cadastrada em df_empresas para o usuário master.");return}const ke=Ue.find(na=>na.id===(m==null?void 0:m.id))||Ue.find(na=>na.id===(E==null?void 0:E.empresaId))||Ue[0]||{id:E==null?void 0:E.empresaId,nome:(E==null?void 0:E.nomeEmpresa)||"Dona Flor",perfil:(E==null?void 0:E.perfil)||"operador"},Le=ke.perfil||(E==null?void 0:E.perfil)||(de.isMaster?"master":"operador"),Lt=de.isMaster?{...de,perfilEmpresa:Nt(Le),canSwitchCompany:!0,canManageCompanies:!0}:await Lo({userId:i,email:R==null?void 0:R.email,perfilEmpresa:Le});k(Ue.length>0?Ue:[ke]),ka(ke.id),f({id:ke.id,nome:ke.nome||(E==null?void 0:E.nomeEmpresa)||"Dona Flor",perfil:Le}),Na(Le),Ba(Lt),pa(F||((j=R==null?void 0:R.user_metadata)==null?void 0:j.name)||((w=R==null?void 0:R.user_metadata)==null?void 0:w.full_name)||""),await Ka(ke.id)}catch(E){S(E)?(await D.auth.signOut(),Ht(),zt(null),ee("Sua sessão expirou. Faça login novamente.","erro")):ee(E.message,"erro")}finally{N(!1)}}async function Ka(i=W){i&&await Promise.all([Kt(i),za(i),Xa(i),Ti(i),Yt(i),Nn(i)])}function Nt(i){return Zt(i)}function Ri(i=[]){if(Ne!=null&&Ne.isMaster)return!0;const p=Nt(Aa);return i.includes(p)}function ra(){return!!(Ne!=null&&Ne.canManageUsers||Ri(["admin"]))}function Ea(){return!!(Ne!=null&&Ne.canAccessSettings||Ri(["admin","gerente"]))}function Fi(){return Sd.map(i=>({...i,items:i.items.filter(p=>!p.masterOnly||(Ne==null?void 0:Ne.canManageCompanies))})).filter(i=>i.items.length>0)}async function hn(){if(R)try{const i=await br({userId:R.id,email:R.email,isMaster:Ne==null?void 0:Ne.isMaster});k(i)}catch(i){console.warn("Não foi possível atualizar a lista de empresas:",i.message)}}async function Ya(i){if(!i||Ca)return;const p=_.find(h=>h.id===i);if(!p){ee("Empresa selecionada não encontrada para este usuário.","erro");return}if(p.id!==W){Yo(!0),N(!0);try{const h=p.perfil||(Ne!=null&&Ne.isMaster?"master":"operador"),j=Ne!=null&&Ne.isMaster?{...Ne,perfilEmpresa:Nt(h),canSwitchCompany:!0,canManageCompanies:!0,canManageUsers:!0,canAccessSettings:!0}:await Lo({userId:R==null?void 0:R.id,email:R==null?void 0:R.email,perfilEmpresa:h});Pi(),ka(p.id),f({id:p.id,nome:p.nome||"Empresa",perfil:h}),Na(h),Ba(j),ca("dashboard"),await Ka(p.id),ee(`Empresa ativa: ${p.nome||"Empresa"}`,"sucesso")}catch(h){Ee(h,"Não foi possível trocar a empresa ativa.")}finally{Yo(!1),N(!1)}}}async function ua(i=W,p={}){if(!i)return;const h=!!(p!=null&&p.silencioso);h||ei(!0),vo("");try{const[j,w]=await Promise.all([ls(i),fs(i)]),E={};(w||[]).forEach(F=>{!(F!=null&&F.usuario_id)||!(F!=null&&F.filial_id)||(E[F.usuario_id]||(E[F.usuario_id]=[]),E[F.usuario_id].push(F.filial_id))}),go(j),Oa(E),bo(!0)}catch(j){console.warn("Não foi possível carregar usuários:",j.message),go([]),Oa({}),bo(!0),vo((j==null?void 0:j.message)||"Não foi possível carregar os usuários da empresa.")}finally{h||ei(!1)}}async function gn(){if(ti)return;if(!W){ee("Empresa não identificada.","erro");return}if(!ra()){ee("Apenas administradores podem adicionar usuários.","erro");return}const i=ri.trim().toLowerCase();if(!i||!i.includes("@")){ee("Informe um e-mail válido.","erro");return}const p=pi.trim();if(p.length<6){ee("Informe uma senha provisória com pelo menos 6 caracteres.","erro");return}const h=Nt(di);try{ai(!0),await ds({empresaId:W,email:i,nome:si,perfil:h,senhaProvisoria:p,criarAuthManual:!0}),await ua(W,{silencioso:!0})}catch(j){Ee(j);return}finally{ai(!1)}ni(""),li(""),mi(""),ci("operador"),ee("Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.","sucesso")}async function bn(i){if(!ra()){ee("Apenas administradores podem enviar acesso ou reset de senha.","erro");return}const p=i.nome||i.email||"este usuário";wt({titulo:"Enviar acesso",mensagem:`Deseja enviar um link de acesso/redefinição de senha para ${p}?`,textoConfirmar:"Enviar link",tipo:"padrao",acao:async()=>{try{const h=await ms({usuario:i});ee(h.mensagem,"info")}catch(h){Ee(h)}}})}async function vn(i,p){if(!ra()){ee("Apenas administradores podem alterar perfis.","erro");return}const h=Nt(p);if(i.user_id&&(R==null?void 0:R.id)&&i.user_id===R.id&&h!=="admin"&&La.filter(de=>Nt(de.perfil)==="admin").length<=1){ee("Você não pode remover o último administrador da empresa.","erro");return}if(h===Nt(i.perfil))return;const w=i.nome||i.email||"este usuário",E=kt(h);wt({titulo:"Alterar perfil",mensagem:`Deseja alterar o perfil de ${w} para ${E}?`,textoConfirmar:"Confirmar alteração",tipo:h==="admin"?"perigo":"padrao",acao:async()=>{try{await cs({empresaId:W,usuario:i,perfil:h})}catch(F){Ee(F);return}await ua()}})}async function $i(i,p){if(!ra()){ee("Apenas administradores podem alterar filiais dos usuários.","erro");return}if(!(i!=null&&i.id)){ee("Este usuário precisa estar cadastrado na empresa para receber filiais.","erro");return}const h=i.id;ii(h);try{await xs({empresaId:W,usuario:i,filialIds:p}),Oa(j=>({...j,[i.id]:p})),ee("Filiais do usuário atualizadas.","sucesso")}catch(j){Ee(j,"Não foi possível atualizar as filiais do usuário.")}finally{ii("")}}function jn(i,p){const h=oi[i.id]||[],w=h.includes(p)?h.filter(E=>E!==p):[...h,p];$i(i,w)}function yn(i){$i(i,[])}async function wn(i){if(!ra()){ee("Apenas administradores podem remover usuários.","erro");return}if(i.user_id&&(R==null?void 0:R.id)&&i.user_id===R.id){ee("Você não pode remover o próprio acesso por aqui.","erro");return}if(Nt(i.perfil)==="admin"&&La.filter(j=>Nt(j.perfil)==="admin").length<=1){ee("Você não pode remover o último administrador da empresa.","erro");return}wt({titulo:"Remover usuário",mensagem:`Deseja remover ${i.nome||i.email||"este usuário"} desta empresa?`,textoConfirmar:"Remover",tipo:"perigo",acao:async()=>{try{await ps({empresaId:W,usuario:i})}catch(h){Ee(h);return}await ua()}})}async function kn(){const i=ui.trim().toLowerCase();if(!i||!i.includes("@")){ee("Informe um e-mail válido.","erro");return}const{error:p}=await D.auth.updateUser({email:i},{emailRedirectTo:window.location.origin});if(p){Ee(p);return}fi(""),ee("Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.","sucesso")}async function Cn(){if(!Sa||Sa.length<6){ee("A senha precisa ter pelo menos 6 caracteres.","erro");return}if(Sa!==hi){ee("As senhas não conferem.","erro");return}const{error:i}=await D.auth.updateUser({password:Sa});if(i){Ee(i);return}xi(""),gi(""),ee("Senha atualizada com sucesso.","sucesso")}async function Kt(i=W){return _t({supabase:D,empresaAtual:i,avisarErro:Ee,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAlertaContas:Wa,diasAvisoPadrao:ma})}async function za(i=W){return jt({supabase:D,empresaAtual:i,avisarErro:Ee})}async function Mi(i=W){if(!i)return;const{data:p,error:h}=await D.from("df_configuracoes_alertas").select("*").eq("empresa_id",i).maybeSingle();if(h){console.warn("Não foi possível carregar alertas globais:",h.message);return}if(p){So(String(p.dias_alerta_contas??1)),_o(p.alertar_contas_vencidas??!0),Eo(p.destacar_contas_criticas??!0),zo(String(p.dias_alerta_notas??3)),Po(p.destacar_notas_urgentes??!0);return}const j={empresa_id:i,dias_alerta_contas:1,alertar_contas_vencidas:!0,destacar_contas_criticas:!0,dias_alerta_notas:3,destacar_notas_urgentes:!0},{data:w,error:E}=await D.from("df_configuracoes_alertas").insert([j]).select().maybeSingle();if(E){console.warn("Não foi possível criar alertas globais:",E.message);return}w&&(So(String(w.dias_alerta_contas??1)),_o(w.alertar_contas_vencidas??!0),Eo(w.destacar_contas_criticas??!0),zo(String(w.dias_alerta_notas??3)),Po(w.destacar_notas_urgentes??!0))}async function Nn(i=W){if(!i)return;const{data:p,error:h}=await D.from("df_configuracoes").select("*").eq("empresa_id",i).limit(1);if(h){Ee(h);return}const j=Array.isArray(p)?p[0]:p;if(j){Ga(j),Co(j.notificacoes_ativas??!0),bi(j.enviar_whatsapp??!0),vi(j.enviar_email??!0),ji(j.enviar_push??!1),No(String(j.dias_aviso_padrao??1)),Ro(j.nome_empresa||""),Fo(j.whatsapp_padrao||""),$o(j.email_padrao||""),await Mi(i);return}const{data:w,error:E}=await D.from("df_configuracoes").insert([{notificacoes_ativas:!0,enviar_whatsapp:!0,enviar_email:!0,enviar_push:!1,dias_aviso_padrao:1,nome_empresa:"DF Gestão Financeira",empresa_id:i}]).select();if(E){Ee(E);return}const F=Array.isArray(w)?w[0]:w;Ga(F),Co((F==null?void 0:F.notificacoes_ativas)??!0),bi((F==null?void 0:F.enviar_whatsapp)??!0),vi((F==null?void 0:F.enviar_email)??!0),ji((F==null?void 0:F.enviar_push)??!1),No(String((F==null?void 0:F.dias_aviso_padrao)??1)),Ro((F==null?void 0:F.nome_empresa)||""),Fo((F==null?void 0:F.whatsapp_padrao)||""),$o((F==null?void 0:F.email_padrao)||""),await Mi(i)}async function Yt(i=W){if(!i)return;const{data:p,error:h}=await D.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",i).eq("excluido",!0).order("excluido_em",{ascending:!1});h&&Ee(h),re(G,p||[]),await s({supabase:D,empresaAtual:i,avisarErro:Ee})}async function Xa(i=W){if(!i)return;const{data:p,error:h}=await D.from("df_centros_custo").select("*").eq("empresa_id",i).order("nome");if(h){Ee(h);return}tt(p||[])}async function Ti(i=W){if(!i){dt([]);return}try{const p=await Ho(i);dt((p||[]).filter(h=>h.ativo!==!1))}catch(p){Ee(p),dt([])}}const St=V.filter(i=>M==="pendentes"?i.status!=="pago":M==="pagas"?i.status==="pago":M==="vencidas"?g(i.data_vencimento,i.status):!0).filter(i=>!je||i.centro_custo_id===je).filter(i=>!he||i.filial_id===he).filter(i=>!oe||T(i.data_vencimento)===oe).filter(i=>!(pe&&i.data_vencimento<pe||Z&&i.data_vencimento>Z)).filter(i=>{var F,de;const p=ae.trim().toLowerCase();if(!p)return!0;const h=((F=i.df_centros_custo)==null?void 0:F.nome)||"",j=((de=i.df_filiais)==null?void 0:de.nome)||"",w=i.status==="pago"?"pago":g(i.data_vencimento,i.status)?"vencido":"pendente";return[i.descricao,i.observacao,i.categoria,i.forma_pagamento,h,j,w,Pt(i.data_vencimento),i.data_vencimento].filter(Boolean).some(Ue=>String(Ue).toLowerCase().includes(p))}),Di=V.filter(i=>M==="pendentes"?i.status!=="pago":M==="pagas"?i.status==="pago":M==="vencidas"?g(i.data_vencimento,i.status):!0).filter(i=>!je||i.centro_custo_id===je).filter(i=>!oe||T(i.data_vencimento)===oe).filter(i=>!(pe&&i.data_vencimento<pe||Z&&i.data_vencimento>Z)).filter(i=>{var F,de;const p=ae.trim().toLowerCase();if(!p)return!0;const h=((F=i.df_centros_custo)==null?void 0:F.nome)||"",j=((de=i.df_filiais)==null?void 0:de.nome)||"",w=i.status==="pago"?"pago":g(i.data_vencimento,i.status)?"vencido":"pendente";return[i.descricao,i.observacao,i.categoria,i.forma_pagamento,h,j,w,Pt(i.data_vencimento),i.data_vencimento].filter(Boolean).some(Ue=>String(Ue).toLowerCase().includes(p))}),Qa=St.reduce((i,p)=>i+Number(p.valor||0),0),To=St.filter(i=>i.status==="pago").reduce((i,p)=>i+Number(p.valor||0),0),Ii=St.filter(i=>g(i.data_vencimento,i.status)).reduce((i,p)=>i+Number(p.valor||0),0),Ai=Qa-To,Sn=St.filter(i=>i.status!=="pago").sort((i,p)=>String(p.created_at||p.data_vencimento||"").localeCompare(String(i.created_at||i.data_vencimento||"")));Te.map(i=>{const p=St.filter(E=>E.centro_custo_id===i.id),h=p.reduce((E,F)=>E+Number(F.valor||0),0),j=p.filter(E=>E.status==="pago").reduce((E,F)=>E+Number(F.valor||0),0),w=p.filter(E=>g(E.data_vencimento,E.status)).reduce((E,F)=>E+Number(F.valor||0),0);return{id:i.id,nome:i.nome,total:h,pago:j,pendente:h-j,vencido:w}}).filter(i=>i.total>0||i.pago>0||i.pendente>0||i.vencido>0);const Bi={critico:0,urgente:1,normal:2},qi=B.filter(i=>(!he||i.filial_id===he)&&`${i.titulo||""} ${i.conteudo||""}`.toLowerCase().includes(He.toLowerCase())).sort((i,p)=>{const h=i.concluida?1:0,j=p.concluida?1:0;if(h!==j)return h-j;const w=Bi[i.prioridade||"normal"]??2,E=Bi[p.prioridade||"normal"]??2;if(w!==E)return w-E;const F=i.data_evento||"9999-12-31",de=p.data_evento||"9999-12-31";return String(F).localeCompare(String(de))}),Ja=qi.filter(i=>!i.concluida),Li=Ja.filter(i=>i.prioridade==="critico").length,Oi=Ja.filter(i=>i.prioridade==="urgente").length;function _n(){return Xe({setMenuAberto:De,setMenuNavegacaoAberto:Et,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAvisoPadrao:ma})}async function En(i){return Vt({conta:i,supabase:D,empresaId:W,diasAvisoPadrao:ma,formatarDataParaBanco:io})}function Pa(){return gt()}async function zn(){return ea({supabase:D,empresaId:W,mostrarAviso:ee,configWhatsapp:ta,configEmail:aa,configPush:oa,diasAlertaContas:Wa,diasAvisoPadrao:ma,primeiraLetraMaiuscula:kt,converterValor:Nr,formatarDataParaBanco:io,erroEhSessaoExpirada:S,limparEstadoAutenticacao:Ht,setUsuarioLogado:zt,buscarContas:Kt,fecharConta:Pa})}async function Do(i){return Se({supabase:D,id:i,empresaId:W,buscarContas:Kt,mostrarAviso:ee})}async function Pn(i){return X({supabase:D,id:i,empresaId:W,buscarContas:Kt,mostrarAviso:ee})}async function Rn(i){return L({supabase:D,id:i,empresaId:W,avisarErro:Ee,buscarContas:Kt,buscarLixeira:Yt,mostrarAviso:ee})}function Fn(){return v({setMenuAberto:De,setMenuNavegacaoAberto:Et})}function Ui(i){return O(i)}function Za(){return se()}async function $n(){return ye({supabase:D,empresaId:W,mostrarAviso:ee,avisarErro:Ee,buscarNotas:za})}async function Vi(i){return ve({supabase:D,id:i,empresaId:W,avisarErro:Ee,buscarNotas:za,buscarLixeira:Yt,mostrarAviso:ee})}async function Gi(i){return ge({supabase:D,nota:i,empresaId:W,avisarErro:Ee,buscarNotas:za,mostrarAviso:ee})}async function Mn(){if(!W){ee("Usuário sem empresa vinculada.","erro");return}const i=Number(ma),p=Number(Wa),h=Number(ki);if(isNaN(i)||i<0||isNaN(p)||p<0||isNaN(h)||h<0){ee("Informe uma quantidade válida para os dias de alerta.","erro");return}const j={notificacoes_ativas:ko,enviar_whatsapp:ta,enviar_email:aa,enviar_push:oa,dias_aviso_padrao:i,nome_empresa:ia.trim()||null,whatsapp_padrao:Ni.trim()||null,email_padrao:Si.trim()||null,empresa_id:W};let w;if(Va!=null&&Va.id?w=await D.from("df_configuracoes").update(j).eq("id",Va.id).eq("empresa_id",W).select():w=await D.from("df_configuracoes").insert([j]).select(),w.error){Ee(w.error);return}const E=Array.isArray(w.data)?w.data[0]:w.data;Ga(E);const{error:F}=await D.from("df_configuracoes_alertas").upsert([{empresa_id:W,dias_alerta_contas:p,alertar_contas_vencidas:yi,destacar_contas_criticas:wi,dias_alerta_notas:h,destacar_notas_urgentes:Ci}],{onConflict:"empresa_id"});if(F){ee("Configurações principais salvas, mas os alertas globais não foram atualizados: "+F.message,"erro");return}ee("Configurações salvas com sucesso.","info")}async function Tn(i){const{error:p}=await D.from("df_contas").update({excluido:!1,excluido_em:null}).eq("id",i).eq("empresa_id",W);if(p){Ee(p);return}Kt(),Yt(),ee("Conta restaurada com sucesso.","sucesso")}async function Dn(i){return Re({supabase:D,id:i,empresaId:W,avisarErro:Ee,buscarNotas:za,buscarLixeira:Yt,mostrarAviso:ee})}async function In(i){const{error:p}=await D.from("df_contas").delete().eq("id",i.id).eq("empresa_id",W);if(p){Ee(p);return}Yt(),ee("Conta excluída definitivamente.","sucesso")}async function An(i){return le({supabase:D,nota:i,empresaId:W,avisarErro:Ee,buscarLixeira:Yt,mostrarAviso:ee})}async function Bn(){if(!W){ee("Usuário sem empresa vinculada.","erro");return}const i=kt(xt.trim());if(!i){ee("Digite o centro de custo.","erro");return}if(Te.some(w=>String(w.nome||"").trim().toLowerCase()===i.toLowerCase())){ee("Este centro de custo já existe nesta empresa.","erro");return}const{data:h,error:j}=await D.from("df_centros_custo").insert([{nome:i,empresa_id:W}]).select("*").single();if(j){Ee(j);return}Je(""),tt(w=>[...w.filter(F=>F.id!==h.id),h].sort((F,de)=>String(F.nome||"").localeCompare(String(de.nome||"")))),await Xa(W),ee("Centro de custo criado com sucesso.","sucesso")}async function qn(i){const{error:p}=await D.from("df_centros_custo").delete().eq("id",i).eq("empresa_id",W);if(p){ee("Não foi possível excluir. Verifique se existem contas usando este centro.","erro");return}Xa(),Kt()}function Ln(){const i=["Descricao","Valor","Vencimento","Status","Filial","Centro"],p=St.map(F=>{var de,Ue;return[F.descricao||"",Number(F.valor||0).toFixed(2).replace(".",","),Pt(F.data_vencimento),g(F.data_vencimento,F.status)?"vencido":F.status,((de=F.df_filiais)==null?void 0:de.nome)||"",((Ue=F.df_centros_custo)==null?void 0:Ue.nome)||""]}),h=[i,...p].map(F=>F.map(de=>`"${String(de).replaceAll('"','""')}"`).join(";")).join(`
`),j=new Blob([h],{type:"text/csv;charset=utf-8;"}),w=URL.createObjectURL(j),E=document.createElement("a");E.href=w,E.download="relatorio-contas.csv",E.click(),URL.revokeObjectURL(w)}function On(){const i=w=>String(w??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),p=St.map(w=>{var F,de;const E=g(w.data_vencimento,w.status)?"Vencido":w.status==="pago"?"Pago":"Pendente";return`
        <tr>
          <td>
            <strong>${i(w.descricao||"-")}</strong>
            ${w.observacao?`<small>Obs: ${i(w.observacao)}</small>`:""}
          </td>
          <td>${i(((F=w.df_filiais)==null?void 0:F.nome)||"-")}</td>
          <td>${i(((de=w.df_centros_custo)==null?void 0:de.nome)||"-")}</td>
          <td>${i(Pt(w.data_vencimento))}</td>
          <td><span class="status ${E.toLowerCase()}">${E}</span></td>
          <td class="valor">${i(rt(w.valor))}</td>
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
                <div class="empresa">${i(ia||"DF Gestão Financeira")}</div>
              </div>
              <div class="data">Gerado em ${new Date().toLocaleDateString("pt-BR")}<br/>${St.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${i(rt(Qa))}</strong></div>
              <div class="box"><span>Pago</span><strong>${i(rt(To))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${i(rt(Ai))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${i(rt(Ii))}</strong></div>
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
    `,j=window.open("","_blank");if(!j){ee("O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.","erro");return}j.document.open(),j.document.write(h),j.document.close()}function Un(){I(""),Y("todas"),ce(""),Ce(""),y(""),A(""),K("")}function wt({titulo:i,mensagem:p,textoConfirmar:h="Confirmar",tipo:j="padrao",acao:w}){_i({aberto:!0,titulo:i,mensagem:p,textoConfirmar:h,tipo:j,acao:w})}function eo(){_i({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null})}async function Wi(){typeof yt.acao=="function"&&await yt.acao(),eo()}function Hi(i){return String(i||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Ra(i,p){const h=Object.entries(i||{});for(const j of p){const w=Hi(j),E=h.find(([F])=>Hi(F)===w);if(E)return E[1]}return""}function Vn(i){if(!i)return null;if(typeof i=="number"){const h=new Date(Date.UTC(1899,11,30));return h.setUTCDate(h.getUTCDate()+i),h.toISOString().slice(0,10)}const p=String(i).trim();if(!p)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(p))return p;if(/^\d{2}\/\d{2}\/\d{4}$/.test(p)){const[h,j,w]=p.split("/");return`${w}-${j}-${h}`}return io(p)}function Gn(i){if(typeof i=="number")return i;const p=String(i||"").replace(/R\$/gi,"").replace(/\./g,"").replace(",",".").trim();return Number(p||0)}function Ki(i){const p=[];let h="",j=!1;for(let w=0;w<i.length;w+=1){const E=i[w],F=i[w+1];if(E==='"'&&F==='"'){h+='"',w+=1;continue}if(E==='"'){j=!j;continue}if((E===";"||E===",")&&!j){p.push(h.trim()),h="";continue}h+=E}return p.push(h.trim()),p}function Wn(i){const p=String(i||"").replace(/^﻿/,"").split(/\r?\n/).filter(j=>j.trim());if(p.length<2)return[];const h=Ki(p[0]);return p.slice(1).map(j=>{const w=Ki(j);return h.reduce((E,F,de)=>(E[F]=w[de]||"",E),{})})}async function Hn(i){var w,E;const p=(w=i.target.files)==null?void 0:w[0];if(Mo(p||null),Ha([]),_a(""),!p)return;if(((E=p.name.split(".").pop())==null?void 0:E.toLowerCase())!=="csv"){_a("Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.");return}const j=new FileReader;j.onload=F=>{const Ue=Wn(F.target.result).map((ct,ke)=>{const Le=Ra(ct,["descricao","descrição","conta","nome","fornecedor"]),Lt=Ra(ct,["valor","valor pago","total"]),na=Ra(ct,["vencimento","data vencimento","data_vencimento","data"]),$t=String(Ra(ct,["status","situacao","situação"])||"pendente").toLowerCase(),sa=Ra(ct,["centro","centro de custo","categoria","setor"]);return{linha:ke+2,descricao:kt(String(Le||"").trim()),valor:Gn(Lt),data_vencimento:Vn(na),status:$t.includes("pag")?"pago":"pendente",centro:String(sa||"").trim()}}).filter(ct=>ct.descricao||ct.valor||ct.data_vencimento);Ha(Ue),_a(`${Ue.length} linha(s) preparada(s) para revisão.`)},j.readAsText(p,"UTF-8")}async function Kn(){if(!W){ee("Usuário sem empresa vinculada.","erro");return}const i=Wt.filter(w=>!w.descricao||!w.valor||!w.data_vencimento);if(i.length>0){ee(`Existem ${i.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`,"erro");return}const p={...Object.fromEntries(Te.map(w=>[w.nome.toLowerCase(),w.id]))};for(const w of Wt)if(w.centro&&!p[w.centro.toLowerCase()]){const{data:E,error:F}=await D.from("df_centros_custo").insert([{nome:kt(w.centro),empresa_id:W}]).select();if(F){Ee(F);return}const de=Array.isArray(E)?E[0]:E;p[w.centro.toLowerCase()]=de==null?void 0:de.id}const h=Wt.map(w=>({descricao:w.descricao,valor:w.valor,data_vencimento:w.data_vencimento,vencimento:w.data_vencimento,status:w.status,centro_custo_id:w.centro&&p[w.centro.toLowerCase()]||null,enviar_whatsapp:ta,enviar_email:aa,enviar_push:oa,dias_aviso:Number(ma||1),empresa_id:W})),{error:j}=await D.from("df_contas").insert(h);if(j){Ee(j);return}_a(`${h.length} conta(s) importada(s) com sucesso.`),Mo(null),Ha([]),await Ka(W),Fe("contas")}async function to(){Ht(),zt(null),wa(!1),ca("contas"),await D.auth.signOut()}function fa({titulo:i,aberto:p,onClick:h}){const j=String(i||"").split(" "),w=j[0]||"",E=j.slice(1).join(" ")||i;return e.jsxs("button",{style:x.headerExpansivel,onClick:h,children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:10,color:"#0f172a",fontWeight:900,lineHeight:1.1},children:[e.jsx("span",{style:{fontSize:24,lineHeight:1},children:w}),e.jsx("span",{children:E})]}),e.jsx("strong",{style:{color:"#0f172a"},children:p?"−":"+"})]})}function Fe(i){var p;De(!1),Et(!1),ca(i),((p=window.history.state)==null?void 0:p.tela)!==i&&window.history.pushState({tela:i},"",window.location.href)}function Yn(){Fe("dashboard")}function Xt(){var h,j;const i=xo||((h=R==null?void 0:R.user_metadata)==null?void 0:h.name)||((j=R==null?void 0:R.user_metadata)==null?void 0:j.full_name);if(i)return String(i).split(" ")[0];const p=(R==null?void 0:R.email)||"usuário";return kt(p.split("@")[0])}function Yi(){var h,j;const i=xo||((h=R==null?void 0:R.user_metadata)==null?void 0:h.name)||((j=R==null?void 0:R.user_metadata)==null?void 0:j.full_name);if(i)return String(i).trim();const p=(R==null?void 0:R.email)||"";return p?kt(p.split("@")[0]):""}function Xi(){Qo(Yi()),ho(!0)}async function Xn(){const i=String(Xo||"").trim().replace(/\s+/g," ");if(i.length<2){ee("Informe um nome com pelo menos 2 caracteres.","erro");return}Jo(!0);try{await us({userId:R==null?void 0:R.id,email:R==null?void 0:R.email,nome:i}),pa(i),zt(p=>p&&{...p,user_metadata:{...p.user_metadata||{},name:i,full_name:i}}),W&&await ua(W),ho(!1),ee("Perfil atualizado com sucesso.","sucesso")}catch(p){Ee(p,"Não foi possível atualizar o perfil.")}finally{Jo(!1)}}function Qn(){return yt.aberto?e.jsx("div",{style:x.overlayConfirmacao,children:e.jsxs("div",{style:x.modalConfirmacao,children:[e.jsx("div",{style:x.confirmacaoIcone,children:yt.tipo==="perigo"?"⚠️":yt.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:x.confirmacaoTitulo,children:yt.titulo}),e.jsx("p",{style:x.confirmacaoTexto,children:yt.mensagem}),e.jsxs("div",{style:x.confirmacaoAcoes,children:[e.jsx("button",{style:x.btnConfirmarCancelar,onClick:eo,children:"Cancelar"}),e.jsx("button",{style:{...x.btnConfirmarAcao,background:yt.tipo==="perigo"?"#dc3545":yt.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:Wi,children:yt.textoConfirmar})]})]})}):null}function Qi(){return e.jsxs(e.Fragment,{children:[J&&e.jsx(Ml,{styles:x,editandoContaId:_e,descricao:we,setDescricao:U,valor:fe,setValor:Ae,dataVencimento:C,setDataVencimento:be,centroCustoId:ze,setCentroCustoId:me,centros:Te,filialId:$,setFilialId:ie,filiais:xe,observacaoConta:et,setObservacaoConta:st,contaRecorrente:Oe,setContaRecorrente:It,tipoRecorrencia:Ye,setTipoRecorrencia:lt,diaVencimentoRecorrencia:Be,setDiaVencimentoRecorrencia:pt,fecharConta:Pa,salvarConta:zn,primeiraLetraMaiuscula:kt,limitarDataInput:Io,formatarDataParaBanco:io,fecharNota:Za,setModalCentro:ft,setMenuAberto:De,setMenuNavegacaoAberto:Et}),Ke&&e.jsx(Tl,{styles:x,editandoNotaId:ot,tituloNota:bt,setTituloNota:Rt,prioridadeNota:Qe,setPrioridadeNota:mt,dataEventoNota:Bt,setDataEventoNota:qt,conteudoNota:Gt,setConteudoNota:At,filialNotaId:ut,setFilialNotaId:vt,filiais:xe,salvarNota:$n,fecharNota:Za,fecharConta:Pa,setModalCentro:ft,setMenuAberto:De,setMenuNavegacaoAberto:Et,primeiraLetraMaiuscula:kt,limitarDataInput:Io}),Ct&&e.jsx(Dl,{styles:x,novoCentro:xt,setNovoCentro:Je,salvarCentro:Bn,centros:Te,abrirConfirmacao:wt,excluirCentro:qn,fecharConta:Pa,fecharNota:Za,setModalCentro:ft,setMenuAberto:De,setMenuNavegacaoAberto:Et}),Yr&&e.jsx(Al,{nome:Xo,setNome:Qo,email:R==null?void 0:R.email,salvando:Xr,onClose:()=>ho(!1),onSave:Xn})]})}function Ji(){return e.jsx(zl,{styles:x,nomeEmpresa:ia,navegarPara:Fe,menuNavegacaoAberto:Ze,setMenuNavegacaoAberto:Et,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:_,empresaId:W,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,nomeUsuario:Xt,abrirPerfilUsuario:Xi,sairDoSistema:to})}function Zi(){return e.jsxs(e.Fragment,{children:[Ft&&e.jsxs("div",{className:"global-fab-menu",style:x.menuFab,onClick:i=>i.stopPropagation(),children:[e.jsxs("button",{style:x.menuItem,type:"button",onClick:i=>{i.preventDefault(),i.stopPropagation(),_n()},"aria-label":"Nova conta",children:[e.jsx("span",{style:x.menuItemIcone,children:"💰"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova conta"})]}),e.jsxs("button",{style:x.menuItem,type:"button",onClick:i=>{i.preventDefault(),i.stopPropagation(),Fn()},"aria-label":"Nova nota",children:[e.jsx("span",{style:x.menuItemIcone,children:"📝"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova nota"})]})]}),e.jsx("button",{className:"global-fab",style:x.fab,onClick:i=>{i.stopPropagation(),De(!Ft)},children:Ft?"×":"+"})]})}function er(){return e.jsx("style",{children:`
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
      `})}function Jn(){return e.jsx("style",{children:`
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
      `})}function tr(){return e.jsx("style",{children:`
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
      `})}function at(i){return e.jsx(cr,{contas:V,contasFiltradas:St,navegarPara:Fe,children:e.jsxs("div",{className:"app-page app-frame",style:x.page,children:[e.jsx("style",{children:`

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

      `}),tr(),er(),e.jsx(ur,{}),Jn(),Ji(),ar(),or(),e.jsx("main",{className:"app-frame-content",children:i}),Zi(),e.jsx(pr,{}),e.jsx(mr,{}),Qn(),Qi(),e.jsx(dr,{visible:r}),e.jsx(qo,{toast:n,onClose:l})]})})}function ao({icon:i,title:p,description:h}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:i}),e.jsx("strong",{children:p}),e.jsx("p",{children:h})]})}function Zn(i){Hr(p=>({...p,[i]:!p[i]}))}function ar(){return e.jsx(Fl,{sidebarCompacta:Vr,setSidebarCompacta:Gr,nomeUsuario:Xt,nomeUsuarioAtual:Xt(),normalizarPerfil:Nt,perfilUsuario:Aa,menuSections:Fi(),telaAtual:it,navegarPara:Fe,gruposMenu:Wr,toggleGrupoMenu:Zn,sairDoSistema:to})}function or(){return e.jsx($l,{visible:Ze,styles:x,setMenuNavegacaoAberto:Et,nomeUsuario:Xt,nomeUsuarioAtual:Xt(),normalizarPerfil:Nt,perfilUsuario:Aa,menuSections:Fi(),navegarPara:Fe,sairDoSistema:to,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:_,empresaId:W,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,abrirPerfilUsuario:Xi})}if(Kr)return e.jsx("div",{style:x.page,children:e.jsx("h2",{children:"Carregando..."})});if(!R)return e.jsxs(e.Fragment,{children:[e.jsx(El,{onLogin:zt}),e.jsx(qo,{toast:n,onClose:l})]});if(Zo)return e.jsxs("div",{style:x.page,children:[e.jsx("h2",{children:"⚠️ Empresa não vinculada"}),e.jsx("p",{children:Zo}),e.jsx("button",{style:x.btnSair,onClick:to,children:"Sair"})]});if(it==="contas")return at(e.jsx(Zs,{styles:x,busca:ae,setBusca:I,mostrarFiltros:tn,setMostrarFiltros:an,limparFiltros:Un,imprimirPDF:On,exportarCSV:Ln,filtroStatus:M,setFiltroStatus:Y,centros:Te,filtroCentro:je,setFiltroCentro:ce,filiais:xe,filtroFilial:he,setFiltroFilial:Ce,filtroMes:oe,setFiltroMes:y,dataInicial:pe,setDataInicial:A,dataFinal:Z,setDataFinal:K,limitarDataInput:Io,contasFiltradas:St,total:Qa,formatarValor:rt,loading:Q,HeaderExpansivel:fa,mostrarContas:on,setMostrarContas:rn,estaVencida:g,formatarData:Pt,formatarTipoRecorrencia:Pr,obterTipoRecorrenciaConta:zr,abrirConfirmacao:wt,marcarComoPago:Do,voltarParaPendente:Pn,abrirEdicaoConta:En,excluirConta:Rn,navegarPara:Fe}));if(it==="relatorios")return at(e.jsx(Bs,{voltar:()=>Fe("contas"),empresaId:W,usuario:R,mostrarAviso:ee}));if(it==="notas")return at(e.jsx(tl,{styles:x,navegarPara:Fe,notasFiltradas:qi,notasPendentes:Ja,notasCriticas:Li,notasUrgentes:Oi,buscaNota:He,setBuscaNota:qe,formatarData:Pt,alternarNotaConcluida:Gi,abrirEdicaoNota:Ui,abrirConfirmacao:wt,excluirNota:Vi,loading:Q,nomeUsuario:Xt(),filiais:xe,filtroFilial:he,setFiltroFilial:Ce,contasOperacionaisFiliais:Di}));if(it==="importar")return at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📥 Importar planilha"}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"1. Enviar arquivo"}),e.jsx("p",{style:x.textoNota,children:"Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app."}),e.jsxs("label",{style:x.uploadExcelBox,children:[e.jsx("strong",{children:"📊 Selecionar arquivo CSV"}),e.jsx("small",{children:"No Excel: Arquivo > Salvar como > CSV UTF-8"}),e.jsx("input",{type:"file",accept:".csv",onChange:Hn,style:{display:"none"}})]}),Ei&&e.jsxs("p",{style:x.textoNota,children:["Arquivo: ",e.jsx("strong",{children:Ei.name})]}),zi&&e.jsx("p",{style:x.alertaSucesso,children:zi})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"2. Colunas esperadas"}),e.jsxs("div",{style:x.importDicasGrid,children:[e.jsx("span",{children:"Descrição"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Vencimento"}),e.jsx("span",{children:"Status"}),e.jsx("span",{children:"Centro de custo"})]}),e.jsx("p",{style:x.textoAjuda,children:"O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação."})]}),Wt.length>0&&e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"3. Revisar dados"}),e.jsx("div",{style:x.previewImportacao,children:Wt.slice(0,8).map(i=>e.jsxs("div",{style:x.previewLinha,children:[e.jsx("strong",{children:i.descricao||`Linha ${i.linha}`}),e.jsxs("small",{children:[Pt(i.data_vencimento)," • ",rt(i.valor)," • ",i.status," • ",i.centro||"Sem centro"]})]},i.linha))}),Wt.length>8&&e.jsxs("small",{style:x.textoAjuda,children:["Mostrando 8 de ",Wt.length," linhas."]}),e.jsxs("button",{style:x.btnSalvar,onClick:Kn,children:["Importar ",Wt.length," conta(s)"]})]})]}));if(it==="master-empresas")return Ne!=null&&Ne.canManageCompanies?at(e.jsx(dl,{styles:x,usuarioLogado:R,nomeUsuarioCompleto:Yi,empresaId:W,empresasDisponiveis:_,trocarEmpresaAtiva:Ya,trocandoEmpresa:Ca,mostrarAviso:ee,onEmpresasAtualizadas:hn,voltarPainel:Yn,abaInicial:"empresas"})):at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏢 Painel Master"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o painel master."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"})]})]}));if(it==="onboarding")return Ea()?at(e.jsx(yl,{styles:x,empresaId:W,empresaNome:ia,filiais:xe,centros:Te,contas:V,mostrarAviso:ee,onRefresh:()=>Ka(W),voltarPainel:()=>Fe("configuracoes"),abrirDashboard:()=>Fe("dashboard")})):at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🚀 Onboarding SaaS"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o onboarding."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"})]})]}));if(it==="billing")return Ea()?at(e.jsx(vl,{styles:x,empresaId:W,empresaNome:ia,filiais:xe,usuarios:La,mostrarAviso:ee,podeEditar:ra(),voltarPainel:()=>Fe("configuracoes")})):at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"💼 Billing"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o billing."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"})]})]}));if(it==="filiais")return Ea()?at(e.jsx(pl,{styles:x,empresaId:W,empresaNome:ia,mostrarAviso:ee,voltarPainel:()=>Fe("configuracoes")})):at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏬 Filiais"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite gerenciar filiais."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"})]})]}));if(it==="usuarios")return at(e.jsx(kl,{styles:x,EmptyState:ao,podeAcessarConfiguracoes:Ea,podeAdministrarUsuarios:ra,navegarPara:Fe,usuarioLogado:R,normalizarPerfil:Nt,perfilUsuario:Aa,permissoesUsuario:Ne,novoEmailUsuario:ui,setNovoEmailUsuario:fi,novaSenhaUsuario:Sa,setNovaSenhaUsuario:xi,confirmarNovaSenhaUsuario:hi,setConfirmarNovaSenhaUsuario:gi,salvarMeuEmail:kn,salvarMinhaSenha:Cn,empresasDisponiveis:_,empresaId:W,trocandoEmpresa:Ca,trocarEmpresaAtiva:Ya,buscarUsuariosEmpresa:ua,primeiraLetraMaiuscula:kt,nomeConviteUsuario:si,setNomeConviteUsuario:li,emailConviteUsuario:ri,setEmailConviteUsuario:ni,senhaConviteUsuario:pi,setSenhaConviteUsuario:mi,perfilConviteUsuario:di,setPerfilConviteUsuario:ci,criandoUsuarioManual:ti,adicionarUsuarioEmpresa:gn,usuariosCarregando:Qr,usuariosInicializados:Jr,usuariosErro:Zr,usuariosEmpresa:La,filiais:xe,filiaisUsuariosEmpresa:oi,salvandoFilialUsuario:en,liberarTodasFiliaisUsuario:yn,alternarFilialUsuario:jn,atualizarPerfilUsuarioEmpresa:vn,enviarAcessoUsuarioEmpresa:bn,removerUsuarioEmpresa:wn}));if(it==="configuracoes")return Ea()?at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🔔 Notificações",aberto:yo,onClick:()=>pn(!yo)}),yo&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificações ativas"}),e.jsx("small",{children:"Controle geral dos disparos automáticos da empresa."})]}),e.jsx("input",{type:"checkbox",checked:ko,onChange:i=>Co(i.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Contas"}),e.jsx("span",{children:"Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar contas antes do vencimento. Ex: 1",value:Wa,onChange:i=>{So(i.target.value),No(i.target.value)}}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificar contas vencidas"}),e.jsx("small",{children:"Exibir contas em atraso nas notificações e destaques."})]}),e.jsx("input",{type:"checkbox",checked:yi,onChange:i=>_o(i.target.checked)})]}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar contas críticas"}),e.jsx("small",{children:"Dar prioridade visual para contas vencidas ou muito próximas do vencimento."})]}),e.jsx("input",{type:"checkbox",checked:wi,onChange:i=>Eo(i.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Notas"}),e.jsx("span",{children:"Regras para pendências e prioridades do bloco de notas."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar notas pendentes após quantos dias. Ex: 3",value:ki,onChange:i=>zo(i.target.value)}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar notas urgentes"}),e.jsx("small",{children:"Manter notas urgentes e críticas no topo do acompanhamento."})]}),e.jsx("input",{type:"checkbox",checked:Ci,onChange:i=>Po(i.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Canais preparados"}),e.jsxs("span",{children:["WhatsApp: ",ta?"Ligado":"Desligado"," • E-mail: ",aa?"Ligado":"Desligado"," • Push: ",oa?"Ligado":"Desligado"]})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏢 Dados do negócio",aberto:jo,onClick:()=>cn(!jo)}),jo&&e.jsxs(e.Fragment,{children:[e.jsx("input",{style:x.input,placeholder:"Nome da empresa",value:ia,onChange:i=>Ro(kt(i.target.value))}),e.jsx("input",{style:x.input,placeholder:"WhatsApp padrão. Ex: 5511999999999",value:Ni,onChange:i=>Fo(i.target.value)}),e.jsx("input",{style:x.input,placeholder:"E-mail padrão",value:Si,onChange:i=>$o(i.target.value)})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🔁 Recorrências",aberto:wo,onClick:()=>un(!wo)}),wo&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Padrão atual"}),e.jsx("span",{children:"Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir."})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏷 Centros de custo",aberto:Ua,onClick:()=>mn(!Ua)}),Ua&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"Cadastre e gerencie os centros usados nas contas e nos relatórios."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Total de centros: ",Te.length]}),e.jsx("span",{children:"Uso nos filtros e relatórios"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>ft(!0),children:"Gerenciar centros"})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(fa,{titulo:"🏬 Filiais / Unidades",aberto:Ua,onClick:()=>Fe("filiais")}),e.jsx("p",{style:x.textoNota,children:"Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("span",{children:"Organização: empresa → filial → centro de custo → conta"}),e.jsx("span",{children:"Isolamento por empresa ativo"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>Fe("filiais"),children:"Gerenciar filiais"})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"🧠 Como o sistema vai usar"}),e.jsx("p",{style:x.textoNota,children:"O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos e as contas/notas passam a obedecer ao mesmo padrão configurado aqui."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Geral: ",ko?"Ligado":"Desligado"]}),e.jsxs("span",{children:["WhatsApp: ",ta?"Ligado":"Desligado"]}),e.jsxs("span",{children:["E-mail: ",aa?"Ligado":"Desligado"]}),e.jsxs("span",{children:["Push: ",oa?"Ligado":"Desligado"]})]})]}),e.jsx("button",{style:x.btnSalvar,onClick:Mn,children:"Salvar configurações"})]})):at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar configurações."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Fe("contas"),children:"← Voltar"})]})]}));if(it==="agenda"){let i=function({titulo:ke,total:Le,lista:Lt,cor:na}){return e.jsxs("section",{style:x.cardAgenda,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:ke}),e.jsx("span",{children:rt(Le)})]}),Lt.length===0&&e.jsx(ao,{icon:"✅",title:"Agenda limpa",description:"Não há contas neste grupo de vencimento no momento."}),Lt.map($t=>{var ir;const sa=ha($t.data_vencimento);return e.jsxs("div",{style:{...x.itemAgenda,borderLeft:`5px solid ${na}`},children:[e.jsxs("div",{children:[e.jsx("strong",{children:$t.descricao}),e.jsxs("div",{style:x.cardInfo,children:[Pt($t.data_vencimento)," • ",((ir=$t.df_centros_custo)==null?void 0:ir.nome)||"Sem centro"]}),e.jsx("small",{style:sa<0?x.textoVencidoAgenda:x.textoAgenda,children:sa<0?`Vencida há ${Math.abs(sa)} dia(s)`:sa===0?"Vence hoje":`Vence em ${sa} dia(s)`})]}),e.jsxs("div",{style:x.agendaDireita,children:[e.jsx("strong",{children:rt($t.valor)}),e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${$t.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>Do($t.id)}),children:"Pago"})]})]},$t.id)})]})};const p=[...V].filter(ke=>ke.status!=="pago").sort((ke,Le)=>Ta(ke.data_vencimento)-Ta(Le.data_vencimento)),h=p.filter(ke=>ha(ke.data_vencimento)<0),j=p.filter(ke=>ha(ke.data_vencimento)===0),w=p.filter(ke=>{const Le=ha(ke.data_vencimento);return Le>0&&Le<=7}),E=p.filter(ke=>ha(ke.data_vencimento)>7&&Us(ke.data_vencimento)),F=h.reduce((ke,Le)=>ke+Number(Le.valor||0),0),de=j.reduce((ke,Le)=>ke+Number(Le.valor||0),0),Ue=w.reduce((ke,Le)=>ke+Number(Le.valor||0),0),ct=E.reduce((ke,Le)=>ke+Number(Le.valor||0),0);return at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📅 Agenda Financeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"agenda-summary-grid",style:x.resumo,children:[e.jsxs("div",{style:x.boxVencido,children:[e.jsx("span",{children:"Vencidas"}),e.jsx("strong",{children:rt(F)})]}),e.jsxs("div",{style:x.boxPendente,children:[e.jsx("span",{children:"Hoje"}),e.jsx("strong",{children:rt(de)})]}),e.jsxs("div",{style:x.boxTotal,children:[e.jsx("span",{children:"7 dias"}),e.jsx("strong",{children:rt(Ue)})]}),e.jsxs("div",{style:x.boxPago,children:[e.jsx("span",{children:"Mês"}),e.jsx("strong",{children:rt(ct)})]})]}),e.jsxs("div",{className:"agenda-page-grid",children:[e.jsx(i,{titulo:"🚨 Vencidas",total:F,lista:h,cor:"#dc3545"}),e.jsx(i,{titulo:"📌 Vencem hoje",total:de,lista:j,cor:"#ffc107"}),e.jsx(i,{titulo:"🗓️ Próximos 7 dias",total:Ue,lista:w,cor:"#0d6efd"}),e.jsx(i,{titulo:"📆 Restante do mês",total:ct,lista:E,cor:"#14b8a6"})]})]}))}return it==="lixeira"?at(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🗑️ Lixeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>Fe("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"trash-section trash-section-accounts",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"💰 Contas excluídas"}),ne.length===0&&e.jsx(ao,{icon:"🧹",title:"Nenhuma conta na lixeira",description:"As contas excluídas aparecerão aqui durante o período de quarentena."}),ne.map(i=>{var h;const p=P(i.excluido_em);return z(i.excluido_em),e.jsxs("div",{className:"trash-card trash-card-account",style:x.cardLixeira,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:i.descricao}),e.jsx("span",{children:rt(i.valor)})]}),e.jsxs("div",{style:x.cardInfo,children:["Venc.: ",Pt(i.data_vencimento)," • Centro: ",((h=i.df_centros_custo)==null?void 0:h.nome)||"Sem centro"," • Lixeira há ",p," dia(s)"]}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Restaurar conta",mensagem:`Deseja restaurar a conta ${i.descricao}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Tn(i.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>wt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a conta ${i.descricao}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>In(i)}),children:"Excluir definitivo"})]})]},i.id)})]}),e.jsxs("section",{className:"trash-section trash-section-notes",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"📝 Notas excluídas"}),Pe.length===0&&e.jsx(ao,{icon:"🗒️",title:"Nenhuma nota na lixeira",description:"As notas excluídas aparecerão aqui antes da remoção definitiva."}),Pe.map(i=>{const p=P(i.excluido_em);return z(i.excluido_em),e.jsxs("div",{className:"trash-card trash-card-note",style:x.cardLixeira,children:[e.jsx("strong",{children:i.titulo}),i.conteudo&&e.jsx("p",{style:x.textoNota,children:i.conteudo}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>wt({titulo:"Restaurar nota",mensagem:`Deseja restaurar a nota ${i.titulo}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Dn(i.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>wt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a nota ${i.titulo}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>An(i)}),children:"Excluir definitivo"})]})]},i.id)})]})]})):e.jsx(cr,{contas:V,contasFiltradas:St,navegarPara:Fe,children:e.jsxs("div",{className:"app-page",style:x.page,onClick:()=>{Ft&&De(!1)},children:[e.jsx("style",{children:`
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
        `}),tr(),er(),e.jsx(ur,{}),e.jsxs("div",{className:"print-header",children:[e.jsx("h1",{children:"Relatório Financeiro"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]})]}),e.jsx("div",{className:"print-footer",children:"Relatório gerado pelo Sistema DF Gestão Financeira"}),Ji(),ar(),or(),Zi(),e.jsx(pr,{}),e.jsx(mr,{}),e.jsx("style",{children:`
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
      `}),e.jsx("section",{className:"dashboard-page-context","aria-label":"Contexto da página",children:e.jsxs("h1",{className:"dashboard-greeting-title",children:["Olá, ",Xt()]})}),e.jsx(Qs,{styles:x,formatarValor:rt,total:Qa,pago:To,pendente:Ai,vencido:Ii,contas:St,diferencaDias:ha,navegarPara:Fe,contasAbertasDashboard:Sn,mostrarContasDashboard:nn,setMostrarContasDashboard:sn,busca:ae,setBusca:I,estaVencida:g,formatarData:Pt,abrirConfirmacao:wt,marcarComoPago:Do,notasPendentes:Ja,notasCriticas:Li,notasUrgentes:Oi,mostrarNotas:ln,setMostrarNotas:dn,alternarNotaConcluida:Gi,abrirEdicaoNota:Ui,excluirNota:Vi,loading:Q,nomeUsuario:Xt(),filiais:xe,filtroFilial:he,setFiltroFilial:Ce,contasOperacionaisFiliais:Di}),Qi(),e.jsx(dr,{visible:r}),e.jsx(qo,{toast:n,onClose:l}),e.jsx(Il,{styles:x,confirmacao:yt,fecharConfirmacao:eo,executarConfirmacao:Wi})]})})}es.createRoot(document.getElementById("root")).render(e.jsx(ts.StrictMode,{children:e.jsx(_l,{children:e.jsx(Rd,{})})}));
