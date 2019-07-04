const electron = require("electron");
const url = require("url");
const path = require("path");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs = require("fs");
const os = require("os");

//slideshow functionalities
var SlideShow = require("slideshow");
var slideshow = new SlideShow("powerpoint");

//for sending key presses to control zoom features
var ks = require("node-key-sender");

//for keeping key delays
var sleep = require("system-sleep");

//connecting to the firebase
var firebase = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

//socket.io connection
// var api = require('express')();
// var http = require('http').createServer(api);
// var io = require('socket.io')(http);

//initialize the firebase connection
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://debraversion1-vrjlpp.firebaseio.com/"
});

//get the dip analysis report to localhost:3000
// api.get('/dipAnalysis', function (req, res) {
//     res.sendFile(__dirname + '/templates/dipAnalysis.html');
// });

// //get the action items report to localhost:3000
// api.get('/actionItems', function (req, res) {
//     res.sendFile(__dirname + '/templates/actionItems.html');
// });

// //done when socket.io connects to the client
// io.on('connection', function (socket) {
//     //io.emit('chat message', "hello");
//     console.log("Socket is connected.")
// });

//var d3command;

//access the data from the firebase
var db = firebase.database();
var ref = db.ref("data");
ref.on("value", function(snapshot) {
  var inter = snapshot.val();
  doSomething(inter.text);
  // d3command = inter.text;
  console.log("command", inter.text);
  // io.emit('d3command', inter.text)
});

let mainWindow;
let transcript;

//for getting windows details and focusing current program
var processWindows = require("node-process-windows");

//listen for the app to be ready
app.on("ready", function() {
  //createWindow();
  console.log("Electron is up and running!");
});

//html electron http fix
app.on("certificate-error", function(
  event,
  webContents,
  url,
  error,
  certificate,
  callback
) {
  event.preventDefault();
  callback(true);
});

//get the transcript value and do the according function
function doSomething(command) {
  transcript = command;
  if (transcript == "start PowerPoint") {
    startPowerpoint();
  } else if (transcript == "start presentation") {
    startPresentation();
  } else if (transcript == "next slide") {
    nextSlide();
  } else if (transcript == "previous slide") {
    prevSlide();
  } else if (transcript == "pause presentation") {
    pausePresentation();
  } else if (transcript == "end presentation") {
    endPresentation();
  } else if (transcript.includes("go to slide")) {
    goToSlide(transcript);
  } else if (transcript.includes("open google report")) {
    transcript = transcript;
    var regex = /\d+/g;
    var matches = transcript.match(regex);
    addWindow("https://www.google.com", matches);
  } else if (transcript.includes("open first report")) {
    transcript = transcript;
    var regex = /\d+/g;
    var matches = transcript.match(regex);
    getWindow2(matches);
  } else if (transcript.includes("open second report")) {
    transcript = transcript;
    var regex = /\d+/g;
    var matches = transcript.match(regex);
    getWindow1(matches);
    // addWindow(url.format({
    //     pathname: path.join(__dirname, 'report3.html'),
    //     protocol: 'file:',
    //     slashes: true
    // }), matches);
  } else if (transcript == "zoom center") {
    zoomCenter();
  }
  // else if (transcript == "zoom to quadrant 1") {
  //     zoomQuadrant1()
  // }
  // else if (transcript == "zoom to quadrant 2") {
  //     zoomQuadrant2()
  // }
  // else if (transcript == "zoom to quadrant 3") {
  //     zoomQuadrant3()
  // }
  // else if (transcript == "zoom to quadrant 4") {
  //     zoomQuadrant4()
  // }
  else if (transcript == "zoom out") {
    zoomOut();
  }
  // else if (transcript == "show me distributor 1 analysis") {
  //     io.emit("distOne", "hello world")
  // }
  // else if (transcript == "show me distributor 2 analysis") {
  //     io.emit("distTwo", "second text")
  // }
  // else if (transcript == "assign the action items") {
  //     io.emit("assignActions", "assign")
  // }
  else {
    console.log("Sorry, that command was not recognized.");
  }
}

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    frame: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      plugins: true,
      webviewTag: true
    }
  });
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/templates/homePage/index.html`);
  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    app.quit();
  });
}

//open reports in a new window on a particular screen
function addWindow(pageurl, screenNumber) {
  //find the number of external monitors and gets the bounds
  let displays = electron.screen.getAllDisplays();
  let externalDisplay = displays.find(display => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });
  //console.log(typeof screenNumber);
  if (screenNumber == null || screenNumber == 1) {
    newWindow = new BrowserWindow({
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    newWindow.maximize();
    // and load the url
    newWindow.loadURL(pageurl);
    //newWindow.webContents.openDevTools();
    // Emitted when the window is closed.
    newWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      newWindow = null;
    });
  } else if (screenNumber > 1) {
    //calculates the bounds of the required monitor and then places the new window in that respective screen
    xValue = externalDisplay.bounds.x;
    yValue = externalDisplay.bounds.y;
    newWindow = new BrowserWindow({
      x: xValue * (screenNumber - 1) + 50,
      y: yValue * (screenNumber - 1) + 50,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    newWindow.maximize();
    // and load the url
    newWindow.loadURL(pageurl);
    // Emitted when the window is closed.
    newWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      newWindow = null;
    });
  }
}

//get the action items page
function getWindow1(screenNumber) {
  let displays = electron.screen.getAllDisplays();
  let externalDisplay = displays.find(display => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });
  //console.log(typeof screenNumber);
  if (screenNumber == null || screenNumber == 1) {
    getWindow = new BrowserWindow({
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    getWindow.maximize();
    // and load the url
    getWindow.loadURL(
      `file://${__dirname}/templates/actionItems/actionItems.html`
    );
    //getWindow.webContents.openDevTools();
    // Emitted when the window is closed.
    getWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      getWindow = null;
    });
  } else if (screenNumber > 1) {
    xValue = externalDisplay.bounds.x;
    yValue = externalDisplay.bounds.y;
    getWindow = new BrowserWindow({
      x: xValue * (screenNumber - 1) + 50,
      y: yValue * (screenNumber - 1) + 50,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    getWindow.maximize();
    // and load the url
    getWindow.loadURL(
      `file://${__dirname}/templates/actionItems/actionItems.html`
    );
    // Emitted when the window is closed.
    getWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      getWindow = null;
    });
  }
}

//get the dip analysis page
function getWindow2(screenNumber) {
  let displays = electron.screen.getAllDisplays();
  let externalDisplay = displays.find(display => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });
  //console.log(typeof screenNumber);
  if (screenNumber == null || screenNumber == 1) {
    getWindow = new BrowserWindow({
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    getWindow.maximize();
    // and load the url
    getWindow.loadURL(`file://${__dirname}/templates/dipanalysis/index.html`);
    getWindow.webContents.openDevTools();
    // Emitted when the window is closed.
    getWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      getWindow = null;
    });
  } else if (screenNumber > 1) {
    xValue = externalDisplay.bounds.x;
    yValue = externalDisplay.bounds.y;
    getWindow = new BrowserWindow({
      x: xValue * (screenNumber - 1) + 50,
      y: yValue * (screenNumber - 1) + 50,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        plugins: true,
        devTools: false
      }
    });
    //make the window fit to screen
    getWindow.maximize();
    // and load the url
    getWindow.loadURL(`file://${__dirname}/templates/dipanalysis/index.html`);
    // Emitted when the window is closed.
    getWindow.on("closed", function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      getWindow = null;
    });
  }
}

//creates window when the app is activated
app.on("activate", function() {
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//function to zoom out
function zoomOut() {
  var activeProcesses = processWindows.getProcesses(function(err, processes) {
    var pptProcesses = processes.filter(
      p => p.processName.indexOf("POWERPNT") >= 0
    );
    if (pptProcesses.length > 0) {
      processWindows.focusWindow(pptProcesses[0]);
      sleep(250);
      ks.sendKey("escape");
      sleep(250);
    }
  });
}

//function to zoom In
function zoomIn() {
  var activeProcesses = processWindows.getProcesses(function(err, processes) {
    var pptProcesses = processes.filter(
      p => p.processName.indexOf("POWERPNT") >= 0
    );
    if (pptProcesses.length > 0) {
      processWindows.focusWindow(pptProcesses[0]);
      ks.sendKey("equals");
    }
  });
}

//function to zoom to center
function zoomCenter() {
  var activeProcesses = processWindows.getProcesses(function(err, processes) {
    var pptProcesses = processes.filter(
      p => p.processName.indexOf("POWERPNT") >= 0
    );
    if (pptProcesses.length > 0) {
      processWindows.focusWindow(pptProcesses[0]);
      zoomIn();
      sleep(100);
      ks.sendKey("equals");
      sleep(100);
      ks.sendKey("equals");
    }
  });
}

// //function to zoom to quadrant 1
// function zoomQuadrant1() {
//     var activeProcesses = processWindows.getProcesses(function (err, processes) {
//         var pptProcesses = processes.filter(p => p.processName.indexOf("POWERPNT") >= 0);
//         if (pptProcesses.length > 0) {
//             processWindows.focusWindow(pptProcesses[0]);
//             var i;
//             zoomIn();
//             sleep(100);
//             ks.sendKey('equals');
//             sleep(100);
//             ks.sendKey('equals');
//             for (i = 0; i < 5; i++) {
//                 ks.sendKey('up');
//                 sleep(100);
//             }
//             for (j = 0; j < 5; j++) {
//                 ks.sendKey('left');
//                 sleep(100);
//             }
//             sleep(250);
//         }
//     })
// };

// //function to zoom to quadrant 2
// function zoomQuadrant2() {
//     var activeProcesses = processWindows.getProcesses(function (err, processes) {
//         var pptProcesses = processes.filter(p => p.processName.indexOf("POWERPNT") >= 0);
//         if (pptProcesses.length > 0) {
//             processWindows.focusWindow(pptProcesses[0]);
//             var i;
//             zoomIn();
//             sleep(100);
//             ks.sendKey('equals');
//             sleep(100);
//             ks.sendKey('equals');
//             for (i = 0; i < 5; i++) {
//                 ks.sendKey('up');
//                 sleep(100);
//             }
//             for (j = 0; j < 5; j++) {
//                 ks.sendKey('right');
//                 sleep(100);
//             }
//             sleep(250);
//         }
//     })
// };

// //function to zoom to quadrant 3
// function zoomQuadrant3() {
//     var activeProcesses = processWindows.getProcesses(function (err, processes) {
//         var pptProcesses = processes.filter(p => p.processName.indexOf("POWERPNT") >= 0);
//         if (pptProcesses.length > 0) {
//             processWindows.focusWindow(pptProcesses[0]);
//             var i;
//             zoomIn();
//             sleep(100);
//             ks.sendKey('equals');
//             sleep(100);
//             ks.sendKey('equals');
//             for (i = 0; i < 5; i++) {
//                 ks.sendKey('down');
//                 sleep(100);
//             }
//             for (j = 0; j < 5; j++) {
//                 ks.sendKey('left');
//                 sleep(100);
//             }
//             sleep(250);
//         }
//     })
// };

// //function to zoom to quadrant 4
// function zoomQuadrant4() {
//     var activeProcesses = processWindows.getProcesses(function (err, processes) {
//         var pptProcesses = processes.filter(p => p.processName.indexOf("POWERPNT") >= 0);
//         if (pptProcesses.length > 0) {
//             processWindows.focusWindow(pptProcesses[0]);
//             var i;
//             zoomIn();
//             sleep(100);
//             ks.sendKey('equals');
//             sleep(100);
//             ks.sendKey('equals');
//             for (i = 0; i < 5; i++) {
//                 ks.sendKey('down');
//                 sleep(100);
//             }
//             for (j = 0; j < 5; j++) {
//                 ks.sendKey(
//                     'right');
//                 sleep(100);
//             }
//             sleep(250);
//         }
//     })
// };

//starts the presentation
function startPowerpoint() {
  slideshow.boot().then(function() {
    slideshow.open("sample.pptx");
  });
  // .then(function () { slideshow.start() })
}

//starts the slideshow
function startPresentation() {
  slideshow.start();
}

//pauses the slideshow
function pausePresentation() {
  slideshow.pause();
}

//ends the slideshow
function endPresentation() {
  slideshow.stop();
}

//makes the powerpoint go to the next slide
function nextSlide() {
  slideshow.start();
  slideshow.next();
}

//makes the powerpoint to go to the previous slide
function prevSlide() {
  slideshow.start();
  slideshow.prev();
}

//makes the slide to go to a specific slide
function goToSlide(transcript) {
  transcript = transcript;
  var regex = /\d+/g;
  var matches = transcript.match(regex);
  console.log(matches);
  slideshow.start();
  slideshow.goto(matches);
}

//express app listens on 3000
// http.listen(3000, function () {
//     console.log('listening on *:3000');
// });
