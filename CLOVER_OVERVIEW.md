# Clover: App Overview

A plain-English summary of the Clover app, based only on what is in the code (as of 23 October 2026). Where something is unclear from the code, it says so.

---

## 1. What Clover is

Clover is an iPhone app for noticing small wins. Each day you write down one or more little things that went well, and the day gets a clover on your calendar. Mark a day "Extra lucky" and it gets a golden four-leaf clover instead. Over time your calendar fills up like a meadow, you build a daily streak, and you can share a picture of your month. It is for anyone who wants a calm, private, low-effort gratitude habit. There is no account and no sign-up. Everything stays on the phone.

---

## 2. Features

### Free

- **Log moments.** Write short entries (up to 140 characters) for today or any past day since you started. A day can hold several entries.
- **Edit in place and delete.** Tap an entry to edit it right where it is. Tap × to delete (with a "Remove this?" confirmation).
- **Extra lucky days.** A switch on each entry. Any lucky entry makes that day a gold four-leaf clover.
- **Today screen.** A big clover that fills in once you log something, your streak, and how many entries you have today.
- **Clovers calendar.** A month-by-month calendar of your clovers. Tap any past day to see, add or edit its entries.
- **Highlights.** For each month: number of clovers, best streak, gold clovers, and a list of your "Extra lucky moments".
- **Share my month.** Makes a tall story-shaped image (1080 × 1920) of your month to share. You choose up to 3 entries to show, or hide all text.
- **Reminders.** A daily reminder at a time you choose, and an 8 PM "yesterday" reminder to protect your streak (see section 5).
- **Dark mode.** Light, Dark or Automatic (follows the iPhone). Only for the free Classic theme.
- **Today Clover widget.** A small Home Screen widget (see section 4).
- **Feedback.** A screen to send a bug report or idea by email.
- **Onboarding.** Four intro pages on first launch, swipeable, with a "Skip" button.
- **Review prompt.** An "Enjoying Clover?" card that can appear after a week of use (rules below).

**Review prompt rules:** it only appears after you have logged on at least 7 days *and* at least 7 days have passed since first use. It is shown at most twice. "Maybe later" the first time snoozes it for 30 days. "No thanks", "Leave a review", or a second "Maybe later" stops it for good.

### Clover+ (one-time purchase)

- **5 extra colour themes:** Golden hour, Forest, Meadow, Blossom, Autumn.
- **Face ID lock** (or Touch ID on older phones). Asks for Face ID when you open the app and whenever it comes back from the background.
- **4 extra widgets:** Streak, Week, Calendar and Lock Screen.

### Developer-only (never visible in the App Store version)

These only appear in development builds (the version you run from your computer with `npx expo start`):

- **Demo data.** Fills about four months with sample entries and gold days for screen recordings. Your real entries are stored separately and come back when you switch it off.
- **Enable Clover+ temporarily.**
- **Reset app data and onboarding.**
- **Simulated store.** If no RevenueCat key is set, purchases are faked so the paywall can be tested.

### Half built or unused

- **Android.** There are Android settings in the config, but purchases only have an iPhone key and widgets are iPhone-only, so Android is not a finished product.
- **Web.** The app can technically open in a browser (`npm run web`), but reminders, purchases, Face ID, sharing and widgets don't work there.
- **Unused file:** `assets/android-icon-background.png` isn't referenced anywhere.
- **RevenueCat offering.** The RevenueCat dashboard setup is not finished. The app works around it (see section 7).

---

## 3. Screens

The app has three tabs at the bottom (**Today**, **Clovers**, **Highlights**) plus a few pop-up screens.

| Screen | What's on it | How you get there |
|---|---|---|
| **Today** (tab) | Your streak ("23-day streak" or "One good thing a day"), today's date, a settings gear, the big clover, a "Clover collected" line, today's entries, and the add form. | Opens by default. Also opened by the Today Clover widget, which brings up the keyboard ready to type. |
| **Clovers** (tab) | Month switcher, a calendar grid with a clover per day (a small number badge if a day has more than one entry), and a legend (Logged / Extra lucky / Missed). Tap a day to open a sheet with that day's entries. Future days and days before you started can't be tapped. | Second tab. Also opened by the Week and Calendar widgets. |
| **Highlights** (tab) | Month switcher, big clover count, best streak, gold clovers, the month's extra-lucky entries, and a "Share my month" button. | Third tab. |
| **Settings** | Clover+ card (if not bought), Notifications, Dark mode, Themes, Privacy (Face ID lock), Restore purchase, developer tools (dev builds only), privacy note, and links to Feedback and the Privacy Policy. | The gear on Today. |
| **Clover+ (paywall)** | The 3 Clover+ features, theme swatches, "Unlock everything · price", Restore purchase, "Not now". After buying: "You have Clover+". | The Clover+ card in Settings, tapping a locked theme or Face ID, or tapping a locked widget. |
| **Share my month** | A preview of the image, a "Hide all text" switch, a list to pick up to 3 entries, and a Share button. | "Share my month" on Highlights. |
| **Feedback** | Choose a type (bug, feature idea, other), write a message, send. It opens your email app to `cloverproductteam@gmail.com`; if that fails, it lets you copy or share the text. | "Feedback & Suggestions" link at the bottom of Settings. |

**Overlays** (appear on top of everything):
- **Opening animation:** a clover blooms on every launch.
- **Onboarding:** first launch only.
- **App lock:** "Clover is locked", when Face ID lock is on.
- **"Enjoying Clover?":** the review prompt.

---

## 4. Widgets

All widgets are iPhone-only. They update when you open the app, when entries, theme or Clover+ change, and whenever the app comes back to the foreground. Each widget is also given its contents for the next 7 midnights, so the day rolls over correctly even if you don't open the app.

| Widget | Size | What it shows | Tapping opens | Free / paid |
|---|---|---|---|---|
| **Today Clover** | Small | "Today", then 1 to 3 slightly tilted, overlapping clovers (one per entry today, maximum 3). Before you log: a pale clover and "Find a small win". After: "Keep noticing the little things". On a gold day the whole widget turns into a warm gold gradient. | Today, with the keyboard open | **Free** |
| **Clover Streak** | Small | "STREAK", your streak as a big number, and "days in a row" (or "day so far" / "Add a moment to begin"). | Today | Paid |
| **Clover Week** | Medium | "Your week": the last 7 days as clovers (gold for lucky days), and "Add something from today…" or "Another moment added to your collection". | Clovers | Paid |
| **Clover Calendar** | Large | This month: a clover symbol and number for each day. Sage = logged, gold = lucky, faint = missed; today's number is bold. | Clovers | Paid |
| **Clover Lock Screen** | Lock Screen (round and rectangular) | A small clover and your streak ("5", or "STREAK / 5 days"). | Today | Paid |

- **Without Clover+**, the paid widgets show a small "Clover+" tile, and tapping it opens the paywall.
- **Widget gallery descriptions:** these are set in `app.config.js`. Changing them needs a new app build.

---

## 5. Reminders

- **Two kinds:**
  - **Daily reminder:** off by default. The time defaults to 8:00 PM and changes in 15-minute steps in Settings. The time shows in 12- or 24-hour format to match your iPhone.
  - **Yesterday's reminder:** on by default, at 8:00 PM. It reminds you if *yesterday* has nothing logged, while you can still save your streak.
- **Skip logic:**
  - The daily reminder is skipped on days you've already logged.
  - The yesterday reminder is skipped if yesterday has something, and it never asks about a day before you installed the app (so nobody gets it on download day).
- **Rescheduling:** every time something relevant changes (an entry, a time, a switch) and every time the app is opened, all reminders are cleared and re-planned for the next 30 days. iPhones allow 64 scheduled at once.
  - If someone doesn't open the app for over 30 days, reminders stop until they open it again.
- **Daily messages** (14, shuffled; each is used once before any repeats, and the same one never shows two days in a row):
  1. What went right today?
  2. Any little wins today?
  3. Did anything go your way today?
  4. What made you smile today?
  5. One good thing, big or small?
  6. What's one thing you're grateful for today?
  7. Spotted any luck today?
  8. Before bed, what was good about today?
  9. Tiny moments count too, what was yours?
  10. Keep your streak growing!
  11. What are you glad happened today?
  12. Anything lucky happen today?
  13. Who or what made today a bit better?
  14. Take a second to save a good moment
- **Yesterday reminder:** the title is "A little reminder". The text is "You haven't logged yesterday's good thing yet. There's still time to keep your streak going."
- **Permission:** iPhone's notification permission is only asked on the last onboarding page ("Allow notifications"). The Settings switches never ask. If notifications are off, Settings explains this and offers "Open Settings".

---

## 6. Streaks and gold clovers

These are the exact rules in the code (`src/lib/store.tsx`, `src/lib/dates.ts`):

- **A clover:** any day with at least one entry.
- **What counts for a streak:** a day counts only if one of its entries was saved **on that day or the day after**. So you can catch up on yesterday, but filling in older days gives them a clover without rebuilding an old streak.
- **Editing yesterday:** editing an entry from yesterday refreshes its saved time, so it counts.
- **Current streak:** the number of counting days in a row, ending today. If today isn't logged yet, it ends yesterday, so your streak doesn't look broken in the morning.
- **Best streak (Highlights):** the longest run of counting days within that month, up to today.
- **Gold clover:** an entry marked "Extra lucky". A day is gold if *any* of its entries is lucky.
- **Gold clovers count (Highlights):** the number of gold days in the month.
- **Where gold shows:** the calendar, Highlights, the share image, the Week and Calendar widgets, and the Today Clover widget (which turns fully gold).

---

## 7. Purchases

- **Service:** RevenueCat (`react-native-purchases`), a service that handles App Store purchases and checks receipts.
- **Key:** the public iPhone key starts with `appl_`. It lives in the `.env` file as `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`. A RevenueCat Test Store key is also in that file, commented out; it must never be the active one in a release.
- **Product ID:** `clover_plus_lifetime`, a one-time (non-consumable) App Store purchase.
- **Entitlement:** `clover_plus`, RevenueCat's name for "has Clover+".
- **Price:** shown from the App Store in the buyer's currency. £3.99 is shown only while it loads.
- **What unlocks:** the 5 themes, Face ID lock and the 4 paid widgets, all instantly after buying.
- **How Clover decides you have Clover+:** if the `clover_plus` entitlement is active **or** you own `clover_plus_lifetime`.
  - The second check is a workaround: the product isn't attached to the entitlement and offering in RevenueCat yet. When RevenueCat's offering has a package, the app uses that instead, automatically.
- **Remembering it:** Clover+ is saved on the phone. It's re-checked with RevenueCat at launch and whenever RevenueCat reports a change, such as a refund or a purchase on another device. If the phone is offline, the last known status is kept.
- **What happens when buying:**
  - Cancelling closes quietly.
  - A "pending" purchase (for example, Ask to Buy) shows a note.
  - Errors show a friendly message.
  - "Already purchased" simply unlocks.
- **Restore:** "Restore purchase" is in Settings and on the paywall. It asks RevenueCat to look up the Apple ID's past purchases.

---

## 8. Data and privacy

- **What's stored:** your entries, settings, the day you started, Clover+ status, reminder-message order, onboarding and review-prompt status, and (development builds only) demo data.
- **Where:** on the phone only, in the app's local storage. It is included in normal iPhone/iCloud backups.
- **Widgets:** a copy of the widget contents (counts, dates, colours, but not your entry text) is shared with the widget through the app's private "app group" (`group.com.cloverproductteam.clover`).
- **Clover's own servers:** there are none. Clover has no account and no analytics or crash-reporting tools.
- **What leaves the phone:**
  - **RevenueCat** (and Apple) for purchases. RevenueCat receives an anonymous ID and purchase information. Your entries are never sent.
  - **Feedback** goes through *your* email app, only when you choose to send it.
  - **The Privacy Policy link** opens `https://clover-privacy-policy.teshmaru.workers.dev/` in the browser.
  - **Reminders** are scheduled on the phone. Nothing is pushed from a server.
- **Third-party services:** RevenueCat and Apple (App Store, StoreKit).
- **Important:** because RevenueCat collects purchase history, the App Store "Data Not Collected" label may not be accurate. See section 12.

---

## 9. Themes and design

**Themes** (all clovers stay clover-shaped; "gold" is the lucky colour):

| Theme | Plan | Feel | Background / main colour / clover |
|---|---|---|---|
| Classic | Free | Soft white and sage | `#FCFCFC` / deep green `#2F5D3A` / sage `#7FA37A` |
| Classic (dark) | Free | Dark green-black | `#111612` / pale sage `#A8C3A0` / sage `#7FA37A` |
| Golden hour | Clover+ | Soft white, honey gold | `#FCFCFC` / `#C9A04A` / `#A9B98A` |
| Forest | Clover+ | Deep, dark, moody | `#1F2E24` / `#A8C3A0` / `#A8C3A0` |
| Meadow | Clover+ | Bright, fresh green | `#6E9E6B` / `#DDEBD5` / `#DDEBD5` |
| Blossom | Clover+ | Pale pink, sage clovers | `#FCFCFC` / `#D9A5A8` / `#9DB59A` |
| Autumn | Clover+ | Soft white, rust, mustard | `#FCFCFC` / `#B86B45` / `#CFA040` |

The gold used for lucky days is `#D4A84B` in most themes.

- **Dark mode:** applies to Classic only. Light is the default. A Clover+ theme has its own fixed colours, so the Light/Dark/Automatic choice is greyed out while one is on. Onboarding always uses light Classic.
- **Fonts:** the iPhone's own system font (SF Pro) in four weights. Widgets use the rounded version (SF Pro Rounded) for numbers and labels.
- **Motion:** soft ease-in-out animations throughout, a light vibration on save, and respect for the iPhone's **Reduce Motion** setting (movement is swapped for simple fades).

---

## 10. Tech stack

- **Expo SDK 57**, a toolkit that builds the iPhone app from JavaScript. It sits on **React Native 0.86** and **React 19**.
- **Key libraries:**

| Library | What it's for |
|---|---|
| `expo-router` | Screens and navigation (each file in `src/app/` is a screen) |
| `@react-native-async-storage/async-storage` | Saving data on the phone |
| `expo-notifications` | Reminders |
| `expo-local-authentication` | Face ID / Touch ID lock |
| `expo-widgets` + `@expo/ui` | Home Screen and Lock Screen widgets |
| `react-native-purchases` | RevenueCat purchases |
| `react-native-reanimated` + `react-native-worklets` | Smooth animations |
| `react-native-keyboard-controller` | Keyboard that moves smoothly with the layout |
| `expo-haptics` | Light vibration on save |
| `react-native-svg` | Drawing the clovers |
| `react-native-view-shot` + `expo-sharing` | Making and sharing the month image |
| `expo-localization` | Detecting 12/24-hour time |
| `expo-store-review` | The App Store review pop-up |
| `expo-splash-screen`, `expo-status-bar` | Launch screen and status bar |
| `expo-dev-client` | Development builds |
| `expo-constants`, `expo-linking` | Used behind the scenes by Expo Router (not used directly) |
| `react-native-web` | Optional web version (not finished) |

**Folders:**

```
src/app/            Screens. (tabs)/ holds Today (index), Clovers (field) and Highlights
src/components/     Building blocks (clover drawing, entry form, onboarding, Today Clover widget…)
src/lib/            Logic: data store, dates, reminders, purchases, themes, motion, demo data
src/widgets/        The four paid widgets and the code that sends data to all widgets
assets/             App icon, splash image
app.json            Main app settings
app.config.js       Adds the widgets on top of app.json
eas.json            Build settings
.env                RevenueCat key
```

**Commands** (run in the project folder):

| What | Command |
|---|---|
| Run the app while developing | `npx expo start` (then open Clover on the iPhone, same Wi-Fi) |
| If the phone can't connect | `npx expo start --tunnel` |
| New development build (only after native changes) | `npx eas-cli@latest build --platform ios --profile development` |
| App Store build | `npx eas-cli@latest build --platform ios --profile production` |
| Build and send to App Store Connect | `npx eas-cli@latest build --platform ios --profile production --auto-submit` |
| Send an existing build | `npx eas-cli@latest submit --platform ios` |
| Health checks | `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` |

---

## 11. Settings and app config

- **App name:** Clover. On the App Store it's listed as "Clover: Count your luck" (set in App Store Connect, not the code).
- **Bundle ID:** `com.cloverproductteam.clover`
- **Version:** 1.0.0. The build number is handled by EAS and goes up automatically for each App Store build.
- **iPhone only** (`supportsTablet: false`), portrait only.
- **Icon:** `assets/icon.png` (1024 × 1024, no transparency).
- **Splash:** `assets/splash-icon.png` on dark green `#315F3D`.
- **Permissions and their wording:**
  - **Face ID:** "Allow Clover to use Face ID to keep your entries private."
  - **Photo library (add only):** "Allow Clover to save your month images to your photo library."
  - **Notifications:** asked by iOS with Apple's own wording. Remote (server) notifications are turned off.
- **Encryption:** marked as using no special encryption, which skips Apple's export questions.
- **Link scheme:** `clover://`, used by widgets to open the right screen.
- **Widgets:** added in `app.config.js` with their names, sizes and gallery descriptions.
- **eas.json build profiles:**
  - **development:** internal install on your registered iPhone.
  - **preview:** internal test build. Not used so far.
  - **production:** App Store, with build numbers going up automatically.
  - All profiles use Node 24.11.1, to match your computer.

---

## 12. Known issues and ideas for later

Ordered by importance.

1. **App Store privacy label.** RevenueCat sends purchase history and an anonymous ID to its servers, so "Data Not Collected" is probably wrong. Check RevenueCat's privacy guidance; it's likely "Purchases → Purchase History, for App Functionality, not tracking". Mention RevenueCat in the privacy policy too.
2. **Finish RevenueCat setup.** Once Apple approves the product, attach `clover_plus_lifetime` to the `clover_plus` entitlement and the current offering. The app works without this thanks to a workaround, but refunds and the dashboard rely on it. Also submit the in-app purchase together with the app version.
3. **No backup or export.** Entries only live on the phone and in its iCloud backup. If someone loses their phone without a backup, their history is gone. A worthwhile future feature.
4. **The wording "good thing" still appears.** It's in "+ Add a good thing", "One good thing a day", "· N good things" on Today, the share image ("my month of good things"), the Settings caption "A nudge to log today's good thing", the reminder "One good thing, big or small?", and the yesterday reminder. You've said you don't want this phrase in widgets; decide whether the app should match.
5. **Calendar widget not fully proven.** It used to show "Clover+" even after buying. It was made much lighter, on the theory that iOS was running out of room to draw it, but that hasn't been confirmed on a phone yet. It also uses a standard iOS clover symbol, which is slightly rounder than the app's heart-leaf clover.
6. **Visual checks not possible from code.** Dark mode and all 6 themes on every screen should be checked by eye on a real iPhone.
7. **Reminders stop after 30 days without opening the app.** They're only planned 30 days ahead.
8. **£3.99 fallback price** is hard-coded and shows briefly before the App Store price loads. It's harmless, but it would be wrong if you change the price.
9. **Android and web are unfinished.** Fine if Clover stays iPhone-only.
10. **Small tidy-ups:**
    - Delete the unused `assets/android-icon-background.png`.
    - The Today Clover widget's code lives in `src/components/`, while the other widgets are in `src/widgets/`. It would be tidier in one place.
