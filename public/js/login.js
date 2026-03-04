document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Dữ liệu trả về từ API:", data);

      // Lưu trạng thái đăng nhập
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", data.IsAdmin ? "admin" : "user");
      localStorage.setItem("isAdmin", data.IsAdmin ? "true" : "false");

      // Nếu API có trả về username thì dùng, nếu không thì lấy từ input
      localStorage.setItem("username", data.username || name);

      alert("✅ Đăng nhập thành công");

      // Điều hướng theo quyền
      if (data.IsAdmin) {
        window.location.href = "/admin.html";
      } else {
        window.location.href = "/index.html";
      }
    } else {
      alert("❌ Không tìm thấy user");
    }
  } catch (err) {
    console.error("Lỗi login:", err);
    alert("❌ Có lỗi xảy ra khi đăng nhập");
  }
});
