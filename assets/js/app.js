/* 職ブレ-Business- 求人アプリ：GitHub Pages + GAS API版 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STATE = { user:null, jobs:[], savedJobs:[], selectedJob:null, tab:"all", downloadFormat:"txt" };
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const showToast = message => {
    const el=$("toast"); el.textContent=message; el.classList.add("show");
    window.setTimeout(()=>el.classList.remove("show"),3500);
  };
  const notify = (message, error=false) => {
    const el=$("app-notice");
    if (!el) { showToast(message); return; }
    el.textContent=message; el.className="app-notice"+(error?" error":"");
    el.hidden=false;
  };
  const request = (action,payload={}) => ShokubureAPI.request(action,payload);
  const money = (v, fallback="条件確認") => String(v == null || v === "" ? fallback : v);

  if (!window.ShokubureAPI || !ShokubureAPI.credential()) {
    location.replace("login.html"); return;
  }

  $("logout-button").addEventListener("click",()=>{
    ShokubureAPI.clearCredential(); location.replace("login.html");
  });
  $("sidebar-toggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  $("modal-close").addEventListener("click",()=>closeModal("job-modal"));
  $("job-modal").addEventListener("click",e=>{if(e.target===$("job-modal"))closeModal("job-modal");});
  $("download-modal").addEventListener("click",e=>{if(e.target===$("download-modal"))closeModal("download-modal");});
  $("inquiry-modal").addEventListener("click",e=>{if(e.target===$("inquiry-modal"))closeModal("inquiry-modal");});
  $("search-button").addEventListener("click",loadJobs);
  $("search-query").addEventListener("keydown",e=>{if(e.key==="Enter")loadJobs();});
  $("location-query").addEventListener("keydown",e=>{if(e.key==="Enter")loadJobs();});
  $("saved-filter").addEventListener("click",()=>switchTab("saved"));
  $("all-filter").addEventListener("click",()=>switchTab("all"));
  $("download-audience").addEventListener("change",updateDownloadFields);
  $("download-execute").addEventListener("click",executeDownload);
  $("inquiry-form").addEventListener("submit",submitInquiry);

  function openModal(id){$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
  function closeModal(id){$(id).classList.remove("open");$(id).setAttribute("aria-hidden","true");if(!document.querySelector(".modal-backdrop.open"))document.body.style.overflow="";}
  function setBusy(button,busy,label){button.disabled=busy;if(busy){button.dataset.oldLabel=button.textContent;button.textContent=label||"処理中…";}else{button.textContent=button.dataset.oldLabel||button.textContent;}}
  function renderJobs(){
    const list=STATE.tab==="saved"
      ? STATE.savedJobs.map(s=>STATE.jobs.find(j=>String(j.id)===String(s.id))).filter(Boolean)
      : STATE.jobs;
    $("results-count").textContent=`${list.length} 件`;
    $("results-title").textContent=STATE.tab==="saved"?"保存した求人":"公開中の求人";
    $("results-caption").textContent=STATE.tab==="saved"?"保存した案件を確認できます。":"条件に合う案件を表示します。";
    if(!list.length){
      $("job-list").innerHTML=`<div class="empty-state"><b>${STATE.tab==="saved"?"保存した求人はありません":"該当する求人はありません"}</b><p>${STATE.tab==="saved"?"求人詳細から保存できます。":"検索条件を変更してください。"}</p></div>`;
      return;
    }
    $("job-list").innerHTML=list.map(job=>{
      const saved=STATE.savedJobs.some(x=>String(x.id)===String(job.id));
      const regular=String(job.employmentType||"").includes("正社員");
      const price=regular?money(job.salary,"給与条件確認"):money(job.amount,"条件確認");
      return `<article class="job-card" data-id="${esc(job.id)}">
        <div class="job-card-top"><span class="job-tag">${esc(job.businessType||"求人案件")}</span>
          <button class="save-job ${saved?"saved":""}" data-save="${esc(job.id)}" aria-label="${saved?"保存解除":"求人を保存"}">${saved?"★":"☆"}</button></div>
        <h3>${esc(job.title)}</h3>
        <div class="job-meta"><span>${esc(job.jobType||"職種未設定")}</span><span>・</span><span>${esc(job.location||"勤務地未設定")}</span></div>
        <div class="job-card-foot"><span>${esc(job.employmentType||"")}</span><span>${esc(price)}</span><b>詳細を見る →</b></div>
      </article>`;
    }).join("");
    $("job-list").querySelectorAll(".job-card").forEach(card=>{
      card.addEventListener("click",e=>{
        if(e.target.closest("[data-save]"))return;
        showDetail(card.dataset.id);
      });
    });
    $("job-list").querySelectorAll("[data-save]").forEach(btn=>{
      btn.addEventListener("click",e=>{e.stopPropagation();toggleSaved(btn.dataset.save);});
    });
  }
  async function loadJobs(){
    $("job-list").innerHTML='<div class="empty-state"><div class="loading-spinner"></div><b>求人情報を読み込んでいます</b></div>';
    try{
      const filters={q:$("search-query").value.trim(),businessType:$("business-type").value,location:$("location-query").value.trim()};
      STATE.jobs=await request("listBusinessJobs",{filters})||[];
      if(STATE.tab==="all")renderJobs();
      else await loadSavedJobs();
      notify("求人情報を更新しました。");
    }catch(e){
      $("job-list").innerHTML=`<div class="empty-state"><b>求人情報を取得できません</b><p>${esc(e.message)}</p></div>`;
      handleAuthError(e);
    }
  }
  async function loadSavedJobs(){
    STATE.savedJobs=await request("getBusinessSavedJobs")||[];
    const missing=STATE.savedJobs.filter(s=>!STATE.jobs.some(j=>String(j.id)===String(s.id)));
    for(const s of missing){
      try{const j=await request("getBusinessJob",{jobId:s.id});if(j)STATE.jobs.push(j);}catch(_e){}
    }
    renderJobs();
  }
  async function switchTab(tab){
    STATE.tab=tab;
    $("all-filter").classList.toggle("active",tab==="all");
    $("saved-filter").classList.toggle("active",tab==="saved");
    $("search-panel").hidden=tab==="saved";
    if(tab==="saved"){
      try{await loadSavedJobs();}catch(e){notify(e.message,true);handleAuthError(e);}
    }else renderJobs();
  }
  async function toggleSaved(jobId){
    try{
      const exists=STATE.savedJobs.some(x=>String(x.id)===String(jobId));
      if(exists)await request("removeBusinessSavedJob",{jobId});
      else await request("saveBusinessJob",{jobId});
      await loadSavedJobs();
      if(STATE.tab==="all")renderJobs();
      if(STATE.selectedJob&&String(STATE.selectedJob.id)===String(jobId))updateDetailSaveButton();
      showToast(exists?"保存を解除しました。":"求人を保存しました。");
    }catch(e){showToast(e.message);handleAuthError(e);}
  }
  function updateDetailSaveButton(){
    const btn=$("detail-save");
    if(!btn||!STATE.selectedJob)return;
    const saved=STATE.savedJobs.some(x=>String(x.id)===String(STATE.selectedJob.id));
    btn.textContent=saved?"保存を解除":"求人を保存";
  }
  async function showDetail(id){
    try{
      const job=await request("getBusinessJob",{jobId:id});
      STATE.selectedJob=job;
      const regular=String(job.employmentType||"").includes("正社員");
      const bpo=!!job.isBpo||String(job.businessType||"").toUpperCase().includes("BPO");
      const base=[["事業区分",job.businessType],["職種",job.jobType],["雇用形態",job.employmentType]];
      const compensation=regular
        ? [["給与",job.salary],["報酬額（紹介手数料）",job.rewardAmount],["交通費",job.transport]]
        : (bpo?[["貴社卸単価",job.wholesaleUnit||job.amount],["交通費",job.transport]]:[["給与",job.salary],["交通費",job.transport]]);
      const conditions=[["稼働時間",job.hours],["勤務時間帯",job.schedule],["勤務地",job.location],["最寄駅",job.station],["リモート条件",job.remote],["休日",job.holidays],["勤務開始日",job.startDate],["募集終了日",job.endDate]];
      const panel=items=>items.filter(x=>String(x[1]||"").trim()!=="").map(x=>`<div class="detail-item"><span>${esc(x[0])}</span><b>${esc(x[1])}</b></div>`).join("");
      const section=(title,value)=>value?`<section class="detail-section"><h4>${esc(title)}</h4><p>${esc(value)}</p></section>`:"";
      const seekerNote=bpo?"求職者へ提出する際は、候補者に提示する時給に合わせて給与欄を調整してご活用ください。":"求職者へ提出する際は、掲載内容をご確認のうえ、候補者への求人案内にご活用ください。";
      $("job-detail").innerHTML=`
        <div class="detail-kicker">JOB DETAIL / ${esc(job.id)}</div><h2 class="detail-title">${esc(job.title)}</h2>
        <div class="detail-tags"><span>${esc(job.businessType)}</span><span>${esc(job.employmentType)}</span></div>
        <h3 class="detail-heading">基本情報</h3><div class="detail-grid">${panel(base)}</div>
        <h3 class="detail-heading">給与・報酬</h3><div class="detail-grid">${panel(compensation)}</div>
        <p class="detail-note">※給与・報酬額は内定時に確定。金額は税込表示。</p>
        ${regular?'<p class="detail-note">注意：貴社報酬は、上記金額より貴社契約手数料にてお支払いいたします。</p>':`<p class="detail-note">${esc(seekerNote)}</p>`}
        <h3 class="detail-heading">勤務条件</h3><div class="detail-grid">${panel(conditions)}</div>
        ${section("仕事内容",job.description)}${section("応募条件",job.requirements)}
        ${section("必須スキル",job.mustSkills)}${section("歓迎スキル",job.preferredSkills)}
        ${section("年齢条件",job.age)}${section("面談回数・選考",job.interview)}${section("提出書類",job.documents)}
        <div class="detail-actions">
          <button class="button button-secondary" id="detail-save">求人を保存</button>
          <button class="button button-secondary" id="download-txt">TXTをダウンロード</button>
          <button class="button button-secondary" id="download-pdf">PDFをダウンロード</button>
          <button class="button button-primary" id="detail-inquiry">Version-Kへ問い合わせ</button>
        </div>`;
      $("detail-save").addEventListener("click",()=>toggleSaved(job.id));
      $("download-txt").addEventListener("click",()=>openDownloadOptions("txt"));
      $("download-pdf").addEventListener("click",()=>openDownloadOptions("pdf"));
      $("detail-inquiry").addEventListener("click",openInquiry);
      updateDetailSaveButton();
      openModal("job-modal");
    }catch(e){notify(e.message,true);handleAuthError(e);}
  }
  function openDownloadOptions(format){
    if(!STATE.selectedJob)return;
    STATE.downloadFormat=format;
    $("download-audience").value="business";
    $("download-amount").value="";
    updateDownloadFields();
    closeModal("job-modal");openModal("download-modal");
  }
  function updateDownloadFields(){
    const job=STATE.selectedJob||{};
    const audience=$("download-audience").value;
    const bpo=!!job.isBpo||String(job.businessType||"").toUpperCase().includes("BPO")||String(job.jobType||"").toUpperCase().includes("BPO");
    const needsAmount=bpo&&audience==="jobseeker";
    $("download-amount-box").hidden=!needsAmount;
    $("download-amount").required=needsAmount;
    $("download-amount").value="";
    $("download-amount-label").textContent="求職者向け給与（時給・今回のダウンロードのみ）";
    $("download-amount").placeholder="例：時給1,500円";
    $("download-amount-notice").textContent="元の貴社卸単価を上限として時給を設定できます。入力した金額は今回のダウンロードにのみ反映されます。";
  }
  async function executeDownload(){
    const job=STATE.selectedJob;if(!job)return;
    const audience=$("download-audience").value;
    const bpo=!!job.isBpo||String(job.businessType||"").toUpperCase().includes("BPO")||String(job.jobType||"").toUpperCase().includes("BPO");
    const needsAmount=bpo&&audience==="jobseeker";
    const requestedAmount=needsAmount?$("download-amount").value.trim():null;
    if(needsAmount&&!requestedAmount){showToast("求職者向け給与（時給）を入力してください。");return;}
    const btn=$("download-execute");setBusy(btn,true,"作成中…");
    try{
      if(STATE.downloadFormat==="txt"){
        const r=await request("downloadBusinessJobText",{jobId:job.id,audience,requestedAmount});
        const binary=atob(r.base64);const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        const blob=new Blob([bytes],{type:r.mimeType||"text/plain;charset=utf-8"});
        const url=URL.createObjectURL(blob);const a=document.createElement("a");
        a.href=url;a.download=r.fileName||`${job.id}_求人票.txt`;document.body.appendChild(a);a.click();a.remove();
        window.setTimeout(()=>URL.revokeObjectURL(url),1500);
      }else{
        const r=await request("downloadBusinessJobPdf",{jobId:job.id,audience,requestedAmount});
        const w=window.open(r.url,"_blank","noopener");
        if(!w&&r.downloadUrl)location.href=r.downloadUrl;
      }
      closeModal("download-modal");showToast("求人票を作成しました。");
    }catch(e){showToast(e.message);handleAuthError(e);}
    finally{setBusy(btn,false);}
  }
  function openInquiry(){
    if(!STATE.selectedJob)return;
    $("inquiry-form").reset();
    $("inquiry-job-label").textContent=`対象求人：${STATE.selectedJob.title}（${STATE.selectedJob.id}）`;
    closeModal("job-modal");openModal("inquiry-modal");
  }
  async function submitInquiry(event){
    event.preventDefault();
    if(!STATE.selectedJob)return;
    const btn=$("inquiry-submit");setBusy(btn,true,"送信中…");
    try{
      const r=await request("submitBusinessInquiry",{
        jobId:STATE.selectedJob.id,
        contactName:$("inquiry-contact").value.trim(),
        phone:$("inquiry-phone").value.trim(),
        message:$("inquiry-message").value.trim()
      });
      closeModal("inquiry-modal");
      showToast(`${r.message||"問い合わせを受け付けました。"} 問い合わせ番号：${r.inquiryId||""}`);
    }catch(e){showToast(e.message);handleAuthError(e);}
    finally{setBusy(btn,false);}
  }
  function handleAuthError(e){
    if(/ログイン情報|Google認証|有効期限|再ログイン|利用登録がありません|権限がありません/.test(e.message||"")){
      ShokubureAPI.clearCredential();
      window.setTimeout(()=>location.replace("login.html"),900);
    }
  }
  async function init(){
    try{
      const me=await request("getCurrentBusinessUser");
      if(!me||!me.authenticated)throw new Error(me&&me.message||"利用権限がありません。");
      STATE.user=me;
      $("user-company").textContent=me.companyName||"パートナー";
      $("user-email").textContent=me.email||"";
      $("user-avatar").textContent=(me.companyName||"P").slice(0,1);

      // 管理画面リンクは指定管理者アカウントだけに表示する。
      const adminLink = $("admin-nav-link");
      if (adminLink) {
        const signedInEmail = String(me.email || "").trim().toLowerCase();
        const isDesignatedAdmin = signedInEmail === "yama.78.ken3@gmail.com";
        adminLink.hidden = !isDesignatedAdmin;
      }

      await loadSavedJobs();
      await loadJobs();
    }catch(e){
      $("job-list").innerHTML=`<div class="empty-state"><b>ログイン・利用権限を確認できません</b><p>${esc(e.message)}</p></div>`;
      notify(e.message,true);handleAuthError(e);
    }
  }
  init();
});
