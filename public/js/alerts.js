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

let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let allAlerts = [];

async function fetchAlerts(page = 1) {
  try {
    const res = await fetch(`/api/alerts?page=${page}&size=${pageSize}`);
    const data = await res.json();

    // Server trả về { items, total }
    allAlerts = data.Items;
    totalPages = Math.ceil(data.Total / pageSize);
    currentPage = page;

    renderAlerts();
  } catch (err) {
    console.error("Lỗi khi lấy cảnh báo:", err);
  }
}

function renderAlerts() {
  const alertsDiv = document.getElementById('alertsList');
  alertsDiv.innerHTML = "";

  if (allAlerts.length > 0) {
    allAlerts.forEach(a => {
      const p = document.createElement('p');
      p.className = `alert ${a.Severity.toLowerCase()}`;
      p.innerText = `${new Date(a.Timestamp).toLocaleString()} - ${a.Message}`;
      alertsDiv.appendChild(p);
    });
  } else {
    alertsDiv.innerText = "✅ Không có cảnh báo nào gần đây";
    alertsDiv.className = "stable";
  }

  renderPagination();
}

function renderPagination() {
  const paginationDiv = document.getElementById('pagination');
  paginationDiv.innerHTML = "";

  const maxPageButtons = 5;

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.innerText = "◀";
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      fetchAlerts(currentPage - 1);
    }
  };
  paginationDiv.appendChild(prevBtn);

  // Tính dải số trang
  let startPage = currentPage - Math.floor(maxPageButtons / 2);
  let endPage = currentPage + Math.floor(maxPageButtons / 2);

  if (startPage < 1) {
    startPage = 1;
    endPage = Math.min(totalPages, maxPageButtons);
  }
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, totalPages - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    if (i === currentPage) {
      btn.classList.add("active");
    }
    btn.onclick = () => fetchAlerts(i);
    paginationDiv.appendChild(btn);
  }

  // Nếu tổng số trang lớn hơn maxPageButtons thì thêm ô nhập
  if (totalPages > maxPageButtons) {
    const pageInput = document.createElement('input');
    pageInput.type = "number";
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.placeholder = `1-${totalPages}`;
    pageInput.style.width = "60px";
    pageInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= totalPages) {
          fetchAlerts(page);
        } else {
          alert("❌ Số trang không tồn tại!");
        }
      }
    };
    paginationDiv.appendChild(pageInput);
  }

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.innerText = "▶";
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      fetchAlerts(currentPage + 1);
    }
  };
  paginationDiv.appendChild(nextBtn);
}

// Lần đầu gọi trang 1
fetchAlerts(1);
