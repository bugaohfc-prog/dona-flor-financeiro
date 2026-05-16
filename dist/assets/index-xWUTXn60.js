import{r as c,j as e,a as rs,b as is,R as ns}from"./vendor-react-CdkWbty6.js";import{c as ss}from"./vendor-supabase-D2gm834s.js";import{R as ha,L as oi,C as io,X as no,Y as so,T as ga,a as to,B as vi,b as ji,P as yi,c as wi,d as ki}from"./vendor-charts-CfInRp4A.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const l of n)if(l.type==="childList")for(const d of l.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&i(d)}).observe(document,{childList:!0,subtree:!0});function o(n){const l={};return n.integrity&&(l.integrity=n.integrity),n.referrerPolicy&&(l.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?l.credentials="include":n.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(n){if(n.ep)return;n.ep=!0;const l=o(n);fetch(n.href,l)}})();const ls=void 0;function ds(){return!!ls}function cs(){return ds()?"":"Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o sistema."}const I=ss("https://placeholder.supabase.co","placeholder-anon-key",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}});function Yt(t){const a=String(t||"").toLowerCase().trim();return["admin","adm","administrador","master","owner"].includes(a)?"admin":["gerente","gerencia","gestor","manager"].includes(a)?"gerente":["financeiro","financas","finanças","financial"].includes(a)?"financeiro":["operacional","operacao","operação","atendente"].includes(a)?"operacional":["visualizacao","visualização","viewer","leitura","consulta"].includes(a)?"visualizacao":(["operador","usuario","usuário","user"].includes(a),"operador")}function ps(t=[],a=null){const o=(t||[]).map(n=>({...n,empresa_id:n.empresa_id||a,email:String(n.email||"").trim().toLowerCase(),perfil:Yt(n.perfil)})).filter(n=>!a||n.empresa_id===a),i=new Map;for(const n of o){const l=n.user_id||n.email||n.id,d=i.get(l);if(!d){i.set(l,n);continue}i.set(l,{...d,...n,id:d.id||n.id,nome:d.nome||n.nome,email:d.email||n.email,user_id:d.user_id||n.user_id,perfil:d.perfil==="admin"?d.perfil:n.perfil,created_at:d.created_at||n.created_at})}return Array.from(i.values())}async function ms(t){const{data:a,error:o}=await I.functions.invoke("listar-usuarios-empresa",{body:{empresaId:t}});if(o)throw o;if((a==null?void 0:a.ok)===!1)throw new Error((a==null?void 0:a.message)||"Não foi possível listar usuários pela Edge Function.");return ps((a==null?void 0:a.usuarios)||[],t)}async function us(t){return t?ms(t):[]}async function fs({empresaId:t,email:a,nome:o,perfil:i,senhaProvisoria:n,criarAuthManual:l=!1}){const d=String(a||"").trim().toLowerCase(),m=String(o||"").trim()||d.split("@")[0],u=Yt(i),b=String(n||"").trim();if(!t)throw new Error("Empresa não identificada.");if(!d||!d.includes("@"))throw new Error("Informe um e-mail válido.");if(l&&b.length<6)throw new Error("Informe uma senha provisória com pelo menos 6 caracteres.");if(l){const{data:C,error:k}=await I.functions.invoke("criar-usuario-manual",{body:{empresaId:t,email:d,nome:m,perfil:u,senhaProvisoria:b}});if(k){const U=String((k==null?void 0:k.message)||(k==null?void 0:k.details)||"");throw U.includes("Failed to send a request")?new Error("Não foi possível conectar à Edge Function criar-usuario-manual. Confirme se ela foi publicada no Supabase e se o projeto está correto."):new Error(U||"A Edge Function criar-usuario-manual retornou erro. Verifique os logs no Supabase.")}if((C==null?void 0:C.ok)===!1)throw new Error((C==null?void 0:C.message)||"Não foi possível criar o usuário manualmente.");return(C==null?void 0:C.usuario)||(C==null?void 0:C.vinculo)||{empresa_id:t,email:d,nome:m,perfil:u,user_id:(C==null?void 0:C.userId)||null}}const{data:N,error:v}=await I.from("df_usuarios_empresas").select("id, email, user_id").eq("empresa_id",t).eq("email",d).maybeSingle();if(v)throw v;if(N)throw new Error("Este e-mail já está cadastrado nesta empresa.");const y={empresa_id:t,user_id:null,email:d,nome:m,perfil:u},{data:h,error:$}=await I.from("df_usuarios_empresas").insert([y]).select("*").single();if($)throw $;return h}async function xs({empresaId:t,usuario:a,perfil:o}){const i=Yt(o);let n=I.from("df_usuarios_empresas").update({perfil:i}).eq("empresa_id",t);a.id?n=n.eq("id",a.id):a.user_id?n=n.eq("user_id",a.user_id):n=n.eq("email",a.email);const{error:l}=await n;if(l)throw l}async function hs({empresaId:t,usuario:a}){let o=I.from("df_usuarios_empresas").delete().eq("empresa_id",t);a.id?o=o.eq("id",a.id):a.user_id?o=o.eq("user_id",a.user_id):o=o.eq("email",a.email);const{error:i}=await o;if(i)throw i}async function gs({usuario:t}){const a=String((t==null?void 0:t.email)||"").trim().toLowerCase();if(!a||!a.includes("@"))throw new Error("Este usuário não possui e-mail válido para envio de acesso.");const o=`${window.location.origin}/reset-password`,{data:i,error:n}=await I.functions.invoke("convidar-usuario",{body:{email:a,nome:t.nome||"",redirectTo:o}});if(!n)return{tipo:"convite",mensagem:(i==null?void 0:i.message)||"Convite enviado para o e-mail do usuário."};const{error:l}=await I.auth.resetPasswordForEmail(a,{redirectTo:o});if(l)throw l;return{tipo:"reset",mensagem:"Envio solicitado. Se este e-mail já existir no Auth, o usuário receberá o link para criar/redefinir a senha."}}async function bs({userId:t,email:a,nome:o}){const i=String(o||"").trim(),n=String(a||"").trim().toLowerCase();if(!t)throw new Error("Usuário não identificado.");if(i.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");const l=[],{error:d}=await I.from("profiles").upsert({id:t,name:i},{onConflict:"id"});d&&l.push(d);const{error:m}=await I.from("df_usuarios_empresas").update({nome:i}).eq("user_id",t);if(m&&l.push(m),n){const{error:u}=await I.from("df_usuarios_empresas").update({nome:i}).eq("email",n);u&&l.push(u)}if(l.length>0)throw l[0];return{nome:i}}async function vs(t){if(!t)return[];const{data:a,error:o}=await I.from("df_usuarios_filiais").select("id, empresa_id, usuario_id, filial_id, created_at").eq("empresa_id",t);if(o)throw o;return a||[]}async function js({empresaId:t,usuario:a,filialIds:o}){if(!t)throw new Error("Empresa não identificada.");if(!(a!=null&&a.id))throw new Error("Usuário da empresa não identificado.");const i=Array.from(new Set((o||[]).filter(Boolean))),{error:n}=await I.from("df_usuarios_filiais").delete().eq("empresa_id",t).eq("usuario_id",a.id);if(n)throw n;if(i.length===0)return[];const l=i.map(u=>({empresa_id:t,usuario_id:a.id,filial_id:u})),{data:d,error:m}=await I.from("df_usuarios_filiais").insert(l).select("id, empresa_id, usuario_id, filial_id, created_at");if(m)throw m;return d||[]}function jt(t){return t?String(t).charAt(0).toUpperCase()+String(t).slice(1):""}function lt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function St(t){return t?new Date(String(t).slice(0,10)+"T00:00:00").toLocaleDateString("pt-BR"):"-"}function ao(t){if(!t)return null;const a=String(t).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(/^\d{2}\/\d{2}\/\d{4}$/.test(a)){const[o,i,n]=a.split("/");return`${n}-${i}-${o}`}return a.slice(0,10)}function To(t){if(!t)return"";const a=String(t);if(a.includes("-"))return a.slice(0,10);const o=a.replace(/\D/g,"").slice(0,8);return o.length<=2?o:o.length<=4?`${o.slice(0,2)}/${o.slice(2)}`:`${o.slice(0,2)}/${o.slice(2,4)}/${o.slice(4,8)}`}function Ci(t){const a=String(t||"").trim();if(!a)return 0;const o=a.replace(/[^\d,.-]/g,""),n=o.includes(",")?o.replace(/\./g,"").replace(",","."):o.replace(/,/g,""),l=Number(n);return Number.isFinite(l)?l:0}function re(t){return lt(t)}function oo(t){return St(t)}const ys=";";function Ni(t,a){if(!(a instanceof Blob))throw new Error("Arquivo de exportação inválido.");const o=URL.createObjectURL(a),i=document.createElement("a");i.href=o,i.download=t,i.rel="noopener",document.body.appendChild(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(o),1200)}function ws(t,a){const o=Array.isArray(a)?a:[],i=[t,...o].map(n=>n.map(Cs).join(ys)).join(`\r
`);return new Blob([`\uFEFF${i}`],{type:"text/csv;charset=utf-8"})}function ks({filename:t,headers:a,rows:o}){Ni(t,ws(a,o))}function Cs(t){return`"${String(t??"").replace(/\r|\n/g," ").replace(/"/g,'""')}"`}function Ns(t,a){if(!t||typeof t!="string"){a==null||a(new Error("Conteúdo de impressão vazio."));return}const o=document.createElement("iframe");o.title="Relatório para impressão",o.style.position="fixed",o.style.left="-10000px",o.style.top="0",o.style.width="794px",o.style.height="1123px",o.style.border="0",o.style.background="#ffffff",o.style.opacity="0.01",o.setAttribute("aria-hidden","true");let i=!1,n,l;const d=()=>{window.clearTimeout(n),window.clearTimeout(l),l=window.setTimeout(()=>o.remove(),3e3)},m=()=>{if(!i){i=!0;try{const N=o.contentWindow;if(!N)throw new Error("Janela de impressão indisponível.");N.focus(),N.print(),d()}catch(N){d(),a==null||a(N)}}},u=async(N=0)=>{var h,$,C;if(i)return;const v=o.contentDocument;if(!!!(($=(h=v==null?void 0:v.body)==null?void 0:h.innerText)!=null&&$.trim())){if(N<12){n=window.setTimeout(()=>u(N+1),250);return}d(),a==null||a(new Error("Documento de impressão não foi renderizado."));return}try{(C=v.fonts)!=null&&C.ready&&await v.fonts.ready;const k=Array.from(v.images||[]);await Promise.all(k.map(U=>U.complete?Promise.resolve():new Promise(ae=>{U.onload=ae,U.onerror=ae}))),window.requestAnimationFrame(()=>{window.setTimeout(m,350)})}catch(k){if(N<12){n=window.setTimeout(()=>u(N+1),250);return}d(),a==null||a(k)}};o.onload=()=>u(),document.body.appendChild(o);const b=o.contentDocument;if(!b){d(),a==null||a(new Error("Documento de impressão indisponível."));return}b.open(),b.write(t),b.close(),n=window.setTimeout(()=>u(),500)}function Ss(t){const a=(Array.isArray(t)?t:[]).map(u=>({name:Ps(u.name),rows:Array.isArray(u.rows)?u.rows:[]}));a.length===0&&a.push({name:"Relatório",rows:[["Sem dados para exportar"]]});const o=xa(`
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${a.map((u,b)=>`<sheet name="${Si(u.name)}" sheetId="${b+1}" r:id="rId${b+1}"/>`).join("")}
  </sheets>
</workbook>`),i=xa(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${a.map((u,b)=>`<Relationship Id="rId${b+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${b+1}.xml"/>`).join("")}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),n=xa(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),l=xa(`
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${a.map((u,b)=>`<Override PartName="/xl/worksheets/sheet${b+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`),d=xa(`
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs>
</styleSheet>`),m=[{path:"[Content_Types].xml",content:l},{path:"_rels/.rels",content:n},{path:"xl/workbook.xml",content:o},{path:"xl/_rels/workbook.xml.rels",content:i},{path:"xl/styles.xml",content:d},...a.map((u,b)=>({path:`xl/worksheets/sheet${b+1}.xml`,content:_s(u.rows)}))];return new Blob([Rs(m)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}function _s(t){const a=t.reduce((n,l)=>Math.max(n,(l==null?void 0:l.length)||0),0),o=Array.from({length:a},(n,l)=>{const d=Math.min(Math.max(...t.map(m=>String((m==null?void 0:m[l])??"").length),10)+2,38);return`<col min="${l+1}" max="${l+1}" width="${d}" customWidth="1"/>`}).join(""),i=t.map((n,l)=>{const d=(n||[]).map((m,u)=>Es(m,u,l)).join("");return`<row r="${l+1}">${d}</row>`}).join("");return xa(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${o}</cols>
  <sheetData>${i}</sheetData>
</worksheet>`)}function Es(t,a,o){const i=`${zs(a)}${o+1}`,n=o===0,l=typeof t=="number"&&Number.isFinite(t),d=n?l?3:1:l?2:0;return l?`<c r="${i}" s="${d}"><v>${t}</v></c>`:`<c r="${i}" t="inlineStr" s="${d}"><is><t>${Si(t)}</t></is></c>`}function zs(t){let a="",o=t+1;for(;o>0;){const i=(o-1)%26;a=String.fromCharCode(65+i)+a,o=Math.floor((o-i)/26)}return a}function Ps(t){return String(t||"Planilha").replace(/[\\/?*\[\]:]/g," ").slice(0,31)||"Planilha"}function Si(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}function xa(t){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${t}`}function Rs(t){const a=new TextEncoder,o=[],i=[];let n=0;t.forEach(u=>{const b=a.encode(u.path),N=a.encode(u.content),v=Fs(N),y=new Uint8Array(30+b.length),h=new DataView(y.buffer);h.setUint32(0,67324752,!0),h.setUint16(4,20,!0),h.setUint16(6,0,!0),h.setUint16(8,0,!0),h.setUint16(10,0,!0),h.setUint16(12,0,!0),h.setUint32(14,v,!0),h.setUint32(18,N.length,!0),h.setUint32(22,N.length,!0),h.setUint16(26,b.length,!0),h.setUint16(28,0,!0),y.set(b,30),o.push(y,N);const $=new Uint8Array(46+b.length),C=new DataView($.buffer);C.setUint32(0,33639248,!0),C.setUint16(4,20,!0),C.setUint16(6,20,!0),C.setUint16(8,0,!0),C.setUint16(10,0,!0),C.setUint16(12,0,!0),C.setUint16(14,0,!0),C.setUint32(16,v,!0),C.setUint32(20,N.length,!0),C.setUint32(24,N.length,!0),C.setUint16(28,b.length,!0),C.setUint16(30,0,!0),C.setUint16(32,0,!0),C.setUint16(34,0,!0),C.setUint16(36,0,!0),C.setUint32(38,0,!0),C.setUint32(42,n,!0),$.set(b,46),i.push($),n+=y.length+N.length});const l=n;i.forEach(u=>{o.push(u),n+=u.length});const d=new Uint8Array(22),m=new DataView(d.buffer);return m.setUint32(0,101010256,!0),m.setUint16(8,t.length,!0),m.setUint16(10,t.length,!0),m.setUint32(12,n-l,!0),m.setUint32(16,l,!0),o.push(d),new Blob(o)}function Fs(t){let a=-1;for(let o=0;o<t.length;o+=1)a=a>>>8^$s[(a^t[o])&255];return(a^-1)>>>0}const $s=(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let i=0;i<8;i+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Ht(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Bt(t){return`${Number(t||0).toFixed(1)}%`}function Ms(t){return t>=84?"saudável":t>=68?"em atenção":"crítico"}function Ts({total:t=0,pago:a=0,pendente:o=0,vencido:i=0,taxaPago:n=0,taxaVencido:l=0,score:d=0,centroCritico:m=null,total7Dias:u=0,tendenciaMensal:b=[]}={}){if(!t)return{parecer:"A base atual ainda não possui volume financeiro suficiente para uma leitura narrativa confiável. O próximo passo é ampliar o recorte de dados antes de decisões executivas.",liquidez:"Sem volume suficiente para medir liquidez operacional.",concentracao:"Sem centro de custo dominante identificado.",curtoPrazo:"Sem pressão de curto prazo detectada no recorte atual.",comportamento:"Histórico insuficiente para leitura comportamental.",anomalias:["Base financeira insuficiente para detectar anomalias."],drivers:["Ampliar base de contas e centros classificados."]};const N=Ms(d),v=b||[],y=v[v.length-1],h=v[v.length-2],$=y&&h&&h.total?(y.total-h.total)/h.total*100:null,C=i>0?`O cenário financeiro está ${N}, com ${Ht(i)} vencido representando ${Bt(l)} do recorte. A prioridade executiva deve ser preservar liquidez antes de novas despesas, renegociando obrigações vencidas e protegendo o caixa semanal.`:`O cenário financeiro está ${N}, sem vencidos relevantes no recorte. A recomendação é manter disciplina de baixa, revisar centros de maior peso e preservar previsibilidade para os próximos ciclos.`,k=n<35?`A liquidez operacional está pressionada: somente ${Bt(n)} do volume analisado foi realizado. Isso indica dependência de baixas futuras para manter equilíbrio de caixa.`:n<70?`A liquidez exige acompanhamento: ${Bt(n)} do volume foi realizado, mas ainda existe margem relevante em aberto (${Ht(o)}).`:`A liquidez apresenta leitura positiva, com ${Bt(n)} já realizado e menor dependência de liquidações futuras.`,U=m?m.peso>=60?`Há concentração elevada no centro ${m.nome}, que representa ${m.peso}% do recorte. Esse centro deve ser auditado porque pode explicar a maior parte da pressão operacional.`:`O centro ${m.nome} lidera o recorte com ${m.peso}% de participação. A concentração existe, mas ainda permite gestão distribuída.`:"Não há concentração relevante por centro de custo no recorte atual.",ae=u>0?`O curto prazo exige reserva de caixa de ${Ht(u)} para os próximos 7 dias. Esse valor deve ser protegido antes de compromissos não essenciais.`:"Não há vencimentos relevantes nos próximos 7 dias, criando espaço para revisão e planejamento financeiro.",H=$===null?"Ainda não há base anterior suficiente para concluir tendência comportamental entre meses.":$>15?`O volume analisado cresceu ${Bt($)} frente ao mês anterior, sugerindo expansão de compromissos ou concentração de lançamentos.`:$<-15?`O volume analisado caiu ${Bt(Math.abs($))} frente ao mês anterior, indicando alívio operacional ou redução de lançamentos no recorte.`:`O comportamento mensal está relativamente estável, com variação de ${Bt($)} frente ao mês anterior.`,q=[];l>=40&&q.push(`Vencidos acima de 40% do recorte (${Bt(l)}), sinalizando risco operacional elevado.`),n<20&&q.push(`Realização abaixo de 20% (${Bt(n)}), indicando baixa conversão em pagamento/baixa.`),(m==null?void 0:m.peso)>=60&&q.push(`Concentração extrema no centro ${m.nome} (${m.peso}%).`),u>a&&u>0&&q.push(`Vencimentos de 7 dias (${Ht(u)}) superam o realizado atual (${Ht(a)}).`),q.length||q.push("Nenhuma anomalia crítica detectada no recorte atual.");const ne=[i>0?`Reduzir vencidos de ${Ht(i)} para aliviar o score.`:"Preservar cenário sem vencidos críticos.",m?`Revisar o centro ${m.nome}, principal driver do recorte.`:"Classificar centros para melhorar rastreabilidade.",u>0?`Proteger ${Ht(u)} no caixa semanal.`:"Usar a folga de curto prazo para planejamento.",o>0?`Acelerar baixa/renegociação de ${Ht(o)} em aberto.`:"Manter ritmo de realização."];return{parecer:C,liquidez:k,concentracao:U,curtoPrazo:ae,comportamento:H,anomalias:q,drivers:ne}}function ra(t){return Number((t==null?void 0:t.valor)||0)}function Vo(t,a){if(!t||a==="pago")return!1;const o=new Date;o.setHours(0,0,0,0);const i=new Date(`${t}T00:00:00`);return i.setHours(0,0,0,0),i<o}function Ds(t){if(!t)return 999;const a=new Date;a.setHours(0,0,0,0);const o=new Date(`${t}T00:00:00`);return o.setHours(0,0,0,0),Math.ceil((o-a)/(1e3*60*60*24))}function dt(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Do(t){return`${Number(t||0).toFixed(1)}%`}function Is(t){var a;return((a=t==null?void 0:t.df_centros_custo)==null?void 0:a.nome)||(t==null?void 0:t.centro_custo_nome)||(t==null?void 0:t.centro)||"Sem centro"}function As(t){return String((t==null?void 0:t.data_vencimento)||(t==null?void 0:t.created_at)||"").slice(0,7)||"Sem mês"}function Bs(t=[]){const a=new Map;return t.forEach(o=>{const i=Is(o),n=a.get(i)||{nome:i,total:0,pago:0,pendente:0,vencido:0,quantidade:0},l=ra(o);n.total+=l,n.quantidade+=1,o.status==="pago"?n.pago+=l:n.pendente+=l,Vo(o.data_vencimento,o.status)&&(n.vencido+=l),a.set(i,n)}),Array.from(a.values()).map(o=>({...o,risco:o.total?Math.round(o.vencido/o.total*100):0,peso:0})).sort((o,i)=>i.total-o.total)}function qs(t=[]){const a=new Map;return t.forEach(o=>{const i=As(o),n=a.get(i)||{mes:i,total:0,pago:0,pendente:0,vencido:0},l=ra(o);n.total+=l,o.status==="pago"?n.pago+=l:n.pendente+=l,Vo(o.data_vencimento,o.status)&&(n.vencido+=l),a.set(i,n)}),Array.from(a.values()).sort((o,i)=>o.mes.localeCompare(i.mes)).slice(-6)}function Ls({total:t,pendente:a,vencido:o,taxaVencido:i,contasVencidas:n,contasPendentes:l}){if(!t)return 82;let d=100;return d-=Math.min(42,i*1.1),d-=Math.min(22,a/t*18),d-=Math.min(16,n.length*4),d-=Math.min(10,l.length*.8),Math.max(0,Math.min(100,Math.round(d)))}function Us(t){return t>=84?{label:"Saudável",tone:"success"}:t>=68?{label:"Atenção",tone:"warning"}:{label:"Crítico",tone:"danger"}}function Os({total:t,pago:a,pendente:o,vencido:i,taxaPago:n,taxaVencido:l,score:d,status:m,centroCritico:u,vencemEm7Dias:b}){if(!t)return"Ainda não há volume financeiro suficiente para emitir um parecer executivo completo. Recomenda-se cadastrar contas ou ampliar o recorte de filtros antes da análise.";const N=`O recorte atual soma ${dt(t)}, com ${dt(a)} realizado e ${dt(o)} ainda em aberto.`,v=i>0?`O principal ponto de atenção é o vencido de ${dt(i)}, equivalente a ${Do(l)} do volume analisado.`:"Não há vencido crítico identificado no recorte atual.",y=n>=70?`A eficiência de realização está positiva, com ${Do(n)} já liquidado.`:`A eficiência de realização está pressionada, com apenas ${Do(n)} liquidado.`,h=u?`O centro de maior peso é ${u.nome}, concentrando ${dt(u.total)}.`:"Não há concentração relevante por centro de custo.",$=b.length?`${b.length} obrigação(ões) vencem nos próximos 7 dias e devem entrar na rotina de caixa semanal.`:"Não há concentração expressiva de vencimentos nos próximos 7 dias.";return`${N} ${v} ${y} ${h} ${$} O score financeiro está em ${d}/100, classificado como ${m.label.toLowerCase()}.`}function _i({contas:t=[],contasFiltradas:a=[]}={}){const o=a.length?a:t,i=o.reduce((M,X)=>M+ra(X),0),n=o.filter(M=>M.status==="pago"),l=o.filter(M=>M.status!=="pago"),d=o.filter(M=>Vo(M.data_vencimento,M.status)),m=n.reduce((M,X)=>M+ra(X),0),u=l.reduce((M,X)=>M+ra(X),0),b=d.reduce((M,X)=>M+ra(X),0),N=i?m/i*100:0,v=i?b/i*100:0,y=Bs(o).map(M=>({...M,peso:i?Math.round(M.total/i*100):0})),h=y[0]||null,$=qs(o),C=l.filter(M=>{const X=Ds(M.data_vencimento);return X>=0&&X<=7}),k=C.reduce((M,X)=>M+ra(X),0),U=Ls({total:i,pendente:u,vencido:b,taxaVencido:v,contasVencidas:d,contasPendentes:l}),ae=Us(U),H=[];b>0&&H.push({level:"Alta",title:"Regularizar contas vencidas",description:`${d.length} conta(s) em atraso somando ${dt(b)}.`,action:"Abrir Financeiro > Contas",impact:dt(b),tone:"danger"}),C.length&&H.push({level:"Alta",title:"Antecipar vencimentos próximos",description:`${C.length} obrigação(ões) vencem nos próximos 7 dias.`,action:"Priorizar caixa semanal",impact:dt(k),tone:"warning"}),h&&i&&h.total/i>=.35&&H.push({level:"Média",title:`Revisar centro ${h.nome}`,description:`Este centro concentra ${h.peso}% do valor analisado.`,action:"Abrir Relatórios",impact:dt(h.total),tone:"info"}),H.length||H.push({level:"Baixa",title:"Manter rotina de acompanhamento",description:"Nenhum risco operacional crítico foi identificado no recorte atual.",action:"Revisão semanal",impact:"Controle",tone:"success"});const q=Os({total:i,pago:m,pendente:u,vencido:b,taxaPago:N,taxaVencido:v,score:U,status:ae,centroCritico:h,vencemEm7Dias:C}),ne=Ts({total:i,pago:m,pendente:u,vencido:b,taxaPago:N,taxaVencido:v,score:U,centroCritico:h,total7Dias:k,tendenciaMensal:$}),G=[b>0?`Priorizar a quitação ou renegociação dos vencidos (${dt(b)}) antes de novas despesas.`:"Manter rotina semanal de conferência para preservar o cenário sem vencidos críticos.",k>0?`Reservar ${dt(k)} para vencimentos dos próximos 7 dias.`:"Usar a folga dos próximos 7 dias para revisar centros de maior peso.",h?`Auditar lançamentos do centro ${h.nome}, que representa ${h.peso}% do recorte.`:"Classificar centros de custo para melhorar a qualidade analítica.",N<50?"Acelerar cobrança/baixa de pendências para elevar a eficiência de realização.":"Preservar o ritmo de baixas e acompanhar desvios por centro."],Z={"Qual meu maior risco agora?":b>0?`O maior risco agora é o saldo vencido de ${dt(b)}, distribuído em ${d.length} conta(s). A ação recomendada é regularizar ou renegociar antes de assumir novas obrigações.`:`O risco imediato está controlado. O próximo foco deve ser o caixa de curto prazo, com ${dt(k)} vencendo em até 7 dias.`,"Onde estou gastando mais?":h?`O maior peso financeiro está em ${h.nome}, com ${dt(h.total)} (${h.peso}% do recorte). Vale revisar recorrências, fornecedores e lançamentos desse centro.`:"Ainda não há centro de custo dominante no recorte atual.","Como melhorar meu caixa?":`Priorize três movimentos: reduzir vencidos (${dt(b)}), reservar caixa para 7 dias (${dt(k)}) e revisar o centro de maior peso${h?` (${h.nome})`:""}.`,"Gerar resumo executivo":q},A=[ne.liquidez,ne.concentracao,ne.curtoPrazo,ne.comportamento];return{score:U,status:ae,executiveSummary:q,narrativa:ne,totals:{total:i,pago:m,pendente:u,vencido:b,taxaPago:N,taxaVencido:v,total7Dias:k},priorities:H.slice(0,4),insights:A,recomendacoes:G,rankingCentros:y.slice(0,5),tendenciaMensal:$,respostas:Z,quickQuestions:Object.keys(Z)}}function Vs({voltar:t,empresaId:a,mostrarAviso:o}){var nt,xt,Lt,Ut,Dt,It,_t,yt,At,pt,Oe,Je;function i(s){return`${Number(s||0).toFixed(1)}%`}function n(s,j){if(!s||j==="pago")return!1;const L=new Date;L.setHours(0,0,0,0);const le=new Date(s+"T00:00:00");return le.setHours(0,0,0,0),le<L}function l(s){return s?String(s).slice(0,7):""}function d(){const s=new Date;return`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}`}function m(s){if(!s)return"";const[j,L]=s.split("-").map(Number),le=new Date(j,L-2,1);return`${le.getFullYear()}-${String(le.getMonth()+1).padStart(2,"0")}`}function u(s){if(!s)return"Todos";const[j,L]=s.split("-").map(Number);return new Date(j,L-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}function b(s){return s>=50?"#dc3545":s>=20?"#f59f00":"#12b886"}function N(s){return s==="critico"?"🚨":s==="risco"?"⚠️":s==="queda"?"✅":s==="alta"?"📈":s==="acao"?"🎯":s==="previsao"?"🔮":s==="meta"?"🎯":"ℹ️"}const[v,y]=c.useState([]),[h,$]=c.useState([]),[C,k]=c.useState([]),[U,ae]=c.useState(!0),[H,q]=c.useState(d()),[ne,G]=c.useState("todas"),[Z,A]=c.useState(""),[M,X]=c.useState(""),[he,ce]=c.useState("dre"),[ye,_e]=c.useState("");c.useEffect(()=>{se()},[a]);async function se(){if(!a){y([]),$([]),k([]),ae(!1);return}ae(!0);const{data:s,error:j}=await I.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",a).order("data_vencimento",{ascending:!0}),{data:L,error:le}=await I.from("df_centros_custo").select("*").eq("empresa_id",a).order("nome",{ascending:!0}),{data:be,error:xe}=await I.from("df_filiais").select("*").eq("empresa_id",a).order("nome",{ascending:!0});j&&(o==null||o(j.message,"erro")),le&&(o==null||o(le.message,"erro")),xe&&(o==null||o(xe.message,"erro")),y((s||[]).filter(ge=>!ge.excluido_em&&!ge.deleted_at)),$(L||[]),k(be||[]),ae(!1)}const w=c.useMemo(()=>v.filter(s=>ne==="pendentes"?s.status!=="pago":ne==="pagas"?s.status==="pago":ne==="vencidas"?n(s.data_vencimento,s.status):!0).filter(s=>H?l(s.data_vencimento)===H:!0).filter(s=>Z?s.centro_custo_id===Z:!0).filter(s=>M?s.filial_id===M:!0),[v,H,ne,Z,M]),pe=c.useMemo(()=>{const s=m(H||d());return v.filter(j=>l(j.data_vencimento)===s).filter(j=>Z?j.centro_custo_id===Z:!0).filter(j=>M?j.filial_id===M:!0)},[v,H,Z,M]),T=w.reduce((s,j)=>s+Number(j.valor||0),0),ie=w.filter(s=>s.status==="pago").reduce((s,j)=>s+Number(j.valor||0),0),K=w.filter(s=>n(s.data_vencimento,s.status)).reduce((s,j)=>s+Number(j.valor||0),0),J=T-ie,S=pe.reduce((s,j)=>s+Number(j.valor||0),0),te=T-S,De=S?te/S*100:0,ze=S?Math.max(T+te,0):T,ke=Number(String(ye||"").replace(",",".")),V=!isNaN(ke)&&ke>0,ue=V?T/ke*100:0,qe=T?ie/T*100:0,B=T?K/T*100:0,W=w.reduce((s,j)=>{const L=j.centro_custo_id||"sem-centro";return s[L]||(s[L]=[]),s[L].push(j),s},{}),Ee=Object.keys(W).map(s=>{const j=W[s],L=h.find(ge=>ge.id===s),le=j.reduce((ge,we)=>ge+Number(we.valor||0),0),be=j.filter(ge=>ge.status==="pago").reduce((ge,we)=>ge+Number(we.valor||0),0),xe=j.filter(ge=>n(ge.data_vencimento,ge.status)).reduce((ge,we)=>ge+Number(we.valor||0),0);return{id:s,nome:(L==null?void 0:L.nome)||"Sem centro",total:le,pago:be,pendente:le-be,vencido:xe,percentual:T?le/T*100:0}}).sort((s,j)=>j.total-s.total),fe=Ee[0]||null,P=((nt=Ee[0])==null?void 0:nt.total)||0,ee=h.find(s=>s.id===Z),Qe=w.filter(s=>s.centro_custo_id).length,Re=w.filter(s=>!s.centro_custo_id).length,Le=w.length?Qe/w.length*100:0,Tt=Ee.find(s=>s.id==="sem-centro"),et=!!(Tt&&Tt.total>0),ct=[...w].sort((s,j)=>Number(j.valor||0)-Number(s.valor||0)).slice(0,5);let Ue=100;K>0&&(Ue-=30),(fe==null?void 0:fe.percentual)>=60&&(Ue-=20),Le<40&&w.length>0&&(Ue-=25),te>0&&De>=20&&(Ue-=15),V&&ue>100&&(Ue-=25),J>ie&&T>0&&(Ue-=10),Ue=Math.max(Ue,0);let mt={titulo:"Saúde financeira boa",etiqueta:"Saudável",emoji:"✅",cor:"#12b886",descricao:"Os indicadores estão equilibrados para o filtro atual."};Ue<75&&Ue>=45&&(mt={titulo:"Saúde financeira em atenção",etiqueta:"Atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Existem pontos que merecem acompanhamento: concentração, variação mensal, meta e classificação."}),Ue<45&&(mt={titulo:"Saúde financeira crítica",etiqueta:"Crítico",emoji:"🚨",cor:"#dc3545",descricao:"Há sinais relevantes de risco. Priorize vencidos, metas estouradas, concentração e contas sem centro."});let Ct={titulo:"Qualidade dos dados boa",emoji:"✅",cor:"#12b886",descricao:"A maioria das contas está classificada por centro de custo."};Le<80&&Le>=40&&(Ct={titulo:"Qualidade dos dados em atenção",emoji:"⚠️",cor:"#f59f00",descricao:"Parte das contas ainda está sem centro. A análise pode ficar parcialmente limitada."}),Le<40&&w.length>0&&(Ct={titulo:"Qualidade dos dados crítica",emoji:"🚨",cor:"#dc3545",descricao:"Grande parte das contas está sem centro. Classifique as despesas para liberar análises confiáveis."});const tt=[];if(Le<40&&w.length>0&&tt.push({tipo:"critico",texto:"A análise gerencial está limitada porque a maior parte das despesas está sem centro de custo. Classifique os lançamentos antes de tomar decisões estratégicas."}),V&&(ue>100?tt.push({tipo:"meta",texto:`Meta mensal estourada: o total filtrado atingiu ${i(ue)} da meta de ${re(ke)}.`}):ue>=80?tt.push({tipo:"meta",texto:`Atenção à meta: você já consumiu ${i(ue)} da meta mensal.`}):tt.push({tipo:"meta",texto:`Meta sob controle: consumo atual em ${i(ue)} da meta mensal.`})),K>0){const s=w.filter(j=>n(j.data_vencimento,j.status)).length;tt.push({tipo:"risco",texto:`Contas vencidas detectadas: ${s} conta(s), somando ${re(K)}. Priorize pagamento para evitar juros.`})}!Z&&(fe==null?void 0:fe.percentual)>=60&&fe.id!=="sem-centro"&&tt.push({tipo:"risco",texto:`Alto risco de concentração: ${fe.nome} representa ${i(fe.percentual)} dos custos filtrados.`}),H&&T>0&&(S===0?tt.push({tipo:"previsao",texto:`${u(H)} tem ${re(T)} em contas. Ainda não há base anterior suficiente para tendência.`}):te>0?tt.push({tipo:"alta",texto:`Crescimento de ${re(te)} frente a ${u(m(H))}, variação de ${i(De)}.`}):te<0&&tt.push({tipo:"queda",texto:`Redução de ${re(Math.abs(te))} frente ao mês anterior, queda de ${i(Math.abs(De))}.`}),tt.push({tipo:"previsao",texto:`Se o padrão continuar, o próximo mês pode fechar próximo de ${re(ze)}.`})),tt.length===0&&tt.push({tipo:"info",texto:"Nenhum alerta relevante encontrado para os filtros selecionados."});const qt=c.useMemo(()=>{const s={};return v.forEach(j=>{if(Z&&j.centro_custo_id!==Z||M&&j.filial_id!==M)return;const L=l(j.data_vencimento);if(!L)return;s[L]||(s[L]={mes:L,total:0,pago:0,pendente:0,vencido:0});const le=Number(j.valor||0);s[L].total+=le,j.status==="pago"?s[L].pago+=le:s[L].pendente+=le,n(j.data_vencimento,j.status)&&(s[L].vencido+=le)}),Object.values(s).sort((j,L)=>j.mes.localeCompare(L.mes)).slice(-6)},[v,Z,M]),ft=c.useMemo(()=>{const s={};return w.forEach(j=>{var xe;const L=j.filial_id||"sem-filial",le=((xe=j.df_filiais)==null?void 0:xe.nome)||"Sem filial";s[L]||(s[L]={id:L,nome:le,total:0,pago:0,pendente:0,vencido:0,qtd:0});const be=Number(j.valor||0);s[L].total+=be,s[L].qtd+=1,j.status==="pago"?s[L].pago+=be:s[L].pendente+=be,n(j.data_vencimento,j.status)&&(s[L].vencido+=be)}),Object.values(s).map(j=>({...j,percentual:T?j.total/T*100:0})).sort((j,L)=>L.total-j.total)},[w,T]),Xt=c.useMemo(()=>{const s=ie,j=J,L=K,le=ze,be=T?Math.max(0,100-B):100;return[{linha:"Realizado",valor:s,descricao:"Contas pagas no filtro"},{linha:"A realizar",valor:j,descricao:"Pendências abertas"},{linha:"Risco vencido",valor:L,descricao:"Parte atrasada que exige ação"},{linha:"Previsão próximo mês",valor:le,descricao:"Tendência gerencial simples"},{linha:"Eficiência",valor:be,descricao:"Quanto menor o vencido, melhor",percentual:!0}]},[ie,J,K,ze,T,B]),Ce=c.useMemo(()=>[{name:"Pago",value:ie,color:"#12b886"},{name:"Pendente",value:Math.max(J-K,0),color:"#f59f00"},{name:"Vencido",value:K,color:"#dc3545"}].filter(s=>s.value>0),[ie,J,K]),Q=c.useMemo(()=>Ee.slice(0,6).map(s=>({nome:s.nome.length>14?`${s.nome.slice(0,14)}…`:s.nome,total:Number(s.total.toFixed(2))})),[Ee]),O=c.useMemo(()=>{const s=w.length?T/w.length:0,j=w.filter(Ae=>Ae.status!=="pago"),L=w.filter(Ae=>n(Ae.data_vencimento,Ae.status)),le=ct[0]||null,be=le&&T?Number(le.valor||0)/T*100:0,xe=ct.slice(0,3).reduce((Ae,zt)=>Ae+Number(zt.valor||0),0),ge=T?xe/T*100:0,de=w.filter(Ae=>{var zt;return(zt=Ae.df_contas_recorrentes)==null?void 0:zt.tipo_recorrencia}).reduce((Ae,zt)=>Ae+Number(zt.valor||0),0),Ie=T?de/T*100:0,at=(fe==null?void 0:fe.percentual)||0,ve=T?(J+K)/T*100:0,rt=w.filter(Ae=>s>0&&Number(Ae.valor||0)>=s*2.5).sort((Ae,zt)=>Number(zt.valor||0)-Number(Ae.valor||0)).slice(0,5);let Nt="baixo",Et="#12b886",ot="Inteligência financeira saudável";Ue<45||ve>=55||B>=25?(Nt="alto",Et="#dc3545",ot="Inteligência financeira em alerta"):(Ue<75||ve>=30||at>=50||Le<80)&&(Nt="medio",Et="#f59f00",ot="Inteligência financeira em atenção");const $e=[];L.length>0&&$e.push(`Priorizar ${L.length} conta(s) vencida(s), somando ${re(K)}.`),Le<80&&Re>0&&$e.push(`Classificar ${Re} conta(s) sem centro para aumentar a confiabilidade do motor.`),fe&&fe.id!=="sem-centro"&&at>=50&&$e.push(`Revisar concentração em ${fe.nome}, que representa ${i(at)} do filtro.`),V&&ue>=80&&$e.push(ue>100?"Revisar meta mensal: o limite foi ultrapassado.":"Acompanhar meta mensal: consumo acima de 80%."),rt.length>0&&$e.push(`Auditar ${rt.length} lançamento(s) acima de 2,5x o ticket médio.`),$e.length===0&&$e.push("Manter acompanhamento semanal dos indicadores e revisar centros de maior valor.");const ht=[{label:"Próximo mês",value:ze,sub:"projeção por tendência simples"},{label:"Risco em aberto",value:J+K,sub:`${i(ve)} do total filtrado`},{label:"Recorrente",value:de,sub:`${i(Ie)} do total`},{label:"Top 3 despesas",value:xe,sub:`${i(ge)} do total`}];return{titulo:ot,nivel:Nt,cor:Et,ticketMedio:s,riscoCaixa:ve,paretoTop3:xe,paretoTop3Percentual:ge,percentualRecorrente:Ie,maiorDespesa:le,maiorDespesaPercentual:be,anomalias:rt,acoes:$e,previsoes:ht,pendentesAbertas:j.length}},[w,T,J,K,B,Ue,fe,Le,Re,V,ue,ct,ze]),D=c.useMemo(()=>_i({contas:v,contasFiltradas:w}),[v,w]),me=c.useMemo(()=>{const s=qt.length?qt:[],j=s.map($e=>Number($e.total||0)),L=j.length?j.reduce(($e,ht)=>$e+ht,0)/j.length:T,le=j.length?j[j.length-1]:T,be=j.length>1?j[j.length-2]:le,xe=le-be,ge=T?Math.min((K+J)/T,1.5):0,we=Math.max(le+xe*.35,0),de=Math.max(we+xe*.55,0),Ie=Math.max(de+xe*.75,0),at=Math.min(100,Math.max(0,B+ge*35+((fe==null?void 0:fe.percentual)>=60?12:0)+(Le<80?10:0))),ve=at>=65?"Alto":at>=35?"Moderado":"Baixo",rt=at>=65?"#dc3545":at>=35?"#f59f00":"#12b886",Nt=xe>0?"alta":xe<0?"queda":"estável",Et=V?{meta:ke,atual:T,falta:Math.max(ke-T,0),projetado:we,chance:we<=ke?"Alta":we<=ke*1.15?"Média":"Baixa",percentualProjetado:ke?we/ke*100:0}:null,ot=[];return at>=65&&ot.push("Risco projetado alto para os próximos 30 dias. Priorize vencidos e reduza concentração."),Ie>Math.max(L,1)*1.25&&ot.push("Forecast 90 dias indica possível aceleração de despesas acima da média histórica."),Et&&Et.percentualProjetado>100&&ot.push("A previsão de 30 dias pode ultrapassar a meta mensal cadastrada."),Le<80&&w.length>0&&ot.push("A qualidade da previsão melhora após classificar contas sem centro de custo."),ot.length===0&&ot.push("Cenário projetado controlado para os filtros atuais."),{mediaMovel:L,variacao:xe,tendencia:Nt,previsao30:we,previsao60:de,previsao90:Ie,riscoProjetado:at,statusRisco:ve,corRisco:rt,metaForecast:Et,alertas:ot,serie:[...s.map($e=>({mes:$e.mes,realizado:$e.total,previsto:null})),{mes:"+30d",realizado:null,previsto:we},{mes:"+60d",realizado:null,previsto:de},{mes:"+90d",realizado:null,previsto:Ie}]}},[qt,T,K,J,B,fe,Le,V,ke,w.length]);function Fe(){return w.map(s=>{var j,L,le;return[s.descricao||"Sem descrição",Number(s.valor||0),oo(s.data_vencimento),n(s.data_vencimento,s.status)?"vencido":s.status,((j=s.df_centros_custo)==null?void 0:j.nome)||"Sem centro",((L=s.df_filiais)==null?void 0:L.nome)||"Sem filial",((le=s.df_contas_recorrentes)==null?void 0:le.tipo_recorrencia)||"Não recorrente"]})}function Ke(){var ge,we,de,Ie,at;const s=Xt.map(ve=>`
      <tr>
        <td>${He(ve.linha)}</td>
        <td class="valor">${ve.percentual?i(ve.valor):re(ve.valor)}</td>
        <td>${He(ve.descricao)}</td>
      </tr>
    `).join(""),j=Fe().map(ve=>`
      <tr>${ve.map((rt,Nt)=>`<td class="${Nt===1?"valor":""}">${Nt===1?re(rt):He(rt)}</td>`).join("")}</tr>
    `).join(""),L=Ee.map(ve=>`
      <tr>
        <td>${He(ve.nome)}</td>
        <td class="valor">${re(ve.total)}</td>
        <td class="valor">${re(ve.pago)}</td>
        <td class="valor">${re(ve.pendente)}</td>
        <td class="valor">${re(ve.vencido)}</td>
        <td class="valor">${i(ve.percentual)}</td>
      </tr>
    `).join(""),le=D.priorities.map(ve=>`
      <tr>
        <td>${He(ve.level)}</td>
        <td>${He(ve.title)}</td>
        <td>${He(ve.description)}</td>
        <td class="valor">${He(ve.impact)}</td>
        <td>${He(ve.action)}</td>
      </tr>
    `).join(""),be=D.recomendacoes.map((ve,rt)=>`
      <div class="insight"><strong>${rt+1}.</strong> ${He(ve)}</div>
    `).join(""),xe=`<!doctype html>
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
              Gerado em ${new Date().toLocaleString("pt-BR")} • ${He(u(H||d()))}<br />
              Centro: ${He(Z?(ee==null?void 0:ee.nome)||"Selecionado":"Todos")} • Filial: ${He(M?((ge=C.find(ve=>ve.id===M))==null?void 0:ge.nome)||"Selecionada":"Todas")} • Status: ${He(ne)}
            </div>
            <div class="score">Score Copilot: ${D.score}/100 • ${He(D.status.label)}</div>
          </div>
          <h2>Executive AI Summary</h2>
          <div class="insight">${He(D.executiveSummary)}</div>
          <h2>AI Narrative & Insights 11.8</h2>
          <div class="narrative"><strong>Parecer executivo contextual</strong>${He(((we=D.narrativa)==null?void 0:we.parecer)||D.executiveSummary)}</div>
          <div class="narrative"><strong>Liquidez</strong>${He(((de=D.narrativa)==null?void 0:de.liquidez)||"")}</div>
          <div class="narrative"><strong>Concentração</strong>${He(((Ie=D.narrativa)==null?void 0:Ie.concentracao)||"")}</div>
          <div class="narrative"><strong>Curto prazo</strong>${He(((at=D.narrativa)==null?void 0:at.curtoPrazo)||"")}</div>
          <div class="cards">
            <div class="card"><span class="label">Total</span><span class="numero">${re(T)}</span></div>
            <div class="card"><span class="label">Pago</span><span class="numero">${re(ie)}</span></div>
            <div class="card"><span class="label">Pendente</span><span class="numero">${re(J)}</span></div>
            <div class="card"><span class="label">Vencido</span><span class="numero">${re(K)}</span></div>
          </div>
          <h2>Smart Priority Engine</h2>
          <table><thead><tr><th>Nível</th><th>Prioridade</th><th>Leitura</th><th>Impacto</th><th>Ação</th></tr></thead><tbody>${le||'<tr><td colspan="5">Nenhuma prioridade crítica encontrada.</td></tr>'}</tbody></table>
          <h2>Recomendações acionáveis</h2>
          ${be}
          <h2>DRE Gerencial</h2>
          <table><thead><tr><th>Linha</th><th>Valor</th><th>Descrição</th></tr></thead><tbody>${s}</tbody></table>
          <h2>Insights executivos</h2>
          ${tt.map(ve=>`<div class="insight">${He(ve.texto)}</div>`).join("")}
          <h2>Ranking por centro</h2>
          <table><thead><tr><th>Centro</th><th>Total</th><th>Pago</th><th>Pendente</th><th>Vencido</th><th>Participação</th></tr></thead><tbody>${L||'<tr><td colspan="6">Nenhum centro encontrado.</td></tr>'}</tbody></table>
          <h2>Contas filtradas</h2>
          <table><thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Centro</th><th>Filial</th><th>Recorrência</th></tr></thead><tbody>${j||'<tr><td colspan="7">Nenhuma conta encontrada.</td></tr>'}</tbody></table>
          <div class="footer">Relatório gerado pelo Sistema Dona Flor Financeiro.</div>
        </body>
      </html>`;Ns(xe,()=>o==null?void 0:o("Não foi possível abrir a impressão do relatório.","erro"))}function Ye(){const s=["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],j=Fe().map(L=>[L[0],Number(L[1]||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}),L[2],L[3],L[4],L[5],L[6]]);ks({filename:"relatorio-financeiro-dona-flor.csv",headers:s,rows:j})}function Ve(){var j,L,le,be,xe,ge,we;const s=[{name:"Resumo",rows:[["Relatório Avançado 11.8 - AI Narrative & Insights"],["Gerado em",new Date().toLocaleString("pt-BR")],["Mês",H||"Todos"],["Centro",Z?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"],["Filial",M?((j=C.find(de=>de.id===M))==null?void 0:j.nome)||"Selecionada":"Todas"],[],["Indicador","Valor"],["Total",T],["Pago",ie],["Pendente",J],["Vencido",K],["Score Copilot IA",D.score],["Status Copilot IA",D.status.label],["Nível inteligência 11.3",O.nivel],["Risco caixa %",O.riscoCaixa],["Ticket médio",O.ticketMedio]]},{name:"DRE",rows:[["Linha","Valor","Descrição"],...Xt.map(de=>[de.linha,de.valor,de.descricao])]},{name:"Contas",rows:[["Descrição","Valor","Vencimento","Status","Centro","Filial","Recorrência"],...Fe()]},{name:"Ranking",rows:[["Centro","Total","Pago","Pendente","Vencido","Participação"],...Ee.map(de=>[de.nome,de.total,de.pago,de.pendente,de.vencido,`${i(de.percentual)}`])]},{name:"Inteligencia 11.3",rows:[["Indicador","Valor","Observação"],["Nível",O.nivel,O.titulo],["Ticket médio",O.ticketMedio,"Média por conta filtrada"],["Risco caixa %",O.riscoCaixa,"Pendente + vencido sobre total"],["Top 3 despesas",O.paretoTop3,`${i(O.paretoTop3Percentual)} do total`],["Recorrente %",O.percentualRecorrente,"Peso das contas recorrentes"],[],["Ações recomendadas"],...O.acoes.map((de,Ie)=>[Ie+1,de])]},{name:"Copilot IA 11.8",rows:[["Executive AI Summary"],[D.executiveSummary],[],["Score",D.score,D.status.label],[],["AI Narrative 11.8"],["Parecer contextual",((L=D.narrativa)==null?void 0:L.parecer)||""],["Liquidez",((le=D.narrativa)==null?void 0:le.liquidez)||""],["Concentração",((be=D.narrativa)==null?void 0:be.concentracao)||""],["Curto prazo",((xe=D.narrativa)==null?void 0:xe.curtoPrazo)||""],["Comportamento",((ge=D.narrativa)==null?void 0:ge.comportamento)||""],[],["Anomalias contextuais"],...(((we=D.narrativa)==null?void 0:we.anomalias)||[]).map((de,Ie)=>[Ie+1,de]),[],["Total",D.totals.total],["Pago",D.totals.pago],["Pendente",D.totals.pendente],["Vencido",D.totals.vencido],[],["Smart Priority Engine"],["Nível","Prioridade","Descrição","Impacto","Ação"],...D.priorities.map(de=>[de.level,de.title,de.description,de.impact,de.action]),[],["Recomendações acionáveis"],...D.recomendacoes.map((de,Ie)=>[Ie+1,de]),[],["Drill-down analytics"],["Centro","Total","Pendente","Vencido","Peso","Risco"],...D.rankingCentros.map(de=>[de.nome,de.total,de.pendente,de.vencido,`${de.peso}%`,`${de.risco}%`])]},{name:"Preditiva 11.4",rows:[["Indicador","Valor","Observação"],["Forecast 30 dias",me.previsao30,me.tendencia],["Forecast 60 dias",me.previsao60,"Projeção intermediária"],["Forecast 90 dias",me.previsao90,"Projeção estendida"],["Risco projetado %",me.riscoProjetado,me.statusRisco],["Média móvel",me.mediaMovel,"Histórico filtrado"],["Variação base",me.variacao,"Último mês vs anterior"],[],["Alertas preditivos"],...me.alertas.map((de,Ie)=>[Ie+1,de])]}];Ni("relatorio-avancado-dona-flor.xlsx",Ss(s))}function Xe(){q(""),G("todas"),A(""),X(""),_e("")}const Ge=Le<40?"A análise gerencial está limitada por falta de classificação em centros de custo.":K>0?"Existem pendências vencidas que devem ser priorizadas.":V&&ue>100?"A meta mensal foi ultrapassada no filtro atual.":te>0?"Os custos cresceram em relação ao mês anterior. Acompanhe os maiores centros.":"O cenário atual está controlado para os filtros selecionados.";return e.jsxs("div",{className:"relatorios-page",style:f.page,children:[e.jsx("style",{children:Hs}),e.jsx("style",{children:Ws}),e.jsxs("div",{className:"relatorio-print-header",children:[e.jsx("h1",{children:"Relatório Financeiro Gerencial"}),e.jsx("p",{children:"Empresa: Dona Flor"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]}),e.jsxs("p",{children:["Centro: ",Z?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"," • Filial: ",M?((xt=C.find(s=>s.id===M))==null?void 0:xt.nome)||"Selecionada":"Todas"," • Mês: ",H||"Todos"," • Status: ",ne]})]}),e.jsx("div",{className:"relatorio-print-footer",children:"Relatório gerado pelo Sistema Dona Flor Financeiro"}),e.jsxs("header",{className:"no-print",style:f.hero,children:[e.jsxs("div",{children:[e.jsxs("div",{style:f.actionsTop,children:[e.jsx("button",{style:f.btnVoltar,onClick:t,children:"← Voltar"}),e.jsx("button",{style:f.btnExcel,onClick:Ve,children:"Excel"}),e.jsx("button",{style:f.btnPDF,onClick:Ke,children:"PDF"}),e.jsx("button",{style:f.btnCSV,onClick:Ye,children:"CSV"})]}),e.jsx("h1",{style:f.titulo,children:"📊 Relatórios Gerenciais"}),e.jsx("p",{style:f.descricaoTela,children:"Fase 11.8: AI Narrative & Insights com parecer executivo contextual, anomalias e recomendações inteligentes."})]}),e.jsxs("div",{style:f.heroBadge,children:[e.jsx("span",{children:mt.emoji}),e.jsxs("strong",{children:[Ue,"/100"]}),e.jsx("small",{children:mt.etiqueta})]})]}),e.jsxs("section",{className:"no-print relatorio-sticky-filtros",style:f.filtrosBox,children:[e.jsxs("div",{style:f.filtroHeader,children:[e.jsx("strong",{children:"🎛️ Filtros"}),e.jsxs("span",{style:f.filtroResumo,children:[u(H||d())," • ",Z?(ee==null?void 0:ee.nome)||"Centro selecionado":"Todos os centros"," • ",M?((Lt=C.find(s=>s.id===M))==null?void 0:Lt.nome)||"Filial selecionada":"Todas as filiais"]}),e.jsx("button",{style:f.btnLimpar,onClick:Xe,children:"Limpar"})]}),e.jsxs("div",{style:f.filtrosGrid,children:[e.jsx("input",{style:f.input,placeholder:"Meta mensal. Ex: 5000",value:ye,onChange:s=>_e(s.target.value)}),e.jsxs("select",{style:f.input,value:Z,onChange:s=>A(s.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),h.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:f.input,value:M,onChange:s=>X(s.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),C.map(s=>e.jsx("option",{value:s.id,children:s.nome},s.id))]}),e.jsxs("select",{style:f.input,value:he,onChange:s=>ce(s.target.value),children:[e.jsx("option",{value:"dre",children:"Visão DRE"}),e.jsx("option",{value:"graficos",children:"Visão Gráficos"}),e.jsx("option",{value:"filiais",children:"Visão Filiais"}),e.jsx("option",{value:"inteligencia",children:"Inteligência 11.3"}),e.jsx("option",{value:"preditiva",children:"Preditiva 11.4"}),e.jsx("option",{value:"copilot",children:"Copilot IA 11.8"})]}),e.jsx("input",{style:f.input,type:"month",value:H,onChange:s=>q(s.target.value)})]}),e.jsx("div",{style:f.filtros,children:[["todas","Todas"],["pendentes","Pendentes"],["pagas","Pagas"],["vencidas","Vencidas"]].map(([s,j])=>e.jsx("button",{style:ne===s?f.filtroAtivo:f.filtro,onClick:()=>G(s),children:j},s))})]}),U?e.jsx(Gs,{}):e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:f.kpiGrid,children:[e.jsx(ro,{titulo:"Total",valor:re(T),detalhe:`${w.length} conta(s)`,emoji:"💼",cor:"#364fc7",progresso:100}),e.jsx(ro,{titulo:"Pago",valor:re(ie),detalhe:`${i(qe)} do total`,emoji:"✅",cor:"#12b886",progresso:qe}),e.jsx(ro,{titulo:"Pendente",valor:re(J),detalhe:T?`${i(J/T*100)} das despesas`:"Sem pendência",emoji:"🟡",cor:"#f59f00",progresso:T?J/T*100:0}),e.jsx(ro,{titulo:"Vencido",valor:re(K),detalhe:K>0?`${i(B)} em atraso`:"Sem vencidos",emoji:"🚨",cor:"#dc3545",progresso:B})]}),e.jsxs("section",{style:f.advancedPanel,children:[e.jsxs("div",{style:f.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"📈 Relatórios Avançados 11.1"}),e.jsx("p",{style:f.muted,children:"DRE gerencial, gráficos executivos, tendência, multiunidade, inteligência 11.3, preditiva 11.4 e AI Narrative 11.8."})]}),e.jsx("span",{style:f.badge,children:"Enterprise"})]}),he==="dre"&&e.jsxs("div",{style:f.advancedGrid,children:[e.jsx(Be,{titulo:"DRE gerencial",emoji:"🧮",children:Xt.map(s=>e.jsxs("div",{style:f.dreLinha,children:[e.jsxs("div",{style:f.dreTexto,children:[e.jsx("strong",{style:f.dreTitulo,children:s.linha}),e.jsx("small",{style:f.dreDescricao,children:s.descricao})]}),e.jsx("strong",{style:f.dreValor,children:s.percentual?i(s.valor):re(s.valor)})]},s.linha))}),e.jsx(Be,{titulo:"Tendência 6 meses",emoji:"📉",children:e.jsx("div",{style:f.chartBox,children:e.jsx(ha,{width:"100%",height:220,children:e.jsxs(oi,{data:qt,children:[e.jsx(io,{strokeDasharray:"3 3"}),e.jsx(no,{dataKey:"mes"}),e.jsx(so,{}),e.jsx(ga,{formatter:s=>re(s)}),e.jsx(to,{type:"monotone",dataKey:"total",stroke:"#0d9488",strokeWidth:3,dot:!1}),e.jsx(to,{type:"monotone",dataKey:"vencido",stroke:"#dc3545",strokeWidth:2,dot:!1})]})})})})]}),he==="graficos"&&e.jsxs("div",{style:f.advancedGrid,children:[e.jsx(Be,{titulo:"Centros por valor",emoji:"📊",children:e.jsx("div",{style:f.chartBox,children:e.jsx(ha,{width:"100%",height:240,children:e.jsxs(vi,{data:Q,children:[e.jsx(io,{strokeDasharray:"3 3"}),e.jsx(no,{dataKey:"nome"}),e.jsx(so,{}),e.jsx(ga,{formatter:s=>re(s)}),e.jsx(ji,{dataKey:"total",fill:"#0d9488",radius:[8,8,0,0]})]})})})}),e.jsx(Be,{titulo:"Status financeiro",emoji:"🧭",children:e.jsx("div",{style:f.chartBox,children:e.jsx(ha,{width:"100%",height:240,children:e.jsxs(yi,{children:[e.jsx(wi,{data:Ce,dataKey:"value",nameKey:"name",outerRadius:85,label:!0,children:Ce.map(s=>e.jsx(ki,{fill:s.color},s.name))}),e.jsx(ga,{formatter:s=>re(s)})]})})})})]}),he==="filiais"&&e.jsxs("div",{style:f.advancedGrid,children:[e.jsxs(Be,{titulo:"Ranking multiunidade",emoji:"🏢",children:[ft.length===0&&e.jsx("p",{style:f.vazio,children:"Nenhuma filial encontrada nos filtros."}),ft.map((s,j)=>e.jsxs("div",{style:f.dreLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[j+1,". ",s.nome]}),e.jsxs("small",{children:[s.qtd," conta(s) • ",i(s.percentual)]})]}),e.jsx("strong",{children:re(s.total)})]},s.id))]}),e.jsxs(Be,{titulo:"Insight executivo",emoji:"🧠",children:[e.jsx("p",{style:f.executivoTexto,children:ft[0]?`${ft[0].nome} concentra ${i(ft[0].percentual)} do total filtrado. Use esta leitura para comparar unidades e priorizar gestão.`:"Sem dados multiunidade para o filtro atual."}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsx(Te,{label:"Filiais",value:ft.length}),e.jsx(Te,{label:"Maior unidade",value:((Ut=ft[0])==null?void 0:Ut.nome)||"-"}),e.jsx(Te,{label:"Valor",value:ft[0]?re(ft[0].total):"-"})]})]})]}),he==="inteligencia"&&e.jsxs("div",{style:f.advancedGrid,children:[e.jsxs(Be,{titulo:O.titulo,emoji:"🧠",badge:O.nivel.toUpperCase(),badgeColor:O.cor,children:[e.jsx("p",{style:f.executivoTexto,children:"Motor 11.3 analisando risco de caixa, concentração, tendência, recorrência, Pareto e qualidade dos dados para os filtros atuais."}),e.jsx(Ft,{value:Ue,color:O.cor}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsx(Te,{label:"Ticket médio",value:re(O.ticketMedio)}),e.jsx(Te,{label:"Risco caixa",value:i(O.riscoCaixa)}),e.jsx(Te,{label:"Pendências",value:O.pendentesAbertas})]})]}),e.jsxs(Be,{titulo:"Previsões e Pareto",emoji:"🔮",children:[e.jsx("div",{style:f.compareGrid,children:O.previsoes.map(s=>e.jsx(Te,{label:s.label,value:re(s.value),sub:s.sub},s.label))}),O.maiorDespesa&&e.jsxs("p",{style:f.muted,children:["Maior despesa: ",e.jsx("strong",{children:O.maiorDespesa.descricao})," representa ",i(O.maiorDespesaPercentual)," do total filtrado."]})]}),e.jsx(Be,{titulo:"Ações recomendadas",emoji:"✅",children:e.jsx("div",{style:f.insightList,children:O.acoes.map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:j+1}),e.jsx("p",{children:s})]},j))})}),e.jsxs(Be,{titulo:"Anomalias financeiras",emoji:"🕵️",children:[O.anomalias.length===0&&e.jsx("p",{style:f.vazio,children:"Nenhuma anomalia acima de 2,5x o ticket médio foi encontrada."}),O.anomalias.map(s=>{var j;return e.jsxs("div",{style:f.topItem,children:[e.jsx("div",{style:f.medalha,children:"!"}),e.jsxs("div",{style:f.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[oo(s.data_vencimento)," • ",((j=s.df_centros_custo)==null?void 0:j.nome)||"Sem centro"]})]}),e.jsx("strong",{children:re(s.valor)})]},s.id)})]})]}),he==="copilot"&&e.jsxs("div",{style:f.advancedGrid,children:[e.jsxs(Be,{titulo:"Executive AI Summary",emoji:"✨",badge:`${D.score}/100`,badgeColor:D.status.tone==="danger"?"#dc3545":D.status.tone==="warning"?"#f59f00":"#12b886",children:[e.jsx("p",{style:f.executivoTexto,children:D.executiveSummary}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsx(Te,{label:"Total",value:re(D.totals.total)}),e.jsx(Te,{label:"Pendente",value:re(D.totals.pendente)}),e.jsx(Te,{label:"Vencido",value:re(D.totals.vencido)})]})]}),e.jsxs(Be,{titulo:"AI Narrative & Insights 11.8",emoji:"🧠",badge:"Contextual",badgeColor:"#7c3aed",children:[e.jsx("p",{style:f.executivoTexto,children:((Dt=D.narrativa)==null?void 0:Dt.parecer)||D.executiveSummary}),e.jsx("div",{style:f.insightList,children:[(It=D.narrativa)==null?void 0:It.liquidez,(_t=D.narrativa)==null?void 0:_t.concentracao,(yt=D.narrativa)==null?void 0:yt.curtoPrazo,(At=D.narrativa)==null?void 0:At.comportamento].filter(Boolean).map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:"✦"}),e.jsx("p",{children:s})]},`${s}-${j}`))})]}),e.jsx(Be,{titulo:"Anomalias contextuais",emoji:"⚠️",badge:`${((Oe=(pt=D.narrativa)==null?void 0:pt.anomalias)==null?void 0:Oe.length)||0} sinais`,badgeColor:"#dc3545",children:e.jsx("div",{style:f.insightList,children:(((Je=D.narrativa)==null?void 0:Je.anomalias)||[]).map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:"!"}),e.jsx("p",{children:s})]},`${s}-${j}`))})}),e.jsx(Be,{titulo:"Smart Priority Engine",emoji:"🚦",badge:`${D.priorities.length} ações`,badgeColor:"#0f766e",children:e.jsx("div",{style:f.insightList,children:D.priorities.map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:j+1}),e.jsxs("p",{children:[e.jsx("strong",{children:s.title}),e.jsx("br",{}),s.description,e.jsx("br",{}),e.jsxs("small",{children:[s.level," impacto • ",s.impact," • ",s.action]})]})]},`${s.title}-${j}`))})}),e.jsx(Be,{titulo:"Recomendações acionáveis",emoji:"✅",children:e.jsx("div",{style:f.insightList,children:D.recomendacoes.map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:"✓"}),e.jsx("p",{children:s})]},`${s}-${j}`))})}),e.jsxs(Be,{titulo:"Drill-down analytics",emoji:"🔎",children:[D.rankingCentros.length===0&&e.jsx("p",{style:f.vazio,children:"Sem centros suficientes para análise."}),D.rankingCentros.map(s=>e.jsxs("div",{style:f.itemGrafico,children:[e.jsxs("div",{style:f.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:re(s.total)})]}),e.jsx(Ft,{value:Math.max(s.peso,4),color:b(s.peso)}),e.jsxs("small",{children:[s.peso,"% do recorte • risco ",s.risco,"% • vencido ",re(s.vencido)]})]},s.nome))]})]})]}),e.jsxs("section",{style:f.dashboardGrid,children:[e.jsxs(Be,{titulo:"Resumo executivo",emoji:"📌",destaque:!0,children:[e.jsx("p",{style:f.executivoTexto,children:Ge}),e.jsxs("div",{style:f.miniStats,children:[e.jsx(Te,{label:"Mês",value:u(H||d())}),e.jsx(Te,{label:"Centro",value:Z?(ee==null?void 0:ee.nome)||"Selecionado":"Todos"}),e.jsx(Te,{label:"Status",value:ne})]})]}),e.jsxs(Be,{titulo:mt.titulo,emoji:mt.emoji,badge:mt.etiqueta,badgeColor:mt.cor,children:[e.jsx("p",{style:f.muted,children:mt.descricao}),e.jsx(Ft,{value:Ue,color:mt.cor}),e.jsxs("small",{children:[Ue,"/100 pontos de saúde financeira"]})]}),e.jsxs(Be,{titulo:Ct.titulo,emoji:Ct.emoji,badge:i(Le),badgeColor:Ct.cor,children:[e.jsx("p",{style:f.muted,children:Ct.descricao}),e.jsx(Ft,{value:Le,color:Ct.cor}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsx(Te,{label:"Total",value:w.length}),e.jsx(Te,{label:"Com centro",value:Qe}),e.jsx(Te,{label:"Sem centro",value:Re})]})]}),e.jsx(Be,{titulo:"Comparativo mensal",emoji:"📅",children:e.jsxs("div",{style:f.compareGrid,children:[e.jsx(Te,{label:"Mês atual",value:re(T),sub:u(H||d())}),e.jsx(Te,{label:"Mês anterior",value:re(S),sub:u(m(H||d()))}),e.jsx(Te,{label:"Variação",value:`${te>0?"↑ +":te<0?"↓ ":""}${re(te)}`,sub:i(De)}),e.jsx(Te,{label:"Previsão",value:re(ze),sub:"próximo mês"})]})})]}),e.jsxs("section",{style:f.predictivePanel,children:[e.jsxs("div",{style:f.widgetHeader,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🔮 Predictive Intelligence Layer 11.4"}),e.jsx("p",{style:f.muted,children:"Forecast financeiro 30/60/90 dias, risco projetado e leitura preditiva da meta."})]}),e.jsx("span",{style:{...f.badge,color:me.corRisco},children:me.statusRisco})]}),e.jsxs("div",{style:f.predictiveGrid,children:[e.jsx(Te,{label:"Forecast 30d",value:re(me.previsao30),sub:me.tendencia}),e.jsx(Te,{label:"Forecast 60d",value:re(me.previsao60),sub:"projeção"}),e.jsx(Te,{label:"Forecast 90d",value:re(me.previsao90),sub:"cenário"}),e.jsx(Te,{label:"Risco projetado",value:`${i(me.riscoProjetado)}`,sub:me.statusRisco})]}),e.jsx(Ft,{value:me.riscoProjetado,color:me.corRisco}),e.jsxs("div",{style:f.advancedGrid,children:[e.jsx(Be,{titulo:"Curva preditiva",emoji:"📈",children:e.jsx("div",{style:f.chartBox,children:e.jsx(ha,{width:"100%",height:230,children:e.jsxs(oi,{data:me.serie,children:[e.jsx(io,{strokeDasharray:"3 3"}),e.jsx(no,{dataKey:"mes"}),e.jsx(so,{}),e.jsx(ga,{formatter:s=>s==null?"-":re(s)}),e.jsx(to,{type:"monotone",dataKey:"realizado",stroke:"#0d9488",strokeWidth:3,connectNulls:!0,dot:!1}),e.jsx(to,{type:"monotone",dataKey:"previsto",stroke:"#7c3aed",strokeWidth:3,strokeDasharray:"6 4",connectNulls:!0,dot:!0})]})})})}),e.jsxs(Be,{titulo:"Alertas preditivos",emoji:"🚦",children:[e.jsx("div",{style:f.insightList,children:me.alertas.map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:"🔎"}),e.jsx("p",{children:s})]},j))}),me.metaForecast&&e.jsxs("div",{style:f.metaForecastBox,children:[e.jsx("strong",{children:"🎯 Meta forecast"}),e.jsxs("small",{children:["Chance de cumprir: ",me.metaForecast.chance]}),e.jsxs("small",{children:["Falta: ",re(me.metaForecast.falta)]}),e.jsx(Ft,{value:Math.min(me.metaForecast.percentualProjetado,100),color:me.metaForecast.percentualProjetado>100?"#dc3545":"#12b886"})]})]})]})]}),et&&e.jsxs("section",{className:"print-card",style:f.cardAlerta,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"🚨 Ação prioritária"}),e.jsxs("p",{children:[i(Tt.percentual)," das despesas filtradas estão sem centro de custo. Classifique os lançamentos para melhorar a análise."]})]}),e.jsx("button",{className:"no-print",style:f.btnAcao,onClick:t,children:"Ir para contas"})]}),V&&e.jsxs("section",{className:"print-card",style:f.cardMeta,children:[e.jsxs("div",{style:f.widgetHeader,children:[e.jsx("strong",{children:"🎯 Meta mensal"}),e.jsx("span",{style:f.badge,children:i(ue)})]}),e.jsxs("p",{children:["Meta: ",re(ke)," • Atual: ",re(T)]}),e.jsx(Ft,{value:Math.min(ue,100),color:ue>100?"#dc3545":ue>=80?"#f59f00":"#12b886"})]}),e.jsxs("section",{style:f.twoColumns,children:[e.jsx(Be,{titulo:"Insights automáticos",emoji:"💡",children:e.jsx("div",{style:f.insightList,children:tt.map((s,j)=>e.jsxs("div",{style:f.insightItem,children:[e.jsx("span",{style:f.insightEmoji,children:N(s.tipo)}),e.jsx("p",{children:s.texto})]},j))})}),!Z&&Ee.length>0&&e.jsx(Be,{titulo:"Distribuição por centro",emoji:"📊",children:Ee.slice(0,5).map(s=>e.jsxs("div",{style:f.itemGrafico,children:[e.jsxs("div",{style:f.cardLinha,children:[e.jsx("span",{children:s.nome}),e.jsx("strong",{children:i(s.percentual)})]}),e.jsx(Ft,{value:Math.max(s.percentual,4),color:b(s.percentual)}),e.jsxs("small",{children:[re(s.total)," ",s.id==="sem-centro"&&e.jsx("b",{style:f.alertaTexto,children:" • Classificar"})]})]},s.id))})]}),e.jsxs("section",{style:f.twoColumns,children:[ct.length>0&&e.jsx(Be,{titulo:"Top despesas",emoji:"🔥",children:ct.map((s,j)=>{var L;return e.jsxs("div",{style:f.topItem,children:[e.jsx("div",{style:f.medalha,children:j+1}),e.jsxs("div",{style:f.topText,children:[e.jsx("strong",{children:s.descricao}),e.jsxs("small",{children:[oo(s.data_vencimento)," • ",((L=s.df_centros_custo)==null?void 0:L.nome)||"Sem centro"]})]}),e.jsx("strong",{children:re(s.valor)})]},s.id)})}),e.jsx(Be,{titulo:"Resultado do filtro",emoji:"🧾",children:e.jsxs("div",{style:f.resultGrid,children:[e.jsx(Te,{label:"Centros",value:Ee.length}),e.jsx(Te,{label:"Contas",value:w.length}),e.jsx(Te,{label:"Dominante",value:fe?fe.nome:"-",sub:fe?i(fe.percentual):""})]})})]}),!Z&&e.jsxs("section",{style:f.bloco,children:[e.jsx("h2",{style:f.subtitulo,children:"🏆 Ranking por Centro"}),Ee.length===0&&e.jsx("p",{style:f.vazio,children:"Nenhum dado encontrado."}),e.jsx("div",{style:f.rankingGrid,children:Ee.map((s,j)=>e.jsxs("div",{className:"print-card",style:f.cardRanking,children:[e.jsxs("div",{style:f.cardLinha,children:[e.jsxs("div",{children:[e.jsxs("strong",{children:[j+1,". ",s.nome,s.id==="sem-centro"?" ⚠️":""]}),j===0&&e.jsx("small",{style:f.maiorCusto,children:"🔝 Maior custo"}),e.jsxs("small",{children:[i(s.percentual)," do total"]})]}),e.jsx("strong",{children:re(s.total)})]}),e.jsx(Ft,{value:Math.max(P?s.total/P*100:0,4),color:b(s.percentual)}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",re(s.pago)]}),e.jsxs("small",{children:["Pend: ",re(s.pendente)]}),e.jsxs("small",{children:["Venc: ",re(s.vencido)]})]})]},s.id))})]}),Z&&e.jsxs("section",{style:f.bloco,children:[e.jsx("h2",{style:f.subtitulo,children:"📊 Resumo do Centro"}),e.jsxs("div",{className:"print-card",style:f.cardRanking,children:[e.jsxs("div",{style:f.cardLinha,children:[e.jsx("strong",{children:(ee==null?void 0:ee.nome)||"Centro selecionado"}),e.jsx("strong",{children:re(T)})]}),e.jsxs("div",{style:f.grid3Compacto,children:[e.jsxs("small",{children:["Pago: ",re(ie)]}),e.jsxs("small",{children:["Pend: ",re(J)]}),e.jsxs("small",{children:["Venc: ",re(K)]})]})]})]}),e.jsxs("section",{style:f.bloco,children:[e.jsx("h2",{style:f.subtitulo,children:"📄 Contas do relatório"}),e.jsx("div",{style:f.contasGrid,children:w.map(s=>{var j;return e.jsxs("div",{className:"print-card",style:f.cardConta,children:[e.jsxs("div",{style:f.cardLinha,children:[e.jsx("strong",{children:s.descricao}),e.jsx("span",{children:re(s.valor)})]}),e.jsxs("small",{children:[oo(s.data_vencimento)," • ",((j=s.df_centros_custo)==null?void 0:j.nome)||"Sem centro"," • ",n(s.data_vencimento,s.status)?"VENCIDO":s.status]})]},s.id)})})]})]})]})}function Gs(){return e.jsxs("div",{style:f.skeletonArea,"aria-busy":"true","aria-label":"Carregando relatório",children:[e.jsx("section",{style:f.skeletonGrid,children:[1,2,3,4].map(t=>e.jsx("div",{style:f.skeletonCard},t))}),e.jsxs("section",{style:f.skeletonPanel,children:[e.jsx("div",{style:f.skeletonLineGrande}),e.jsx("div",{style:f.skeletonLine}),e.jsx("div",{style:f.skeletonLineCurta})]}),e.jsx("section",{style:f.skeletonGrid,children:[1,2].map(t=>e.jsx("div",{style:f.skeletonCardAlto},t))})]})}function He(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}(()=>{const t=new Uint32Array(256);for(let a=0;a<256;a+=1){let o=a;for(let i=0;i<8;i+=1)o=o&1?3988292384^o>>>1:o>>>1;t[a]=o>>>0}return t})();function Be({titulo:t,emoji:a,badge:o,badgeColor:i="#0d9488",children:n,destaque:l}){return e.jsxs("section",{className:"print-card",style:l?{...f.card,...f.cardDestaque}:f.card,children:[e.jsxs("div",{style:f.widgetHeader,children:[e.jsxs("strong",{children:[a," ",t]}),o&&e.jsx("span",{style:{...f.badge,color:i,borderColor:i},children:o})]}),n]})}function ro({titulo:t,valor:a,detalhe:o,emoji:i,cor:n,progresso:l}){return e.jsxs("section",{className:"print-card",style:f.kpiCard,children:[e.jsx("div",{style:f.kpiIcon,children:i}),e.jsx("span",{style:f.kpiTitulo,children:t}),e.jsx("strong",{style:f.kpiValor,children:a}),e.jsx("small",{style:f.muted,children:o}),e.jsx(Ft,{value:Math.min(Math.max(l||0,0),100),color:n})]})}function Te({label:t,value:a,sub:o}){return e.jsxs("div",{style:f.miniStat,children:[e.jsx("small",{children:t}),e.jsx("strong",{children:a}),o&&e.jsx("span",{children:o})]})}function Ft({value:t,color:a}){return e.jsx("div",{style:f.barraFundo,children:e.jsx("div",{style:{...f.barraValor,width:`${Math.min(Math.max(t||0,3),100)}%`,background:a}})})}const Ws=`
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
`,Hs=`
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
`,f={page:{padding:20,maxWidth:1180,margin:"auto",fontFamily:"Inter, Arial, sans-serif",background:"linear-gradient(180deg, #f8fbfb 0%, #eef7f5 100%)",minHeight:"100vh",paddingBottom:90,color:"#0f172a"},hero:{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:14,flexWrap:"wrap"},actionsTop:{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"},titulo:{fontSize:30,margin:0},descricaoTela:{fontSize:14,color:"#64748b",marginTop:4,marginBottom:0},heroBadge:{minWidth:130,background:"#fff",border:"1px solid #dbeafe",borderRadius:20,padding:16,boxShadow:"0 10px 30px rgba(15,23,42,0.08)",display:"flex",flexDirection:"column",alignItems:"center",gap:3},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:20},filtrosBox:{...Rt(),position:"relative",top:"auto",zIndex:1,border:"1px solid #e2e8f0",marginBottom:12,padding:12,boxShadow:"0 8px 22px rgba(15,23,42,0.05)",background:"rgba(255,255,255,0.92)"},filtroHeader:{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:10,marginBottom:8},filtroResumo:{color:"#64748b",fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},filtrosGrid:{display:"grid",gridTemplateColumns:"1.05fr 1.2fr 1.2fr 0.9fr 0.9fr",gap:8,alignItems:"center"},input:{width:"100%",padding:"9px 11px",borderRadius:11,border:"1px solid #d1d5db",boxSizing:"border-box",background:"#fff",minHeight:38,fontWeight:700,color:"#0f172a"},filtros:{display:"flex",gap:7,flexWrap:"wrap",marginTop:8},filtro:{border:"1px solid #d1d5db",background:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800,color:"#334155"},filtroAtivo:{border:"1px solid #0d9488",background:"#0d9488",color:"#fff",padding:"7px 12px",borderRadius:999,fontWeight:800},kpiGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14,marginBottom:16},kpiCard:{...Rt(),minHeight:130},kpiIcon:{width:38,height:38,borderRadius:14,background:"#f1f5f9",display:"grid",placeItems:"center",fontSize:20,marginBottom:8},kpiTitulo:{color:"#64748b",fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:.3},kpiValor:{display:"block",fontSize:22,marginTop:4,marginBottom:4},dashboardGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:14,marginBottom:14},advancedPanel:{...Rt(),marginBottom:16,border:"1px solid #bfdbfe",background:"linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)"},advancedGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14},dreLinha:{display:"grid",gridTemplateColumns:"1fr auto",gap:18,padding:"12px 0",borderBottom:"1px solid #eef2f7",alignItems:"center"},dreTexto:{display:"flex",flexDirection:"column",gap:4,minWidth:0},dreTitulo:{fontSize:16,lineHeight:1.2},dreDescricao:{color:"#64748b",fontSize:13,lineHeight:1.25,display:"block"},dreValor:{fontSize:16,whiteSpace:"nowrap",textAlign:"right"},chartBox:{width:"100%",height:250,minWidth:0},twoColumns:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(330px, 1fr))",gap:14,marginBottom:14},card:Rt(),cardDestaque:{background:"linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)",border:"1px solid #ccfbf1"},cardAlerta:{...Rt(),background:"#fff5f5",border:"1px solid #fecaca",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"},cardMeta:{...Rt(),border:"1px solid #fef3c7"},predictivePanel:{...Rt(),marginBottom:16,border:"1px solid #ddd6fe",background:"linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"},predictiveGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:10,marginBottom:8},metaForecastBox:{marginTop:12,padding:12,borderRadius:16,background:"#f8fafc",border:"1px solid #e2e8f0",display:"grid",gap:4},widgetHeader:{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"},executivoTexto:{fontSize:16,lineHeight:1.5,margin:"6px 0 12px 0"},miniStats:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:8},miniStat:{background:"#f8fafc",border:"1px solid #eef2f7",borderRadius:14,padding:10,display:"flex",flexDirection:"column",gap:2,minWidth:0},grid3Compacto:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))",gap:8,marginTop:10},compareGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10},resultGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:10},badge:{border:"1px solid",borderRadius:999,padding:"5px 9px",fontSize:12,fontWeight:800,background:"#fff"},barraFundo:{height:9,background:"#e2e8f0",borderRadius:99,overflow:"hidden",margin:"10px 0"},barraValor:{height:"100%",borderRadius:99},insightList:{display:"grid",gap:8},insightItem:{display:"grid",gridTemplateColumns:"30px 1fr",gap:8,alignItems:"flex-start",background:"#f8fafc",borderRadius:14,padding:10,fontSize:14},insightEmoji:{width:30,height:30,borderRadius:12,background:"#fff",display:"grid",placeItems:"center"},itemGrafico:{marginTop:10},topItem:{display:"grid",gridTemplateColumns:"34px 1fr auto",gap:10,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #eef2f7"},medalha:{width:30,height:30,borderRadius:999,background:"#eef2ff",color:"#3730a3",display:"grid",placeItems:"center",fontWeight:800},topText:{display:"flex",flexDirection:"column",gap:2},rankingGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:12},cardRanking:Rt(),contasGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:10},cardConta:Rt(),cardLinha:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start",flexWrap:"wrap"},maiorCusto:{display:"block",color:"#12b886",fontWeight:"bold",fontSize:12},alertaTexto:{color:"#dc3545",fontWeight:"bold"},vazio:{opacity:.7,fontSize:14},skeletonArea:{display:"grid",gap:14,marginTop:12},skeletonGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))",gap:14},skeletonCard:{height:130,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonCardAlto:{height:250,borderRadius:20,border:"1px solid #e2e8f0",background:"linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)"},skeletonPanel:{...Rt(),display:"grid",gap:12},skeletonLineGrande:{height:22,width:"55%",borderRadius:999,background:"#e2e8f0"},skeletonLine:{height:14,width:"80%",borderRadius:999,background:"#e2e8f0"},skeletonLineCurta:{height:14,width:"35%",borderRadius:999,background:"#e2e8f0"},muted:{color:"#64748b",lineHeight:1.45},btnVoltar:ma("#64748b"),btnExcel:ma("#16a34a"),btnPDF:ma("#7c3aed"),btnCSV:ma("#0d9488"),btnLimpar:{...ma("#64748b"),padding:"7px 10px"},btnAcao:ma("#dc3545")};function Rt(){return{background:"#fff",padding:16,borderRadius:20,marginBottom:0,boxShadow:"0 12px 30px rgba(15,23,42,0.07)",border:"1px solid rgba(226,232,240,0.9)"}}function ma(t){return{background:t,color:"#fff",border:"none",padding:"9px 13px",borderRadius:12,fontWeight:800,cursor:"pointer"}}function Fa(t){if(!t)return null;const a=String(t).slice(0,10);return new Date(a+"T00:00:00")}function ua(t){const a=new Date;a.setHours(0,0,0,0);const o=Fa(t);if(!o)return 999999;const i=o-a;return Math.round(i/(1e3*60*60*24))}function Ks(t){const a=Fa(t);if(!a)return!1;const o=new Date;return a.getMonth()===o.getMonth()&&a.getFullYear()===o.getFullYear()}function Ys(t,a,o){const i=new Date(t,a,0).getDate(),n=Math.min(Number(o||1),i);return`${t}-${String(a).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function Xs(t,a,o){if(!(t!=null&&t.ativo)||(t.tipo_recorrencia||t.frequencia||"mensal")!=="mensal")return!1;const i=t.data_inicio?Fa(t.data_inicio):null;if(!i)return!0;const n=new Date(a,o-1,1),l=new Date(a,o,0);return i<=l&&n>=new Date(i.getFullYear(),i.getMonth(),1)}function Ei(t){var o;const a=((o=t==null?void 0:t.df_contas_recorrentes)==null?void 0:o.tipo_recorrencia)||(t==null?void 0:t.tipo_recorrencia)||"";return String(a||"mensal")}function zi(t){const a=String(t||"mensal").toLowerCase();return{mensal:"Mensal",semanal:"Semanal",anual:"Anual",quinzenal:"Quinzenal"}[a]||jt(a)}function Qs({styles:t,formatarValor:a,navegarPara:o,contasAbertasDashboard:i,mostrarContasDashboard:n,setMostrarContasDashboard:l,busca:d,setBusca:m,estaVencida:u,formatarData:b,abrirConfirmacao:N,marcarComoPago:v}){return e.jsxs("section",{className:`dashboard-open-accounts content-block ${n?"accounts-expanded":"accounts-collapsed"}`,style:t.bloco,children:[e.jsxs("div",{className:"dashboard-section-header dashboard-section-header-accounts",children:[e.jsxs("div",{className:"dashboard-section-title-wrap",children:[e.jsx("strong",{children:"💳 Contas em aberto"}),e.jsxs("small",{children:["Mais novas primeiro • ",i.length," conta(s)"]})]}),e.jsxs("div",{className:"dashboard-section-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>o("contas"),children:"Ver todas"}),e.jsx("button",{className:"note-toggle-small",type:"button",onClick:()=>l(!n),title:n?"Recolher contas em aberto":"Expandir contas em aberto","aria-label":n?"Recolher contas em aberto":"Expandir contas em aberto",children:n?"−":"+"})]})]}),n&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"dashboard-inline-filter",children:e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro ou observação...",value:d,onChange:y=>m(y.target.value)})}),i.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma conta em aberto para os filtros atuais."}),e.jsx("div",{className:"dashboard-open-list",children:i.slice(0,8).map(y=>{var $;const h=u(y.data_vencimento,y.status);return e.jsxs("div",{className:`dashboard-account-row ${h?"account-row-vencido":"account-row-pendente"}`,children:[e.jsxs("div",{children:[e.jsx("strong",{children:y.descricao}),e.jsxs("div",{className:"dashboard-account-meta",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",b(y.data_vencimento)]}),e.jsx("span",{className:"account-center-label",children:(($=y.df_centros_custo)==null?void 0:$.nome)||"Sem centro"}),y.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",zi(Ei(y))]})]}),y.observacao&&e.jsxs("small",{className:"account-note-preview",children:["Obs: ",y.observacao]})]}),e.jsxs("div",{className:"dashboard-account-row-actions",children:[e.jsx("span",{className:"dashboard-account-value",children:a(y.valor)}),e.jsx("span",{className:`status-pill ${h?"status-vencido":"status-pendente"}`,children:h?"Vencido":"Pendente"}),e.jsx("button",{className:"dashboard-paid-button",style:t.btnPago,onClick:()=>N({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${y.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>v(y.id)}),children:"Pago"})]})]},y.id)})})]})]})}function Js({styles:t,navegarPara:a,notasPendentes:o,notasCriticas:i,notasUrgentes:n,mostrarNotas:l,setMostrarNotas:d,formatarData:m,alternarNotaConcluida:u,abrirEdicaoNota:b,abrirConfirmacao:N,excluirNota:v}){return e.jsxs("section",{className:`no-print dashboard-notes-card ${l?"notes-expanded":"notes-collapsed"}`,children:[e.jsxs("div",{style:t.notasHeaderNovo,className:"notes-header-clean dashboard-notes-content",children:[e.jsxs("div",{className:"notes-title-wrap",children:[e.jsx("strong",{className:"notes-title",children:"📝 Bloco de Notas"}),e.jsxs("div",{className:"notes-stats-row",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[o.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[i," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[n," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-header-actions",children:[e.jsx("button",{className:"dashboard-see-all-link",type:"button",onClick:()=>a("notas"),children:"Ver notas"}),e.jsx("button",{className:"note-toggle-small",onClick:()=>d(!l),title:l?"Recolher bloco de notas":"Expandir bloco de notas","aria-label":l?"Recolher bloco de notas":"Expandir bloco de notas",children:l?"−":"+"})]})]}),o.length===0&&e.jsx("p",{style:t.mensagemVazia,children:"Nenhuma nota pendente no momento."}),l&&e.jsx("div",{style:t.notasListaNova,className:"notes-list-dashboard",children:o.slice(0,6).map(y=>{const h=y.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${h}`,style:{...t.cardNotaAcao,...h==="critico"?t.cardNotaCritico:h==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:y.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:y.concluida?"line-through":"none"},children:y.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${h}`,style:{...t.badgePrioridade,...h==="critico"?t.badgeCritico:h==="urgente"?t.badgeUrgente:t.badgeNormal},children:h==="critico"?"Crítico":h==="urgente"?"Urgente":"Normal"})]}),y.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",m(y.data_evento)]}),y.conteudo&&e.jsx("p",{style:t.textoNota,children:y.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>u(y),children:y.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>b(y),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>N({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${y.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>v(y.id)}),children:"Excluir"})]})]},y.id)})})]})}function ut({className:t="",style:a={}}){return e.jsx("div",{className:`df-skeleton ${t}`.trim(),style:a,"aria-hidden":"true"})}function Zs({items:t=4}){return e.jsx("div",{className:"summary-grid df-skeleton-summary","aria-label":"Carregando resumo",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-summary-card",children:[e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-lg"})]},o))})}function Pi({items:t=3}){return e.jsx("div",{className:"df-skeleton-list","aria-label":"Carregando contas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-account-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-value"})]}),e.jsxs("div",{className:"df-skeleton-chip-row",children:[e.jsx(ut,{className:"df-skeleton-chip"}),e.jsx(ut,{className:"df-skeleton-chip"}),e.jsx(ut,{className:"df-skeleton-chip"})]}),e.jsxs("div",{className:"df-skeleton-actions-row",children:[e.jsx(ut,{className:"df-skeleton-button"}),e.jsx(ut,{className:"df-skeleton-button"})]})]},o))})}function el({items:t=3}){return e.jsx("div",{className:"notes-page-grid df-skeleton-notes","aria-label":"Carregando notas",children:Array.from({length:t}).map((a,o)=>e.jsxs("div",{className:"df-skeleton-card df-skeleton-note-card",children:[e.jsxs("div",{className:"df-skeleton-card-top",children:[e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-title"}),e.jsx(ut,{className:"df-skeleton-pill"})]}),e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-sm"}),e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-full"}),e.jsx(ut,{className:"df-skeleton-line df-skeleton-line-mid"})]},o))})}function tl({styles:t,formatarValor:a,total:o,pago:i,pendente:n,vencido:l,contas:d,diferencaDias:m,navegarPara:u,contasAbertasDashboard:b,mostrarContasDashboard:N,setMostrarContasDashboard:v,busca:y,setBusca:h,estaVencida:$,formatarData:C,abrirConfirmacao:k,marcarComoPago:U,notasPendentes:ae,notasCriticas:H,notasUrgentes:q,mostrarNotas:ne,setMostrarNotas:G,alternarNotaConcluida:Z,abrirEdicaoNota:A,excluirNota:M,loading:X=!1,nomeUsuario:he="usuário",filiais:ce=[],filtroFilial:ye="",setFiltroFilial:_e=()=>{},contasOperacionaisFiliais:se=[]}){const w=P=>Number(P||0),pe=(ce||[]).find(P=>P.id===ye);d.filter(P=>P.status==="pago"),d.filter(P=>P.status!=="pago");const T=se&&se.length>0?se:d,ie=(ce||[]).map(P=>{const ee=T.filter(et=>et.filial_id===P.id),Qe=ee.reduce((et,ct)=>et+w(ct.valor),0),Re=ee.filter(et=>et.status==="pago").reduce((et,ct)=>et+w(ct.valor),0),Le=ee.filter(et=>$(et.data_vencimento,et.status)).reduce((et,ct)=>et+w(ct.valor),0),Tt=Qe-Re;return{id:P.id,nome:P.nome||"Filial sem nome",total:Qe,pago:Re,pendente:Tt,vencido:Le,contas:ee.length}}).filter(P=>P.total>0||P.contas>0).sort((P,ee)=>ee.total-P.total),K=ie[0],J=[...ie].sort((P,ee)=>ee.pendente-P.pendente)[0],S=[...ie].sort((P,ee)=>ee.vencido-P.vencido)[0],te=[{name:"Pago",value:w(i),color:"#22c55e"},{name:"Pendente",value:Math.max(w(n)-w(l),0),color:"#f59e0b"},{name:"Vencido",value:w(l),color:"#ef4444"}].filter(P=>P.value>0),De=[{name:"Pago",valor:w(i)},{name:"Aberto",valor:w(n)},{name:"Vencido",valor:w(l)}],ze=Object.values(d.reduce((P,ee)=>{var Re;const Qe=((Re=ee.df_centros_custo)==null?void 0:Re.nome)||"Sem centro";return P[Qe]||(P[Qe]={name:Qe,valor:0}),P[Qe].valor+=w(ee.valor),P},{})).sort((P,ee)=>ee.valor-P.valor).slice(0,5),ke=o>0?Math.round(i/o*100):0,V=o>0?Math.round(l/o*100):0,ue=d.filter(P=>P.status!=="pago").sort((P,ee)=>m(P.data_vencimento)-m(ee.data_vencimento)),qe=ue.filter(P=>m(P.data_vencimento)===0),B=ue.filter(P=>{const ee=m(P.data_vencimento);return ee>0&&ee<=7}),W=ue.find(P=>m(P.data_vencimento)>=0)||ue[0],Ee=qe.reduce((P,ee)=>P+w(ee.valor),0),fe=B.reduce((P,ee)=>P+w(ee.valor),0);return e.jsxs(e.Fragment,{children:[e.jsx("section",{className:"dashboard-branch-filter no-print","aria-label":"Filtro de filial do dashboard",children:e.jsxs("div",{className:"dashboard-branch-filter-card",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Visão por filial"}),e.jsx("strong",{children:pe?pe.nome:"Todas as filiais"}),e.jsx("small",{children:"Os KPIs, gráficos e contas em aberto respeitam a filial selecionada."})]}),e.jsxs("select",{style:t.input,value:ye,onChange:P=>_e(P.target.value),"aria-label":"Filtrar dashboard por filial",children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(ce||[]).map(P=>e.jsx("option",{value:P.id,children:P.nome},P.id))]})]})}),e.jsx("section",{className:"dashboard-kpi-row","aria-label":"Resumo financeiro",children:X?e.jsx(Zs,{items:4}):e.jsxs("div",{className:"summary-grid",style:t.resumo,children:[e.jsxs("div",{style:t.boxTotal,children:[e.jsx("span",{children:"Total"}),e.jsx("strong",{children:a(o)})]}),e.jsxs("div",{style:t.boxPago,children:[e.jsx("span",{children:"Pago"}),e.jsx("strong",{children:a(i)})]}),e.jsxs("div",{style:t.boxPendente,children:[e.jsx("span",{children:"Pendente"}),e.jsx("strong",{children:a(n)})]}),e.jsxs("div",{style:t.boxVencido,children:[e.jsx("span",{children:"Vencido"}),e.jsx("strong",{children:a(l)})]})]})}),!X&&e.jsxs("section",{className:"dashboard-operational-grid no-print","aria-label":"Dashboard operacional por filial",children:[e.jsxs("article",{className:"dashboard-operational-card highlight",children:[e.jsx("span",{className:"analytics-kicker",children:"Ranking de unidades"}),e.jsx("strong",{children:K?K.nome:"Sem movimento"}),e.jsx("small",{children:K?`${a(K.total)} em volume financeiro`:"Cadastre contas vinculadas às filiais."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Maior pendência"}),e.jsx("strong",{children:J?J.nome:"Sem pendências"}),e.jsx("small",{children:J?a(J.pendente):"Nenhuma conta pendente encontrada."})]}),e.jsxs("article",{className:"dashboard-operational-card",children:[e.jsx("span",{className:"analytics-kicker",children:"Risco vencido"}),e.jsx("strong",{children:S&&S.vencido>0?S.nome:"Sem vencidos"}),e.jsx("small",{children:S&&S.vencido>0?a(S.vencido):"Operação sem vencidos no filtro atual."})]}),e.jsxs("article",{className:"dashboard-operational-card ranking",children:[e.jsxs("div",{className:"analytics-card-header compact",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Comparativo por filial"}),e.jsx("strong",{children:"Top unidades"})]}),e.jsx("span",{className:"analytics-badge neutral",children:ie.length})]}),ie.length>0?e.jsx("div",{className:"branch-ranking-list",children:ie.slice(0,5).map((P,ee)=>{const Qe=(K==null?void 0:K.total)>0?Math.max(5,Math.round(P.total/K.total*100)):0;return e.jsxs("div",{className:"branch-ranking-row",children:[e.jsxs("div",{className:"branch-ranking-info",children:[e.jsx("span",{children:ee+1}),e.jsxs("div",{children:[e.jsx("strong",{children:P.nome}),e.jsxs("small",{children:[P.contas," conta(s) • pendente ",a(P.pendente)]})]})]}),e.jsxs("div",{className:"branch-ranking-value",children:[e.jsx("strong",{children:a(P.total)}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${Qe}%`}})})]})]},P.id)})}):e.jsx("div",{className:"analytics-empty",children:"Sem contas com filial no filtro atual."})]})]}),!X&&e.jsxs("section",{className:"dashboard-analytics-grid no-print",children:[e.jsxs("div",{className:"dashboard-analytics-card dashboard-analytics-card-primary",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Saúde financeira"}),e.jsx("strong",{children:"Distribuição das contas"})]}),e.jsxs("span",{className:"analytics-badge",children:[ke,"% pago"]})]}),te.length>0?e.jsxs("div",{className:"analytics-chart-row",children:[e.jsxs("div",{className:"donut-chart-wrap",children:[e.jsx(ha,{width:"100%",height:190,children:e.jsxs(yi,{children:[e.jsx(wi,{data:te,dataKey:"value",nameKey:"name",innerRadius:54,outerRadius:82,paddingAngle:3,children:te.map(P=>e.jsx(ki,{fill:P.color},P.name))}),e.jsx(ga,{formatter:P=>a(P)})]})}),e.jsxs("div",{className:"donut-center-label",children:[e.jsxs("strong",{children:[ke,"%"]}),e.jsx("span",{children:"quitado"})]})]}),e.jsx("div",{className:"analytics-legend",children:te.map(P=>e.jsxs("div",{children:[e.jsx("span",{style:{background:P.color}}),e.jsx("small",{children:P.name}),e.jsx("strong",{children:a(P.value)})]},P.name))})]}):e.jsx("div",{className:"analytics-empty",children:"Sem dados financeiros para montar o gráfico."})]}),e.jsxs("div",{className:"dashboard-analytics-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Fluxo atual"}),e.jsx("strong",{children:"Pago x Aberto x Vencido"})]}),e.jsxs("span",{className:V>0?"analytics-badge danger":"analytics-badge success",children:[V,"% risco"]})]}),e.jsx(ha,{width:"100%",height:220,children:e.jsxs(vi,{data:De,margin:{top:14,right:18,left:24,bottom:4},children:[e.jsx(io,{strokeDasharray:"3 3",vertical:!1}),e.jsx(no,{dataKey:"name",tickLine:!1,axisLine:!1}),e.jsx(so,{width:82,tickLine:!1,axisLine:!1,tickMargin:10,tickFormatter:P=>`R$ ${Math.round(P/1e3)}k`}),e.jsx(ga,{formatter:P=>a(P)}),e.jsx(ji,{dataKey:"valor",radius:[10,10,4,4],fill:"#0f766e"})]})})]}),e.jsxs("div",{className:"dashboard-analytics-card dashboard-cost-center-card",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Centros de custo"}),e.jsx("strong",{children:"Top 5 por volume financeiro"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[ze.length," centros"]})]}),ze.length>0?e.jsx("div",{className:"cost-center-bars",children:ze.map(P=>{const ee=o>0?Math.max(4,Math.round(P.valor/o*100)):0;return e.jsxs("div",{className:"cost-center-row",children:[e.jsxs("div",{children:[e.jsx("strong",{children:P.name}),e.jsx("span",{children:a(P.valor)})]}),e.jsx("div",{className:"cost-center-track",children:e.jsx("span",{style:{width:`${ee}%`}})})]},P.name)})}):e.jsx("div",{className:"analytics-empty",children:"Cadastre centros de custo para visualizar o ranking."})]}),e.jsxs("div",{className:"dashboard-analytics-card executive-agenda-widget",children:[e.jsxs("div",{className:"analytics-card-header",children:[e.jsxs("div",{children:[e.jsx("span",{className:"analytics-kicker",children:"Agenda executiva"}),e.jsx("strong",{children:"Próximos vencimentos"})]}),e.jsxs("span",{className:"analytics-badge neutral",children:[ue.length," abertas"]})]}),e.jsxs("div",{className:"executive-agenda-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Hoje"}),e.jsx("strong",{children:a(Ee)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"7 dias"}),e.jsx("strong",{children:a(fe)})]})]}),W?e.jsxs("div",{className:"executive-agenda-next",children:[e.jsx("span",{children:"Próximo compromisso"}),e.jsx("strong",{children:W.descricao}),e.jsxs("small",{children:[C(W.data_vencimento)," • ",a(W.valor)]})]}):e.jsx("div",{className:"analytics-empty executive-agenda-empty",children:"Agenda financeira limpa."}),e.jsx("button",{className:"executive-agenda-cta",onClick:()=>u("agenda"),children:"Abrir agenda completa"})]})]}),X?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"dashboard-section-header-accounts",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"💰 Contas em aberto"}),e.jsx("p",{style:t.textoNota,children:"Carregando contas e vencimentos..."})]})}),e.jsx(Pi,{items:2})]}):e.jsx(Qs,{styles:t,formatarValor:a,navegarPara:u,contasAbertasDashboard:b,mostrarContasDashboard:N,setMostrarContasDashboard:v,busca:y,setBusca:h,estaVencida:$,formatarData:C,abrirConfirmacao:k,marcarComoPago:U}),X?e.jsxs("section",{className:"content-block",style:t.bloco,children:[e.jsx("div",{className:"notes-header-clean",children:e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Carregando lembretes..."})]})}),e.jsx(el,{items:2})]}):e.jsx(Js,{styles:t,navegarPara:u,notasPendentes:ae,notasCriticas:H,notasUrgentes:q,mostrarNotas:ne,setMostrarNotas:G,formatarData:C,alternarNotaConcluida:Z,abrirEdicaoNota:A,abrirConfirmacao:k,excluirNota:M})]})}function al(t){return e.jsx(tl,{...t})}function ol({icon:t,title:a,description:o,actionLabel:i,onAction:n}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o}),i&&n&&e.jsx("button",{className:"empty-state-action",onClick:n,children:i})]})}function rl({styles:t,busca:a,setBusca:o,mostrarFiltros:i,setMostrarFiltros:n,limparFiltros:l,imprimirPDF:d,exportarCSV:m,filtroStatus:u,setFiltroStatus:b,centros:N,filtroCentro:v,setFiltroCentro:y,filiais:h,filtroFilial:$,setFiltroFilial:C,filtroMes:k,setFiltroMes:U,dataInicial:ae,setDataInicial:H,dataFinal:q,setDataFinal:ne,limitarDataInput:G,contasFiltradas:Z,total:A,formatarValor:M,loading:X,HeaderExpansivel:he,mostrarContas:ce,setMostrarContas:ye,estaVencida:_e,formatarData:se,formatarTipoRecorrencia:w,obterTipoRecorrenciaConta:pe,abrirConfirmacao:T,marcarComoPago:ie,voltarParaPendente:K,abrirEdicaoConta:J,excluirConta:S,navegarPara:te}){function De(){var ze,ke;return e.jsxs(e.Fragment,{children:[e.jsxs("section",{className:"no-print filters-desktop",style:t.filtrosBox,children:[e.jsx("input",{style:t.input,placeholder:"Buscar por conta, data, centro, observação ou status...",value:a,onChange:V=>o(V.target.value)}),e.jsx("button",{className:"filter-toggle-button",onClick:()=>n(!i),children:i?"Ocultar filtros":"Filtros"}),e.jsxs("div",{className:"export-actions",style:t.acoes,children:[e.jsx("button",{style:t.btnCinza,onClick:l,children:"Limpar"}),e.jsx("button",{style:t.btnRoxo,onClick:d,children:"PDF"}),e.jsx("button",{style:t.btnVerde,onClick:m,children:"CSV"})]}),i&&e.jsxs("div",{className:"advanced-filters",children:[e.jsxs("div",{className:"status-tabs filter-tabs-fixed",style:t.filtros,children:[e.jsx("button",{style:u==="todas"?t.filtroAtivo:t.filtro,onClick:()=>b("todas"),children:"Todas"}),e.jsx("button",{style:u==="pendentes"?t.filtroAtivo:t.filtro,onClick:()=>b("pendentes"),children:"Pendentes"}),e.jsx("button",{style:u==="pagas"?t.filtroAtivo:t.filtro,onClick:()=>b("pagas"),children:"Pagas"}),e.jsx("button",{style:u==="vencidas"?t.filtroAtivo:t.filtro,onClick:()=>b("vencidas"),children:"Vencidas"})]}),e.jsxs("select",{style:t.input,value:$,onChange:V=>C(V.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(h||[]).map(V=>e.jsx("option",{value:V.id,children:V.nome},V.id))]}),e.jsxs("select",{style:t.input,value:v,onChange:V=>y(V.target.value),children:[e.jsx("option",{value:"",children:"Todos os centros"}),N.map(V=>e.jsx("option",{value:V.id,children:V.nome},V.id))]}),e.jsx("input",{style:t.input,type:"month",value:k,onChange:V=>U(V.target.value)}),e.jsx("input",{style:t.input,type:"date",value:ae,onChange:V=>H(G(V.target.value))}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:V=>ne(G(V.target.value))})]})]}),e.jsxs("section",{className:"result-summary",style:t.resumoFiltro,children:[e.jsx("strong",{children:"Resultado filtrado"}),e.jsxs("span",{children:[Z.length," conta(s) • Total ",M(A)]}),e.jsxs("small",{children:["Filial: ",$?((ze=(h||[]).find(V=>V.id===$))==null?void 0:ze.nome)||"Selecionada":"Todas"," • Centro: ",v?((ke=N.find(V=>V.id===v))==null?void 0:ke.nome)||"Selecionado":"Todos"," • Status: ",u," • Mês: ",k||"Todos"]})]}),e.jsxs("section",{className:"content-block",style:t.bloco,children:[X&&e.jsx(Pi,{items:3}),e.jsx(he,{titulo:"💰 Contas",aberto:ce,onClick:()=>ye(!ce)}),!X&&ce&&Z.length===0&&e.jsx(ol,{icon:"💳",title:"Nenhuma conta encontrada",description:"Ajuste os filtros ou cadastre uma nova conta para acompanhar os vencimentos da empresa."}),!X&&ce&&Z.map(V=>{var qe,B;const ue=_e(V.data_vencimento,V.status);return e.jsxs("div",{className:`print-card account-card-desktop ${ue?"account-card-vencida":V.status==="pago"?"account-card-paga":"account-card-pendente"}`,style:{...t.cardConta,background:V.status==="pago"?"#d4edda":ue?"#ffb3b3":"#fff3cd"},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{children:V.descricao}),e.jsx("span",{children:M(V.valor)})]}),e.jsxs("div",{style:t.cardInfo,className:"account-meta-line",children:[e.jsxs("span",{className:"account-date-badge",children:["📅 ",se(V.data_vencimento)]}),e.jsx("span",{children:((qe=V.df_filiais)==null?void 0:qe.nome)||"Sem filial"}),e.jsx("span",{children:((B=V.df_centros_custo)==null?void 0:B.nome)||"-"}),V.recorrencia_id&&e.jsxs("span",{className:"account-recurring-badge",children:["🔁 ",w(pe(V))]}),e.jsx("span",{className:`status-pill ${ue?"status-vencido":V.status==="pago"?"status-pago":"status-pendente"}`,children:ue?"Vencido":V.status==="pago"?"Pago":"Pendente"})]}),e.jsxs("div",{className:"account-actions",style:t.acoes,children:[V.status!=="pago"?e.jsx("button",{style:t.btnPago,onClick:()=>T({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${V.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>ie(V.id)}),children:"Pago"}):e.jsx("button",{style:t.btnVoltar,onClick:()=>T({titulo:"Voltar para pendente",mensagem:`Deseja voltar a conta ${V.descricao} para pendente?`,textoConfirmar:"Voltar",tipo:"aviso",acao:()=>K(V.id)}),children:"Voltar"}),e.jsx("button",{style:t.btnEditar,onClick:()=>J(V),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>T({titulo:"Mover para lixeira",mensagem:`Deseja mover a conta ${V.descricao} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>S(V.id)}),children:"Excluir"})]})]},V.id)})]})]})}return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"💳 Contas"}),e.jsx("p",{style:t.textoNota,children:"Consulte, filtre, exporte e administre as contas da empresa em uma página dedicada."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>te("dashboard"),children:"← Dashboard"})})]}),De()]})}function il({icon:t,title:a,description:o}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:t}),e.jsx("strong",{children:a}),e.jsx("p",{children:o})]})}function nl({styles:t,navegarPara:a,notasFiltradas:o,notasPendentes:i,notasCriticas:n,notasUrgentes:l,buscaNota:d,setBuscaNota:m,formatarData:u,alternarNotaConcluida:b,abrirEdicaoNota:N,abrirConfirmacao:v,excluirNota:y,filtroFilial:h,setFiltroFilial:$,filiais:C}){return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"page-title-actions",children:[e.jsxs("div",{children:[e.jsx("h1",{style:t.titulo,children:"📝 Notas"}),e.jsx("p",{style:t.textoNota,children:"Central de notas e lembretes da empresa, separada do painel financeiro para reduzir poluição visual."})]}),e.jsx("div",{className:"page-actions-row",children:e.jsx("button",{style:t.btnCinza,onClick:()=>a("dashboard"),children:"← Dashboard"})})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"notes-page-section",children:[e.jsxs("div",{className:"notes-page-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Todas as notas"}),e.jsxs("p",{style:t.textoNota,children:[o.length," nota(s) encontrada(s) • ",i.length," pendente(s)"]})]}),e.jsxs("div",{className:"notes-page-stats",children:[e.jsxs("span",{className:"note-stat note-stat-pendente",children:[i.length," pendente(s)"]}),e.jsxs("span",{className:"note-stat note-stat-critico",children:[n," crítica(s)"]}),e.jsxs("span",{className:"note-stat note-stat-urgente",children:[l," urgente(s)"]})]})]}),e.jsxs("div",{className:"notes-toolbar",children:[e.jsxs("select",{style:t.input,value:h,onChange:k=>$(k.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(C||[]).map(k=>e.jsx("option",{value:k.id,children:k.nome},k.id))]}),e.jsx("input",{style:t.input,placeholder:"Buscar por título, conteúdo ou prioridade...",value:d,onChange:k=>m(k.target.value)})]}),o.length===0&&e.jsx(il,{icon:"📝",title:"Nenhuma nota encontrada",description:"Use as notas para registrar pendências, lembretes e prioridades da operação."}),e.jsx("div",{className:"notes-page-grid",children:o.map(k=>{var ae;const U=k.prioridade||"normal";return e.jsxs("div",{className:`note-card-action note-card-${U}`,style:{...t.cardNotaAcao,...U==="critico"?t.cardNotaCritico:U==="urgente"?t.cardNotaUrgente:t.cardNotaNormal,opacity:k.concluida?.65:1},children:[e.jsxs("div",{style:t.cardTopo,children:[e.jsx("strong",{style:{textDecoration:k.concluida?"line-through":"none"},children:k.titulo}),e.jsx("span",{className:`note-priority-badge note-priority-${U}`,style:{...t.badgePrioridade,...U==="critico"?t.badgeCritico:U==="urgente"?t.badgeUrgente:t.badgeNormal},children:U==="critico"?"Crítico":U==="urgente"?"Urgente":"Normal"})]}),k.data_evento&&e.jsxs("small",{className:"note-event-date",children:["📅 ",u(k.data_evento)]}),((ae=k.df_filiais)==null?void 0:ae.nome)&&e.jsxs("small",{className:"note-event-date",children:["🏢 ",k.df_filiais.nome]}),k.conteudo&&e.jsx("p",{style:t.textoNota,children:k.conteudo}),e.jsxs("div",{style:t.acoes,children:[e.jsx("button",{style:t.btnPago,onClick:()=>b(k),children:k.concluida?"Reabrir":"Concluir"}),e.jsx("button",{style:t.btnEditar,onClick:()=>N(k),children:"Editar"}),e.jsx("button",{style:t.btnExcluir,onClick:()=>v({titulo:"Mover nota para lixeira",mensagem:`Deseja mover a nota ${k.titulo} para a lixeira? Ela ficará em quarentena por 60 dias.`,textoConfirmar:"Mover",tipo:"perigo",acao:()=>y(k.id)}),children:"Excluir"})]})]},k.id)})})]})]})}function Lo(t){return String(t||"").trim().replace(/\s+/g," ")}async function sl(){const{data:t,error:a}=await I.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(a)throw a;const{data:o,error:i}=await I.from("df_usuarios_empresas").select("empresa_id, user_id, email, perfil");if(i)throw i;const n=new Map;return(o||[]).forEach(l=>{if(!(l!=null&&l.empresa_id))return;const d=l.user_id||String(l.email||"").trim().toLowerCase();if(!d)return;const m=n.get(l.empresa_id)||new Set;m.add(d),n.set(l.empresa_id,m)}),(t||[]).map(l=>{var d;return{...l,totalUsuarios:((d=n.get(l.id))==null?void 0:d.size)||0}})}async function ll({nome:t,masterUserId:a,masterEmail:o,masterNome:i}){const n=Lo(t);if(n.length<2)throw new Error("Informe o nome da empresa.");const{data:l,error:d}=await I.from("df_empresas").select("id, nome").ilike("nome",n).limit(1);if(d)throw d;if(Array.isArray(l)&&l.length>0)throw new Error("Já existe uma empresa com esse nome.");const{data:m,error:u}=await I.from("df_empresas").insert([{nome:n}]).select("id, nome, created_at").single();if(u)throw u;if(o||a){const b={empresa_id:m.id,user_id:a||null,email:String(o||"").trim().toLowerCase()||null,nome:Lo(i)||String(o||"").split("@")[0]||"Administrador",perfil:"admin"},{error:N}=await I.from("df_usuarios_empresas").insert([b]);N&&console.warn("Empresa criada, mas não foi possível vincular o master automaticamente:",N.message)}return m}async function dl({empresaId:t,nome:a}){const o=Lo(a);if(!t)throw new Error("Empresa não identificada.");if(o.length<2)throw new Error("Informe o nome da empresa.");const{data:i,error:n}=await I.from("df_empresas").update({nome:o}).eq("id",t).select("id, nome, created_at").single();if(n)throw n;return i}function Ri(t){return String(t||"").trim().replace(/\s+/g," ")}function Fi(t){const a=String(t||"").trim();if(!a)throw new Error("Empresa não identificada para gerenciar filiais.");return a}async function Go(t){const a=Fi(t),{data:o,error:i}=await I.from("df_filiais").select("id, empresa_id, nome, ativo, created_at").eq("empresa_id",a).order("nome",{ascending:!0});if(i)throw i;return o||[]}async function cl({empresaId:t,nome:a}){const o=Fi(t),i=Ri(a);if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:l}=await I.from("df_filiais").select("id, nome").eq("empresa_id",o).ilike("nome",i).limit(1);if(l)throw l;if(Array.isArray(n)&&n.length>0)throw new Error("Já existe uma filial com esse nome nesta empresa.");const{data:d,error:m}=await I.from("df_filiais").insert([{empresa_id:o,nome:i,ativo:!0}]).select("id, empresa_id, nome, ativo, created_at").single();if(m)throw m;return d}async function pl({filialId:t,nome:a}){const o=String(t||"").trim(),i=Ri(a);if(!o)throw new Error("Filial não identificada.");if(i.length<2)throw new Error("Informe o nome da filial.");const{data:n,error:l}=await I.from("df_filiais").update({nome:i}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(l)throw l;return n}async function ml({filialId:t,ativo:a}){const o=String(t||"").trim();if(!o)throw new Error("Filial não identificada.");const{data:i,error:n}=await I.from("df_filiais").update({ativo:!!a}).eq("id",o).select("id, empresa_id, nome, ativo, created_at").single();if(n)throw n;return i}function ul(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function fl({styles:t,usuarioLogado:a,nomeUsuarioCompleto:o,empresaId:i,empresasDisponiveis:n=[],trocarEmpresaAtiva:l,trocandoEmpresa:d,mostrarAviso:m,onEmpresasAtualizadas:u,voltarPainel:b,abaInicial:N="empresas"}){const[v,y]=c.useState(N==="filiais"?"filiais":"empresas"),[h,$]=c.useState([]),[C,k]=c.useState(""),[U,ae]=c.useState(""),[H,q]=c.useState(!1),[ne,G]=c.useState(!0),[Z,A]=c.useState(null),[M,X]=c.useState(""),[he,ce]=c.useState([]),[ye,_e]=c.useState(""),[se,w]=c.useState(""),[pe,T]=c.useState(!1),[ie,K]=c.useState(null),[J,S]=c.useState(""),te=c.useMemo(()=>n.find(B=>B.id===i)||h.find(B=>B.id===i)||null,[i,h,n]);async function De(){G(!0);try{const B=await sl();$(B)}catch(B){m==null||m((B==null?void 0:B.message)||"Não foi possível carregar empresas.","erro")}finally{G(!1)}}async function ze(){if(!i){ce([]);return}T(!0);try{const B=await Go(i);ce(B)}catch(B){m==null||m((B==null?void 0:B.message)||"Não foi possível carregar filiais.","erro")}finally{T(!1)}}c.useEffect(()=>{De()},[]),c.useEffect(()=>{v==="filiais"&&ze()},[v,i]);const ke=c.useMemo(()=>{const B=String(C||"").trim().toLowerCase();return B?h.filter(W=>String(W.nome||"").toLowerCase().includes(B)):h},[C,h]);c.useMemo(()=>{const B=String(ye||"").trim().toLowerCase();return B?he.filter(W=>String(W.nome||"").toLowerCase().includes(B)):he},[ye,he]);async function V(B){if(B.preventDefault(),!H){q(!0);try{await ll({nome:U,masterUserId:a==null?void 0:a.id,masterEmail:a==null?void 0:a.email,masterNome:o==null?void 0:o()}),ae(""),await De(),await(u==null?void 0:u()),m==null||m("Empresa criada com sucesso.","sucesso")}catch(W){m==null||m((W==null?void 0:W.message)||"Não foi possível criar a empresa.","erro")}finally{q(!1)}}}async function ue(B){if(!(!(B!=null&&B.id)||H)){q(!0);try{await dl({empresaId:B.id,nome:M}),A(null),X(""),await De(),await(u==null?void 0:u()),m==null||m("Empresa atualizada com sucesso.","sucesso")}catch(W){m==null||m((W==null?void 0:W.message)||"Não foi possível atualizar a empresa.","erro")}finally{q(!1)}}}function qe(){return e.jsxs(e.Fragment,{children:[e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova empresa"}),e.jsx("p",{style:t.textoNota,children:"Crie um novo tenant e vincule automaticamente seu usuário master."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:V,children:[e.jsx("input",{style:t.input,value:U,onChange:B=>ae(B.target.value),placeholder:"Nome da empresa"}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:H,children:H?"Salvando...":"Criar empresa"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Empresas cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Controle inicial das empresas disponíveis no SaaS."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:C,onChange:B=>k(B.target.value),placeholder:"Buscar empresa"})]}),ne?e.jsx("p",{style:t.textoNota,children:"Carregando empresas..."}):ke.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏢"}),e.jsx("strong",{children:"Nenhuma empresa encontrada"}),e.jsx("p",{children:"Crie a primeira empresa ou ajuste a busca."})]}):e.jsx("div",{className:"master-companies-list",children:ke.map(B=>{const W=B.id===i,Ee=Z===B.id;return e.jsxs("article",{className:`master-company-card ${W?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏢"}),e.jsxs("div",{children:[Ee?e.jsx("input",{style:t.input,value:M,onChange:fe=>X(fe.target.value),autoFocus:!0}):e.jsx("h3",{children:B.nome||"Empresa sem nome"}),e.jsxs("small",{children:["ID: ",B.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:[B.totalUsuarios||0," usuário(s)"]}),e.jsxs("span",{children:["Criada em ",ul(B.created_at)]}),W&&e.jsx("strong",{children:"Ativa"})]}),e.jsx("div",{className:"master-company-actions",children:Ee?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:H,onClick:()=>ue(B),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{A(null),X("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{A(B.id),X(B.nome||"")},children:"Editar"}),!W&&e.jsx("button",{style:t.btnSalvar,type:"button",disabled:d,onClick:()=>l==null?void 0:l(B.id),children:"Ativar"})]})})]},B.id)})})]})]})}return e.jsxs("div",{className:"master-panel-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Painel Master SaaS"}),e.jsx("h1",{style:t.titulo,children:"🏢 Painel Master"}),e.jsx("p",{style:t.textoNota,children:"Gerencie empresas e tenants da plataforma. Filiais ficam nas Configurações de cada empresa."})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:b,children:"← Dashboard"})]}),e.jsxs("div",{className:"master-stats-grid",children:[e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresas cadastradas"}),e.jsx("strong",{children:h.length})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Empresa ativa"}),e.jsx("strong",{children:(te==null?void 0:te.nome)||"—"})]}),e.jsxs("section",{className:"master-stat-card",children:[e.jsx("small",{children:"Administração SaaS"}),e.jsx("strong",{children:"Tenants"})]})]}),qe()]})}function xl(t){if(!t)return"—";try{return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(t))}catch{return"—"}}function hl({styles:t,empresaId:a,empresaNome:o,mostrarAviso:i,voltarPainel:n}){const[l,d]=c.useState([]),[m,u]=c.useState(""),[b,N]=c.useState(""),[v,y]=c.useState(!0),[h,$]=c.useState(!1),[C,k]=c.useState(null),[U,ae]=c.useState("");async function H(){if(!a){d([]),y(!1);return}y(!0);try{const A=await Go(a);d(A)}catch(A){i==null||i((A==null?void 0:A.message)||"Não foi possível carregar filiais.","erro")}finally{y(!1)}}c.useEffect(()=>{H()},[a]);const q=c.useMemo(()=>{const A=String(m||"").trim().toLowerCase();return A?l.filter(M=>String(M.nome||"").toLowerCase().includes(A)):l},[m,l]);async function ne(A){if(A.preventDefault(),!h){$(!0);try{await cl({empresaId:a,nome:b}),N(""),await H(),i==null||i("Filial criada com sucesso.","sucesso")}catch(M){i==null||i((M==null?void 0:M.message)||"Não foi possível criar a filial.","erro")}finally{$(!1)}}}async function G(A){if(!(!(A!=null&&A.id)||h)){$(!0);try{await pl({filialId:A.id,nome:U}),k(null),ae(""),await H(),i==null||i("Filial atualizada com sucesso.","sucesso")}catch(M){i==null||i((M==null?void 0:M.message)||"Não foi possível atualizar a filial.","erro")}finally{$(!1)}}}async function Z(A){if(!(!(A!=null&&A.id)||h)){$(!0);try{await ml({filialId:A.id,ativo:!A.ativo}),await H(),i==null||i(A.ativo?"Filial desativada.":"Filial ativada.","sucesso")}catch(M){i==null||i((M==null?void 0:M.message)||"Não foi possível alterar a filial.","erro")}finally{$(!1)}}}return e.jsxs("div",{className:"branches-settings-page",children:[e.jsxs("div",{className:"master-page-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"master-kicker",children:"Configurações da empresa"}),e.jsx("h1",{style:t.titulo,children:"🏬 Filiais / Unidades"}),e.jsx("p",{style:t.textoNota,children:"Cadastre unidades operacionais dentro da empresa ativa. As próximas fases ligarão contas e relatórios a essas filiais."}),e.jsxs("small",{style:t.textoAjuda,children:["Empresa ativa: ",e.jsx("strong",{children:o||"—"})]})]}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:n,children:"← Configurações"})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"master-create-card",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Nova filial"}),e.jsx("p",{style:t.textoNota,children:"Use nomes como Loja Centro, Loja Shopping, Produção, Delivery ou Administração."})]}),e.jsxs("form",{className:"master-create-form",onSubmit:ne,children:[e.jsx("input",{style:t.input,value:b,onChange:A=>N(A.target.value),placeholder:"Nome da filial",disabled:!a}),e.jsx("button",{style:t.btnSalvar,type:"submit",disabled:h||!a,children:h?"Salvando...":"Criar filial"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"master-list-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Filiais cadastradas"}),e.jsx("p",{style:t.textoNota,children:"Cada empresa enxerga apenas suas próprias unidades."})]}),e.jsx("input",{style:t.input,className:"master-search-input",value:m,onChange:A=>u(A.target.value),placeholder:"Buscar filial"})]}),v?e.jsx("p",{style:t.textoNota,children:"Carregando filiais..."}):q.length===0?e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:"🏬"}),e.jsx("strong",{children:"Nenhuma filial encontrada"}),e.jsx("p",{children:"Crie unidades para organizar contas por local de operação."})]}):e.jsx("div",{className:"master-companies-list",children:q.map(A=>{const M=C===A.id;return e.jsxs("article",{className:`master-company-card ${A.ativo?"active":""}`,children:[e.jsxs("div",{className:"master-company-main",children:[e.jsx("span",{className:"master-company-icon",children:"🏬"}),e.jsxs("div",{children:[M?e.jsx("input",{style:t.input,value:U,onChange:X=>ae(X.target.value),autoFocus:!0}):e.jsx("h3",{children:A.nome||"Filial sem nome"}),e.jsxs("small",{children:["ID: ",A.id]})]})]}),e.jsxs("div",{className:"master-company-meta",children:[e.jsxs("span",{children:["Criada em ",xl(A.created_at)]}),e.jsx("strong",{children:A.ativo?"Ativa":"Inativa"})]}),e.jsx("div",{className:"master-company-actions",children:M?e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnSalvar,type:"button",disabled:h,onClick:()=>G(A),children:"Salvar"}),e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{k(null),ae("")},children:"Cancelar"})]}):e.jsxs(e.Fragment,{children:[e.jsx("button",{style:t.btnCinza,type:"button",onClick:()=>{k(A.id),ae(A.nome||"")},children:"Editar"}),e.jsx("button",{style:A.ativo?t.btnCinza:t.btnSalvar,type:"button",disabled:h,onClick:()=>Z(A),children:A.ativo?"Desativar":"Ativar"})]})})]},A.id)})})]})]})}const ia=[{codigo:"starter",nome:"Starter",descricao:"Base para operação pequena com uma unidade.",limite_filiais:1,limite_usuarios:3,valor_mensal:0,recursos:["1 filial","3 usuários","Contas e notas","Dashboard básico"]},{codigo:"profissional",nome:"Profissional",descricao:"Operação multiunidade com dashboard operacional.",limite_filiais:5,limite_usuarios:15,valor_mensal:149,recursos:["Até 5 filiais","Até 15 usuários","Dashboard operacional","Relatórios gerenciais"]},{codigo:"enterprise",nome:"Enterprise",descricao:"Estrutura avançada para redes, permissões e expansão SaaS.",limite_filiais:null,limite_usuarios:null,valor_mensal:null,recursos:["Filiais ilimitadas","Usuários ilimitados","Permissões avançadas","Suporte prioritário"]}];function $i(t){const a=String((t==null?void 0:t.message)||"").toLowerCase();return(t==null?void 0:t.code)==="42P01"||a.includes("does not exist")||a.includes("schema cache")}function gl(t="profissional"){return ia.find(a=>a.codigo===t)||ia[1]}async function bl(){const{data:t,error:a}=await I.from("df_planos").select("id, codigo, nome, descricao, limite_filiais, limite_usuarios, valor_mensal, ativo").eq("ativo",!0).order("valor_mensal",{ascending:!0,nullsFirst:!1});if(a){if($i(a))return ia;throw a}return!Array.isArray(t)||t.length===0?ia:t.map(o=>({...o,recursos:wl(o)}))}async function vl(t){if(!t)return null;const{data:a,error:o}=await I.from("df_assinaturas").select("id, empresa_id, plano_codigo, status, trial_inicio, trial_fim, assinatura_inicio, assinatura_fim, limite_filiais, limite_usuarios").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(o){if($i(o))return null;throw o}return a||null}async function jl(t){const[a,o]=await Promise.all([bl(),vl(t)]),i=a.find(n=>n.codigo===(o==null?void 0:o.plano_codigo))||gl(o==null?void 0:o.plano_codigo);return{planos:a,assinatura:o,planoAtual:{...i,limite_filiais:(o==null?void 0:o.limite_filiais)??i.limite_filiais,limite_usuarios:(o==null?void 0:o.limite_usuarios)??i.limite_usuarios}}}async function yl({empresaId:t,planoCodigo:a,limiteFiliais:o,limiteUsuarios:i,status:n="trial"}){if(!t)throw new Error("Empresa não identificada.");if(!a)throw new Error("Selecione um plano.");const l={empresa_id:t,plano_codigo:a,status:n,limite_filiais:o,limite_usuarios:i,updated_at:new Date().toISOString()},{data:d,error:m}=await I.from("df_assinaturas").select("id").eq("empresa_id",t).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(m)throw m;if(d!=null&&d.id){const{data:N,error:v}=await I.from("df_assinaturas").update(l).eq("id",d.id).select("*").single();if(v)throw v;return N}const{data:u,error:b}=await I.from("df_assinaturas").insert([{...l,trial_inicio:new Date().toISOString().slice(0,10)}]).select("*").single();if(b)throw b;return u}function wl(t){const a=[];return a.push(t.limite_filiais?`Até ${t.limite_filiais} filial(is)`:"Filiais ilimitadas"),a.push(t.limite_usuarios?`Até ${t.limite_usuarios} usuário(s)`:"Usuários ilimitados"),a.push("Dashboard operacional"),a.push("Base para billing SaaS"),a}function ri(t,a,o){if(t==null||t==="")return"Ilimitado";const i=Number(t);return Number.isFinite(i)?`${i} ${i===1?a:o}`:"Ilimitado"}function ii(t){return t==null?"Sob consulta":Number(t)===0?"R$ 0,00":Number(t).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function fa(t){return t==null?"":String(t)}function kl(t){if(!t)return"";const a=new Date(t);return Number.isNaN(a.getTime())?String(t):a.toLocaleDateString("pt-BR")}function Cl({styles:t,empresaId:a,empresaNome:o,filiais:i=[],usuarios:n=[],mostrarAviso:l,podeEditar:d=!1,voltarPainel:m}){const[u,b]=c.useState(!0),[N,v]=c.useState(!1),[y,h]=c.useState(ia),[$,C]=c.useState(null),[k,U]=c.useState("profissional"),[ae,H]=c.useState("trial"),[q,ne]=c.useState(5),[G,Z]=c.useState(15),[A,M]=c.useState(null);c.useEffect(()=>{let S=!0;async function te(){var De,ze,ke,V,ue,qe;if(a){b(!0);try{const B=await jl(a);if(!S)return;h(B.planos||ia),C(B.assinatura);const W=((De=B.assinatura)==null?void 0:De.plano_codigo)||((ze=B.assinatura)==null?void 0:ze.plano_slug)||((ke=B.planoAtual)==null?void 0:ke.codigo)||"profissional",Ee=((V=B.assinatura)==null?void 0:V.status)||"trial",fe=((ue=B.planoAtual)==null?void 0:ue.limite_filiais)??"",P=((qe=B.planoAtual)==null?void 0:qe.limite_usuarios)??"";U(W),H(Ee),ne(fe),Z(P),M({planoSelecionado:W,statusSelecionado:Ee,limiteFiliais:fa(fe),limiteUsuarios:fa(P)})}catch(B){console.error("Erro ao carregar billing:",B),S&&(l==null||l("Não foi possível carregar o billing: "+B.message,"erro"))}finally{S&&b(!1)}}}return te(),()=>{S=!1}},[a,l]);const X=c.useMemo(()=>y.find(S=>S.codigo===k)||ia.find(S=>S.codigo==="profissional"),[y,k]),he=i.length,ce=n.length,ye=q===""?null:Number(q),_e=G===""?null:Number(G),se=ye?Math.min(100,Math.round(he/ye*100)):100,w=_e?Math.min(100,Math.round(ce/_e*100)):100,pe=ye!==null&&he>=ye,T=_e!==null&&ce>=_e,ie=!!A&&(A.planoSelecionado!==k||A.statusSelecionado!==ae||A.limiteFiliais!==fa(q)||A.limiteUsuarios!==fa(G));function K(S){const te=y.find(De=>De.codigo===S);U(S),ne((te==null?void 0:te.limite_filiais)??""),Z((te==null?void 0:te.limite_usuarios)??"")}async function J(){if(d){v(!0);try{const S=await yl({empresaId:a,planoCodigo:k,status:ae,limiteFiliais:q===""?null:Number(q),limiteUsuarios:G===""?null:Number(G)});C(S),M({planoSelecionado:k,statusSelecionado:ae,limiteFiliais:fa(q),limiteUsuarios:fa(G)}),l==null||l("Billing atualizado com sucesso.","info")}catch(S){console.error("Erro ao salvar billing:",S),l==null||l("Erro ao salvar billing: "+S.message,"erro")}finally{v(!1)}}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"💼 Billing Foundation"}),e.jsx("button",{style:t.btnCinza,onClick:m,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"billing-hero",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Base comercial SaaS"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"})," • Status: ",e.jsx("strong",{children:($==null?void 0:$.status)||"trial estrutural"})]}),e.jsx("p",{style:t.textoAjuda,children:"Esta fase cria a fundação de planos, limites e assinatura. Ainda não bloqueia o uso do app; os bloqueios comerciais ficam para o hardening posterior."})]}),e.jsxs("div",{className:"billing-current-plan",children:[e.jsx("span",{children:"Plano atual"}),e.jsx("strong",{children:(X==null?void 0:X.nome)||"Profissional"}),e.jsxs("small",{children:[ii(X==null?void 0:X.valor_mensal)," / mês"]})]})]}),e.jsxs("section",{className:"billing-kpi-grid",children:[e.jsxs("div",{className:`billing-kpi-card ${pe?"warning":""}`,children:[e.jsx("span",{children:"Filiais em uso"}),e.jsx("strong",{children:he}),e.jsx("small",{children:ri(ye,"filial liberada","filiais liberadas")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${se}%`}})})]}),e.jsxs("div",{className:`billing-kpi-card ${T?"warning":""}`,children:[e.jsx("span",{children:"Usuários em uso"}),e.jsx("strong",{children:ce}),e.jsx("small",{children:ri(_e,"usuário liberado","usuários liberados")}),e.jsx("div",{className:"billing-progress",children:e.jsx("span",{style:{width:`${w}%`}})})]}),e.jsxs("div",{className:"billing-kpi-card",children:[e.jsx("span",{children:"Status comercial"}),e.jsx("strong",{children:ae}),e.jsx("small",{children:$!=null&&$.trial_fim?`Trial até ${kl($.trial_fim)}`:"Trial preparado"})]})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Planos disponíveis"}),e.jsx("div",{className:"billing-plan-grid",children:y.map(S=>e.jsxs("button",{type:"button",className:`billing-plan-card ${k===S.codigo?"selected":""}`,onClick:()=>K(S.codigo),disabled:!d,children:[e.jsx("span",{children:S.nome}),e.jsx("strong",{children:ii(S.valor_mensal)}),e.jsx("small",{children:S.descricao}),e.jsx("ul",{children:(S.recursos||[]).map(te=>e.jsx("li",{children:te},te))})]},S.codigo))})]}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsxs("div",{className:"billing-section-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Assinatura e limites"}),e.jsx("p",{style:t.textoNota,children:"Defina os limites comerciais da empresa sem alterar os dados operacionais já validados."})]}),!d&&e.jsx("span",{className:"billing-readonly",children:"Somente leitura"}),d&&ie&&e.jsx("span",{className:"billing-pending",children:"● Alterações pendentes"})]}),e.jsxs("div",{className:"billing-form-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Plano"}),e.jsx("select",{style:t.input,value:k,disabled:!d,onChange:S=>K(S.target.value),children:y.map(S=>e.jsx("option",{value:S.codigo,children:S.nome},S.codigo))})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Status"}),e.jsxs("select",{style:t.input,value:ae,disabled:!d,onChange:S=>H(S.target.value),children:[e.jsx("option",{value:"trial",children:"Trial"}),e.jsx("option",{value:"ativa",children:"Ativa"}),e.jsx("option",{value:"pausada",children:"Pausada"}),e.jsx("option",{value:"cancelada",children:"Cancelada"})]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de filiais"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:q,disabled:!d,onChange:S=>ne(S.target.value)})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Limite de usuários"}),e.jsx("input",{style:t.input,type:"number",min:"0",placeholder:"Ilimitado",value:G,disabled:!d,onChange:S=>Z(S.target.value)})]})]}),d&&e.jsx("button",{style:{...t.btnSalvar,opacity:u||N||!ie?.65:1},disabled:u||N||!ie,onClick:J,children:N?"Salvando...":ie?"Salvar alterações do billing":"Billing salvo"})]})]})}function Nl(){return new Date().toISOString().slice(0,10)}function Io(t){return String(t||"").trim().replace(/\s+/g," ")}function za({numero:t,titulo:a,descricao:o,concluido:i,ativo:n,children:l}){return e.jsxs("section",{className:`onboarding-step-card ${i?"done":""} ${n?"active":""}`,children:[e.jsxs("div",{className:"onboarding-step-head",children:[e.jsx("div",{className:"onboarding-step-number",children:i?"✓":t}),e.jsxs("div",{children:[e.jsx("span",{children:i?"Concluído":n?"Próximo passo":"Pendente"}),e.jsx("h3",{children:a}),e.jsx("p",{children:o})]})]}),n&&e.jsx("div",{className:"onboarding-step-body",children:l})]})}function Sl({styles:t,empresaId:a,empresaNome:o,filiais:i=[],centros:n=[],contas:l=[],mostrarAviso:d,onRefresh:m,voltarPainel:u,abrirDashboard:b}){var K,J;const[N,v]=c.useState(!1),[y,h]=c.useState("Loja Centro"),[$,C]=c.useState("Operacional"),[k,U]=c.useState("Primeira conta de teste"),[ae,H]=c.useState("100,00"),[q,ne]=c.useState(Nl()),[G,Z]=c.useState(""),[A,M]=c.useState(""),X=c.useMemo(()=>i.filter(S=>(S==null?void 0:S.ativo)!==!1),[i]),he=c.useMemo(()=>l.filter(S=>(S==null?void 0:S.excluido)!==!0),[l]),ce={empresa:!!a,filial:X.length>0,centro:n.length>0,conta:he.length>0},ye=Math.round([ce.empresa,ce.filial,ce.centro,ce.conta].filter(Boolean).length/4*100),_e=ye===100,se=ce.empresa?ce.filial?ce.centro?ce.conta?"dashboard":"conta":"centro":"filial":"empresa";async function w(){await(m==null?void 0:m())}async function pe(){const S=Io(y);if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");if(S.length<2)return d==null?void 0:d("Informe o nome da primeira filial.","erro");v(!0);try{const{error:te}=await I.from("df_filiais").insert([{empresa_id:a,nome:S,ativo:!0}]);if(te)throw te;d==null||d("Primeira filial criada com sucesso.","info"),await w()}catch(te){d==null||d("Erro ao criar filial: "+te.message,"erro")}finally{v(!1)}}async function T(){const S=Io($);if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");if(S.length<2)return d==null?void 0:d("Informe o nome do primeiro centro de custo.","erro");v(!0);try{const{error:te}=await I.from("df_centros_custo").insert([{empresa_id:a,nome:S}]);if(te)throw te;d==null||d("Centro de custo criado com sucesso.","info"),await w()}catch(te){d==null||d("Erro ao criar centro de custo: "+te.message,"erro")}finally{v(!1)}}async function ie(){var ke,V;if(!a)return d==null?void 0:d("Empresa não identificada para onboarding.","erro");const S=Io(k),te=Ci(ae),De=G||((ke=X[0])==null?void 0:ke.id)||null,ze=A||((V=n[0])==null?void 0:V.id)||null;if(S.length<2)return d==null?void 0:d("Informe a descrição da primeira conta.","erro");if(!te||te<=0)return d==null?void 0:d("Informe um valor válido para a primeira conta.","erro");if(!q)return d==null?void 0:d("Informe o vencimento da primeira conta.","erro");v(!0);try{const ue={empresa_id:a,descricao:S,valor:te,data_vencimento:q,vencimento:q,status:"pendente",centro_custo_id:ze,filial_id:De,excluido:!1},{error:qe}=await I.from("df_contas").insert([ue]);if(qe)throw qe;d==null||d("Primeira conta criada. Dashboard pronto para uso.","info"),await w()}catch(ue){d==null||d("Erro ao criar primeira conta: "+ue.message,"erro")}finally{v(!1)}}return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"🚀 Onboarding SaaS"}),e.jsx("button",{style:t.btnCinza,onClick:u,children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"onboarding-hero",children:[e.jsxs("div",{children:[e.jsx("span",{className:"onboarding-eyebrow",children:"Configuração inicial"}),e.jsx("h2",{style:t.subtitulo,children:"Deixe a empresa pronta para operar"}),e.jsxs("p",{style:t.textoNota,children:["Empresa: ",e.jsx("strong",{children:o||"Empresa atual"}),". Este fluxo prepara a primeira unidade, centro de custo e conta para liberar o dashboard operacional."]})]}),e.jsxs("div",{className:"onboarding-progress-box",children:[e.jsxs("span",{children:[ye,"%"]}),e.jsx("small",{children:_e?"Onboarding completo":"Em implantação"}),e.jsx("div",{className:"onboarding-progress",children:e.jsx("i",{style:{width:`${ye}%`}})})]})]}),e.jsxs("section",{className:"onboarding-kpi-grid",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Filiais"}),e.jsx("strong",{children:X.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Centros de custo"}),e.jsx("strong",{children:n.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Contas ativas"}),e.jsx("strong",{children:he.length})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Status"}),e.jsx("strong",{children:_e?"Pronto":"Guiado"})]})]}),e.jsxs("div",{className:"onboarding-steps-grid",children:[e.jsx(za,{numero:"1",titulo:"Empresa ativa",descricao:"A empresa atual já está definida no tenant selecionado.",concluido:ce.empresa,ativo:se==="empresa",children:e.jsx("p",{style:t.textoNota,children:"Selecione ou crie uma empresa pelo Painel Master antes de continuar."})}),e.jsxs(za,{numero:"2",titulo:"Primeira filial",descricao:"Crie a unidade inicial para separar operação e indicadores.",concluido:ce.filial,ativo:se==="filial",children:[e.jsx("input",{style:t.input,value:y,onChange:S=>h(S.target.value),placeholder:"Ex: Loja Centro"}),e.jsx("button",{style:t.btnSalvar,disabled:N,onClick:pe,children:N?"Criando...":"Criar primeira filial"})]}),e.jsxs(za,{numero:"3",titulo:"Centro de custo",descricao:"Crie uma classificação financeira básica para as primeiras contas.",concluido:ce.centro,ativo:se==="centro",children:[e.jsx("input",{style:t.input,value:$,onChange:S=>C(S.target.value),placeholder:"Ex: Operacional"}),e.jsx("button",{style:t.btnSalvar,disabled:N,onClick:T,children:N?"Criando...":"Criar centro de custo"})]}),e.jsxs(za,{numero:"4",titulo:"Primeira conta",descricao:"Registre uma conta inicial para alimentar KPIs, ranking e dashboard.",concluido:ce.conta,ativo:se==="conta",children:[e.jsxs("div",{className:"onboarding-form-grid",children:[e.jsx("input",{style:t.input,value:k,onChange:S=>U(S.target.value),placeholder:"Descrição"}),e.jsx("input",{style:t.input,value:ae,onChange:S=>H(S.target.value),placeholder:"Valor"}),e.jsx("input",{style:t.input,type:"date",value:q,onChange:S=>ne(S.target.value)}),e.jsxs("select",{style:t.input,value:G,onChange:S=>Z(S.target.value),children:[e.jsx("option",{value:"",children:((K=X[0])==null?void 0:K.nome)||"Filial padrão"}),X.map(S=>e.jsx("option",{value:S.id,children:S.nome},S.id))]}),e.jsxs("select",{style:t.input,value:A,onChange:S=>M(S.target.value),children:[e.jsx("option",{value:"",children:((J=n[0])==null?void 0:J.nome)||"Centro padrão"}),n.map(S=>e.jsx("option",{value:S.id,children:S.nome},S.id))]})]}),e.jsx("button",{style:t.btnSalvar,disabled:N,onClick:ie,children:N?"Criando...":"Criar primeira conta"})]}),e.jsxs(za,{numero:"5",titulo:"Dashboard pronto",descricao:"A operação inicial já pode ser acompanhada no dashboard.",concluido:_e,ativo:se==="dashboard",children:[e.jsx("p",{style:t.textoNota,children:"Base inicial concluída. Revise os KPIs, ranking de unidades e filtros por filial."}),e.jsx("button",{style:t.btnSalvar,onClick:b,children:"Ir para o dashboard"})]})]})]})}function _l({novoEmailUsuario:t,setNovoEmailUsuario:a,novaSenhaUsuario:o,setNovaSenhaUsuario:i,confirmarNovaSenhaUsuario:n,setConfirmarNovaSenhaUsuario:l,salvarMeuEmail:d,salvarMinhaSenha:m,styles:u}){return e.jsxs("div",{className:"users-account-grid users-security-grid",children:[e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar e-mail"}),e.jsx("small",{style:u.textoAjuda,children:"Confirmação pode ser solicitada."})]}),e.jsx("input",{style:u.input,type:"email",placeholder:"Novo e-mail",value:t,onChange:b=>a(b.target.value)}),e.jsx("button",{style:u.btnSalvar,onClick:d,children:"Atualizar e-mail"})]}),e.jsxs("div",{className:"users-form-card users-security-card",children:[e.jsxs("div",{className:"users-security-card-header",children:[e.jsx("strong",{children:"Alterar senha"}),e.jsx("small",{style:u.textoAjuda,children:"Mínimo de 6 caracteres."})]}),e.jsxs("div",{className:"users-security-password-grid",children:[e.jsx("input",{style:u.input,type:"password",placeholder:"Nova senha",value:o,onChange:b=>i(b.target.value)}),e.jsx("input",{style:u.input,type:"password",placeholder:"Confirmar nova senha",value:n,onChange:b=>l(b.target.value)})]}),e.jsx("button",{style:u.btnSalvar,onClick:m,children:"Atualizar senha"})]})]})}const ni=[{value:"admin",label:"Admin"},{value:"gerente",label:"Gerente"},{value:"financeiro",label:"Financeiro"},{value:"operacional",label:"Operacional"},{value:"visualizacao",label:"Visualização"},{value:"operador",label:"Operador"}];function El({styles:t,EmptyState:a,podeAcessarConfiguracoes:o,podeAdministrarUsuarios:i,navegarPara:n,usuarioLogado:l,normalizarPerfil:d,perfilUsuario:m,permissoesUsuario:u,novoEmailUsuario:b,setNovoEmailUsuario:N,novaSenhaUsuario:v,setNovaSenhaUsuario:y,confirmarNovaSenhaUsuario:h,setConfirmarNovaSenhaUsuario:$,salvarMeuEmail:C,salvarMinhaSenha:k,empresasDisponiveis:U,empresaId:ae,trocandoEmpresa:H,trocarEmpresaAtiva:q,buscarUsuariosEmpresa:ne,primeiraLetraMaiuscula:G,nomeConviteUsuario:Z,setNomeConviteUsuario:A,emailConviteUsuario:M,setEmailConviteUsuario:X,senhaConviteUsuario:he,setSenhaConviteUsuario:ce,perfilConviteUsuario:ye,setPerfilConviteUsuario:_e,criandoUsuarioManual:se,adicionarUsuarioEmpresa:w,usuariosCarregando:pe,usuariosInicializados:T,usuariosErro:ie,usuariosEmpresa:K,filiais:J,filiaisUsuariosEmpresa:S,salvandoFilialUsuario:te,liberarTodasFiliaisUsuario:De,alternarFilialUsuario:ze,atualizarPerfilUsuarioEmpresa:ke,enviarAcessoUsuarioEmpresa:V,removerUsuarioEmpresa:ue}){if(!o())return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Usuários"}),e.jsxs("section",{style:t.cardConfiguracao,children:[e.jsx("h2",{style:t.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:t.textoNota,children:"Seu perfil atual não permite acessar a gestão de usuários."}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("contas"),children:"← Voltar"})]})]});const qe=(l==null?void 0:l.email)||"",B=i();return e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:t.titulo,children:"👥 Gestão de usuários"}),e.jsx("button",{style:t.btnCinza,onClick:()=>n("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsx("h2",{style:t.subtitulo,children:"Minha conta"}),e.jsxs("p",{style:t.textoNota,children:["Usuário conectado: ",e.jsx("strong",{children:qe})," • Perfil: ",e.jsx("strong",{children:d(m)}),u!=null&&u.isMaster?e.jsxs(e.Fragment,{children:[" • Global: ",e.jsx("strong",{children:"master"})]}):null]}),e.jsx(_l,{novoEmailUsuario:b,setNovoEmailUsuario:N,novaSenhaUsuario:v,setNovaSenhaUsuario:y,confirmarNovaSenhaUsuario:h,setConfirmarNovaSenhaUsuario:$,salvarMeuEmail:C,salvarMinhaSenha:k,styles:t})]}),(u==null?void 0:u.canSwitchCompany)&&U.length>1&&e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section",children:[e.jsxs("div",{className:"users-header-row",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"🏢 Empresas disponíveis"}),e.jsx("p",{style:t.textoNota,children:"Troque a empresa ativa para recarregar os usuários e dados do tenant selecionado."})]}),e.jsx("span",{className:"roleBadge admin",children:"master"})]}),e.jsx("select",{style:t.input,value:ae||"",disabled:H,onChange:W=>q(W.target.value),children:U.map(W=>e.jsx("option",{value:W.id,children:W.nome||W.id},W.id))})]}),e.jsxs("section",{style:t.cardConfiguracao,className:"users-page-section users-management-section",children:[e.jsxs("div",{className:"users-header-row users-management-header",children:[e.jsxs("div",{children:[e.jsx("h2",{style:t.subtitulo,children:"Usuários da empresa"}),e.jsx("p",{style:t.textoNota,children:"Defina perfil e escopo por filial. Sem filial marcada = acesso a todas as filiais da empresa."})]}),e.jsx("button",{style:t.btnCinza,onClick:()=>ne(),children:"Atualizar"})]}),e.jsxs("div",{className:"users-permission-guide users-permission-guide-compact",children:[e.jsxs("span",{children:[e.jsx("strong",{children:"Admin:"})," acesso total"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Gerente:"})," gestão operacional"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Financeiro:"})," contas e relatórios"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Operacional:"})," contas e notas"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Visualização:"})," consulta"]}),e.jsxs("span",{children:[e.jsx("strong",{children:"Filiais:"})," escopo por unidade"]})]}),B&&e.jsxs("div",{className:"users-add-card users-add-card-compact",children:[e.jsx("input",{style:t.input,type:"text",placeholder:"Nome do usuário",value:Z,onChange:W=>A(G(W.target.value))}),e.jsx("input",{style:t.input,type:"email",placeholder:"E-mail do usuário",value:M,onChange:W=>X(W.target.value)}),e.jsx("input",{style:t.input,type:"text",placeholder:"Senha provisória",value:he,onChange:W=>ce(W.target.value)}),e.jsx("select",{style:t.input,value:ye,onChange:W=>_e(W.target.value),children:ni.slice().reverse().map(W=>e.jsx("option",{value:W.value,children:W.label},W.value))}),e.jsx("button",{style:t.btnSalvar,onClick:w,disabled:se,children:se?"Criando...":"Criar acesso"}),e.jsx("small",{style:t.textoNota,children:"Sem envio de e-mail: o admin entrega o e-mail e a senha provisória manualmente."})]}),e.jsxs("div",{className:"users-list users-list-stable","aria-busy":pe,children:[pe&&!T&&e.jsx(a,{icon:"⏳",title:"Carregando usuários",description:"Buscando acessos cadastrados nesta empresa."}),!pe&&ie&&e.jsx(a,{icon:"⚠️",title:"Não foi possível carregar usuários",description:ie}),!pe&&!ie&&T&&K.length===0&&e.jsx(a,{icon:"👥",title:"Nenhum usuário cadastrado",description:"Adicione usuários para dividir a operação com segurança e níveis de acesso."}),K.map(W=>{const Ee=W.user_id&&(l==null?void 0:l.id)&&W.user_id===l.id,fe=!W.user_id,P=d(W.perfil),ee=S[W.id]||[],Qe=ee.length===0;return e.jsxs("article",{className:"user-card userCard users-user-card",children:[e.jsxs("div",{className:"users-user-card-header",children:[e.jsxs("div",{className:"user-main-info userInfo users-user-identity",children:[e.jsx("strong",{children:W.nome||W.email||"Usuário sem nome"}),e.jsx("small",{children:W.email||W.user_id||"Sem e-mail vinculado"}),e.jsxs("div",{className:"users-user-status-row",children:[Ee&&e.jsx("span",{className:"user-badge user-badge-self",children:"Você"}),fe&&e.jsx("span",{className:"user-badge user-badge-pending",children:"Pendente de vínculo"})]})]}),e.jsxs("div",{className:"users-user-controls",children:[e.jsx("span",{className:`roleBadge ${P}`,children:P}),e.jsx("select",{className:"user-role-select users-role-select",style:t.input,value:P,disabled:!B,onChange:Re=>ke(W,Re.target.value),children:ni.map(Re=>e.jsx("option",{value:Re.value,children:Re.label},Re.value))})]})]}),e.jsxs("div",{className:"user-branch-scope users-branch-scope-compact",children:[e.jsxs("div",{className:"user-branch-scope-header users-branch-header-compact",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Filiais permitidas"}),e.jsx("small",{children:Qe?"Acesso a todas as filiais da empresa.":`${ee.length} filial(is) selecionada(s).`})]}),e.jsx("button",{type:"button",className:"user-branch-clear",disabled:!B||te===W.id,onClick:()=>De(W),title:"Deixar o usuário com acesso a todas as filiais da empresa",children:"Todas"})]}),e.jsx("div",{className:"user-branch-list users-branch-chip-list",children:J.length===0?e.jsx("small",{children:"Nenhuma filial ativa cadastrada."}):J.map(Re=>{const Le=ee.includes(Re.id);return e.jsxs("label",{className:`user-branch-chip users-branch-chip ${Le?"selected":""}`,children:[e.jsx("input",{type:"checkbox",checked:Le,disabled:!B||te===W.id,onChange:()=>ze(W,Re.id)}),e.jsx("span",{children:Re.nome||Re.nome_filial||Re.descricao||"Filial"})]},Re.id)})})]}),B&&e.jsxs("div",{className:"user-actions users-user-actions",children:[e.jsx("button",{style:t.btnSecundario,onClick:()=>V(W),title:"Fallback por e-mail. O acesso principal agora é criação manual com senha provisória.",children:"Enviar link"}),e.jsx("button",{style:t.btnExcluir,disabled:Ee,onClick:()=>ue(W),title:Ee?"Você não pode remover o próprio acesso.":"Remover usuário",children:"Remover"})]})]},W.id||W.user_id||W.email)})]})]})]})}const Mi=c.createContext(null),Uo="df_empresa_ativa";function zl(){if(typeof window>"u")return null;try{return JSON.parse(window.localStorage.getItem(Uo)||"null")}catch{return null}}function si(t){if(!(typeof window>"u")){if(!(t!=null&&t.id)){window.localStorage.removeItem(Uo);return}window.localStorage.setItem(Uo,JSON.stringify(t))}}const Pl={sucesso:"Sucesso",success:"Sucesso",erro:"Atenção",error:"Atenção",alerta:"Atenção",warning:"Atenção",info:"Aviso"};function Rl(t){return t==="success"?"sucesso":t==="error"?"erro":t==="warning"?"alerta":t||"info"}function Fl({children:t}){const[a,o]=c.useState(!1),[i,n]=c.useState(()=>zl()),[l,d]=c.useState([]),[m,u]=c.useState(null),b=c.useRef(null),N=c.useCallback(k=>{const U=k!=null&&k.id?{id:k.id,nome:k.nome||"",perfil:k.perfil||"operador"}:null;n(U),si(U)},[]),v=c.useCallback(()=>{n(null),si(null)},[]),y=c.useCallback(()=>{b.current&&(window.clearTimeout(b.current),b.current=null),u(null)},[]),h=c.useCallback((k,U="info",ae={})=>{if(!k)return;const H=Rl(U),q=ae.duration??5200;b.current&&window.clearTimeout(b.current),u({id:Date.now(),message:String(k),type:H,title:ae.title||Pl[H]||"Aviso"}),b.current=window.setTimeout(()=>{u(null),b.current=null},q)},[]),$=c.useCallback(async k=>{o(!0);try{return await k()}finally{o(!1)}},[]),C=c.useMemo(()=>({globalLoading:a,setGlobalLoading:o,empresaAtiva:i,empresaId:(i==null?void 0:i.id)||null,perfilEmpresaAtiva:(i==null?void 0:i.perfil)||"",setEmpresaAtiva:N,limparEmpresaAtiva:v,empresasDisponiveis:l,setEmpresasDisponiveis:d,toast:m,showToast:h,hideToast:y,runWithLoading:$}),[a,i,l,m,h,y,$,N,v]);return e.jsx(Mi.Provider,{value:C,children:t})}function Ti(){const t=c.useContext(Mi);if(!t)throw new Error("useApp deve ser usado dentro do AppProvider");return t}function $l({onLogin:t}){const{showToast:a}=Ti(),[o,i]=c.useState(""),[n,l]=c.useState(""),[d,m]=c.useState(!1);async function u(b){if(b.preventDefault(),!o||!n){a("Informe e-mail e senha","erro");return}const N=cs();if(N){a(N,"erro");return}m(!0);const{data:v,error:y}=await I.auth.signInWithPassword({email:o,password:n});if(m(!1),y){a("E-mail ou senha inválidos","erro");return}const{error:h}=await I.rpc("vincular_usuario_logado");h&&console.warn("Não foi possível executar vínculo automático:",h.message),t(v.user)}return e.jsx("div",{style:Kt.page,children:e.jsxs("form",{style:Kt.card,onSubmit:u,children:[e.jsx("h1",{style:Kt.titulo,children:"Dona Flor Financeiro"}),e.jsx("p",{style:Kt.subtitulo,children:"Acesse sua conta para continuar"}),e.jsx("input",{style:Kt.input,type:"email",placeholder:"E-mail",value:o,onChange:b=>i(b.target.value)}),e.jsx("input",{style:Kt.input,type:"password",placeholder:"Senha",value:n,onChange:b=>l(b.target.value)}),e.jsx("button",{style:Kt.botao,disabled:d,children:d?"Entrando...":"Entrar"}),e.jsx("small",{style:Kt.ajuda,children:"Login seguro via Supabase Auth."})]})})}const Kt={page:{minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Arial"},card:{width:"100%",maxWidth:360,background:"#fff",borderRadius:18,padding:20,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",display:"flex",flexDirection:"column",gap:10},titulo:{margin:0,fontSize:26},subtitulo:{margin:"0 0 10px",color:"#666",fontSize:14},input:{width:"100%",padding:12,borderRadius:10,border:"1px solid #ccc",boxSizing:"border-box",fontSize:15},botao:{width:"100%",padding:12,borderRadius:10,border:"none",background:"#198754",color:"#fff",fontWeight:"bold",fontSize:15},ajuda:{color:"#666",textAlign:"center",marginTop:8}};function Ml({styles:t,nomeEmpresa:a,navegarPara:o,menuNavegacaoAberto:i,setMenuNavegacaoAberto:n,canSwitchCompany:l=!1,empresasDisponiveis:d=[],empresaId:m="",trocarEmpresaAtiva:u,trocandoEmpresa:b=!1,nomeUsuario:N,abrirPerfilUsuario:v,sairDoSistema:y}){const h=l&&d.length>0,$=d.find(C=>C.id===m);return e.jsxs("section",{className:"no-print top-shell top-shell-clean",style:t.usuarioTopo,children:[e.jsx("div",{className:"top-shell-context",children:e.jsxs("button",{className:"top-shell-logo",style:t.logoMarca,onClick:()=>o("dashboard"),title:"Ir para o dashboard",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:t.logoImagem}),e.jsxs("span",{children:[e.jsx("strong",{children:a||"Dona Flor"}),e.jsx("small",{children:"Gestão Financeira"})]})]})}),e.jsxs("div",{className:"top-shell-actions",style:t.usuarioAcoes,children:[h&&(d.length>1?e.jsxs("label",{className:"company-switcher",title:"Trocar empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("select",{value:m||"",disabled:b,onChange:C=>u==null?void 0:u(C.target.value),"aria-label":"Empresa ativa",children:d.map(C=>e.jsx("option",{value:C.id,children:C.nome||C.id},C.id))})]}):e.jsxs("div",{className:"company-switcher company-switcher-static",title:"Empresa ativa",children:[e.jsx("span",{children:"Empresa"}),e.jsx("strong",{children:($==null?void 0:$.nome)||a||"Empresa ativa"})]})),e.jsx("button",{type:"button",className:"top-user-profile-button top-user-profile-icon",title:`Meu perfil${typeof N=="function"?`: ${N()}`:""}`,onClick:()=>v==null?void 0:v(),"aria-label":"Abrir meu perfil",children:e.jsx("span",{"aria-hidden":"true",children:"👤"})}),e.jsx("button",{className:"mobile-menu-trigger",style:t.btnMenuTopo,onClick:()=>n(!i),children:"☰"})]})]})}function Tl({tela:t,icon:a,label:o,telaAtual:i,sidebarCompacta:n,navegarPara:l}){const d=t&&i===t;return e.jsxs("button",{className:d?"active":"",title:o,onClick:()=>l(t),children:[e.jsx("span",{className:"menu-icon",children:a}),!n&&e.jsx("span",{className:"menu-text",children:o})]})}function Dl({id:t,titulo:a,children:o,sidebarCompacta:i,gruposMenu:n,toggleGrupoMenu:l}){return e.jsxs("div",{className:"sidebar-group-clean",children:[e.jsxs("button",{className:"sidebar-group-toggle",onClick:()=>l(t),title:a,children:[e.jsx("span",{children:i?"•":a}),!i&&e.jsx("strong",{children:n[t]?"−":"+"})]}),(i||n[t])&&e.jsx("nav",{className:"desktop-sidebar-nav",children:o})]})}function Il({sidebarCompacta:t,setSidebarCompacta:a,nomeUsuario:o,normalizarPerfil:i,perfilUsuario:n,menuSections:l,telaAtual:d,navegarPara:m,gruposMenu:u,toggleGrupoMenu:b,sairDoSistema:N}){const v=o(),y=i(n||"usuário");return e.jsxs("aside",{className:`desktop-sidebar no-print ${t?"compacta":""}`,children:[e.jsxs("div",{className:"desktop-sidebar-brand sidebar-brand-clean",title:"DF Gestão Financeira",children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira"}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:"DF Gestão"}),e.jsx("small",{children:"Painel financeiro"})]})]}),e.jsxs("div",{className:"desktop-sidebar-user sidebar-user-clean",title:`${v} • ${y}`,children:[e.jsx("span",{className:"sidebar-user-avatar",children:String(v||"U").slice(0,1).toUpperCase()}),!t&&e.jsxs("div",{children:[e.jsx("strong",{children:v}),e.jsx("small",{children:y})]})]}),e.jsx("button",{className:"sidebar-collapse-btn sidebar-collapse-icon",onClick:()=>a(!t),title:t?"Expandir menu":"Recolher menu","aria-label":t?"Expandir menu":"Recolher menu",children:e.jsx("span",{className:"sidebar-collapse-arrow",children:t?"→":"←"})}),e.jsx("div",{className:"desktop-sidebar-scroll",children:l.map(h=>e.jsx(Dl,{id:h.id,titulo:h.titulo,sidebarCompacta:t,gruposMenu:u,toggleGrupoMenu:b,children:h.items.map($=>e.jsx(Tl,{tela:$.tela,icon:$.icon,label:$.label,telaAtual:d,sidebarCompacta:t,navegarPara:m},$.tela))},h.id))}),e.jsx("div",{className:"desktop-sidebar-spacer"}),e.jsx("nav",{className:"desktop-sidebar-nav sidebar-exit",children:e.jsxs("button",{onClick:N,title:"Sair",children:[e.jsx("span",{className:"menu-icon",children:"🚪"}),!t&&e.jsx("span",{children:"Sair"})]})})]})}function Al({visible:t,styles:a,setMenuNavegacaoAberto:o,nomeUsuario:i,nomeUsuarioAtual:n,normalizarPerfil:l,perfilUsuario:d,menuSections:m,navegarPara:u,sairDoSistema:b,canSwitchCompany:N=!1,empresasDisponiveis:v=[],empresaId:y="",trocarEmpresaAtiva:h,trocandoEmpresa:$=!1,abrirPerfilUsuario:C}){if(!t)return null;const k=N&&v.length>0,U=v.find(q=>q.id===y),ae=n||(typeof i=="function"?i():i)||"usuário",H=(q,ne,G,Z)=>e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:Z,children:[e.jsx("span",{children:q}),e.jsxs("div",{children:[e.jsx("strong",{children:ne}),e.jsx("small",{children:G})]})]});return e.jsx("div",{className:"no-print mobile-menu-backdrop",style:a.menuBackdrop,onClick:()=>o(!1),onTouchMove:q=>q.preventDefault(),children:e.jsxs("div",{className:"mobile-menu-panel",style:a.menuNavegacao,role:"dialog","aria-label":"Menu de navegação",onClick:q=>q.stopPropagation(),onWheel:q=>q.stopPropagation(),onTouchMove:q=>q.stopPropagation(),children:[e.jsxs("div",{style:a.menuPerfil,children:[e.jsx("img",{src:"/icon-192.png",alt:"DF Gestão Financeira",style:a.menuPerfilIcone}),e.jsxs("div",{children:[e.jsx("strong",{children:ae}),e.jsx("small",{children:l(d||"usuário")})]})]}),k&&e.jsxs("div",{className:"mobile-company-switcher",style:{margin:"12px 0 18px",padding:"12px 14px",border:"1px solid rgba(20, 184, 166, 0.22)",borderRadius:18,background:"rgba(240, 253, 250, 0.9)",display:"grid",gap:8},children:[e.jsx("span",{style:{fontSize:11,fontWeight:900,color:"#0f766e",textTransform:"uppercase",letterSpacing:".08em"},children:"Empresa ativa"}),v.length>1?e.jsx("select",{value:y||"",disabled:$,onChange:q=>{h==null||h(q.target.value),o(!1)},"aria-label":"Empresa ativa",style:{width:"100%",border:"0",background:"transparent",color:"#111827",fontWeight:900,fontSize:15,outline:"none"},children:v.map(q=>e.jsx("option",{value:q.id,children:q.nome||q.id},q.id))}):e.jsx("strong",{style:{color:"#111827",fontSize:15},children:(U==null?void 0:U.nome)||"Empresa ativa"})]}),e.jsxs("button",{type:"button",style:a.menuNavItem,onClick:()=>{o(!1),C==null||C()},children:[e.jsx("span",{children:"👤"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Meu perfil"}),e.jsx("small",{children:"Editar nome do usuário"})]})]}),m.map((q,ne)=>e.jsxs("details",{className:"mobile-menu-group",open:ne===0,children:[e.jsx("summary",{children:q.titulo}),q.items.map(G=>H(G.icon,G.label,G.desc,()=>u(G.tela))),q.id==="sistema"&&e.jsxs("button",{type:"button",style:a.menuSairItem,onClick:b,children:[e.jsx("span",{children:"🚪"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Sair"}),e.jsx("small",{children:"Encerrar sessão"})]})]})]},q.id))]})})}function Bl({styles:t,editandoContaId:a,descricao:o,setDescricao:i,valor:n,setValor:l,dataVencimento:d,setDataVencimento:m,centroCustoId:u,setCentroCustoId:b,centros:N,filialId:v,setFilialId:y,filiais:h,observacaoConta:$,setObservacaoConta:C,contaRecorrente:k,setContaRecorrente:U,tipoRecorrencia:ae,setTipoRecorrencia:H,diaVencimentoRecorrencia:q,setDiaVencimentoRecorrencia:ne,fecharConta:G,salvarConta:Z,primeiraLetraMaiuscula:A,limitarDataInput:M,formatarDataParaBanco:X,fecharNota:he,setModalCentro:ce,setMenuAberto:ye,setMenuNavegacaoAberto:_e}){function se(){G(),he(),ce(!1),ye(!1),_e(!1)}return e.jsx("div",{style:t.overlay,onClick:se,children:e.jsxs("div",{style:t.modal,onClick:w=>w.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Conta":"Nova Conta"}),e.jsx("input",{style:t.inputModal,placeholder:"Descrição",value:o,onChange:w=>i(A(w.target.value))}),e.jsx("input",{style:t.inputModal,placeholder:"Valor. Ex: 150,90",value:n,onChange:w=>l(w.target.value)}),e.jsx("input",{style:t.inputModal,type:"date",value:d,onChange:w=>m(M(w.target.value))}),e.jsxs("select",{style:t.inputModal,value:v,onChange:w=>y(w.target.value),children:[e.jsx("option",{value:"",children:"Filial / unidade"}),(h||[]).map(w=>e.jsx("option",{value:w.id,children:w.nome},w.id))]}),e.jsxs("select",{style:t.inputModal,value:u,onChange:w=>b(w.target.value),children:[e.jsx("option",{value:"",children:"Centro de custo"}),N.map(w=>e.jsx("option",{value:w.id,children:w.nome},w.id))]}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Observação ou comentário da conta...",value:$,onChange:w=>C(A(w.target.value))}),e.jsxs("div",{className:"recurrence-box",style:t.blocoRecorrenciaConta,children:[e.jsxs("label",{className:"checkbox-row-fix",style:t.switchLinhaCompacta,children:[e.jsxs("span",{children:[e.jsx("strong",{children:"🔁 Conta recorrente"}),e.jsx("small",{style:t.textoAjuda,children:"Ideal para aluguel, internet, sistema, mensalidades e contas fixas."})]}),e.jsx("input",{type:"checkbox",checked:k,onChange:w=>{const pe=w.target.checked;U(pe),pe&&d&&ne(String(Number(X(d).slice(8,10))))}})]}),k&&e.jsxs("div",{className:"recurrence-fields",children:[e.jsx("select",{style:t.inputModal,value:ae,onChange:w=>H(w.target.value),children:e.jsx("option",{value:"mensal",children:"Mensal"})}),e.jsx("input",{style:t.inputModal,type:"number",min:"1",max:"31",placeholder:"Dia de vencimento mensal. Ex: 5",value:q||(d?String(Number(X(d).slice(8,10))):""),onChange:w=>ne(w.target.value)}),e.jsx("small",{style:t.textoAjuda,children:"O sistema criará automaticamente essa conta no mês vigente quando ela ainda não existir."})]})]}),e.jsx("button",{style:t.btnSalvar,type:"button",onClick:w=>{w.preventDefault(),w.stopPropagation(),Z()},children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,type:"button",onClick:G,children:"Cancelar"})]})})}function ql({styles:t,editandoNotaId:a,tituloNota:o,setTituloNota:i,prioridadeNota:n,setPrioridadeNota:l,dataEventoNota:d,setDataEventoNota:m,conteudoNota:u,setConteudoNota:b,filialNotaId:N,setFilialNotaId:v,filiais:y,salvarNota:h,fecharNota:$,fecharConta:C,setModalCentro:k,setMenuAberto:U,setMenuNavegacaoAberto:ae,primeiraLetraMaiuscula:H,limitarDataInput:q}){function ne(){C(),$(),k(!1),U(!1),ae(!1)}return e.jsx("div",{style:t.overlay,onClick:ne,children:e.jsxs("div",{style:t.modal,onClick:G=>G.stopPropagation(),children:[e.jsx("h3",{children:a?"Editar Nota":"Nova Nota"}),e.jsx("input",{style:t.inputModal,placeholder:"Título",value:o,onChange:G=>i(H(G.target.value))}),e.jsxs("select",{style:t.inputModal,value:n,onChange:G=>l(G.target.value),children:[e.jsx("option",{value:"normal",children:"Prioridade normal"}),e.jsx("option",{value:"urgente",children:"Urgente"}),e.jsx("option",{value:"critico",children:"Crítico"})]}),e.jsxs("select",{style:t.inputModal,value:N,onChange:G=>v(G.target.value),children:[e.jsx("option",{value:"",children:"Todas as filiais"}),(y||[]).map(G=>e.jsx("option",{value:G.id,children:G.nome},G.id))]}),e.jsx("input",{style:t.inputModal,type:"date",value:d,onChange:G=>m(q(G.target.value))}),e.jsx("textarea",{style:t.textareaModal,placeholder:"Conteúdo...",value:u,onChange:G=>b(G.target.value)}),e.jsx("button",{style:t.btnSalvar,onClick:h,children:"Salvar"}),e.jsx("button",{style:t.btnCancelar,onClick:$,children:"Cancelar"})]})})}function Ll({styles:t,novoCentro:a,setNovoCentro:o,salvarCentro:i,centros:n,abrirConfirmacao:l,excluirCentro:d,fecharConta:m,fecharNota:u,setModalCentro:b,setMenuAberto:N,setMenuNavegacaoAberto:v}){function y(){m(),u(),b(!1),N(!1),v(!1)}return e.jsx("div",{style:t.overlay,onClick:y,children:e.jsxs("div",{style:t.modal,onClick:h=>h.stopPropagation(),children:[e.jsx("h3",{children:"Centros de Custo"}),e.jsx("input",{style:t.inputModal,placeholder:"Novo centro",value:a,onChange:h=>o(h.target.value),autoFocus:!0}),e.jsx("button",{style:t.btnSalvar,onClick:i,children:"Salvar Centro"}),n.map(h=>e.jsxs("div",{style:t.itemCentro,children:[e.jsx("span",{children:h.nome}),e.jsx("button",{style:t.btnMiniExcluir,onClick:()=>l({titulo:"Excluir centro de custo",mensagem:`Deseja excluir o centro ${h.nome}?`,textoConfirmar:"Excluir",tipo:"perigo",acao:()=>d(h.id)}),children:"excluir"})]},h.id)),e.jsx("button",{style:t.btnCancelar,onClick:()=>b(!1),children:"Fechar"})]})})}function Ul({styles:t,confirmacao:a,fecharConfirmacao:o,executarConfirmacao:i}){return a!=null&&a.aberto?e.jsx("div",{style:t.overlayConfirmacao,children:e.jsxs("div",{style:t.modalConfirmacao,children:[e.jsx("div",{style:t.confirmacaoIcone,children:a.tipo==="perigo"?"⚠️":a.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:t.confirmacaoTitulo,children:a.titulo}),e.jsx("p",{style:t.confirmacaoTexto,children:a.mensagem}),e.jsxs("div",{style:t.confirmacaoAcoes,children:[e.jsx("button",{style:t.btnConfirmarCancelar,onClick:o,children:"Cancelar"}),e.jsx("button",{style:{...t.btnConfirmarAcao,background:a.tipo==="perigo"?"#dc3545":a.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:i,children:a.textoConfirmar})]})]})}):null}function Ol({nome:t,setNome:a,email:o,salvando:i,onClose:n,onSave:l}){return e.jsx("div",{className:"profile-modal-backdrop",role:"presentation",onClick:n,children:e.jsxs("div",{className:"profile-modal-card",role:"dialog","aria-modal":"true","aria-label":"Meu perfil",onClick:d=>d.stopPropagation(),children:[e.jsxs("div",{className:"profile-modal-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Perfil"}),e.jsx("h2",{children:"Meu perfil"})]}),e.jsx("button",{type:"button",onClick:n,"aria-label":"Fechar",children:"×"})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"Nome de exibição"}),e.jsx("input",{value:t,onChange:d=>a(d.target.value),placeholder:"Digite seu nome",autoFocus:!0,maxLength:80})]}),e.jsxs("label",{className:"profile-modal-field",children:[e.jsx("span",{children:"E-mail"}),e.jsx("input",{value:o||"",readOnly:!0})]}),e.jsxs("div",{className:"profile-modal-actions",children:[e.jsx("button",{type:"button",className:"profile-modal-cancel",onClick:n,disabled:i,children:"Cancelar"}),e.jsx("button",{type:"button",className:"profile-modal-save",onClick:l,disabled:i,children:i?"Salvando...":"Salvar perfil"})]})]})})}function li({visible:t,message:a="Carregando..."}){return t?e.jsx("div",{className:"global-loader-overlay",role:"status","aria-live":"polite",children:e.jsxs("div",{className:"global-loader-card",children:[e.jsx("div",{className:"global-loader-spinner"}),e.jsx("span",{children:a})]})}):null}function Ao({toast:t,onClose:a}){if(!t)return null;const o=t.type||"info",i=e.jsxs("div",{className:`app-toast app-toast-${o} app-toast-global`,role:o==="erro"?"alert":"status","aria-live":o==="erro"?"assertive":"polite",onClick:a,children:[e.jsx("div",{className:`app-toast-icon app-toast-icon-${o}`,children:o==="erro"?"!":o==="sucesso"?"✓":o==="alerta"?"!":"i"}),e.jsxs("div",{className:"app-toast-content",children:[e.jsx("strong",{children:t.title||(o==="erro"?"Atenção":"Aviso")}),e.jsx("span",{children:t.message})]}),e.jsx("button",{type:"button",className:"app-toast-close","aria-label":"Fechar aviso",onClick:n=>{n.stopPropagation(),a==null||a()},children:"×"})]});return typeof document>"u"?i:rs.createPortal(i,document.body)}const Di=c.createContext(null);function di({children:t,contas:a=[],contasFiltradas:o=[],navegarPara:i}){const[n,l]=c.useState(!1),[d,m]=c.useState(""),u=c.useMemo(()=>_i({contas:a,contasFiltradas:o}),[a,o]),b=c.useMemo(()=>({open:n,setOpen:l,toggle:()=>l(N=>!N),close:()=>l(!1),intelligence:u,lastQuestion:d,setLastQuestion:m,navegarPara:i}),[n,u,d,i]);return e.jsx(Di.Provider,{value:b,children:t})}function $t(){const t=c.useContext(Di);if(!t)throw new Error("useCopilot deve ser usado dentro de CopilotProvider");return t}function ci(){const{open:t,toggle:a,intelligence:o}=$t(),i=o.totals.vencido>0;return t?null:e.jsxs("button",{className:`copilot-floating-button no-print ${i?"has-risk":""}`,type:"button",onClick:n=>{n.preventDefault(),n.stopPropagation(),a()},"aria-label":"Abrir Copilot IA",children:[e.jsx("span",{children:"✨"}),e.jsx("strong",{children:"Copilot IA"}),i&&e.jsx("i",{})]})}function lo(t){return Number(t||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}function Vl(){const{intelligence:t}=$t(),{score:a,status:o,executiveSummary:i,totals:n}=t;return e.jsxs("section",{className:`copilot-card copilot-score-${o.tone}`,children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Executive AI Summary"}),e.jsxs("strong",{children:[a,"/100"]})]}),e.jsx("p",{children:i}),e.jsxs("div",{className:"copilot-metrics",children:[e.jsxs("div",{children:[e.jsx("small",{children:"Total"}),e.jsx("b",{children:lo(n.total)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Pendente"}),e.jsx("b",{children:lo(n.pendente)})]}),e.jsxs("div",{children:[e.jsx("small",{children:"Vencido"}),e.jsx("b",{children:lo(n.vencido)})]})]})]})}function Gl(){const{intelligence:t,navegarPara:a,close:o}=$t();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Smart Priority Engine"}),e.jsx("strong",{children:t.priorities.length})]}),e.jsx("div",{className:"copilot-priority-list",children:t.priorities.map((i,n)=>e.jsxs("article",{className:`copilot-priority copilot-priority-${i.tone}`,children:[e.jsxs("div",{children:[e.jsxs("small",{children:[i.level," impacto · ",i.impact]}),e.jsx("strong",{children:i.title}),e.jsx("p",{children:i.description})]}),e.jsx("button",{type:"button",onClick:()=>{a==null||a(i.action.includes("Relatórios")?"relatorios":"contas"),o()},children:i.action})]},`${i.title}-${n}`))})]})}function Wl(){const{intelligence:t}=$t();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Insights IA"}),e.jsx("strong",{children:"Live"})]}),e.jsx("div",{className:"copilot-insights",children:t.insights.map(a=>e.jsxs("p",{children:["✦ ",a]},a))})]})}function Hl(){const{intelligence:t}=$t();return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Recomendações acionáveis"}),e.jsx("strong",{children:t.recomendacoes.length})]}),e.jsx("div",{className:"copilot-recommendations",children:t.recomendacoes.map((a,o)=>e.jsxs("p",{children:[e.jsx("b",{children:o+1}),a]},`${a}-${o}`))})]})}function Kl(){const{intelligence:t}=$t(),a=t.rankingCentros||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Drill-down analytics"}),e.jsxs("strong",{children:["Top ",a.length||0]})]}),e.jsx("div",{className:"copilot-drilldown",children:a.length?a.map(o=>e.jsxs("article",{children:[e.jsxs("div",{children:[e.jsx("strong",{children:o.nome}),e.jsxs("small",{children:[lo(o.total)," · ",o.peso,"% do recorte · risco ",o.risco,"%"]})]}),e.jsx("span",{style:{width:`${Math.max(6,o.peso)}%`}})]},o.nome)):e.jsx("p",{children:"Sem centros suficientes para drill-down no recorte atual."})})]})}function Yl(){const{intelligence:t}=$t(),a=t.narrativa||{},o=[["Liquidez",a.liquidez],["Concentração",a.concentracao],["Curto prazo",a.curtoPrazo],["Comportamento",a.comportamento]].filter(([,i])=>i);return e.jsxs("section",{className:"copilot-card copilot-narrative-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"AI Narrative 11.8"}),e.jsx("strong",{children:"Contextual"})]}),e.jsx("p",{children:a.parecer||t.executiveSummary}),e.jsx("div",{className:"copilot-insights",children:o.map(([i,n])=>e.jsxs("p",{children:[e.jsxs("b",{children:[i,":"]})," ",n]},i))})]})}function Xl(){var o;const{intelligence:t}=$t(),a=((o=t.narrativa)==null?void 0:o.anomalias)||[];return e.jsxs("section",{className:"copilot-card",children:[e.jsxs("div",{className:"copilot-card-head",children:[e.jsx("span",{children:"Anomalias contextuais"}),e.jsx("strong",{children:a.length})]}),e.jsx("div",{className:"copilot-insights",children:a.map((i,n)=>e.jsxs("p",{children:["⚠ ",i]},`${i}-${n}`))})]})}function Ql(){const{intelligence:t,setLastQuestion:a}=$t();return e.jsxs("section",{className:"copilot-card copilot-questions-card",children:[e.jsx("span",{className:"copilot-mini-label",children:"Perguntas rápidas"}),e.jsx("div",{className:"copilot-questions",children:t.quickQuestions.map(o=>e.jsx("button",{type:"button",onClick:()=>a(o),children:o},o))})]})}function pi(){var n;const{open:t,close:a,intelligence:o,lastQuestion:i}=$t();return t?e.jsxs("div",{className:"copilot-shell no-print",onClick:l=>l.stopPropagation(),children:[e.jsx("button",{className:"copilot-backdrop",type:"button","aria-label":"Fechar Copilot",onClick:a}),e.jsxs("aside",{className:"copilot-drawer","aria-label":"Painel Copilot IA",children:[e.jsxs("header",{className:"copilot-header",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Copilot IA 11.8"}),e.jsx("h2",{children:"Sistema Operacional Financeiro Inteligente"}),e.jsxs("p",{children:["Status: ",o.status.label," · Score ",o.score,"/100"]}),e.jsxs("div",{className:"copilot-live-indicator",children:[e.jsx("b",{})," Analisando dados em tempo real"]})]}),e.jsx("button",{type:"button",onClick:a,"aria-label":"Fechar",children:"×"})]}),e.jsxs("main",{className:"copilot-content",children:[e.jsx(Vl,{}),e.jsx(Yl,{}),e.jsx(Gl,{}),e.jsx(Xl,{}),e.jsx(Kl,{}),e.jsx(Hl,{}),e.jsx(Wl,{}),i&&e.jsxs("section",{className:"copilot-card copilot-answer",children:[e.jsx("span",{className:"copilot-mini-label",children:"Pergunta selecionada"}),e.jsx("strong",{children:i}),e.jsx("p",{children:((n=o.respostas)==null?void 0:n[i])||"Resposta executiva gerada a partir dos KPIs atuais."})]}),e.jsx(Ql,{})]})]})]}):null}function mi(){return e.jsx("style",{children:`
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
    `})}const Jl={semEmpresa:"Usuário sem empresa vinculada. Vincule este usuário em df_usuarios_empresas antes de continuar."};function Zl(t){var a,o;return t!=null&&t.empresa_id?{empresaId:t.empresa_id,perfil:Yt(t.perfil),nomeEmpresa:t.nome_empresa||((a=t.empresas)==null?void 0:a.nome)||((o=t.df_empresas)==null?void 0:o.nome)||"",origem:"df_usuarios_empresas"}:null}async function ed(){const{error:t}=await I.rpc("vincular_usuario_logado");t&&console.warn("Não foi possível executar vínculo automático:",t.message)}async function td(t){if(!t)return null;const{data:a,error:o}=await I.from("df_usuarios_empresas").select("empresa_id, perfil").eq("user_id",t).limit(1);if(o)throw o;const i=Array.isArray(a)?a[0]:a;if(!(i!=null&&i.empresa_id))return null;let n="";const{data:l,error:d}=await I.from("df_empresas").select("nome").eq("id",i.empresa_id).limit(1);if(d)console.warn("Não foi possível carregar o nome da empresa ativa:",d.message);else{const m=Array.isArray(l)?l[0]:l;n=(m==null?void 0:m.nome)||""}return Zl({...i,nome_empresa:n})}async function ui(t){if(!t)return"";const{data:a,error:o}=await I.from("profiles").select("name").eq("id",t).limit(1);if(o)return console.warn("Não foi possível carregar o nome do perfil:",o.message),"";const i=Array.isArray(a)?a[0]:a;return(i==null?void 0:i.name)||""}function Mt(t){if(!t)throw new Error("Empresa não identificada para esta operação.");return t}function Ii(t){if(!(t!=null&&t.empresa_id))throw new Error("Operação bloqueada: empresa_id ausente no payload.");return t}function ad(t){return!Array.isArray(t)||t.length===0||t.forEach(Ii),t}function na(t,a,o,i="*"){return Mt(o),t.from(a).select(i).eq("empresa_id",o)}function $a(t,a,o,i={}){Ii(o);let n=t.from(a).insert([o]);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function od(t,a,o,i={}){ad(o);let n=t.from(a).insert(o);return i.select&&(n=n.select(i.select===!0?"*":i.select)),n}function Ma(t,a,o,i,n){return Mt(i),t.from(a).update(n).eq("id",o).eq("empresa_id",i)}function rd(t,a,o,i){return Mt(i),t.from(a).delete().eq("id",o).eq("empresa_id",i)}async function id(t,a){return Mt(a),na(t,"df_contas",a,"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").or("excluido.is.null,excluido.eq.false").order("data_vencimento")}async function nd(t,a,o,i){return Mt(a),na(t,"df_contas",a,"id, descricao, valor, data_vencimento, recorrencia_id, excluido, excluido_em").gte("data_vencimento",o).lte("data_vencimento",i)}async function sd(t,a){return Mt(a),na(t,"df_contas_recorrentes",a).eq("ativo",!0)}async function ld(t,a,o){if(!a)return null;Mt(o);const{data:i,error:n}=await t.from("df_centros_custo").select("id").eq("id",a).eq("empresa_id",o).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function dd(t,a,o){if(!a)return null;Mt(o);const{data:i,error:n}=await t.from("df_filiais").select("id").eq("id",a).eq("empresa_id",o).eq("ativo",!0).maybeSingle();return n||!(i!=null&&i.id)?null:i.id}async function cd(t,a){return od(t,"df_contas",a,{select:"*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)"})}async function pd(t,a){return $a(t,"df_contas",a,{select:!0})}async function po(t,a,o,i){return Ma(t,"df_contas",a,o,i)}async function md(t,a,o){return Mt(o),na(t,"df_contas_recorrentes",o).eq("id",a).maybeSingle()}async function ud(t,a,o){return Mt(a),na(t,"df_contas_recorrentes",a).eq("ativo",!0).eq("dia_vencimento",o).order("created_at",{ascending:!1})}async function fi(t,a){const o=await $a(t,"df_contas_recorrentes",a,{select:!0});return Bi(o.error,a)?$a(t,"df_contas_recorrentes",qi(a),{select:!0}):o}async function Ai(t,a,o,i){const n=await Ma(t,"df_contas_recorrentes",a,o,i);return Bi(n.error,i)?Ma(t,"df_contas_recorrentes",a,o,qi(i)):n}async function Pa(t,a,o,i){return po(t,a,o,{recorrencia_id:i})}async function fd(t,a,o){return Ai(t,a,o,{ativo:!1})}async function xi(t,a,o,i){return po(t,a,o,{status:i})}async function xd(t,a,o){return po(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}function Bi(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&hd(t))}function hd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function qi(t){const{filial_id:a,...o}=t||{};return o}function gd(){const[t,a]=c.useState([]),[o,i]=c.useState([]),[n,l]=c.useState(""),[d,m]=c.useState("todas"),[u,b]=c.useState(""),[N,v]=c.useState(""),[y,h]=c.useState(""),[$,C]=c.useState(""),[k,U]=c.useState(""),[ae,H]=c.useState(!0),[q,ne]=c.useState(!1),[G,Z]=c.useState(null),[A,M]=c.useState(""),[X,he]=c.useState(""),[ce,ye]=c.useState(""),[_e,se]=c.useState(""),[w,pe]=c.useState(""),[T,ie]=c.useState(""),[K,J]=c.useState(!1),[S,te]=c.useState(!1),[De,ze]=c.useState(!1),[ke,V]=c.useState("1"),[ue,qe]=c.useState(!1),[B,W]=c.useState("mensal"),[Ee,fe]=c.useState(""),[P,ee]=c.useState(null);function Qe(){Z(null),M(""),he(""),ye(""),se(""),pe(""),ie(""),J(!1),te(!1),ze(!1),V("1"),qe(!1),W("mensal"),fe(""),ee(null)}async function Re(Ce,Q,O){return O?ld(Ce,O,Q):null}async function Le(Ce,Q,O){return O?dd(Ce,O,Q):null}async function Tt({supabase:Ce,empresaAtual:Q,contasAtuais:O,configWhatsapp:D,configEmail:me,configPush:Fe,diasAlertaContas:Ke,diasAvisoPadrao:Ye}){const Ve=new Date,Xe=Ve.getFullYear(),Ge=Ve.getMonth()+1,{data:nt,error:xt}=await sd(Ce,Q);if(xt)return console.warn("Não foi possível carregar contas recorrentes:",xt.message),O;const Lt=`${Xe}-${String(Ge).padStart(2,"0")}-01`,Ut=`${Xe}-${String(Ge).padStart(2,"0")}-${String(new Date(Xe,Ge,0).getDate()).padStart(2,"0")}`,{data:Dt,error:It}=await nd(Ce,Q,Lt,Ut);It&&console.warn("Não foi possível validar contas recorrentes existentes:",It.message);const _t=Array.isArray(Dt)?Dt:O,yt=[];for(const Oe of nt||[]){if(!Xs(Oe,Xe,Ge))continue;const Je=Ys(Xe,Ge,Oe.dia_vencimento);if(_t.some(le=>{const be=Oe.id&&le.recorrencia_id===Oe.id,xe=String(le.descricao||"").trim().toLowerCase()===String(Oe.descricao||"").trim().toLowerCase();return le.data_vencimento===Je&&(be||xe)}))continue;const j=await Re(Ce,Q,Oe.centro_custo_id),L=await Le(Ce,Q,Oe.filial_id);yt.push({empresa_id:Q,descricao:Oe.descricao,valor:Number(Oe.valor||0),data_vencimento:Je,vencimento:Je,centro_custo_id:j,filial_id:L,observacao:Oe.observacao||null,recorrencia_id:Oe.id,status:"pendente",excluido:!1,enviar_whatsapp:D,enviar_email:me,enviar_push:Fe,dias_aviso:Number(Ke||Ye||1)})}if(yt.length===0)return O;const{data:At,error:pt}=await cd(Ce,yt);return pt?(console.warn("Não foi possível gerar contas recorrentes:",pt.message),O):[...O,...At||[]].sort((Oe,Je)=>String(Oe.data_vencimento||"").localeCompare(String(Je.data_vencimento||"")))}async function et(Ce){const{supabase:Q,empresaAtual:O,avisarErro:D,configWhatsapp:me,configEmail:Fe,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ve}=Ce;if(!O)return;const{data:Xe,error:Ge}=await id(Q,O);if(Ge){D(Ge);return}const xt=await Tt({supabase:Q,empresaAtual:O,contasAtuais:Xe||[],configWhatsapp:me,configEmail:Fe,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ve});a(xt)}function ct(Ce){const{setMenuAberto:Q,setMenuNavegacaoAberto:O,configWhatsapp:D,configEmail:me,configPush:Fe,diasAvisoPadrao:Ke}=Ce;Q(!1),O(!1),Qe(),J(D),te(me),ze(Fe),V(String(Ke||1)),ne(!0)}async function Ue({supabase:Ce,empresaId:Q,conta:O,dataBanco:D,descricaoConta:me}){if(!Ce||!Q||!O)return null;if(O.recorrencia_id){const{data:Ge,error:nt}=await md(Ce,O.recorrencia_id,Q);if(!nt&&Ge)return Ge}const Fe=Number(String(D||O.data_vencimento||"").slice(8,10));if(!Fe)return null;const{data:Ke,error:Ye}=await ud(Ce,Q,Fe);if(Ye||!Array.isArray(Ke))return null;const Ve=String(me||O.descricao||"").trim().toLowerCase(),Xe=Number(O.valor||0);return Ke.find(Ge=>{const nt=String(Ge.descricao||"").trim().toLowerCase()===Ve,xt=Number(Ge.valor||0)===Xe;return nt&&xt})||null}async function mt(Ce){const{conta:Q,supabase:O,empresaId:D,diasAvisoPadrao:me,formatarDataParaBanco:Fe}=Ce,Ke=Fe(Q.data_vencimento||""),Ye=Ke?String(Number(String(Ke).slice(8,10))):"";Z(Q.id),M(Q.descricao||""),he(Q.valor||""),ye(Q.data_vencimento||""),se(Q.centro_custo_id||""),pe(Q.filial_id||""),ie(Q.observacao||""),J(Q.enviar_whatsapp??!1),te(Q.enviar_email??!1),ze(Q.enviar_push??!1),V(String(Q.dias_aviso??me??1)),qe(!!Q.recorrencia_id),ee(Q.recorrencia_id||null),W("mensal"),fe(Ye),ne(!0);const Ve=await Ue({supabase:O,empresaId:D,conta:Q,dataBanco:Ke,descricaoConta:Q.descricao});Ve&&(qe(!0),ee(Ve.id),W(Ve.frequencia||Ve.tipo_recorrencia||"mensal"),fe(String(Ve.dia_vencimento||Ye||"")),!Q.recorrencia_id&&Ve.id&&await Pa(O,Q.id,D,Ve.id))}function Ct(){ne(!1),Qe()}async function tt(Ce){const{supabase:Q,empresaId:O,mostrarAviso:D,configWhatsapp:me,configEmail:Fe,configPush:Ke,diasAlertaContas:Ye,diasAvisoPadrao:Ve,primeiraLetraMaiuscula:Xe,converterValor:Ge,formatarDataParaBanco:nt,erroEhSessaoExpirada:xt,limparEstadoAutenticacao:Lt,setUsuarioLogado:Ut,buscarContas:Dt,fecharConta:It}=Ce;if(!O){D("Usuário sem empresa vinculada.","erro");return}if(!A||!X||!ce){D("Preencha descrição, valor e vencimento.","erro");return}const _t=await Re(Q,O,_e),yt=await Le(Q,O,w),At={descricao:Xe(A.trim()),valor:Ge(X),data_vencimento:nt(ce),vencimento:nt(ce),centro_custo_id:_t,filial_id:yt,observacao:T.trim()||null,enviar_whatsapp:K,enviar_email:S,enviar_push:De,dias_aviso:Number(ke||Ye||Ve||1),empresa_id:O};let pt;if(G){if(pt=(await po(Q,G,O,At)).error,!pt){const Je=nt(ce),s=Number(Ee||String(Je).slice(8,10));if(ue){if(!s||s<1||s>31){D("Informe um dia válido para a recorrência.","erro");return}const j={empresa_id:O,descricao:Xe(A.trim()),valor:Ge(X),centro_custo_id:_t,filial_id:yt,tipo_recorrencia:B||"mensal",dia_vencimento:s,data_inicio:Je,ativo:!0};if(P){const{error:L}=await Ai(Q,P,O,j);if(L){D("A conta foi atualizada, mas a recorrência não foi salva: "+L.message,"erro");return}const{error:le}=await Pa(Q,G,O,P);if(le){D("A recorrência foi atualizada, mas não foi vinculada à conta: "+le.message,"erro");return}}else{const{data:L,error:le}=await fi(Q,j);if(le){D("A conta foi atualizada, mas a recorrência não foi salva: "+le.message,"erro");return}const be=Array.isArray(L)?L[0]:L;let xe=be==null?void 0:be.id;if(!xe){const we=await Ue({supabase:Q,empresaId:O,conta:{descricao:Xe(A.trim()),valor:Ge(X),data_vencimento:Je},dataBanco:Je,descricaoConta:Xe(A.trim())});xe=we==null?void 0:we.id}if(!xe){D("A recorrência foi criada, mas o sistema não conseguiu localizar o vínculo.","erro");return}const{error:ge}=await Pa(Q,G,O,xe);if(ge){D("A recorrência foi criada, mas não foi vinculada à conta: "+ge.message,"erro");return}ee(xe),a(we=>we.map(de=>de.id===G?{...de,recorrencia_id:xe}:de))}}else P&&(await fd(Q,P,O),await Pa(Q,G,O,null))}}else{const Oe=await pd(Q,{...At,status:"pendente",excluido:!1});if(pt=Oe.error,!pt&&ue){const Je=nt(ce),s=Number(Ee||String(Je).slice(8,10));if(!s||s<1||s>31){D("Informe um dia válido para a recorrência.","erro");return}const{data:j,error:L}=await fi(Q,{empresa_id:O,descricao:Xe(A.trim()),valor:Ge(X),centro_custo_id:_t,filial_id:yt,tipo_recorrencia:B||"mensal",dia_vencimento:s,data_inicio:Je,ativo:!0});if(L)D("A conta foi criada, mas a recorrência não foi salva: "+L.message,"erro");else{const le=Array.isArray(j)?j[0]:j,be=Array.isArray(Oe.data)?Oe.data[0]:Oe.data;let xe=le==null?void 0:le.id;if(!xe&&(be!=null&&be.id)){const ge=await Ue({supabase:Q,empresaId:O,conta:be,dataBanco:Je,descricaoConta:Xe(A.trim())});xe=ge==null?void 0:ge.id}if(xe&&(be!=null&&be.id)){const{error:ge}=await Pa(Q,be.id,O,xe);if(ge){D("A recorrência foi criada, mas não foi vinculada à conta: "+ge.message,"erro");return}}}}}if(pt){xt(pt)?(await Q.auth.signOut(),Lt(),Ut(null),D("Sua sessão expirou. Faça login novamente.","erro")):D(pt.message,"erro");return}It(),await Dt(),D(G?"Conta atualizada com sucesso.":"Conta criada com sucesso.","sucesso")}async function qt(Ce){const{supabase:Q,id:O,empresaId:D,buscarContas:me,mostrarAviso:Fe}=Ce;await xi(Q,O,D,"pago"),await me(),Fe==null||Fe("Conta marcada como paga.","sucesso")}async function ft(Ce){const{supabase:Q,id:O,empresaId:D,buscarContas:me,mostrarAviso:Fe}=Ce;await xi(Q,O,D,"pendente"),await me(),Fe==null||Fe("Conta voltou para pendente.","sucesso")}async function Xt(Ce){const{supabase:Q,id:O,empresaId:D,avisarErro:me,buscarContas:Fe,buscarLixeira:Ke,mostrarAviso:Ye}=Ce,{error:Ve}=await xd(Q,O,D);if(Ve){me(Ve);return}await Promise.all([Fe(),Ke()]),Ye==null||Ye("Conta enviada para a lixeira.","sucesso")}return{contas:t,setContas:a,contasLixeira:o,setContasLixeira:i,busca:n,setBusca:l,filtroStatus:d,setFiltroStatus:m,filtroCentro:u,setFiltroCentro:b,filtroFilial:N,setFiltroFilial:v,filtroMes:y,setFiltroMes:h,dataInicial:$,setDataInicial:C,dataFinal:k,setDataFinal:U,loading:ae,setLoading:H,modalConta:q,setModalConta:ne,editandoContaId:G,setEditandoContaId:Z,descricao:A,setDescricao:M,valor:X,setValor:he,dataVencimento:ce,setDataVencimento:ye,centroCustoId:_e,setCentroCustoId:se,filialId:w,setFilialId:pe,observacaoConta:T,setObservacaoConta:ie,contaWhatsapp:K,setContaWhatsapp:J,contaEmail:S,setContaEmail:te,contaPush:De,setContaPush:ze,contaDiasAviso:ke,setContaDiasAviso:V,contaRecorrente:ue,setContaRecorrente:qe,tipoRecorrencia:B,setTipoRecorrencia:W,diaVencimentoRecorrencia:Ee,setDiaVencimentoRecorrencia:fe,recorrenciaContaId:P,setRecorrenciaContaId:ee,buscarContas:et,abrirNovaConta:ct,abrirEdicaoConta:mt,fecharConta:Ct,salvarConta:tt,marcarComoPago:qt,voltarParaPendente:ft,excluirConta:Xt}}async function bd(t,a){return na(t,"df_notas",a).eq("excluido",!1).order("created_at",{ascending:!1})}async function vd(t,a){return na(t,"df_notas",a).eq("excluido",!0).order("excluido_em",{ascending:!1})}async function jd(t,a){const o=await $a(t,"df_notas",a);return Li(o.error,a)?$a(t,"df_notas",Ui(a)):o}async function mo(t,a,o,i){const n=await Ma(t,"df_notas",a,o,i);return Li(n.error,i)?Ma(t,"df_notas",a,o,Ui(i)):n}async function yd(t,a,o){return mo(t,a,o,{excluido:!0,excluido_em:new Date().toISOString()})}async function wd(t,a,o){return mo(t,a.id,o,{concluida:!a.concluida})}async function kd(t,a,o){return mo(t,a,o,{excluido:!1,excluido_em:null})}async function Cd(t,a,o){return rd(t,"df_notas",a,o)}function Li(t,a){return!!(t&&a&&Object.prototype.hasOwnProperty.call(a,"filial_id")&&Nd(t))}function Nd(t){const a=String((t==null?void 0:t.message)||(t==null?void 0:t.details)||(t==null?void 0:t.hint)||"").toLowerCase();return a.includes("filial_id")&&(a.includes("schema cache")||a.includes("column")||a.includes("coluna"))}function Ui(t){const{filial_id:a,...o}=t||{};return o}function hi(t=[]){return t.map(a=>`${a.id||""}:${a.excluido_em||""}:${a.updated_at||""}:${a.titulo||""}`).join("|")}function Sd(t,a=[]){t((o=[])=>hi(o)===hi(a)?o:a)}function _d(){const[t,a]=c.useState([]),[o,i]=c.useState([]),[n,l]=c.useState(""),[d,m]=c.useState(!1),[u,b]=c.useState(null),[N,v]=c.useState(""),[y,h]=c.useState(""),[$,C]=c.useState("normal"),[k,U]=c.useState(""),[ae,H]=c.useState("");function q(){b(null),v(""),h(""),C("normal"),U(""),H("")}async function ne({supabase:se,empresaAtual:w,avisarErro:pe}){if(!w)return;const{data:T,error:ie}=await bd(se,w);if(ie){pe(ie);return}a(T||[])}async function G({supabase:se,empresaAtual:w,avisarErro:pe}){if(!w)return;const{data:T,error:ie}=await vd(se,w);if(ie){pe(ie);return}Sd(i,T||[])}function Z({setMenuAberto:se,setMenuNavegacaoAberto:w}){se(!1),w(!1),q(),m(!0)}function A(se){b(se.id),v(se.titulo||""),h(se.conteudo||""),C(se.prioridade||"normal"),U(se.data_evento||""),H(se.filial_id||""),m(!0)}function M(){m(!1),q()}async function X({supabase:se,empresaId:w,mostrarAviso:pe,avisarErro:T,buscarNotas:ie}){if(!w){pe("Usuário sem empresa vinculada.","erro");return}if(!N.trim()){pe("Digite o título da nota.","erro");return}const K={titulo:jt(N.trim()),conteudo:y.trim(),prioridade:$||"normal",data_evento:k||null,concluida:!1,empresa_id:w,filial_id:ae||null};let J;if(u?J=(await mo(se,u,w,K)).error:J=(await jd(se,K)).error,J){T(J);return}M(),await ie(),pe(u?"Nota atualizada com sucesso.":"Nota criada com sucesso.","sucesso")}async function he({supabase:se,id:w,empresaId:pe,avisarErro:T,buscarNotas:ie,buscarLixeira:K,mostrarAviso:J}){const{error:S}=await yd(se,w,pe);if(S){T(S);return}await Promise.all([ie(),K()]),J==null||J("Nota enviada para a lixeira.","sucesso")}async function ce({supabase:se,nota:w,empresaId:pe,avisarErro:T,buscarNotas:ie,mostrarAviso:K}){const{error:J}=await wd(se,w,pe);if(J){T(J);return}await ie(),K==null||K(w.concluida?"Nota reaberta.":"Nota concluída.","sucesso")}async function ye({supabase:se,id:w,empresaId:pe,avisarErro:T,buscarNotas:ie,buscarLixeira:K,mostrarAviso:J}){const{error:S}=await kd(se,w,pe);if(S){T(S);return}await Promise.all([ie(),K()]),J==null||J("Nota restaurada com sucesso.","sucesso")}async function _e({supabase:se,nota:w,empresaId:pe,avisarErro:T,buscarLixeira:ie,mostrarAviso:K}){const{error:J}=await Cd(se,w.id,pe);if(J){T(J);return}await ie(),K==null||K("Nota excluída definitivamente.","sucesso")}return{notas:t,setNotas:a,notasLixeira:o,setNotasLixeira:i,buscaNota:n,setBuscaNota:l,modalNota:d,setModalNota:m,editandoNotaId:u,setEditandoNotaId:b,tituloNota:N,setTituloNota:v,conteudoNota:y,setConteudoNota:h,prioridadeNota:$,setPrioridadeNota:C,dataEventoNota:k,setDataEventoNota:U,filialNotaId:ae,setFilialNotaId:H,buscarNotas:ne,buscarNotasLixeira:G,abrirNovaNota:Z,abrirEdicaoNota:A,fecharNota:M,salvarNota:X,excluirNota:he,alternarNotaConcluida:ce,restaurarNota:ye,excluirNotaDefinitivo:_e}}const Wo="df_sessao_segura",Ed=8*60*60*1e3,zd=30*60*1e3,Pd=25*60*1e3;function Bo(){try{return JSON.parse(localStorage.getItem(Wo)||"{}")}catch{return{}}}function gi(t){localStorage.setItem(Wo,JSON.stringify(t))}function Rd(){localStorage.removeItem(Wo)}function Fd({onClearAuthData:t,onSessionWarning:a,onShowMessage:o,onNavigateHome:i}={}){const n=c.useRef(!1),l=c.useRef(!1),[d,m]=c.useState(null),[u,b]=c.useState(!0),N=c.useCallback(()=>{const y=Bo();gi({inicio:y.inicio||Date.now(),ultimaAtividade:Date.now()}),n.current=!1},[]),v=c.useCallback(async(y,h="erro")=>{if(!l.current){l.current=!0,t==null||t(),m(null),b(!1),i==null||i();try{await I.auth.signOut()}finally{y&&(o==null||o(y,h)),window.setTimeout(()=>{l.current=!1},1200)}}},[t,i,o]);return c.useEffect(()=>{let y=!0;async function h(){try{const C=new Promise(ae=>{window.setTimeout(()=>ae({data:{session:null},error:new Error("Timeout ao validar sessão")}),8e3)}),{data:k,error:U}=await Promise.race([I.auth.getSession(),C]);if(!y)return;if(U||!(k!=null&&k.session)){t==null||t(),m(null);return}m(k.session.user)}catch(C){if(!y)return;console.warn("Falha ao validar sessão:",(C==null?void 0:C.message)||C),t==null||t(),m(null)}finally{y&&b(!1)}}h();const{data:$}=I.auth.onAuthStateChange((C,k)=>{b(!1),m((k==null?void 0:k.user)||null),k||t==null||t()});return()=>{y=!1,$.subscription.unsubscribe()}},[t]),c.useEffect(()=>{if(!d)return;const y=Date.now(),h=Bo();gi({inicio:h.inicio||y,ultimaAtividade:y});function $(){const U=Bo(),ae=Number(U.inicio||Date.now()),H=Number(U.ultimaAtividade||Date.now()),q=Date.now(),ne=q-ae,G=q-H;if(ne>=Ed){v("Sua sessão expirou por segurança. Faça login novamente.");return}if(G>=zd){v("Sua sessão foi encerrada por inatividade. Faça login novamente.");return}G>=Pd&&!n.current&&(n.current=!0,a==null||a(N))}const C=["click","keydown","mousemove","scroll","touchstart"];C.forEach(U=>window.addEventListener(U,N,{passive:!0}));const k=window.setInterval($,60*1e3);return()=>{C.forEach(U=>window.removeEventListener(U,N)),window.clearInterval(k)}},[v,a,N,d]),{usuarioLogado:d,setUsuarioLogado:m,carregandoAuth:u,setCarregandoAuth:b,encerrarSessao:v,registrarAtividadeSessao:N}}const co={MASTER:"master",ADMIN:"admin",GERENTE:"gerente",OPERADOR:"operador"},$d=new Set(["donafloradm@outlook.com"]);function Oo(t){return String(t||"").trim().toLowerCase()}function Md(t){const a=String(t).toLowerCase().trim();return["master","super_admin","superadmin","owner","dono"].includes(a)?co.MASTER:["admin","adm","administrador"].includes(a)?co.ADMIN:Yt(a)}function Td(t){return!(!t||t.ativo===!1||t.status&&String(t.status).toLowerCase()!=="ativo")}function Ra({perfilEmpresa:t="operador",master:a=null}={}){const o=Yt(t),i=a!=null&&a.isMaster?co.MASTER:o;return{perfilEmpresa:o,perfilGlobal:i,isMaster:!!(a!=null&&a.isMaster),canManageUsers:!!(a!=null&&a.isMaster||o==="admin"),canAccessSettings:!!(a!=null&&a.isMaster||["admin","gerente"].includes(o)),canManageCompanies:!!(a!=null&&a.isMaster),canSwitchCompany:!!(a!=null&&a.isMaster)}}async function qo({userId:t,email:a,perfilEmpresa:o="operador"}={}){const i=Oo(a),n=Ra({perfilEmpresa:o});if($d.has(i))return Ra({perfilEmpresa:o,master:{isMaster:!0}});if(!t&&!i)return n;try{const{data:l,error:d}=await I.from("df_usuarios_master").select("*").limit(100);if(d)return console.warn("Não foi possível consultar df_usuarios_master:",d.message),n;const m=(l||[]).find(u=>{const b=t&&u.user_id&&u.user_id===t,N=i&&Oo(u.email)===i;return(b||N)&&Td(u)});return m?Ra({perfilEmpresa:o,master:{isMaster:!0,perfil:Md(m.perfil||m.tipo||co.MASTER)}}):n}catch(l){return console.warn("Falha ao carregar permissões globais:",l.message),n}}async function Dd({isMaster:t}={}){if(!t)return[];const{data:a,error:o}=await I.from("df_empresas").select("id, nome, created_at").order("nome",{ascending:!0});if(o)throw o;return a||[]}async function bi({userId:t,email:a,isMaster:o}={}){if(o)return Dd({isMaster:o});const i=Oo(a);if(!t&&!i)return[];let n=I.from("df_usuarios_empresas").select("empresa_id, perfil, nome, email, user_id");t&&i?n=n.or(`user_id.eq.${t},email.eq.${i}`):t?n=n.eq("user_id",t):n=n.eq("email",i);const{data:l,error:d}=await n;if(d)throw d;const m=new Map;(l||[]).forEach(v=>{if(!(v!=null&&v.empresa_id))return;const y=Yt(v.perfil),h=m.get(v.empresa_id);m.set(v.empresa_id,{id:v.empresa_id,nome:(h==null?void 0:h.nome)||"",perfil:(h==null?void 0:h.perfil)==="admin"?h.perfil:y})});const u=Array.from(m.keys());if(u.length===0)return[];const{data:b,error:N}=await I.from("df_empresas").select("id, nome, created_at").in("id",u).order("nome",{ascending:!0});if(N)throw N;return(b||[]).forEach(v=>{const y=m.get(v.id);y&&m.set(v.id,{...y,nome:v.nome||y.nome||"Empresa",created_at:v.created_at})}),Array.from(m.values()).sort((v,y)=>String(v.nome||"").localeCompare(String(y.nome||"")))}const x={usuarioTopo:{background:"linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",border:"1px solid #d8eee9",borderRadius:18,padding:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 10px 24px rgba(15,118,110,0.10)",position:"relative",zIndex:20},logoMarca:{display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",padding:0,textAlign:"left",color:"#064e3b"},logoIcone:{width:42,height:42,borderRadius:14,background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"inset 0 0 0 1px #cfe8da"},logoImagem:{width:48,height:48,borderRadius:16,objectFit:"cover",background:"#0f766e",boxShadow:"0 8px 18px rgba(20,184,166,0.28)"},logoTexto:{display:"flex",flexDirection:"column",gap:2,lineHeight:1.05},usuarioAcoes:{display:"flex",alignItems:"center",gap:8},usuarioTexto:{display:"flex",flexDirection:"column",alignItems:"flex-end",fontSize:13,color:"#1f2937"},btnMenuTopo:{width:44,height:44,borderRadius:14,border:"1px solid #e5e7eb",background:"#ffffff",color:"#0f172a",fontSize:22,fontWeight:"bold",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 16px rgba(15,23,42,0.08)"},menuBackdrop:{position:"fixed",inset:0,background:"rgba(15, 23, 42, 0.22)",zIndex:4e3,display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:"76px 12px 12px 12px"},menuNavegacao:{width:"min(360px, 94vw)",height:"auto",maxHeight:"calc(100dvh - 96px)",overflowY:"auto",WebkitOverflowScrolling:"touch",overscrollBehavior:"contain",touchAction:"pan-y",background:"#ffffff",border:"1px solid #d8eee9",borderRadius:22,padding:14,display:"grid",gap:8,boxShadow:"0 24px 60px rgba(15,23,42,0.25)"},menuPerfil:{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:18,background:"linear-gradient(135deg, #ecfdf5, #f0fdfa)",color:"#064e3b",marginBottom:4},menuPerfilIcone:{width:46,height:46,borderRadius:16,objectFit:"cover",background:"#0f766e"},menuSecaoTitulo:{fontSize:11,textTransform:"uppercase",letterSpacing:1,fontWeight:800,color:"#6b7280",padding:"10px 8px 2px"},menuNavItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#f8faf9",border:"1px solid #edf1ef",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#064e3b"},menuSairItem:{width:"100%",display:"flex",alignItems:"center",gap:12,textAlign:"left",background:"#fff1f2",border:"1px solid #fecdd3",borderRadius:16,padding:"12px 14px",fontSize:15,color:"#be123c",fontWeight:700},agendaResumoCard:{background:"#ffffff",border:"1px solid #dfe7e2",borderLeft:"5px solid #14b8a6",padding:14,borderRadius:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",display:"grid",gap:10},agendaResumoGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,color:"#374151"},btnAgendaCompleta:{border:"none",borderRadius:10,background:"#14b8a6",color:"#fff",padding:"10px 12px",fontWeight:"bold"},uploadExcelBox:{border:"2px dashed #99f6e4",background:"#f0fdfa",borderRadius:16,padding:24,textAlign:"center",display:"grid",gap:6,color:"#0f766e",cursor:"pointer"},importDicasGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"12px 0"},previewImportacao:{display:"grid",gap:8,marginBottom:12},previewLinha:{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:12,padding:10,display:"grid",gap:4},alertaSucesso:{background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857",borderRadius:12,padding:10,fontWeight:"bold"},btnSair:{background:"#fee2e2",color:"#ef4444",border:"none",padding:"8px 12px",borderRadius:8,fontWeight:"bold"},overlayConfirmacao:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:3e3},modalConfirmacao:{background:"#fff",borderRadius:18,padding:18,width:"100%",maxWidth:360,boxShadow:"0 12px 30px rgba(0,0,0,0.25)",textAlign:"center"},confirmacaoIcone:{fontSize:38,marginBottom:8},confirmacaoTitulo:{margin:"4px 0 8px",fontSize:20},confirmacaoTexto:{margin:"0 0 16px",color:"#444",lineHeight:1.4},confirmacaoAcoes:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10},btnConfirmarCancelar:{border:"none",borderRadius:10,padding:11,background:"#6c757d",color:"#fff",fontWeight:"bold"},btnConfirmarAcao:{border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:"bold"},headerExpansivel:{width:"100%",background:"#fff",border:"1px solid #e5e5e5",borderRadius:14,padding:"12px 14px",margin:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:20,fontWeight:"bold",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"},page:{padding:16,maxWidth:700,margin:"auto",fontFamily:"Arial",background:"#f8fafc",minHeight:"100vh",paddingBottom:100},titulo:{fontSize:28,marginBottom:12},subtitulo:{fontSize:22,marginBottom:12},bloco:{marginTop:24},resumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12},boxTotal:{background:"#fff",padding:12,borderRadius:14,display:"flex",flexDirection:"column",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},boxPago:{background:"#d4edda",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxPendente:{background:"#fff3cd",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},boxVencido:{background:"#f8d7da",padding:12,borderRadius:14,display:"flex",flexDirection:"column"},filtrosBox:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},input:{width:"100%",padding:10,borderRadius:8,border:"1px solid #ccc",marginBottom:8,boxSizing:"border-box"},datas:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},filtros:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8},filtro:{border:"1px solid #ccc",background:"#fff",padding:"7px 11px",borderRadius:10,fontWeight:800,cursor:"pointer"},filtroAtivo:{border:"none",background:"#0d6efd",color:"#fff",padding:"7px 11px",borderRadius:8},resumoFiltro:{background:"#fff",padding:12,borderRadius:14,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",display:"flex",flexDirection:"column",gap:4,fontSize:14},cardConta:{padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},cardTopo:{display:"flex",justifyContent:"space-between",fontSize:18,marginBottom:4},cardInfo:{fontSize:13,opacity:.75},cardDashboard:{background:"#fff",padding:12,borderRadius:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},dashboardGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6,fontSize:13},cardConfiguracao:{background:"#fff",padding:14,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},switchLinha:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #eee"},configResumo:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,background:"#f8fafc",padding:10,borderRadius:10},cardAgenda:{background:"#fff",padding:12,borderRadius:14,marginTop:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},itemAgenda:{background:"#f8fafc",padding:10,borderRadius:10,marginTop:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"},agendaDireita:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6},textoAgenda:{display:"block",marginTop:5,color:"#444",fontWeight:"bold"},textoVencidoAgenda:{display:"block",marginTop:5,color:"#dc3545",fontWeight:"bold"},cardLixeira:{background:"#fff",padding:12,borderRadius:14,marginBottom:10,border:"1px solid #ddd",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},textoQuarentena:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},textoLiberado:{display:"block",marginTop:8,color:"#64748b",fontWeight:700},cardNota:{background:"#eef2ff",padding:12,borderRadius:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},textoNota:{fontSize:14,whiteSpace:"pre-wrap"},acoes:{display:"flex",gap:6,flexWrap:"wrap",marginTop:8},mensagemVazia:{fontSize:13,opacity:.7},btnPago:{minHeight:38,minWidth:74,background:"#0f766e",color:"#fff",border:"1px solid #0f766e",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnVoltar:{minHeight:38,minWidth:74,background:"#f8fafc",color:"#475569",border:"1px solid #cbd5e1",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnEditar:{minHeight:38,minWidth:74,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnExcluir:{minHeight:38,minWidth:74,background:"#fff1f2",color:"#e11d48",border:"1px solid #fecdd3",padding:"8px 12px",borderRadius:10,fontWeight:800,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"},btnSecundario:{background:"#f8fafc",color:"#0f766e",border:"1px solid #99f6e4",padding:"6px 10px",borderRadius:8,fontWeight:800,cursor:"pointer"},btnCinza:{background:"#64748b",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnRoxo:{background:"#6f42c1",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},btnVerde:{background:"#14b8a6",color:"#fff",border:"none",padding:"7px 10px",borderRadius:8},fab:{position:"fixed",right:22,bottom:22,width:54,height:54,borderRadius:18,background:"linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",color:"#ffffff",border:"1px solid rgba(255,255,255,0.22)",fontSize:28,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(15, 118, 110, 0.28)",zIndex:3e3,cursor:"pointer"},menuFab:{position:"fixed",right:20,bottom:86,display:"flex",flexDirection:"column",gap:8,zIndex:3001},menuItem:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"0 14px",minWidth:190,width:190,height:48,fontSize:14,fontWeight:800,boxShadow:"0 10px 24px rgba(15,23,42,0.14)",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"flex-start",gap:10,color:"#0f172a",whiteSpace:"nowrap",overflow:"visible",cursor:"pointer"},menuItemIcone:{display:"inline-flex",width:26,minWidth:26,justifyContent:"center",fontSize:18,lineHeight:1},menuItemTexto:{display:"inline-block",color:"#0f172a",fontSize:14,fontWeight:800,lineHeight:1},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",justifyContent:"center",alignItems:"center",padding:16,zIndex:999},blocoNotificacaoConta:{background:"#f8fafc",border:"1px solid #e5e5e5",borderRadius:12,padding:10,marginBottom:10},blocoRecorrenciaConta:{background:"#f0fdfa",border:"1px solid #99f6e4",borderRadius:12,padding:10,marginBottom:10},switchLinhaCompacta:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #e5e5e5",fontSize:14},textoAjuda:{display:"block",color:"#666",fontSize:11,marginTop:4},notificacaoChips:{display:"flex",gap:6,flexWrap:"wrap",marginTop:6},chipNotif:{background:"#eef6ff",color:"#0d6efd",border:"1px solid #b6d4fe",borderRadius:999,padding:"3px 7px",fontSize:11,fontWeight:"bold"},modal:{background:"#fff",padding:18,borderRadius:14,width:"100%",maxWidth:360},inputModal:{width:"100%",padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box"},textareaModal:{width:"100%",minHeight:110,padding:10,marginBottom:8,borderRadius:8,border:"1px solid #ccc",boxSizing:"border-box",fontFamily:"Arial"},btnGhostAction:{width:"auto",background:"#fff",color:"#374151",border:"1px solid #d1d5db",padding:"7px 12px",borderRadius:999,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:0},btnSalvar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#14b8a6",color:"#fff",marginBottom:8},btnCancelar:{width:"100%",padding:10,border:"none",borderRadius:8,background:"#6c757d",color:"#fff"},itemCentro:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f1f1f1",padding:8,borderRadius:8,marginBottom:6,fontSize:13},btnMiniExcluir:{background:"#fee2e2",color:"#ef4444",border:"1px solid #f87171",borderRadius:999,padding:"8px 10px",fontSize:11},notasHeaderNovo:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:10},btnMiniVerde:{background:"#0f766e",color:"#fff",border:"none",borderRadius:12,padding:"6px 11px",fontWeight:"900",fontSize:18,lineHeight:1},notasListaNova:{display:"grid",gap:10},cardNotaAcao:{padding:12,borderRadius:16,marginBottom:10,border:"1px solid #e5e7eb",boxShadow:"0 8px 20px rgba(15,23,42,0.06)"},cardNotaNormal:{background:"#f8fafc",borderColor:"#e5e7eb"},cardNotaUrgente:{background:"#fffbeb",borderColor:"#fde68a"},cardNotaCritico:{background:"#fff7f7",borderColor:"#fecaca"},badgePrioridade:{borderRadius:999,padding:"4px 8px",fontSize:12,fontWeight:"900"},badgeNormal:{background:"#f1f5f9",color:"#475569"},badgeUrgente:{background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a"},badgeCritico:{background:"#fff7f7",color:"#991b1b",border:"1px solid #fecaca"}},Id=[{id:"principal",titulo:"Principal",items:[{tela:"dashboard",icon:"🏠",label:"Dashboard",desc:"Resumo financeiro"},{tela:"agenda",icon:"📅",label:"Agenda",desc:"Vencimentos e previsões"},{tela:"notas",icon:"📝",label:"Bloco de Notas",desc:"Pendências e histórico de notas"}]},{id:"financeiro",titulo:"Financeiro",items:[{tela:"contas",icon:"💳",label:"Contas",desc:"Contas a pagar e filtros"}]},{id:"analise",titulo:"Análise",items:[{tela:"relatorios",icon:"📊",label:"Relatórios",desc:"Análises e indicadores"}]},{id:"master",titulo:"Master",items:[{tela:"master-empresas",icon:"🏢",label:"Painel Master",desc:"Empresas e tenants SaaS",masterOnly:!0}]},{id:"sistema",titulo:"Sistema",items:[{tela:"usuarios",icon:"👥",label:"Usuários",desc:"Perfis, acessos e senhas"},{tela:"configuracoes",icon:"⚙️",label:"Configurações",desc:"Preferências da empresa"},{tela:"filiais",icon:"🏬",label:"Filiais",desc:"Unidades da empresa"},{tela:"billing",icon:"💼",label:"Billing",desc:"Planos, limites e assinatura"},{tela:"onboarding",icon:"🚀",label:"Onboarding",desc:"Implantação inicial SaaS"},{tela:"importar",icon:"📥",label:"Importar CSV",desc:"Trazer histórico do Excel"},{tela:"lixeira",icon:"🗑️",label:"Lixeira",desc:"Restaurar ou excluir definitivo"}]}];function Ad(){const t=c.useRef(null),{globalLoading:a,toast:o,showToast:i,hideToast:n,empresaAtiva:l,setEmpresaAtiva:d,limparEmpresaAtiva:m,empresasDisponiveis:u,setEmpresasDisponiveis:b}=Ti();function N(r){const p=String((r==null?void 0:r.message)||r||"").toLowerCase();return p.includes("jwt")||p.includes("expired")||p.includes("unauthorized")||p.includes("session")}function v(r,p){if(!r||p==="pago")return!1;const g=new Date;g.setHours(0,0,0,0);const _=new Date(r+"T00:00:00");return _.setHours(0,0,0,0),_<g}function y(r){return r?String(r).slice(0,7):""}function h(r){if(!r)return 0;const p=new Date(r),_=new Date-p;return Math.max(0,Math.floor(_/(1e3*60*60*24)))}function $(r){return!0}function C(r=[]){return r.map(p=>`${p.id||""}:${p.excluido_em||""}:${p.updated_at||""}`).join("|")}function k(r,p=[]){r((g=[])=>C(g)===C(p)?g:p)}const{contas:U,setContas:ae,contasLixeira:H,setContasLixeira:q,busca:ne,setBusca:G,filtroStatus:Z,setFiltroStatus:A,filtroCentro:M,setFiltroCentro:X,filtroFilial:he,setFiltroFilial:ce,filtroMes:ye,setFiltroMes:_e,dataInicial:se,setDataInicial:w,dataFinal:pe,setDataFinal:T,loading:ie,setLoading:K,modalConta:J,setModalConta:S,editandoContaId:te,descricao:De,setDescricao:ze,valor:ke,setValor:V,dataVencimento:ue,setDataVencimento:qe,centroCustoId:B,setCentroCustoId:W,filialId:Ee,setFilialId:fe,observacaoConta:P,setObservacaoConta:ee,contaRecorrente:Qe,setContaRecorrente:Re,tipoRecorrencia:Le,setTipoRecorrencia:Tt,diaVencimentoRecorrencia:et,setDiaVencimentoRecorrencia:ct,buscarContas:Ue,abrirNovaConta:mt,abrirEdicaoConta:Ct,fecharConta:tt,salvarConta:qt,marcarComoPago:ft,voltarParaPendente:Xt,excluirConta:Ce}=gd(),{notas:Q,setNotas:O,notasLixeira:D,setNotasLixeira:me,buscaNota:Fe,setBuscaNota:Ke,modalNota:Ye,setModalNota:Ve,editandoNotaId:Xe,tituloNota:Ge,setTituloNota:nt,conteudoNota:xt,setConteudoNota:Lt,prioridadeNota:Ut,setPrioridadeNota:Dt,dataEventoNota:It,setDataEventoNota:_t,filialNotaId:yt,setFilialNotaId:At,buscarNotas:pt,buscarNotasLixeira:Oe,abrirNovaNota:Je,abrirEdicaoNota:s,fecharNota:j,salvarNota:L,excluirNota:le,alternarNotaConcluida:be,restaurarNota:xe,excluirNotaDefinitivo:ge}=_d(),[we,de]=c.useState([]),[Ie,at]=c.useState([]),[ve,rt]=c.useState(!1),[Nt,Et]=c.useState(""),[ot,$e]=c.useState(!1),[ht,Ae]=c.useState(!1),[zt,Oi]=c.useState(!1),[Vi,Gi]=c.useState({principal:!0,financeiro:!0,analise:!0,sistema:!0}),[st,ba]=c.useState("dashboard"),[Y,va]=c.useState(null),[ja,Ho]=c.useState(!1),[Ta,ya]=c.useState(""),[Ne,Da]=c.useState(()=>Ra()),[uo,sa]=c.useState(""),[Wi,fo]=c.useState(!1),[Ko,Yo]=c.useState(""),[Hi,Xo]=c.useState(!1),[Qo,Ia]=c.useState(""),[Aa,xo]=c.useState([]),[Ki,Jo]=c.useState(!1),[Yi,ho]=c.useState(!1),[Xi,go]=c.useState(""),[Zo,er]=c.useState(!1),[tr,Ba]=c.useState({}),[Qi,ar]=c.useState(""),[or,rr]=c.useState(""),[ir,nr]=c.useState(""),[sr,lr]=c.useState("operador"),[dr,cr]=c.useState(""),[pr,mr]=c.useState(""),[wa,ur]=c.useState(""),[fr,xr]=c.useState(""),[Ji,Zi]=c.useState(!1),[en,tn]=c.useState(!0),[an,on]=c.useState(!0),[rn,nn]=c.useState(()=>typeof window>"u"?!0:window.innerWidth>=980),[bo,sn]=c.useState(!0),[vo,ln]=c.useState(!0),[qa,dn]=c.useState(!0),[jo,cn]=c.useState(!0),[La,Ua]=c.useState(null),[yo,wo]=c.useState(!0),[Qt,hr]=c.useState(!0),[Jt,gr]=c.useState(!0),[Zt,br]=c.useState(!1),[la,ko]=c.useState("1"),[Oa,Co]=c.useState("1"),[vr,No]=c.useState(!0),[jr,So]=c.useState(!0),[yr,_o]=c.useState("3"),[wr,Eo]=c.useState(!0),[ea,zo]=c.useState(""),[kr,Po]=c.useState(""),[Cr,Ro]=c.useState(""),[gt,Nr]=c.useState({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null}),[Sr,Fo]=c.useState(null),[Ot,Va]=c.useState([]),[_r,ka]=c.useState("");function oe(r,p="info"){i(r,p)}function Pe(r,p="Não foi possível concluir a operação."){const g=(r==null?void 0:r.message)||r||p;if(N(r)){gn("Sua sessão expirou. Faça login novamente.");return}oe(String(g),"erro")}function Er(){ae([]),O([]),de([]),at([]),q([]),me([]),xo([]),go(""),ho(!1),Ua(null),S(!1),Ve(!1),rt(!1),$e(!1),Ae(!1),G(""),Ke(""),A("todas"),X(""),ce(""),_e(""),w(""),T(""),Fo(null),Va([]),ka("")}function Ga(){Er(),b([]),va(null),m(),ya(""),Ba({}),sa(""),Ia(""),K(!1),Rd()}const pn=c.useCallback(()=>{Ga()},[]),mn=c.useCallback(()=>{ba("dashboard")},[]),un=c.useCallback((r,p="info")=>{oe(r,p)},[i]),fn=c.useCallback(r=>{bt({titulo:"Sessão quase expirada",mensagem:"Sua sessão vai expirar por segurança. Deseja continuar conectado?",textoConfirmar:"Continuar conectado",tipo:"padrao",acao:async()=>r()})},[]),{usuarioLogado:R,setUsuarioLogado:Ca,carregandoAuth:xn,setCarregandoAuth:hn,encerrarSessao:gn}=Fd({onClearAuthData:pn,onNavigateHome:mn,onShowMessage:un,onSessionWarning:fn});async function bn(){var r,p;if(R!=null&&R.id)try{const _=await ui(R.id)||((r=R==null?void 0:R.user_metadata)==null?void 0:r.name)||((p=R==null?void 0:R.user_metadata)==null?void 0:p.full_name)||"";_&&_!==uo&&sa(_)}catch(g){console.warn("Falha ao sincronizar nome do perfil:",(g==null?void 0:g.message)||g)}}c.useEffect(()=>{if(!R){K(!1);return}vn(R.id)},[R]),c.useEffect(()=>{if(!(R!=null&&R.id)||!Y)return;let r=!1;async function p(){if(!r)try{await Promise.allSettled([Vt(Y),Ka(Y),$r(Y),Gt(Y)])}catch(z){console.warn("Falha ao sincronizar dados do tenant:",(z==null?void 0:z.message)||z)}}function g(){window.clearTimeout(t.current),t.current=window.setTimeout(p,350)}function _(){document.visibilityState==="visible"&&g()}window.addEventListener("focus",g),document.addEventListener("visibilitychange",_);const E=I.channel(`tenant-sync-${Y}`).on("postgres_changes",{event:"*",schema:"public",table:"df_centros_custo",filter:`empresa_id=eq.${Y}`},g).on("postgres_changes",{event:"*",schema:"public",table:"df_filiais",filter:`empresa_id=eq.${Y}`},g).on("postgres_changes",{event:"*",schema:"public",table:"df_contas",filter:`empresa_id=eq.${Y}`},g).on("postgres_changes",{event:"*",schema:"public",table:"df_contas_recorrentes",filter:`empresa_id=eq.${Y}`},g).subscribe();return()=>{r=!0,window.clearTimeout(t.current),window.removeEventListener("focus",g),document.removeEventListener("visibilitychange",_),I.removeChannel(E)}},[R==null?void 0:R.id,Y]),c.useEffect(()=>{!ht||!(R!=null&&R.id)||bn()},[ht,R==null?void 0:R.id]),c.useEffect(()=>{window.history.replaceState({tela:st},"",window.location.href);function r(p){var _;const g=((_=p.state)==null?void 0:_.tela)||"dashboard";$e(!1),Ae(!1),ba(g)}return window.addEventListener("popstate",r),()=>window.removeEventListener("popstate",r)},[]),c.useEffect(()=>{st==="usuarios"&&Y&&da(Y)},[st,Y]),c.useEffect(()=>{function r(p){if(p.key==="Escape"){if(gt.aberto){Ja();return}J&&_a(),Ye&&Qa(),ve&&rt(!1),ot&&$e(!1),ht&&Ae(!1)}}return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[gt.aberto,J,Ye,ve,ot,ht]),c.useEffect(()=>{const r=document.body.style.overflow,p=document.documentElement.style.overflow,g=document.body.style.position,_=document.body.style.width,E=window.scrollY;return ht&&(document.body.classList.add("mobile-nav-open"),document.documentElement.classList.add("mobile-nav-open"),document.body.style.overflow="hidden",document.documentElement.style.overflow="hidden",document.body.style.position="fixed",document.body.style.width="100%",document.body.style.top=`-${E}px`),()=>{document.body.classList.remove("mobile-nav-open"),document.documentElement.classList.remove("mobile-nav-open"),document.body.style.overflow=r,document.documentElement.style.overflow=p,document.body.style.position=g,document.body.style.width=_,document.body.style.top="",ht&&window.scrollTo(0,E)}},[ht]);async function vn(r){var p,g,_,E;K(!0),Ia("");try{await ed();const z=await td(r),F=await ui(r),je=await qo({userId:r,email:R==null?void 0:R.email,perfilEmpresa:(z==null?void 0:z.perfil)||"operador"}),Ze=await bi({userId:r,email:R==null?void 0:R.email,isMaster:je.isMaster});if(!(z!=null&&z.empresaId)&&!je.isMaster){va(null),m(),ya(""),Da(Ra()),sa(""),Ia(Jl.semEmpresa);return}if(je.isMaster&&Ze.length===0){va(null),m(),ya("master"),Da({...je,canSwitchCompany:!0,canManageCompanies:!0}),sa(F||((p=R==null?void 0:R.user_metadata)==null?void 0:p.name)||((g=R==null?void 0:R.user_metadata)==null?void 0:g.full_name)||""),Ia("Nenhuma empresa cadastrada em df_empresas para o usuário master.");return}const Se=Ze.find(aa=>aa.id===(l==null?void 0:l.id))||Ze.find(aa=>aa.id===(z==null?void 0:z.empresaId))||Ze[0]||{id:z==null?void 0:z.empresaId,nome:(z==null?void 0:z.nomeEmpresa)||"Dona Flor",perfil:(z==null?void 0:z.perfil)||"operador"},We=Se.perfil||(z==null?void 0:z.perfil)||(je.isMaster?"master":"operador"),pa=je.isMaster?{...je,perfilEmpresa:wt(We),canSwitchCompany:!0,canManageCompanies:!0}:await qo({userId:r,email:R==null?void 0:R.email,perfilEmpresa:We});b(Ze.length>0?Ze:[Se]),va(Se.id),d({id:Se.id,nome:Se.nome||(z==null?void 0:z.nomeEmpresa)||"Dona Flor",perfil:We}),ya(We),Da(pa),sa(F||((_=R==null?void 0:R.user_metadata)==null?void 0:_.name)||((E=R==null?void 0:R.user_metadata)==null?void 0:E.full_name)||""),await Wa(Se.id)}catch(z){N(z)?(await I.auth.signOut(),Ga(),Ca(null),oe("Sua sessão expirou. Faça login novamente.","erro")):oe(z.message,"erro")}finally{K(!1)}}async function Wa(r=Y){r&&await Promise.all([Vt(r),Sa(r),Ka(r),$r(r),Gt(r),zn(r)])}function wt(r){return Yt(r)}function zr(r=[]){if(Ne!=null&&Ne.isMaster)return!0;const p=wt(Ta);return r.includes(p)}function ta(){return!!(Ne!=null&&Ne.canManageUsers||zr(["admin"]))}function Na(){return!!(Ne!=null&&Ne.canAccessSettings||zr(["admin","gerente"]))}function Pr(){return Id.map(r=>({...r,items:r.items.filter(p=>!p.masterOnly||(Ne==null?void 0:Ne.canManageCompanies))})).filter(r=>r.items.length>0)}async function jn(){if(R)try{const r=await bi({userId:R.id,email:R.email,isMaster:Ne==null?void 0:Ne.isMaster});b(r)}catch(r){console.warn("Não foi possível atualizar a lista de empresas:",r.message)}}async function Ha(r){if(!r||ja)return;const p=u.find(g=>g.id===r);if(!p){oe("Empresa selecionada não encontrada para este usuário.","erro");return}if(p.id!==Y){Ho(!0),K(!0);try{const g=p.perfil||(Ne!=null&&Ne.isMaster?"master":"operador"),_=Ne!=null&&Ne.isMaster?{...Ne,perfilEmpresa:wt(g),canSwitchCompany:!0,canManageCompanies:!0,canManageUsers:!0,canAccessSettings:!0}:await qo({userId:R==null?void 0:R.id,email:R==null?void 0:R.email,perfilEmpresa:g});Er(),va(p.id),d({id:p.id,nome:p.nome||"Empresa",perfil:g}),ya(g),Da(_),ba("dashboard"),await Wa(p.id),oe(`Empresa ativa: ${p.nome||"Empresa"}`,"sucesso")}catch(g){Pe(g,"Não foi possível trocar a empresa ativa.")}finally{Ho(!1),K(!1)}}}async function da(r=Y,p={}){if(!r)return;const g=!!(p!=null&&p.silencioso);g||Jo(!0),go("");try{const[_,E]=await Promise.all([us(r),vs(r)]),z={};(E||[]).forEach(F=>{!(F!=null&&F.usuario_id)||!(F!=null&&F.filial_id)||(z[F.usuario_id]||(z[F.usuario_id]=[]),z[F.usuario_id].push(F.filial_id))}),xo(_),Ba(z),ho(!0)}catch(_){console.warn("Não foi possível carregar usuários:",_.message),xo([]),Ba({}),ho(!0),go((_==null?void 0:_.message)||"Não foi possível carregar os usuários da empresa.")}finally{g||Jo(!1)}}async function yn(){if(Zo)return;if(!Y){oe("Empresa não identificada.","erro");return}if(!ta()){oe("Apenas administradores podem adicionar usuários.","erro");return}const r=or.trim().toLowerCase();if(!r||!r.includes("@")){oe("Informe um e-mail válido.","erro");return}const p=dr.trim();if(p.length<6){oe("Informe uma senha provisória com pelo menos 6 caracteres.","erro");return}const g=wt(sr);try{er(!0),await fs({empresaId:Y,email:r,nome:ir,perfil:g,senhaProvisoria:p,criarAuthManual:!0}),await da(Y,{silencioso:!0})}catch(_){Pe(_);return}finally{er(!1)}rr(""),nr(""),cr(""),lr("operador"),oe("Usuário criado manualmente. Entregue o e-mail e a senha provisória ao usuário por um canal seguro.","sucesso")}async function wn(r){if(!ta()){oe("Apenas administradores podem enviar acesso ou reset de senha.","erro");return}const p=r.nome||r.email||"este usuário";bt({titulo:"Enviar acesso",mensagem:`Deseja enviar um link de acesso/redefinição de senha para ${p}?`,textoConfirmar:"Enviar link",tipo:"padrao",acao:async()=>{try{const g=await gs({usuario:r});oe(g.mensagem,"info")}catch(g){Pe(g)}}})}async function kn(r,p){if(!ta()){oe("Apenas administradores podem alterar perfis.","erro");return}const g=wt(p);if(r.user_id&&(R==null?void 0:R.id)&&r.user_id===R.id&&g!=="admin"&&Aa.filter(je=>wt(je.perfil)==="admin").length<=1){oe("Você não pode remover o último administrador da empresa.","erro");return}if(g===wt(r.perfil))return;const E=r.nome||r.email||"este usuário",z=jt(g);bt({titulo:"Alterar perfil",mensagem:`Deseja alterar o perfil de ${E} para ${z}?`,textoConfirmar:"Confirmar alteração",tipo:g==="admin"?"perigo":"padrao",acao:async()=>{try{await xs({empresaId:Y,usuario:r,perfil:g})}catch(F){Pe(F);return}await da(),oe("Perfil do usuário atualizado.","sucesso")}})}async function Rr(r,p){if(!ta()){oe("Apenas administradores podem alterar filiais dos usuários.","erro");return}if(!(r!=null&&r.id)){oe("Este usuário precisa estar cadastrado na empresa para receber filiais.","erro");return}const g=r.id;ar(g);try{await js({empresaId:Y,usuario:r,filialIds:p}),Ba(_=>({..._,[r.id]:p})),oe("Filiais do usuário atualizadas.","sucesso")}catch(_){Pe(_,"Não foi possível atualizar as filiais do usuário.")}finally{ar("")}}function Cn(r,p){const g=tr[r.id]||[],E=g.includes(p)?g.filter(z=>z!==p):[...g,p];Rr(r,E)}function Nn(r){Rr(r,[])}async function Sn(r){if(!ta()){oe("Apenas administradores podem remover usuários.","erro");return}if(r.user_id&&(R==null?void 0:R.id)&&r.user_id===R.id){oe("Você não pode remover o próprio acesso por aqui.","erro");return}if(wt(r.perfil)==="admin"&&Aa.filter(_=>wt(_.perfil)==="admin").length<=1){oe("Você não pode remover o último administrador da empresa.","erro");return}bt({titulo:"Remover usuário",mensagem:`Deseja remover ${r.nome||r.email||"este usuário"} desta empresa?`,textoConfirmar:"Remover",tipo:"perigo",acao:async()=>{try{await hs({empresaId:Y,usuario:r})}catch(g){Pe(g);return}await da()}})}async function _n(){const r=pr.trim().toLowerCase();if(!r||!r.includes("@")){oe("Informe um e-mail válido.","erro");return}const{error:p}=await I.auth.updateUser({email:r},{emailRedirectTo:window.location.origin});if(p){Pe(p);return}mr(""),oe("Solicitação enviada. Confirme o novo e-mail conforme orientação do Supabase.","sucesso")}async function En(){if(!wa||wa.length<6){oe("A senha precisa ter pelo menos 6 caracteres.","erro");return}if(wa!==fr){oe("As senhas não conferem.","erro");return}const{error:r}=await I.auth.updateUser({password:wa});if(r){Pe(r);return}ur(""),xr(""),oe("Senha atualizada com sucesso.","sucesso")}async function Vt(r=Y){return Ue({supabase:I,empresaAtual:r,avisarErro:Pe,configWhatsapp:Qt,configEmail:Jt,configPush:Zt,diasAlertaContas:Oa,diasAvisoPadrao:la})}async function Sa(r=Y){return pt({supabase:I,empresaAtual:r,avisarErro:Pe})}async function Fr(r=Y){if(!r)return;const{data:p,error:g}=await I.from("df_configuracoes_alertas").select("*").eq("empresa_id",r).maybeSingle();if(g){console.warn("Não foi possível carregar alertas globais:",g.message);return}if(p){Co(String(p.dias_alerta_contas??1)),No(p.alertar_contas_vencidas??!0),So(p.destacar_contas_criticas??!0),_o(String(p.dias_alerta_notas??3)),Eo(p.destacar_notas_urgentes??!0);return}const _={empresa_id:r,dias_alerta_contas:1,alertar_contas_vencidas:!0,destacar_contas_criticas:!0,dias_alerta_notas:3,destacar_notas_urgentes:!0},{data:E,error:z}=await I.from("df_configuracoes_alertas").insert([_]).select().maybeSingle();if(z){console.warn("Não foi possível criar alertas globais:",z.message);return}E&&(Co(String(E.dias_alerta_contas??1)),No(E.alertar_contas_vencidas??!0),So(E.destacar_contas_criticas??!0),_o(String(E.dias_alerta_notas??3)),Eo(E.destacar_notas_urgentes??!0))}async function zn(r=Y){if(!r)return;const{data:p,error:g}=await I.from("df_configuracoes").select("*").eq("empresa_id",r).limit(1);if(g){Pe(g);return}const _=Array.isArray(p)?p[0]:p;if(_){Ua(_),wo(_.notificacoes_ativas??!0),hr(_.enviar_whatsapp??!0),gr(_.enviar_email??!0),br(_.enviar_push??!1),ko(String(_.dias_aviso_padrao??1)),zo(_.nome_empresa||""),Po(_.whatsapp_padrao||""),Ro(_.email_padrao||""),await Fr(r);return}const{data:E,error:z}=await I.from("df_configuracoes").insert([{notificacoes_ativas:!0,enviar_whatsapp:!0,enviar_email:!0,enviar_push:!1,dias_aviso_padrao:1,nome_empresa:"DF Gestão Financeira",empresa_id:r}]).select();if(z){Pe(z);return}const F=Array.isArray(E)?E[0]:E;Ua(F),wo((F==null?void 0:F.notificacoes_ativas)??!0),hr((F==null?void 0:F.enviar_whatsapp)??!0),gr((F==null?void 0:F.enviar_email)??!0),br((F==null?void 0:F.enviar_push)??!1),ko(String((F==null?void 0:F.dias_aviso_padrao)??1)),zo((F==null?void 0:F.nome_empresa)||""),Po((F==null?void 0:F.whatsapp_padrao)||""),Ro((F==null?void 0:F.email_padrao)||""),await Fr(r)}async function Gt(r=Y){if(!r)return;const{data:p,error:g}=await I.from("df_contas").select("*, df_centros_custo(nome), df_filiais(nome), df_contas_recorrentes(tipo_recorrencia)").eq("empresa_id",r).eq("excluido",!0).order("excluido_em",{ascending:!1});g&&Pe(g),k(q,p||[]),await Oe({supabase:I,empresaAtual:r,avisarErro:Pe})}async function Ka(r=Y){if(!r)return;const{data:p,error:g}=await I.from("df_centros_custo").select("*").eq("empresa_id",r).order("nome");if(g){Pe(g);return}de(p||[])}async function $r(r=Y){if(!r){at([]);return}try{const p=await Go(r);at((p||[]).filter(g=>g.ativo!==!1))}catch(p){Pe(p),at([])}}const kt=U.filter(r=>Z==="pendentes"?r.status!=="pago":Z==="pagas"?r.status==="pago":Z==="vencidas"?v(r.data_vencimento,r.status):!0).filter(r=>!M||r.centro_custo_id===M).filter(r=>!he||r.filial_id===he).filter(r=>!ye||y(r.data_vencimento)===ye).filter(r=>!(se&&r.data_vencimento<se||pe&&r.data_vencimento>pe)).filter(r=>{var F,je;const p=ne.trim().toLowerCase();if(!p)return!0;const g=((F=r.df_centros_custo)==null?void 0:F.nome)||"",_=((je=r.df_filiais)==null?void 0:je.nome)||"",E=r.status==="pago"?"pago":v(r.data_vencimento,r.status)?"vencido":"pendente";return[r.descricao,r.observacao,r.categoria,r.forma_pagamento,g,_,E,St(r.data_vencimento),r.data_vencimento].filter(Boolean).some(Ze=>String(Ze).toLowerCase().includes(p))}),Mr=U.filter(r=>Z==="pendentes"?r.status!=="pago":Z==="pagas"?r.status==="pago":Z==="vencidas"?v(r.data_vencimento,r.status):!0).filter(r=>!M||r.centro_custo_id===M).filter(r=>!ye||y(r.data_vencimento)===ye).filter(r=>!(se&&r.data_vencimento<se||pe&&r.data_vencimento>pe)).filter(r=>{var F,je;const p=ne.trim().toLowerCase();if(!p)return!0;const g=((F=r.df_centros_custo)==null?void 0:F.nome)||"",_=((je=r.df_filiais)==null?void 0:je.nome)||"",E=r.status==="pago"?"pago":v(r.data_vencimento,r.status)?"vencido":"pendente";return[r.descricao,r.observacao,r.categoria,r.forma_pagamento,g,_,E,St(r.data_vencimento),r.data_vencimento].filter(Boolean).some(Ze=>String(Ze).toLowerCase().includes(p))}),Ya=kt.reduce((r,p)=>r+Number(p.valor||0),0),$o=kt.filter(r=>r.status==="pago").reduce((r,p)=>r+Number(p.valor||0),0),Tr=kt.filter(r=>v(r.data_vencimento,r.status)).reduce((r,p)=>r+Number(p.valor||0),0),Dr=Ya-$o,Pn=kt.filter(r=>r.status!=="pago").sort((r,p)=>String(p.created_at||p.data_vencimento||"").localeCompare(String(r.created_at||r.data_vencimento||"")));we.map(r=>{const p=kt.filter(z=>z.centro_custo_id===r.id),g=p.reduce((z,F)=>z+Number(F.valor||0),0),_=p.filter(z=>z.status==="pago").reduce((z,F)=>z+Number(F.valor||0),0),E=p.filter(z=>v(z.data_vencimento,z.status)).reduce((z,F)=>z+Number(F.valor||0),0);return{id:r.id,nome:r.nome,total:g,pago:_,pendente:g-_,vencido:E}}).filter(r=>r.total>0||r.pago>0||r.pendente>0||r.vencido>0);const Ir={critico:0,urgente:1,normal:2},Ar=Q.filter(r=>(!he||r.filial_id===he)&&`${r.titulo||""} ${r.conteudo||""}`.toLowerCase().includes(Fe.toLowerCase())).sort((r,p)=>{const g=r.concluida?1:0,_=p.concluida?1:0;if(g!==_)return g-_;const E=Ir[r.prioridade||"normal"]??2,z=Ir[p.prioridade||"normal"]??2;if(E!==z)return E-z;const F=r.data_evento||"9999-12-31",je=p.data_evento||"9999-12-31";return String(F).localeCompare(String(je))}),Xa=Ar.filter(r=>!r.concluida),Br=Xa.filter(r=>r.prioridade==="critico").length,qr=Xa.filter(r=>r.prioridade==="urgente").length;function Rn(){return mt({setMenuAberto:$e,setMenuNavegacaoAberto:Ae,configWhatsapp:Qt,configEmail:Jt,configPush:Zt,diasAvisoPadrao:la})}async function Fn(r){return Ct({conta:r,supabase:I,empresaId:Y,diasAvisoPadrao:la,formatarDataParaBanco:ao})}function _a(){return tt()}async function $n(){return qt({supabase:I,empresaId:Y,mostrarAviso:oe,configWhatsapp:Qt,configEmail:Jt,configPush:Zt,diasAlertaContas:Oa,diasAvisoPadrao:la,primeiraLetraMaiuscula:jt,converterValor:Ci,formatarDataParaBanco:ao,erroEhSessaoExpirada:N,limparEstadoAutenticacao:Ga,setUsuarioLogado:Ca,buscarContas:Vt,fecharConta:_a})}async function Mo(r){return ft({supabase:I,id:r,empresaId:Y,buscarContas:Vt,mostrarAviso:oe})}async function Mn(r){return Xt({supabase:I,id:r,empresaId:Y,buscarContas:Vt,mostrarAviso:oe})}async function Tn(r){return Ce({supabase:I,id:r,empresaId:Y,avisarErro:Pe,buscarContas:Vt,buscarLixeira:Gt,mostrarAviso:oe})}function Dn(){return Je({setMenuAberto:$e,setMenuNavegacaoAberto:Ae})}function Lr(r){return s(r)}function Qa(){return j()}async function In(){return L({supabase:I,empresaId:Y,mostrarAviso:oe,avisarErro:Pe,buscarNotas:Sa})}async function Ur(r){return le({supabase:I,id:r,empresaId:Y,avisarErro:Pe,buscarNotas:Sa,buscarLixeira:Gt,mostrarAviso:oe})}async function Or(r){return be({supabase:I,nota:r,empresaId:Y,avisarErro:Pe,buscarNotas:Sa,mostrarAviso:oe})}async function An(){if(!Y){oe("Usuário sem empresa vinculada.","erro");return}const r=Number(la),p=Number(Oa),g=Number(yr);if(isNaN(r)||r<0||isNaN(p)||p<0||isNaN(g)||g<0){oe("Informe uma quantidade válida para os dias de alerta.","erro");return}const _={notificacoes_ativas:yo,enviar_whatsapp:Qt,enviar_email:Jt,enviar_push:Zt,dias_aviso_padrao:r,nome_empresa:ea.trim()||null,whatsapp_padrao:kr.trim()||null,email_padrao:Cr.trim()||null,empresa_id:Y};let E;if(La!=null&&La.id?E=await I.from("df_configuracoes").update(_).eq("id",La.id).eq("empresa_id",Y).select():E=await I.from("df_configuracoes").insert([_]).select(),E.error){Pe(E.error);return}const z=Array.isArray(E.data)?E.data[0]:E.data;Ua(z);const{error:F}=await I.from("df_configuracoes_alertas").upsert([{empresa_id:Y,dias_alerta_contas:p,alertar_contas_vencidas:vr,destacar_contas_criticas:jr,dias_alerta_notas:g,destacar_notas_urgentes:wr}],{onConflict:"empresa_id"});if(F){oe("Configurações principais salvas, mas os alertas globais não foram atualizados: "+F.message,"erro");return}oe("Configurações salvas com sucesso.","info")}async function Bn(r){const{error:p}=await I.from("df_contas").update({excluido:!1,excluido_em:null}).eq("id",r).eq("empresa_id",Y);if(p){Pe(p);return}Vt(),Gt(),oe("Conta restaurada com sucesso.","sucesso")}async function qn(r){return xe({supabase:I,id:r,empresaId:Y,avisarErro:Pe,buscarNotas:Sa,buscarLixeira:Gt,mostrarAviso:oe})}async function Ln(r){const{error:p}=await I.from("df_contas").delete().eq("id",r.id).eq("empresa_id",Y);if(p){Pe(p);return}Gt(),oe("Conta excluída definitivamente.","sucesso")}async function Un(r){return ge({supabase:I,nota:r,empresaId:Y,avisarErro:Pe,buscarLixeira:Gt,mostrarAviso:oe})}async function On(){if(!Y){oe("Usuário sem empresa vinculada.","erro");return}const r=jt(Nt.trim());if(!r){oe("Digite o centro de custo.","erro");return}if(we.some(E=>String(E.nome||"").trim().toLowerCase()===r.toLowerCase())){oe("Este centro de custo já existe nesta empresa.","erro");return}const{data:g,error:_}=await I.from("df_centros_custo").insert([{nome:r,empresa_id:Y}]).select("*").single();if(_){Pe(_);return}Et(""),de(E=>[...E.filter(F=>F.id!==g.id),g].sort((F,je)=>String(F.nome||"").localeCompare(String(je.nome||"")))),await Ka(Y),oe("Centro de custo criado com sucesso.","sucesso")}async function Vn(r){const{error:p}=await I.from("df_centros_custo").delete().eq("id",r).eq("empresa_id",Y);if(p){oe("Não foi possível excluir. Verifique se existem contas usando este centro.","erro");return}Ka(),Vt()}function Gn(){const r=["Descricao","Valor","Vencimento","Status","Filial","Centro"],p=kt.map(F=>{var je,Ze;return[F.descricao||"",Number(F.valor||0).toFixed(2).replace(".",","),St(F.data_vencimento),v(F.data_vencimento,F.status)?"vencido":F.status,((je=F.df_filiais)==null?void 0:je.nome)||"",((Ze=F.df_centros_custo)==null?void 0:Ze.nome)||""]}),g=[r,...p].map(F=>F.map(je=>`"${String(je).replaceAll('"','""')}"`).join(";")).join(`
`),_=new Blob([g],{type:"text/csv;charset=utf-8;"}),E=URL.createObjectURL(_),z=document.createElement("a");z.href=E,z.download="relatorio-contas.csv",z.click(),URL.revokeObjectURL(E)}function Wn(){const r=E=>String(E??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),p=kt.map(E=>{var F,je;const z=v(E.data_vencimento,E.status)?"Vencido":E.status==="pago"?"Pago":"Pendente";return`
        <tr>
          <td>
            <strong>${r(E.descricao||"-")}</strong>
            ${E.observacao?`<small>Obs: ${r(E.observacao)}</small>`:""}
          </td>
          <td>${r(((F=E.df_filiais)==null?void 0:F.nome)||"-")}</td>
          <td>${r(((je=E.df_centros_custo)==null?void 0:je.nome)||"-")}</td>
          <td>${r(St(E.data_vencimento))}</td>
          <td><span class="status ${z.toLowerCase()}">${z}</span></td>
          <td class="valor">${r(lt(E.valor))}</td>
        </tr>
      `}).join(""),g=`
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
                <div class="empresa">${r(ea||"DF Gestão Financeira")}</div>
              </div>
              <div class="data">Gerado em ${new Date().toLocaleDateString("pt-BR")}<br/>${kt.length} conta(s) listada(s)</div>
            </header>
            <section class="summary">
              <div class="box"><span>Total</span><strong>${r(lt(Ya))}</strong></div>
              <div class="box"><span>Pago</span><strong>${r(lt($o))}</strong></div>
              <div class="box"><span>Pendente</span><strong>${r(lt(Dr))}</strong></div>
              <div class="box"><span>Vencido</span><strong>${r(lt(Tr))}</strong></div>
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
    `,_=window.open("","_blank");if(!_){oe("O navegador bloqueou a visualização do PDF. Permita pop-ups para abrir o relatório.","erro");return}_.document.open(),_.document.write(g),_.document.close()}function Hn(){G(""),A("todas"),X(""),ce(""),_e(""),w(""),T("")}function bt({titulo:r,mensagem:p,textoConfirmar:g="Confirmar",tipo:_="padrao",acao:E}){Nr({aberto:!0,titulo:r,mensagem:p,textoConfirmar:g,tipo:_,acao:E})}function Ja(){Nr({aberto:!1,titulo:"",mensagem:"",textoConfirmar:"Confirmar",tipo:"padrao",acao:null})}async function Vr(){typeof gt.acao=="function"&&await gt.acao(),Ja()}function Gr(r){return String(r||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}function Ea(r,p){const g=Object.entries(r||{});for(const _ of p){const E=Gr(_),z=g.find(([F])=>Gr(F)===E);if(z)return z[1]}return""}function Kn(r){if(!r)return null;if(typeof r=="number"){const g=new Date(Date.UTC(1899,11,30));return g.setUTCDate(g.getUTCDate()+r),g.toISOString().slice(0,10)}const p=String(r).trim();if(!p)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(p))return p;if(/^\d{2}\/\d{2}\/\d{4}$/.test(p)){const[g,_,E]=p.split("/");return`${E}-${_}-${g}`}return ao(p)}function Yn(r){if(typeof r=="number")return r;const p=String(r||"").replace(/R\$/gi,"").replace(/\./g,"").replace(",",".").trim();return Number(p||0)}function Wr(r){const p=[];let g="",_=!1;for(let E=0;E<r.length;E+=1){const z=r[E],F=r[E+1];if(z==='"'&&F==='"'){g+='"',E+=1;continue}if(z==='"'){_=!_;continue}if((z===";"||z===",")&&!_){p.push(g.trim()),g="";continue}g+=z}return p.push(g.trim()),p}function Xn(r){const p=String(r||"").replace(/^﻿/,"").split(/\r?\n/).filter(_=>_.trim());if(p.length<2)return[];const g=Wr(p[0]);return p.slice(1).map(_=>{const E=Wr(_);return g.reduce((z,F,je)=>(z[F]=E[je]||"",z),{})})}async function Qn(r){var E,z;const p=(E=r.target.files)==null?void 0:E[0];if(Fo(p||null),Va([]),ka(""),!p)return;if(((z=p.name.split(".").pop())==null?void 0:z.toLowerCase())!=="csv"){ka("Para evitar erro no deploy, esta versão importa CSV. No Excel, use: Arquivo > Salvar como > CSV UTF-8.");return}const _=new FileReader;_.onload=F=>{const Ze=Xn(F.target.result).map((vt,Se)=>{const We=Ea(vt,["descricao","descrição","conta","nome","fornecedor"]),pa=Ea(vt,["valor","valor pago","total"]),aa=Ea(vt,["vencimento","data vencimento","data_vencimento","data"]),Pt=String(Ea(vt,["status","situacao","situação"])||"pendente").toLowerCase(),oa=Ea(vt,["centro","centro de custo","categoria","setor"]);return{linha:Se+2,descricao:jt(String(We||"").trim()),valor:Yn(pa),data_vencimento:Kn(aa),status:Pt.includes("pag")?"pago":"pendente",centro:String(oa||"").trim()}}).filter(vt=>vt.descricao||vt.valor||vt.data_vencimento);Va(Ze),ka(`${Ze.length} linha(s) preparada(s) para revisão.`)},_.readAsText(p,"UTF-8")}async function Jn(){if(!Y){oe("Usuário sem empresa vinculada.","erro");return}const r=Ot.filter(E=>!E.descricao||!E.valor||!E.data_vencimento);if(r.length>0){oe(`Existem ${r.length} linha(s) sem descrição, valor ou vencimento. Corrija a planilha e importe novamente.`,"erro");return}const p={...Object.fromEntries(we.map(E=>[E.nome.toLowerCase(),E.id]))};for(const E of Ot)if(E.centro&&!p[E.centro.toLowerCase()]){const{data:z,error:F}=await I.from("df_centros_custo").insert([{nome:jt(E.centro),empresa_id:Y}]).select();if(F){Pe(F);return}const je=Array.isArray(z)?z[0]:z;p[E.centro.toLowerCase()]=je==null?void 0:je.id}const g=Ot.map(E=>({descricao:E.descricao,valor:E.valor,data_vencimento:E.data_vencimento,vencimento:E.data_vencimento,status:E.status,centro_custo_id:E.centro&&p[E.centro.toLowerCase()]||null,enviar_whatsapp:Qt,enviar_email:Jt,enviar_push:Zt,dias_aviso:Number(la||1),empresa_id:Y})),{error:_}=await I.from("df_contas").insert(g);if(_){Pe(_);return}ka(`${g.length} conta(s) importada(s) com sucesso.`),Fo(null),Va([]),await Wa(Y),Me("contas")}async function Za(){Ga(),Ca(null),hn(!1),ba("contas"),await I.auth.signOut()}function ca({titulo:r,aberto:p,onClick:g}){const _=String(r||"").split(" "),E=_[0]||"",z=_.slice(1).join(" ")||r;return e.jsxs("button",{style:x.headerExpansivel,onClick:g,children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:10,color:"#0f172a",fontWeight:900,lineHeight:1.1},children:[e.jsx("span",{style:{fontSize:24,lineHeight:1},children:E}),e.jsx("span",{children:z})]}),e.jsx("strong",{style:{color:"#0f172a"},children:p?"−":"+"})]})}function Me(r){var p;$e(!1),Ae(!1),ba(r),((p=window.history.state)==null?void 0:p.tela)!==r&&window.history.pushState({tela:r},"",window.location.href)}function Zn(){Me("dashboard")}function Wt(){var g,_;const r=uo||((g=R==null?void 0:R.user_metadata)==null?void 0:g.name)||((_=R==null?void 0:R.user_metadata)==null?void 0:_.full_name);if(r)return String(r).split(" ")[0];const p=(R==null?void 0:R.email)||"usuário";return jt(p.split("@")[0])}function Hr(){var g,_;const r=uo||((g=R==null?void 0:R.user_metadata)==null?void 0:g.name)||((_=R==null?void 0:R.user_metadata)==null?void 0:_.full_name);if(r)return String(r).trim();const p=(R==null?void 0:R.email)||"";return p?jt(p.split("@")[0]):""}function Kr(){Yo(Hr()),fo(!0)}async function es(){const r=String(Ko||"").trim().replace(/\s+/g," ");if(r.length<2){oe("Informe um nome com pelo menos 2 caracteres.","erro");return}Xo(!0);try{await bs({userId:R==null?void 0:R.id,email:R==null?void 0:R.email,nome:r}),sa(r),Ca(p=>p&&{...p,user_metadata:{...p.user_metadata||{},name:r,full_name:r}}),Y&&await da(Y),fo(!1),oe("Perfil atualizado com sucesso.","sucesso")}catch(p){Pe(p,"Não foi possível atualizar o perfil.")}finally{Xo(!1)}}function ts(){return gt.aberto?e.jsx("div",{style:x.overlayConfirmacao,children:e.jsxs("div",{style:x.modalConfirmacao,children:[e.jsx("div",{style:x.confirmacaoIcone,children:gt.tipo==="perigo"?"⚠️":gt.tipo==="sucesso"?"✅":"ℹ️"}),e.jsx("h3",{style:x.confirmacaoTitulo,children:gt.titulo}),e.jsx("p",{style:x.confirmacaoTexto,children:gt.mensagem}),e.jsxs("div",{style:x.confirmacaoAcoes,children:[e.jsx("button",{style:x.btnConfirmarCancelar,onClick:Ja,children:"Cancelar"}),e.jsx("button",{style:{...x.btnConfirmarAcao,background:gt.tipo==="perigo"?"#dc3545":gt.tipo==="sucesso"?"#14b8a6":"#0d6efd"},onClick:Vr,children:gt.textoConfirmar})]})]})}):null}function Yr(){return e.jsxs(e.Fragment,{children:[J&&e.jsx(Bl,{styles:x,editandoContaId:te,descricao:De,setDescricao:ze,valor:ke,setValor:V,dataVencimento:ue,setDataVencimento:qe,centroCustoId:B,setCentroCustoId:W,centros:we,filialId:Ee,setFilialId:fe,filiais:Ie,observacaoConta:P,setObservacaoConta:ee,contaRecorrente:Qe,setContaRecorrente:Re,tipoRecorrencia:Le,setTipoRecorrencia:Tt,diaVencimentoRecorrencia:et,setDiaVencimentoRecorrencia:ct,fecharConta:_a,salvarConta:$n,primeiraLetraMaiuscula:jt,limitarDataInput:To,formatarDataParaBanco:ao,fecharNota:Qa,setModalCentro:rt,setMenuAberto:$e,setMenuNavegacaoAberto:Ae}),Ye&&e.jsx(ql,{styles:x,editandoNotaId:Xe,tituloNota:Ge,setTituloNota:nt,prioridadeNota:Ut,setPrioridadeNota:Dt,dataEventoNota:It,setDataEventoNota:_t,conteudoNota:xt,setConteudoNota:Lt,filialNotaId:yt,setFilialNotaId:At,filiais:Ie,salvarNota:In,fecharNota:Qa,fecharConta:_a,setModalCentro:rt,setMenuAberto:$e,setMenuNavegacaoAberto:Ae,primeiraLetraMaiuscula:jt,limitarDataInput:To}),ve&&e.jsx(Ll,{styles:x,novoCentro:Nt,setNovoCentro:Et,salvarCentro:On,centros:we,abrirConfirmacao:bt,excluirCentro:Vn,fecharConta:_a,fecharNota:Qa,setModalCentro:rt,setMenuAberto:$e,setMenuNavegacaoAberto:Ae}),Wi&&e.jsx(Ol,{nome:Ko,setNome:Yo,email:R==null?void 0:R.email,salvando:Hi,onClose:()=>fo(!1),onSave:es})]})}function Xr(){return e.jsx(Ml,{styles:x,nomeEmpresa:ea,navegarPara:Me,menuNavegacaoAberto:ht,setMenuNavegacaoAberto:Ae,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:u,empresaId:Y,trocarEmpresaAtiva:Ha,trocandoEmpresa:ja,nomeUsuario:Wt,abrirPerfilUsuario:Kr,sairDoSistema:Za})}function Qr(){return e.jsxs(e.Fragment,{children:[ot&&e.jsxs("div",{className:"global-fab-menu",style:x.menuFab,onClick:r=>r.stopPropagation(),children:[e.jsxs("button",{style:x.menuItem,type:"button",onClick:r=>{r.preventDefault(),r.stopPropagation(),Rn()},"aria-label":"Nova conta",children:[e.jsx("span",{style:x.menuItemIcone,children:"💰"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova conta"})]}),e.jsxs("button",{style:x.menuItem,type:"button",onClick:r=>{r.preventDefault(),r.stopPropagation(),Dn()},"aria-label":"Nova nota",children:[e.jsx("span",{style:x.menuItemIcone,children:"📝"}),e.jsx("span",{style:x.menuItemTexto,children:"Nova nota"})]})]}),e.jsx("button",{className:"global-fab",style:x.fab,onClick:r=>{r.stopPropagation(),$e(!ot)},children:ot?"×":"+"})]})}function Jr(){return e.jsx("style",{children:`
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
      `})}function as(){return e.jsx("style",{children:`
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
      `})}function Zr(){return e.jsx("style",{children:`
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
      `})}function it(r){return e.jsx(di,{contas:U,contasFiltradas:kt,navegarPara:Me,children:e.jsxs("div",{className:"app-page app-frame",style:x.page,children:[e.jsx("style",{children:`

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

      `}),Zr(),Jr(),e.jsx(mi,{}),as(),Xr(),ei(),ti(),e.jsx("main",{className:"app-frame-content",children:r}),Qr(),e.jsx(ci,{}),e.jsx(pi,{}),ts(),Yr(),e.jsx(li,{visible:a}),e.jsx(Ao,{toast:o,onClose:n})]})})}function eo({icon:r,title:p,description:g}){return e.jsxs("div",{className:"empty-state-card",children:[e.jsx("div",{className:"empty-state-icon",children:r}),e.jsx("strong",{children:p}),e.jsx("p",{children:g})]})}function os(r){Gi(p=>({...p,[r]:!p[r]}))}function ei(){return e.jsx(Il,{sidebarCompacta:zt,setSidebarCompacta:Oi,nomeUsuario:Wt,nomeUsuarioAtual:Wt(),normalizarPerfil:wt,perfilUsuario:Ta,menuSections:Pr(),telaAtual:st,navegarPara:Me,gruposMenu:Vi,toggleGrupoMenu:os,sairDoSistema:Za})}function ti(){return e.jsx(Al,{visible:ht,styles:x,setMenuNavegacaoAberto:Ae,nomeUsuario:Wt,nomeUsuarioAtual:Wt(),normalizarPerfil:wt,perfilUsuario:Ta,menuSections:Pr(),navegarPara:Me,sairDoSistema:Za,canSwitchCompany:Ne==null?void 0:Ne.canSwitchCompany,empresasDisponiveis:u,empresaId:Y,trocarEmpresaAtiva:Ha,trocandoEmpresa:ja,abrirPerfilUsuario:Kr})}if(xn)return e.jsx("div",{style:x.page,children:e.jsx("h2",{children:"Carregando..."})});if(!R)return e.jsxs(e.Fragment,{children:[e.jsx($l,{onLogin:Ca}),e.jsx(Ao,{toast:o,onClose:n})]});if(Qo)return e.jsxs("div",{style:x.page,children:[e.jsx("h2",{children:"⚠️ Empresa não vinculada"}),e.jsx("p",{children:Qo}),e.jsx("button",{style:x.btnSair,onClick:Za,children:"Sair"})]});if(st==="contas")return it(e.jsx(rl,{styles:x,busca:ne,setBusca:G,mostrarFiltros:Ji,setMostrarFiltros:Zi,limparFiltros:Hn,imprimirPDF:Wn,exportarCSV:Gn,filtroStatus:Z,setFiltroStatus:A,centros:we,filtroCentro:M,setFiltroCentro:X,filiais:Ie,filtroFilial:he,setFiltroFilial:ce,filtroMes:ye,setFiltroMes:_e,dataInicial:se,setDataInicial:w,dataFinal:pe,setDataFinal:T,limitarDataInput:To,contasFiltradas:kt,total:Ya,formatarValor:lt,loading:ie,HeaderExpansivel:ca,mostrarContas:en,setMostrarContas:tn,estaVencida:v,formatarData:St,formatarTipoRecorrencia:zi,obterTipoRecorrenciaConta:Ei,abrirConfirmacao:bt,marcarComoPago:Mo,voltarParaPendente:Mn,abrirEdicaoConta:Fn,excluirConta:Tn,navegarPara:Me}));if(st==="relatorios")return it(e.jsx(Vs,{voltar:()=>Me("contas"),empresaId:Y,usuario:R,mostrarAviso:oe}));if(st==="notas")return it(e.jsx(nl,{styles:x,navegarPara:Me,notasFiltradas:Ar,notasPendentes:Xa,notasCriticas:Br,notasUrgentes:qr,buscaNota:Fe,setBuscaNota:Ke,formatarData:St,alternarNotaConcluida:Or,abrirEdicaoNota:Lr,abrirConfirmacao:bt,excluirNota:Ur,loading:ie,nomeUsuario:Wt(),filiais:Ie,filtroFilial:he,setFiltroFilial:ce,contasOperacionaisFiliais:Mr}));if(st==="importar")return it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📥 Importar planilha"}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"1. Enviar arquivo"}),e.jsx("p",{style:x.textoNota,children:"Importe sua planilha do ano em CSV para alimentar o histórico e liberar os relatórios do app."}),e.jsxs("label",{style:x.uploadExcelBox,children:[e.jsx("strong",{children:"📊 Selecionar arquivo CSV"}),e.jsx("small",{children:"No Excel: Arquivo > Salvar como > CSV UTF-8"}),e.jsx("input",{type:"file",accept:".csv",onChange:Qn,style:{display:"none"}})]}),Sr&&e.jsxs("p",{style:x.textoNota,children:["Arquivo: ",e.jsx("strong",{children:Sr.name})]}),_r&&e.jsx("p",{style:x.alertaSucesso,children:_r})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"2. Colunas esperadas"}),e.jsxs("div",{style:x.importDicasGrid,children:[e.jsx("span",{children:"Descrição"}),e.jsx("span",{children:"Valor"}),e.jsx("span",{children:"Vencimento"}),e.jsx("span",{children:"Status"}),e.jsx("span",{children:"Centro de custo"})]}),e.jsx("p",{style:x.textoAjuda,children:"O app também aceita nomes parecidos, como Conta, Data, Categoria e Situação."})]}),Ot.length>0&&e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"3. Revisar dados"}),e.jsx("div",{style:x.previewImportacao,children:Ot.slice(0,8).map(r=>e.jsxs("div",{style:x.previewLinha,children:[e.jsx("strong",{children:r.descricao||`Linha ${r.linha}`}),e.jsxs("small",{children:[St(r.data_vencimento)," • ",lt(r.valor)," • ",r.status," • ",r.centro||"Sem centro"]})]},r.linha))}),Ot.length>8&&e.jsxs("small",{style:x.textoAjuda,children:["Mostrando 8 de ",Ot.length," linhas."]}),e.jsxs("button",{style:x.btnSalvar,onClick:Jn,children:["Importar ",Ot.length," conta(s)"]})]})]}));if(st==="master-empresas")return Ne!=null&&Ne.canManageCompanies?it(e.jsx(fl,{styles:x,usuarioLogado:R,nomeUsuarioCompleto:Hr,empresaId:Y,empresasDisponiveis:u,trocarEmpresaAtiva:Ha,trocandoEmpresa:ja,mostrarAviso:oe,onEmpresasAtualizadas:jn,voltarPainel:Zn,abaInicial:"empresas"})):it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏢 Painel Master"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o painel master."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"})]})]}));if(st==="onboarding")return Na()?it(e.jsx(Sl,{styles:x,empresaId:Y,empresaNome:ea,filiais:Ie,centros:we,contas:U,mostrarAviso:oe,onRefresh:()=>Wa(Y),voltarPainel:()=>Me("configuracoes"),abrirDashboard:()=>Me("dashboard")})):it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🚀 Onboarding SaaS"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o onboarding."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"})]})]}));if(st==="billing")return Na()?it(e.jsx(Cl,{styles:x,empresaId:Y,empresaNome:ea,filiais:Ie,usuarios:Aa,mostrarAviso:oe,podeEditar:ta(),voltarPainel:()=>Me("configuracoes")})):it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"💼 Billing"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar o billing."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"})]})]}));if(st==="filiais")return Na()?it(e.jsx(hl,{styles:x,empresaId:Y,empresaNome:ea,mostrarAviso:oe,voltarPainel:()=>Me("configuracoes")})):it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🏬 Filiais"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite gerenciar filiais."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"})]})]}));if(st==="usuarios")return it(e.jsx(El,{styles:x,EmptyState:eo,podeAcessarConfiguracoes:Na,podeAdministrarUsuarios:ta,navegarPara:Me,usuarioLogado:R,normalizarPerfil:wt,perfilUsuario:Ta,permissoesUsuario:Ne,novoEmailUsuario:pr,setNovoEmailUsuario:mr,novaSenhaUsuario:wa,setNovaSenhaUsuario:ur,confirmarNovaSenhaUsuario:fr,setConfirmarNovaSenhaUsuario:xr,salvarMeuEmail:_n,salvarMinhaSenha:En,empresasDisponiveis:u,empresaId:Y,trocandoEmpresa:ja,trocarEmpresaAtiva:Ha,buscarUsuariosEmpresa:da,primeiraLetraMaiuscula:jt,nomeConviteUsuario:ir,setNomeConviteUsuario:nr,emailConviteUsuario:or,setEmailConviteUsuario:rr,senhaConviteUsuario:dr,setSenhaConviteUsuario:cr,perfilConviteUsuario:sr,setPerfilConviteUsuario:lr,criandoUsuarioManual:Zo,adicionarUsuarioEmpresa:yn,usuariosCarregando:Ki,usuariosInicializados:Yi,usuariosErro:Xi,usuariosEmpresa:Aa,filiais:Ie,filiaisUsuariosEmpresa:tr,salvandoFilialUsuario:Qi,liberarTodasFiliaisUsuario:Nn,alternarFilialUsuario:Cn,atualizarPerfilUsuarioEmpresa:kn,enviarAcessoUsuarioEmpresa:wn,removerUsuarioEmpresa:Sn}));if(st==="configuracoes")return Na()?it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(ca,{titulo:"🔔 Notificações",aberto:vo,onClick:()=>ln(!vo)}),vo&&e.jsxs(e.Fragment,{children:[e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificações ativas"}),e.jsx("small",{children:"Controle geral dos disparos automáticos da empresa."})]}),e.jsx("input",{type:"checkbox",checked:yo,onChange:r=>wo(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Contas"}),e.jsx("span",{children:"Regras aplicadas automaticamente em todas as contas, sem checkbox individual no formulário."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar contas antes do vencimento. Ex: 1",value:Oa,onChange:r=>{Co(r.target.value),ko(r.target.value)}}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Notificar contas vencidas"}),e.jsx("small",{children:"Exibir contas em atraso nas notificações e destaques."})]}),e.jsx("input",{type:"checkbox",checked:vr,onChange:r=>No(r.target.checked)})]}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar contas críticas"}),e.jsx("small",{children:"Dar prioridade visual para contas vencidas ou muito próximas do vencimento."})]}),e.jsx("input",{type:"checkbox",checked:jr,onChange:r=>So(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Notas"}),e.jsx("span",{children:"Regras para pendências e prioridades do bloco de notas."})]}),e.jsx("input",{style:x.input,type:"number",min:"0",placeholder:"Avisar notas pendentes após quantos dias. Ex: 3",value:yr,onChange:r=>_o(r.target.value)}),e.jsxs("label",{className:"checkbox-row-fix",style:x.switchLinha,children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Destacar notas urgentes"}),e.jsx("small",{children:"Manter notas urgentes e críticas no topo do acompanhamento."})]}),e.jsx("input",{type:"checkbox",checked:wr,onChange:r=>Eo(r.target.checked)})]}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Canais preparados"}),e.jsxs("span",{children:["WhatsApp: ",Qt?"Ligado":"Desligado"," • E-mail: ",Jt?"Ligado":"Desligado"," • Push: ",Zt?"Ligado":"Desligado"]})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(ca,{titulo:"🏢 Dados do negócio",aberto:bo,onClick:()=>sn(!bo)}),bo&&e.jsxs(e.Fragment,{children:[e.jsx("input",{style:x.input,placeholder:"Nome da empresa",value:ea,onChange:r=>zo(jt(r.target.value))}),e.jsx("input",{style:x.input,placeholder:"WhatsApp padrão. Ex: 5511999999999",value:kr,onChange:r=>Po(r.target.value)}),e.jsx("input",{style:x.input,placeholder:"E-mail padrão",value:Cr,onChange:r=>Ro(r.target.value)})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(ca,{titulo:"🔁 Recorrências",aberto:jo,onClick:()=>cn(!jo)}),jo&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"As recorrências são cadastradas e editadas dentro de Nova Conta ou Editar Conta, mantendo o mesmo padrão de campos da conta original."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("strong",{children:"Padrão atual"}),e.jsx("span",{children:"Frequência mensal • dia de vencimento configurável • geração automática no mês vigente quando ainda não existir."})]})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(ca,{titulo:"🏷 Centros de custo",aberto:qa,onClick:()=>dn(!qa)}),qa&&e.jsxs(e.Fragment,{children:[e.jsx("p",{style:x.textoNota,children:"Cadastre e gerencie os centros usados nas contas e nos relatórios."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Total de centros: ",we.length]}),e.jsx("span",{children:"Uso nos filtros e relatórios"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>rt(!0),children:"Gerenciar centros"})]})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx(ca,{titulo:"🏬 Filiais / Unidades",aberto:qa,onClick:()=>Me("filiais")}),e.jsx("p",{style:x.textoNota,children:"Cadastre lojas, unidades, produção ou delivery dentro da empresa ativa. Na próxima fase, contas poderão ser vinculadas a uma filial."}),e.jsxs("div",{style:x.configResumo,children:[e.jsx("span",{children:"Organização: empresa → filial → centro de custo → conta"}),e.jsx("span",{children:"Isolamento por empresa ativo"})]}),e.jsx("button",{style:x.btnSalvar,onClick:()=>Me("filiais"),children:"Gerenciar filiais"})]}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"🧠 Como o sistema vai usar"}),e.jsx("p",{style:x.textoNota,children:"O envio automático seguirá as regras globais da empresa. Os formulários ficam mais limpos e as contas/notas passam a obedecer ao mesmo padrão configurado aqui."}),e.jsxs("div",{style:x.configResumo,children:[e.jsxs("span",{children:["Geral: ",yo?"Ligado":"Desligado"]}),e.jsxs("span",{children:["WhatsApp: ",Qt?"Ligado":"Desligado"]}),e.jsxs("span",{children:["E-mail: ",Jt?"Ligado":"Desligado"]}),e.jsxs("span",{children:["Push: ",Zt?"Ligado":"Desligado"]})]})]}),e.jsx("button",{style:x.btnSalvar,onClick:An,children:"Salvar configurações"})]})):it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"⚙️ Configurações"}),e.jsxs("section",{style:x.cardConfiguracao,children:[e.jsx("h2",{style:x.subtitulo,children:"Acesso restrito"}),e.jsx("p",{style:x.textoNota,children:"Seu perfil atual não permite acessar configurações."}),e.jsx("button",{style:x.btnCinza,onClick:()=>Me("contas"),children:"← Voltar"})]})]}));if(st==="agenda"){let r=function({titulo:Se,total:We,lista:pa,cor:aa}){return e.jsxs("section",{style:x.cardAgenda,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:Se}),e.jsx("span",{children:lt(We)})]}),pa.length===0&&e.jsx(eo,{icon:"✅",title:"Agenda limpa",description:"Não há contas neste grupo de vencimento no momento."}),pa.map(Pt=>{var ai;const oa=ua(Pt.data_vencimento);return e.jsxs("div",{style:{...x.itemAgenda,borderLeft:`5px solid ${aa}`},children:[e.jsxs("div",{children:[e.jsx("strong",{children:Pt.descricao}),e.jsxs("div",{style:x.cardInfo,children:[St(Pt.data_vencimento)," • ",((ai=Pt.df_centros_custo)==null?void 0:ai.nome)||"Sem centro"]}),e.jsx("small",{style:oa<0?x.textoVencidoAgenda:x.textoAgenda,children:oa<0?`Vencida há ${Math.abs(oa)} dia(s)`:oa===0?"Vence hoje":`Vence em ${oa} dia(s)`})]}),e.jsxs("div",{style:x.agendaDireita,children:[e.jsx("strong",{children:lt(Pt.valor)}),e.jsx("button",{style:x.btnPago,onClick:()=>bt({titulo:"Confirmar pagamento",mensagem:`Deseja marcar a conta ${Pt.descricao} como paga?`,textoConfirmar:"Marcar como pago",tipo:"sucesso",acao:()=>Mo(Pt.id)}),children:"Pago"})]})]},Pt.id)})]})};const p=[...U].filter(Se=>Se.status!=="pago").sort((Se,We)=>Fa(Se.data_vencimento)-Fa(We.data_vencimento)),g=p.filter(Se=>ua(Se.data_vencimento)<0),_=p.filter(Se=>ua(Se.data_vencimento)===0),E=p.filter(Se=>{const We=ua(Se.data_vencimento);return We>0&&We<=7}),z=p.filter(Se=>ua(Se.data_vencimento)>7&&Ks(Se.data_vencimento)),F=g.reduce((Se,We)=>Se+Number(We.valor||0),0),je=_.reduce((Se,We)=>Se+Number(We.valor||0),0),Ze=E.reduce((Se,We)=>Se+Number(We.valor||0),0),vt=z.reduce((Se,We)=>Se+Number(We.valor||0),0);return it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"📅 Agenda Financeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"agenda-summary-grid",style:x.resumo,children:[e.jsxs("div",{style:x.boxVencido,children:[e.jsx("span",{children:"Vencidas"}),e.jsx("strong",{children:lt(F)})]}),e.jsxs("div",{style:x.boxPendente,children:[e.jsx("span",{children:"Hoje"}),e.jsx("strong",{children:lt(je)})]}),e.jsxs("div",{style:x.boxTotal,children:[e.jsx("span",{children:"7 dias"}),e.jsx("strong",{children:lt(Ze)})]}),e.jsxs("div",{style:x.boxPago,children:[e.jsx("span",{children:"Mês"}),e.jsx("strong",{children:lt(vt)})]})]}),e.jsxs("div",{className:"agenda-page-grid",children:[e.jsx(r,{titulo:"🚨 Vencidas",total:F,lista:g,cor:"#dc3545"}),e.jsx(r,{titulo:"📌 Vencem hoje",total:je,lista:_,cor:"#ffc107"}),e.jsx(r,{titulo:"🗓️ Próximos 7 dias",total:Ze,lista:E,cor:"#0d6efd"}),e.jsx(r,{titulo:"📆 Restante do mês",total:vt,lista:z,cor:"#14b8a6"})]})]}))}return st==="lixeira"?it(e.jsxs(e.Fragment,{children:[e.jsx("h1",{style:x.titulo,children:"🗑️ Lixeira"}),e.jsx("button",{className:"btn-back-page",style:x.btnCinza,onClick:()=>Me("dashboard"),children:"← Voltar"}),e.jsxs("section",{className:"trash-section trash-section-accounts",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"💰 Contas excluídas"}),H.length===0&&e.jsx(eo,{icon:"🧹",title:"Nenhuma conta na lixeira",description:"As contas excluídas aparecerão aqui durante o período de quarentena."}),H.map(r=>{var g;const p=h(r.excluido_em);return $(r.excluido_em),e.jsxs("div",{className:"trash-card trash-card-account",style:x.cardLixeira,children:[e.jsxs("div",{style:x.cardTopo,children:[e.jsx("strong",{children:r.descricao}),e.jsx("span",{children:lt(r.valor)})]}),e.jsxs("div",{style:x.cardInfo,children:["Venc.: ",St(r.data_vencimento)," • Centro: ",((g=r.df_centros_custo)==null?void 0:g.nome)||"Sem centro"," • Lixeira há ",p," dia(s)"]}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>bt({titulo:"Restaurar conta",mensagem:`Deseja restaurar a conta ${r.descricao}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>Bn(r.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>bt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a conta ${r.descricao}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>Ln(r)}),children:"Excluir definitivo"})]})]},r.id)})]}),e.jsxs("section",{className:"trash-section trash-section-notes",style:x.bloco,children:[e.jsx("h2",{style:x.subtitulo,children:"📝 Notas excluídas"}),D.length===0&&e.jsx(eo,{icon:"🗒️",title:"Nenhuma nota na lixeira",description:"As notas excluídas aparecerão aqui antes da remoção definitiva."}),D.map(r=>{const p=h(r.excluido_em);return $(r.excluido_em),e.jsxs("div",{className:"trash-card trash-card-note",style:x.cardLixeira,children:[e.jsx("strong",{children:r.titulo}),r.conteudo&&e.jsx("p",{style:x.textoNota,children:r.conteudo}),e.jsxs("small",{style:x.textoLiberado,children:["Excluída há ",p," dia(s). Pode restaurar em até 60 dias. Após 60 dias será removida automaticamente."]}),e.jsxs("div",{style:x.acoes,children:[e.jsx("button",{style:x.btnPago,onClick:()=>bt({titulo:"Restaurar nota",mensagem:`Deseja restaurar a nota ${r.titulo}?`,textoConfirmar:"Restaurar",tipo:"sucesso",acao:()=>qn(r.id)}),children:"Restaurar"}),e.jsx("button",{style:x.btnExcluir,onClick:()=>bt({titulo:"Excluir definitivamente",mensagem:`Excluir definitivamente a nota ${r.titulo}? Essa ação não poderá ser desfeita.`,textoConfirmar:"Excluir definitivo",tipo:"perigo",acao:()=>Un(r)}),children:"Excluir definitivo"})]})]},r.id)})]})]})):e.jsx(di,{contas:U,contasFiltradas:kt,navegarPara:Me,children:e.jsxs("div",{className:"app-page",style:x.page,onClick:()=>{ot&&$e(!1)},children:[e.jsx("style",{children:`
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
        `}),Zr(),Jr(),e.jsx(mi,{}),e.jsxs("div",{className:"print-header",children:[e.jsx("h1",{children:"Relatório Financeiro"}),e.jsxs("p",{children:["Gerado em ",new Date().toLocaleDateString("pt-BR")]})]}),e.jsx("div",{className:"print-footer",children:"Relatório gerado pelo Sistema DF Gestão Financeira"}),Xr(),ei(),ti(),Qr(),e.jsx(ci,{}),e.jsx(pi,{}),e.jsx("style",{children:`
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
      `}),e.jsx("section",{className:"dashboard-page-context","aria-label":"Contexto da página",children:e.jsxs("h1",{className:"dashboard-greeting-title",children:["Olá, ",Wt()]})}),e.jsx(al,{styles:x,formatarValor:lt,total:Ya,pago:$o,pendente:Dr,vencido:Tr,contas:kt,diferencaDias:ua,navegarPara:Me,contasAbertasDashboard:Pn,mostrarContasDashboard:an,setMostrarContasDashboard:on,busca:ne,setBusca:G,estaVencida:v,formatarData:St,abrirConfirmacao:bt,marcarComoPago:Mo,notasPendentes:Xa,notasCriticas:Br,notasUrgentes:qr,mostrarNotas:rn,setMostrarNotas:nn,alternarNotaConcluida:Or,abrirEdicaoNota:Lr,excluirNota:Ur,loading:ie,nomeUsuario:Wt(),filiais:Ie,filtroFilial:he,setFiltroFilial:ce,contasOperacionaisFiliais:Mr}),Yr(),e.jsx(li,{visible:a}),e.jsx(Ao,{toast:o,onClose:n}),e.jsx(Ul,{styles:x,confirmacao:gt,fecharConfirmacao:Ja,executarConfirmacao:Vr})]})})}is.createRoot(document.getElementById("root")).render(e.jsx(ns.StrictMode,{children:e.jsx(Fl,{children:e.jsx(Ad,{})})}));
