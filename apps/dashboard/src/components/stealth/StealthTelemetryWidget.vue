<template>
  <div v-if="report && Object.keys(report).length > 0" class="mt-3 space-y-3">
    <!-- Header Divider -->
    <div class="flex items-center gap-2 pt-2 pb-1 border-t border-gray-200/60 dark:border-gray-800/60">
      <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
      <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Scraped Fingerprint Telemetry
      </span>
    </div>

    <!-- 1. BROWSERSCAN -->
    <div v-if="isService('browserscan')" class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      <!-- Browser & Kernel Check -->
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Kernel & UA Integrity</span>
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
            :class="report.isBrowserMatchWithUserAgent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'"
          >
            {{ report.isBrowserMatchWithUserAgent ? 'Kernel Match' : 'UA Mismatch' }}
          </span>
        </div>
        <div class="text-xs font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
          <span>Detected Browser:</span>
          <span class="font-mono font-bold">{{ report.browserVersion || 'Unknown' }}</span>
        </div>
        <div v-if="report.userAgent" class="text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 p-2 rounded-lg break-all flex items-start justify-between gap-1.5">
          <span>{{ report.userAgent }}</span>
          <button @click="copyText(report.userAgent)" type="button" class="shrink-0 p-1 hover:text-blue-600 text-gray-400" title="Copy User-Agent">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>
        </div>
      </div>

      <!-- Network & Leak Detection -->
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Network & Leak Protection</span>
          <span v-if="report.dnsIsp" class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            {{ report.dnsIsp }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-0.5">
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
            <span class="text-xs text-gray-600 dark:text-gray-400">WebRTC Leak:</span>
            <span class="text-xs font-bold" :class="report.isWebRtcLeaks ? 'text-red-500' : 'text-emerald-500'">
              {{ report.isWebRtcLeaks ? 'LEAKED' : 'Clean' }}
            </span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
            <span class="text-xs text-gray-600 dark:text-gray-400">DNS Leak:</span>
            <span class="text-xs font-bold" :class="report.isDnsLeaks ? 'text-red-500' : 'text-emerald-500'">
              {{ report.isDnsLeaks ? 'LEAKED' : 'Clean' }}
            </span>
          </div>
        </div>
        <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
          <span class="text-xs text-gray-600 dark:text-gray-400">Bot Detection:</span>
          <span class="text-xs font-bold" :class="report.isBotDetected ? 'text-red-500' : 'text-emerald-500'">
            {{ report.isBotDetected ? 'BOT DETECTED' : 'Passed (Human)' }}
          </span>
        </div>
      </div>

      <!-- Expandable DNS Lookups (Full Width) -->
      <div v-if="report.dnsLookups && Object.keys(report.dnsLookups).length > 0" class="md:col-span-2 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <div class="flex items-center justify-between cursor-pointer" @click="showDnsLookups = !showDnsLookups">
          <span class="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
            Resolved DNS Servers ({{ Object.keys(report.dnsLookups).length }})
          </span>
          <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">{{ showDnsLookups ? 'Hide' : 'Show Details' }}</span>
        </div>
        <div v-if="showDnsLookups" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 max-h-48 overflow-y-auto">
          <div v-for="(provider, ip) in report.dnsLookups" :key="ip" class="p-1.5 rounded bg-gray-50 dark:bg-gray-950 text-[11px] font-mono flex items-center justify-between">
            <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ ip }}</span>
            <span class="text-gray-500 truncate max-w-[130px]" :title="provider">{{ provider }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. BROWSERLEAKS -->
    <div v-else-if="isService('browserleaks')" class="space-y-2.5">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <!-- Network Fingerprint -->
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>Network / TCP Stack</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Satori TCP OS:</span>
              <span class="font-semibold">{{ report.network?.tcpIp?.satoriOs || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Zardaxt Score:</span>
              <span class="font-mono font-bold">{{ report.network?.tcpIp?.zardaxtProbability != null ? `${report.network?.tcpIp?.zardaxtProbability}%` : 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">TTL / MTU:</span>
              <span class="font-mono">{{ report.network?.tcpIp?.ttl || 'N/A' }} / {{ report.network?.tcpIp?.mtu || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">WebRTC Leak:</span>
              <span class="font-bold" :class="report.network?.webRtc?.leaked ? 'text-red-500' : 'text-emerald-500'">
                {{ report.network?.webRtc?.leaked ? 'LEAKED' : 'Clean' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Hardware & Graphics -->
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span>Hardware & Graphics</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Canvas Hash:</span>
              <span class="font-mono font-semibold truncate max-w-[110px]" :title="report.hardware?.canvas?.signature">{{ report.hardware?.canvas?.signature || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">WebGL Vendor:</span>
              <span class="font-semibold truncate max-w-[120px]" :title="report.hardware?.webGl?.unmaskedVendor">{{ report.hardware?.webGl?.unmaskedVendor || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">GPU Renderer:</span>
              <span class="font-mono text-[11px] truncate max-w-[120px]" :title="report.hardware?.webGl?.unmaskedRenderer">{{ report.hardware?.webGl?.unmaskedRenderer || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">System Fonts:</span>
              <span class="font-mono font-bold">{{ report.hardware?.fonts?.detectedCount ?? 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- JS Environment -->
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            <span>JS Environment</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">CPU Cores:</span>
              <span class="font-mono font-bold">{{ report.env?.js?.cpuCores || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">RAM (GB):</span>
              <span class="font-mono font-bold">{{ report.env?.js?.memoryGb || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Platform:</span>
              <span class="font-mono">{{ report.env?.js?.platform || 'N/A' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Timezone:</span>
              <span class="font-semibold truncate max-w-[120px]">{{ report.env?.js?.timeZone || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TLS Fingerprints Box -->
      <div v-if="report.network?.tls?.ja3 || report.network?.tls?.ja4" class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">TLS Client Fingerprints</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div v-if="report.network?.tls?.ja3" class="p-2 rounded bg-gray-50 dark:bg-gray-950 flex items-center justify-between gap-2">
            <span class="text-gray-400">JA3:</span>
            <span class="truncate">{{ report.network?.tls?.ja3 }}</span>
            <button @click="copyText(report.network?.tls?.ja3)" class="text-gray-400 hover:text-blue-500 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
          </div>
          <div v-if="report.network?.tls?.ja4" class="p-2 rounded bg-gray-50 dark:bg-gray-950 flex items-center justify-between gap-2">
            <span class="text-gray-400">JA4:</span>
            <span class="truncate">{{ report.network?.tls?.ja4 }}</span>
            <button @click="copyText(report.network?.tls?.ja4)" class="text-gray-400 hover:text-blue-500 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. CREEPJS -->
    <div v-else-if="isService('creepjs')" class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
      <!-- Ratings & Scores -->
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">CreepJS Detection Scores</span>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950">
            <div class="text-[10px] uppercase font-bold text-gray-400">Headless</div>
            <div class="text-base font-black font-mono" :class="(report.headlessRating || 0) > 0 ? 'text-red-500' : 'text-emerald-500'">
              {{ report.headlessRating ?? 0 }}%
            </div>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950">
            <div class="text-[10px] uppercase font-bold text-gray-400">Like Headless</div>
            <div class="text-base font-black font-mono" :class="(report.likeHeadlessRating || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'">
              {{ report.likeHeadlessRating ?? 0 }}%
            </div>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 dark:bg-gray-950">
            <div class="text-[10px] uppercase font-bold text-gray-400">Stealth Score</div>
            <div class="text-base font-black font-mono text-blue-500">
              {{ report.stealthScore ?? 100 }}%
            </div>
          </div>
        </div>
        <div class="pt-1 flex items-center justify-between text-xs">
          <span class="text-gray-500">DOMRect Score:</span>
          <span class="font-mono font-bold" :class="(report.domRectScore || 100) < 100 ? 'text-amber-500' : 'text-emerald-500'">
            {{ report.domRectScore ?? 100 }}/100 (Lie: {{ report.domRectLiePattern || 'none' }})
          </span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">Prototype Lies:</span>
          <span class="font-mono font-bold" :class="(report.prototypeLiesCount || 0) > 0 ? 'text-red-500' : 'text-emerald-500'">
            {{ report.prototypeLiesCount ?? 0 }}
          </span>
        </div>
      </div>

      <!-- Identity & Hardware Lies -->
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Identity & OS Integrity</span>
        <div class="space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Device OS vs UA:</span>
            <span class="font-semibold text-right truncate max-w-[180px]">
              {{ report.deviceOs || 'N/A' }} / {{ report.uaDataOs || 'N/A' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">GPU Model:</span>
            <span class="font-mono text-[11px] truncate max-w-[180px]" :title="report.gpu">{{ report.gpu || 'N/A' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Fonts Ratio:</span>
            <span class="font-mono font-bold">{{ report.fontsCount || 'N/A' }}</span>
          </div>
          <div v-if="report.fpId" class="p-2 rounded bg-gray-50 dark:bg-gray-950 font-mono text-[11px] flex items-center justify-between gap-1.5">
            <span class="text-gray-400">FP ID:</span>
            <span class="truncate">{{ report.fpId }}</span>
            <button @click="copyText(report.fpId)" class="text-gray-400 hover:text-blue-500 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. PIXELSCAN -->
    <div v-else-if="isService('pixelscan')" class="space-y-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Verdict</div>
          <div 
            class="text-xs font-bold mt-1 truncate" 
            :class="isPixelscanScanning ? 'text-amber-500 flex items-center gap-1.5' : (report.overallVerdict?.toLowerCase().includes('inconsistent') ? 'text-red-500' : 'text-emerald-500')"
            :title="report.overallVerdict"
          >
            <span v-if="isPixelscanScanning" class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{{ report.overallVerdict || 'N/A' }}</span>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Location Masking</div>
          <div class="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-1 truncate" :title="report.locationMasking">
            {{ report.locationMasking || 'N/A' }}
          </div>
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Browser Integrity</div>
          <div class="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-1 truncate" :title="report.browserIntegrity">
            {{ report.browserIntegrity || 'N/A' }}
          </div>
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800">
          <div class="text-[10px] font-bold text-gray-400 uppercase">Fingerprint Masking</div>
          <div 
            class="text-xs font-semibold mt-1 truncate" 
            :class="report.fingerprintMasking?.toLowerCase().includes('collecting') ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100'"
            :title="report.fingerprintMasking"
          >
            {{ report.fingerprintMasking || 'N/A' }}
          </div>
        </div>
      </div>
      <div v-if="report.botDetection" class="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 flex items-center justify-between text-xs">
        <span class="text-gray-500 font-medium">Bot Detection:</span>
        <span class="font-bold" :class="report.botDetection.toLowerCase().includes('automated') && !report.botDetection.toLowerCase().includes('no automated') ? 'text-red-500' : (report.botDetection.toLowerCase().includes('collecting') ? 'text-amber-500' : 'text-emerald-500')">
          {{ report.botDetection }}
        </span>
      </div>
    </div>

    <!-- 5. PEETWS -->
    <div v-else-if="isService('peetws')" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Connected IP & Port</div>
        <div class="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">{{ report.ip || 'N/A' }}</div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase">HTTP Protocol</div>
        <div class="text-xs font-mono font-bold" :class="report.http?.version === 'h2' ? 'text-emerald-500' : 'text-amber-500'">
          {{ report.http?.version?.toUpperCase() || 'HTTP/1.1' }}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase">TLS Version</div>
        <div class="text-xs font-mono font-bold text-blue-500">{{ report.tls?.version || 'TLS 1.3' }}</div>
      </div>
    </div>

    <!-- 6. ANTCPT (reCAPTCHA) -->
    <div v-else-if="isService('antcpt')" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">reCAPTCHA v3 Score</div>
        <div class="text-xl font-black font-mono" :class="(report.reCaptchaV3Score || 0) >= 0.7 ? 'text-emerald-500' : (report.reCaptchaV3Score || 0) >= 0.4 ? 'text-amber-500' : 'text-red-500'">
          {{ report.reCaptchaV3Score != null ? report.reCaptchaV3Score.toFixed(1) : 'N/A' }}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">v2 Instant Pass</div>
        <div class="text-xl font-black font-mono" :class="report.isV2InstantPass ? 'text-emerald-500' : 'text-red-500'">
          {{ report.isV2InstantPass ? 'YES' : 'NO' }}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Detected IP</div>
        <div class="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 mt-2">{{ report.detectedIp || 'N/A' }}</div>
      </div>
    </div>

    <!-- 7. FINGERPRINTJS -->
    <div v-else-if="isService('fingerprintjs')" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Visitor Identifier</div>
        <div class="text-xs font-mono font-bold flex items-center justify-between">
          <span class="truncate">{{ report.visitorId || 'N/A' }}</span>
          <button v-if="report.visitorId" @click="copyText(report.visitorId)" class="text-gray-400 hover:text-blue-500 shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Smart Signals Flags</div>
        <div class="text-xs font-bold" :class="(report.detectedSignals?.length || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'">
          {{ report.detectedSignals?.length ? `${report.detectedSignals.length} Signals Detected` : 'All Signals Clean' }}
        </div>
      </div>
    </div>

    <!-- 8. INCOLUMITAS -->
    <div v-else-if="isService('incolumitas')" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Behavioral Score</div>
        <div class="text-xl font-black font-mono" :class="(report.behavioralScore || 1) >= 0.7 ? 'text-emerald-500' : (report.behavioralScore || 1) >= 0.4 ? 'text-amber-500' : 'text-red-500'">
          {{ report.behavioralScore != null ? report.behavioralScore : '1.0' }}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Webdriver Present</div>
        <div class="text-base font-bold font-mono mt-1" :class="report.newTests?.webdriverPresent === 'FAIL' ? 'text-red-500' : 'text-emerald-500'">
          {{ report.newTests?.webdriverPresent || 'OK' }}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 space-y-1 text-center">
        <div class="text-[10px] font-bold text-gray-400 uppercase">Puppeteer Stealth</div>
        <div class="text-base font-bold font-mono mt-1" :class="report.newTests?.puppeteerStealthPresent === 'FAIL' ? 'text-red-500' : 'text-emerald-500'">
          {{ report.newTests?.puppeteerStealthPresent || 'OK' }}
        </div>
      </div>
    </div>

    <!-- Universal Fallback: Key-Value Cards for Unhandled Services -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div 
        v-for="(val, key) in primitiveReportFields" 
        :key="key" 
        class="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-xs"
      >
        <span class="text-gray-400 uppercase text-[10px] block truncate">{{ key }}</span>
        <span class="font-semibold text-gray-800 dark:text-gray-200 truncate block mt-0.5" :title="String(val)">
          {{ String(val) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  serviceName: string;
  report?: any;
}>();

const showDnsLookups = ref(false);

const isService = (name: string): boolean => {
  return props.serviceName.toLowerCase().replace(/[\s\-_.]/g, '').includes(name.toLowerCase());
};

const isPixelscanScanning = computed(() => {
  const v = props.report?.overallVerdict?.toLowerCase() || '';
  const m = props.report?.fingerprintMasking?.toLowerCase() || '';
  const b = props.report?.botDetection?.toLowerCase() || '';
  return v.includes('scanning') || m.includes('collecting') || b.includes('collecting');
});

const copyText = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
};

const primitiveReportFields = computed(() => {
  if (!props.report) return {};
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(props.report)) {
    if (k.startsWith('@')) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      res[k] = v;
    }
  }
  return res;
});
</script>
