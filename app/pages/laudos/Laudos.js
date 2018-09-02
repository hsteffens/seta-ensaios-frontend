'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';
import Dropdown from 'react-dropdown';

import DatePicker from 'react-datepicker';
import moment from 'moment';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class DateFormatter extends React.Component {

  render() {
    const date = new Date(this.props.value).toLocaleDateString();;
    return (
        <div>
          {date}
        </div>
    );
  }
}

class Laudos extends React.Component {
  constructor() {
    super();
    this.state = {
        key: undefined,
        momentDtLaudo: moment(),
        collumns: [],
        laudos: [],
        laudosFiltered: [],
        customersAux: [],
        customers: [],
        optionsCustomers: [],
        customer: undefined,
        dataLaudo:  undefined,
        tipoTeste: undefined,
        equipamento: undefined,
        calibracao: undefined,
        selectedIndexes: [],
        laudo: {
          dataLaudo: "",
          cliente : {
            cnpj: ""
          },
          tipoTeste: undefined,
          equipamento: undefined,
          calibracao: undefined
        }
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));
    Ipc.send('clientes');
    Ipc.on('clientes', this._handleExistingClientes.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleModify = () => this._handleModify();
    this.handleRemove = () => this._handleRemove();
    this.handleExistingCustomer = () => this._handleExistingCustomer();
    this.handlerCustomer = (response) => this._handlerCustomer(response);
    this.handleExistingData = () => this._handleExistingData();
    this.handleAddRemoveItems = () => this._handleAddRemoveItems();
    this.handleDownloadPdf = () => this._handleDownloadPdf();

    this.onChangedataLaudo = this.onChangedataLaudo.bind(this);
    this.onChangeTipoTeste = this.onChangeTipoTeste.bind(this);
    this.onChangeEquipamento = this.onChangeEquipamento.bind(this);
    this.onChangeCalibracao = this.onChangeCalibracao.bind(this);

    this.rowGetter = this.rowGetter.bind(this);
    this.onSelectCustomer = this._onSelectCustomer.bind(this);
    this.onRowsDeselected = this.onRowsDeselected.bind(this);
    this.handleFilterChange = this._handleFilterChange.bind(this);
    this.onRowsSelected = this.onRowsSelected.bind(this);
  }

  _handleExistingKey(event, payload) {
    this.setState({ key: payload }, () => { 
      this.handleExistingData(); 
    });
  }

  _handleAddRemoveItems() {
    let laudo = this.state.laudo;
    if (laudo == undefined || laudo.id == undefined || laudo.id == "") {
      let x = document.getElementById("snackbar");
      x.innerText = 'Selecione um item para edita-lo!';
      x.classList.add("error");
      x.classList.add("show");
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
      return;
    }
    Ipc.send('add_items_laudo', laudo.id);  
  }

  _handleDownloadPdf() {
    let laudo = this.state.laudo;
    let material = ' ';
    let dataInicial = ' ';
    let dataFinal = ' ';
    let tipoTeste = this.state.laudo.tipoTeste;
    let equipamento = this.state.laudo.equipamento;
    let calibracao = this.state.laudo.calibracao;

    if (laudo == undefined || laudo.id == undefined || laudo.id == "") {
      let x = document.getElementById("snackbar");
      x.innerText = 'Selecione um item para edita-lo!';
      x.classList.add("error");
      x.classList.add("show");
      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
      return;
    }

    let path = laudo.id + '/material/' + material + '/data-inicial/' + 
          dataInicial + '/data-final/' + dataFinal + '/tipo-teste/' + tipoTeste +
          '/equipamento/' + equipamento + '/calibracao/' +  calibracao;

    ServiceRequest.downloadFile('report/pdf/', path, this.state.key);
  }

  _handleExistingData() {
    ServiceRequest.connect('laudos', '', 'GET', this.state.key)
    .then(function(payload) {
      if (payload.status == 'SUCCESS') {
        return payload.result;
      }else{
        return [];
      }
    }).then((response) => {
      let columns = [
        { key: 'clienteCnpj', name: 'Cliente', filterable: true },
        { key: 'dataLaudo', name: 'Data do Laudo', filterable: true, formatter: DateFormatter },
        { key: 'calibracao', name: 'Calibração', filterable: true },
        { key: 'tipoTeste', name: 'Tipo de Teste', filterable: true },
        { key: 'equipamento', name: 'Equipamento', filterable: true }  
      ];

      let rows =[];
      response.forEach(function(laudo) {
        if (laudo.cliente != undefined){
          laudo.clienteCnpj = laudo.cliente.cnpj;
        }
        rows.push(laudo);
      });
  
      this.setState({ laudos: rows, laudosFiltered: rows, collumns: columns});
      this.handleExistingCustomer();
    })
    .catch(function(err) {
        let x = document.getElementById("snackbar");
        x.innerText = "Verifique os valores informados!";
        x.classList.add("error");
    }); 
   
  }

  _handleExistingClientes(event, payload) {
    this.setState({ customersAux: payload });
  }

  _handleClear() {
    this.setState({ 
      laudo: {
        dataLaudo: "",
        cliente : {
          cnpj: ""
        },
        tipoTeste: undefined,
        equipamento: undefined,
        calibracao: undefined
      },
      customer: undefined,
      dataLaudo:  undefined,
      tipoTeste: undefined,
      equipamento: undefined,
      calibracao: undefined
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let scope = this;
    let x = document.getElementById("snackbar");
    delete this.state.laudo.clienteCnpj;

    ServiceRequest.connect('laudos/create', '', 'POST',this.state.key ,this.state.laudo)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Laudo registrado com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      this.handleExistingData();
    }).catch(function(err) {
      if(err.message === "Failed to fetch"){
        Ipc.send('laudos_change', scope.state.appraisal);
        Ipc.on('laudos', scope.handleModifyLaudos.bind(this));
      } else {
        x.innerText = "Verifique os valores informados!";
        x.classList.add("error");
      }
       
    });
    x.classList.add("show");
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

_handleRemove(){
  let scope = this;
  let x = document.getElementById("snackbar");
  let id = this.state.laudo.id;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('laudos/', id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Laudo removido com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      this.handleClear();
      this.handleExistingData();

    }).catch(function(err) {
      if(err.message === "Failed to fetch"){
        Ipc.send('laudos_removed', scope.state.laudo);
        Ipc.on('laudos', scope.handleModifyLaudos.bind(this));
      } else {
        x.innerText = "Error: " + err;
        x.classList.add("error");
      }

    });
  }
  x.classList.add("show");
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
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

onChangedataLaudo(date){
  let laudo = this.state.laudo;
  laudo.dataLaudo = date.format("YYYY-MM-DD");

  this.setState({laudo: laudo, dataLaudo: date});
}

onChangeTipoTeste(event) {
  let laudo = this.state.laudo;
  laudo.tipoTeste = event.target.value;

  this.setState({laudo: laudo, tipoTeste: event.target.value});
}

onChangeEquipamento(event) {
  let laudo = this.state.laudo;
  laudo.equipamento = event.target.value;

  this.setState({laudo: laudo, equipamento: event.target.value});
}

onChangeCalibracao(event) {
  let laudo = this.state.laudo;
  laudo.calibracao = event.target.value;

  this.setState({laudo: laudo, calibracao: event.target.value});
}

_onSelectCustomer (option) {
  let laudo = this.state.laudo;
  let customerAux;
  customerAux = this.state.customers.filter(function (customer) {
    return customer.cnpj == option.value;
  });
  laudo.cliente = customerAux[0];
  this.setState({laudo: laudo, customer: option})


  let customer;
  customer = this.state.customers.filter(function (customer) {
    return customer.cnpj == option.value;
  });
  this.setState({customer: option})
}

rowGetter(i) {
  return this.state.laudosFiltered[i];
};

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.laudos.filter(function (laudos) {
    return laudos[filter.column.key].toString().includes(filter.filterTerm);
  })
  this.setState({ laudosFiltered: filters });
};

onRowsDeselected(){
  this.setState({selectedIndexes: []});
}

onRowsSelected(rows){ 
  let laudo = rows[0].row;

  let dtLaudo = new Date(laudo.dataLaudo);
  dtLaudo = this.state.momentDtLaudo.set({
    'year': dtLaudo.getFullYear(), 
    'month': dtLaudo.getMonth(),
    'date': dtLaudo.getDate()
  });

  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    laudo: laudo,
    customer: { value: laudo.cliente.cnpj, label: laudo.cliente.name },
    dataLaudo: dtLaudo,
    tipoTeste: laudo.tipoTeste,
    equipamento: laudo.equipamento,
    calibracao: laudo.calibracao
  });
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
                  <h5>Data Laudo:</h5>
                  <DatePicker
                    className="form-control"
                    locale="pt-br"
                    selected={this.state.dataLaudo}
                    onChange={this.onChangedataLaudo}/> 
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
            <button type="button" style={styles.button} className="btn btn-light" onClick={this.handleAddRemoveItems}>Adicionar ou remover items laudo</button>
            <button type="button" style={styles.button} className="btn btn-success" onClick={this.handleDownloadPdf}>Exportar Laudos</button>
            <button type="button" style={styles.button} className="btn btn-success" onClick={this.handleModify}>Salvar</button>
            <button type="button" style={styles.button} className="btn btn-danger" onClick={this.handleRemove}>Excluir</button>
           </form>
           <div className="col-sm-12" style={styles.table}>
              <ReactDataGrid
                columns={this.state.collumns}
                rowGetter={this.rowGetter}
                rowsCount={this.state.laudosFiltered.length}
                onAddFilter={this.handleFilterChange}
                toolbar={<Toolbar enableFilter={true}/>}
                rowSelection={{
                  showCheckbox: true,
                  enableShiftSelect: true,
                  onRowsSelected: this.onRowsSelected,
                  onRowsDeselected: this.onRowsDeselected,
                  selectBy: {
                    indexes: this.state.selectedIndexes
                  }
                }}/>
            </div>
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
    table : {
      position                   : 'relative',
      right                      : '15px'
    }
};

  
ReactDOM.render(<Laudos/>, document.getElementById('main'));