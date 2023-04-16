
const maxAngle = 60;  // in degrees

module.exports = {

  config: {
    name: "turn",
    aliases: ["rotate", "direction"],
    arg_types: ["number"],
    description: "Usage: turn x\nTurns robot to x degrees. Sign of x indicates cw or ccw rotation. |x| is not to exceed " + maxAngle.toString() + "."
  },

  errorCheck: (args) => {
    let str = "";
    let degrees = Number(args[0]);
    if(Math.abs(degrees) > maxAngle) {
      str += "Degrees exceed the range from -" + maxAngle.toString() + " to " + maxAngle.toString() + " degrees, ";
    }
    return str;
  },

  run: (socket, comvars, args) => {

    let degrees = Number(args[0]);

    let dir = "CCW";
    if(degrees < 0) {
      dir = "CW";
    }

    // Map degrees to an integer from 50000 to 100000 (out of a million)
    //   for servo PWM
    let dutyCycle = Math.round(25000 * degrees/maxAngle) + 75000;

    if (comvars.hardware) {
      comvars.pinServoPWM.hardwarePwmWrite(comvars.frequency, dutyCycle);
    }

    setTimeout(() => {
      let str = `Rotated to ${Math.abs(degrees)} degrees ${dir}!`;
      comvars.helpText += str + "\n\n";
      socket.emit("help", comvars.helpText);
      socket.broadcast.emit("help", comvars.helpText);
    }, comvars.timeCumulative * 1000);

    // code continues immediately
    //   (doesn't wait for above timeouts)
    comvars.timeCumulative += 0.5;

  }

}
