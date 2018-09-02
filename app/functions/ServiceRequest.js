
function connect(path, param, method, key,payload) {
    return new Promise(function(res, rej) {
      fetch('http://localhost:8080/seta-reports-backend/api/' + path + param,
        { 
          method: method,
          'dataType': 'json',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': key
          },
          body: JSON.stringify(payload)
        })
      .then((response) =>
          response.json()) .then((responseData) => {
              var data = JSON.stringify(responseData);
              res(JSON.parse(data));
      }).catch((err) => {
        rej(err);
      });
    });
}

function downloadFile(path, param, key) {
  let url = 'http://localhost:8080/seta-reports-backend/api/' + path + param;
  return fetch(url, {
              method: 'GET',
              headers: new Headers({
                  "Authorization": key
              })
          })
          .then(response => response.blob())
          .then(blob => {
              var url = window.URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = "laudos.pdf";
              a.click();                    
          });
}

function setPassword(payload){
  this.TOKEN = payload;
}

module.exports = {  
  connect: connect,
  downloadFile: downloadFile,
  setPassword: setPassword,
  TOKEN: undefined
}