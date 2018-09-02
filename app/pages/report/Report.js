'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';

import InputMask from 'react-input-mask';
import Dropdown from 'react-dropdown';

import DatePicker from 'react-datepicker';
import moment from 'moment';

import {CSVLink, CSVDownload} from 'react-csv';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class Report extends React.Component {
  constructor() {
    super();
    this.state = {
        today: moment(),
        momentDtEnsaio: moment(),
        key: undefined,
        selectedIndexes: [],
        materiaisAux: [],
        materiais: [],
        optionsMalterial: [],
        material: undefined,
        customersAux: [],
        customers: [],
        optionsCustomers: [],
        customer: undefined,
        manufacturesAux: [],
        manufactures: [],
        filters: {},
        optionsManufactures: [],
        manufactur:  undefined,
        dataInicial:  undefined,
        dataFinal: undefined,
        tipoTeste: undefined,
        equipamento: undefined,
        calibracao: undefined
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));
    Ipc.send('materiais');
    Ipc.on('materiais', this._handleExistingMateriais.bind(this));
    Ipc.send('clientes');
    Ipc.on('clientes', this._handleExistingClientes.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleExistingMaterial = () => this._handleExistingMaterial();
    this.handleExistingCustomer = () => this._handleExistingCustomer();
    this.handleDownloadPdf = () => this._handleDownloadPdf();
    this.handlerLaudos = (response) => this._handlerLaudos(response);
    this.handlerVoltage = (response) => this._handlerVoltage(response);
    this.handlerManufactur = (response) => this._handlerManufactur(response);
    this.handlerMaterial = (response) => this._handlerMaterial(response);
    this.handlerCustomer = (response) => this._handlerCustomer(response);

    this.onChangedataInicial = this.onChangedataInicial.bind(this);
    this.onChangedataFinal = this.onChangedataFinal.bind(this);
    this.onChangeTipoTeste = this.onChangeTipoTeste.bind(this);
    this.onChangeEquipamento = this.onChangeEquipamento.bind(this);
    this.onChangeCalibracao = this.onChangeCalibracao.bind(this);

    this.onSelect = this._onSelect.bind(this);
    this.onSelectMaterial = this._onSelectMaterial.bind(this);
    this.onSelectCustomer = this._onSelectCustomer.bind(this);
  }

  _handleExistingKey(event, payload) {
    this.setState({ key: payload }, () => { 
      this.handleExistingMaterial(); 
    });
  }

  _handleExistingFabricantes(event, payload) {
    this.setState({ manufacturesAux: payload });
  }

  _handleExistingMateriais(event, payload) {
    this.setState({ materiaisAux: payload });
  }

  _handleExistingClientes(event, payload) {
    this.setState({ customersAux: payload });
  }

  _handleClear() {
    this.setState({ 
      tensao: undefined,
      customer: undefined,
      manufactur: undefined,
      material: undefined,
      dataInicial:  undefined,
      dataFinal: undefined,
      appraisal: {
        material: "",
        tensao: {
          codigo: "",
          teste: "",
        },
        cliente: {
          cnpj: ""
        },
        resultado: false,
        correnteFuga: "",
        unidade: "",
        fabricante: {
          cnpj: ""
        },
        numeroSerieFabricante: "",
        numeroSeta: "",
        dataInicial: "",
        dataFinal: ""
      }
    });
    this.onRowsDeselected();
  }

  _handleDownloadPdf() {
    let cnpj = undefined;
    if (this.state.customer != undefined){
      cnpj = this.state.customer.value;
    }
    let material = ' ';
    if (this.state.material != undefined){
      material = this.state.material.value;
    }
    let dataInicial = this.state.dataInicial == null ? ' ' : this.state.dataInicial;
    let dataFinal = this.state.dataFinal == null ? ' ' : this.state.dataFinal;
    let tipoTeste = this.state.tipoTeste;
    let equipamento = this.state.equipamento;
    let calibracao = this.state.calibracao;
    if (cnpj == undefined || cnpj == ""){
      let x = document.getElementById("snackbar");
      x.innerText = 'Selecione um cliente!';
      x.classList.add("error");
      x.classList.add("show");
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);

      return;
    }

    let path = cnpj + '/material/' + material + '/data-inicial/' + 
          dataInicial + '/data-final/' + dataFinal + '/tipo-teste/' + tipoTeste +
          '/equipamento/' + equipamento + '/calibracao/' +  calibracao;

    ServiceRequest.downloadFile('report/pdf/', path, this.state.key);
  }

_handleExistingCustomer() {
  let scope = this;
  ServiceRequest.connect('clientes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    this.handlerCustomer(response);
  })
  .catch(function(err) {
    scope.handlerCustomer(scope.state.customersAux);
  }); 
}

_handlerCustomer(response){
  let optionsCustomers = [];
  response.forEach(function(customer) {
    optionsCustomers.push({ value: customer.cnpj, label: customer.name });
  });

  this.setState({ customers: response, optionsCustomers: optionsCustomers});
}

_handleExistingMaterial() {
  let scope = this;
  ServiceRequest.connect('materiais', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    this.handlerMaterial(response);
  })
  .catch(function(err) {
    scope.handlerMaterial(scope.state.materiaisAux);
  }); 
}

_handlerMaterial(response){
  let optionsMaterial = [];
    response.forEach(function(material) {
      optionsMaterial.push({ value: material.nome, label: material.nome });
    });

    this.setState({ materiais: response, optionsMaterial: optionsMaterial});
    this.handleExistingCustomer();
}

onChangedataInicial(date){
  this.setState({dataInicial: date});
}

onChangedataFinal(date){
  this.setState({dataFinal: date});
}

onChangeTipoTeste(event) {

  this.setState({tipoTeste: event.target.value});
}

onChangeEquipamento(event) {
  this.setState({equipamento: event.target.value});
}

onChangeCalibracao(event) {
  this.setState({calibracao: event.target.value});
}

_onSelect (option) {
  let appraisal = this.state.appraisal;
  let tensao;
  tensao = this.state.tensoes.filter(function (tensao) {
    return tensao.id == option.value;
  });
  appraisal.tensao = tensao[0];
  appraisal.correnteFuga = tensao[0].correnteFuga[0];
  this.setState({appraisal: appraisal, tensao: option})
}

_onSelectCustomer (option) {
  let customer;
  customer = this.state.customers.filter(function (customer) {
    return customer.cnpj == option.value;
  });
  this.setState({customer: option})
}

_onSelectManufactur (option) {
  let manufactur;
  manufactur = this.state.manufactures.filter(function (manufactur) {
    return manufactur.cnpj == option.value;
  });
  this.setState({manufactur: option})
}

_onSelectMaterial (option) {
  let material;
  material = this.state.materiais.filter(function (material) {
    return material.nome == option.value;
  });
 
  this.setState({material: option});
}

render () {
    const tags = this.state.tags;
    const suggestions = this.state.suggestions;

    return (    
      <div>
        <div style={styles.content}>
            <form>
            <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Cliente:</h5>
                  <Dropdown 
                            options={this.state.optionsCustomers} onChange={this.onSelectCustomer} 
                            value={this.state.customer} placeholder="Informe o cliente" />
                </div>
                <div className="col-sm-3">
                  <h5>Material:</h5>
                  <Dropdown 
                            options={this.state.optionsMaterial} onChange={this.onSelectMaterial} 
                            value={this.state.material} placeholder="Informe o material" />
                </div>
                <div className="col-sm-3">
                  <h5>Data Inicial:</h5>
                  <DatePicker
                    className="form-control"
                    locale="pt-br"
                    selected={this.state.dataInicial}
                    onChange={this.onChangedataInicial}/> 
                </div>
                <div className="col-sm-3">
                  <h5>Data Final:</h5>
                  <DatePicker
                    className="form-control"
                    locale="pt-br"
                    selected={this.state.dataFinal}
                    onChange={this.onChangedataFinal}/> 
                </div>
            </div>
            <div className="form-group row">
              <div className="col-sm-6">
                <h5>Tipo de teste:</h5>
                <input className="form-control"
                        placeholder={this.state.tipoTeste ? "" : "Informe o tipo de teste"} 
                        value={this.state.tipoTeste} 
                        onChange={this.onChangeTipoTeste} type="text" /> 
              </div>
              <div className="col-sm-3">
                <h5>Equipamento:</h5>
                <input className="form-control"
                        placeholder={this.state.equipamento ? "" : "Informe o equipamento"} 
                        value={this.state.equipamento} 
                        onChange={this.onChangeEquipamento} type="text" /> 
              </div>
              <div className="col-sm-3">
                <h5>Calibração:</h5>
                <input className="form-control"
                        placeholder={this.state.calibracao ? "" : "Informe a calibração"} 
                        value={this.state.calibracao} 
                        onChange={this.onChangeCalibracao} type="text" /> 
              </div>
            </div>    
            <div id="snackbar"></div>
            <button type="button" style={styles.button} className="btn btn-light" onClick={this.handleClear}>Limpar</button>
            <button type="button" style={styles.button} className="btn btn-success" onClick={this.handleDownloadPdf}>Exportar Laudos</button>
            </form>
         </div>   
      </div>
    )
  }
}

const styles = {
    content : {
      position                   : 'absolute',
      top                        : '50px',
      left                       : '40px',
      right                      : '40px',
      bottom                     : '40px',
      border                     : '1px solid #ccc',
      background                 : '#fff',
      overflow                   : 'auto',
      WebkitOverflowScrolling    : 'touch',
      borderRadius               : '4px',
      outline                    : 'none',
      padding                    : '20px'
    },
    button : {
      position                   : 'relative',
      right                      : '10px',
      margin                     : '10px'
    },
    downloadPDF: {
      border:'none',
      backgroundColor: '#8dc63f',
      fontSize: 14,
      fontWeight: 500,
      height: 20,
      marginLeft: '10px',
      padding: '0 48px',
      borderRadius: 5,
      color: '#fff'
    },
    download : {
      backgroundColor: '#8dc63f',
      fontSize: 14,
      fontWeight: 500,
      height: 52,
      padding: '0 48px',
      borderRadius: 5,
      color: '#fff'
    }
};

  
ReactDOM.render(<Report/>, document.getElementById('main'));