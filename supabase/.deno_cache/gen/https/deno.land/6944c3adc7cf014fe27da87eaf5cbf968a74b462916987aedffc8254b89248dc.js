// Copyright 2021 Kitson P. Kelly. All rights reserved. MIT License.
// deno-lint-ignore-file no-explicit-any
import { charset, contentType } from "https://deno.land/x/media_types@v2.9.0/mod.ts";
function assert(cond, msg = "assertion failed") {
  if (!cond) {
    const err = new Error(msg);
    err.name = "AssertionError";
    throw err;
  }
}
function extractLength(response) {
  const values = response.headers.get("content-length")?.split(/\s*,\s*/) ?? [];
  let candidateValue = null;
  for (const value of values){
    if (candidateValue == null) {
      candidateValue = value;
    } else if (value !== candidateValue) {
      throw new Error("invalid content-length");
    }
  }
  if (candidateValue == "" || candidateValue == null) {
    return null;
  }
  const v = parseInt(candidateValue, 10);
  return Number.isNaN(v) ? null : v;
}
function getEssence(value) {
  return value.split(/\s*;\s*/)[0];
}
function extractMIMEType(headers) {
  let mimeType = null;
  const values = headers.get("content-type")?.split(/\s*,\s*/);
  if (!values) {
    throw new Error("missing content type");
  }
  for (const value of values){
    const temporaryMimeType = contentType(value);
    if (!temporaryMimeType || getEssence(temporaryMimeType) === "*/*") {
      continue;
    }
    mimeType = temporaryMimeType;
  }
  if (mimeType == null) {
    throw new Error("missing content type");
  }
  return mimeType;
}
function isHTMLMIMEType(value) {
  return getEssence(value) === "text/html";
}
function isXMLMIMEType(value) {
  const essence = getEssence(value);
  return essence.endsWith("+xml") || essence === "text/xml" || essence === "application/xml";
}
const decoder = new TextDecoder();
function parseJSONFromBytes(value) {
  const string = decoder.decode(value);
  return JSON.parse(string);
}
function appendBytes(...bytes) {
  let length = 0;
  for (const b of bytes){
    length += b.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const b of bytes){
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}
class XMLHttpRequestEventTarget extends EventTarget {
  onabort = null;
  onerror = null;
  onload = null;
  onloadend = null;
  onloadstart = null;
  onprogress = null;
  ontimeout = null;
  dispatchEvent(evt) {
    if (evt instanceof ProgressEvent) {
      const xhr = this;
      switch(evt.type){
        case "abort":
          if (this.onabort) {
            this.onabort.call(xhr, evt);
          }
          break;
        case "error":
          if (this.onerror) {
            this.onerror.call(xhr, evt);
          }
          break;
        case "load":
          if (this.onload) {
            this.onload.call(xhr, evt);
          }
          break;
        case "loadend":
          if (this.onloadend) {
            this.onloadend.call(xhr, evt);
          }
          break;
        case "loadstart":
          if (this.onloadstart) {
            this.onloadstart.call(xhr, evt);
          }
          break;
        case "progress":
          if (this.onprogress) {
            this.onprogress.call(xhr, evt);
          }
          break;
        case "timeout":
          if (this.ontimeout) {
            this.ontimeout.call(xhr, evt);
          }
      }
    }
    if (evt.cancelable && evt.defaultPrevented) {
      return false;
    } else {
      return super.dispatchEvent(evt);
    }
  }
}
class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
}
var State = /*#__PURE__*/ function(State) {
  State[State["UNSENT"] = 0] = "UNSENT";
  State[State["OPENED"] = 1] = "OPENED";
  State[State["HEADERS_RECEIVED"] = 2] = "HEADERS_RECEIVED";
  State[State["LOADING"] = 3] = "LOADING";
  State[State["DONE"] = 4] = "DONE";
  return State;
}(State || {});
const METHODS = [
  "GET",
  "HEAD",
  "POST",
  "DELETE",
  "OPTIONS",
  "PUT"
];
class XMLHttpRequest extends XMLHttpRequestEventTarget {
  #abortedFlag = false;
  #abortController;
  #crossOriginCredentials = false;
  #headers = new Headers();
  #mime;
  #receivedBytes = new Uint8Array();
  #requestMethod;
  #response;
  #responseObject = null;
  #responseType = "";
  #sendFlag = false;
  #state = State.UNSENT;
  #timedoutFlag = false;
  #timeout = 0;
  #upload = new XMLHttpRequestUpload();
  #uploadCompleteFlag = false;
  #uploadListener = false;
  #url;
  #getResponseMIMEType() {
    try {
      assert(this.#response);
      const mimeType = extractMIMEType(this.#response.headers);
      return mimeType;
    } catch  {
      return "text/xml";
    }
  }
  #getFinalMIMEType() {
    if (!this.#mime) {
      return this.#getResponseMIMEType();
    } else {
      return this.#mime;
    }
  }
  #getFinalEncoding() {
    return charset(this.#getFinalMIMEType())?.toLocaleLowerCase() ?? null;
  }
  #getTextResponse() {
    if (this.#response?.body == null) {
      return "";
    }
    let charset = this.#getFinalEncoding();
    if (this.#responseType === "" && charset == null && isXMLMIMEType(this.#getFinalMIMEType())) {
      charset = "utf-8";
    }
    charset = charset ?? "utf8";
    const decoder = new TextDecoder(charset);
    return decoder.decode(this.#receivedBytes);
  }
  #handleResponseEndOfBody() {
    assert(this.#response);
    const loaded = this.#receivedBytes.length;
    const total = extractLength(this.#response) ?? 0;
    this.dispatchEvent(new ProgressEvent("progress", {
      loaded,
      total
    }));
    this.#state = State.DONE;
    this.#sendFlag = false;
    this.dispatchEvent(new Event("readystatechange"));
    this.dispatchEvent(new ProgressEvent("load", {
      loaded,
      total
    }));
    this.dispatchEvent(new ProgressEvent("loadend", {
      loaded,
      total
    }));
  }
  #handleErrors() {
    if (!this.#sendFlag) {
      return;
    }
    if (this.#timedoutFlag) {
      this.#requestErrorSteps("timeout");
    } else if (this.#abortedFlag) {
      this.#requestErrorSteps("abort");
    } else {
      this.#requestErrorSteps("error");
    }
  }
  #requestErrorSteps(event) {
    this.#state = State.DONE;
    this.#sendFlag = false;
    this.dispatchEvent(new Event("readystatechange"));
    if (!this.#uploadCompleteFlag) {
      this.#uploadCompleteFlag = true;
      if (this.#uploadListener) {
        this.#upload.dispatchEvent(new ProgressEvent(event, {
          loaded: 0,
          total: 0
        }));
        this.#upload.dispatchEvent(new ProgressEvent("loadend", {
          loaded: 0,
          total: 0
        }));
      }
    }
    this.dispatchEvent(new ProgressEvent(event, {
      loaded: 0,
      total: 0
    }));
    this.dispatchEvent(new ProgressEvent("loadend", {
      loaded: 0,
      total: 0
    }));
  }
  #setDocumentResponse() {
    assert(this.#response);
    if (this.#response.body == null) {
      return;
    }
    const finalMIME = this.#getFinalMIMEType();
    if (!(isHTMLMIMEType(finalMIME) || isXMLMIMEType(finalMIME))) {
      return;
    }
    if (this.#responseType === "" && isHTMLMIMEType(finalMIME)) {
      return;
    }
    this.#responseObject = new DOMException("Document bodies are not supported", "SyntaxError");
  }
  #terminate() {
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = undefined;
    }
  }
  onreadystatechange = null;
  get readyState() {
    return this.#state;
  }
  get response() {
    if (this.#responseType === "" || this.#responseType === "text") {
      if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
        return "";
      }
      return this.#getTextResponse();
    }
    if (this.#state !== State.DONE) {
      return null;
    }
    if (this.#responseObject instanceof Error) {
      return null;
    }
    if (this.#responseObject != null) {
      return this.#responseObject;
    }
    if (this.#responseType === "arraybuffer") {
      try {
        this.#responseObject = this.#receivedBytes.buffer.slice(this.#receivedBytes.byteOffset, this.#receivedBytes.byteLength + this.#receivedBytes.byteOffset);
      } catch (e) {
        this.#responseObject = e;
        return null;
      }
    } else if (this.#responseType === "blob") {
      this.#responseObject = new Blob([
        this.#receivedBytes
      ], {
        type: this.#getFinalMIMEType()
      });
    } else if (this.#responseType === "document") {
      this.#setDocumentResponse();
    } else {
      assert(this.#responseType === "json");
      if (this.#response?.body == null) {
        return null;
      }
      let jsonObject;
      try {
        jsonObject = parseJSONFromBytes(this.#receivedBytes);
      } catch  {
        return null;
      }
      this.#responseObject = jsonObject;
    }
    return this.#responseObject instanceof Error ? null : this.#responseObject;
  }
  get responseText() {
    if (!(this.#responseType === "" || this.#responseType === "text")) {
      throw new DOMException("Response type is not set properly", "InvalidStateError");
    }
    if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
      return "";
    }
    return this.#getTextResponse();
  }
  get responseType() {
    return this.#responseType;
  }
  set responseType(value) {
    if (value === "document") {
      return;
    }
    if (this.#state === State.LOADING || this.#state === State.DONE) {
      throw new DOMException("The response type cannot be changed when loading or done", "InvalidStateError");
    }
    this.#responseType = value;
  }
  get responseURL() {
    return this.#response?.url ?? "";
  }
  get responseXML() {
    if (!(this.#responseType === "" || this.#responseType === "document")) {
      throw new DOMException("Response type is not properly set", "InvalidStateError");
    }
    if (this.#state !== State.DONE) {
      return null;
    }
    if (this.#setDocumentResponse instanceof Error) {
      return null;
    }
    this.#setDocumentResponse();
    return null;
  }
  get status() {
    return this.#response?.status ?? 0;
  }
  get statusText() {
    return this.#response?.statusText ?? "";
  }
  get timeout() {
    return this.#timeout;
  }
  set timeout(value) {
    this.#timeout = value;
  }
  get upload() {
    return this.#upload;
  }
  get withCredentials() {
    return this.#crossOriginCredentials;
  }
  set withCredentials(value) {
    if (!(this.#state === State.UNSENT || this.#state === State.OPENED)) {
      throw new DOMException("The request is not unsent or opened", "InvalidStateError");
    }
    if (this.#sendFlag) {
      throw new DOMException("The request has been sent", "InvalidStateError");
    }
    this.#crossOriginCredentials = value;
  }
  abort() {
    this.#terminate();
    if (this.#state === State.OPENED && this.#sendFlag || this.#state === State.HEADERS_RECEIVED || this.#state === State.LOADING) {
      this.#requestErrorSteps("abort");
    }
    if (this.#state === State.DONE) {
      this.#state = State.UNSENT;
      this.#response = undefined;
    }
  }
  dispatchEvent(evt) {
    switch(evt.type){
      case "readystatechange":
        if (this.onreadystatechange) {
          this.onreadystatechange.call(this, evt);
        }
        break;
    }
    if (evt.cancelable && evt.defaultPrevented) {
      return false;
    } else {
      return super.dispatchEvent(evt);
    }
  }
  getAllResponseHeaders() {
    if (!this.#response) {
      return null;
    }
    const headers = [
      ...this.#response.headers
    ];
    headers.sort(([a], [b])=>a.localeCompare(b));
    return headers.map(([key, value])=>`${key}: ${value}`).join("\r\n");
  }
  getResponseHeader(name) {
    return this.#response?.headers.get(name) ?? null;
  }
  open(method, url, async = true, username = null, password = null) {
    method = method.toLocaleUpperCase();
    if (!METHODS.includes(method)) {
      throw new DOMException(`The method "${method}" is not allowed.`, "SyntaxError");
    }
    let parsedUrl;
    try {
      let base;
      try {
        base = window.location.toString();
      } catch  {
      // we just want to avoid the error about location in Deno
      }
      parsedUrl = new URL(url, base);
    } catch  {
      throw new DOMException(`The url "${url}" is invalid.`, "SyntaxError");
    }
    if (username != null) {
      parsedUrl.username = username;
    }
    if (password != null) {
      parsedUrl.password = password;
    }
    if (async === false) {
      throw new DOMException("The polyfill does not support sync operation.", "InvalidAccessError");
    }
    this.#terminate();
    this.#sendFlag = false;
    this.#uploadListener = false;
    this.#requestMethod = method;
    this.#url = parsedUrl;
    this.#headers = new Headers();
    this.#response = undefined;
    this.#state = State.OPENED;
    this.dispatchEvent(new Event("readystatechange"));
  }
  overrideMimeType(mime) {
    if (this.#state === State.LOADING || this.#state === State.DONE) {
      throw new DOMException("The request is in an invalid state", "InvalidStateError");
    }
    this.#mime = contentType(mime) ?? "application/octet-stream";
  }
  send(body = null) {
    if (this.#state !== State.OPENED) {
      throw new DOMException("Invalid state", "InvalidStateError");
    }
    if (this.#sendFlag) {
      throw new DOMException("Invalid state", "InvalidStateError");
    }
    if (this.#requestMethod === "GET" || this.#requestMethod === "HEAD") {
      body = null;
    }
    const abortController = this.#abortController = new AbortController();
    const req = new Request(this.#url.toString(), {
      method: this.#requestMethod,
      headers: this.#headers,
      body,
      mode: "cors",
      credentials: this.#crossOriginCredentials ? "include" : "same-origin",
      signal: abortController.signal
    });
    this.#uploadCompleteFlag = false;
    this.#timedoutFlag = false;
    if (req.body == null) {
      this.#uploadCompleteFlag = true;
    }
    this.#sendFlag = true;
    this.dispatchEvent(new ProgressEvent("loadstart", {
      loaded: 0,
      total: 0
    }));
    this.#upload.dispatchEvent(new ProgressEvent("loadstart", {
      loaded: 0,
      total: 0
    }));
    if (this.#state !== State.OPENED || !this.#sendFlag) {
      return;
    }
    const processRequestEndOfBody = ()=>{
      this.#uploadCompleteFlag = true;
      if (!this.#uploadListener) {
        return;
      }
      this.#upload.dispatchEvent(new ProgressEvent("progress", {
        loaded: 0,
        total: 0
      }));
      this.#upload.dispatchEvent(new ProgressEvent("load", {
        loaded: 0,
        total: 0
      }));
      this.#upload.dispatchEvent(new ProgressEvent("loadend", {
        loaded: 0,
        total: 0
      }));
    };
    const processResponse = async (response)=>{
      this.#response = response;
      this.#state = State.HEADERS_RECEIVED;
      this.dispatchEvent(new Event("readystatechange"));
      if (this.#state !== State.HEADERS_RECEIVED) {
        return;
      }
      if (response.body == null) {
        this.#handleResponseEndOfBody();
        return;
      }
      const total = extractLength(this.#response) ?? 0;
      let lastInvoked = 0;
      const processBodyChunk = (bytes)=>{
        this.#receivedBytes = appendBytes(this.#receivedBytes, bytes);
        if (Date.now() - lastInvoked <= 50) {
          return;
        }
        lastInvoked = Date.now();
        if (this.#state === State.HEADERS_RECEIVED) {
          this.#state = State.LOADING;
        }
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(new ProgressEvent("progress", {
          loaded: this.#receivedBytes.length,
          total
        }));
      };
      const processEndOfBody = ()=>{
        this.#handleResponseEndOfBody();
      };
      const processBodyError = ()=>{
        this.#handleErrors();
      };
      try {
        for await (const bytes of response.body){
          processBodyChunk(bytes);
        }
        processEndOfBody();
      } catch  {
        processBodyError();
      }
    };
    const processRejection = ()=>{
      this.#handleErrors();
    };
    const p = fetch(req).then((response)=>{
      processRequestEndOfBody();
      return processResponse(response);
    }).catch(processRejection);
    if (this.#timeout > 0) {
      const t = new Promise((res)=>{
        setTimeout(()=>res(true), this.#timeout);
      });
      Promise.race([
        p,
        t
      ]).then((value)=>{
        if (value) {
          this.#timedoutFlag = true;
          this.#terminate();
        }
      });
    }
  }
  setRequestHeader(name, value) {
    if (this.#state !== State.OPENED) {
      throw new DOMException("Invalid state", "InvalidStateError");
    }
    if (this.#sendFlag) {
      throw new DOMException("Invalid state", "InvalidateStateError");
    }
    this.#headers.append(name, value);
  }
  get DONE() {
    return State.DONE;
  }
  get HEADERS_RECEIVED() {
    return State.HEADERS_RECEIVED;
  }
  get LOADING() {
    return State.LOADING;
  }
  get OPENED() {
    return State.OPENED;
  }
  get UNSENT() {
    return State.UNSENT;
  }
  static get DONE() {
    return State.DONE;
  }
  static get HEADERS_RECEIVED() {
    return State.HEADERS_RECEIVED;
  }
  static get LOADING() {
    return State.LOADING;
  }
  static get OPENED() {
    return State.OPENED;
  }
  static get UNSENT() {
    return State.UNSENT;
  }
}
// deno-lint-ignore ban-types
function maybeDefine(value, scope) {
  const name = value.name;
  if (!(name in globalThis)) {
    Object.defineProperty(scope, name, {
      value,
      writable: true,
      configurable: true,
      enumerable: false
    });
  }
}
maybeDefine(XMLHttpRequest, globalThis);
maybeDefine(XMLHttpRequestEventTarget, globalThis);
maybeDefine(XMLHttpRequestUpload, globalThis);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gveGhyQDAuMS4wL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSBLaXRzb24gUC4gS2VsbHkuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBMaWNlbnNlLlxuXG4vLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5cbmltcG9ydCB7XG4gIGNoYXJzZXQsXG4gIGNvbnRlbnRUeXBlLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9tZWRpYV90eXBlc0B2Mi45LjAvbW9kLnRzXCI7XG5cbnR5cGUgWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgPVxuICB8IFwiXCJcbiAgfCBcImFycmF5YnVmZmVyXCJcbiAgfCBcImJsb2JcIlxuICB8IFwiZG9jdW1lbnRcIlxuICB8IFwianNvblwiXG4gIHwgXCJ0ZXh0XCI7XG5cbmZ1bmN0aW9uIGFzc2VydChjb25kOiB1bmtub3duLCBtc2cgPSBcImFzc2VydGlvbiBmYWlsZWRcIik6IGFzc2VydHMgY29uZCB7XG4gIGlmICghY29uZCkge1xuICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICAgIGVyci5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0TGVuZ3RoKHJlc3BvbnNlOiBSZXNwb25zZSkge1xuICBjb25zdCB2YWx1ZXMgPSByZXNwb25zZS5oZWFkZXJzLmdldChcImNvbnRlbnQtbGVuZ3RoXCIpPy5zcGxpdCgvXFxzKixcXHMqLykgPz8gW107XG4gIGxldCBjYW5kaWRhdGVWYWx1ZTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGZvciAoY29uc3QgdmFsdWUgb2YgdmFsdWVzKSB7XG4gICAgaWYgKGNhbmRpZGF0ZVZhbHVlID09IG51bGwpIHtcbiAgICAgIGNhbmRpZGF0ZVZhbHVlID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gY2FuZGlkYXRlVmFsdWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgY29udGVudC1sZW5ndGhcIik7XG4gICAgfVxuICB9XG4gIGlmIChjYW5kaWRhdGVWYWx1ZSA9PSBcIlwiIHx8IGNhbmRpZGF0ZVZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCB2ID0gcGFyc2VJbnQoY2FuZGlkYXRlVmFsdWUsIDEwKTtcbiAgcmV0dXJuIE51bWJlci5pc05hTih2KSA/IG51bGwgOiB2O1xufVxuXG5mdW5jdGlvbiBnZXRFc3NlbmNlKHZhbHVlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC9cXHMqO1xccyovKVswXTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE1JTUVUeXBlKGhlYWRlcnM6IEhlYWRlcnMpIHtcbiAgbGV0IG1pbWVUeXBlOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgdmFsdWVzID0gaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnNwbGl0KC9cXHMqLFxccyovKTtcbiAgaWYgKCF2YWx1ZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJtaXNzaW5nIGNvbnRlbnQgdHlwZVwiKTtcbiAgfVxuICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgIGNvbnN0IHRlbXBvcmFyeU1pbWVUeXBlID0gY29udGVudFR5cGUodmFsdWUpO1xuICAgIGlmICghdGVtcG9yYXJ5TWltZVR5cGUgfHwgZ2V0RXNzZW5jZSh0ZW1wb3JhcnlNaW1lVHlwZSkgPT09IFwiKi8qXCIpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBtaW1lVHlwZSA9IHRlbXBvcmFyeU1pbWVUeXBlO1xuICB9XG4gIGlmIChtaW1lVHlwZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibWlzc2luZyBjb250ZW50IHR5cGVcIik7XG4gIH1cbiAgcmV0dXJuIG1pbWVUeXBlO1xufVxuXG5mdW5jdGlvbiBpc0hUTUxNSU1FVHlwZSh2YWx1ZTogc3RyaW5nKSB7XG4gIHJldHVybiBnZXRFc3NlbmNlKHZhbHVlKSA9PT0gXCJ0ZXh0L2h0bWxcIjtcbn1cblxuZnVuY3Rpb24gaXNYTUxNSU1FVHlwZSh2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IGVzc2VuY2UgPSBnZXRFc3NlbmNlKHZhbHVlKTtcbiAgcmV0dXJuIGVzc2VuY2UuZW5kc1dpdGgoXCIreG1sXCIpIHx8IGVzc2VuY2UgPT09IFwidGV4dC94bWxcIiB8fFxuICAgIGVzc2VuY2UgPT09IFwiYXBwbGljYXRpb24veG1sXCI7XG59XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZnVuY3Rpb24gcGFyc2VKU09ORnJvbUJ5dGVzKHZhbHVlOiBVaW50OEFycmF5KTogYW55IHtcbiAgY29uc3Qgc3RyaW5nID0gZGVjb2Rlci5kZWNvZGUodmFsdWUpO1xuICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRCeXRlcyguLi5ieXRlczogVWludDhBcnJheVtdKTogVWludDhBcnJheSB7XG4gIGxldCBsZW5ndGggPSAwO1xuICBmb3IgKGNvbnN0IGIgb2YgYnl0ZXMpIHtcbiAgICBsZW5ndGggKz0gYi5sZW5ndGg7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGZvciAoY29uc3QgYiBvZiBieXRlcykge1xuICAgIHJlc3VsdC5zZXQoYiwgb2Zmc2V0KTtcbiAgICBvZmZzZXQgKz0gYi5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuY2xhc3MgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCBleHRlbmRzIEV2ZW50VGFyZ2V0IHtcbiAgb25hYm9ydDogKCh0aGlzOiBYTUxIdHRwUmVxdWVzdCwgZXY6IFByb2dyZXNzRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgb25lcnJvcjogKCh0aGlzOiBYTUxIdHRwUmVxdWVzdCwgZXY6IFByb2dyZXNzRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcbiAgb25sb2FkOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbmxvYWRlbmQ6ICgodGhpczogWE1MSHR0cFJlcXVlc3QsIGV2OiBQcm9ncmVzc0V2ZW50KSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG4gIG9ubG9hZHN0YXJ0OiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbnByb2dyZXNzOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogUHJvZ3Jlc3NFdmVudCkgPT4gYW55KSB8IG51bGwgPSBudWxsO1xuICBvbnRpbWVvdXQ6ICgodGhpczogWE1MSHR0cFJlcXVlc3QsIGV2OiBQcm9ncmVzc0V2ZW50KSA9PiBhbnkpIHwgbnVsbCA9IG51bGw7XG5cbiAgZGlzcGF0Y2hFdmVudChldnQ6IEV2ZW50KSB7XG4gICAgaWYgKGV2dCBpbnN0YW5jZW9mIFByb2dyZXNzRXZlbnQpIHtcbiAgICAgIGNvbnN0IHhocjogWE1MSHR0cFJlcXVlc3QgPSB0aGlzIGFzIGFueTtcbiAgICAgIHN3aXRjaCAoZXZ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcImFib3J0XCI6XG4gICAgICAgICAgaWYgKHRoaXMub25hYm9ydCkge1xuICAgICAgICAgICAgdGhpcy5vbmFib3J0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgICAgaWYgKHRoaXMub25lcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbmVycm9yLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbmxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMub25sb2FkLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRlbmRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbmxvYWRlbmQpIHtcbiAgICAgICAgICAgIHRoaXMub25sb2FkZW5kLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxvYWRzdGFydFwiOlxuICAgICAgICAgIGlmICh0aGlzLm9ubG9hZHN0YXJ0KSB7XG4gICAgICAgICAgICB0aGlzLm9ubG9hZHN0YXJ0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInByb2dyZXNzXCI6XG4gICAgICAgICAgaWYgKHRoaXMub25wcm9ncmVzcykge1xuICAgICAgICAgICAgdGhpcy5vbnByb2dyZXNzLmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInRpbWVvdXRcIjpcbiAgICAgICAgICBpZiAodGhpcy5vbnRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRoaXMub250aW1lb3V0LmNhbGwoeGhyLCBldnQpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGV2dC5jYW5jZWxhYmxlICYmIGV2dC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdXBlci5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFhNTEh0dHBSZXF1ZXN0VXBsb2FkIGV4dGVuZHMgWE1MSHR0cFJlcXVlc3RFdmVudFRhcmdldCB7XG59XG5cbmVudW0gU3RhdGUge1xuICBVTlNFTlQgPSAwLFxuICBPUEVORUQgPSAxLFxuICBIRUFERVJTX1JFQ0VJVkVEID0gMixcbiAgTE9BRElORyA9IDMsXG4gIERPTkUgPSA0LFxufVxuXG5jb25zdCBNRVRIT0RTID0gW1wiR0VUXCIsIFwiSEVBRFwiLCBcIlBPU1RcIiwgXCJERUxFVEVcIiwgXCJPUFRJT05TXCIsIFwiUFVUXCJdO1xuXG5jbGFzcyBYTUxIdHRwUmVxdWVzdCBleHRlbmRzIFhNTEh0dHBSZXF1ZXN0RXZlbnRUYXJnZXQge1xuICAjYWJvcnRlZEZsYWcgPSBmYWxzZTtcbiAgI2Fib3J0Q29udHJvbGxlcj86IEFib3J0Q29udHJvbGxlcjtcbiAgI2Nyb3NzT3JpZ2luQ3JlZGVudGlhbHMgPSBmYWxzZTtcbiAgI2hlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAjbWltZT86IHN0cmluZztcbiAgI3JlY2VpdmVkQnl0ZXMgPSBuZXcgVWludDhBcnJheSgpO1xuICAjcmVxdWVzdE1ldGhvZD86IHN0cmluZztcbiAgI3Jlc3BvbnNlPzogUmVzcG9uc2U7XG4gICNyZXNwb25zZU9iamVjdDogYW55ID0gbnVsbDtcbiAgI3Jlc3BvbnNlVHlwZTogWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUgPSBcIlwiO1xuICAjc2VuZEZsYWcgPSBmYWxzZTtcbiAgI3N0YXRlID0gU3RhdGUuVU5TRU5UO1xuICAjdGltZWRvdXRGbGFnID0gZmFsc2U7XG4gICN0aW1lb3V0ID0gMDtcbiAgI3VwbG9hZCA9IG5ldyBYTUxIdHRwUmVxdWVzdFVwbG9hZCgpO1xuICAjdXBsb2FkQ29tcGxldGVGbGFnID0gZmFsc2U7XG4gICN1cGxvYWRMaXN0ZW5lciA9IGZhbHNlO1xuICAjdXJsPzogVVJMO1xuXG4gICNnZXRSZXNwb25zZU1JTUVUeXBlKCkge1xuICAgIHRyeSB7XG4gICAgICBhc3NlcnQodGhpcy4jcmVzcG9uc2UpO1xuICAgICAgY29uc3QgbWltZVR5cGUgPSBleHRyYWN0TUlNRVR5cGUodGhpcy4jcmVzcG9uc2UuaGVhZGVycyk7XG4gICAgICByZXR1cm4gbWltZVR5cGU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gXCJ0ZXh0L3htbFwiO1xuICAgIH1cbiAgfVxuXG4gICNnZXRGaW5hbE1JTUVUeXBlKCkge1xuICAgIGlmICghdGhpcy4jbWltZSkge1xuICAgICAgcmV0dXJuIHRoaXMuI2dldFJlc3BvbnNlTUlNRVR5cGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuI21pbWU7XG4gICAgfVxuICB9XG5cbiAgI2dldEZpbmFsRW5jb2RpbmcoKSB7XG4gICAgcmV0dXJuIGNoYXJzZXQodGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpKT8udG9Mb2NhbGVMb3dlckNhc2UoKSA/PyBudWxsO1xuICB9XG5cbiAgI2dldFRleHRSZXNwb25zZSgpIHtcbiAgICBpZiAodGhpcy4jcmVzcG9uc2U/LmJvZHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIGxldCBjaGFyc2V0ID0gdGhpcy4jZ2V0RmluYWxFbmNvZGluZygpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiAmJiBjaGFyc2V0ID09IG51bGwgJiZcbiAgICAgIGlzWE1MTUlNRVR5cGUodGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpKVxuICAgICkge1xuICAgICAgY2hhcnNldCA9IFwidXRmLThcIjtcbiAgICB9XG4gICAgY2hhcnNldCA9IGNoYXJzZXQgPz8gXCJ1dGY4XCI7XG4gICAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcihjaGFyc2V0KTtcbiAgICByZXR1cm4gZGVjb2Rlci5kZWNvZGUodGhpcy4jcmVjZWl2ZWRCeXRlcyk7XG4gIH1cblxuICAjaGFuZGxlUmVzcG9uc2VFbmRPZkJvZHkoKSB7XG4gICAgYXNzZXJ0KHRoaXMuI3Jlc3BvbnNlKTtcbiAgICBjb25zdCBsb2FkZWQgPSB0aGlzLiNyZWNlaXZlZEJ5dGVzLmxlbmd0aDtcbiAgICBjb25zdCB0b3RhbCA9IGV4dHJhY3RMZW5ndGgodGhpcy4jcmVzcG9uc2UpID8/IDA7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwicHJvZ3Jlc3NcIiwgeyBsb2FkZWQsIHRvdGFsIH0pKTtcbiAgICB0aGlzLiNzdGF0ZSA9IFN0YXRlLkRPTkU7XG4gICAgdGhpcy4jc2VuZEZsYWcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZFwiLCB7IGxvYWRlZCwgdG90YWwgfSkpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRlbmRcIiwgeyBsb2FkZWQsIHRvdGFsIH0pKTtcbiAgfVxuXG4gICNoYW5kbGVFcnJvcnMoKSB7XG4gICAgaWYgKCF0aGlzLiNzZW5kRmxhZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jdGltZWRvdXRGbGFnKSB7XG4gICAgICB0aGlzLiNyZXF1ZXN0RXJyb3JTdGVwcyhcInRpbWVvdXRcIik7XG4gICAgfSBlbHNlIGlmICh0aGlzLiNhYm9ydGVkRmxhZykge1xuICAgICAgdGhpcy4jcmVxdWVzdEVycm9yU3RlcHMoXCJhYm9ydFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jcmVxdWVzdEVycm9yU3RlcHMoXCJlcnJvclwiKTtcbiAgICB9XG4gIH1cblxuICAjcmVxdWVzdEVycm9yU3RlcHMoZXZlbnQ6IHN0cmluZykge1xuICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuRE9ORTtcbiAgICB0aGlzLiNzZW5kRmxhZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZWFkeXN0YXRlY2hhbmdlXCIpKTtcbiAgICBpZiAoIXRoaXMuI3VwbG9hZENvbXBsZXRlRmxhZykge1xuICAgICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLiN1cGxvYWRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLiN1cGxvYWQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChldmVudCwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLiN1cGxvYWQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRlbmRcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IFByb2dyZXNzRXZlbnQoZXZlbnQsIHsgbG9hZGVkOiAwLCB0b3RhbDogMCB9KSk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZGVuZFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSkpO1xuICB9XG5cbiAgI3NldERvY3VtZW50UmVzcG9uc2UoKSB7XG4gICAgYXNzZXJ0KHRoaXMuI3Jlc3BvbnNlKTtcbiAgICBpZiAodGhpcy4jcmVzcG9uc2UuYm9keSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGZpbmFsTUlNRSA9IHRoaXMuI2dldEZpbmFsTUlNRVR5cGUoKTtcbiAgICBpZiAoIShpc0hUTUxNSU1FVHlwZShmaW5hbE1JTUUpIHx8IGlzWE1MTUlNRVR5cGUoZmluYWxNSU1FKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiAmJiBpc0hUTUxNSU1FVHlwZShmaW5hbE1JTUUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuI3Jlc3BvbnNlT2JqZWN0ID0gbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgIFwiRG9jdW1lbnQgYm9kaWVzIGFyZSBub3Qgc3VwcG9ydGVkXCIsXG4gICAgICBcIlN5bnRheEVycm9yXCIsXG4gICAgKTtcbiAgfVxuXG4gICN0ZXJtaW5hdGUoKSB7XG4gICAgaWYgKHRoaXMuI2Fib3J0Q29udHJvbGxlcikge1xuICAgICAgdGhpcy4jYWJvcnRDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICB0aGlzLiNhYm9ydENvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgb25yZWFkeXN0YXRlY2hhbmdlOiAoKHRoaXM6IFhNTEh0dHBSZXF1ZXN0LCBldjogRXZlbnQpID0+IGFueSkgfCBudWxsID0gbnVsbDtcblxuICBnZXQgcmVhZHlTdGF0ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNzdGF0ZTtcbiAgfVxuXG4gIGdldCByZXNwb25zZSgpOiBhbnkge1xuICAgIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiXCIgfHwgdGhpcy4jcmVzcG9uc2VUeXBlID09PSBcInRleHRcIikge1xuICAgICAgaWYgKCEodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuI2dldFRleHRSZXNwb25zZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgIT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy4jcmVzcG9uc2VPYmplY3QgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXNwb25zZU9iamVjdCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2VPYmplY3Q7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiYXJyYXlidWZmZXJcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy4jcmVzcG9uc2VPYmplY3QgPSB0aGlzLiNyZWNlaXZlZEJ5dGVzLmJ1ZmZlci5zbGljZShcbiAgICAgICAgICB0aGlzLiNyZWNlaXZlZEJ5dGVzLmJ5dGVPZmZzZXQsXG4gICAgICAgICAgdGhpcy4jcmVjZWl2ZWRCeXRlcy5ieXRlTGVuZ3RoICsgdGhpcy4jcmVjZWl2ZWRCeXRlcy5ieXRlT2Zmc2V0LFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLiNyZXNwb25zZU9iamVjdCA9IGU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcImJsb2JcIikge1xuICAgICAgdGhpcy4jcmVzcG9uc2VPYmplY3QgPSBuZXcgQmxvYihbdGhpcy4jcmVjZWl2ZWRCeXRlc10sIHtcbiAgICAgICAgdHlwZTogdGhpcy4jZ2V0RmluYWxNSU1FVHlwZSgpLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiZG9jdW1lbnRcIikge1xuICAgICAgdGhpcy4jc2V0RG9jdW1lbnRSZXNwb25zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcImpzb25cIik7XG4gICAgICBpZiAodGhpcy4jcmVzcG9uc2U/LmJvZHkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBqc29uT2JqZWN0O1xuICAgICAgdHJ5IHtcbiAgICAgICAganNvbk9iamVjdCA9IHBhcnNlSlNPTkZyb21CeXRlcyh0aGlzLiNyZWNlaXZlZEJ5dGVzKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3Jlc3BvbnNlT2JqZWN0ID0ganNvbk9iamVjdDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlT2JqZWN0IGluc3RhbmNlb2YgRXJyb3IgPyBudWxsIDogdGhpcy4jcmVzcG9uc2VPYmplY3Q7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VUZXh0KCk6IHN0cmluZyB7XG4gICAgaWYgKCEodGhpcy4jcmVzcG9uc2VUeXBlID09PSBcIlwiIHx8IHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJ0ZXh0XCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgICBcIlJlc3BvbnNlIHR5cGUgaXMgbm90IHNldCBwcm9wZXJseVwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoISh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuTE9BRElORyB8fCB0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuRE9ORSkpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jZ2V0VGV4dFJlc3BvbnNlKCk7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VUeXBlKCk6IFhNTEh0dHBSZXF1ZXN0UmVzcG9uc2VUeXBlIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2VUeXBlO1xuICB9XG5cbiAgc2V0IHJlc3BvbnNlVHlwZSh2YWx1ZTogWE1MSHR0cFJlcXVlc3RSZXNwb25zZVR5cGUpIHtcbiAgICBpZiAodmFsdWUgPT09IFwiZG9jdW1lbnRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHJlc3BvbnNlIHR5cGUgY2Fubm90IGJlIGNoYW5nZWQgd2hlbiBsb2FkaW5nIG9yIGRvbmVcIixcbiAgICAgICAgXCJJbnZhbGlkU3RhdGVFcnJvclwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy4jcmVzcG9uc2VUeXBlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgcmVzcG9uc2VVUkwoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcG9uc2U/LnVybCA/PyBcIlwiO1xuICB9XG5cbiAgZ2V0IHJlc3BvbnNlWE1MKCk6IG51bGwge1xuICAgIGlmICghKHRoaXMuI3Jlc3BvbnNlVHlwZSA9PT0gXCJcIiB8fCB0aGlzLiNyZXNwb25zZVR5cGUgPT09IFwiZG9jdW1lbnRcIikpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiUmVzcG9uc2UgdHlwZSBpcyBub3QgcHJvcGVybHkgc2V0XCIsXG4gICAgICAgIFwiSW52YWxpZFN0YXRlRXJyb3JcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuRE9ORSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLiNzZXREb2N1bWVudFJlc3BvbnNlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0aGlzLiNzZXREb2N1bWVudFJlc3BvbnNlKCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXQgc3RhdHVzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5zdGF0dXMgPz8gMDtcbiAgfVxuXG4gIGdldCBzdGF0dXNUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5zdGF0dXNUZXh0ID8/IFwiXCI7XG4gIH1cblxuICBnZXQgdGltZW91dCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiN0aW1lb3V0O1xuICB9XG5cbiAgc2V0IHRpbWVvdXQodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuI3RpbWVvdXQgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB1cGxvYWQoKTogWE1MSHR0cFJlcXVlc3RVcGxvYWQge1xuICAgIHJldHVybiB0aGlzLiN1cGxvYWQ7XG4gIH1cblxuICBnZXQgd2l0aENyZWRlbnRpYWxzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNjcm9zc09yaWdpbkNyZWRlbnRpYWxzO1xuICB9XG5cbiAgc2V0IHdpdGhDcmVkZW50aWFscyh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmIChcbiAgICAgICEodGhpcy4jc3RhdGUgPT09IFN0YXRlLlVOU0VOVCB8fCB0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuT1BFTkVEKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgXCJUaGUgcmVxdWVzdCBpcyBub3QgdW5zZW50IG9yIG9wZW5lZFwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJUaGUgcmVxdWVzdCBoYXMgYmVlbiBzZW50XCIsIFwiSW52YWxpZFN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIHRoaXMuI2Nyb3NzT3JpZ2luQ3JlZGVudGlhbHMgPSB2YWx1ZTtcbiAgfVxuXG4gIGFib3J0KCk6IHZvaWQge1xuICAgIHRoaXMuI3Rlcm1pbmF0ZSgpO1xuICAgIGlmIChcbiAgICAgICh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuT1BFTkVEICYmIHRoaXMuI3NlbmRGbGFnKSB8fFxuICAgICAgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkhFQURFUlNfUkVDRUlWRUQgfHxcbiAgICAgIHRoaXMuI3N0YXRlID09PSBTdGF0ZS5MT0FESU5HXG4gICAgKSB7XG4gICAgICB0aGlzLiNyZXF1ZXN0RXJyb3JTdGVwcyhcImFib3J0XCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuVU5TRU5UO1xuICAgICAgdGhpcy4jcmVzcG9uc2UgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldnQ6IEV2ZW50KSB7XG4gICAgc3dpdGNoIChldnQudHlwZSkge1xuICAgICAgY2FzZSBcInJlYWR5c3RhdGVjaGFuZ2VcIjpcbiAgICAgICAgaWYgKHRoaXMub25yZWFkeXN0YXRlY2hhbmdlKSB7XG4gICAgICAgICAgdGhpcy5vbnJlYWR5c3RhdGVjaGFuZ2UuY2FsbCh0aGlzLCBldnQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoZXZ0LmNhbmNlbGFibGUgJiYgZXZ0LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgICB9XG4gIH1cblxuICBnZXRBbGxSZXNwb25zZUhlYWRlcnMoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCF0aGlzLiNyZXNwb25zZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRlcnMgPSBbLi4udGhpcy4jcmVzcG9uc2UuaGVhZGVyc107XG4gICAgaGVhZGVycy5zb3J0KChbYV0sIFtiXSkgPT4gYS5sb2NhbGVDb21wYXJlKGIpKTtcbiAgICByZXR1cm4gaGVhZGVycy5tYXAoKFtrZXksIHZhbHVlXSkgPT4gYCR7a2V5fTogJHt2YWx1ZX1gKS5qb2luKFwiXFxyXFxuXCIpO1xuICB9XG5cbiAgZ2V0UmVzcG9uc2VIZWFkZXIobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuI3Jlc3BvbnNlPy5oZWFkZXJzLmdldChuYW1lKSA/PyBudWxsO1xuICB9XG5cbiAgb3BlbihcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICB1cmw6IHN0cmluZyxcbiAgICBhc3luYyA9IHRydWUsXG4gICAgdXNlcm5hbWU6IHN0cmluZyB8IG51bGwgPSBudWxsLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbiAgKTogdm9pZCB7XG4gICAgbWV0aG9kID0gbWV0aG9kLnRvTG9jYWxlVXBwZXJDYXNlKCk7XG4gICAgaWYgKCFNRVRIT0RTLmluY2x1ZGVzKG1ldGhvZCkpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIGBUaGUgbWV0aG9kIFwiJHttZXRob2R9XCIgaXMgbm90IGFsbG93ZWQuYCxcbiAgICAgICAgXCJTeW50YXhFcnJvclwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgbGV0IHBhcnNlZFVybDogVVJMO1xuICAgIHRyeSB7XG4gICAgICBsZXQgYmFzZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYmFzZSA9IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIHdlIGp1c3Qgd2FudCB0byBhdm9pZCB0aGUgZXJyb3IgYWJvdXQgbG9jYXRpb24gaW4gRGVub1xuICAgICAgfVxuICAgICAgcGFyc2VkVXJsID0gbmV3IFVSTCh1cmwsIGJhc2UpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihgVGhlIHVybCBcIiR7dXJsfVwiIGlzIGludmFsaWQuYCwgXCJTeW50YXhFcnJvclwiKTtcbiAgICB9XG4gICAgaWYgKHVzZXJuYW1lICE9IG51bGwpIHtcbiAgICAgIHBhcnNlZFVybC51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIH1cbiAgICBpZiAocGFzc3dvcmQgIT0gbnVsbCkge1xuICAgICAgcGFyc2VkVXJsLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgfVxuICAgIGlmIChhc3luYyA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHBvbHlmaWxsIGRvZXMgbm90IHN1cHBvcnQgc3luYyBvcGVyYXRpb24uXCIsXG4gICAgICAgIFwiSW52YWxpZEFjY2Vzc0Vycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLiN0ZXJtaW5hdGUoKTtcbiAgICB0aGlzLiNzZW5kRmxhZyA9IGZhbHNlO1xuICAgIHRoaXMuI3VwbG9hZExpc3RlbmVyID0gZmFsc2U7XG4gICAgdGhpcy4jcmVxdWVzdE1ldGhvZCA9IG1ldGhvZDtcbiAgICB0aGlzLiN1cmwgPSBwYXJzZWRVcmw7XG4gICAgdGhpcy4jaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG4gICAgdGhpcy4jcmVzcG9uc2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jc3RhdGUgPSBTdGF0ZS5PUEVORUQ7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuICB9XG5cbiAgb3ZlcnJpZGVNaW1lVHlwZShtaW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy4jc3RhdGUgPT09IFN0YXRlLkxPQURJTkcgfHwgdGhpcy4jc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgIFwiVGhlIHJlcXVlc3QgaXMgaW4gYW4gaW52YWxpZCBzdGF0ZVwiLFxuICAgICAgICBcIkludmFsaWRTdGF0ZUVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLiNtaW1lID0gY29udGVudFR5cGUobWltZSkgPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgfVxuXG4gIHNlbmQoYm9keTogQm9keUluaXQgfCBudWxsID0gbnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuT1BFTkVEKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiSW52YWxpZCBzdGF0ZVwiLCBcIkludmFsaWRTdGF0ZUVycm9yXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJJbnZhbGlkIHN0YXRlXCIsIFwiSW52YWxpZFN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLiNyZXF1ZXN0TWV0aG9kID09PSBcIkdFVFwiIHx8IHRoaXMuI3JlcXVlc3RNZXRob2QgPT09IFwiSEVBRFwiKSB7XG4gICAgICBib2R5ID0gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgYWJvcnRDb250cm9sbGVyID0gdGhpcy4jYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHJlcSA9IG5ldyBSZXF1ZXN0KHRoaXMuI3VybCEudG9TdHJpbmcoKSwge1xuICAgICAgbWV0aG9kOiB0aGlzLiNyZXF1ZXN0TWV0aG9kLFxuICAgICAgaGVhZGVyczogdGhpcy4jaGVhZGVycyxcbiAgICAgIGJvZHksXG4gICAgICBtb2RlOiBcImNvcnNcIixcbiAgICAgIGNyZWRlbnRpYWxzOiB0aGlzLiNjcm9zc09yaWdpbkNyZWRlbnRpYWxzID8gXCJpbmNsdWRlXCIgOiBcInNhbWUtb3JpZ2luXCIsXG4gICAgICBzaWduYWw6IGFib3J0Q29udHJvbGxlci5zaWduYWwsXG4gICAgfSk7XG4gICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gZmFsc2U7XG4gICAgdGhpcy4jdGltZWRvdXRGbGFnID0gZmFsc2U7XG4gICAgaWYgKHJlcS5ib2R5ID09IG51bGwpIHtcbiAgICAgIHRoaXMuI3VwbG9hZENvbXBsZXRlRmxhZyA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuI3NlbmRGbGFnID0gdHJ1ZTtcblxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRzdGFydFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSkpO1xuICAgIHRoaXMuI3VwbG9hZC5kaXNwYXRjaEV2ZW50KFxuICAgICAgbmV3IFByb2dyZXNzRXZlbnQoXCJsb2Fkc3RhcnRcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICk7XG4gICAgaWYgKHRoaXMuI3N0YXRlICE9PSBTdGF0ZS5PUEVORUQgfHwgIXRoaXMuI3NlbmRGbGFnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHByb2Nlc3NSZXF1ZXN0RW5kT2ZCb2R5ID0gKCkgPT4ge1xuICAgICAgdGhpcy4jdXBsb2FkQ29tcGxldGVGbGFnID0gdHJ1ZTtcbiAgICAgIGlmICghdGhpcy4jdXBsb2FkTGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy4jdXBsb2FkLmRpc3BhdGNoRXZlbnQoXG4gICAgICAgIG5ldyBQcm9ncmVzc0V2ZW50KFwicHJvZ3Jlc3NcIiwgeyBsb2FkZWQ6IDAsIHRvdGFsOiAwIH0pLFxuICAgICAgKTtcbiAgICAgIHRoaXMuI3VwbG9hZC5kaXNwYXRjaEV2ZW50KFxuICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcImxvYWRcIiwge1xuICAgICAgICAgIGxvYWRlZDogMCxcbiAgICAgICAgICB0b3RhbDogMCxcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgdGhpcy4jdXBsb2FkLmRpc3BhdGNoRXZlbnQoXG4gICAgICAgIG5ldyBQcm9ncmVzc0V2ZW50KFwibG9hZGVuZFwiLCB7IGxvYWRlZDogMCwgdG90YWw6IDAgfSksXG4gICAgICApO1xuICAgIH07XG4gICAgY29uc3QgcHJvY2Vzc1Jlc3BvbnNlID0gYXN5bmMgKHJlc3BvbnNlOiBSZXNwb25zZSkgPT4ge1xuICAgICAgdGhpcy4jcmVzcG9uc2UgPSByZXNwb25zZTtcbiAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuSEVBREVSU19SRUNFSVZFRDtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZWFkeXN0YXRlY2hhbmdlXCIpKTtcbiAgICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuSEVBREVSU19SRUNFSVZFRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocmVzcG9uc2UuYm9keSA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuI2hhbmRsZVJlc3BvbnNlRW5kT2ZCb2R5KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRvdGFsID0gZXh0cmFjdExlbmd0aCh0aGlzLiNyZXNwb25zZSkgPz8gMDtcbiAgICAgIGxldCBsYXN0SW52b2tlZCA9IDA7XG4gICAgICBjb25zdCBwcm9jZXNzQm9keUNodW5rID0gKGJ5dGVzOiBVaW50OEFycmF5KSA9PiB7XG4gICAgICAgIHRoaXMuI3JlY2VpdmVkQnl0ZXMgPSBhcHBlbmRCeXRlcyh0aGlzLiNyZWNlaXZlZEJ5dGVzLCBieXRlcyk7XG4gICAgICAgIGlmICgoRGF0ZS5ub3coKSAtIGxhc3RJbnZva2VkKSA8PSA1MCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0SW52b2tlZCA9IERhdGUubm93KCk7XG4gICAgICAgIGlmICh0aGlzLiNzdGF0ZSA9PT0gU3RhdGUuSEVBREVSU19SRUNFSVZFRCkge1xuICAgICAgICAgIHRoaXMuI3N0YXRlID0gU3RhdGUuTE9BRElORztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICBuZXcgUHJvZ3Jlc3NFdmVudChcInByb2dyZXNzXCIsIHtcbiAgICAgICAgICAgIGxvYWRlZDogdGhpcy4jcmVjZWl2ZWRCeXRlcy5sZW5ndGgsXG4gICAgICAgICAgICB0b3RhbCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBwcm9jZXNzRW5kT2ZCb2R5ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLiNoYW5kbGVSZXNwb25zZUVuZE9mQm9keSgpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHByb2Nlc3NCb2R5RXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuI2hhbmRsZUVycm9ycygpO1xuICAgICAgfTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgYnl0ZXMgb2YgcmVzcG9uc2UuYm9keSkge1xuICAgICAgICAgIHByb2Nlc3NCb2R5Q2h1bmsoYnl0ZXMpO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NFbmRPZkJvZHkoKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBwcm9jZXNzQm9keUVycm9yKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBwcm9jZXNzUmVqZWN0aW9uID0gKCkgPT4ge1xuICAgICAgdGhpcy4jaGFuZGxlRXJyb3JzKCk7XG4gICAgfTtcbiAgICBjb25zdCBwID0gZmV0Y2gocmVxKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgcHJvY2Vzc1JlcXVlc3RFbmRPZkJvZHkoKTtcbiAgICAgIHJldHVybiBwcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH0pLmNhdGNoKHByb2Nlc3NSZWplY3Rpb24pO1xuICAgIGlmICh0aGlzLiN0aW1lb3V0ID4gMCkge1xuICAgICAgY29uc3QgdCA9IG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXMpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXModHJ1ZSksIHRoaXMuI3RpbWVvdXQpO1xuICAgICAgfSk7XG4gICAgICBQcm9taXNlLnJhY2UoW3AsIHRdKS50aGVuKCh2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiN0aW1lZG91dEZsYWcgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuI3Rlcm1pbmF0ZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLiNzdGF0ZSAhPT0gU3RhdGUuT1BFTkVEKSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiSW52YWxpZCBzdGF0ZVwiLCBcIkludmFsaWRTdGF0ZUVycm9yXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy4jc2VuZEZsYWcpIHtcbiAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJJbnZhbGlkIHN0YXRlXCIsIFwiSW52YWxpZGF0ZVN0YXRlRXJyb3JcIik7XG4gICAgfVxuICAgIHRoaXMuI2hlYWRlcnMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBET05FKCkge1xuICAgIHJldHVybiBTdGF0ZS5ET05FO1xuICB9XG5cbiAgZ2V0IEhFQURFUlNfUkVDRUlWRUQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLkhFQURFUlNfUkVDRUlWRUQ7XG4gIH1cblxuICBnZXQgTE9BRElORygpIHtcbiAgICByZXR1cm4gU3RhdGUuTE9BRElORztcbiAgfVxuXG4gIGdldCBPUEVORUQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLk9QRU5FRDtcbiAgfVxuXG4gIGdldCBVTlNFTlQoKSB7XG4gICAgcmV0dXJuIFN0YXRlLlVOU0VOVDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgRE9ORSgpIHtcbiAgICByZXR1cm4gU3RhdGUuRE9ORTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgSEVBREVSU19SRUNFSVZFRCgpIHtcbiAgICByZXR1cm4gU3RhdGUuSEVBREVSU19SRUNFSVZFRDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgTE9BRElORygpIHtcbiAgICByZXR1cm4gU3RhdGUuTE9BRElORztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgT1BFTkVEKCkge1xuICAgIHJldHVybiBTdGF0ZS5PUEVORUQ7XG4gIH1cblxuICBzdGF0aWMgZ2V0IFVOU0VOVCgpIHtcbiAgICByZXR1cm4gU3RhdGUuVU5TRU5UO1xuICB9XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG5mdW5jdGlvbiBtYXliZURlZmluZSh2YWx1ZTogRnVuY3Rpb24sIHNjb3BlOiBvYmplY3QpIHtcbiAgY29uc3QgbmFtZSA9IHZhbHVlLm5hbWU7XG4gIGlmICghKG5hbWUgaW4gZ2xvYmFsVGhpcykpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIG5hbWUsIHtcbiAgICAgIHZhbHVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcbiAgfVxufVxuXG5tYXliZURlZmluZShYTUxIdHRwUmVxdWVzdCwgZ2xvYmFsVGhpcyk7XG5tYXliZURlZmluZShYTUxIdHRwUmVxdWVzdEV2ZW50VGFyZ2V0LCBnbG9iYWxUaGlzKTtcbm1heWJlRGVmaW5lKFhNTEh0dHBSZXF1ZXN0VXBsb2FkLCBnbG9iYWxUaGlzKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxvRUFBb0U7QUFFcEUsd0NBQXdDO0FBRXhDLFNBQ0UsT0FBTyxFQUNQLFdBQVcsUUFDTixnREFBZ0Q7QUFVdkQsU0FBUyxPQUFPLElBQWEsRUFBRSxNQUFNLGtCQUFrQjtFQUNyRCxJQUFJLENBQUMsTUFBTTtJQUNULE1BQU0sTUFBTSxJQUFJLE1BQU07SUFDdEIsSUFBSSxJQUFJLEdBQUc7SUFDWCxNQUFNO0VBQ1I7QUFDRjtBQUVBLFNBQVMsY0FBYyxRQUFrQjtFQUN2QyxNQUFNLFNBQVMsU0FBUyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixNQUFNLGNBQWMsRUFBRTtFQUM3RSxJQUFJLGlCQUFnQztFQUNwQyxLQUFLLE1BQU0sU0FBUyxPQUFRO0lBQzFCLElBQUksa0JBQWtCLE1BQU07TUFDMUIsaUJBQWlCO0lBQ25CLE9BQU8sSUFBSSxVQUFVLGdCQUFnQjtNQUNuQyxNQUFNLElBQUksTUFBTTtJQUNsQjtFQUNGO0VBQ0EsSUFBSSxrQkFBa0IsTUFBTSxrQkFBa0IsTUFBTTtJQUNsRCxPQUFPO0VBQ1Q7RUFDQSxNQUFNLElBQUksU0FBUyxnQkFBZ0I7RUFDbkMsT0FBTyxPQUFPLEtBQUssQ0FBQyxLQUFLLE9BQU87QUFDbEM7QUFFQSxTQUFTLFdBQVcsS0FBYTtFQUMvQixPQUFPLE1BQU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQ2xDO0FBRUEsU0FBUyxnQkFBZ0IsT0FBZ0I7RUFDdkMsSUFBSSxXQUEwQjtFQUM5QixNQUFNLFNBQVMsUUFBUSxHQUFHLENBQUMsaUJBQWlCLE1BQU07RUFDbEQsSUFBSSxDQUFDLFFBQVE7SUFDWCxNQUFNLElBQUksTUFBTTtFQUNsQjtFQUNBLEtBQUssTUFBTSxTQUFTLE9BQVE7SUFDMUIsTUFBTSxvQkFBb0IsWUFBWTtJQUN0QyxJQUFJLENBQUMscUJBQXFCLFdBQVcsdUJBQXVCLE9BQU87TUFDakU7SUFDRjtJQUNBLFdBQVc7RUFDYjtFQUNBLElBQUksWUFBWSxNQUFNO0lBQ3BCLE1BQU0sSUFBSSxNQUFNO0VBQ2xCO0VBQ0EsT0FBTztBQUNUO0FBRUEsU0FBUyxlQUFlLEtBQWE7RUFDbkMsT0FBTyxXQUFXLFdBQVc7QUFDL0I7QUFFQSxTQUFTLGNBQWMsS0FBYTtFQUNsQyxNQUFNLFVBQVUsV0FBVztFQUMzQixPQUFPLFFBQVEsUUFBUSxDQUFDLFdBQVcsWUFBWSxjQUM3QyxZQUFZO0FBQ2hCO0FBRUEsTUFBTSxVQUFVLElBQUk7QUFFcEIsU0FBUyxtQkFBbUIsS0FBaUI7RUFDM0MsTUFBTSxTQUFTLFFBQVEsTUFBTSxDQUFDO0VBQzlCLE9BQU8sS0FBSyxLQUFLLENBQUM7QUFDcEI7QUFFQSxTQUFTLFlBQVksR0FBRyxLQUFtQjtFQUN6QyxJQUFJLFNBQVM7RUFDYixLQUFLLE1BQU0sS0FBSyxNQUFPO0lBQ3JCLFVBQVUsRUFBRSxNQUFNO0VBQ3BCO0VBQ0EsTUFBTSxTQUFTLElBQUksV0FBVztFQUM5QixJQUFJLFNBQVM7RUFDYixLQUFLLE1BQU0sS0FBSyxNQUFPO0lBQ3JCLE9BQU8sR0FBRyxDQUFDLEdBQUc7SUFDZCxVQUFVLEVBQUUsTUFBTTtFQUNwQjtFQUNBLE9BQU87QUFDVDtBQUVBLE1BQU0sa0NBQWtDO0VBQ3RDLFVBQXFFLEtBQUs7RUFDMUUsVUFBcUUsS0FBSztFQUMxRSxTQUFvRSxLQUFLO0VBQ3pFLFlBQXVFLEtBQUs7RUFDNUUsY0FBeUUsS0FBSztFQUM5RSxhQUF3RSxLQUFLO0VBQzdFLFlBQXVFLEtBQUs7RUFFNUUsY0FBYyxHQUFVLEVBQUU7SUFDeEIsSUFBSSxlQUFlLGVBQWU7TUFDaEMsTUFBTSxNQUFzQixJQUFJO01BQ2hDLE9BQVEsSUFBSSxJQUFJO1FBQ2QsS0FBSztVQUNILElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLO1VBQ3pCO1VBQ0E7UUFDRixLQUFLO1VBQ0gsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUs7VUFDekI7VUFDQTtRQUNGLEtBQUs7VUFDSCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLO1VBQ3hCO1VBQ0E7UUFDRixLQUFLO1VBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUs7VUFDM0I7VUFDQTtRQUNGLEtBQUs7VUFDSCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSztVQUM3QjtVQUNBO1FBQ0YsS0FBSztVQUNILElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLO1VBQzVCO1VBQ0E7UUFDRixLQUFLO1VBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUs7VUFDM0I7TUFDSjtJQUNGO0lBQ0EsSUFBSSxJQUFJLFVBQVUsSUFBSSxJQUFJLGdCQUFnQixFQUFFO01BQzFDLE9BQU87SUFDVCxPQUFPO01BQ0wsT0FBTyxLQUFLLENBQUMsY0FBYztJQUM3QjtFQUNGO0FBQ0Y7QUFFQSxNQUFNLDZCQUE2QjtBQUNuQztBQUVBLElBQUEsQUFBSywrQkFBQTs7Ozs7O1NBQUE7RUFBQTtBQVFMLE1BQU0sVUFBVTtFQUFDO0VBQU87RUFBUTtFQUFRO0VBQVU7RUFBVztDQUFNO0FBRW5FLE1BQU0sdUJBQXVCO0VBQzNCLENBQUEsV0FBWSxHQUFHLE1BQU07RUFDckIsQ0FBQSxlQUFnQixDQUFtQjtFQUNuQyxDQUFBLHNCQUF1QixHQUFHLE1BQU07RUFDaEMsQ0FBQSxPQUFRLEdBQUcsSUFBSSxVQUFVO0VBQ3pCLENBQUEsSUFBSyxDQUFVO0VBQ2YsQ0FBQSxhQUFjLEdBQUcsSUFBSSxhQUFhO0VBQ2xDLENBQUEsYUFBYyxDQUFVO0VBQ3hCLENBQUEsUUFBUyxDQUFZO0VBQ3JCLENBQUEsY0FBZSxHQUFRLEtBQUs7RUFDNUIsQ0FBQSxZQUFhLEdBQStCLEdBQUc7RUFDL0MsQ0FBQSxRQUFTLEdBQUcsTUFBTTtFQUNsQixDQUFBLEtBQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQztFQUN0QixDQUFBLFlBQWEsR0FBRyxNQUFNO0VBQ3RCLENBQUEsT0FBUSxHQUFHLEVBQUU7RUFDYixDQUFBLE1BQU8sR0FBRyxJQUFJLHVCQUF1QjtFQUNyQyxDQUFBLGtCQUFtQixHQUFHLE1BQU07RUFDNUIsQ0FBQSxjQUFlLEdBQUcsTUFBTTtFQUN4QixDQUFBLEdBQUksQ0FBTztFQUVYLENBQUEsbUJBQW9CO0lBQ2xCLElBQUk7TUFDRixPQUFPLElBQUksQ0FBQyxDQUFBLFFBQVM7TUFDckIsTUFBTSxXQUFXLGdCQUFnQixJQUFJLENBQUMsQ0FBQSxRQUFTLENBQUMsT0FBTztNQUN2RCxPQUFPO0lBQ1QsRUFBRSxPQUFNO01BQ04sT0FBTztJQUNUO0VBQ0Y7RUFFQSxDQUFBLGdCQUFpQjtJQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxJQUFLLEVBQUU7TUFDZixPQUFPLElBQUksQ0FBQyxDQUFBLG1CQUFvQjtJQUNsQyxPQUFPO01BQ0wsT0FBTyxJQUFJLENBQUMsQ0FBQSxJQUFLO0lBQ25CO0VBQ0Y7RUFFQSxDQUFBLGdCQUFpQjtJQUNmLE9BQU8sUUFBUSxJQUFJLENBQUMsQ0FBQSxnQkFBaUIsS0FBSyx1QkFBdUI7RUFDbkU7RUFFQSxDQUFBLGVBQWdCO0lBQ2QsSUFBSSxJQUFJLENBQUMsQ0FBQSxRQUFTLEVBQUUsUUFBUSxNQUFNO01BQ2hDLE9BQU87SUFDVDtJQUNBLElBQUksVUFBVSxJQUFJLENBQUMsQ0FBQSxnQkFBaUI7SUFDcEMsSUFDRSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssTUFBTSxXQUFXLFFBQ3hDLGNBQWMsSUFBSSxDQUFDLENBQUEsZ0JBQWlCLEtBQ3BDO01BQ0EsVUFBVTtJQUNaO0lBQ0EsVUFBVSxXQUFXO0lBQ3JCLE1BQU0sVUFBVSxJQUFJLFlBQVk7SUFDaEMsT0FBTyxRQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQSxhQUFjO0VBQzNDO0VBRUEsQ0FBQSx1QkFBd0I7SUFDdEIsT0FBTyxJQUFJLENBQUMsQ0FBQSxRQUFTO0lBQ3JCLE1BQU0sU0FBUyxJQUFJLENBQUMsQ0FBQSxhQUFjLENBQUMsTUFBTTtJQUN6QyxNQUFNLFFBQVEsY0FBYyxJQUFJLENBQUMsQ0FBQSxRQUFTLEtBQUs7SUFDL0MsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGNBQWMsWUFBWTtNQUFFO01BQVE7SUFBTTtJQUNqRSxJQUFJLENBQUMsQ0FBQSxLQUFNLEdBQUcsTUFBTSxJQUFJO0lBQ3hCLElBQUksQ0FBQyxDQUFBLFFBQVMsR0FBRztJQUNqQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksTUFBTTtJQUM3QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksY0FBYyxRQUFRO01BQUU7TUFBUTtJQUFNO0lBQzdELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxjQUFjLFdBQVc7TUFBRTtNQUFRO0lBQU07RUFDbEU7RUFFQSxDQUFBLFlBQWE7SUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUEsUUFBUyxFQUFFO01BQ25CO0lBQ0Y7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLFlBQWEsRUFBRTtNQUN0QixJQUFJLENBQUMsQ0FBQSxpQkFBa0IsQ0FBQztJQUMxQixPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsV0FBWSxFQUFFO01BQzVCLElBQUksQ0FBQyxDQUFBLGlCQUFrQixDQUFDO0lBQzFCLE9BQU87TUFDTCxJQUFJLENBQUMsQ0FBQSxpQkFBa0IsQ0FBQztJQUMxQjtFQUNGO0VBRUEsQ0FBQSxpQkFBa0IsQ0FBQyxLQUFhO0lBQzlCLElBQUksQ0FBQyxDQUFBLEtBQU0sR0FBRyxNQUFNLElBQUk7SUFDeEIsSUFBSSxDQUFDLENBQUEsUUFBUyxHQUFHO0lBQ2pCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxNQUFNO0lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxrQkFBbUIsRUFBRTtNQUM3QixJQUFJLENBQUMsQ0FBQSxrQkFBbUIsR0FBRztNQUMzQixJQUFJLElBQUksQ0FBQyxDQUFBLGNBQWUsRUFBRTtRQUN4QixJQUFJLENBQUMsQ0FBQSxNQUFPLENBQUMsYUFBYSxDQUN4QixJQUFJLGNBQWMsT0FBTztVQUFFLFFBQVE7VUFBRyxPQUFPO1FBQUU7UUFFakQsSUFBSSxDQUFDLENBQUEsTUFBTyxDQUFDLGFBQWEsQ0FDeEIsSUFBSSxjQUFjLFdBQVc7VUFBRSxRQUFRO1VBQUcsT0FBTztRQUFFO01BRXZEO0lBQ0Y7SUFDQSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksY0FBYyxPQUFPO01BQUUsUUFBUTtNQUFHLE9BQU87SUFBRTtJQUNsRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksY0FBYyxXQUFXO01BQUUsUUFBUTtNQUFHLE9BQU87SUFBRTtFQUN4RTtFQUVBLENBQUEsbUJBQW9CO0lBQ2xCLE9BQU8sSUFBSSxDQUFDLENBQUEsUUFBUztJQUNyQixJQUFJLElBQUksQ0FBQyxDQUFBLFFBQVMsQ0FBQyxJQUFJLElBQUksTUFBTTtNQUMvQjtJQUNGO0lBQ0EsTUFBTSxZQUFZLElBQUksQ0FBQyxDQUFBLGdCQUFpQjtJQUN4QyxJQUFJLENBQUMsQ0FBQyxlQUFlLGNBQWMsY0FBYyxVQUFVLEdBQUc7TUFDNUQ7SUFDRjtJQUNBLElBQUksSUFBSSxDQUFDLENBQUEsWUFBYSxLQUFLLE1BQU0sZUFBZSxZQUFZO01BQzFEO0lBQ0Y7SUFDQSxJQUFJLENBQUMsQ0FBQSxjQUFlLEdBQUcsSUFBSSxhQUN6QixxQ0FDQTtFQUVKO0VBRUEsQ0FBQSxTQUFVO0lBQ1IsSUFBSSxJQUFJLENBQUMsQ0FBQSxlQUFnQixFQUFFO01BQ3pCLElBQUksQ0FBQyxDQUFBLGVBQWdCLENBQUMsS0FBSztNQUMzQixJQUFJLENBQUMsQ0FBQSxlQUFnQixHQUFHO0lBQzFCO0VBQ0Y7RUFFQSxxQkFBd0UsS0FBSztFQUU3RSxJQUFJLGFBQXFCO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDLENBQUEsS0FBTTtFQUNwQjtFQUVBLElBQUksV0FBZ0I7SUFDbEIsSUFBSSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssTUFBTSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssUUFBUTtNQUM5RCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsS0FBTSxLQUFLLE1BQU0sSUFBSSxHQUFHO1FBQ2xFLE9BQU87TUFDVDtNQUNBLE9BQU8sSUFBSSxDQUFDLENBQUEsZUFBZ0I7SUFDOUI7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLElBQUksRUFBRTtNQUM5QixPQUFPO0lBQ1Q7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLGNBQWUsWUFBWSxPQUFPO01BQ3pDLE9BQU87SUFDVDtJQUNBLElBQUksSUFBSSxDQUFDLENBQUEsY0FBZSxJQUFJLE1BQU07TUFDaEMsT0FBTyxJQUFJLENBQUMsQ0FBQSxjQUFlO0lBQzdCO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssZUFBZTtNQUN4QyxJQUFJO1FBQ0YsSUFBSSxDQUFDLENBQUEsY0FBZSxHQUFHLElBQUksQ0FBQyxDQUFBLGFBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNyRCxJQUFJLENBQUMsQ0FBQSxhQUFjLENBQUMsVUFBVSxFQUM5QixJQUFJLENBQUMsQ0FBQSxhQUFjLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFBLGFBQWMsQ0FBQyxVQUFVO01BRW5FLEVBQUUsT0FBTyxHQUFHO1FBQ1YsSUFBSSxDQUFDLENBQUEsY0FBZSxHQUFHO1FBQ3ZCLE9BQU87TUFDVDtJQUNGLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssUUFBUTtNQUN4QyxJQUFJLENBQUMsQ0FBQSxjQUFlLEdBQUcsSUFBSSxLQUFLO1FBQUMsSUFBSSxDQUFDLENBQUEsYUFBYztPQUFDLEVBQUU7UUFDckQsTUFBTSxJQUFJLENBQUMsQ0FBQSxnQkFBaUI7TUFDOUI7SUFDRixPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsWUFBYSxLQUFLLFlBQVk7TUFDNUMsSUFBSSxDQUFDLENBQUEsbUJBQW9CO0lBQzNCLE9BQU87TUFDTCxPQUFPLElBQUksQ0FBQyxDQUFBLFlBQWEsS0FBSztNQUM5QixJQUFJLElBQUksQ0FBQyxDQUFBLFFBQVMsRUFBRSxRQUFRLE1BQU07UUFDaEMsT0FBTztNQUNUO01BQ0EsSUFBSTtNQUNKLElBQUk7UUFDRixhQUFhLG1CQUFtQixJQUFJLENBQUMsQ0FBQSxhQUFjO01BQ3JELEVBQUUsT0FBTTtRQUNOLE9BQU87TUFDVDtNQUNBLElBQUksQ0FBQyxDQUFBLGNBQWUsR0FBRztJQUN6QjtJQUNBLE9BQU8sSUFBSSxDQUFDLENBQUEsY0FBZSxZQUFZLFFBQVEsT0FBTyxJQUFJLENBQUMsQ0FBQSxjQUFlO0VBQzVFO0VBRUEsSUFBSSxlQUF1QjtJQUN6QixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssTUFBTSxJQUFJLENBQUMsQ0FBQSxZQUFhLEtBQUssTUFBTSxHQUFHO01BQ2pFLE1BQU0sSUFBSSxhQUNSLHFDQUNBO0lBRUo7SUFDQSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsS0FBTSxLQUFLLE1BQU0sSUFBSSxHQUFHO01BQ2xFLE9BQU87SUFDVDtJQUNBLE9BQU8sSUFBSSxDQUFDLENBQUEsZUFBZ0I7RUFDOUI7RUFFQSxJQUFJLGVBQTJDO0lBQzdDLE9BQU8sSUFBSSxDQUFDLENBQUEsWUFBYTtFQUMzQjtFQUVBLElBQUksYUFBYSxLQUFpQyxFQUFFO0lBQ2xELElBQUksVUFBVSxZQUFZO01BQ3hCO0lBQ0Y7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxJQUFJLEVBQUU7TUFDL0QsTUFBTSxJQUFJLGFBQ1IsNERBQ0E7SUFFSjtJQUNBLElBQUksQ0FBQyxDQUFBLFlBQWEsR0FBRztFQUN2QjtFQUVBLElBQUksY0FBc0I7SUFDeEIsT0FBTyxJQUFJLENBQUMsQ0FBQSxRQUFTLEVBQUUsT0FBTztFQUNoQztFQUVBLElBQUksY0FBb0I7SUFDdEIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsWUFBYSxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUEsWUFBYSxLQUFLLFVBQVUsR0FBRztNQUNyRSxNQUFNLElBQUksYUFDUixxQ0FDQTtJQUVKO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxJQUFJLEVBQUU7TUFDOUIsT0FBTztJQUNUO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxtQkFBb0IsWUFBWSxPQUFPO01BQzlDLE9BQU87SUFDVDtJQUNBLElBQUksQ0FBQyxDQUFBLG1CQUFvQjtJQUN6QixPQUFPO0VBQ1Q7RUFFQSxJQUFJLFNBQWlCO0lBQ25CLE9BQU8sSUFBSSxDQUFDLENBQUEsUUFBUyxFQUFFLFVBQVU7RUFDbkM7RUFFQSxJQUFJLGFBQXFCO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDLENBQUEsUUFBUyxFQUFFLGNBQWM7RUFDdkM7RUFFQSxJQUFJLFVBQWtCO0lBQ3BCLE9BQU8sSUFBSSxDQUFDLENBQUEsT0FBUTtFQUN0QjtFQUVBLElBQUksUUFBUSxLQUFhLEVBQUU7SUFDekIsSUFBSSxDQUFDLENBQUEsT0FBUSxHQUFHO0VBQ2xCO0VBRUEsSUFBSSxTQUErQjtJQUNqQyxPQUFPLElBQUksQ0FBQyxDQUFBLE1BQU87RUFDckI7RUFFQSxJQUFJLGtCQUEyQjtJQUM3QixPQUFPLElBQUksQ0FBQyxDQUFBLHNCQUF1QjtFQUNyQztFQUVBLElBQUksZ0JBQWdCLEtBQWMsRUFBRTtJQUNsQyxJQUNFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUEsS0FBTSxLQUFLLE1BQU0sTUFBTSxHQUM5RDtNQUNBLE1BQU0sSUFBSSxhQUNSLHVDQUNBO0lBRUo7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLFFBQVMsRUFBRTtNQUNsQixNQUFNLElBQUksYUFBYSw2QkFBNkI7SUFDdEQ7SUFDQSxJQUFJLENBQUMsQ0FBQSxzQkFBdUIsR0FBRztFQUNqQztFQUVBLFFBQWM7SUFDWixJQUFJLENBQUMsQ0FBQSxTQUFVO0lBQ2YsSUFDRSxBQUFDLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQSxRQUFTLElBQy9DLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLGdCQUFnQixJQUN0QyxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxPQUFPLEVBQzdCO01BQ0EsSUFBSSxDQUFDLENBQUEsaUJBQWtCLENBQUM7SUFDMUI7SUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLElBQUksRUFBRTtNQUM5QixJQUFJLENBQUMsQ0FBQSxLQUFNLEdBQUcsTUFBTSxNQUFNO01BQzFCLElBQUksQ0FBQyxDQUFBLFFBQVMsR0FBRztJQUNuQjtFQUNGO0VBRUEsY0FBYyxHQUFVLEVBQUU7SUFDeEIsT0FBUSxJQUFJLElBQUk7TUFDZCxLQUFLO1FBQ0gsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7VUFDM0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDckM7UUFDQTtJQUNKO0lBQ0EsSUFBSSxJQUFJLFVBQVUsSUFBSSxJQUFJLGdCQUFnQixFQUFFO01BQzFDLE9BQU87SUFDVCxPQUFPO01BQ0wsT0FBTyxLQUFLLENBQUMsY0FBYztJQUM3QjtFQUNGO0VBRUEsd0JBQXVDO0lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxRQUFTLEVBQUU7TUFDbkIsT0FBTztJQUNUO0lBQ0EsTUFBTSxVQUFVO1NBQUksSUFBSSxDQUFDLENBQUEsUUFBUyxDQUFDLE9BQU87S0FBQztJQUMzQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFLLEVBQUUsYUFBYSxDQUFDO0lBQzNDLE9BQU8sUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxHQUFLLEdBQUcsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQztFQUNoRTtFQUVBLGtCQUFrQixJQUFZLEVBQWlCO0lBQzdDLE9BQU8sSUFBSSxDQUFDLENBQUEsUUFBUyxFQUFFLFFBQVEsSUFBSSxTQUFTO0VBQzlDO0VBRUEsS0FDRSxNQUFjLEVBQ2QsR0FBVyxFQUNYLFFBQVEsSUFBSSxFQUNaLFdBQTBCLElBQUksRUFDOUIsV0FBMEIsSUFBSSxFQUN4QjtJQUNOLFNBQVMsT0FBTyxpQkFBaUI7SUFDakMsSUFBSSxDQUFDLFFBQVEsUUFBUSxDQUFDLFNBQVM7TUFDN0IsTUFBTSxJQUFJLGFBQ1IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxpQkFBaUIsQ0FBQyxFQUN4QztJQUVKO0lBQ0EsSUFBSTtJQUNKLElBQUk7TUFDRixJQUFJO01BQ0osSUFBSTtRQUNGLE9BQU8sT0FBTyxRQUFRLENBQUMsUUFBUTtNQUNqQyxFQUFFLE9BQU07TUFDTix5REFBeUQ7TUFDM0Q7TUFDQSxZQUFZLElBQUksSUFBSSxLQUFLO0lBQzNCLEVBQUUsT0FBTTtNQUNOLE1BQU0sSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksYUFBYSxDQUFDLEVBQUU7SUFDekQ7SUFDQSxJQUFJLFlBQVksTUFBTTtNQUNwQixVQUFVLFFBQVEsR0FBRztJQUN2QjtJQUNBLElBQUksWUFBWSxNQUFNO01BQ3BCLFVBQVUsUUFBUSxHQUFHO0lBQ3ZCO0lBQ0EsSUFBSSxVQUFVLE9BQU87TUFDbkIsTUFBTSxJQUFJLGFBQ1IsaURBQ0E7SUFFSjtJQUNBLElBQUksQ0FBQyxDQUFBLFNBQVU7SUFDZixJQUFJLENBQUMsQ0FBQSxRQUFTLEdBQUc7SUFDakIsSUFBSSxDQUFDLENBQUEsY0FBZSxHQUFHO0lBQ3ZCLElBQUksQ0FBQyxDQUFBLGFBQWMsR0FBRztJQUN0QixJQUFJLENBQUMsQ0FBQSxHQUFJLEdBQUc7SUFDWixJQUFJLENBQUMsQ0FBQSxPQUFRLEdBQUcsSUFBSTtJQUNwQixJQUFJLENBQUMsQ0FBQSxRQUFTLEdBQUc7SUFDakIsSUFBSSxDQUFDLENBQUEsS0FBTSxHQUFHLE1BQU0sTUFBTTtJQUMxQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksTUFBTTtFQUMvQjtFQUVBLGlCQUFpQixJQUFZLEVBQVE7SUFDbkMsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsS0FBTSxLQUFLLE1BQU0sSUFBSSxFQUFFO01BQy9ELE1BQU0sSUFBSSxhQUNSLHNDQUNBO0lBRUo7SUFDQSxJQUFJLENBQUMsQ0FBQSxJQUFLLEdBQUcsWUFBWSxTQUFTO0VBQ3BDO0VBRUEsS0FBSyxPQUF3QixJQUFJLEVBQVE7SUFDdkMsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxNQUFNLEVBQUU7TUFDaEMsTUFBTSxJQUFJLGFBQWEsaUJBQWlCO0lBQzFDO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxRQUFTLEVBQUU7TUFDbEIsTUFBTSxJQUFJLGFBQWEsaUJBQWlCO0lBQzFDO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxhQUFjLEtBQUssU0FBUyxJQUFJLENBQUMsQ0FBQSxhQUFjLEtBQUssUUFBUTtNQUNuRSxPQUFPO0lBQ1Q7SUFDQSxNQUFNLGtCQUFrQixJQUFJLENBQUMsQ0FBQSxlQUFnQixHQUFHLElBQUk7SUFDcEQsTUFBTSxNQUFNLElBQUksUUFBUSxJQUFJLENBQUMsQ0FBQSxHQUFJLENBQUUsUUFBUSxJQUFJO01BQzdDLFFBQVEsSUFBSSxDQUFDLENBQUEsYUFBYztNQUMzQixTQUFTLElBQUksQ0FBQyxDQUFBLE9BQVE7TUFDdEI7TUFDQSxNQUFNO01BQ04sYUFBYSxJQUFJLENBQUMsQ0FBQSxzQkFBdUIsR0FBRyxZQUFZO01BQ3hELFFBQVEsZ0JBQWdCLE1BQU07SUFDaEM7SUFDQSxJQUFJLENBQUMsQ0FBQSxrQkFBbUIsR0FBRztJQUMzQixJQUFJLENBQUMsQ0FBQSxZQUFhLEdBQUc7SUFDckIsSUFBSSxJQUFJLElBQUksSUFBSSxNQUFNO01BQ3BCLElBQUksQ0FBQyxDQUFBLGtCQUFtQixHQUFHO0lBQzdCO0lBQ0EsSUFBSSxDQUFDLENBQUEsUUFBUyxHQUFHO0lBRWpCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxjQUFjLGFBQWE7TUFBRSxRQUFRO01BQUcsT0FBTztJQUFFO0lBQ3hFLElBQUksQ0FBQyxDQUFBLE1BQU8sQ0FBQyxhQUFhLENBQ3hCLElBQUksY0FBYyxhQUFhO01BQUUsUUFBUTtNQUFHLE9BQU87SUFBRTtJQUV2RCxJQUFJLElBQUksQ0FBQyxDQUFBLEtBQU0sS0FBSyxNQUFNLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLFFBQVMsRUFBRTtNQUNuRDtJQUNGO0lBQ0EsTUFBTSwwQkFBMEI7TUFDOUIsSUFBSSxDQUFDLENBQUEsa0JBQW1CLEdBQUc7TUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLGNBQWUsRUFBRTtRQUN6QjtNQUNGO01BQ0EsSUFBSSxDQUFDLENBQUEsTUFBTyxDQUFDLGFBQWEsQ0FDeEIsSUFBSSxjQUFjLFlBQVk7UUFBRSxRQUFRO1FBQUcsT0FBTztNQUFFO01BRXRELElBQUksQ0FBQyxDQUFBLE1BQU8sQ0FBQyxhQUFhLENBQ3hCLElBQUksY0FBYyxRQUFRO1FBQ3hCLFFBQVE7UUFDUixPQUFPO01BQ1Q7TUFFRixJQUFJLENBQUMsQ0FBQSxNQUFPLENBQUMsYUFBYSxDQUN4QixJQUFJLGNBQWMsV0FBVztRQUFFLFFBQVE7UUFBRyxPQUFPO01BQUU7SUFFdkQ7SUFDQSxNQUFNLGtCQUFrQixPQUFPO01BQzdCLElBQUksQ0FBQyxDQUFBLFFBQVMsR0FBRztNQUNqQixJQUFJLENBQUMsQ0FBQSxLQUFNLEdBQUcsTUFBTSxnQkFBZ0I7TUFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLE1BQU07TUFDN0IsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxnQkFBZ0IsRUFBRTtRQUMxQztNQUNGO01BQ0EsSUFBSSxTQUFTLElBQUksSUFBSSxNQUFNO1FBQ3pCLElBQUksQ0FBQyxDQUFBLHVCQUF3QjtRQUM3QjtNQUNGO01BQ0EsTUFBTSxRQUFRLGNBQWMsSUFBSSxDQUFDLENBQUEsUUFBUyxLQUFLO01BQy9DLElBQUksY0FBYztNQUNsQixNQUFNLG1CQUFtQixDQUFDO1FBQ3hCLElBQUksQ0FBQyxDQUFBLGFBQWMsR0FBRyxZQUFZLElBQUksQ0FBQyxDQUFBLGFBQWMsRUFBRTtRQUN2RCxJQUFJLEFBQUMsS0FBSyxHQUFHLEtBQUssZUFBZ0IsSUFBSTtVQUNwQztRQUNGO1FBQ0EsY0FBYyxLQUFLLEdBQUc7UUFDdEIsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxnQkFBZ0IsRUFBRTtVQUMxQyxJQUFJLENBQUMsQ0FBQSxLQUFNLEdBQUcsTUFBTSxPQUFPO1FBQzdCO1FBQ0EsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLE1BQU07UUFDN0IsSUFBSSxDQUFDLGFBQWEsQ0FDaEIsSUFBSSxjQUFjLFlBQVk7VUFDNUIsUUFBUSxJQUFJLENBQUMsQ0FBQSxhQUFjLENBQUMsTUFBTTtVQUNsQztRQUNGO01BRUo7TUFDQSxNQUFNLG1CQUFtQjtRQUN2QixJQUFJLENBQUMsQ0FBQSx1QkFBd0I7TUFDL0I7TUFDQSxNQUFNLG1CQUFtQjtRQUN2QixJQUFJLENBQUMsQ0FBQSxZQUFhO01BQ3BCO01BQ0EsSUFBSTtRQUNGLFdBQVcsTUFBTSxTQUFTLFNBQVMsSUFBSSxDQUFFO1VBQ3ZDLGlCQUFpQjtRQUNuQjtRQUNBO01BQ0YsRUFBRSxPQUFNO1FBQ047TUFDRjtJQUNGO0lBQ0EsTUFBTSxtQkFBbUI7TUFDdkIsSUFBSSxDQUFDLENBQUEsWUFBYTtJQUNwQjtJQUNBLE1BQU0sSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUM7TUFDekI7TUFDQSxPQUFPLGdCQUFnQjtJQUN6QixHQUFHLEtBQUssQ0FBQztJQUNULElBQUksSUFBSSxDQUFDLENBQUEsT0FBUSxHQUFHLEdBQUc7TUFDckIsTUFBTSxJQUFJLElBQUksUUFBaUIsQ0FBQztRQUM5QixXQUFXLElBQU0sSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFBLE9BQVE7TUFDM0M7TUFDQSxRQUFRLElBQUksQ0FBQztRQUFDO1FBQUc7T0FBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pCLElBQUksT0FBTztVQUNULElBQUksQ0FBQyxDQUFBLFlBQWEsR0FBRztVQUNyQixJQUFJLENBQUMsQ0FBQSxTQUFVO1FBQ2pCO01BQ0Y7SUFDRjtFQUNGO0VBRUEsaUJBQWlCLElBQVksRUFBRSxLQUFhLEVBQVE7SUFDbEQsSUFBSSxJQUFJLENBQUMsQ0FBQSxLQUFNLEtBQUssTUFBTSxNQUFNLEVBQUU7TUFDaEMsTUFBTSxJQUFJLGFBQWEsaUJBQWlCO0lBQzFDO0lBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQSxRQUFTLEVBQUU7TUFDbEIsTUFBTSxJQUFJLGFBQWEsaUJBQWlCO0lBQzFDO0lBQ0EsSUFBSSxDQUFDLENBQUEsT0FBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNO0VBQzdCO0VBRUEsSUFBSSxPQUFPO0lBQ1QsT0FBTyxNQUFNLElBQUk7RUFDbkI7RUFFQSxJQUFJLG1CQUFtQjtJQUNyQixPQUFPLE1BQU0sZ0JBQWdCO0VBQy9CO0VBRUEsSUFBSSxVQUFVO0lBQ1osT0FBTyxNQUFNLE9BQU87RUFDdEI7RUFFQSxJQUFJLFNBQVM7SUFDWCxPQUFPLE1BQU0sTUFBTTtFQUNyQjtFQUVBLElBQUksU0FBUztJQUNYLE9BQU8sTUFBTSxNQUFNO0VBQ3JCO0VBRUEsV0FBVyxPQUFPO0lBQ2hCLE9BQU8sTUFBTSxJQUFJO0VBQ25CO0VBRUEsV0FBVyxtQkFBbUI7SUFDNUIsT0FBTyxNQUFNLGdCQUFnQjtFQUMvQjtFQUVBLFdBQVcsVUFBVTtJQUNuQixPQUFPLE1BQU0sT0FBTztFQUN0QjtFQUVBLFdBQVcsU0FBUztJQUNsQixPQUFPLE1BQU0sTUFBTTtFQUNyQjtFQUVBLFdBQVcsU0FBUztJQUNsQixPQUFPLE1BQU0sTUFBTTtFQUNyQjtBQUNGO0FBRUEsNkJBQTZCO0FBQzdCLFNBQVMsWUFBWSxLQUFlLEVBQUUsS0FBYTtFQUNqRCxNQUFNLE9BQU8sTUFBTSxJQUFJO0VBQ3ZCLElBQUksQ0FBQyxDQUFDLFFBQVEsVUFBVSxHQUFHO0lBQ3pCLE9BQU8sY0FBYyxDQUFDLE9BQU8sTUFBTTtNQUNqQztNQUNBLFVBQVU7TUFDVixjQUFjO01BQ2QsWUFBWTtJQUNkO0VBQ0Y7QUFDRjtBQUVBLFlBQVksZ0JBQWdCO0FBQzVCLFlBQVksMkJBQTJCO0FBQ3ZDLFlBQVksc0JBQXNCIn0=
// denoCacheMetadata=15257757207381674851,6062487422136084827