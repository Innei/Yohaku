#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Subscribes to RN's existing delegate splitter without taking its delegate.
@interface YohakuScrollDelegateBinding : NSObject <UIScrollViewDelegate>
@property(nonatomic, copy, nullable) void (^onScroll)(UIScrollView *scrollView);
@property(nonatomic, weak, readonly, nullable) UIScrollView *scrollView;
- (nullable UIScrollView *)bindToDescendant:(UIView *)descendant;
- (void)invalidate;
@end

NS_ASSUME_NONNULL_END
