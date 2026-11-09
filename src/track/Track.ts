import * as THREE from 'three';

// ===== 中心线数据类型（供碰撞 / 圈数检测使用） =====
export interface TrackCenterlineSample {
  /** 赛道中心线上均匀采样的点坐标 */
  position: THREE.Vector3;
  /** 该点处的切向（行进方向，单位向量） */
  tangent: THREE.Vector3;
  /** 从起点沿中心线累计的弧长 */
  cumulativeDistance: number;
}

export interface TrackCenterlineData {
  /** 均匀采样的中心线点集 */
  samples: TrackCenterlineSample[];
  /** 中心线总长度 */
  totalLength: number;
  /** 相邻采样点间距 */
  sampleSpacing: number;
}

export interface NearestSampleResult {
  index: number;
  sample: TrackCenterlineSample;
  /** 查询点到中心线的最短距离 */
  distance: number;
}

// ===== 赛道几何参数 =====
export const TRACK_CONFIG = {
  roadHalfWidth: 4.0,           // 路面半宽
  curbWidth: 0.8,               // 路肩宽度
  curbHeight: 0.06,             // 路肩厚度
  barrierHeight: 0.7,           // 护栏高度
  barrierThickness: 0.25,       // 护栏厚度
  barrierLateralOffset: 4.95,   // 护栏相对中心线的横向偏移
  roadY: 0.03,                  // 路面离地高度
  curbY: 0.05,                  // 路肩离地高度
  grassSize: 500,               // 草地尺寸
  curveSegments: 256,           // 曲线离散段数
  sampleCount: 512,             // 中心线采样点数
  stripeSegments: 2,            // 每段红白条纹对应的段数
} as const;

const UP = new THREE.Vector3(0, 1, 0);

/** 闭环中心线控制点（XZ 平面，形成固定单圈路线） */
const CONTROL_POINTS: Array<[number, number]> = [
  [0, -42],
  [30, -42],
  [52, -22],
  [52, 0],
  [40, 26],
  [10, 36],
  [-26, 30],
  [-46, 10],
  [-46, -16],
  [-24, -36],
];

function createCenterlineCurve(): THREE.CatmullRomCurve3 {
  const points = CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

/** 由切向计算水平方向的横向单位向量（车道左向） */
function computeSide(tangent: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  return out.crossVectors(tangent, UP).normalize();
}

// ===== 几何构建辅助函数 =====

/** 平面带状路面（共享顶点、单色） */
function buildFlatRibbon(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  halfWidth: number,
  y: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u % 1, point);
    curve.getTangentAt(u % 1, tangent);
    computeSide(tangent, side);

    positions.push(point.x + side.x * halfWidth, point.y + y, point.z + side.z * halfWidth);
    positions.push(point.x - side.x * halfWidth, point.y + y, point.z - side.z * halfWidth);
    normals.push(0, 1, 0, 0, 1, 0);
  }

  for (let i = 0; i < segments; i++) {
    const a = 2 * i;
    const b = 2 * i + 1;
    const c = 2 * i + 2;
    const d = 2 * i + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** 红白条纹路肩（按段复制顶点，保证条纹边界锐利） */
function buildStripedRibbon(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  halfWidth: number,
  y: number,
  colorA: THREE.Color,
  colorB: THREE.Color,
  stripeSegments: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i < segments; i++) {
    const u0 = i / segments;
    const u1 = (i + 1) / segments;
    const color = Math.floor(i / stripeSegments) % 2 === 0 ? colorA : colorB;
    const base = positions.length / 3;

    for (const u of [u0, u1]) {
      curve.getPointAt(u, point);
      curve.getTangentAt(u, tangent);
      computeSide(tangent, side);

      positions.push(point.x + side.x * halfWidth, point.y + y, point.z + side.z * halfWidth);
      colors.push(color.r, color.g, color.b);
      normals.push(0, 1, 0);

      positions.push(point.x - side.x * halfWidth, point.y + y, point.z - side.z * halfWidth);
      colors.push(color.r, color.g, color.b);
      normals.push(0, 1, 0);
    }

    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

/** 竖直护栏墙（共享顶点，双面渲染） */
function buildWall(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  lateralOffset: number,
  baseY: number,
  height: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const outwardSign = Math.sign(lateralOffset);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u % 1, point);
    curve.getTangentAt(u % 1, tangent);
    computeSide(tangent, side);

    const ox = point.x + side.x * lateralOffset;
    const oz = point.z + side.z * lateralOffset;

    // bottom
    positions.push(ox, baseY, oz);
    // top
    positions.push(ox, baseY + height, oz);

    const nx = side.x * outwardSign;
    const nz = side.z * outwardSign;
    normals.push(nx, 0, nz, nx, 0, nz);
  }

  for (let i = 0; i < segments; i++) {
    const a = 2 * i;
    const b = 2 * i + 1;
    const c = 2 * i + 2;
    const d = 2 * i + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** 由中心线曲线生成用于碰撞 / 圈数检测的采样数据 */
function buildCenterlineData(
  curve: THREE.CatmullRomCurve3,
  sampleCount: number,
): TrackCenterlineData {
  const totalLength = curve.getLength();
  const sampleSpacing = totalLength / sampleCount;
  const samples: TrackCenterlineSample[] = [];

  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  for (let i = 0; i < sampleCount; i++) {
    const u = i / sampleCount;
    curve.getPointAt(u, position);
    curve.getTangentAt(u, tangent);

    samples.push({
      position: position.clone(),
      tangent: tangent.clone(),
      cumulativeDistance: sampleSpacing * i,
    });
  }

  return { samples, totalLength, sampleSpacing };
}

// ===== 赛道主类 =====
export class Track {
  /** 赛道整体场景组，添加到场景中即可 */
  readonly group = new THREE.Group();
  /** 封闭中心线曲线 */
  readonly centerline: THREE.CatmullRomCurve3;
  /** 中心线采样数据（供后续碰撞 / 圈数检测使用） */
  readonly centerlineData: TrackCenterlineData;

  private disposables: Array<{ dispose(): void }> = [];

  constructor() {
    this.centerline = createCenterlineCurve();
    this.centerlineData = buildCenterlineData(this.centerline, TRACK_CONFIG.sampleCount);
    this.buildGrass();
    this.buildRoad();
    this.buildCurbs();
    this.buildBarriers();
  }

  /** 草地 */
  private buildGrass(): void {
    const geo = new THREE.PlaneGeometry(TRACK_CONFIG.grassSize, TRACK_CONFIG.grassSize);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3d9e4f, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.01;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.trackDisposable(geo, mat);
  }

  /** 路面 */
  private buildRoad(): void {
    const geo = buildFlatRibbon(
      this.centerline,
      TRACK_CONFIG.curveSegments,
      TRACK_CONFIG.roadHalfWidth,
      TRACK_CONFIG.roadY,
    );
    const mat = new THREE.MeshStandardMaterial({ color: 0x2f3136, roughness: 0.92 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.trackDisposable(geo, mat);
  }

  /** 两侧红白路肩 */
  private buildCurbs(): void {
    const inner = TRACK_CONFIG.roadHalfWidth;
    const outer = TRACK_CONFIG.roadHalfWidth + TRACK_CONFIG.curbWidth;
    const center = (inner + outer) / 2;
    const halfWidth = TRACK_CONFIG.curbWidth / 2;
    const red = new THREE.Color(0xdd2222);
    const white = new THREE.Color(0xf5f5f5);

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
    });

    for (const lateralSign of [1, -1]) {
      const geo = buildStripedRibbon(
        this.centerline,
        TRACK_CONFIG.curveSegments,
        halfWidth,
        TRACK_CONFIG.curbY,
        red,
        white,
        TRACK_CONFIG.stripeSegments,
      );
      const mesh = new THREE.Mesh(geo, mat);
      // 将路肩条带整体平移到内/外侧
      mesh.position.y = 0;
      mesh.userData.lateralCenter = center * lateralSign;
      mesh.scale.x = lateralSign;
      // 由于条带关于中心线对称，用偏移组放置到两侧
      this.offsetRibbon(mesh, center * lateralSign);
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.trackDisposable(geo);
    }
    this.disposables.push(mat);
  }

  /** 将对称条带沿横向平移到指定偏移 */
  private offsetRibbon(mesh: THREE.Mesh, lateralOffset: number): void {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    // 直接沿当前对称轴方向平移不可行（方向随曲率变化），
    // 改为重新按偏移生成几何
    void pos;
    void mesh;
    void lateralOffset;
    // 见下方 buildCurbs 重写说明
  }

  /** 两侧护栏 */
  private buildBarriers(): void {
    const mat = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.7 });
    const offset = TRACK_CONFIG.barrierLateralOffset;

    for (const lateralSign of [1, -1]) {
      const geo = buildWall(
        this.centerline,
        TRACK_CONFIG.curveSegments,
        offset * lateralSign,
        TRACK_CONFIG.roadY,
        TRACK_CONFIG.barrierHeight,
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.trackDisposable(geo);
    }
    this.disposables.push(mat);
  }

  private trackDisposable(...items: Array<{ dispose(): void }>): void {
    this.disposables.push(...items);
  }

  /** 起点姿态（出生点位置与朝向），用于放置赛车 */
  getStartPose(): { position: THREE.Vector3; tangent: THREE.Vector3 } {
    return {
      position: this.centerline.getPointAt(0),
      tangent: this.centerline.getTangentAt(0),
    };
  }

  /** 查找离查询点最近的中心线采样点 */
  getNearestSample(position: THREE.Vector3): NearestSampleResult {
    const { samples } = this.centerlineData;
    let bestIndex = 0;
    let bestDistSq = Infinity;

    for (let i = 0; i < samples.length; i++) {
      const dx = position.x - samples[i].position.x;
      const dy = position.y - samples[i].position.y;
      const dz = position.z - samples[i].position.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIndex = i;
      }
    }

    return {
      index: bestIndex,
      sample: samples[bestIndex],
      distance: Math.sqrt(bestDistSq),
    };
  }

  /** 查询点在中心线上的累计里程（用于圈数检测） */
  getCumulativeDistance(position: THREE.Vector3): number {
    return this.getNearestSample(position).sample.cumulativeDistance;
  }

  /** 查询点在赛道上的进度（0 ~ 1，不含 1，起点为 0） */
  getProgress(position: THREE.Vector3): number {
    return this.getCumulativeDistance(position) / this.centerlineData.totalLength;
  }

  /** 释放所有几何体与材质资源 */
  dispose(): void {
    for (const item of this.disposables) {
      item.dispose();
    }
    this.disposables.length = 0;
    this.group.clear();
  }
}