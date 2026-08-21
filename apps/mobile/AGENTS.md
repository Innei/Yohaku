# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# iOS only, permanently

Android is never going to be developed. Do not write Android code, do not keep
Android sources or prebuilt artifacts alive in vendored dependencies, and do not
weigh Android portability when choosing between designs — drop that side outright
rather than carrying it "for later".

# Never disable code signing

Never pass `CODE_SIGNING_ALLOWED=NO` to xcodebuild, expo, Fastlane, or any iOS
build — including Simulator Debug. That flag strips entitlements
(`application-identifier`, `keychain-access-groups`). The `.app` still launches;
SecureStore then throws and public sync comes back empty.

Keep the settings from `plugins/with-ios-keychain-signing.cjs`:
`ENTITLEMENTS_REQUIRED=YES`, `CODE_SIGN_INJECT_BASE_ENTITLEMENTS=YES`,
`ENABLE_DEBUG_DYLIB=NO`. If signing fails, fix signing. Do not turn it off.
