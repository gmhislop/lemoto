import WidgetKit
import SwiftUI

// MARK: - Data model (mirrors JS WidgetData)

struct BestWindow: Codable {
    let start: String
    let end: String
}

struct WidgetData: Codable {
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
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func load() -> WidgetData? {
        guard
            let defaults = UserDefaults(suiteName: "group.com.lemoto.app"),
            let raw = defaults.object(forKey: "lemoto_widget"),
            let jsonData = try? JSONSerialization.data(withJSONObject: raw),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: jsonData)
        else { return nil }
        return decoded
    }
}

// MARK: - Helpers

private func statusDot(_ status: String?) -> String {
    switch status {
    case "green":  return "🟢"
    case "orange": return "🟠"
    case "red":    return "🔴"
    default:       return "⚪"
    }
}

private func formatDate(_ iso: String?) -> String? {
    guard let iso else { return nil }
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    guard let d = f.date(from: iso) else { return nil }
    if Calendar.current.isDateInToday(d) { return "Today" }
    if Calendar.current.isDateInTomorrow(d) { return "Tomorrow" }
    f.dateFormat = "EEE d MMM"
    return f.string(from: d)
}

// MARK: - Small widget

struct SmallView: View {
    let data: WidgetData?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("LEMOTO")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(.secondary)
                .padding(.bottom, 6)

            Text(statusDot(data?.status))
                .font(.system(size: 26))
                .padding(.bottom, 4)

            Text(data?.summary ?? "No rides yet")
                .font(.system(size: 13, weight: .semibold))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 4)

            if let w = data?.bestWindow {
                Text("\(w.start)–\(w.end)")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            } else if let time = data?.nextRideTime, let dateStr = formatDate(data?.nextRideDate) {
                Text("\(dateStr) · \(time)")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Medium widget

struct MediumView: View {
    let data: WidgetData?

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            // Left — overall verdict
            VStack(alignment: .leading, spacing: 4) {
                Text("LEMOTO")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.secondary)

                Text(statusDot(data?.status))
                    .font(.system(size: 32))
                    .padding(.top, 4)

                Text(data?.summary ?? "No rides yet")
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(3)

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Right — detail
            VStack(alignment: .leading, spacing: 6) {
                if let w = data?.bestWindow {
                    Label {
                        Text("Best window")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    } icon: {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                    Text("\(w.start)–\(w.end)")
                        .font(.system(size: 13, weight: .semibold))
                }

                if let advisory = data?.advisory {
                    Divider().padding(.vertical, 2)
                    HStack(alignment: .top, spacing: 4) {
                        Text("⚠️")
                            .font(.system(size: 11))
                        Text(advisory)
                            .font(.system(size: 11))
                            .foregroundColor(.orange)
                            .lineLimit(3)
                    }
                }

                Spacer(minLength: 0)

                if let time = data?.nextRideTime, let dateStr = formatDate(data?.nextRideDate) {
                    Text("\(dateStr) · \(time)")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Widget entry view (routes to correct size)

struct LemotoWidgetEntryView: View {
    var entry: LemotoEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            MediumView(data: entry.data)
        default:
            SmallView(data: entry.data)
        }
    }
}

// MARK: - Background modifier (containerBackground is iOS 17+)

private struct WidgetBackgroundModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(.background, for: .widget)
        } else {
            content.background(Color(.systemBackground))
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
                .modifier(WidgetBackgroundModifier())
        }
        .configurationDisplayName("Lemoto")
        .description("Ride conditions at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
