const { Pool } = require('pg');

class Database {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // Supabase yêu cầu SSL
    });
  }

  async insertMetrics(cpu, memory, disk, netRx, netTx) {
    try {
      await this.pool.query(
        `INSERT INTO SystemMetrics (CpuLoad, MemoryUsage, DiskUsage, NetRx, NetTx, Timestamp)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [cpu, memory, disk, netRx, netTx]
      );
    } catch (err) {
      console.error("❌ Lỗi khi insert dữ liệu:", err);
    }
  }

  async getHistory(limit = 50) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM SystemMetrics ORDER BY Timestamp ASC LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu:", err);
      return [];
    }
  }

  async getAlerts(limit = 50) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM Alerts ORDER BY Timestamp DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (err) {
      console.error("❌ Lỗi khi lấy cảnh báo:", err);
      return [];
    }
  }

  async getAlertsByPage(page = 1, size = 10) {
    try {
      const offset = (page - 1) * size;
      const result = await this.pool.query(
        `SELECT * FROM Alerts ORDER BY Timestamp DESC OFFSET $1 LIMIT $2`,
        [offset, size]
      );

      const totalResult = await this.pool.query(`SELECT COUNT(*) AS count FROM Alerts`);
      const total = parseInt(totalResult.rows[0].count, 10);

      return { items: result.rows, total };
    } catch (err) {
      console.error("❌ Lỗi khi lấy cảnh báo theo trang:", err);
      return { items: [], total: 0 };
    }
  }

  async getAvailableDates() {
    try {
      const result = await this.pool.query(
        `SELECT DISTINCT DATE(Timestamp) AS LogDate
         FROM SystemMetrics
         ORDER BY LogDate DESC`
      );
      return result.rows.map(r => r.logdate.toISOString().split('T')[0]);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách ngày:", err);
      return [];
    }
  }

  async getHistoryByDate(date) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM SystemMetrics WHERE DATE(Timestamp) = $1 ORDER BY Timestamp ASC`,
        [date]
      );
      return result.rows;
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu theo ngày:", err);
      return [];
    }
  }

  async getHistoryByDateRange(date, startTime, endTime) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM SystemMetrics
         WHERE Timestamp BETWEEN $1 AND $2
         ORDER BY Timestamp ASC`,
        [`${date} ${startTime}:00`, `${date} ${endTime}:00`]
      );
      return result.rows;
    } catch (err) {
      console.error("❌ Lỗi khi lấy dữ liệu theo khoảng giờ:", err);
      return [];
    }
  }

  async insertAlert(message, severity = "High") {
    try {
      await this.pool.query(
        `INSERT INTO Alerts (Message, Severity, Timestamp)
         VALUES ($1, $2, NOW())`,
        [message, severity]
      );
    } catch (err) {
      console.error("❌ Lỗi khi insert alert:", err);
    }
  }

  async saveConfig(cpu, ram, disk) {
    try {
      await this.pool.query(
        `INSERT INTO Config (CpuThreshold, RamThreshold, DiskThreshold, UpdatedAt)
         VALUES ($1, $2, $3, NOW())`,
        [cpu, ram, disk]
      );
    } catch (err) {
      console.error("❌ Lỗi khi lưu config:", err);
    }
  }

  async addUser(name, email) {
    try {
      await this.pool.query(
        `INSERT INTO Users (Name, Email, CreatedAt)
         VALUES ($1, $2, NOW())`,
        [name, email]
      );
    } catch (err) {
      console.error("❌ Lỗi khi thêm user:", err);
    }
  }

  async deleteUser(id) {
    try {
      await this.pool.query(`DELETE FROM Users WHERE Id = $1`, [id]);
    } catch (err) {
      console.error("❌ Lỗi khi xóa user:", err);
    }
  }

  async updateUser(id, name, email) {
    try {
      await this.pool.query(
        `UPDATE Users SET Name = $1, Email = $2 WHERE Id = $3`,
        [name, email, id]
      );
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật user:", err);
    }
  }

  async getUsers() {
    try {
      const result = await this.pool.query(`SELECT * FROM Users ORDER BY CreatedAt DESC`);
      return result.rows;
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách user:", err);
      return [];
    }
  }

  async getLatestConfig() {
    try {
      const result = await this.pool.query(
        `SELECT * FROM Config ORDER BY UpdatedAt DESC LIMIT 1`
      );
      return result.rows[0];
    } catch (err) {
      console.error("❌ Lỗi khi lấy config:", err);
      return null;
    }
  }

  async getUserByNameEmail(name, email) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM Users WHERE Name = $1 AND Email = $2`,
        [name, email]
      );
      return result.rows[0];
    } catch (err) {
      console.error("❌ Lỗi khi tìm user:", err);
      return null;
    }
  }
}

module.exports = Database;
