import AuthenticationServices
import SafariServices
import UIKit

@MainActor
enum BrowserPresenter {
  enum BrowserError: Error {
    case noWindow
    case badUrl
  }

  private static var authSession: ASWebAuthenticationSession?
  private static let contextProvider = ContextProvider()

  static func presentSafari(_ urlString: String) throws {
    guard let url = URL(string: urlString) else { throw BrowserError.badUrl }
    let safari = SFSafariViewController(url: url)
    safari.dismissButtonStyle = .close
    // Matches expo-web-browser's default: a full-screen (non-over) modal takes
    // the article view out of the window, and the body WKWebView re-applies
    // its top safe-area inset on return, leaving a blank band above the text.
    safari.modalPresentationStyle = .overFullScreen
    try topPresenter().present(safari, animated: true)
  }

  static func authSession(_ urlString: String, scheme: String) async throws -> [String: Any] {
    guard let url = URL(string: urlString) else { throw BrowserError.badUrl }
    authSession?.cancel()
    return try await withCheckedThrowingContinuation { continuation in
      let session = ASWebAuthenticationSession(url: url, callback: .customScheme(scheme)) { callback, error in
        authSession = nil
        if let callback {
          continuation.resume(returning: ["type": "success", "url": callback.absoluteString])
        } else if let error = error as? ASWebAuthenticationSessionError, error.code == .canceledLogin {
          continuation.resume(returning: ["type": "cancel"])
        } else {
          continuation.resume(throwing: error ?? BrowserError.noWindow)
        }
      }
      session.presentationContextProvider = contextProvider
      authSession = session
      session.start()
    }
  }

  static func dismissAuthSession() {
    authSession?.cancel()
    authSession = nil
  }

  static func keyWindow() throws -> UIWindow {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    guard let window = scene?.keyWindow ?? scene?.windows.first else { throw BrowserError.noWindow }
    return window
  }

  private static func topPresenter() throws -> UIViewController {
    guard var top = try keyWindow().rootViewController else { throw BrowserError.noWindow }
    while let presented = top.presentedViewController, !presented.isBeingDismissed {
      top = presented
    }
    return top
  }

  private final class ContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
      (try? BrowserPresenter.keyWindow()) ?? ASPresentationAnchor()
    }
  }
}
