/* @flow */
var path = require('path');
var fs = require("fs");
var fse = require("fs-extra");
var puppeteer = require("puppeteer");
const { exec } = require("child_process");
var browser;
var page;
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var svgFilePath = config.svgFilePath;
var videoDuration = config.videoDuration;
var screenshootsPerSecond = config.screenshootsPerSecond;
var videoFramesPerSecond = config.videoFramesPerSecond;

var frameNumber = 0;
var videoDurationInMilliSeconds = videoDuration*1000;
var intervalDuration = 1000/screenshootsPerSecond;
var interval;
var imagesListFileContent = ""
var svgContent = fs.readFileSync(svgFilePath, "utf-8");

console.log(config);
console.log('take screenshot after '+intervalDuration +" milli seconds");
fse.emptyDirSync('screenshots');





takeScreenShots()
async function takeScreenShots() {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.setContent(svgContent);
  interval = setInterval(()=>{
    imagesListFileContent+=("file screenshots/img"+(frameNumber+1)+".png\n");
    captureAScreenShot(++frameNumber);
  }, intervalDuration);
  setTimeout(async()=>{
    clearInterval(interval);
    console.log("total Screen Shots Captured "+frameNumber);
    fs.writeFileSync('imagesListFileContent.txt',imagesListFileContent.substring(0, imagesListFileContent.length - 1));
    setTimeout(async ()=>{
      console.log('puppetter closed, new we can run ffmpeg command')
      await page.close();
      browser.close();
      //runFFmpeg();
      //
    },60000)
    
  },videoDurationInMilliSeconds+(intervalDuration*100))
}

async function captureAScreenShot(frameNumberVal) {
  var imageBuffer = await page.screenshot({
    type: "png",
    fullPage: true,
  });
  fse.outputFile("screenshots/img" + frameNumberVal + ".png", imageBuffer);
}

async function runFFmpeg(){
  var ffmpegCommandToRun = `ffmpeg -r ${videoFramesPerSecond} -f concat -i imagesListFileContent.txt -pix_fmt yuv420p -y out.mp4`;
  console.log(ffmpegCommandToRun)
  exec(ffmpegCommandToRun, (error, data, getter) => {
    if(error){
      console.log("error",error.message);
      return;
    }
    if(getter){
      console.log('ffmpeg finished');
      return;
    }
  });
}
