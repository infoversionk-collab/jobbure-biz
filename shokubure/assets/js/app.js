/* 職ブレ-matching- 企業ワークスペース：GitHub Pages + GAS API版 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STATE = { user:null, jobs:[], savedJobs:[], selectedJob:null, tab:"all", downloadFormat:"txt", ownJobs:[], candidates:[], registeredCandidates:[] };
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
  $("own-jobs-filter").addEventListener("click",()=>switchWorkspace("own"));
  $("candidate-filter").addEventListener("click",()=>switchWorkspace("candidates"));
  $("registered-candidates-filter").addEventListener("click",()=>switchWorkspace("registeredCandidates"));
  $("open-register-candidate").addEventListener("click",()=>openModal("register-candidate-modal"));
  $("register-candidate-close").addEventListener("click",()=>closeModal("register-candidate-modal"));
  $("register-candidate-modal").addEventListener("click",e=>{if(e.target===$("register-candidate-modal"))closeModal("register-candidate-modal");});
  $("register-candidate-form").addEventListener("submit",submitRegisteredCandidate);
  $("create-own-job").addEventListener("click",()=>openOwnJobForm());
  $("own-job-close").addEventListener("click",()=>closeModal("own-job-modal"));
  $("own-job-modal").addEventListener("click",e=>{if(e.target===$("own-job-modal"))closeModal("own-job-modal");});
  $("own-job-form").addEventListener("submit",submitOwnJob);
  $("candidate-search-button").addEventListener("click",loadCandidates);
  $("candidate-search").addEventListener("keydown",e=>{if(e.key==="Enter")loadCandidates();});
  $("scout-close").addEventListener("click",()=>closeModal("scout-modal"));
  $("scout-form").addEventListener("submit",submitScout);

  function switchWorkspace(tab){
    STATE.tab=tab;
    const jobsMode=tab==="all"||tab==="saved";
    $("search-panel").hidden=!jobsMode || tab==="saved";
    $("results-heading").hidden=!jobsMode;
    $("job-list").hidden=!jobsMode;
    $("own-jobs-panel").hidden=tab!=="own";
    $("candidates-panel").hidden=tab!=="candidates";
    $("registered-candidates-panel").hidden=tab!=="registeredCandidates";
    $("app-welcome").hidden=!jobsMode;
    $("all-filter").classList.toggle("active",tab==="all");
    $("saved-filter").classList.toggle("active",tab==="saved");
    $("own-jobs-filter").classList.toggle("active",tab==="own");
    $("candidate-filter").classList.toggle("active",tab==="candidates");
    $("registered-candidates-filter").classList.toggle("active",tab==="registeredCandidates");
    $("workspace-title").textContent=tab==="own"?"自社案件の作成・管理":tab==="candidates"?"求職者一覧":tab==="registeredCandidates"?"自社登録求職者":tab==="saved"?"保存した求人":"求人を探す";
    if(tab==="own")loadOwnJobs();
    if(tab==="candidates")loadCandidates();
    if(tab==="registeredCandidates")loadRegisteredCandidates();
    if(tab==="all")loadJobs();
    if(tab==="saved")loadSavedJobs();
  }
  async function loadOwnJobs(){
    $("own-job-list").innerHTML='<div class="empty-state">自社求人を読み込んでいます。</div>';
    try{
      STATE.ownJobs=await request("businessListOwnJobs")||[];
      $("own-job-limit").textContent=`自社求人：${STATE.ownJobs.length}件／最大3件（審査待ち・公開中を含む）`;
      $("create-own-job").disabled=STATE.ownJobs.length>=3;
      $("create-own-job").textContent=STATE.ownJobs.length>=3?"上限3件に達しています":"＋ 求人を作成";
      if(!STATE.ownJobs.length){$("own-job-list").innerHTML='<div class="empty-state"><b>自社求人はまだありません</b><p>「求人を作成」から登録できます。</p></div>';return;}
      $("own-job-list").innerHTML=STATE.ownJobs.map(j=>`<article class="own-job-card">
        <div class="candidate-tags"><span>${esc(j.status||"審査待ち")}</span><span>${esc(j.jobStatus||"")}</span></div>
        <h3>${esc(j.title||"求人名未設定")}</h3><p>求人ID：${esc(j.id)}<br>更新：${esc(j.updatedAt||"—")}</p>
        ${j.reviewMemo?`<p>審査メモ：${esc(j.reviewMemo)}</p>`:""}
        <div class="feature-actions"><button class="button button-secondary" data-edit-own="${esc(j.id)}">編集</button></div>
      </article>`).join("");
      $("own-job-list").querySelectorAll("[data-edit-own]").forEach(b=>b.addEventListener("click",()=>editOwnJob(b.dataset.editOwn)));
    }catch(e){$("own-job-list").innerHTML=`<div class="empty-state"><b>自社求人を取得できません</b><p>${esc(e.message)}</p></div>`;handleAuthError(e);}
  }
  function ownJobPayload(){
    const get=id=>$(id).value.trim();
    return {jobId:get("own-job-id"),title:get("own-title"),businessType:get("own-business-type"),jobType:get("own-job-type"),employmentType:get("own-employment"),salaryDisplay:get("own-salary"),location:get("own-location"),hours:get("own-hours"),remote:get("own-remote"),holidays:get("own-holidays"),description:get("own-description"),requirements:get("own-requirements"),mustSkills:get("own-must"),preferredSkills:get("own-preferred"),interview:get("own-interview"),documents:get("own-documents"),notes:get("own-notes")};
  }
  function fillOwnJobForm(j={}){
    const set=(id,v)=>$(id).value=v||"";
    set("own-job-id",j.id);set("own-title",j.title);set("own-business-type",j.businessType||"BPO");set("own-job-type",j.jobType);set("own-employment",j.employmentType||"正社員");set("own-salary",j.salaryDisplay);set("own-location",j.location);set("own-hours",j.hours);set("own-remote",j.remote);set("own-holidays",j.holidays);set("own-description",j.description);set("own-requirements",j.requirements);set("own-must",j.mustSkills);set("own-preferred",j.preferredSkills);set("own-interview",j.interview);set("own-documents",j.documents);set("own-notes",j.notes);
  }
  function openOwnJobForm(){if(STATE.ownJobs.length>=3){showToast("自社求人は最大3件までです。");return;}$("own-job-form").reset();fillOwnJobForm();$("own-job-modal-title").textContent="自社求人を作成";openModal("own-job-modal");}
  async function editOwnJob(id){
    try{const j=await request("businessGetOwnJob",{jobId:id});$("own-job-form").reset();fillOwnJobForm(j);$("own-job-modal-title").textContent="自社求人を編集";openModal("own-job-modal");}
    catch(e){showToast(e.message);handleAuthError(e);}
  }
  async function submitOwnJob(e){
    e.preventDefault();const p=ownJobPayload();const btn=$("own-job-save");setBusy(btn,true,"保存中…");
    try{
      const action=p.jobId?"businessUpdateOwnJob":"businessSubmitOwnJob";
      const r=await request(action,p);closeModal("own-job-modal");showToast(r.message||"求人を保存しました。");await loadOwnJobs();
    }catch(err){showToast(err.message);handleAuthError(err);}
    finally{setBusy(btn,false);}
  }
  async function loadRegisteredCandidates(){
    const host=$("registered-candidate-list");host.innerHTML='<div class="empty-state">自社登録求職者を読み込んでいます。</div>';
    try{STATE.registeredCandidates=await request("businessListRegisteredCandidates")||[];
      if(!STATE.registeredCandidates.length){host.innerHTML='<div class="empty-state">登録済みの求職者はいません。</div>';return;}
      const jobs=await request("listBusinessJobs",{filters:{}})||[];
      host.innerHTML=STATE.registeredCandidates.map(c=>`<article class="own-job-card"><h3>${esc(c.name)}</h3><p>${esc(c.age||"年齢未登録")}歳｜${esc(c.gender||"未回答")}<br>${esc([c.prefecture,c.city].filter(Boolean).join(" "))}<br>学歴：${esc(c.education||"未登録")}<br>職歴：${esc(c.experience||"未登録")}<br>スキル：${esc(c.skills||"未登録")}</p><label class="modal-label">応募する求人</label><select data-job-for="${esc(c.candidateId)}">${jobs.map(j=>`<option value="${esc(j.id)}">${esc(j.title)}｜${esc(j.employmentType||"")}</option>`).join("")}</select><button class="button button-primary" data-apply-candidate="${esc(c.candidateId)}">この求職者でエントリー</button></article>`).join("");
      host.querySelectorAll("[data-apply-candidate]").forEach(b=>b.addEventListener("click",async()=>{const id=b.dataset.applyCandidate,sel=host.querySelector(`[data-job-for="${CSS.escape(id)}"]`);if(!sel||!sel.value){showToast("応募する求人を選択してください。");return;}b.disabled=true;try{const r=await request("businessApplyRegisteredCandidate",{candidateId:id,jobId:sel.value});showToast(r.message||"処理しました。");}catch(e){showToast(e.message);}finally{b.disabled=false;}}));
    }catch(e){host.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;handleAuthError(e);}
  }
  async function submitRegisteredCandidate(e){e.preventDefault();const b=$("register-candidate-submit");setBusy(b,true,"登録中…");try{const p={name:$("reg-cand-name").value.trim(),email:$("reg-cand-email").value.trim(),consent:$("reg-cand-consent").checked,phone:$("reg-cand-phone").value.trim(),age:$("reg-cand-age").value,gender:$("reg-cand-gender").value,prefecture:$("reg-cand-prefecture").value.trim(),city:$("reg-cand-city").value.trim(),education:$("reg-cand-education").value.trim(),experience:$("reg-cand-experience").value.trim(),skills:$("reg-cand-skills").value.trim()};const r=await request("businessRegisterCandidate",p);closeModal("register-candidate-modal");$("register-candidate-form").reset();showToast(r.message||"求職者を登録しました。");await loadRegisteredCandidates();}catch(e){showToast(e.message);}finally{setBusy(b,false);}}
  async function loadCandidates(){
    $("candidate-list").innerHTML='<div class="empty-state">公開プロフィールを読み込んでいます。</div>';
    try{
      STATE.candidates=await request("businessListCandidates",{q:$("candidate-search").value.trim()})||[];
      if(!STATE.candidates.length){$("candidate-list").innerHTML='<div class="empty-state"><b>公開中の求職者はいません</b><p>求職者がプロフィール公開とスカウト受信を許可すると表示されます。</p></div>';return;}
      $("candidate-list").innerHTML=STATE.candidates.map((c,i)=>{
        const p=c.profile||{};
        const section=(label,value)=>value?`<div class="candidate-section"><b>${label}</b><p>${esc(value)}</p></div>`:"";
        return `<article class="candidate-card">
          <div class="candidate-tags"><span>匿名プロフィール ${i+1}</span>${p.age?`<span>${esc(p.age)}歳</span>`:""}${p.gender?`<span>${esc(p.gender)}</span>`:""}${p.location?`<span>${esc(p.location)}</span>`:""}</div>
          <h3>求職者プロフィール</h3>
          ${section("学歴",p.educationSummary||p.education)}
          ${section("職務要約",p.experience)}
          ${section("職務経歴・業務内容",p.workDetails)}
          ${section("実績",p.achievements)}
          ${section("スキル",p.skills)}
          ${section("資格",p.qualifications)}
          ${section("自己PR",p.selfPr)}
          <div class="feature-actions"><button class="button button-primary" data-contact-candidate="${esc(c.candidateId)}">求人を選んでメッセージ</button></div>
        </article>`;
      }).join("");
      $("candidate-list").querySelectorAll("[data-contact-candidate]").forEach(b=>b.addEventListener("click",()=>openScoutForm(b.dataset.contactCandidate)));
    }catch(e){$("candidate-list").innerHTML=`<div class="empty-state"><b>求職者情報を取得できません</b><p>${esc(e.message)}</p></div>`;handleAuthError(e);}
  }
  function openScoutForm(candidateId){
    if(!STATE.jobs.length){showToast("メッセージを送るには、先に求人を読み込んでください。");return;}
    $("scout-candidate-select").innerHTML=STATE.candidates.map((c,i)=>`<option value="${esc(c.candidateId)}">匿名プロフィール ${i+1}｜${esc(c.profile&&c.profile.age?c.profile.age+"歳":"年齢未登録")}｜${esc(c.profile&&c.profile.location||"居住地未登録")}</option>`).join("");
    $("scout-candidate-select").value=candidateId;
    $("scout-job").innerHTML=STATE.jobs.map(j=>`<option value="${esc(j.id)}">${esc(j.title)}（${esc(j.id)}）</option>`).join("");
    $("scout-message").value="プロフィールを拝見し、ぜひ一度お話ししたくご連絡しました。ご興味があればご返信ください。";
    openModal("scout-modal");
  }
  async function submitScout(e){
    e.preventDefault();const btn=$("scout-submit");setBusy(btn,true,"送信中…");
    try{
      const r=await request("businessSendScout",{candidateId:$("scout-candidate-select").value,jobId:$("scout-job").value,message:$("scout-message").value.trim()});
      closeModal("scout-modal");showToast(r.message||"メッセージを送信しました。");
    }catch(err){showToast(err.message);handleAuthError(err);}
    finally{setBusy(btn,false);}
  }
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
  async function switchTab(tab){switchWorkspace(tab);}
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
          <button class="button button-secondary" id="detail-scout">求職者へスカウト</button>
          <button class="button button-primary" id="detail-inquiry">Version-Kへ問い合わせ</button>
        </div>`;
      $("detail-save").addEventListener("click",()=>toggleSaved(job.id));
      $("download-txt").addEventListener("click",()=>openDownloadOptions("txt"));
      $("download-pdf").addEventListener("click",()=>openDownloadOptions("pdf"));
      $("detail-inquiry").addEventListener("click",openInquiry);
      $("detail-scout").addEventListener("click",openScout);
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
  async function openScout(){
    if(!STATE.selectedJob)return;
    try{
      const candidates=await request("businessListCandidates",{});
      if(!candidates.length){showToast("公開中の求職者はいません。");return;}
      $("scout-candidate-select").innerHTML=candidates.map((c,i)=>`<option value="${esc(c.candidateId)}">匿名プロフィール ${i+1}｜${esc(c.profile&&c.profile.age?c.profile.age+"歳":"年齢未登録")}｜${esc(c.profile&&c.profile.location||"居住地未登録")}</option>`).join("");
      $("scout-job").innerHTML=`<option value="${esc(STATE.selectedJob.id)}">${esc(STATE.selectedJob.title)}（${esc(STATE.selectedJob.id)}）</option>`;
      $("scout-message").value="求人にご興味があれば、メッセージでお話しできればと思います。";
      closeModal("job-modal");openModal("scout-modal");
    }catch(e){showToast(e.message);handleAuthError(e);}
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
      await loadSavedJobs();
      await loadJobs();
    }catch(e){
      $("job-list").innerHTML=`<div class="empty-state"><b>ログイン・利用権限を確認できません</b><p>${esc(e.message)}</p></div>`;
      notify(e.message,true);handleAuthError(e);
    }
  }
  init();
});
