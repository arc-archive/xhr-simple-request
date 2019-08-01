import { html } from 'lit-html';
import { ArcDemoPage } from '@advanced-rest-client/arc-demo-helper/ArcDemoPage.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-input/paper-textarea.js';
import '@polymer/paper-input/paper-input-container.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-form/iron-form.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/paper-toast/paper-toast.js';
import '../xhr-simple-request.js';

let lastId = 0;

class ComponentDemo extends ArcDemoPage {
  constructor() {
    super();
    this._submitForm = this._submitForm.bind(this);

    this.componentName = 'xhr-simple-request';
  }

  _submitForm() {
    const form = document.getElementById('form');
    const data = form.serializeForm();
    const id = 'request' + lastId++;
    const request = {
      url: data.url,
      method: data.method,
      headers: data.headers,
      payload: data.body,
      id: id
    };
    const e = new CustomEvent('api-request', {
      detail: request,
      bubbles: true
    });
    document.body.dispatchEvent(e);
  }

  contentTemplate() {
    return html`
    <iron-form id="form">
      <form enctype="application/json">
        <paper-input id="url" type="url" name="url" label="URL"></paper-input>
        <paper-input-container>
          <label slot="label">Method</label>
          <iron-input slot="input" id="method">
            <input type="text" name="method" list="methods">
          </iron-input>
        </paper-input-container>
        <paper-textarea name="headers" label="Headers"></paper-textarea>
        <paper-textarea name="body" label="Body"></paper-textarea>
        <paper-button raised @click="${this._submitForm}">Submit</paper-button>

        <datalist id="methods">
          <option value="GET">
          </option><option value="POST">
          </option><option value="PUT">
          </option><option value="DELETE">
        </option></datalist>
      </form>
    </iron-form>
    <xhr-simple-request id="request"></xhr-simple-request>
    <paper-toast id="toast"></paper-toast>
    `;
  }
}
const instance = new ComponentDemo();
instance.render();

setTimeout(() => {
  document.getElementById('url').value = location.href;
  document.getElementById('method').bindValue = 'GET';
});

window.addEventListener('api-response', (e) => {
  console.log(e.detail);
  const toast = document.getElementById('toast');
  let message;
  if (e.detail.isError) {
    message = e.detail.error.message;
  } else {
    message = `Received response in ${e.detail.loadingTime} ms`;
  }
  toast.text = message;
  toast.opened = true;
});
