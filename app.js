const members = [
  ["FM", "You · Family", "Adult daughter", "Usually active at this time. No answer to call."],
  ["MC", "Mei · Community Care Leader", "North District team leader", "Assigned to Eleanor’s in-person safety check."],
  ["DR", "Dr. Rao · Professional", "Care coordinator", "Recommends a short safety check before escalation."],
];

const zoomSteps = [0.85, 1, 1.15, 1.3, 1.5, 1.8];
const roleOptions = ["Family member", "Community care", "Professional caregiver", "Nearby helper"];
let currentRole = "Family member";
let settings = [true, true, false];
let vote = null;
let parentCallState = "ready";
let meiCallState = "ready";
let responseMapState = "alerted";
let rapidCheckState = "reviewing";
let helperFaceVerified = false;
let helperVerified = false;
let voucherClaimed = false;
let communityTaskStarted = false;
let helperSessionClosed = false;
let userZoom = 1;
try {
  const savedZoom = Number(localStorage.getItem("careconnectZoom"));
  if (zoomSteps.includes(savedZoom)) userZoom = savedZoom;
  const savedRole = localStorage.getItem("careconnectRole");
  if (roleOptions.includes(savedRole)) currentRole = savedRole;
} catch {}
let chatMessages = [
  { initials: "FM", name: "Maya · Family", time: "10:24", text: "I called twice but Eleanor did not answer. Has anyone seen her this morning?", tone: "family" },
  { initials: "MC", name: "Mei · Community Care Leader", time: "10:25", text: "I am coordinating the safety check and can assign the nearest approved responder.", tone: "community" },
  { initials: "DR", name: "Dr. Rao · Professional", time: "10:26", text: "Her watch readings are stable. I recommend a neighbour check before escalation.", tone: "professional" },
  { initials: "NA", name: "Neighbour A · Nearby contributor", time: "10:27", text: "I can hear the home alarm from the public corridor.", tone: "observer" },
  { initials: "RB", name: "Resident B · Nearby contributor", time: "10:27", text: "The ambulance entrance is clear.", tone: "observer" },
];
const subscriptionPlans = {
  essential: {
    name: "Essential",
    monthly: 25,
    description: "Simple everyday safety",
    features: ["1 connected device", "AI risk alerts", "Care Circle access"],
  },
  family: {
    name: "Family",
    monthly: 49,
    description: "Complete home monitoring",
    features: ["Up to 3 devices", "24/7 pattern monitoring", "Home alarm + Care Circle"],
  },
  premium: {
    name: "Premium Care",
    monthly: 99,
    description: "Professional support included",
    features: ["Everything in Family", "Caregiver review", "Monthly telehealth check-in"],
  },
};
let subscription = {
  currentPlan: "family",
  selectedPlan: "family",
  billing: "monthly",
  payment: "visa",
  autoRenew: true,
  renewed: false,
};

function intro(eyebrow, title, subtitle) {
  return `<div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p>`;
}

function button(label, href, kind = "primary") {
  return `<a class="button ${kind}" href="#${href}">${label}</a>`;
}

function applyUserZoom() {
  const mobileViewport = window.matchMedia("(max-width: 480px)").matches;
  const effectiveZoom = mobileViewport ? 1 : userZoom;
  document.documentElement.style.setProperty("--user-zoom", String(effectiveZoom));
  document.body.classList.toggle("zoomed-view", effectiveZoom > 1);
  const value = document.getElementById("zoom-value");
  if (value) value.textContent = `${Math.round(effectiveZoom * 100)}%`;
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

function familyHome() {
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
      <div class="risk-actions">${button("See why →", "/alert")} ${button("Open Care Circle", "/care-circle", "soft")}</div>
    </section>
    <a class="sos" href="#/emergency"><span class="sos-circle">SOS</span><span><strong>Emergency call</strong><small>Get immediate help and notify the Care Circle</small></span><span>→</span></a>
    <p class="quick-title">What would you like to do?</p>
    <div class="quick-grid">
      <a class="quick-card" href="#/call-parents">Call parents <span class="quick-arrow">→</span></a>
      <a class="quick-card" href="#/response-map">Open response map <span class="quick-arrow">→</span></a>
      <a class="quick-card" href="#/decision">Review next action <span class="quick-arrow">→</span></a>
    </div>`;
}

function communityHome() {
  const visits = [
    ["EL", "Eleanor Wong", "Priority check · due now", "Risk 82%", "urgent", "#/community-task"],
    ["AR", "Arthur Lim", "Routine visit · 11:30 AM", "On schedule", "ready", null],
    ["SN", "Siti Noor", "Medication check · 2:00 PM", "Confirmed", "good", null],
  ];
  return `${intro("Community care workspace", "Good morning, Mei.", "Coordinate nearby support across six independently living older adults.")}
    <section class="card role-hero community-hero">
      <div class="role-priority-top"><div><span class="role-kicker">PRIORITY FOLLOW-UP</span><h2>Eleanor · unusual inactivity</h2><p>AI risk 82% · no movement for 43 minutes · family could not reach her.</p></div><strong class="role-risk-score">82%</strong></div>
      <div class="role-action-row"><a class="button primary" href="#/community-task">Open assigned task</a><a class="button secondary" href="#/care-circle">Share context</a></div>
    </section>
    <div class="role-metrics">
      <div class="card role-metric"><strong>6</strong><span>Assigned homes</span><small>All sensors online</small></div>
      <div class="card role-metric attention"><strong>2</strong><span>Need follow-up</span><small>1 high priority</small></div>
      <div class="card role-metric"><strong>4</strong><span>Supporters nearby</span><small>North district</small></div>
    </div>
    <section class="card workflow-card">
      <div class="workflow-heading"><div><h2 class="section-title">Today’s community route</h2><p>Shared tasks update for the whole Care Circle.</p></div><span>3 visits</span></div>
      <div class="workflow-list">${visits.map(item => {
        const row = `<span class="workflow-avatar">${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div><em class="${item[4]}">${item[3]}</em>`;
        return item[5] ? `<a class="workflow-row" href="${item[5]}">${row}</a>` : `<div class="workflow-row workflow-row-static">${row}</div>`;
      }).join("")}</div>
    </section>
    <div class="role-bottom-grid">
      <section class="card compact-role-card"><h2 class="section-title">Latest shared context</h2><p><b>Maya · Family</b> “I called twice but there was no answer.”</p><a href="#/care-circle">Open group conversation →</a></section>
      <section class="card compact-role-card coverage-card"><h2 class="section-title">Field support</h2><strong>8 min away</strong><p>Nearest approved volunteer to Eleanor.</p></section>
    </div>
    <a class="role-map-link community-map-link" href="#/response-map"><span>Emergency response map</span><strong>Open map →</strong></a>`;
}

function professionalHome() {
  const reviews = [
    ["EL", "Eleanor Wong", "Inactivity + missed calls", "82%", "urgent", "#/patient-record"],
    ["AR", "Arthur Lim", "Sleep pattern changed", "46%", "ready", null],
    ["SN", "Siti Noor", "Routine weekly review", "22%", "good", null],
  ];
  return `${intro("Professional care workspace", "Good morning, Dr. Rao.", "4 risk reviews · 1 high priority")}
    <section class="card role-hero professional-hero">
      <div class="role-priority-top"><div><span class="role-kicker">CLINICAL REVIEW REQUIRED</span><h2>Eleanor · high-priority risk card</h2><p>Vitals are stable, but inactivity and missed contact differ from her personal baseline.</p></div><strong class="role-risk-score">82%</strong></div>
      <div class="role-action-row"><a class="button primary" href="#/patient-record">View patient record</a><a class="button secondary" href="#/care-circle">Open Care Circle</a></div>
    </section>
    <div class="role-metrics professional-metrics">
      <div class="card role-metric"><strong>4</strong><span>Reviews today</span><small>3 within target</small></div>
      <div class="card role-metric attention"><strong>1</strong><span>High risk</span><small>Needs context now</small></div>
      <div class="card role-metric"><strong>2</strong><span>Telehealth</span><small>Next at 2:30 PM</small></div>
    </div>
    <section class="card workflow-card">
      <div class="workflow-heading"><div><h2 class="section-title">Risk review queue</h2></div><span>Live</span></div>
      <div class="workflow-list">${reviews.map(item => {
        const row = `<span class="workflow-avatar professional">${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div><em class="${item[4]}">${item[3]}</em>`;
        return item[5] ? `<a class="workflow-row" href="${item[5]}">${row}</a>` : `<div class="workflow-row workflow-row-static">${row}</div>`;
      }).join("")}</div>
    </section>
    <div class="role-bottom-grid professional-bottom">
      <section class="card compact-role-card clinical-card"><h2 class="section-title">Clinical snapshot</h2><div class="mini-clinical"><span><b>72</b> bpm</span><span><b>97%</b> oxygen</span><span><b>43m</b> inactive</span></div><a href="#/smart-watch">View wellbeing details →</a></section>
      <section class="card compact-role-card telehealth-card"><h2 class="section-title">Care plan</h2><strong>Telehealth · 2:30 PM</strong><p>Monthly professional check-in.</p></section>
    </div>
    <a class="role-map-link professional-map-link" href="#/response-map"><span>Emergency response map</span><strong>Open map →</strong></a>`;
}

function helperHome() {
  return `${intro("Nearby Helper", "Emergency nearby", "")}
    <section class="card helper-notification">
      <div class="helper-notification-top"><span class="helper-app-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="9" r="3.2"></circle><path d="M10.5 21c0-4.4 2.5-7.1 5.5-7.1s5.5 2.7 5.5 7.1"></path><path d="M5.5 16.5c1 5.4 5.2 9.5 10.5 11M26.5 16.5c-1 5.4-5.2 9.5-10.5 11"></path></svg></span><strong>CareConnect</strong><time>now</time></div>
      <div class="helper-alert-symbol">!</div>
      <h2>Older adult may need help</h2>
      <p>About 200 m away · North District</p>
      <a class="button danger helper-open-alert" href="#/response-map">View alert →</a>
      <a class="helper-dismiss" href="#/">Not now</a>
    </section>
    <div class="helper-permission-row">
      <span>✓ Nearby Helper on</span><span>✓ Location on</span><span>✓ Notifications on</span>
    </div>`;
}

function home() {
  if (currentRole === "Community care") return communityHome();
  if (currentRole === "Professional caregiver") return professionalHome();
  if (currentRole === "Nearby helper") return helperHome();
  return familyHome();
}

function alertDetail() {
  const signals = [
    ["Movement below personal baseline", "No room-to-room movement for 43 minutes. Eleanor’s usual range is 8–15 minutes.", "10:22"],
    ["Watch shows low activity", "Heart rate is normal, but step count has not changed.", "10:18"],
    ["Front door remained closed", "No exit was detected, so an unrecorded trip outside is unlikely.", "9:41"],
  ];
  return `<button class="back-link back-button" type="button" data-back>← Back to previous page</button>
    ${intro("Risk alert", "Unusual inactivity detected", "Living room · 10:22 AM")}
    <div class="grid-two">
      <section class="card panel"><h2 class="section-title">What changed</h2>
        ${signals.map((s,i)=>`<div class="signal"><span class="signal-num">${i+1}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div><time>${s[2]}</time></div>`).join("")}
      </section>
      <aside class="stack">
        <section class="card panel"><h2 class="section-title">Risk assessment</h2><div class="score">82%</div><span class="risk-tag">High risk · review now</span><div class="meter"><span></span></div></section>
        <section class="card panel"><h2 class="section-title">Choose a response</h2><div class="button-row">${button("Open Care Circle","/care-circle")}</div></section>
      </aside>
    </div>`;
}

function renderChatMessages(messages) {
  return messages.map(m => `<div class="chat-message ${m.tone}"><span class="chat-avatar">${m.initials}</span><div class="chat-bubble"><div><strong>${m.name}</strong><time>${m.time}</time></div><p>${m.text}</p></div></div>`).join("");
}

function careCircle() {
  const helperView = currentRole === "Nearby helper";
  const activeHelper = helperView && helperFaceVerified && !helperSessionClosed;
  const observerMessages = chatMessages.filter(m => m.tone === "observer" || m.tone === "helper");

  if (helperView && !activeHelper) {
    return `<a class="back-link" href="#/response-map">← Back to map</a>
      ${intro(helperSessionClosed ? "Response complete" : "Observation mode", "Live Incident Room", "")}
      <div class="room-members"><span class="core">3 Core Care Circle</span><span>2 Nearby contributors</span><span>${helperSessionClosed ? "Helper session closed" : "Address protected"}</span></div>
      <div class="care-layout incident-observer-layout">
        <section class="card chat-panel">
          <div class="chat-heading"><div><h2 class="section-title">Nearby updates</h2><span class="online-copy"><i></i> North District · LIVE</span></div><span class="chat-status">${observerMessages.length} updates</span></div>
          <div class="chat-thread">${renderChatMessages(observerMessages)}</div>
          ${helperSessionClosed ? "" : `<div class="quick-replies"><button type="button" data-quick="I can hear the alarm.">Alarm heard</button><button type="button" data-quick="The ambulance entrance is clear.">Entrance clear</button><button type="button" data-quick="I can help now.">I can help</button></div>
          <form class="chat-form" id="chat-form"><input id="chat-input" aria-label="Share a nearby update" placeholder="Share a nearby update…"><button class="button primary" type="submit">Send</button></form>`}
        </section>
        <aside class="stack observer-sidebar">
          ${helperSessionClosed
            ? '<section class="card observer-access ended"><span>✓</span><h2>Temporary access ended</h2><strong>Address access revoked</strong><a class="button primary" href="#/">Return to home</a></section>'
            : '<section class="card observer-access"><span>!</span><h2>Older adult may need help</h2><strong>Approx. 200 m · North District</strong><a class="button primary" href="#/face-check">Verify to become assigned helper</a><small>Exact address hidden</small></section>'}
        </aside>
      </div>`;
  }

  const consensusScore = vote === "agree" ? 98 : vote === "disagree" ? 75 : 94;
  const consensusChange = vote === "agree" ? "4 of 4 support" : "3 of 4 support";
  const roomMessages = helperFaceVerified && !helperSessionClosed
    ? [...chatMessages, { initials: "ZW", name: "Zhang Wei · Assigned Helper", time: "Now", text: "Identity verified. I am joining the response and can call an ambulance.", tone: "helper" }]
    : chatMessages;
  const quickReplies = activeHelper
    ? [["I have reached the building entrance.", "At the entrance"], ["I can hear the alarm.", "Alarm heard"], ["I am calling an ambulance now.", "Calling ambulance"]]
    : [["I can call Eleanor now.", "I can call"], ["Mei is assigned and on the way.", "Mei assigned"], ["Please request a professional review.", "Professional review"]];

  return `<a class="back-link" href="#/alert">← Back to risk card</a>
    ${intro("Live incident", "Eleanor Care Circle", "")}
    <div class="room-members"><span class="core">3 Core Care Circle</span><span>2 Nearby contributors</span><span class="${helperFaceVerified && !helperSessionClosed ? "active" : ""}">${helperFaceVerified && !helperSessionClosed ? "1 Assigned Helper" : "Finding helper"}</span></div>
    <div class="incident-assignment-bar">
      <span><small>TEAM LEADER</small><strong>Mei · Community Care</strong></span>
      <span><small>ASSIGNED HELPER</small><strong>${helperFaceVerified && !helperSessionClosed ? "Zhang Wei · verified" : "Waiting"}</strong></span>
      <span><small>STATUS</small><strong>${communityTaskStarted ? "Safety check in progress" : "Response active"}</strong></span>
    </div>
    <div class="care-layout">
      <section class="card chat-panel">
        <div class="chat-heading"><div><h2 class="section-title">Live Incident Room</h2><span class="online-copy"><i></i> Core members + verified community updates</span></div><span class="chat-status">${roomMessages.length} people · LIVE</span></div>
        <div class="shared-intel">
          <span><b>AI</b> Inactivity 43 min</span>
          <span><b>WATCH</b> Vitals stable</span>
          <span><b>COMMUNITY</b> Alarm confirmed</span>
        </div>
        <div class="chat-thread">${renderChatMessages(roomMessages)}</div>
        <div class="quick-replies">${quickReplies.map(item => `<button type="button" data-quick="${item[0]}">${item[1]}</button>`).join("")}</div>
        <form class="chat-form" id="chat-form"><input id="chat-input" aria-label="Share an update" placeholder="Share an update with everyone…"><button class="button primary" type="submit">Send</button></form>
      </section>
      ${activeHelper
        ? `<aside class="stack responder-tools">
            <section class="card secure-helper-card"><div class="secure-helper-head"><span>✓ VERIFIED</span><em>15 MIN ACCESS</em></div><small>REGISTERED HOME ADDRESS</small><h2>18 Harmony Lane, #05-12</h2><strong>Risk 92% · alarm sounding</strong><a class="button secondary" href="#/protected-address">View address details</a><a class="button danger" href="#/helper-call">Call ambulance now</a></section>
            <section class="card temporary-role-card"><strong>Assigned Community Helper</strong><span>Temporary incident access</span></section>
          </aside>`
        : `<aside class="stack collective-decision">
            <section class="card consensus"><div class="eyebrow">Decision support</div><div class="consensus-score">${consensusScore}%</div><div class="consensus-change ${vote || ""}">${consensusChange}</div><div class="proposed-action"><span>VOTING ON</span><strong>Send Mei for an in-person safety check now</strong></div></section>
            <section class="card panel poll-card"><h2 class="section-title">Vote on this action</h2><div class="poll-action">Send Mei for an in-person safety check now</div><div class="vote-row"><button class="vote-button agree-vote ${vote === "agree" ? "selected" : ""}" data-vote="agree">✓ Agree</button><button class="vote-button disagree-vote ${vote === "disagree" ? "selected" : ""}" data-vote="disagree">Need more context</button></div><div class="poll-count">${vote ? "4 of 4 responded" : "3 of 4 responded · your vote"}</div><div class="decision-readiness"><span class="${vote === "disagree" ? "hold" : ""}"></span><div><strong>${vote === "agree" ? "Action approved" : vote === "disagree" ? "Decision pending" : "Waiting for your vote"}</strong></div></div><div class="button-row">${button("Review decision →","/decision")}</div></section>
          </aside>`}
    </div>`;
}

function decision() {
  const actionApproved = vote === "agree";
  const roleAction = currentRole === "Community care"
    ? ["Open assigned task", "/community-task"]
    : currentRole === "Professional caregiver"
      ? ["Review safety-check task", "/community-task"]
      : currentRole === "Nearby helper"
        ? ["Open Live Incident Room", "/care-circle"]
        : ["View safety-check status", "/community-task"];
  return `<a class="back-link" href="#/care-circle">← Back to Care Circle</a>
    ${intro("Collective decision", actionApproved ? "Action approved" : "Decision pending", "")}
    <section class="card decision-hero"><span class="decision-check">${actionApproved ? "✓" : "…"}</span><div><h2>${actionApproved ? "4 of 4 support" : "3 of 4 support"}</h2></div></section>
    <div class="decision-layout">
      <section class="card panel decision-people"><h2 class="section-title">Core Care Circle</h2>${memberList()}</section>
      <aside class="decision-action-stack">
        <div class="recommendation"><span class="eyebrow">Approved action</span><strong>Send Mei for an in-person safety check now</strong><div class="decision-owner"><span>Owner</span><b>Mei · Community Care Leader</b><em>Within 15 min</em></div></div>
        <a class="decision-primary-action" href="#${actionApproved ? roleAction[1] : "/care-circle"}"><span>${actionApproved ? roleAction[0] : "Return to Care Circle"}</span><strong>${actionApproved ? "Open →" : "Continue →"}</strong></a>
        <a class="decision-emergency-action" href="#/emergency"><span><b>!</b> Emergency response</span><strong>Escalate →</strong></a>
      </aside>
    </div>`;
}

function communityTask() {
  const canManageTask = currentRole === "Community care";
  const taskStatus = communityTaskStarted ? "IN PROGRESS" : canManageTask ? "DUE NOW" : "ASSIGNED";
  const pageTitle = canManageTask ? "Eleanor safety check" : "Safety check status";
  const taskActions = canManageTask
    ? `<button class="button primary" id="start-community-task" ${communityTaskStarted ? "disabled" : ""}>${communityTaskStarted ? "Task in progress" : "Start task"}</button><a class="button secondary" href="#/care-circle">Open Incident Room</a>`
    : currentRole === "Family member"
      ? '<a class="button primary" href="#/care-circle">Open Incident Room</a><a class="button secondary" href="#/call-mei">Contact Mei</a>'
      : currentRole === "Professional caregiver"
        ? '<a class="button primary" href="#/care-circle">Review Incident Room</a>'
        : '<a class="button primary" href="#/care-circle">Open Incident Room</a><a class="button secondary" href="#/response-map">Return to map</a>';
  return `<button class="back-link back-button" type="button" data-back>← Back to previous page</button>
    ${intro(canManageTask ? "Assigned task" : "Care response", pageTitle, "")}
    <section class="card task-hero">
      <div class="task-title-row"><div><span class="task-priority">HIGH PRIORITY</span><h2>In-person safety check</h2></div><strong class="${communityTaskStarted ? "started" : ""}">${taskStatus}</strong></div>
      <div class="task-details">
        <span><small>ASSIGNED TO</small><b>Mei · Community Care Leader</b></span>
        <span><small>LOCATION</small><b>18 Harmony Lane, #05-12</b></span>
        <span><small>RISK</small><b>82%</b></span>
        <span><small>TARGET</small><b>Within 15 min</b></span>
      </div>
      <div class="task-signals"><span>No movement · 43 min</span><span>Family calls · no answer</span><span>Vitals · stable</span></div>
      <div class="task-actions ${currentRole === "Professional caregiver" ? "one-action" : "two-actions"}">${taskActions}</div>
    </section>`;
}

function patientRecord() {
  const medications = [
    ["Amlodipine", "5 mg", "Started 12 Jan 2025", "8:00 AM daily", "Taken"],
    ["Metformin", "500 mg", "Started 03 Mar 2024", "8:00 AM + 8:00 PM", "Next 8:00 PM"],
    ["Vitamin D3", "1,000 IU", "Started 15 Jun 2026", "Friday · 9:00 AM", "Scheduled"],
  ];
  return `<a class="back-link" href="#/">← Back to professional home</a>
    ${intro("Patient record", "Eleanor Wong", "78 years old · independently living")}
    <section class="card patient-summary">
      <span class="patient-avatar">EW</span>
      <div><h2>Eleanor Wong</h2><p>Female · Blood type O+ · No known drug allergies</p></div>
      <strong>Stable</strong>
    </section>
    <div class="patient-record-layout">
      <section class="card patient-health-card">
        <div class="record-heading"><h2 class="section-title">Current health</h2><span>Updated 10:26 AM</span></div>
        <div class="patient-vitals">
          <span><small>HEART RATE</small><b>72 bpm</b><em>Normal</em></span>
          <span><small>BLOOD OXYGEN</small><b>97%</b><em>Normal</em></span>
          <span><small>BLOOD PRESSURE</small><b>119/76</b><em>Controlled</em></span>
          <span><small>TEMPERATURE</small><b>36.6°C</b><em>Normal</em></span>
        </div>
        <div class="health-conditions"><span>Hypertension · controlled</span><span>Type 2 diabetes · monitored</span></div>
        <div class="record-actions"><a class="button primary" href="#/smart-watch">View live readings</a><a class="button secondary" href="#/alert">Open risk alert</a></div>
      </section>
      <section class="card medication-card">
        <div class="record-heading"><h2 class="section-title">Medication schedule</h2><span>30 Jul 2026</span></div>
        <div class="medication-list">${medications.map((medication, index) => `<div class="medication-row">
          <span class="medication-time">${medication[3]}</span>
          <div><strong>${medication[0]} · ${medication[1]}</strong><small>${medication[2]}</small></div>
          <em class="${index === 0 ? "taken" : ""}">${medication[4]}</em>
        </div>`).join("")}</div>
      </section>
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
  return `${intro("Immediate response", "Critical trigger confirmed", "SOS, confirmed fall or critical vital signs bypass the verification window.")}
    <section class="card status-hero emergency-hero"><div class="status-icon urgent">!</div><h2 id="emergency-response-title" style="color:#c62020">Emergency response ready</h2><p>CareConnect has prepared Eleanor’s address and critical evidence for ambulance dispatch.</p><div class="audible-alarm">🔊 HOME ALARM SOUNDING · IMMEDIATE RESPONSE</div><div class="clock">00:45</div><span class="risk-tag" id="dispatch-badge">Ready to call emergency services</span></section>
    <div class="grid-two" style="margin-top:0"><section class="card timeline"><h2 class="section-title">Live response</h2>
      ${[["✓","Critical trigger confirmed","No verification delay."],["✓","Emergency information prepared","Address and device evidence are ready for dispatch."],["3","Emergency call ready","Tap the call button to contact ambulance dispatch."],["4","Family and neighbours alerted","The home alarm is sounding and the Care Circle is notified."]].map(x=>`<div class="timeline-item"><span class="timeline-dot">${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></div>`).join("")}
      </section><aside class="card panel"><h2 class="section-title">Emergency call</h2><p class="fine-print">Start the ambulance call and activate nearby collective support.</p><div class="button-row"><button class="button danger" id="call-emergency">Call ambulance now</button>${button("View Care Circle","/care-circle","secondary")}${button("Return home","/")}</div><div id="call-status"></div></aside></div>`;
}

function responseMap() {
  const helperView = currentRole === "Nearby helper";
  const joined = !helperView;
  const addressTitle = helperView ? "Address protected" : "18 Harmony Lane";
  const addressCopy = helperView ? "Face verification required" : "Registered home address";
  return `<a class="back-link" href="#/">← Back</a>
    ${intro("Nearby emergency response", "Emergency map", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="active">2 Face ID</span><span>3 Address</span><span>4 Ambulance</span><span>5 Dispatch</span></div>
    <div class="response-alert-strip"><span>🔊 HOME ALARM SOUNDING</span><b>Risk 92%</b><em>200 m away</em></div>
    <div class="response-map-layout">
      <section class="card response-map-panel">
        <div class="map-heading"><div><h2 class="section-title">${helperView ? "Approximate area" : "Home location"}</h2></div><span>${joined ? "UNLOCKED" : "LOCKED"}</span></div>
        <div class="response-map-canvas ${joined ? "joined" : ""}">
          <span class="map-block block-one"></span><span class="map-block block-two"></span><span class="map-block block-three"></span><span class="map-block block-four"></span>
          <span class="map-road road-one"></span><span class="map-road road-two"></span><span class="map-road road-three"></span>
          <span class="response-radius"></span><span class="route-line"></span>
          <button type="button" class="map-marker incident-marker" aria-label="Emergency location">!</button>
          <button type="button" class="map-marker helper-marker helper-one" aria-label="Nearby helper one">1</button>
          <button type="button" class="map-marker helper-marker helper-two" aria-label="Nearby helper two">2</button>
          <button type="button" class="map-marker helper-marker helper-three" aria-label="Nearby helper three">3</button>
          <div class="map-zone-label"><strong>${helperView ? "North District" : "18 Harmony Lane"}</strong><span>${joined ? "Exact route" : "Approx. 200 m radius"}</span></div>
          <div class="map-legend"><span><i class="incident-dot"></i>Incident</span><span><i class="helper-dot"></i>Nearby helpers</span></div>
        </div>
        <div class="map-partner-bar"><span>NAVIGATION</span><div><strong>Google Maps / local maps</strong></div><em>${joined ? "4 MIN" : "LOCKED"}</em></div>
      </section>
      <aside class="response-sidebar">
        <section class="card responder-card">
          <span class="response-state-icon">${joined ? "⌖" : "!"}</span>
          <h2>${addressTitle}</h2><p>${addressCopy}</p>
          <div class="response-actions">
            ${helperView ? '<a class="button primary" href="#/face-check">I can help · verify identity</a>' : ""}
            ${!helperView ? '<a class="button danger" href="#/helper-call">Call ambulance now</a><a class="button secondary" href="#/care-circle">Open Care Circle</a>' : ""}
          </div>
        </section>
        ${helperView ? '<section class="card helper-reward"><span>ONE HELPER ONLY</span><strong>Registered user · live location recorded</strong></section>' : ""}
      </aside>
    </div>`;
}

function faceCheck() {
  return `<a class="back-link" href="#/response-map">← Back to map</a>
    ${intro("Identity check", helperFaceVerified ? "Identity confirmed" : "Verify before viewing address", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="${helperFaceVerified ? "done" : "active"}">2 Face ID</span><span>3 Address</span><span>4 Ambulance</span><span>5 Dispatch</span></div>
    <section class="card face-check-card ${helperFaceVerified ? "verified" : ""}">
      <div class="face-scan-frame"><span>${helperFaceVerified ? "✓" : "☺"}</span><i></i></div>
      <small>REGISTERED NEARBY HELPER</small>
      <h2>${helperFaceVerified ? "Zhang Wei verified" : "Confirm you are Zhang Wei"}</h2>
      <p>Identity checked at registration · live location on</p>
      ${helperFaceVerified
        ? '<a class="button primary face-check-button" href="#/care-circle">Join Live Incident Room →</a>'
        : '<button class="button primary face-check-button" id="verify-face">Scan face to verify</button>'}
    </section>`;
}

function protectedAddress() {
  if (!helperFaceVerified) {
    return `<a class="back-link" href="#/response-map">← Back to map</a>
      ${intro("Protected information", "Address locked", "")}
      <section class="card helper-verify-card"><div class="helper-verify-icon">!</div><h2>Face verification required</h2><a class="button primary helper-verify-button" href="#/face-check">Verify identity</a></section>`;
  }
  return `<a class="back-link" href="#/care-circle">← Back to Incident Room</a>
    ${intro("Assigned helper", "Address & risk information", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="done">2 Face ID</span><span class="active">3 Address</span><span>4 Ambulance</span><span>5 Dispatch</span></div>
    <section class="card protected-address-card">
      <div class="address-security"><span>✓ IDENTITY VERIFIED</span><em>15 MIN ACCESS</em></div>
      <div class="protected-address-main"><span class="address-pin">⌖</span><div><small>REGISTERED HOME ADDRESS</small><h2>18 Harmony Lane, #05-12</h2><p>Singapore 548210</p></div></div>
      <div class="protected-risk-grid"><span><small>RISK</small><b>92%</b></span><span><small>ALARM</small><b>Sounding</b></span><span><small>STATUS</small><b>No response</b></span></div>
      <div class="call-script"><strong>Tell the emergency operator:</strong><span>“Older adult, possible emergency, no response. Address: 18 Harmony Lane, #05-12.”</span></div>
      <a class="button danger protected-call-button" href="#/helper-call">Call ambulance now →</a>
    </section>`;
}

function rapidCheck() {
  const urgent = rapidCheckState === "urgent";
  const evidence = [
    ["FM", "Family", "Two calls · no answer", "done"],
    ["MC", "Community", "No visit yet", ""],
    ["DR", "Professional", "Vitals stable", "done"],
    ["NH", "Nearby helper", urgent ? "Alarm heard · no response" : "Waiting at public lobby", urgent ? "urgent" : ""],
  ];
  return `<a class="back-link" href="#/response-map">← Back to map</a>
    ${intro("Collective intelligence", "Rapid verification", "")}
    <div class="response-steps"><span class="done">1 Alert</span><span class="done">2 Verify</span><span class="${urgent ? "done" : "active"}">3 Decision</span><span>4 Response</span></div>
    <section class="card rapid-check-header ${urgent ? "urgent" : ""}">
      <div><small>${urgent ? "ESCALATION RECOMMENDED" : "VERIFICATION WINDOW"}</small><strong>${urgent ? "92% risk" : "82% risk"}</strong></div>
      <time>${urgent ? "00:42" : "01:30"}</time>
    </section>
    <div class="rapid-intel-grid">${evidence.map(item => `<section class="card rapid-intel ${item[3]}"><span>${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div></section>`).join("")}</div>
    <section class="rapid-decision-actions">
      ${urgent
        ? '<a class="button danger" href="#/helper-call">Call ambulance now</a><button class="button secondary" id="confirm-safe-outcome">Eleanor is safe</button>'
        : '<button class="button primary" id="report-no-response">Report: alarm heard, no response</button><button class="button secondary" id="confirm-safe-outcome">Eleanor is safe</button>'}
    </section>`;
}

function helperCall() {
  return `<a class="back-link" href="#/care-circle">← Back to Incident Room</a>
    ${intro("Emergency call", "Calling ambulance…", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="done">2 Face ID</span><span class="done">3 Address</span><span class="active">4 Ambulance</span><span>5 Dispatch</span></div>
    <section class="card helper-call-screen">
      <div class="helper-call-pulse">☎</div>
      <span class="helper-call-live">SIMULATION · CALLING</span>
      <h2>Emergency ambulance</h2>
      <strong class="helper-call-number">AMBULANCE</strong>
      <div class="helper-call-address"><b>18 Harmony Lane, #05-12</b><span>Risk 92% · alarm sounding · read this to the operator</span></div>
      <a class="button danger helper-call-complete" href="#/dispatch">Dispatcher confirmed →</a>
    </section>`;
}

function dispatchPage() {
  return `${intro("Emergency dispatch confirmed", "Ambulance dispatched", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="done">2 Face ID</span><span class="done">3 Address</span><span class="done">4 Ambulance</span><span class="done">5 Dispatch</span></div>
    <section class="card dispatch-card">
      <div class="dispatch-ambulance">✚</div>
      <span>AMBULANCE DISPATCH</span>
      <strong>7 min</strong>
      <h2>Heading to 18 Harmony Lane</h2>
      <div class="two-responder-route"><span><b>🚑</b>Ambulance · 7 min</span><span><b>◎</b>You · 4 min</span></div>
      <a class="button primary dispatch-navigate" href="#/helper-reward">I have arrived · claim reward →</a>
    </section>`;
}

function helperReward() {
  return `<a class="back-link" href="#/${voucherClaimed ? "care-circle" : "dispatch"}">${voucherClaimed ? "← Return to Incident Room" : "← Back to dispatch"}</a>
    ${intro("Community reward", voucherClaimed ? "Voucher saved" : "Thank you for helping", "")}
    <div class="response-steps five-steps"><span class="done">1 Alert</span><span class="done">2 Face ID</span><span class="done">3 Address</span><span class="done">4 Ambulance</span><span class="done">5 Dispatch</span></div>
    <section class="card voucher-card ${voucherClaimed ? "claimed" : ""}">
      <span>CAREMART SUPERMARKET</span>
      <strong>SGD 5</strong>
      <h2>Community helper voucher</h2>
      <p class="voucher-arrival">${voucherClaimed ? "✓ Temporary access ended · address revoked" : "✓ Arrival recorded · ambulance en route"}</p>
      <div class="voucher-code">${voucherClaimed ? "SAVED TO WALLET" : "CC-HELP-0826"}</div>
      <div class="voucher-actions">
        <button class="button primary voucher-claim" id="claim-voucher" ${voucherClaimed ? "disabled" : ""}>${voucherClaimed ? "✓ Added to wallet" : "Add voucher to wallet"}</button>
        <button class="button secondary helper-reset" id="return-helper-home">Return to home</button>
      </div>
    </section>`;
}

function smartWatch() {
  const vitals = [["72","bpm","Heart rate","Normal"],["97","%","Blood oxygen","Normal"],["7h 12","min","Sleep","Restful"],["1,842","","Steps today","Below usual"]];
  return `<button class="back-link back-button" type="button" data-back>← Back to previous page</button>
    ${intro("Smart watch", "Eleanor’s wellbeing", "Live readings are compared with Eleanor’s personal baseline.")}
    <section class="card wearable-status"><div class="wearable-icon">♥</div><div><span class="online-copy"><i></i> Synced 2 minutes ago</span><h2>Overall status: stable</h2><p>No urgent change in heart rate or blood oxygen. Activity is lower than Eleanor’s usual morning.</p></div></section>
    <div class="vitals-grid">${vitals.map((v,i)=>`<section class="card vital ${i===3?"attention":""}"><span>${v[2]}</span><strong>${v[0]} <small>${v[1]}</small></strong><em>${v[3]}</em></section>`).join("")}</div>
    <div class="grid-two watch-grid"><section class="card panel"><h2 class="section-title">Today’s pattern</h2><div class="mini-bars"><span style="height:34%"></span><span style="height:58%"></span><span style="height:72%"></span><span style="height:46%"></span><span class="current" style="height:20%"></span></div><p class="fine-print">Movement dropped after 9:45 AM, while vital signs remained stable.</p></section><section class="card panel"><h2 class="section-title">What this means</h2><p class="fine-print">The watch supports the inactivity alert but does not show a medical emergency by itself.</p>${button("Return home page","/")}</section></div>`;
}

function doorSensor() {
  const events = [["8:12 AM","Door opened","Eleanor left home"],["8:14 AM","Door locked","Home secured"],["9:03 AM","Door opened","Eleanor returned home"],["9:05 AM","Door closed","No movement since return"]];
  return `<button class="back-link back-button" type="button" data-back>← Back to previous page</button>
    ${intro("Door sensor", "Entry and exit activity", "A clear timeline of when Eleanor left and returned home.")}
    <section class="card door-status"><span class="door-icon">⌂</span><div><span class="online-copy"><i></i> Sensor online</span><h2>Eleanor is currently at home</h2><p>Last door activity was recorded at 9:05 AM.</p></div></section>
    <div class="grid-two door-grid"><section class="card panel"><h2 class="section-title">Today’s door timeline</h2><div class="door-events">${events.map((e,i)=>`<div class="door-event"><time>${e[0]}</time><span class="${i===2?"return-event":""}">${i===2?"↩":"•"}</span><div><strong>${e[1]}</strong><p>${e[2]}</p></div></div>`).join("")}</div></section><aside class="stack"><section class="card panel"><h2 class="section-title">Routine insight</h2><p class="fine-print">Today’s trip was 51 minutes, close to Eleanor’s usual morning routine of 45–60 minutes.</p></section><section class="card panel"><h2 class="section-title">Home status</h2><p class="fine-print">Door closed · no unexpected exit · monitoring active.</p>${button("Return home page","/")}</section></aside></div>`;
}

function callMei() {
  const calling = meiCallState === "calling";
  return `<button class="back-link back-button" type="button" data-back>← Back to previous page</button>
    ${intro("Community care call", "Call Mei", "Contact the community care leader assigned to Eleanor’s safety check.")}
    <section class="card parent-call-hero mei-call-hero">
      <div class="parent-avatar mei-avatar">MC</div>
      <span class="online-copy"><i></i> Available · 8 minutes away</span>
      <h2>Mei Chen</h2>
      <p>Community Care Leader · North District</p>
      <div class="call-live-state ${calling ? "calling" : ""}">${calling ? "<span></span> Calling Mei…" : "Ready to call"}</div>
      <button class="parent-call-button ${calling ? "end-call" : ""}" id="mei-call">${calling ? "End call" : "☎ Call Mei now"}</button>
    </section>
    <div class="grid-two parent-call-grid mei-call-grid">
      <section class="card panel"><h2 class="section-title">Current assignment</h2>
        <div class="call-signal"><span>!</span><div><strong>Eleanor safety check</strong><p>Risk 82% · assigned to Mei</p></div></div>
        <div class="call-signal"><span>⌖</span><div><strong>8 minutes away</strong><p>North District community route</p></div></div>
      </section>
      <aside class="card panel"><h2 class="section-title">Call status</h2>
        <p class="fine-print">${calling ? "Connecting to Mei’s mobile…" : "Mei is available for the assigned safety check."}</p>
        <button class="button secondary" type="button" data-back>Return to safety check</button>
      </aside>
    </div>`;
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
  const view = currentRole === "Community care" ? {
    eyebrow: "Community operations",
    title: "Visits & alerts",
    subtitle: "Prioritise nearby support and keep every Care Circle updated.",
    rows: [
      ["!","Eleanor · priority safety check","Risk 82% · no movement for 43 minutes · due now","Open →","#/community-task",""],
      ["◎","Arthur · routine visit","11:30 AM · confirm arrival with family","Scheduled","",""],
      ["✓","Siti · medication check","2:00 PM · visit confirmed","Scheduled","","good"],
    ],
  } : currentRole === "Professional caregiver" ? {
    eyebrow: "Professional review",
    title: "Risk review queue",
    subtitle: "4 reviews · 1 high priority",
    rows: [
      ["!","Eleanor · high-priority review","Risk 82% · stable vitals + unusual inactivity","Open record →","#/patient-record",""],
      ["◎","Arthur · pattern review","Risk 46% · sleep routine changed for 3 days","Pending","",""],
      ["✓","Siti · weekly summary","Risk 22% · within personal baseline","Reviewed","","good"],
    ],
  } : {
    eyebrow: "Activity history",
    title: "Alerts",
    subtitle: "Review recent changes and the decisions made by the Care Circle.",
    rows: [
      ["!","Unusual inactivity detected","Today · 10:22 AM · Living room · Risk score 82%","Review →","#/alert",""],
      ["✓","Routine returned to normal","Yesterday · 3:18 PM · Resolved after family check-in","Resolved","","good"],
      ["✓","Front door left open","Monday · 8:42 AM · Closed after volunteer visit","Resolved","","good"],
    ],
  };
  return `${intro(view.eyebrow, view.title, view.subtitle)}
    <div class="list">${view.rows.map(r=>`${r[4]?`<a class="card list-item" href="${r[4]}">`:`<div class="card list-item">`}<span class="list-icon ${r[5]}">${r[0]}</span><div><strong>${r[1]}</strong><p>${r[2]}</p></div><span class="${r[5]?"agrees":"arrow-link"}">${r[3]}</span>${r[4]?"</a>":"</div>"}`).join("")}</div>`;
}

function workspaceSettingsPage() {
  const community = currentRole === "Community care";
  const labels = community ? [
    ["Priority safety alerts","Notify me when an assigned older adult needs nearby support."],
    ["Visit and handover reminders","Show today’s route, task ownership and Care Circle handovers."],
    ["Shared conversation updates","Notify me when family or professionals add new context."],
  ] : [
    ["High-risk review alerts","Notify me when an explainable risk card needs professional review."],
    ["Care plan and telehealth reminders","Show scheduled reviews, consultations and follow-up actions."],
    ["Care Circle recommendations","Notify me when new evidence may change the shared decision."],
  ];
  return `${intro(community ? "Community workspace" : "Professional workspace", "Settings", community ? "Manage community assignments, alerts and shared-care permissions." : "Manage clinical review alerts, care plans and professional access.")}
    <div class="list"><div class="card role-access-card ${community ? "community-access" : "professional-access"}"><span>${community ? "CC" : "PC"}</span><div><small>${community ? "ORGANISATION ACCESS" : "CLINICAL PARTNER ACCESS"}</small><strong>${community ? "North District Community Team" : "CareConnect Professional Network"}</strong><p>${community ? "6 assigned homes · 4 approved supporters" : "4 active reviews · telehealth enabled"}</p></div><em>ACTIVE</em></div>
    ${labels.map((x,i)=>`<div class="card setting"><div><strong>${x[0]}</strong><p>${x[1]}</p></div><button class="toggle ${settings[i]?"on":""}" data-toggle="${i}" aria-label="Toggle ${x[0]}"><span></span></button></div>`).join("")}
    <div class="card setting"><div><strong>Role-based privacy</strong><p>${community ? "See only assigned homes, shared alerts and approved visit details." : "Access health trends and care notes only for assigned clients."}</p></div><span class="agrees">Protected</span></div></div>`;
}

function helperSettingsPage() {
  const labels = [
    ["Nearby emergency alerts","Receive active emergencies within your selected distance."],
    ["Location permission","Used only to match nearby active alerts."],
    ["Community rewards","Save verified assistance vouchers to your wallet."],
  ];
  return `${intro("Nearby Helper", "Settings", "")}
    <div class="list">
      <div class="card role-access-card community-access"><span>NH</span><div><small>OPT-IN STATUS</small><strong>Nearby Helper active</strong><p>Adult account · North District · 500 m radius</p></div><em>ON</em></div>
      ${labels.map((x,i)=>`<div class="card setting"><div><strong>${x[0]}</strong><p>${x[1]}</p></div><button class="toggle ${settings[i]?"on":""}" data-toggle="${i}" aria-label="Toggle ${x[0]}"><span></span></button></div>`).join("")}
      <div class="card setting"><div><strong>Address privacy</strong><p>Exact addresses unlock only after an assigned helper passes Face ID.</p></div><span class="agrees">Protected</span></div>
    </div>`;
}

function settingsPage() {
  if (currentRole === "Nearby helper") return helperSettingsPage();
  if (currentRole !== "Family member") return workspaceSettingsPage();
  const labels = [
    ["Push notifications","Receive new risk cards and Care Circle decisions."],
    ["Care Circle updates","Get notified when a member adds context or agrees."],
    ["Weekly wellbeing summary","Receive a plain-language pattern summary every Monday."],
  ];
  return `${intro("Preferences", "Settings", "Choose what the platform shares and how you want to be notified.")}
    <div class="list"><a class="card setting plan-setting" href="#/subscription"><span class="plan-setting-price">SGD<strong>49</strong><small>/month</small></span><div class="plan-setting-copy"><span>SUBSCRIPTION & RENEWAL</span><strong>Family plan</strong><p>Automatic renewal · next billing 28 Aug 2026</p></div><span class="plan-setting-action">Manage →</span></a>
    ${labels.map((x,i)=>`<div class="card setting"><div><strong>${x[0]}</strong><p>${x[1]}</p></div><button class="toggle ${settings[i]?"on":""}" data-toggle="${i}" aria-label="Toggle ${x[0]}"><span></span></button></div>`).join("")}
    <div class="card setting"><div><strong>Privacy controls</strong><p>Only approved Care Circle members can see Eleanor’s signals and notes.</p></div><span class="agrees">3 members</span></div></div>`;
}

function subscriptionPage() {
  const selected = subscriptionPlans[subscription.selectedPlan];
  const current = subscriptionPlans[subscription.currentPlan];
  const price = subscription.billing === "annual" ? selected.monthly * 10 : selected.monthly;
  const cadence = subscription.billing === "annual" ? "year" : "month";
  const renewalDate = subscription.renewed
    ? subscription.billing === "annual" ? "28 Aug 2027" : "28 Sep 2026"
    : "28 Aug 2026";
  const paymentLabels = {
    visa: "Visa •••• 4242",
    mastercard: "Mastercard •••• 6088",
    paynow: "PayNow",
  };
  return `<a class="subscription-back" href="#/settings">← Back to Settings</a>
    ${intro("Plan & billing", "Renew CareConnect", "Keep Eleanor’s monitoring, alerts and Care Circle connected.")}
    <section class="card subscription-summary">
      <div class="current-plan"><span class="plan-status">✓</span><div><small>Current plan</small><strong>${current.name}</strong><p>${subscription.autoRenew ? "Automatic renewal is on" : "Manual renewal"}</p></div></div>
      <div class="renewal-date"><span>${subscription.renewed ? "Active until" : "Renews"}</span><strong>${renewalDate}</strong></div>
    </section>
    <div class="billing-switch" role="group" aria-label="Billing frequency">
      <button type="button" class="${subscription.billing === "monthly" ? "active" : ""}" data-billing="monthly">Monthly</button>
      <button type="button" class="${subscription.billing === "annual" ? "active" : ""}" data-billing="annual">Annual <span>Save 2 months</span></button>
    </div>
    <div class="subscription-plan-grid">
      ${Object.entries(subscriptionPlans).map(([key, plan]) => {
        const planPrice = subscription.billing === "annual" ? plan.monthly * 10 : plan.monthly;
        return `<button type="button" class="subscription-plan ${subscription.selectedPlan === key ? "selected" : ""}" data-plan="${key}" aria-pressed="${subscription.selectedPlan === key}">
          ${key === "family" ? '<span class="recommended">RECOMMENDED</span>' : ""}
          <strong>${plan.name}</strong><small>${plan.description}</small>
          <span class="plan-price"><b>SGD ${planPrice}</b>/${subscription.billing === "annual" ? "yr" : "mo"}</span>
          <ul>${plan.features.map(feature => `<li>${feature}</li>`).join("")}</ul>
        </button>`;
      }).join("")}
    </div>
    <section class="card billing-panel">
      <label class="payment-row"><span><strong>Payment method</strong><small>Used only when renewal is confirmed</small></span>
        <select id="payment-method" aria-label="Payment method">
          ${Object.entries(paymentLabels).map(([key, label]) => `<option value="${key}" ${subscription.payment === key ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <div class="auto-renew-row"><span><strong>Auto-renew</strong><small>Continue protection without interruption</small></span>
        <button type="button" id="auto-renew" class="toggle ${subscription.autoRenew ? "on" : ""}" aria-label="Toggle automatic renewal"><span></span></button>
      </div>
    </section>
    ${subscription.renewed ? `<div class="renewal-success" role="status"><strong>✓ Renewal confirmed</strong><span>${current.name} is active until ${renewalDate} using ${paymentLabels[subscription.payment]}.</span></div>` : ""}
    <button type="button" class="button primary renewal-cta" id="renew-now">Renew ${selected.name} · SGD ${price}/${cadence}</button>
    <div class="subscription-footer"><span>Smart device packages are a separate one-time purchase.</span><span class="subscription-footer-links"><a href="#/settings">Settings</a><a href="#/">Home →</a></span></div>
    <p class="prototype-note">Interactive MVP only — no real payment will be taken.</p>`;
}

const pages = {"/":home,"/alert":alertDetail,"/community-task":communityTask,"/patient-record":patientRecord,"/care-circle":careCircle,"/decision":decision,"/monitoring":monitoring,"/emergency":emergency,"/response-map":responseMap,"/face-check":faceCheck,"/protected-address":protectedAddress,"/helper-call":helperCall,"/dispatch":dispatchPage,"/helper-reward":helperReward,"/smart-watch":smartWatch,"/door-sensor":doorSensor,"/call-parents":callParents,"/call-mei":callMei,"/alerts":alerts,"/settings":settingsPage,"/subscription":subscriptionPage};
const roleChrome = {
  "Family member": {
    meta: "Eleanor’s home · 3 devices connected",
    shortcutLabel: "Family plan",
    shortcutValue: "Renew",
    shortcutHref: "/subscription",
    shortcutClass: "",
    homeLabel: "Home",
    alertsLabel: "Alerts",
  },
  "Community care": {
    meta: "North district · 6 assigned homes",
    shortcutLabel: "Today’s route",
    shortcutValue: "2 follow-ups",
    shortcutHref: "/alerts",
    shortcutClass: "work-shortcut community-shortcut",
    homeLabel: "Home",
    alertsLabel: "Tasks",
  },
  "Professional caregiver": {
    meta: "Care coordination · 4 reviews",
    shortcutLabel: "Review queue",
    shortcutValue: "4 cases",
    shortcutHref: "/alerts",
    shortcutClass: "work-shortcut professional-shortcut",
    homeLabel: "Home",
    alertsLabel: "Reviews",
  },
  "Nearby helper": {
    meta: "North District · opt-in active",
    shortcutLabel: "Nearby alert",
    shortcutValue: "200 m",
    shortcutHref: "/response-map",
    shortcutClass: "work-shortcut community-shortcut",
    homeLabel: "Home",
    alertsLabel: "Map",
  },
};

function route() {
  const value = location.hash.slice(1) || "/";
  return pages[value] ? value : "/";
}

function render() {
  const current = route();
  const chrome = roleChrome[currentRole];
  const nav = currentRole === "Nearby helper"
    ? [["/","⌂","Home"],["/response-map","!","Map"],["/care-circle","◎","Incident"],["/settings","⚙","Settings"]]
    : [["/","⌂",chrome.homeLabel],["/alerts","!",chrome.alertsLabel],["/care-circle","◎","Care Circle"],["/settings","⚙","Settings"]];
  const activeRoute = current === "/alert" || current === "/community-task" || current === "/patient-record" || current === "/call-mei" || current === "/alerts" || current === "/emergency" || current === "/response-map" || current === "/face-check" || current === "/protected-address" || current === "/helper-call" || current === "/dispatch" ? (currentRole === "Nearby helper" ? "/response-map" : "/alerts")
    : current === "/helper-reward" ? (currentRole === "Nearby helper" ? "/care-circle" : "/")
    : current === "/care-circle" || current === "/decision" ? "/care-circle"
    : current === "/settings" || current === "/subscription" ? "/settings" : "/";
  document.getElementById("app").innerHTML = `<div class="app-shell">
    <header class="topbar"><div class="identity"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="9" r="3.2"></circle><path d="M10.5 21c0-4.4 2.5-7.1 5.5-7.1s5.5 2.7 5.5 7.1"></path><path class="brand-care-arms" d="M5.5 16.5c1 5.4 5.2 9.5 10.5 11M26.5 16.5c-1 5.4-5.2 9.5-10.5 11"></path></svg></span><div><div class="brand-name">CareConnect</div><div class="identity-meta">${chrome.meta}</div></div></div>
    <a class="plan-shortcut ${chrome.shortcutClass}" href="#${chrome.shortcutHref}" aria-label="${chrome.shortcutLabel} ${chrome.shortcutValue}"><span>${chrome.shortcutLabel}</span><strong>${chrome.shortcutValue}</strong></a>
    <select class="role-select" id="role-select" aria-label="Viewing role">${roleOptions.map(x=>`<option ${x===currentRole?"selected":""}>${x}</option>`).join("")}</select></header>
    <main class="content page-${current === "/" ? "home" : current.slice(1)}">${pages[current]()}</main>
    <nav class="mobile-nav">${nav.map(n=>`<a href="#${n[0]}" class="nav-item ${activeRoute===n[0]?"active":""}"><span class="nav-icon">${n[1]}</span><span>${n[2]}</span></a>`).join("")}</nav>
  </div>
  <div class="zoom-controls" role="group" aria-label="Page zoom controls">
    <button class="zoom-button" type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out"><span class="zoom-lens zoom-minus" aria-hidden="true"></span></button>
    <span class="zoom-value" id="zoom-value" aria-live="polite">${Math.round(userZoom * 100)}%</span>
    <button class="zoom-button" type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in"><span class="zoom-lens zoom-plus" aria-hidden="true"></span></button>
  </div>`;

  applyUserZoom();
  document.getElementById("role-select").addEventListener("change", (e) => {
    currentRole = e.target.value;
    try { localStorage.setItem("careconnectRole", currentRole); } catch {}
    if (route() === "/") render();
    else location.hash = "#/";
  });
  document.querySelectorAll("[data-toggle]").forEach((el) => el.addEventListener("click", () => {
    const i = Number(el.dataset.toggle); settings[i] = !settings[i]; render();
  }));
  document.querySelectorAll("[data-back]").forEach((el) => el.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.hash = "#/";
  }));
  const form = document.getElementById("chat-form");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("chat-input").value.trim();
    if (value) {
      const roleMap = {"Family member":["FM","Maya · Family","family"],"Community care":["MC","Mei · Community Care Leader","community"],"Professional caregiver":["DR","Dr. Rao · Professional","professional"]};
      const identity = currentRole === "Nearby helper"
        ? helperFaceVerified && !helperSessionClosed
          ? ["ZW","Zhang Wei · Assigned Helper","helper"]
          : ["NH","Nearby contributor","observer"]
        : roleMap[currentRole];
      chatMessages.push({initials:identity[0],name:identity[1],time:"Now",text:value,tone:identity[2]});
      render();
      const thread = document.querySelector(".chat-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
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
    callButton.textContent = "Calling ambulance…";
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
  const meiCallButton = document.getElementById("mei-call");
  if (meiCallButton) meiCallButton.addEventListener("click", () => {
    meiCallState = meiCallState === "calling" ? "ready" : "calling";
    render();
  });
  const startCommunityTask = document.getElementById("start-community-task");
  if (startCommunityTask) startCommunityTask.addEventListener("click", () => {
    communityTaskStarted = true;
    render();
  });
  const verifyFace = document.getElementById("verify-face");
  if (verifyFace) verifyFace.addEventListener("click", () => {
    helperFaceVerified = true;
    helperSessionClosed = false;
    responseMapState = "joined";
    render();
  });
  const joinResponse = document.getElementById("join-response");
  if (joinResponse) joinResponse.addEventListener("click", () => {
    responseMapState = "joined";
    render();
  });
  const mapEmergencyCall = document.getElementById("map-call-emergency");
  if (mapEmergencyCall) mapEmergencyCall.addEventListener("click", () => {
    responseMapState = "calling";
    render();
  });
  const mapSafeCheck = document.getElementById("map-safe-check");
  if (mapSafeCheck) mapSafeCheck.addEventListener("click", () => {
    responseMapState = "checking";
    render();
  });
  const resetResponseMap = document.getElementById("reset-response-map");
  if (resetResponseMap) resetResponseMap.addEventListener("click", () => {
    responseMapState = "alerted";
    render();
  });
  const verifyHelperAction = document.getElementById("verify-helper-action");
  if (verifyHelperAction) verifyHelperAction.addEventListener("click", () => {
    helperVerified = true;
    render();
  });
  const reportNoResponse = document.getElementById("report-no-response");
  if (reportNoResponse) reportNoResponse.addEventListener("click", () => {
    rapidCheckState = "urgent";
    render();
  });
  const confirmSafeOutcome = document.getElementById("confirm-safe-outcome");
  if (confirmSafeOutcome) confirmSafeOutcome.addEventListener("click", () => {
    helperVerified = true;
    location.hash = "#/helper-verification";
  });
  const claimVoucher = document.getElementById("claim-voucher");
  if (claimVoucher) claimVoucher.addEventListener("click", () => {
    voucherClaimed = true;
    helperFaceVerified = false;
    helperSessionClosed = true;
    render();
  });
  const returnHelperHome = document.getElementById("return-helper-home");
  if (returnHelperHome) returnHelperHome.addEventListener("click", () => {
    responseMapState = "alerted";
    rapidCheckState = "reviewing";
    helperFaceVerified = false;
    helperVerified = false;
    voucherClaimed = false;
    helperSessionClosed = false;
    location.hash = "#/";
  });
  document.querySelectorAll("[data-plan]").forEach((plan) => plan.addEventListener("click", () => {
    subscription.selectedPlan = plan.dataset.plan;
    subscription.renewed = false;
    render();
  }));
  document.querySelectorAll("[data-billing]").forEach((billing) => billing.addEventListener("click", () => {
    subscription.billing = billing.dataset.billing;
    subscription.renewed = false;
    render();
  }));
  const paymentMethod = document.getElementById("payment-method");
  if (paymentMethod) paymentMethod.addEventListener("change", (event) => {
    subscription.payment = event.target.value;
    subscription.renewed = false;
    render();
  });
  const autoRenew = document.getElementById("auto-renew");
  if (autoRenew) autoRenew.addEventListener("click", () => {
    subscription.autoRenew = !subscription.autoRenew;
    subscription.renewed = false;
    render();
  });
  const renewNow = document.getElementById("renew-now");
  if (renewNow) renewNow.addEventListener("click", () => {
    subscription.currentPlan = subscription.selectedPlan;
    subscription.renewed = true;
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

window.addEventListener("hashchange", () => {
  window.scrollTo(0, 0);
  render();
  const content = document.querySelector(".content");
  if (content) content.scrollTop = 0;
});
window.addEventListener("resize", applyUserZoom);
render();
