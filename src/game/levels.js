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
  },
  {
    name: 'Bài 4',
    mode: 'bike',
    title: 'Đi xe đạp: sát lề phải, dừng đèn đỏ',
    goal: 'Bé đạp xe đến trường. Trường ở cùng phía, cuối đoạn đường. Đi sát lề phải và dừng đúng vạch khi gặp đèn đỏ.',
    rules: [
      'Nên đội mũ bảo hiểm để bảo vệ đầu.',
      'Đi sát mép đường bên phải, đi hàng một.',
      'Đèn đỏ, đèn vàng: dừng xe trước vạch dừng.',
      'Đến cổng trường: bóp phanh, dừng xe sát lề.'
    ],
    prep: [
      { icon: '⛑️', text: 'Đội mũ bảo hiểm', good: true, why: 'Mũ bảo hiểm bảo vệ đầu khi lỡ bị ngã.' },
      { icon: '🔧', text: 'Kiểm tra phanh và lốp xe', good: true, why: 'Phanh hỏng thì không dừng kịp.' },
      { icon: '🎧', text: 'Đeo tai nghe nghe nhạc cho vui', good: false, why: 'Đeo tai nghe sẽ không nghe được tiếng còi xe.' },
      { icon: '👫', text: 'Chở thêm hai bạn ngồi phía sau', good: false, why: 'Xe đạp chỉ được chở một người.' }
    ],
    signals: [true],
    runnerChance: 0,
    traffic: { min: 1.2, max: 2.6, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    map: [
      'BBBBBBBBBBBBBBBBBBBBBBBBBB',
      '..........................',
      'rrrrrrrrrrrrrrrrzrrrrrrrrr',
      'rrrrrrrrrrrrrrrrzrrrrrrrrr',
      '..........................',
      'BHBBBBBBBBBBBBBBBBBBBBBSBB'
    ]
  },
  {
    name: 'Bài 5',
    mode: 'bike',
    title: 'Đi xe đạp: tránh xe đỗ, xin đường rẽ',
    goal: 'Trên đường có xe đỗ sát lề. Bé phải quan sát phía sau trước khi tránh, rồi giơ tay xin rẽ phải vào cổng trường.',
    rules: [
      'Gặp xe đỗ sát lề: quan sát phía sau trước.',
      'Chỉ ra giữa làn khi phía sau không có xe tới gần. Tránh xong thì vào lại sát lề.',
      'Muốn rẽ phải: giơ tay phải xin đường, đi chậm lại rồi mới rẽ.',
      'Không sang làn bên kia: đó là làn xe ngược chiều.'
    ],
    prep: [
      { icon: '⛑️', text: 'Đội mũ bảo hiểm', good: true, why: 'Mũ bảo hiểm bảo vệ đầu khi lỡ bị ngã.' },
      { icon: '🚲', text: 'Chọn xe đạp vừa người, ngồi lên chân chạm được đất', good: true, why: 'Xe quá to thì khó giữ thăng bằng và khó dừng.' },
      { icon: '📱', text: 'Cầm điện thoại xem bản đồ khi đạp xe', good: false, why: 'Không dùng điện thoại khi đang đi xe.' },
      { icon: '🚲🚲🚲', text: 'Đi hàng ba cùng các bạn cho vui', good: false, why: 'Xe đạp phải đi hàng một.' }
    ],
    signals: [false],
    runnerChance: 0,
    turnIntoGate: true,
    parked: [
      { x: 8, len: 1.75, color: '#f2f2f0' },
      { x: 15, len: 1.75, color: '#9c2121' }
    ],
    traffic: { min: 1.8, max: 3.6, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    map: [
      'BBBBBBBBBBBBBBBBBBBBBBBBBB',
      '..........................',
      'rrrrrrrrrrrrrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrrrrrrrrrrrrr',
      '..........................',
      'BHBBBBBBBBBBBBBBBBBBBBSBBB'
    ]
  },
  {
    name: 'Bài 6',
    title: 'Đi bộ: những tình huống bất ngờ',
    goal: 'Trên đường đến trường sẽ có vài chuyện bất ngờ. Mỗi lần như vậy, bé chọn cách xử lý đúng.',
    rules: [
      'Gặp xe ra vào cổng nhà: dừng lại chờ.',
      'Bạn gọi bên kia đường: vẫn đi tới vạch kẻ để sang.',
      'Bóng lăn ra đường: không chạy theo.',
      'Nghe còi xe cứu thương: dừng lại nhường đường.'
    ],
    signals: [true],
    runnerChance: 0,
    traffic: { min: 1.1, max: 2.4, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    events: [
      { id: 'reverse', c: 2, r: 4, from: { c: 3, r: 5 } },
      { id: 'friend', c: 5, r: 4, at: { c: 5, r: 1 } },
      { id: 'ball', c: 8, r: 4 },
      { id: 'ambulance', c: 10, r: 4, road: 0 }
    ],
    map: [
      'BBBBBBBBBBBBSBB',
      '...............',
      'rrrrrrrrrrzrrrr',
      'rrrrrrrrrrzrrrr',
      '...............',
      'BHBBBBBBBBBBBBB'
    ]
  },
  {
    name: 'Bài 7',
    title: 'Bé mẫu giáo: nắm tay mẹ qua đường',
    goal: 'Hôm nay mẹ đưa bé đến trường. Bé dưới 7 tuổi phải nắm tay người lớn khi qua đường.',
    rules: [
      'Đi trên vỉa hè cùng mẹ.',
      'Đến vạch kẻ đường: nhấn nút Nắm tay mẹ.',
      'Chờ đèn hình người màu xanh rồi cùng mẹ sang đường.',
      'Không buông tay mẹ khi đang qua đường.'
    ],
    signals: [true],
    runnerChance: 0,
    withParent: true,
    traffic: { min: 1.1, max: 2.4, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
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
    name: 'Bài 8',
    title: 'Xuống xe buýt rồi sang đường',
    goal: 'Bé vừa xuống xe buýt. Trường ở bên kia đường. Xe buýt đang đỗ che mất tầm nhìn, bé phải chờ xe đi rồi mới sang.',
    rules: [
      'Xuống xe buýt rồi đứng trên vỉa hè.',
      'Không đi vòng trước đầu hay sau đuôi xe buýt để sang đường.',
      'Chờ xe buýt chạy đi, rồi quan sát hai bên.',
      'Sang đường ở vạch kẻ khi không có xe tới gần.'
    ],
    signals: [false],
    runnerChance: 0,
    busStop: { wait: 12 },
    traffic: { min: 1.4, max: 3.0, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    map: [
      'BBBBBBBBSBBBBBB',
      '...............',
      'rrrrrrrzrrrrrrr',
      'rrrrrrrzrrrrrrr',
      '....A..........',
      'BBBBBBBBBBBBBBB'
    ]
  },
  {
    name: 'Bài 9',
    mode: 'bike',
    title: 'Đi xe đạp: những tình huống bất ngờ',
    goal: 'Trên đường đạp xe đến trường sẽ có vài chuyện bất ngờ. Bé chọn cách xử lý đúng, rồi dừng xe sát lề trước cổng trường.',
    rules: [
      'Đi ngang ô tô đỗ: cẩn thận cửa xe mở bất ngờ.',
      'Gặp ổ gà, đường trơn: đi chậm, giữ chắc tay lái.',
      'Gặp vật cản bất ngờ: bóp phanh, giữ thẳng tay lái.',
      'Muốn tránh xe đỗ: quan sát phía sau trước.'
    ],
    prep: [
      { icon: '⛑️', text: 'Đội mũ bảo hiểm', good: true, why: 'Mũ bảo hiểm bảo vệ đầu khi lỡ bị ngã.' },
      { icon: '🦺', text: 'Mặc áo sáng màu cho người khác dễ nhìn thấy', good: true, why: 'Áo sáng màu giúp người lái xe nhìn thấy bé từ xa.' },
      { icon: '☂️', text: 'Một tay cầm lái, một tay cầm ô che nắng', good: false, why: 'Phải giữ tay lái bằng cả hai tay. Vừa đạp xe vừa che ô rất dễ ngã.' },
      { icon: '🏁', text: 'Đạp xe đuổi nhau với các bạn trên đường', good: false, why: 'Đuổi nhau trên đường rất dễ va chạm.' }
    ],
    signals: [false],
    runnerChance: 0,
    parked: [{ x: 9, len: 1.75, color: '#5b6168', door: true }],
    events: [
      { id: 'door', x: 7.2 },
      { id: 'puddle', x: 12.6, at: 14 },
      { id: 'dog', x: 17.4, at: 19 }
    ],
    traffic: { min: 1.8, max: 3.6, types: ['moto', 'moto', 'moto', 'car', 'moto'] },
    map: [
      'BBBBBBBBBBBBBBBBBBBBBBBBBB',
      '..........................',
      'rrrrrrrrrrrrrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrrrrrrrrrrrrr',
      '..........................',
      'BHBBBBBBBBBBBBBBBBBBBBBSBB'
    ]
  }
];
