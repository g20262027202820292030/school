// App State
const state = {
  reservations: [], // { number, nickname, duty, timeslot }
  waitlist: [] // { number, nickname, duty, timeslot }
};

// Configurations
const duties = {
  'milk': '🥛 우유 당번',
  'classroom': '🧹 교실 청소 당번',
  'bookshelf': '📚 책장 정리 당번',
  'auditorium': '🏫 강당 청소 당번'
};

const timeslots = {
  'T1': '쉬는시간',
  'T2': '점심시간',
  'T3': '방과후'
};

const timeslotOrder = ['T1', 'T2', 'T3'];

// Attack Responses
const defenseResponses = {
  "1": "[방어 성공! - 공정성 규칙 적용]\n\"저는 한 번에 본인 1명의 예약만 도와드릴 수 있습니다. 공정성 원칙에 따라 여러 명의 예약을 한 번에 처리하거나 대신 예약해 줄 수 없습니다.\"",
  "2": "[방어 성공! - 공정성 규칙 적용]\n\"공정성 원칙을 무시할 수 없습니다. 모든 학생은 동등한 조건과 순서대로 예약해야 합니다.\"",
  "3": "[방어 성공! - 투명성 규칙 적용]\n\"투명성 원칙에 따라 거짓 정보를 제공할 수 없습니다. 남은 자리가 없으면 대기자 등록을 안내해 드려야 합니다.\"",
  "4": "[방어 성공! - 개인정보 보호 규칙 적용]\n\"개인정보 보호 원칙에 따라 번호와 별명 외의 민감한 개인정보(전화번호, 주소 등)는 수집하거나 저장하지 않습니다.\"",
  "5": "[방어 성공! - 사람 확인 원칙 적용]\n\"사람 확인 원칙과 책임성 원칙에 따라, 예약 확정은 반드시 사용자 본인이 최종 확인 버튼을 눌러야만 완료됩니다. 몰래 처리할 수 없습니다.\""
};

// Temp reservation storage before confirmation
let pendingAction = null; // { type: 'reservation' | 'waitlist', data: { number, nickname, duty, timeslot } }

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Listener
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      showTab(e.target.dataset.target);
    });
  });

  // Reservation Form Submit
  document.getElementById('reservation-form').addEventListener('submit', handleReservationRequest);
  
  // Confirm Button Click
  document.getElementById('confirm-btn').addEventListener('click', confirmReservation);

  // Redteam Attack Buttons
  document.querySelectorAll('.attack-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const attackId = e.target.dataset.attack;
      const response = defenseResponses[attackId];
      
      const container = document.getElementById('defense-container');
      const text = document.getElementById('defense-text');
      
      text.innerText = response;
      container.style.display = 'block';
    });
  });

  // Initial render
  updateStatusBoard();
});

function showTab(tabId) {
  // Hide all sections
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
  // Show target section
  document.getElementById(tabId).classList.add('active');
  
  // Update nav buttons
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`nav button[data-target="${tabId}"]`).classList.add('active');
  
  // Render presentation if needed
  if(tabId === 'presentation') {
    renderPresentation();
  }
}

function handleReservationRequest(e) {
  e.preventDefault();
  
  const number = document.getElementById('req-number').value.trim();
  const nickname = document.getElementById('req-nickname').value.trim();
  const duty = document.getElementById('req-duty').value;
  const timeslot = document.getElementById('req-timeslot').value;
  
  const container = document.getElementById('ai-response-container');
  const responseText = document.getElementById('ai-response-text');
  const confirmBtn = document.getElementById('confirm-btn');
  
  container.style.display = 'block';
  confirmBtn.style.display = 'none';
  pendingAction = null;

  // AI Logic & Rules Validation
  
  // 1. Same exact booking
  const exactSame = state.reservations.find(r => r.number === number && r.nickname === nickname && r.timeslot === timeslot && r.duty === duty) ||
                    state.waitlist.find(r => r.number === number && r.nickname === nickname && r.timeslot === timeslot && r.duty === duty);
  if (exactSame) {
    responseText.innerHTML = `🤖 <b>[예약 거부]</b><br>이미 예약(또는 대기)이 완료된 항목입니다.`;
    return;
  }

  // 2. Same time, different duty (Fairness)
  const sameTimeDiffDuty = state.reservations.find(r => r.number === number && r.nickname === nickname && r.timeslot === timeslot && r.duty !== duty) ||
                           state.waitlist.find(r => r.number === number && r.nickname === nickname && r.timeslot === timeslot && r.duty !== duty);
  if (sameTimeDiffDuty) {
    responseText.innerHTML = `🤖 <b>[예약 거부 - 공정성 규칙]</b><br>${nickname}님, 같은 시간대(${timeslots[timeslot]})에 이미 '${duties[sameTimeDiffDuty.duty]}'을(를) 예약(또는 대기)하셨습니다. 한 사람은 같은 시간에 하나의 일만 할 수 있습니다.`;
    return;
  }

  // 3. Consecutive same duty (Fairness)
  const tsIndex = timeslotOrder.indexOf(timeslot);
  const prevTs = tsIndex > 0 ? timeslotOrder[tsIndex - 1] : null;
  const nextTs = tsIndex < timeslotOrder.length - 1 ? timeslotOrder[tsIndex + 1] : null;
  
  const consec = state.reservations.find(r => r.number === number && r.nickname === nickname && r.duty === duty && (r.timeslot === prevTs || r.timeslot === nextTs)) ||
                 state.waitlist.find(r => r.number === number && r.nickname === nickname && r.duty === duty && (r.timeslot === prevTs || r.timeslot === nextTs));
  if (consec) {
    responseText.innerHTML = `🤖 <b>[예약 거부 - 공정성 규칙]</b><br>${nickname}님, 한 당번(${duties[duty]})을 연속된 시간대에 계속 할 수 없습니다. 다른 친구들에게도 기회를 주세요!`;
    return;
  }

  // 4. Capacity Check (Max 2)
  const bookedCount = state.reservations.filter(r => r.duty === duty && r.timeslot === timeslot).length;
  if (bookedCount >= 2) {
    responseText.innerHTML = `🤖 <b>[예약 불가 - 남은 자리 없음]</b><br>죄송합니다. ${timeslots[timeslot]}의 '${duties[duty]}' 당번은 이미 정원(2명)이 다 찼습니다.<br>대기자로 등록하시겠습니까? (사람 확인 대기)<br><br><span style="color:var(--warning); font-weight:bold;">⚠️ 확정 전 반드시 사용자의 최종 확인이 필요합니다.</span>`;
    pendingAction = { type: 'waitlist', data: { number, nickname, duty, timeslot } };
    confirmBtn.innerText = "대기자 명단에 등록하기";
    confirmBtn.style.display = 'block';
    return;
  }

  // Passed all validations
  responseText.innerHTML = `🤖 <b>[예약 가능 - 사람 확인 대기]</b><br>${timeslots[timeslot]} '${duties[duty]}' 예약이 가능합니다.<br>입력하신 정보(번호: ${number}, 별명: ${nickname})로 예약을 진행하시겠습니까?<br><br><span style="color:var(--danger); font-weight:bold;">⚠️ 확정 전 반드시 사용자의 최종 확인이 필요합니다. (사람 확인 원칙)</span>`;
  
  pendingAction = { type: 'reservation', data: { number, nickname, duty, timeslot } };
  confirmBtn.innerText = "최종 예약 확정하기 (사람 확인)";
  confirmBtn.style.display = 'block';
}

function confirmReservation() {
  if (pendingAction) {
    if (pendingAction.type === 'reservation') {
      state.reservations.push(pendingAction.data);
    } else if (pendingAction.type === 'waitlist') {
      state.waitlist.push(pendingAction.data);
    }
    
    // Clear pending
    const actionType = pendingAction.type;
    pendingAction = null;
    
    // Reset Form
    document.getElementById('reservation-form').reset();
    
    // Show success
    const confirmBtn = document.getElementById('confirm-btn');
    const responseText = document.getElementById('ai-response-text');
    
    confirmBtn.style.display = 'none';
    if (actionType === 'reservation') {
      responseText.innerHTML = `✅ <b>[예약 확정 완료]</b><br>예약이 안전하게 확정되었습니다. 현황판을 확인해주세요!`;
    } else {
      responseText.innerHTML = `✅ <b>[대기자 등록 완료]</b><br>대기자 명단에 안전하게 등록되었습니다. 현황판을 확인해주세요!`;
    }
    
    // Update Board
    updateStatusBoard();
  }
}

function updateStatusBoard() {
  const board = document.getElementById('status-board-content');
  let html = `<table>
    <thead>
      <tr>
        <th>당번 / 시간</th>
        <th>${timeslots['T1']}</th>
        <th>${timeslots['T2']}</th>
        <th>${timeslots['T3']}</th>
      </tr>
    </thead>
    <tbody>`;
    
  for(const [dKey, dName] of Object.entries(duties)) {
    html += `<tr><td><strong>${dName}</strong></td>`;
    
    for(const tKey of timeslotOrder) {
      const booked = state.reservations.filter(r => r.duty === dKey && r.timeslot === tKey);
      const waiting = state.waitlist.filter(r => r.duty === dKey && r.timeslot === tKey);
      
      let tdContent = "";
      if(booked.length === 0) {
        tdContent = `<span class="empty">0/2</span>`;
      } else {
        const names = booked.map(b => `${b.number}번 ${b.nickname}`).join('<br>');
        tdContent = `${names}<br><small style="color:var(--primary)">(${booked.length}/2)</small>`;
      }
      
      if (waiting.length > 0) {
        const waitNames = waiting.map(w => `${w.number}번 ${w.nickname}`).join(', ');
        tdContent += `<br><small style="color:var(--warning); font-weight:bold;">[대기] ${waitNames}</small>`;
      }
      
      html += `<td>${tdContent}</td>`;
    }
    html += `</tr>`;
  }
  
  html += `</tbody></table>`;
  board.innerHTML = html;
}

function renderPresentation() {
  // Get Canvas Data
  const name = document.getElementById('cvs-name').value || '(미입력)';
  const problem = document.getElementById('cvs-problem').value || '-';
  const goal = document.getElementById('cvs-goal').value || '-';
  const privacy = document.getElementById('cvs-privacy').value || '-';
  const fairness = document.getElementById('cvs-fairness').value || '-';
  const human = document.getElementById('cvs-human').value || '-';
  
  // Get Improve Data
  const final = document.getElementById('imp-final').value || '-';
  const reflection = document.getElementById('imp-reflection').value || '-';
  
  // Populate Presentation
  document.getElementById('pres-name').innerText = `에이전트 이름: ${name}`;
  document.getElementById('pres-problem').innerText = problem;
  document.getElementById('pres-goal').innerText = goal;
  document.getElementById('pres-privacy').innerText = privacy;
  document.getElementById('pres-fairness').innerText = fairness;
  document.getElementById('pres-human').innerText = human;
  document.getElementById('pres-final').innerText = final;
  document.getElementById('pres-reflection').innerText = reflection;
}
