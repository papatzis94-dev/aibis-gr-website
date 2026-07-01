#!/usr/bin/env node
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const inquirer = require('inquirer');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');
const display = require('./lib/display');
const Storage = require('./lib/storage');
const ImageDownloader = require('./lib/imageDownloader');
const ProxyManager = require('./lib/proxyManager');
const utils = require('./lib/utils');
puppeteer.use(StealthPlugin());
const SCRAPER_VERSION = '17Q1C';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'
];
class GoogleMapsReviewsScraper {
  constructor(config, runTimestamp, runId, explicitOutputDir) {
    this.version = SCRAPER_VERSION;
    this.config = config;
    this.runTimestamp = runTimestamp;
    this.runId = runId || null;
    // If explicitOutputDir provided, storage writes directly to that path (no timestamp subdir)
    // This is the 17P18 explicit output directory contract for AIBIS runner runs.
    if (explicitOutputDir) {
      this.storage = new Storage(null, null, explicitOutputDir);
    } else {
      this.storage = new Storage(config.baseDir || './data', runTimestamp);
    }
    this.incrementalReviews = new Map();
    this.extractionDiagnostics = {
      observedCardCandidates: 0,
      parseAttemptCount: 0,
      parseSuccessCount: 0,
      parseRejectedNoRating: 0,
      parseRejectedNoText: 0,
      parseRejectedDuplicate: 0,
      parseRejectedOther: 0,
      parseIdentityCollisionCount: 0,
      parseCollisionGroups: 0,
      parseLargestCollisionGroup: 0,
      identitySourceNativeCount: 0,
      identitySourceContentCount: 0,
      identitySourceOrdinalCount: 0,
      unstableIdentityCount: 0,
      finalSanitizedReviewCount: 0,
      maxObservedCards: 0,
      incrementalUniqueCount: 0,
    };
    // 17P19 — Reviews Feed Acquisition State Machine
    this.feedAcquisition = {
      entryState: null,
      exitState: null,
      states: {},
      strategiesAttempted: [],
      successfulStrategy: null,
      feedVerified: false,
      feedVerificationReason: null,
      feedVerificationSignals: [],
      containerRejected: false,
      containerRejectionReason: null,
      manualAssistAvailable: true,
      manualAssistNeeded: false,
      manualAssistUsed: false,
      manualAssistTimeoutMs: null,
      publicReviewsAvailability: null,
    };
    // 17Q1 — More Reviews Sidebar Entry / Container Diagnostics
    this.entryMethod = null;
    this.moreReviewsEntrypointFound = false;
    this.moreReviewsEntrypointClicked = false;
    this.moreReviewsEntrypointLabel = null;
    this.selectedSidebarFound = false;
    this.selectedSidebarScrollHeight = null;
    this.selectedSidebarClientHeight = null;
    this.realReviewCardSelector = '.jftiEf[data-review-id]';
    this.falsePositiveDataReviewIdCount = 0;
    this.sidebarCandidateCount = 0;
    this.sidebarRejectedCount = 0;
    this.sidebarSelectedReason = null;
    const runDir = this.storage.getRunDir();
    this.imageDownloader = new ImageDownloader({
      imageDir: path.join(runDir, 'images'),
      concurrency: config.imageConcurrency
    });
    this.logger = utils.createLogger(config.logDir || './logs');
    this.browser = null;
    this.page = null;
    this.proxyManager = new ProxyManager(this.logger);
    this.currentPhase = null;
    this.lastSuccessfulPhase = null;
  }
  async init() {
    await this.storage.init();
    if (this.config.downloadImages) {
      await this.imageDownloader.init();
    }
  }
  async launchBrowser() {
    const spinner = display.startSpinner('Launching browser...');
    // Random viewport to avoid fingerprinting
    const viewportWidth = 1280 + Math.floor(Math.random() * 160);
    const viewportHeight = 720 + Math.floor(Math.random() * 180);
    // Random user agent
    let userAgent = this.config.userAgent;
    if (this.config.rotateUserAgent || !userAgent) {
      userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
    const isWin = userAgent.includes('Windows');
    const launchArgs = [
      `--window-size=${viewportWidth},${viewportHeight}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-popup-blocking',
      `--lang=${isWin ? 'en-US' : 'en-US'}`,
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--mute-audio'
    ];
    if (this.config.proxy) {
      launchArgs.push(`--proxy-server=${this.config.proxy}`);
      launchArgs.push('--force-webrtc-ip-handling-policy=disable_non_proxied_udp');
      launchArgs.push('--enforce-webrtc-ip-permission-check');
    }
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: launchArgs
    });
    this.page = await this.browser.newPage();
    await this.page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await this.page.evaluateOnNewDocument(() => {
      window.chrome = { runtime: {} };
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(p) {
        if (p === 37445) return 'Intel Inc.';
        if (p === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter(p);
      };
    });
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 + Math.floor(Math.random() * 4)
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => [4, 8][Math.floor(Math.random() * 2)]
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 0
      });
    });
    if (this.config.blockResources) {
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'media', 'manifest'].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    await this.page.setViewport({ width: viewportWidth, height: viewportHeight });
    await this.page.setUserAgent(userAgent);
    // Override Accept-Language header
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
    display.succeedSpinner('Browser launched successfully');
    this.logger.info('Browser launched');
  }
  async navigateToUrl() {
    const spinner = display.startSpinner('Navigating to Google Maps...');
    await this.page.goto(this.config.url, {
      waitUntil: 'networkidle2',
      timeout: this.config.timeout
    });
    await this.page.waitForSelector('[role="main"]', { timeout: 8000 });
    // Handle Google consent/privacy dialog (2026 update)
    const consentHandled = await this.page.evaluate(() => {
      const acceptTexts = ['αποδοχή', 'accept', 'συμφωνώ', 'agree', 'got it', 'ok'];
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (acceptTexts.some(t => text.includes(t))) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    if (consentHandled) {
      await utils.sleep(2000);
      await this.page.waitForSelector('h1', { timeout: 10000 });
    }
    // Wait for the tab bar to be fully loaded
    await this.page.waitForSelector('[role="tablist"], [jslog*="tab"], [jslog*="review"]', { timeout: 10000 }).catch(() => {});
    const businessName = await this.page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading ? heading.textContent : 'Unknown Business';
    });
    display.succeedSpinner(`Loaded: ${businessName}`);
    this.logger.info(`Business: ${businessName}`);
    this.config.businessName = businessName;
  }
  async extractListingMetadata() {
    const metadata = await this.page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || null;
      let aggregateRating = null;
      const MAX_REASONABLE_RATING = 5;
      const MIN_REASONABLE_RATING = 0;
      const ratingSelectors = [
        '[aria-label*="stars"]',
        '[aria-label*="αστέρια"]',
        '[aria-label*="αστεριων"]',
        '[aria-label*="αστέρι"]',
        '[aria-label*="βαθμολογ"]',
        '[itemprop="ratingValue"]',
        '.Aq14fc',
        '[role="img"][aria-label*="star"]'
      ];
      for (const sel of ratingSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const ariaLabel = el.getAttribute('aria-label') || el.textContent || '';
          const match = ariaLabel.match(/[\d.]+/);
          if (match) {
            const val = parseFloat(match[0]);
            if (val > 0 && val <= MAX_REASONABLE_RATING) {
              aggregateRating = val;
              break;
            }
          }
        }
      }
      let reviewCount = null;
      const MAX_REASONABLE_COUNT = 1000000;
      const countSelectors = [
        '.fontBodySmall',
        '[jslog*="25991"]',
        '.jANrlb .fontBodySmall',
        '.LVjmod .fontBodySmall',
        '[role="tab"][aria-label*="Review"]',
        '[role="tab"][aria-label*="Κριτικές"]',
      ];
      for (const sel of countSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent || el.getAttribute('aria-label') || '';
          const match = text.match(/([\d,]+)\s*(reviews?|κριτικές?|κριτική|αξιολογήσεις?)/i);
          if (match) {
            const parsed = parseInt(match[1].replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_REASONABLE_COUNT) {
              reviewCount = parsed;
              break;
            }
          }
        }
      }
      return { placeTitle: title, aggregateRating, reviewCount };
    });
    this.listingMetadata = metadata;
    this.logger.info(`Listing metadata: title="${metadata.placeTitle}" rating=${metadata.aggregateRating} count=${metadata.reviewCount}`);
    // Add metadata warnings
    if (metadata.aggregateRating == null) this.logger.warn('Listing metadata: aggregateRating not found');
    if (metadata.reviewCount == null) this.logger.warn('Listing metadata: reviewCount not found');
  }

  async verifyReviewsTab() {
    return await this.page.evaluate(() => {
      // Check for ARIA feed for reviews
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        const cards = feed.querySelectorAll('[data-review-id]').length;
        return { verified: true, reason: 'role_feed_found', cardCount: cards };
      }
      // Check for review cards in DOM
      const cards = document.querySelectorAll('[data-review-id]');
      if (cards.length >= 1) {
        return { verified: true, reason: 'data_review_id_found', cardCount: cards.length };
      }
      // Check for review-like structures (stars + text containers)
      const starEls = document.querySelectorAll('[role="img"][aria-label*="star"]');
      const textEls = document.querySelectorAll('[jsname="bN97Pc"]');
      if (starEls.length >= 2 && textEls.length >= 1) {
        return { verified: true, reason: 'review_structure_found', cardCount: Math.max(starEls.length, textEls.length) };
      }
      // Check if a Reviews/Κριτικές tab is indicated as active/selected
      const activeTabs = document.querySelectorAll('[role="tab"][aria-selected="true"], [role="tab"][aria-current="page"]');
      for (const tab of activeTabs) {
        const text = (tab.textContent || '').trim().toLowerCase();
        const ariaLabel = (tab.getAttribute('aria-label') || '').toLowerCase();
        if (text.includes('review') || text.includes('κριτικ') || ariaLabel.includes('review') || ariaLabel.includes('κριτικ')) {
          return { verified: true, reason: 'active_tab_label', cardCount: textEls.length };
        }
      }
      // Check for sort controls (present only in reviews panel)
      const sortEl = document.querySelector('[aria-label*="relevant"], [aria-label*="sort"], [jslog*="sort"]');
      if (sortEl) {
        return { verified: true, reason: 'sort_controls_found', cardCount: 0 };
      }
      return { verified: false, reason: 'no_reviews_feed', cardCount: 0 };
    });
  }

  async inspectPublicReviewsAvailability() {
    return await this.page.evaluate(() => {
      const reviewLabels = ['review', 'reviews', 'κριτικ', 'αξιολογ'];
      const excludedLabels = ['write', 'γράψτε', 'search', 'αναζήτηση'];
      const hasAny = (hay, labels) => labels.some(label => hay.includes(label));
      const tabs = [...document.querySelectorAll('[role="tab"]')].map((el) => ({
        text: (el.textContent || '').trim(),
        aria: el.getAttribute('aria-label') || '',
        selected: el.getAttribute('aria-selected') || null,
      }));
      const reviewEntrypoints = [...document.querySelectorAll('[role="tab"], button, [role="button"], a[href]')]
        .map((el) => {
          const text = (el.textContent || '').trim().toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const rect = el.getBoundingClientRect();
          const hay = `${text} ${aria}`;
          return {
            text,
            aria,
            width: rect.width,
            height: rect.height,
            role: el.getAttribute('role') || '',
            tag: el.tagName,
            isVisible: rect.width > 0 && rect.height > 0,
            isHuge: rect.width > window.innerWidth * 0.7 && rect.height > window.innerHeight * 0.35,
            isReviewLike: hasAny(hay, reviewLabels),
            isExcluded: hasAny(hay, excludedLabels),
            isLegalDisclosure: hay.includes('νομικούς λόγους') || hay.includes('legal') || hay.includes('disclosure'),
          };
        })
        .filter((item) => item.isVisible && !item.isHuge && item.isReviewLike && !item.isExcluded);
      const actionableReviewEntrypoints = reviewEntrypoints.filter((item) => !item.isLegalDisclosure);
      const legalDisclosureEntrypoints = reviewEntrypoints.filter((item) => item.isLegalDisclosure);
      return {
        tabCount: tabs.length,
        tabLabels: tabs.map((tab) => tab.text || tab.aria).filter(Boolean).slice(0, 8),
        reviewEntrypointCount: actionableReviewEntrypoints.length,
        legalDisclosureEntrypointCount: legalDisclosureEntrypoints.length,
        hasFeed: !!document.querySelector('[role="feed"]'),
        reviewIdCount: document.querySelectorAll('[data-review-id]').length,
        reviewTextCount: document.querySelectorAll('[jsname="bN97Pc"], .wiI7pd').length,
        appearsUnavailable: actionableReviewEntrypoints.length === 0 && !document.querySelector('[role="feed"]') && document.querySelectorAll('[data-review-id]').length === 0,
      };
    });
  }

  async verifyReviewsFeed() {
    return await this.page.evaluate(() => {
      const signals = [];
      let cardCount = 0;

      // Signal 1: role="feed" container with review cards
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        const feedCards = feed.querySelectorAll('[data-review-id]').length;
        const reviewStructures = feed.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]').length;
        if (feedCards >= 1 || reviewStructures >= 2) {
          signals.push('role_feed_with_cards');
          cardCount = Math.max(cardCount, feedCards, reviewStructures);
        }
      }

      // Signal 2: Multiple data-review-id cards in a contained area (not body-level)
      const reviewIdCards = document.querySelectorAll('[data-review-id]');
      if (reviewIdCards.length >= 2) {
        // Verify they're not scattered across the full page
        const uniqueParents = new Set();
        reviewIdCards.forEach(c => uniqueParents.add(c.parentElement));
        if (uniqueParents.size <= 3) {
          signals.push('data_review_id_cards');
          cardCount = Math.max(cardCount, reviewIdCards.length);
        }
      }

      // Signal 3: Review card structures (star + text + date) scoped to individual cards
      const starEls = document.querySelectorAll('[role="img"][aria-label*="star"]');
      const textEls = document.querySelectorAll('[jsname="bN97Pc"]');
      const dateEls = document.querySelectorAll('.DU9Pgb .xRkPPb, .rsqaWe');
      // Must have multiple stars AND text AND date elements
      if (starEls.length >= 3 && textEls.length >= 1 && dateEls.length >= 1) {
        // Verify these are within card-like parents, not at top level
        let cardLikeParents = 0;
        const checked = new Set();
        starEls.forEach(el => {
          let p = el.parentElement;
          let depth = 0;
          while (p && depth < 5 && !checked.has(p)) {
            if (p.querySelector('[jsname="bN97Pc"]') && p.querySelector('.DU9Pgb .xRkPPb, .rsqaWe')) {
              checked.add(p);
              cardLikeParents++;
              break;
            }
            p = p.parentElement;
            depth++;
          }
        });
        if (cardLikeParents >= 2) {
          signals.push('review_card_structures');
          cardCount = Math.max(cardCount, starEls.length);
        }
      }

      // Signal 4: Sort/filter controls present
      const sortEl = document.querySelector('[aria-label*="relevant"], [aria-label*="sort"], [jslog*="sort"], [aria-label*="Most Recent"], [aria-label*="Newest"], [aria-label*="Highest"], [aria-label*="Lowest"]');
      if (sortEl) {
        signals.push('sort_controls_found');
      }

      // Signal 5: Header/aria label indicates reviews
      const activeTab = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][aria-current="page"]');
      if (activeTab) {
        const tabText = (activeTab.textContent || '').trim().toLowerCase();
        const tabAria = (activeTab.getAttribute('aria-label') || '').toLowerCase();
        if (tabText.includes('review') || tabText.includes('κριτικ') || tabAria.includes('review') || tabAria.includes('κριτικ')) {
          signals.push('active_reviews_tab');
        }
      }

      // Decision: accept active_reviews_tab as standalone sufficient (17Q1C: tab click verified even before cards load)
      // Otherwise require ≥2 signals, or role_feed_with_cards alone.
      const hasActiveTab = signals.includes('active_reviews_tab');
      const hasRoleFeed = signals.includes('role_feed_with_cards');
      const verified = hasActiveTab || hasRoleFeed || signals.length >= 2;
      return { verified, reason: verified ? signals.join(', ') : 'insufficient_signals', signals, cardCount };
    });
  }

  async clickReviewsTab() {
    const spinner = display.startSpinner('Opening reviews tab...');
    this.reviewsTabClickAttempted = true;
    this.reviewsTabClicked = false;
    this.reviewsTabVerified = false;
    this.reviewsTabVerificationReason = null;

    const tabSelectors = [
      '[role="tab"][aria-label*="Reviews"]',
      '[role="tab"][aria-label*="Κριτικές"]',
      '[role="tab"][aria-label*="Αξιολογήσεις"]',
      '[role="tab"][aria-label*="αξιολογ"]',
      '[role="tab"][aria-label*="Review"]'
    ];

    // Try up to 3 times to open and verify the reviews tab
    for (let retry = 0; retry < 3; retry++) {
      let clicked = false;

      // Attempt to click the Reviews tab using selectors
      for (const sel of tabSelectors) {
        try {
          await this.page.waitForSelector(sel, { timeout: 3000 });
          await this.page.click(sel);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      // Fallback: text-based search
      if (!clicked) {
        clicked = await this.page.evaluate(() => {
          const labels = ['review', 'reviews', 'κριτικ', 'αξιολογ'];
          const candidates = document.querySelectorAll('button, [role="tab"], [role="button"], a[href]');
          for (const el of candidates) {
            const text = (el.textContent || '').trim().toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const isHugeContainer = rect.width > window.innerWidth * 0.7 && rect.height > window.innerHeight * 0.35;
            if (isVisible && !isHugeContainer && labels.some(l => text.includes(l) || ariaLabel.includes(l))) {
              el.click();
              return true;
            }
          }
          return false;
        });
      }

      if (clicked) {
        this.reviewsTabClicked = true;
        await utils.sleep(2000);
        // Verify the reviews panel opened
        const verification = await this.verifyReviewsTab();
        this.reviewsTabVerified = verification.verified;
        this.reviewsTabVerificationReason = verification.reason;
        if (verification.verified) {
          display.succeedSpinner(`Reviews tab opened (verified: ${verification.reason})`);
          this.logger.info(`Reviews tab verified: ${verification.reason} cards=${verification.cardCount}`);
          return;
        }
        display.info(`Reviews tab click attempt ${retry + 1} not verified (${verification.reason}) — retrying...`);
        this.logger.warn(`Reviews tab not verified after click: ${verification.reason}`);
      } else {
        display.info(`Reviews tab click attempt ${retry + 1} failed — no matching element found`);
        this.logger.warn('Reviews tab click failed — no matching element');
      }

      await utils.sleep(1000);
    }

    // After all retries, log the failure but don't crash — let scrollAndLoadReviews handle it
    display.warning('⚠️  Could not verify Reviews tab after 3 attempts — continuing (container discovery will fail)');
    this.logger.warn('Reviews tab not verified after 3 attempts');
  }

  async attemptReviewsEntry() {
    this.feedAcquisition.strategiesAttempted = [];
    this.feedAcquisition.successfulStrategy = null;
    this.feedAcquisition.feedVerified = false;
    this.feedAcquisition.feedVerificationReason = null;
    this.feedAcquisition.feedVerificationSignals = [];

    // 17Q1C: Strategy A — Direct Reviews tab/button click (primary). Tried first.
    // 17Q1B probe confirmed the Reviews tab exists and is reachable via [role="tab"] selectors
    // and text fallback. Clicking the tab activates the reviews feed with lazy-loaded cards.
    // Strategy E (More Reviews sidebar) was moved to last resort because the overview's
    // "Περισσότερες αξιολογήσεις" button does not activate the full reviews feed.
    let verified = await this.strategyA_directReviewsTabClick();
    if (verified) { this.entryMethod = 'reviews_tab'; return true; }

    // Strategy B: Rating/review-count header entry
    verified = await this.strategyB_ratingHeaderEntry();
    if (verified) { this.entryMethod = 'reviews_tab_fallback'; return true; }

    // Strategy C: Existing public reviews link/href
    verified = await this.strategyC_reviewsLinkEntry();
    if (verified) { this.entryMethod = 'reviews_tab_fallback'; return true; }

    // Strategy D: Keyboard/focus fallback
    verified = await this.strategyD_keyboardFallback();
    if (verified) { this.entryMethod = 'reviews_tab_fallback'; return true; }

    // Strategy E: More Reviews Sidebar (last resort — only works from overview tab)
    verified = await this.strategyE_moreReviewsSidebar();
    if (verified) { this.entryMethod = 'more_reviews_sidebar_fallback'; return true; }

    // All automatic strategies failed
    const availability = await this.inspectPublicReviewsAvailability().catch(() => null);
    this.feedAcquisition.publicReviewsAvailability = availability;
    this.feedAcquisition.manualAssistNeeded = true;
    this.feedAcquisition.feedVerificationReason = availability?.appearsUnavailable
      ? 'public_reviews_entrypoint_not_exposed'
      : 'all_automatic_strategies_failed';
    this.logger.warn(`All automatic reviews entry strategies failed. Manual assistance required. availability=${JSON.stringify(availability)}`);
    return false;
  }

  async waitForManualFeedVerification(timeoutMs = 300000) {
    this.feedAcquisition.manualAssistNeeded = true;
    this.feedAcquisition.manualAssistAvailable = true;
    this.feedAcquisition.manualAssistUsed = true;
    this.feedAcquisition.manualAssistTimeoutMs = timeoutMs;

    display.warning('Manual assist mode: open the Reviews/Κριτικές panel in the visible browser window.');
    display.info('Do not login, do not solve captchas, and do not use a saved browser profile. Collection continues only after public reviews feed verification.');
    this.logger.warn(`Manual assist waiting for verified reviews feed (timeoutMs=${timeoutMs})`);

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const verification = await this.verifyReviewsFeed();
      if (verification.verified) {
        this.feedAcquisition.feedVerified = true;
        this.feedAcquisition.feedVerificationReason = verification.reason;
        this.feedAcquisition.feedVerificationSignals = verification.signals;
        this.feedAcquisition.successfulStrategy = 'manual_assist';
        this.reviewsTabVerified = true;
        this.reviewsTabVerificationReason = verification.reason;
        display.succeedSpinner(`Manual assist verified reviews feed (${verification.reason})`);
        this.logger.info(`Manual assist feed verified: ${verification.reason} signals=${verification.signals?.join(', ') || 'none'}`);
        return true;
      }
      if (!this.feedAcquisition.publicReviewsAvailability || Date.now() - start < 3000) {
        this.feedAcquisition.publicReviewsAvailability = await this.inspectPublicReviewsAvailability().catch(() => this.feedAcquisition.publicReviewsAvailability);
      }
      await utils.sleep(1500);
    }

    this.feedAcquisition.feedVerified = false;
    this.feedAcquisition.feedVerificationReason = 'manual_reviews_entry_timeout';
    this.stopReason = 'manual_reviews_entry_timeout';
    this.logger.warn('Manual assist timed out before reviews feed verification.');
    return false;
  }

  async strategyA_directReviewsTabClick() {
    this.feedAcquisition.strategiesAttempted.push('strategyA_directReviewsTabClick');

    // Step 1: Try specific role="tab" selectors for Greek/English Reviews
    const tabLabelPatterns = [
      // Exact role="tab" with aria-label
      '[role="tab"][aria-label*="Reviews"]',
      '[role="tab"][aria-label*="Κριτικές"]',
      '[role="tab"][aria-label*="κριτικές"]',
      '[role="tab"][aria-label*="Αξιολογήσεις"]',
      '[role="tab"][aria-label*="αξιολογήσεις"]',
      '[role="tab"][aria-label*="αξιολογ"]',
      '[role="tab"][aria-label*="Review"]',
      '[role="tab"][aria-label*="κριτικ"]',
    ];

    const excludedLabels = [
      'write a review', 'γράψτε κριτική', 'γράψτε μια κριτική', 'add photo', 'add photos',
      'overview', 'about', 'directions', 'website', 'call', 'φωτογραφίες', 'σύνοψη',
      'πληροφορίες', 'οδηγίες', 'ιστοσελίδα', 'τηλέφωνο'
      , 'search reviews', 'αναζήτηση αξιολογήσεων', 'αναζήτηση κριτικών'
    ];

    // Try up to 3 times to open and verify
    for (let retry = 0; retry < 3; retry++) {
      let clicked = false;

      // Try specific role="tab" selectors first
      for (const sel of tabLabelPatterns) {
        try {
          const els = await this.page.$$(sel);
          for (const el of els) {
            const text = await el.evaluate(e => (e.textContent || '').trim().toLowerCase());
            const ariaLabel = await el.evaluate(e => (e.getAttribute('aria-label') || '').toLowerCase());
            // Exclude non-reviews buttons
            if (excludedLabels.some(ex => text.includes(ex) || ariaLabel.includes(ex))) continue;
            await el.click();
            clicked = true;
            break;
          }
          if (clicked) break;
        } catch (e) { continue; }
      }

      // Fallback: text-based search of real clickable review entrypoints only.
      // Do not query generic [aria-label] or [jslog] containers here; Google Maps
      // overview panels can contain review text and aria labels but are not
      // clickable Reviews feed entrypoints.
      if (!clicked) {
        clicked = await this.page.evaluate((excluded) => {
          const labels = ['review', 'reviews', 'κριτικ', 'αξιολογ'];
          const moreReviewLabels = ['more reviews', 'περισσότερες αξιολογήσεις', 'περισσότερες κριτικές'];
          const candidates = [...document.querySelectorAll('button, [role="tab"], [role="button"], a[href]')]
            .map((el) => {
              const text = (el.textContent || '').trim().toLowerCase();
              const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
              const role = (el.getAttribute('role') || '').toLowerCase();
              const rect = el.getBoundingClientRect();
              const hay = `${text} ${ariaLabel}`;
              const hasReviewLabel = labels.some(l => hay.includes(l));
              const isMoreReviews = moreReviewLabels.some(l => hay.includes(l));
              const isExcluded = excluded.some(ex => hay.includes(ex));
              const isVisible = rect.width > 0 && rect.height > 0;
              const isHugeContainer = rect.width > window.innerWidth * 0.7 && rect.height > window.innerHeight * 0.35;
              const score =
                (role === 'tab' ? 100 : 0) +
                (text === 'κριτικές' || text === 'reviews' ? 80 : 0) +
                (isMoreReviews ? 70 : 0) +
                (ariaLabel.includes('αξιολογήσεις για το μέρος') ? 50 : 0) +
                (el.tagName === 'BUTTON' ? 20 : 0) +
                (el.tagName === 'A' ? 10 : 0);
              return { el, text, ariaLabel, hasReviewLabel, isMoreReviews, isExcluded, isVisible, isHugeContainer, score };
            })
            .filter(c => c.isVisible && !c.isHugeContainer && !c.isExcluded && (c.hasReviewLabel || c.isMoreReviews))
            .sort((a, b) => b.score - a.score);
          for (const { el } of candidates) {
            const text = (el.textContent || '').trim().toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            // Must match reviews-related label
            const hasReviewLabel = labels.some(l => text.includes(l) || ariaLabel.includes(l));
            const hasMoreReviewsLabel = moreReviewLabels.some(l => text.includes(l) || ariaLabel.includes(l));
            if (!hasReviewLabel && !hasMoreReviewsLabel) continue;
            // Must NOT match excluded labels
            const isExcluded = excluded.some(ex => text.includes(ex) || ariaLabel.includes(ex));
            if (isExcluded) continue;
            el.click();
            return true;
          }
          return false;
        }, excludedLabels);
      }

      if (clicked) {
        await utils.sleep(2000);
        const verification = await this.verifyReviewsFeed();
        if (verification.verified) {
          this.feedAcquisition.feedVerified = true;
          this.feedAcquisition.feedVerificationReason = verification.reason;
          this.feedAcquisition.feedVerificationSignals = verification.signals;
          this.feedAcquisition.successfulStrategy = 'strategyA_directReviewsTabClick';
          return true;
        }
      }

      await utils.sleep(1500);
    }
    return false;
  }

  async strategyB_ratingHeaderEntry() {
    this.feedAcquisition.strategiesAttempted.push('strategyB_ratingHeaderEntry');

    // Find the rating/review count header near the business title
    const clicked = await this.page.evaluate(() => {
      // Look for elements containing both a rating number and "review"/"κριτικ" text
      const candidates = document.querySelectorAll('button, [role="button"], a, span, div');
      for (const el of candidates) {
        const text = (el.textContent || '').trim().toLowerCase();
        // Contains both a number and review-related text
        const hasNumber = /\d/.test(text);
        const hasReviewLabel = text.includes('review') || text.includes('κριτικ') || text.includes('αξιολόγηση');
        const isExcluded = text.includes('write a review') || text.includes('γράψτε');
        if (hasNumber && hasReviewLabel && !isExcluded && el.click) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      await utils.sleep(2000);
      const verification = await this.verifyReviewsFeed();
      if (verification.verified) {
        this.feedAcquisition.feedVerified = true;
        this.feedAcquisition.feedVerificationReason = verification.reason;
        this.feedAcquisition.feedVerificationSignals = verification.signals;
        this.feedAcquisition.successfulStrategy = 'strategyB_ratingHeaderEntry';
        return true;
      }
    }
    return false;
  }

  async strategyC_reviewsLinkEntry() {
    this.feedAcquisition.strategiesAttempted.push('strategyC_reviewsLinkEntry');

    // Look for a link/href specifically to reviews panel
    const clicked = await this.page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="review"], a[href*="κριτικ"]');
      for (const link of links) {
        const text = (link.textContent || '').trim().toLowerCase();
        const isExcluded = text.includes('write a review') || text.includes('γράψτε');
        if (!isExcluded && link.click) {
          link.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      await utils.sleep(2000);
      const verification = await this.verifyReviewsFeed();
      if (verification.verified) {
        this.feedAcquisition.feedVerified = true;
        this.feedAcquisition.feedVerificationReason = verification.reason;
        this.feedAcquisition.feedVerificationSignals = verification.signals;
        this.feedAcquisition.successfulStrategy = 'strategyC_reviewsLinkEntry';
        return true;
      }
    }
    return false;
  }

  async strategyD_keyboardFallback() {
    this.feedAcquisition.strategiesAttempted.push('strategyD_keyboardFallback');

    // Try keyboard navigation to focus the Reviews tab and press Enter
    // Find the reviews tab element first, then focus and press Enter
    const found = await this.page.evaluate(() => {
      const labels = ['review', 'κριτικ', 'αξιολόγηση'];
      const candidates = document.querySelectorAll('[role="tab"], button, [role="button"], a');
      for (const el of candidates) {
        const text = (el.textContent || '').trim().toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        if (labels.some(l => text.includes(l) || ariaLabel.includes(l))) {
          const isExcluded = text.includes('write a review') || text.includes('γράψτε');
          if (!isExcluded) {
            el.focus();
            return true;
          }
        }
      }
      return false;
    });

    if (found) {
      await utils.sleep(500);
      await this.page.keyboard.press('Enter');
      await utils.sleep(2000);
      const verification = await this.verifyReviewsFeed();
      if (verification.verified) {
        this.feedAcquisition.feedVerified = true;
        this.feedAcquisition.feedVerificationReason = verification.reason;
        this.feedAcquisition.feedVerificationSignals = verification.signals;
        this.feedAcquisition.successfulStrategy = 'strategyD_keyboardFallback';
        return true;
      }
    }
    return false;
  }

  // ── 17Q1: Real review card counting using `.jftiEf[data-review-id]` ──

  async countRealReviewCards() {
    return await this.page.evaluate(() => {
      const realCards = document.querySelectorAll('.jftiEf[data-review-id]');
      const genericCards = document.querySelectorAll('[data-review-id]');
      const falsePositives = genericCards.length - realCards.length;
      return { realCount: realCards.length, genericCount: genericCards.length, falsePositiveCount: Math.max(0, falsePositives) };
    });
  }

  // ── 17Q1C: More Reviews Entrypoint Finder (jslog-primary selector) ──
  // 17Q1B probe confirmed `[jslog*="62394"]` is the "Περισσότερες αξιολογήσεις (514)" button
  // in the overview tab's review preview section. Using jslog as primary avoids false positives
  // from disclaimer text containing "αξιολογήσεις".

  async findMoreReviewsEntrypoint() {
    return await this.page.evaluate(() => {
      const moreReviewLabels = [
        'περισσότερες αξιολογήσεις', 'περισσότερες κριτικές', 'more reviews',
        'Περισσότερες αξιολογήσεις', 'Περισσότερες κριτικές', 'More reviews',
        'more ratings', 'περισσότερες βαθμολογίες',
      ];
      const candidates = [...document.querySelectorAll('button, [role="button"], a, [jslog], [aria-label]')]
        .map(el => {
          const text = (el.textContent || '').trim().toLowerCase();
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const jslog = el.getAttribute('jslog') || '';
          const tag = el.tagName;
          const role = el.getAttribute('role') || '';
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const inSidebar = !!el.closest('.m6QErb');
          const labelMatch = moreReviewLabels.some(l => text.includes(l) || aria.includes(l));
          const jslogMatch = jslog.includes('62394');
          const score =
            (jslogMatch ? 300 : 0) +
            (labelMatch ? 200 : 0) +
            (inSidebar ? 30 : 0) +
            (role === 'button' ? 20 : 0) +
            (tag === 'BUTTON' ? 20 : 0) +
            (isVisible ? 10 : 0);
          return { text, aria, labelMatch, jslogMatch, inSidebar, isVisible, tag, role, score, rect };
        })
        .filter(c => c.score > 0 && c.isVisible)
        .sort((a, b) => b.score - a.score);
      if (candidates.length === 0) {
        return { found: false, reason: 'no_more_reviews_button', candidates: 0 };
      }
      const best = candidates[0];
      // Accept jslogMatch OR labelMatch — both indicate a "More reviews" button
      const isMoreReviews = best.labelMatch || best.jslogMatch;
      if (!isMoreReviews) {
        return { found: false, reason: 'label_not_confirmed', bestLabel: best.text || best.aria, score: best.score, candidates: candidates.length, jslogOnly: best.jslogMatch };
      }
      return { found: true, label: best.text || best.aria, score: best.score, candidates: candidates.length, inSidebar: best.inSidebar, jslogMatch: best.jslogMatch };
    });
  }

  // ── 17Q1C: Strategy E — More Reviews Sidebar Entry (last-resort fallback) ──
  // Tried after all tab-click strategies fail. Uses jslog-primary selector for "Περισσότερες
  // αξιολογήσεις" button in the overview tab's review preview. Verification is relaxed:
  // we check for card count growth instead of requiring full feed signals.

  async strategyE_moreReviewsSidebar() {
    this.feedAcquisition.strategiesAttempted.push('strategyE_moreReviewsSidebar');

    // Step 1: Locate More Reviews entrypoint via jslog-primary selector
    const entryResult = await this.findMoreReviewsEntrypoint();
    this.moreReviewsEntrypointFound = entryResult.found;
    this.moreReviewsEntrypointLabel = entryResult.label || entryResult.reason || null;

    if (!entryResult.found) {
      this.logger.info(`findMoreReviewsEntrypoint: not found (${entryResult.reason})`);
      return false;
    }

    // Step 2: Pre-scroll the sidebar to reveal the button
    await this.page.evaluate(() => {
      // Use jslog as primary selector for the More Reviews button
      const btn = document.querySelector('[jslog*="62394"]');
      if (btn) {
        btn.scrollIntoView({ block: 'center', behavior: 'instant' });
        const sidebar = btn.closest('.m6QErb') || document.querySelector('.m6QErb.DxyBCb');
        if (sidebar) {
          sidebar.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
        return true;
      }
      return false;
    });
    await utils.sleep(1500);

    // Step 3: Click the More Reviews button
    const clicked = await this.page.evaluate(() => {
      const btn = document.querySelector('[jslog*="62394"]');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          btn.click();
          return { clicked: true, label: (btn.textContent || '').trim() };
        }
      }
      return { clicked: false };
    });

    if (!clicked.clicked) {
      this.logger.warn('strategyE: More Reviews button found via jslog but not clickable');
      return false;
    }

    this.moreReviewsEntrypointClicked = true;
    this.moreReviewsEntrypointLabel = clicked.label || this.moreReviewsEntrypointLabel;
    this.logger.info(`strategyE: More Reviews button clicked: label="${this.moreReviewsEntrypointLabel}"`);

    // Step 4: Wait for review cards to load
    await utils.sleep(3000);

    // Step 5: Check for card count growth (relaxed verification for overview-click path)
    const cardCount = await this.countRealReviewCards();
    const hasCards = cardCount.realCount > 0;
    const hasGrowth = cardCount.realCount > 3;

    if (hasGrowth) {
      this.feedAcquisition.feedVerified = true;
      this.feedAcquisition.feedVerificationReason = `strategyE_cards_grown_to_${cardCount.realCount}`;
      this.feedAcquisition.feedVerificationSignals = ['strategyE_overview_more_reviews_cards'];
      this.feedAcquisition.successfulStrategy = 'strategyE_moreReviewsSidebar';
      this.entryMethod = 'more_reviews_sidebar_fallback';
      display.succeedSpinner(`More Reviews sidebar entry verified (${cardCount.realCount} cards after click)`);
      this.logger.info(`StrategyE succeeded: ${cardCount.realCount} real cards detected`);
      return true;
    }

    this.logger.warn(`strategyE: More Reviews button clicked but no card growth (real=${cardCount.realCount} generic=${cardCount.genericCount})`);
    return false;
  }

  // ── 17Q1: Scrollable Main Sidebar Selector ──

  async selectMainScrollableSidebar() {
    const containerInfo = await this.page.evaluate(() => {
      const results = [];
      let sidebars = [];
      let rejectedCount = 0;

      // Collect all .m6QErb containers (Google Maps sidebars)
      const allSidebars = document.querySelectorAll('.m6QErb');
      allSidebars.forEach((sb, idx) => {
        const s = window.getComputedStyle(sb);
        const rect = sb.getBoundingClientRect();
        const cards = sb.querySelectorAll('.jftiEf[data-review-id]').length;
        const genericCards = sb.querySelectorAll('[data-review-id]').length;
        const isScrollable = s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll';
        const hasOverflow = sb.scrollHeight > sb.clientHeight + 50;
        const isLarge = rect.width > 300 && rect.height > 500;
        const isMedium = rect.height > 300;
        sidebars.push({
          idx, tag: sb.tagName, classes: sb.className.slice(0, 60),
          width: Math.round(rect.width), height: Math.round(rect.height),
          scrollHeight: sb.scrollHeight, clientHeight: sb.clientHeight,
          hasOverflow, isScrollable, isLarge, isMedium,
          realCards: cards, genericCards,
          score: (isLarge ? 60 : isMedium ? 30 : 0) + (hasOverflow ? 30 : 0) + (cards > 0 ? cards * 5 : genericCards > 0 ? 10 : 0) + (isScrollable ? 20 : 0),
        });
      });

      // If sidebar analysis found nothing useful, check for role="feed"
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        let scrollParent = feed;
        for (let i = 0; i < 6; i++) {
          const s = window.getComputedStyle(scrollParent);
          if (s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') break;
          if (scrollParent.parentElement) scrollParent = scrollParent.parentElement; else break;
        }
        const realCards = feed.querySelectorAll('.jftiEf[data-review-id]').length;
        results.push({
          strategy: 'role_feed',
          tag: feed.tagName, realCards, scrollHeight: feed.scrollHeight,
          clientHeight: feed.clientHeight, width: feed.getBoundingClientRect().width,
          score: 100 + realCards * 2,
        });
      }

      // Score sidebar candidates
      if (sidebars.length > 0) {
        const bestSidebar = sidebars.reduce((a, b) => a.score > b.score ? a : b);
        if (bestSidebar.score >= 80) {
          results.push({
            strategy: 'main_scrollable_sidebar',
            tag: bestSidebar.tag, realCards: bestSidebar.realCards,
            scrollHeight: bestSidebar.scrollHeight, clientHeight: bestSidebar.clientHeight,
            width: bestSidebar.width, height: bestSidebar.height,
            score: bestSidebar.score, idx: bestSidebar.idx,
            reason: `large_scrollable_sidebar_cards=${bestSidebar.realCards}_height=${bestSidebar.height}`,
          });
        }
        rejectedCount = sidebars.filter(sb => sb.score < 80).length;
      }

      results.sort((a, b) => b.score - a.score);
      const best = results[0] || { strategy: 'none', score: 0, realCards: 0, scrollHeight: 0, clientHeight: 0 };
      return {
        found: best.score > 0,
        strategy: best.strategy,
        realCards: best.realCards || 0,
        scrollHeight: best.scrollHeight || 0,
        clientHeight: best.clientHeight || 0,
        score: best.score,
        sidebarCount: sidebars.length,
        rejectedCount,
        reason: best.reason || best.strategy || 'none',
      };
    });

    this.selectedSidebarFound = containerInfo.found;
    this.selectedSidebarScrollHeight = containerInfo.scrollHeight || null;
    this.selectedSidebarClientHeight = containerInfo.clientHeight || null;
    this.sidebarCandidateCount = containerInfo.sidebarCount || 0;
    this.sidebarRejectedCount = containerInfo.rejectedCount || 0;
    this.sidebarSelectedReason = containerInfo.reason || null;

    this.logger.info(`selectMainScrollableSidebar: found=${containerInfo.found} strategy=${containerInfo.strategy} realCards=${containerInfo.realCards} scrollH=${containerInfo.scrollHeight} clientH=${containerInfo.clientHeight} sidebars=${containerInfo.sidebarCount} rejected=${containerInfo.rejectedCount}`);

    return containerInfo.found;
  }

  async setSortOrder() {
    if (this.config.sortBy === 'relevance') {
      return;
    }
    const spinner = display.startSpinner(`Sorting by ${this.config.sortBy}...`);
    try {
      await this.page.waitForSelector('[aria-label*="relevant"]', { timeout: 5000 });
      await this.page.click('[aria-label*="relevant"]');
      await utils.sleep(1000);
      const keywords = utils.getSortKeywords(this.config.sortBy);
      const clicked = await this.page.evaluate((keywords) => {
        const menuItems = document.querySelectorAll('[role="menuitemradio"]');
        for (const item of menuItems) {
          const text = item.textContent || '';
          if (keywords.some(keyword => text.includes(keyword))) {
            item.click();
            return true;
          }
        }
        return false;
      }, keywords);
      if (clicked) {
        await utils.sleep(2000);
        display.succeedSpinner(`Sorted by ${this.config.sortBy}`);
        this.logger.info(`Sort order set to: ${this.config.sortBy}`);
      } else {
        display.failSpinner(`Could not find sort option: ${this.config.sortBy}`);
      }
    } catch (error) {
      display.failSpinner('Failed to set sort order');
      this.logger.error(`Sort error: ${error.message}`);
    }
  }
  async getTotalReviewCount() {
    try {
      await utils.sleep(500);
      const count = await this.page.evaluate(() => {
        const selectors = [
          '.fontBodySmall',
          '.jANrlb .fontBodySmall',
          '[jslog*="25991"]'
        ];
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const match = element.textContent.match(/(\d+)\s+reviews?/i);
            if (match) {
              return parseInt(match[1]);
            }
          }
        }
        return null;
      });
      return count;
    } catch (error) {
      this.logger.error(`Error getting review count: ${error.message}`);
      return null;
    }
  }
  async findScrollContainer() {
    const containers = await this.page.evaluate(() => {
      const results = [];

      // Strategy 1: role="feed" — standard ARIA for Google Maps reviews
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        let feedParent = feed;
        for (let i = 0; i < 5; i++) {
          const s = window.getComputedStyle(feedParent);
          if (s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') {
            const cards = feed.querySelectorAll('[data-review-id]').length;
            const reviewLike = feed.querySelectorAll('[aria-label*="star"], [jsname="bN97Pc"]').length;
            results.push({ strategy: 'role_feed_scroll_parent', tag: feedParent.tagName, hasCards: cards, reviewLikeCount: reviewLike, score: 100 + cards });
            break;
          }
          if (feedParent.parentElement) feedParent = feedParent.parentElement; else break;
        }
        if (results.length === 0) {
          const cards = feed.querySelectorAll('[data-review-id]').length;
          results.push({ strategy: 'role_feed', tag: feed.tagName, hasCards: cards, reviewLikeCount: feed.querySelectorAll('[aria-label*="star"]').length, score: 90 + cards });
        }
      }

      // Strategy 2: scrollable container with data-review-id children
      const firstCard = document.querySelector('[data-review-id]');
      if (firstCard) {
        let el = firstCard.parentElement;
        while (el && el !== document.body) {
          const s = window.getComputedStyle(el);
          if ((s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
            const cards = el.querySelectorAll('[data-review-id]').length;
            const reviewLike = el.querySelectorAll('[aria-label*="star"], [jsname="bN97Pc"]').length;
            results.push({ strategy: 'scrollable_card_ancestor', tag: el.tagName, hasCards: cards, reviewLikeCount: reviewLike, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, score: 80 + cards * 2 });
            break;
          }
          el = el.parentElement;
        }
        if (results.length === 0 || results.every(r => r.strategy !== 'scrollable_card_ancestor')) {
          results.push({ strategy: 'card_parent_no_scroll', tag: firstCard.parentElement?.tagName || 'UNKNOWN', hasCards: 0, reviewLikeCount: 0, score: 10 });
        }
      }

      // Strategy 3: any scrollable div inside the main panel with review-like content
      const panel = document.querySelector('[role="main"]') || document.querySelector('body');
      const divs = panel.querySelectorAll('div');
      let bestCandidate = null;
      let bestCandidateCount = 0;
      for (const div of divs) {
        const s = window.getComputedStyle(div);
        if ((s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') && div.scrollHeight > div.clientHeight + 50) {
          const reviewLikeCount = div.querySelectorAll('[aria-label*="star"], [role="img"][aria-label*="star"], [data-review-id], [jsname="bN97Pc"]').length;
          if (reviewLikeCount > bestCandidateCount) { bestCandidateCount = reviewLikeCount; bestCandidate = div; }
        }
      }
      if (bestCandidate) {
        const cards = bestCandidate.querySelectorAll('[data-review-id]').length;
        results.push({ strategy: 'scrollable_panel_candidate', tag: bestCandidate.tagName, hasCards: cards, reviewLikeCount: bestCandidateCount, scrollHeight: bestCandidate.scrollHeight, clientHeight: bestCandidate.clientHeight, score: 60 + bestCandidateCount });
      }

      // Strategy 4: sidebar panel (heavily penalized — only use if nothing better exists)
      const sidebar = document.querySelector('.m6QErb') || document.querySelector('[jslog*="sidebar"]');
      if (sidebar) {
        const cards = sidebar.querySelectorAll('[data-review-id]').length;
        const reviewLike = sidebar.querySelectorAll('[aria-label*="star"], [jsname="bN97Pc"]').length;
        results.push({ strategy: 'sidebar_m6QErb', tag: sidebar.tagName, hasCards: cards, reviewLikeCount: reviewLike, scrollHeight: sidebar.scrollHeight, clientHeight: sidebar.clientHeight, score: Math.max(0, 30 + cards * 2 - 50) });
      }

      return results;
    });

    // Score and pick the best container
    this.candidateContainersChecked = containers.length;
    // Sort by score descending
    containers.sort((a, b) => b.score - a.score);
    const best = containers[0] || { strategy: 'none', hasCards: 0, score: 0, reviewLikeCount: 0 };

    // Additional safety: if the listing is known to have many reviews but best container has ≤1 card,
    // reject sidebar/overview false positives
    const listingHasManyReviews = this.listingMetadata?.reviewCount > 10;
    if (listingHasManyReviews && best.hasCards <= 1 && best.reviewLikeCount <= 1) {
      display.warning(`⚠️  Best container (${best.strategy}) has only ${best.hasCards} cards for a listing with ${this.listingMetadata.reviewCount} reviews — rejecting`);
      this.logger.warn(`Rejected container ${best.strategy} (cards=${best.hasCards}, reviewLike=${best.reviewLikeCount}) for large listing`);
      return { found: false, selector: 'rejected_low_card_count', tag: best.tag, hasCards: best.hasCards, score: best.score };
    }

    return { found: true, selector: best.strategy, tag: best.tag, hasCards: best.hasCards, score: best.score };
  }

  async selectReviewsFeedContainer() {
    const containers = await this.page.evaluate(() => {
      const results = [];

      // Container 1: role="feed" — THE standard ARIA for Google Maps reviews
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        let scrollParent = feed;
        for (let i = 0; i < 8; i++) {
          const s = window.getComputedStyle(scrollParent);
          if (s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') {
            const cards = feed.querySelectorAll('[data-review-id]').length;
            const reviewLike = feed.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]').length;
            const textCount = feed.querySelectorAll('[jsname="bN97Pc"]').length;
            results.push({ strategy: 'role_feed_scroll_parent', tag: scrollParent.tagName, hasCards: cards, reviewLikeCount: reviewLike, textCount, score: 100 + cards * 2 });
            break;
          }
          if (scrollParent.parentElement) scrollParent = scrollParent.parentElement; else break;
        }
        if (results.length === 0 || !results.some(r => r.strategy === 'role_feed_scroll_parent')) {
          const cards = feed.querySelectorAll('[data-review-id]').length;
          const reviewLike = feed.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]').length;
          results.push({ strategy: 'role_feed', tag: feed.tagName, hasCards: cards, reviewLikeCount: reviewLike, score: 90 + cards });
        }
      }

      // Container 2: scrollable ancestor of data-review-id cards
      const firstCard = document.querySelector('[data-review-id]');
      if (firstCard) {
        let el = firstCard.parentElement;
        let depth = 0;
        while (el && el !== document.body && depth < 15) {
          const s = window.getComputedStyle(el);
          if ((s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
            const cards = el.querySelectorAll('[data-review-id]').length;
            const reviewLike = el.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]').length;
            results.push({ strategy: 'scrollable_card_ancestor', tag: el.tagName, hasCards: cards, reviewLikeCount: reviewLike, textCount: el.querySelectorAll('[jsname="bN97Pc"]').length, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, score: 80 + cards * 2 });
            break;
          }
          el = el.parentElement;
          depth++;
        }
      }

      // REJECTED: sidebar_m6QErb — intentionally NEVER selected as scroll container
      // Sidebar containers are overview panels, not reviews feed containers.

      return results;
    });

    // Sort by score descending
    containers.sort((a, b) => b.score - a.score);
    const best = containers[0] || { strategy: 'none', hasCards: 0, score: 0, reviewLikeCount: 0, textCount: 0 };

    // Safety check: reject containers with zero valid review cards
    // Only accept if hasCards >= 1 OR (reviewLikeCount >= 3 AND textCount >= 1)
    const hasSufficientSignals = best.hasCards >= 1 || (best.reviewLikeCount >= 3 && best.textCount >= 1);
    if (!hasSufficientSignals) {
      if (best.strategy !== 'none') {
        this.feedAcquisition.containerRejected = true;
        this.feedAcquisition.containerRejectionReason = `Insufficient review signals: cards=${best.hasCards} stars=${best.reviewLikeCount} text=${best.textCount}`;
        this.logger.warn(`Container rejected: ${best.strategy} — insufficient signals`);
      }
      return { found: false, selector: 'rejected_insufficient_signals', strategy: best.strategy, tag: best.tag, hasCards: best.hasCards, score: best.score, reviewLikeCount: best.reviewLikeCount };
    }

    return { found: true, selector: best.strategy, strategy: best.strategy, tag: best.tag, hasCards: best.hasCards, score: best.score, reviewLikeCount: best.reviewLikeCount };
  }

  async countReviewCards() {
    const counts = await this.countRealReviewCards();
    this.falsePositiveDataReviewIdCount = counts.falsePositiveCount;
    if (counts.realCount > 0) return counts.realCount;
    // Fallback: structural heuristics (rating star + text container)
    return await this.page.evaluate(() => {
      let count = 0;
      const ratingEls = document.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]');
      if (ratingEls.length > count) count = ratingEls.length;
      const textEls = document.querySelectorAll('[jsname="bN97Pc"], .wiI7pd');
      if (textEls.length > count) count = textEls.length;
      return count;
    });
  }

  async scrollContainerOnce(containerInfo) {
    return await this.page.evaluate((info) => {
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        const beforeTop = feed.scrollTop;
        const beforeHeight = feed.scrollHeight;
        feed.scrollBy(0, feed.clientHeight * 0.9);
        return { method: 'feed_scrollBy', scrollTopBefore: beforeTop, scrollTopAfter: feed.scrollTop, scrollHeightBefore: beforeHeight, scrollHeightAfter: feed.scrollHeight };
      }
      if (info.selector === 'scrollable_card_ancestor' || info.selector === 'scrollable_panel_candidate' || info.selector === 'sidebar_m6QErb') {
        const containers = document.querySelectorAll('div');
        for (const c of containers) {
          const s = window.getComputedStyle(c);
          if ((s.overflow === 'auto' || s.overflowY === 'auto') && c.scrollHeight > c.clientHeight + 50) {
            const beforeTop = c.scrollTop;
            const beforeHeight = c.scrollHeight;
            c.scrollBy(0, c.clientHeight * 0.9);
            return { method: 'candidate_scrollBy', selector: c.tagName, scrollTopBefore: beforeTop, scrollTopAfter: c.scrollTop, scrollHeightBefore: beforeHeight, scrollHeightAfter: c.scrollHeight };
          }
        }
      }
      // Last resort: wheel event on the main panel
      const panel = document.querySelector('[role="main"]') || document.querySelector('.m6QErb') || document.body;
      const rect = panel.getBoundingClientRect();
      const beforeTop = panel.scrollTop;
      const beforeHeight = panel.scrollHeight;
      panel.scrollBy(0, 1500);
      if (panel.scrollTop === beforeTop) {
        // scrollBy had no effect — try wheel
        const el = panel === document.body ? document.documentElement : panel;
        el.dispatchEvent(new WheelEvent('wheel', { deltaY: 3000, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }));
      }
      return { method: 'fallback_scrollBy_or_wheel', scrollTopBefore: beforeTop, scrollTopAfter: panel.scrollTop, scrollHeightBefore: beforeHeight, scrollHeightAfter: panel.scrollHeight };
    }, containerInfo);
  }

  async extractVisibleReviewCandidates() {
    return await this.page.evaluate(() => {
      // Helper: given a DOM element candidate, check if it's a per-review card (not a container)
      function isValidReviewCard(card) {
        const starCount = card.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"]').length;
        const textCount = card.querySelectorAll('[jsname="bN97Pc"]').length;
        const dateCount = card.querySelectorAll('.DU9Pgb .xRkPPb, .rsqaWe, [class*="date"], [class*="time"]').length;
        // Must have exactly 0 or 1 of each signal
        if (starCount > 1) return false;
        if (textCount > 1) return false;
        if (dateCount > 1) return false;
        // Must have at least one signal
        return starCount >= 1 || textCount >= 1 || dateCount >= 1;
      }

      // Helper: given a DOM element candidate, extract review data
      function extractFromElement(card, cardIndex) {
        try {
          const rawReviewId = card.getAttribute('data-review-id');
          let rating = 0;
          const ratingSelectors = [
            '[role="img"][aria-label]',
            '.fzvQIb',
            '[aria-label*="star"]',
            '[aria-label*="αστ"]',
            '[class*="star"]',
            '[class*="rating"]'
          ];
          for (const sel of ratingSelectors) {
            const ratingEl = card.querySelector(sel);
            if (ratingEl) {
              const ratingText = ratingEl.getAttribute('aria-label') || ratingEl.textContent || '';
              const ratingMatch = ratingText.match(/(\d+)[.,]?\d*/);
              if (ratingMatch) {
                const parsed = parseInt(ratingMatch[1]);
                if (parsed >= 1 && parsed <= 5) {
                  rating = parsed;
                  break;
                }
              }
            }
          }
          if (rating === 0) {
            const cardText = card.textContent || '';
            const starMatch = cardText.match(/(\d+)\s*(star|αστέρι|αστέρια)/i);
            if (starMatch) {
              const parsed = parseInt(starMatch[1]);
              if (parsed >= 1 && parsed <= 5) rating = parsed;
            }
          }
          let text = '';
          const reviewTextEl = card.querySelector('[jsname="bN97Pc"]') || card.querySelector('.MyEned .wiI7pd');
          if (reviewTextEl) {
            text = reviewTextEl.textContent.trim();
          } else {
            const spans = card.querySelectorAll('span');
            let longest = '';
            for (const span of spans) {
              const t = span.textContent.trim();
              if (t.length > longest.length) longest = t;
            }
            if (longest.length > 10) text = longest;
          }
          const dateEl = card.querySelector('.DU9Pgb .xRkPPb, .rsqaWe, [class*="date"], [class*="time"]');
          const date = dateEl ? dateEl.textContent.trim().replace(' on Google', '').replace(' on', '') : null;
          const ownerResponseEl = card.querySelector('.CDe7pd .wiI7pd');
          const ownerResponse = ownerResponseEl ? ownerResponseEl.textContent.trim() : null;
          // Identity source and stable synthetic ID
          let identitySource = 'unknown';
          let reviewId;
          let unstableIdentity = false;
          if (rawReviewId && rawReviewId.length > 0) {
            // Native ID exists — hash it locally, never expose raw value
            const textHash = text ? text.slice(0, 40).replace(/\s+/g, '') : '';
            const keyRaw = `${rawReviewId}|${rating}|${textHash.slice(0, 10)}`;
            let h = 0;
            for (let i = 0; i < keyRaw.length; i++) { h = ((h << 5) - h) + keyRaw.charCodeAt(i); h |= 0; }
            reviewId = `g-${Math.abs(h).toString(36)}`;
            identitySource = 'native_hash';
          } else {
            // Content-based synthetic ID
            const textHash = text ? text.slice(0, 40).replace(/\s+/g, '') : '';
            const contentRaw = `${rating}|${textHash}|${date || ''}|${ownerResponse ? '1' : '0'}`;
            let h = 0;
            for (let i = 0; i < contentRaw.length; i++) { h = ((h << 5) - h) + contentRaw.charCodeAt(i); h |= 0; }
            const contentId = `s-${rating}-${Math.abs(h).toString(36)}`;
            // If no distinguishing content (empty text, null date, no owner response),
            // use run-local ordinal to avoid collisions
            if (!text && !date && !ownerResponse) {
              const ordinalRaw = `run-${cardIndex}-${rating}`;
              let oh = 0;
              for (let i = 0; i < ordinalRaw.length; i++) { oh = ((oh << 5) - oh) + ordinalRaw.charCodeAt(i); oh |= 0; }
              reviewId = `u-${Math.abs(oh).toString(36)}`;
              identitySource = 'run_local_ordinal';
              unstableIdentity = true;
            } else {
              reviewId = contentId;
              identitySource = 'content_hash';
            }
          }
          return { reviewId, rating, text, date, ownerResponse, identitySource, unstableIdentity };
        } catch (e) {
          return null;
        }
      }

      // Strategy A: data-review-id cards (native Google attribute)
      const reviewIdCards = document.querySelectorAll('[data-review-id]');
      if (reviewIdCards.length > 0) {
        const results = [];
        let idx = 0;
        for (const card of reviewIdCards) {
          if (!isValidReviewCard(card)) continue;
          const r = extractFromElement(card, idx++);
          if (r) results.push(r);
        }
        return results;
      }

      // Strategy B: structural detection within the reviews container
      const container = document.querySelector('[role="feed"]') || document.querySelector('[role="main"]') || document.body;
      const starContainers = container.querySelectorAll('[role="img"][aria-label*="star"], [role="img"][aria-label*="αστ"], .fzvQIb');
      const seenParents = new Set();
      const results = [];
      for (const starEl of starContainers) {
        let parent = starEl.parentElement;
        let depth = 0;
        while (parent && parent !== container && depth < 8) {
          const hasText = parent.querySelector('[jsname="bN97Pc"]') || parent.querySelector('.MyEned .wiI7pd');
          const hasDate = parent.querySelector('.DU9Pgb .xRkPPb, .rsqaWe, [class*="date"], [class*="time"]');
          if ((hasText || hasDate) && !seenParents.has(parent)) {
            // Verify this parent is a valid single-review card, not a container
            if (isValidReviewCard(parent)) {
              seenParents.add(parent);
              const r = extractFromElement(parent, results.length);
              if (r) results.push(r);
              break;
            }
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      if (results.length > 0) return results;

      // Strategy C: text-based detection
      const textContainers = container.querySelectorAll('[jsname="bN97Pc"]');
      for (const textEl of textContainers) {
        let parent = textEl.parentElement;
        let depth = 0;
        while (parent && parent !== container && depth < 8) {
          if (!seenParents.has(parent)) {
            const hasStar = parent.querySelector('[role="img"][aria-label*="star"], .fzvQIb');
            const hasDate = parent.querySelector('.DU9Pgb .xRkPPb, .rsqaWe, [class*="date"], [class*="time"]');
            if ((hasStar || hasDate) && isValidReviewCard(parent)) {
              seenParents.add(parent);
              const r = extractFromElement(parent, results.length);
              if (r) results.push(r);
              break;
            }
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      return results;
    });
  }

  async scrollAndLoadReviews() {
    const targetCount = this.listingMetadata?.reviewCount || await this.getTotalReviewCount();
    if (targetCount) {
      display.info(`📊 Starting review collection... (Target: ${targetCount} reviews)`);
      this.logger.info(`Target review count: ${targetCount}`);
    } else {
      display.info('📊 Starting review collection...');
      this.logger.info('Beginning scroll loop (target count unknown)');
    }
    // Wait for reviews panel to fully render
    await utils.sleep(2000);
    // Find scroll container
    const containerInfo = await this.findScrollContainer();
    display.info(`🔍 Scroll container: ${containerInfo.selector} (found=${containerInfo.found}, cards=${containerInfo.hasCards})`);
    this.logger.info(`Scroll container: ${JSON.stringify(containerInfo)}`);
    this.containerFound = containerInfo.found;
    this.containerSelector = containerInfo.selector;
    // Reset incremental collection
    this.incrementalReviews = new Map();
    this.extractionDiagnostics = {
      observedCardCandidates: 0,
      parseAttemptCount: 0,
      parseSuccessCount: 0,
      parseRejectedNoRating: 0,
      parseRejectedNoText: 0,
      parseRejectedDuplicate: 0,
      parseRejectedOther: 0,
      parseIdentityCollisionCount: 0,
      parseCollisionGroups: 0,
      parseLargestCollisionGroup: 0,
      identitySourceNativeCount: 0,
      identitySourceContentCount: 0,
      identitySourceOrdinalCount: 0,
      unstableIdentityCount: 0,
      finalSanitizedReviewCount: 0,
      maxObservedCards: 0,
      incrementalUniqueCount: 0,
    };
    let previousReviewCount = await this.countReviewCards();
    let noChangeCount = 0;
    let stopReason = null;
    let maxObservedCards = previousReviewCount;
    let scrollTopBefore = 0;
    let scrollTopAfter = 0;
    let scrollHeightBefore = 0;
    let scrollHeightAfter = 0;
    const startTimeMs = Date.now();
    const maxRuntimeMs = 10 * 60 * 1000;
    this.scrollAttempts = 0;
    this.scrollDiagnostics = [];
    for (let attempt = 0; attempt < this.config.maxScrolls; attempt++) {
      if (Date.now() - startTimeMs > maxRuntimeMs) {
        stopReason = 'max_runtime';
        display.warning(`⏱️  Reached max runtime (${Math.round(maxRuntimeMs / 60000)} min) — stopping`);
        break;
      }
      const currentReviewCount = await this.countReviewCards();
      if (currentReviewCount > maxObservedCards) maxObservedCards = currentReviewCount;
      this.extractionDiagnostics.observedCardCandidates = currentReviewCount;
      this.extractionDiagnostics.maxObservedCards = maxObservedCards;
      this.scrollAttempts = attempt + 1;
      const newReviews = currentReviewCount - previousReviewCount;
      if (attempt % 5 === 0 && currentReviewCount > 0) {
        if (targetCount) {
          display.info(`📥 Scroll ${attempt + 1}: ${currentReviewCount}/${targetCount} reviews${newReviews > 0 ? ` (+${newReviews})` : ''}`);
        } else {
          display.info(`📥 Scroll ${attempt + 1}: ${currentReviewCount} reviews${newReviews > 0 ? ` (+${newReviews})` : ''}`);
        }
      }
      if (targetCount && currentReviewCount >= targetCount) {
        display.success(`✅ Complete! Loaded all ${currentReviewCount} reviews`);
        stopReason = 'target_reached';
        break;
      }
      // Incremental collection: extract currently visible cards before scroll
      const visibleCandidates = await this.extractVisibleReviewCandidates();
      this.extractionDiagnostics.parseAttemptCount += visibleCandidates.length;
      for (const candidate of visibleCandidates) {
        // Dedupe key: reviewId when available, else rating+textHash+date
        let key;
        if (candidate.reviewId) {
          key = candidate.reviewId;
        } else {
          const textHash = candidate.text ? candidate.text.slice(0, 40).replace(/\s+/g, '') : '';
          key = `${candidate.rating}|${textHash}|${candidate.date || ''}|${candidate.ownerResponse ? '1' : '0'}`;
        }
        if (this.incrementalReviews.has(key)) {
          this.extractionDiagnostics.parseRejectedDuplicate++;
          continue;
        }
        // Track identity source
        if (candidate.identitySource === 'native_hash') this.extractionDiagnostics.identitySourceNativeCount++;
        else if (candidate.identitySource === 'content_hash') this.extractionDiagnostics.identitySourceContentCount++;
        else if (candidate.identitySource === 'run_local_ordinal') {
          this.extractionDiagnostics.identitySourceOrdinalCount++;
          this.extractionDiagnostics.unstableIdentityCount++;
        }
        // Reject cards without a valid rating (0 rating = extraction failed)
        if (!candidate.rating || candidate.rating < 1 || candidate.rating > 5) {
          this.extractionDiagnostics.parseRejectedNoRating++;
          continue;
        }
        // Count empty text without rejecting
        if (!candidate.text || candidate.text.length === 0) {
          this.extractionDiagnostics.parseRejectedNoText++;
        }
        this.extractionDiagnostics.parseSuccessCount++;
        this.incrementalReviews.set(key, {
          reviewId: candidate.reviewId || null,
          rating: candidate.rating,
          text: candidate.text || '',
          date: candidate.date || null,
          ownerResponse: candidate.ownerResponse || null,
          identitySource: candidate.identitySource || 'unknown',
          unstableIdentity: candidate.unstableIdentity || false,
        });
      }
      this.extractionDiagnostics.incrementalUniqueCount = this.incrementalReviews.size;
      // Scroll
      const scrollResult = await this.scrollContainerOnce(containerInfo);
      if (attempt === 0) {
        scrollTopBefore = scrollResult.scrollTopBefore;
        scrollHeightBefore = scrollResult.scrollHeightBefore;
      }
      scrollTopAfter = scrollResult.scrollTopAfter;
      scrollHeightAfter = scrollResult.scrollHeightAfter;
      this.scrollDiagnostics.push({ attempt, cardsBefore: previousReviewCount, cardsAfter: currentReviewCount, candidateCards: visibleCandidates.length, scrollTop: scrollTopAfter, scrollHeight: scrollHeightAfter });
      await utils.sleep(this.config.scrollDelay + Math.floor(Math.random() * 700));
      if (currentReviewCount === previousReviewCount) {
        noChangeCount++;
        if (noChangeCount >= 8) {
          if (targetCount) {
            display.warning(`⚠️  No new reviews after ${noChangeCount} scrolls — Loaded ${currentReviewCount}/${targetCount}`);
          } else {
            display.success(`✅ No new reviews after ${noChangeCount} scrolls — Total: ${currentReviewCount}`);
          }
          if (scrollTopAfter === scrollTopBefore && scrollHeightAfter === scrollHeightBefore) {
            stopReason = 'no_scroll_movement';
          } else {
            stopReason = 'no_growth';
          }
          break;
        }
      } else {
        noChangeCount = 0;
      }
      previousReviewCount = currentReviewCount;
    }
    if (!stopReason) {
      const finalCount = previousReviewCount;
      if (targetCount) {
        display.warning(`⚠️  Reached scroll limit — Loaded ${finalCount}/${targetCount} reviews`);
      } else {
        display.warning('⚠️  Reached maximum scroll limit');
      }
      stopReason = 'max_scrolls';
    }
    this.stopReason = stopReason;
    this.maxObservedCards = maxObservedCards;
    this.noGrowthCycles = noGrowthCycles;
    this.bottomReached = bottomReached;
    this.extractionDiagnostics.finalSanitizedReviewCount = this.incrementalReviews.size;
    this.diagnostics = {
      version: this.version,
      placeTitle: this.listingMetadata?.placeTitle,
      listingRating: this.listingMetadata?.aggregateRating,
      listingReviewCount: this.listingMetadata?.reviewCount,
      reviewsTabClickAttempted: this.reviewsTabClickAttempted || false,
      reviewsTabClicked: this.reviewsTabClicked || false,
      reviewsTabVerified: this.reviewsTabVerified || false,
      reviewsTabVerificationReason: this.reviewsTabVerificationReason || null,
      feedFound: containerInfo.found,
      feedSelector: containerInfo.selector,
      candidateContainersChecked: this.candidateContainersChecked || 0,
      chosenContainerStrategy: containerInfo.selector,
      chosenContainerScore: containerInfo.score || 0,
      chosenContainerReviewCardCount: containerInfo.hasCards || 0,
      scrollAttempts: this.scrollAttempts,
      scrollHeightStart: scrollHeightBefore,
      scrollHeightEnd: scrollHeightAfter,
      scrollTopStart: scrollTopBefore,
      scrollTopEnd: scrollTopAfter,
      maxObservedCardCount: maxObservedCards,
      collectedCount: previousReviewCount,
      stopReason,
      warnings: this.diagnostics?.warnings || [],
    };
    // Log extraction diagnostics
    display.info(`📊 Extraction: ${this.extractionDiagnostics.parseSuccessCount} parsed, ${this.extractionDiagnostics.parseRejectedNoRating} no-rating, ${this.extractionDiagnostics.parseRejectedDuplicate} dupes, ${this.extractionDiagnostics.incrementalUniqueCount} unique`);
    this.logger.info(`Extraction diag: ${JSON.stringify(this.extractionDiagnostics)}`);
    this.logger.info(`Scroll completed. Reviews: ${previousReviewCount}${targetCount ? `/ ${targetCount}` : ''} reason: ${stopReason} attempts: ${this.scrollAttempts} feedFound: ${containerInfo.found} selector: ${containerInfo.selector} scrollMoved: ${scrollTopAfter !== scrollTopBefore}`);
    return this.incrementalReviews.size;
  }

  async exhaustiveLoadReviews() {
    const targetCount = this.listingMetadata?.reviewCount || null;
    if (targetCount) {
      display.info(`📊 Starting exhaustive review collection... (Target: ${targetCount} reviews)`);
      this.logger.info(`Target review count: ${targetCount}`);
    } else {
      display.info('📊 Starting exhaustive review collection...');
      this.logger.info('Beginning exhaustive scroll loop (target count unknown)');
    }

    // Wait for reviews panel to fully render
    await utils.sleep(2000);

    // Select reviews feed container — reject sidebar
    const containerInfo = await this.selectReviewsFeedContainer();
    display.info(`🔍 Reviews container: ${containerInfo.selector} (found=${containerInfo.found}, cards=${containerInfo.hasCards})`);
    this.logger.info(`Reviews container: ${JSON.stringify(containerInfo)}`);
    this.containerFound = containerInfo.found;
    this.containerSelector = containerInfo.selector;

    // 17Q1: Select and diagnose the main scrollable sidebar
    await this.selectMainScrollableSidebar();

    // If container not found or rejected, stop
    if (!containerInfo.found) {
      display.warning(`⚠️ No valid reviews container found. Container was rejected or missing.`);
      this.logger.warn(`Reviews container not found or rejected`);
      this.stopReason = 'reviews_container_not_found';
      await this.storage.saveReviews([]);
      await this.storage.saveMetadata({
        version: this.version,
        runTimestamp: this.runTimestamp,
        totalReviews: 0,
        stopReason: 'reviews_container_not_found',
        diagnostics: this.buildDiagnostics({ stopReason: 'reviews_container_not_found', feedFound: false }),
        extractionDiagnostics: this.buildEmptyExtractionDiagnostics(),
        stats: { totalReviews: 0, avgRating: 0, ratings: {}, withText: 0, withImages: 0, withOwnerResponse: 0 },
      });
      return 0;
    }

    // Reset incremental collection
    this.incrementalReviews = new Map();
    this.extractionDiagnostics = this.buildEmptyExtractionDiagnostics();

    // Collect visible cards before first scroll
    let previousUniqueCount = 0;
    let noGrowthCycles = 0;
    let bottomReached = false;
    let stopReason = null;
    let maxObservedCards = 0;
    let scrollTopValues = [];
    let scrollHeightValues = [];
    const startTimeMs = Date.now();
    const maxRuntimeMs = 10 * 60 * 1000;
    const maxScrollAttempts = 500;
    const noGrowthLimit = 20;
    this.scrollAttempts = 0;
    this.scrollDiagnostics = [];

    for (let attempt = 0; attempt < maxScrollAttempts; attempt++) {
      // Check max runtime
      if (Date.now() - startTimeMs > maxRuntimeMs) {
        stopReason = 'max_runtime';
        display.warning(`⏱️ Reached max runtime (${Math.round(maxRuntimeMs / 60000)} min) — stopping`);
        break;
      }

      // Extract currently visible cards BEFORE scroll (incremental for virtualized feed)
      const visibleCandidates = await this.extractVisibleReviewCandidates();
      this.extractionDiagnostics.parseAttemptCount += visibleCandidates.length;

      // Process each candidate
      let newUniqueThisCycle = 0;
      for (const candidate of visibleCandidates) {
        let key;
        if (candidate.reviewId) {
          key = candidate.reviewId;
        } else {
          const textHash = candidate.text ? candidate.text.slice(0, 40).replace(/\s+/g, '') : '';
          key = `${candidate.rating}|${textHash}|${candidate.date || ''}|${candidate.ownerResponse ? '1' : '0'}`;
        }
        if (this.incrementalReviews.has(key)) {
          this.extractionDiagnostics.parseRejectedDuplicate++;
          continue;
        }
        // Track identity source
        if (candidate.identitySource === 'native_hash') this.extractionDiagnostics.identitySourceNativeCount++;
        else if (candidate.identitySource === 'content_hash') this.extractionDiagnostics.identitySourceContentCount++;
        else if (candidate.identitySource === 'run_local_ordinal') {
          this.extractionDiagnostics.identitySourceOrdinalCount++;
          this.extractionDiagnostics.unstableIdentityCount++;
        }
        // Reject cards without valid rating
        if (!candidate.rating || candidate.rating < 1 || candidate.rating > 5) {
          this.extractionDiagnostics.parseRejectedNoRating++;
          continue;
        }
        if (!candidate.text || candidate.text.length === 0) {
          this.extractionDiagnostics.parseRejectedNoText++;
        }
        this.extractionDiagnostics.parseSuccessCount++;
        this.incrementalReviews.set(key, {
          reviewId: candidate.reviewId || null,
          rating: candidate.rating,
          text: candidate.text || '',
          date: candidate.date || null,
          ownerResponse: candidate.ownerResponse || null,
          identitySource: candidate.identitySource || 'unknown',
          unstableIdentity: candidate.unstableIdentity || false,
        });
        newUniqueThisCycle++;
      }

      this.extractionDiagnostics.incrementalUniqueCount = this.incrementalReviews.size;
      const currentUniqueCount = this.incrementalReviews.size;
      if (currentUniqueCount > maxObservedCards) maxObservedCards = currentUniqueCount;
      this.extractionDiagnostics.maxObservedCards = maxObservedCards;
      this.extractionDiagnostics.observedCardCandidates = currentUniqueCount;

      // Progress log
      if (attempt % 5 === 0) {
        if (targetCount) {
          display.info(`📥 Scroll ${attempt + 1}: ${currentUniqueCount}/${targetCount} reviews (+${newUniqueThisCycle} new)`);
        } else {
          display.info(`📥 Scroll ${attempt + 1}: ${currentUniqueCount} reviews (+${newUniqueThisCycle} new)`);
        }
      }

      // Check if target reached
      if (targetCount && currentUniqueCount >= targetCount * 0.98) {
        display.success(`✅ Complete! Loaded ${currentUniqueCount} reviews (target: ${targetCount})`);
        stopReason = 'target_reached';
        break;
      }

      // Scroll the verified container
      const scrollResult = await this.scrollFeedContainerOnce(containerInfo);
      scrollTopValues.push(scrollResult.scrollTopAfter);
      scrollHeightValues.push(scrollResult.scrollHeightAfter);

      // Check bottom reached
      if (scrollResult.bottomReached) {
        bottomReached = true;
      }

      this.scrollDiagnostics.push({
        attempt,
        cardsObserved: currentUniqueCount,
        newThisCycle: newUniqueThisCycle,
        scrollTop: scrollResult.scrollTopAfter,
        scrollHeight: scrollResult.scrollHeightAfter,
        bottomReached: scrollResult.bottomReached,
      });

      // Check no growth
      if (newUniqueThisCycle === 0) {
        noGrowthCycles++;
        if (noGrowthCycles >= noGrowthLimit) {
          if (targetCount) {
            display.warning(`⚠️ No new reviews after ${noGrowthCycles} continuous scrolls — Loaded ${currentUniqueCount}/${targetCount}`);
          } else {
            display.success(`✅ No new reviews after ${noGrowthCycles} scrolls — Total: ${currentUniqueCount}`);
          }
          stopReason = bottomReached ? 'bottom_reached_no_growth' : 'no_growth';
          break;
        }
      } else {
        noGrowthCycles = 0;
      }

      this.scrollAttempts = attempt + 1;
      previousUniqueCount = currentUniqueCount;

      // Jittered delay between scrolls
      await utils.sleep(this.config.scrollDelay + Math.floor(Math.random() * 500));
    }

    if (!stopReason) {
      const finalCount = this.incrementalReviews.size;
      if (targetCount) {
        display.warning(`⚠️ Reached scroll limit — Loaded ${finalCount}/${targetCount} reviews`);
      } else {
        display.warning('⚠️ Reached maximum scroll limit');
      }
      stopReason = 'max_scrolls';
    }

    this.stopReason = stopReason;
    this.maxObservedCards = maxObservedCards;
    this.extractionDiagnostics.finalSanitizedReviewCount = this.incrementalReviews.size;

    // Check for "More"/"Περισσότερα" expansion (expand before text extraction)
    await this.expandMoreButtons();

    // Log final diagnostics
    display.info(`📊 Extraction: ${this.extractionDiagnostics.parseSuccessCount} parsed, ${this.extractionDiagnostics.parseRejectedNoRating} no-rating, ${this.extractionDiagnostics.parseRejectedDuplicate} dupes, ${this.extractionDiagnostics.incrementalUniqueCount} unique`);
    this.logger.info(`Extraction diag: ${JSON.stringify(this.extractionDiagnostics)}`);
    this.logger.info(`Exhaustive load completed. Reviews: ${this.incrementalReviews.size}${targetCount ? `/ ${targetCount}` : ''} reason: ${stopReason} attempts: ${this.scrollAttempts} noGrowth: ${noGrowthCycles} bottom: ${bottomReached}`);
    this.diagnostics = this.buildDiagnostics({
      stopReason,
      feedFound: containerInfo.found,
      feedSelector: containerInfo.selector,
      chosenContainerStrategy: containerInfo.selector,
      chosenContainerScore: containerInfo.score || 0,
      chosenContainerReviewCardCount: containerInfo.hasCards || 0,
      candidateContainersChecked: this.candidateContainersChecked || 0,
      scrollAttempts: this.scrollAttempts,
      noGrowthCycles,
      bottomReached,
      maxObservedCardCount: maxObservedCards,
      collectedCount: this.incrementalReviews.size,
    });

    return this.incrementalReviews.size;
  }

  async scrollFeedContainerOnce(containerInfo) {
    return await this.page.evaluate((info) => {
      const feed = document.querySelector('[role="feed"]');
      let scrollTarget = null;

      if (feed) {
        // Find the scrollable parent of feed
        scrollTarget = feed;
        for (let i = 0; i < 10; i++) {
          const s = window.getComputedStyle(scrollTarget);
          if (s.overflow === 'auto' || s.overflow === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') break;
          if (scrollTarget.parentElement) scrollTarget = scrollTarget.parentElement; else break;
        }
      } else if (info.found && info.selector !== 'none') {
        // Try to find the selected container by scrolling all scrollable containers
        const divs = document.querySelectorAll('div');
        for (const div of divs) {
          const s = window.getComputedStyle(div);
          if ((s.overflow === 'auto' || s.overflowY === 'auto') && div.scrollHeight > div.clientHeight + 50) {
            const hasCards = div.querySelectorAll('[data-review-id], [role="img"][aria-label*="star"]').length;
            if (hasCards >= 1) {
              scrollTarget = div;
              break;
            }
          }
        }
      }

      if (!scrollTarget) {
        // Last resort: main panel
        scrollTarget = document.querySelector('[role="main"]') || document.body;
      }

      const beforeTop = scrollTarget.scrollTop;
      const beforeHeight = scrollTarget.scrollHeight;
      const clientHeight = scrollTarget.clientHeight;

      // Scroll by 90% of client height
      scrollTarget.scrollBy(0, clientHeight * 0.9);

      const afterTop = scrollTarget.scrollTop;
      const afterHeight = scrollTarget.scrollHeight;
      const bottomReached = (afterTop + clientHeight >= afterHeight - 100);

      // If scrollBy had no effect, try wheel event
      if (afterTop === beforeTop && beforeHeight > clientHeight) {
        const rect = scrollTarget.getBoundingClientRect();
        scrollTarget.dispatchEvent(new WheelEvent('wheel', {
          deltaY: 3000,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        }));
        const wheelAfterTop = scrollTarget.scrollTop;
        return {
          method: wheelAfterTop !== afterTop ? 'wheel_fallback' : 'scrollBy',
          scrollTopBefore: beforeTop,
          scrollTopAfter: Math.max(afterTop, scrollTarget.scrollTop),
          scrollHeightBefore: beforeHeight,
          scrollHeightAfter: scrollTarget.scrollHeight,
          bottomReached: (Math.max(afterTop, scrollTarget.scrollTop) + clientHeight >= scrollTarget.scrollHeight - 100)
        };
      }

      return {
        method: 'scrollBy',
        scrollTopBefore: beforeTop,
        scrollTopAfter: afterTop,
        scrollHeightBefore: beforeHeight,
        scrollHeightAfter: afterHeight,
        bottomReached
      };
    }, containerInfo);
  }

  async expandMoreButtons() {
    // Expand "More"/"Περισσότερα" buttons inside review cards for full text extraction
    try {
      const expanded = await this.page.evaluate(() => {
        const moreLabels = ['more', 'περισσότερα', 'More', 'Περισσότερα'];
        let count = 0;
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          if (moreLabels.includes(text) && btn.offsetParent !== null) {
            btn.click();
            count++;
          }
        }
        return count;
      });
      if (expanded > 0) {
        display.info(`🔍 Expanded ${expanded} "More"/"Περισσότερα" button(s) for full text`);
        await utils.sleep(1000);
      }
    } catch (e) {
      this.logger.warn(`More button expansion failed: ${e.message}`);
    }
  }

  async extractReviews() {
    const spinner = display.startSpinner('Extracting review data...');
    // Final pass: capture any remaining visible cards not yet in the incremental cache
    const finalVisible = await this.extractVisibleReviewCandidates();
    for (const candidate of finalVisible) {
      let key;
      if (candidate.reviewId) {
        key = candidate.reviewId;
      } else {
        const textHash = candidate.text ? candidate.text.slice(0, 40).replace(/\s+/g, '') : '';
        key = `${candidate.rating}|${textHash}|${candidate.date || ''}|${candidate.ownerResponse ? '1' : '0'}`;
      }
      if (this.incrementalReviews.has(key)) continue;
      if (!candidate.rating || candidate.rating < 1 || candidate.rating > 5) continue;
      this.incrementalReviews.set(key, {
        reviewId: candidate.reviewId || null,
        rating: candidate.rating,
        text: candidate.text || '',
        date: candidate.date || null,
        ownerResponse: candidate.ownerResponse || null,
      });
      this.extractionDiagnostics.parseSuccessCount++;
    }
    this.extractionDiagnostics.finalSanitizedReviewCount = this.incrementalReviews.size;
    // Build final review array from incremental cache
    const reviews = [];
    for (const [, review] of this.incrementalReviews) {
      reviews.push({
        reviewId: review.reviewId || null,
        name: 'Google χρήστης',
        rating: review.rating,
        text: review.text || '',
        date: review.date || null,
        likes: 0,
        ownerResponse: review.ownerResponse || null,
        profilePicture: null,
        profileUrl: null,
        images: [],
        scrapedAt: new Date().toISOString()
      });
    }
    display.succeedSpinner(`Extracted ${reviews.length} reviews (from ${this.extractionDiagnostics.incrementalUniqueCount} unique candidates)`);
    this.logger.info(`Extracted ${reviews.length} reviews. Extraction diag: ${JSON.stringify(this.extractionDiagnostics)}`);
    return reviews;
  }
  processDates(reviews) {
    return reviews.map(review => ({
      ...review,
      dateISO: utils.parseRelativeDate(review.date)
    }));
  }
  async downloadImages(reviews) {
    if (!this.config.downloadImages || reviews.length === 0) {
      return reviews;
    }
    display.section('📥 Downloading Images');
    this.logger.info('Starting image downloads');
    const progressBar = display.createProgressBar(100, 'Images');
    await this.imageDownloader.downloadAllImages(reviews, (current, total) => {
      const percent = Math.floor((current / total) * 100);
      progressBar.update(percent);
    });
    display.stopProgress();
    const stats = this.imageDownloader.getStats();
    display.success(`Downloaded ${stats.downloaded} images`);
    this.logger.info(`Downloaded ${stats.downloaded} images`);
    return reviews;
  }
  async saveResults(reviews) {
    const spinner = display.startSpinner('Saving results...');
    const inputCount = reviews.length;
    this.extractionDiagnostics.saveResultsInputCount = inputCount;
    const writeOk = await this.storage.saveReviews(reviews);
    if (!writeOk) {
      throw new Error(`saveReviews failed: returned false (inputCount=${inputCount})`);
    }
    // Read back to verify count
    let writtenCount = 0;
    try {
      const fs = require('fs');
      const readBack = JSON.parse(fs.readFileSync(this.storage.reviewsFile, 'utf8'));
      writtenCount = Array.isArray(readBack) ? readBack.length : 0;
    } catch (e) {
      this.logger.warn(`Read-back verification failed: ${e.message}`);
    }
    this.extractionDiagnostics.reviewsJsonWrittenCount = writtenCount;
    if (inputCount !== writtenCount) {
      display.warning(`⚠️  Output count mismatch: ${inputCount} input vs ${writtenCount} written`);
      this.logger.warn(`Output count mismatch: ${inputCount} input vs ${writtenCount} written`);
    }
    if (this.config.exportCSV) {
      await this.storage.exportToCSV(reviews);
    }
    const stats = this.storage.calculateStats(reviews);
    const metadataPayload = {
      url: this.config.url,
      sortBy: this.config.sortBy,
      totalReviews: reviews.length,
      stats: stats,
      runTimestamp: this.runTimestamp
    };
    if (this.listingMetadata) {
      metadataPayload.placeTitle = this.listingMetadata.placeTitle;
      metadataPayload.aggregateRating = this.listingMetadata.aggregateRating;
      metadataPayload.reviewCount = this.listingMetadata.reviewCount;
    }
    metadataPayload.scrollAttempts = this.scrollAttempts || 0;
    metadataPayload.stopReason = this.stopReason || 'unknown';
    metadataPayload.extractionDiagnostics = this.extractionDiagnostics;
    metadataPayload.scraperVersion = SCRAPER_VERSION;
    if (this.runId) {
      metadataPayload.runId = this.runId;
    }
    if (this.runId) {
      // outputRunDirId: safe diagnostic identifier (basename only, no full path)
      metadataPayload.outputRunDirId = this.storage.getRunDir() ? path.basename(this.storage.getRunDir()) : null;
    }
    if (this.diagnostics) {
      metadataPayload.diagnostics = this.diagnostics;
      metadataPayload.diagnostics.version = SCRAPER_VERSION;
    }
    // 17P19 feed acquisition diagnostics
    if (this.feedAcquisition) {
      metadataPayload.entryStrategyAttempted = this.feedAcquisition.strategiesAttempted;
      metadataPayload.successfulStrategy = this.feedAcquisition.successfulStrategy;
      metadataPayload.feedVerified = this.feedAcquisition.feedVerified;
      metadataPayload.feedVerificationReason = this.feedAcquisition.feedVerificationReason;
      metadataPayload.manualAssistAvailable = this.feedAcquisition.manualAssistAvailable;
      metadataPayload.manualAssistNeeded = this.feedAcquisition.manualAssistNeeded;
      metadataPayload.manualAssistUsed = this.feedAcquisition.manualAssistUsed;
      metadataPayload.manualAssistTimeoutMs = this.feedAcquisition.manualAssistTimeoutMs;
    }
    // 17Q1 — More Reviews Sidebar / Container Diagnostics
    metadataPayload.entryMethod = this.entryMethod;
    metadataPayload.moreReviewsEntrypointFound = this.moreReviewsEntrypointFound;
    metadataPayload.moreReviewsEntrypointClicked = this.moreReviewsEntrypointClicked;
    metadataPayload.moreReviewsEntrypointLabel = this.moreReviewsEntrypointLabel;
    metadataPayload.selectedSidebarFound = this.selectedSidebarFound;
    metadataPayload.selectedSidebarScrollHeight = this.selectedSidebarScrollHeight;
    metadataPayload.selectedSidebarClientHeight = this.selectedSidebarClientHeight;
    metadataPayload.realReviewCardSelector = this.realReviewCardSelector;
    metadataPayload.falsePositiveDataReviewIdCount = this.falsePositiveDataReviewIdCount;
    metadataPayload.sidebarCandidateCount = this.sidebarCandidateCount;
    metadataPayload.sidebarRejectedCount = this.sidebarRejectedCount;
    metadataPayload.sidebarSelectedReason = this.sidebarSelectedReason;
    await this.storage.saveMetadata(metadataPayload);
    display.succeedSpinner('Results saved successfully');
    this.logger.info(`Saved ${reviews.length} reviews to ${this.storage.getRunDir()}`);
    return reviews;
  }
  setPhase(name) {
    this.currentPhase = name;
  }

  markPhaseComplete(name) {
    this.currentPhase = name;
    this.lastSuccessfulPhase = name;
  }

  mapErrorCode(error) {
    if (!error) return 'SCRAPER_UNEXPECTED_ERROR';
    const msg = (error.message || '').toLowerCase();
    const name = (error.name || '').toLowerCase();
    if (name.includes('timeout') || msg.includes('timeout')) return 'OPERATION_TIMEOUT';
    if (msg.includes('navigation') || msg.includes('navigate')) return 'PAGE_NAVIGATION_ERROR';
    if (msg.includes('could not find') && (msg.includes('review') || msg.includes('κριτικ'))) return 'REVIEWS_TAB_NOT_FOUND';
    if (msg.includes('not verified') || msg.includes('verify')) return 'REVIEWS_TAB_NOT_VERIFIED';
    if (msg.includes('container') && (msg.includes('not found') || msg.includes('invalid'))) return 'SCROLL_CONTAINER_INVALID';
    if (msg.includes('selector') || msg.includes('element')) return 'EXTRACTION_SELECTOR_FAILED';
    if (msg.includes('write') || msg.includes('save') || msg.includes('file')) return 'OUTPUT_WRITE_FAILED';
    if (msg.includes('browser') || msg.includes('launch')) return 'BROWSER_LAUNCH_ERROR';
    if (msg.includes('proxy')) return 'PROXY_ERROR';
    return 'SCRAPER_UNEXPECTED_ERROR';
  }

  async writeErrorContract(error) {
    const errorPhase = this.currentPhase || 'unknown';
    const lastPhase = this.lastSuccessfulPhase || null;
    const errorCode = this.mapErrorCode(error);
    const errorName = error?.name || 'UnknownError';
    const errorMessageShort = (error?.message || 'Unknown error').slice(0, 200);
    const errorDiagnostics = {
      version: this.version,
      stopReason: 'scraper_error',
      errorPhase,
      lastSuccessfulPhase: lastPhase,
      errorCode,
      errorName,
      errorMessageShort,
      handled: true,
      ...(this.diagnostics || {}),
    };
    const contract = {
      version: SCRAPER_VERSION,
      runTimestamp: this.runTimestamp,
      totalReviews: 0,
      stopReason: 'scraper_error',
      errorPhase,
      lastSuccessfulPhase: lastPhase,
      errorCode,
      errorName,
      errorMessageShort,
      handled: true,
      scrollAttempts: this.scrollAttempts || 0,
      scraperVersion: SCRAPER_VERSION,
      diagnostics: errorDiagnostics,
      extractionDiagnostics: this.extractionDiagnostics || {},
      stats: { totalReviews: 0, avgRating: 0, ratings: {}, withText: 0, withImages: 0, withOwnerResponse: 0 },
    };
    if (this.runId) {
      contract.runId = this.runId;
      contract.outputRunDirId = this.storage.getRunDir() ? path.basename(this.storage.getRunDir()) : null;
    }
    try {
      await this.storage.saveReviews([]);
      await this.storage.saveMetadata(contract);
    } catch (e) {
      this.logger.error(`Failed to write error contract: ${e.message}`);
    }
  }

  buildEmptyExtractionDiagnostics() {
    return {
      observedCardCandidates: 0, parseAttemptCount: 0, parseSuccessCount: 0,
      parseRejectedNoRating: 0, parseRejectedNoText: 0, parseRejectedDuplicate: 0, parseRejectedOther: 0,
      parseIdentityCollisionCount: 0, parseCollisionGroups: 0, parseLargestCollisionGroup: 0,
      identitySourceNativeCount: 0, identitySourceContentCount: 0, identitySourceOrdinalCount: 0,
      unstableIdentityCount: 0,
      finalSanitizedReviewCount: 0, maxObservedCards: 0, incrementalUniqueCount: 0,
    };
  }

  buildDiagnostics(overrides = {}) {
    return {
      version: this.version,
      placeTitle: this.listingMetadata?.placeTitle,
      listingRating: this.listingMetadata?.aggregateRating,
      listingReviewCount: this.listingMetadata?.reviewCount,
      reviewsTabClickAttempted: this.reviewsTabClickAttempted || false,
      reviewsTabClicked: this.reviewsTabClicked || false,
      reviewsTabVerified: this.feedAcquisition?.feedVerified || false,
      reviewsTabVerificationReason: this.feedAcquisition?.feedVerificationReason || null,
      feedFound: this.containerFound || false,
      feedSelector: this.containerSelector || null,
      candidateContainersChecked: this.candidateContainersChecked || 0,
      chosenContainerStrategy: this.containerSelector || null,
      chosenContainerScore: 0,
      chosenContainerReviewCardCount: 0,
      scrollAttempts: this.scrollAttempts || 0,
      noGrowthCycles: this.noGrowthCycles ?? null,
      bottomReached: this.bottomReached ?? null,
      scrollHeightStart: 0,
      scrollHeightEnd: 0,
      scrollTopStart: 0,
      scrollTopEnd: 0,
      maxObservedCardCount: this.maxObservedCards || 0,
      collectedCount: this.incrementalReviews?.size || 0,
      stopReason: this.stopReason || 'unknown',
      // 17P19 feed acquisition diagnostics
      entryStrategyAttempted: this.feedAcquisition?.strategiesAttempted || [],
      successfulStrategy: this.feedAcquisition?.successfulStrategy || null,
      feedVerified: this.feedAcquisition?.feedVerified || false,
      feedVerificationReason: this.feedAcquisition?.feedVerificationReason || null,
      feedVerificationSignals: this.feedAcquisition?.feedVerificationSignals || [],
      containerRejected: this.feedAcquisition?.containerRejected || false,
      containerRejectionReason: this.feedAcquisition?.containerRejectionReason || null,
      manualAssistAvailable: this.feedAcquisition?.manualAssistAvailable || false,
      manualAssistNeeded: this.feedAcquisition?.manualAssistNeeded || false,
      manualAssistUsed: this.feedAcquisition?.manualAssistUsed || false,
      manualAssistTimeoutMs: this.feedAcquisition?.manualAssistTimeoutMs || null,
      publicReviewsAvailability: this.feedAcquisition?.publicReviewsAvailability || null,
      // 17Q1 — More Reviews Sidebar / Container Diagnostics
      entryMethod: this.entryMethod || null,
      moreReviewsEntrypointFound: this.moreReviewsEntrypointFound || false,
      moreReviewsEntrypointClicked: this.moreReviewsEntrypointClicked || false,
      moreReviewsEntrypointLabel: this.moreReviewsEntrypointLabel || null,
      selectedSidebarFound: this.selectedSidebarFound || false,
      selectedSidebarScrollHeight: this.selectedSidebarScrollHeight || null,
      selectedSidebarClientHeight: this.selectedSidebarClientHeight || null,
      realReviewCardSelector: this.realReviewCardSelector || '.jftiEf[data-review-id]',
      realReviewCardsInitial: this.extractionDiagnostics?.maxObservedCards || 0,
      realReviewCardsMaxObserved: this.extractionDiagnostics?.maxObservedCards || 0,
      falsePositiveDataReviewIdCount: this.falsePositiveDataReviewIdCount || 0,
      sidebarCandidateCount: this.sidebarCandidateCount || 0,
      sidebarRejectedCount: this.sidebarRejectedCount || 0,
      sidebarSelectedReason: this.sidebarSelectedReason || null,
      // 17Q1C — Selector calibration diagnostic
      selectorCalibrationUsed: '17Q1C_strategyA_first_activeTabVerification',
      ...overrides,
    };
  }

  async scrape() {
    try {
      this.setPhase('init');
      await this.init();
      this.markPhaseComplete('init');

      if (this.config.autoProxy && !this.config.proxy) {
        display.info('🔍 Searching for working proxy...');
        const proxy = await this.proxyManager.initialize();
        if (proxy) {
          this.config.proxy = proxy;
          display.success(`✅ Proxy found: ${proxy}`);
        } else {
          display.warning('⚠️  No free proxy found — falling back to direct connection');
        }
      }

      this.setPhase('launch_browser');
      await this.launchBrowser();
      this.markPhaseComplete('launch_browser');

      this.setPhase('open_url');
      await this.navigateToUrl();
      this.markPhaseComplete('open_url');

      this.setPhase('extract_listing_metadata');
      await this.extractListingMetadata();
      this.markPhaseComplete('extract_listing_metadata');

      // 17P19: Attempt reviews feed entry using multiple strategies
      this.setPhase('attempt_reviews_entry');
      this.reviewsTabClickAttempted = true;
      const entryResult = await this.attemptReviewsEntry();
      this.markPhaseComplete('attempt_reviews_entry');

      if (!entryResult && this.config.manualAssist) {
        this.setPhase('wait_manual_reviews_entry');
        await this.waitForManualFeedVerification(this.config.manualAssistTimeoutMs || 300000);
        this.markPhaseComplete('wait_manual_reviews_entry');
      }

      // 17P20: If feed not verified, block and return structured failure
      if (!this.feedAcquisition.feedVerified) {
        const failReason = this.feedAcquisition.feedVerificationReason || 'all_automatic_strategies_failed';
        display.warning(`⚠️ Reviews feed not opened (${failReason}) — stopping.`);
        this.logger.warn(`Reviews feed entry failed: ${failReason}.`);

        await this.storage.saveReviews([]);
        const stopReason = failReason === 'manual_reviews_entry_timeout'
          ? 'manual_reviews_entry_timeout'
          : (this.feedAcquisition.manualAssistNeeded ? 'manual_reviews_entry_required' : 'reviews_feed_not_verified');
        await this.storage.saveMetadata({
          version: this.version,
          runTimestamp: this.runTimestamp,
          totalReviews: 0,
          stopReason,
          reviewsTabClickAttempted: true,
          reviewsTabClicked: this.feedAcquisition.successfulStrategy != null,
          reviewsTabVerified: false,
          reviewsTabVerificationReason: failReason,
          diagnostics: this.buildDiagnostics({
            stopReason,
            feedFound: false,
            feedSelector: null,
            chosenContainerStrategy: 'not_attempted',
            scrollAttempts: 0,
            maxObservedCardCount: 0,
            collectedCount: 0,
          }),
          extractionDiagnostics: this.buildEmptyExtractionDiagnostics(),
          stats: { totalReviews: 0, avgRating: 0, ratings: {}, withText: 0, withImages: 0, withOwnerResponse: 0 },
          scraperVersion: SCRAPER_VERSION,
          runId: this.runId,
          outputRunDirId: this.storage.getRunDir() ? path.basename(this.storage.getRunDir()) : null,
        });
        display.showSummary({ outputFile: this.storage.getRunDir(), count: 0, imagesDownloaded: 0 });
        return;
      }

      // Retry metadata extraction after reviews feed — only if we read nothing before
      if (!this.listingMetadata || (!this.listingMetadata.aggregateRating && !this.listingMetadata.reviewCount)) {
        this.setPhase('retry_listing_metadata');
        await this.extractListingMetadata();
        this.markPhaseComplete('retry_listing_metadata');
      }

      this.setPhase('set_sort_order');
      await this.setSortOrder();
      this.markPhaseComplete('set_sort_order');

      // 17P19: Exhaustive public review loading
      this.setPhase('exhaustive_load_reviews');
      await this.exhaustiveLoadReviews();
      this.markPhaseComplete('exhaustive_load_reviews');

      this.setPhase('extract_reviews');
      let reviews = await this.extractReviews();
      this.markPhaseComplete('extract_reviews');
      reviews = this.processDates(reviews);

      this.setPhase('save_results');
      reviews = await this.downloadImages(reviews);
      const allReviews = await this.saveResults(reviews);
      this.markPhaseComplete('save_results');

      const stats = this.storage.calculateStats(allReviews);
      display.showStats(stats);
      if (this.config.showSampleReviews === true) {
        display.showSampleReviews(allReviews, 3);
      }
      display.showSummary({
        outputFile: this.storage.getRunDir(),
        count: allReviews.length,
        imagesDownloaded: this.config.downloadImages ? this.imageDownloader.getStats().downloaded : 0,
      });
      this.logger.info('Scraping completed successfully');
    } catch (error) {
      display.error(`Fatal error at phase ${this.currentPhase || '?'}: ${error.message}`);
      this.logger.error(`Fatal error at phase ${this.currentPhase}: ${error.stack}`);
      await this.writeErrorContract(error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}
async function loadConfig(configPath = './config.yaml') {
  try {
    const fileContent = await fs.readFile(configPath, 'utf8');
    return yaml.load(fileContent);
  } catch (error) {
    return {};
  }
}
async function runWizard() {
  display.showBanner();
  display.section('⚙️  Configuration Wizard');
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter Google Maps URL:',
      validate: (input) => {
        if (utils.isValidGoogleMapsUrl(input)) {
          return true;
        }
        return 'Please enter a valid Google Maps URL';
      }
    },
    {
      type: 'list',
      name: 'sortBy',
      message: 'Sort reviews by:',
      choices: [
        { name: '🔥 Newest First', value: 'newest' },
        { name: '⭐ Highest Rating', value: 'highest' },
        { name: '👎 Lowest Rating', value: 'lowest' },
        { name: '🎯 Most Relevant (default)', value: 'relevance' }
      ],
      default: 'relevance'
    },
    {
      type: 'confirm',
      name: 'downloadImages',
      message: 'Download review images?',
      default: false
    },
    {
      type: 'confirm',
      name: 'headless',
      message: 'Run in headless mode (no browser window)?',
      default: true
    }
  ]);
  return answers;
}
async function editConfigFile(configPath = './config.yaml') {
  display.showBanner();
  display.section('📝 Edit Configuration');
  const currentConfig = await loadConfig(configPath);
  display.info('Current settings will be shown as defaults. Press Enter to keep current value.\n');
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'sortBy',
      message: 'Sort reviews by:',
      choices: [
        { name: '🔥 Newest First', value: 'newest' },
        { name: '⭐ Highest Rating', value: 'highest' },
        { name: '👎 Lowest Rating', value: 'lowest' },
        { name: '🎯 Most Relevant (default)', value: 'relevance' }
      ],
      default: currentConfig.sortBy || 'relevance'
    },
    {
      type: 'number',
      name: 'maxScrolls',
      message: 'Maximum scroll attempts:',
      default: currentConfig.maxScrolls || 250,
      validate: (input) => input > 0 || 'Must be greater than 0'
    },
    {
      type: 'number',
      name: 'scrollDelay',
      message: 'Delay between scrolls (milliseconds):',
      default: currentConfig.scrollDelay || 800,
      validate: (input) => input >= 0 || 'Must be 0 or greater'
    },
    {
      type: 'confirm',
      name: 'headless',
      message: 'Run in headless mode (no browser window)?',
      default: currentConfig.headless !== undefined ? currentConfig.headless : true
    },
    {
      type: 'confirm',
      name: 'downloadImages',
      message: 'Download review images?',
      default: currentConfig.downloadImages || false
    },
    {
      type: 'confirm',
      name: 'exportCSV',
      message: 'Export to CSV format?',
      default: currentConfig.exportCSV || false
    },
    {
      type: 'number',
      name: 'imageConcurrency',
      message: 'Number of parallel image downloads:',
      default: currentConfig.imageConcurrency || 5,
      when: (answers) => answers.downloadImages,
      validate: (input) => input > 0 || 'Must be greater than 0'
    }
  ]);
  const configContent = await fs.readFile(configPath, 'utf8');
  const changes = {};
  if (answers.sortBy !== currentConfig.sortBy) changes.sortBy = answers.sortBy;
  if (answers.maxScrolls !== currentConfig.maxScrolls) changes.maxScrolls = answers.maxScrolls;
  if (answers.scrollDelay !== currentConfig.scrollDelay) changes.scrollDelay = answers.scrollDelay;
  if (answers.headless !== currentConfig.headless) changes.headless = answers.headless;
  if (answers.downloadImages !== currentConfig.downloadImages) changes.downloadImages = answers.downloadImages;
  if (answers.exportCSV !== currentConfig.exportCSV) changes.exportCSV = answers.exportCSV;
  if (answers.imageConcurrency && answers.imageConcurrency !== currentConfig.imageConcurrency) {
    changes.imageConcurrency = answers.imageConcurrency;
  }
  if (Object.keys(changes).length === 0) {
    display.info('No changes made to configuration.');
    return currentConfig;
  }
  let updatedContent = configContent;
  for (const [key, newValue] of Object.entries(changes)) {
    const regex = new RegExp(`^(${key}:\\s*)([^\\s#]+)(.*)$`, 'm');
    const match = updatedContent.match(regex);
    if (match) {
      const [fullMatch, prefix, oldValue, suffix] = match;
      let formattedValue;
      if (typeof newValue === 'string') {
        formattedValue = `"${newValue}"`;
      } else if (typeof newValue === 'boolean') {
        formattedValue = newValue.toString();
      } else {
        formattedValue = newValue.toString();
      }
      const newLine = `${prefix}${formattedValue}${suffix}`;
      updatedContent = updatedContent.replace(fullMatch, newLine);
    }
  }
  await fs.writeFile(configPath, updatedContent, 'utf8');
  display.success(`✅ Configuration saved (${Object.keys(changes).length} value${Object.keys(changes).length > 1 ? 's' : ''} updated)`);
  return {
    ...currentConfig,
    ...answers
  };
}
async function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('url', {
      alias: 'u',
      type: 'string',
      description: 'Google Maps URL to scrape'
    })
    .option('sort', {
      alias: 's',
      type: 'string',
      choices: ['newest', 'highest', 'lowest', 'relevance'],
      description: 'Sort order for reviews'
    })
    .option('headless', {
      type: 'boolean',
      description: 'Run in headless mode'
    })
    .option('images', {
      alias: 'i',
      type: 'boolean',
      description: 'Download images'
    })
    .option('csv', {
      type: 'boolean',
      description: 'Export to CSV format (in addition to JSON)'
    })
    .option('maxScrolls', {
      alias: 'm',
      type: 'number',
      description: 'Maximum number of scroll attempts'
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      default: './config.yaml',
      description: 'Path to config file'
    })
    .option('wizard', {
      alias: 'w',
      type: 'boolean',
      description: 'Run interactive configuration wizard'
    })
    .option('outputDir', {
      type: 'string',
      description: 'Explicit output directory (17P18 contract for AIBIS runner). Overrides baseDir.'
    })
    .option('runId', {
      type: 'string',
      description: 'Run ID from the AIBIS runner. Included in metadata for runId validation.'
    })
    .option('manualAssist', {
      type: 'boolean',
      default: false,
      description: 'Open a local headed browser and wait for the owner to open the public Reviews panel.'
    })
    .option('manualAssistTimeoutMs', {
      type: 'number',
      default: 300000,
      description: 'Manual assist feed verification timeout in milliseconds.'
    })
    .help()
    .alias('help', 'h')
    .argv;
  const fileConfig = await loadConfig(argv.config);
  display.showBanner();
  const hasCliArgs = argv.url || argv.sort !== undefined || argv.headless !== undefined ||
                     argv.images !== undefined || argv.csv !== undefined ||
                     argv.maxScrolls !== undefined || argv.wizard;
  let config;
  if (!hasCliArgs) {
    const mode = 'default';
    if (mode === 'wizard') {
      config = await runWizard();
    } else if (mode === 'editConfig') {
      await editConfigFile(argv.config);
      const { runNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'runNow',
          message: 'Configuration saved! Run scraper now?',
          default: true
        }
      ]);
      if (!runNow) {
        process.exit(0);
      }
      const newConfig = await loadConfig(argv.config);
      config = { ...newConfig };
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter Google Maps URL:',
          validate: (input) => {
            if (utils.isValidGoogleMapsUrl(input)) {
              return true;
            }
            return 'Please enter a valid Google Maps URL';
          }
        }
      ]);
      config.url = url;
    } else {
      config = { ...fileConfig };
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter Google Maps URL:',
          validate: (input) => {
            if (utils.isValidGoogleMapsUrl(input)) {
              return true;
            }
            return 'Please enter a valid Google Maps URL';
          }
        }
      ]);
      config.url = url;
    }
  } else if (argv.wizard) {
    config = await runWizard();
  } else {
    config = { ...fileConfig };
  }
  if (argv.url) config.url = argv.url;
  if (argv.sort) config.sortBy = argv.sort;
  if (argv.headless !== undefined) config.headless = argv.headless;
  if (argv.images !== undefined) config.downloadImages = argv.images;
  if (argv.csv !== undefined) config.exportCSV = argv.csv;
  if (argv.maxScrolls !== undefined) config.maxScrolls = argv.maxScrolls;
  if (argv.manualAssist !== undefined) config.manualAssist = argv.manualAssist;
  if (argv.manualAssistTimeoutMs !== undefined) config.manualAssistTimeoutMs = argv.manualAssistTimeoutMs;
  config = {
    headless: true,
    manualAssist: false,
    manualAssistTimeoutMs: 300000,
    timeout: 30000,
    sortBy: 'relevance',
    maxScrolls: 300,
    scrollDelay: 800,
    baseDir: './data',
    exportCSV: false,
    downloadImages: false,
    imageConcurrency: 5,
    blockResources: true,
    showSampleReviews: false,
    proxy: '',
    autoProxy: true,
    rotateUserAgent: true,
    userAgent: '',
    logDir: './logs',
    ...config
  };
  if (config.manualAssist) {
    config.headless = false;
  }
  if (!utils.isValidGoogleMapsUrl(config.url)) {
    display.error('Invalid Google Maps URL');
    process.exit(1);
  }
  const now = new Date();
  const runTimestamp = now.toISOString()
    .slice(0, 16)
    .replace('T', '_')
    .replace(/:/g, '-');
  display.section('🔧 Configuration');
  display.showConfig(config);
  const explicitOutputDir = argv.outputDir || null;
  const runId = argv.runId || null;
  const scraper = new GoogleMapsReviewsScraper(config, runTimestamp, runId, explicitOutputDir);
  await scraper.scrape();
}
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
module.exports = GoogleMapsReviewsScraper;
