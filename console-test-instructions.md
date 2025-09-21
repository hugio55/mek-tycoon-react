# Story Climb Console Test Instructions

## Test Setup
1. Open http://localhost:3100/scrap-yard/story-climb in your browser
2. Open Developer Tools (F12) and go to the Console tab
3. Clear the console to start fresh

## Test Steps
1. **Find a Normal Mek Node**: Look for nodes that are NOT labeled with "E" (event nodes)
2. **Click on the Normal Mek Node**: This should trigger the console logs

## Expected Console Logs to Check

### 1. Deployed Mek Data Log
Look for: `"Deployed mek data for gold reward:"`
**Record these values:**
- `hasDeployedMek`: (true/false)
- `goldReward`: (number or undefined)
- `typeOfGoldReward`: (string showing data type)

### 2. Gold Reward Source Log
Look for ONE of these:
- `"Using deployed gold reward:"` + number
- `"Using fallback gold reward:"` + number
**Record which one appears and the value**

### 3. XP Calculation Log
Look for: `"Calculated XP from rank:"`
**Record these values:**
- `rank`: (number)
- `baseXP`: (number)

## UI Values to Check
In the StoryMissionCard that appears, check:
- **PRIMARY REWARD**: The gold amount displayed (should be yellow text with "G")
- **EXPERIENCE**: The XP amount displayed (should be blue text with "XP")

## Notes
- The gold and XP values shown in the UI may be different from the console base values due to difficulty multipliers
- If you don't see the "Calculated XP from rank" log, it means the deployed mek has an xpReward property set
- Normal nodes should show fallback values if no deployed mek data exists