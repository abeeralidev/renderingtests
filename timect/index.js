const timecut = require('timecut');
timecut({
  url: 'svgs/1.svg',
  selector: 'svg',
  duration: 2,
  fps: 10,
  viewport: {
    width: 1920,               // sets the viewport (window size) to 800x600
    height: 1080
  },
  screenshotType :'jpeg',
  screenshotQuality:1,
  output: 'video.mp4',
  quiet:true,
}).then(function () {
  console.log('Done!');
});