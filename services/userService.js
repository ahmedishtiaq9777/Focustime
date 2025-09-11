const userRepository = require("../repositories/userRepository");

async function registerUser(userData) {
  // TODO: hash password here instead of saving plain text
  const hashedPassword = await bcrypt.hash(userData.password, 10); // 10 salt rounds
  userData.password = hashedPassword;
  const existingUser = await userRepository.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  return await userRepository.createUser(userData);
}

module.exports = { registerUser };
