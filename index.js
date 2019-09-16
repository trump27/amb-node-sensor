const SerialPort = require('serialport')
const phaseData = require('./amb')

const port = new SerialPort('COM3', {
  baudRate: 115200
})

port.on('open', function () {
  console.log('opend');
})

port.on('data', function (data) {
  var text = String(data)
  let res = phaseData(text)
  // console.log(data)
  console.log(text)
  console.log(res)
});