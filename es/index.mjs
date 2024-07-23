import CryptoJS from 'crypto-js';
import { Socket } from './socket.mjs';
export class Spark {
  secret =  '';
  key = '';
  appid= '';
  version= '3.1';
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
  uid= 'admin';
  chatId= ''
  Requesting= false;
  wurl = `wss://spark-api.xf-yun.com/v${this.version}/chat`
  constructor({ key, secret, appid, version, id, charId }) {
    if (!key || !secret) throw new Error('Invalid Key Or Secret');
    if (!appid) throw new Error('Plesae input appid');
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
    // if (!id) throw new Error('Plesae input user id');
    if (id) this.uid = id
    if (charId) this.chatId = charId
  }
  // 鉴权处理, 获取鉴权后的wss链接
  _getWebsocketUrl() {
    const host = `spark-api.xf-yun.com`
    const date = new Date().toGMTString()
    const wurl = this.versionMap.get(this.version)
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v${this.version}/chat HTTP/1.1`
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.secret)
    const signature = signatureSha.toString(CryptoJS.enc.Base64)
    const authorizationOrigin = `api_key="${this.key}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    const authorization = Buffer.from(authorizationOrigin).toString('base64')
    const url = `${wurl}?authorization=${authorization}&date=${date}&host=${host}`
    return url
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
  
  static _maxtokens = {
    // V1.5取值为[1,4096]
    // V2.0取值为[1,8192]，默认为2048。
    // V3.0取值为[1,8192]，默认为2048
  }
  // 调用信息的处理
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
          temperature: 0.5, // 取值为[0,1],默认为0.5  核采样阈值。用于决定结果随机性，取值越高随机性越强即相同的问题得到的不同答案的可能性越高
          max_tokens: 2048, // 默认为2048 型回答的tokens的最大长度 参考this._maxtokens
          top_k: 4, // 取值为[1，6],默认为4	从k个候选中随机选择⼀个（⾮等概率）
          // chat_id: 'chat_id'	需要保障用户下的唯一性	用于关联用户会话
        },
      },
      payload: {
        message: {
          text: [{ role: 'user', content }],
          /**
            role	string	是	取值为[user,assistant]	user表示是用户的问题，assistant表示AI的回复
            content	string	是	所有content的累计tokens需控制8192以内	用户和AI的对话内容
          */
        },
      },
    }
    return data
  }
  send(question) {
    return new Promise((resolve, reject) => {
      if (this.Requesting) {
          return reject('Requesting');
      }
      this.Requesting = true;
      const url = this._getWebsocketUrl()
      const ws = new Socket(url)
      ws.onerror = (e) => {
        this.isInRequest = false;
        reject(e)
      }
      ws.onclose = () => {
        this.Requesting = false
      }
      ws.onopen = () => { 
        const params = this._getParams(question)
        ws.send(JSON.stringify(params))
      }
      const result = [];
      ws.onmessage = (e) => {
        /**
         * 
        header部分
            字段名	类型	字段说明
            code	int	错误码，0表示正常，非0表示出错；详细释义可在接口说明文档最后的错误码说明了解
            message	string	会话是否成功的描述信息
            sid	string	会话的唯一id，用于讯飞技术人员查询服务端会话日志使用,出现调用错误时建议留存该字段
            status	int	会话状态，取值为[0,1,2]；0代表首次结果；1代表中间结果；2代表最后一个结果
         * 
         */
        const { header, payload } = JSON.parse(e.data);
        if (header.code !== 0) {
            reject('MESSAGE_ERROR:' + header.message);
            this.isInRequest = false;
            return;
        }
        const content = payload.choices.text.map((item) => item.content).join('');
        const seq = payload.choices.seq;
        result[seq] = content;
        const end = header.status === 2; // 最后一个结果拿到
        if (end) {
          const res = result.join('')
          resolve(res)
        }
      }
    })
  }
}


export default Spark;