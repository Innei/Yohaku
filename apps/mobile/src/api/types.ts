import type { CommentAnchor } from '@/lib/comment-anchor'

export type { CommentAnchor, RangeAnchor } from '@/lib/comment-anchor'

export interface ApiCategory {
  id: string
  name: string
  slug: string
  type: number
}

export interface ApiPost {
  category: ApiCategory | null
  categoryId: string | null
  content: string | null
  contentFormat: 'markdown' | 'lexical' | null
  createdAt: string
  id: string
  likeCount: number
  meta?: { aiGen?: unknown } | null
  modifiedAt: string | null
  pinAt: string | null
  readCount: number
  slug: string
  summary: string | null
  tags: string[] | null
  text: string | null
  title: string
}

export interface ApiPage {
  content: string | null
  contentFormat: 'markdown' | 'lexical' | null
  createdAt: string
  id: string
  meta?: { aiGen?: unknown } | null
  modifiedAt: string | null
  order: number
  slug: string
  subtitle: string | null
  text: string | null
  title: string
}

export interface ApiTagSum {
  count: number
  name: string
}

export interface ApiCategoryDetail extends ApiCategory {
  children: ApiPost[]
  count: number
  tagsSum?: ApiTagSum[]
}

export interface ApiTagDetail {
  data: ApiPost[]
  tag: string
}

export interface ApiTopic {
  createdAt: string
  description: string
  icon: string | null
  id: string
  introduce: string | null
  name: string
  slug: string
}

export interface ApiNote {
  content?: string | null
  contentFormat: 'markdown' | 'lexical' | null
  createdAt: string
  hasPassword: boolean | null
  id: string
  likeCount: number
  meta?: { aiGen?: unknown } | null
  modifiedAt: string | null
  mood: string | null
  nid: number
  readCount: number
  summary?: string | null
  text?: string | null
  title: string
  topic?: ApiTopic | null
  topicId?: string | null
  weather: string | null
}

export interface ApiTtsSegment {
  blockId: string
  chunkIndex: number
  text: string
  url: string
}

export interface ApiTts {
  blockOrder: string[]
  lang: string
  model: string
  segments: ApiTtsSegment[]
  voice: string
}

export interface ApiThinking {
  allowComment?: boolean
  commentsIndex?: number
  content: string
  createdAt: string
  down: number
  enrichments?: Record<string, ApiEnrichment> | null
  id: string
  modifiedAt: string | null
  up: number
}

export type CommentRefType = 'post' | 'note' | 'recently' | 'page'

export interface ApiMyCommentSource {
  categorySlug?: string | null
  nid?: number | null
  slug?: string | null
}

export interface ApiMyComment {
  createdAt: string
  id: string
  refId: string
  refType: CommentRefType
  source?: ApiMyCommentSource | null
  sourceTitle: string | null
  text: string
}

export interface ApiCommentReader {
  handle: string | null
  id: string
  image: string | null
  name: string | null
  role: string | null
}

export interface ApiComment {
  anchor?: CommentAnchor | null
  author: string
  avatar: string | null
  createdAt: string
  id: string
  isOwnerReply?: boolean
  parentCommentId: string | null
  pin?: boolean
  reader: ApiCommentReader | null
  refId: string
  rootCommentId: string | null
  text: string
  url: string | null
}

export interface ApiCommentReplyWindow {
  hasHidden: boolean
  hiddenCount: number
  nextCursor?: string | null
  returned: number
  threshold: number
  total: number
}

export interface ApiCommentRoot extends ApiComment {
  replies: ApiComment[] | null
  replyWindow: ApiCommentReplyWindow | null
}

export interface ApiCommentThreadPage {
  done: boolean
  nextCursor: string | null
  remaining: number
  replies: ApiComment[]
}

export interface ApiPaged<T> {
  data: T[]
  pagination: ApiPagination
}

export interface ApiEnrichmentImage {
  alt?: string
  height?: number
  thumbhash?: string
  url: string
  width?: number
}

export interface ApiEnrichmentAttribute {
  format?: string
  key: string
  label: string
  value: string | number | boolean
}

export interface ApiEnrichment {
  attributes?: ApiEnrichmentAttribute[]
  category?: string
  color?: string
  description?: string
  image?: ApiEnrichmentImage
  publishedAt?: string
  subtype?: string
  thumbnailImage?: ApiEnrichmentImage
  title: string
  url: string
}

export interface ApiAggregate {
  seo?: { title?: string | null } | null
  url?: { webUrl?: string | null } | null
  user?: {
    avatar?: string | null
    image?: string | null
    name?: string | null
    url?: string | null
  } | null
}

export interface ApiSiteInfo {
  firstPublishDate: string | null
  noteCount: number
  postCount: number
  totalWordCount: number
}

export interface ApiSessionUser {
  email?: string | null
  handle?: string | null
  id: string
  image?: string | null
  name?: string | null
  provider?: string | null
  role?: string | null
}

export interface ApiSearchHighlight {
  keywords: string[]
  snippet: string | null
}

export interface ApiSearchPost extends ApiPost {
  highlight?: ApiSearchHighlight
  isFallback?: boolean
  lang?: string
}

export interface ApiSearchNote extends ApiNote {
  highlight?: ApiSearchHighlight
  isFallback?: boolean
  lang?: string
}

export interface ApiPagination {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface ApiPushActivation {
  bindingId: string
  enabled: true
  relayUrl: string
}
