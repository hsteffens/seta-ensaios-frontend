const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const Menu = electron.Menu
const MenuItem = electron.MenuItem
const net = electron.net

const url = require('url')
const path = require('path')

const fs = require('fs')
const rimraf = require('rimraf');

const Templates = require('./app/functions/Templates');

let passoword = undefined;
let idLaudo = undefined;
let mainWindow = null;
let laudos = null;

function createWindow() {
  mainWindow = new BrowserWindow({width: 900, height: 750})
  mainWindow.loadURL(url.format ({
     pathname: path.join(__dirname, 'index.html'),
     protocol: 'file:',
     slashes: true
  }));
}

app.on('ready', () => {
  console.log('The Seta reports is starting up...');

  sincronizeServer();

  requestLaudos();
  requestTensoes();
  requestFabricantes();
  requestMateriais();
  requestClientes();

  createWindow();

});
 
ipc.on('close', () => {
  app.quit();
});

app.on('before-quit', () => {
  sincronizeServer();
});

ipc.on('admin_login', (event, payload) => {
    passoword = payload;
    let menu = Menu.buildFromTemplate(Templates.adminTemplate(mainWindow, __dirname));
    Menu.setApplicationMenu(menu);
    mainWindow.loadURL(url.format ({
      pathname: path.join(__dirname, '/app/pages/laudos/index.html'),
      protocol: 'file:',
      slashes: true
    }));
});

ipc.on('add_items_laudo', (event, payload) => {
  idLaudo = payload;
  let menu = Menu.buildFromTemplate(Templates.adminTemplate(mainWindow, __dirname));
  Menu.setApplicationMenu(menu);
  mainWindow.loadURL(url.format ({
    pathname: path.join(__dirname, '/app/pages/appraisal/index.html'),
    protocol: 'file:',
    slashes: true
  }));
});

ipc.on('key', (event, payload) => {
    mainWindow.webContents.send('key', passoword);
});

ipc.on('selected_laudo', (event, payload) => {
  mainWindow.webContents.send('selected_laudo', idLaudo);
});

ipc.on('regular_login', (event, payload) => {
  let menu = Menu.buildFromTemplate(Templates.regularTemplate(mainWindow, __dirname));
  Menu.setApplicationMenu(menu);
  mainWindow.loadURL(url.format ({
    pathname: path.join(__dirname, '/app/pages/laudos/index.html'),
    protocol: 'file:',
    slashes: true
  }));
});

ipc.on('data', (event, payload) => {
    // receive the payload and write to the filesystem later
    if (laudos == null) {
        laudos = [];
    }
    laudos = laudos.concat(payload);
});

const notification = (title, message) => {
    const WindowsBalloon = require('node-notifier').WindowsBalloon;

    var notifier = new WindowsBalloon({
      withFallback: false, // Try Windows Toast and Growl first? 
      customPath: void 0 // Relative/Absolute path if you want to use your fork of notifu 
    });
        
    notifier.notify({
      title: title,
      message: message,
      sound: true, // true | false. 
      time: 5000, // How long to show balloon in ms 
      wait: false
    });
  }

  const request = (path, param) => {
    return new Promise(function(res, rej) {
      const request = net.request({
        method: 'POST',
        protocol: 'http:',
        hostname: 'localhost',
        port: 8080,
        path: '/seta-reports-backend/api/auth/passoword/' + param
      })
  
      request.on('response', (response) => {
        if (`${response.statusCode}` == 200){
          var isValid = false;
          response.on('data', (chunk) => {
            if (JSON.parse(`${chunk}`).status == 'SUCCESS'){
              isValid = true;
            }
            res(isValid);
          })
        } else {
          res(false);
        }
      });

      request.end();
      
    });
}

const requestLaudos = () => {
    const request = net.request({
      method: 'GET',
      protocol: 'http:',
      hostname: 'localhost',
      headers: { "Content-Type": "Application/json", "connection": "keep-alive", },
      port: 8080,
      path: '/seta-reports-backend/api/laudos'
    });
    request.on('error', (error) => {});
    request.on('response', (response) => {
      
      if (`${response.statusCode}` == 200){
        let body = "";
        response.on('data', (chunk) => {
          body += `${chunk}`;
        });
        setTimeout(function(){ 
          if (JSON.parse(body).status == 'SUCCESS'){
            writeFolder('laudos', JSON.parse(body).result);
          }
        }, 1000);
      }
    });

    request.end();
}

ipc.on('laudos', (event, payload) => {
  let laudos = sendExistingData('laudos');
  mainWindow.webContents.send('laudos', laudos);
});

ipc.on('laudos_change', (event, payload) => {
  let laudos_change = sendExistingData('laudos_change');
  if (laudos_change == undefined){
    laudos_change = [];
  }
  laudos_change: laudos_change.filter(function (laudo) {
    return (laudo.id != payload.id) || (payload.id == undefined && laudo.numeroSeta != payload.numeroSeta);
  });
  laudos_change.push(payload);
  writeFolder('laudos_change', laudos_change);

  let laudos = sendExistingData('laudos');
  laudos = laudos.filter(function (laudo) {
    return laudo.id != payload.id || (payload.id == undefined && laudo.numeroSeta != payload.numeroSeta);
  });
 
  laudos.push(payload);
  writeFolder('laudos', laudos);
  mainWindow.webContents.send('laudos', laudos);
});

ipc.on('laudos_removed', (event, payload) => {
  let laudos_removed = sendExistingData('laudos_removed');
  if (laudos_removed == undefined){
    laudos_removed = [];
  }
  if (payload.id != undefined){
    laudos_removed.push(payload);
  }
  writeFolder('laudos_removed', laudos_removed);

  let laudos = sendExistingData('laudos');
  laudos = laudos.filter(function (laudo) {
    return laudo.id != payload.id || (payload.id == undefined && laudo.numeroSeta != payload.numeroSeta);
  });
 
  writeFolder('laudos', laudos);
  mainWindow.webContents.send('laudos', laudos);
});

const requestTensoes = () => {
  const request = net.request({
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    port: 8080,
    path: '/seta-reports-backend/api/tensoes'
  });
  request.on('error', (error) => {});
  request.on('response', (response) => {
    if (`${response.statusCode}` == 200){
      response.on('data', (chunk) => {
        if (JSON.parse(`${chunk}`).status == 'SUCCESS'){
          writeFolder('tensoes', JSON.parse(`${chunk}`).result);
        }
      })
    }
  });

  request.end();

}

ipc.on('tensoes', (event, payload) => {
  let laudos = sendExistingData('tensoes');
  mainWindow.webContents.send('tensoes', laudos);
});

const requestFabricantes = () => {
  const request = net.request({
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    port: 8080,
    path: '/seta-reports-backend/api/fabricantes'
  });
  request.on('error', (error) => {});
  request.on('response', (response) => {
    if (`${response.statusCode}` == 200){
      response.on('data', (chunk) => {
        if (JSON.parse(`${chunk}`).status == 'SUCCESS'){
          writeFolder('fabricantes', JSON.parse(`${chunk}`).result);
        }
      })
    }
  });

  request.end();
}

ipc.on('fabricantes', (event, payload) => {
  let laudos = sendExistingData('fabricantes');
  mainWindow.webContents.send('fabricantes', laudos);
});

const requestMateriais = () => {
  const request = net.request({
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    port: 8080,
    path: '/seta-reports-backend/api/materiais'
  });
  request.on('error', (error) => {});
  request.on('response', (response) => {
    if (`${response.statusCode}` == 200){
      response.on('data', (chunk) => {
        if (JSON.parse(`${chunk}`).status == 'SUCCESS'){
          writeFolder('materiais', JSON.parse(`${chunk}`).result);
        }
      })
    }
  });

  request.end();
}

ipc.on('materiais', (event, payload) => {
  let laudos = sendExistingData('materiais');
  mainWindow.webContents.send('materiais', laudos);
});

const requestClientes = () => {
  const request = net.request({
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    port: 8080,
    path: '/seta-reports-backend/api/clientes'
  });
  request.on('error', (error) => {});
  request.on('response', (response) => {
    if (`${response.statusCode}` == 200){
      response.on('data', (chunk) => {
        if (JSON.parse(`${chunk}`).status == 'SUCCESS'){
          writeFolder('clientes', JSON.parse(`${chunk}`).result);
        }
      })
    }
  });

  request.end();
}

ipc.on('clientes', (event, payload) => {
  let laudos = sendExistingData('clientes');
  mainWindow.webContents.send('clientes', laudos);
});

const writeFolder = (path, param) => {
  let file = `${app.getPath('documents')}\\SetaEnsaios`;
  ensureDirExists(file);

  file += `\\` + path +`.txt`;
  fs.writeFileSync(file, JSON.stringify(param));
};

const sendExistingData = (path) => {
  const file = `${app.getPath('documents')}\\SetaEnsaios`;
  ensureDirExists(file);
  
  if (!fs.existsSync(file + '\\' + path + '.txt')) { 
    return undefined;
  }

  let data = fs.readFileSync(file + '\\' + path + '.txt', 'utf8');

  return JSON.parse(data);
}

const ensureDirExists = (path) => {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
};

const sincronizeServer = () => {
  addNewLaudos();
  removeLaudos();
}

const addNewLaudos = () => {
  let laudos_change = sendExistingData('laudos_change');
  if (laudos_change == undefined){
    laudos_change = [];
  }
  laudos_change.forEach(function(laudo) {
    const request = net.request({
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      protocol: 'http:',
      hostname: 'localhost',
      port: 8080,
      path: '/seta-reports-backend/api/laudos/create'
    });
    request.on('error', (error) => {});
    request.on('response', (response) => {});
    request.write(JSON.stringify(laudo));
    request.end();
  });

  let path = `${app.getPath('documents')}\\SetaEnsaios\\laudos_change.txt`;
  if (fs.existsSync(path)) { 
    setTimeout(function(){ 
      fs.unlinkSync(path); 
    }, 10000);
  }
}

const removeLaudos = () => {
  let laudos_removed = sendExistingData('laudos_removed');
  if (laudos_removed == undefined){
    laudos_removed = [];
  }
  laudos_removed.forEach(function(laudo) {
    const request = net.request({
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'DELETE',
      protocol: 'http:',
      hostname: 'localhost',
      port: 8080,
      path: '/seta-reports-backend/api/laudos/' + laudo.id
    });
    request.on('error', (error) => {});
    request.on('response', (response) => {});
    request.end();
  });

  let path = `${app.getPath('documents')}\\SetaEnsaios\\laudos_removed.txt`;
  if (fs.existsSync(path)) { 
    setTimeout(function(){ 
      fs.unlinkSync(path); 
    }, 10000);
  }
}
