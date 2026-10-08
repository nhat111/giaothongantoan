// Luật chơi cho các bài đi xe đạp.
// Bé đạp xe trên làn bên phải (làn dưới, xe chạy sang +x).
// bike.x: vị trí giữa xe đạp theo ô, dọc theo đường. bike.lat: 0 = sát lề phải, 1 = giữa làn.

export const BIKE_LEN = 0.7;
export const BIKE_MAX = 1.5; // ô/giây (~14 km/h)
export const LOOKBACK_TIME = 1.8;

export const BIKE_MSG = {
  center: 'Đi xe đạp phải đi sát mép đường bên phải. Đi giữa làn làm xe phía sau phải chờ, rất nguy hiểm.',
  wrongway: 'Không được sang làn bên kia! Đó là làn xe chạy ngược chiều.',
  redlight: 'Đèn đỏ hoặc đèn vàng cho xe: phải dừng lại trước vạch dừng.',
  nolookback: 'Trước khi ra giữa đường để tránh xe đỗ, phải quan sát phía sau. Nhấn Quan sát.',
  closeback: 'Có xe đang tới sát phía sau! Chờ xe đi qua rồi mới ra.',
  nosignal: 'Muốn rẽ phải thì giơ tay phải xin đường trước. Nhấn Xin rẽ.',
  fastturn: 'Bóp phanh cho xe chạy chậm lại trước khi rẽ.',
  hit: 'Suýt va chạm! Bé tấp vào sát lề. Luôn quan sát phía sau trước khi ra giữa đường.'
};

export const BIKE_LESSON = {
  center: 'Đi xe đạp sát mép đường bên phải.',
  wrongway: 'Không đi sang làn ngược chiều.',
  redlight: 'Đèn đỏ, đèn vàng: dừng trước vạch dừng.',
  nolookback: 'Quan sát phía sau trước khi chuyển hướng.',
  closeback: 'Chờ xe phía sau đi qua rồi mới ra giữa đường.',
  nosignal: 'Giơ tay xin đường trước khi rẽ.',
  fastturn: 'Đi chậm trước khi rẽ.',
  hit: 'Quan sát phía sau trước khi ra giữa đường.',
  prep: 'Chuẩn bị đúng trước khi đi xe đạp.'
};

export function initBike(engine) {
  const L = engine.level;
  const lane = engine.lanes.find((l) => l.dir === 1);
  return {
    lane,
    row: lane.row,
    x: engine.kid.c + 0.5,
    lat: 0,
    latPos: 0,
    speed: 0,
    pedal: false,
    brake: false,
    dist: 0,
    signalUntil: -9,
    lookBackUntil: -9,
    lookStart: -99,
    centerTime: 0,
    turning: null,
    stopHintAt: -9,
    parked: (L.parked || []).map((p) => ({ ...p })),
    turn: !!L.turnIntoGate
  };
}

const front = (b) => b.x + BIKE_LEN / 2;
const back = (b) => b.x - BIKE_LEN / 2;

function alongsideParked(b) {
  return b.parked.some((p) => b.x > p.x - 1.4 && b.x < p.x + p.len + 0.9);
}

// toạ độ s mà xe phía sau phải dừng lại khi bé đi giữa làn
export function bikeBlockS(engine, lane, EXT) {
  const b = engine.bike;
  if (!b || lane !== b.lane || b.latPos < 0.45 || b.turning) return null;
  return back(b) + EXT - 0.3;
}

function vehicleBehindThreat(engine, b) {
  const lane = b.lane;
  for (const v of lane.vs) {
    const x = engine.vx(lane, v);
    const vf = x + v.len;
    // xe đang chạy cạnh bé hoặc đang tới gần từ phía sau
    if (x < front(b) && vf > back(b) - 0.1) return v;
    const gap = back(b) - vf;
    if (v.v > 0.4 && gap >= 0 && gap < 1.0 + v.v * 0.6) return v;
  }
  return null;
}

export function bikeShift(engine, dir) {
  const b = engine.bike;
  if (!engine.running || b.turning || engine.time < engine.busyUntil) return;
  if (dir > 0) {
    if (b.lat >= 1) {
      engine.penalty('wrongway', false);
      return;
    }
    // không có xe đỗ phía trước thì không cần ra giữa làn: nhắc nhẹ, không trừ sao
    if (!parkedAhead(b)) {
      engine.toast('Phía trước không có xe đỗ, bé không cần ra giữa làn. Cứ đi sát lề phải nhé.');
      return;
    }
    if (engine.time > b.lookBackUntil) {
      engine.penalty('nolookback', false);
      return;
    }
    const v = vehicleBehindThreat(engine, b);
    if (v && v.v <= 0.4) {
      engine.toast('Ngay bên cạnh bé đang có xe dừng. Chờ xe đó đi lên trước rồi mới ra.');
      return;
    }
    if (v) {
      engine.penalty('closeback', false);
      return;
    }
    b.lat = 1;
    b.centerTime = 0;
  } else {
    if (b.lat === 1) {
      b.lat = 0;
      return;
    }
    tryTurn(engine, b);
  }
}

function parkedAhead(b) {
  return b.parked.some((p) => p.x - front(b) < 3.5 && p.x + p.len > back(b));
}

function gateRange(engine) {
  const g = engine.goal;
  return [g.c - 0.6, g.c + 1.4];
}

function tryTurn(engine, b) {
  if (!b.turn) {
    engine.toast('Bé đang đi sát lề rồi. Đạp tiếp và dừng xe trước cổng trường nhé.');
    return;
  }
  const [g0, g1] = gateRange(engine);
  if (b.x < g0 || b.x > g1) {
    engine.toast(b.x < g0 ? 'Chưa tới cổng trường. Đạp tiếp nhé.' : 'Đi quá cổng trường rồi.');
    return;
  }
  if (engine.time > b.signalUntil) {
    engine.penalty('nosignal', false);
    return;
  }
  if (b.speed > 0.75) {
    engine.penalty('fastturn', false);
    return;
  }
  b.turning = { start: engine.time, x0: b.x };
  b.speed = 0;
}

export function bikeLook(engine) {
  const b = engine.bike;
  if (!engine.running || b.turning) return;
  if (engine.time - b.lookStart < LOOKBACK_TIME) return;
  b.lookStart = engine.time;
  b.lookBackUntil = engine.time + LOOKBACK_TIME + 5;
  engine.toast('Quay đầu nhìn phía sau bên trái...', '', LOOKBACK_TIME);
  engine.pendingLook = { bike: true, at: engine.time + LOOKBACK_TIME - 0.2 };
}

export function bikeFinishLook(engine) {
  const b = engine.bike;
  const v = vehicleBehindThreat(engine, b);
  if (!parkedAhead(b)) engine.toast('Quan sát tốt! Phía trước không có xe đỗ nên bé cứ đi sát lề phải.', 'good');
  else if (v && v.v <= 0.4) engine.toast('Ngay bên cạnh bé đang có xe dừng. Chờ xe đó đi lên trước.');
  else if (v) engine.toast('Có xe đang tới phía sau. Chờ xe đi qua rồi quan sát lại.', 'bad');
  else engine.toast('Phía sau không có xe tới gần. Bé có thể ra giữa làn để tránh, xong thì vào lại sát lề.', 'good');
}

export function bikeSignal(engine) {
  const b = engine.bike;
  if (!engine.running || b.turning) return;
  b.signalUntil = engine.time + 6;
  engine.toast('Bé giơ tay phải xin rẽ phải. Bóp phanh cho xe chậm lại rồi rẽ vào.', 'good', 3);
}

export function updateBike(engine, dt, EXT) {
  const b = engine.bike;
  b.latPos += (b.lat - b.latPos) * Math.min(1, dt * 5);
  if (b.turning) {
    const t = (engine.time - b.turning.start) / 1.4;
    b.turnT = Math.min(1, t);
    if (t >= 1 && engine.running) {
      engine.running = false;
      engine.win();
    }
    return;
  }
  if (!engine.running) return;
  const busy = engine.time < engine.busyUntil;

  // tốc độ
  if (b.brake) b.speed -= 3 * dt;
  else if (b.pedal && !busy) b.speed += 1.1 * dt;
  else b.speed -= 0.35 * dt;
  b.speed = Math.max(0, Math.min(BIKE_MAX, b.speed));

  // giới hạn phía trước
  let limit = Infinity;
  let blockedByParked = false;
  if (b.lat === 0 || b.latPos < 0.5) {
    for (const p of b.parked) {
      if (p.x > back(b)) {
        const l = p.x - 0.12 - BIKE_LEN / 2;
        if (l < limit) {
          limit = l;
          blockedByParked = true;
        }
      }
    }
  }
  // xe phía trước trong làn đang dừng (chỉ khi bé ở giữa làn)
  if (b.latPos > 0.5) {
    for (const v of b.lane.vs) {
      const x = engine.vx(b.lane, v);
      if (x > front(b) - 0.05) limit = Math.min(limit, x - 0.25 - BIKE_LEN / 2);
    }
  }

  let nx = b.x + b.speed * dt;
  if (nx >= limit) {
    nx = Math.max(b.x, limit);
    b.speed = 0;
    if (blockedByParked && engine.time - b.stopHintAt > 6) {
      b.stopHintAt = engine.time;
      engine.toast('Có xe đỗ sát lề phía trước. Nhấn Quan sát để nhìn phía sau, rồi bấm ▲ để ra giữa làn tránh xe.');
    }
  }

  // đèn tín hiệu: vượt vạch dừng khi đèn đỏ / vàng
  const road = b.lane.road;
  if (road.signaled && road.zc >= 0) {
    const stopX = road.zc - 0.2;
    const car = engine.lightState(road).car;
    if (front(b) <= stopX + 0.001 && nx + BIKE_LEN / 2 > stopX && car !== 'green') {
      // mỗi lượt đèn đỏ chỉ trừ sao một lần; xe đạp bị giữ lại ở vạch đến khi đèn xanh
      if (!b.redNoted) {
        engine.penalty('redlight', false);
        b.redNoted = true;
      }
      nx = stopX - BIKE_LEN / 2;
      b.speed = 0;
    }
    if (car === 'green') b.redNoted = false;
  }
  b.x = nx;
  b.dist += b.speed * dt;

  // đi giữa làn quá lâu khi không phải đang tránh xe đỗ
  if (b.lat === 1 && !alongsideParked(b)) {
    b.centerTime += dt;
    if (b.centerTime > 2.2) {
      b.centerTime = -3;
      engine.penalty('center', false);
    }
  } else if (b.lat === 0) b.centerTime = 0;

  // va chạm khi đang ở giữa làn
  if (b.latPos > 0.35 && !busy) {
    const hit = b.lane.vs.some((v) => {
      const x = engine.vx(b.lane, v);
      return x < front(b) - 0.05 && x + v.len > back(b) + 0.05;
    });
    if (hit) {
      engine.penalty('hit', false);
      b.lat = 0;
      b.speed = 0;
    }
  }

  // đích
  const [g0, g1] = gateRange(engine);
  if (!b.turn && b.lat === 0 && b.speed < 0.05 && b.x >= g0 && b.x <= g1) {
    engine.running = false;
    engine.win();
    return;
  }
  if (b.x > g1 + 1.8) {
    engine.toast('Bé đi quá cổng trường rồi. Dắt xe quay lại, lần này đi chậm hơn nhé.');
    b.x = engine.goal.c - 2;
    b.speed = 0;
    b.lat = 0;
  }
}

// Kiểm tra danh sách chuẩn bị trước khi lên xe. selected: Set chỉ số các mục bé chọn.
export function checkPrep(level, selected) {
  const wrong = [];
  level.prep.forEach((it, i) => {
    if (it.good && !selected.has(i)) wrong.push('Bé quên: ' + it.text.toLowerCase() + '. ' + it.why);
    if (!it.good && selected.has(i)) wrong.push('Không nên: ' + it.text.toLowerCase() + '. ' + it.why);
  });
  return wrong;
}
