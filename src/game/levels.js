// Bản đồ dạng lưới. Mỗi ô = TILE mét.
// B: dãy nhà phố   .: vỉa hè   r: lòng đường   z: vạch kẻ đường cho người đi bộ
// H: cửa nhà bé (điểm xuất phát)   S: cổng trường (đích)   p: dải cây xanh (không đi được)
// Mỗi con đường gồm 2 hàng r/z liên tiếp: hàng trên xe chạy sang trái, hàng dưới xe chạy sang phải
// (giao thông bên phải như ở Việt Nam).

export const LEVELS = [
  {
    name: 'Bài 1',
    title: 'Qua đường có đèn tín hiệu',
    goal: 'Bé đi từ nhà đến trường. Trường ở bên kia đường: hãy đi trên vỉa hè tới vạch kẻ đường và chờ đèn.',
    rules: [
      'Đi trên vỉa hè, không đi xuống lòng đường.',
      'Chỉ sang đường ở vạch kẻ trắng dành cho người đi bộ.',
      'Đèn hình người màu đỏ: đứng chờ trên vỉa hè. Màu xanh mới được đi.',
      'Đèn xanh nhấp nháy là sắp hết giờ, đừng bắt đầu sang nữa.'
    ],
    signals: [true],
    runnerChance: 0,
    traffic: { min: 0.9, max: 2.2, types: ['moto', 'moto', 'moto', 'car', 'moto', 'car'] },
    map: [
      'BBBBBSBBBBBBBBB',
      '...............',
      'rrrrrrrrrrzrrrr',
      'rrrrrrrrrrzrrrr',
      '...............',
      'BBHBBBBBBBBBBBB'
    ]
  },
  {
    name: 'Bài 2',
    title: 'Qua đường không có đèn',
    goal: 'Đoạn đường này không có đèn tín hiệu. Bé phải tự quan sát xe trước khi sang đường.',
    rules: [
      'Đi đến sát mép vỉa hè, ngay đầu vạch kẻ đường, rồi dừng lại.',
      'Nhấn Quan sát để nhìn bên trái, rồi nhìn bên phải.',
      'Chỉ đi khi không có xe đang tới gần.',
      'Đi thẳng qua đường, không chạy, không đứng lại giữa đường.'
    ],
    signals: [false],
    runnerChance: 0,
    traffic: { min: 1.6, max: 3.4, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    map: [
      'BBBBBBBBBBSBBBB',
      '...............',
      'rrrrzrrrrrrrrrr',
      'rrrrzrrrrrrrrrr',
      '...............',
      'BBBBBBBBBBBHBBB'
    ]
  },
  {
    name: 'Bài 3',
    title: 'Cả đoạn đường đến trường',
    goal: 'Hôm nay bé qua hai con đường: đường nhỏ không có đèn, đường lớn có đèn. Cẩn thận: có người vượt đèn đỏ!',
    rules: [
      'Luôn đi trên vỉa hè, đi qua lối đi giữa hai dải cây.',
      'Đường không có đèn: dừng ở mép vỉa hè, quan sát, rồi mới đi.',
      'Đường có đèn: chờ đèn người đi bộ màu xanh.',
      'Đèn xanh vẫn phải nhìn hai bên, vì có xe vượt đèn đỏ.'
    ],
    signals: [true, false],
    runnerChance: 0.3,
    traffic: { min: 1.3, max: 3.0, types: ['moto', 'moto', 'car', 'moto', 'bus', 'moto'] },
    map: [
      'BBBBBBSBBBBBBBB',
      '...............',
      'rrrrrrrrrrrzrrr',
      'rrrrrrrrrrrzrrr',
      '...............',
      'ppppp...ppppppp',
      '...............',
      'rrrzrrrrrrrrrrr',
      'rrrzrrrrrrrrrrr',
      '...............',
      'BBBBBBBBHBBBBBB'
    ]
  }
];
