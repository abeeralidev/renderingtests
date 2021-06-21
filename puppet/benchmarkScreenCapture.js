var fs = require("fs");
var fse = require("fs-extra");
var puppeteer = require("puppeteer");
var browser;
var page;
var config = JSON.parse(fs.readFileSync('benchmarkScreenCapture-config.json', 'utf8'));
var svgFilePath = config.svgFilePath;
var videoDuration = config.videoDuration;
var screenshootsPerSecond = config.screenshootsPerSecond;
var totalScreenshoots = screenshootsPerSecond*videoDuration;
var screenShootsTimeDiffInMilliSeconds = Math.round(1000/screenshootsPerSecond);
var frameNumber = 0;
var needToTakeScreenShoot = false
var lastScreenShootTime;
console.log(config);
console.log("totalScreenshoots ",totalScreenshoots)
console.log("screenShootsTimeDiffInMilliSeconds",screenShootsTimeDiffInMilliSeconds)


var folderName = "benchmarkScreenCapture/svg"+(svgFilePath.split('.')[0])+"/"+screenshootsPerSecond+"fps";
fse.emptyDirSync(folderName);

loadTemplate();


async function loadTemplate(){
  var svgContent = fs.readFileSync("svgs/"+svgFilePath, "utf-8");
  browser = await puppeteer.launch(
    {
      headless:true
    },
    );
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setContent(svgContent);
  await page.waitForSelector('svg');
  needToTakeScreenShoot = true;
  lastScreenShootTime = Date.now();
  captureAScreenShot();
}

var screenshootsTimingArray  = [];
imageBufferArray = {}
async function captureAScreenShot(){
  if(needToTakeScreenShoot)
  {
    var cd = Date.now();
    var timeDifferenceBetweenShoot = cd -lastScreenShootTime;
    if((timeDifferenceBetweenShoot>screenShootsTimeDiffInMilliSeconds)&&frameNumber<=totalScreenshoots){
      frameNumber++;
      page.screenshot({
        path:(folderName+"/"+frameNumber+".png"),
        fullPage: false
      })
      screenshootsTimingArray.push(Date.now()-lastScreenShootTime)
      lastScreenShootTime = Date.now();
      if(frameNumber==totalScreenshoots){
        needToTakeScreenShoot=false
      }
      setTimeout(captureAScreenShot,5)
    }
    else{
      setTimeout(captureAScreenShot,5)
    }

  }
  else{
    console.log("All Screen Shoots Captures");
    closePuppeteer();
  }
}

function closePuppeteer(){
  console.log(screenshootsTimingArray);
  console.log(imageBufferArray);
  // for (let index = 0; index < imageBufferArray.length; index++) {
  //   const element = imageBufferArray[index];
  //   fs.writeFileSync(folderName+"/"+(index+1)+".png", element, 'base64',(err)=>{})
  // }
}

