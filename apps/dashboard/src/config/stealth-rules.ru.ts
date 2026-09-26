import { StealthDiagnosticRule } from './stealth-rules';

export const STEALTH_DIAGNOSTIC_RULES_RU: StealthDiagnosticRule[] = [
  // =========================================================================
  // 1. СЕТЕВОЙ УРОВЕНЬ И ПРОКСИ
  // =========================================================================
  {
    id: 'network_webrtc_leak',
    pattern: /WEBRTC_LEAKED_TRUE|WEBRTC_LOCAL_IP_EXPOSED/i,
    severity: 'critical',
    category: 'NETWORK',
    title: 'Утечка WebRTC / Утечка реального IP-адреса',
    description: 'Браузер собирает ICE-кандидаты, которые раскрывают ваш реальный локальный IP-адрес или сетевой интерфейс без прокси.',
    actionHint: 'Включите режим WebRTC Disable или привязку WebRTC Proxy-Only в настройках профиля SpyHub/Camoufox.',
  },
  {
    id: 'network_tcp_os_mismatch',
    pattern: /NETWORK_TCP_SATORI_OS_MISMATCH|NETWORK_TCP_LOW_OS_PROBABILITY/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'Несоответствие ОС по отпечатку TCP/IP стека',
    description: 'Определенная по TCP SYN пакетам Операционная Система (TTL, Window Size, TCP Options) не совпадает с ОС в User-Agent.',
    actionHint: 'Убедитесь, что нода прокси совпадает с целевой ОС профиля, или используйте резидентские прокси с правильной ОС.',
  },
  {
    id: 'network_suspicious_ip',
    pattern: /TCP_IP_USAGE_TYPE_SUSPICIOUS|SUSPICIOUS_DATACENTER_SUBNET/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'Серверный IP-адрес / Подозрительная датацентровая подсеть',
    description: 'Проверка ISN/ASN классифицирует этот IP как хостинг-провайдер или датацентровый прокси, а не домашний/мобильный провайдер.',
    actionHint: 'Смените прокси на резидентский или мобильный пул IP-адресов 4G/5G.',
  },
  {
    id: 'network_tls_sni_mismatch',
    pattern: /TLS_SNI_MISMATCH|NETWORK_TLS_ECH_FAILED/i,
    severity: 'warning',
    category: 'NETWORK',
    title: 'Аномалия TLS Handshake & ECH / SNI',
    description: 'Отпечаток TLS Client Hello (набор шифров Cipher Suites, расширения TLS, ECH) отличается от стандартного Chromium/Firefox.',
    actionHint: 'Проверьте промежуточное ПО прокси или обновите профиль TLS-отпечатка Camoufox.',
  },

  // =========================================================================
  // 2. АВТОМАТИЗАЦИЯ И ДРАЙВЕРЫ JS
  // =========================================================================
  {
    id: 'automation_webdriver_flag',
    pattern: /ENV_JS_WEBDRIVER_DETECTED|NAVIGATOR_WEBDRIVER_TRUE/i,
    severity: 'critical',
    category: 'AUTOMATION',
    title: 'Обнаружен флаг автоматизации Webdriver',
    description: 'Страница обнаружила navigator.webdriver = true или хуки протокола Chromium DevTools Protocol (CDP).',
    actionHint: 'Активируйте стелс-патчер Camoufox/Cloak для удаления переменных navigator.webdriver и CDP.',
  },
  {
    id: 'automation_cdc_props',
    pattern: /CDC_ADOZTQI498502_DETECTED|CHROME_AUTOMATION_EXTENSIONS/i,
    severity: 'critical',
    category: 'AUTOMATION',
    title: 'Раскрыты внутренние переменные ChromeDriver',
    description: 'В области видимости document найдены переменные ChromeDriver (например $cdc_ / $chrome_asyncScriptExecutor).',
    actionHint: 'Используйте патченые бинарники Playwright / Camoufox с вырезанными строками ChromeDriver.',
  },

  // =========================================================================
  // 3. NAVIGATOR И USER-AGENT
  // =========================================================================
  {
    id: 'env_platform_mismatch',
    pattern: /ENV_JS_PLATFORM_MISMATCH|BROWSERSCAN_KERNEL_UA_MISMATCH/i,
    severity: 'critical',
    category: 'FINGERPRINT',
    title: 'Конфликт заголовка ОС и navigator.platform',
    description: 'ОС в заголовке User-Agent (например Windows NT 10.0) противоречит navigator.platform (например MacIntel или Linux x86_64).',
    actionHint: 'Синхронизируйте navigator.platform, User-Agent и Client Hints (Sec-CH-UA-Platform) в настройках профиля.',
  },
  {
    id: 'navigator_vendor_mismatch',
    pattern: /NAVIGATOR_VENDOR_MISMATCH|SEC_CH_UA_MISMATCH/i,
    severity: 'warning',
    category: 'FINGERPRINT',
    title: 'Аномалия вендора браузера / Client Hints',
    description: 'Значения navigator.vendor или Sec-CH-UA не соответствуют выбранному типу движка браузера (Camoufox/Chrome).',
    actionHint: 'Проверьте корректность выбора движка браузера в настройках (Camoufox vs Cloak vs Chrome).',
  },

  // =========================================================================
  // 4. АППАРАТНАЯ ЧАСТЬ, CANVAS И WEBGL
  // =========================================================================
  {
    id: 'hardware_webgl_low_extensions',
    pattern: /HARDWARE_WEBGL_LOW_EXTENSIONS_COUNT|WEBGL_UNMASKED_RENDERER_FLAG/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'Аномалия расширений WebGL / Маскировки видеокарты',
    description: 'Контекст WebGL выдаёт подозрительно малое количество расширений или несоответствие вендора/рендерера GPU.',
    actionHint: 'Включите шум WebGL или выберите валидный пресет видеокарты.',
  },
  {
    id: 'canvas_fingerprint_flag',
    pattern: /CANVAS_FP_NOISE_DETECTED|CANVAS_READBACK_BLOCKED/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'Обнаружена манипуляция / Шум в Canvas',
    description: 'Вызовы Canvas 2D (getImageData/toDataURL) сгенерировали хэш с признаками наивного добавления шума.',
    actionHint: 'Переключите защиту Canvas на постоянную аппаратную спуфинг-маску вместо случайного шума.',
  },
  {
    id: 'audio_context_flag',
    pattern: /AUDIO_CONTEXT_FP_FAILED|WEB_AUDIO_TAMPERED/i,
    severity: 'warning',
    category: 'HARDWARE',
    title: 'Аномалия отпечатка WebAudio',
    description: 'Обработка осциллятора AudioContext выдаёт нестандартный аудио-сигнал.',
    actionHint: 'Настройте маскирование WebAudio в параметрах железа профиля.',
  },

  // =========================================================================
  // 5. ОКРУЖЕНИЕ, ШРИФТЫ И КОДЕКИ
  // =========================================================================
  {
    id: 'fonts_count_too_low',
    pattern: /TOO_FEW_FONTS_DETECTED|FONT_LIST_EMPTY/i,
    severity: 'warning',
    category: 'ENVIRONMENT',
    title: 'Малое количество системных шрифтов',
    description: 'Список доступных шрифтов через Canvas/DOM измерения ниже нормы для выбранной ОС (<15 шрифтов).',
    actionHint: 'Подключите стандартный пак шрифтов целевой ОС в конфигурации профиля.',
  },
  {
    id: 'feature_missing_codecs',
    pattern: /ENV_FEATURE_MISSING_CODECS|MEDIA_CODEC_HEVC_MISMATCH/i,
    severity: 'info',
    category: 'ENVIRONMENT',
    title: 'Отсутствие медиа-кодеков в системе',
    description: 'Проверка HTML5 video/audio canPlayType указывает на отсутствие кодеков H.264/AAC/VP9, стандартных для этой ОС.',
    actionHint: 'Убедитесь, что в окружении headless-браузера установлены системные библиотеки кодеков.',
  },
  {
    id: 'locale_timezone_mismatch',
    pattern: /TIMEZONE_PROXY_MISMATCH|LOCALE_LANG_MISMATCH/i,
    severity: 'warning',
    category: 'ENVIRONMENT',
    title: 'Несоответствие часового пояса и GeoIP прокси',
    description: 'Часовой пояс Intl.DateTimeFormat или navigator.languages отличается от гео-локации IP-адреса прокси.',
    actionHint: 'Включите автоматическую синхронизацию Timezone и Языка по прокси в настройках.',
  },

  // =========================================================================
  // 6. CAPTCHA И ОЦЕНКА БОТ-СКОРА
  // =========================================================================
  {
    id: 'recaptcha_v3_score_zero',
    pattern: /RECAPTCHA_V3_SCORE_FAILED|RECAPTCHA_V3_SCORE_WARNING=0\.0/i,
    severity: 'critical',
    category: 'BOT_SCORE',
    title: 'Оценка Google reCAPTCHA v3 = 0.0 (Обнаружен бот)',
    description: 'Алгоритм reCAPTCHA v3 присвоил минимальный балл доверия (0.0), признав сессию ботом.',
    actionHint: 'Смените IP прокси, прогрейте куки через Cookie Farm и устраните флаги автоматизации.',
  },
  {
    id: 'cloudflare_turnstile_fail',
    pattern: /CLOUDFLARE_TURNSTILE_FAILED|DATADOME_BLOCKED/i,
    severity: 'critical',
    category: 'BOT_SCORE',
    title: 'Блокировка Cloudflare Turnstile / DataDome',
    description: 'Система защиты анти-бота заблокировала сессию браузера или выдала капчу.',
    actionHint: 'Проведите полный стелс-аудит и нафармите куки перед работой с этим доменом.',
  },
];
