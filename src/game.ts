import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_H,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
  MATCHOVER_ITEMS,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type Rect = { x: number; y: number; w: number; h: number };
type Snapshot = Omit<CaromState, "ball"> & {
  version: number;
  ball: (BallState & { speed: number }) | null;
};
export interface CaromDebugApi {
  readonly version: number;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, a: number, b: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, a: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, a: Side, v: number): CaromState;
  setPaddleDriven(s: DeepReadonly<CaromState>, a: Side, v: boolean): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Snapshot;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): Rect | null;
}
export const BACKGROUND = "#08111f";
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const rnd = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const ball = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: rnd(),
  trail: [],
});
const obs = () =>
  OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
const initial = (muted = false, simTime = 0, titleIndex = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: obs(),
  simTime,
  muted,
});
const copy = (s: DeepReadonly<CaromState>): CaromState => ({
  ...s,
  score: { ...s.score },
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  ai: { ...s.ai },
  ball: s.ball && { ...s.ball, trail: [...s.ball.trail] },
  obstacles: [...s.obstacles],
});
const need = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw Error("Carom: no ball");
  return s.ball;
};
const count = (s: DeepReadonly<CaromState>) =>
  s.screen === "title"
    ? 3
    : s.screen === "howto"
      ? 1
      : s.screen === "paused"
        ? 3
        : s.screen === "matchover"
          ? 2
          : 0;
const rect = (s: DeepReadonly<CaromState>, i: number): Rect | null =>
  i >= 0 && i < count(s)
    ? { x: 460, y: s.screen === "howto" ? 570 : 400 + i * 58, w: 360, h: 46 }
    : null;
const paddle = (
  p: DeepReadonly<PaddleState>,
  v: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + v * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return {
    ...p,
    cy,
    vy: cy !== p.cy + v * dt && dt > 0 ? (cy - p.cy) / dt : v,
  };
};
const withP = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: Partial<PaddleState>,
): CaromState => ({
  ...copy(s),
  paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...p } },
});
const start = (s: DeepReadonly<CaromState>, mode = s.mode): CaromState => ({
  ...copy(s),
  mode,
  screen: "countdown",
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: ball(),
  paddles: {
    left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
  },
});
const menu = (s: DeepReadonly<CaromState>): CaromState =>
  initial(s.muted, s.simTime, s.titleIndex);
function advance(s: CaromState, dt: number, api: UpdateApi): CaromState {
  if (!s.ball) return s;
  const b = { ...s.ball, trail: [...s.ball.trail] };
  const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP)),
    h = dt / n;
  for (let z = 0; z < n; z++) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed) {
      const a = (b.spin / speed) * h,
        c = Math.cos(a),
        q = Math.sin(a),
        x = b.vx,
        y = b.vy;
      b.vx = x * c - y * q;
      b.vy = x * q + y * c;
    }
    b.spin *= 0.5 ** (h / SPIN_HALFLIFE);
    b.x += b.vx * h;
    b.y += b.vy * h;
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b.y = BALL_R;
      b.vy = -b.vy;
      api.audio.play(CUES.wallBounce);
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b.y = FIELD_H - BALL_R;
      b.vy = -b.vy;
      api.audio.play(CUES.wallBounce);
    }
    const hit = (
      x0: number,
      x1: number,
      y0: number,
      y1: number,
      side?: Side,
    ) => {
      if (!(
        b.x > x0 - BALL_R &&
        b.x < x1 + BALL_R &&
        b.y > y0 - BALL_R &&
        b.y < y1 + BALL_R
      ))
        return;
      const ds = [
          b.x - x0 + BALL_R,
          x1 + BALL_R - b.x,
          b.y - y0 + BALL_R,
          y1 + BALL_R - b.y,
        ],
        f = ds.indexOf(Math.min(...ds));
      if (side && (f === 0 || f === 1)) {
        const p = s.paddles[side],
          a = clamp((b.y - p.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE,
          v = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP),
          d = side === "left" ? 1 : -1;
        b.vx = d * v * Math.cos(a);
        b.vy = v * Math.sin(a);
        b.spin = clamp(
          b.spin + p.vy * SPIN_FROM_PADDLE,
          -SPIN_CLAMP,
          SPIN_CLAMP,
        );
        b.x = side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R;
        api.audio.play(CUES.paddleHit);
        return;
      }
      if (f === 0) {
        b.x = x0 - BALL_R;
        if (b.vx > 0) b.vx = -b.vx;
      } else if (f === 1) {
        b.x = x1 + BALL_R;
        if (b.vx < 0) b.vx = -b.vx;
      } else if (f === 2) {
        b.y = y0 - BALL_R;
        if (b.vy > 0) b.vy = -b.vy;
      } else {
        b.y = y1 + BALL_R;
        if (b.vy < 0) b.vy = -b.vy;
      }
      api.audio.play(side ? CUES.wallBounce : CUES.obstacleBounce);
    };
    hit(
      P1_X0,
      P1_X1,
      s.paddles.left.cy - PADDLE_HALF,
      s.paddles.left.cy + PADDLE_HALF,
      "left",
    );
    hit(
      P2_X0,
      P2_X1,
      s.paddles.right.cy - PADDLE_HALF,
      s.paddles.right.cy + PADDLE_HALF,
      "right",
    );
    for (const o of s.obstacles) {
      const r = OBSTACLES[o.index];
      hit(r.x0, r.x1, r.y0, r.y1);
    }
  }
  b.trail = [...b.trail, { x: b.x, y: b.y, t: s.simTime }].filter(
    (p) => p.t >= s.simTime - TRAIL_TIME,
  );
  if (b.x - BALL_R > FIELD_W || b.x + BALL_R < 0) {
    const left = b.x - BALL_R > FIELD_W,
      score = {
        p1: s.score.p1 + (left ? 1 : 0),
        p2: s.score.p2 + (left ? 0 : 1),
      },
      winner: Side | null =
        score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD
          ? "left"
          : score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD
            ? "right"
            : null;
    api.audio.play(CUES.score);
    return winner
      ? { ...s, score, winner, screen: "matchover", menuIndex: 0, ball: b }
      : {
          ...s,
          score,
          receiver: left ? "right" : "left",
          screen: "countdown",
          ball: ball(),
        };
  }
  return { ...s, ball: b };
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    ACTIONS.forEach((a) => api.input.register(a, { keys: [...BINDINGS[a]] }));
    api.audio.define(CUES.paddleHit, {
      freq: 520,
      freqTo: 760,
      durationMs: 55,
      gain: 0.12,
    });
    api.audio.define(CUES.wallBounce, {
      freq: 300,
      freqTo: 220,
      durationMs: 45,
      gain: 0.1,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "square",
      freq: 380,
      durationMs: 55,
      gain: 0.08,
    });
    api.audio.define(CUES.score, {
      wave: "sine",
      freq: 660,
      freqTo: 990,
      durationMs: 180,
      gain: 0.16,
    });
    const diagnostics: readonly [
      string,
      (s: DeepReadonly<CaromState>) => string | number | boolean,
    ][] = [
      ["screen", (s: DeepReadonly<CaromState>) => s.screen],
      ["mode", (s) => s.mode],
      ["p1", (s) => s.score.p1],
      ["p2", (s) => s.score.p2],
      [
        "ball",
        (s) =>
          s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "-",
      ],
      ["speed", (s) => (s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : "-")],
      ["spin", (s) => (s.ball ? s.ball.spin : "-")],
      ["left paddle", (s) => s.paddles.left.cy],
      ["right paddle", (s) => s.paddles.right.cy],
    ];
    diagnostics.forEach(([n, f]) => api.diagnostics.register(n, f));
    const d: CaromDebugApi = {
      version: CAROM_DEBUG_VERSION,
      reset: (s) => initial(s.muted),
      reconcile: (s) => copy(s),
      clearWorld: (s) => ({ ...copy(s), ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...copy(s), ball: ball() }),
      spawnObstacle: (s, i) => {
        if (!OBSTACLE_CENTERS[i]) throw Error("Carom: invalid obstacle");
        const p = OBSTACLE_CENTERS[i];
        return {
          ...copy(s),
          obstacles: [
            ...s.obstacles.filter((o) => o.index !== i),
            { index: i, cx: p.x, cy: p.y },
          ].sort((a, b) => a.index - b.index),
        };
      },
      setScreen: (s, v) => ({ ...copy(s), screen: v }),
      setMode: (s, v) => ({ ...copy(s), mode: v }),
      setMenuIndex: (s, v) => ({ ...copy(s), menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...copy(s), titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...copy(s), resumeScreen: v }),
      setScore: (s, a, b) => ({ ...copy(s), score: { p1: a, p2: b } }),
      setWinner: (s, v) => ({ ...copy(s), winner: v }),
      setReceiver: (s, v) => ({ ...copy(s), receiver: v }),
      setPaddleCy: (s, a, v) => withP(s, a, { cy: v }),
      setPaddleVy: (s, a, v) => withP(s, a, { drivenVy: v }),
      setPaddleDriven: (s, a, v) => withP(s, a, { driven: v }),
      setBallPosition: (s, x, y) => ({
        ...copy(s),
        ball: { ...need(s), x, y },
      }),
      setBallVelocity: (s, x, y) => ({
        ...copy(s),
        ball: { ...need(s), vx: x, vy: y },
      }),
      setBallSpin: (s, v) => ({ ...copy(s), ball: { ...need(s), spin: v } }),
      setBallHeld: (s, v) => ({ ...copy(s), ball: { ...need(s), held: v } }),
      setBallHoldTimer: (s, v) => ({
        ...copy(s),
        ball: { ...need(s), holdTimer: v },
      }),
      setBallServeSign: (s, v) => ({
        ...copy(s),
        ball: { ...need(s), serveSign: v },
      }),
      drawBallServeSign: (s) => ({
        ...copy(s),
        ball: { ...need(s), serveSign: rnd() },
      }),
      setAiTracking: (s, v) => ({ ...copy(s), ai: { ...s.ai, tracking: v } }),
      setAiMovement: (s, v) => ({ ...copy(s), ai: { ...s.ai, movement: v } }),
      setMuted: (s, v) => ({ ...copy(s), muted: v }),
      snapshot: (s) => ({
        ...copy(s),
        version: CAROM_DEBUG_VERSION,
        ball: s.ball && { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) },
      }),
      menuItemRect: rect,
    };
    return [initial(), d];
  },
  update(state, api, dt) {
    let s: CaromState = { ...copy(state), simTime: state.simTime + dt };
    const mutePressed = api.input.pressed("mute");
    // A debug pose carries the requested mute value in state; apply it to the
    // runtime before mirroring the live bus back into the next value.
    const requestedMute = mutePressed ? !api.audio.muted() : s.muted;
    if (requestedMute !== api.audio.muted()) api.audio.setMuted(requestedMute);
    s = { ...s, muted: api.audio.muted() };
    const screen = state.screen,
      up = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
      down = api.input.pressed("p1-down") || api.input.pressed("p2-down"),
      confirm = api.input.pressed("confirm"),
      back = api.input.pressed("back"),
      pause = api.input.pressed("pause");
    const activate = () => {
      if (s.screen === "title") {
        s = { ...s, titleIndex: s.menuIndex };
        s =
          s.menuIndex === 0
            ? start(s, "solo")
            : s.menuIndex === 1
              ? start(s, "versus")
              : { ...s, screen: "howto", menuIndex: 0 };
      } else if (s.screen === "howto") s = menu(s);
      else if (s.screen === "paused")
        s =
          s.menuIndex === 0
            ? { ...s, screen: s.resumeScreen }
            : s.menuIndex === 1
              ? start(s)
              : menu(s);
      else if (s.screen === "matchover")
        s = s.menuIndex === 0 ? start(s) : menu(s);
    };
    if (["title", "paused", "matchover"].includes(screen)) {
      if (screen === "paused" && (pause || back))
        s = { ...s, screen: s.resumeScreen };
      else if (up || down)
        s = {
          ...s,
          menuIndex: (s.menuIndex + (up ? -1 : 1) + count(s)) % count(s),
        };
      else if (confirm) activate();
    } else if (screen === "howto" && (confirm || back)) s = menu(s);
    else if ((screen === "playing" || screen === "countdown") && pause)
      s = { ...s, resumeScreen: screen, screen: "paused", menuIndex: 0 };
    if (s.screen === "countdown" || s.screen === "playing") {
      const axis = (u: string, d: string) =>
          api.input.value(d) - api.input.value(u),
        lv = s.paddles.left.driven
          ? s.paddles.left.drivenVy
          : axis("p1-up", "p1-down") * PADDLE_SPEED;
      let rv = 0;
      if (s.paddles.right.driven) rv = s.paddles.right.drivenVy;
      else if (s.mode === "versus")
        rv = axis("p2-up", "p2-down") * PADDLE_SPEED;
      else if (s.ai.movement) {
        const defending = !!(
            s.ai.tracking &&
            s.screen === "playing" &&
            s.ball &&
            s.ball.vx > 0
          ),
          target = defending ? s.ball!.y - s.ball!.vy * AI_REACT : AI_HOME_Y,
          d = target - s.paddles.right.cy;
        rv =
          Math.abs(d) <= (defending ? AI_DEADZONE : AI_HOME_DEADZONE)
            ? 0
            : Math.sign(d) *
              Math.min(AI_SPEED, dt ? Math.abs(d) / dt : AI_SPEED);
      }
      s = {
        ...s,
        paddles: {
          left: paddle(s.paddles.left, lv, dt),
          right: paddle(s.paddles.right, rv, dt),
        },
      };
      if (s.ball && s.screen === "countdown") {
        const b = { ...s.ball, holdTimer: s.ball.holdTimer - dt };
        if (b.holdTimer <= 0) {
          const dir = s.receiver === "left" ? -1 : 1;
          s = {
            ...s,
            screen: "playing",
            ball: {
              ...b,
              holdTimer: 0,
              held: false,
              vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
              vy: b.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
              trail: [],
            },
          };
        } else
          s = {
            ...s,
            ball: {
              ...b,
              trail: [...b.trail, { x: b.x, y: b.y, t: s.simTime }].filter(
                (p) => p.t >= s.simTime - TRAIL_TIME,
              ),
            },
          };
      } else if (s.screen === "playing") s = advance(s, dt, api);
    }
    return s;
  },
  render(s, api) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    c.strokeStyle = "#29465e";
    c.setLineDash([12, 16]);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(NET_X, 30);
    c.lineTo(NET_X, FIELD_H - 30);
    c.stroke();
    c.setLineDash([]);
    const bar = (x: number, y: number, w: number, h: number, color: string) => {
      c.fillStyle = color;
      c.beginPath();
      c.roundRect(x, y, w, h, 8);
      c.fill();
    };
    s.obstacles.forEach((o) => bar(o.cx - 10, o.cy - 70, 20, 140, "#f4ae42"));
    bar(P1_X0, s.paddles.left.cy - PADDLE_HALF, 16, PADDLE_H, "#3ad8e8");
    bar(P2_X0, s.paddles.right.cy - PADDLE_HALF, 16, PADDLE_H, "#ff5c82");
    if (s.ball) {
      const activeBall = s.ball;
      activeBall.trail.forEach((p, i) => {
        c.globalAlpha = ((i + 1) / activeBall.trail.length) * 0.4;
        c.fillStyle = "#fff5c2";
        c.beginPath();
        c.arc(p.x, p.y, 5, 0, Math.PI * 2);
        c.fill();
      });
      c.globalAlpha = 1;
      c.fillStyle = "#fff5c2";
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "center";
    c.font = "700 38px system-ui";
    c.fillStyle = "#dcecff";
    if (s.screen !== "title" && s.screen !== "howto") {
      c.fillText(String(s.score.p1), 560, 75);
      c.fillText(String(s.score.p2), 720, 75);
      c.font = "600 16px system-ui";
      c.fillStyle = "#8faac5";
      c.fillText(
        s.mode === "solo" ? "SOLO // SPIN DUEL" : "VERSUS // SPIN DUEL",
        640,
        108,
      );
    }
    if (s.screen === "playing") return;
    c.fillStyle = "rgba(3,9,18,.68)";
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    let items: readonly string[] = [];
    if (s.screen === "title") {
      c.font = "900 104px system-ui";
      c.fillStyle = "#fff5c2";
      c.fillText(TITLE_TEXT, 640, 260);
      c.font = "500 18px system-ui";
      c.fillStyle = "#9bb5ce";
      c.fillText("A spin-first paddle duel", 640, 300);
      items = TITLE_ITEMS;
    } else if (s.screen === "howto") {
      c.font = "800 42px system-ui";
      c.fillStyle = "#fff5c2";
      c.fillText("HOW TO PLAY", 640, 220);
      c.font = "500 20px system-ui";
      c.fillStyle = "#dcecff";
      c.fillText("W/S moves left • Arrow keys move right in Versus", 640, 300);
      c.fillText(
        "Move as you strike to bend the ball. Bank around the amber gates.",
        640,
        338,
      );
      items = ["BACK TO MENU"];
    } else if (s.screen === "paused") {
      c.font = "800 46px system-ui";
      c.fillStyle = "#fff5c2";
      c.fillText("PAUSED", 640, 320);
      items = PAUSE_ITEMS;
    } else if (s.screen === "matchover") {
      c.font = "800 46px system-ui";
      c.fillStyle = "#fff5c2";
      c.fillText(
        `${s.winner === "left" ? "LEFT" : "RIGHT"} PLAYER WINS`,
        640,
        300,
      );
      items = MATCHOVER_ITEMS;
    } else if (s.screen === "countdown") {
      c.font = "700 26px system-ui";
      c.fillStyle = "#fff5c2";
      c.fillText("READY", 640, 650);
    }
    items.forEach((it, i) => {
      const r = rect(s, i)!;
      c.fillStyle = i === s.menuIndex ? "#3ad8e8" : "#dcecff";
      c.font = i === s.menuIndex ? "800 25px system-ui" : "600 23px system-ui";
      c.fillText(it, 640, r.y + 31);
    });
  },
};
