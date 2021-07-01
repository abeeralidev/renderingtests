var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fse = require('fs-extra');
var fs = require("fs");
var puppeteer = require("puppeteer");
var cheerio = require('cheerio');
const { exec } = require("child_process");

router.post("/makevideo", async (req, res) => {
  try {
    var form = new multiparty.Form()
    form.parse(req, async (err, fields, files) => {
      var resolution = parseInt(fields["resolution"][0]);
      var slide_duration = parseInt(fields["slide_duration"][0]);
      var screen_shot_per_second = parseInt(fields["screen_shot_per_second"][0]);
      var output_frames_per_second = parseInt(fields["output_frames_per_second"][0]);

      var files = files.files;
      imagenamesarray = [];
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        var imagename = Date.now() + index + ".svg";
        fse.moveSync(file.path, "public/svgs/" + imagename, { overwrite: true });
        imagenamesarray.push(imagename);
      }
      var foldername = Date.now() + "/";
      await renderVideo("public/" + foldername, resolution, slide_duration, screen_shot_per_second, output_frames_per_second, imagenamesarray);
      var videoPath = foldername + "0.mp4";
      res.send({ status: "success", video: videoPath })
    });
  } catch (ex) {
    res.send({ status: "failed" })
  }

})

var browser;
var page;
var resolutionWidth;
var resolutionHeight;
var videoDuration;
var screenshootsPerSecond;
var videoFramesPerSecond;
var svgs;

var ffmpegfilelist;
var savingImagesPromises;
var frameNumber;
var interval;
var totalFrames;
var intervalDuration;
var imagecount;
var foldername;
var svgContent;

//renderVideo("public/"+Date.now()+"/",1920,5,20,20,["1.svg","2.svg","3.svg","4.svg","5.svg","6.svg","7.svg","8.svg","9.svg","10.svg"])

async function renderVideo(foldername, resolution, videoDuration, screenshootsPerSecond, videoFramesPerSecond, svgs) {
  console.log('renderVideo')
  console.log(foldername, resolution, videoDuration, screenshootsPerSecond, videoFramesPerSecond, svgs);
  return new Promise(async (res) => {
    this.resolutionWidth = resolution;
    this.resolutionHeight = Math.round(resolution * (9 / 16));
    this.videoDuration = videoDuration;
    this.screenshootsPerSecond = screenshootsPerSecond;
    this.videoFramesPerSecond = videoFramesPerSecond;
    this.svgs = svgs;

    this.ffmpegfilelist = "";
    this.savingImagesPromises = [];
    this.frameNumber = 0;
    this.interval = null;
    this.totalFrames = videoDuration * screenshootsPerSecond;
    console.log('total frames '+this.totalFrames)
    this.intervalDuration = 1000 / screenshootsPerSecond;
    this.imagecount = 0;
    this.foldername = foldername;
    this.svgContent = "";


    await startBrowser();
    await playSlides();
    res(this.foldername + "0.mp4");
    console.log('renderVideo end')
  })
}


async function playSlides() {
  console.log('playslides');
  return new Promise(async (res) => {
    for (let index = 0; index < this.svgs.length; index++) {
      this.frameNumber = 0;
      console.log('playslides '+index);
      const svgtemplate = this.svgs[index];
      this.svgContent = fs.readFileSync("public/svgs/" + svgtemplate, "utf-8");
      await parseSvgTempalte();
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: this.resolutionWidth, height: this.resolutionHeight });
      await this.page.setContent(this.svgContent);
      await this.page.waitForSelector("svg");
      await startTakingScreenShots();
      await Promise.all(this.savingImagesPromises);
      this.savingImagesPromises =[];
      await this.page.close();
      //clearInterval(this.interval);
    }
    await framesCapturingFinished();
    await runFFmpeg();
    var foldertoempty = this.foldername + "screenshots";
    //fse.emptyDirSync(foldertoempty);
    res();
  })
}


async function startBrowser() {
  console.log('startBrowser');
  return new Promise(async res => {
    this.browser = await puppeteer.launch(
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
    res();
    console.log('startBrowser end');
  })
}


async function parseSvgTempalte() {
  console.log('parseSvgTempalte')
  return new Promise((res) => {
    const $ = cheerio.load(this.svgContent);
    $('svg').first().attr('viewBox', "0 0 800 450").removeAttr('width').removeAttr('height');
    this.svgContent = $.html();
    res();
    console.log('parseSvgTempalte end')
  })

}


async function startTakingScreenShots() {
  console.log('startTakingScreenShots')
  return new Promise((res) => {
    this.interval = setInterval(() => {
      captureAScreenShot();
      this.frameNumber++;
      if (this.frameNumber == this.totalFrames) {
        clearInterval(this.interval)
        res();
        console.log('total screeshoots '+this.frameNumber)
        console.log('startTakingScreenShots end')
      }
    }, this.intervalDuration);
  })
}


async function captureAScreenShot() {
  this.savingImagesPromises.push(
    new Promise(async (res) => {
      var imageBuffer = await this.page.screenshot({
        type: "png",
        fullPage: false,
      });
      fse.outputFile(this.foldername + "screenshots/" + ++this.imagecount + ".png", imageBuffer);
      this.ffmpegfilelist += "file screenshots/" + (this.imagecount) + ".png\n";
      res();
    })
  );
}


async function framesCapturingFinished() {
  console.log('framesCapturingFinished')
  return new Promise(async (res) => {
    this.browser.close();
    fs.writeFileSync(
      this.foldername + "0.txt",
      this.ffmpegfilelist.substring(0, this.ffmpegfilelist.length - 1)
    );
    res();
    console.log('framesCapturingFinished end')
  })
}


async function runFFmpeg() {
  console.log('runFFmpeg')
  return new Promise((res) => {
    var ffmpegCommandToRun = `ffmpeg -r ${this.videoFramesPerSecond} -f concat -i ${this.foldername}0.txt -c:v libx264 -vf scale=${this.resolutionWidth}:-2 -y ${this.foldername}0.mp4`;
    console.log(ffmpegCommandToRun)
    exec(ffmpegCommandToRun, (error, data, getter) => {
      res();
      console.log('runFFmpeg end')
    });
  })
}

module.exports = router;