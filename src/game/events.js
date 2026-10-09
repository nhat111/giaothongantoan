// Tình huống bất ngờ: khi bé tới đúng chỗ, trò chơi dừng lại, cảnh 3D diễn ra
// và bé chọn cách xử lý. Mỗi lựa chọn có lời giải thích để bé hiểu vì sao.

export const EVENTS = {
  reverse: {
    icon: '🛵',
    prompt: 'Có một chiếc xe máy đang lùi ra từ cổng nhà phía trước. Bé làm gì?',
    choices: [
      { icon: '🏃', text: 'Đi nhanh qua sau đuôi xe', good: false, why: 'Người lái xe đang lùi rất khó nhìn thấy bé.' },
      { icon: '✋', text: 'Dừng lại, chờ xe ra hết rồi mới đi tiếp', good: true, why: 'Đúng rồi! Gặp xe ra vào cổng nhà, đầu hẻm thì dừng lại chờ.' }
    ],
    lesson: 'Gặp xe ra vào cổng nhà, đầu hẻm: dừng lại chờ.'
  },
  friend: {
    icon: '👋',
    prompt: 'Bạn của bé đứng bên kia đường vẫy tay gọi. Bé làm gì?',
    choices: [
      { icon: '🏃', text: 'Chạy thẳng sang đường với bạn', good: false, why: 'Không băng qua đường ở chỗ không có vạch kẻ, kể cả khi bạn gọi.' },
      { icon: '🚶', text: 'Vẫy tay chào, rồi đi tới vạch kẻ đường để sang', good: true, why: 'Đúng rồi! Bạn đợi được, bé cứ đi đúng chỗ.' }
    ],
    lesson: 'Bạn gọi bên kia đường: vẫn đi tới vạch kẻ để sang.'
  },
  ball: {
    icon: '⚽',
    prompt: 'Quả bóng của bé rơi xuống và lăn ra lòng đường. Bé làm gì?',
    choices: [
      { icon: '🏃', text: 'Chạy xuống đường nhặt bóng ngay', good: false, why: 'Chạy theo bóng ra đường rất dễ bị xe đâm, vì xe không kịp thấy bé.' },
      { icon: '🧑', text: 'Đứng yên trên vỉa hè, nhờ người lớn nhặt giúp', good: true, why: 'Đúng rồi! Mất bóng thì mua lại được, bé phải luôn an toàn.' }
    ],
    lesson: 'Bóng lăn ra đường: không chạy theo, nhờ người lớn giúp.'
  },
  ambulance: {
    icon: '🚑',
    prompt: 'Đèn đã xanh nhưng có tiếng còi hú: xe cứu thương đang chạy tới. Bé làm gì?',
    choices: [
      { icon: '🚶', text: 'Đi tiếp vì đèn đang xanh', good: false, why: 'Xe cứu thương, xe cứu hoả, xe công an đang hú còi được đi trước. Phải nhường đường.' },
      { icon: '✋', text: 'Đứng lại trên vỉa hè, chờ xe cứu thương đi qua', good: true, why: 'Đúng rồi! Nghe còi xe ưu tiên là phải dừng lại nhường đường.' }
    ],
    lesson: 'Nghe còi xe ưu tiên: dừng lại nhường đường.'
  },
  door: {
    icon: '🚗',
    prompt: 'Ô tô đỗ phía trước bất ngờ mở cửa ra. Bé làm gì?',
    choices: [
      { icon: '💨', text: 'Lách thật nhanh qua sát cánh cửa', good: false, why: 'Cửa xe có thể mở rộng thêm và làm bé ngã.' },
      { icon: '✋', text: 'Bóp phanh, dừng lại chờ cửa đóng', good: true, why: 'Đúng rồi! Đi ngang ô tô đỗ phải cẩn thận cửa xe mở bất ngờ.' }
    ],
    lesson: 'Đi ngang ô tô đỗ: cẩn thận cửa xe mở bất ngờ.'
  },
  puddle: {
    icon: '💧',
    prompt: 'Phía trước có một ổ gà đầy nước. Bé làm gì?',
    choices: [
      { icon: '💨', text: 'Đạp thật nhanh qua cho nước bắn vui', good: false, why: 'Ổ gà có thể sâu, làm xe chao đảo và bé bị ngã.' },
      { icon: '🐢', text: 'Đi chậm lại, giữ chắc tay lái', good: true, why: 'Đúng rồi! Gặp ổ gà, đường trơn thì đi chậm và giữ chắc tay lái.' }
    ],
    lesson: 'Gặp ổ gà, đường trơn: đi chậm, giữ chắc tay lái.'
  },
  dog: {
    icon: '🐕',
    prompt: 'Một chú chó bất ngờ chạy ra trước xe đạp. Bé làm gì?',
    choices: [
      { icon: '↩️', text: 'Bẻ lái thật mạnh sang làn bên kia', good: false, why: 'Bẻ lái đột ngột sang làn bên kia dễ bị xe ngược chiều đâm.' },
      { icon: '✋', text: 'Bóp phanh, giữ thẳng tay lái', good: true, why: 'Đúng rồi! Gặp vật cản bất ngờ thì bóp phanh và giữ thẳng tay lái.' },
      { icon: '🙈', text: 'Buông tay lái để che mặt', good: false, why: 'Buông tay lái sẽ bị ngã xe.' }
    ],
    lesson: 'Gặp vật cản bất ngờ: bóp phanh, giữ thẳng tay lái.'
  }
};

// thời gian cảnh 3D diễn ra trước khi hiện câu hỏi (giây)
export const EVENT_LEAD = 1.6;
