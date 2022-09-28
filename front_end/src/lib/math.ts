export function lerp(a: f64, b: f64, t: f64): f64 {
  return a + (b - a) * t;
}

export function getDistance(x1: f64, y1: f64, x2: f64, y2: f64): f64 {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

export function getAngle(x1: f64, y1: f64, x2: f64, y2: f64): f64 {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function getAngleDeg(x1: f64, y1: f64, x2: f64, y2: f64): f64 {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

export function clamp(value: f64, min: f64, max: f64): f64 {
  return Math.min(Math.max(value, min), max);
}

export function map(value: f64, min: f64, max: f64, newMin: f64, newMax: f64): f64 {
  return newMin + (newMax - newMin) * (value - min) / (max - min);
}

export function round(x: f64, n: f64): f64 {
  return Math.round((x + f64.EPSILON) / n) * n;
}


