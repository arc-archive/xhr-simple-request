# DEPRECATED

This component is deprecated. The code base has been moved to [api-request](https://github.com/advanced-rest-client/api-request) module.

-----

An XHR request that works with API components.

It handles `api-request` and `abort-api-request` custom events that controls request flow in API components ecosystem.


```html
<xhr-simple-request></xhr-simple-request>
```

## Deprecation notice

This component has been moved to `api-request`. Once the new version of API Console is released this project will be archived.

## Usage

### Installation
```
npm install --save @advanced-rest-client/xhr-simple-request
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/xhr-simple-request/xhr-simple-request.js';
    </script>
  </head>
  <body>
    <xhr-simple-request></xhr-simple-request>
    <script>
    const request = {
      url: location.href,
      method: 'POST',
      headers: 'x-arc: true',
      payload: 'test body',
      id: 'request-unique-id'
    };
    const e = new CustomEvent('api-request', {
      detail: request,
      bubbles: true
    });
    document.body.dispatchEvent(e);
    window.addEventListener('api-response', (e) => {
      console.log(e.detail);
    });
    </script>
  </body>
</html>
```

### In a LitElement template

```js
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/xhr-simple-request/xhr-simple-request.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <xhr-simple-request @api-response="${this._onResponse}"></xhr-simple-request>`;
  }

  _onResponse(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/xhr-simple-request/xhr-simple-request.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <xhr-simple-request on-api-response="_onResponse"></xhr-simple-request>
    `;
  }

  send() {
    const request = {
      url: location.href,
      method: 'POST',
      headers: 'x-arc: true',
      payload: 'test body',
      id: 'request-unique-id'
    };
    const e = new CustomEvent('api-request', {
      detail: request,
      bubbles: true
    });
    document.body.dispatchEvent(e);
  }

  _onResponse(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/advanced-rest-client/xhr-simple-request
cd xhr-simple-request
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
