const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));  // for form data
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.post('/link', (req, res) => {
  const link = req.body.link;
  
  // Validation of the link
  const regex = /^https:\/\/www\.youtube\.com\/watch\?v=/;
  const match = regex.test(link); // true
  
  if (!match) {
    res.send('Invalid link. Try again!')
    return
  }

  res.send('Hello');
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});