'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';
import Dropdown from 'react-dropdown';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class Material extends React.Component {
  constructor() {
    super();
    this.state = {
        key: undefined,
        collumns: [],
        materials: [],
        materialsFiltered: [],
        selectedIndexes: [],
        tensoes: [],
        optionsVoltage: [],
        tensao: undefined,
        manufactures: [],
        optionsManufactures: [],
        manufactur: undefined,
        material: {
          nome: "",
          tensao: {
            codigo: "",
            teste: "",
          },
          correnteFuga: "",
          unidade: "",
          fabricante: {
            cnpj: ""
          },
          numeroSerieFabricante: "",
          numeroSeta: "",
          cautela: "",
          diasReteste: "",
          sequencial: false
        }
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleModify = () => this._handleModify();
    this.handleRemove = () => this._handleRemove();
    this.handleExistingData = () => this._handleExistingData();
    this.handleExistingVoltage = () => this._handleExistingVoltage();
    this.handleExistingManufactur = () => this._handleExistingManufactur();

    this.onChangeMaterial = this.onChangeMaterial.bind(this);
    this.onChangeTeste = this.onChangeTeste.bind(this);
    this.onChangeCorrenteFuga = this.onChangeCorrenteFuga.bind(this);
    this.onChangeUnidade = this.onChangeUnidade.bind(this);
    this.onChangeNrSerieFabricante = this.onChangeNrSerieFabricante.bind(this);
    this.onChangeNrSeta = this.onChangeNrSeta.bind(this);
    this.onChangeCautela = this.onChangeCautela.bind(this);
    this.onChangeDiasReteste = this.onChangeDiasReteste.bind(this);
    this.onChangeSequencial = this.onChangeSequencial.bind(this);


    this.rowGetter = this.rowGetter.bind(this);
    this.onRowsSelected = this.onRowsSelected.bind(this);
    this.onRowsDeselected = this.onRowsDeselected.bind(this);
    this.onSelect = this._onSelect.bind(this);
    this.onSelectManufactur = this._onSelectManufactur.bind(this);
    
    this.handleFilterChange = this._handleFilterChange.bind(this);
  }

  _handleExistingKey(event, payload) {
    this.setState({ key: payload }, () => { 
      this.handleExistingData(); 
    });
  }

  _handleClear() {
    this.setState({ 
      tensao: undefined,
      manufactur: undefined,
      material: {
        nome: "",
        tensao: {
          codigo: "",
          teste: "",
        },
        correnteFuga: "",
        unidade: "",
        fabricante: {
          cnpj: ""
        },
        numeroSerieFabricante: "",
        numeroSeta: "",
        cautela: "",
        diasReteste: "",
        sequencial: false
      }
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let x = document.getElementById("snackbar"); 
    if (!this.state.material.nome || 0 === this.state.material.nome.length){
      x.innerText = "Informe o nome do material!";
      x.classList.add("error");
    } else {
      delete this.state.material.fabricanteCnpj;
      delete this.state.material.tensaoCodigo;
      ServiceRequest.connect('materiais/create', '', 'POST',this.state.key ,this.state.material)
      .then(function(result) {
        if (result.status == 'SUCCESS') {
          x.innerText = "Material registrado com sucesso!"
          x.classList.add("success");
        }else{
          x.innerText = result.messages[0];
          x.classList.add("error");
        }
      }).then(() => {
        this.handleExistingData();
      }).catch(function(err) {
          x.innerText = "Verifique os valores informados!";
          x.classList.add("error");
      });
    }
   
    x.classList.add("show");
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

_handleRemove(){
  let x = document.getElementById("snackbar");
  let id = this.state.material.nome;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('materiais/', id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Fabricante removido com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      let materials = this.state.materials;
      this.setState({ 
        materials: materials.filter(function (material) {
          return material.nome != id;
        })
      });
      this.handleClear();
      this.handleExistingData();
    }).catch(function(err) {
        x.innerText = "Error: " + err;
        x.classList.add("error");
    });
  }
  x.classList.add("show");
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

_handleExistingData() {
  ServiceRequest.connect('materiais', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let columns = [
      { key: 'nome', name: 'Nome', filterable: true },
      { key: 'fabricanteCnpj', name: 'Fabricante', filterable: true },
      { key: 'tensaoCodigo', name: 'Tensão', filterable: true },
      { key: 'correnteFuga', name: 'Corrente Fuga', filterable: true },
      { key: 'unidade', name: 'Unidade', filterable: true },   
      { key: 'numeroSerieFabricante', name: 'Nr Série Fab.', filterable: true },
      { key: 'numeroSeta', name: 'Nr Seta', filterable: true },
      { key: 'diasReteste', name: 'Dias Reteste', filterable: true }
    ];

    let rows =[];
    response.forEach(function(material) {
      if (material.fabricante != undefined){
        material.fabricanteCnpj = material.fabricante.cnpj;
      }
      if (material.tensao != undefined){
        material.tensaoCodigo = material.tensao.codigo;
      }
      rows.push(material);
    });

    this.setState({ materials: rows, materialsFiltered: rows, collumns: columns});
    this.handleExistingVoltage();
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Não foi possivel carregar os materiais!";
      x.classList.add("error");
      x.classList.add("show");
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
  }); 
 
}

_handleExistingVoltage() {
  ServiceRequest.connect('tensoes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let optionsVoltage = [];
    response.forEach(function(tensao) {
      optionsVoltage.push({ value: tensao.id, label: tensao.codigo });
    });

    this.setState({ tensoes: response, optionsVoltage: optionsVoltage});
    this.handleExistingManufactur();
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Não foi possivel carregar as tensoes!";
      x.classList.add("error");
  }); 
}

_handleExistingManufactur() {
  ServiceRequest.connect('fabricantes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let optionsManufactures = [];
    response.forEach(function(manufactur) {
      optionsManufactures.push({ value: manufactur.cnpj, label: manufactur.name });
    });

    this.setState({ manufactures: response, optionsManufactures: optionsManufactures});
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Não foi possivel carregar os fabricantes!";
      x.classList.add("error");
  }); 
}

onChangeMaterial(event) {
    let material = this.state.material;
    material.nome =  event.target.value;

    this.setState({material: material});
}

onChangeTeste(event){
  let material = this.state.material;
  material.tensao.teste =  event.target.value;

  this.setState({material: material});
}

onChangeCorrenteFuga(event){
  let material = this.state.material;
  material.correnteFuga =  event.target.value;

  this.setState({material: material});
}

onChangeUnidade(event){
  let material = this.state.material;
  material.unidade =  event.target.value;

  this.setState({material: material});
}

onChangeNrSerieFabricante(event){
  let material = this.state.material;
  material.numeroSerieFabricante =  event.target.value;

  this.setState({material: material});
}

onChangeNrSeta(event){
  let material = this.state.material;
  material.numeroSeta=  event.target.value;

  this.setState({material: material});
}

onChangeCautela(event){
  let material = this.state.material;
  material.cautela=  event.target.value;

  this.setState({material: material});
}

onChangeDiasReteste(event) {
    let material = this.state.material;
    material.diasReteste = event.target.value;

    this.setState({material: material});
}

onChangeSequencial(event) {
  let material = this.state.material;
  material.sequencial = event.target.checked;

  this.setState({material: material});
}

rowGetter(i) {
  return this.state.materialsFiltered[i];
};

onRowsSelected(rows){ 
  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    material: rows[0].row,
    tensao: { value: rows[0].row.tensao.id, label: rows[0].row.tensao.codigo },
    manufactur: { value: rows[0].row.fabricante.cnpj, label: rows[0].row.fabricante.name }
  });
}

onRowsDeselected(){
  this.setState({selectedIndexes: []});
}

_onSelect (option) {
  let material = this.state.material;
  let tensao;
  tensao = this.state.tensoes.filter(function (tensao) {
    return tensao.id == option.value;
  });
  material.tensao = tensao[0];
  material.correnteFuga = tensao[0].correnteFuga[0];
  this.setState({material: material, tensao: option})
}

_onSelectManufactur (option) {
  let material = this.state.material;
  let manufactur;
  manufactur = this.state.manufactures.filter(function (manufactur) {
    return manufactur.cnpj == option.value;
  });
  material.fabricante = manufactur[0];
  this.setState({material: material, manufactur: option})
}

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.materials.filter(function (appraisal) {
    return appraisal[filter.column.key].toString().includes(filter.filterTerm);
  })
  this.setState({ materialsFiltered: filters });
};

render () {
    const tags = this.state.tags;
    const suggestions = this.state.suggestions;

    return (    
      <div>
        <div style={styles.content}>
            <form>
            <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Nome do material:</h5>
                  <input className="form-control"
                          placeholder={this.state.material.nome ? "" : "Informe o nome do material"} 
                          value={this.state.material.nome} 
                          onChange={this.onChangeMaterial} type="text" /> 
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
                          placeholder={this.state.material.tensao.teste ? "" : "Informe a tensão que deverá ser feito o teste"} 
                          value={this.state.material.tensao.teste} 
                          onChange={this.onChangeTeste} /> 
                </div>
                <div className="col-sm-2">
                  <h5>Corrente de Fuga:</h5>
                  <input className="form-control"
                          placeholder={this.state.material.correnteFuga ? "" : "Informe a corrente de fuga"} 
                          value={this.state.material.correnteFuga} 
                          onChange={this.onChangeCorrenteFuga} type="text" /> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-2">
                  <h5>Unidade:</h5>
                  <input className="form-control"
                          placeholder={this.state.material.unidade ? "" : "Informe a unidade"} 
                          value={this.state.material.unidade} 
                          onChange={this.onChangeUnidade} type="text" /> 
                </div>
                <div className="col-sm-3">
                  <h5>Fabricante:</h5>
                  <Dropdown 
                            options={this.state.optionsManufactures} onChange={this.onSelectManufactur} 
                            value={this.state.manufactur} placeholder="Informe o fabricante" />
                </div>
                <div className="col-sm-3">
                  <h5>Nrº Série Fab.:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.material.numeroSerieFabricante ? "" : "Informe o número de série do fabricante"} 
                          value={this.state.material.numeroSerieFabricante} 
                          onChange={this.onChangeNrSerieFabricante} /> 
                </div>
                <div className="col-sm-3">
                  <h5>Nrº Seta:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.material.numeroSeta ? "" : "Informe o número seta"} 
                          value={this.state.material.numeroSeta} 
                          onChange={this.onChangeNrSeta} /> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-5">
                  <h5>Cautela:</h5>
                  <textarea className="form-control"
                          placeholder={this.state.material.cautela ? "" : "Informe a cautela"} 
                          value={this.state.material.cautela} 
                          onChange={this.onChangeCautela} type="text" /> 
                </div>
                <div className="col-sm-3">
                  <h5>Dias Reteste:</h5>
                  <input className="form-control" type="text"
                          placeholder={this.state.material.diasReteste ? "" : "Informe quantidade de dias para o reteste"} 
                          value={this.state.material.diasReteste} 
                          onChange={this.onChangeDiasReteste} /> 
                </div>
                <div className="col-sm-2">
                  <h5>Sequencial:</h5>
                  <input type="checkbox"
                         checked={this.state.material.sequencial} 
                         onChange={this.onChangeSequencial} /> 
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
                rowsCount={this.state.materialsFiltered.length}
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
    table : {
      position                   : 'relative',
      right                      : '15px'
    }
};

  
ReactDOM.render(<Material/>, document.getElementById('main'));