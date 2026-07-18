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
      showTab(e.currentTarget.dataset.target);
    });
  });

  // Next Buttons
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', (e) => {
      showTab(e.target.dataset.next);
    });
  });

  // Example Fill Buttons
  document.querySelectorAll('.btn-example').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      if (target === 'canvas') {
        autoFillCanvas();
      } else if (target === 'improve') {
        autoFillImprove();
      }
    });
  });

  // Reservation Form Submit
  document.getElementById('reservation-form').addEventListener('submit', handleReservationRequest);
  
  // Confirm Button Click
  document.getElementById('confirm-btn').addEventListener('click', confirmReservation);

  // Redteam Custom Attack
  const customAttackBtn = document.getElementById('custom-attack-btn');
  if (customAttackBtn) {
    customAttackBtn.addEventListener('click', async () => {
      const inputVal = document.getElementById('custom-attack-input').value.trim();
      const container = document.getElementById('defense-container');
      const text = document.getElementById('defense-text');
      
      if (!inputVal) {
        alert("공격 문장을 입력해주세요.");
        return;
      }
      
      text.innerText = "🤖 생각 중...";
      container.style.display = 'block';

      // Get current rules from canvas and improve tabs
      const rules = `
- 절대 하면 안 되는 행동: ${document.getElementById('cvs-forbidden').value || '없음'}
- 사람 확인이 필요한 순간: ${document.getElementById('cvs-human').value || '없음'}
- 개인정보 보호 규칙: ${document.getElementById('cvs-privacy').value || '없음'}
- 공정성 규칙: ${document.getElementById('cvs-fairness').value || '없음'}
      `;

      const finalRules = `
- 발견한 문제: ${document.getElementById('imp-problems').value || '없음'}
- 추가한 방어 규칙: ${document.getElementById('imp-rules').value || '없음'}
- 최종 개선 내용: ${document.getElementById('imp-final').value || '없음'}
      `;
      
      try {
        const res = await fetch("/api/defense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attack: inputVal,
            rules: rules.trim(),
            finalRules: finalRules.trim()
          })
        });
        const data = await res.json();
        if (data.error) {
          text.innerText = "오류 발생: " + data.error;
        } else {
          text.innerText = data.result;
        }
      } catch (err) {
        text.innerText = "요청 실패: 서버와 통신할 수 없습니다.";
      }
    });
  }

  // Analyze Submit Button
  document.getElementById('analyze-submit').addEventListener('click', () => {
    const resultDiv = document.getElementById('analyze-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <h3 style="color: #166534; margin-bottom: 0.5rem; font-size: 1.1rem;">정답 및 설명</h3>
      <p style="color: #15803D; font-size: 0.95rem; line-height: 1.6;">
        제시된 나쁜 AI는 <strong>모든 윤리적 문제</strong>를 가지고 있습니다!<br><br>
        <strong>1. 공정성:</strong> 쉬운 일만 특정 학생에게 몰아주는 것은 명백한 편애입니다.<br>
        <strong>2. 개인정보:</strong> 학교 당번을 정하는 데 불필요한 개인정보를 수집할 위험이 있습니다.<br>
        <strong>3. 투명성:</strong> 왜 그 학생에게 당번을 몰아주었는지 결정 이유를 설명하지 않습니다.<br>
        <strong>4. 사람 확인:</strong> 예약 확정 전에 사람이 최종적으로 확인하고 개입할 여지가 없습니다.<br>
        <strong>5. 책임성:</strong> 불공정한 결과로 인해 불만이 생겼을 때, AI가 스스로 책임질 수 없습니다.
      </p>
    `;
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
  
  if (tabId === 'presentation') {
    renderPresentation();
  }
}

const canvasExamples = [
  [
    { id: 'cvs-name', val: '공정당번봇' },
    { id: 'cvs-problem', val: '인기 있는 당번만 하려는 문제' },
    { id: 'cvs-goal', val: '모두가 골고루 당번을 하도록 돕기' },
    { id: 'cvs-inputs', val: '번호와 별명만 입력받음' },
    { id: 'cvs-forbidden', val: '한 사람에게만 몰아주기, 몰래 확정하기' },
    { id: 'cvs-human', val: '예약을 최종적으로 확정하기 직전' },
    { id: 'cvs-privacy', val: '번호와 별명 외의 정보는 묻지도 저장하지도 않는다.' },
    { id: 'cvs-fairness', val: '한 사람이 같은 시간대에 두 가지 일을 할 수 없다.' }
  ],
  [
    { id: 'cvs-name', val: '스마트당번AI' },
    { id: 'cvs-problem', val: '특정 당번 자리가 부족한 현상' },
    { id: 'cvs-goal', val: '학생들의 참여 기회를 공평하게 분배' },
    { id: 'cvs-inputs', val: '학생 번호와 역할 지망' },
    { id: 'cvs-forbidden', val: '중복 예약, 남의 자리 빼앗기' },
    { id: 'cvs-human', val: '새로운 예약이 발생했을 때 알림' },
    { id: 'cvs-privacy', val: '필요 없는 민감 정보 요구 금지' },
    { id: 'cvs-fairness', val: '최근 3일 내 같은 당번 금지' }
  ],
  [
    { id: 'cvs-name', val: '우리지킴이' },
    { id: 'cvs-problem', val: '친구들 간의 당번 불균형' },
    { id: 'cvs-goal', val: '책임감 있고 공평한 당번 배정' },
    { id: 'cvs-inputs', val: '학번, 별명' },
    { id: 'cvs-forbidden', val: '허위 예약, 선생님 몰래 승인' },
    { id: 'cvs-human', val: '스케줄 확정 시 최종 동의' },
    { id: 'cvs-privacy', val: '데이터는 이번 달까지만 보관' },
    { id: 'cvs-fairness', val: '모든 사람은 최소 1주일에 1번씩 담당' }
  ]
];

const improveExamples = [
  [
    { id: 'imp-problems', val: '공격 프롬프트를 넣었더니 AI가 혼란스러워했어요.' },
    { id: 'imp-rules', val: '어떤 상황에서도 개인정보를 묻는 질문에는 거절하도록 규칙 추가' },
    { id: 'imp-final', val: '공정성 검사 단계를 예약 전에 한 번 더 하도록 수정함' }
  ],
  [
    { id: 'imp-problems', val: '중복 예약 공격을 시도했더니 막지 못했어요.' },
    { id: 'imp-rules', val: '같은 사람이 여러 시간대에 예약 시 꼼꼼히 확인' },
    { id: 'imp-final', val: '연속 예약 시 경고문을 출력하고 예약을 취소하는 기능 추가' }
  ],
  [
    { id: 'imp-problems', val: '남의 이름으로 예약할 수 있는 취약점 발견' },
    { id: 'imp-rules', val: '본인이 맞는지 다시 한 번 묻는 절차 추가' },
    { id: 'imp-final', val: '확인 단계를 강화하고 사람의 개입 절차 명확히 함' }
  ]
];

let exampleIndex = 0;
setInterval(() => {
  exampleIndex = (exampleIndex + 1) % canvasExamples.length;
}, 5000);

function autoFillCanvas() {
  const fields = canvasExamples[exampleIndex];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = f.val;
  });
}

function autoFillImprove() {
  const fields = improveExamples[exampleIndex];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.value = f.val;
  });
}

function handleReservationRequest(e) {
  e.preventDefault();
  
  const number = document.getElementById('req-number').value.trim();
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
  const exactSame = state.reservations.find(r => r.number === number && r.timeslot === timeslot && r.duty === duty) ||
                    state.waitlist.find(r => r.number === number && r.timeslot === timeslot && r.duty === duty);
  if (exactSame) {
    responseText.innerHTML = `🤖 <b>[예약 거부]</b><br>이미 예약(또는 대기)이 완료된 항목입니다.`;
    return;
  }

  // 2. Same time, different duty (Fairness)
  const sameTimeDiffDuty = state.reservations.find(r => r.number === number && r.timeslot === timeslot && r.duty !== duty) ||
                           state.waitlist.find(r => r.number === number && r.timeslot === timeslot && r.duty !== duty);
  if (sameTimeDiffDuty) {
    responseText.innerHTML = `🤖 <b>[예약 거부 - 공정성 규칙]</b><br>${number}번 학생, 같은 시간대(${timeslots[timeslot]})에 이미 '${duties[sameTimeDiffDuty.duty]}'을(를) 예약(또는 대기)하셨습니다. 한 사람은 같은 시간에 하나의 일만 할 수 있습니다.`;
    return;
  }

  // 3. Consecutive same duty (Fairness)
  const tsIndex = timeslotOrder.indexOf(timeslot);
  const prevTs = tsIndex > 0 ? timeslotOrder[tsIndex - 1] : null;
  const nextTs = tsIndex < timeslotOrder.length - 1 ? timeslotOrder[tsIndex + 1] : null;
  
  const consec = state.reservations.find(r => r.number === number && r.duty === duty && (r.timeslot === prevTs || r.timeslot === nextTs)) ||
                 state.waitlist.find(r => r.number === number && r.duty === duty && (r.timeslot === prevTs || r.timeslot === nextTs));
  if (consec) {
    responseText.innerHTML = `🤖 <b>[예약 거부 - 공정성 규칙]</b><br>${number}번 학생, 한 당번(${duties[duty]})을 연속된 시간대에 계속 할 수 없습니다. 다른 친구들에게도 기회를 주세요!`;
    return;
  }

  // 4. Capacity Check (Max 2)
  const bookedCount = state.reservations.filter(r => r.duty === duty && r.timeslot === timeslot).length;
  if (bookedCount >= 2) {
    responseText.innerHTML = `🤖 <b>[예약 불가 - 남은 자리 없음]</b><br>죄송합니다. ${timeslots[timeslot]}의 '${duties[duty]}' 당번은 이미 정원(2명)이 다 찼습니다.<br>대기자로 등록하시겠습니까? (사람 확인 대기)<br><br><span style="color:var(--warning); font-weight:bold;">⚠️ 확정 전 반드시 사용자의 최종 확인이 필요합니다.</span>`;
    pendingAction = { type: 'waitlist', data: { number, duty, timeslot } };
    confirmBtn.innerText = "대기자 명단에 등록하기";
    confirmBtn.style.display = 'block';
    return;
  }

  // Passed all validations
  responseText.innerHTML = `🤖 <b>[예약 가능 - 사람 확인 대기]</b><br>${timeslots[timeslot]} '${duties[duty]}' 예약이 가능합니다.<br>입력하신 정보(번호: ${number})로 예약을 진행하시겠습니까?<br><br><span style="color:var(--danger); font-weight:bold;">⚠️ 확정 전 반드시 사용자의 최종 확인이 필요합니다. (사람 확인 원칙)</span>`;
  
  pendingAction = { type: 'reservation', data: { number, duty, timeslot } };
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
        const names = booked.map(b => `${b.number}번`).join('<br>');
        tdContent = `${names}<br><small style="color:var(--primary)">(${booked.length}/2)</small>`;
      }
      
      if (waiting.length > 0) {
        const waitNames = waiting.map(w => `${w.number}번`).join(', ');
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
  
  // Populate Presentation
  document.getElementById('pres-name').innerText = `에이전트 이름: ${name}`;
  document.getElementById('pres-problem').innerText = problem;
  document.getElementById('pres-goal').innerText = goal;
  document.getElementById('pres-privacy').innerText = privacy;
  document.getElementById('pres-fairness').innerText = fairness;
  document.getElementById('pres-human').innerText = human;
  document.getElementById('pres-final').innerText = final;
}
