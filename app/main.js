'use babel';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer as Ipc } from 'electron';

import Sidebar from './components/Sidebar'

class Main extends Component {
  constructor() {
    super();
    this.state = { laudos: [] }
    this.handleAddNewLaudo = () => this._handleAddNewLaudo();
    this.handleDeleteLaudo = (id) => this._handleDeleteLaudo(id);
    this.handleLaudoChange = (id, body) => this._handleLaudoChange(id, body);

    Ipc.on('data', this._handleExistingData.bind(this));
  }
    
  _handleAddNewLaudo() {
    let laudo = { id: guid(), body: '' }

    this.setState({ laudos: this.state.laudos.concat(laudo) });
  }

  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  _handleDeleteLaudo(id) {
    let laudos = this.state.laudos.filter((laudo) => {
      return laudo.id !== id;
    });
    
    this.setState({ laudos });
  }

  _handleExistingData(event, payload) {
    let laudos = payload.map((laudo) => {
        laudo['handleLaudoChange'] = this.handleLaudoChange;
        laudo['handleDeleteLaudo'] = this.handleDeleteLaudo;
    
        return laudo;
    });
    
    this.setState({laudos: this.state.laudos.concat(laudos) });
  }

  _handlePostChange(id, body) {
    let laudos = this.state.laudos.map((laudo) => {
      if (laudo.id === id) {
        laudo.body = body;
      }
      return laudo;
    })
    
    this.setState({ laudos }, () => Ipc.send('data', this.state.laudos));
  }

  render () {
    return (
      <div>
        <Sidebar onAddNewLaudo={this.handleAddNewLaudo} laudos={this.state.laudos} />
      </div>
    )
  }
}

ReactDOM.render(<Main />, document.getElementById('main'));