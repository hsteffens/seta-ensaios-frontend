'use babel';

import { ipcRenderer as Ipc } from 'electron';

import React, { Component, StyleSheet } from 'react';
import ReactDOM from 'react-dom';

import ReactDataGrid from 'react-data-grid';
import InputMask from 'react-input-mask';

const { Toolbar, Data: { Selectors } } = require('react-data-grid-addons');

const ServiceRequest = require('../../functions/ServiceRequest');

class Customer extends React.Component {
  constructor() {
    super();
    this.state = {
        key: undefined,
        collumns: [],
        customers: [],
        customersFiltered: [],
        selectedIndexes: [],
        customer: {
          cnpj: "",
          name: "",
          solicitante: "",
          cep: "",
          fone: "",
          fone2: "",
          email: "",
          endereco: "",
          municipio: "",
          estado: "",
          ie: "",
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
    this.onChangeSolicitante = this.onChangeSolicitante.bind(this);
    this.onChangeCep = this.onChangeCep.bind(this);
    this.onChangePhone = this.onChangePhone.bind(this);
    this.onChangePhone2 = this.onChangePhone2.bind(this);
    this.onChangeEmail = this.onChangeEmail.bind(this);
    this.onChangeEndereco = this.onChangeEndereco.bind(this);
    this.onChangeMunicipio = this.onChangeMunicipio.bind(this);
    this.onChangeEstado = this.onChangeEstado.bind(this);
    this.onChangeIE = this.onChangeIE.bind(this);
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
      customer: {
        cnpj: "",
        name: "",
        solicitante: "",
        cep: "",
        fone: "",
        fone2: "",
        email: "",
        endereco: "",
        municipio: "",
        estado: "",
        ie: ""
      }
    });
    this.onRowsDeselected();
  }

  _handleModify() {
    let x = document.getElementById("snackbar"); 
    ServiceRequest.connect('clientes/create', '', 'POST',this.state.key ,this.state.customer)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Cliente registrado com sucesso!"
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
  let id = this.state.customer.cnpj;
  if(id == undefined){
    x.innerText = "Selecione um registro para remove-lo!";
    x.classList.add("error");
  } else {
    ServiceRequest.connect('clientes/', id, 'DELETE',this.state.key)
    .then(function(result) {
      if (result.status == 'SUCCESS') {
        x.innerText = "Cliente removido com sucesso!"
        x.classList.add("success");
      }else{
        x.innerText = result.messages[0];
        x.classList.add("error");
      }
    }).then(() => {
      let customers = this.state.customers;
      this.setState({ 
        customers: customers.filter(function (customer) {
          return customer.cnpj != id;
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
  ServiceRequest.connect('clientes', '', 'GET', this.state.key)
  .then(function(payload) {
    if (payload.status == 'SUCCESS') {
      return payload.result;
    }else{
      return [];
    }
  }).then((response) => {
    let columns = [
      { key: 'cnpj', name: 'Cnpj', filterable: true },
      { key: 'name', name: 'Nome', filterable: true },
      { key: 'solicitante', name: 'Solicitante', filterable: true },
      { key: 'cep', name: 'Cep', filterable: true },
      { key: 'municipio', name: 'Municipio', filterable: true },
      { key: 'estado', name: 'Estado', filterable: true } 
    ];

    this.setState({ customers: response, customersFiltered: response, collumns: columns});
  })
  .catch(function(err) {
      let x = document.getElementById("snackbar");
      x.innerText = "Verifique os valores informados!";
      x.classList.add("error");
  }); 
 
}

onChangeCnpj(event) {
    let customer = this.state.customer;
    customer.cnpj =  event.target.value;

    this.setState({customer: customer});
}

onChangeName(event) {
    let customer = this.state.customer;
    customer.name = event.target.value;

    this.setState({customer: customer});
}

onChangeSolicitante(event) {
  let customer = this.state.customer;
  customer.solicitante = event.target.value;

  this.setState({customer: customer});
}

onChangeCep(event) {
  let customer = this.state.customer;
  customer.cep = event.target.value;

  this.setState({customer: customer});
}

onChangePhone(event) {
  let customer = this.state.customer;
  customer.fone = event.target.value;

  this.setState({customer: customer});
}

onChangePhone2(event) {
  let customer = this.state.customer;
  customer.fone2 = event.target.value;

  this.setState({customer: customer});
}

onChangeEmail(event) {
  let customer = this.state.customer;
  customer.email = event.target.value;

  this.setState({customer: customer});
}

onChangeEndereco(event) {
  let customer = this.state.customer;
  customer.endereco = event.target.value;

  this.setState({customer: customer});
}

onChangeMunicipio(event) {
  let customer = this.state.customer;
  customer.municipio = event.target.value;

  this.setState({customer: customer});
}

onChangeEstado(event) {
  let customer = this.state.customer;
  customer.estado = event.target.value;

  this.setState({customer: customer});
}

onChangeIE(event) {
  let customer = this.state.customer;
  customer.ie = event.target.value;

  this.setState({customer: customer});
}

rowGetter(i) {
  return this.state.customersFiltered[i];
};

onRowsSelected(rows){ 
  this.setState({
    selectedIndexes: rows.map(r => r.rowIdx), 
    customer: rows[0].row
  });
}

onRowsDeselected(){
  this.setState({selectedIndexes: []});
}

_handleFilterChange(filter) {
  let filters = [];
  filters = this.state.customers.filter(function (appraisal) {
    return appraisal[filter.column.key].toString().includes(filter.filterTerm);
  })
  this.setState({ customersFiltered: filters });
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
                        placeholder={this.state.customer.cnpj ? "" : "Informe o cnpj do fabricante"} 
                        value={this.state.customer.cnpj} 
                        onChange={this.onChangeCnpj} type="text" />
                </div>
                
                <div className="col-sm-3">
                <h5>Nome:</h5>
                <input className="form-control"
                        placeholder={this.state.customer.name ? "" : "Informe o nome do cliente"} 
                        value={this.state.customer.name} 
                        onChange={this.onChangeName} type="text" /> 
                </div>
                <div className="col-sm-3">
                <h5>Solicitante:</h5>
                <input className="form-control"
                        placeholder={this.state.customer.solicitante ? "" : "Informe o nome do solicitante"} 
                        value={this.state.customer.solicitante} 
                        onChange={this.onChangeSolicitante} type="text" /> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-5">
                <h5>Endereço:</h5>
                <input className="form-control"
                        placeholder={this.state.customer.endereco ? "" : "Informe o endereço do cliente"} 
                        value={this.state.customer.endereco} 
                        onChange={this.onChangeEndereco} type="text" /> 
                </div>
                <div className="col-sm-3">
                <h5>Municipio:</h5>
                <input className="form-control"
                        placeholder={this.state.customer.municipio ? "" : "Informe o municipio do cliente"} 
                        value={this.state.customer.municipio} 
                        onChange={this.onChangeMunicipio} type="text" /> 
                </div>
                <div className="col-sm-1">
                <h5>UF:</h5>
                <input className="form-control" maxlength="2"
                        placeholder={this.state.customer.estado ? "" : "Informe o estado do cliente"} 
                        value={this.state.customer.estado} 
                        onChange={this.onChangeEstado} type="text" /> 
                </div>
                <div className="col-sm-2">
                <h5>IE:</h5>
                <input className="form-control" maxlength="12"
                        placeholder={this.state.customer.ie ? "" : "Informe a inscrição estadual"} 
                        value={this.state.customer.ie} 
                        onChange={this.onChangeIE} type="text" /> 
                </div>
            </div>
            <div className="form-group row">
                <div className="col-sm-2">
                <h5>Cep:</h5>
                <InputMask className="form-control" mask="99999-999"
                        placeholder={this.state.customer.cep ? "" : "Informe o cep"} 
                        value={this.state.customer.cep} 
                        onChange={this.onChangeCep} type="text" />
                </div>
                <div className="col-sm-3">
                <h5>Email:</h5>
                <input className="form-control"
                        placeholder={this.state.customer.email ? "" : "Informe o email do cliente"} 
                        value={this.state.customer.email} 
                        onChange={this.onChangeEmail} type="text" /> 
                </div>
                <div className="col-sm-3">
                <h5>Telefone:</h5>
                <InputMask className="form-control" mask="(99) 9999-9999"
                        placeholder={this.state.customer.fone ? "" : "Informe o telefone do cliente"} 
                        value={this.state.customer.fone} 
                        onChange={this.onChangePhone} type="text" /> 
                </div>
                <div className="col-sm-3">
                <h5>Celular:</h5>
                <InputMask className="form-control" mask="(99) 9 9999-9999"
                        placeholder={this.state.customer.fone2 ? "" : "Informe o celular do cliente"} 
                        value={this.state.customer.fone2} 
                        onChange={this.onChangePhone2} type="text" /> 
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
                rowsCount={this.state.customersFiltered.length}
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

  
ReactDOM.render(<Customer/>, document.getElementById('main'));