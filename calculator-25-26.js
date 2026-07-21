/**
 * TaxHishab Core Computational Engine
 * COMPLIANT VERSION — Updated with modern NBR Investment Rebate Formulation Steps
 */

document.addEventListener("DOMContentLoaded", () => {
    // Attach listeners to the document to discover dynamically elements or static nodes
    document.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", debounce(calculateTaxLiveEn, 150));
        input.addEventListener("change", debounce(calculateTaxLiveEn, 150));
    });

    // Initial calculation on page load
    calculateTaxLiveEn();
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function toggleAccordion(id) {
    // Toggle only the clicked card; other cards keep their state (multiple can stay open).
    const card = document.getElementById(`acc-card-${id}`);
    const content = card ? card.querySelector(".accordion-content") : null;
    if (card && content) {
        const willOpen = content.classList.contains("hidden");
        if (willOpen) {
            card.classList.add("active");
            content.classList.remove("hidden");
            content.classList.add("animate-slide-up");
        } else {
            card.classList.remove("active");
            content.classList.add("hidden");
        }
    }
    // Each step-nav node reflects its own card's open state.
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById(`step-node-${i}`);
        const iCard = document.getElementById(`acc-card-${i}`);
        if (node) {
            const dot = node.querySelector("span");
            if (iCard && iCard.classList.contains("active")) {
                node.className = "text-blue-600 flex items-center space-x-1 font-bold";
                if (dot) dot.className = "h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 font-bold border border-blue-200";
            } else {
                node.className = "text-slate-400 flex items-center space-x-1 font-medium";
                if (dot) dot.className = "h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400";
            }
        }
    }
}

function switchStep(stepId) { toggleAccordion(stepId); }

function scrollInputs() {
    const target = document.getElementById("acc-card-1");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function calculateTaxLiveEn() {
    // 1. Gather profile variables
    const categoryEl = document.querySelector('input[name="category"]:checked');
    const category = categoryEl ? categoryEl.value : 'general';
    const taxpayerStatusEl = document.getElementById("taxpayerStatus");
    const taxpayerStatus = taxpayerStatusEl ? taxpayerStatusEl.value : 'existing';
    const children = parseInt(document.getElementById("children")?.value) || 0;
    const filedOnTimeEl = document.getElementById("filedOnTime");
    const filedOnTime = filedOnTimeEl ? filedOnTimeEl.value : 'yes';

    // 2. Gather income fields
    const basicSalary    = parseFloat(document.getElementById("basicSalary")?.value)    || 0;
    const houseRent      = parseFloat(document.getElementById("houseRent")?.value)      || 0;
    const conveyance     = parseFloat(document.getElementById("conveyance")?.value)     || 0;
    const medical        = parseFloat(document.getElementById("medical")?.value)        || 0;
    const bonuses        = parseFloat(document.getElementById("bonuses")?.value)        || 0;
    const otherIncome    = parseFloat(document.getElementById("otherIncome")?.value)    || 0;
    const advanceTax     = parseFloat(document.getElementById("advanceTax")?.value)     || 0;

    // 3. Gather investment fields
    const shanchayPatra  = parseFloat(document.getElementById("shanchayPatra")?.value)  || 0;
    const dps            = parseFloat(document.getElementById("dps")?.value)            || 0;
    const stockInvestment= parseFloat(document.getElementById("stockInvestment")?.value)|| 0;
    const providentFund  = parseFloat(document.getElementById("providentFund")?.value)  || 0;

    // 4. Gather asset fields
    const netWealth      = parseFloat(document.getElementById("netWealth")?.value)      || 0;
    const hasMultipleCars= document.getElementById("hasMultipleCars")?.value || "no";
    const largeProperty  = document.getElementById("largeProperty")?.value  || "no";

    // ── INCOME PIPELINE ────────────────────────────────────────────

    // Total gross
    const grossEarnings = basicSalary + houseRent + conveyance + medical + bonuses + otherIncome;

    // 1/3 general salary exemption (max ৳5,00,000)
    const baseExemption = Math.min(
        grossEarnings * TaxRules2025.salaryExemption.fraction,
        TaxRules2025.salaryExemption.maxLimit
    );
    const taxableIncome = Math.max(0, grossEarnings - baseExemption);

    // Tax-free threshold by category
    let baseThreshold = TaxRules2025.thresholds[category] || TaxRules2025.thresholds.general;

    // Disabled dependent extra allowance
    const childrenAllocation = children * TaxRules2025.dependentExemptionPerChild;
    baseThreshold += childrenAllocation;

    // Show/hide child hint
    const childHint = document.getElementById("children-hint");
    if (childHint) {
        if (children > 0) {
            childHint.innerText = `+৳${childrenAllocation.toLocaleString()} extra limit added for ${children} dependent(s).`;
            childHint.classList.remove("hidden");
        } else {
            childHint.classList.add("hidden");
        }
    }

    // Amount subject to progressive slabs
    let remainingTaxable = Math.max(0, taxableIncome - baseThreshold);
    const incomeForSlabs = remainingTaxable;

    let baseTaxBeforeRebate = 0;
    // Index 0 = 0% (threshold), then one slot per slab
    let allocatedSlabWeight = new Array(TaxRules2025.slabs.length + 1).fill(0);
    allocatedSlabWeight[0] = Math.min(taxableIncome, baseThreshold); // 0% bucket

    for (let i = 0; i < TaxRules2025.slabs.length; i++) {
        const slab = TaxRules2025.slabs[i];
        const currentAllocation = slab.limit === Infinity
            ? remainingTaxable
            : Math.min(remainingTaxable, slab.limit);
        baseTaxBeforeRebate += currentAllocation * slab.rate;
        allocatedSlabWeight[i + 1] = currentAllocation;
        remainingTaxable -= currentAllocation;
        if (remainingTaxable <= 0) break;
    }

    // ── INVESTMENT REBATE ───────────────────────────────────────────

    const allowedDps      = Math.min(dps, TaxRules2025.investmentLimits.dpsMaxAnnual);
    const allowedShanchay = Math.min(shanchayPatra, TaxRules2025.investmentLimits.shanchayPatraMaxAnnual);
    const totalEligibleInvestment = allowedDps + allowedShanchay + stockInvestment + providentFund;

    let calculatedRebate = 0;
    const rebateWarning = document.getElementById("rebate-disabled-warning");

    if (filedOnTime === "yes") {
        if (rebateWarning) rebateWarning.classList.add("hidden");

        // NEW RULE CORRECTION: Lowest of three absolute value calculations
        const cap1_threePctIncome     = taxableIncome * 0.03;
        const cap2_fifteenPctInvest   = totalEligibleInvestment * 0.15;
        const cap3_flatAbsoluteCeiling= 1000000; // ৳10 Lakh flat cap

        calculatedRebate = Math.max(0, Math.min(cap1_threePctIncome, cap2_fifteenPctInvest, cap3_flatAbsoluteCeiling));
    } else {
        if (rebateWarning) rebateWarning.classList.remove("hidden");
        calculatedRebate = 0;
    }

    // Investment needed to reach the maximum possible rebate for this income
    const maxRebate = Math.min(taxableIncome * 0.03, 1000000);
    const requiredInvestmentForMaxRebate = maxRebate / TaxRules2025.rebate.rate;
    const requiredInvestment = Math.max(0, requiredInvestmentForMaxRebate - totalEligibleInvestment);

    // ── MINIMUM TAX ─────────────────────────────────────────────────

    let taxPostRebate = Math.max(0, baseTaxBeforeRebate - calculatedRebate);
    const minimumTaxThreshold = TaxRules2025.minimumTax[taxpayerStatus] || TaxRules2025.minimumTax.existing;
    let minimumTaxApplied = false;
    let finalTaxBeforeSurcharge = taxPostRebate;

    if (taxableIncome > baseThreshold) {
        if (taxPostRebate < minimumTaxThreshold) {
            finalTaxBeforeSurcharge = minimumTaxThreshold;
            minimumTaxApplied = true;
        }
    } else {
        finalTaxBeforeSurcharge = 0;
    }

    // ── SURCHARGE ──────────────────────────────────────────────────

    let surchargeRate = 0;
    for (const tier of TaxRules2025.wealthSurchargeThresholds) {
        if (netWealth <= tier.limit) {
            surchargeRate = tier.rate;
            break;
        }
    }

    if (surchargeRate === 0 && (hasMultipleCars === "yes" || largeProperty === "yes")) {
        surchargeRate = 0.10;
    }

    const computedSurcharge = finalTaxBeforeSurcharge * surchargeRate;

    // ── FINAL LIABILITY ─────────────────────────────────────────────

    const totalTaxLiability = finalTaxBeforeSurcharge + computedSurcharge;
    const finalNetPayableTax = Math.max(0, totalTaxLiability - advanceTax);

    // ── RENDER ──────────────────────────────────────────────────────

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const money = n => "৳" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

    setEl("sum-taxable",   money(taxableIncome));
    setEl("sum-gross-tax", money(baseTaxBeforeRebate));
    setEl("sum-invest-needed",  money(requiredInvestmentForMaxRebate));
    setEl("sum-invest-eligible", money(totalEligibleInvestment));
    setEl("sum-invest-remain",  money(requiredInvestment));
    setEl("sum-rebate",    "-" + money(calculatedRebate));
    setEl("sum-final",     money(finalNetPayableTax));
    setEl("mob-final",     money(finalNetPayableTax));

    // ── NARRATIVE LOG ───────────────────────────────────────────────

    const explanationBox = document.getElementById("explanation-box");
    if (explanationBox) {
        const logs = [];
        if (grossEarnings === 0) {
            explanationBox.innerHTML = `<p class="italic text-slate-500 text-center">Awaiting entry profiles to render logs...</p>`;
        } else {
            logs.push(`• Gross income is ৳${grossEarnings.toLocaleString()} with ৳${baseExemption.toLocaleString()} exempted via the standard 1/3rd salary deduction rule (max ৳5,00,000).`);
            logs.push(`• Your personal tax-free threshold is ৳${baseThreshold.toLocaleString()} (category: ${category.replace(/_/g," ")}).`);
            if (incomeForSlabs > 0) {
                logs.push(`• ৳${incomeForSlabs.toLocaleString()} falls into the progressive tax slabs, generating a gross liability of ৳${baseTaxBeforeRebate.toLocaleString()}.`);
            } else {
                logs.push(`• Your taxable income of ৳${taxableIncome.toLocaleString()} is within your threshold — no slab tax applies.`);
            }
            if (calculatedRebate > 0) {
                logs.push(`• Tax credit rebate under the modern lowest-of-three-caps protocol grants a ৳${calculatedRebate.toLocaleString()} deduction.`);
            }
            if (minimumTaxApplied) {
                logs.push(`• Minimum tax of ৳${minimumTaxThreshold.toLocaleString()} applied as calculated liability was below the statutory floor.`);
            }
            if (computedSurcharge > 0) {
                logs.push(`• Net wealth / asset criteria triggered a ${(surchargeRate * 100).toFixed(0)}% surcharge of ৳${computedSurcharge.toLocaleString()}.`);
            }
            if (advanceTax > 0) {
                logs.push(`• Advance tax (AIT/TDS) of ৳${advanceTax.toLocaleString()} deducted, leaving net payable of ৳${finalNetPayableTax.toLocaleString()}.`);
            }
            explanationBox.innerHTML = logs.map(l =>
                `<p class="leading-relaxed animate-slide-up">${l}</p>`
            ).join("");
        }
    }

    // ── SLAB BAR VISUALIZATION ──────────────────────────────────────
    const slabColors = ["#d1fae5", "#38bdf8", "#f59e0b", "#f97316", "#6366f1", "#ef4444"];

    const barStack = document.getElementById("slab-bar-stack");
    if (barStack) {
        const totalAllocated = allocatedSlabWeight.reduce((a, b) => a + b, 0) || 1;
        barStack.innerHTML = "";
        allocatedSlabWeight.forEach((weight, idx) => {
            if (weight <= 0) return;
            const pct = (weight / totalAllocated) * 100;
            const seg = document.createElement("div");
            seg.className = "slab-segment transition-all duration-500";
            seg.style.width = `${pct}%`;
            seg.style.height = "100%";
            seg.style.backgroundColor = slabColors[idx] || "#475569";
            seg.title = `${idx === 0 ? "0%" : TaxRules2025.slabs[idx-1].rate*100+"%"} slab: ৳${weight.toLocaleString()}`;
            barStack.appendChild(seg);
        });
    }

    // ── WEALTH GAUGE ────────────────────────────────────────────────

    const gaugeBar       = document.getElementById("gauge-bar");
    const gaugeBadge     = document.getElementById("gauge-badge");
    const gaugeLabelText = document.getElementById("gauge-label-text");

    if (gaugeBar && gaugeBadge && gaugeLabelText) {
        const surchargeOnset = 40000000; // 4 crore
        const pct = Math.min((netWealth / surchargeOnset) * 100, 100);
        gaugeBar.style.width = `${pct}%`;

        const surchargeActive = surchargeRate > 0;
        if (surchargeActive) {
            gaugeBar.className = "bg-amber-500 h-full transition-all duration-300";
            gaugeBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse";
            gaugeBadge.innerText = `Surcharge Active (${surchargeRate * 100}%)`;
            gaugeLabelText.innerHTML = `⚠️ Asset criteria crossed the threshold. A ${surchargeRate*100}% surcharge of ৳${computedSurcharge.toLocaleString("en-IN",{minimumFractionDigits:2})} is applied to your tax.`;
        } else {
            gaugeBar.className = "bg-blue-600 h-full transition-all duration-300";
            gaugeBadge.className = "text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800";
            gaugeBadge.innerText = "Surcharge Free";
            gaugeLabelText.innerText = "Great! Your reported net wealth is under the ৳4 crore surcharge threshold.";
        }
    }
}