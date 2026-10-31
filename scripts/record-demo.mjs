import { chromium } from "file:///C:/Users/hk672/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const FFMPEG_PATH = "C:\\Users\\hk672\\AppData\\Local\\ms-playwright\\ffmpeg-1013\\ffmpeg-win64.exe";
const VIDEO_DIR = path.resolve("./temp_video");
const PUBLIC_DIR = path.resolve("./public");

// Ensure temp directory
if (fs.existsSync(VIDEO_DIR)) {
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
}
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function injectHud(page) {
  await page.evaluate(() => {
    if (document.getElementById("eventoria-demo-hud")) return;

    // HUD Banner
    const hud = document.createElement("div");
    hud.id = "eventoria-demo-hud";
    hud.style.cssText = `
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.94);
      color: #ffffff;
      padding: 9px 24px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.16);
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      pointer-events: none;
      transition: all 0.3s ease;
    `;
    hud.innerHTML = `<span style="font-size: 16px;">✨</span> <span id="eventoria-hud-text">Eventoria Demo Walkthrough</span>`;
    document.body.appendChild(hud);

    // Virtual Cursor
    const cursor = document.createElement("div");
    cursor.id = "eventoria-virtual-cursor";
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.85);
      border: 2px solid #ffffff;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.8), 0 2px 6px rgba(0,0,0,0.4);
      z-index: 10000000;
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease, background 0.15s ease;
      display: none;
    `;
    document.body.appendChild(cursor);
  });
}

async function updateBanner(page, text, icon = "📌") {
  await injectHud(page);
  await page.evaluate(({ text, icon }) => {
    const hudText = document.getElementById("eventoria-hud-text");
    const hud = document.getElementById("eventoria-demo-hud");
    if (hudText && hud) {
      hud.querySelector("span:first-child").textContent = icon;
      hudText.textContent = text;
      hud.style.transform = "translateX(-50%) scale(1.04)";
      setTimeout(() => {
        hud.style.transform = "translateX(-50%) scale(1)";
      }, 200);
    }
  }, { text, icon });
}

async function moveCursor(page, x, y, duration = 200) {
  await page.evaluate(({ x, y }) => {
    const cursor = document.getElementById("eventoria-virtual-cursor");
    if (cursor) {
      cursor.style.display = "block";
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    }
  }, { x, y });
  await page.mouse.move(x, y, { steps: 4 });
  await page.waitForTimeout(duration);
}

async function clickElement(page, selector, delayAfter = 350) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 10000 });
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await moveCursor(page, targetX, targetY, 180);
    await page.evaluate(() => {
      const cursor = document.getElementById("eventoria-virtual-cursor");
      if (cursor) cursor.style.transform = "translate(-50%, -50%) scale(0.75)";
    });
    await page.waitForTimeout(60);
    await locator.click();
    await page.evaluate(() => {
      const cursor = document.getElementById("eventoria-virtual-cursor");
      if (cursor) cursor.style.transform = "translate(-50%, -50%) scale(1)";
    });
  } else {
    await locator.click();
  }
  await page.waitForTimeout(delayAfter);
}

async function typeInto(page, selector, text, delay = 18) {
  await clickElement(page, selector, 120);
  const locator = page.locator(selector).first();
  await locator.fill("");
  for (const char of text) {
    await locator.pressSequentially(char, { delay });
  }
  await page.waitForTimeout(200);
}

async function main() {
  console.log("🚀 Starting Playwright recording session...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  page.on("load", async () => {
    try {
      await injectHud(page);
    } catch (_) {}
  });

  // ==========================================
  // SECTION 1: WALKTHROUGH & HOME OVERVIEW
  // ==========================================
  console.log("Section 1: Walkthrough - Home & Theme Navigation");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await updateBanner(page, "Section 1: Walkthrough — Eventoria Overview & Theme Toggle", "✨");
  await page.waitForTimeout(1400);

  // Toggle Theme: Dark <-> Light
  await updateBanner(page, "Dark & Light Mode Support with Instant Persistence", "🌓");
  await clickElement(page, 'button[class*="themeToggle"]', 700);
  await page.waitForTimeout(600);
  await clickElement(page, 'button[class*="themeToggle"]', 700);
  await page.waitForTimeout(800);

  // Highlight Quota Counter
  await updateBanner(page, "Session Rate Limiting & Quota Transparency Widget", "🛡️");
  const quota = page.locator('header [class*="widget"]').first();
  if (await quota.count() > 0) {
    const qBox = await quota.boundingBox();
    if (qBox) await moveCursor(page, qBox.x + qBox.width / 2, qBox.y + qBox.height / 2, 500);
  }
  await page.waitForTimeout(800);

  // Navigate to Planner
  await updateBanner(page, "Navigating to Event Planner Workflow", "📋");
  await clickElement(page, 'a[href="/planner"]', 1200);

  // ==========================================
  // SECTION 2: LIVE TESTING — VALIDATION & EDGE CASES
  // ==========================================
  console.log("Section 2: Live Testing - Validation & Real Data Entry");
  await updateBanner(page, "Section 2: Live Testing — Input Validation & Edge Cases", "🧪");
  await page.waitForTimeout(1200);

  // Edge Case: 0 guests & below-minimum budget
  await updateBanner(page, "Edge Case Test: Invalid Guest Count (0 guests) & Validation", "⚠️");
  await typeInto(page, "#guest-count", "0", 25);
  await page.waitForTimeout(400);
  await typeInto(page, "#budget", "500", 25);
  await page.waitForTimeout(400);

  // Click submit to trigger validation error alert
  await clickElement(page, 'button[type="submit"]', 700);
  await page.waitForTimeout(1400);

  // Live Real Data Entry
  await updateBanner(page, "Live Testing: Real Data Entry — Royal Wedding in Udaipur", "💍");
  
  // Select Wedding
  await clickElement(page, 'button:has-text("Wedding")', 350);

  // Enter Guest Count: 250
  await typeInto(page, "#guest-count", "250", 25);
  await page.waitForTimeout(300);

  // Enter Budget: 15,00,000 INR
  await typeInto(page, "#budget", "1500000", 25);
  await page.waitForTimeout(300);

  // Enter Date
  await page.locator("#event-date").fill("2026-12-15");
  await page.waitForTimeout(200);

  // Enter Destination City
  await typeInto(page, "#event-city", "Udaipur, Rajasthan", 20);
  await page.waitForTimeout(300);

  // Enter Vision Description
  await typeInto(
    page,
    "#description",
    "Royal heritage palace celebration with Rajasthani folk music, lakefront sunset photography, and authentic regional culinary banquets.",
    12
  );
  await page.waitForTimeout(350);

  // Select Preference Tags
  await updateBanner(page, "Selecting Theme Tags: Photography, Lawn, Live Music", "🏷️");
  const tags = ["Photography & Videography", "Live Music / DJ", "Outdoor / Lawn"];
  for (const tag of tags) {
    const tagBtn = page.locator(`button:has-text("${tag}")`).first();
    if (await tagBtn.count() > 0) {
      await clickElement(page, `button:has-text("${tag}")`, 250);
    }
  }

  // Clear pause so viewers can read all inputs
  await updateBanner(page, "Verified Inputs: 250 Guests • ₹15,00,000 Budget • Udaipur", "✅");
  await page.waitForTimeout(1800);

  // ==========================================
  // SECTION 3: GENAI IN ACTION — PLAN GENERATION
  // ==========================================
  console.log("Section 3: GenAI in Action - Generation");
  await updateBanner(page, "Section 3: GenAI in Action — Synthesizing Comprehensive Plan", "🤖");
  await clickElement(page, 'button[type="submit"]', 500);

  // Check for loading spinner or results container
  await page.waitForSelector('div[aria-label="Budget categories"], div[class*="summaryHeader"]', {
    timeout: 60000,
  });
  await page.waitForTimeout(1400);

  await updateBanner(page, "GenAI Generated Structured Plan with Gemini 2.5 Flash", "🎉");
  await page.waitForTimeout(1800);

  // ==========================================
  // SECTION 4: INTERACTIVE PLAN MANAGEMENT
  // ==========================================
  console.log("Section 4: Interactive Plan - Budgeting & Timeline");
  await updateBanner(page, "Section 4: Interactive Budgeting — Real-Time Cost Recalculation", "📊");
  
  // Show budget items and toggle cost-saving tip
  const tipToggle = page.locator('button:has-text("View cost saving tips")').first();
  if (await tipToggle.count() > 0) {
    await clickElement(page, 'button:has-text("View cost saving tips")', 800);
    await page.waitForTimeout(700);
  }

  // Edit a cost input live
  const firstCostInput = page.locator('input[aria-label*="cost"]').first();
  if (await firstCostInput.count() > 0) {
    await updateBanner(page, "Live Budget Adjustment: Customizing Category Allocation", "✏️");
    await clickElement(page, 'input[aria-label*="cost"]', 200);
    await firstCostInput.fill("600000");
    await page.waitForTimeout(900);
  }

  // Milestone Timeline
  await updateBanner(page, "Milestone Timeline: Interactive Phase & Task Tracking", "⏳");
  await clickElement(page, 'button:has-text("Milestone Timeline"), [role="tab"]:has-text("Timeline")', 900);
  await page.waitForTimeout(800);

  // Toggle task status
  const statusBtn = page.locator('button[class*="statusButton"]').first();
  if (await statusBtn.count() > 0) {
    await updateBanner(page, "Progress Tracking: Toggle Task (Todo → In-Progress → Done)", "☑️");
    await clickElement(page, 'button[class*="statusButton"]', 500);
    await page.waitForTimeout(500);
    await clickElement(page, 'button[class*="statusButton"]', 500);
    await page.waitForTimeout(800);
  }

  // Vendor Checklists
  await updateBanner(page, "Vendor Checklists: Status Tracking & Inquiries", "📋");
  await clickElement(page, 'button:has-text("Vendor Checklists"), [role="tab"]:has-text("Vendor")', 900);
  await page.waitForTimeout(800);

  // Cycle a vendor status
  const vendorStatusBtn = page.locator('button[class*="statusToggle"]').first();
  if (await vendorStatusBtn.count() > 0) {
    await clickElement(page, 'button[class*="statusToggle"]', 500);
    await page.waitForTimeout(700);
  }

  // Personalized Ideas
  await updateBanner(page, "Personalized Ideas: Tiered Inspiration (DIY, Standard, Premium)", "💡");
  await clickElement(page, 'button:has-text("Personalized Ideas"), [role="tab"]:has-text("Ideas")', 900);
  await page.waitForTimeout(800);

  const diyBtn = page.locator('button:has-text("DIY")').first();
  if (await diyBtn.count() > 0) {
    await clickElement(page, 'button:has-text("DIY")', 600);
    await page.waitForTimeout(600);
  }

  // ==========================================
  // SECTION 5: GENAI ASSISTANT & GUARDRAILS
  // ==========================================
  console.log("Section 5: GenAI Assistant & Guardrails");
  await updateBanner(page, "Section 5: AI Event Assistant — Context-Aware Deep Streaming", "💬");
  await clickElement(page, 'a[href="/chat"]', 1200);

  // Show active context banner
  await updateBanner(page, "Context Awareness: Auto-linked to Udaipur Wedding Context", "🎯");
  await page.waitForTimeout(1000);

  // Live Query
  await updateBanner(page, "Live GenAI Prompt: 3 Unique Lakefront Guest Welcome Ideas", "✍️");
  await typeInto(
    page,
    'input[aria-label="Chat input message"]',
    "What are 3 unique ways to welcome guests at our Udaipur lakefront wedding within our budget?",
    15
  );
  await page.waitForTimeout(400);

  // Send Streaming Query
  await updateBanner(page, "Deep Streaming in Action: Real-Time Token Generation", "🌊");
  await clickElement(page, 'button:has-text("Send 🚀")', 350);

  // Wait for streaming completion
  await page.waitForSelector('button:has-text("Send 🚀")', { timeout: 45000 });
  await page.waitForTimeout(1800);

  // Test Guardrails
  await updateBanner(page, "Safety Guardrail Test: Gracefully Handling Out-of-Scope Prompts", "🛡️");
  await typeInto(
    page,
    'input[aria-label="Chat input message"]',
    "How do I replace the alternator and oil filter on a car?",
    15
  );
  await page.waitForTimeout(400);
  await clickElement(page, 'button:has-text("Send 🚀")', 350);
  await page.waitForSelector('button:has-text("Send 🚀")', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // ==========================================
  // SECTION 6: PERSISTENCE & EXPORT
  // ==========================================
  console.log("Section 6: LocalStorage Persistence & Export");
  await updateBanner(page, "Section 6: Full LocalStorage Persistence & Plan Export", "💾");
  await clickElement(page, 'a[href="/planner"]', 1000);
  await page.waitForTimeout(1000);

  // Hover over Export buttons
  const exportBtn = page.locator('button:has-text("Export JSON"), button:has-text("Export")').first();
  if (await exportBtn.count() > 0) {
    const box = await exportBtn.boundingBox();
    if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 600);
  }

  await updateBanner(page, "Eventoria Full Walkthrough Complete — Ready for Submission!", "🎉");
  await page.waitForTimeout(2200);

  console.log("Closing browser and finalizing video...");
  await context.close();
  await browser.close();

  // Find generated video
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (videoFiles.length === 0) {
    throw new Error("No video file generated!");
  }

  const rawVideoPath = path.join(VIDEO_DIR, videoFiles[0]);
  const outMp4Path = path.join(PUBLIC_DIR, "eventoria_demo_walkthrough.mp4");
  const outWebpPath = path.join(PUBLIC_DIR, "eventoria_demo_walkthrough.webp");

  console.log(`Transcoding ${rawVideoPath} to MP4 and WebP using FFmpeg...`);

  // Convert to high-quality MP4 (faststart, H.264, universally playable)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -movflags +faststart "${outMp4Path}"`,
    { stdio: "inherit" }
  );

  // Generate lightweight animated WebP preview (10 fps, 960 width)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -vf "fps=10,scale=960:-1:flags=lanczos" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 70 -loop 0 "${outWebpPath}"`,
    { stdio: "inherit" }
  );

  // Clean up raw temp video
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });

  const mp4Stat = fs.statSync(outMp4Path);
  const webpStat = fs.statSync(outWebpPath);
  console.log(`✅ Success!
  MP4: ${outMp4Path} (${(mp4Stat.size / (1024 * 1024)).toFixed(2)} MB)
  WebP: ${outWebpPath} (${(webpStat.size / (1024 * 1024)).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
