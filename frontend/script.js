// ── TOAST NOTIFICATION ────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── REGISTER USER (Port 3301) ──────────────────────
async function registerUser() {
  const btn = document.getElementById('btnRegister');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Mendaftar...'; }

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    address: document.getElementById('address').value
  };

  try {
    const response = await fetch('http://localhost:3301/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    showToast(result.message, response.ok ? 'success' : 'error');
    if (response.ok) {
      document.getElementById('name').value = '';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('address').value = '';
    }
  } catch (err) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>👤</span> Daftar Sekarang'; }
  }
}

// ── CREATE ORDER (Port 3002) ───────────────────────
async function createOrder() {
  const btn = document.getElementById('btnOrder');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Memproses...'; }

  const data = {
    user_id: document.getElementById('userId').value,
    product_name: document.getElementById('productName').value,
    total_price: document.getElementById('totalPrice').value
  };

  try {
    const response = await fetch('http://localhost:3002/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    showToast(result.message, response.ok ? 'success' : 'error');
    if (response.ok) {
      document.getElementById('userId').value = '';
      document.getElementById('productName').value = '';
      document.getElementById('totalPrice').value = '';
    }
  } catch (err) {
    showToast('Gagal terhubung ke server', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>🛒</span> Pesan Sekarang'; }
  }
}

// ── LOAD ORDERS (Port 3002) ────────────────────────
async function loadOrders() {
  const tableBody = document.getElementById('orderTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = `<tr class="loading-row"><td colspan="5"><span class="spinner"></span> Memuat data...</td></tr>`;

  try {
    const response = await fetch('http://localhost:3002/api/orders');
    const orders = await response.json();

    // Update stat count
    const el = document.getElementById('totalOrders');
    if (el) el.textContent = orders.length;

    if (orders.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <p>Belum ada pesanan masuk</p>
          </div>
        </td></tr>`;
      return;
    }

    const statusMap = {
      pending:   { cls: 'pending', icon: '⏳' },
      success:   { cls: 'success', icon: '✅' },
      completed: { cls: 'success', icon: '✅' },
      cancelled: { cls: 'danger',  icon: '❌' },
    };

    tableBody.innerHTML = orders.map((order, i) => {
      const s = statusMap[order.status?.toLowerCase()] || { cls: 'info', icon: '📋' };
      return `
        <tr style="animation: fadeRow .3s ease ${i * 0.04}s both">
          <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">#${String(order.id).padStart(4,'0')}</span></td>
          <td><span style="font-family:'DM Mono',monospace;font-size:12px">USR-${order.user_id}</span></td>
          <td style="font-weight:500">${order.product_name}</td>
          <td><span class="money">Rp ${Number(order.total_price).toLocaleString('id-ID')}</span></td>
          <td><span class="badge ${s.cls}">${s.icon} ${order.status}</span></td>
        </tr>`;
    }).join('');
  } catch (error) {
    tableBody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p>Gagal memuat data. Periksa koneksi server.</p>
        </div>
      </td></tr>`;
    console.error('loadOrders error:', error);
  }
}