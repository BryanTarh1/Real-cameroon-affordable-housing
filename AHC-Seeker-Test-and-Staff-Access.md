# AHC Seeker Test and Staff Access Guide

## 1. Public seeker workflow test

The public marketplace was opened in a signed-out browser session. A seeker was able to enter a location query, **Bastos**, and submit the public search without being asked to sign in. This confirms that **search is public**.

The database was deliberately reset and currently contains **zero fresh listings**, so there was no real property card available to click in the live preview. The property-detail gate was therefore verified by its focused automated test: an unauthenticated visitor is sent to the AHC sign-in prompt when opening a listing, while an authenticated visitor opens the listing detail. The prompt cannot be demonstrated in the live browser until an approved listing is available.

| Seeker step | Expected result |
|---|---|
| Open the homepage | No sign-in is required. |
| Search by place, city, or move-in budget | No sign-in is required. |
| Select a listing card or a map listing | If not signed in, the AHC account prompt appears. |
| Sign in or create an AHC account | The selected property detail opens after authentication. |
| Contact the agent | The listing page provides the pre-filled WhatsApp contact action. |

## 2. Field Moderator sign-in and dashboard

The Field Moderator route is on the same AHC website:

> **Production Field Moderator URL:** https://affordableho-8aahm5dj.manus.space/operations

The route was opened while signed out. It correctly presented an **AHC email and password** form and did not render Operations controls. A Manus account is not required.

Before a person can use this route, they must have an existing AHC account and an Admin must set that account’s role to **Field Moderator**. Public registration always creates a standard `user` account; it cannot self-assign staff authority.

After being assigned the Field Moderator role, the person signs in at `/operations` with their AHC email address and password. The dashboard permits these operational tasks:

| Field Moderator responsibility | What the dashboard supports |
|---|---|
| Reconcile payments | Review submitted MTN MoMo or Orange Money payment references and record a reconciliation outcome. |
| Review listings | Review agent-submitted listings before first publication and approve or reject them. A rejected listing restores the corresponding listing credit. |
| Carry out field verification | Record an on-site compound inspection outcome; a passed outcome grants the physical-verification badge. |
| Track commissions | View the recorded **80% Field Moderator / 20% AHC** allocation for passed, paid physical verification work. |

The signed-out Field Moderator page was verified in the browser. A full dashboard session was **not** performed after the reset because there is no currently assigned Field Moderator account.

## 3. Private Admin panel and trusted role assignment

The private Admin panel is:

> **Production Admin URL:** https://affordableho-8aahm5dj.manus.space/admin

This address is deliberately absent from public navigation. A signed-out visit was verified to return the visitor to the public marketplace rather than expose Admin controls. Knowing the address is not enough to obtain access: the server checks the authenticated user’s `admin` role before returning privileged data or accepting Admin actions.

### How to assign a Field Moderator or another Admin

1. Have the trusted person create a normal AHC account first. They can use the agent account form; it creates a standard account and does not grant staff access.
2. Sign in as the existing Admin at `/admin`.
3. Open **05 / Trusted staff authority** in the Admin workspace.
4. Find the person’s existing account in the account list.
5. Choose **Field Moderator** or **Admin** from the role selector. Choose **Seeker / Agent** to remove staff authority.
6. Select **Save trusted role**.
7. The change is recorded in the Admin audit trail. The person can then sign in with the same AHC email and password at `/operations` (Field Moderator) or privately use `/admin` (Admin).

The Admin-only role-assignment endpoint has automated authorization coverage proving that standard users cannot promote themselves or others. The role assignment screen was inspected and the production Admin route was checked while signed out; the final assignment action was **not** executed in a live Admin session after the reset.

## Immediate clean-start note

The reset removed previous accounts and staff assignments. To operate the private workspaces, retain or create one trusted Admin account first. That Admin can then onboard Field Moderators through the restricted **Trusted staff authority** section.
