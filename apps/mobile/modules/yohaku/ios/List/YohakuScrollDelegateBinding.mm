#import "YohakuScrollDelegateBinding.h"
#import <React/RCTScrollViewComponentView.h>

@implementation YohakuScrollDelegateBinding {
  __weak RCTScrollViewComponentView *_component;
  __weak UIScrollView *_scrollView;
}

- (UIScrollView *)scrollView { return _scrollView; }

- (UIScrollView *)bindToDescendant:(UIView *)descendant
{
  NSAssert(NSThread.isMainThread, @"Scroll binding must run on the UI thread");
  RCTScrollViewComponentView *component =
      [RCTScrollViewComponentView findScrollViewComponentViewForView:descendant];
  if (component == _component && component.scrollView == _scrollView) {
    return _scrollView;
  }
  [self invalidate];
  if (component == nil) { return nil; }
  _component = component;
  _scrollView = component.scrollView;
  [component.scrollViewDelegateSplitter addDelegate:self];
  return _scrollView;
}

- (void)invalidate
{
  [_component.scrollViewDelegateSplitter removeDelegate:self];
  _component = nil;
  _scrollView = nil;
}

- (void)dealloc { [self invalidate]; }

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (scrollView == _scrollView && self.onScroll) { self.onScroll(scrollView); }
}

- (void)scrollViewDidChangeAdjustedContentInset:(UIScrollView *)scrollView
{
  [self scrollViewDidScroll:scrollView];
}
@end
