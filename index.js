var express = require("express");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var bodyParser = require("body-parser");
var cors = require("cors");
var router = express.Router();
var publicrouter = express.Router();
const dboperations = require("./dboperations");
const authenticateToken = require("./middleware");

require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
// app.use('/api',router);
app.use("/api", authenticateToken, router);
app.use("/public", publicrouter);
var port = process.env.PORT || 8090;

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

app.listen(port);
console.log("app is running  on port ", port);

publicrouter.post("/login", (req, res) => {
  const { email, password } = req.body;

  dboperations.getusers().then((result) => {
    const allusers = result[0];

    const user = allusers.find((u) => u.email == email);

    if (!user) return res.status(401).json({ message: "User not found" });

    const isPasswordValid = password == user.password;

    //const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.uid, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });
    console.log(result[0]);
    res.json({ token });
  });
});

// router.get('/protected', authenticateToken, (req, res) => {
//   res.json({ message: 'Access granted to protected data', user: req.user });
// });

// app.use(authenticateToken);
// app.use((req,res,next)=>{

//    console.log('middlewhere');
// next();
// });

router.get("/hello", (req, res) => {
  res.send("Hello World");
});
router.route("/getusers").get((req, res) => {
  console.log("getusers");
  try {
    dboperations.getusers().then((result) => {
      res.json(result[0]);
    });
  } catch (err) {
    console.log("error:", err);
  }
});

publicrouter.post("/adduser", (req, res) => {
  let body = { ...req.body };
  console.log(body);
  dboperations.adduser(body).then((result) => {
    res.json(result);
  });
});
