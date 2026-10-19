# ESB POS integration plan

Table reservations only, from the Tiny site into ESB. Company `TYKB` and branch `THFC` come from the live order link `esborder.qs.esb.co.id/TYKB/THFC`. Birthday parties, cakes, packages, and events stay on the site.

API reference: [ESB Order Quick Service docs](https://developers.esb.co.id/eso-qs/)

## Decisions

| Choice | Decision | What the build does |
|---|---|---|
| When the reservation is created in ESB | When the guest submits | ESB status is New. The site booking, email, and WhatsApp still succeed if ESB fails. |
| When the table is written into the POS | When staff marks the booking Confirmed | `submit-transaction` runs with the matched ESB `tableID`. An unconfirmed request does not take the table. |
| Birthdays, cakes, and packages | Not linked | Party builder and cake requests stay on the site. A table reservation whose purpose is Birthday still goes to ESB, because it is a table booking. |
| Events | Not linked | Guest lists and tickets stay on the site. |

## Details still needed

Guest name, title, email, WhatsApp, date, time, kids, adults, purpose, notes, and table label are already saved on every reservation. They do not need to be collected again.

### From ESB, before any call works

| Detail | What to send | Used for |
|---|---|---|
| Static bearer token | The token from the ESB project contact. The account must be registered in ESB Core. The docs sample `123` is not a token. | Every call, including the read-only probe |
| Company code | Confirm `TYKB`. Send the code ESB gave you if it differs. | Header `Data-Company` |
| Branch code | Confirm `THFC` for Berawa. | Header `Data-Branch` |
| Environment | Production `https://eso-api.esb.co.id`, or staging `https://stg7.esb.co.id/api-ezo/web`, and which token belongs to which. | Avoids writing test bookings into the live POS |

### Ids to pick after the token works

A read-only probe can list these. You only need to point at the right name.

| Detail | Where it comes from | Why it is required |
|---|---|---|
| Reservation visit purpose | `GET /qsv1/reservation/visit-purpose` | `submit-transaction` requires `visitPurposeID`. Pick the dine-in purpose for Berawa. |
| Table names in the POS | `GET /qsv1/reservation/table-section` for a real date and time | The site knows Table 1–20 (ids such as `in-1` and `tr-18`). ESB wants its own numeric `tableID`. If POS names differ, send the ESB name for each table. |
| Branch timezone | ESB branch settings | The site uses Asia/Makassar (WITA, UTC+8). Reservation time is `HH:MM` with no timezone, so the branch clock has to be WITA or every booking is an hour off. |

### Minimum to start

Token, confirmed company and branch, production or staging, the dine-in visit purpose, and a yes that POS table names match Table 1–20.

## Why the docs console failed

“You didn't provide all of the required parameters” came from the Try it form on the Save Order page, before ESB received the request. It needs `Authorization: Bearer <token>`, `Data-Branch`, and `Data-Company`. The sample values `123`, `ESODM`, and `ESBPR` are placeholders. Save Order is not used in this build.

## Which booking uses which API

| Site booking | ESB call | When it runs |
|---|---|---|
| Table reservation | `POST /qsv1/reservation/transaction`, then `POST /qsv1/reservation/submit-transaction` | Create when the guest submits. Write the table into the POS when staff marks Confirmed. |
| Birthday party, cake, package | None | Stays on the site. |
| Event tickets | None | Stays on the site. |
| Menu / esborder link | Already on ESB Order | Unchanged. Those food sales already reach the POS. |

## Reservation flow

### 1. Guest submits: create in ESB

`POST /qsv1/reservation/transaction`

Returns `reservationID`, for example `LR00YZNND`. ESB status is New.

| Tiny field | ESB field | Rule |
|---|---|---|
| Title Mr. / Mrs. / Ms. / Mx. | `title` | Mx. is sent as Ms. ESB also accepts Tn. / Ny. / Nn. |
| Name | `customerName` | Required |
| Email | `email` | Required |
| WhatsApp `+62…` | `phoneNumber` | Digits only, 9–16 characters. `+62` becomes `0`. No plus sign. |
| Kids + adults | `paxTotal` | Integer, minimum 1 |
| Date | `reservationDate` | `YYYY-MM-DD`, must be in the future |
| Time | `reservationTime` | `HH:MM`, must be in the future |
| Purpose | `purpose` | Birthday becomes Birthday Party. Other text is stored as free text. |
| Notes, request code, table label | `notes` | Kept short so the POS note stays readable |

### 2. Staff marks Confirmed: write the table into the POS

`POST /qsv1/reservation/submit-transaction`

```json
{
  "reservationID": "LR00YZNND",
  "paxTotal": 4,
  "reservationDate": "2026-10-20",
  "reservationTime": "13:00",
  "visitPurposeID": 57,
  "reservationTable": [{ "tableID": 844 }],
  "outletNotes": "TINY-AB12 · Table 18"
}
```

`tableID` comes from Get Table Section, matched on table name to Table 1–20. If no table matches, the reservation still exists in ESB and staff see that the POS step is waiting.

The schema text says the date format is `YYYY-DD-MM`, but its example is `2023-09-07`. Use `YYYY-MM-DD` unless ESB says otherwise.

Success response: `{ "success": true, "message": "Reservation has been updated", "reservationID": "..." }`

### 3. Cancel or edit

- Guest or staff cancel: `POST /qsv1/reservation/cancel` with `reservationID` and `reason`.
- A change of date, time, party size, or table: cancel the old ESB reservation and create a new one.

### Supporting reads

- `GET /qsv1/reservation/time?reservationDate=YYYY-MM-DD`
- `GET /qsv1/reservation/purpose`
- `GET /qsv1/reservation/visit-purpose`
- `GET /qsv1/reservation/table-section?reservationDate=YYYY-MM-DD&reservationTime=HH:MM`

## Where it lives

The bearer token stays in Supabase secrets. It never goes in the browser.

A shared ESB client runs only for `source = reservation`:

- `submit-request` creates the ESB reservation after the Supabase row is saved.
- Staff confirmation calls `submit-transaction`.
- `manage-request` cancels in ESB when the guest cancels or makes a material edit.
- A staff-only retry sends a failed push again.

The result is stored on the request as `payload.esb`: `reservationID`, table match, and the last error. A failed ESB call does not undo the Supabase booking, the email, or WhatsApp.

### Secrets

```
ESB_TOKEN=
ESB_COMPANY=TYKB
ESB_BRANCH=THFC
ESB_BASE_URL=
ESB_VISIT_PURPOSE_ID=
```

## Build order

| Phase | Work | Done when |
|---|---|---|
| 0. Probe | Read branch, purposes, visit purposes, and tables with the real token. No writes. | `TYKB` / `THFC` respond, and table names are compared with Table 1–20. |
| 1. Reservations | Create the ESB reservation on guest submit. Submit the table to the POS when staff marks Confirmed. | A test booking shows in ESB, and on the matched table only after Confirmed. |
| 2. Changes | Cancel in ESB when the guest or staff cancels. Date, time, pax, or table edits cancel and recreate. | The POS copy matches the site after an edit. |
| 3. Staff inbox | Show ESB status on the reservation and add Send to ESB POS. | A failed push can be retried without a new guest booking. |

## Reference: payment methods (not used in this build)

All 19 methods are Active on Tiny Healthy Family Cafe. Payment Code shows “-” on every row. These would matter only if cake, party, or event bills are added to ESB later.

| Use | Payment | Type | External type | MDR |
|---|---|---|---|---|
| Cafe bills, if added later | CASH | CASH | None | 0,00 |
| POS only, in the cafe | Bank Transfer, CREDIT PERMATA, DEBIT PERMATA | CARD | None | 0,00 |
| POS only, in the cafe | QRIS, QRIS ESB, QRIS PERMATA | CARD | QRIS ESB is POS - QRIS (ESB) | 0,00 or 0,70 |
| POS only, delivery apps | GOFOOD, GRABFOOD, SHOPEEFOOD | CARD | None | 0,00 |
| POS only, not a sale | ENTERTAINMENT, Jackson meal, OWNER COMPLIMENTARY, MEMBER DEPOSIT | OTHER COST or MEMBER DEPOSIT | None | 0,00 |
| ESB Order guest checkout | QRIS ESO | CARD | ESO - QRIS (ESB) | 0,70 |
| ESB Order guest checkout | OVO (ESB ORDER) | CARD | ESO - OVO (ESB) | 1,67 |
| ESB Order guest checkout | CREDIT CARD (ESB ORDER) | CARD | ESO - Kartu Kredit / Debit (Xendit) | 1,98 |
| ESB Order guest checkout | GOPAY (ESB ORDER), SHOPEEPAY (ESB ORDER) | CARD | ESO - GoPAY, ESO - ShopeePay (ESB) | 2,22 |

## Local ESB POS server

`http://192.168.110.210/esb-fnb-pos/en/terminal-list` opened as a blank “ESB POS” page in Cursor’s browser, so how it works was not confirmed. The reservation build above uses the ESB cloud API and does not depend on this local server.
