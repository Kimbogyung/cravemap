import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '../../../components/layout/LanguageSwitcher'

const problems = [
  { key: 'where', icon: '🔍' },
  { key: 'sameCountry', icon: '🏪' },
  { key: 'alone', icon: '🧭' },
] as const

const solutions = [
  { key: 'discover', icon: '🍜' },
  { key: 'sameNationality', icon: '🏠' },
  { key: 'share', icon: '🤝' },
] as const

const mobileFeatures = [
  { key: 'multilingual', icon: '🌏' },
  { key: 'map', icon: '🗺️' },
  { key: 'report', icon: '📍' },
  { key: 'comments', icon: '💬' },
] as const

const br = () => <br />

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const homeHref = `/${locale}`
  const t = await getTranslations({ locale, namespace: 'about' })

  return (
    <div className="w-full overflow-x-hidden bg-white">
      {/* NAV */}
      <div className="sticky top-0 z-50 border-b border-cm-divider bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-3.5 sm:px-10">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[50%_50%_50%_3px] bg-primary">
              <div className="h-[9px] w-[9px] rounded-full bg-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-primary">CraveMap</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#FFF3EC] via-[#FFF9F5] to-white">
        <div className="mx-auto flex max-w-[820px] flex-col items-center px-5 py-16 text-center sm:px-10 sm:py-24 md:py-28">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3.5 py-1.5 text-[13px] font-bold text-primary">
            {t('hero.badge')}
          </div>
          <h1 className="mb-5 text-[32px] font-extrabold leading-[1.22] tracking-tight sm:text-5xl md:text-[56px]">
            {t.rich('hero.title', {
              br,
              accent: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </h1>
          <p className="mb-8 text-base leading-relaxed text-[#6b5f5d] sm:text-lg md:text-[19px]">
            {t.rich('hero.subtitle', { br })}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(232,52,42,0.5)]"
            >
              {t('hero.ctaPrimary')} <span className="text-lg">→</span>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-full border border-cm-border bg-white px-6 py-4 text-base font-semibold text-cm-text"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="mx-auto max-w-[1120px] px-5 py-14 sm:px-10 sm:py-20 md:py-24">
        <div className="mb-9 text-center sm:mb-14">
          <div className="mb-3 text-[15px] font-bold text-primary">{t('problem.eyebrow')}</div>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-4xl">
            {t('problem.title')}
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {problems.map((p) => (
            <div
              key={p.key}
              className="min-w-[260px] flex-1 basis-[280px] rounded-[20px] border border-[#EEE] bg-white p-7 shadow-[0_8px_26px_-18px_rgba(0,0,0,0.2)]"
            >
              <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary-light text-2xl">
                {p.icon}
              </div>
              <div className="mb-2 text-lg font-bold tracking-tight">{t(`problem.items.${p.key}.title`)}</div>
              <div className="text-[15px] leading-relaxed text-cm-muted">{t(`problem.items.${p.key}.desc`)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SOLUTION */}
      <div className="bg-gradient-to-br from-[#2E1A16] to-[#3B211B] text-white">
        <div className="mx-auto max-w-[1120px] px-5 py-14 sm:px-10 sm:py-20 md:py-24">
          <div className="mx-auto mb-10 max-w-[720px] text-center sm:mb-14">
            <div className="mb-3.5 text-[15px] font-bold text-[#FF6A61]">{t('solution.eyebrow')}</div>
            <h2 className="mb-5 text-[26px] font-extrabold leading-snug tracking-tight sm:text-4xl">
              {t.rich('solution.title', {
                br,
                accent: (chunks) => <span className="text-[#FF6A61]">{chunks}</span>,
              })}
            </h2>
            <p className="text-[15px] leading-relaxed text-[#B9B9B9] sm:text-lg">
              {t.rich('solution.subtitle', { br })}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {solutions.map((s) => (
              <div
                key={s.key}
                className="min-w-[240px] flex-1 basis-[260px] rounded-[20px] border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 text-3xl">{s.icon}</div>
                <div className="mb-2 text-lg font-bold tracking-tight">{t(`solution.items.${s.key}.title`)}</div>
                <div className="text-sm leading-relaxed text-[#C9B6AF]">{t(`solution.items.${s.key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="mx-auto max-w-[1120px] px-5 py-14 sm:px-10 sm:py-20 md:py-24">
        <div className="mb-9 text-center sm:mb-14">
          <div className="mb-3 text-[15px] font-bold text-primary">{t('features.eyebrow')}</div>
          <h2 className="text-[26px] font-extrabold tracking-tight sm:text-4xl">{t('features.title')}</h2>
        </div>

        {/* Desktop: phone mockup illustrations */}
        <div className="hidden md:block">
          <div className="mb-16 overflow-x-auto">
            <svg viewBox="0 0 1040 620" className="block h-auto w-full min-w-[680px]" fontFamily="Pretendard, sans-serif">
              <defs>
                <clipPath id="scr1">
                  <rect x="74" y="30" width="280" height="560" rx="40" />
                </clipPath>
                <filter id="cardSh" x="-20%" y="-20%" width="140%" height="150%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.12" />
                </filter>
                <marker id="ah1" markerWidth="12" markerHeight="12" refX="8" refY="5" orient="auto">
                  <path d="M1 1 L9 5 L1 9" fill="none" stroke="#E8342A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              {/* phone */}
              <rect x="64" y="20" width="300" height="580" rx="48" fill="#111111" />
              <rect x="74" y="30" width="280" height="560" rx="40" fill="#ffffff" />
              <g clipPath="url(#scr1)">
                <rect x="74" y="30" width="280" height="116" fill="#ffffff" />
                <rect x="74" y="146" width="280" height="444" fill="#E9ECEF" />
                <rect x="74" y="252" width="280" height="16" fill="#ffffff" />
                <rect x="74" y="430" width="280" height="16" fill="#ffffff" />
                <rect x="196" y="146" width="16" height="444" fill="#ffffff" />
                <rect x="300" y="146" width="13" height="444" fill="#ffffff" />
                <rect x="92" y="168" width="86" height="66" rx="6" fill="#DDE2E6" />
                <rect x="228" y="176" width="76" height="60" rx="6" fill="#DDE2E6" />
                <rect x="98" y="300" width="80" height="104" rx="6" fill="#DDE2E6" />
                <rect x="224" y="300" width="120" height="110" rx="8" fill="#D6E8CF" />
                <path d="M74 500 L160 476 L250 520 L354 494 L354 590 L74 590 Z" fill="#C3DBEA" />
                <g>
                  <path d="M150 240 C139 226 139 210 150 210 C161 210 161 226 150 240 Z" fill="#E8342A" />
                  <circle cx="150" cy="221" r="4.5" fill="#fff" />
                </g>
                <g>
                  <path d="M270 220 C259 206 259 190 270 190 C281 190 281 206 270 220 Z" fill="#F5B301" />
                  <circle cx="270" cy="201" r="4.5" fill="#fff" />
                </g>
                <g>
                  <path d="M312 336 C301 322 301 306 312 306 C323 306 323 322 312 336 Z" fill="#1B3A6B" />
                  <circle cx="312" cy="317" r="4.5" fill="#fff" />
                </g>
                <g>
                  <path d="M140 372 C129 358 129 342 140 342 C151 342 151 358 140 372 Z" fill="#8A8A8A" />
                  <circle cx="140" cy="353" r="4.5" fill="#fff" />
                </g>
                <g>
                  <path d="M252 360 C241 346 241 330 252 330 C263 330 263 346 252 360 Z" fill="#E8342A" />
                  <circle cx="252" cy="341" r="4.5" fill="#fff" />
                </g>
                <g>
                  <path d="M176 470 C165 456 165 440 176 440 C187 440 187 456 176 470 Z" fill="#F5B301" />
                  <circle cx="176" cy="451" r="4.5" fill="#fff" />
                </g>
                <circle cx="210" cy="428" r="9" fill="#2B7FFF" stroke="#fff" strokeWidth="3" />
                <circle cx="330" cy="516" r="16" fill="#fff" />
                <circle cx="330" cy="516" r="4" fill="none" stroke="#1A1A1A" strokeWidth="1.6" />
                <path d="M330 505 v4 M330 523 v-4 M319 516 h4 M341 516 h-4" stroke="#1A1A1A" strokeWidth="1.6" />
                <circle cx="326" cy="552" r="21" fill="#E8342A" />
                <path d="M326 542 v20 M316 552 h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </g>
              <rect x="176" y="44" width="76" height="20" rx="10" fill="#000" />
              <rect x="90" y="80" width="16" height="16" rx="6" fill="#E8342A" />
              <circle cx="98" cy="88" r="3.2" fill="#fff" />
              <text x="112" y="93" fontSize="15" fontWeight="800" fill="#E8342A" letterSpacing="-0.3">
                CraveMap
              </text>
              <circle cx="330" cy="88" r="9" fill="none" stroke="#1A1A1A" strokeWidth="1.5" />
              <path
                d="M321 88 h18 M330 79 c4 4 4 14 0 18 M330 79 c-4 4 -4 14 0 18"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="1.2"
              />
              <rect x="88" y="110" width="42" height="26" rx="13" fill="#E8342A" />
              <text x="109" y="127" fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle">
                {t('mockup.filterAll')}
              </text>
              <rect x="136" y="110" width="62" height="26" rx="13" fill="#fff" stroke="#E5E5E5" />
              <text x="167" y="127" fontSize="11.5" fontWeight="600" fill="#555" textAnchor="middle">
                CN {t('mockup.countryCN')}
              </text>
              <rect x="204" y="110" width="74" height="26" rx="13" fill="#fff" stroke="#E5E5E5" />
              <text x="241" y="127" fontSize="11.5" fontWeight="600" fill="#555" textAnchor="middle">
                VN {t('mockup.countryVN')}
              </text>
              <rect x="284" y="110" width="62" height="26" rx="13" fill="#fff" stroke="#E5E5E5" />
              <text x="315" y="127" fontSize="11.5" fontWeight="600" fill="#555" textAnchor="middle">
                JP {t('mockup.countryJP')}
              </text>

              <path d="M556 108 C 470 92 410 90 350 90" fill="none" stroke="#E8342A" strokeWidth="2.4" strokeLinecap="round" markerEnd="url(#ah1)" />
              <path d="M556 300 C 460 328 360 350 272 352" fill="none" stroke="#E8342A" strokeWidth="2.4" strokeLinecap="round" markerEnd="url(#ah1)" />
              <path d="M556 490 C 470 522 410 538 350 546" fill="none" stroke="#E8342A" strokeWidth="2.4" strokeLinecap="round" markerEnd="url(#ah1)" />

              <g>
                <rect x="556" y="60" width="456" height="104" rx="18" fill="#fff" stroke="#F0EAE8" filter="url(#cardSh)" />
                <text x="584" y="102" fontSize="24" fontWeight="800" fill="#1A1A1A">{`🌏  ${t('features.items.multilingual.title')}`}</text>
                <text x="584" y="132" fontSize="17" fill="#6b5f5d">{t('features.items.multilingual.descLine1')}</text>
                <text x="584" y="156" fontSize="17" fill="#6b5f5d">{t('features.items.multilingual.descLine2')}</text>
              </g>
              <g>
                <rect x="556" y="252" width="456" height="104" rx="18" fill="#fff" stroke="#F0EAE8" filter="url(#cardSh)" />
                <text x="584" y="294" fontSize="24" fontWeight="800" fill="#1A1A1A">{`🗺  ${t('features.items.map.title')}`}</text>
                <text x="584" y="324" fontSize="17" fill="#6b5f5d">{t('features.items.map.descLine1')}</text>
                <text x="584" y="348" fontSize="17" fill="#6b5f5d">{t('features.items.map.descLine2')}</text>
              </g>
              <g>
                <rect x="556" y="440" width="456" height="104" rx="18" fill="#fff" stroke="#F0EAE8" filter="url(#cardSh)" />
                <text x="584" y="482" fontSize="24" fontWeight="800" fill="#1A1A1A">{`📍  ${t('features.items.report.title')}`}</text>
                <text x="584" y="512" fontSize="17" fill="#6b5f5d">{t('features.items.report.descLine1')}</text>
                <text x="584" y="536" fontSize="17" fill="#6b5f5d">{t('features.items.report.descLine2')}</text>
              </g>
            </svg>
          </div>

          <div className="overflow-x-auto">
            <svg viewBox="0 0 1040 620" className="block h-auto w-full min-w-[680px]" fontFamily="Pretendard, sans-serif">
              <defs>
                <clipPath id="scr2">
                  <rect x="686" y="30" width="280" height="560" rx="40" />
                </clipPath>
                <filter id="cardSh2" x="-20%" y="-20%" width="140%" height="150%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.12" />
                </filter>
                <marker id="ah2" markerWidth="12" markerHeight="12" refX="8" refY="5" orient="auto">
                  <path d="M1 1 L9 5 L1 9" fill="none" stroke="#E8342A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              <rect x="676" y="20" width="300" height="580" rx="48" fill="#111111" />
              <rect x="686" y="30" width="280" height="560" rx="40" fill="#ffffff" />
              <g clipPath="url(#scr2)">
                <rect x="686" y="30" width="280" height="300" fill="#E9ECEF" />
                <rect x="706" y="70" width="90" height="66" rx="6" fill="#DDE2E6" />
                <rect x="840" y="90" width="80" height="60" rx="6" fill="#DDE2E6" />
                <rect x="686" y="180" width="280" height="14" fill="#fff" />
                <rect x="810" y="30" width="14" height="300" fill="#fff" />
                <rect x="686" y="30" width="280" height="300" fill="#000000" opacity="0.22" />
                <rect x="686" y="300" width="280" height="300" rx="22" fill="#ffffff" />
                <rect x="805" y="313" width="42" height="5" rx="2.5" fill="#D8D8D8" />
                <rect x="706" y="330" width="60" height="24" rx="12" fill="#FDE8E7" />
                <text x="736" y="346" fontSize="11.5" fontWeight="700" fill="#E8342A" textAnchor="middle">{`🇨🇳 ${t('mockup.countryCN')}`}</text>
                <rect x="772" y="330" width="54" height="24" rx="12" fill="#F2F2F2" />
                <text x="799" y="346" fontSize="11.5" fontWeight="700" fill="#555" textAnchor="middle">{`🍜 ${t('mockup.categoryRestaurant')}`}</text>
                <text x="706" y="382" fontSize="19" fontWeight="800" fill="#1A1A1A">{t('mockup.storeName')}</text>
                <text x="706" y="405" fontSize="12" fill="#888">{`📍 ${t('mockup.storeAddress')}`}</text>
                <line x1="706" y1="420" x2="946" y2="420" stroke="#F0F0F0" strokeWidth="1.5" />
                <text x="706" y="442" fontSize="12.5" fontWeight="700" fill="#1A1A1A">{t('mockup.commentCount', { count: 2 })}</text>
                <circle cx="719" cy="470" r="13" fill="#EDEDED" />
                <text x="719" y="474" fontSize="11" fontWeight="700" fill="#888" textAnchor="middle">{t('mockup.comment1Initial')}</text>
                <text x="741" y="465" fontSize="12" fontWeight="700" fill="#1A1A1A">{t('mockup.comment1Author')}</text>
                <text x="946" y="465" fontSize="10.5" fill="#bbb" textAnchor="end">06.21</text>
                <text x="741" y="484" fontSize="12" fill="#333">{t('mockup.comment1Content')}</text>
                <circle cx="719" cy="514" r="13" fill="#EDEDED" />
                <text x="719" y="518" fontSize="11" fontWeight="700" fill="#888" textAnchor="middle">A</text>
                <text x="741" y="509" fontSize="12" fontWeight="700" fill="#1A1A1A">Anh</text>
                <text x="946" y="509" fontSize="10.5" fill="#bbb" textAnchor="end">06.20</text>
                <text x="741" y="528" fontSize="12" fill="#333">{t('mockup.comment2Content')}</text>
                <rect x="700" y="548" width="212" height="34" rx="17" fill="#fff" stroke="#E5E5E5" strokeWidth="1.4" />
                <text x="714" y="569" fontSize="12" fill="#aaa">{t('mockup.commentPlaceholder')}</text>
                <circle cx="936" cy="565" r="16" fill="#E8342A" />
                <path d="M929 565 L943 559 L938 565 L943 571 Z" fill="#fff" />
              </g>
              <rect x="788" y="44" width="76" height="20" rx="10" fill="#000" />

              <path d="M486 320 C 580 380 630 480 690 556" fill="none" stroke="#E8342A" strokeWidth="2.4" strokeLinecap="round" markerEnd="url(#ah2)" />

              <g>
                <rect x="30" y="250" width="456" height="112" rx="18" fill="#fff" stroke="#F0EAE8" filter="url(#cardSh2)" />
                <text x="58" y="294" fontSize="24" fontWeight="800" fill="#1A1A1A">{`💬  ${t('features.items.comments.title')}`}</text>
                <text x="58" y="324" fontSize="17" fill="#6b5f5d">{t('features.items.comments.descLine1')}</text>
                <text x="58" y="348" fontSize="17" fill="#6b5f5d">{t('features.items.comments.descLine2')}</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Mobile: feature cards only, stacked vertically */}
        <div className="flex flex-col gap-4 md:hidden">
          {mobileFeatures.map((f) => (
            <div
              key={f.key}
              className="flex items-start gap-4 rounded-2xl border border-[#EEE] bg-white p-5 shadow-[0_8px_26px_-18px_rgba(0,0,0,0.2)]"
            >
              <div className="text-2xl">{f.icon}</div>
              <div>
                <div className="mb-1 text-base font-bold">{t(`features.items.${f.key}.title`)}</div>
                <div className="text-sm leading-relaxed text-cm-muted">{t(`features.items.${f.key}.desc`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-14 sm:px-10 sm:pb-20 md:pb-24">
        <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-[#F5564D] px-6 py-12 text-center sm:px-10 sm:py-16 md:py-20">
          <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-white/[0.08]" />
          <div className="relative">
            <h2 className="mb-4 text-[26px] font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-[42px]">
              {t.rich('cta.title', { br })}
            </h2>
            <p className="mb-8 text-[15px] text-white/90 sm:text-lg">{t('cta.subtitle')}</p>
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-9 py-[17px] text-[17px] font-extrabold text-primary shadow-[0_12px_30px_-10px_rgba(0,0,0,0.3)]"
            >
              {t('cta.button')} <span className="text-[19px]">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-cm-divider">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-5 py-8 sm:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[50%_50%_50%_2px] bg-primary">
              <div className="h-[7px] w-[7px] rounded-full bg-white" />
            </div>
            <span className="text-[17px] font-extrabold text-primary">CraveMap</span>
          </div>
          <Link href={homeHref} className="text-sm text-cm-muted">
            cravemap-nu.vercel.app
          </Link>
        </div>
      </div>
    </div>
  )
}
