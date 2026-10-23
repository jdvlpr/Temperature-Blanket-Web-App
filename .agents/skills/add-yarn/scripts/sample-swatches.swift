#!/usr/bin/env swift
// Sample a representative hex color from each colorway photo and write a
// contact sheet to review the results (macOS only: uses CoreGraphics).
//
// Usage:
//   swift sample-swatches.swift <manifest.json> <outDir> [--box x,y,w,h] [--source <url>] [--title <text>] [--yarn-dir <dir>] [--info <json>]
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
// --source / --title: the page the colorways came from and the yarn's name; the sheet shows
//   them at the top (a link to compare against) so a reviewer can check every colorway was taken.
// --yarn-dir: the yarn's folder, e.g. src/lib/data/yarns/premier/cotton-fair-worsted. The sheet then lists
//   what the app will show (brand and ID, yarn and ID, weight, colorway count, finder link), read from the
//   repo's files, so the sheet is the one place to review the yarn. Run it after the scaffold. It also shows
//   the yarn's changelog entry and version, and a "Check these" list (count mismatches, duplicate names,
//   near-identical hex values, multi-color names, near-white/black samples, weight vs Ravelry).
// --info: optional JSON notes to show on the sheet (request details, the brand page's fibre/yardage/needles,
//   the Ravelry weight, the brand page's colorway count, similar yarns). See the "info" comment below.
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
    "Usage: swift sample-swatches.swift <manifest.json> <outDir> [--box x,y,w,h] [--source <url>] [--title <text>] [--yarn-dir <dir>] [--info <json>]\n".data(using: .utf8)!)
  exit(1)
}
let manifestURL = URL(fileURLWithPath: args[0])
let outDir = URL(fileURLWithPath: args[1], isDirectory: true)
var box: [Double] = [0.125, 0.4125, 0.1875, 0.175]
if let i = args.firstIndex(of: "--box"), i + 1 < args.count {
  let parts = args[i + 1].split(separator: ",").compactMap { Double($0) }
  if parts.count == 4 { box = parts }
}
func option(_ flag: String) -> String? {
  if let i = args.firstIndex(of: flag), i + 1 < args.count { return args[i + 1] }
  return nil
}
let sourceHref = option("--source")
let sheetTitle = option("--title")
let yarnDir = option("--yarn-dir")

/// First capture group of `pattern` in `text` (or nil).
func firstMatch(_ pattern: String, in text: String) -> String? {
  guard let re = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators]),
    let m = re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
    m.numberOfRanges > 1, let r = Range(m.range(at: 1), in: text)
  else { return nil }
  return String(text[r])
}

/// What the yarn will be in the web app, read from the repo's own files so it is never typed by hand:
/// <yarn-dir>/yarn.ts (id, name, weightId), <yarn-dir>/../yarns.ts (brand name and id),
/// src/lib/constants/color-constants.ts (weight names) and <yarn-dir>/colorways.ts (count).
func yarnDetails(_ dir: String) -> [(String, String)] {
  let base = URL(fileURLWithPath: dir, isDirectory: true)
  func read(_ url: URL) -> String { (try? String(contentsOf: url, encoding: .utf8)) ?? "" }
  let yarnTs = read(base.appendingPathComponent("yarn.ts"))
  let brandTs = read(base.deletingLastPathComponent().appendingPathComponent("yarns.ts"))
  var root = base
  while root.path != "/" && !FileManager.default.fileExists(atPath: root.appendingPathComponent("src/lib/constants/color-constants.ts").path) {
    root = root.deletingLastPathComponent()
  }
  let constants = read(root.appendingPathComponent("src/lib/constants/color-constants.ts"))
  let colorwaysTs = read(base.appendingPathComponent("colorways.ts"))

  let missing = "⚠ not found"
  let yarnName = firstMatch("name:\\s*'([^']*)'", in: yarnTs)
  let yarnId = firstMatch("\\bid:\\s*'([^']*)'", in: yarnTs)
  let weightId = firstMatch("weightId:\\s*'([^']*)'", in: yarnTs)
  let weightName = weightId.flatMap { firstMatch("\\{\\s*name:\\s*'([^']*)',\\s*id:\\s*'\($0)'\\s*\\}", in: constants) }
  let brandBlock = firstMatch("Brand\\s*=\\s*\\{(.*?)yarns:", in: brandTs) ?? ""
  let brandName = firstMatch("name:\\s*'([^']*)'", in: brandBlock)
  let brandId = firstMatch("\\bid:\\s*'([^']*)'", in: brandBlock)
  let inRepo = colorwaysTs.components(separatedBy: "hex:").count - 1
  var finder = missing
  if let b = brandId, let y = yarnId { finder = "/yarn-colorway-finder?f=\(b)-\(y)" }

  return [
    ("Brand", brandName ?? missing),
    ("Brand ID", brandId ?? missing),
    ("Yarn", yarnName ?? missing),
    ("Yarn ID", yarnId ?? missing),
    ("Weight", weightName.map { "\($0) (\(weightId ?? ""))" } ?? (weightId.map { "\($0) ⚠ not in the weight list" } ?? "none set")),
    ("Colorways in repo", "\(inRepo)"),
    ("Finder link", finder),
  ]
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
        <div class="big" style="background:\(hex);color:\(isDark(hex) ? "#fff" : "#000")">\(hex)</div>
        \(current)
      </figcaption>
    </figure>

    """
}

let json = try JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted])
try json.write(to: outDir.appendingPathComponent("colors.json"))

func rgbOf(_ h: String) -> [Int] {
  let s = h.dropFirst()
  return stride(from: 0, to: 6, by: 2).map {
    Int(s[s.index(s.startIndex, offsetBy: $0)..<s.index(s.startIndex, offsetBy: $0 + 2)], radix: 16) ?? 0
  }
}
func isDark(_ h: String) -> Bool {
  let c = rgbOf(h)
  return 0.299 * Double(c[0]) + 0.587 * Double(c[1]) + 0.114 * Double(c[2]) < 140
}
func table(_ title: String, _ rows: [(String, String)], html: Bool = false) -> String {
  guard !rows.isEmpty else { return "" }
  let body = rows.map { "<tr><th>\(esc($0.0))</th><td>\(html ? $0.1 : esc($0.1))</td></tr>" }.joined()
  return "<h2>\(esc(title))</h2><table class=\"details\">\(body)</table>"
}
func link(_ url: String) -> String {
  "<a href=\"\(esc(url))\" target=\"_blank\" rel=\"noopener\">\(esc(url))</a>"
}

// Optional notes file: --info <json>, written by whoever processes the request. Every key is optional:
// { "request": {"from","received","brandAsTyped","yarnAsTyped","link","comments","note"},
//   "specs": {"Fibre":"…","Ball":"…","Needles":"…","Gauge":"…","Source":"…"},
//   "ravelry": {"url","weight","details"}, "siteColorCount": 91, "similar": ["…"] }
var info: [String: Any] = [:]
if let p = option("--info"), let d = try? Data(contentsOf: URL(fileURLWithPath: p)),
  let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any]
{
  info = j
}
func strings(_ key: String) -> [(String, String)] {
  // keys may start with a number ("1 Fibre") to set the row order; the number is not shown
  (info[key] as? [String: Any] ?? [:]).sorted { $0.key < $1.key }.map {
    ($0.key.replacingOccurrences(of: "^[0-9]+\\s+", with: "", options: .regularExpression), "\($0.value)")
  }
}

var detailsHtml = ""
var flags: [String] = []
if let dir = yarnDir {
  let details = yarnDetails(dir)
  func detail(_ k: String) -> String { details.first { $0.0 == k }?.1 ?? "" }
  var appRows = details
  let ravelry = info["ravelry"] as? [String: Any] ?? [:]
  let appWeight = detail("Weight")
  if let rw = ravelry["weight"] as? String {
    appRows.append(("Ravelry weight", rw + (appWeight.lowercased().hasPrefix(rw.lowercased()) ? " ✓ matches the app" : " ⚠ differs from the app's \(appWeight)")))
    if !appWeight.lowercased().hasPrefix(rw.lowercased()) { flags.append("Weight: the app has \(appWeight), Ravelry says \(rw).") }
  }
  if let d = ravelry["details"] as? String { appRows.append(("Ravelry details", d)) }
  var out = table("Yarn in the app", appRows)
  if let u = ravelry["url"] as? String { out += "<p>Ravelry: \(link(u))</p>" }

  // Changelog entry the app will show for this yarn
  var root = URL(fileURLWithPath: dir, isDirectory: true)
  while root.path != "/" && !FileManager.default.fileExists(atPath: root.appendingPathComponent("src/routes/changelog/changelog.ts").path) {
    root = root.deletingLastPathComponent()
  }
  let changelog = (try? String(contentsOf: root.appendingPathComponent("src/routes/changelog/changelog.ts"), encoding: .utf8)) ?? ""
  let key = "\(detail("Brand ID"))-\(detail("Yarn ID"))"
  let pattern = "text:\\s*`([^`]*)`,\\s*title:\\s*'([^']*f=\(NSRegularExpression.escapedPattern(for: key))&v=([0-9.]+)[^']*)'"
  if let re = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators]),
    let m = re.firstMatch(in: changelog, range: NSRange(changelog.startIndex..., in: changelog)),
    let t = Range(m.range(at: 1), in: changelog), let ti = Range(m.range(at: 2), in: changelog), let v = Range(m.range(at: 3), in: changelog)
  {
    let plainTitle = changelog[ti].replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
    out += table("Changelog", [("Version", String(changelog[v])), ("Entry", "\(plainTitle) — \(changelog[t])")])
  } else {
    flags.append("No changelog entry found for \(key).")
  }

  // Request and product-page details
  out += table("Request", strings("request"))
  out += table("Brand page", strings("specs"))

  // Automatic checks
  if let repoCount = Int(detail("Colorways in repo")), repoCount != results.count {
    flags.append("\(repoCount) colorways in the repo, \(results.count) sampled on this sheet (run write-colorways.js).")
  }
  if let site = info["siteColorCount"] as? Int, site != results.count {
    flags.append("The brand's page lists \(site) colorways, this sheet has \(results.count).")
  }
  let names = results.map { ($0["name"] ?? "").replacingOccurrences(of: "^[0-9-]+\\s+", with: "", options: .regularExpression).lowercased() }
  let nums = results.map { ($0["name"] ?? "").split(separator: " ").first.map(String.init) ?? "" }
  var seen: [String: [String]] = [:]
  for (i, n) in names.enumerated() { seen[n, default: []].append(nums[i]) }
  for (n, ids) in seen.sorted(by: { $0.key < $1.key }) where ids.count > 1 {
    flags.append("Same name on shades \(ids.joined(separator: ", ")): “\(n)”.")
  }
  var near: [String] = []
  for i in 0..<results.count { for j in (i + 1)..<max(i + 1, results.count) {
    if distance(results[i]["hex"] ?? "#000000", results[j]["hex"] ?? "#000000") <= 3 { near.append("\(nums[i]) & \(nums[j])") }
  } }
  if !near.isEmpty { flags.append("Nearly identical hex (each channel within 3): \(near.joined(separator: "; ")).") }
  let multi = results.enumerated().filter { ($0.element["name"] ?? "").contains("/") }.map { nums[$0.offset] }
  if !multi.isEmpty { flags.append("\(multi.count) multi-color names (print/variegated), one averaged hex each: \(multi.joined(separator: ", ")).") }
  let extremes = results.enumerated().filter {
    let c = rgbOf($0.element["hex"] ?? "#808080")
    return c.allSatisfy { $0 >= 0xe0 } || c.allSatisfy { $0 <= 0x20 }
  }.map { nums[$0.offset] }
  if !extremes.isEmpty { flags.append("Near-white or near-black, so the photo's lighting matters most: \(extremes.joined(separator: ", ")).") }
  if let sim = info["similar"] as? [String], !sim.isEmpty { flags.append("Similar yarn already in the catalog: \(sim.joined(separator: ", ")) (confirm it is a different yarn).") }
  if flags.isEmpty { flags.append("None found.") }
  out += "<h2>Check these</h2><ul class=\"flags\">\(flags.map { "<li>\(esc($0))</li>" }.joined())</ul>"
  detailsHtml = out
}

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
    h2{font-size:15px;margin:14px 0 4px}
    .big{margin-top:6px;padding:10px 8px;border:1px solid #0003;border-radius:4px;font:600 15px ui-monospace,monospace;text-align:center}
    .flags{margin:4px 0 12px;padding-left:20px}.flags li{margin:2px 0}
    .details{border-collapse:collapse;background:#fff;margin:4px 0 8px}
    .details th,.details td{border:1px solid #ddd;padding:4px 10px;text-align:left}
    .details th{background:#f3f3f3;font-weight:600}
    .sw{width:34px;height:20px;border:1px solid #0003;border-radius:3px;flex:none}
  </style>
  <h1>\(esc(sheetTitle ?? "Colorway contact sheet"))</h1>
  \(sourceHref.map { "<p>\(results.count) colorways sampled. Source: <a href=\"\(esc($0))\" target=\"_blank\" rel=\"noopener\">\(esc($0))</a> (compare the colors there with this sheet).</p>" } ?? "")
  \(detailsHtml)
  <p>Magenta box = sampled area. Check that the swatch looks like the yarn, that the box stays on yarn (not label, edge or background), and note the numbers that look off.</p>
  <div class="grid">
  \(cards)</div>
  """
try html.write(to: outDir.appendingPathComponent("contact-sheet.html"), atomically: true, encoding: .utf8)
print("✓ Sampled \(results.count)/\(entries.count) colors → \(outDir.path)/colors.json and contact-sheet.html")
