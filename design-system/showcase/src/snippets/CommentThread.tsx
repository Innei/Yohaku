import type { Lang } from '../i18n'

type CommentI18n = {
  initial: string
  name: string
  ago: string
  body: string
  isOwner?: boolean
  reply?: boolean
}

const comments: Record<Lang, CommentI18n[]> = {
  zh: [
    {
      initial: 'A',
      name: 'Anya',
      ago: '2 小时前',
      body: '三档 neutral 的设定让阅读节奏有了松紧感。深色模式自动反转这一点尤其难得。',
    },
    {
      initial: 'I',
      name: 'Innei',
      ago: '1 小时前',
      body: '谢谢看完。本来就想避免 50–950 那种「色味稀薄」的感觉。',
      isOwner: true,
      reply: true,
    },
  ],
  en: [
    {
      initial: 'A',
      name: 'Anya',
      ago: '2 hours ago',
      body: 'The three neutral tiers give the reading rhythm real breathing room. Dark mode auto-inversion is a nice touch.',
    },
    {
      initial: 'I',
      name: 'Innei',
      ago: '1 hour ago',
      body: 'Thanks for reading. The goal was to avoid that thin, washed-out feel of the 50–950 scale.',
      isOwner: true,
      reply: true,
    },
  ],
}

const ownerLabel: Record<Lang, string> = {
  zh: '站主',
  en: 'Author',
}

const replyLabel: Record<Lang, string> = {
  zh: '回复',
  en: 'Reply',
}

export function CommentThreadSnippet({ lang }: { lang: Lang }) {
  return (
    <ul className="comment-thread">
      {comments[lang].map((c, i) => (
        <li
          key={i}
          className="comment"
          style={c.reply ? { marginLeft: 36 + 16 } : undefined}
        >
          <div className="comment__row">
            <div className="comment__avatar" aria-hidden="true">
              {c.initial}
            </div>

            <div className="comment__content">
              <div className="comment__header">
                <span className="comment__name">{c.name}</span>
                {c.isOwner && (
                  <span className="comment__owner-badge">{ownerLabel[lang]}</span>
                )}
                <span className="comment__time">{c.ago}</span>
              </div>

              <div className="comment__bubble">
                <p>{c.body}</p>
              </div>

              {!c.reply && (
                <button className="comment__reply-btn">{replyLabel[lang]}</button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
