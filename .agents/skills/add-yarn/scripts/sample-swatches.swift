#!/usr/bin/env swift
// Sample a representative hex color from each colorway photo and write a
// contact sheet to review the results (macOS only: uses CoreGraphics).
//
// Usage:
//   swift sample-swatches.swift <manifest.json> <outDir> [--box x,y,w,h]
//
// manifest.json: [{ "name": "White", "image": "img/01.jpg", "variant_href": "...", "hex": "#eeeef0" }, ...]
//   - image: path relative to the manifest (the photo to sample)
//   - variant_href: optional, passed through to colors.json
//   - hex: optional "current" value, shown next to the sampled one for comparison
//
// --box: sampling rectangle as fractions (0-1) of the image: x,y,w,h.
//   Default 0.125,0.4125,0.1875,0.175 — the left side of a ball of yarn photographed
//   head-on with the label in the middle. Pick the box by LOOKING at a photo first;
//   the contact sheet draws the box on every photo so you can confirm it.
//
// Method: in the box, sort pixels by luminance and average the middle of the range
// (drop the darkest 20%, which are gaps between strands and shadow, and the
// brightest 5%, which are specular highlights). Light shades still reflect the lighting
// in the photo, so treat near-white results as approximate.
//
// Outputs: <outDir>/colors.json (name, hex, variant_href) and <outDir>/contact-sheet.html

import CoreGraphics
import Foundation
import ImageIO

let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 2 else {
  FileHandle.standardError.write(
    "Usage: swift sample-swatches.swift <manifest.json> <outDir> [--box x,y,w,h]\n".data(using: .utf8)!)
  exit(1)
}
let manifestURL = URL(fileURLWithPath: args[0])
let outDir = URL(fileURLWithPath: args[1], isDirectory: true)
var box: [Double] = [0.125, 0.4125, 0.1875, 0.175]
if let i = args.firstIndex(of: "--box"), i + 1 < args.count {
  let parts = args[i + 1].split(separator: ",").compactMap { Double($0) }
  if parts.count == 4 { box = parts }
}

struct Entry {
  let name: String
  let image: URL
  let variantHref: String?
  let currentHex: String?
}

let manifest = try JSONSerialization.jsonObject(with: Data(contentsOf: manifestURL)) as! [[String: Any]]
let baseDir = manifestURL.deletingLastPathComponent()
let entries: [Entry] = manifest.map {
  Entry(
    name: $0["name"] as! String,
    image: URL(fileURLWithPath: $0["image"] as! String, relativeTo: baseDir).standardizedFileURL,
    variantHref: $0["variant_href"] as? String,
    currentHex: $0["hex"] as? String)
}

func sampleHex(_ url: URL) -> String? {
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { return nil }
  let w = img.width, h = img.height
  var data = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(
    data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  let x0 = Int(box[0] * Double(w)), y0 = Int(box[1] * Double(h))
  let x1 = min(w, x0 + Int(box[2] * Double(w))), y1 = min(h, y0 + Int(box[3] * Double(h)))
  var px: [(lum: Int, r: Int, g: Int, b: Int)] = []
  for y in y0..<y1 {
    for x in x0..<x1 {
      let o = (y * w + x) * 4
      let r = Int(data[o]), g = Int(data[o + 1]), b = Int(data[o + 2])
      px.append((r * 299 + g * 587 + b * 114, r, g, b))
    }
  }
  guard !px.isEmpty else { return nil }
  px.sort { $0.lum < $1.lum }
  let kept = px[(px.count * 20 / 100)..<max(px.count * 20 / 100 + 1, px.count * 95 / 100)]
  let n = kept.count
  let r = kept.reduce(0) { $0 + $1.r } / n
  let g = kept.reduce(0) { $0 + $1.g } / n
  let b = kept.reduce(0) { $0 + $1.b } / n
  return String(format: "#%02x%02x%02x", r, g, b)
}

func distance(_ a: String, _ b: String) -> Int {
  func rgb(_ h: String) -> [Int] {
    let s = h.dropFirst()
    return stride(from: 0, to: 6, by: 2).map {
      Int(s[s.index(s.startIndex, offsetBy: $0)..<s.index(s.startIndex, offsetBy: $0 + 2)], radix: 16) ?? 0
    }
  }
  let x = rgb(a), y = rgb(b)
  return zip(x, y).map { abs($0 - $1) }.max() ?? 0
}

// Path of `file` relative to `dir`, so the sheet works when opened from disk or served over http
func relativePath(of file: URL, from dir: URL) -> String {
  let f = file.standardizedFileURL.pathComponents
  let d = dir.standardizedFileURL.pathComponents
  var i = 0
  while i < f.count && i < d.count && f[i] == d[i] { i += 1 }
  let ups = Array(repeating: "..", count: d.count - i)
  return (ups + f[i...]).joined(separator: "/")
}

func esc(_ s: String) -> String {
  s.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
    .replacingOccurrences(of: "\"", with: "&quot;")
}

try FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)

var results: [[String: String]] = []
var cards = ""
for (i, e) in entries.enumerated() {
  guard let hex = sampleHex(e.image) else {
    print("⚠ \(i + 1) \(e.name): could not sample \(e.image.path)")
    continue
  }
  var r = ["name": e.name, "hex": hex]
  if let v = e.variantHref { r["variant_href"] = v }
  results.append(r)

  var current = ""
  if let c = e.currentHex {
    let d = distance(hex, c)
    current = """
      <div class="row"><span class="sw" style="background:\(c)"></span><span>current \(c)\(d > 12 ? " ⚠ differs by \(d)" : "")</span></div>
      """
  }
  cards += """
    <figure>
      <div class="photo">
        <div class="inner">
          <img src="\(esc(relativePath(of: e.image, from: outDir)))" alt="">
          <div class="box" style="left:\(box[0] * 100)%;top:\(box[1] * 100)%;width:\(box[2] * 100)%;height:\(box[3] * 100)%"></div>
        </div>
      </div>
      <figcaption>
        <strong>\(i + 1). \(esc(e.name))</strong>
        <div class="row"><span class="sw" style="background:\(hex)"></span><span>sampled \(hex)</span></div>
        \(current)
      </figcaption>
    </figure>

    """
}

let json = try JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted])
try json.write(to: outDir.appendingPathComponent("colors.json"))

let html = """
  <!doctype html><meta charset="utf-8"><title>Colorway contact sheet</title>
  <style>
    body{font:14px system-ui;margin:16px;background:#fafafa;color:#222}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
    figure{margin:0;background:#fff;border:1px solid #ddd;border-radius:8px;overflow:hidden}
    /* always show the whole photo, so the sampling box is fully visible wherever it sits */
    .photo{position:relative}
    .inner{position:relative;width:100%}.inner img{display:block;width:100%}
    .box{position:absolute;border:2px solid #f0f;box-sizing:border-box}
    figcaption{padding:8px}.row{display:flex;gap:8px;align-items:center;margin-top:4px}
    .sw{width:34px;height:20px;border:1px solid #0003;border-radius:3px;flex:none}
  </style>
  <h1>Colorway contact sheet</h1>
  <p>Magenta box = sampled area. Check that the swatch looks like the yarn, that the box stays on yarn (not label, edge or background), and note the numbers that look off.</p>
  <div class="grid">
  \(cards)</div>
  """
try html.write(to: outDir.appendingPathComponent("contact-sheet.html"), atomically: true, encoding: .utf8)
print("✓ Sampled \(results.count)/\(entries.count) colors → \(outDir.path)/colors.json and contact-sheet.html")
