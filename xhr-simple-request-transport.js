/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {HeadersParserMixin} from '@advanced-rest-client/headers-parser-mixin/headers-parser-mixin.js';
/**
 * `xhr-simple-request`
 * A XHR request that works with API components.
 *
 * This is a copy of `iron-request` element from PolymerElements library but
 * adjusted to work with `API request` object (or ARC request object).
 *
 * It also handles custom events related to request flow.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @appliesMixin HeadersParserMixin
 * @memberof TransportElements
 */
class XhrSimpleRequestTransport extends HeadersParserMixin(PolymerElement) {
  static get is() {
    return 'xhr-simple-request-transport';
  }
  static get properties() {
    return {
      /**
       * A reference to the XMLHttpRequest instance used to generate the
       * network request.
       *
       * @type {XMLHttpRequest}
       */
      xhr: {
        type: Object,
        readOnly: true,
        value: function() {
          return new XMLHttpRequest();
        }
      },

      /**
       * A reference to the parsed response body, if the `xhr` has completely
       * resolved.
       *
       * @type {*}
       * @default null
       */
      response: {
        type: Object,
        readOnly: true,
        value: function() {
          return null;
        }
      },

      /**
       * A reference to response headers, if the `xhr` has completely
       * resolved.
       *
       * @type {String}
       * @default undefined
       */
      headers: {
        type: Object,
        readOnly: true
      },

      /**
       * A reference to the status code, if the `xhr` has completely resolved.
       */
      status: {
        type: Number,
        readOnly: true,
        value: 0
      },

      /**
       * A reference to the status text, if the `xhr` has completely resolved.
       */
      statusText: {
        type: String,
        readOnly: true,
        value: ''
      },

      /**
       * A promise that resolves when the `xhr` response comes back, or rejects
       * if there is an error before the `xhr` completes.
       * The resolve callback is called with the original request as an argument.
       * By default, the reject callback is called with an `Error` as an argument.
       * If `rejectWithRequest` is true, the reject callback is called with an
       * object with two keys: `request`, the original request, and `error`, the
       * error object.
       *
       * @type {Promise}
       */
      completes: {
        type: Object,
        readOnly: true,
        value: function() {
          return new Promise((resolve, reject) => {
            this.resolveCompletes = resolve;
            this.rejectCompletes = reject;
          });
        }
      },

      /**
       * An object that contains progress information emitted by the XHR if
       * available.
       *
       * @default {}
       */
      progress: {
        type: Object,
        readOnly: true,
        value: function() {
          return {};
        }
      },

      /**
       * Aborted will be true if an abort of the request is attempted.
       */
      aborted: {
        type: Boolean,
        readOnly: true,
        value: false,
      },

      /**
       * Errored will be true if the browser fired an error event from the
       * XHR object (mainly network errors).
       */
      errored: {
        type: Boolean,
        readOnly: true,
        value: false
      },

      /**
       * TimedOut will be true if the XHR threw a timeout event.
       */
      timedOut: {
        type: Boolean,
        readOnly: true,
        value: false
      },
      /**
       * Appends headers to each request handled by this component.
       *
       * Example
       *
       * ```html
       * <xhr-simple-request
       *  append-headers="x-token: 123\nx-api-demo: true"></xhr-simple-request>
       * ```
       */
      appendHeaders: String,
      /**
       * Computed list of headers to add to each request.
       * @type {Array<Object>}
       */
      _addHeaders: {
        type: Array,
        computed: '_computeAddHeaders(appendHeaders)'
      },
      /**
       * If set every request made from the console will be proxied by the service provided in this
       * value.
       * It will prefix entered URL with the proxy value. so the call to
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/path/http://domain.com/path/?query=some+value`
       *
       * If the proxy require a to pass the URL as a query parameter define value as follows:
       * `https://proxy.com/path/?url=`. In this case be sure to set `proxy-encode-url`
       * attribute.
       */
      proxy: String,
      /**
       * If `proxy` is set, it will URL encode the request URL before appending it to the proxy URL.
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/?url=http%3A%2F%2Fdomain.com%2Fpath%2F%3Fquery%3Dsome%2Bvalue`
       */
      proxyEncodeUrl: Boolean
    };
  }

  ready() {
    super.ready();
    this.setAttribute('hidden', 'true');
  }

  /**
   * Succeeded is true if the request succeeded. The request succeeded if it
   * loaded without error, wasn't aborted, and the status code is ≥ 200, and
   * < 300, or if the status code is 0.
   *
   * The status code 0 is accepted as a success because some schemes - e.g.
   * file:// - don't provide status codes.
   *
   * @return {boolean}
   */
  get succeeded() {
    if (this.errored || this.aborted || this.timedOut) {
      return false;
    }
    const status = this.xhr.status || 0;

    // Note: if we are using the file:// protocol, the status code will be 0
    // for all outcomes (successful or otherwise).
    return status === 0 ||
      (status >= 200 && status < 300);
  }
  /**
   * Sends a request.
   *
   * @param {Object} options API request object
   * - url `String` The url to which the request is sent.
   * - method `(string|undefined)` The HTTP method to use, default is GET.
   * - payload `(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object)`
   * The content for the request body for POST method.
   * - headers `String` HTTP request headers.
   * - withCredentials `(boolean|undefined)` Whether or not to send credentials on the request. Default is false.
   * - timeout `(Number|undefined)` Timeout for request, in milliseconds.
   * - id `String` Request ID
   * @return {Promise}
   */
  send(options) {
    const xhr = this.xhr;
    if (xhr.readyState > 0) {
      return null;
    }
    xhr.addEventListener('progress', (e) => this._progressHandler(e));
    xhr.addEventListener('error', (error) => this._errorHandler(error));
    xhr.addEventListener('timeout', (error) => this._timeoutHandler(error));
    xhr.addEventListener('abort', () => this._abortHandler());
    // Called after all of the above.
    xhr.addEventListener('loadend', () => this._loadEndHandler());
    const url = this._appendProxy(options.url);
    xhr.open(
      options.method || 'GET',
      url,
      true
    );
    this._applyHeaders(xhr, options.headers);
    xhr.timeout = options.timeout;
    xhr.withCredentials = !!options.withCredentials;
    try {
      xhr.send(options.payload);
    } catch (e) {
      this._errorHandler(e);
    }
    return this.completes;
  }
  /**
   * Applies headers to the XHR object.
   *
   * @param {XMLHttpRequest} xhr
   * @param {?String} headers HTTP headers string
   */
  _applyHeaders(xhr, headers) {
    const fixed = this._addHeaders;
    const fixedNames = [];
    if (fixed && fixed.length) {
      fixed.forEach((item) => {
        fixedNames[fixedNames.length] = item.name;
        try {
          xhr.setRequestHeader(
            item.name,
            item.value
          );
        } catch (e) {
          console.warn(`Header ${item.name} cannot be set with value ${item.value}`);
        }
      });
    }
    if (headers) {
      const data = this.headersToJSON(String(headers));
      data.forEach((item) => {
        if (fixedNames.indexOf(item.name) !== -1) {
          return;
        }
        try {
          xhr.setRequestHeader(
            item.name,
            item.value
          );
        } catch (e) {
          console.warn(`Header ${item.name} cannot be set with value ${item.value}`);
        }
      });
    }
  }
  /**
   * Handler for the XHR `progress` event.
   * It sets `progress` property and dispatches `api-request-progress-changed`
   * custom event.
   * @param {ProgressEvent} progress
   */
  _progressHandler(progress) {
    if (this.aborted) {
      return;
    }
    this._setProgress({
      lengthComputable: progress.lengthComputable,
      loaded: progress.loaded,
      total: progress.total
    });
    // Webcomponents v1 spec does not fire *-changed events when not connected
    const e = new CustomEvent('api-request-progress-changed', {
      cancelable: false,
      bubbles: true,
      composed: true,
      detail: {
        value: this.progress
      }
    });
    this.dispatchEvent(e);
  }
  /**
   * Handler for XHR `error` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-error
   */
  _errorHandler(error) {
    if (this.aborted) {
      return;
    }
    this._setErrored(true);
    this._updateStatus();
    this._setHeaders(this.collectHeaders());
    const response = {
      error: error,
      request: this.xhr,
      headers: this.headers
    };
    this.rejectCompletes(response);
  }
  /**
   * Handler for XHR `timeout` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-timeout
   */
  _timeoutHandler(error) {
    this._setTimedOut(true);
    this._updateStatus();
    const response = {
      error: error,
      request: this.xhr
    };
    this.rejectCompletes(response);
  }
  /**
   * Handler for XHR `abort` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-abort
   */
  _abortHandler() {
    this._setAborted(true);
    this._updateStatus();
    const error = new Error('Request aborted');
    const response = {
      error: error,
      request: this.xhr
    };
    this.rejectCompletes(response);
  }
  /**
   * Handler for XHR `loadend` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-loadend
   */
  _loadEndHandler() {
    if (this.aborted || this.timedOut) {
      return;
    }
    this._updateStatus();
    this._setHeaders(this.collectHeaders());
    this._setResponse(this.parseResponse());
    if (!this.succeeded) {
      const error = new Error('The request failed with status code: ' + this.xhr.status);
      const response = {
        error: error,
        request: this.xhr,
        headers: this.headers
      };
      this.rejectCompletes(response);
    } else {
      this.resolveCompletes({
        response: this.response,
        headers: this.headers
      });
    }
  }

  /**
   * Aborts the request.
   */
  abort() {
    this._setAborted(true);
    this.xhr.abort();
  }

  /**
   * Updates the status code and status text.
   */
  _updateStatus() {
    this._setStatus(this.xhr.status);
    this._setStatusText((this.xhr.statusText === undefined) ? '' : this.xhr.statusText);
  }
  /**
   * Attempts to parse the response body of the XHR. If parsing succeeds,
   * the value returned will be deserialized based on the `responseType`
   * set on the XHR.
   *
   * TODO: The `responseType` will always be empty string because
   * send function does not sets the response type.
   * API request object does not support this property. However in the future
   * it may actually send this information extracted from the AMF model.
   * This function will be ready to handle this case.
   *
   * @return {*} The parsed response,
   * or undefined if there was an empty response or parsing failed.
   */
  parseResponse() {
    const xhr = this.xhr;
    const responseType = xhr.responseType || xhr._responseType;
    const preferResponseText = !this.xhr.responseType;
    try {
      switch (responseType) {
        case 'json':
          // If the xhr object doesn't have a natural `xhr.responseType`,
          // we can assume that the browser hasn't parsed the response for us,
          // and so parsing is our responsibility. Likewise if response is
          // undefined, as there's no way to encode undefined in JSON.
          if (preferResponseText || xhr.response === undefined) {
            // Try to emulate the JSON section of the response body section of
            // the spec: https://xhr.spec.whatwg.org/#response-body
            // That is to say, we try to parse as JSON, but if anything goes
            // wrong return null.
            try {
              return JSON.parse(xhr.responseText);
            } catch (_) {
              console.warn('Failed to parse JSON sent from ' + xhr.responseURL);
              return null;
            }
          }
          return xhr.response;
        case 'xml':
          return xhr.responseXML;
        case 'blob':
        case 'document':
        case 'arraybuffer':
          return xhr.response;
        case 'text':
          return xhr.responseText;
        default: {
          return xhr.responseText;
        }
      }
    } catch (e) {
      this.rejectCompletes(new Error('Could not parse response. ' + e.message));
    }
  }
  /**
   * Collects response headers string from the XHR object.
   *
   * @return {String|undefined}
   */
  collectHeaders() {
    let data;
    try {
      data = this.xhr.getAllResponseHeaders();
    } catch (_) {}
    return data;
  }
  /**
   * Computes value for `_addHeaders` property.
   * A list of headers to add to each request.
   * @param {?String} headers Headers string
   * @return {Array<Object>|undefined}
   */
  _computeAddHeaders(headers) {
    if (!headers) {
      return;
    }
    headers = String(headers).replace('\\n', '\n');
    return this.headersToJSON(headers);
  }
  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param {String} url Request URL to alter if needed.
   * @return {String} The URL to use with request.
   */
  _appendProxy(url) {
    const proxy = this.proxy;
    if (!proxy) {
      return url;
    }
    let result = this.proxyEncodeUrl ? encodeURIComponent(url) : url;
    result = proxy + result;
    return result;
  }
  /**
   * @event api-request-progress-changed
   *
   * Dispatched with XHR progress event
   *
   * @param {Object} value Object with progress properties:
   * - `lengthComputable`
   * - `loaded`
   * - `total`
   * See https://xhr.spec.whatwg.org/#progressevent for more info.
   */
}

window.customElements.define(XhrSimpleRequestTransport.is, XhrSimpleRequestTransport);