var config = require("./dbconfig");
const sql = require("mssql");

const getusers = async () => {
  try {
    let pool = await sql.connect(config);
    let users = await pool.request().query("select * from [User]");
    return users.recordsets;
  } catch (err) {
    console.log(err);
  }
};
const adduser = async (user) => {
  // console.log('user:',user);
  try {
    let pool = await sql.connect(config);
    let request = pool.request();
    request.input("name", sql.NVarChar(50), user.name);
    request.input("password", sql.NVarChar(50), user.password);
    request.input("email", sql.NVarChar(50), user.email);

    const result = await request.query(`
      INSERT INTO [User] (name, email, password)
      VALUES (@name, @email, @password);
    `);

    console.log("✅ User inserted successfully.");
    return result;
  } catch (err) {
    console.error("❌ SQL error:", err);
  }
};

const addTask = async (title, userId, scheduledFor = null) => {
  const createdAt = new Date();
  const isCompleted = false;

  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("is_completed", sql.Bit, isCompleted)
      .input(
        "scheduled_for",
        sql.DateTime,
        scheduledFor ? new Date(scheduledFor) : null
      )
      .input("created_at", sql.DateTime, createdAt)
      .input("user_id", sql.Int, userId).query(`
        INSERT INTO Tasks (title, is_completed, scheduled_for, created_at, user_id)
        VALUES (@title, @is_completed, @scheduled_for, @created_at, @user_id);
      `);

    console.log("Task added successfully");
    return result;
  } catch (err) {
    console.error("Error adding task:", err);
    throw err;
  }
};

module.exports = {
  getusers: getusers,
  adduser: adduser,
  addTask: addTask,
};
