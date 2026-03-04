window.onload = () => {
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    alert("❌ Bạn không có quyền truy cập trang quản trị");
    window.location.href = "index.html";
  }
};

window.onload = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("role");

  if (isLoggedIn === "true") {
    if (role === "admin") {
      // Nếu là admin thì vào trang quản trị
      if (!window.location.pathname.endsWith("admin.html")) {
        window.location.href = "/admin.html";
      }
    } else {
      // Nếu là user thường thì vào trang index
      if (!window.location.pathname.endsWith("index.html")) {
        window.location.href = "/index.html";
      }
    }
  } else {
    // Nếu chưa đăng nhập thì quay về login
    window.location.href = "/login.html";
  }
};

// Lấy tên từ localStorage (ví dụ khi login đã lưu)
document.getElementById("username").textContent = 
  "👤 Tài khoản: " + localStorage.getItem("username");

// Xử lý logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  window.location.href = "login.html";
});

// Lưu cấu hình ngưỡng cảnh báo
document.getElementById('thresholdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = {
    cpu: document.getElementById('cpuThreshold').value,
    ram: document.getElementById('ramThreshold').value,
    disk: document.getElementById('diskThreshold').value
  };

  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });

  if (res.ok) {
    alert("✅ Cấu hình ngưỡng cảnh báo đã được lưu");
  } else {
    alert("❌ Lỗi khi lưu cấu hình");
  }
});

// Thêm người dùng
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = {
    name: document.getElementById('username').value,
    email: document.getElementById('userEmail').value
  };

  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  if (res.ok) {
    alert("✅ Người dùng đã được thêm");
    loadUsers();
  } else {
    alert("❌ Lỗi khi thêm người dùng");
  }
});

// Hiển thị danh sách người dùng
async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();

    const userDiv = document.getElementById('userList');
    userDiv.innerHTML = "";

    if (users.length > 0) {
      const table = document.createElement('table');
      table.innerHTML = `
        <tr>
          <th>Tên</th>
          <th>Email</th>
          <th>Ngày tạo</th>
          <th>Hành động</th>
        </tr>
      `;

      users.forEach(u => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', u.Id);

        // Luôn có nút chỉnh sửa
        let actionHtml = `<span class="action edit" onclick="editUser(${u.Id})">Chỉnh sửa</span>`;

        // Kiểm tra IsAdmin (true/false hoặc 1/0)
        if (u.IsAdmin === true || u.IsAdmin === 1) {
          // Admin → nút Xóa bị disable
          actionHtml += ` | <button disabled style="opacity:0.5; cursor:not-allowed;">Xóa</button>`;
        } else {
          // User thường → có nút Xóa
          actionHtml += ` | <span class="action delete" onclick="deleteUser(${u.Id})">Xóa</span>`;
        }

        row.innerHTML = `
          <td>${u.Name}</td>
          <td>${u.Email}</td>
          <td>${new Date(u.CreatedAt).toLocaleString()}</td>
          <td>${actionHtml}</td>
        `;
        table.appendChild(row);
      });

      userDiv.appendChild(table);
    } else {
      userDiv.innerText = "❌ Chưa có người dùng nào";
    }
  } catch (err) {
    console.error("❌ Lỗi khi load users:", err);
    document.getElementById('userList').innerText = "❌ Lỗi khi tải danh sách người dùng";
  }
}

// Toggle form thêm user
document.getElementById('addUserBtn').addEventListener('click', () => {
  const form = document.getElementById('userForm');
  form.style.display = form.style.display === "none" ? "block" : "none";
});

// Render bảng user
async function loadUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();

  const userDiv = document.getElementById('userList');
  userDiv.innerHTML = "";

  if (users.length > 0) {
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>Tên</th>
        <th>Email</th>
        <th>Ngày tạo</th>
        <th>Hành động</th>
      </tr>
    `;

    users.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${u.Name}</td>
        <td>${u.Email}</td>
        <td>${new Date(u.CreatedAt).toLocaleString()}</td>
        <td>
          <span class="action edit" onclick="editUser(${u.Id})">Chỉnh sửa</span> |
          <span class="action delete" onclick="deleteUser(${u.Id})">Xóa</span>
        </td>
      `;
      table.appendChild(row);
    });

    userDiv.appendChild(table);
  } else {
    userDiv.innerText = "❌ Chưa có người dùng nào";
  }
}

async function deleteUser(id) {
  if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert("✅ Người dùng đã bị xóa");
      loadUsers();
    } else {
      alert("❌ Lỗi khi xóa người dùng");
    }
  }
}

function editUser(id) {
  alert("👉 Chức năng chỉnh sửa user " + id + " sẽ mở form cập nhật");
  // Có thể mở modal hoặc inline form để sửa Name/Email
}

function editUser(id) {
  // Lấy dữ liệu user hiện tại
  fetch('/api/users')
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u.Id === id);
      if (!user) return;

      const row = document.querySelector(`#userList tr[data-id='${id}']`);
      if (!row) return;

      // Thay nội dung dòng bằng form chỉnh sửa
      row.innerHTML = `
        <td colspan="4">
          <form id="editForm-${id}" class="form-inline">
            <label>Tên <input type="text" id="editName-${id}" value="${user.Name}"></label>
            <label>Email <input type="email" id="editEmail-${id}" value="${user.Email}"></label>
            <button type="submit">Cập nhật</button>
            <button type="button" onclick="cancelEdit()">Hủy</button>
          </form>
        </td>
      `;

      // Xử lý submit form
      document.getElementById(`editForm-${id}`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById(`editName-${id}`).value;
        const email = document.getElementById(`editEmail-${id}`).value;

        const res = await fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email })
        });

        if (res.ok) {
          alert("✅ Người dùng đã được cập nhật");
          loadUsers();
        } else {
          alert("❌ Lỗi khi cập nhật người dùng");
        }
      });
    });
}

function cancelEdit() {
  loadUsers(); // reload lại danh sách để hủy form chỉnh sửa
}

let editingUserId = null;

function editUser(id) {
  // Lấy dữ liệu user hiện tại
  fetch('/api/users')
    .then(res => res.json())
    .then(users => {
      const user = users.find(u => u.Id === id);
      if (!user) return;

      editingUserId = id;
      document.getElementById('editName').value = user.Name;
      document.getElementById('editEmail').value = user.Email;

      // Mở modal
      document.getElementById('editModal').style.display = "block";
    });
}

function closeEditModal() {
  document.getElementById('editModal').style.display = "none";
  editingUserId = null;
}

// Submit form cập nhật
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('editName').value;
  const email = document.getElementById('editEmail').value;

  const res = await fetch(`/api/users/${editingUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });

  if (res.ok) {
    alert("✅ Người dùng đã được cập nhật");
    closeEditModal();
    loadUsers();
  } else {
    alert("❌ Lỗi khi cập nhật người dùng");
  }
});

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    document.getElementById('cpuThreshold').value = config.CpuThreshold;
    document.getElementById('ramThreshold').value = config.RamThreshold;
    document.getElementById('diskThreshold').value = config.DiskThreshold;
  } catch (err) {
    console.error("❌ Lỗi khi load config:", err);
  }
}

// Gọi khi trang load
window.onload = loadConfig;

loadUsers();
