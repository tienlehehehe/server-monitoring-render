window.onload = () => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // Ẩn link Quản trị ở header
  const adminLinkHeader = document.querySelector("header nav a[href='admin.html']");
  if (!isAdmin && adminLinkHeader) {
    adminLinkHeader.parentElement.style.display = "none";
  }

  // Ẩn link Quản trị ở footer
  const adminLinkFooter = document.getElementById("adminLinkFooter");
  if (!isAdmin && adminLinkFooter) {
    adminLinkFooter.style.display = "none";
  }
};

// Lấy tên từ localStorage
document.getElementById("username").textContent =
  "👤 Tài khoản: " + localStorage.getItem("username");

// Xử lý logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("username");
  window.location.href = "login.html";
});

// ===== Khai báo biến toàn cục =====
let cpuLabels = [], cpuValues = [], ramValues = [], diskValues = [], netRxValues = [], netTxValues = [];
let cpuChart, ramChart, diskChart, netChart;
let modalChart;
let currentChartType = null;

// ===== Hàm lấy trực tiếp giờ:phút:giây từ chuỗi SQL =====
function extractTime(ts) {
  if (!ts) return "";
  const dateObj = new Date(ts); // tự động convert UTC → local
  return dateObj.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false   // ép định dạng 24h
  });
}

// ===== Hàm vẽ lại 4 biểu đồ nhỏ =====
function renderAllCharts() {
  if (cpuChart) cpuChart.destroy();
  if (ramChart) ramChart.destroy();
  if (diskChart) diskChart.destroy();
  if (netChart) netChart.destroy();

  cpuChart = new Chart(document.getElementById('cpuHistoryChart'), {
    type: 'line',
    data: { labels: cpuLabels, datasets: [{ label: 'CPU (%)', data: cpuValues, borderColor: 'blue', fill: false }] }
  });

  ramChart = new Chart(document.getElementById('ramHistoryChart'), {
    type: 'line',
    data: { labels: cpuLabels, datasets: [{ label: 'RAM (%)', data: ramValues, borderColor: 'green', fill: false }] }
  });

  diskChart = new Chart(document.getElementById('diskHistoryChart'), {
    type: 'line',
    data: { labels: cpuLabels, datasets: [{ label: 'Disk (%)', data: diskValues, borderColor: 'orange', fill: false }] }
  });

  netChart = new Chart(document.getElementById('netHistoryChart'), {
    type: 'line',
    data: {
      labels: cpuLabels,
      datasets: [
        { label: 'Rx (MB/s)', data: netRxValues, borderColor: 'purple', fill: false },
        { label: 'Tx (MB/s)', data: netTxValues, borderColor: 'red', fill: false }
      ]
    }
  });
}

// ===== Hàm vẽ lại modal chart =====
function renderModalChart() {
  if (!currentChartType || cpuLabels.length === 0) return;

  let datasets = [];
  switch (currentChartType) {
    case "CPU": datasets = [{ label: 'CPU (%)', data: cpuValues, borderColor: 'blue', fill: false }]; break;
    case "RAM": datasets = [{ label: 'RAM (%)', data: ramValues, borderColor: 'green', fill: false }]; break;
    case "Disk": datasets = [{ label: 'Disk (%)', data: diskValues, borderColor: 'orange', fill: false }]; break;
    case "Network":
      datasets = [
        { label: 'Rx (MB/s)', data: netRxValues, borderColor: 'purple', fill: false },
        { label: 'Tx (MB/s)', data: netTxValues, borderColor: 'red', fill: false }
      ];
      break;
  }

  if (modalChart) modalChart.destroy();
  const ctx = document.getElementById('modalChart').getContext('2d');
  modalChart = new Chart(ctx, {
    type: 'line',
    data: { labels: cpuLabels, datasets },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// ===== Hàm mở/đóng modal =====
function openModal(chartType) {
  document.getElementById('detailModal').style.display = 'block';
  document.getElementById('modalTitle').innerText = "Chi tiết " + chartType;
  currentChartType = chartType;
  renderModalChart();
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
  currentChartType = null;
}

window.onclick = function(event) {
  const modal = document.getElementById('detailModal');
  if (event.target === modal) closeModal();
};

// ===== Load danh sách ngày từ API =====
async function loadDates() {
  const res = await fetch('/api/dates');
  const dates = await res.json();

  const datalist = document.getElementById('dateSuggestions');
  datalist.innerHTML = "";

  dates.forEach(d => {
    const opt = document.createElement('option');
    opt.value = new Date(d.Date).toLocaleDateString('vi-VN'); // hiển thị dd/mm/yyyy
    datalist.appendChild(opt);
  });
}

// ===== Fetch dữ liệu lịch sử mặc định =====
async function fetchHistory() {
  const res = await fetch('/api/history');
  const history = await res.json();

  cpuLabels = history.map(h => extractTime(h.Timestamp));
  cpuValues = history.map(h => h.CpuLoad);
  ramValues = history.map(h => h.MemoryUsage);
  diskValues = history.map(h => h.DiskUsage);
  netRxValues = history.map(h => h.NetRx);
  netTxValues = history.map(h => h.NetTx);

  renderAllCharts();
}

// ===== Áp dụng bộ lọc =====
function applyFilters() {
  const specificDate = document.getElementById('dateInput').value;
  const startTime = document.getElementById('startHour').value;
  const endTime = document.getElementById('endHour').value;

  if (!specificDate) {
    alert("❌ Vui lòng nhập hoặc chọn ngày");
    return;
  }

  const [day, month, year] = specificDate.split('/');
  const formattedDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;

  let query = `/api/history?date=${formattedDate}`;
  if (startTime && endTime) {
    query += `&startTime=${startTime}&endTime=${endTime}`;
  }

  fetch(query)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        alert("⚠️ Không có dữ liệu trong khoảng thời gian đã chọn");
        return;
      }

      cpuLabels = data.map(d => extractTime(d.Timestamp));
      cpuValues = data.map(d => d.CpuLoad);
      ramValues = data.map(d => d.MemoryUsage);
      diskValues = data.map(d => d.DiskUsage);
      netRxValues = data.map(d => d.NetRx);
      netTxValues = data.map(d => d.NetTx);

      renderAllCharts();
      renderModalChart();
    })
    .catch(err => console.error("❌ Lỗi khi lọc dữ liệu:", err));
}

// ===== Gắn sự kiện click cho biểu đồ nhỏ =====
document.getElementById('cpuHistoryChart').onclick = () => openModal("CPU");
document.getElementById('ramHistoryChart').onclick = () => openModal("RAM");
document.getElementById('diskHistoryChart').onclick = () => openModal("Disk");
document.getElementById('netHistoryChart').onclick = () => openModal("Network");

// ===== Khởi chạy =====
fetchHistory();
loadDates();
