#import <XCTest/XCTest.h>
#import <React/RCTScrollViewComponentView.h>
#import "YohakuScrollDelegateBinding.h"

@interface ScrollWitness : NSObject <UIScrollViewDelegate>
@property(nonatomic) NSUInteger calls;
@end
@implementation ScrollWitness
- (void)scrollViewDidScroll:(UIScrollView *)scrollView { self.calls += 1; }
@end

@interface NativeScrollBindingTests : XCTestCase
@end

@implementation NativeScrollBindingTests
- (RCTScrollViewComponentView *)makeComponent
{
  RCTScrollViewComponentView *component =
      [[RCTScrollViewComponentView alloc] initWithFrame:CGRectMake(0, 0, 402, 874)];
  component.scrollView.contentSize = CGSizeMake(402, 2400);
  return component;
}

- (void)testNativeScrollCallbackIsSynchronousAndPreservesExistingDelegate
{
  RCTScrollViewComponentView *component = [self makeComponent];
  UIView *marker = [UIView new];
  [component.containerView addSubview:marker];
  ScrollWitness *existing = [ScrollWitness new];
  [component.scrollViewDelegateSplitter addDelegate:existing];
  YohakuScrollDelegateBinding *binding = [YohakuScrollDelegateBinding new];
  __block NSUInteger calls = 0;
  __block CGFloat observedY = 0;
  binding.onScroll = ^(UIScrollView *scroll) {
    XCTAssertTrue(NSThread.isMainThread);
    observedY = scroll.contentOffset.y;
    calls += 1;
  };
  XCTAssertEqual([binding bindToDescendant:marker], component.scrollView);
  component.scrollView.contentOffset = CGPointMake(0, 120);
  XCTAssertEqual(observedY, 120);
  XCTAssertGreaterThan(calls, 0u);
  XCTAssertGreaterThan(existing.calls, 0u);
  [binding invalidate];
  NSUInteger previous = calls;
  NSUInteger previousExisting = existing.calls;
  component.scrollView.contentOffset = CGPointMake(0, 240);
  XCTAssertEqual(calls, previous);
  XCTAssertGreaterThan(existing.calls, previousExisting);
}

- (void)testBindAfterMountUsesActualScrollAndInitialInset
{
  UIView *marker = [UIView new];
  YohakuScrollDelegateBinding *binding = [YohakuScrollDelegateBinding new];
  XCTAssertNil([binding bindToDescendant:marker]);
  RCTScrollViewComponentView *component = [self makeComponent];
  component.scrollView.contentInset = UIEdgeInsetsMake(116, 0, 0, 0);
  component.scrollView.contentOffset = CGPointMake(0, -116);
  [component.containerView addSubview:marker];
  UIScrollView *scroll = [binding bindToDescendant:marker];
  XCTAssertEqual(scroll, component.scrollView);
  XCTAssertEqual(scroll.contentOffset.y, -116);
  XCTAssertEqual(scroll.adjustedContentInset.top, 116);
  [binding invalidate];
}

- (void)testRebindRemovesListenerFromOldScrollAndDoesNotDuplicateCallbacks
{
  RCTScrollViewComponentView *first = [self makeComponent];
  RCTScrollViewComponentView *second = [self makeComponent];
  UIView *marker = [UIView new];
  [first.containerView addSubview:marker];
  YohakuScrollDelegateBinding *binding = [YohakuScrollDelegateBinding new];
  __block NSUInteger calls = 0;
  binding.onScroll = ^(UIScrollView *scroll) { calls += 1; };
  [binding bindToDescendant:marker];
  [second.containerView addSubview:marker];
  [binding bindToDescendant:marker];
  [binding bindToDescendant:marker];
  calls = 0;
  first.scrollView.contentOffset = CGPointMake(0, 50);
  XCTAssertEqual(calls, 0u);
  second.scrollView.contentOffset = CGPointMake(0, 50);
  XCTAssertEqual(calls, 1u);
  [binding invalidate];
}

- (void)testAdjustedInsetCallbackUsesSameNativeListener
{
  RCTScrollViewComponentView *component = [self makeComponent];
  UIView *marker = [UIView new];
  [component.containerView addSubview:marker];
  YohakuScrollDelegateBinding *binding = [YohakuScrollDelegateBinding new];
  __block NSUInteger calls = 0;
  binding.onScroll = ^(UIScrollView *scroll) { calls += 1; };
  [binding bindToDescendant:marker];
  // RCTEnhancedScrollView exposes a public delegate facade. UIKit dispatches
  // through this splitter, which is where the binding is registered.
  [(id<UIScrollViewDelegate>)component.scrollViewDelegateSplitter
      scrollViewDidChangeAdjustedContentInset:component.scrollView];
  XCTAssertEqual(calls, 1u);
  [binding invalidate];
}
@end
