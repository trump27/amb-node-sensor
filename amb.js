v = (value, start, end) => {
  return parseInt(value.substr(start, end), 16);
}

n = (value) => {
  sensor = value
  if (value === 0x00) {
    sensor = 'hall-ic'  // ホールIC
  } else if (value === 0x01) {
    sensor = 'temperature'
  } else if (value === 0x02) {
    sensor = 'humidity'
  } else if (value === 0x03) {
    sensor = 'Illuminance'
  } else if (value === 0x30) {
    sensor = 'voltage'
  }
  return sensor;
}

phaseData = (rect) => {
  let payload = {};
  let data = rect
  if (data[0] != ':') return null

  payload.arriveTime = new Date().toLocaleString("ja")
  payload.routerId = v(data, 1, 8)  // #1
  if (payload.routerId != 0x80000000) return null;

  payload.LQI = v(data, 9, 2) // #2
  payload.SEQ = v(data, 11, 4) // #3
  payload.endDeviceSerial = v(data, 15, 8) // #4
  payload.endDeviceId = v(data, 23, 2) // #5
  payload.sensorCat = v(data, 25, 2)  // #6 PAL: 0x80固定
  // #10 PAL ver  MAG：0x01  AMB：0x02  MOT：0x03
  payload.palId = (v(data, 27, 2) & 0b00011110)
  // #10 上位3ビット
  payload.palVersion = (v(data, 27, 2) & 0xE0) >> 5;
  // change bit
  payload.palVersion = (payload.palVersion & 0x01) << 2 | payload.palVersion & 0x02 | (payload.palVersion & 0x04) >> 2

  payload.numsensor = v(data, 29, 2)  // #11
  if (!payload.numsensor) return null

  payload.datas = {}
  // payload.sensors = []
  let __addr = 31
  for (let i = 0; i < payload.numsensor; i++) {
    let sensor = {}
    // sensor.dataType = v(data, __addr, 2)
    let sensor_type = v(data, __addr + 2, 2) // #2
    sensor.type = sensor_type

    sensor.dataSource = n(sensor_type)

    let datalen = v(data, __addr + 6, 2) // #4

    if (sensor.dataSource == 'voltage') {
      // #3
      sensor.voltage_source = v(data, __addr + 4, 2)
      // 0x08 電源電圧のみ対象
      if (sensor.voltage_source != 0x08) {
        __addr += 8 + datalen * 2;
        continue
      }
    }
    sensor.data = v(data, __addr + 8, datalen * 2)
    if (sensor.dataSource == 'temperature') sensor.data /= 100;
    if (sensor.dataSource == 'humidity') sensor.data /= 100;
    // if (sensor.dataSource == '照度') sensor.data /= 100;
    __addr += 8 + datalen * 2;
    // payload.sensors.push(sensor);

    payload.datas[sensor.dataSource] = sensor
  }
  // msg.payload = payload;

  return payload
}

module.exports = phaseData