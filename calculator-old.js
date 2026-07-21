/**
 * Bangladesh Income Tax Calculator — calculation rules (FY 2025-26)
 *
 * Pure calculation logic separated from the UI. Given the raw form inputs,
 * `calculateTax` returns all derived figures needed to render the results.
 */

/**
 * Returns the category-based tax-free (0%) limit, before the children adjustment.
 * @param {string} category
 * @returns {number}
 */
function getCategoryTaxFreeLimit(category) {
    switch (category) {
        case "woman":
        case "senior":
            return 400000;
        case "disabled":
        case "thirdGender":
            return 475000;
        case "freedomFighter":
            return 500000;
        default: // "general"
            return 350000;
    }
}

/**
 * Applies the progressive tax slabs to the taxable income above the 0% limit.
 * @param {number} incomeForSlabCalculation
 * @returns {number} tax before rebate/AIT adjustments
 */
function calculateSlabTax(incomeForSlabCalculation) {
    let tax = 0;
    let remainingTaxable = incomeForSlabCalculation;

    if (remainingTaxable > 0) { const slab = Math.min(remainingTaxable, 100000); tax += slab * 0.05; remainingTaxable -= slab; }
    if (remainingTaxable > 0) { const slab = Math.min(remainingTaxable, 400000); tax += slab * 0.10; remainingTaxable -= slab; }
    if (remainingTaxable > 0) { const slab = Math.min(remainingTaxable, 500000); tax += slab * 0.15; remainingTaxable -= slab; }
    if (remainingTaxable > 0) { const slab = Math.min(remainingTaxable, 500000); tax += slab * 0.20; remainingTaxable -= slab; }
    if (remainingTaxable > 0) { const slab = Math.min(remainingTaxable, 2000000); tax += slab * 0.25; remainingTaxable -= slab; }
    if (remainingTaxable > 0) { tax += remainingTaxable * 0.30; }

    return tax;
}

/**
 * Computes the full tax breakdown from the raw form inputs.
 *
 * @param {Object} input
 * @param {number} input.basicSalary
 * @param {number} input.houseRent
 * @param {number} input.conveyance
 * @param {number} input.medical
 * @param {number} input.bonuses
 * @param {number} input.overtime
 * @param {number} input.otherIncome
 * @param {number} input.advanceTax
 * @param {number} input.shanchayPatra
 * @param {number} input.dps
 * @param {number} input.mutualFund
 * @param {number} input.treasuryBond
 * @param {number} input.stock
 * @param {number} input.providentFundEmployee
 * @param {number} input.providentFundEmployer
 * @param {number} input.providentFundInterest
 * @param {string} input.category
 * @param {number} input.children
 * @returns {Object} derived tax figures
 */
function calculateTax(input) {
    const {
        basicSalary, houseRent, conveyance, medical, bonuses, overtime,
        otherIncome, advanceTax, shanchayPatra, dps, mutualFund, treasuryBond,
        stock, providentFundEmployee, providentFundEmployer,
        providentFundInterest, category, children,
    } = input;

    const totalEarnings = basicSalary + houseRent + conveyance + medical + bonuses + overtime + otherIncome;
    const taxfreeincome = Math.min(totalEarnings / 3, 450000);

    const categoryTaxFreeLimit = getCategoryTaxFreeLimit(category) + children * 50000;

    const taxableIncome = Math.max(0, totalEarnings - taxfreeincome);
    const incomeForSlabCalculation = Math.max(0, taxableIncome - categoryTaxFreeLimit);

    const tax = calculateSlabTax(incomeForSlabCalculation);

    const totalInvestment = Math.min(shanchayPatra, 500000) + Math.min(dps, 120000) + mutualFund + treasuryBond + stock + providentFundEmployee + providentFundEmployer + providentFundInterest;
    const rebate = Math.min(totalInvestment * 0.15, taxableIncome * 0.03, 1000000);

    const maxRebate = Math.min(taxableIncome * 0.03, 1000000);
    const requiredInvestmentForMaxRebate = maxRebate / 0.15;
    const requiredInvestment = requiredInvestmentForMaxRebate - totalInvestment;

    let netTax = Math.max(0, tax - rebate - advanceTax);

    const minimumTax = 3000;
    if (taxableIncome > categoryTaxFreeLimit) {
        netTax = Math.max(netTax, minimumTax);
    } else {
        netTax = 0;
    }

    return {
        totalEarnings,
        taxfreeincome,
        taxableIncome,
        categoryTaxFreeLimit,
        tax,
        totalInvestment,
        rebate,
        requiredInvestmentForMaxRebate,
        requiredInvestment,
        advanceTax,
        netTax,
    };
}

// Expose for use in the browser (non-module script).
if (typeof window !== 'undefined') {
    window.calculateTax = calculateTax;
}
