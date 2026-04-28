import ExpoModulesCore
import WidgetKit

private let appGroup  = "group.com.lemoto.app"
private let widgetKey = "lemoto_widget_json"

public class WidgetKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LemotoWidgetKit")

    // Write JSON string to shared UserDefaults then tell WidgetKit to reload immediately.
    AsyncFunction("writeWidgetData") { (json: String) -> Void in
      if let defaults = UserDefaults(suiteName: appGroup) {
        defaults.set(json, forKey: widgetKey)
        defaults.synchronize()
      }
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
