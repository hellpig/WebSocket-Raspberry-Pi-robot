# WebSocket-Raspberry-Pi-robot
Control motors, speak using a speaker, and view a webcam. A headless Raspberry Pi creates a web server that allows multiple users to control the robot.

Control a Raspberry-Pi-powered robot over the Internet or over any network via a WebSocket. I use *pigpio* to control a servo motor and motor driver via Raspberry Pi's pins, including hardware PWM on GPIO12 and GPIO13. I use *child_process* to speak via *espeak* and USB speakers. Install *espeak* via: *sudo apt install espeak* . I also can display video from a webcam. The first step to setting up a webcam server is installing *motion* via: *sudo apt install motion* .

The Raspberry Pi will run Node.js code. Install Node.js and required modules via...
```
sudo apt install nodejs npm
npm install socket.io
npm install pigpio
```

Run it via: *sudo node webserver.js* . Both *pigpio* and *halt* require sudo. I recommend using *systemctl* to start the code at startup (*sudo* then not needed since *systemctl* is run as root). You can also automatically start the *motion* server via *systemctl*.

Once the code is running, just type the Pi's IP address into the web browser of any device that has access to that IP address! The following should appear...

![sample image](screenshot.jpg)

The code runs a servo motor that connects to a geared DC motor to control the front wheels. The hardware we used...
- Raspberry Pi 3B
- DRV8833 motor driver (Adafruit sells one in a nice breakout board)
- dual-shaft geared DC motor with a wheel attached on each side. An L bracket was used to connect it to the servo motor.
- $13 USB speakers from Amazon
- $5 USB webcam from Amazon
- Ayeway PD-2620W battery pack. The 26,800 mAh is way more than we need, and we only used the 5 volts, which has a 3 amp maximum. USB cables were used to power things. The cables can be spliced to more convenient wires that are thick and short enough to carry requires current. Grounds between USB cables were connected on a mini breadboard (the same one that had the DRV8833) to create a common ground.
- 2 rigid (non-swivel) casters with a wheel diameter of 32 mm
