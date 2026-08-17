import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import type { HostCapabilities, HostEnrichment } from '../../../host'
import { HostProvider } from '../../../host'
import { LinkCardVariant } from './dispatch'
import { FallbackCard } from './variants/FallbackCard'
import {
  AlbumCard,
  BookCard,
  MovieCard,
  PosterCard,
} from './variants/PosterCard'
import { SelfCard, toSelfPath } from './variants/SelfCard'

vi.mock('@haklex/rich-editor/static', () => ({
  LinkFavicon: () => <i data-testid="favicon" />,
}))

const baseHost: HostCapabilities = {
  apiBase: 'https://example.com/api',
  fetchJSON: async () => ({}) as never,
  labels: {
    nestedDocCollapse: '收起',
    nestedDocExpand: '展开',
    nestedDocLabel: '嵌套文档',
  },
  nestedDocPresentation: 'inline',
  openImage: () => {},
  openLink: () => {},
  scrollToAnchor: () => {},
  theme: 'light',
  webOrigin: 'https://example.com',
}

const baseData: HostEnrichment = {
  category: 'web',
  title: 'Test Title',
  url: 'https://example.com/path',
}

describe('FallbackCard thumbnail', () => {
  it('renders an <img> with object-cover when thumbnailImage.url is present', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{
          ...baseData,
          thumbnailImage: {
            url: 'https://cdn.example.com/og.jpg',
            width: 1200,
            height: 630,
          },
        }}
      />,
    )
    expect(html).toContain('<img')
    expect(html).toContain('src="https://cdn.example.com/og.jpg"')
    expect(html).toContain('object-cover')
    expect(html).toContain('aspect-ratio')
  })

  it('falls back to the legacy image field when thumbnailImage is absent', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{
          ...baseData,
          image: { url: 'https://cdn.example.com/legacy.jpg' },
        }}
      />,
    )
    expect(html).toContain('src="https://cdn.example.com/legacy.jpg"')
  })

  it('renders no thumbnail <img> when no image field is present', () => {
    const html = renderToStaticMarkup(<FallbackCard data={{ ...baseData }} />)
    expect(html).not.toContain('<img')
  })
})

describe('FallbackCard body block', () => {
  it('renders the title and description', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{ ...baseData, description: 'A short description.' }}
      />,
    )
    expect(html).toContain('Test Title')
    expect(html).toContain('A short description.')
    expect(html).toContain('yohaku-link-card')
  })

  it('renders the site attribute in place of the bare host when present', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{
          ...baseData,
          attributes: [{ key: 'site', value: 'YouTube' }],
        }}
      />,
    )
    expect(html).toContain('>YouTube<')
  })

  it('falls back to host when site is absent', () => {
    const html = renderToStaticMarkup(<FallbackCard data={{ ...baseData }} />)
    expect(html).toContain('>example.com<')
  })

  it('renders author / year / reading_time meta when present', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{
          ...baseData,
          publishedAt: '2024-03-15',
          attributes: [
            { key: 'author', value: 'Jane Doe' },
            { key: 'reading_time', value: '5 min' },
          ],
        }}
      />,
    )
    expect(html).toContain('Jane Doe')
    expect(html).toContain('2024')
    expect(html).toContain('5 min')
  })
})

describe('FallbackCard accent injection', () => {
  it('injects --color-accent on the shell style when color is a valid hex', () => {
    const html = renderToStaticMarkup(
      <FallbackCard data={{ ...baseData, color: '#abcdef' }} />,
    )
    expect(html).toContain('--color-accent:#abcdef')
  })

  it('ignores non-hex color values', () => {
    const html = renderToStaticMarkup(
      <FallbackCard data={{ ...baseData, color: 'TypeScript' }} />,
    )
    expect(html).not.toMatch(/style="[^"]*--color-accent:/)
  })

  it('falls back to captureImage palette dominant when data.color is invalid', () => {
    const html = renderToStaticMarkup(
      <FallbackCard
        data={{
          ...baseData,
          color: 'NotAColor',
          captureImage: {
            url: 'https://cdn.example.com/capture.webp',
            palette: { dominant: '#112233' },
          },
        }}
      />,
    )
    expect(html).toContain('--color-accent:#112233')
  })
})

describe('PosterCard wash treatment', () => {
  it('applies wash class and --wash-color when color is hex', () => {
    const html = renderToStaticMarkup(
      <PosterCard
        data={{ ...baseData, color: '#abcdef' }}
        kind="movie"
        topCaps="Movie · 2024"
      />,
    )
    expect(html).toContain('yohaku-poster-card-wash')
    expect(html).toContain('--wash-color:#abcdef')
  })

  it('does not apply wash when color is undefined or non-hex', () => {
    for (const color of [undefined, 'TypeScript']) {
      const html = renderToStaticMarkup(
        <PosterCard
          data={{ ...baseData, color }}
          kind="movie"
          topCaps="Movie · 2024"
        />,
      )
      expect(html).not.toContain('yohaku-poster-card-wash')
      expect(html).not.toContain('--wash-color')
    }
  })
})

describe('PosterCard image slot', () => {
  it('renders <img> when thumbnailImage.url is present', () => {
    const html = renderToStaticMarkup(
      <PosterCard
        kind="movie"
        topCaps="Movie · 2024"
        data={{
          ...baseData,
          thumbnailImage: { url: 'https://cdn.example.com/cover.jpg' },
        }}
      />,
    )
    expect(html).toContain('src="https://cdn.example.com/cover.jpg"')
  })

  it('pins the compact poster slot to an explicit width', () => {
    const html = renderToStaticMarkup(
      <PosterCard
        kind="movie"
        topCaps="Movie · 2024"
        data={{
          ...baseData,
          thumbnailImage: { url: 'https://cdn.example.com/cover.jpg' },
        }}
      />,
    )
    expect(html).toContain('width:calc(7rem * 2 / 3)')
  })

  it('renders HostStamp (no <img>) when thumbnailImage.url is absent', () => {
    const html = renderToStaticMarkup(
      <PosterCard data={{ ...baseData }} kind="movie" topCaps="Movie · 2024" />,
    )
    expect(html).not.toContain('<img')
    expect(html).toContain('<svg')
  })
})

describe('PosterCard kicker per subtype', () => {
  it('movie subtype renders "Movie · YYYY"', () => {
    const html = renderToStaticMarkup(
      <MovieCard
        data={{ ...baseData, subtype: 'movie', publishedAt: '2024-03-15' }}
      />,
    )
    expect(html).toContain('Movie · 2024')
  })

  it('tv subtype renders "TV · YYYY"', () => {
    const html = renderToStaticMarkup(
      <MovieCard
        data={{ ...baseData, subtype: 'tv', publishedAt: '2023-09-01' }}
      />,
    )
    expect(html).toContain('TV · 2023')
  })

  it('song subtype renders "Song"', () => {
    const html = renderToStaticMarkup(
      <AlbumCard
        data={{ ...baseData, subtype: 'song', publishedAt: '2022-06-01' }}
      />,
    )
    expect(html).toContain('Song')
    expect(html).not.toContain('Album · 2022')
  })

  it('book subtype renders "Book · YYYY"', () => {
    const html = renderToStaticMarkup(
      <BookCard
        data={{ ...baseData, subtype: 'book', publishedAt: '2019-11-12' }}
      />,
    )
    expect(html).toContain('Book · 2019')
  })
})

describe('SelfCard', () => {
  const selfData: HostEnrichment = {
    category: 'self',
    title: 'My Own Post',
    url: '/posts/tech/hello',
  }

  function renderWithHost(node: React.ReactElement, host = baseHost) {
    return renderToStaticMarkup(<HostProvider host={host}>{node}</HostProvider>)
  }

  it('normalizes legacy provider ids to on-site paths', () => {
    expect(toSelfPath('/posts/a/b')).toBe('/posts/a/b')
    expect(toSelfPath('post:cat/slug')).toBe('/posts/cat/slug')
    expect(toSelfPath('note:42')).toBe('/notes/42')
    expect(toSelfPath('note-date:2026/5/5/slug')).toBe('/notes/2026/5/5/slug')
    expect(toSelfPath('https://example.com/posts/x/y')).toBe('/posts/x/y')
    expect(toSelfPath('post:no-slash')).toBeNull()
    expect(toSelfPath('weird:stuff')).toBeNull()
  })

  it('renders a site-origin anchor without target=_blank', () => {
    const html = renderWithHost(<SelfCard data={selfData} />)
    expect(html).toContain('href="https://example.com/posts/tech/hello"')
    expect(html).not.toContain('target="_blank"')
    expect(html).toContain('My Own Post')
  })

  it('falls back to the bare path when webOrigin is unknown', () => {
    const html = renderWithHost(<SelfCard data={selfData} />, {
      ...baseHost,
      webOrigin: '',
    })
    expect(html).toContain('href="/posts/tech/hello"')
  })

  it('renders the site owner avatar stamp when no thumbnail exists', () => {
    const html = renderWithHost(<SelfCard data={selfData} />, {
      ...baseHost,
      site: { ownerAvatar: 'https://cdn.example.com/me.png', ownerName: 'me' },
    })
    expect(html).toContain('src="https://cdn.example.com/me.png"')
  })

  it('renders without a HostProvider (markdown pipeline) as a bare-path anchor', () => {
    const html = renderToStaticMarkup(<SelfCard data={selfData} />)
    expect(html).toContain('href="/posts/tech/hello"')
    expect(html).toContain('My Own Post')
  })

  it('lets interceptSelfLink consume plain clicks but not cmd-clicks', async () => {
    const intercept = vi.fn(() => true)
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <HostProvider host={{ ...baseHost, interceptSelfLink: intercept }}>
          <SelfCard data={selfData} />
        </HostProvider>,
      )
    })

    const anchor = container.querySelector('a')!
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true })
    await act(async () => {
      anchor.dispatchEvent(plain)
    })
    expect(intercept).toHaveBeenCalledWith('/posts/tech/hello')
    expect(plain.defaultPrevented).toBe(true)

    intercept.mockClear()
    const cmd = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    })
    await act(async () => {
      anchor.dispatchEvent(cmd)
    })
    expect(intercept).not.toHaveBeenCalled()
    expect(cmd.defaultPrevented).toBe(false)

    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('renders the fallback when the url cannot be normalized', () => {
    const html = renderWithHost(
      <SelfCard
        data={{ ...selfData, url: 'weird:stuff' }}
        fallback={<a href="https://x.example">plain</a>}
      />,
    )
    expect(html).not.toContain('yohaku-link-card')
    expect(html).toContain('>plain</a>')
  })
})

describe('LinkCardVariant dispatch', () => {
  it('routes github repo enrichments to the repo card', () => {
    const html = renderToStaticMarkup(
      <LinkCardVariant
        data={{
          category: 'github',
          subtype: 'repo',
          title: 'innei/yohaku',
          url: 'https://github.com/innei/yohaku',
          attributes: [
            { key: 'language', value: 'TypeScript' },
            { key: 'stars', value: 1234 },
          ],
        }}
      />,
    )
    expect(html).toContain('Repository')
    expect(html).toContain('1.2k')
    expect(html).toContain('TypeScript')
  })

  it('routes unknown categories to the fallback card', () => {
    const html = renderToStaticMarkup(<LinkCardVariant data={baseData} />)
    expect(html).toContain('yohaku-link-card')
    expect(html).toContain('Test Title')
  })
})
