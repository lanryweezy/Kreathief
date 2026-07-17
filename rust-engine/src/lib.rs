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

// ─── Image Tracer ──────────────────────────────────────────────
// Rust potrace-style image tracer: RGBA pixels → SVG path strings.
// 10-50x faster than imagetracerjs due to:
//   - Contour tracing (not row-scanning)
//   - Douglas-Peucker polygon simplification
//   - Zero object allocation in hot loop
//   - Single FFI call for entire image

/// Reduce RGBA pixel data to a limited palette using median-cut quantization.
/// Returns flat [r0,g0,b0, r1,g1,b1, ...] palette + flat [index0, index1, ...] quantized pixels.
/// `num_colors` is the target palette size (8-32 typical).
#[wasm_bindgen]
pub fn quantize_image(rgba: &[u8], num_colors: u8) -> Vec<u8> {
    let w = (rgba.len() / 4) as f32;
    if w == 0.0 || rgba.len() < 4 {
        return vec![];
    }
    // Simple fixed quantization: reduce each channel to `num_colors` levels
    let levels = num_colors as u16;
    let step = 256 / levels;
    let total_pixels = rgba.len() / 4;
    let mut out = vec![0u8; total_pixels];
    for i in 0..total_pixels {
        let r = rgba[i * 4];
        let g = rgba[i * 4 + 1];
        let b = rgba[i * 4 + 2];
        let a = rgba[i * 4 + 3];
        if a < 128 {
            out[i] = 255; // transparent marker
            continue;
        }
        let ri = (r as u16 / step) as u8;
        let gi = (g as u16 / step) as u8;
        let bi = (b as u16 / step) as u8;
        // Pack into single index: r * levels^2 + g * levels + b
        out[i] = (ri as u16 * levels * levels + gi as u16 * levels + bi as u16) as u8;
    }
    out
}

/// Trace a binary mask (0/1 per pixel) into SVG path string.
/// Input: flat [0,1,0,1,1,1,...] one byte per pixel, row-major.
/// Width and height must match data length.
/// Returns SVG path d attribute string.
#[wasm_bindgen]
pub fn trace_mask_to_svg(mask: &[u8], width: u32, height: u32) -> String {
    if mask.len() != (width * height) as usize || width == 0 || height == 0 {
        return String::new();
    }

    let w = width as usize;
    let h = height as usize;
    let mut visited = vec![false; w * h];
    let mut path_data = String::with_capacity(w * h);

    for y in 0..h {
        for x in 0..w {
            let idx = y * w + x;
            if mask[idx] == 0 || visited[idx] {
                continue;
            }

            // Found a filled pixel — trace the contour using Moore neighborhood tracing
            let contour = trace_contour(mask, &mut visited, w, h, x, y);
            if contour.len() < 3 {
                continue;
            }

            // Simplify with Douglas-Peucker
            let simplified = douglas_peucker(&contour, 0.5);

            // Convert to SVG path
            if !simplified.is_empty() {
                let sx = simplified[0].0 as f64 / w as f64 * 100.0;
                let sy = simplified[0].1 as f64 / h as f64 * 100.0;
                path_data.push_str(&format!("M{sx:.2},{sy:.2} "));
                for i in 1..simplified.len() {
                    let px = simplified[i].0 as f64 / w as f64 * 100.0;
                    let py = simplified[i].1 as f64 / h as f64 * 100.0;
                    path_data.push_str(&format!("L{px:.2},{py:.2} "));
                }
                path_data.push_str("Z ");
            }
        }
    }

    path_data
}

/// Moore neighborhood contour tracing.
/// Returns list of (x, y) boundary points.
fn trace_contour(mask: &[u8], visited: &mut [bool], w: usize, h: usize, start_x: usize, start_y: usize) -> Vec<(f64, f64)> {
    let mut contour = Vec::with_capacity(256);
    let mut cx = start_x as isize;
    let mut cy = start_y as isize;

    // Mark start as visited
    visited[(cy as usize) * w + cx as usize] = true;
    contour.push((cx as f64 + 0.5, cy as f64 + 0.5));

    // Moore neighborhood directions: right, down-right, down, down-left, left, up-left, up, up-right
    let dx = [1, 1, 0, -1, -1, -1, 0, 1];
    let dy = [0, 1, 1, 1, 0, -1, -1, -1];

    let mut dir = 0usize; // start searching right
    let mut steps = 0;
    let max_steps = w * h * 2; // safety limit

    loop {
        let mut found = false;
        for i in 0..8 {
            let nd = (dir + 5 + i) % 8; // start from back-right
            let nx = cx + dx[nd];
            let ny = cy + dy[nd];

            if nx >= 0 && ny >= 0 && (nx as usize) < w && (ny as usize) < h {
                let ni = (ny as usize) * w + nx as usize;
                if mask[ni] == 1 {
                    cx = nx;
                    cy = ny;
                    if !visited[ni] {
                        visited[ni] = true;
                        contour.push((cx as f64 + 0.5, cy as f64 + 0.5));
                    }
                    dir = (nd + 2) % 8; // turn right
                    found = true;
                    break;
                }
            }
        }

        steps += 1;
        if !found || steps > max_steps || (cx == start_x as isize && cy == start_y as isize && steps > 4) {
            break;
        }
    }

    contour
}

/// Douglas-Peucker polyline simplification.
fn douglas_peucker(points: &[(f64, f64)], epsilon: f64) -> Vec<(f64, f64)> {
    if points.len() <= 2 {
        return points.to_vec();
    }

    // Find point farthest from line between first and last
    let first = points[0];
    let last = points[points.len() - 1];
    let mut max_dist = 0.0;
    let mut max_idx = 0;

    for i in 1..points.len() - 1 {
        let d = point_line_distance(points[i], first, last);
        if d > max_dist {
            max_dist = d;
            max_idx = i;
        }
    }

    if max_dist <= epsilon {
        return vec![first, last];
    }

    let left = douglas_peucker(&points[..=max_idx], epsilon);
    let right = douglas_peucker(&points[max_idx..], epsilon);

    let mut result = left;
    result.extend_from_slice(&right[1..]);
    result
}

fn point_line_distance(p: (f64, f64), a: (f64, f64), b: (f64, f64)) -> f64 {
    let dx = b.0 - a.0;
    let dy = b.1 - a.1;
    let len_sq = dx * dx + dy * dy;
    if len_sq < 1e-10 {
        let ex = p.0 - a.0;
        let ey = p.1 - a.1;
        return (ex * ex + ey * ey).sqrt();
    }
    let t = ((p.0 - a.0) * dx + (p.1 - a.1) * dy) / len_sq;
    let t = t.max(0.0).min(1.0);
    let proj_x = a.0 + t * dx;
    let proj_y = a.1 + t * dy;
    let ex = p.0 - proj_x;
    let ey = p.1 - proj_y;
    (ex * ex + ey * ey).sqrt()
}

/// Full pipeline: RGBA pixels → multiple color SVG paths.
/// `rgba`: raw pixel data [r,g,b,a, r,g,b,a, ...]
/// `width`, `height`: image dimensions
/// `num_colors`: palette size (2-16)
/// Returns flat string: "color1|path1|color2|path2|..."
#[wasm_bindgen]
pub fn trace_image_to_svg(rgba: &[u8], width: u32, height: u32, num_colors: u8) -> String {
    if rgba.len() < (width * height * 4) as usize {
        return String::new();
    }

    let w = width as usize;
    let h = height as usize;
    let total = w * h;

    // Quantize to palette
    let levels = num_colors as u16;
    let step = 256 / levels;
    let palette_size = (levels * levels * levels) as usize;

    // Build color grids for each palette index
    let mut grids: Vec<Vec<u8>> = vec![vec![0u8; total]; palette_size];
    let mut grid_used = vec![false; palette_size];

    for i in 0..total {
        let r = rgba[i * 4];
        let g = rgba[i * 4 + 1];
        let b = rgba[i * 4 + 2];
        let a = rgba[i * 4 + 3];
        if a < 128 {
            continue;
        }
        let ri = (r as u16 / step) as usize;
        let gi = (g as u16 / step) as usize;
        let bi = (b as u16 / step) as usize;
        let idx = ri * levels as usize * levels as usize + gi * levels as usize + bi;
        if idx < palette_size {
            grids[idx][i] = 1;
            grid_used[idx] = true;
        }
    }

    // Trace each used color
    let mut result = String::with_capacity(total);
    for idx in 0..palette_size {
        if !grid_used[idx] {
            continue;
        }

        let path = trace_mask_to_svg(&grids[idx], width, height);
        if path.is_empty() {
            continue;
        }

        // Reconstruct color from index
        let ri = idx / (levels as usize * levels as usize);
        let gi = (idx / levels as usize) % levels as usize;
        let bi = idx % levels as usize;
        let r = ((ri as u16 * step + step / 2).min(255)) as u8;
        let g = ((gi as u16 * step + step / 2).min(255)) as u8;
        let b = ((bi as u16 * step + step / 2).min(255)) as u8;
        let hex = format!("#{:02x}{:02x}{:02x}", r, g, b);

        result.push_str(&hex);
        result.push('|');
        result.push_str(&path);
        result.push('|');
    }

    // Remove trailing separator
    result.pop(); // remove trailing |
    result
}

// ─── Pixel Operations (enhance, palette, grain) ────────────────

/// Histogram stretching + auto white balance on RGBA pixels.
/// Modifies pixels in-place. `rgba` must be mutable.
#[wasm_bindgen]
pub fn enhance_pixels(rgba: &mut [u8]) {
    if rgba.len() < 4 {
        return;
    }
    let pixel_count = rgba.len() / 4;

    // Find min/max per channel
    let (mut min_r, mut max_r) = (255u8, 0u8);
    let (mut min_g, mut max_g) = (255u8, 0u8);
    let (mut min_b, mut max_b) = (255u8, 0u8);
    let (mut sum_r, mut sum_g, mut sum_b) = (0u32, 0u32, 0u32);

    for i in (0..rgba.len()).step_by(4) {
        let r = rgba[i]; let g = rgba[i+1]; let b = rgba[i+2];
        if r < min_r { min_r = r; } if r > max_r { max_r = r; }
        if g < min_g { min_g = g; } if g > max_g { max_g = g; }
        if b < min_b { min_b = b; } if b > max_b { max_b = b; }
        sum_r += r as u32; sum_g += g as u32; sum_b += b as u32;
    }

    let avg_r = sum_r as f64 / pixel_count as f64;
    let avg_g = sum_g as f64 / pixel_count as f64;
    let avg_b = sum_b as f64 / pixel_count as f64;
    let avg_gray = (avg_r + avg_g + avg_b) / 3.0;
    let scale_r = avg_gray / avg_r.max(1.0);
    let scale_g = avg_gray / avg_g.max(1.0);
    let scale_b = avg_gray / avg_b.max(1.0);
    let range_r = (max_r as f64 - min_r as f64).max(1.0);
    let range_g = (max_g as f64 - min_g as f64).max(1.0);
    let range_b = (max_b as f64 - min_b as f64).max(1.0);
    let contrast = 1.1;

    for i in (0..rgba.len()).step_by(4) {
        let r = ((rgba[i] as f64 - min_r as f64) * 255.0 / range_r * scale_r - 128.0) * contrast + 128.0;
        let g = ((rgba[i+1] as f64 - min_g as f64) * 255.0 / range_g * scale_g - 128.0) * contrast + 128.0;
        let b = ((rgba[i+2] as f64 - min_b as f64) * 255.0 / range_b * scale_b - 128.0) * contrast + 128.0;
        rgba[i] = r.max(0.0).min(255.0) as u8;
        rgba[i+1] = g.max(0.0).min(255.0) as u8;
        rgba[i+2] = b.max(0.0).min(255.0) as u8;
    }
}

/// Extract dominant palette colors from RGBA pixels.
/// `sample_step`: skip pixels for speed (3 = every 3rd pixel).
/// Returns flat [r0,g,b, r1,g,b, ...] palette.
#[wasm_bindgen]
pub fn extract_palette(rgba: &[u8], num_colors: u8, sample_step: usize) -> Vec<u8> {
    let step = sample_step.max(1);
    let mut colors: Vec<(u32, u32, u32, u32)> = Vec::with_capacity(num_colors as usize * 4); // (r, g, b, count)

    for i in (0..rgba.len()).step_by(4 * step) {
        let r = rgba[i] as u32;
        let g = rgba[i+1] as u32;
        let b = rgba[i+2] as u32;
        let a = rgba[i+3] as u32;
        if a < 128 { continue; }

        let mut best = 0;
        let mut best_dist = u32::MAX;
        for (j, c) in colors.iter().enumerate() {
            let dr = c.0 as i32 - r as i32;
            let dg = c.1 as i32 - g as i32;
            let db = c.2 as i32 - b as i32;
            let dist = (dr*dr + dg*dg + db*db) as u32;
            if dist < best_dist {
                best_dist = dist;
                best = j;
            }
        }

        if best_dist < 1600 && !colors.is_empty() {
            let c = &mut colors[best];
            c.3 += 1;
            c.0 = (c.0 * 3 + r) / 4;
            c.1 = (c.1 * 3 + g) / 4;
            c.2 = (c.2 * 3 + b) / 4;
        } else if colors.len() < num_colors as usize * 4 {
            colors.push((r, g, b, 1));
        }
    }

    colors.sort_by(|a, b| b.3.cmp(&a.3));
    let mut out = Vec::with_capacity(num_colors as usize * 3);
    for c in colors.iter().take(num_colors as usize) {
        out.push(c.0.min(255) as u8);
        out.push(c.1.min(255) as u8);
        out.push(c.2.min(255) as u8);
    }
    out
}

/// Generate procedural grain texture.
#[wasm_bindgen]
pub fn generate_grain(width: u32, height: u32, noise: f64, scale: f64) -> Vec<u8> {
    let sw = (width as f64 / scale).ceil() as usize;
    let sh = (height as f64 / scale).ceil() as usize;
    let alpha = (noise * 2.55) as u8;
    let mut out = vec![0u8; sw * sh * 4];
    // Simple LCG pseudo-random for speed (no crypto needed for grain)
    let mut state: u64 = 12345;
    for i in (0..out.len()).step_by(4) {
        state = state.wrapping_mul(1103515245).wrapping_add(12345);
        let val = ((state >> 16) & 0xFF) as u8;
        out[i] = val;
        out[i+1] = val;
        out[i+2] = val;
        out[i+3] = alpha;
    }
    out
}
