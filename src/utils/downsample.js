// Largest-triangle-three-buckets downsampling. Reduces a time series to a
// target number of points while preserving its shape: the first and last
// points are always kept, and peaks/troughs/plateaus are retained by
// favouring the point with the largest visual triangle area in each bucket.
// Every returned point is a real point from the input series - nothing is
// invented or averaged into the output.
//
// Input points use `t` (epoch ms) and `value` fields so the same routine
// works for any cumulative series produced by the providers.

/**
 * @param {Array<{t:number, value:number}>} points sorted by t ascending
 * @param {number} target desired maximum number of output points (>= 2)
 * @returns {Array} downsampled copy of the input points
 */
export function lttbDownsample(points, target) {
  if (!Array.isArray(points) || points.length === 0) return points;
  if (target < 2) return points;
  if (points.length <= target) return points;

  const sampled = [points[0]];
  let a = 0;

  const bucketSize = (points.length - 2) / (target - 2);
  for (let i = 0; i < target - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.min(points.length - 1, Math.floor((i + 2) * bucketSize) + 1);
    const avgStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgEnd = Math.floor((i + 2) * bucketSize);
    if (avgEnd > points.length) avgEnd = points.length;

    if (avgEnd <= avgStart) continue;

    let avgT = 0;
    let avgValue = 0;
    for (let j = avgStart; j < avgEnd; j++) {
      avgT += points[j].t;
      avgValue += points[j].value;
    }
    avgT /= avgEnd - avgStart;
    avgValue /= avgEnd - avgStart;

    const ax = points[a].t;
    const ay = points[a].value;
    let bestDist = -1;
    let best = rangeStart;
    for (let j = rangeStart; j < rangeEnd; j++) {
      const dist = Math.abs((ax - avgT) * (points[j].value - ay) - (ax - points[j].t) * (avgValue - ay));
      if (dist > bestDist) {
        bestDist = dist;
        best = j;
      }
    }
    sampled.push(points[best]);
    a = best;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}