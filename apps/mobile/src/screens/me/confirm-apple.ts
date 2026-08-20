import { ApiError } from '@/api/errors'
import type { MembershipStatusResult } from '@/api/membership'

export function shouldRetryAppleConfirmation(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true
  return error.status === 408 || error.status === 429 || error.status >= 500
}

export async function confirmAppleWithRetry(
  confirm: (signedTransactionInfo: string) => Promise<MembershipStatusResult>,
  signedTransactionInfo: string,
): Promise<MembershipStatusResult> {
  try {
    return await confirm(signedTransactionInfo)
  } catch (error) {
    if (!shouldRetryAppleConfirmation(error)) throw error
    return await confirm(signedTransactionInfo)
  }
}

export async function confirmAndFinishAppleTransaction(
  confirm: (signedTransactionInfo: string) => Promise<MembershipStatusResult>,
  finish: (signedTransactionInfo: string) => Promise<void>,
  signedTransactionInfo: string,
): Promise<MembershipStatusResult> {
  const status = await confirmAppleWithRetry(confirm, signedTransactionInfo)
  await finish(signedTransactionInfo)
  return status
}
