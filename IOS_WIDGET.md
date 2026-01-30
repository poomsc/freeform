# iOS Widget Setup (Scriptable)

Display your Freeform board as a widget on your iPhone or iPad home screen using the [Scriptable](https://scriptable.app) app.

## Prerequisites

- **Scriptable** app installed from the App Store (free)
- Your Freeform web app deployed (e.g., on Vercel)
- Your **API token** (find it in the web app header → "API Token" button)

## Setup Steps

### 1. Get your API token

1. Open your Freeform web app in a browser
2. Sign in to your account
3. Click the **API Token** button in the header bar
4. Copy the displayed token (tap on it to copy)

### 2. Create the Scriptable script

1. Open the **Scriptable** app on your iOS device
2. Tap **+** to create a new script
3. Name it **"Freeform Board"**
4. Paste the following code:

```javascript
// ========================================
// Freeform Board Widget for Scriptable
// ========================================

// CONFIGURATION — Edit these values:
const API_BASE_URL = "http://192.168.1.85:3000";  // Your deployed app URL
const API_TOKEN = "your-api-token-here";              // Your API token from the web app

// ========================================
// Do not edit below this line
// ========================================

async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#ffffff");
  widget.setPadding(0, 0, 0, 0);

  try {
    const url = `${API_BASE_URL}/api/snapshot?token=${API_TOKEN}`;
    const req = new Request(url);
    const img = await req.loadImage();

    const widgetImage = widget.addImage(img);
    widgetImage.resizable = true;
    widgetImage.centerAlignImage();
    widgetImage.applyFittingContentMode();
  } catch (error) {
    const errorText = widget.addText("Failed to load board");
    errorText.textColor = new Color("#ff0000");
    errorText.font = Font.mediumSystemFont(14);
    errorText.centerAlignText();
  }

  return widget;
}

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Preview in app
  await widget.presentExtraLarge();
}

Script.complete();
```

5. Tap **Done** to save

### 3. Configure the script

Edit the two constants at the top of the script:

- **`API_BASE_URL`**: Your deployed app URL (e.g., `https://freeform-abc123.vercel.app`)
- **`API_TOKEN`**: The API token you copied from the web app

### 4. Test the script

Tap the **Play** button in Scriptable to run the script. You should see a preview of your board.

### 5. Add the widget to your home screen

1. Long-press on your home screen → tap **+** (top-left)
2. Search for **Scriptable**
3. Choose the **Extra Large** widget size (iPad) for best canvas view
4. Tap **Add Widget**
5. Long-press the widget → **Edit Widget**
6. Set **Script** to **"Freeform Board"**
7. Tap outside to save

## Widget Sizes

| Size | Recommended | Notes |
|------|-------------|-------|
| Small | No | Too small for canvas detail |
| Medium | OK | Shows a cropped view |
| Large | Yes | Best for viewing the full board |
| Extra Large (iPad) | Yes | Ideal for iPad home screen |

## Auto-Refresh

Scriptable widgets refresh automatically based on iOS scheduling (roughly every 15-30 minutes). To force a refresh:

- Tap the widget to open Scriptable, then go back to the home screen

For more frequent updates, you can set up a Shortcuts automation:

1. Open **Shortcuts** app
2. Create a new **Automation**
3. Trigger: **Time of Day** (set your preferred interval)
4. Action: **Run Scriptable Script** → select "Freeform Board"

## Multiple Boards

If you want multiple widgets for different boards, you can modify the script to accept a board ID parameter:

```javascript
// In the widget edit settings, pass the board ID as the Parameter
const boardId = args.widgetParameter || "default";
const url = `${API_BASE_URL}/api/snapshot?token=${API_TOKEN}&board=${boardId}`;
```

## Dark Mode Widget

```javascript
// Replace the backgroundColor line with:
const isDark = Device.isUsingDarkAppearance();
widget.backgroundColor = new Color(isDark ? "#1a1a1a" : "#ffffff");
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget shows "Failed to load board" | Check your API_BASE_URL and API_TOKEN are correct |
| Widget is blank | Make sure you have shapes on your board and have saved at least once |
| Widget doesn't update | iOS controls refresh timing. Tap the widget to trigger a refresh |
| "Script not found" error | Make sure the script name in widget settings matches exactly |
| Image looks blurry | The snapshot is exported at 1x scale — this is normal for performance |
