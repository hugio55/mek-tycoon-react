# PowerShell script to update essence-market page.tsx

$filePath = "src\app\essence-market\page.tsx"
$content = Get-Content $filePath -Raw

# 1. Remove pricingInfoLayout state variable
$content = $content -replace "  const \[pricingInfoLayout, setPricingInfoLayout\] = useState<[^>]+>\(\d+\); // Default to Option 34: Vertical v4 - Bold Labels`r?`n", ""

# 2. Update renderPricingInfo function signature to remove layout parameter
$content = $content -replace "const renderPricingInfo = \(pricePerUnit: number, quantity: number, layoutNum: [^)]+\) =>", "const renderPricingInfo = (pricePerUnit: number, quantity: number) =>"

# 3. Update case 34 with fixed heights and reduced saturation
$newCase34 = @"
// Vertical v4 - Bold labels, medium numbers (LOCKED)
    const quantityFormatted = quantity.toFixed(2);

    return (
      <div className="mb-3 relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded blur-sm opacity-80" />

        <div className="relative bg-black/95 border border-cyan-400/50 rounded px-2.5 py-2.5 overflow-hidden">

          <div className="relative space-y-2">
            {/* Stock */}
            <div className="text-center h-[60px] flex flex-col justify-between">
              <div className="text-xs text-cyan-300/60 uppercase tracking-wider font-bold">
                STOCK
              </div>
              <div
                className="font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] flex items-center justify-center"
                style={{ fontSize: `$${'{'}stockNumberFontSize${'}'}px` }}
              >
                {quantityFormatted}
              </div>
              <div className="text-xs text-cyan-400/40 uppercase font-light">essence</div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

            {/* Price - Fixed height container for consistency */}
            <div className="text-center h-[60px] flex flex-col justify-between">
              <div className="text-xs text-yellow-300/60 uppercase tracking-wider font-bold">
                PRICE
              </div>
              <div
                className="font-semibold text-yellow-300 leading-none drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] inline-flex items-baseline justify-center"
                style=${{'{'}
                  fontSize: `$${'{'}
                    pricePerUnit.toLocaleString().length > 7 ? priceNumberFontSize * 0.56 :
                    pricePerUnit.toLocaleString().length > 6 ? priceNumberFontSize * 0.67 :
                    pricePerUnit.toLocaleString().length > 5 ? priceNumberFontSize * 0.83 :
                    pricePerUnit.toLocaleString().length > 4 ? priceNumberFontSize * 0.83 : priceNumberFontSize
                  ${'}'}px`
                ${'}'}}
              >
                <span>{pricePerUnit.toLocaleString()}</span>
                <span className="font-thin" style=${{'{'}fontSize: '0.45em'${'}'}>G</span>
              </div>
              <div className="text-xs text-yellow-400/40 uppercase font-light">each</div>
            </div>
          </div>
        </div>
      </div>
    );
"@

# Replace everything from "switch (layoutNum)" to the closing brace before "const user ="
$pattern = "(?s)switch \(layoutNum\) \{.+?default:\s+return null;\s+\}"
$content = $content -replace $pattern, $newCase34

# 4. Update renderPricingInfo calls to remove pricingInfoLayout parameter
$content = $content -replace "renderPricingInfo\(([^,]+), ([^,]+), pricingInfoLayout\)", "renderPricingInfo(`$1, `$2)"

# 5. Remove the pricing layout dropdown from debug controls
$dropdownPattern = "(?s)<!-- Pricing Info Layout -->.+?</select>\s+</div>"
$content = $content -replace $dropdownPattern, ""

# Write the updated content
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Successfully updated $filePath"
