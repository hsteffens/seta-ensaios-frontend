'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';

import Dropdown from 'react-dropdown';

import DatePicker from 'react-datepicker';
import moment from 'moment';

import ToggleButton from 'react-toggle-button'

import {CSVLink, CSVDownload} from 'react-csv';

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

class Appraisal extends React.Component {
  constructor() {
    super();
    this.state = {
        today: moment(),
        momentDtEnsaio: moment(),
        idLaudo: undefined,
        key: undefined,
        collumns: [],
        responseAux: [],
        appraises: [],
        appraisesFiltered:[],
        appraisesDownload:[],
        selectedIndexes: [],
        materiaisAux: [],
        materiais: [],
        optionsMalterial: [],
        material: undefined,
        tensoesAux: [],
        tensoes: [],
        optionsVoltage: [],
        tensao: undefined,
        manufacturesAux: [],
        manufactures: [],
        filters: {},
        optionsManufactures: [],
        manufactur:  undefined,
        dataEnsaio:  undefined,
        dataReteste: undefined,
        appraisal: {
          material: "",
          tensao: {
            codigo: "",
            teste: "",
          },
          resultado: false,
          correnteFuga: "",
          unidade: "",
          fabricante: {
            cnpj: ""
          },
          numeroSerieFabricante: "",
          numeroSeta: "",
          dataEnsaio: "",
          dataReteste: ""
        }
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));
    Ipc.send('selected_laudo');
    Ipc.on('selected_laudo', this._handleSelectedLaudo.bind(this));
    Ipc.send('laudos');
    Ipc.on('laudos', this._handleExistingLaudos.bind(this));
    Ipc.send('tensoes');
    Ipc.on('tensoes', this._handleExistingTensoes.bind(this));
    Ipc.send('fabricantes');
    Ipc.on('fabricantes', this._handleExistingFabricantes.bind(this));
    Ipc.send('materiais');
    Ipc.on('materiais', this._handleExistingMateriais.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleModify = () => this._handleModify();
    this.handleRemove = () => this._handleRemove();
    this.handleExistingData = () => this._handleExistingData();
    this.handleExistingVoltage = () => this._handleExistingVoltage();
    this.handleExistingManufactur = () => this._handleExistingManufactur();
    this.handleExistingMaterial = () => this._handleExistingMaterial();
    this.handleModifyLaudos = (event, payload) => this._handleModifyLaudos(event, payload);
    this.handlerLaudos = (response) => this._handlerLaudos(response);
    this.handlerVoltage = (response) => this._handlerVoltage(response);
    this.handlerManufactur = (response) => this._handlerManufactur(response);
    this.handlerMaterial = (response) => this._handlerMaterial(response);

    this.onChangeTeste = this.onChangeTeste.bind(this);
    this.onChangeResultado = this.onChangeResultado.bind(this);
    this.onChangeCorrenteFuga = this.onChangeCorrenteFuga.bind(this);
    this.onChangeUnidade = this.onChangeUnidade.bind(this);
    this.onChangeNrSerieFabricante = this.onChangeNrSerieFabricante.bind(this);
    this.onChangeNrSeta = this.onChangeNrSeta.bind(this);
    this.onChangeDataEnsaio = this.onChangeDataEnsaio.bind(this);
    this.onChangeDataReteste = this.onChangeDataReteste.bind(this);

    this.rowGetter = this.rowGetter.bind(this);
    this.onRowsSelected = this.onRowsSelected.bind(this);
    this.onRowsDeselected = this.onRowsDeselected.bind(this);
    this.onSelect = this._onSelect.bind(this);
    this.onSelectManufactur = this._onSelectManufactur.bind(this);
    this.onSelectMaterial = this._onSelectMaterial.bind(this);
    this.handleFilterChange = this._handleFilterChange.bind(this);
  }

  _handleExistingKey(event, payload) {
    this.setState({ key: payload });
  }

  _handleSelectedLaudo(event, payload) {
    this.setState({ idLaudo: payload }, () => { 
      this.handleExistingData(); 
    });
  }

  _handleExistingLaudos(event, payload) {
    this.setState({ responseAux: payload });
  }

  _handleExistingTensoes(event, payload) {
    this.setState({ tensoesAux: payload });
  }

  _handleExistingFabricantes(event, payload) {
    this.setState({ manufacturesAux: payload });
  }

  _handleExistingMateriais(event, payload) {
    this.setState({ materiaisAux: payload });
  }

  _handleClear() {
    this.setState({ 
      tensao: undefined,
      manufactur: undefined,
      material: undefined,
      dataEnsaio:  undefined,
      dataReteste: undefined,
      appraisal: {
        material: "",
        tensao: {
          codigo: "",
          teste: "",
        },
        resultado: false,
        correnteFuga: "",
        unidade: "",
        fabricante: {
          cnpj: ""
        },
        numeroSerieFabricante: "",
        numeroSeta: "",
        dataEnsaio: "",
        dataReteste: ""
      }
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let scope = this;
    let x = document.getElementById("snackbar"); 
    delete this.state.appraisal.fabricanteCnpj;
    delete this.state.appraisal.tensaoCodigo;

    if(typeof(this.state.appraisal.resultado) != typeof(true)){
      this.state.appraisal.resultado = this.state.appraisal.resultado == 'Aprovado';
    }

    ServiceRequest.connect('laudos/' + this.state.idLaudo, '/laudos-item/create', 'POST',this.state.key ,this.state.appraisal)
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

_handleModifyLaudos(event, payload) {
  this.setState({ responseAux: payload }, () => { 
    this.handleExistingData(); 
  });
}

_handleRemove(){
  let scope = this;
  let x = document.getElementById("snackbar");
  let id = this.state.appraisal.id;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('laudos/' + this.state.idLaudo, '/laudos-item/' + id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Laudo removido com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      let appraises = this.state.appraises;
      this.setState({ 
        appraises: appraises.filter(function (appraisal) {
          return appraisal.material != id;
        })
      });
      this.handleClear();
      this.handleExistingData();

    }).catch(function(err) {
      if(err.message === "Failed to fetch"){
        Ipc.send('laudos_removed', scope.state.appraisal);
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

_handleExistingData() {
  let scope = this;
  ServiceRequest.connect('laudos/' + this.state.idLaudo, '/laudos-item', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    this.handlerLaudos(response);
  })
  .catch(function(err) {
    scope.handlerLaudos(scope.state.responseAux);
  }); 

}


_handlerLaudos(response){
  let columns = [
    { key: 'id', name: 'ID', filterable: true },
    { key: 'material', name: 'Material', filterable: true },
    { key: 'fabricanteCnpj', name: 'Fabricante', filterable: true },
    { key: 'tensaoCodigo', name: 'Tensão', filterable: true },
    { key: 'correnteFuga', name: 'Corrente Fuga', filterable: true },
    { key: 'unidade', name: 'Unidade', filterable: true },   
    { key: 'numeroSerieFabricante', name: 'Nr Série Fab.', filterable: true },
    { key: 'numeroSeta', name: 'Nr Seta', filterable: true },
    { key: 'dataEnsaio', name: 'Data Ensaio', filterable: true, formatter: DateFormatter }
  ];

  let rows =[];
  response.forEach(function(appraisal) {
    if (appraisal.fabricante != undefined){
      appraisal.fabricanteCnpj = appraisal.fabricante.cnpj;
    }
    if (appraisal.tensao != undefined){
      appraisal.tensaoCodigo = appraisal.tensao.codigo;
    }

    rows.push(appraisal);
  });

  let rowsToDownload =[];
  JSON.parse(JSON.stringify(response)).forEach(function(appraisal) {
    if (appraisal.resultado){
      appraisal.resultado = 'Aprovado';
    } else {
      appraisal.resultado = 'Reprovado';
    }
    delete appraisal.origem;

    rowsToDownload.push(appraisal);
  });


  let appraisesDownload = [];
  JSON.parse(JSON.stringify(rowsToDownload)).forEach(function(appraisal) {
    if (appraisal.fabricante != undefined){
      appraisal.fabricante = appraisal.fabricante.cnpj;
    }

    if (appraisal.tensao != undefined){
      appraisal.tensao = appraisal.tensao.codigo;
    }

    delete appraisal.fabricanteCnpj;
    delete appraisal.tensaoCodigo;
    appraisesDownload.push(appraisal);
  });

  this.setState({ appraises: rows, appraisesFiltered: rowsToDownload, collumns: columns, appraisesDownload: appraisesDownload});
  this.handleExistingVoltage();
}

_handleExistingVoltage() {
  let scope = this;
  ServiceRequest.connect('tensoes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    this.handlerVoltage(response);
  })
  .catch(function(err) {
    scope.handlerVoltage(scope.state.tensoesAux);
  }); 
}

_handlerVoltage(response){
  let optionsVoltage = [];
  response.forEach(function(tensao) {
    optionsVoltage.push({ value: tensao.id, label: tensao.codigo });
  });

  this.setState({ tensoes: response, optionsVoltage: optionsVoltage});
  this.handleExistingManufactur();
}

_handleExistingManufactur() {
  let scope = this;
  ServiceRequest.connect('fabricantes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    this.handlerManufactur(response);
  })
  .catch(function(err) {
    scope.handlerManufactur(scope.state.manufacturesAux);
  }); 
}

_handlerManufactur(response){
  let optionsManufactures = [];
  response.forEach(function(manufactur) {
    optionsManufactures.push({ value: manufactur.cnpj, label: manufactur.name });
  });

  this.setState({ manufactures: response, optionsManufactures: optionsManufactures});
  this.handleExistingMaterial();
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
}

onChangeTeste(event){
  let appraisal = this.state.appraisal;
  appraisal.tensao.teste =  event.target.value;

  this.setState({appraisal: appraisal});
}

onChangeResultado(event){
  if(event && event.length != 0){
    let appraisal = this.state.appraisal;
    appraisal.resultado =  event.filter( option => option !== this.state.appraisal.resultado )[0];
  
    this.setState({appraisal: appraisal});
  }
}

onChangeCorrenteFuga(event){
  let appraisal = this.state.appraisal;
  appraisal.correnteFuga =  event.target.value;

  this.setState({appraisal: appraisal});
}

onChangeUnidade(event){
  let appraisal = this.state.appraisal;
  appraisal.unidade =  event.target.value;

  this.setState({appraisal: appraisal});
}

onChangeNrSerieFabricante(event){
  let appraisal = this.state.appraisal;
  appraisal.numeroSerieFabricante =  event.target.value;

  this.setState({appraisal: appraisal});
}

onChangeNrSeta(event){
  let appraisal = this.state.appraisal;
  appraisal.numeroSeta = event.target.value;

  this.setState({appraisal: appraisal});
}

onChangeDataEnsaio(date){
  let appraisal = this.state.appraisal;
  appraisal.dataEnsaio = date.format("YYYY-MM-DD");

  this.setState({appraisal: appraisal, dataEnsaio: date});
}

onChangeDataReteste(date){
  let appraisal = this.state.appraisal;
  appraisal.dataReteste = date.format("YYYY-MM-DD");

  this.setState({appraisal: appraisal, dataReteste: date});
}

rowGetter(i) {
  return this.state.appraisesFiltered[i];
};

onRowsSelected(rows){ 
  let appraisal = rows[0].row;

  let dtEnsaio = new Date(appraisal.dataEnsaio);
  dtEnsaio = this.state.momentDtEnsaio.set({
    'year': dtEnsaio.getFullYear(), 
    'month': dtEnsaio.getMonth(),
    'date': dtEnsaio.getDate()
  });

  let dtReteste = new Date(appraisal.dataReteste);
  dtReteste = this.state.today.set({
    'year': dtReteste.getFullYear(), 
    'month': dtReteste.getMonth(),
    'date': dtReteste.getDate()
  });

  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    appraisal: appraisal,
    tensao: { value: appraisal.tensao.id, label: appraisal.tensao.codigo },
    manufactur: { value: appraisal.fabricante.cnpj, label: appraisal.fabricante.name },
    material: { value: appraisal.material, label: appraisal.material },
    dataEnsaio: dtEnsaio,
    dataReteste: dtReteste
  });
}

onRowsDeselected(){
  this.setState({selectedIndexes: []});
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

_onSelectManufactur (option) {
  let appraisal = this.state.appraisal;
  let manufactur;
  manufactur = this.state.manufactures.filter(function (manufactur) {
    return manufactur.cnpj == option.value;
  });
  appraisal.fabricante = manufactur[0];
  this.setState({appraisal: appraisal, manufactur: option})
}

_onSelectMaterial (option) {
  let appraisal = this.state.appraisal;
  let material;
  material = this.state.materiais.filter(function (material) {
    return material.nome == option.value;
  });
  appraisal.material = material[0].nome;
  appraisal.tensao =  material[0].tensao;
  appraisal.correnteFuga =  appraisal.tensao.correnteFuga[0];
  appraisal.resultado =  material[0].resultado;
  appraisal.unidade =  material[0].unidade;
  appraisal.fabricante = material[0].fabricante;
  appraisal.numeroSerieFabricante = material[0].numeroSerieFabricante;

  if (material[0].sequencial){
    let aux;
    aux = this.state.appraises.filter(function (aux) {
      return aux.material == appraisal.material;
    });

    if (aux == undefined || aux.length == 0){
      appraisal.numeroSeta = material[0].numeroSeta;
    }else {
      let maxNumeroSete;
      aux.forEach(function(appraisal) {
        if (maxNumeroSete == undefined){
          maxNumeroSete = appraisal.numeroSeta;
        }
  
        if (maxNumeroSete < appraisal.numeroSeta){
          maxNumeroSete = appraisal.numeroSeta;
        } 
      });
      appraisal.numeroSeta = maxNumeroSete;
      appraisal.numeroSeta++;
    }

   
  }else {
    appraisal.numeroSeta = material[0].numeroSeta;
  }
  
  appraisal.dataEnsaio = moment().format("YYYY-MM-DD");
  appraisal.dataReteste = moment().add(material[0].diasReteste, "days").format("YYYY-MM-DD");

  this.setState({
    appraisal: appraisal, 
    material: option,
    tensao: { value: material[0].tensao.id, label: material[0].tensao.codigo },
    manufactur: { value: material[0].fabricante.cnpj, label: material[0].fabricante.name },
    dataEnsaio: moment(),
    dataReteste: moment().add(material[0].diasReteste, "days")
  })
}

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.appraises.filter(function (appraisal) {
    return appraisal[filter.column.key].toString().includes(filter.filterTerm);
  });

  let appraisesDownload = [];
  JSON.parse(JSON.stringify(filters)).forEach(function(appraisal) {
    if (appraisal.fabricante != undefined){
      appraisal.fabricante = appraisal.fabricante.cnpj;
    }

    if (appraisal.tensao != undefined){
      appraisal.tensao = appraisal.tensao.codigo;
    }

    if (appraisal.resultado){
      appraisal.resultado = 'Aprovado';
    } else {
      appraisal.resultado = 'Reprovado';
    }
    delete appraisal.fabricanteCnpj;
    delete appraisal.tensaoCodigo;
    appraisesDownload.push(appraisal);
  });

  this.setState({ appraisesFiltered: filters, appraisesDownload: appraisesDownload });
};

render () {
    const tags = this.state.tags;
    const suggestions = this.state.suggestions;

    return (    
      <div>
        <div style={styles.content}>
            <CSVLink data={this.state.appraisesDownload} 
                     style={styles.download} 
                     filename="laudos.csv">
              Download CSV
            </CSVLink>
            <form>
            <div className="form-group row">
                <div className="col-sm-6">
                  <h5>Material:</h5>
                  <Dropdown 
                            options={this.state.optionsMaterial} onChange={this.onSelectMaterial} 
                            value={this.state.material} placeholder="Informe o material" />
                </div>
                <div className="col-sm-3">
                  <h5>Tensão:</h5>
                  <Dropdown 
                            options={this.state.optionsVoltage} onChange={this.onSelect} 
                            value={this.state.tensao} placeholder="Informe a tensão" />
                </div>
                <div className="col-sm-3">
                  <h5>Teste em:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.appraisal.tensao.teste ? "" : "Informe a tensão que deverá ser feito o teste"} 
                          value={this.state.appraisal.tensao.teste} 
                          onChange={this.onChangeTeste} /> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Corrente de Fuga:</h5>
                  <input className="form-control"
                          placeholder={this.state.appraisal.correnteFuga ? "" : "Informe a corrente de fuga"} 
                          value={this.state.appraisal.correnteFuga} 
                          onChange={this.onChangeCorrenteFuga} type="text" /> 
                </div>
                <div className="col-sm-3">
                  <h5>Unidade:</h5>
                  <input className="form-control"
                          placeholder={this.state.appraisal.unidade ? "" : "Informe a unidade"} 
                          value={this.state.appraisal.unidade} 
                          onChange={this.onChangeUnidade} type="text" /> 
                </div>
                <div className="col-sm-3">
                  <h5>Data Ensaio:</h5>
                  <DatePicker
                    className="form-control"
                    locale="pt-br"
                    selected={this.state.dataEnsaio}
                    onChange={this.onChangeDataEnsaio}/> 
                </div>
                <div className="col-sm-3">
                  <h5>Data Reteste:</h5>
                  <DatePicker
                    className="form-control"
                    locale="pt-br"
                    selected={this.state.dataReteste}
                    onChange={this.onChangeDataReteste}/> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Fabricante:</h5>
                  <Dropdown 
                            options={this.state.optionsManufactures} onChange={this.onSelectManufactur} 
                            value={this.state.manufactur} placeholder="Informe o fabricante" />
                </div>
                <div className="col-sm-3">
                  <h5>Nrº Série Fab.:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.appraisal.numeroSerieFabricante ? "" : "Informe o número de série do fabricante"} 
                          value={this.state.appraisal.numeroSerieFabricante} 
                          onChange={this.onChangeNrSerieFabricante} /> 
                </div>
                <div className="col-sm-3">
                  <h5>Nrº Seta:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.appraisal.numeroSeta ? "" : "Informe o número seta"} 
                          value={this.state.appraisal.numeroSeta} 
                          onChange={this.onChangeNrSeta} /> 
                </div>
                <div className="col-sm-3">
                  <h5>Resultado:</h5> 
                  <ToggleButton
                    value={ this.state.appraisal.resultado == 'Aprovado' || false }
                    inactiveLabel='Repr.'
                    activeLabel='Apro.'
                    trackStyle={styles.track}
                    thumbStyle={styles.thumb}
                    onToggle={(value) => {
                      let appraisal = this.state.appraisal;
                      if (value) {
                        appraisal.numeroSeta = 'XXXX'
                        appraisal.resultado = 'Reprovado';
                      } else {
                        appraisal.resultado = 'Aprovado';
                      }
                      
                      this.setState({appraisal: appraisal});
                    }} />
                 </div>
            </div>    
            <div id="snackbar"></div>
            <button type="button" style={styles.button} className="btn btn-light" onClick={this.handleClear}>Limpar</button>
            <button type="button" style={styles.button} className="btn btn-success" onClick={this.handleModify}>Salvar</button>
            <button type="button" style={styles.button} className="btn btn-danger" onClick={this.handleRemove}>Excluir</button>
            </form>
            <div className="col-sm-12" style={styles.table}>
              <ReactDataGrid
                columns={this.state.collumns}
                rowGetter={this.rowGetter}
                rowsCount={this.state.appraisesFiltered.length}
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
    listar_reports : {
        position: 'absolute',
        top:      '10px',
        right: '40px'
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
    table : {
      position                   : 'relative',
      right                      : '15px'
    },
    download : {
      backgroundColor: '#8dc63f',
      fontSize: 14,
      fontWeight: 500,
      height: 52,
      padding: '0 48px',
      borderRadius: 5,
      color: '#fff'
    },
    track : {
      width: '250px',
      height: '30px',
      padding: '3px', 
    },
    thumb : {
      width: '25px',
      height: '28px',
      padding: '3px', 
    }
};

  
ReactDOM.render(<Appraisal/>, document.getElementById('main'));