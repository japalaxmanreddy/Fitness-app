export type P = [number, number];
export type Pose = {
  h: P;
  s: P;
  p: P;
  e: P;
  w: P;
  k: P;
  f: P;
  k2?: P;
  f2?: P;
  c?: P;
};
export type Prop = { t: "r" | "l" | "c"; v: number[] };
export type Anim = {
  a: Pose;
  b: Pose;
  props?: Prop[];
  weight?: boolean;
  ground?: boolean;
};

const STAND: Pick<Pose, "h" | "s" | "p" | "k" | "f"> = {
  h: [100, 32],
  s: [100, 48],
  p: [100, 92],
  k: [102, 121],
  f: [100, 150],
};

const BENCH_LONG: Prop[] = [
  { t: "r", v: [50, 118, 100, 6] },
  { t: "l", v: [56, 124, 56, 150] },
  { t: "l", v: [144, 124, 144, 150] },
];
const SEAT: Prop[] = [
  { t: "r", v: [72, 118, 56, 6] },
  { t: "l", v: [78, 124, 78, 150] },
  { t: "l", v: [122, 124, 122, 150] },
];

function pose(value: Pose): Pose {
  return value;
}

export const ANIMS: Record<string, Anim> = {
  squat: {
    weight: true,
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [110, 64], w: [106, 56], k: [104, 121], f: [100, 150] }),
    b: pose({ h: [102, 63], s: [96, 78], p: [80, 118], e: [108, 94], w: [104, 86], k: [110, 118], f: [100, 150] }),
  },
  hinge: {
    weight: true,
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [100, 70], w: [100, 94], k: [103, 121], f: [100, 150] }),
    b: pose({ h: [140, 62], s: [126, 70], p: [86, 92], e: [126, 92], w: [126, 114], k: [98, 121], f: [100, 150] }),
  },
  singleHinge: {
    weight: true,
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [100, 70], w: [100, 94], k: [103, 121], f: [100, 150], k2: [100, 121], f2: [100, 150] }),
    b: pose({ h: [140, 62], s: [126, 70], p: [86, 92], e: [126, 92], w: [126, 114], k: [98, 121], f: [100, 150], k2: [60, 106], f2: [34, 120] }),
  },
  split: {
    weight: true,
    props: [
      { t: "r", v: [30, 124, 40, 6] },
      { t: "l", v: [34, 130, 34, 150] },
      { t: "l", v: [66, 130, 66, 150] },
    ],
    a: pose({ h: [96, 32], s: [96, 48], p: [94, 92], e: [96, 70], w: [96, 94], k: [112, 118], f: [118, 150], k2: [76, 114], f2: [58, 124] }),
    b: pose({ h: [94, 54], s: [94, 70], p: [92, 114], e: [94, 92], w: [94, 116], k: [118, 122], f: [118, 150], k2: [80, 140], f2: [58, 124] }),
  },
  press: {
    weight: true,
    props: BENCH_LONG,
    a: pose({ h: [146, 108], s: [130, 112], p: [88, 113], e: [124, 126], w: [130, 100], k: [64, 118], f: [60, 150] }),
    b: pose({ h: [146, 108], s: [130, 112], p: [88, 113], e: [130, 90], w: [130, 68], k: [64, 118], f: [60, 150] }),
  },
  row: {
    weight: true,
    props: [
      { t: "r", v: [40, 116, 70, 6] },
      { t: "l", v: [46, 122, 46, 150] },
      { t: "l", v: [104, 122, 104, 150] },
    ],
    a: pose({ h: [56, 74], s: [70, 82], p: [110, 86], e: [72, 104], w: [72, 126], k: [116, 118], f: [118, 150], k2: [98, 114], f2: [78, 114] }),
    b: pose({ h: [56, 74], s: [70, 82], p: [110, 86], e: [94, 72], w: [84, 94], k: [116, 118], f: [118, 150], k2: [98, 114], f2: [78, 114] }),
  },
  ohp: {
    weight: true,
    props: SEAT,
    a: pose({ h: [100, 54], s: [100, 70], p: [100, 114], e: [116, 82], w: [114, 64], k: [124, 114], f: [126, 150] }),
    b: pose({ h: [100, 54], s: [100, 70], p: [100, 114], e: [108, 50], w: [106, 30], k: [124, 114], f: [126, 150] }),
  },
  pulldown: {
    props: SEAT,
    a: pose({ h: [100, 54], s: [100, 70], p: [100, 114], e: [108, 50], w: [106, 30], k: [124, 114], f: [126, 150] }),
    b: pose({ h: [100, 54], s: [100, 70], p: [100, 114], e: [116, 88], w: [114, 70], k: [124, 114], f: [126, 150] }),
  },
  curl: {
    weight: true,
    a: pose({ ...STAND, e: [100, 70], w: [102, 94] }),
    b: pose({ ...STAND, e: [100, 70], w: [112, 54] }),
  },
  thrust: {
    weight: true,
    props: [
      { t: "r", v: [118, 110, 50, 6] },
      { t: "l", v: [124, 116, 124, 150] },
      { t: "l", v: [162, 116, 162, 150] },
    ],
    a: pose({ h: [134, 104], s: [122, 112], p: [90, 138], e: [106, 128], w: [94, 134], k: [68, 118], f: [62, 150] }),
    b: pose({ h: [134, 104], s: [122, 112], p: [88, 110], e: [104, 110], w: [90, 106], k: [66, 112], f: [62, 150] }),
  },
  deadbug: {
    ground: true,
    a: pose({ h: [152, 136], s: [136, 142], p: [94, 144], e: [136, 122], w: [136, 100], k: [94, 118], f: [74, 118], k2: [94, 118], f2: [74, 118] }),
    b: pose({ h: [152, 136], s: [136, 142], p: [94, 144], e: [152, 132], w: [172, 126], k: [70, 138], f: [44, 142], k2: [94, 118], f2: [74, 118] }),
  },
  sideplank: {
    ground: true,
    a: pose({ h: [140, 96], s: [130, 108], p: [84, 136], e: [130, 146], w: [152, 146], k: [62, 140], f: [40, 146] }),
    b: pose({ h: [140, 96], s: [130, 108], p: [84, 122], e: [130, 146], w: [152, 146], k: [62, 134], f: [40, 146] }),
  },
  carry: {
    weight: true,
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [102, 70], w: [102, 94], k: [110, 120], f: [114, 150], k2: [92, 120], f2: [86, 150] }),
    b: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [102, 70], w: [102, 94], k: [92, 120], f: [86, 150], k2: [110, 120], f2: [114, 150] }),
  },
  bike: {
    props: [
      { t: "l", v: [80, 96, 100, 96] },
      { t: "l", v: [90, 96, 100, 132] },
      { t: "c", v: [100, 132, 10] },
      { t: "l", v: [100, 132, 128, 78] },
      { t: "l", v: [122, 78, 138, 78] },
      { t: "l", v: [70, 150, 140, 150] },
      { t: "l", v: [100, 132, 100, 150] },
    ],
    a: pose({ h: [122, 46], s: [114, 60], p: [90, 94], e: [124, 72], w: [132, 78], k: [118, 100], f: [108, 124], k2: [106, 112], f2: [94, 140] }),
    b: pose({ h: [122, 46], s: [114, 60], p: [90, 94], e: [124, 72], w: [132, 78], k: [106, 112], f: [94, 140], k2: [118, 100], f2: [108, 124] }),
  },
  legpress: {
    props: [
      { t: "l", v: [118, 128, 150, 84] },
      { t: "l", v: [96, 128, 120, 128] },
      { t: "l", v: [108, 128, 108, 150] },
    ],
    a: pose({ h: [148, 74], s: [140, 88], p: [112, 124], e: [130, 106], w: [118, 118], k: [92, 100], f: [70, 108] }),
    b: pose({ h: [148, 74], s: [140, 88], p: [112, 124], e: [130, 106], w: [118, 118], k: [84, 112], f: [54, 104] }),
  },
  legcurl: {
    props: [
      { t: "r", v: [80, 108, 50, 6] },
      { t: "l", v: [90, 114, 90, 150] },
    ],
    a: pose({ h: [100, 46], s: [100, 62], p: [100, 106], e: [110, 82], w: [116, 104], k: [128, 108], f: [132, 140] }),
    b: pose({ h: [100, 46], s: [100, 62], p: [100, 106], e: [110, 82], w: [116, 104], k: [128, 108], f: [114, 132] }),
  },
  pallof: {
    a: pose({ ...STAND, e: [108, 70], w: [116, 62] }),
    b: pose({ ...STAND, e: [120, 62], w: [138, 62] }),
  },
  hipflexor: {
    ground: true,
    a: pose({ h: [96, 50], s: [96, 66], p: [96, 110], e: [98, 88], w: [98, 108], k: [118, 118], f: [120, 150], k2: [78, 148], f2: [54, 150] }),
    b: pose({ h: [104, 54], s: [104, 70], p: [106, 114], e: [106, 92], w: [106, 112], k: [126, 124], f: [120, 150], k2: [80, 148], f2: [54, 150] }),
  },
  hamstring: {
    props: [
      { t: "r", v: [120, 110, 50, 6] },
      { t: "l", v: [126, 116, 126, 150] },
      { t: "l", v: [164, 116, 164, 150] },
    ],
    a: pose({ h: [82, 32], s: [82, 48], p: [82, 92], e: [84, 70], w: [86, 92], k: [108, 100], f: [134, 108], k2: [82, 121], f2: [82, 150] }),
    b: pose({ h: [116, 47], s: [106, 60], p: [82, 92], e: [118, 82], w: [128, 104], k: [108, 100], f: [134, 108], k2: [82, 121], f2: [82, 150] }),
  },
  lying: {
    ground: true,
    a: pose({ h: [152, 136], s: [136, 142], p: [94, 144], e: [120, 130], w: [104, 120], k: [100, 122], f: [80, 124], k2: [76, 118], f2: [62, 144] }),
    b: pose({ h: [152, 136], s: [136, 142], p: [94, 144], e: [124, 128], w: [112, 116], k: [112, 118], f: [92, 118], k2: [76, 118], f2: [62, 144] }),
  },
  chest: {
    props: [{ t: "l", v: [132, 10, 132, 150] }],
    a: pose({ ...STAND, e: [116, 48], w: [128, 30] }),
    b: pose({ h: [108, 34], s: [106, 50], p: [102, 92], k: [102, 121], f: [100, 150], e: [118, 46], w: [128, 30] }),
  },
  child: {
    ground: true,
    a: pose({ h: [104, 52], s: [104, 68], p: [104, 112], e: [114, 50], w: [124, 32], k: [112, 148], f: [84, 148] }),
    b: pose({ h: [144, 138], s: [128, 132], p: [88, 136], e: [150, 140], w: [170, 144], k: [112, 148], f: [84, 148] }),
  },
  catcow: {
    ground: true,
    a: pose({ h: [152, 120], s: [140, 108], p: [92, 108], c: [116, 84], e: [140, 128], w: [140, 148], k: [92, 148], f: [66, 148] }),
    b: pose({ h: [154, 98], s: [140, 108], p: [92, 108], c: [116, 124], e: [140, 128], w: [140, 148], k: [92, 148], f: [66, 148] }),
  },
  forearm: {
    a: pose({ ...STAND, e: [118, 58], w: [138, 58] }),
    b: pose({ ...STAND, e: [118, 58], w: [138, 68] }),
  },
  calf: {
    props: [{ t: "l", v: [152, 10, 152, 150] }],
    a: pose({ h: [134, 46], s: [126, 60], p: [102, 100], e: [136, 72], w: [150, 62], k: [120, 124], f: [128, 150], k2: [84, 126], f2: [68, 150] }),
    b: pose({ h: [140, 48], s: [132, 62], p: [108, 102], e: [140, 74], w: [150, 62], k: [124, 124], f: [128, 150], k2: [88, 126], f2: [68, 150] }),
  },
  airSquat: {
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [110, 64], w: [106, 56], k: [104, 121], f: [100, 150] }),
    b: pose({ h: [102, 63], s: [96, 78], p: [80, 118], e: [108, 94], w: [104, 86], k: [110, 118], f: [100, 150] }),
  },
  airHinge: {
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [100, 70], w: [100, 94], k: [103, 121], f: [100, 150] }),
    b: pose({ h: [140, 62], s: [126, 70], p: [86, 92], e: [126, 92], w: [126, 114], k: [98, 121], f: [100, 150] }),
  },
  circles: {
    a: pose({ ...STAND, e: [78, 62], w: [56, 70] }),
    b: pose({ ...STAND, e: [118, 40], w: [132, 24] }),
  },
  walk: {
    a: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [102, 70], w: [102, 94], k: [110, 120], f: [114, 150], k2: [92, 120], f2: [86, 150] }),
    b: pose({ h: [100, 32], s: [100, 48], p: [100, 92], e: [102, 70], w: [102, 94], k: [92, 120], f: [86, 150], k2: [110, 120], f2: [114, 150] }),
  },
  revCrunch: {
    ground: true,
    a: pose({ h: [152, 136], s: [136, 142], p: [100, 146], e: [150, 154], w: [164, 154], k: [118, 118], f: [118, 96] }),
    b: pose({ h: [152, 136], s: [136, 142], p: [108, 128], e: [150, 154], w: [164, 154], k: [96, 108], f: [86, 96] }),
  },
  dbCrunch: {
    ground: true,
    weight: true,
    a: pose({ h: [150, 138], s: [136, 144], p: [96, 146], e: [124, 132], w: [116, 126], k: [112, 124], f: [112, 148] }),
    b: pose({ h: [126, 112], s: [120, 126], p: [96, 144], e: [114, 114], w: [106, 108], k: [112, 124], f: [112, 148] }),
  },
  twist: {
    a: pose({ h: [92, 72], s: [96, 88], p: [100, 114], e: [112, 80], w: [68, 96], k: [126, 126], f: [148, 148] }),
    b: pose({ h: [108, 72], s: [104, 88], p: [100, 114], e: [88, 80], w: [142, 96], k: [126, 126], f: [148, 148] }),
  },
  captain: {
    a: pose({ h: [100, 36], s: [100, 52], p: [100, 96], e: [78, 66], w: [70, 74], k: [104, 124], f: [104, 150] }),
    b: pose({ h: [100, 36], s: [100, 52], p: [100, 92], e: [78, 66], w: [70, 74], k: [120, 96], f: [120, 74] }),
  },
  legRaise: {
    ground: true,
    a: pose({ h: [150, 138], s: [136, 144], p: [108, 148], e: [124, 154], w: [112, 156], k: [100, 140], f: [92, 156] }),
    b: pose({ h: [150, 138], s: [136, 144], p: [108, 148], e: [124, 154], w: [112, 156], k: [108, 110], f: [108, 78] }),
  },
  bicycle: {
    ground: true,
    a: pose({ h: [138, 124], s: [128, 136], p: [104, 148], e: [116, 118], w: [132, 108], k: [92, 124], f: [78, 140], k2: [120, 132], f2: [138, 118] }),
    b: pose({ h: [138, 124], s: [128, 136], p: [104, 148], e: [148, 118], w: [132, 108], k: [120, 124], f: [136, 140], k2: [92, 132], f2: [74, 118] }),
  },
  hollow: {
    ground: true,
    a: pose({ h: [146, 132], s: [132, 142], p: [108, 148], e: [118, 150], w: [104, 154], k: [96, 132], f: [88, 118] }),
    b: pose({ h: [154, 128], s: [140, 140], p: [112, 148], e: [150, 132], w: [162, 118], k: [100, 140], f: [88, 132] }),
  },
};

export const ANIM_KEYS = [
  "squat",
  "hinge",
  "singleHinge",
  "split",
  "press",
  "row",
  "ohp",
  "pulldown",
  "curl",
  "thrust",
  "deadbug",
  "sideplank",
  "carry",
  "bike",
  "legpress",
  "legcurl",
  "pallof",
  "hipflexor",
  "hamstring",
  "lying",
  "chest",
  "child",
  "catcow",
  "forearm",
  "calf",
  "airSquat",
  "airHinge",
  "circles",
  "walk",
  "revCrunch",
  "dbCrunch",
  "twist",
  "captain",
  "legRaise",
  "bicycle",
  "hollow",
] as const;

export function animFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("reverse crunch")) return "revCrunch";
  if (n.includes("weighted bench crunch") || n.includes("cable crunch")) return "dbCrunch";
  if (n.includes("russian twist")) return "twist";
  if (n.includes("captain")) return "captain";
  if (n.includes("leg raise")) return "legRaise";
  if (n.includes("bicycle")) return "bicycle";
  if (n.includes("hollow")) return "hollow";
  if (n.includes("arm circle")) return "circles";
  if (n.includes("walk") || n.includes("run")) return "walk";
  if (n.includes("bodyweight squat")) return "airSquat";
  if (n.includes("single-leg")) return "singleHinge";
  if (n.includes("romanian")) return "hinge";
  if (n.includes("hinge")) return "airHinge";
  if (n.includes("goblet") || n.includes("hack")) return "squat";
  if (n.includes("split") || n.includes("step-up") || n.includes("lunge")) return "split";
  if (n.includes("hip thrust")) return "thrust";
  if (n.includes("leg press")) return "legpress";
  if (n.includes("leg curl")) return "legcurl";
  if (n.includes("pulldown")) return "pulldown";
  if (n.includes("shoulder press")) return "ohp";
  if (n.includes("pallof")) return "pallof";
  if (n.includes("row") || n.includes("rear-delt") || n.includes("face pull")) return "row";
  if (n.includes("press") || n.includes("push-up")) return "press";
  if (n.includes("curl") || n.includes("pushdown")) return "curl";
  if (n.includes("dead bug")) return "deadbug";
  if (n.includes("side plank")) return "sideplank";
  if (n.includes("carry")) return "carry";
  if (n.includes("bike")) return "bike";
  if (n.includes("hip flexor")) return "hipflexor";
  if (n.includes("hamstring")) return "hamstring";
  if (n.includes("figure-4")) return "lying";
  if (n.includes("doorway")) return "chest";
  if (n.includes("child")) return "child";
  if (n.includes("cat-cow")) return "catcow";
  if (n.includes("forearm")) return "forearm";
  if (n.includes("calf")) return "calf";
  return "squat";
}

export function lerp(a: P, b: P, k: number): P {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}
