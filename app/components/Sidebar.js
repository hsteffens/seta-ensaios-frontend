import React, { Component } from 'react';

import Laudo from './Laudo';

export default class Sidebar extends Component {
    constructor() {
        super();
    
        this.handleAddNew = () => this._handleAddNew();
    }
    
    _handleAddNew() {
        this.props.onAddNewLaudo();
    }
    
    render() {
      let laudos = this.props.laudos.map(p => <Laudo key={p.id} {...p} />);
      return (
        <div>
          <form>
            <div class="container-fluid">
                <button type="button" class="btn btn-success" onClick={this.handleAddNew}>Add New</button>
                {laudos}
            </div>
          </form>
        </div>
      )
    }
}