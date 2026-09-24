
    let currentLeadData = null;
    let draggedDealId = null;
    let draggedOldStatus = null;
    let cachedCourses = [];
    let cachedStaff = [];

    // ==========================================
    // 1. KÃ‰O - THáº¢ TRÃŠN Báº¢NG KANBAN (DRAG & DROP)
    // ==========================================
    function handleDragStart(e, dealId, oldStatus) {
      draggedDealId = dealId;
      draggedOldStatus = oldStatus;
      e.dataTransfer.setData('text/plain', dealId);
      e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
      e.target.classList.remove('dragging');
      document.querySelectorAll('.col-items').forEach(col => col.classList.remove('drag-over'));
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
      e.currentTarget.classList.remove('drag-over');
    }

    async function handleDrop(e, targetStatus) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');

      if (!draggedDealId || draggedOldStatus === targetStatus) return;

      const dealId = draggedDealId;
      const oldStatus = draggedOldStatus;

      // Xá»­ lÃ½ cÃ¡c quy táº¯c nghiá»‡p vá»¥ theo Äá» bÃ i khi kÃ©o vÃ o tá»«ng cá»™t:
      if (targetStatus === 'PENDING_DEPOSIT') {
        // KÃ©o vÃ o CHá»œ Cá»ŒC -> Má»Ÿ Popup VietQR & XÃ¡c nháº­n cá»c (Chá»©c nÄƒng 1.5)
        openDepositModal(dealId);
      } else if (targetStatus === 'CANCELLED') {
        // KÃ©o vÃ o Há»¦Y -> Má»Ÿ Popup Báº¯t buá»™c chá»n LÃ½ do há»§y (Chá»©c nÄƒng 1.5)
        openCancelModal(dealId);
      } else if (targetStatus === 'COMPLETED') {
        // KÃ©o vÃ o HOÃ€N THÃ€NH -> XÃ¡c nháº­n Ä‘Ã£ thu Ä‘á»§ há»c phÃ­
        if (confirm('XÃ¡c nháº­n há»c viÃªn Ä‘Ã£ thanh toÃ¡n Ä‘á»§ há»c phÃ­ vÃ  hoÃ n thÃ nh tuyá»ƒn sinh?')) {
          await updateDealStatusApi(dealId, 'COMPLETED');
        }
      } else {
        // Chuyá»ƒn sang NEW hoáº·c PENDING_CONSULT (há»— trá»£ cáº£ kÃ©o lÃ¹i vá» PENDING_CONSULT Ä‘á»ƒ chÄƒm sÃ³c tiáº¿p)
        await updateDealStatusApi(dealId, targetStatus);
      }
    }

    // ==========================================
    // 2. Táº¢I Dá»® LIá»†U Báº¢NG KANBAN
    // ==========================================
    async function loadKanbanData() {
      try {
        const res = await fetch('/api/kanban');
        const columns = await res.json();
        const statuses = ['NEW', 'PENDING_CONSULT', 'PENDING_DEPOSIT', 'COMPLETED', 'CANCELLED'];

        statuses.forEach(status => {
          const list = columns[status] || [];
          document.getElementById(`count-${status}`).innerText = list.length;
          const container = document.getElementById(`col-${status}`);
          container.innerHTML = '';

          list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card-item';
            card.id = `card-deal-${item.id}`;
            card.draggable = true;

            // Sá»± kiá»‡n kÃ©o tháº£
            card.ondragstart = (e) => handleDragStart(e, item.id, item.dealStatus);
            card.ondragend = (e) => handleDragEnd(e);
            
            // Báº¥m vÃ o tháº» Ä‘á»ƒ má»Ÿ Drawer xem chi tiáº¿t
            card.onclick = () => openDrawer(item.id);

            // Xá»­ lÃ½ huy hiá»‡u: KhÃ¡ch Má»›i / KhÃ¡ch CÅ© / KhÃ¡ch Gá»­i Láº¡i YÃªu Cáº§u
            let badgeHtml = '';
            if (item.hasRecentResubmit) {
              badgeHtml += `<span class="card-tag tag-resubmitted">ðŸ”” KhÃ¡ch gá»­i láº¡i form</span>`;
            }
            if (item.isReturningLead) {
              badgeHtml += `<span class="card-tag tag-returning-lead">â­ KhÃ¡ch cÅ© (Láº§n ${item.totalLeadDeals})</span>`;
            } else {
              badgeHtml += `<span class="card-tag tag-new-lead">ðŸŒ± KhÃ¡ch má»›i</span>`;
            }

            // Preview nháº­t kÃ½ gáº§n nháº¥t
            let logPreviewHtml = '';
            if (item.latestLog) {
              logPreviewHtml = `
                <div class="card-log-preview">
                  <strong>[${item.latestLog.channel}]</strong> ${item.latestLog.outcome}: ${item.latestLog.content.slice(0, 75)}...
                </div>
              `;
            }

            // Hiá»ƒn thá»‹ lÃ½ do há»§y náº¿u á»Ÿ cá»™t Cancelled
            let lostReasonHtml = '';
            if (item.dealStatus === 'CANCELLED' && item.lostReason) {
              lostReasonHtml = `<div style="font-size: 11px; color: #cf1322; margin-bottom: 6px;"><strong>LÃ½ do há»§y:</strong> ${item.lostReason}</div>`;
            }

            // Hiá»ƒn thá»‹ cá»c náº¿u cÃ³
            let depositBadge = '';
            if (item.dealStatus === 'PENDING_DEPOSIT' && item.paidAmount > 0) {
              depositBadge = `<div style="font-size: 11px; color: #722ed1; font-weight: 700; margin-bottom: 6px;">ÄÃ£ cá»c: ${item.paidAmount.toLocaleString('vi-VN')} Ä‘</div>`;
            }

            // Hiá»ƒn thá»‹ Ä‘iá»ƒm test náº¿u cÃ³
            let testScoreBadge = '';
            if (item.testScore > 0) {
              testScoreBadge = `<div style="font-size: 11px; background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f; padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: 700; margin-bottom: 6px;">ðŸŽ¯ Äiá»ƒm Test: ${item.testScore}/10</div>`;
            }

            card.innerHTML = `
              <div class="card-badge-row">${badgeHtml}</div>
              <div class="card-title">
                <span>${item.leadName}</span>
                <span class="card-deal-id">${item.dealId}</span>
              </div>
              <div class="card-phone">ðŸ“ž ${item.leadPhone}</div>
              <div><span class="card-source">Nguá»“n: ${item.leadSource}</span></div>
              <div class="card-course">ðŸ“š ${item.courseName}</div>
              ${depositBadge}
              ${testScoreBadge}
              ${lostReasonHtml}
              ${logPreviewHtml}
              <div class="card-sale">ðŸ‘¤ Phá»¥ trÃ¡ch: <strong>${item.assignedSaleName}</strong></div>
              <div class="card-actions" onclick="event.stopPropagation()">
                <button class="btn-sm" onclick="openDrawer(${item.id})">ðŸ‘ï¸ Chi tiáº¿t</button>
                <button class="btn-sm" style="color: var(--purple); border-color: #d3adf7;" onclick="openSendTestModal(${item.id}, '${item.leadName}')">ðŸ“ Test</button>
                <select class="btn-sm" onchange="changeStatusBySelect(${item.id}, this.value)">
                  <option value="" disabled selected>Chuyá»ƒn...</option>
                  <option value="NEW">1. Má»›i</option>
                  <option value="PENDING_CONSULT">2. Chá» tÆ° váº¥n</option>
                  <option value="PENDING_DEPOSIT">3. Chá» cá»c (VietQR)</option>
                  <option value="COMPLETED">4. HoÃ n thÃ nh</option>
                  <option value="CANCELLED">5. Há»§y</option>
                </select>
              </div>
            `;
            container.appendChild(card);
          });
        });
      } catch (err) {
        console.error('Lá»—i loadKanbanData:', err);
      }
    }

    // Dropdown chuyá»ƒn tráº¡ng thÃ¡i thay tháº¿ kÃ©o tháº£
    function changeStatusBySelect(dealId, newStatus) {
      if (newStatus === 'PENDING_DEPOSIT') openDepositModal(dealId);
      else if (newStatus === 'CANCELLED') openCancelModal(dealId);
      else if (newStatus === 'COMPLETED') {
        if (confirm('XÃ¡c nháº­n hoÃ n thÃ nh há»“ sÆ¡ tuyá»ƒn sinh?')) updateDealStatusApi(dealId, 'COMPLETED');
      } else {
        updateDealStatusApi(dealId, newStatus);
      }
    }

    async function updateDealStatusApi(dealId, status, payload = {}) {
      try {
        const res = await fetch(`/api/deals/${dealId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ dealStatus: status, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          loadKanbanData();
        } else {
          alert('Lá»—i cáº­p nháº­t: ' + (data.error || 'Thao tÃ¡c khÃ´ng thÃ nh cÃ´ng'));
        }
      } catch (err) {
        alert('Lá»—i káº¿t ná»‘i: ' + err.message);
      }
    }

    // ==========================================
    // 3. TRA Cá»¨U KHÃCH HÃ€NG THEO SÄT
    // ==========================================
    async function lookupCustomer() {
      const phone = document.getElementById('lookupPhone').value.trim();
      if (!phone) return alert('Vui lÃ²ng nháº­p sá»‘ Ä‘iá»‡n thoáº¡i cáº§n tra cá»©u!');

      try {
        const res = await fetch(`/api/leads/lookup?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        const card = document.getElementById('customerResult');
        card.style.display = 'block';

        const activeAlert = document.getElementById('activeDealAlert');

        if (!data.exists) {
          activeAlert.style.display = 'none';
          document.getElementById('customerBadge').className = 'customer-badge badge-new';
          document.getElementById('customerBadge').innerText = 'ðŸŒ± KHÃCH HÃ€NG Má»šI (CHÆ¯A CÃ“ TRONG Há»† THá»NG)';
          document.getElementById('resName').innerText = 'ChÆ°a cÃ³';
          document.getElementById('resPhone').innerText = phone;
          document.getElementById('resEmail').innerText = 'ChÆ°a cÃ³';
          document.getElementById('resSource').innerText = 'Hotline / Nháº¯n tin má»›i';
          document.getElementById('historyBlock').style.display = 'none';
          currentLeadData = null;
          return;
        }

        currentLeadData = data.lead;

        // Kiá»ƒm tra xem khÃ¡ch cÃ³ Deal nÃ o Ä‘ang active trÃªn phá»…u khÃ´ng
        if (data.hasActiveDeal) {
          activeAlert.style.display = 'flex';
          document.getElementById('alertDealCode').innerText = `ID #${data.activeDealId}`;
          document.getElementById('alertDealStatus').innerText = data.activeDealStatus;
          activeAlert.dataset.dealId = data.activeDealId;
        } else {
          activeAlert.style.display = 'none';
        }

        document.getElementById('customerBadge').className = 'customer-badge badge-returning';
        document.getElementById('customerBadge').innerText = `â­ KHÃCH HÃ€NG CÅ¨ (QUAY Láº I - ÄÃƒ CÃ“ ${data.totalDeals} Láº¦N TÆ¯ Váº¤N)`;
        document.getElementById('resName').innerText = data.lead.leadName;
        document.getElementById('resPhone').innerText = data.lead.leadPhone;
        document.getElementById('resEmail').innerText = data.lead.leadEmail || 'KhÃ´ng cÃ³';
        document.getElementById('resSource').innerText = data.lead.leadSource || 'ChÆ°a rÃµ';
        document.getElementById('historyBlock').style.display = 'block';

        // Lá»‹ch sá»­ deals
        const tbody = document.getElementById('resHistoryBody');
        tbody.innerHTML = '';
        (data.dealsHistory || []).forEach(d => {
          const logsText = (d.logs || []).map(l => `â€¢ <strong>[${l.logChannel}]</strong> ${l.logOutcome}: ${l.logNoteContent}`).join('<br>') || 'ChÆ°a cÃ³ ghi chÃº';
          let noteInfo = '-';
          if (d.lostReason) {
            noteInfo = `<span style="color: #cf1322;"><strong>LÃ½ do há»§y:</strong> ${d.lostReason}</span>`;
            if (d.lostNote) noteInfo += `<br><small>(${d.lostNote})</small>`;
          }

          tbody.innerHTML += `
            <tr>
              <td><strong>${d.dealId}</strong></td>
              <td>ðŸ“š ${d.courseName}</td>
              <td><span class="tag-status tag-${d.status}">${d.status}</span></td>
              <td>${(d.paidAmount || 0).toLocaleString('vi-VN')} Ä‘</td>
              <td>${noteInfo}</td>
              <td style="font-size: 11px; line-height: 1.5;">${logsText}</td>
            </tr>
          `;
        });
      } catch (err) {
        alert('Lá»—i tra cá»©u: ' + err.message);
      }
    }

    function locateAndHighlightDeal() {
      const dealId = document.getElementById('activeDealAlert').dataset.dealId;
      if (!dealId) return;
      const el = document.getElementById(`card-deal-${dealId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 4500);
      } else {
        alert('Tháº» nÃ y Ä‘ang á»Ÿ trang khÃ¡c hoáº·c vá»«a thay Ä‘á»•i.');
      }
    }

    // ==========================================
    // 4. SIDE DRAWER CHI TIáº¾T DEAL (CHá»¨C NÄ‚NG 1.4)
    // ==========================================
    async function openDrawer(dealId) {
      try {
        const res = await fetch(`/api/deals/${dealId}/detail`);
        const data = await res.json();
        if (!res.ok) return alert(data.error || 'Lá»—i táº£i chi tiáº¿t deal');

        const d = data.deal;
        const l = data.lead || {};
        const c = data.course || {};
        const s = data.sale;

        document.getElementById('drLeadName').innerText = l.leadName || 'Chi Tiáº¿t KhÃ¡ch HÃ ng';
        document.getElementById('drDealId').innerText = `MÃ£ cÆ¡ há»™i: ${d.dealId} | Tráº¡ng thÃ¡i: ${d.dealStatus}`;
        document.getElementById('drInputDealId').value = dealId;

        document.getElementById('drName').innerText = l.leadName || '-';
        document.getElementById('drPhone').innerText = l.leadPhone || '-';
        document.getElementById('drEmail').innerText = l.leadEmail || 'ChÆ°a cung cáº¥p';
        document.getElementById('drSource').innerText = l.leadSource || 'Website';

        document.getElementById('drCourse').innerText = c.courseName || 'ChÆ°a chá»n';
        document.getElementById('drStatus').innerHTML = `<span class="tag-status tag-${d.dealStatus}">${d.dealStatus}</span>`;
        document.getElementById('drTuition').innerText = (c.courseTuitionFee || 0).toLocaleString('vi-VN') + ' Ä‘';
        document.getElementById('drPaid').innerText = (d.dealPaidAmount || 0).toLocaleString('vi-VN') + ' Ä‘';
        document.getElementById('drSale').innerText = s ? `${s.saleName} (${s.salePhone})` : 'ChÆ°a phÃ¢n bá»•';
        document.getElementById('drDate').innerText = new Date(d.dealCreatedAt).toLocaleString('vi-VN');

        // Äiá»ƒm thi test nÄƒng lá»±c
        const testScore = d.dealTestScore || 0;
        document.getElementById('drTestScore').innerText = testScore > 0 ? `${testScore} / 10 Ä‘iá»ƒm` : 'ChÆ°a lÃ m bÃ i test';
        let evalText = 'ChÆ°a cÃ³ káº¿t quáº£';
        if (testScore >= 8.0) evalText = 'Xuáº¥t sáº¯c (Äáº¡t chuáº©n lá»›p ChuyÃªn sÃ¢u / NÃ¢ng cao)';
        else if (testScore >= 6.0) evalText = 'KhÃ¡ (Äáº¡t chuáº©n lá»›p TiÃªu chuáº©n)';
        else if (testScore > 0) evalText = 'CÆ¡ báº£n (Cáº§n bá»• trá»£ thÃªm kiáº¿n thá»©c)';
        document.getElementById('drTestEval').innerText = evalText;

        // CÃ¡c deal khÃ¡c cá»§a khÃ¡ch nÃ y
        const otherSec = document.getElementById('drOtherDealsSection');
        const otherList = document.getElementById('drOtherDealsList');
        otherList.innerHTML = '';
        if (data.otherDeals && data.otherDeals.length > 0) {
          otherSec.style.display = 'block';
          data.otherDeals.forEach(od => {
            otherList.innerHTML += `<li>Deal <strong>${od.dealId}</strong>: Tráº¡ng thÃ¡i [${od.dealStatus}] ngÃ y ${new Date(od.dealCreatedAt).toLocaleDateString('vi-VN')}</li>`;
          });
        } else {
          otherSec.style.display = 'none';
        }

        // Timeline logs
        const timeline = document.getElementById('drTimeline');
        timeline.innerHTML = '';
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => {
            const timeStr = new Date(log.logCreatedAt).toLocaleString('vi-VN');
            timeline.innerHTML += `
              <div class="timeline-item">
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-content">
                  <strong>[${log.logChannel}]</strong> ${log.logOutcome}<br>
                  ${log.logNoteContent}
                </div>
              </div>
            `;
          });
        } else {
          timeline.innerHTML = '<div style="font-size: 13px; color: #8c8c8c;">ChÆ°a cÃ³ ghi chÃ©p nÃ o. HÃ£y thÃªm á»Ÿ Ã´ bÃªn dÆ°á»›i!</div>';
        }

        document.getElementById('drawerOverlay').classList.add('active');
      } catch (err) {
        alert('Lá»—i xem chi tiáº¿t: ' + err.message);
      }
    }

    function closeDrawer(e) {
      if (!e || e.target.id === 'drawerOverlay' || e.target.className === 'drawer-close') {
        document.getElementById('drawerOverlay').classList.remove('active');
      }
    }

    async function submitDrawerLog() {
      const dealId = document.getElementById('drInputDealId').value;
      const channel = document.getElementById('drInputChannel').value;
      const outcome = document.getElementById('drInputOutcome').value;
      const note = document.getElementById('drInputNote').value.trim();
      const appt = document.getElementById('drInputAppointment').value.trim();

      if (!note) return alert('Vui lÃ²ng nháº­p ná»™i dung trao Ä‘á»•i!');

      try {
        await fetch(`/api/deals/${dealId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            logChannel: channel,
            logOutcome: outcome,
            logNoteContent: note,
            nextAppointment: appt
          })
        });

        document.getElementById('drInputNote').value = '';
        document.getElementById('drInputAppointment').value = '';
        openDrawer(dealId); // Refresh láº¡i Drawer
        loadKanbanData();   // Refresh Kanban
      } catch (err) {
        alert('Lá»—i lÆ°u log: ' + err.message);
      }
    }

    // ==========================================
    // 5. MODAL VIETQR & Äáº¶T Cá»ŒC (CHá»¨C NÄ‚NG 1.5)
    // ==========================================
    async function openDepositModal(dealId) {
      document.getElementById('depositDealId').value = dealId;

      try {
        const res = await fetch(`/api/deals/${dealId}/detail`);
        const data = await res.json();
        const c = data.course || {};
        const l = data.lead || {};

        document.getElementById('depositCourseName').value = c.courseName || 'KhÃ³a há»c';
        document.getElementById('depositTuition').value = (c.courseTuitionFee || 0).toLocaleString('vi-VN') + ' Ä‘';
        
        const depositAmt = c.courseDepositFee || 2000000;
        document.getElementById('depositAmount').value = depositAmt;

        document.getElementById('depositModal').dataset.leadPhone = l.leadPhone || '0988776655';
        document.getElementById('depositModal').dataset.dealCode = data.deal.dealId || 'DEAL';

        updateVietQRImage();
        document.getElementById('depositModal').classList.add('active');
      } catch (err) {
        alert('Lá»—i táº£i thÃ´ng tin cá»c: ' + err.message);
      }
    }

    function updateVietQRImage() {
      const modal = document.getElementById('depositModal');
      const phone = modal.dataset.leadPhone || '0988776655';
      const dealCode = modal.dataset.dealCode || 'DEAL';
      const amount = Number(document.getElementById('depositAmount').value) || 2000000;
      
      const syntax = `MEKO ${dealCode} ${phone}`;
      document.getElementById('vietqrSyntax').innerText = syntax;

      const qrUrl = `https://img.vietqr.io/image/970422-0988776655-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(syntax)}&accountName=HOC%20VIEN%20MEKO`;
      document.getElementById('vietqrImg').src = qrUrl;
    }

    async function confirmDepositTransition() {
      const dealId = document.getElementById('depositDealId').value;
      const amount = Number(document.getElementById('depositAmount').value) || 0;

      await updateDealStatusApi(dealId, 'PENDING_DEPOSIT', { paidAmount: amount });
      closeModal('depositModal');
    }

    // ==========================================
    // 6. MODAL Há»¦Y Há»’ SÆ  (CHá»¨C NÄ‚NG 1.5)
    // ==========================================
    function openCancelModal(dealId) {
      document.getElementById('cancelDealId').value = dealId;
      document.getElementById('cancelNote').value = '';
      document.getElementById('cancelModal').classList.add('active');
    }

    async function confirmCancelTransition() {
      const dealId = document.getElementById('cancelDealId').value;
      const reason = document.getElementById('cancelReason').value;
      const note = document.getElementById('cancelNote').value.trim();

      await updateDealStatusApi(dealId, 'CANCELLED', { lostReason: reason, lostNote: note });
      closeModal('cancelModal');
    }

    // ==========================================
    // 7. MODAL Táº O DEAL KHÃCH CÅ¨
    // ==========================================
    function openCreateDealModal() {
      if (!currentLeadData) return alert('Vui lÃ²ng tra cá»©u sá»‘ Ä‘iá»‡n thoáº¡i trÆ°á»›c!');
      document.getElementById('createDealModal').classList.add('active');
    }

    async function submitNewDealForLead() {
      const courseId = document.getElementById('newDealCourse').value;
      const saleId = document.getElementById('newDealStaff').value;
      const source = document.getElementById('newDealSource').value;
      const note = document.getElementById('newDealNote').value.trim();

      try {
        const res = await fetch('/api/deals/create-deal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ leadId: currentLeadData.id, courseId, saleId, source, note })
        });
        const data = await res.json();
        if (data.success) {
          alert('Táº¡o Deal má»›i thÃ nh cÃ´ng! Há»“ sÆ¡ Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o cá»™t Má»šI trÃªn Kanban.');
          closeModal('createDealModal');
          loadKanbanData();
          lookupCustomer();
        }
      } catch (err) {
        alert('Lá»—i táº¡o deal: ' + err.message);
      }
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    // ==========================================
    // 8. Gá»¬I BÃ€I TEST & COPY LINK (CHá»¨C NÄ‚NG TEST NÄ‚NG Lá»°C)
    // ==========================================
    function openSendTestModal(dealId, name) {
      const link = `${window.location.origin}/test?dealId=${dealId}`;
      document.getElementById('sendTestStudentName').innerText = name || 'Há»c viÃªn';
      document.getElementById('sendTestLink').value = link;
      document.getElementById('sendTestMessageTemplate').value = 
`ChÃ o báº¡n ${name}! Meko Academy gá»­i báº¡n bÃ i kiá»ƒm tra nÄƒng lá»±c Ä‘áº§u vÃ o Ä‘á»ƒ chuyÃªn viÃªn tÆ° váº¥n xáº¿p lá»›p vÃ  xÃ¢y dá»±ng lá»™ trÃ¬nh há»c táº­p phÃ¹ há»£p nháº¥t.
ðŸ‘‰ Vui lÃ²ng truy cáº­p Ä‘Æ°á»ng link sau Ä‘á»ƒ lÃ m bÃ i tráº¯c nghiá»‡m (15 phÃºt):
${link}
Káº¿t quáº£ sáº½ Ä‘Æ°á»£c há»‡ thá»‘ng cháº¥m Ä‘iá»ƒm vÃ  thÃ´ng bÃ¡o ngay sau khi báº¡n ná»™p bÃ i. ChÃºc báº¡n hoÃ n thÃ nh bÃ i thi tháº­t tá»‘t!`;
      document.getElementById('sendTestModal').dataset.testUrl = link;
      document.getElementById('sendTestModal').classList.add('active');
    }

    function copyTestLink() {
      const input = document.getElementById('sendTestLink');
      input.select();
      navigator.clipboard.writeText(input.value);
      alert('ÄÃ£ sao chÃ©p Ä‘Æ°á»ng link bÃ i test vÃ o bá»™ nhá»› táº¡m! Báº¡n cÃ³ thá»ƒ dÃ¡n gá»­i cho há»c viÃªn qua Zalo/Facebook.');
    }

    function openTestDirectly() {
      const url = document.getElementById('sendTestModal').dataset.testUrl;
      if (url) window.open(url, '_blank');
    }

    // Khá»Ÿi táº¡o Select options
    async function initOptions() {
      try {
        const [cRes, sRes] = await Promise.all([fetch('/api/courses'), fetch('/api/staff')]);
        cachedCourses = await cRes.json();
        cachedStaff = await sRes.json();

        const courseSel = document.getElementById('newDealCourse');
        courseSel.innerHTML = '';
        cachedCourses.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.courseName} (${(c.courseTuitionFee || 0).toLocaleString('vi-VN')} Ä‘)</option>`);

        const staffSel = document.getElementById('newDealStaff');
        staffSel.innerHTML = '';
        cachedStaff.forEach(s => staffSel.innerHTML += `<option value="${s.id}">${s.saleName} (${s.salePhone})</option>`);
      } catch (e) {
        console.error(e);
      }
    }

    initOptions();
    loadKanbanData();
  
