/**
 * TaxHishab — NBR Tax Rules
 * Assessment Year 2026-2027 (FY 2025-26 filing, rules effective for AY2026-27)
 *
 * These values match the UI labels in tax-calculator-25-26.php (৳3,75,000 threshold).
 * Source: আয়কর পরিপত্র ২০২৫-২০২৬, Section 1.1 (FY2026-27 slab table, page 2)
 *
 * SLAB STRUCTURE (per NBR circular, FY2026-27):
 *   First ৳3,75,000  → 0%   (threshold, handled separately)
 *   Next  ৳3,00,000  → 10%  ← NO 5% slab for this year
 *   Next  ৳4,00,000  → 15%
 *   Next  ৳5,00,000  → 20%
 *   Next  ৳20,00,000 → 25%
 *   Rest             → 30%
 *
 * NOTE: The 5% slab only existed in FY2025-26 (threshold ৳3,50,000).
 * This file consistently targets FY2026-27 values to match the UI.
 */
const TaxRules2025 = {

    // Salary exemption: 1/3 of gross salary, max ৳5,00,000
    salaryExemption: {
        fraction: 1 / 3,
        maxLimit: 500000
    },

    // Tax-free thresholds by category (FY2026-27, matches UI labels)
    thresholds: {
        general:         375000,  // ৳3,75,000
        woman_senior:    425000,  // ৳4,25,000 — women & age 65+
        disabled_tg:     500000,  // ৳5,00,000 — disabled & third gender
        freedom_fighter: 525000   // ৳5,25,000 — freedom fighters & July warriors
    },

    // Extra allowance per disabled dependent child/ward
    dependentExemptionPerChild: 50000,

    // Progressive tax slabs (applied to income above threshold)
    // Source: NBR circular page 2, section 1.1, FY2026-27 column
    slabs: [
        { limit: 300000,  rate: 0.10 },  // Next ৳3,00,000  @ 10%
        { limit: 400000,  rate: 0.15 },  // Next ৳4,00,000  @ 15%
        { limit: 500000,  rate: 0.20 },  // Next ৳5,00,000  @ 20%
        { limit: 2000000, rate: 0.25 },  // Next ৳20,00,000 @ 25%
        { limit: Infinity,rate: 0.30 }   // Remaining       @ 30%
    ],

    // Investment rebate eligible caps
    investmentLimits: {
        dpsMaxAnnual:           120000,  // ৳1,20,000
        shanchayPatraMaxAnnual: 500000   // ৳5,00,000
    },

    // Rebate: 15% of eligible investment base
    // Eligible base = min(total investment, 25% of taxable income, ৳1 crore)
    // The 25% cap is enforced in calculator-25-26.js
    rebate: {
        rate: 0.15
    },

    // Minimum tax by filer type
    minimumTax: {
        existing: 5000,  // Regular filers (Dhaka/CTG city corp)
        new:      1000   // First-time filers
    },

    // Wealth surcharge tiers — applied on payable tax (not on income)
    // Source: NBR circular section 1.4
    wealthSurchargeThresholds: [
        { limit: 40000000,  rate: 0.00 },  // Up to ৳4 crore   → 0%
        { limit: 100000000, rate: 0.10 },  // ৳4–10 crore       → 10%
        { limit: 200000000, rate: 0.20 },  // ৳10–20 crore      → 20%
        { limit: 500000000, rate: 0.30 },  // ৳20–50 crore      → 30%
        { limit: Infinity,  rate: 0.35 }   // Above ৳50 crore   → 35%
    ]
};