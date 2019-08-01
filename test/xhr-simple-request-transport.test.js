import { fixture, assert, nextFrame } from '@open-wc/testing';
import { MockServer } from './server.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import '../xhr-simple-request-transport.js';

describe('<xhr-simple-request-transport>', function() {
  async function basicFixture() {
    return (await fixture(`<xhr-simple-request-transport></xhr-simple-request-transport>`));
  }

  async function proxyFixture() {
    return (await fixture(`
      <xhr-simple-request-transport proxy="https://api.domain.com/endpoint?url="></xhr-simple-request-transport>
    `));
  }

  async function proxyEncodesFixture() {
    return (await fixture(`
      <xhr-simple-request-transport proxy="https://api.domain.com/endpoint?url=" proxyencodeurl></xhr-simple-request-transport>
    `));
  }

  async function appendHeadersFixture() {
    return (await fixture(`
      <xhr-simple-request-transport appendheaders="x-a: test1\nx-b: test2"></xhr-simple-request-transport>
    `));
  }

  describe('_appendProxy()', () => {
    it('Transforms URL to add proxy', async () => {
      const element = await proxyFixture();
      const result = element._appendProxy('http://test.com');
      assert.equal(result, 'https://api.domain.com/endpoint?url=http://test.com');
    });

    it('URL value is encoded', async () => {
      const element = await proxyEncodesFixture();
      const result = element._appendProxy('http://test.com');
      assert.equal(result, 'https://api.domain.com/endpoint?url=http%3A%2F%2Ftest.com');
    });
  });

  describe('constructor()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets _xhr', () => {
      assert.ok(element._xhr);
    });

    it('sets null resposne', () => {
      assert.equal(element.response, null);
    });

    it('sets 0 status', () => {
      assert.equal(element.status, 0);
    });

    it('sets empty statusText', () => {
      assert.equal(element.statusText, '');
    });

    it('sets completes', () => {
      assert.ok(element.completes);
    });

    it('sets default _rogress', () => {
      assert.deepEqual(element.progress, {});
    });

    it('sets default aborted', () => {
      assert.isFalse(element.aborted);
    });

    it('sets errored aborted', () => {
      assert.isFalse(element.errored);
    });

    it('sets timedOut aborted', () => {
      assert.isFalse(element.timedOut);
    });

    it('sets resolveCompletes', async () => {
      await nextFrame();
      assert.ok(element.resolveCompletes);
    });

    it('sets rejectCompletes', async () => {
      await nextFrame();
      assert.ok(element.rejectCompletes);
    });
  });

  describe('send()', () => {
    let srv;
    before(function() {
      srv = new MockServer();
      srv.createServer();
    });

    after(function() {
      srv.restore();
    });

    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('makes a request', async () => {
      element.send({
        url: 'http://success.domain.com/'
      });
      const result = await element.completes;
      assert.equal(result.response, 'test');
    });

    it('rejects when error', async () => {
      element.send({
        url: 'http://error.domain.com/404'
      });
      let rejected = false;
      try {
        await element.completes;
      } catch (e) {
        rejected = true;
        assert.equal(e.error.message, 'The request failed with status code: 404');
      }
      assert.isTrue(rejected);
    });
  });

  describe('_computeAddHeaders()', () => {
    let srv;
    before(function() {
      srv = new MockServer();
      srv.createServer();
    });

    after(function() {
      srv.restore();
    });

    let element;
    beforeEach(async () => {
      element = await appendHeadersFixture();
    });

    it('adds set headers', async () => {
      element.send({
        url: 'http://success.domain.com/headers'
      });
      const result = await element.completes;
      const headers = JSON.parse(result.response);
      assert.equal(headers['x-a'], 'test1');
      assert.equal(headers['x-b'], 'test2');
    });

    it('adds request headers', async () => {
      element.send({
        url: 'http://success.domain.com/headers',
        headers: 'accept: application/json\nx-test:true'
      });
      const result = await element.completes;
      const headers = JSON.parse(result.response);
      assert.equal(headers['x-a'], 'test1');
      assert.equal(headers['x-b'], 'test2');
      assert.equal(headers.accept, 'application/json');
      assert.equal(headers['x-test'], 'true');
    });

    it('adds set headers only', async () => {
      element.send({
        url: 'http://success.domain.com/headers',
        headers: 'x-a: test3'
      });
      const result = await element.completes;
      const headers = JSON.parse(result.response);
      assert.equal(headers['x-a'], 'test1');
      assert.equal(headers['x-b'], 'test2');
    });
  });

  describe('_errorHandler()', () => {
    let element;
    let error;
    beforeEach(async () => {
      element = await basicFixture();
      error = new Error('test-error');
    });

    it('sets errored', () => {
      element._errorHandler(error);
      assert.isTrue(element.errored);
    });

    it('calls _updateStatus()', () => {
      const spy = sinon.spy(element, '_updateStatus');
      element._errorHandler(error);
      assert.isTrue(spy.called);
    });

    it('calls collectHeaders()', () => {
      const spy = sinon.spy(element, 'collectHeaders');
      element._errorHandler(error);
      assert.isTrue(spy.called);
    });

    it('sets response headers', () => {
      element._xhr = {
        getAllResponseHeaders: () => 'test-headers'
      };
      element._errorHandler(error);
      assert.equal(element.headers, 'test-headers');
    });

    it('rejects the promise', async () => {
      element._errorHandler(error);
      let rejected = false;
      try {
        await element.completes;
      } catch (e) {
        rejected = true;
      }
      assert.isTrue(rejected);
    });

    it('ignores it when aborted', () => {
      element._aborted = true;
      const spy = sinon.spy(element, 'collectHeaders');
      element._errorHandler(error);
      assert.isFalse(spy.called);
    });
  });

  describe('_timeoutHandler()', () => {
    let element;
    let error;
    beforeEach(async () => {
      element = await basicFixture();
      error = new Error('test-error');
    });

    it('sets timedOut', () => {
      element._timeoutHandler(error);
      assert.isTrue(element.timedOut);
    });

    it('calls _updateStatus()', () => {
      const spy = sinon.spy(element, '_updateStatus');
      element._timeoutHandler(error);
      assert.isTrue(spy.called);
    });

    it('rejects the promise', async () => {
      element._timeoutHandler(error);
      let rejected = false;
      try {
        await element.completes;
      } catch (e) {
        rejected = true;
      }
      assert.isTrue(rejected);
    });
  });

  describe('_abortHandler()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets aborted', () => {
      element._abortHandler();
      assert.isTrue(element.aborted);
    });

    it('calls _updateStatus()', () => {
      const spy = sinon.spy(element, '_updateStatus');
      element._abortHandler();
      assert.isTrue(spy.called);
    });

    it('rejects the promise', async () => {
      element._abortHandler();
      let rejected = false;
      try {
        await element.completes;
      } catch (e) {
        rejected = true;
      }
      assert.isTrue(rejected);
    });
  });

  describe('parseResponse()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('parses json', () => {
      element._xhr = {
        responseType: 'json',
        responseText: '{"test": true}'
      };
      const result = element.parseResponse();
      assert.deepEqual(result, {
        test: true
      });
    });

    it('parses json to text', () => {
      element._xhr = {
        responseType: 'json',
        response: '{"test": true}'
      };
      const result = element.parseResponse();
      assert.equal(result, '{"test": true}');
    });

    it('parses xml', () => {
      element._xhr = {
        responseType: 'xml',
        responseXML: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });

    it('parses blob', () => {
      element._xhr = {
        responseType: 'blob',
        response: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });

    it('parses document', () => {
      element._xhr = {
        responseType: 'document',
        response: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });

    it('parses arraybuffer', () => {
      element._xhr = {
        responseType: 'arraybuffer',
        response: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });

    it('parses text', () => {
      element._xhr = {
        responseType: 'text',
        responseText: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });

    it('parses default', () => {
      element._xhr = {
        responseText: 'test'
      };
      const result = element.parseResponse();
      assert.equal(result, 'test');
    });
  });

  describe('a11y', () => {
    it('adds aria-hidden attribute', async () => {
      const element = await basicFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('respects existing aria-hidden attribute', async () => {
      const element = await fixture(`<xhr-simple-request-transport aria-hidden="true"></xhr-simple-request-transport>`);
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('is accessible', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });
  });
});
