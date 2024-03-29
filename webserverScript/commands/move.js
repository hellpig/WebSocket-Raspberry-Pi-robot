
const maxMove = 10;  // in seconds

module.exports = {

  config: {
    name: "move",
    aliases: ["run", "drive", "go"],
    arg_types: ["number", "optional-number"],
    description: "Usage: move x y\nMoves for |x| seconds at y% speed; sign of x determines direction. Speed defaults to 100% if y not provided."
  },

  errorCheck: (args) => {
    let str = "";
    let t = Number(args[0]);
    if (Math.abs(t) > maxMove) {
      str += "Move command must not be for more than " + maxMove.toString() + " seconds, ";
    } else if (t == 0) {
      str += "Move command must be for more than 0 seconds, "
    }
    if (args[1] && (args[1] > 100 || args[1] <= 0) ) {
      str += "0 < speed <= 100 must be true, ";
    }
    return str;
  },

  run: (socket, comvars, args) => {

    let t = Number(args[0]);

    let speed = args[1];
    if(!speed) {
      speed = 100;
    } else {
      speed = Number(args[1]);
    }

    // Map degrees to an integer from 0 to 1000000
    //   for PWM for DC motor
    let dutyCycle = Math.round( speed * 10000 );

    // controls the non-PWM pin of motor controller
    let pin2 = 0;

    let dir = "forwards";
    if(t < 0) {
      dir = "backwards";
      dutyCycle = 1E6 - dutyCycle;
      pin2 = 1;
      t = -t;    // make t positive
    }

    //Wait until all other queued commands have executed
    setTimeout(() => {

      if (comvars.hardware) {
        comvars.pinMotorPWM.hardwarePwmWrite(comvars.frequency, dutyCycle);
        comvars.pinMotor.digitalWrite( pin2 );
      }

      let str = `Move command executing for ${t} seconds, ${dir}!`;
      comvars.helpText += str;
      socket.emit("help", comvars.helpText);
      socket.broadcast.emit("help", comvars.helpText);

      //Run move command for 't' seconds
      setTimeout(() => {

          // fast stop
          if (comvars.hardware) {
            comvars.pinMotorPWM.hardwarePwmWrite(comvars.frequency, 1E6);  
            comvars.pinMotor.digitalWrite(1);
          }

          //When done, display message
          comvars.helpText += " Done.\n\n";
          socket.emit("help", comvars.helpText);
          socket.broadcast.emit("help", comvars.helpText);

      }, t * 1000);

    }, comvars.timeCumulative * 1000);

    // code continues immediately
    //   (doesn't wait for above timeouts)
    comvars.timeCumulative += t + 0.5;

  }

}
