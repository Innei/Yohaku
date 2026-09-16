# Note Hero native regression tests

The Hero tests compile the production coordinator directly and exercise abandoned
transition preparation, destination coordinate conversion, completed pop, and
cancelled pop. The separate native binding suite links the installed React Native
framework and uses real `RCTScrollViewComponentView` instances to verify
synchronous scroll callbacks, delegate coexistence, initial insets, detach/rebind,
and inset callback routing. Install the app's CocoaPods dependencies first.

The transition coordinator is controlled by a fixture; these tests do not replace
visual verification of real gestures.

Generate the ignored Xcode project with XcodeGen, then run the signed simulator
tests (replace the destination with an available simulator):

```sh
xcodegen generate --spec tests/note-hero-native/project.yml
xcodebuild \
  -project tests/note-hero-native/NoteHeroRegression.xcodeproj \
  -scheme NoteHeroRegression \
  -destination 'platform=iOS Simulator,name=iPhone 18 Pro' \
  test
```

Run from `apps/mobile`. Do not disable code signing.
