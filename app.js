const members = [
  ["FM", "You · Family", "Adult daughter", "Usually active at this time. No answer to call."],
  ["MC", "Mei · Community Care", "Neighbourhood volunteer", "Visited this morning. No response from the door."],
  ["DR", "Dr. Rao · Professional", "Care coordinator", "Recommends a short safety check before escalation."],
];

let currentRole = "Family member";
let settings = [true, true, false];

function intro(eyebrow, title, subtitle) {
  return `<div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p>`;
}

function button(label, href, kind = "primary") {
  return `<a class="button ${kind}" href="#${href}">${label}</a>`;
}

function memberList() {
  return `<div class="member-list">${members.map((m) => `
    <div class="member">
      <span class="member-avatar">${m[0]}</span>
      <div><strong>${m[1]}</strong><small>${m[2]}</small><p>${m[3]}</p></div>
      <span class="agrees">✓ Agrees</span>
    </div>`).join("")}</div>`;
}

function home() {
  return `
    ${intro("Tuesday · 10:28 AM", "Good morning, Maya.", "Here is what is happening at Eleanor’s home.")}
    <a class="card alert-banner" href="#/alert">
      <span class="alert-icon">!</span>
      <span class="alert-copy"><strong>Unusual inactivity detected</strong><span>Living room · Detected 6 minutes ago · Review recommended</span></span>
      <span class="arrow-link">Review alert →</span>
    </a>
    <section class="card room-card">
      <h2 class="section-title">Home status</h2>
      <div class="room-visual"><img class="room-photo" src="${window.HOME_IMAGE}" alt="An older woman reading safely in her living room"><span class="live-badge">SENSORS ONLINE</span></div>
      <div class="room-footer"><strong>Living room</strong><span>Monitoring active</span></div>
      <div class="device-grid">
        <div class="device"><span class="device-icon">AI</span><strong>AI camera</strong><small>Active</small></div>
        <div class="device"><span class="device-icon">♥</span><strong>Smart watch</strong><small>Active</small></div>
        <div class="device"><span class="device-icon">↔</span><strong>Door sensor</strong><small>Active</small></div>
      </div>
    </section>
    <section class="card risk-strip">
      <div><span class="eyebrow">Current risk</span><strong class="risk-score">82%</strong> <span class="risk-tag">High risk · review now</span></div>
      <div class="risk-actions">${button("Open Care Circle", "/care-circle")} ${button("See why →", "/alert", "soft")}</div>
    </section>
    <a class="sos" href="#/emergency"><span class="sos-circle">SOS</span><span><strong>Emergency call</strong><small>Get immediate help and notify the Care Circle</small></span><span>→</span></a>
    <p class="quick-title">What would you like to do?</p>
    <div class="quick-grid">
      <a class="quick-card" href="#/care-circle">Call family <span class="quick-arrow">→</span></a>
      <a class="quick-card" href="#/care-circle">Open Care Circle <span class="quick-arrow">→</span></a>
      <a class="quick-card" href="#/decision">Review next action <span class="quick-arrow">→</span></a>
    </div>`;
}

function alertDetail() {
  const signals = [
    ["Movement below personal baseline", "No room-to-room movement for 43 minutes. Eleanor’s usual range is 8–15 minutes.", "10:22"],
    ["Watch shows low activity", "Heart rate is normal, but step count has not changed.", "10:18"],
    ["Front door remained closed", "No exit was detected, so an unrecorded trip outside is unlikely.", "9:41"],
  ];
  return `<a class="back-link" href="#/">← Back to home</a>
    ${intro("Explainable risk card", "Unusual inactivity detected", "Living room · 10:22 AM · Review the signals before deciding what to do.")}
    <div class="grid-two">
      <section class="card panel"><h2 class="section-title">What changed</h2>
        ${signals.map((s,i)=>`<div class="signal"><span class="signal-num">${i+1}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div><time>${s[2]}</time></div>`).join("")}
        <div class="why-box"><strong>Why this alert was created</strong><br>CareConnect compares today’s signals with Eleanor’s own routine. It identifies a meaningful change for human review.</div>
      </section>
      <aside class="stack">
        <section class="card panel"><h2 class="section-title">Risk assessment</h2><div class="score">82%</div><span class="risk-tag">High risk · review now</span><div class="meter"><span></span></div><p class="fine-print">Based on three agreeing device signals and Eleanor’s 30-day baseline.</p></section>
        <section class="card panel"><h2 class="section-title">Choose a response</h2><p class="fine-print">Start with people who know Eleanor, or review the options.</p><div class="button-row">${button("Open Care Circle","/care-circle")}${button("Review options","/decision","secondary")}</div></section>
      </aside>
    </div>`;
}

function careCircle() {
  return `<a class="back-link" href="#/alert">← Back to risk card</a>
    ${intro("Shared context", "Care Circle", "Bring family, community support and professional judgement into one decision.")}
    <div class="grid-two">
      <section class="card panel"><h2 class="section-title">Care Circle input</h2>${memberList()}
        <form class="note-form" id="note-form"><label for="context-note">Add your context</label><textarea id="context-note" placeholder="Example: I spoke with Eleanor last night and she mentioned feeling tired."></textarea><div class="button-row"><button class="button secondary" type="submit">Share with Care Circle</button></div><div id="saved-note"></div></form>
      </section>
      <aside class="stack">
        <section class="card consensus"><div class="eyebrow">Live consensus</div><div class="consensus-score">94%</div><p>All three members agree that a safety check should happen before emergency escalation.</p></section>
        <section class="card panel"><h2 class="section-title">Ready to decide</h2><p class="fine-print">The alert, device evidence and human context are ready for final review.</p><div class="button-row">${button("Review final decision →","/decision")}</div></section>
      </aside>
    </div>`;
}

function decision() {
  return `<a class="back-link" href="#/care-circle">← Back to Care Circle</a>
    ${intro("Collective decision", "Final decision", "The Care Circle has reviewed the evidence and contributed context.")}
    <section class="card decision-hero"><span class="decision-check">✓</span><div><h2>Consensus reached · 96%</h2><p>All Care Circle members agree on the recommended next action.</p></div></section>
    <div class="grid-two">
      <section class="card panel"><h2 class="section-title">Care Circle summary</h2>${memberList()}</section>
      <aside><div class="recommendation"><span class="eyebrow">Recommended action</span><strong>Continue monitoring</strong><p>No immediate action is required. A new safety check will run in 30 minutes.</p></div>
        <div class="choices"><a class="choice" href="#/monitoring"><strong>✓ Continue monitoring</strong><p>Accept the recommendation and schedule a check-in.</p><span class="arrow-link">Confirm →</span></a><a class="choice" href="#/emergency"><strong style="color:#c62020">! Emergency response</strong><p>Escalate if Eleanor may be in immediate danger.</p><span class="arrow-link">Escalate →</span></a></div>
      </aside>
    </div>`;
}

function monitoring() {
  return `${intro("Decision recorded", "Monitoring continues", "The Care Circle recommendation is now active.")}
    <section class="card status-hero"><div class="status-icon">✓</div><h2>Next safety check at 11:00 AM</h2><p>CareConnect will compare the next activity window with Eleanor’s baseline and notify the Care Circle if risk changes.</p><div class="button-row" style="justify-content:center">${button("Return to home","/")}${button("View Care Circle","/care-circle","secondary")}</div></section>
    <section class="card timeline"><h2 class="section-title">What happens next</h2>
      ${[["✓","Decision shared","Family, community care and the professional caregiver were notified."],["✓","Monitoring window started","All three home-safety devices remain active."],["3","Safety check scheduled","A fresh risk card will be created at 11:00 AM."]].map(x=>`<div class="timeline-item"><span class="timeline-dot">${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></div>`).join("")}
    </section>`;
}

function emergency() {
  return `${intro("Immediate response", "High risk detected", "Emergency services are being contacted and the Care Circle has been notified.")}
    <section class="card status-hero"><div class="status-icon urgent">!</div><h2 style="color:#c62020">Emergency response started</h2><p>CareConnect has shared Eleanor’s address, the 92% risk score and the latest device signals with the response service.</p><div class="clock">00:45</div><span class="risk-tag">Estimated dispatch confirmation</span></section>
    <div class="grid-two" style="margin-top:0"><section class="card timeline"><h2 class="section-title">Live response</h2>
      ${[["✓","High risk detected","AI assessment increased to 92%."],["✓","Response service contacted","Alert and home details were transmitted."],["3","Responder location pending","This page updates when a responder is assigned."],["4","Family notified","Maya and the Care Circle received the update."]].map(x=>`<div class="timeline-item"><span class="timeline-dot">${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></div>`).join("")}
      </section><aside class="card panel"><h2 class="section-title">Care Circle notified</h2><p class="fine-print">Everyone sees the same alert, evidence and response status.</p><div class="button-row">${button("View Care Circle","/care-circle","secondary")}${button("Return home","/")}</div></aside></div>`;
}

function alerts() {
  const rows = [
    ["!","Unusual inactivity detected","Today · 10:22 AM · Living room · Risk score 82%","Review →","#/alert",""],
    ["✓","Routine returned to normal","Yesterday · 3:18 PM · Resolved after family check-in","Resolved","","good"],
    ["✓","Front door left open","Monday · 8:42 AM · Closed after volunteer visit","Resolved","","good"],
  ];
  return `${intro("Activity history", "Alerts", "Review recent changes and the decisions made by the Care Circle.")}
    <div class="list">${rows.map(r=>`${r[4]?`<a class="card list-item" href="${r[4]}">`:`<div class="card list-item">`}<span class="list-icon ${r[5]}">${r[0]}</span><div><strong>${r[1]}</strong><p>${r[2]}</p></div><span class="${r[5]?"agrees":"arrow-link"}">${r[3]}</span>${r[4]?"</a>":"</div>"}`).join("")}</div>`;
}

function settingsPage() {
  const labels = [
    ["Push notifications","Receive new risk cards and Care Circle decisions."],
    ["Care Circle updates","Get notified when a member adds context or agrees."],
    ["Weekly wellbeing summary","Receive a plain-language pattern summary every Monday."],
  ];
  return `${intro("Preferences", "Settings", "Choose what the platform shares and how you want to be notified.")}
    <div class="list">${labels.map((x,i)=>`<div class="card setting"><div><strong>${x[0]}</strong><p>${x[1]}</p></div><button class="toggle ${settings[i]?"on":""}" data-toggle="${i}" aria-label="Toggle ${x[0]}"><span></span></button></div>`).join("")}
    <div class="card setting"><div><strong>Privacy controls</strong><p>Only approved Care Circle members can see Eleanor’s signals and notes.</p></div><span class="agrees">3 members</span></div></div>`;
}

const pages = {"/":home,"/alert":alertDetail,"/care-circle":careCircle,"/decision":decision,"/monitoring":monitoring,"/emergency":emergency,"/alerts":alerts,"/settings":settingsPage};
const nav = [["/","⌂","Home"],["/alerts","!","Alerts"],["/care-circle","◎","Care Circle"],["/settings","⚙","Settings"]];

function route() {
  const value = location.hash.slice(1) || "/";
  return pages[value] ? value : "/";
}

function render() {
  const current = route();
  document.getElementById("app").innerHTML = `<div class="app-shell">
    <header class="topbar"><div class="identity"><span class="brand-mark">♥</span><div><div class="brand-name">CareConnect</div><div class="identity-meta">Eleanor’s home · 3 devices connected</div></div></div>
    <select class="role-select" id="role-select" aria-label="Viewing role">${["Family member","Community care","Professional caregiver"].map(x=>`<option ${x===currentRole?"selected":""}>${x}</option>`).join("")}</select></header>
    <main class="content">${pages[current]()}</main>
    <nav class="mobile-nav">${nav.map(n=>`<a href="#${n[0]}" class="nav-item ${current===n[0]||(n[0]==="/"&&["/alert","/decision","/monitoring","/emergency"].includes(current))?"active":""}"><span class="nav-icon">${n[1]}</span><span>${n[2]}</span></a>`).join("")}</nav>
  </div>`;

  document.getElementById("role-select").addEventListener("change", (e) => { currentRole = e.target.value; });
  document.querySelectorAll("[data-toggle]").forEach((el) => el.addEventListener("click", () => {
    const i = Number(el.dataset.toggle); settings[i] = !settings[i]; render();
  }));
  const form = document.getElementById("note-form");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("context-note").value.trim();
    if (value) document.getElementById("saved-note").innerHTML = `<div class="saved">✓ Your context has been shared with the Care Circle.</div>`;
  });
}

window.addEventListener("hashchange", render);
render();
