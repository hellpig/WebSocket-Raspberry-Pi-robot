const http = require('http').createServer(handler);
const fs = require('fs');
const io = require('socket.io')(http);    // npm i socket.io
const url = require('url');
const path = require('path');


const hardware = true;   // this is false if, for example, running on Replit

http.listen(80);        // use port 80 on Pi, but use 8080 on Replit

// systemctl requires absolute paths
const HTMLfolder = '/home/pi/nodetestScript/public';
const CommandsFolder = '/home/pi/nodetestScript/commands';


let exec;
let Gpio;
let pinServoPWM;
let pinMotorPWM;
let pinMotor;
if (hardware) {
  exec = require("child_process").exec;
  Gpio = require('pigpio').Gpio;    // npm i pigpio
  pinServoPWM = new Gpio(13, {mode: Gpio.OUTPUT});
  pinMotorPWM = new Gpio(12, {mode: Gpio.OUTPUT});
  pinMotor = new Gpio(23, {mode: Gpio.OUTPUT});
}
const frequency = 50;   // 50-Hz hardware PWM is needed for the servo





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

let emitToAll = (socket, status) => {
  socket.emit("help", status);
  socket.broadcast.emit("help", status);
}

// so only one script can be run at once
let locked = false;

let checkerror = (command, args) => {
  let error = "";
  let realcommand = commands.get(command) || commands.get(aliases.get(command));
  
  //Check to make sure the inputted command is actually a command
  if(!realcommand) {
    error = `\"${command}\" is not a real command`;
    return error;
  }

  //If the user has inputted less arguments than a command can accept, make sure that the user has inputted all the required arguments
  if(args.length < realcommand.config.arg_types.length) {
    let dif = realcommand.config.arg_types.length - args.length;

    //Make sure that arguments which haven't been included are optional. If they are required arguments, then report the error
    for(let i = 0; i < dif; i++) {
      let currentarg = realcommand.config.arg_types[args.length+i];
      if(!currentarg.includes("optional-")) {
        error += `Expected more arguments, `;
      }
    }
  }

  if(args.length > realcommand.config.arg_types.length) {
    error += `Too many arguments, `;
  } else {
    for(let i = 0; i < args.length; i++) {
      
      if((isNaN(parseFloat(args[i])) && realcommand.config.arg_types[i].includes("number"))  || (!isNaN(parseFloat(args[i])) && realcommand.config.arg_types[i].includes("string"))) {
        error += `Argument #${i+1} does not match required argument type \"${realcommand.config.arg_types[i]}\", `;
      }
    }
  }

  // check for command-specific errors
  error += realcommand.errorCheck(args);

  if ( error.length > 0 ) {
    error = error.slice(0,-2);  // remove trailing ", "
  }

  return error;
}

let commands = new Map();
let aliases = new Map();

//The command list is the number of files in the commands folder ending in '.js'
const commandlist = fs.readdirSync(CommandsFolder).filter(c => c.endsWith('.js'));

//For each of the 'files' in the command list, load them when the server starts
for(let file of commandlist) {
  try {
    pull = require(`${CommandsFolder}/${file}`);
  } catch(err) {   // needed if CommandsFolder is a local folder
    pull = require(`./${CommandsFolder}/${file}`);
  }
  commands.set(pull.config.name, pull);
  console.log(`${pull.config.name} loaded!`);
  if(pull.config.aliases) pull.config.aliases.forEach(a => aliases.set(a, pull.config.name));
}

/* the following dictionary is passed to files in CommandsFolder
   and can be modified by those files */
let comVars = {
  hardware: hardware,
  frequency: frequency,
  commands: commands,  // for help command
  aliases: aliases,    // for help command

  /*
  TimeCumulative is to be updated by
  move.js's and turn.js's run().
  The idea is that Node.js is asynchronous,
  so we need to set all setTimeout() functions
  immediately when parsing the user's script
  (there is no sleep() command in JavaScript).
  Each setTimeout() needs to know the
  cummulative amount of time to wait before
  starting, else all commands in script
  run at the same time.
  */
  timeCumulative: 0,

  helpText: ""
}
if (hardware) {
  comVars["pinServoPWM"] = pinServoPWM;
  comVars["pinMotorPWM"] = pinMotorPWM;
  comVars["pinMotor"] = pinMotor;
}

function setGPIO() {

  /* setup GPIO13 for hardware PWM to control servo motor */
  /* use same settings for GPIO12 for hardware PWM to control DC motor driver */
  /* use GPIO12 and GPIO23 to control the DC motor via a drv8833 driver */
  /* initialize DC motor to fast-stop setting, and initialize servo to point forward */

  if (hardware) {
    pinServoPWM.mode(Gpio.OUTPUT);
    pinMotorPWM.mode(Gpio.OUTPUT);
    pinMotor.mode(Gpio.OUTPUT);
    pinServoPWM.hardwarePwmWrite(frequency, Math.round(1E6 * 1.5/20));  // 0 <= dutyCycle <= 1E6
    pinMotorPWM.hardwarePwmWrite(frequency, 1E6);  
    pinMotor.digitalWrite(1);
  }

  console.log("GPIO has been setup");
}

setGPIO();
io.on('connection', function (socket) {// WebSocket Connection

  //Handles execution of inputted commands
  socket.on('commandinput', function(data) {

    //Each command is split between line breaks (one command per line)
    let inputtedcommands = data.trim().toLowerCase().split('\n');

    let args;
    let cmd;
    let noerrors = true;
    let errorlog = "";

    for(let j = 0; j < inputtedcommands.length; j++) {

      /*
        args is initially the raw data for a specific line, the first element of args is removed,
        as this will be interpreted as the command.
        If args is completely empty, then we don't have a command,
        so skip to the next line
      */
      args = inputtedcommands[j].split(/\s+/);
      while(args[0].trim() == "") {
        //We remove lines from inputtedcommands[] if they're empty and don't contain anything to be interpreted
        inputtedcommands.splice(j, 1);
        if(j >= inputtedcommands.length) break;
        args = inputtedcommands[j].split(/\s+/);
      }
      if(j >= inputtedcommands.length) break;
      cmd = args.shift();

      //If inputted command isn't a valid command, throw error
      if(checkerror(cmd, args) != "") {
        errorlog += `Error(s) found at command ${j+1}: ${checkerror(cmd, args)}\n`;
        noerrors = false;
      }
    }

    if(!noerrors) {  // if errors
      socket.emit("help", errorlog);
    }

    if(noerrors && !locked) {
      comVars.timeCumulative = 0;
      comVars.helpText = "Executing Commands...\n\n";
      locked = true;
      socket.emit('light', 1);
      socket.broadcast.emit('light', 1);
      console.log("Executing Commands...");
      emitToAll(socket, comVars.helpText);
      for(let i = 0; i < inputtedcommands.length; i++) {
        //Split the arguments of command based on spaces
        args = inputtedcommands[i].split(/\s+/);

        //Command is the first argument (args[0]) so we slice that off and assign it its own variable
        cmd = args.shift();

        //Grab the command, or, if it's an alias, grab the corresponding command to that alias.
        let command = commands.get(cmd) || commands.get(aliases.get(cmd));
        
        //Run Command
        //Increments comVars.timeCumulative
        command.run(socket, comVars, args);

      }

      setTimeout( () => {
        console.log("Done");
        comVars.helpText += "Done";
        emitToAll(socket, comVars.helpText);
        socket.emit('light', 0);
        socket.broadcast.emit('light', 0);
        locked = false;
      }, comVars.timeCumulative * 1000);
    }
  });


  socket.on('text', function(data) {
    console.log("text = " + data);

    /* for my USB speakers */
    // I don't believe code injection is possible with the following code.
    // We must be careful since this code is being run by superuser.
    if (hardware) {
      exec("/usr/bin/espeak '" + data.replace(/\'/g, '’') + "' -v english-us+f5 --stdout | /usr/bin/aplay -D plughw:1", (error, stdout, stderr) => {});
    }
  });

  socket.on('halt', function(data) {
    console.log("halt text = " + data);

    if (data == "halt") {
      stop(false);
      console.log("Halting. You may unplug the Pi in a minute.");
      if (hardware) {
        exec("/sbin/halt", (error, stdout, stderr) => {});
      }
    }
  });

  socket.on('setGPIO', function(data) {
    if (!locked) {
      setGPIO();
    }
  });

});


function stop(close = true) {  // stops code in a safe way

  if (hardware) {
    pinServoPWM.digitalWrite(0);
    pinMotorPWM.digitalWrite(0);
    pinMotor.digitalWrite(0);
    pinServoPWM.mode(Gpio.INPUT);
    pinMotorPWM.mode(Gpio.INPUT);
    pinMotor.mode(Gpio.INPUT);
  }

  if (close) {
    console.log(" bye!");
    process.exit();  //exit completely
  }
}

process.on('SIGINT', function(){ stop(true); } );  //  on ctrl+c
process.on('SIGTERM', function(){ stop(true); } ); //  "systemctl stop" uses SIGTERM
