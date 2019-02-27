[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/xhr-simple-request.svg)](https://www.npmjs.com/package/@advanced-rest-client/xhr-simple-request)

[![Build Status](https://travis-ci.org/advanced-rest-client/xhr-simple-request.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/xhr-simple-request)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/xhr-simple-request)

## &lt;xhr-simple-request&gt;

An XHR request that works with API components.

It handles `api-request` and `abort-api-request` custom events that controls request flow in API components ecosystem.


```html
<xhr-simple-request></xhr-simple-request>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

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

### Installation

```sh
git clone https://github.com/advanced-rest-client/xhr-simple-request
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
