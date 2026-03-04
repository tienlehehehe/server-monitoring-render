const express = require('express');
const os = require('os');
const path = require('path');
const si = require('systeminformation');
const Database = require('./Database');
const db = new Database("postgres://postgres:toiBODOI456@db.jofmvzebcrrbqbwbixvn.supabase.co:5432/postgres");

const app = express();

// Hàm tính % RAM đã dùng
function getMemoryUsage() {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  return (usedMem / totalMem) * 100;
}

// API lấy trạng thái hiện tại
app.get('/api/status', async (req, res) => {
  try {
    const cpuLoad = await si.currentLoad();
    const memUsage = getMemoryUsage();
    const diskData = await si.fsSize();
    const netData = await si.networkStats();

    const diskUsage = diskData.length > 0 ? (diskData[0].used / diskData[0].size) * 100 : 0;
    const netRx = netData[0].rx_bytes / (1024 * 1024);
    const netTx = netData[0].tx_bytes / (1024 * 1024);

    // Lưu vào SQL Server
    await db.insertMetrics(cpuLoad.currentLoad, memUsage, diskUsage, netRx, netTx);

 // Lấy config mới nhất từ DB
const config = await db.getLatestConfig();

const alerts = [];
if (cpuLoad.currentLoad > config.CpuThreshold) {
  const msg = `⚠️ CPU load cao: ${cpuLoad.currentLoad.toFixed(2)}%`;
  alerts.push(msg);
  await db.insertAlert(msg, "High");
}
if (memUsage > config.RamThreshold) {
  const msg = `⚠️ RAM vượt ngưỡng: ${memUsage.toFixed(2)}%`;
  alerts.push(msg);
  await db.insertAlert(msg, "High");
}
if (diskUsage > config.DiskThreshold) {
  const msg = `⚠️ Ổ đĩa gần đầy: ${diskUsage.toFixed(2)}%`;
  alerts.push(msg);
  await db.insertAlert(msg, "High");
}

    res.json({
  cpu: cpuLoad.currentLoad.toFixed(2),
  memory: memUsage.toFixed(2),
  disk: diskUsage.toFixed(2),
  network: { rx: netRx.toFixed(2), tx: netTx.toFixed(2) },
  alerts: alerts
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy lịch sử từ SQL Server (có thể lọc theo ngày + giờ phút)
app.get('/api/history', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query; // đổi tên cho rõ ràng
    let history;

    if (date && startTime && endTime) {
      // startTime và endTime dạng HH:mm
      history = await db.getHistoryByDateRange(date, startTime, endTime);
    } else if (date) {
      history = await db.getHistoryByDate(date);
    } else {
      history = await db.getHistory(100);
    }

    const mapped = history.map(h => ({
  CpuLoad: h.cpuload,          // map sang CpuLoad
  MemoryUsage: h.memoryusage,  // map sang MemoryUsage
  DiskUsage: h.diskusage,      // map sang DiskUsage
  NetRx: h.netrx,              // map sang NetRx
  NetTx: h.nettx,              // map sang NetTx
  Timestamp: h.timestamp       // map sang Timestamp
}));
res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const { items, total } = await db.getAlertsByPage(page, size);

    const mapped = items.map(a => ({
      Id: a.id,             // giữ nguyên Id
      Message: a.message,   // map sang Message
      Severity: a.severity, // map sang Severity
      Timestamp: a.timestamp // map sang Timestamp
    }));

    res.json({ Items: mapped, Total: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.json());

// API lưu cấu hình ngưỡng cảnh báo
app.post('/api/config', async (req, res) => {
  const { cpu, ram, disk } = req.body;
  try {
    // Lưu vào bảng Config trong SQL Server
    await db.saveConfig(cpu, ram, disk);
    res.json({ message: "Config saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy config hiện tại
app.get('/api/config', async (req, res) => {
  try {
    const config = await db.getLatestConfig();
    res.json({
      CpuThreshold: config.cputhreshold,
      RamThreshold: config.ramthreshold,
      DiskThreshold: config.diskthreshold,
      UpdatedAt: config.updatedat
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API thêm người dùng
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.addUser(name, email);
    res.json({ message: "User added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API xóa người dùng
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.deleteUser(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API cập nhật người dùng
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    await db.updateUser(id, name, email);
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy danh sách người dùng
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    const mapped = users.map(u => ({
      Id: u.id,              // giữ nguyên Id
      Name: u.name,          // map sang Name
      Email: u.email,        // map sang Email
      IsAdmin: u.isadmin,    // map sang IsAdmin
      CreatedAt: u.createdat // map sang CreatedAt
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy danh sách ngày có dữ liệu trong SystemMetrics
app.get('/api/dates', async (req, res) => {
  try {
    const dates = await db.getAvailableDates();
    const mapped = dates.map(d => ({
      Date: d.date || d   // nếu DB trả về object có field date thì dùng, nếu chỉ là string thì giữ nguyên
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await db.getUserByNameEmail(name, email);
    if (user) {
      res.json({
  IsAdmin: user.isadmin,   // map sang IsAdmin (SQL Server style)
  Name: user.name,         // map sang Name
  Email: user.email        // map sang Email
});
    } else {
      res.status(401).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Phục vụ file tĩnh (index.html, script.js, style.css)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`✅ Server running at ${HOST}`);
});

// Tự động lưu metrics mỗi phút
const fs = require('fs');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

setInterval(async () => {
  try {
    const cpuLoad = await si.currentLoad();
    const memUsage = getMemoryUsage();
    const diskData = await si.fsSize();
    const netData = await si.networkStats();

    const diskUsage = diskData.length > 0 ? (diskData[0].used / diskData[0].size) * 100 : 0;
    const netRx = netData[0].rx_bytes / (1024 * 1024);
    const netTx = netData[0].tx_bytes / (1024 * 1024);

    // Lưu metrics
    await db.insertMetrics(cpuLoad.currentLoad, memUsage, diskUsage, netRx, netTx);

    // Lấy config mới nhất
    const config = await db.getLatestConfig();

    // Kiểm tra ngưỡng và lưu cảnh báo
    if (cpuLoad.currentLoad > config.CpuThreshold) {
      await db.insertAlert(`⚠️ CPU load cao: ${cpuLoad.currentLoad.toFixed(2)}%`, "High");
    }
    if (memUsage > config.RamThreshold) {
      await db.insertAlert(`⚠️ RAM vượt ngưỡng: ${memUsage.toFixed(2)}%`, "High");
    }
    if (diskUsage > config.DiskThreshold) {
      await db.insertAlert(`⚠️ Ổ đĩa gần đầy: ${diskUsage.toFixed(2)}%`, "High");
    }

    console.log("✅ Metrics + Alerts checked at", new Date().toLocaleString());
  } catch (err) {
    console.error("❌ Lỗi khi tự động insert metrics/alerts:", err);
  }
}, config.intervalMs);

