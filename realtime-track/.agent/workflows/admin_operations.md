---
description: Master workflow for sequential administrative operations
---
# 👑 Admin Master Workflow

Follow these steps in sequence to ensure the platform is healthy, technicians are verified, and finances are reconciled.

## 🟢 Phase 1: Platform Readiness (Daily Setup)
1. **System Check**: Go to `Infrastructure > System Settings`. 
   - Ensure "Maintenance Mode" is OFF.
   - Verify "Platform Fee" is correctly set (e.g., 20%).
2. **Service Catalog**: Check `Management > Service Catalog`.
   - Ensure all service categories are active.
   - Update pricing if there's a surge or seasonal shift.

## 🔵 Phase 2: User Lifecycle (Onboarding)
1. **KYC Review**: Go to `Management > KYC Center`.
   - Review pending documents for new technicians.
   - ⚠️ **Important**: Verify blurred or low-quality IDs before approving.
2. **Technician Status**: Go to `Management > Technicians`.
   - Monitor the list for high-rated technicians.
   - Flag or suspend users with multiple job cancellations.

## 🟡 Phase 3: Real-time Operations (Monitoring)
1. **Global Dashboard**: Start at `Operations > Dashboard`.
   - Monitor real-time earnings and job success rates.
2. **Tactical Monitoring**: Switch to `Operations > Live Map`.
   - Use the **Geo-Fence Scanner** to check coverage in specific zones.
   - Ensure technicians are distributed effectively across the city.

## 🔴 Phase 4: Financial Reconciliation (Payouts)
1. **Internal Audit**: Go to `Accounting > Transaction Ledger`.
   - Audit the last 24 hours of "Internal Ledger" entries.
   - Use the **Live Razorpay** toggle to verify bank-side matches.
2. **Payout Execution**: Go to `Accounting > Payout Requests`.
   - Review techincian withdrawal requests.
   - Verify that the technician is "Admin Verified" before processing any RazorpayX Payout.
   - Execute payouts for all "Approved" requests.

---

> [!TIP]
> Always verify the **Final Payout Amount** in the Transaction Ledger against the **Withdrawal Request** to avoid double-payouts.
