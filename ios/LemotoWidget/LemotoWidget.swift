import WidgetKit
import SwiftUI

// MARK: - Data model

struct BestWindow: Codable, Equatable {
    let start: String
    let end: String
}

struct WidgetData: Codable, Equatable {
    let status: String
    let summary: String
    let bestWindow: BestWindow?
    let nextRideDate: String?
    let nextRideTime: String?
    let nextRideLabel: String?
    let advisory: String?
    let updatedAt: String
}

// MARK: - Timeline

struct LemotoEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct LemotoProvider: TimelineProvider {
    func placeholder(in context: Context) -> LemotoEntry {
        LemotoEntry(date: .now, data: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (LemotoEntry) -> Void) {
        completion(LemotoEntry(date: .now, data: load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<LemotoEntry>) -> Void) {
        let entry = LemotoEntry(date: .now, data: load())
        let next  = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
    private func load() -> WidgetData? {
        guard
            let defaults = UserDefaults(suiteName: "group.com.lemoto.app"),
            let json     = defaults.string(forKey: "lemoto_widget_json"),
            let bytes    = json.data(using: .utf8),
            let decoded  = try? JSONDecoder().decode(WidgetData.self, from: bytes)
        else { return nil }
        return decoded
    }
}

// MARK: - Design tokens  (mirrors theme/colors.ts + typography.ts)

private let cLime    = Color(red: 0.702, green: 0.969, blue: 0.165) // #B3F72A
private let cPrimary = Color(red: 0.282, green: 0.408, blue: 0.000) // #486800
private let cOrange  = Color(red: 1.000, green: 0.722, blue: 0.000) // #FFB800
private let cRed     = Color(red: 0.851, green: 0.251, blue: 0.251) // #D94040
private let cOutline = Color(red: 0.447, green: 0.478, blue: 0.384) // #727A62

// Spring that matches the app hero (damping: 18, stiffness: 160, mass: 0.7)
private let heroSpring = Animation.spring(response: 0.45, dampingFraction: 0.8)

private func statusAccent(_ s: String?) -> Color {
    switch s {
    case "green":  return cLime
    case "orange": return cOrange
    case "red":    return cRed
    default:       return cOutline
    }
}

// Lime in dark mode, primary dark green in light mode (lime on white has poor contrast)
private func statusText(_ s: String?, scheme: ColorScheme) -> Color {
    switch s {
    case "green":  return scheme == .dark ? cLime : cPrimary
    case "orange": return cOrange
    case "red":    return cRed
    default:       return cOutline
    }
}

// Mirrors STATUS_HEADLINE in index.tsx
private func headline(_ s: String?) -> String {
    switch s {
    case "green":  return "ALL CLEAR."
    case "orange": return "CAUTION."
    case "red":    return "STAY HOME."
    default:       return "NO DATA."
    }
}

private func formatDate(_ iso: String?) -> String? {
    guard let iso else { return nil }
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"
    guard let d = f.date(from: iso) else { return nil }
    if Calendar.current.isDateInToday(d)    { return "TODAY" }
    if Calendar.current.isDateInTomorrow(d) { return "TOMORROW" }
    f.dateFormat = "EEE d"
    return f.string(from: d).uppercased()
}

// MARK: - Reusable sub-views

/// Small muted uppercase label — mirrors section headers in the app.
private struct CapLabel: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 7, weight: .bold))
            .tracking(1.8)
            .foregroundStyle(cOutline)
    }
}

// MARK: - Small widget

struct SmallView: View {
    let data: WidgetData?
    @Environment(\.colorScheme) var scheme
    @Environment(\.isLuminanceReduced) var isLuminanceReduced

    var status: String { data?.status ?? "none" }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // ── Header ──────────────────────────────
            HStack(alignment: .center, spacing: 5) {
                Circle()
                    .fill(statusAccent(data?.status))
                    .frame(width: 6, height: 6)
                    // Scale in when the dot colour changes
                    .scaleEffect(data != nil ? 1 : 0.4)
                    .opacity(data != nil ? 1 : 0)
                CapLabel(text: "LEMOTO")
            }

            Spacer(minLength: 0)

            // ── Status headline — slides up from below on entry change ──
            Text(headline(data?.status))
                .font(.system(size: 24, weight: .heavy))
                .tracking(-0.5)
                .foregroundStyle(statusText(data?.status, scheme: scheme))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                // Tag with status so SwiftUI animates when it changes
                .id("h-\(status)")
                .transition(isLuminanceReduced ? .opacity :
                    .asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal:   .opacity
                    )
                )

            // ── Summary — fades in beneath the headline ─────────────────
            Text((data?.summary ?? "Open app to sync").uppercased())
                .font(.system(size: 9, weight: .semibold))
                .tracking(0.4)
                .foregroundStyle(cOutline)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 3)
                .id("s-\(data?.summary ?? "")")
                .transition(.opacity)

            Spacer(minLength: 10)

            // ── Footer — best window or next ride ───────────────────────
            Group {
                if let w = data?.bestWindow {
                    HStack(spacing: 4) {
                        Image(systemName: "sun.max")
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundStyle(statusText(data?.status, scheme: scheme))
                        Text("\(w.start)–\(w.end)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(statusText(data?.status, scheme: scheme))
                    }
                } else if let time = data?.nextRideTime,
                          let dateStr = formatDate(data?.nextRideDate) {
                    Text("\(dateStr)  ·  \(time)")
                        .font(.system(size: 9, weight: .semibold))
                        .tracking(0.3)
                        .foregroundStyle(cOutline)
                }
            }
            .id("f-\(data?.bestWindow?.start ?? data?.nextRideTime ?? "none")")
            .transition(.opacity)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        // Apply the hero spring to all transitions in this subtree
        .animation(isLuminanceReduced ? .none : heroSpring, value: data)
    }
}

// MARK: - Medium widget

struct MediumView: View {
    let data: WidgetData?
    @Environment(\.colorScheme) var scheme
    @Environment(\.isLuminanceReduced) var isLuminanceReduced

    var status: String { data?.status ?? "none" }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {

            // ── Left: verdict ───────────────────────
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 5) {
                    Circle()
                        .fill(statusAccent(data?.status))
                        .frame(width: 6, height: 6)
                        .scaleEffect(data != nil ? 1 : 0.4)
                        .opacity(data != nil ? 1 : 0)
                    CapLabel(text: "LEMOTO")
                }

                Spacer(minLength: 0)

                Text(headline(data?.status))
                    .font(.system(size: 22, weight: .heavy))
                    .tracking(-0.5)
                    .foregroundStyle(statusText(data?.status, scheme: scheme))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .id("h-\(status)")
                    .transition(isLuminanceReduced ? .opacity :
                        .asymmetric(
                            insertion: .move(edge: .bottom).combined(with: .opacity),
                            removal:   .opacity
                        )
                    )

                Text((data?.summary ?? "Open app to sync").uppercased())
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(0.4)
                    .foregroundStyle(cOutline)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)
                    .id("s-\(data?.summary ?? "")")
                    .transition(.opacity)

                Spacer(minLength: 10)

                if let time = data?.nextRideTime,
                   let dateStr = formatDate(data?.nextRideDate) {
                    Text("\(dateStr)  ·  \(time)")
                        .font(.system(size: 9, weight: .semibold))
                        .tracking(0.3)
                        .foregroundStyle(cOutline)
                        .transition(.opacity)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            // ── Divider ─────────────────────────────
            Rectangle()
                .fill(cOutline.opacity(0.18))
                .frame(width: 1)
                .padding(.vertical, 2)
                .padding(.horizontal, 14)

            // ── Right: best window + advisory ───────
            VStack(alignment: .leading, spacing: 0) {
                CapLabel(text: "BEST WINDOW")
                    .padding(.bottom, 4)

                Group {
                    if let w = data?.bestWindow {
                        Text("\(w.start) – \(w.end)")
                            .font(.system(size: 18, weight: .heavy))
                            .tracking(-0.3)
                            .foregroundStyle(statusText(data?.status, scheme: scheme))
                    } else {
                        Text("—")
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(cOutline.opacity(0.4))
                    }
                }
                .id("w-\(data?.bestWindow?.start ?? "none")")
                .transition(isLuminanceReduced ? .opacity :
                    .asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal:   .opacity
                    )
                )

                if let advisory = data?.advisory {
                    Rectangle()
                        .fill(cOutline.opacity(0.18))
                        .frame(height: 1)
                        .padding(.vertical, 10)

                    CapLabel(text: "ADVISORY")
                        .padding(.bottom, 3)

                    Text(advisory)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(cOrange)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .transition(.opacity)
                }

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .animation(isLuminanceReduced ? .none : heroSpring, value: data)
    }
}

// MARK: - Entry view

struct LemotoWidgetEntryView: View {
    var entry: LemotoEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium: MediumView(data: entry.data)
        default:            SmallView(data: entry.data)
        }
    }
}

// MARK: - Widget declaration

@main
struct LemotoWidget: Widget {
    let kind = "LemotoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LemotoProvider()) { entry in
            LemotoWidgetEntryView(entry: entry)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Lemoto")
        .description("Ride conditions at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
