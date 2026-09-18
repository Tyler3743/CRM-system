import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import './index.css';

class CrmKanbanWidgetElement extends HTMLElement {
  private root: Root | null = null;

  connectedCallback() {
    if (!this.root) {
      this.root = createRoot(this);
    }
    this.root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

const ELEMENT_ID = 'crm-kanban-widget';
if (!customElements.get(ELEMENT_ID)) {
  customElements.define(ELEMENT_ID, CrmKanbanWidgetElement);
}

export default CrmKanbanWidgetElement;