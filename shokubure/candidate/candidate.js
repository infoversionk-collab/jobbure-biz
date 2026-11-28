(()=> {
"use strict";
const cfg=window.CANDIDATE_CONFIG||{},$=id=>document.getElementById(id);
const file=location.pathname.split("/").pop();
let token=sessionStorage.getItem("candidate_google_credential")||"",activeJob=null,member=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function status(message,id="status"){if($(id))$(id).textContent=message||""}
async function api(action,payload={},publicCall=false){
  if(!cfg.GAS_URL)throw Error("GAS接続URLが設定されていません。assets/js/config.jsを確認してください。");
  if(!publicCall&&!token)throw Error("この機能には会員ログインが必要です。");
  const body={action,payload};if(token)body.googleCredential=token;
  const response=await fetch(cfg.GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body),cache:"no-store"});
  const result=await response.json();if(!result.ok)throw Error(result.message||"サーバー処理に失敗しました。");return result.data;
}
function signOut(){sessionStorage.removeItem("candidate_google_credential");token="";location.href="./candidate-login.html"}
function setBusy(button,busy,label){if(!button)return;button.disabled=busy;if(busy){button.dataset.label=button.textContent;button.textContent=label||"処理中…"}else{button.textContent=button.dataset.label||button.textContent}}
function collectRegister(){return{
  name:$("name").value.trim(),phone:$("phone").value.trim(),
  allowScouts:$("allowScouts").checked
}}
function collectProfile(form){
  const d=Object.fromEntries(new FormData(form).entries());
  d.allowScouts=!!form.elements.allowScouts.checked;
  return d;
}
window.handleCandidateGoogle=async response=>{
  if(!response?.credential){status("Google認証情報を取得できませんでした。");return}
  token=response.credential;sessionStorage.setItem("candidate_google_credential",token);
  try{
    const me=await api("candidateMe");
    if(me.active){location.href="./candidate-index.html";return}
    $("registerForm").hidden=false;
    status("Google認証が完了しました。必須情報を入力して会員登録してください。");
  }catch(e){status(e.message);sessionStorage.removeItem("candidate_google_credential");token=""}
};
function initLogin(){
  const start=Date.now(),timer=setInterval(()=>{
    if(window.google?.accounts?.id&&cfg.GOOGLE_CLIENT_ID){
      clearInterval(timer);
      google.accounts.id.initialize({client_id:cfg.GOOGLE_CLIENT_ID,callback:window.handleCandidateGoogle,auto_select:false});
      google.accounts.id.renderButton($("googleButton"),{theme:"filled_blue",size:"large",shape:"pill",text:"continue_with",width:300});
    }else if(Date.now()-start>15000){clearInterval(timer);status("Googleログインを読み込めません。再読み込みしてください。")}
  },250);
  $("registerForm").addEventListener("submit",async e=>{
    e.preventDefault();if(!token){status("先にGoogleログインを行ってください。");return}
    const button=$("registerButton");setBusy(button,true,"登録中…");
    try{
      const payload=collectRegister();
      if(!payload.name||!payload.phone)throw Error("氏名と電話番号を入力してください。");
      await api("candidateRegister",payload);
      status("会員登録が完了しました。履歴書・職務経歴書を作成してください。");
      location.href="./candidate-index.html?tab=profile";
    }catch(err){status(err.message)}finally{setBusy(button,false)}
  });
}
async function listJobs(){
  const host=$("jobs");if(!host)return;host.innerHTML='<div class="loading">求人を読み込んでいます…</div>';
  try{
    const jobs=await api("candidatePublicListJobs",{q:$("q")?.value||"",location:$("location")?.value||"",employmentType:$("employmentType")?.value||""},true);
    host.innerHTML=jobs.length?jobs.map(j=>`<article class="job-card">
      <div class="chips"><span class="chip">${esc(j.employmentType||"雇用形態未設定")}</span><span class="chip">${esc(j.location||"勤務地未設定")}</span></div>
      <h3>${esc(j.title||"求人")}</h3><div class="job-company">${esc(j.companyName||"掲載企業")}</div>
      <div class="salary">${esc(j.salary||"給与条件は詳細をご確認ください")}</div>
      <p class="job-summary">${esc(String(j.description||"").slice(0,145))}${String(j.description||"").length>145?"…":""}</p>
      <div class="job-actions"><button class="primary" data-detail="${esc(j.id)}">求人詳細を見る</button>${token?`<button class="secondary" data-favorite="${esc(j.id)}">お気に入り</button>`:""}</div>
    </article>`).join(""):'<div class="empty">現在公開中の求人はありません。</div>';
    host.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>showDetail(b.dataset.detail));
    host.querySelectorAll("[data-favorite]").forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.favorite));
    status(`${jobs.length}件の求人を表示しています。`,"jobStatus");
  }catch(e){host.innerHTML=`<div class="empty">${esc(e.message)}</div>`}
}
async function showDetail(id){
  try{
    const j=await api("candidatePublicGetJob",{jobId:id},true);activeJob=j;
    $("jobDetail").innerHTML=`<p class="eyebrow">JOB DETAILS</p><h2>${esc(j.title)}</h2><p class="job-company">${esc(j.companyName||"掲載企業")}　${esc(j.employmentType||"")}　${esc(j.location||"")}</p><p class="salary">${esc(j.salary||"給与条件は詳細をご確認ください")}</p>
    ${[["仕事内容",j.description],["応募条件",j.requirements],["必須スキル",j.mustSkills],["歓迎スキル",j.preferredSkills],["勤務時間",j.hours],["休日",j.holidays],["勤務地",j.location],["選考",j.interview]].map(([h,v])=>`<div class="detail-block"><h3>${h}</h3><p>${esc(v||"詳細は応募後にご確認ください")}</p></div>`).join("")}
    <div class="job-actions">${token?'<button class="primary" id="applyJob">この求人にエントリー</button><button class="secondary" id="detailFavorite">お気に入り</button>':`<a class="primary" href="./candidate-login.html?jobId=${encodeURIComponent(id)}">会員登録してエントリー</a>`}</div><p id="detailStatus" class="status"></p>`;
    $("jobDialog").showModal();
    $("applyJob")?.addEventListener("click",async()=>{
      try{const r=await api("candidateApplyJob",{jobId:id});status(r.message||"エントリーを受け付けました。","detailStatus")}
      catch(e){status(e.message,"detailStatus");if(/履歴書|職務経歴書|書類/.test(e.message)){ $("jobDialog").close();switchPane("profilePane")}}
    });
    $("detailFavorite")?.addEventListener("click",()=>toggleFavorite(id));
  }catch(e){status(e.message,"jobStatus")}
}
async function toggleFavorite(jobId){try{const r=await api("candidateToggleFavorite",{jobId});status(r.message||"お気に入りを更新しました。");if(!$("favoritesPane").hidden)loadFavorites()}catch(e){status(e.message)}}
async function loadApplications(){try{const rows=await api("candidateListApplications");$("applications").innerHTML=rows.length?rows.map(x=>`<article class="job-card"><h3>${esc(x.jobTitle)}</h3><p>${esc(x.companyName||"")}　<span class="chip">${esc(x.status||"受付")}</span></p><small>${esc(x.createdAt||"")}</small></article>`).join(""):'<div class="empty">エントリー履歴はありません。</div>'}catch(e){$("applications").innerHTML=`<p class="status">${esc(e.message)}</p>`}}
async function loadOffers(){try{const rows=await api("candidateListScouts");$("offers").innerHTML=rows.length?rows.map(x=>`<article class="job-card"><h3>${esc(x.companyName||"企業")}｜${esc(x.jobTitle||"オファー")}</h3><p>${esc(x.message||"")}</p><span class="chip">${esc(x.status||"確認待ち")}</span>${x.status==="回答待ち"?`<div class="job-actions"><button class="primary" data-accept="${esc(x.scoutId)}">オファーを承諾</button><button class="secondary" data-decline="${esc(x.scoutId)}">辞退する</button></div>`:""}</article>`).join(""):'<div class="empty">オファー・スカウトはありません。受信設定がONの場合に企業から届きます。</div>';
  $("offers").querySelectorAll("[data-accept]").forEach(b=>b.onclick=()=>respondScout(b.dataset.accept,"承諾"));
  $("offers").querySelectorAll("[data-decline]").forEach(b=>b.onclick=()=>respondScout(b.dataset.decline,"辞退"));
 }catch(e){$("offers").innerHTML=`<p class="status">${esc(e.message)}</p>`}}
async function respondScout(scoutId,decision){try{await api("candidateRespondScout",{scoutId,decision});loadOffers()}catch(e){status(e.message)}}
async function loadFavorites(){try{const rows=await api("candidateListFavorites");$("favorites").innerHTML=rows.length?rows.map(x=>`<article class="job-card"><h3>${esc(x.jobTitle)}</h3><button class="primary" data-open="${esc(x.jobId)}">求人詳細</button></article>`).join(""):'<div class="empty">お気に入り求人はありません。</div>'; $("favorites").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>showDetail(b.dataset.open))}catch(e){$("favorites").innerHTML=`<p class="status">${esc(e.message)}</p>`}}
async function loadProfile(){
  try{
    const p=await api("candidateGetProfile"),f=$("profileForm");
    const values=Object.assign({},p.basic||{},p.resume||{},p.workHistory||{});
    Object.entries(values).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v||""});
    f.elements.email.value=p.email||member?.email||"";
    f.elements.allowScouts.checked=p.scoutOptIn===true||p.scoutOptIn==="公開"||p.allowScouts===true;
  }catch(e){status(e.message,"profileStatus")}
}
async function saveProfile(e){
  e.preventDefault();const button=$("saveProfile");setBusy(button,true,"保存中…");
  try{
    const formData=collectProfile(e.currentTarget);
    const required=["name","phone","birthDate","address","education","graduation","educationDetail","qualifications","selfPr","summary","experience","workDetails","achievements","skills"];
    const missing=required.filter(k=>!String(formData[k]||"").trim());
    if(missing.length)throw Error("履歴書・職務経歴書の必須項目をすべて入力してください。");

    // GAS側 candidateSaveProfile_ は resume / workHistory の2階層で保存する。
    // 画面フォームのフラットな値を、保存APIが受け取る形式へ変換する。
    const data={
      resume:{
        name:formData.name, phone:formData.phone, birthDate:formData.birthDate,
        address:formData.address, email:formData.email, education:formData.education,
        graduation:formData.graduation, educationDetail:formData.educationDetail,
        qualifications:formData.qualifications, selfPr:formData.selfPr
      },
      workHistory:{
        summary:formData.summary, experience:formData.experience,
        workDetails:formData.workDetails, achievements:formData.achievements,
        skills:formData.skills
      },
      allowScouts:formData.allowScouts
    };
    const result=await api("candidateSaveProfile",data);
    // 保存直後にサーバーから再取得し、永続化できた内容を画面へ反映する。
    await loadProfile();
    status(result.message||"プロフィール・応募書類を保存しました。","profileStatus");
  }catch(e){status(e.message,"profileStatus")}finally{setBusy(button,false)}
}
function switchPane(id){
  ["jobsPane","applicationsPane","offersPane","favoritesPane","profilePane"].forEach(x=>$(x).hidden=x!==id);
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.pane===id));
  if(id==="applicationsPane")loadApplications();if(id==="offersPane")loadOffers();if(id==="favoritesPane")loadFavorites();if(id==="profilePane")loadProfile();
  window.scrollTo({top:0,behavior:"smooth"});
}
async function initHome(){
  if(token){
    try{
      member=await api("candidateMe");
      if(member.active){
        $("loginLink").hidden=true;$("logout").hidden=false;$("memberName").hidden=false;$("memberName").textContent=(member.user?.name||"会員")+" さん";
        $("memberTabs").hidden=false;$("logout").onclick=signOut;
      }else{sessionStorage.removeItem("candidate_google_credential");token=""}
    }catch(e){sessionStorage.removeItem("candidate_google_credential");token=""}
  }
  document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>switchPane(b.dataset.pane));
  $("searchButton").onclick=listJobs;$("closeDialog").onclick=()=>$("jobDialog").close();
  $("profileForm").addEventListener("submit",saveProfile);
  await listJobs();
  if(member?.active&&new URLSearchParams(location.search).get("tab")==="profile")switchPane("profilePane");
}
if(file==="candidate-login.html")initLogin();else initHome();
})();
