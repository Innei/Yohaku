import type { ComponentType } from 'react'
import type { ColorValue, StyleProp, ViewStyle } from 'react-native'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleUser,
  CircleX,
  Coffee,
  CornerDownRight,
  FileText,
  Globe,
  Hash,
  Headphones,
  Heart,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  Lightbulb,
  Link as LinkIcon,
  List,
  Lock,
  Maximize,
  MessageSquare,
  MessageSquareText,
  MoreHorizontal,
  Newspaper,
  PenLine,
  Printer,
  Quote,
  Search,
  Share,
  Sparkles,
  SquareStack,
  Wand2,
  Webhook,
  X,
} from 'lucide-react-native'

export interface SFSymbolProps {
  fallback?: ComponentType<{ color?: ColorValue; size?: number }>
  name: string
  size?: number
  style?: StyleProp<ViewStyle>
  tintColor?: ColorValue
  weight?: string
  [key: string]: unknown
}

type LucideIcon = ComponentType<{
  color?: ColorValue
  size?: number
  strokeWidth?: number
  style?: StyleProp<ViewStyle>
}>

/**
 * SF Symbols -> Material-ish vector mapping. Screen code passes Apple symbol
 * names everywhere; rather than editing every call site we translate the names
 * once here so Android gets crisp, themeable icons from lucide.
 */
const ICONS: Record<string, LucideIcon> = {
  'arrow.left': ArrowLeft,
  'arrow.right': ArrowRight,
  'arrow.turn.down.right': CornerDownRight,
  'arrow.up.left.and.arrow.down.right': Maximize,
  'arrow.up.right': ArrowUpRight,
  'bubble.right': MessageSquare,
  'camera.aperture': Info,
  checkmark: Check,
  'checkmark.circle': Check,
  'checkmark.seal.fill': BadgeCheck,
  'chevron.down': ChevronDown,
  'chevron.right': ChevronRight,
  'crown.fill': BadgeCheck,
  'cup.and.saucer': Coffee,
  'doc.on.doc': FileText,
  'doc.text': FileText,
  ellipsis: MoreHorizontal,
  exclamationmark: AlertTriangle,
  'exclamationmark.triangle': AlertTriangle,
  'exclamationmark.triangle.fill': AlertTriangle,
  eye: Info,
  globe: Globe,
  headphones: Headphones,
  heart: Heart,
  index: LayoutGrid,
  lightbulb: Lightbulb,
  link: LinkIcon,
  'list.bullet': List,
  'lock.fill': Lock,
  magnifyingglass: Search,
  markdown: FileText,
  'markdown-article': FileText,
  newspaper: Newspaper,
  'pencil.and.scribble': PenLine,
  'person.crop.circle': CircleUser,
  'person.crop.circle.fill': CircleUser,
  print: Printer,
  printer: Printer,
  'rectangle.portrait.and.arrow.right': ArrowUpRight,
  'rich-document': FileText,
  'rich-text': FileText,
  safari: Globe,
  scope: Hash,
  'square.and.arrow.up': Share,
  'square.dashed': LayoutGrid,
  'square.stack': SquareStack,
  sparkles: Sparkles,
  'text.bubble': MessageSquareText,
  'text.quote': Quote,
  'wand.and.stars': Wand2,
  websocket: Webhook,
  xmark: X,
  'xmark.circle.fill': CircleX,
  image: ImageIcon,
}

export function SymbolView({
  name,
  size = 16,
  tintColor,
  style,
  fallback: Fallback,
}: SFSymbolProps) {
  const Icon = ICONS[name] ?? Fallback ?? Circle
  return (
    <Icon
      color={tintColor ?? '#000'}
      size={size}
      strokeWidth={1.75}
      style={style as StyleProp<ViewStyle>}
    />
  )
}

export default SymbolView
