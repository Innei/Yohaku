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
