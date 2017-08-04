const jpeg = require('./file.jpeg');
const pdf = require('./file.pdf');
const png = require('./file.png');
const gif = require('./file@2x.gif');

module.exports = () => {
  console.log(jpeg, pdf, png, gif);
};
