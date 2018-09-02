'use babel';
import { ipcRenderer as Ipc } from 'electron';
import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

const ServiceRequest = require('../../functions/ServiceRequest');


class Login extends Component {
  constructor() {
    super();
    this.state = { 
        password : undefined
    };
    this.handleAdminLogin = () => this._handleAdminLogin();
    this.handleRegularLogin = () => this._handleRegularLogin();

    this.handleKeyPress = this._handleKeyPress.bind(this);
  }

  componentDidMount() {
    this._input.focus();
  }

  _handleAdminLogin() {
    let errorMsg = document.getElementById("errorMsg");
    errorMsg.style.display = "none";

    let passoword = this._input.value;
    ServiceRequest.connect('auth/passoword/', passoword, 'POST')
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        Ipc.send('admin_login', passoword);
      }else{
        document.getElementById('user_password').className = "form-group row has-error has-feedback";
        errorMsg.style.display = "block";
      }
     
    });
      
  }

  _handleRegularLogin() {
    Ipc.send('regular_login'); 
  }

  _handleKeyPress(keyboard) {
    if (keyboard.key === 'Enter') {
      keyboard.preventDefault();
      this._handleAdminLogin();
    }
    return false; 
  }

  render () {
    return (
      <div>
        <div style={styles.content}>
            <form style={styles.form}>
                <div id="user_password" className="form-group row">
                    <input className="form-control" type="password"
                        placeholder={this.state.password ? "" : "Informe a senha de administrador"} 
                        value={this.state.password} 
                        ref={(c) => this._input = c}
                        onKeyPress={this.handleKeyPress} />
                    <label id="errorMsg" className="control-label" style={styles.error}>
                      Senha inválida!
                    </label>   
                </div>
                <div className="form-group row">
                    <button type="button" 
                        style={styles.button} 
                        className="btn btn-info form-control" 
                        onClick={this.handleAdminLogin}>
                        Entrar como administrador
                    </button>
                </div>
                <div className="form-group row">
                    <button type="button" 
                        style={styles.button} 
                        className="btn btn-success form-control" 
                        onClick={this.handleRegularLogin}>
                        Entrar
                    </button>
                </div>
            </form>
         </div>   
      </div>
    )
  }
}

const styles = {
    content : {
      position                   : 'absolute',
      top                        : '25%',
      left                       : '25%',
      right                      : '25%',
      bottom                     : '25%',
      border                     : '1px solid #ccc',
      background                 : '#fff',
      overflow                   : 'auto',
      WebkitOverflowScrolling    : 'touch',
      borderRadius               : '4px',
      outline                    : 'none',
      padding                    : '20px'
    },
    form : {
        padding                    : '20px'
      },
    listar_reports : {
        position: 'absolute',
        top:      '10px',
        right: '40px'
      },
    button : {

    },
    error: {
      display: "none"
    }
};

  
ReactDOM.render(<Login/>, document.getElementById('main'));