export interface StealthDiagnosticRule {
  id: string;
  pattern: RegExp;
  severity: 'critical' | 'warning' | 'info';
  category: 'NETWORK' | 'AUTOMATION' | 'FINGERPRINT' | 'HARDWARE' | 'ENVIRONMENT' | 'BOT_SCORE';
  title: string;
  description: string;
  actionHint: string;
}

export const STEALTH_DIAGNOSTIC_RULES: StealthDiagnosticRule[] = [
  // =========================================================================
  // 1. NETWORK & PROXY LAYER
  // =========================================================================
  {
    id: 'network_webrtc_leak',
    pattern: /WEBRTC_LEAKED_TRUE|WEBRTC_LOCAL_IP_EXPOSED/i,
    severity: 'critical',
    category: 'NETWORK',
    title: 'WebRTC Local IP / Real Interface Exposure',
    description: 'The browser gathers ICE candidates that reveal your real local LAN IP address or non-proxied network interface.',
    actionHint: 'Enable WebRTC Disable mode or configure WebRTC Proxy-Only binding in SpyHub/Camoufox settings.',
  },
  {
    id: 'network_tcp_os_mismatch',
    pattern: /NETWORK_TCP_SATORI_OS_MISMATCH|NETWORK_TCP_LOW_OS_PROBABILITY/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'TCP/IP Stack OS Fingerprint Mismatch',
    description: 'The OS predicted from TCP SYN packet parameters (TTL, Window Size, TCP Options) disagrees with your User-Agent OS.',
    actionHint: 'Ensure proxy node host matches profile target OS or use an OS-matching resident proxy gateway.',
  },
  {
    id: 'network_suspicious_ip',
    pattern: /TCP_IP_USAGE_TYPE_SUSPICIOUS|SUSPICIOUS_DATACENTER_SUBNET/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'Data Center / Suspicious Corporate Subnet IP',
    description: 'IP address ISN/ASN lookup classifies this IP as a hosting provider, data center, or corporate proxy rather than residential/mobile ISP.',
    actionHint: 'Rotate proxy to residential or 4G/5G mobile IP pool.',
  },
  {
    id: 'network_tls_sni_mismatch',
    pattern: /TLS_SNI_MISMATCH|NETWORK_TLS_ECH_FAILED/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'TLS Handshake & ECH / SNI Inconsistency',
    description: 'TLS Client Hello fingerprint (Cipher Suites, TLS Extensions, ECH) does not match standard Chromium/Firefox signatures.',
    actionHint: 'Check TLS proxy middleware or update Camoufox TLS fingerprinting profile.',
  },

  // =========================================================================
  // 2. AUTOMATION & JS ENGINE DRIVERS
  // =========================================================================
  {
    id: 'automation_webdriver_flag',
    pattern: /ENV_JS_WEBDRIVER_DETECTED|NAVIGATOR_WEBDRIVER_TRUE/i,
    severity: 'critical',
    category: 'AUTOMATION',
    title: 'Automated Webdriver Signature Detected',
    description: 'Page detected navigator.webdriver = true or Chromium DevTools Protocol (CDP) execution hooks.',
    actionHint: 'Enable Camoufox/Cloak stealth patcher to strip navigator.webdriver and CDP variables.',
  },
  {
    id: 'automation_cdc_props',
    pattern: /CDC_ADOZTQI498502_DETECTED|CHROME_AUTOMATION_EXTENSIONS/i,
    severity: 'critical',
    category: 'AUTOMATION',
    title: 'Chromium Driver Internal Variables Exposed',
    description: 'Internal ChromeDriver window variables (e.g. $cdc_ / $chrome_asyncScriptExecutor) were found in document scope.',
    actionHint: 'Use patched Playwright / Camoufox browser binaries that remove ChromeDriver string tokens.',
  },

  // =========================================================================
  // 3. NAVIGATOR & USER-AGENT FINGERPRINT
  // =========================================================================
  {
    id: 'env_platform_mismatch',
    pattern: /ENV_JS_PLATFORM_MISMATCH|BROWSERSCAN_KERNEL_UA_MISMATCH/i,
    severity: 'critical',
    category: 'FINGERPRINT',
    title: 'OS Header & Navigator Platform Conflict',
    description: 'The User-Agent HTTP header OS (e.g. Windows NT 10.0) disagrees with navigator.platform (e.g. MacIntel or Linux x86_64).',
    actionHint: 'Synchronize navigator.platform, User-Agent, and Client Hints (Sec-CH-UA-Platform) in profile config.',
  },
  {
    id: 'navigator_vendor_mismatch',
    pattern: /NAVIGATOR_VENDOR_MISMATCH|SEC_CH_UA_MISMATCH/i,
    severity: 'warning',
    category: 'FINGERPRINT',
    title: 'Browser Vendor / Client Hints Anomaly',
    description: 'navigator.vendor or Sec-CH-UA brand headers contain values inconsistent with specified browser type (Camoufox/Chrome).',
    actionHint: 'Verify profile browser engine type selection (Camoufox vs Cloak vs Chrome).',
  },

  // =========================================================================
  // 4. HARDWARE, CANVAS & WEBGL
  // =========================================================================
  {
    id: 'hardware_webgl_low_extensions',
    pattern: /HARDWARE_WEBGL_LOW_EXTENSIONS_COUNT|WEBGL_UNMASKED_RENDERER_FLAG/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'WebGL Extensions / GPU Spoofing Anomaly',
    description: 'WebGL context exposes unusually low extension count or unmasked GPU vendor/renderer string mismatch.',
    actionHint: 'Enable WebGL noise injection or pick an authentic GPU profile preset.',
  },
  {
    id: 'canvas_fingerprint_flag',
    pattern: /CANVAS_FP_NOISE_DETECTED|CANVAS_READBACK_BLOCKED/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'Canvas Noise / Readback Tampering Detected',
    description: 'Canvas 2D getImageData/toDataURL calls produced inconsistent hash signatures characteristic of naive noise injection.',
    actionHint: 'Switch Canvas protection mode to consistent hardware spoofing instead of random noise.',
  },
  {
    id: 'audio_context_flag',
    pattern: /AUDIO_CONTEXT_FP_FAILED|WEB_AUDIO_TAMPERED/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'WebAudio Fingerprint Anomaly',
    description: 'AudioContext oscillator processing produced unexpected frequency output signatures.',
    actionHint: 'Configure WebAudio noise masking in profile hardware settings.',
  },

  // =========================================================================
  // 5. ENVIRONMENT, FONTS & CODECS
  // =========================================================================
  {
    id: 'fonts_count_too_low',
    pattern: /TOO_FEW_FONTS_DETECTED|FONT_LIST_EMPTY/i,
    severity: 'warning',
    category: 'ENVIRONMENT',
    title: 'System Font List Anomaly',
    description: 'Available font count measured via canvas/DOM element offsetWidth is below normal OS baseline (<15 fonts).',
    actionHint: 'Inject standard OS font pack mask into profile hardware configuration.',
  },
  {
    id: 'feature_missing_codecs',
    pattern: /ENV_FEATURE_MISSING_CODECS|MEDIA_CODEC_HEVC_MISMATCH/i,
    severity: 'info',
    category: 'ENVIRONMENT',
    title: 'Media Codec Capabilities Mismatch',
    description: 'HTML5 video/audio canPlayType checks indicate missing H.264/AAC/VP9 hardware codecs standard for target OS.',
    actionHint: 'Ensure headless browser environment includes full media codec support libraries.',
  },
  {
    id: 'locale_timezone_mismatch',
    pattern: /TIMEZONE_PROXY_MISMATCH|LOCALE_LANG_MISMATCH/i,
    severity: 'warning',
    category: 'ENVIRONMENT',
    title: 'Timezone & GeoIP Mismatch',
    description: 'Intl.DateTimeFormat timezone or navigator.languages differs from proxy IP geographical location.',
    actionHint: 'Enable automatic Proxy-Based Timezone and Language matching in profile settings.',
  },

  // =========================================================================
  // 6. CAPTCHA & BOT DETECTION SCORES
  // =========================================================================
  {
    id: 'recaptcha_v3_score_zero',
    pattern: /RECAPTCHA_V3_SCORE_FAILED|RECAPTCHA_V3_SCORE_WARNING=0\.0/i,
    severity: 'critical',
    category: 'BOT_SCORE',
    title: 'Google reCAPTCHA v3 Score = 0.0 (Bot Detected)',
    description: 'Google reCAPTCHA v3 risk assessment assigned minimum trust score (0.0), indicating immediate bot classification.',
    actionHint: 'Rotate proxy IP, farm cookies via Cookie Farm workflow, and clear browser automation flags.',
  },
  {
    id: 'cloudflare_turnstile_fail',
    pattern: /CLOUDFLARE_TURNSTILE_FAILED|DATADOME_BLOCKED/i,
    severity: 'critical',
    category: 'BOT_SCORE',
    title: 'Cloudflare Turnstile / DataDome Challenge Failure',
    description: 'Anti-bot challenge system blocked browser session or rendered interactive CAPTCHA.',
    actionHint: 'Run full Stealth Audit and warm up profile cookies before targeting this domain.',
  },
];
