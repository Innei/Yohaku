import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export const clsxm = (...args: any[]) => twMerge(clsx(args))
