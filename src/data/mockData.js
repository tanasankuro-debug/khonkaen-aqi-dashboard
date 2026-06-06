const d = new Date();
const date = d.toISOString().split('T')[0];
const time = d.toTimeString().slice(0, 5);

function station(id, nameTH, nameEN, areaTH, areaEN, lat, long, aqi, pm25, pm10, o3, co, no2, so2, type = 'GROUND') {
  const aqiN = parseInt(aqi);
  const color = aqiN <= 25 ? 'blue' : aqiN <= 50 ? 'green' : aqiN <= 100 ? 'yellow' : aqiN <= 200 ? 'orange' : 'red';
  const dominant = pm25 > 37.5 ? 'PM25' : o3 > 50 ? 'O3' : 'PM25';
  return {
    stationID: id, nameTH, nameEN, areaTH, areaEN, stationType: type,
    lat: String(lat), long: String(long),
    AQILast: {
      date, time,
      AQI:  { aqi: String(aqi), param: dominant, color, aqi_previous: String(Math.max(0, aqiN - Math.floor(Math.random()*15-5))) },
      PM25: { value: String(pm25), unit: 'μg/m³', color },
      PM10: { value: String(pm10), unit: 'μg/m³', color: pm10 > 100 ? 'orange' : pm10 > 50 ? 'yellow' : 'green' },
      O3:   { value: String(o3),   unit: 'ppb',   color: o3 > 70 ? 'orange' : o3 > 50 ? 'yellow' : 'blue' },
      CO:   { value: String(co),   unit: 'ppm',   color: co > 9.4 ? 'red' : co > 4.4 ? 'orange' : 'blue' },
      NO2:  { value: String(no2),  unit: 'ppb',   color: no2 > 100 ? 'orange' : 'blue' },
      SO2:  { value: String(so2),  unit: 'ppb',   color: so2 > 75 ? 'orange' : 'blue' },
    },
  };
}

export const MOCK_STATIONS = [
  // ── ภาคตะวันออกเฉียงเหนือ (Isan / Northeast) ──────────────────────
  station('46t','สถานีริมถนนมิตรภาพ ขอนแก่น','Mittraphap Rd, Khon Kaen','ขอนแก่น','Khon Kaen',16.4432,102.8236,87,42.3,65.1,38.2,0.8,18.5,4.2),
  station('46t2','สถานีตลาดขอนแก่น','Khon Kaen Market','ขอนแก่น','Khon Kaen',16.4122,102.8336,62,28.1,48.3,31.4,0.5,12.1,2.8,'ROADSIDE'),
  station('47t','สถานีอุดรธานี','Udon Thani Station','อุดรธานี','Udon Thani',17.4156,102.7870,55,24.8,44.2,29.3,0.6,14.2,3.1),
  station('47t2','สถานีห้างสรรพสินค้า อุดรธานี','Udon Thani Mall','อุดรธานี','Udon Thani',17.3800,102.8200,44,19.2,36.8,25.1,0.4,10.3,2.1,'ROADSIDE'),
  station('48t','สถานีนครราชสีมา','Nakhon Ratchasima','นครราชสีมา','Nakhon Ratchasima',14.9714,102.1019,103,51.7,82.4,44.8,1.1,22.3,5.8),
  station('48t2','สถานีปากช่อง','Pak Chong','นครราชสีมา','Nakhon Ratchasima',14.7043,101.4073,78,36.2,58.7,40.2,0.9,16.8,4.1),
  station('50t','สถานีอุบลราชธานี','Ubon Ratchathani','อุบลราชธานี','Ubon Ratchathani',15.2448,104.8473,68,31.4,52.6,33.7,0.7,15.4,3.6),
  station('52t','สถานีสกลนคร','Sakon Nakhon','สกลนคร','Sakon Nakhon',17.1564,104.1456,48,21.3,38.9,27.6,0.5,11.7,2.4),
  station('53t','สถานีหนองคาย','Nong Khai','หนองคาย','Nong Khai',17.8782,102.7423,39,16.8,31.2,22.4,0.4,9.8,1.9),
  station('54t','สถานีร้อยเอ็ด','Roi Et','ร้อยเอ็ด','Roi Et',16.0543,103.6520,72,34.5,55.8,36.1,0.8,17.2,3.9),
  station('55t','สถานีมุกดาหาร','Mukdahan','มุกดาหาร','Mukdahan',16.5428,104.7237,41,17.9,33.4,24.3,0.4,10.5,2.2),
  station('56t','สถานีชัยภูมิ','Chaiyaphum','ชัยภูมิ','Chaiyaphum',15.8068,102.0317,91,44.8,70.3,41.5,1.0,20.1,4.8),
  station('57t','สถานีมหาสารคาม','Maha Sarakham','มหาสารคาม','Maha Sarakham',16.1852,103.3025,58,26.2,46.5,30.8,0.6,13.5,3.0),
  station('58t','สถานีกาฬสินธุ์','Kalasin','กาฬสินธุ์','Kalasin',16.4334,103.5061,47,20.8,37.6,26.5,0.4,11.2,2.3),
  station('59t','สถานีเลย','Loei','เลย','Loei',17.4896,101.7232,34,14.2,27.8,19.8,0.3,8.4,1.7),
  station('60t','สถานีบึงกาฬ','Bueng Kan','บึงกาฬ','Bueng Kan',18.3609,103.6518,28,11.5,22.3,16.4,0.3,7.1,1.4),

  // ── ภาคเหนือ (North) ────────────────────────────────────────────────
  station('35t','สถานีเชียงใหม่','Chiang Mai','เชียงใหม่','Chiang Mai',18.7904,98.9847,156,82.4,124.7,58.3,1.8,28.6,7.2),
  station('36t','สถานีเชียงราย','Chiang Rai','เชียงราย','Chiang Rai',19.9071,99.8307,142,74.8,112.3,53.6,1.6,25.4,6.5),
  station('38t','สถานีลำปาง','Lampang','ลำปาง','Lampang',18.2888,99.4978,118,60.5,94.8,49.2,1.4,22.7,5.9,'ROADSIDE'),
  station('40t','สถานีพิษณุโลก','Phitsanulok','พิษณุโลก','Phitsanulok',16.8211,100.2659,95,47.2,75.6,42.8,1.1,21.3,5.3),
  station('41t','สถานีน่าน','Nan','น่าน','Nan',18.7756,100.7730,82,39.6,63.4,37.4,0.9,18.5,4.5),
  station('42t','สถานีแม่ฮ่องสอน','Mae Hong Son','แม่ฮ่องสอน','Mae Hong Son',19.2985,97.9658,178,96.3,148.2,63.7,2.1,33.4,8.6),

  // ── กรุงเทพฯ และปริมณฑล (Bangkok Metro) ────────────────────────────
  station('10t','สถานีริมถนนพระราม 4','Rama IV Rd, Bangkok','กรุงเทพมหานคร','Bangkok',13.7234,100.5196,89,43.7,67.2,39.4,0.9,19.3,4.5,'ROADSIDE'),
  station('11t','สถานีดินแดง กทม.','Din Daeng, Bangkok','กรุงเทพมหานคร','Bangkok',13.7651,100.5619,97,48.6,76.4,43.5,1.0,21.2,5.1,'ROADSIDE'),
  station('02t','สถานีปทุมธานี','Pathum Thani','ปทุมธานี','Pathum Thani',14.0208,100.5250,73,34.9,56.1,36.8,0.8,16.9,3.9),
  station('03t','สถานีสมุทรปราการ','Samut Prakan','สมุทรปราการ','Samut Prakan',13.5991,100.5998,108,54.2,86.5,46.3,1.2,23.8,6.1,'ROADSIDE'),

  // ── ภาคใต้ (South) ──────────────────────────────────────────────────
  station('71t','สถานีหาดใหญ่','Hat Yai','สงขลา','Songkhla',7.0021,100.4770,42,18.3,34.6,24.8,0.4,10.8,2.3),
  station('73t','สถานีสุราษฎร์ธานี','Surat Thani','สุราษฎร์ธานี','Surat Thani',9.1382,99.3216,36,15.2,29.4,21.6,0.3,9.2,1.8),
  station('75t','สถานีภูเก็ต','Phuket','ภูเก็ต','Phuket',7.8804,98.3923,24,9.8,20.4,15.3,0.2,6.8,1.2),

  // ── ภาคกลาง/ตะวันตก (Central/West) ─────────────────────────────────
  station('20t','สถานีนครสวรรค์','Nakhon Sawan','นครสวรรค์','Nakhon Sawan',15.7030,100.1373,84,40.8,64.5,38.6,1.0,18.9,4.4),
  station('22t','สถานีอยุธยา','Ayutthaya','พระนครศรีอยุธยา','Ayutthaya',14.3560,100.5583,76,36.4,58.8,37.5,0.8,17.5,4.0),
  station('25t','สถานีสระบุรี','Saraburi','สระบุรี','Saraburi',14.5289,100.9108,112,56.8,89.4,47.6,1.3,24.5,6.3,'ROADSIDE'),
];

export const MOCK_DATA = { stations: MOCK_STATIONS };
