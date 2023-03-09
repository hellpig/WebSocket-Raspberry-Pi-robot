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
