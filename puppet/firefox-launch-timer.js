var fs = require("fs");
var fse = require("fs-extra");
var puppeteer = require("puppeteer");
var  cheerio  = require('cheerio');
const { exec } = require("child_process");
var browser;
var page;
var config = JSON.parse(fs.readFileSync("firefox-launch-timer.json", "utf8"));
var svgFilePath = config.svgFilePath;
var videoDuration = config.videoDuration;
var screenshootsPerSecond = config.screenshootsPerSecond;
var videoFramesPerSecond = config.videoFramesPerSecond;

var ffmpegfilelist = "";
savingImagesPromises = [];
var frameNumber = 0;
var interval;
var totalFrames = videoDuration * screenshootsPerSecond;
var intervalDuration = 1000 / screenshootsPerSecond;
var imagecount = 0;
var svgContent = fs.readFileSync("svgs/" + svgFilePath, "utf-8");
var foldername =
  "screenshoots/svg" +
  svgFilePath.split(".")[0] +
  "-" +
  screenshootsPerSecond +
  "fps";
fse.emptyDirSync(foldername);

startAppication();

async function startAppication() {
  await parseSvgTempalte()
  await startBrowser();
  startTakingScreenShots();
}
async function parseSvgTempalte(){
  return new Promise((res)=>{
    const $ = cheerio.load(svgContent);
    $('svg').first().attr('viewBox',"0 0 800 450").removeAttr('width').removeAttr('height');
    svgContent =$.html();
    res();
  })
   
}
var svg;
async function startBrowser() {
  return new Promise(async res => {
    browser = await puppeteer.launch(
      {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--disable-accelerated-2d-canvas',
        ]
      }
    );
    page = await browser.newPage();
    await page.setContent(svgContent);
    await page.setViewport({ width: 1920, height: 1080 });
    svg = await page.waitForSelector("svg");

    res();
  })
}
async function startTakingScreenShots() {
  interval = setInterval(() => {
    captureAScreenShot();
    frameNumber++;
    if (frameNumber == totalFrames) {
      framesCapturingFinished();
    }
  }, intervalDuration);
}
async function captureAScreenShot() {
  savingImagesPromises.push(
    new Promise(async (res) => {
      var imageBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
      });
      fse.outputFile(foldername + "/" + imagecount++ + ".png", imageBuffer);
      ffmpegfilelist += "file " + (frameNumber + 1) + ".png\n";
      res();
    })
  );
}
async function framesCapturingFinished() {
  clearInterval(interval);
  await Promise.all(savingImagesPromises);
  await page.close();
  browser.close();
  fs.writeFileSync(
    foldername + "/0.txt",
    ffmpegfilelist.substring(0, ffmpegfilelist.length - 1)
  );
  runFFmpeg();
}

async function runFFmpeg() {
  var ffmpegCommandToRun = `ffmpeg -r ${videoFramesPerSecond} -f concat -i ${foldername}/0.txt -c:v libx264 -vf scale=1920:-2 -y ${foldername}/0.mp4`;
  console.log(ffmpegCommandToRun);
  exec(ffmpegCommandToRun, (error, data, getter) => {
    if (error) {
      console.log("error", error.message);
      return;
    }
    if (getter) {
      return;
    }
  });
}
