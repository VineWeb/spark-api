// lib/index.js

const CryptoJS = require('crypto-js');
const { Socket } = require('./socket');
// Tips: 星火大模型API当前有Lite、V2.0、Pro、Pro-128K、Max和4.0 Ultra六个版本，各版本独立计量tokens。
class Spark {
  secret = '';
  key = '';
  appid = '';
  version = '3.1';
  versions= ['1.1', '2.1', '3.1', 'pro-128k', '3.5', '4.0', 'Lite', 'V2.0', 'Pro', 'Pro-128K', 'Max','4.0 Ultra']
  versionMap = new Map([
    ['Lite', 'wss://spark-api.xf-yun.com/v1.1/chat'],
    ['1.1', 'wss://spark-api.xf-yun.com/v1.1/chat'],
    ['V2.0', 'wss://spark-api.xf-yun.com/v2.1/chat'],
    ['2.1', 'wss://spark-api.xf-yun.com/v2.1/chat'],
    ['Pro', 'wss://spark-api.xf-yun.com/v3.1/chat'],
    ['3.1', 'wss://spark-api.xf-yun.com/v3.1/chat'],
    ['Pro-128K', 'wss://spark-api.xf-yun.com/chat/pro-128k'],
    ['pro-128k', 'wss://spark-api.xf-yun.com/chat/pro-128k'],
    ['Max', 'wss://spark-api.xf-yun.com/v3.5/chat'],
    ['3.5', 'wss://spark-api.xf-yun.com/v3.5/chat'],
    ['4.0 Ultra', 'wss://spark-api.xf-yun.com/v4.0/chat'],
    ['4.0', 'wss://spark-api.xf-yun.com/v4.0/chat'],
  ])
  uid = 'admin';
  chatId = '';
  Requesting = false;
  constructor({ key, secret, appid, version, id, charId }) {
    if (!key || !secret) throw new Error('Invalid Key Or Secret');
    if (!appid) throw new Error('Please input appid');
    if (version) {
      if (String(version).length === 1 && Number(version)<4) {
        version=`${version}.1`
      }
      if (this.versions.indexOf(version) === -1) throw new Error('Invalid Version');
      this.version = version;
    }
    this.appid = appid;
    this.secret = secret;
    this.key = key;
    if (id) this.uid = id;
    if (charId) this.chatId = charId;
  }

  _getWebsocketUrl() {
    const host = 'spark-api.xf-yun.com';
    const date = new Date().toGMTString();
    const wurl = this.versionMap.get(this.version)
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v${this.version}/chat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.secret);
    const signature = signatureSha.toString(CryptoJS.enc.Base64);
    const authorizationOrigin = `api_key="${this.key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');
    const url = `${wurl}?authorization=${authorization}&date=${date}&host=${host}`;
    return url;
  }

  static _domains = {
    '1.1': 'general',
    '2.1': 'generalv2',
    '3.1': 'generalv3',
    '3.5': 'generalv3.5',
    '4.0': '4.0Ultra',
    'Lite': 'general',
    'V2.0': 'generalv2',
    'Pro': 'generalv3',
    'Pro-128K': 'pro-128k',
    'Max': 'generalv3.5',
    '4.0 Ultra': '4.0Ultra',
  }

  _getParams(content) {
    const domain = Spark._domains[this.version]
    const data = {
      header: {
        app_id: this.appid,
        uid: this.uid,
      },
      parameter: {
        chat: {
          domain,
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
        console.log(e, 'onerror')
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
