import { LEVELS } from './levels.js';
import { EVENTS, EVENT_LEAD } from './events.js';
import { initBike, updateBike, bikeShift, bikeLook, bikeFinishLook, bikeSignal, bikeBlockS, checkPrep, BIKE_MSG, BIKE_LESSON } from './bike.js';

export const TILE = 2.6; // mét mỗi ô
export const EXT = 12; // số ô đường kéo dài ra ngoài bản đồ mỗi bên (chỗ xe xuất hiện / biến mất)
export const GREEN_TIME = 10;
export const RED_TIME = 11;
export const BLINK = 3;
export const STEP_TIME = 0.34; // giây cho mỗi bước
export const LOOK_TIME = 3.2; // thời gian quay đầu nhìn trái, nhìn phải

export const VTYPES = {
  moto: { len: 0.75, speed: [3.0, 4.0], colors: ['#c0392b', '#1f5fbf', '#1d1d1f', '#e8e8e8', '#7a3fa0', '#2a8f7f', '#b98b2e'] },
  car: { len: 1.75, speed: [2.6, 3.1], colors: ['#f2f2f0', '#b8bcc2', '#1c1f24', '#9c2121', '#28518f', '#5b6168'] },
  bus: { len: 4.3, speed: [2.0, 2.3], colors: ['#f2a20c', '#2f9a57'] }
};

export const MSG = {
  road: 'Ối! Không được đi xuống lòng đường. Muốn sang đường, hãy đi trên vỉa hè tới vạch kẻ trắng.',
  red: 'Đèn người đi bộ đang đỏ. Đứng chờ trên vỉa hè đến khi đèn xanh nhé.',
  blink: 'Đèn xanh đang nhấp nháy, sắp đỏ rồi. Chờ lượt đèn xanh sau rồi đi.',
  nolook: 'Khoan! Trước khi sang đường phải dừng lại và nhìn hai bên. Nhấn Quan sát.',
  close: 'Xe đang tới gần! Chờ xe đi qua hẳn rồi mới bước tiếp.',
  runner: 'Đèn xanh nhưng có xe vượt đèn đỏ! Dù đèn xanh vẫn phải nhìn hai bên trước khi bước xuống.',
  hit: 'Suýt va chạm! Bé quay lại vỉa hè. Chỉ đi khi không có xe tới gần.',
  nohand: 'Bé mẫu giáo qua đường phải nắm tay người lớn. Nhấn nút Nắm tay mẹ.',
  bus: 'Xe buýt đang đỗ che mất tầm nhìn, xe phía sau có thể vượt lên bất ngờ. Chờ xe buýt chạy đi rồi mới quan sát và sang đường.'
};
const WALK_HIT = MSG.hit;

export const LESSON = {
  road: 'Luôn đi trên vỉa hè, không đi dưới lòng đường.',
  red: 'Đèn người đi bộ màu đỏ thì đứng chờ.',
  blink: 'Đèn xanh nhấp nháy thì không bắt đầu sang đường.',
  nolook: 'Dừng lại, nhìn trái, nhìn phải trước khi sang đường.',
  close: 'Chờ xe đi qua hẳn rồi mới đi.',
  runner: 'Đèn xanh vẫn phải quan sát, vì có người vượt đèn đỏ.',
  hit: 'Không sang đường khi xe đang tới gần.',
  nohand: 'Trẻ dưới 7 tuổi qua đường phải có người lớn dắt tay.',
  bus: 'Xuống xe buýt: chờ xe buýt chạy đi rồi mới sang đường.'
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class Engine {
  constructor() {
    this.listeners = new Set();
    this.time = 0;
    this.vid = 0;
    this.vehVersion = 0;
    this.levelVersion = 0;
    // số sao cao nhất mỗi bài, lưu trên máy để lần sau mở lại vẫn còn
    this.totalStars = [];
    try {
      this.totalStars = JSON.parse(localStorage.getItem('bestStars') || '[]');
    } catch {
      /* bỏ qua */
    }
    this.held = null;
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(type, payload) {
    this.listeners.forEach((f) => f(type, payload));
  }

  load(i) {
    this.levelIdx = i;
    const L = (this.level = LEVELS[i]);
    this.grid = L.map.map((s) => s.split(''));
    this.ROWS = this.grid.length;
    this.COLS = this.grid[0].length;
    this.roads = [];
    this.lanes = [];
    this.laneByRow = {};
    let r = 0;
    while (r < this.ROWS) {
      if (this.grid[r].some((t) => t === 'r' || t === 'z')) {
        const road = {
          index: this.roads.length,
          rows: [r, r + 1],
          zc: this.grid[r].indexOf('z'),
          signaled: L.signals[this.roads.length],
          light: { green: false, t: 4 }
        };
        this.roads.push(road);
        [
          [r, -1],
          [r + 1, 1]
        ].forEach(([row, dir]) => {
          const stopS = dir === 1 ? road.zc - 0.2 + EXT : this.COLS + EXT - (road.zc + 1 + 0.2);
          const lane = { row, dir, road, vs: [], spawnT: rand(0, 1), stopS };
          this.lanes.push(lane);
          this.laneByRow[row] = lane;
        });
        r += 2;
      } else r++;
    }
    let start;
    this.grid.forEach((row, rr) =>
      row.forEach((t, cc) => {
        if (t === 'H' || t === 'A') start = { c: cc, r: rr };
        if (t === 'S') this.goal = { c: cc, r: rr };
      })
    );
    this.kid = {
      c: start.c,
      r: start.r,
      pc: start.c,
      pr: start.r,
      t: 1,
      yaw: start.r === 0 ? 0 : Math.PI, // nhìn ra đường
      lastSafe: { ...start },
      walk: 0
    };
    this.stars = 3;
    this.mistakes = new Set();
    this.busyUntil = 0;
    this.look = null;
    this.lookView = null;
    this.pendingLook = null;
    this.hinted = new Set();
    this.running = false;
    this.held = null;
    this.mode = L.mode || 'walk';
    this.events = (L.events || []).map((e) => ({ ...e, done: false }));
    this.event = null;
    this.eventAnim = null;
    this.parent = L.withParent ? { c: start.c, r: start.r, pc: start.c, pr: start.r, t: 1 } : null;
    this.holding = false;
    this.bus = null;
    if (L.busStop) {
      const lane = this.lanes.find((l) => l.dir === 1);
      this.bus = {
        id: ++this.vid, lane, type: 'bus', len: 4.3, s: lane.road.zc - 0.35 + EXT, v: 0, speed: 2.1,
        color: '#2f9a57', seed: 0.5, runner: false, dist: 0, hold: true, holdUntil: Infinity, stopBus: true
      };
      lane.vs.push(this.bus);
      this.busGoneSaid = false;
    }
    this.bike = this.mode === 'bike' ? initBike(this) : null;
    for (let k = 0; k < 400; k++) this.stepTraffic(0.05);
    this.levelVersion++;
    this.vehVersion++;
    this.emit('level', { idx: i });
    this.emit('stars', this.stars);
  }

  // tạm dừng khi mở danh sách bài, chơi tiếp khi đóng
  pause() {
    this.pausedRunning = this.running;
    this.running = false;
    this.release();
  }
  resume() {
    if (this.pausedRunning) this.running = true;
    this.pausedRunning = false;
  }

  start() {
    this.running = true;
    if (this.bus) this.bus.holdUntil = this.time + this.level.busStop.wait;
    this.toast(this.level.goal, '', 5);
  }

  tile(c, r) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return null;
    return this.grid[r][c];
  }

  // ---------- đèn ----------
  lightState(road) {
    const l = road.light;
    if (l.green) return { ped: l.t < BLINK ? 'blink' : 'green', car: 'red', count: Math.ceil(l.t) };
    const elapsed = RED_TIME - l.t;
    let car = 'green';
    if (elapsed < 1.2) car = 'red';
    else if (l.t < 2.5) car = 'yellow';
    return { ped: 'red', car, count: Math.ceil(l.t) };
  }
  carsMayGo(road) {
    if (!road.signaled) return true;
    const s = this.lightState(road);
    return s.car === 'green' || (s.car === 'yellow' && road.light.t > 1.8);
  }
  kidOnZebraOf(road) {
    return this.tile(this.kid.c, this.kid.r) === 'z' && road.rows.includes(this.kid.r);
  }

  // vị trí mép trái (theo ô) của xe
  vx(lane, v) {
    return lane.dir === 1 ? v.s - EXT - v.len : this.COLS + EXT - v.s;
  }

  allVehicles() {
    const out = [];
    this.lanes.forEach((l) => l.vs.forEach((v) => out.push(v)));
    return out;
  }

  stepTraffic(dt) {
    this.roads.forEach((road) => {
      if (!road.signaled) return;
      road.light.t -= dt;
      if (road.light.t <= 0) {
        road.light.green = !road.light.green;
        road.light.t = road.light.green ? GREEN_TIME : RED_TIME;
      }
    });
    const tr = this.level.traffic;
    const total = this.COLS + 2 * EXT;
    this.lanes.forEach((lane) => {
      const vs = lane.vs.sort((a, b) => b.s - a.s);
      const redStop = lane.road.signaled && !this.carsMayGo(lane.road);
      const kidStop = lane.road.signaled && !this.bike && this.kidOnZebraOf(lane.road);
      const bikeS = bikeBlockS(this, lane, EXT);
      vs.forEach((v, i) => {
        let limit = Infinity;
        if (i > 0) limit = vs[i - 1].s - vs[i - 1].len - 0.35;
        const stopHere = (redStop && !v.runner) || kidStop;
        if (v.hold && this.time < v.holdUntil) limit = Math.min(limit, v.s);
        if (stopHere && v.s <= lane.stopS + 0.05) limit = Math.min(limit, lane.stopS);
        if (bikeS !== null && v.s <= bikeS + 0.05) limit = Math.min(limit, bikeS);
        const room = limit - v.s;
        const target = Math.min(v.speed, Math.max(0, room) * 2.2);
        v.v += (target - v.v) * Math.min(1, dt * (target < v.v ? 6 : 1.4));
        v.s = Math.min(v.s + v.v * dt, Math.max(v.s, limit));
        v.dist += v.v * dt;
      });
      const before = vs.length;
      lane.vs = vs.filter((v) => v.s - v.len < total + 1);
      if (lane.vs.length !== before) this.vehVersion++;
      lane.spawnT -= dt;
      if (lane.spawnT <= 0) {
        const last = lane.vs[lane.vs.length - 1];
        if (!last || last.s - last.len > 0.6) {
          const type = pick(tr.types);
          const spec = VTYPES[type];
          const speed = rand(...spec.speed);
          const runner = lane.road.signaled && type === 'moto' && Math.random() < this.level.runnerChance;
          lane.vs.push({
            id: ++this.vid,
            lane,
            type,
            len: spec.len,
            s: 0,
            v: runner ? speed * 1.15 : speed,
            speed: runner ? speed * 1.15 : speed,
            color: pick(spec.colors),
            seed: Math.random(),
            runner,
            dist: 0
          });
          this.vehVersion++;
        }
        lane.spawnT = rand(tr.min, tr.max);
      }
    });
  }

  // ---------- bé ----------
  toast(text, kind = '', dur = 3.6) {
    this.emit('toast', { text, kind, dur });
  }

  penalty(kind, sendBack) {
    this.stars = Math.max(0, this.stars - 1);
    this.mistakes.add(kind);
    this.emit('stars', this.stars);
    const text = this.bike ? (kind === 'hit' ? BIKE_MSG.hit : BIKE_MSG[kind] || MSG[kind]) : kind === 'hit' ? WALK_HIT : MSG[kind];
    this.toast(text, 'bad', 4);
    this.busyUntil = this.time + 1.2;
    this.kid.shake = this.time;
    if (kind === 'close' || kind === 'hit' || kind === 'runner' || kind === 'closeback' || kind === 'center') this.emit('honk');
    if (sendBack) {
      const k = this.kid;
      k.c = k.pc = k.lastSafe.c;
      k.r = k.pr = k.lastSafe.r;
      k.t = 1;
      this.look = null;
    }
  }

  vehicleThreat(lane, col) {
    for (const v of lane.vs) {
      const x = this.vx(lane, v);
      if (x < col + 0.9 && x + v.len > col + 0.1) return v;
      const gap = lane.dir === 1 ? col - (x + v.len) : x - (col + 1);
      if (v.v > 0.4 && gap >= 0 && gap < 1.4 + v.v * 0.35) return v;
    }
    return null;
  }

  nearCurbOf(road) {
    const k = this.kid;
    return k.c === road.zc && (k.r === road.rows[0] - 1 || k.r === road.rows[1] + 1);
  }

  press(dx, dy) {
    if (this.bike) {
      if (dx > 0) this.bike.pedal = true;
      if (dx < 0) this.bike.brake = true;
      if (dy !== 0) bikeShift(this, -dy);
      this.held = { dx, dy };
      return;
    }
    this.held = { dx, dy };
    this.tryMove(dx, dy);
  }
  // release(): thả hết; release(dx, dy): chỉ thả phím tương ứng
  release(dx, dy) {
    if (this.bike) {
      if (dx === undefined || dx > 0) this.bike.pedal = false;
      if (dx === undefined || dx < 0) this.bike.brake = false;
    }
    if (dx === undefined || (this.held && this.held.dx === dx && this.held.dy === dy)) this.held = null;
  }
  signal() {
    if (this.bike) bikeSignal(this);
  }
  // bắt đầu bài xe đạp sau khi bé chọn đồ chuẩn bị
  startBike(selected) {
    const wrong = checkPrep(this.level, selected);
    this.bike.helmet = this.level.prep.some((it, i) => it.good && /mũ bảo hiểm/i.test(it.text) && selected.has(i));
    this.running = true;
    if (wrong.length) {
      this.stars = Math.max(0, this.stars - 1);
      this.mistakes.add('prep');
      this.emit('stars', this.stars);
      this.toast(wrong.join(' '), 'bad', 7);
    } else this.toast(this.level.goal, '', 5);
  }

  tryMove(dx, dy) {
    const k = this.kid;
    if (!this.running || this.time < this.busyUntil || k.t < 1) return;
    if (this.lookView && this.time - this.lookView.start < LOOK_TIME) return;
    k.yaw = Math.atan2(dx, dy);
    const nc = k.c + dx;
    const nr = k.r + dy;
    const t = this.tile(nc, nr);
    const cur = this.tile(k.c, k.r);
    if (!t || t === 'B' || t === 'p') return;
    if (t === 'r') {
      this.emit('flash', { c: nc, r: nr });
      this.penalty('road', false);
      return;
    }
    if (t === 'z') {
      const lane = this.laneByRow[nr];
      const road = lane.road;
      if (cur !== 'z') {
        if (this.parent && !this.holding) {
          this.emit('flash', { c: nc, r: nr });
          this.penalty('nohand', false);
          return;
        }
        if (this.busHeld() && this.bus.lane.road === road) {
          this.emit('flash', { c: nc, r: nr });
          this.penalty('bus', false);
          return;
        }
        if (road.signaled) {
          const st = this.lightState(road);
          if (st.ped === 'red') {
            this.emit('flash', { c: nc, r: nr });
            this.penalty('red', false);
            return;
          }
          if (st.ped === 'blink') {
            this.emit('flash', { c: nc, r: nr });
            this.penalty('blink', false);
            return;
          }
        } else if (!(this.look && this.look.road === road && this.time < this.look.until)) {
          this.emit('flash', { c: nc, r: nr });
          this.penalty('nolook', false);
          return;
        }
      }
      const threat = this.vehicleThreat(lane, nc);
      if (threat) {
        this.penalty(threat.runner ? 'runner' : 'close', false);
        return;
      }
    }
    if (this.parent) {
      const p = this.parent;
      p.pc = p.c;
      p.pr = p.r;
      // đang nắm tay: mẹ đi cạnh bé; không nắm tay: mẹ đi theo sau một bước
      if (this.holding) {
        p.c = nc;
        p.r = nr;
      } else {
        p.c = k.c;
        p.r = k.r;
      }
      p.t = 0;
    }
    k.pc = k.c;
    k.pr = k.r;
    k.c = nc;
    k.r = nr;
    k.t = 0;
    if (t === '.' || t === 'H' || t === 'A') {
      k.lastSafe = { c: nc, r: nr };
      if (cur === 'z') this.look = null;
    }
    if (t === 'S') {
      setTimeout(() => this.win(), STEP_TIME * 1000);
      this.running = false;
      return;
    }
    this.curbHints();
  }

  curbHints() {
    this.roads.forEach((road) => {
      if (!this.nearCurbOf(road)) return;
      const st = road.signaled ? this.lightState(road).ped : 'none';
      const key = road.index + ':' + st + ':' + this.kid.r;
      if (this.hinted.has(key)) return;
      this.hinted.add(key);
      if (this.busHeld() && this.bus.lane.road === road)
        this.toast('Xe buýt còn đang đỗ, che mất xe phía sau. Đứng chờ trên vỉa hè cho xe buýt đi đã.');
      else if (this.parent && !this.holding)
        this.toast('Đến vạch kẻ rồi. Nhấn nút Nắm tay mẹ, rồi cùng mẹ sang đường.');
      else if (road.signaled && st !== 'green')
        this.toast('Đèn người đi bộ chưa xanh. Đứng chờ ở đây, nhìn số đếm ngược trên cột đèn bên kia đường.');
      else if (road.signaled)
        this.toast('Đèn xanh rồi. Nhấn Quan sát để nhìn hai bên cho chắc, rồi đi thẳng qua vạch kẻ.', 'good');
      else this.toast('Đường này không có đèn. Dừng lại và nhấn Quan sát trước khi đi.');
    });
  }

  busHeld() {
    return !!(this.bus && this.bus.hold && this.time < this.bus.holdUntil);
  }

  // bé mẫu giáo nắm / buông tay mẹ
  holdHand() {
    if (!this.parent || !this.running) return;
    const t = this.tile(this.kid.c, this.kid.r);
    if (this.holding && (t === 'z' || t === 'r')) {
      this.toast('Đang qua đường, bé không buông tay mẹ nhé.');
      return;
    }
    this.holding = !this.holding;
    if (this.holding) {
      const p = this.parent;
      p.pc = p.c;
      p.pr = p.r;
      p.c = this.kid.c;
      p.r = this.kid.r;
      p.t = 0;
    }
    this.toast(this.holding ? 'Bé nắm tay mẹ rồi.' : 'Bé buông tay mẹ.', this.holding ? 'good' : '', 2);
    this.emit('hold', this.holding);
  }

  // ---------- tình huống bất ngờ ----------
  checkEvents() {
    if (this.event || !this.running) return;
    for (const e of this.events) {
      if (e.done) continue;
      const hit = this.bike ? this.bike.x >= e.x : e.c === this.kid.c && e.r === this.kid.r && this.kid.t >= 1;
      if (hit) return this.startEvent(e);
    }
  }
  startEvent(e) {
    e.done = true;
    const def = EVENTS[e.id];
    this.event = { ...e, def, start: this.time, asked: false };
    this.eventAnim = { id: e.id, start: this.time, resolved: null, e };
    this.running = false;
    this.release();
    if (this.bike) this.bike.speed = 0;
    if (e.id === 'ambulance') {
      const road = this.roads[e.road || 0];
      road.light = { green: true, t: GREEN_TIME + 2 };
    }
    this.emit('eventStart', e.id);
  }
  resolveEvent(i) {
    const ev = this.event;
    if (!ev) return;
    const ch = ev.def.choices[i];
    if (ch.good) this.toast(ch.why, 'good', 4);
    else {
      this.stars = Math.max(0, this.stars - 1);
      this.mistakes.add('ev:' + ev.id);
      this.emit('stars', this.stars);
      this.toast(ch.why, 'bad', 5);
    }
    this.eventAnim.resolved = this.time;
    this.event = null;
    this.running = true;
    this.busyUntil = this.time + 0.6;
  }

  doLook() {
    if (this.bike) return bikeLook(this);
    if (!this.running || this.time < this.busyUntil || this.kid.t < 1) return;
    if (this.lookView && this.time - this.lookView.start < LOOK_TIME) return;
    const road = this.roads.find((r) => this.nearCurbOf(r));
    if (!road) {
      this.toast('Hãy đi đến sát mép vỉa hè, ngay đầu vạch kẻ đường, rồi mới quan sát.');
      return;
    }
    const toSouth = this.kid.r < road.rows[0];
    this.kid.yaw = toSouth ? 0 : Math.PI;
    this.lookView = { start: this.time, fz: toSouth ? 1 : -1 };
    this.look = { road, until: this.time + LOOK_TIME + 7 };
    this.pendingLook = { road, at: this.time + LOOK_TIME - 0.2 };
    this.toast('Nhìn bên trái... nhìn bên phải...', '', LOOK_TIME - 0.3);
  }

  finishLook(road) {
    const near = road.rows.some((row) => {
      const lane = this.laneByRow[row];
      return lane.vs.some((v) => {
        const x = this.vx(lane, v);
        if (x < road.zc + 1 && x + v.len > road.zc) return true;
        const gap = lane.dir === 1 ? road.zc - (x + v.len) : x - (road.zc + 1);
        const willStop = road.signaled && !v.runner && !this.carsMayGo(road);
        return v.v > 0.4 && gap >= 0 && gap < 4.5 && !willStop;
      });
    });
    if (road.signaled && this.lightState(road).ped !== 'green')
      this.toast('Quan sát tốt lắm! Nhưng đèn người đi bộ chưa xanh, phải chờ thêm.');
    else if (near) this.toast('Có xe đang tới gần. Chờ xe đi qua rồi quan sát lại.', 'bad');
    else this.toast('Đường an toàn. Bé đi thẳng qua vạch kẻ, không chạy nhé!', 'good');
  }

  hazardCheck() {
    if (this.time < this.busyUntil) return;
    const k = this.kid;
    const t = this.tile(k.c, k.r);
    if (t !== 'z' && t !== 'r') return;
    const lane = this.laneByRow[k.r];
    const hit = lane.vs.some((v) => {
      const x = this.vx(lane, v);
      return x < k.c + 0.8 && x + v.len > k.c + 0.2;
    });
    if (hit) this.penalty('hit', true);
  }

  win() {
    this.running = false;
    this.totalStars[this.levelIdx] = Math.max(this.totalStars[this.levelIdx] || 0, this.stars);
    try {
      localStorage.setItem('bestStars', JSON.stringify(this.totalStars));
    } catch {
      /* bỏ qua */
    }
    this.emit('win', {
      stars: this.stars,
      lessons: [...this.mistakes].map((m) =>
        m.startsWith('ev:') ? EVENTS[m.slice(3)].lesson : this.bike ? BIKE_LESSON[m] || LESSON[m] : LESSON[m]
      ),
      last: this.levelIdx === LEVELS.length - 1,
      total: this.totalStars.reduce((a, b) => a + (b || 0), 0),
      max: LEVELS.length * 3
    });
  }

  update(dt) {
    this.time += dt;
    this.stepTraffic(dt);
    const k = this.kid;
    if (k.t < 1) {
      k.t = Math.min(1, k.t + dt / STEP_TIME);
      k.walk += dt;
    }
    if (this.pendingLook && this.time >= this.pendingLook.at) {
      if (this.pendingLook.bike) bikeFinishLook(this);
      else this.finishLook(this.pendingLook.road);
      this.pendingLook = null;
    }
    if (this.parent && this.parent.t < 1) this.parent.t = Math.min(1, this.parent.t + dt / STEP_TIME);
    if (this.event && !this.event.asked && this.time - this.event.start >= EVENT_LEAD) {
      this.event.asked = true;
      this.emit('eventAsk', this.event.id);
    }
    if (this.bus && !this.busGoneSaid && this.running && this.time > this.bus.holdUntil + 2.5) {
      this.busGoneSaid = true;
      this.toast('Xe buýt đã chạy đi. Bây giờ bé quan sát hai bên rồi mới sang đường.', 'good');
    }
    this.checkEvents();
    if (this.bike) {
      updateBike(this, dt, EXT);
      return;
    }
    if (!this.running) return;
    this.hazardCheck();
    if (this.held && k.t >= 1) this.tryMove(this.held.dx, this.held.dy);
  }
}

export const engine = new Engine();
if (typeof window !== 'undefined') window.__engine = engine; // tiện cho việc kiểm thử trên trình duyệt
