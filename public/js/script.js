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

// Lấy tên từ localStorage (ví dụ khi login đã lưu)
document.getElementById("username").textContent =
  "👤 Tài khoản: " + localStorage.getItem("username");

// Xử lý logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("username");
  window.location.href = "login.html";
});

// Khởi tạo biểu đồ
const cpuChart = new Chart(document.getElementById('cpuChart'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'CPU (%)', data: [], borderColor: 'blue', fill: false }] }
});

const memChart = new Chart(document.getElementById('memChart'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'RAM (%)', data: [], borderColor: 'green', fill: false }] }
});

const diskChart = new Chart(document.getElementById('diskChart'), {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Disk (%)', data: [], borderColor: 'orange', fill: false }] }
});

const netChart = new Chart(document.getElementById('netChart'), {
  type: 'line',
  data: { labels: [], datasets: [
    { label: 'Rx (MB/s)', data: [], borderColor: 'purple', fill: false },
    { label: 'Tx (MB/s)', data: [], borderColor: 'red', fill: false }
  ]}
});

let modalChart; // Khai báo biến toàn cục để quản lý chart trong modal

// Hàm mở modal
function openModal(chart, title) {
  document.getElementById('indexModal').style.display = 'block';
  document.getElementById('modalTitle').innerText = title;

  // Nếu đã có chart trước đó thì hủy để tránh vẽ chồng
  if (modalChart) modalChart.destroy();

  const ctx = document.getElementById('modalChart').getContext('2d');
  modalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chart.data.labels,
      datasets: chart.data.datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.borderColor,
        fill: false
      }))
    }
  });
}

// Hàm đóng modal
function closeModal() {
  document.getElementById('indexModal').style.display = 'none';
}

// Gắn sự kiện click cho từng biểu đồ
document.getElementById('cpuChart').onclick = () => openModal(cpuChart, "Chi tiết CPU");
document.getElementById('memChart').onclick = () => openModal(memChart, "Chi tiết RAM");
document.getElementById('diskChart').onclick = () => openModal(diskChart, "Chi tiết Disk");
document.getElementById('netChart').onclick = () => openModal(netChart, "Chi tiết Network");

// Hàm cập nhật dữ liệu từ API
async function fetchStatus() {
  const res = await fetch('/api/status');
  const data = await res.json();
  const now = new Date().toLocaleTimeString();

  // CPU
  document.getElementById('cpu').innerText = data.cpu + "%";
  cpuChart.data.labels.push(now);
  cpuChart.data.datasets[0].data.push(data.cpu);
  if (cpuChart.data.labels.length > 20) {
    cpuChart.data.labels.shift();
    cpuChart.data.datasets[0].data.shift();
  }
  cpuChart.update();

  // RAM
  document.getElementById('memory').innerText = data.memory + "%";
  memChart.data.labels.push(now);
  memChart.data.datasets[0].data.push(data.memory);
  if (memChart.data.labels.length > 20) {
    memChart.data.labels.shift();
    memChart.data.datasets[0].data.shift();
  }
  memChart.update();

  // Disk
  document.getElementById('disk').innerText = data.disk + "%";
  diskChart.data.labels.push(now);
  diskChart.data.datasets[0].data.push(data.disk);
  if (diskChart.data.labels.length > 20) {
    diskChart.data.labels.shift();
    diskChart.data.datasets[0].data.shift();
  }
  diskChart.update();

  // Network
  document.getElementById('network').innerText = `Rx: ${data.network.rx} MB/s | Tx: ${data.network.tx} MB/s`;
  netChart.data.labels.push(now);
  netChart.data.datasets[0].data.push(data.network.rx);
  netChart.data.datasets[1].data.push(data.network.tx);
  if (netChart.data.labels.length > 20) {
    netChart.data.labels.shift();
    netChart.data.datasets[0].data.shift();
    netChart.data.datasets[1].data.shift();
  }
  netChart.update();

  // Alerts
  const alertsDiv = document.getElementById('alerts');
  alertsDiv.innerHTML = "";
  if (data.alerts.length > 0) {
    data.alerts.forEach(alert => {
      const p = document.createElement('p');
      p.className = "alert";
      p.innerText = alert;
      alertsDiv.appendChild(p);
    });
  } else {
    alertsDiv.innerText = "✅ Hệ thống ổn định";
    alertsDiv.className = "stable";
  }
}

// Cập nhật mỗi 2 giây
setInterval(fetchStatus, 2000);
fetchStatus();
