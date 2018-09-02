'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';
import InputMask from 'react-input-mask';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class Manufactur extends React.Component {
  constructor() {
    super();
    this.state = {
        key: undefined,
        collumns: [],
        manufactures: [],
        manufacturesFiltered: [],
        selectedIndexes: [],
        manufactur: {
            cnpj: "",
            name: ""
        }
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleModify = () => this._handleModify();
    this.handleRemove = () => this._handleRemove();
    this.handleExistingData = () => this._handleExistingData();

    this.onChangeCnpj = this.onChangeCnpj.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.rowGetter = this.rowGetter.bind(this);
    this.onRowsSelected = this.onRowsSelected.bind(this);
    this.onRowsDeselected = this.onRowsDeselected.bind(this);
    this.handleFilterChange = this._handleFilterChange.bind(this);
  }

  _handleExistingKey(event, payload) {
    this.setState({ key: payload }, () => { this.handleExistingData(); });
  }

  _handleClear() {
    this.setState({ 
      manufactur: {
        cnpj: "",
        name: ""
      }
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let x = document.getElementById("snackbar"); 
    ServiceRequest.connect('fabricantes/create', '', 'POST',this.state.key ,this.state.manufactur)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Fabricante registrado com sucesso!"
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
    x.classList.add("show");
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

_handleRemove(){
  let x = document.getElementById("snackbar");
  let id = this.state.manufactur.cnpj;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('fabricantes/', id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Fabricante removido com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      let manufactures = this.state.manufactures;
      this.setState({ 
        manufactures: manufactures.filter(function (manufactur) {
          return manufactur.cnpj != id;
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
  ServiceRequest.connect('fabricantes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let columns = [
      { key: 'cnpj', name: 'Cnpj', filterable: true },
      { key: 'name', name: 'Nome', filterable: true } 
    ];

    this.setState({ manufactures: response, manufacturesFiltered: response, collumns: columns});
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Verifique os valores informados!";
      x.classList.add("error");
  }); 
 
}

onChangeCnpj(event) {
    let manufactur = this.state.manufactur;
    manufactur.cnpj =  event.target.value;

    this.setState({manufactur: manufactur});
}

onChangeName(event) {
    let manufactur = this.state.manufactur;
    manufactur.name = event.target.value;

    this.setState({manufactur: manufactur});
}

rowGetter(i) {
  return this.state.manufacturesFiltered[i];
};

onRowsSelected(rows){ 
  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    manufactur: rows[0].row
  });
}

onRowsDeselected(){
  this.setState({selectedIndexes: []});
}

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.manufactures.filter(function (appraisal) {
    return appraisal[filter.column.key].toString().includes(filter.filterTerm);
  })
  this.setState({ manufacturesFiltered: filters });
};

render () {
    const tags = this.state.tags;
    const suggestions = this.state.suggestions;

    return (    
      <div>
        <div style={styles.content}>
            <form>
            <div className="form-group row">
                <div className="col-sm-5">
                <h5>Cnpj:</h5>
                <InputMask className="form-control" mask="999.999.999-99"
                        placeholder={this.state.manufactur.cnpj ? "" : "Informe o cnpj do fabricante"} 
                        value={this.state.manufactur.cnpj} 
                        onChange={this.onChangeCnpj} type="text" />
                </div>
                
                <div className="col-sm-5">
                <h5>Nome do fabricante:</h5>
                <input className="form-control"
                        placeholder={this.state.manufactur.name ? "" : "Informe o nome do fabricante"} 
                        value={this.state.manufactur.name} 
                        onChange={this.onChangeName} type="text" /> 
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
                rowsCount={this.state.manufacturesFiltered.length}
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

  
ReactDOM.render(<Manufactur/>, document.getElementById('main'));