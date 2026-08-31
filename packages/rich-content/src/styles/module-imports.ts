// Side-effect CSS imports for the @haklex static rich-content renderer.
//
// rich-compose is the single CSS contract surface (since @haklex/* 0.9.0):
// foundation gives prose body + theme tokens + variants; per-module subpaths
// cover the renderers we actually use. Modules whose default renderer is
// replaced by a local override (code-block, code-snippet, link-card, poll,
// quote, table) skip the upstream CSS entirely. Alert / banner / nested-doc keep haklex's
// wrapper DOM but are styled by yohaku-block-styles.css below — the upstream
// alert.css / banner.css / nested-doc.css are intentionally not imported.
//
// react-tweet/theme.css must be loaded here too: rich-ext-embed's
// TweetRenderer lazy-loads IsolatedTweet without bundling its theme stylesheet.

import '@haklex/rich-compose/style/foundation.css'
import '@haklex/rich-compose/style/chat.css'
import '@haklex/rich-compose/style/dynamic.css'
import '@haklex/rich-compose/style/embed.css'
import '@haklex/rich-compose/style/file.css'
import '@haklex/rich-compose/style/excalidraw.css'
import '@haklex/rich-compose/style/gallery.css'
import '@haklex/rich-compose/style/image.css'
import '@haklex/rich-compose/style/mention.css'
import '@haklex/rich-compose/style/mermaid.css'
import '@haklex/rich-compose/style/ruby.css'
import '@haklex/rich-compose/style/video.css'
import 'react-tweet/theme.css'
import './yohaku-block-styles.css'
