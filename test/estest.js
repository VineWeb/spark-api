// estest.js  执行前需要把package.json添加上 // "type": "module"
import Spark  from '../es/index.mjs';
import config from './esconfig.js';
const spark = new Spark(config);

spark.send('openai 是什么?').then(response => {
  console.log(response);
}).catch(error => {
  console.error(error);
});
