import type { MembershipStatusResult } from '@/api/membership'

export async function confirmAppleWithRetry(
  confirm: (signedTransactionInfo: string) => Promise<MembershipStatusResult>,
  signedTransactionInfo: string,
): Promise<MembershipStatusResult> {
  try {
    return await confirm(signedTransactionInfo)
  } catch {
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
