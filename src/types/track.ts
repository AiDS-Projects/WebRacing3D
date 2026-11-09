import type { ColorRepresentation, Vector3Tuple } from 'three'

/**
 * 赛道模块类型定义
 * 描述封闭环形赛道的中心线、路面、路肩、护栏与草地的数据结构，
 * 为赛道构建器（模型生成）以及后续碰撞检测、圈数检测提供统一契约。
 */

/** 三维坐标三元组，等价于 [x, y, z] */
export type TrackPoint3D = Vector3Tuple

/** 赛道组成元素类别 */
export type TrackElementKind = 'road' | 'curb' | 'barrier' | 'grass'

/** 相对中心线的横向侧向 */
export type TrackSide = 'left' | 'right'

/** 车辆当前所处的赛道区域（由碰撞检测采样得出） */
export type TrackRegion = TrackElementKind | 'offtrack'

/**
 * 赛道中心线采样点
 * 中心线是环形的封闭曲线，按弧长离散为有序采样点序列。
 */
export interface TrackCenterlinePoint {
  /** 世界坐标位置 */
  position: TrackPoint3D
  /** 单位切向量（沿行进方向） */
  tangent: TrackPoint3D
  /** 单位法向量（水平面内，指向右侧） */
  normal: TrackPoint3D
  /** 从起点起算的累计弧长 */
  distance: number
  /** 该点曲率（1/半径），左转为正、右转为负 */
  curvature: number
}

/** 赛道中心线数据 */
export interface TrackCenterline {
  /** 按行进顺序排列的采样点 */
  points: TrackCenterlinePoint[]
  /** 整圈总长度 */
  totalLength: number
  /** 是否为封闭环线（本模块恒为 true） */
  closed: boolean
}

/** 赛道横向边界（相对中心线，用于碰撞判定） */
export interface TrackBounds {
  /** 左侧路面半宽（中心线到左路肩外缘） */
  left: number
  /** 右侧路面半宽（中心线到右路肩外缘） */
  right: number
  /** 路肩宽度（附加在路面两侧之外） */
  curbWidth: number
  /** 护栏横向厚度 */
  barrierThickness: number
  /** 护栏高度 */
  barrierHeight: number
  /** 草地外延宽度（路肩外侧） */
  grassWidth: number
}

/** 赛道各元素材质颜色配置 */
export interface TrackColors {
  /** 路面颜色 */
  road?: ColorRepresentation
  /** 路肩颜色（红白相间为双色时可用数组） */
  curb?: ColorRepresentation | ColorRepresentation[]
  /** 护栏颜色 */
  barrier?: ColorRepresentation
  /** 草地颜色 */
  grass?: ColorRepresentation
  /** 起跑线颜色 */
  startLine?: ColorRepresentation
}

/** 赛道构建参数 */
export interface TrackConfig {
  /** 赛道名称 */
  name?: string
  /** 环形赛道半径（或控制参数，具体语义由构建器决定） */
  radius?: number
  /** 路面总宽 */
  trackWidth?: number
  /** 路面横向分段数 */
  widthSegments?: number
  /** 中心线采样点数量（决定碰撞/圈数检测精度） */
  sampleCount?: number
  /** 横向边界（缺省由 trackWidth 推导） */
  bounds?: TrackBounds
  /** 各元素颜色 */
  colors?: TrackColors
}

/** 起跑线/终点线 */
export interface TrackStartLine {
  /** 起跑线中心位置 */
  position: TrackPoint3D
  /** 起跑线方向（单位切向量，垂直起跑线） */
  direction: TrackPoint3D
  /** 起跑线在中心线上的弧长 */
  distance: number
}

/** 圈数检测检查点 */
export interface TrackCheckpoint {
  /** 检查点中心位置 */
  position: TrackPoint3D
  /** 检查点在中心线上的弧长 */
  distance: number
  /** 通过判定半径容差 */
  radius: number
}

/** 车辆在赛道上的行程进度（用于圈数检测） */
export interface TrackProgress {
  /** 当前累计弧长（从起点起算，可跨圈累加） */
  distance: number
  /** 当前所在圈序号（0 起） */
  lap: number
  /** 圈内归一化进度 [0, 1) */
  progress: number
  /** 最近已通过的检查点索引 */
  checkpointIndex: number
  /** 行进方向：+1 正向、-1 逆向、0 静止 */
  direction: 1 | -1 | 0
}

/** 圈数检测结果 */
export interface LapResult {
  /** 是否本帧完成一圈 */
  completed: boolean
  /** 当前累计圈数 */
  lap: number
  /** 最近一圈耗时（秒，首次完成为 0） */
  lapTime: number
}

/** 赛道采样结果（将车辆位置投影到中心线后得到，供碰撞检测使用） */
export interface TrackSample {
  /** 最近中心线采样点位置 */
  position: TrackPoint3D
  /** 最近中心线采样点的切向量 */
  tangent: TrackPoint3D
  /** 最近中心线采样点的法向量 */
  normal: TrackPoint3D
  /** 最近点在中心线上的弧长 */
  distance: number
  /** 车辆相对中心线的有符号横向偏移（右为正） */
  lateralOffset: number
  /** 车辆当前所处区域 */
  region: TrackRegion
  /** 是否触碰护栏 */
  hitBarrier: boolean
}

/** 赛道完整运行时数据，由构建器生成并供各模块共享 */
export interface TrackData {
  /** 中心线数据 */
  centerline: TrackCenterline
  /** 横向边界 */
  bounds: TrackBounds
  /** 起跑线 */
  startLine: TrackStartLine
  /** 圈数检测检查点（含起跑线） */
  checkpoints: TrackCheckpoint[]
  /** 构建参数快照 */
  config: TrackConfig
  /** 赛道总长度 */
  totalLength: number
  /**
   * 将世界坐标点投影到中心线并采样，
   * 返回最近点信息与横向偏移、所处区域，供碰撞检测使用。
   */
  sample: (point: TrackPoint3D) => TrackSample
  /** 根据累计弧长获取归一化进度与圈数 */
  progressOf: (distance: number) => TrackProgress
}