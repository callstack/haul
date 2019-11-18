const HasteModule = require('HasteModule'); // eslint-disable-line
// const HastePackage = require('pkg/HastePackage'); // packages not supported
const jpeg = require('./file.jpeg'); // eslint-disable-line
const pdf = require('./file.pdf');
const png = require('./file.png'); // eslint-disable-line
const gif = require('./file@2x.gif');

module.exports = () => {
  console.log(jpeg, pdf, png, gif, HasteModule);
};
