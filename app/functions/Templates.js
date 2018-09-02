const url = require('url')
const path = require('path')

function adminTemplate(mainWindow, dirname){
    return [
        {
           label: 'Laudos',
           submenu: [
              {
                 role: 'create',
                 label: 'registrar',
                 click () {
                  mainWindow.loadURL(url.format ({
                    pathname: path.join(dirname, '/app/pages/laudos/index.html'),
                    protocol: 'file:',
                    slashes: true
                  }))
                 }
              },{
                role: 'export',
                label: 'exportar',
                click () {
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/report/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             }
           ]
        },
        {
          label: 'Cadastros',
          submenu: [
             {
                role: 'fabricantes',
                label: 'Fabricantes',
                click () {
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/manufactur/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             },
             {
                role: 'materiais',
                label: 'Materiais',
                click () {
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/material/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             },
             {
                role: 'tensoes',
                label: 'Tensões',
                click () {
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/voltage/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             },
             {
                role: 'clientes',
                label: 'Clientes',
                click () {
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/customer/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             }
          ]
       },
       {
          label: 'Ajuda',
          role: 'help',
          submenu: [
             {
                label: 'Leia mais'
             }
          ]
       }
      ]
}

function regularTemplate(mainWindow, dirname){
    return [
        {
            label: 'Laudos',
            submenu: [
              {
                  role: 'create',
                  label: 'registrar',
                  click () {
                  mainWindow.loadURL(url.format ({
                    pathname: path.join(dirname, '/app/pages/appraisal/index.html'),
                    protocol: 'file:',
                    slashes: true
                  }))
                  }
              },{
                role: 'export',
                label: 'exportar',
                click () {
                  console.log(path.join(dirname, '/app/pages/report/index.html'));
                 mainWindow.loadURL(url.format ({
                   pathname: path.join(dirname, '/app/pages/report/index.html'),
                   protocol: 'file:',
                   slashes: true
                 }))
                }
             }
            ]
        },
        {
           label: 'Ajuda',
           role: 'help',
           submenu: [
              {
                 label: 'Leia mais'
              }
           ]
        }
      ]
}

module.exports = {  
    adminTemplate  : adminTemplate,
    regularTemplate: regularTemplate
}