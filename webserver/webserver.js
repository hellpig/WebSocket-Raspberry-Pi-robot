const http = require('http').createServer(handler);
const fs = require('fs');
const io = require('socket.io')(http);   // npm i socket.io
const url = require('url');
const path = require('path');


const { exec } = require("child_process");
const Gpio = require('pigpio').Gpio;    // npm i pigpio
const pinServoPWM = new Gpio(13, {mode: Gpio.OUTPUT});
const pinMotorPWM = new Gpio(12, {mode: Gpio.OUTPUT});
const pinMotor = new Gpio(23, {mode: Gpio.OUTPUT});
const frequency = 50;   // 50-Hz hardware PWM is needed for the servo
http.listen(80);  //listen to port 80
HTMLfolder = '/home/pi/nodetest/public';  // systemctl requires an absolute path


function handler(req, res) { //create server
  //console.log(`${req.method} ${req.url}`);

  // parse URL
  const parsedUrl = url.parse(req.url);
  // extract URL path
  let pathname = `${HTMLfolder}${parsedUrl.pathname}`;
  // based on the URL path, extract the file extention. e.g. .js, .doc, ...
  let ext = path.parse(pathname).ext;
  // maps file extention to MIME type
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  fs.exists(pathname, function(exist) {
    if (!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file
    if (fs.statSync(pathname).isDirectory()) {
      pathname += '/index.html';
      ext = '.html';
    }

    // read file from file system
    fs.readFile(pathname, function(err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain');
        res.end(data);
      }
    });
  });
}



function setGPIO() {

  /* setup GPIO13 for hardware PWM to control servo motor */
  /* use same settings for GPIO12 for hardware PWM to control DC motor driver */
  /* use GPIO12 and GPIO23 to control the DC motor via a drv8833 driver */
  /* initialize DC motor to fast-stop setting, and initialize servo to point forward */

  pinServoPWM.mode(Gpio.OUTPUT);
  pinMotorPWM.mode(Gpio.OUTPUT);
  pinMotor.mode(Gpio.OUTPUT);
  pinServoPWM.hardwarePwmWrite(frequency, Math.round(1E6 * 1.5/20));  // 0 <= dutyCycle <= 1E6
  pinMotorPWM.hardwarePwmWrite(frequency, 1E6);
  pinMotor.digitalWrite(1);

  console.log("GPIO has been setup");
}

//setGPIO();
let dataH = 50;
let dataV = 50;
io.on('connection', function(socket) {// WebSocket Connection

  socket.on('sliderH', function(data) {
    console.log("hSlider = " + data);
    socket.broadcast.emit("hSliderUpdate", data);
    dataH = data;

    /* for controlling servo motor, dutyCycle between 1 and 2 ms (out of 20 ms) */
    let dutyCycle = Math.round(500 * (Number(data) + 100));
    pinServoPWM.hardwarePwmWrite(frequency, dutyCycle);

  });

  socket.on('sliderV', function(data) {
    console.log("vSlider = " + data);
    socket.broadcast.emit("vSliderUpdate", data);
    dataV = data;

    /* for controlling DC motor driver */
    let dutyCycle = Math.round( ((Number(data)-1)%50 + 1) * 20000 );
    let pin2 = 1;
    if ( Number(data) > 50 ) { pin2 = 0; }  // forwards
    pinMotorPWM.hardwarePwmWrite(frequency, dutyCycle);
    pinMotor.digitalWrite( pin2 );
    //console.log("dutyCycle = " + dutyCycle + "; pin2 = " + pin2);

  });

  socket.on('text', function(data) {
    console.log("text = " + data);

    /* for my USB speakers */
    // I don't believe code injection is possible with the following code.
    // We must be careful since this code is being run by superuser.
    exec("/usr/bin/espeak '" + data.replace(/\'/g, '’') + "' -v english-us+f5 --stdout | /usr/bin/aplay -D plughw:1", (error, stdout, stderr) => {});
  });

  socket.on('halt', function(data) {
    data = data.trim().toLowerCase();
    console.log("halt text = " + data);

    if (data == "halt") {
      stop(false);
      console.log("Halting. You may unplug the Pi in a minute.");
      exec("/sbin/halt", (error, stdout, stderr) => {});
    } else if (data == "reboot") {
      stop(false);
      console.log("Rebooting the Pi.");
      exec("/sbin/reboot", (error, stdout, stderr) => {});
    }
  });

  socket.on('setGPIO', function(data) {
    setGPIO();
    dataH = 50;
    dataV = 50;
    socket.broadcast.emit("hSliderUpdate", dataH);
    socket.broadcast.emit("vSliderUpdate", dataV);
    socket.emit("hSliderUpdate", dataH);
    socket.emit("vSliderUpdate", dataV);
  });

  socket.emit("hSliderUpdate", dataH);
  socket.emit("vSliderUpdate", dataV);
});


function stop(close = true) {  // stops code in a safe way
  pinServoPWM.digitalWrite(0);
  pinMotorPWM.digitalWrite(0);
  pinMotor.digitalWrite(0);
  pinServoPWM.mode(Gpio.INPUT);
  pinMotorPWM.mode(Gpio.INPUT);
  pinMotor.mode(Gpio.INPUT);
  if (close) {
    console.log(" bye!");
    process.exit();  //exit completely
  }
}

process.on('SIGINT', function(){ stop(true); } );  //  on ctrl+c
process.on('SIGTERM', function(){ stop(true); } ); //  "systemctl stop" uses SIGTERM
