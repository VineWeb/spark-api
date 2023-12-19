// lib/index.js

const CryptoJS = require('crypto-js');
const { Socket } = require('./socket');

class Spark {
  secret = '';
  key = '';
  appid = '';
  version = 2;
  uid = 'admin';
  chatId = '';
  Requesting = false;

  constructor({ key, secret, appid, version, id, charId }) {
    if (!key || !secret) throw new Error('Invalid Key Or Secret');
    if (!appid) throw new Error('Please input appid');
    if (version) this.version = version;
    this.appid = appid;
    this.secret = secret;
    this.key = key;
    if (id) this.uid = id;
    if (charId) this.chatId = charId;
  }

  _getWebsocketUrl() {
    const host = 'spark-api.xf-yun.com';
    const date = new Date().toGMTString();
    const wurl = `wss://spark-api.xf-yun.com/v${this.version}.1/chat`;
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v${this.version}.1/chat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.secret);
    const signature = signatureSha.toString(CryptoJS.enc.Base64);
    const authorizationOrigin = `api_key="${this.key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');
    const url = `${wurl}?authorization=${authorization}&date=${date}&host=${host}`;
    return url;
  }

  static _domains = {
    '1': 'general',
    '2': 'generalv2',
    '3': 'generalv3',
  };

  _getParams(content) {
    const data = {
      header: {
        app_id: this.appid,
        uid: this.uid,
      },
      parameter: {
        chat: {
          domain: Spark._domains[this.version],
          temperature: 0.5,
          max_tokens: 2048,
          top_k: 4,
        },
      },
      payload: {
        message: {
          text: [{ role: 'user', content }],
        },
      },
    };
    return data;
  }

  send(question) {
    return new Promise((resolve, reject) => {
      if (this.Requesting) {
        return reject('Requesting');
      }
      this.Requesting = true;
      const url = this._getWebsocketUrl();
      const ws = new Socket(url);

      ws.onerror = (e) => {
        this.Requesting = false;
        reject(e);
      };

      ws.onclose = () => {
        this.Requesting = false;
      };

      ws.onopen = () => {
        const params = this._getParams(question);
        ws.send(JSON.stringify(params));
      };

      const result = [];

      ws.onmessage = (e) => {
        const { header, payload } = JSON.parse(e.data);

        if (header.code !== 0) {
          reject('MESSAGE_ERROR:' + header.message);
          this.Requesting = false;
          return;
        }

        const content = payload.choices.text.map((item) => item.content).join('');
        const seq = payload.choices.seq;
        result[seq] = content;

        const end = header.status === 2;

        if (end) {
          const res = result.join('');
          resolve(res);
        }
      };
    });
  }
}
module.exports = Spark ;
module.exports.Spark = Spark
