# WebSocket Raspberry-Pi Robot
A headless Raspberry Pi creates a web server that allows multiple users to control a robot. Users can control motors, speak using a speaker, and view a webcam.

Control a Raspberry-Pi-powered robot over the Internet or over any network via a WebSocket. See the *webserver* folder. I use *pigpio* to control a servo motor and motor driver via Raspberry Pi's pins, including hardware PWM on GPIO12 and GPIO13. I use *child_process* to speak via *espeak* and USB speakers. Install *espeak* via: *sudo apt install espeak* . I also can display video from a webcam. The first step to setting up a webcam server is installing *motion* via: *sudo apt install motion* .

The Raspberry Pi will run Node.js code. Install Node.js and required modules via...
```
sudo apt install nodejs npm
npm install socket.io
npm install pigpio
```

Run it via: *sudo node webserver.js* . Both *pigpio* and *halt* require *sudo*. I recommend using *systemctl* to start the code at startup (*sudo* is then not needed before *node* since *systemctl* is run as root). You can also automatically start the *motion* server via *systemctl*.

Once the code is running, just type the Pi's IP address into the web browser of any device that has access to that IP address! The following should appear...

![webpage](screenshot.jpg)

Nice features...
- When one user moves a slider, the slider moves for all users.
- The vertical slider automatically goes back to the middle when you are no longer holding it.

Fixing various connection issues...
- If you don't have access to the router, things might still work on a local network. On Google Chrome, if [http://raspberrypi.local](http://raspberrypi.local) works on at least one device, you can find the Pi's IP address by going to chrome://net-internals/#dns
- If the webcam doesn't work on Google Chrome when using raspberrypi.local and the webcam never works when using the IPv6 address, find the line *ipv6_enabled off* in /etc/motion/motion.conf, change *off* to *on*, then restart *motion*.
- If you are connecting a computer to the Pi via a phone's hotspot and the connection is finicky, try unplugging the computer's Ethernet cable!

The Node.js code runs a servo motor that connects to a geared DC motor to control the front wheels. As long as you only are controlling a single servo motor and a single DC motor, I expect the code to work just fine as is, though different DC motor drivers can require modifications to the code. The hardware we used...
- Raspberry Pi 3B, which has WiFi and two hardware-PWM channels
- access to the router to (1) give the Pi a static IP address and possibly to also, if you are wanting to allow control from the Internet, (2) direct inbound traffic to the Pi. If you only want to control it via a local network and want the freedom to move to various locations, you can use a smartphone's hotspot as the router then use the phone to find the Pi's IP address. I don't think it works on all devices or perhaps even all routers, but I can sometimes connect to the Pi without needing a static (knowable) IP address by using raspberrypi.local as the location.
- S05NF STD servo motor. This one is nice because it does nothing if the PWM signal is either always low or always high.
- For the PWM signal that controls the servo motor, we created a small circuit to change the 3.3V PWM to 5V: [https://electronics.stackexchange.com/questions/359994/amplify-pwm-signal-from-exactly-0-3-3v-to-0-5v/360046#360046](https://electronics.stackexchange.com/questions/359994/amplify-pwm-signal-from-exactly-0-3-3v-to-0-5v/360046#360046). We played around with resistances to get the correct low and high voltages being careful not to put any resistance smaller than 330 ohms. The servo was finicky and would sometimes, especially for certain power supplies, start spinning in random directions or keeping spinning as if I was giving it a longer than 2 ms *on* signal for PWM. Using a cheap level shifter, a SN74AHCT125N ([well documented by Adafruit](https://www.adafruit.com/product/1787)), instead of the small circuit fixed it! You cannot just use *any* level shifter because the PWM wire of the servo motor draws some current.
- DRV8833 motor driver. Adafruit sells one in a nice breakout board. This one has MOSFETs as its transistors, so it works well with our 5V motors.
- dual-shaft geared DC motor with a wheel attached on each side. An L bracket (from Adafruit) was used to connect it to the servo motor.
- $13 USB speakers from Amazon. The Node.js code can easily be changed to use non-USB speakers, but USB speakers are great because they are powered through the USB!
- $5 USB webcam from Amazon
- Ayeway PD-2620W battery pack. The 26,800 mAh capacity is way more than we need, and we only used the 5 volts from any of the 3 blue USB ports, which have a 3-amp-total maximum. USB cables were used to power things. The cables can be spliced to more convenient wires that are thick and short enough to carry requires current. Grounds between USB cables were connected on a mini breadboard (the same one that had the DRV8833 and SN74AHCT125N) to create a common ground. The Raspberry Pi initially got a dedicated USB cable to power it (motors were powered from another cable from the same battery). Even so, when the DC motor was stalled or was not allowed to spin freely, the battery was likely delivering approximately its 3-amp limit, and the Raspberry Pi would not get enough voltage causing the webcam to not function well (though I partly blame the very cheap webcam). We fixed this by using a dedicated 2-amp battery for the Raspberry Pi.
- 2 rigid (non-swivel) casters with a wheel diameter of 32 mm

![robot](robot.jpg)


## Scripting language to control the robot!

CodingKraken, [https://github.com/CodingKraken](https://github.com/CodingKraken), wrote an impressive modular scripting language for controlling a robot (unpublished by him), which I used to make the *webserverScript* folder! This currently-3-command language can be useful if the webcam has a huge delay or if you want to have fun trying to program obstacle courses! The scripting language is simple, and its documentation can be interactively used by typing the *help* command.

If your or another user's script is running, the *Running* box will be checked preventing new scripts from being run and preventing the "Reset GPIO settings" button from working. Updates on the progress of the script are sent to all users. It would be easy for you to change the Node.js code to have the "Reset GPIO settings" button always work, but then you should change the code so that pressing the button would [remove all scheduled actions](https://www.w3schools.com/jsref/met_win_settimeout.asp).

The code finds any improper syntax before starting to run the first line of your script. If improper syntax is found, the code will not run and the user (and not other users) will instead receive details on how to fix their script. This output of details will work even if another script is running, though it may get clobbered by the output from the script.

If you want to control a different servo motor or motors (or control the one I used differently), search for all instances of *pinServo* in all of the JavaScript files. If you want to control a different DC motor or motors (or control the one I used differently), search for all instances of *pinMotor* in all of the JavaScript files.

If you want to create a new command (such as *pause* or *say*), create its file in the *commands* folder. In the file, export *errorCheck*, *run*, and *config*. See existing command files for guidance. Your command and any arguments should be lowercase because the .toLowerCase() method is used on the user's script.

![screenshotScript](screenshotScript.jpg)
