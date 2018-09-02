'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';
import { WithContext as ReactTags } from 'react-tag-input';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class Voltage extends React.Component {
  constructor() {
    super();
    this.state = {
        key: undefined,
        collumns: [],
        voltages: [],
        voltagesFiltered: [],
        selectedIndexes: [],
        voltage: {
            codigo: "",
            teste: "",
            correnteFuga: []
        },
        correnteFuga: []
    }
    Ipc.send('key');
    Ipc.on('key', this._handleExistingKey.bind(this));

    this.handleClear = () => this._handleClear();
    this.handleModify = () => this._handleModify();
    this.handleRemove = () => this._handleRemove();
    this.handleExistingData = () => this._handleExistingData();

    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.onChangeCodigo = this.onChangeCodigo.bind(this);
    this.onChangeTeste = this.onChangeTeste.bind(this);
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
      voltage: {
        codigo: "",
        teste: "",
        correnteFuga: []
      },
      correnteFuga: []
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let x = document.getElementById("snackbar"); 
    ServiceRequest.connect('tensoes/create', '', 'POST',this.state.key ,this.state.voltage)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Tensão registrada com sucesso!"
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
  let id = this.state.voltage.id;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('tensoes/', this.state.voltage.id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Tensão removida com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      let voltages = this.state.voltages;
      this.setState({ 
        voltages: voltages.filter(function (voltage) {
          return voltage.id != id;
        })
      });
      this.handleClear();
    }).catch(function(err) {
        x.innerText = "Error: " + err;
        x.classList.add("error");
    });
  }
  x.classList.add("show");
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
}

_handleExistingData() {
  ServiceRequest.connect('tensoes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let columns = [
      { key: 'id', name: 'ID', width: 0 },
      { key: 'codigo', name: 'Código', filterable: true},
      { key: 'teste', name: 'Teste em', filterable: true},
      { key: 'correnteFuga', name: 'Corrente de Fuga', filterable: true } ];

    this.setState({ voltages: response, voltagesFiltered: response, collumns: columns});
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Verifique os valores informados!";
      x.classList.add("error");
  }); 
 
}

handleDelete(i) {
    let voltage = this.state.voltage;
    let correnteFuga = this.state.correnteFuga;
    voltage.correnteFuga.splice(i, 1);
    correnteFuga.splice(i, 1);
    this.setState({voltage: voltage, correnteFuga: correnteFuga});
}

handleAddition(tag) {
    let voltage = this.state.voltage;
    let correnteFuga = this.state.correnteFuga;
    voltage.correnteFuga.push(tag);
    correnteFuga.push({
        id: voltage.correnteFuga.length + 1,
        text: tag
    });
    this.setState({voltage: voltage, correnteFuga: correnteFuga});
}

handleDrag(tag, currPos, newPos) {
    let voltage = this.state.voltage;
    let correnteFuga = this.state.correnteFuga;
    // mutate array
    voltage.correnteFuga.splice(currPos, 1);
    voltage.correnteFuga.splice(newPos, 0, tag);
    correnteFuga.splice(currPos, 1);
    correnteFuga.splice(newPos, 0, tag);
    // re-render
    this.setState({voltage: voltage, correnteFuga: correnteFuga});
}

onChangeCodigo(event) {
    let voltage = this.state.voltage;
    voltage.codigo =  event.target.value;

    this.setState({voltage: voltage});
}

onChangeTeste(event) {
    let voltage = this.state.voltage;
    voltage.teste = event.target.value;

    this.setState({voltage: voltage});
}

rowGetter(i) {
  return this.state.voltagesFiltered[i];
};

onRowsSelected(rows){
  let correnteFuga = [];
  rows[0].row.correnteFuga.forEach(function(tag) {
    correnteFuga.push({
      id: correnteFuga.length + 1,
      text: tag
    });
  });
  
  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    voltage: rows[0].row,
    correnteFuga: correnteFuga
  });
}

onRowsDeselected(){
  this.setState({selectedIndexes: []});
}

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.voltages.filter(function (appraisal) {
    return appraisal[filter.column.key].toString().includes(filter.filterTerm);
  })
  this.setState({ voltagesFiltered: filters });
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
                <h5>Classe tensão:</h5>
                <input className="form-control"
                        placeholder={this.state.voltage.codigo ? "" : "Informe o código de tensão"} 
                        value={this.state.voltage.codigo} 
                        onChange={this.onChangeCodigo} type="text" />
                </div>
                
                <div className="col-sm-5">
                <h5>Teste em:</h5>
                <input className="form-control"
                        placeholder={this.state.voltage.teste ? "" : "Informe a tensão de teste"} 
                        value={this.state.voltage.teste} 
                        onChange={this.onChangeTeste} type="text" /> 
                </div>
            </div>
            <div className="form-group row"> 
                <div className="col-sm-10">
                    <h5>Corrente de Fuga:</h5>
                    <ReactTags tags={this.state.correnteFuga}
                        placeholder={this.state.correnteFuga ? "" : "Informe a corrente de fuga"} 
                        handleDelete={this.handleDelete}
                        handleAddition={this.handleAddition}
                        handleDrag={this.handleDrag} />
                </div>  
            </div>
            <div id="snackbar">Some text some message..</div>
            <button type="button" style={styles.button} className="btn btn-light" onClick={this.handleClear}>Limpar</button>
            <button type="button" style={styles.button} className="btn btn-success" onClick={this.handleModify}>Salvar</button>
            <button type="button" style={styles.button} className="btn btn-danger" onClick={this.handleRemove}>Excluir</button>
            </form>
            <div className="col-sm-12" style={styles.table}>
              <ReactDataGrid
                columns={this.state.collumns}
                rowGetter={this.rowGetter}
                rowsCount={this.state.voltagesFiltered.length}
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

  
ReactDOM.render(<Voltage/>, document.getElementById('main'));