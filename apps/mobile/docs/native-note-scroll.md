# Native note scroll ownership

FlashList remains the list and virtualization owner. Its `renderScrollComponent`
places a zero-size native attachment inside the actual RN ScrollView content.
The attachment resolves its nearest `RCTScrollViewComponentView` on native mount
and subscribes through `scrollViewDelegateSplitter`. It never replaces the RN
delegate, creates another scroll container, polls frames, or streams offsets
through JavaScript.

The attachment forwards `scrollViewDidScroll` and adjusted-inset changes to its
nearest native Hero host. The host updates Hero geometry and, for Notes, the top
blur in the same main-thread callback. JS supplies only content and static effect
configuration. Detail scroll views use the same attachment. Removal detaches the
listener; remount binds the new native scroll component.

The shared Hero transition continues to use UIKit's transition coordinator and
content container. Its source geometry is the latest native scroll position.
Each native slot belongs to exactly one role. When Expo delivers the note ID
before the role prop, changing from the default detail role to list removes the
old registration; otherwise the coordinator can keep presenting stale detail
geometry even though native scroll callbacks are updating the list geometry.
Cover geometry includes the list padding and automatic navigation inset, while
cover blur starts only beyond that resting baseline. The normal top inset must
not be treated as an overscroll gesture that obscures the loaded image.

Verification: signed iOS build; native delegate coexistence, detach/rebind,
initial-inset and transition regression tests; cold first entry, scrolling,
push, pop and cancelled interactive pop on the installed app. Unit tests alone
do not establish visual smoothness.
