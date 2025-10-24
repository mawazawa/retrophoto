# RetroPhoto User Stories & Flow Diagrams
## Extensive User Journeys for 10 Diverse Personas

---

## Table of Contents
1. [Margaret Chen - Family Historian](#margaret-chen---family-historian)
2. [Jamal Thompson - Nostalgic Creator](#jamal-thompson---nostalgic-creator)
3. [Dr. Priya Sharma - Academic Researcher](#dr-priya-sharma---academic-researcher)
4. [Carlos Rodriguez - Immigrant Family Bridge](#carlos-rodriguez---immigrant-family-bridge)
5. [Linda Patterson - Grief Navigator](#linda-patterson---grief-navigator)
6. [Kenji Tanaka - Expat Entrepreneur](#kenji-tanaka---expat-entrepreneur)
7. [Aisha Mohammed - Museum Curator](#aisha-mohammed---museum-curator)
8. [Tyler Mitchell - Military Veteran](#tyler-mitchell---military-veteran)
9. [Sophia Martinez - DIY Wedding Planner](#sophia-martinez---diy-wedding-planner)
10. [Raj Patel - Digital Nomad](#raj-patel---digital-nomad)

---

# 1. Margaret Chen - Family Historian

## User Story 1.1: First Time Restoration (Free Tier)
**As** Margaret, a 68-year-old retired librarian,
**I want to** restore a damaged photo of my late husband without creating an account,
**So that** I can test the quality before committing to pay for more restorations.

### Acceptance Criteria
- ✅ Can access homepage and understand value proposition within 5 seconds
- ✅ Can upload photo via drag-and-drop or iPad photo picker
- ✅ Receives clear progress feedback during processing
- ✅ Can compare before/after with intuitive slider
- ✅ Can download restored photo without account creation
- ✅ Sees clear CTA to purchase more credits

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                    MARGARET'S FIRST VISIT                       │
└─────────────────────────────────────────────────────────────────┘

START: Margaret clicks Facebook ad from genealogy group
  │
  ├─> Lands on retrophotoai.com
  │   │
  │   ├─> Reads headline: "Restore Old Photos in Seconds"
  │   │   Subtext: "No account required. Try 1 free."
  │   │
  │   ├─> Sees large upload zone with example before/after
  │   │   "Drag photo here or tap to browse"
  │   │
  │   └─> Decision: Trust this site?
  │       │
  │       ├─> YES: Sees "No credit card required"
  │       │         Sees social proof: "127,492 photos restored"
  │       │         Proceeds to upload
  │       │
  │       └─> NO: Scrolls to read more
  │               Sees "How It Works" (3 steps)
  │               Sees "Your photos auto-delete in 24h"
  │               Returns to upload
  │
  ├─> Taps "Tap to browse" (iPad photos picker opens)
  │   │
  │   ├─> Browses to "Family Archive" album
  │   ├─> Selects photo: "Dad_1952_damaged.jpg"
  │   └─> Picker closes, photo appears in upload zone
  │
  ├─> File validation (client-side)
  │   │
  │   ├─> ✅ JPEG, 8.2MB, 2400×3000px → Valid
  │   ├─> Shows thumbnail preview
  │   └─> "Upload & Restore" button appears (green, prominent)
  │
  ├─> Taps "Upload & Restore" button
  │   │
  │   ├─> Upload progress bar (0% → 100% in 2.3 seconds)
  │   │   "Uploading your photo..."
  │   │
  │   ├─> AI processing animation (shimmer effect)
  │   │   "Restoring photo... 5 seconds remaining"
  │   │   (Shows rotating tips: "Our AI removes scratches, fades, tears")
  │   │
  │   └─> Processing completes (5.8 seconds total)
  │       Success animation (subtle confetti, respectful for age)
  │
  ├─> Redirects to result page: /result/[sessionId]
  │   │
  │   ├─> Before/after comparison slider (default: 50% position)
  │   │   │
  │   │   ├─> Margaret drags slider left (sees original)
  │   │   ├─> Drags slider right (sees restored)
  │   │   └─> Gasps: "I can see Dad's eyes clearly!"
  │   │
  │   ├─> Zoom controls appear
  │   │   │
  │   │   ├─> Taps "+" button (zooms to 200%)
  │   │   ├─> Pinches to zoom to face (300%)
  │   │   └─> Sees detail restored (facial features clear)
  │   │
  │   └─> Satisfied with quality
  │       Scrolls to bottom
  │
  ├─> Sees action buttons:
  │   │
  │   ├─> "Download Restored Photo" (primary CTA)
  │   ├─> "Share" (iOS share sheet)
  │   └─> "Restore Another Photo" (secondary CTA)
  │
  ├─> Taps "Download Restored Photo"
  │   │
  │   ├─> Photo saves to iPad Photos app
  │   ├─> Toast notification: "Saved to Photos"
  │   └─> Margaret opens Photos app to verify
  │
  ├─> Returns to RetroPhoto tab
  │   │
  │   └─> Sees banner: "You've used your 1 free restoration"
  │       │
  │       ├─> "Restore 150 family photos?"
  │       ├─> "Get 10 credits for $9.99 (just $1 per photo)"
  │       └─> "Buy Credits" button
  │
  ├─> Taps "Buy Credits"
  │   │
  │   ├─> Stripe checkout opens (guest checkout enabled)
  │   │   │
  │   │   ├─> Enters email: margaret.chen@gmail.com
  │   │   ├─> Enters card info (Apple Pay available but Margaret uses card)
  │   │   └─> Confirms purchase: $9.99
  │   │
  │   └─> Redirects back to RetroPhoto
  │       "Payment successful! You have 10 credits."
  │
  ├─> Taps "Restore Another Photo"
  │   │
  │   ├─> Returns to homepage (now shows "Credits: 10")
  │   ├─> Uploads next photo: "Mom_1948_wedding.jpg"
  │   └─> Process repeats (no quota error this time)
  │
  └─> END: Margaret restores 3 more photos today
      Plans to return tomorrow for more
      Shares in Facebook genealogy group that evening

┌─────────────────────────────────────────────────────────────────┐
│                         KEY METRICS                             │
├─────────────────────────────────────────────────────────────────┤
│ Time to first interaction: 12 seconds (reading headline)        │
│ Time to upload: 18 seconds (browsing photos)                    │
│ Time to result: 24 seconds (upload + processing)                │
│ Time to purchase decision: 3 minutes (examining result)         │
│ Conversion rate: 100% (free → paid)                             │
│ Credits used first day: 4 credits                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Story 1.2: Returning User - Batch Restoration Session
**As** Margaret, a returning paid user,
**I want to** restore multiple photos in a single session,
**So that** I can efficiently work through my family archive.

### Acceptance Criteria
- ✅ Session persists across browser refreshes
- ✅ Credit balance visible at all times
- ✅ Can restore multiple photos sequentially without re-authentication
- ✅ History of restored photos accessible (past 24 hours)

### Flow Diagram
```
START: Margaret opens Safari on iPad (Sunday afternoon)
  │
  ├─> Navigates to retrophotoai.com (bookmark saved)
  │   │
  │   ├─> Session cookie restored
  │   ├─> Top nav shows: "Credits: 6 remaining"
  │   └─> Sees "Welcome back!" message
  │
  ├─> Uploads photo batch (10 photos selected)
  │   │
  │   ├─> Selects multiple photos from iPad picker
  │   │   (Feature: Batch upload for paid users)
  │   │
  │   ├─> Upload queue shows:
  │   │   "10 photos selected. 6 credits available."
  │   │   "Restore first 6 now, buy more for remaining 4?"
  │   │
  │   └─> Taps "Restore 6 Photos"
  │
  ├─> Sequential processing (not parallel, to avoid overwhelming)
  │   │
  │   ├─> Photo 1/6 processing... ✅ Complete (4 sec)
  │   ├─> Photo 2/6 processing... ✅ Complete (6 sec)
  │   ├─> Photo 3/6 processing... ✅ Complete (5 sec)
  │   ├─> Photo 4/6 processing... ✅ Complete (7 sec)
  │   ├─> Photo 5/6 processing... ✅ Complete (5 sec)
  │   └─> Photo 6/6 processing... ✅ Complete (6 sec)
  │       Total time: 33 seconds
  │
  ├─> Batch complete notification
  │   │
  │   ├─> "All 6 photos restored!"
  │   ├─> "Download All" button (ZIP file)
  │   ├─> "View Gallery" button
  │   └─> "Restore 4 More?" (purchase prompt)
  │
  ├─> Taps "View Gallery"
  │   │
  │   ├─> Grid view of all 6 results
  │   │   [Thumb 1] [Thumb 2] [Thumb 3]
  │   │   [Thumb 4] [Thumb 5] [Thumb 6]
  │   │
  │   ├─> Taps thumbnail 1
  │   │   Opens comparison view
  │   │   Reviews quality
  │   │   Swipes to next →
  │   │
  │   └─> Reviews all 6 photos (satisfied)
  │
  ├─> Returns to gallery
  │   Taps "Download All"
  │   │
  │   ├─> ZIP file generated (2 seconds)
  │   ├─> Downloads to iPad
  │   └─> "Saved 6 photos to Files app"
  │
  └─> END: Margaret takes a break
      Credits remaining: 0
      Plans to purchase more next weekend

┌─────────────────────────────────────────────────────────────────┐
│                         KEY METRICS                             │
├─────────────────────────────────────────────────────────────────┤
│ Session duration: 8 minutes                                      │
│ Photos restored: 6                                               │
│ Average time per photo: 1.3 minutes (including review)          │
│ Satisfaction: High (downloaded all results)                      │
│ Retention: Will return (ran out of credits, knows to buy more)  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2. Jamal Thompson - Nostalgic Creator

## User Story 2.1: Viral Content Creation (Speed-Focused)
**As** Jamal, a 24-year-old social media manager,
**I want to** restore a vintage photo in under 30 seconds and share it immediately,
**So that** I can create daily content for my 147K Instagram followers.

### Acceptance Criteria
- ✅ Mobile-first experience (iOS)
- ✅ Processing time <6 seconds
- ✅ Native iOS share sheet integration
- ✅ Automatic before/after GIF generation for Stories
- ✅ Deep link back to RetroPhoto (referral tracking)

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                 JAMAL'S DAILY WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

START: Jamal at Brooklyn flea market (Saturday 11am)
  │
  ├─> Finds vintage photo at antique stall ($5)
  │   Photos circa 1970s family portrait, slight fading
  │
  ├─> Snaps photo with iPhone 15 Pro (macro mode)
  │   Saves to Photos app
  │
  ├─> Opens Safari (retrophotoai.com bookmarked)
  │   │
  │   ├─> Homepage loads instantly (PWA cached)
  │   ├─> Taps upload zone (one tap)
  │   └─> Photo picker opens (iOS native)
  │
  ├─> Selects just-captured photo (0.5 seconds)
  │   │
  │   ├─> Photo appears in upload zone
  │   └─> Taps "Upload & Restore" (already highlighted)
  │
  ├─> Upload + Processing (standing at flea market)
  │   │
  │   ├─> Upload: 1.2 seconds (iPhone 5G)
  │   ├─> AI processing: 4.8 seconds
  │   └─> Total: 6.0 seconds ✅
  │       (Jamal checks Instagram notifications while waiting)
  │
  ├─> Result page loads
  │   │
  │   ├─> Comparison slider (Jamal doesn't move it—trusts AI)
  │   ├─> Looks good at first glance
  │   └─> Scrolls to "Share" button immediately
  │
  ├─> Taps "Share" button
  │   │
  │   ├─> iOS share sheet opens:
  │   │   [Instagram] [TikTok] [Twitter] [Messages] [More...]
  │   │
  │   ├─> Taps "Instagram"
  │   │   │
  │   │   ├─> Instagram opens (feed post draft)
  │   │   │   Photo: Restored image
  │   │   │   Caption: "Found this gem at a flea market. Restored in 6 seconds with AI 🔥"
  │   │   │
  │   │   └─> Posts immediately (no edits)
  │   │
  │   └─> Returns to Safari
  │
  ├─> Sees "Share to Stories?" prompt
  │   │
  │   ├─> Taps "Yes, share before/after GIF"
  │   │   │
  │   │   ├─> GIF auto-generated (3 seconds)
  │   │   │   Before → After reveal animation (3 sec loop)
  │   │   │
  │   │   ├─> Instagram Stories opens
  │   │   │   GIF loaded
  │   │   │   Default sticker: "Restored by RetroPhoto"
  │   │   │
  │   │   ├─> Jamal adds text: "This is wild 😱"
  │   │   └─> Posts to Stories
  │   │
  │   └─> 147K followers see it
  │       │
  │       ├─> 12K views in first hour
  │       ├─> 340 DMs: "What app is this?"
  │       └─> Jamal responds: "RetroPhoto.ai 🔥"
  │
  ├─> Free tier exhausted notification
  │   │
  │   ├─> "You've used your 1 free restore"
  │   ├─> "Want to restore more? $9.99 for 10 credits"
  │   └─> Jamal: "Bet. I'll use this every week."
  │
  ├─> Taps "Buy Credits"
  │   │
  │   ├─> Apple Pay sheet opens (guest checkout)
  │   ├─> Face ID authentication
  │   └─> Payment confirmed (2 seconds total)
  │       "You have 10 credits"
  │
  └─> END: Jamal pockets phone, continues shopping
      Will restore 3 more photos at home tonight
      Plans TikTok tutorial: "Best AI photo tool for creators"

┌─────────────────────────────────────────────────────────────────┐
│                         KEY METRICS                             │
├─────────────────────────────────────────────────────────────────┤
│ Total time (photo → Instagram post): 24 seconds ✅              │
│ Processing time: 6 seconds ✅                                   │
│ Payment time: 2 seconds (Apple Pay) ✅                          │
│ Viral coefficient: 12K story views → ~50 clicks → 5 signups     │
│ CAC (Customer Acquisition Cost): $0 (organic)                   │
│ Lifetime value: $300+ (high frequency)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Story 2.2: Content Creation Tutorial (Referral Driver)
**As** Jamal,
**I want to** create a TikTok tutorial showing my workflow,
**So that** I can provide value to my followers and drive referrals.

### Flow Diagram
```
START: Jamal at home (Sunday evening)
  │
  ├─> Opens TikTok app
  │   Idea: "How I restore vintage photos in 30 seconds"
  │
  ├─> Shoots TikTok video (iPhone tripod setup)
  │   │
  │   ├─> Scene 1: Shows vintage photo (damaged)
  │   │   "Found this at a flea market. Watch this..."
  │   │
  │   ├─> Scene 2: Screen recording of RetroPhoto
  │   │   │
  │   │   ├─> Opens retrophotoai.com
  │   │   ├─> Uploads photo
  │   │   ├─> 6-second processing (real-time, no speed-up)
  │   │   └─> Result appears
  │   │       "YOOO look at the detail 🔥"
  │   │
  │   ├─> Scene 3: Side-by-side comparison
  │   │   Slider animation (Jamal manually drags)
  │   │   "This is crazy good"
  │   │
  │   └─> Scene 4: CTA
  │       "Link in bio ⬆️ Only $10 for 10 photos"
  │       Shows RetroPhoto logo
  │
  ├─> Edits video (CapCut)
  │   │
  │   ├─> Adds captions, transitions
  │   ├─> Duration: 38 seconds (TikTok optimal)
  │   └─> Exports in 1080p
  │
  ├─> Posts to TikTok
  │   │
  │   ├─> Caption: "Best AI photo restoration for creators 🔥 #PhotoRestoration #AI #VintagePhotos"
  │   ├─> Hashtags: #ContentCreator #SideHustle #Photography
  │   └─> Link in bio updated: retrophotoai.com?ref=jamal
  │
  ├─> Video performance (first 48 hours)
  │   │
  │   ├─> Views: 127K (algorithm push)
  │   ├─> Likes: 8.2K
  │   ├─> Comments: 340
  │   │   │
  │   │   ├─> "What's the app called?"
  │   │   ├─> "Does it work on Android?"
  │   │   ├─> "Just tried it, this is fire 🔥"
  │   │   └─> Jamal replies to top 20 comments
  │   │
  │   └─> Link clicks: 3,200
  │       Signups: 240 (7.5% conversion)
  │       Paid users: 18 (7.5% of signups)
  │       Revenue from referrals: $179.82
  │
  └─> END: Jamal becomes unofficial brand ambassador
      RetroPhoto team notices traffic spike
      Reaches out with affiliate offer (20% commission)

┌─────────────────────────────────────────────────────────────────┐
│                      REFERRAL IMPACT                            │
├─────────────────────────────────────────────────────────────────┤
│ Total referrals from one video: 240 signups                     │
│ Paid conversions: 18 users                                      │
│ Revenue generated: $179.82                                       │
│ CAC: $0 (organic UGC)                                            │
│ Viral coefficient: 1 user → 240 new users                       │
│ Long-term: Jamal's affiliate link drives 50+ signups/month      │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. Dr. Priya Sharma - Academic Researcher

## User Story 3.1: Batch Processing for Research (API Use Case)
**As** Dr. Priya Sharma, a Harvard history professor,
**I want to** batch restore 500 archival photos with consistent quality,
**So that** I can publish my research with professional-grade images.

### Acceptance Criteria
- ✅ Batch upload (50+ photos at once)
- ✅ Consistent quality across all restorations
- ✅ Metadata preservation (EXIF, timestamps)
- ✅ Export CSV log (file names, processing time, quality scores)
- ✅ API access for automation (future)

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│              PRIYA'S RESEARCH WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

START: Priya receives digitized photos from Boston Public Library
  │
  ├─> Downloads ZIP file (500 archival photos, 1920s-1950s)
  │   Extracts to folder: "BPL_Immigration_Photos"
  │
  ├─> Reviews sample photos
  │   │
  │   ├─> Notes: Severe fading, some tears, inconsistent quality
  │   ├─> Concern: Need consistent restoration for academic publication
  │   └─> Budget: $2,000 allocated for photo restoration
  │
  ├─> Researches AI restoration tools
  │   │
  │   ├─> Google search: "batch photo restoration API academic"
  │   ├─> Finds RetroPhoto documentation
  │   └─> Reads: "Batch processing available. API in development."
  │
  ├─> Tests with free restore
  │   │
  │   ├─> Navigates to retrophotoai.com
  │   ├─> Uploads 1 sample photo: "BPL_001_1922.jpg"
  │   │   │
  │   │   ├─> Processing: 5.2 seconds
  │   │   ├─> Result: Excellent quality
  │   │   └─> Downloads restored image
  │   │
  │   └─> Compares with professional restoration quote
  │       RetroPhoto: $0.99/photo × 500 = $495
  │       Professional service: $5,000
  │       Decision: RetroPhoto is viable
  │
  ├─> Reads documentation
  │   │
  │   ├─> Privacy policy: "24-hour auto-deletion" ✅
  │   ├─> Terms of service: "Commercial use allowed" ✅
  │   ├─> Quality standards: "Validated against FADGI guidelines" ✅
  │   └─> Citation example: "Restored using RetroPhoto AI (v1.0)" ✅
  │
  ├─> Emails support: support@retrophotoai.com
  │   │
  │   Subject: "Bulk purchase for academic research"
  │   Body:
  │   "I'm a Harvard professor researching early 20th-century immigration.
  │   I need to restore 500 archival photos. Can I purchase 500 credits
  │   with institutional invoice? I also need API access for future projects."
  │   │
  │   └─> Response (24 hours):
  │       "Hi Dr. Sharma, we'd love to support your research! We can offer:
  │       - 500 credits for $450 (10% academic discount)
  │       - Institutional invoice (NET-30 payment terms)
  │       - Early API access (beta, documentation included)
  │       Let's schedule a call to discuss."
  │
  ├─> Call with RetroPhoto team (30 minutes)
  │   │
  │   ├─> Discusses research needs
  │   ├─> Requests quality report (FADGI scores)
  │   ├─> Negotiates: 500 credits + API access = $500
  │   └─> Agreement reached
  │       Custom contract sent via DocuSign
  │
  ├─> Contract signed, invoice received
  │   │
  │   ├─> Priya submits to Harvard finance department
  │   ├─> Payment processed (NET-30, 4 weeks)
  │   └─> Credits added to account: 500 credits
  │
  ├─> Batch processing begins (Week 1)
  │   │
  │   ├─> Uploads 50 photos (daily batch)
  │   │   │
  │   │   ├─> Day 1: 50 photos → 50 credits used
  │   │   ├─> Day 2: 50 photos → 50 credits used
  │   │   ├─> Day 3: 50 photos → 50 credits used
  │   │   ├─> Day 4: 50 photos → 50 credits used
  │   │   └─> Day 5: 50 photos → 50 credits used
  │   │
  │   └─> Week 1 complete: 250 photos restored
  │
  ├─> Quality review (Week 2)
  │   │
  │   ├─> Priya opens 25 random samples
  │   │   │
  │   │   ├─> Checks facial detail restoration
  │   │   ├─> Validates historical accuracy (no over-processing)
  │   │   ├─> Compares with originals (metadata preserved)
  │   │   └─> Satisfied: Quality is consistent
  │   │
  │   └─> Continues batch processing
  │       Week 2: 250 more photos restored
  │       Total: 500 photos complete
  │
  ├─> Exports CSV report
  │   │
  │   ├─> File: "restoration_log.csv"
  │   │   Columns:
  │   │   - Original filename
  │   │   - Processing time (seconds)
  │   │   - Output resolution
  │   │   - Quality score (0-100)
  │   │   - Restoration date
  │   │
  │   └─> Includes in research methodology appendix
  │
  ├─> API access granted (beta)
  │   │
  │   ├─> Documentation: docs.retrophotoai.com/api
  │   ├─> API key provided: rp_live_abc123xyz...
  │   │
  │   └─> Priya writes Python script for future projects:
  │       ```python
  │       import requests
  │
  │       API_KEY = "rp_live_abc123xyz..."
  │       files = ["photo1.jpg", "photo2.jpg", ...]
  │
  │       for file in files:
  │           response = requests.post(
  │               "https://api.retrophotoai.com/v1/restore",
  │               headers={"Authorization": f"Bearer {API_KEY}"},
  │               files={"photo": open(file, "rb")}
  │           )
  │           print(response.json())
  │       ```
  │
  └─> END: Research published
      │
      ├─> Paper citation (methodology section):
      │   "Archival photos restored using RetroPhoto AI (v1.0, 2025).
      │   Processing time averaged 5.4 seconds per image (n=500).
      │   Quality scores ranged 87-96 (FADGI 4-star equivalent)."
      │
      ├─> Presents at American Historical Association conference
      │   Mentions RetroPhoto in Q&A
      │   3 other professors inquire about service
      │
      └─> Lifetime value: $500 initial + $200/year ongoing research
          Academic referrals: 5+ professors (institutional sales funnel)

┌─────────────────────────────────────────────────────────────────┐
│                         KEY METRICS                             │
├─────────────────────────────────────────────────────────────────┤
│ Total photos restored: 500                                       │
│ Total revenue: $500 (custom contract)                            │
│ Processing time: 45 minutes total (500 × 5.4s avg)              │
│ Quality satisfaction: 100% (all photos used in publication)     │
│ Referral value: 5 academic contacts → $2,500 potential revenue  │
│ Long-term: API beta tester, case study, academic credibility    │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4. Carlos Rodriguez - Immigrant Family Bridge

## User Story 4.1: Private Family Photo Restoration (Privacy-Focused)
**As** Carlos, a 35-year-old software engineer,
**I want to** restore irreplaceable family photos from Colombia with guaranteed privacy,
**So that** I can preserve my father's memories as his dementia progresses.

### Acceptance Criteria
- ✅ Privacy policy prominently displayed (24-hour auto-deletion)
- ✅ No account required (fingerprint-based credits)
- ✅ Server-side processing (no client-side AI, no data leakage)
- ✅ High-quality restoration (these are irreplaceable)
- ✅ Batch download (all 50 photos at once)

### Flow Diagram
```
START: Carlos's father diagnosed with early-onset dementia
  │
  ├─> Carlos visits parents' house (Miami)
  │   Retrieves box of photos from Colombia (50 photos, 1960s-1990s)
  │   Many damaged from humidity
  │
  ├─> Scans photos at home (Epson scanner, 600 DPI)
  │   Saves to folder: "Familia_Colombia_Restoration"
  │
  ├─> Researches restoration services
  │   │
  │   ├─> Googles: "private photo restoration no cloud storage"
  │   ├─> Finds RetroPhoto via Product Hunt
  │   ├─> Reads comments: "They delete photos in 24 hours"
  │   └─> Clicks through to retrophotoai.com
  │
  ├─> Lands on homepage
  │   │
  │   ├─> Immediately looks for privacy information
  │   ├─> Sees footer link: "Privacy Policy"
  │   ├─> Clicks and reads carefully (5 minutes)
  │   │   │
  │   │   ├─> Key points:
  │   │   │   "Photos auto-delete in 24 hours"
  │   │   │   "No third-party sharing"
  │   │   │   "Server-side processing only"
  │   │   │   "No AI training on your photos without opt-in"
  │   │   │
  │   │   └─> Satisfied: Privacy standards meet expectations
  │   │
  │   └─> Returns to homepage
  │
  ├─> Tests with 1 photo (free tier)
  │   │
  │   ├─> Uploads: "Papa_1972.jpg"
  │   ├─> Processing: 5.1 seconds
  │   ├─> Result: Excellent quality
  │   │   │
  │   │   ├─> Compares with Remini (tests competitor)
  │   │   │   Remini: Good but over-smoothed (AI artifact)
  │   │   │   RetroPhoto: Natural, preserves grain
  │   │   │
  │   │   └─> Decision: RetroPhoto is superior
  │   │
  │   └─> Downloads restored photo
  │       Verifies in Photoshop (pixel-peeping)
  │
  ├─> Decides to purchase
  │   │
  │   ├─> Sees pricing: "$9.99 for 10 credits"
  │   ├─> Calculates: 50 photos = 50 credits = ~$50
  │   ├─> Looks for bulk pricing
  │   │   │
  │   │   └─> Doesn't see option
  │   │       Emails support:
  │   │       "Do you offer bulk pricing for 50 photos?"
  │   │
  │   └─> Support responds (2 hours):
  │       "We can offer 50 credits for $45 (10% discount).
  │       Reply to confirm and we'll send a custom checkout link."
  │
  ├─> Confirms purchase
  │   │
  │   ├─> Receives custom Stripe checkout link
  │   ├─> Pays $45 with credit card
  │   └─> Credits added: 50 credits
  │
  ├─> Batch restoration (Saturday morning)
  │   │
  │   ├─> Uploads all 50 photos (via batch upload)
  │   │   │
  │   │   ├─> Upload progress: 0% → 100% (1.2 minutes)
  │   │   ├─> AI processing queue: 50 photos
  │   │   └─> Estimated time: 4.5 minutes
  │   │
  │   ├─> Processing completes
  │   │   │
  │   │   ├─> 50/50 photos restored successfully
  │   │   └─> Total time: 4 minutes 38 seconds
  │   │
  │   └─> Reviews gallery
  │       │
  │       ├─> Opens 10 random photos (spot check)
  │       ├─> Quality: Consistent, excellent
  │       └─> Emotional moment: Sees father's young face restored
  │
  ├─> Downloads all photos
  │   │
  │   ├─> Clicks "Download All (ZIP)"
  │   ├─> ZIP file: 187 MB, 50 photos
  │   └─> Saves to: "Familia_Colombia_Restored"
  │
  ├─> Creates memory album for father
  │   │
  │   ├─> Imports to Shutterfly
  │   ├─> Creates photo book (80 pages)
  │   │   │
  │   │   ├─> Layout: Side-by-side before/after
  │   │   ├─> Captions: Stories father told
  │   │   └─> Dedication: "Para mi papá"
  │   │
  │   └─> Orders 3 copies ($120)
  │       One for father, one for Carlos, one for sister
  │
  ├─> Shares digital copies with family
  │   │
  │   ├─> Creates private Google Photos album
  │   ├─> Invites 3 siblings
  │   └─> WhatsApp message to family group:
  │       "Restauré todas las fotos de Colombia. Las tienen en Google Photos."
  │       (I restored all the photos from Colombia. You have them in Google Photos.)
  │
  └─> END: Photo books arrive
      │
      ├─> Father's reaction (emotional):
      │   Opens book, recognizes faces from 50 years ago
      │   Points to his father (Carlos's grandfather)
      │   "Ese es mi papá" (That's my dad)
      │   First time in months he's been lucid
      │
      ├─> Carlos posts on Hacker News:
      │   "Show HN: I restored my dad's photos from Colombia with this tool"
      │   Story goes to front page (187 points)
      │   100+ comments: "This is what tech should be used for"
      │
      └─> Lifetime value: $45 initial + word-of-mouth referrals
          Emotional testimonial: RetroPhoto requests permission to share story
          Carlos agrees (anonymous, for case study)

┌─────────────────────────────────────────────────────────────────┐
│                         EMOTIONAL IMPACT                        │
├─────────────────────────────────────────────────────────────────┤
│ Quality: 10/10 (met perfectionist standards)                    │
│ Privacy: 10/10 (24-hour deletion was key decision factor)       │
│ Speed: 10/10 (50 photos in under 5 minutes)                     │
│ Emotional value: Priceless (father's lucid moment)              │
│ Brand loyalty: Lifetime (Carlos becomes advocate)               │
│ Referral impact: HN post → 500+ visits → 30 signups             │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. Linda Patterson - Grief Navigator

## User Story 5.1: Urgent Memorial Photo Restoration
**As** Linda, a 52-year-old ICU nurse,
**I want to** restore my late mother's photos in minutes (not days),
**So that** I can create memorial displays for the funeral next week.

### Acceptance Criteria
- ✅ Zero-friction UX (no account creation)
- ✅ Processing time <10 seconds per photo
- ✅ Simple download (no complicated export process)
- ✅ Mobile-optimized (Linda uses iPhone)
- ✅ Emotional sensitivity (no aggressive upsells)

### Flow Diagram
```
START: Linda's mother passed away 6 days ago
      Funeral is in 2 days
      Linda is overwhelmed and emotionally fragile
  │
  ├─> Googles: "restore old photos fast near me" (iPhone)
  │   │
  │   ├─> Sees local shop: "3-5 business days" → Too slow
  │   ├─> Sees Walgreens: "In-store restoration" → Closed Sundays
  │   └─> Sees RetroPhoto ad: "Restore photos in seconds"
  │       Clicks link
  │
  ├─> Lands on retrophotoai.com (mobile)
  │   │
  │   ├─> Headline: "Restore Old Photos in Seconds"
  │   │   Subtext: "No account required. Try 1 free."
  │   │
  │   ├─> Sees simple upload button (large, centered)
  │   └─> No overwhelming options (simple = good for grief state)
  │
  ├─> Takes photo of mother's wedding photo with iPhone
  │   (Physical photo from box, 1965, severely faded)
  │   │
  │   ├─> Opens Camera app
  │   ├─> Photographs the physical photo
  │   └─> Saves to Photos app
  │
  ├─> Returns to Safari (RetroPhoto tab still open)
  │   │
  │   ├─> Taps "Tap to browse"
  │   ├─> Selects just-captured photo
  │   └─> Photo appears in upload zone
  │
  ├─> Taps "Upload & Restore" button
  │   │
  │   ├─> Upload: 1.8 seconds (slow home WiFi)
  │   ├─> Processing: 6.2 seconds
  │   │   │
  │   │   └─> Linda holds breath, anxious
  │   │       "Please work... I need this..."
  │   │
  │   └─> Result loads
  │
  ├─> Sees before/after comparison
  │   │
  │   ├─> Drags slider to see original (left)
  │   ├─> Drags slider to see restored (right)
  │   │   │
  │   │   └─> Mother's face is clear for first time in years
  │   │       Linda starts crying
  │   │       "I can see her smile..."
  │   │
  │   └─> Sits in silence for 2 minutes
  │       Processes emotion
  │
  ├─> Scrolls down to download button
  │   │
  │   ├─> Taps "Download Restored Photo"
  │   ├─> Photo saves to iPhone Photos app
  │   └─> Toast: "Saved to Photos"
  │
  ├─> Opens Photos app to verify
  │   │
  │   ├─> Photo is there (high resolution)
  │   ├─> Zooms in on mother's face
  │   └─> Emotional release (cathartic crying)
  │
  ├─> Returns to RetroPhoto (Safari tab)
  │   │
  │   └─> Sees message:
  │       "You've used your 1 free restoration."
  │       "Need to restore more photos?"
  │       "$9.99 for 10 credits (just $1 per photo)"
  │       │
  │       └─> Linda thinks: "I have 29 more photos for the funeral.
  │           I need 30 credits total. I'll buy 3 packs."
  │
  ├─> Taps "Buy Credits"
  │   │
  │   ├─> Checkout page: "$9.99 for 10 credits"
  │   │   │
  │   │   ├─> Looks for "Buy 30" option (doesn't see it)
  │   │   └─> Proceeds with 10 credits (plans to buy 2 more)
  │   │
  │   ├─> Enters email: linda.patterson@gmail.com
  │   ├─> Enters card: **** 4532
  │   ├─> Confirms: $9.99
  │   └─> Payment success: "You have 10 credits"
  │
  ├─> Restores next 10 photos (session 1)
  │   │
  │   ├─> Uploads batch of 10 (family photos, 1970s-1980s)
  │   ├─> Processing time: 1 minute 8 seconds (all 10 photos)
  │   └─> Downloads all (ZIP file)
  │
  ├─> Purchases 10 more credits (2nd purchase)
  │   Restores next 10 photos
  │
  ├─> Purchases 10 more credits (3rd purchase)
  │   Restores final 9 photos (1 credit left over)
  │   │
  │   └─> Total spent: $29.97 for 30 credits
  │       29 photos restored + 1 credit remaining
  │
  ├─> Downloads all restored photos
  │   │
  │   ├─> Transfers to laptop (AirDrop)
  │   └─> Creates memorial slideshow in iMovie
  │       (30 photos, 3-second intervals, soft music)
  │
  ├─> Prints photos at Walgreens (1-hour pickup)
  │   │
  │   ├─> Selects 12 photos for funeral display boards
  │   ├─> Orders 8×10 prints ($2.99 each)
  │   └─> Picks up same day
  │
  └─> Funeral service (2 days later)
      │
      ├─> Memorial slideshow plays during visitation
      │   Attendees: "These photos are beautiful"
      │   Linda: "I restored them with AI. It only took 30 minutes."
      │
      ├─> Siblings thank Linda for preserving memories
      │   Requests: "Can you send me the digital files?"
      │   Linda shares Google Photos album
      │
      └─> END: One week after funeral
          │
          ├─> Linda writes email to RetroPhoto support:
          │   │
          │   Subject: "Thank you"
          │   Body:
          │   "I just wanted to say thank you. My mom passed away last week
          │   and I needed to restore her photos for the funeral. Your service
          │   was so easy to use during the hardest week of my life.
          │   I was able to see my mom's face clearly one more time.
          │   Thank you for making this tool simple when I couldn't handle
          │   anything complicated. - Linda"
          │   │
          │   └─> RetroPhoto team responds:
          │       "Dear Linda, we're so sorry for your loss. We're honored
          │       that RetroPhoto helped you preserve your mother's memory.
          │       If you need anything else, please don't hesitate to reach out."
          │
          └─> Lifetime value: $30 (one-time, high-emotion purchase)
              Impact: Testimonial used in marketing (with permission)
              "When my mother passed away, I needed to restore her photos
              for the funeral. RetroPhoto made it simple and fast during
              the hardest week of my life." - Linda P., Nashville

┌─────────────────────────────────────────────────────────────────┐
│                      EMOTIONAL JOURNEY                          │
├─────────────────────────────────────────────────────────────────┤
│ Emotional state: Grief, overwhelmed, time pressure              │
│ UX needs: Zero friction, fast, simple, no account required      │
│ Key moment: Seeing mother's restored face (cathartic)           │
│ Decision factor: Speed (funeral in 2 days)                      │
│ Satisfaction: 10/10 (met urgent need with empathy)              │
│ Brand perception: "They understood what I needed"               │
└─────────────────────────────────────────────────────────────────┘
```

---

# 6. Kenji Tanaka - Expat Entrepreneur

## User Story 6.1: High-Volume Content Creation (Business Use)
**As** Kenji, a 29-year-old entrepreneur in Tokyo,
**I want to** restore 100+ vintage Japanese photos per month at scale,
**So that** I can create consistent brand content for my Instagram marketing.

### Acceptance Criteria
- ✅ Bulk credit purchase (100+ credits)
- ✅ Fast batch processing
- ✅ API access for automation (future)
- ✅ Consistent quality for brand aesthetics
- ✅ Mobile workflow (iPhone primary device)

### Flow Diagram
```
START: Kenji runs Japanese snack subscription box startup
      Instagram: 127K followers
      Aesthetic: Vintage Japanese photos + modern product shots
  │
  ├─> Content creation workflow (current):
  │   │
  │   ├─> Saturday: Visit Tokyo flea markets
  │   │   Buys 20-30 vintage photos (¥500-1000 each = $3-7)
  │   │
  │   ├─> Sunday: Photographs physical photos with iPhone
  │   │   Manually edits in Lightroom Mobile (30 min/photo)
  │   │   Result: Inconsistent quality, time-consuming
  │   │
  │   └─> Posts 5-7 photos per week
  │       Instagram engagement: High (brand aesthetic resonates)
  │
  ├─> Discovers RetroPhoto
  │   │
  │   ├─> Source: Product Hunt (browsing on Monday morning)
  │   ├─> Reads description: "AI photo restoration in seconds"
  │   └─> Thinks: "This could save me hours every week"
  │
  ├─> Tests free restore
  │   │
  │   ├─> Uploads vintage Japanese photo from last weekend
  │   │   (1970s Tokyo street scene, faded colors)
  │   │
  │   ├─> Processing: 5.4 seconds
  │   │
  │   ├─> Result: Excellent
  │   │   │
  │   │   ├─> Colors restored (vibrant but not oversaturated)
  │   │   ├─> Grain preserved (authentic vintage feel)
  │   │   └─> Better than manual Lightroom editing
  │   │
  │   └─> Decision: "This is perfect for my workflow"
  │
  ├─> Calculates business need:
  │   │
  │   ├─> Current pace: 20 photos/month
  │   ├─> Goal pace: 30 photos/month (daily Instagram posts)
  │   ├─> Annual need: 360 photos/year
  │   │
  │   └─> Pricing:
  │       Standard: $9.99 for 10 credits = $36/month
  │       Bulk: $99.90 for 100 credits = $30/month
  │       Annual: $360 (if 100-credit packs)
  │
  ├─> Purchases 100 credits
  │   │
  │   ├─> Clicks "Buy Credits"
  │   ├─> Selects: 100 credits for $99.90 (bulk option)
  │   │   (Custom pricing tier for high-volume users)
  │   │
  │   ├─> Payment: Stripe checkout
  │   │   (Accepts international cards, Kenji uses US card)
  │   │
  │   └─> Credits added: 100 credits
  │       "Thank you! You have 100 credits."
  │
  ├─> First batch restoration (Sunday afternoon)
  │   │
  │   ├─> Uploads 25 photos from yesterday's flea market haul
  │   │   (via iPhone, RetroPhoto PWA installed)
  │   │
  │   ├─> Batch processing: 2 minutes 15 seconds
  │   │   (25 photos × 5.4 seconds avg)
  │   │
  │   ├─> Downloads all 25 photos
  │   │   │
  │   │   └─> Saves to iPhone Photos app
  │   │       Creates album: "RetroPhoto_Restored_Week1"
  │   │
  │   └─> Imports to Instagram content calendar (Buffer app)
  │       Schedules 1 post per day for next 25 days
  │
  ├─> Content performance (first month)
  │   │
  │   ├─> Posts: 30 photos (1 per day)
  │   ├─> Avg engagement: +15% vs. previous month
  │   │   (Consistent quality resonates with followers)
  │   │
  │   ├─> Follower growth: +3,200 followers (127K → 130.2K)
  │   │
  │   └─> Revenue impact:
  │       Subscription box sales: +$2,800 (attributed to Instagram)
  │       ROI: $2,800 revenue / $99.90 restoration cost = 28x
  │
  ├─> Becomes power user
  │   │
  │   ├─> Month 2: Purchases another 100 credits
  │   ├─> Month 3: Purchases another 100 credits
  │   │
  │   └─> Requests API access (automation goal)
  │       Emails: "I'm using 100+ credits/month. Do you have an API?
  │       I want to automate my workflow with Python."
  │
  ├─> API access granted (beta)
  │   │
  │   ├─> Documentation: docs.retrophotoai.com/api
  │   ├─> API key: rp_live_xyz789abc...
  │   │
  │   └─> Kenji builds automation script:
  │       ```python
  │       # auto_restore.py
  │       import os
  │       import requests
  │
  │       API_KEY = "rp_live_xyz789abc..."
  │       INPUT_DIR = "flea_market_photos"
  │       OUTPUT_DIR = "restored"
  │
  │       for filename in os.listdir(INPUT_DIR):
  │           with open(f"{INPUT_DIR}/{filename}", "rb") as f:
  │               response = requests.post(
  │                   "https://api.retrophotoai.com/v1/restore",
  │                   headers={"Authorization": f"Bearer {API_KEY}"},
  │                   files={"photo": f}
  │               )
  │
  │               if response.status_code == 200:
  │                   with open(f"{OUTPUT_DIR}/{filename}", "wb") as out:
  │                       out.write(response.content)
  │                   print(f"✓ {filename}")
  │       ```
  │
  │       Now Kenji runs this script every Sunday:
  │       - Drops 30 photos into INPUT_DIR
  │       - Runs script (3 minutes to process all)
  │       - Uploads to Instagram scheduler
  │
  ├─> Creates case study content
  │   │
  │   ├─> Instagram post: "How I create content for my brand"
  │   │   │
  │   │   ├─> Carousel post (10 slides):
  │   │   │   1. "My secret workflow"
  │   │   │   2. Photo of Tokyo flea market
  │   │   │   3. Example damaged photo (before)
  │   │   │   4. Restored photo (after)
  │   │   │   5. "I use RetroPhoto AI"
  │   │   │   6-9. More examples
  │   │   │   10. "Link in bio"
  │   │   │
  │   │   └─> Performance: 8,400 likes, 240 comments
  │   │       "What tool do you use?" (repeated question)
  │   │       Kenji replies: "RetroPhoto.ai 🇯🇵"
  │   │
  │   └─> Traffic spike: 420 clicks from Instagram
  │       Signups: 28 new users (6.7% conversion)
  │       Revenue: $139.86 from referrals
  │
  └─> END: Kenji as brand ambassador
      │
      ├─> Reaches out to RetroPhoto:
      │   "Can we do a formal partnership? I'd love to create
      │   Japanese-language content and drive more users."
      │
      ├─> RetroPhoto offers affiliate program:
      │   20% commission on referrals
      │   Custom landing page: retrophotoai.com/kenji
      │   Japanese localization (future)
      │
      └─> Lifetime value: $1,200+ per year (high-volume recurring)
          Referral value: $500+ per year (affiliate commissions)
          Strategic value: Japanese market entry point

┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS IMPACT                              │
├─────────────────────────────────────────────────────────────────┤
│ Time saved: 25 hours/month (vs. manual Lightroom editing)       │
│ Cost: $100/month (100 credits)                                  │
│ Revenue impact: +$2,800/month (subscription box sales)          │
│ ROI: 28x                                                         │
│ Content quality: +15% engagement                                 │
│ Workflow: Fully automated with API                              │
│ Brand advocacy: Organic referral driver (28 signups/month)      │
└─────────────────────────────────────────────────────────────────┘
```

---

# 7-10. Remaining Personas (Abbreviated)

Due to length constraints, here are abbreviated flows for the remaining personas:

## 7. Aisha Mohammed - Museum Curator

**Key Journey**: Pilot project → Institutional contract → Academic case study

```
Discover (conference) → Test (1 photo) → Negotiate (custom contract) →
Pilot (1,000 photos) → Quality validation → Full adoption →
Case study publication → Industry credibility
```

**LTV**: $10,000+ institutional contract

---

## 8. Tyler Mitchell - Military Veteran

**Key Journey**: Facebook referral → Daughter helps setup → Emotional restoration → Reunion success

```
Facebook veteran group post → Tests with help → Calls support (trust) →
Purchases 50 credits → Restores over 2 weeks → Reunion slideshow →
Shares in veteran community → Drives peer referrals
```

**LTV**: $75-100 + high word-of-mouth value

---

## 9. Sophia Martinez - DIY Wedding Planner

**Key Journey**: Pinterest → Quality comparison → Wedding decor project → Designer referrals

```
Pinterest pin → Tests free → Compares with Remini/Hotpot →
Purchases 100 credits → Restores 80 wedding photos →
Further edits in Photoshop → Wedding decor feature →
Instagram post → Designer Slack channels → Professional referrals
```

**LTV**: $150-200 + B2B referrals (designers)

---

## 10. Raj Patel - Digital Nomad

**Key Journey**: Offline capability → Travel workflow → YouTube tutorial → Creator community

```
Product Hunt → Tests PWA offline → Purchases 100 credits →
Uses sporadically (travels to Bali, Morocco, Peru) →
Creates YouTube tutorial → 50K views → Creator community adoption
```

**LTV**: $400+ recurring + creator referrals

---

## Master Flow: All Personas Combined

```
┌─────────────────────────────────────────────────────────────────┐
│                  UNIVERSAL USER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

DISCOVERY
│
├─> Organic (Google, social, word-of-mouth)
├─> Paid (Instagram ads, Product Hunt)
└─> Referral (existing users, content creators)
    │
    ▼
LANDING PAGE (retrophotoai.com)
│
├─> Value prop clear within 5 seconds
├─> Upload zone prominent (CTA)
└─> Social proof (photos restored counter)
    │
    ▼
FREE RESTORE (Trust Test)
│
├─> Upload (drag-drop or mobile picker)
├─> Processing (6 seconds avg)
└─> Result (before/after comparison)
    │
    ▼
DECISION POINT
│
├─> Satisfied → Download → Purchase credits
├─> Unsure → Review more → Repeat test
└─> Dissatisfied → Bounce (rare: <5%)
    │
    ▼
PURCHASE
│
├─> Guest checkout (no account required)
├─> Stripe payment (Apple Pay, Google Pay, card)
└─> Credits added instantly
    │
    ▼
USAGE
│
├─> Single photo (quick need)
├─> Batch processing (project-based)
└─> High-volume (business/institutional)
    │
    ▼
RETENTION
│
├─> One-time (grief, wedding, project)
├─> Recurring (content creators, researchers)
└─> Referral (word-of-mouth, tutorials)
    │
    ▼
ADVOCACY
│
├─> Social sharing (Instagram, TikTok)
├─> Reviews (Product Hunt, testimonials)
└─> Case studies (academic, business)

┌─────────────────────────────────────────────────────────────────┐
│                      SUCCESS METRICS                            │
├─────────────────────────────────────────────────────────────────┤
│ Time to First Interaction (NSM): <30 seconds                    │
│ Time to Magic (TTM): <6 seconds (processing)                    │
│ Free → Paid Conversion: 15-25%                                  │
│ Customer Satisfaction (CSAT): >90%                              │
│ Net Promoter Score (NPS): >70                                   │
│ Retention (90 days): 40% (project-based) / 80% (business)      │
│ Viral coefficient: 1.2 (organic growth)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Implement batch upload** (Priority: Priya, Kenji, Sophia)
2. **Build API** (Priority: Priya, Kenji)
3. **Add bulk pricing tiers** (Priority: All high-volume users)
4. **Offline PWA enhancement** (Priority: Raj, Tyler)
5. **Referral program** (Priority: Jamal, Margaret)
6. **Institutional contracts** (Priority: Aisha)

---

**These user stories represent $15,000+ in potential lifetime value from just 10 users. At scale, this model is highly profitable with minimal CAC.**
