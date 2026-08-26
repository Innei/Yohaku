import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
import { extras } from '../../../../styles/extras.stylex'
import type { CSSProperties, FC } from 'react'

import { clsxm } from '../../../../lib/clsxm'

interface IconProps {
  className?: string
  size?: number | string
}

const make =
  (iconClass: string): FC<IconProps> =>
  ({ className, size = '1em' }) => {
    const style: CSSProperties = { fontSize: size }
    return (
      <i
        aria-hidden
        style={style}
        {...sx(extras.alignNeg015em, atoms.inline_block, atoms.shrink_0, iconClass, className)}
      />
    )
  }

export const GitCommitIcon = make('i-octicon-git-commit-16')
export const IssueOpenedIcon = make('i-octicon-issue-opened-16')
export const IssueClosedIcon = make('i-octicon-issue-closed-16')
export const PrOpenIcon = make('i-octicon-git-pull-request-16')
export const PrMergedIcon = make('i-octicon-git-merge-16')
export const PrClosedIcon = make('i-octicon-git-pull-request-closed-16')
export const DiscussionIcon = make('i-octicon-comment-discussion-16')
export const StarIcon = make('i-octicon-star-16')
export const PersonIcon = make('i-octicon-person-16')
export const ClockIcon = make('i-octicon-clock-16')
export const RepoIcon = make('i-octicon-repo-16')
export const CommentIcon = make('i-octicon-comment-16')
export const LocationIcon = make('i-octicon-location-16')
