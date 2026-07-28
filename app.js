const members = [
  ["FM", "You · Family", "Adult daughter", "Usually active at this time. No answer to call."],
  ["MC", "Mei · Community Care", "Neighbourhood volunteer", "Visited this morning. No response from the door."],
  ["DR", "Dr. Rao · Professional", "Care coordinator", "Recommends a short safety check before escalation."],
];

const zoomSteps = [0.85, 1, 1.15, 1.3];
let currentRole = "Family member";
let settings = [true, true, false];
let vote = null;
let parentCallState = "ready";
let userZoom = 1;
try {
  const savedZoom = Number(localStorage.getItem("careconnectZoom"));
  if (zoomSteps.includes(savedZoom)) userZoom = savedZoom;
} catch {}
let chatMessages = [
  { initials: "FM", name: "Maya · Family", time: "10:24", text: "I called twice but Eleanor did not answer. Has anyone seen her this morning?", tone: "family" },
  { initials: "MC", name: "Mei · Community Care", time: "10:25", text: "I visited at 9:50. The curtains were open and I heard the radio inside.", tone: "community" },
  { initials: "DR", name: "Dr. Rao · Professional", time: "10:26", text: "Her watch readings are stable. I recommend a neighbour check before escalation.", tone: "professional" },
];

function intro(eyebrow, title, subtitle) {
  return `<div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p>`;
}

function button(label, href, kind = "primary") {
  return `<a class="button ${kind}" href="#${href}">${label}</a>`;
}

function applyUserZoom() {
  document.documentElement.style.setProperty("--user-zoom", String(userZoom));
  document.body.classList.toggle("zoomed-view", userZoom > 1);
  const value = document.getElementById("zoom-value");
  if (value) value.textContent = `${Math.round(userZoom * 100)}%`;
  const index = zoomSteps.indexOf(userZoom);
  const out = document.querySelector('[data-zoom="out"]');
  const incoming = document.querySelector('[data-zoom="in"]');
  if (out) out.disabled = index === 0;
  if (incoming) incoming.disabled = index === zoomSteps.length - 1;
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
        <a class="device" href="#/monitoring"><span class="device-icon">AI</span><strong>AI camera</strong><small>Active · view</small></a>
        <a class="device" href="#/smart-watch"><span class="device-icon">♥</span><strong>Smart watch</strong><small>Vitals · view</small></a>
        <a class="device" href="#/door-sensor"><span class="device-icon">↔</span><strong>Door sensor</strong><small>Activity · view</small></a>
      </div>
    </section>
    <section class="card risk-strip">
      <div><span class="eyebrow">Current risk</span><strong class="risk-score">82%</strong> <span class="risk-tag">High risk · review now</span></div>
      <div class="risk-actions">${button("Open Care Circle", "/care-circle")} ${button("See why →", "/alert", "soft")}</div>
    </section>
    <a class="sos" href="#/emergency"><span class="sos-circle">SOS</span><span><strong>Emergency call</strong><small>Get immediate help and notify the Care Circle</small></span><span>→</span></a>
    <p class="quick-title">What would you like to do?</p>
    <div class="quick-grid">
      <a class="quick-card" href="#/call-parents">Call parents <span class="quick-arrow">→</span></a>
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
    ${intro("Shared conversation", "Care Circle", "Family, community support and professionals share live context before deciding together.")}
    <div class="care-layout">
      <section class="card chat-panel">
        <div class="chat-heading"><div><h2 class="section-title">Live Care Circle</h2><span class="online-copy"><i></i> 4 people online</span></div><span class="chat-status">Alert #CC-1022</span></div>
        <div class="chat-thread">${chatMessages.map(m => `<div class="chat-message ${m.tone}"><span class="chat-avatar">${m.initials}</span><div class="chat-bubble"><div><strong>${m.name}</strong><time>${m.time}</time></div><p>${m.text}</p></div></div>`).join("")}</div>
        <div class="quick-replies">
          <button type="button" data-quick="I can call Eleanor now.">I can call</button>
          <button type="button" data-quick="I am nearby and can check the front door.">I’m nearby</button>
          <button type="button" data-quick="Please request a professional review.">Professional review</button>
        </div>
        <form class="chat-form" id="chat-form"><input id="chat-input" aria-label="Share an update" placeholder="Share an update with everyone…"><button class="button primary" type="submit">Send</button></form>
      </section>
      <aside class="stack">
        <section class="card consensus"><div class="eyebrow">Shared recommendation</div><div class="consensus-score">${vote === "disagree" ? "75" : "94"}%</div><p>Check in person first, while keeping emergency escalation ready.</p></section>
        <section class="card panel poll-card"><h2 class="section-title">Your decision</h2><p class="fine-print">Do you agree with the Care Circle recommendation?</p><div class="vote-row"><button class="vote-button agree-vote ${vote === "agree" ? "selected" : ""}" data-vote="agree">✓ Agree</button><button class="vote-button disagree-vote ${vote === "disagree" ? "selected" : ""}" data-vote="disagree">Not yet</button></div><div class="poll-count">${vote ? "Your response is shared · " : ""}3 of 4 responded</div><div class="button-row">${button("Review options →","/decision")}</div></section>
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
        <a class="button soft decision-return" href="#/care-circle">← Discuss these options in Care Circle</a>
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
  return `${intro("Immediate response", "High risk detected", "The Care Circle has been notified and an emergency call is ready.")}
    <section class="card status-hero emergency-hero"><div class="status-icon urgent">!</div><h2 id="emergency-response-title" style="color:#c62020">Emergency response ready</h2><p>CareConnect has prepared Eleanor’s address, risk score and latest device signals for ambulance dispatch.</p><div class="audible-alarm">🔊 HOME ALARM SOUNDING · NEIGHBOURS CAN HEAR IT AND CALL FOR HELP</div><div class="clock">00:45</div><span class="risk-tag" id="dispatch-badge">Ready to call emergency services</span></section>
    <div class="grid-two" style="margin-top:0"><section class="card timeline"><h2 class="section-title">Live response</h2>
      ${[["✓","High risk detected","AI assessment increased to 92%."],["✓","Emergency information prepared","Address and device evidence are ready for dispatch."],["3","Emergency call ready","Tap the call button to contact ambulance dispatch."],["4","Family and neighbours alerted","The home alarm is sounding and the Care Circle is notified."]].map(x=>`<div class="timeline-item"><span class="timeline-dot">${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></div>`).join("")}
      </section><aside class="card panel"><h2 class="section-title">Emergency call</h2><p class="fine-print">Start the ambulance call and follow its live status here.</p><div class="button-row"><button class="button danger" id="call-emergency">Call emergency services now</button>${button("View Care Circle","/care-circle","secondary")}${button("Return home","/")}</div><div id="call-status"></div><p class="prototype-note">Prototype display · no real emergency call is placed.</p></aside></div>`;
}

function smartWatch() {
  const vitals = [["72","bpm","Heart rate","Normal"],["97","%","Blood oxygen","Normal"],["7h 12","min","Sleep","Restful"],["1,842","","Steps today","Below usual"]];
  return `<a class="back-link" href="#/">← Back to home</a>
    ${intro("Smart watch", "Eleanor’s wellbeing", "Live readings are compared with Eleanor’s personal baseline.")}
    <section class="card wearable-status"><div class="wearable-icon">♥</div><div><span class="online-copy"><i></i> Synced 2 minutes ago</span><h2>Overall status: stable</h2><p>No urgent change in heart rate or blood oxygen. Activity is lower than Eleanor’s usual morning.</p></div></section>
    <div class="vitals-grid">${vitals.map((v,i)=>`<section class="card vital ${i===3?"attention":""}"><span>${v[2]}</span><strong>${v[0]} <small>${v[1]}</small></strong><em>${v[3]}</em></section>`).join("")}</div>
    <div class="grid-two watch-grid"><section class="card panel"><h2 class="section-title">Today’s pattern</h2><div class="mini-bars"><span style="height:34%"></span><span style="height:58%"></span><span style="height:72%"></span><span style="height:46%"></span><span class="current" style="height:20%"></span></div><p class="fine-print">Movement dropped after 9:45 AM, while vital signs remained stable.</p></section><section class="card panel"><h2 class="section-title">What this means</h2><p class="fine-print">The watch supports the inactivity alert but does not show a medical emergency by itself.</p>${button("Return home page","/")}</section></div>`;
}

function doorSensor() {
  const events = [["8:12 AM","Door opened","Eleanor left home"],["8:14 AM","Door locked","Home secured"],["9:03 AM","Door opened","Eleanor returned home"],["9:05 AM","Door closed","No movement since return"]];
  return `<a class="back-link" href="#/">← Back to home</a>
    ${intro("Door sensor", "Entry and exit activity", "A clear timeline of when Eleanor left and returned home.")}
    <section class="card door-status"><span class="door-icon">⌂</span><div><span class="online-copy"><i></i> Sensor online</span><h2>Eleanor is currently at home</h2><p>Last door activity was recorded at 9:05 AM.</p></div></section>
    <div class="grid-two door-grid"><section class="card panel"><h2 class="section-title">Today’s door timeline</h2><div class="door-events">${events.map((e,i)=>`<div class="door-event"><time>${e[0]}</time><span class="${i===2?"return-event":""}">${i===2?"↩":"•"}</span><div><strong>${e[1]}</strong><p>${e[2]}</p></div></div>`).join("")}</div></section><aside class="stack"><section class="card panel"><h2 class="section-title">Routine insight</h2><p class="fine-print">Today’s trip was 51 minutes, close to Eleanor’s usual morning routine of 45–60 minutes.</p></section><section class="card panel"><h2 class="section-title">Home status</h2><p class="fine-print">Door closed · no unexpected exit · monitoring active.</p>${button("Return home page","/")}</section></aside></div>`;
}

function callParents() {
  const calling = parentCallState === "calling";
  return `<a class="back-link" href="#/">← Back to home</a>
    ${intro("Family call", "Call parents", "Reach Eleanor directly while keeping the latest home status in view.")}
    <section class="card parent-call-hero">
      <div class="parent-avatar">EO</div>
      <span class="online-copy"><i></i> At home · smart watch connected</span>
      <h2>Eleanor · Mum</h2>
      <p>Mobile · Last answered yesterday at 7:42 PM</p>
      <div class="call-live-state ${calling ? "calling" : ""}">${calling ? "<span></span> Calling Eleanor…" : "Ready to call"}</div>
      <button class="parent-call-button ${calling ? "end-call" : ""}" id="parent-call">${calling ? "End call" : "☎ Call Eleanor now"}</button>
    </section>
    <div class="grid-two parent-call-grid">
      <section class="card panel"><h2 class="section-title">Before you call</h2>
        <div class="call-signal"><span>♥</span><div><strong>Vitals stable</strong><p>Heart rate 72 bpm · Oxygen 97%</p></div></div>
        <div class="call-signal"><span>⌂</span><div><strong>Eleanor is at home</strong><p>Front door last closed at 9:05 AM</p></div></div>
      </section>
      <aside class="card panel"><h2 class="section-title">If there is no answer</h2><p class="fine-print">Share the missed call with everyone who can help.</p>
        <div class="button-row">${button("Notify Care Circle","/care-circle","secondary")}${button("Return home page","/")}</div>
      </aside>
    </div>`;
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

const pages = {"/":home,"/alert":alertDetail,"/care-circle":careCircle,"/decision":decision,"/monitoring":monitoring,"/emergency":emergency,"/smart-watch":smartWatch,"/door-sensor":doorSensor,"/call-parents":callParents,"/alerts":alerts,"/settings":settingsPage};
const nav = [["/","⌂","Home"],["/alerts","!","Alerts"],["/care-circle","◎","Care Circle"],["/settings","⚙","Settings"]];

function route() {
  const value = location.hash.slice(1) || "/";
  return pages[value] ? value : "/";
}

function render() {
  const current = route();
  const activeRoute = current === "/alert" || current === "/alerts" || current === "/emergency" ? "/alerts"
    : current === "/care-circle" || current === "/decision" ? "/care-circle"
    : current === "/settings" ? "/settings" : "/";
  document.getElementById("app").innerHTML = `<div class="app-shell">
    <header class="topbar"><div class="identity"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="9" r="3.2"></circle><path d="M10.5 21c0-4.4 2.5-7.1 5.5-7.1s5.5 2.7 5.5 7.1"></path><path class="brand-care-arms" d="M5.5 16.5c1 5.4 5.2 9.5 10.5 11M26.5 16.5c-1 5.4-5.2 9.5-10.5 11"></path></svg></span><div><div class="brand-name">CareConnect</div><div class="identity-meta">Eleanor’s home · 3 devices connected</div></div></div>
    <select class="role-select" id="role-select" aria-label="Viewing role">${["Family member","Community care","Professional caregiver"].map(x=>`<option ${x===currentRole?"selected":""}>${x}</option>`).join("")}</select></header>
    <main class="content page-${current === "/" ? "home" : current.slice(1)}">${pages[current]()}</main>
    <nav class="mobile-nav">${nav.map(n=>`<a href="#${n[0]}" class="nav-item ${activeRoute===n[0]?"active":""}"><span class="nav-icon">${n[1]}</span><span>${n[2]}</span></a>`).join("")}</nav>
  </div>
  <div class="zoom-controls" role="group" aria-label="Page zoom controls">
    <button class="zoom-button" type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out"><span class="zoom-lens zoom-minus" aria-hidden="true"></span></button>
    <span class="zoom-value" id="zoom-value" aria-live="polite">${Math.round(userZoom * 100)}%</span>
    <button class="zoom-button" type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in"><span class="zoom-lens zoom-plus" aria-hidden="true"></span></button>
  </div>`;

  applyUserZoom();
  document.getElementById("role-select").addEventListener("change", (e) => { currentRole = e.target.value; });
  document.querySelectorAll("[data-toggle]").forEach((el) => el.addEventListener("click", () => {
    const i = Number(el.dataset.toggle); settings[i] = !settings[i]; render();
  }));
  const form = document.getElementById("chat-form");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("chat-input").value.trim();
    if (value) {
      const roleMap = {"Family member":["FM","Maya · Family","family"],"Community care":["MC","Mei · Community Care","community"],"Professional caregiver":["DR","Dr. Rao · Professional","professional"]};
      const identity = roleMap[currentRole];
      chatMessages.push({initials:identity[0],name:identity[1],time:"Now",text:value,tone:identity[2]});
      render();
    }
  });
  document.querySelectorAll("[data-quick]").forEach(el => el.addEventListener("click", () => {
    const input = document.getElementById("chat-input");
    input.value = el.dataset.quick;
    input.focus();
  }));
  document.querySelectorAll("[data-vote]").forEach(el => el.addEventListener("click", () => {
    vote = el.dataset.vote;
    render();
  }));
  const callButton = document.getElementById("call-emergency");
  if (callButton) callButton.addEventListener("click", () => {
    callButton.textContent = "Calling emergency services…";
    callButton.classList.add("calling-emergency");
    callButton.disabled = true;
    document.getElementById("emergency-response-title").textContent = "Calling ambulance dispatch now";
    const dispatchBadge = document.getElementById("dispatch-badge");
    dispatchBadge.textContent = "● LIVE · CALLING AMBULANCE";
    dispatchBadge.classList.add("dispatch-live");
    document.getElementById("call-status").innerHTML = `<div class="saved emergency-confirm"><strong>🚑 Calling ambulance dispatch now</strong><span>Sharing Eleanor’s address and emergency details · waiting for the dispatcher to connect.</span></div>`;
  });
  const parentCallButton = document.getElementById("parent-call");
  if (parentCallButton) parentCallButton.addEventListener("click", () => {
    parentCallState = parentCallState === "calling" ? "ready" : "calling";
    render();
  });
  document.querySelectorAll("[data-zoom]").forEach((control) => control.addEventListener("click", () => {
    const currentIndex = zoomSteps.indexOf(userZoom);
    const nextIndex = control.dataset.zoom === "in"
      ? Math.min(zoomSteps.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    userZoom = zoomSteps[nextIndex];
    try { localStorage.setItem("careconnectZoom", String(userZoom)); } catch {}
    applyUserZoom();
  }));
}

window.addEventListener("hashchange", render);
render();
