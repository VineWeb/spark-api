// test.js
const { Spark } = require('../lib/index.js');
const config = require('./config.js');
const spark = new Spark(config);

spark.send('你是谁!').then(response => {
  console.log(response);
}).catch(error => {
  console.error(error);
});
