# spark-api

## Installation

```js
npm install spark-api
```

## ES Modules

```js
import Spark from 'spark-api'; // OR 
import { Spark } from 'spark-api';
```

## Commonjs

```js
const Spark = require('spark-api'); // OR
const { Spark } = require('spark-api');
```

## Spark.send(question)

```js
const spark = new Spark({
  secret: 'secret',
  key: 'key',
  appid: 'appid'
});

spark.send('你是谁').then(response => {
  console.log(response); 
  // 您好，我是科大讯飞研发的认知智能大模型，我的名字叫讯飞星火认知大模型。我可以和人类进行自然交流，解答问题，高效完成各领域认知智能需求。
}).catch(error => {
  console.error(error);
});

## Version  default '3.1'
```js 
  const versionMap = new Map([
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
  ]
  )

  const spark = new Spark({
    secret: 'secret',
    key: 'key',
    appid: 'appid',
    version: '4.0 Ultra'
  });
```

```
## License

[MIT](https://github.com/VineWeb/spark-api)
