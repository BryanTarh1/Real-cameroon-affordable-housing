export type VerificationCommissionStatus = "held" | "accrued" | "paid" | "voided";

export function getModeratorCommissionStatusCopy(status: VerificationCommissionStatus) {
  switch (status) {
    case "held":
      return "Held: awaiting evidence review, any required independent audit, and Admin payout approval.";
    case "accrued":
      return "Accrued: evidence review is recorded; payment remains subject to the approved operating process.";
    case "paid":
      return "Paid: the recorded payout date is shown below.";
    case "voided":
      return "Voided: this allocation is no longer eligible for payout.";
  }
}
