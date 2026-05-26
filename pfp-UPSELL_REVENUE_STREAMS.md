# Party Favor Photo - Upsell Revenue Streams

## Overview

Add 3 high-margin upsell streams to increase average booking value by $300+.

**Current Average:** $500/booking  
**Target Average:** $800/booking (+60%)

---

## 💰 UPSELL 1: Premium Prints

### Pricing

| Product | Size | Price | Margin |
|---------|------|-------|--------|
| Standard Print | 4x6" | $5 | 70% |
| Standard Print | 5x7" | $8 | 70% |
| Standard Print | 8x10" | $15 | 70% |
| Premium Print | 11x14" | $35 | 75% |
| Premium Print | 16x20" | $55 | 75% |
| Premium Print | 20x24" | $75 | 75% |
| Canvas Print | 16x20" | $85 | 60% |
| Canvas Print | 20x24" | $120 | 60% |
| Metal Print | 16x20" | $95 | 65% |
| Metal Print | 20x24" | $135 | 65% |

### Expected Revenue
- **Per booking:** $50-200
- **Monthly (10 bookings):** $500-2,000
- **Annual:** $6,000-24,000

### Implementation

```typescript
// Add to pfp-booking edge function
// Display upsell options during checkout

const printPackages = [
  {
    name: "Starter Pack",
    price: 50,
    items: ["10x 4x6 prints", "5x 5x7 prints", "2x 8x10 prints"]
  },
  {
    name: "Premium Pack",
    price: 100,
    items: ["20x 4x6 prints", "10x 5x7 prints", "5x 8x10 prints", "1x 16x20 canvas"]
  },
  {
    name: "Deluxe Pack",
    price: 200,
    items: ["50x 4x6 prints", "25x 5x7 prints", "10x 8x10 prints", "2x 16x20 canvas", "1x 20x24 metal"]
  }
];
```

---

## 💰 UPSELL 2: Photo Albums

### Pricing

| Album Type | Size | Pages | Price | Margin |
|------------|------|-------|-------|--------|
| Basic | 8x8" | 20 | $150 | 60% |
| Basic | 10x10" | 20 | $200 | 60% |
| Premium | 10x10" | 30 | $250 | 65% |
| Premium | 12x12" | 30 | $300 | 65% |
| Luxury | 12x12" | 40 | $400 | 70% |
| Luxury | 14x14" | 50 | $500 | 70% |

### Expected Revenue
- **Per booking:** 20% attach rate @ $250 avg = $50/booking
- **Monthly (10 bookings):** $500
- **Annual:** $6,000

### Implementation

```typescript
// Add album upsell to booking flow
const albumOptions = [
  {
    tier: "basic",
    name: "Memory Book",
    price: 150,
    description: "Perfect for sharing with family"
  },
  {
    tier: "premium", 
    name: "Story Book",
    price: 250,
    description: "Premium layflat pages + leather cover"
  },
  {
    tier: "luxury",
    name: "Heirloom Book",
    price: 400,
    description: "Archival quality + custom embossing"
  }
];
```

---

## 💰 UPSELL 3: Rush Delivery

### Pricing

| Delivery Speed | Turnaround | Upcharge |
|----------------|------------|----------|
| Standard | 2 weeks | Included |
| Expedited | 1 week | +25% |
| Rush | 48 hours | +50% |
| Same Day | 24 hours | +100% |

### Expected Revenue
- **Per booking:** 15% attach rate @ $250 avg = $37.50/booking
- **Monthly (10 bookings):** $375
- **Annual:** $4,500

### Implementation

```typescript
// Add rush delivery option to booking
const deliveryOptions = [
  {
    speed: "standard",
    name: "Standard Delivery",
    turnaround: "14 days",
    upcharge: 0
  },
  {
    speed: "expedited",
    name: "Expedited Delivery",
    turnaround: "7 days",
    upcharge: 0.25
  },
  {
    speed: "rush",
    name: "Rush Delivery",
    turnaround: "48 hours",
    upcharge: 0.50
  },
  {
    speed: "same_day",
    name: "Same Day Delivery",
    turnaround: "24 hours",
    upcharge: 1.00
  }
];
```

---

## 📊 REVENUE PROJECTION

### Current State
| Metric | Value |
|--------|-------|
| Avg booking value | $500 |
| Monthly bookings | 10 |
| Monthly revenue | $5,000 |

### With Upsells (Conservative)
| Metric | Value | Change |
|--------|-------|--------|
| Print attach rate | 40% @ $75 avg | +$30/booking |
| Album attach rate | 20% @ $250 avg | +$50/booking |
| Rush attach rate | 15% @ $250 avg | +$37.50/booking |
| **New avg booking** | **$667.50** | **+33.5%** |
| Monthly revenue | $6,675 | +$1,675 |
| Annual revenue | $80,100 | +$20,100 |

### With Upsells (Target)
| Metric | Value | Change |
|--------|-------|--------|
| Print attach rate | 60% @ $100 avg | +$60/booking |
| Album attach rate | 30% @ $275 avg | +$82.50/booking |
| Rush attach rate | 20% @ $300 avg | +$60/booking |
| **New avg booking** | **$702.50** | **+40.5%** |
| Monthly revenue | $7,025 | +$2,025 |
| Annual revenue | $84,300 | +$24,300 |

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Update Booking Function (Week 1)

1. **Modify pfp-booking edge function**
   - Add upsell options to checkout flow
   - Calculate total with upsells
   - Update Stripe payment link

2. **Update pfp-booking-notification**
   - Include upsell selections in notification email
   - Send print/album specs to fulfillment

3. **Update database schema**
   - Add upsell_items table
   - Link to bookings table

### Phase 2: Fulfillment Setup (Week 2)

1. **Print fulfillment**
   - Partner with local print shop OR
   - Use print-on-demand service (Printful, Gelato)
   - Set up quality control process

2. **Album fulfillment**
   - Partner with album manufacturer (Pictime, Pixieset)
   - Order sample albums for quality check
   - Set up design template system

3. **Rush delivery workflow**
   - Define rush processing priority
   - Set up expedited editing queue
   - Arrange priority shipping (FedEx Overnight)

### Phase 3: Marketing (Week 3)

1. **Website updates**
   - Add upsell options to booking form
   - Create upsell landing page
   - Add testimonial section for albums

2. **Email templates**
   - Post-booking upsell email
   - Pre-event upsell reminder
   - Post-event album offer

3. **Social proof**
   - Photograph sample albums
   - Create Instagram reel showing products
   - Collect customer testimonials

---

## 📋 DATABASE SCHEMA

```sql
-- Add to financial-tables-schema.sql

-- Upsell items table
CREATE TABLE IF NOT EXISTS upsell_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    booking_id UUID REFERENCES bookings(id),
    item_type TEXT NOT NULL, -- 'print', 'album', 'rush'
    item_name TEXT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, fulfilled, shipped, delivered
    fulfillment_notes TEXT,
    tracking_number TEXT
);

-- Print catalog
CREATE TABLE IF NOT EXISTS print_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    size TEXT NOT NULL, -- '4x6', '5x7', '8x10', etc.
    type TEXT NOT NULL, -- 'standard', 'premium', 'canvas', 'metal'
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    margin_percent DECIMAL(5,2),
    active BOOLEAN DEFAULT true
);

-- Album catalog
CREATE TABLE IF NOT EXISTS album_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier TEXT NOT NULL, -- 'basic', 'premium', 'luxury'
    size TEXT NOT NULL, -- '8x8', '10x10', '12x12', etc.
    pages INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    margin_percent DECIMAL(5,2),
    active BOOLEAN DEFAULT true
);

CREATE INDEX idx_upsell_items_booking ON upsell_items(booking_id);
CREATE INDEX idx_upsell_items_status ON upsell_items(status);

COMMENT ON TABLE upsell_items IS 'PFP upsell items (prints, albums, rush)';
```

---

## 🎯 SUCCESS METRICS

| Metric | Baseline | Target | Stretch |
|--------|----------|--------|---------|
| Print attach rate | 0% | 40% | 60% |
| Album attach rate | 0% | 20% | 30% |
| Rush attach rate | 0% | 15% | 20% |
| Avg booking value | $500 | $667 | $702 |
| Monthly upsell revenue | $0 | $1,675 | $2,025 |

---

## 📞 FULFILLMENT PARTNERS

### Print Labs
- **Printful:** High quality, good margins, integrates with Stripe
- **Gelato:** Global fulfillment, fast shipping
- **Local lab:** Support local, faster turnaround, negotiate better rates

### Album Manufacturers
- **Pictime:** Professional albums, client gallery integration
- **Pixieset:** Easy ordering, good quality
- **White House Custom Colour:** Premium quality, white-label

### Shipping
- **FedEx:** Overnight + 2-day options
- **USPS:** Cost-effective for prints
- **UPS:** Good for albums (heavy items)
