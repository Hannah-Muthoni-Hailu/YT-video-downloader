const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));  // for form data
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Serve static files from "downloads" so users can fetch them
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}
app.use("/files", express.static(downloadsDir));


function runYtDlp(args, outputPath) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn("yt-dlp", args);

    const fileStream = fs.createWriteStream(outputPath);
    ytdlp.stdout.pipe(fileStream);

    ytdlp.stderr.on("data", (data) => {
      console.error("yt-dlp error:", data.toString());
    });

    ytdlp.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
}

app.get('/link', async (req, res) => {
  const url = req.query.url;
  
  // Validation of the link
  const regex = /^https:\/\/www\.youtube\.com\/watch\?v=/;
  const match = regex.test(url);
  
  if (!match) {
    console.log(url)
    res.status(500).send("Invalid link. Try again");
    return
  }

  const mp3Path = path.join(downloadsDir, `audio-${Date.now()}.mp3`);
  const mp4Path = path.join(downloadsDir, `video-${Date.now()}.mp4`);

  try {
    // Download MP3
    await runYtDlp(["-x", "--audio-format", "mp3", "-o", "-", url], mp3Path);

    // Download MP4
    await runYtDlp(["-f", "mp4", "-o", "-", url], mp4Path);

    // Respond with JSON links
    res.json({
      mp3: `/files/${path.basename(mp3Path)}`,
      mp4: `/files/${path.basename(mp4Path)}`
    });

    // Optional cleanup: delete files after some time
    setTimeout(() => {
      if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
    }, 120 * 1000); // delete after 1 minute
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating files");
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});