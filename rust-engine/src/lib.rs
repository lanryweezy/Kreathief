use wasm_bindgen::prelude::*;

// ─── Point / BBox ──────────────────────────────────────────────

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Default)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Default)]
pub struct BBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[wasm_bindgen]
impl BBox {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        Self { x, y, width, height }
    }
}

// ─── Bezier ────────────────────────────────────────────────────

#[wasm_bindgen]
pub fn point_on_curve(
    p0x: f64, p0y: f64,
    p1x: f64, p1y: f64,
    p2x: f64, p2y: f64,
    p3x: f64, p3y: f64,
    t: f64,
) -> Point {
    let u = 1.0 - t;
    let u2 = u * u;
    let u3 = u2 * u;
    let t2 = t * t;
    let t3 = t2 * t;
    Point {
        x: u3 * p0x + 3.0 * u2 * t * p1x + 3.0 * u * t2 * p2x + t3 * p3x,
        y: u3 * p0y + 3.0 * u2 * t * p1y + 3.0 * u * t2 * p2y + t3 * p3y,
    }
}

#[wasm_bindgen]
pub fn curve_length(
    p0x: f64, p0y: f64,
    p1x: f64, p1y: f64,
    p2x: f64, p2y: f64,
    p3x: f64, p3y: f64,
    segments: u32,
) -> f64 {
    let mut length = 0.0;
    let mut prev_x = p0x;
    let mut prev_y = p0y;
    for i in 1..=segments {
        let t = i as f64 / segments as f64;
        let p = point_on_curve(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t);
        let dx = p.x - prev_x;
        let dy = p.y - prev_y;
        length += (dx * dx + dy * dy).sqrt();
        prev_x = p.x;
        prev_y = p.y;
    }
    length
}

#[wasm_bindgen]
pub fn split_curve(
    p0x: f64, p0y: f64,
    p1x: f64, p1y: f64,
    p2x: f64, p2y: f64,
    p3x: f64, p3y: f64,
    t: f64,
) -> Vec<f64> {
    let lerp = |a: f64, b: f64| a + (b - a) * t;
    let a = (lerp(p0x, p1x), lerp(p0y, p1y));
    let b = (lerp(p1x, p2x), lerp(p1y, p2y));
    let c = (lerp(p2x, p3x), lerp(p2y, p3y));
    let d = (lerp(a.0, b.0), lerp(a.1, b.1));
    let e = (lerp(b.0, c.0), lerp(b.1, c.1));
    let f = (lerp(d.0, e.0), lerp(d.1, e.1));
    vec![p0x, p0y, a.0, a.1, d.0, d.1, f.0, f.1, f.0, f.1, e.0, e.1, c.0, c.1, p3x, p3y]
}

// ─── Bounding Box ──────────────────────────────────────────────

#[wasm_bindgen]
pub fn bounding_box(points: &[f64]) -> BBox {
    if points.len() < 2 {
        return BBox::default();
    }
    let mut min_x = f64::INFINITY;
    let mut min_y = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut max_y = f64::NEG_INFINITY;
    for chunk in points.chunks_exact(2) {
        let x = chunk[0];
        let y = chunk[1];
        if x < min_x { min_x = x; }
        if y < min_y { min_y = y; }
        if x > max_x { max_x = x; }
        if y > max_y { max_y = y; }
    }
    BBox { x: min_x, y: min_y, width: max_x - min_x, height: max_y - min_y }
}

#[wasm_bindgen]
pub fn bounding_box_union(a: BBox, b: BBox) -> BBox {
    let x1 = a.x.min(b.x);
    let y1 = a.y.min(b.y);
    let x2 = (a.x + a.width).max(b.x + b.width);
    let y2 = (a.y + a.height).max(b.y + b.height);
    BBox { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

#[wasm_bindgen]
pub fn point_in_box(px: f64, py: f64, bx: f64, by: f64, bw: f64, bh: f64, padding: f64) -> bool {
    px >= bx - padding && px <= bx + bw + padding && py >= by - padding && py <= by + bh + padding
}

#[wasm_bindgen]
pub fn boxes_overlap(ax: f64, ay: f64, aw: f64, ah: f64, bx: f64, by: f64, bw: f64, bh: f64) -> bool {
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

// ─── Intersections ─────────────────────────────────────────────

#[wasm_bindgen]
pub fn line_line_intersect(
    a1x: f64, a1y: f64, a2x: f64, a2y: f64,
    b1x: f64, b1y: f64, b2x: f64, b2y: f64,
) -> Vec<f64> {
    let d1x = a2x - a1x;
    let d1y = a2y - a1y;
    let d2x = b2x - b1x;
    let d2y = b2y - b1y;
    let cross = d1x * d2y - d1y * d2x;
    if cross.abs() < 1e-10 {
        return vec![];
    }
    let dx = b1x - a1x;
    let dy = b1y - a1y;
    let t = (dx * d2y - dy * d2x) / cross;
    let u = (dx * d1y - dy * d1x) / cross;
    if t < 0.0 || t > 1.0 || u < 0.0 || u > 1.0 {
        return vec![];
    }
    vec![a1x + t * d1x, a1y + t * d1y]
}

#[wasm_bindgen]
pub fn curve_line_intersect(
    p0x: f64, p0y: f64,
    p1x: f64, p1y: f64,
    p2x: f64, p2y: f64,
    p3x: f64, p3y: f64,
    a1x: f64, a1y: f64,
    a2x: f64, a2y: f64,
    segments: u32,
) -> Vec<f64> {
    let mut results = Vec::new();
    let mut prev_x = p0x;
    let mut prev_y = p0y;
    for i in 1..=segments {
        let t = i as f64 / segments as f64;
        let p = point_on_curve(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t);
        let hit = line_line_intersect(prev_x, prev_y, p.x, p.y, a1x, a1y, a2x, a2y);
        if !hit.is_empty() {
            results.extend_from_slice(&hit);
        }
        prev_x = p.x;
        prev_y = p.y;
    }
    results
}

// ─── Measure ───────────────────────────────────────────────────

#[wasm_bindgen]
pub fn path_length(points: &[f64], closed: bool) -> f64 {
    let mut total = 0.0;
    let chunks: Vec<&[f64]> = points.chunks_exact(2).collect();
    for i in 0..chunks.len() - 1 {
        let dx = chunks[i + 1][0] - chunks[i][0];
        let dy = chunks[i + 1][1] - chunks[i][1];
        total += (dx * dx + dy * dy).sqrt();
    }
    if closed && chunks.len() > 2 {
        let dx = chunks[0][0] - chunks[chunks.len() - 1][0];
        let dy = chunks[0][1] - chunks[chunks.len() - 1][1];
        total += (dx * dx + dy * dy).sqrt();
    }
    total
}

#[wasm_bindgen]
pub fn path_area(points: &[f64]) -> f64 {
    let chunks: Vec<&[f64]> = points.chunks_exact(2).collect();
    if chunks.len() < 3 {
        return 0.0;
    }
    let mut area = 0.0;
    let n = chunks.len();
    for i in 0..n {
        let j = (i + 1) % n;
        area += chunks[i][0] * chunks[j][1] - chunks[j][0] * chunks[i][1];
    }
    area.abs() / 2.0
}

#[wasm_bindgen]
pub fn centroid(points: &[f64]) -> Vec<f64> {
    let chunks: Vec<&[f64]> = points.chunks_exact(2).collect();
    if chunks.is_empty() {
        return vec![0.0, 0.0];
    }
    let mut sx = 0.0;
    let mut sy = 0.0;
    for c in &chunks {
        sx += c[0];
        sy += c[1];
    }
    let n = chunks.len() as f64;
    vec![sx / n, sy / n]
}

// ─── Batch Bezier (1000 curves in one WASM call) ───────────────

/// Evaluate N cubic curves at the same parameter t.
/// input: flat [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, ...]  (8 floats per curve)
/// Returns flat [x0, y0, x1, y1, ...]
#[wasm_bindgen]
pub fn batch_point_on_curve(curves: &[f64], t: f64) -> Vec<f64> {
    let mut out = Vec::with_capacity(curves.len() / 4);
    let u = 1.0 - t;
    let u2 = u * u;
    let u3 = u2 * u;
    let t2 = t * t;
    let t3 = t2 * t;
    for chunk in curves.chunks_exact(8) {
        let p0x = chunk[0]; let p0y = chunk[1];
        let p1x = chunk[2]; let p1y = chunk[3];
        let p2x = chunk[4]; let p2y = chunk[5];
        let p3x = chunk[6]; let p3y = chunk[7];
        out.push(u3 * p0x + 3.0 * u2 * t * p1x + 3.0 * u * t2 * p2x + t3 * p3x);
        out.push(u3 * p0y + 3.0 * u2 * t * p1y + 3.0 * u * t2 * p2y + t3 * p3y);
    }
    out
}

/// Compute curve lengths for N curves in one WASM call.
/// input: flat [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, ...] (8 per curve)
#[wasm_bindgen]
pub fn batch_curve_lengths(curves: &[f64], segments: u32) -> Vec<f64> {
    let mut lengths = Vec::with_capacity(curves.len() / 8);
    for chunk in curves.chunks_exact(8) {
        lengths.push(curve_length(
            chunk[0], chunk[1], chunk[2], chunk[3],
            chunk[4], chunk[5], chunk[6], chunk[7], segments));
    }
    lengths
}

#[wasm_bindgen]
pub struct SnappingOracle {
    sorted_x: Vec<f64>,
    sorted_x_origins: Vec<f64>,
    sorted_x_extents: Vec<f64>,
    sorted_y: Vec<f64>,
    sorted_y_origins: Vec<f64>,
    sorted_y_extents: Vec<f64>,
}

struct SortedTarget {
    value: f64,
    origin: f64,
    extent: f64,
}

#[wasm_bindgen]
impl SnappingOracle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            sorted_x: Vec::new(),
            sorted_x_origins: Vec::new(),
            sorted_x_extents: Vec::new(),
            sorted_y: Vec::new(),
            sorted_y_origins: Vec::new(),
            sorted_y_extents: Vec::new(),
        }
    }

    /// Build snap targets from artboard + layer data.
    /// `layer_data` is a flat array: [x0, y0, w0, h0, id0, locked0, visible0, groupId_is_some_0, x1, y1, ...]
    /// `moving_ids` is a flat array of indices (into layer_data chunks) that are being moved.
    /// `ab_x, ab_y, ab_w, ab_h` define the artboard.
    pub fn build_targets(
        &mut self,
        layer_data: &[f64],
        moving_ids: &[u32],
        ab_x: f64, ab_y: f64, ab_w: f64, ab_h: f64,
    ) {
        let mut targets_x: Vec<SortedTarget> = Vec::with_capacity(128);
        let mut targets_y: Vec<SortedTarget> = Vec::with_capacity(128);

        // Artboard edges + center
        targets_x.push(SortedTarget { value: ab_x, origin: ab_y, extent: ab_h });
        targets_x.push(SortedTarget { value: ab_x + ab_w, origin: ab_y, extent: ab_h });
        targets_x.push(SortedTarget { value: ab_x + ab_w / 2.0, origin: ab_y, extent: ab_h });

        targets_y.push(SortedTarget { value: ab_y, origin: ab_x, extent: ab_w });
        targets_y.push(SortedTarget { value: ab_y + ab_h, origin: ab_x, extent: ab_w });
        targets_y.push(SortedTarget { value: ab_y + ab_h / 2.0, origin: ab_x, extent: ab_w });

        let chunk_size = 8; // x, y, w, h, id, locked, visible, has_group
        let num_layers = layer_data.len() / chunk_size;
        let moving_set: std::collections::HashSet<u32> = moving_ids.iter().copied().collect();

        for i in 0..num_layers {
            if moving_set.contains(&(i as u32)) { continue; }
            let base = i * chunk_size;
            let x = layer_data[base];
            let y = layer_data[base + 1];
            let w = layer_data[base + 2];
            let h = layer_data[base + 3];
            let locked = layer_data[base + 4] != 0.0;
            let visible = layer_data[base + 5] != 0.0;
            let has_group = layer_data[base + 6] != 0.0;

            if locked || !visible || has_group { continue; }

            targets_x.push(SortedTarget { value: x, origin: y, extent: h });
            targets_x.push(SortedTarget { value: x + w, origin: y, extent: h });
            targets_x.push(SortedTarget { value: x + w / 2.0, origin: y, extent: h });

            targets_y.push(SortedTarget { value: y, origin: x, extent: w });
            targets_y.push(SortedTarget { value: y + h, origin: x, extent: w });
            targets_y.push(SortedTarget { value: y + h / 2.0, origin: x, extent: w });
        }

        targets_x.sort_by(|a, b| a.value.partial_cmp(&b.value).unwrap());
        targets_y.sort_by(|a, b| a.value.partial_cmp(&b.value).unwrap());

        self.sorted_x = targets_x.iter().map(|t| t.value).collect();
        self.sorted_x_origins = targets_x.iter().map(|t| t.origin).collect();
        self.sorted_x_extents = targets_x.iter().map(|t| t.extent).collect();
        self.sorted_y = targets_y.iter().map(|t| t.value).collect();
        self.sorted_y_origins = targets_y.iter().map(|t| t.origin).collect();
        self.sorted_y_extents = targets_y.iter().map(|t| t.extent).collect();
    }

    /// Calculate snap result.
    /// `moving_edges_x` / `moving_edges_y` are the 3 edges (min, max, center) of the selection.
    /// Returns [snap_x (or NaN), snap_y (or NaN), snap_line_type, snap_line_value, snap_line_origin, snap_line_extent]
    pub fn calculate_snaps(
        &self,
        sel_min_x: f64, sel_min_y: f64, sel_max_x: f64, sel_max_y: f64,
        threshold: f64,
    ) -> Vec<f64> {
        let sel_w = sel_max_x - sel_min_x;
        let sel_h = sel_max_y - sel_min_y;
        let edges_x = [sel_min_x, sel_max_x, sel_min_x + sel_w / 2.0];
        let edges_y = [sel_min_y, sel_max_y, sel_min_y + sel_h / 2.0];

        let mut best_diff_x = threshold;
        let mut best_edge_x = 0usize;
        let mut best_target_x = 0usize;

        for &edge in &edges_x {
            let lo = self.binary_search_lower_x(edge - threshold);
            let hi = self.binary_search_lower_x(edge + threshold);
            for i in lo..hi {
                let diff = (edge - self.sorted_x[i]).abs();
                if diff < best_diff_x {
                    best_diff_x = diff;
                    best_edge_x = edges_x.iter().position(|&e| (e - edge).abs() < 1e-10).unwrap_or(0);
                    best_target_x = i;
                }
            }
        }

        let mut best_diff_y = threshold;
        let mut best_edge_y = 0usize;
        let mut best_target_y = 0usize;

        for &edge in &edges_y {
            let lo = self.binary_search_lower_y(edge - threshold);
            let hi = self.binary_search_lower_y(edge + threshold);
            for i in lo..hi {
                let diff = (edge - self.sorted_y[i]).abs();
                if diff < best_diff_y {
                    best_diff_y = diff;
                    best_edge_y = edges_y.iter().position(|&e| (e - edge).abs() < 1e-10).unwrap_or(0);
                    best_target_y = i;
                }
            }
        }

        let mut result = Vec::with_capacity(6);

        // snap_x
        if best_diff_x < threshold {
            let edge_val = edges_x[best_edge_x];
            result.push(self.sorted_x[best_target_x] - (edge_val - sel_min_x));
        } else {
            result.push(f64::NAN);
        }

        // snap_y
        if best_diff_y < threshold {
            let edge_val = edges_y[best_edge_y];
            result.push(self.sorted_y[best_target_y] - (edge_val - sel_min_y));
        } else {
            result.push(f64::NAN);
        }

        // snap line x: [type(0=vertical), value, origin, extent]
        if best_diff_x < threshold {
            result.push(0.0); // vertical
            result.push(self.sorted_x[best_target_x]);
            result.push(self.sorted_x_origins[best_target_x].min(sel_min_y));
            result.push(
                sel_min_y.max(self.sorted_x_origins[best_target_x] + self.sorted_x_extents[best_target_x])
                    - self.sorted_x_origins[best_target_x].min(sel_min_y)
            );
        }

        // snap line y: [type(1=horizontal), value, origin, extent]
        if best_diff_y < threshold {
            result.push(1.0); // horizontal
            result.push(self.sorted_y[best_target_y]);
            result.push(self.sorted_y_origins[best_target_y].min(sel_min_x));
            result.push(
                sel_min_x.max(self.sorted_y_origins[best_target_y] + self.sorted_y_extents[best_target_y])
                    - self.sorted_y_origins[best_target_y].min(sel_min_x)
            );
        }

        result
    }

    fn binary_search_lower_x(&self, target: f64) -> usize {
        let mut lo = 0;
        let mut hi = self.sorted_x.len();
        while lo < hi {
            let mid = (lo + hi) >> 1;
            if self.sorted_x[mid] < target { lo = mid + 1; } else { hi = mid; }
        }
        lo
    }

    fn binary_search_lower_y(&self, target: f64) -> usize {
        let mut lo = 0;
        let mut hi = self.sorted_y.len();
        while lo < hi {
            let mid = (lo + hi) >> 1;
            if self.sorted_y[mid] < target { lo = mid + 1; } else { hi = mid; }
        }
        lo
    }
}
