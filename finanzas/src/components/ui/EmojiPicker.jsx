import { useState } from 'react'
import { Icon } from '@iconify/react'
import {
  IconSearch,
  // Finanzas
  IconWallet, IconCoin, IconCreditCard, IconCash, IconReceipt,
  IconChartLine, IconChartBar, IconChartPie, IconChartDonut, IconChartArea,
  IconCurrencyDollar, IconCurrencyEuro, IconCurrencyBitcoin, IconCurrencyPound, IconCurrencyYen,
  IconCurrencyReal, IconCurrencyPeso, IconPigMoney, IconBuildingBank,
  IconTrendingUp, IconTrendingDown, IconArrowsUpDown, IconArrowsExchange,
  IconTarget, IconCalculator, IconCashBanknote, IconMoneybag, IconPercentage,
  IconReportMoney, IconReportAnalytics,
  // Comida
  IconToolsKitchen2, IconToolsKitchen, IconCoffee, IconSalad, IconPizza, IconBottle, IconApple, IconMeat,
  IconBread, IconSoup, IconFish, IconEgg, IconChefHat, IconGrape, IconBeer,
  IconBaguette, IconMilk, IconIceCream2, IconCheese, IconMushroom, IconCup, IconGlass,
  // Transporte
  IconCar, IconBus, IconPlane, IconBike, IconGasStation, IconShip, IconTrain,
  IconMotorbike, IconHelicopter, IconScooter, IconTruck, IconRocket, IconSailboat,
  IconParking, IconCarGarage, IconRoad, IconTrafficLights, IconBabyCarriage,
  // Hogar
  IconHome, IconBolt, IconDroplet, IconTool, IconFlame, IconKey, IconBed, IconArmchair,
  IconBath, IconSofa, IconPaint, IconArmchair2, IconBedFlat,
  IconFridge, IconWashMachine, IconVacuumCleaner, IconLamp, IconPlant2,
  IconHammer, IconScissors, IconSpray, IconIroning,
  // Tecnologia
  IconDeviceMobile, IconDeviceLaptop, IconDeviceTv, IconHeadphones, IconCamera, IconWifi,
  IconBattery, IconBluetooth, IconUsb, IconCpu, IconServer, IconKeyboard,
  IconMouse, IconPrinter, IconScan, IconDeviceTablet, IconDeviceGamepad,
  IconDeviceWatch, IconSpeakerphone,
  // Salud
  IconHospital, IconPill, IconHeart, IconRun, IconDental, IconEye,
  IconBrain, IconActivityHeartbeat, IconHeartbeat, IconYoga, IconStethoscope, IconVaccine,
  IconFirstAidKit, IconWeight, IconZzz, IconTemperature,
  IconBuildingHospital, IconAmbulance, IconBandage, IconDumbbell,
  // Entretenimiento
  IconMovie, IconMusic, IconBook, IconMicrophone, IconVideo, IconPhoto,
  IconBallFootball, IconBallBasketball, IconBallBaseball, IconBallTennis, IconBallVolleyball,
  IconBallAmericanFootball, IconBallBowling, IconPingPong,
  IconChess, IconCards, IconDice, IconSwimming, IconPool,
  IconPalette, IconBrush, IconParachute, IconSnowboarding, IconSkiJumping,
  // Compras
  IconShoppingCart, IconShoppingBag, IconTag, IconHanger, IconHanger2, IconShirt,
  IconBuildingStore, IconPackage, IconBarcode, IconGift,
  // Educacion
  IconSchool, IconCertificate, IconMicroscope, IconIdBadge, IconAtom, IconPencil,
  // Trabajo
  IconBriefcase, IconStar, IconTrophy, IconUsers, IconCalendar, IconClipboard,
  IconPresentation, IconChartTreemap, IconMail, IconPhone, IconPaperclip,
  IconNote, IconPin, IconFolder, IconAward, IconMedal, IconSettings,
  // Viajes
  IconBeach, IconMountain, IconMap, IconTent, IconCompass, IconCamper,
  IconCampfire, IconLuggage, IconId, IconBuildingCastle, IconBuildingChurch, IconBuildingSkyscraper,
  // Naturaleza
  IconLeaf, IconTree, IconSunrise, IconMoon, IconSnowflake, IconSun,
  IconWind, IconCloud, IconRainbow, IconFlower,
  // Mascotas
  IconDog, IconCat,
  // Otros
  IconBell, IconPuzzle, IconSparkles, IconFlag, IconShield, IconActivity,
  // Marcas — Streaming
  IconBrandNetflix, IconBrandDisney, IconBrandHbo, IconBrandTwitch, IconBrandYoutube,
  IconBrandSpotify, IconBrandDeezer, IconBrandSoundcloud,
  // Marcas — Tech / Cloud
  IconBrandGoogle, IconBrandApple, IconBrandAmazon, IconBrandOffice, IconBrandMeta,
  IconBrandGithub, IconBrandDropbox, IconBrandNotion, IconBrandSlack, IconBrandZoom,
  IconBrandFigma, IconBrandAdobe, IconBrandOpenai, IconBrandOnedrive,
  IconBrandGoogleDrive, IconBrandGoogleOne, IconBrandGmail, IconBrandTeams,
  // Marcas — Social
  IconBrandInstagram, IconBrandFacebook, IconBrandX, IconBrandTiktok,
  IconBrandWhatsapp, IconBrandTelegram, IconBrandDiscord, IconBrandLinkedin,
  IconBrandSnapchat, IconBrandReddit, IconBrandThreads,
  // Marcas — Viajes / Delivery
  IconBrandAirbnb, IconBrandBooking, IconBrandUber, IconBrandShopee,
  IconBrandVinted, IconBrandStrava,
  // Marcas — Gaming
  IconBrandSteam, IconBrandXbox, IconBrandElectronicArts,
  // Marcas — Pagos / Crypto
  IconBrandPaypal, IconBrandVisa, IconBrandMastercard, IconBrandStripe,
  IconBrandRevolut, IconBrandCoinbase, IconBrandBinance,
} from '@tabler/icons-react'

// ─── Paleta de colores ────────────────────────────────────────────────────────

const ICON_COLORS = [
  '#111827', '#6B7280', '#EF4444', '#F97316',
  '#F59E0B', '#22C55E', '#14B8A6', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
]

// ─── Registros ────────────────────────────────────────────────────────────────

export const ICON_REGISTRY = {
  IconWallet, IconCoin, IconCreditCard, IconCash, IconReceipt,
  IconChartLine, IconChartBar, IconChartPie, IconChartDonut, IconChartArea,
  IconCurrencyDollar, IconCurrencyEuro, IconCurrencyBitcoin, IconCurrencyPound, IconCurrencyYen,
  IconCurrencyReal, IconCurrencyPeso, IconPigMoney, IconBuildingBank,
  IconTrendingUp, IconTrendingDown, IconArrowsUpDown, IconArrowsExchange,
  IconTarget, IconCalculator, IconCashBanknote, IconMoneybag, IconPercentage,
  IconReportMoney, IconReportAnalytics,
  IconToolsKitchen2, IconToolsKitchen, IconCoffee, IconSalad, IconPizza, IconBottle, IconApple, IconMeat,
  IconBread, IconSoup, IconFish, IconEgg, IconChefHat, IconGrape, IconBeer,
  IconBaguette, IconMilk, IconIceCream2, IconCheese, IconMushroom, IconCup, IconGlass,
  IconCar, IconBus, IconPlane, IconBike, IconGasStation, IconShip, IconTrain,
  IconMotorbike, IconHelicopter, IconScooter, IconTruck, IconRocket, IconSailboat,
  IconParking, IconCarGarage, IconRoad, IconTrafficLights, IconBabyCarriage,
  IconHome, IconBolt, IconDroplet, IconTool, IconFlame, IconKey, IconBed, IconArmchair,
  IconBath, IconSofa, IconPaint, IconArmchair2, IconBedFlat,
  IconFridge, IconWashMachine, IconVacuumCleaner, IconLamp, IconPlant2,
  IconHammer, IconScissors, IconSpray, IconIroning,
  IconDeviceMobile, IconDeviceLaptop, IconDeviceTv, IconHeadphones, IconCamera, IconWifi,
  IconBattery, IconBluetooth, IconUsb, IconCpu, IconServer, IconKeyboard,
  IconMouse, IconPrinter, IconScan, IconDeviceTablet, IconDeviceGamepad,
  IconDeviceWatch, IconSpeakerphone,
  IconHospital, IconPill, IconHeart, IconRun, IconDental, IconEye,
  IconBrain, IconActivityHeartbeat, IconHeartbeat, IconYoga, IconStethoscope, IconVaccine,
  IconFirstAidKit, IconWeight, IconZzz, IconTemperature,
  IconBuildingHospital, IconAmbulance, IconBandage, IconDumbbell,
  IconMovie, IconMusic, IconBook, IconMicrophone, IconVideo, IconPhoto,
  IconBallFootball, IconBallBasketball, IconBallBaseball, IconBallTennis, IconBallVolleyball,
  IconBallAmericanFootball, IconBallBowling, IconPingPong,
  IconChess, IconCards, IconDice, IconSwimming, IconPool,
  IconPalette, IconBrush, IconParachute, IconSnowboarding, IconSkiJumping,
  IconShoppingCart, IconShoppingBag, IconTag, IconHanger, IconHanger2, IconShirt,
  IconBuildingStore, IconPackage, IconBarcode, IconGift,
  IconSchool, IconCertificate, IconMicroscope, IconIdBadge, IconAtom, IconPencil,
  IconBriefcase, IconStar, IconTrophy, IconUsers, IconCalendar, IconClipboard,
  IconPresentation, IconChartTreemap, IconMail, IconPhone, IconPaperclip,
  IconNote, IconPin, IconFolder, IconAward, IconMedal, IconSettings,
  IconBeach, IconMountain, IconMap, IconTent, IconCompass, IconCamper,
  IconCampfire, IconLuggage, IconId, IconBuildingCastle, IconBuildingChurch, IconBuildingSkyscraper,
  IconLeaf, IconTree, IconSunrise, IconMoon, IconSnowflake, IconSun,
  IconWind, IconCloud, IconRainbow, IconFlower,
  IconDog, IconCat,
  IconBell, IconPuzzle, IconSparkles, IconFlag, IconShield, IconActivity,
}

const ICON_CATEGORIES = {
  'Finanzas':        ['IconWallet','IconCoin','IconCreditCard','IconCash','IconCashBanknote','IconMoneybag','IconReceipt','IconPigMoney','IconBuildingBank','IconCurrencyDollar','IconCurrencyEuro','IconCurrencyBitcoin','IconCurrencyPound','IconCurrencyYen','IconCurrencyReal','IconCurrencyPeso','IconChartLine','IconChartBar','IconChartPie','IconChartDonut','IconChartArea','IconTrendingUp','IconTrendingDown','IconArrowsUpDown','IconArrowsExchange','IconTarget','IconCalculator','IconPercentage','IconReportMoney','IconReportAnalytics'],
  'Comida':          ['IconToolsKitchen2','IconToolsKitchen','IconCoffee','IconCup','IconGlass','IconBeer','IconSalad','IconPizza','IconBread','IconBaguette','IconSoup','IconMeat','IconFish','IconEgg','IconCheese','IconMushroom','IconGrape','IconApple','IconMilk','IconIceCream2','IconChefHat','IconBottle'],
  'Transporte':      ['IconCar','IconMotorbike','IconScooter','IconBike','IconBabyCarriage','IconBus','IconTrain','IconTruck','IconPlane','IconHelicopter','IconRocket','IconShip','IconSailboat','IconGasStation','IconParking','IconCarGarage','IconRoad','IconTrafficLights'],
  'Hogar':           ['IconHome','IconBolt','IconDroplet','IconFlame','IconKey','IconBed','IconBedFlat','IconArmchair','IconArmchair2','IconSofa','IconBath','IconFridge','IconWashMachine','IconVacuumCleaner','IconLamp','IconPlant2','IconPaint','IconTool','IconHammer','IconScissors','IconSpray','IconIroning'],
  'Tecnologia':      ['IconDeviceMobile','IconDeviceLaptop','IconDeviceTablet','IconDeviceTv','IconDeviceWatch','IconDeviceGamepad','IconHeadphones','IconSpeakerphone','IconCamera','IconWifi','IconBattery','IconBluetooth','IconUsb','IconCpu','IconServer','IconKeyboard','IconMouse','IconPrinter','IconScan'],
  'Salud':           ['IconHospital','IconBuildingHospital','IconAmbulance','IconPill','IconHeart','IconHeartbeat','IconActivityHeartbeat','IconBrain','IconStethoscope','IconVaccine','IconFirstAidKit','IconBandage','IconDental','IconEye','IconRun','IconDumbbell','IconYoga','IconWeight','IconZzz','IconTemperature'],
  'Entretenimiento': ['IconMovie','IconVideo','IconMusic','IconMicrophone','IconBook','IconPhoto','IconPalette','IconBrush','IconBallFootball','IconBallBasketball','IconBallBaseball','IconBallTennis','IconBallVolleyball','IconBallAmericanFootball','IconBallBowling','IconPingPong','IconChess','IconCards','IconDice','IconSwimming','IconPool','IconParachute','IconSnowboarding','IconSkiJumping'],
  'Compras':         ['IconShoppingCart','IconShoppingBag','IconTag','IconHanger','IconHanger2','IconShirt','IconBuildingStore','IconPackage','IconBarcode','IconGift'],
  'Educacion':       ['IconSchool','IconCertificate','IconMicroscope','IconIdBadge','IconAtom','IconPencil'],
  'Trabajo':         ['IconBriefcase','IconStar','IconTrophy','IconAward','IconMedal','IconUsers','IconCalendar','IconClipboard','IconPresentation','IconChartTreemap','IconMail','IconPhone','IconPaperclip','IconNote','IconPin','IconFolder','IconSettings'],
  'Viajes':          ['IconBeach','IconMountain','IconCompass','IconMap','IconTent','IconCamper','IconCampfire','IconLuggage','IconId','IconBuildingCastle','IconBuildingChurch','IconBuildingSkyscraper'],
  'Naturaleza':      ['IconLeaf','IconTree','IconFlower','IconSun','IconSunrise','IconMoon','IconSnowflake','IconWind','IconCloud','IconRainbow'],
  'Mascotas':        ['IconDog','IconCat'],
  'Otros':           ['IconBell','IconGift','IconPuzzle','IconSparkles','IconFlag','IconShield','IconActivity'],
}

export const BRAND_REGISTRY = {
  IconBrandNetflix, IconBrandDisney, IconBrandHbo, IconBrandTwitch, IconBrandYoutube,
  IconBrandSpotify, IconBrandDeezer, IconBrandSoundcloud,
  IconBrandGoogle, IconBrandApple, IconBrandAmazon, IconBrandOffice, IconBrandMeta,
  IconBrandGithub, IconBrandDropbox, IconBrandNotion, IconBrandSlack, IconBrandZoom,
  IconBrandFigma, IconBrandAdobe, IconBrandOpenai, IconBrandOnedrive,
  IconBrandGoogleDrive, IconBrandGoogleOne, IconBrandGmail, IconBrandTeams,
  IconBrandInstagram, IconBrandFacebook, IconBrandX, IconBrandTiktok,
  IconBrandWhatsapp, IconBrandTelegram, IconBrandDiscord, IconBrandLinkedin,
  IconBrandSnapchat, IconBrandReddit, IconBrandThreads,
  IconBrandAirbnb, IconBrandBooking, IconBrandUber, IconBrandShopee,
  IconBrandVinted, IconBrandStrava,
  IconBrandSteam, IconBrandXbox, IconBrandElectronicArts,
  IconBrandPaypal, IconBrandVisa, IconBrandMastercard, IconBrandStripe,
  IconBrandRevolut, IconBrandCoinbase, IconBrandBinance,
}

const BRAND_LIST = [
  { icon: 'IconBrandNetflix',        name: 'Netflix'       },
  { icon: 'IconBrandDisney',         name: 'Disney+'       },
  { icon: 'IconBrandHbo',            name: 'HBO / Max'     },
  { icon: 'IconBrandTwitch',         name: 'Twitch'        },
  { icon: 'IconBrandYoutube',        name: 'YouTube'       },
  { icon: 'IconBrandSpotify',        name: 'Spotify'       },
  { icon: 'IconBrandDeezer',         name: 'Deezer'        },
  { icon: 'IconBrandSoundcloud',     name: 'SoundCloud'    },
  { icon: 'IconBrandGoogle',         name: 'Google'        },
  { icon: 'IconBrandApple',          name: 'Apple'         },
  { icon: 'IconBrandAmazon',         name: 'Amazon'        },
  { icon: 'IconBrandOffice',         name: 'Microsoft'     },
  { icon: 'IconBrandMeta',           name: 'Meta'          },
  { icon: 'IconBrandGithub',         name: 'GitHub'        },
  { icon: 'IconBrandDropbox',        name: 'Dropbox'       },
  { icon: 'IconBrandNotion',         name: 'Notion'        },
  { icon: 'IconBrandSlack',          name: 'Slack'         },
  { icon: 'IconBrandZoom',           name: 'Zoom'          },
  { icon: 'IconBrandFigma',          name: 'Figma'         },
  { icon: 'IconBrandAdobe',          name: 'Adobe'         },
  { icon: 'IconBrandOpenai',         name: 'OpenAI'        },
  { icon: 'IconBrandOnedrive',       name: 'OneDrive'      },
  { icon: 'IconBrandGoogleDrive',    name: 'Google Drive'  },
  { icon: 'IconBrandGoogleOne',      name: 'Google One'    },
  { icon: 'IconBrandGmail',          name: 'Gmail'         },
  { icon: 'IconBrandTeams',          name: 'Teams'         },
  { icon: 'IconBrandInstagram',      name: 'Instagram'     },
  { icon: 'IconBrandFacebook',       name: 'Facebook'      },
  { icon: 'IconBrandX',              name: 'X'             },
  { icon: 'IconBrandTiktok',         name: 'TikTok'        },
  { icon: 'IconBrandWhatsapp',       name: 'WhatsApp'      },
  { icon: 'IconBrandTelegram',       name: 'Telegram'      },
  { icon: 'IconBrandDiscord',        name: 'Discord'       },
  { icon: 'IconBrandLinkedin',       name: 'LinkedIn'      },
  { icon: 'IconBrandSnapchat',       name: 'Snapchat'      },
  { icon: 'IconBrandReddit',         name: 'Reddit'        },
  { icon: 'IconBrandThreads',        name: 'Threads'       },
  { icon: 'IconBrandAirbnb',         name: 'Airbnb'        },
  { icon: 'IconBrandBooking',        name: 'Booking'       },
  { icon: 'IconBrandUber',           name: 'Uber'          },
  { icon: 'IconBrandShopee',         name: 'Shopee'        },
  { icon: 'IconBrandVinted',         name: 'Vinted'        },
  { icon: 'IconBrandStrava',         name: 'Strava'        },
  { icon: 'IconBrandSteam',          name: 'Steam'         },
  { icon: 'IconBrandXbox',           name: 'Xbox'          },
  { icon: 'IconBrandElectronicArts', name: 'EA'            },
  { icon: 'IconBrandPaypal',         name: 'PayPal'        },
  { icon: 'IconBrandVisa',           name: 'Visa'          },
  { icon: 'IconBrandMastercard',     name: 'Mastercard'    },
  { icon: 'IconBrandStripe',         name: 'Stripe'        },
  { icon: 'IconBrandRevolut',        name: 'Revolut'       },
  { icon: 'IconBrandCoinbase',       name: 'Coinbase'      },
  { icon: 'IconBrandBinance',        name: 'Binance'       },
]

// ─── Helpers para parsear el valor "IconName:#color" ─────────────────────────

function parseIconValue(value) {
  if (!value) return { iconName: '', color: null }
  const idx = value.indexOf(':#')
  if (idx !== -1) return { iconName: value.slice(0, idx), color: value.slice(idx + 1) }
  return { iconName: value, color: null }
}

function buildIconValue(iconName, color) {
  if (!iconName) return ''
  return color ? `${iconName}:${color}` : iconName
}

// ─── IconDisplay ──────────────────────────────────────────────────────────────

export function IconDisplay({ icon, size = 20, className = '', dark = false, stroke = 1.5 }) {
  if (!icon) return null

  const { iconName, color } = parseIconValue(icon)

  // Iconify icons (ph: Phosphor Duotone, simple-icons: brands)
  if (iconName.startsWith('ph:') || iconName.startsWith('simple-icons:')) {
    return (
      <Icon
        icon={iconName}
        width={size}
        height={size}
        className={className}
        style={{ /* GGA exception: icon color from stored value */ ...(color ? { color } : {}) }}
      />
    )
  }

  // Legacy: si: via CDN
  if (iconName.startsWith('si:')) {
    const slug = iconName.slice(3)
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}${dark ? '/ffffff' : ''}`}
        width={size} height={size} className={className} alt={slug}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }

  // Legacy: Tabler icons
  if (iconName.startsWith('Icon')) {
    const TablerIcon = ICON_REGISTRY[iconName] || BRAND_REGISTRY[iconName]
    if (TablerIcon) {
      return (
        <TablerIcon
          size={size}
          stroke={stroke}
          className={className}
          style={{ /* GGA exception: icon color from stored value */ ...(color ? { color } : {}) }}
        />
      )
    }
  }

  return <span style={{ /* GGA exception: dynamic em size from prop */ fontSize: size * 0.85, lineHeight: 1 }} className={className}>{iconName}</span>
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

export function EmojiPicker({ value, onChange, label = 'Icono', compact = false }) {
  const [open, setOpen]     = useState(false)
  const [tab, setTab]       = useState('icon')
  const [search, setSearch] = useState('')

  const { iconName: currentIcon, color: currentColor } = parseIconValue(value)

  const selectIcon = (name) => {
    onChange(buildIconValue(name, currentColor))
    setOpen(false)
    setSearch('')
  }

  const selectColor = (color) => {
    if (!currentIcon) return
    onChange(buildIconValue(currentIcon, color))
  }

  const allIconNames = Object.keys(ICON_REGISTRY)
  const filteredIcons = search.trim()
    ? allIconNames.filter(n => n.toLowerCase().includes(search.toLowerCase().replace(/\s/g, '')))
    : null

  const filteredBrands = search.trim()
    ? BRAND_LIST.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : BRAND_LIST

  const ColorStrip = () => (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      <button
        type="button"
        onClick={() => selectColor(null)}
        title="Color por defecto"
        className={`w-5 h-5 rounded-full border-2 bg-gray-100 transition ${!currentColor ? 'border-gray-500 scale-110' : 'border-gray-300'}`}
      />
      {ICON_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => selectColor(c)}
          title={c}
          className={`w-5 h-5 rounded-full border-2 transition ${currentColor === c ? 'border-gray-500 scale-110' : 'border-transparent'}`}
          style={{ /* GGA exception: color swatch from ICON_COLORS data */ background: c }}
        />
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}

      {compact ? (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className={`w-12 h-10 bg-gray-50 border-2 rounded-xl flex items-center justify-center hover:border-primary-400 transition ${open ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
            title="Elegir icono"
          >
            {currentIcon
              ? <IconDisplay icon={value} size={20} />
              : <span className="text-gray-300 text-lg">+</span>
            }
          </button>
          {currentIcon && <ColorStrip />}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="w-12 h-10 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 hover:border-primary-400 transition"
            >
              {currentIcon
                ? <IconDisplay icon={value} size={22} />
                : <span className="text-gray-300 text-xl">?</span>
              }
            </button>
            {currentIcon && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className="text-xs text-gray-400 hover:text-red-500 transition"
              >
                Quitar
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="ml-auto px-3 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition font-medium"
            >
              {open ? 'Cerrar' : 'Elegir icono'}
            </button>
          </div>
          {currentIcon && <ColorStrip />}
        </div>
      )}

      {open && (
        <div className="border-2 border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden mt-1">
          <div className="flex border-b-2 border-gray-100">
            {[['icon', 'Iconos'], ['marca', 'Marcas']].map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setTab(key); setSearch('') }}
                className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${
                  tab === key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="px-3 pt-3">
            <div className="relative">
              <IconSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'icon' ? 'Buscar icono...' : 'Buscar marca...'}
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
              />
            </div>
          </div>

          {tab === 'icon' && (
            <div className="p-3 max-h-72 overflow-y-auto space-y-3">
              {filteredIcons ? (
                filteredIcons.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {filteredIcons.map(name => {
                      const Ic = ICON_REGISTRY[name]
                      const sel = currentIcon === name
                      return (
                        <button
                          key={name}
                          type="button"
                          title={name.replace('Icon', '')}
                          onClick={() => selectIcon(name)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary-50 transition ${sel ? 'bg-primary-100 ring-2 ring-primary-400' : ''}`}
                        >
                          <Ic size={18} stroke={1.5} style={{ /* GGA exception: user-selected icon color */ ...(sel && currentColor ? { color: currentColor } : {}) }} className={sel && !currentColor ? 'text-primary-600' : 'text-gray-500'} />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
                )
              ) : (
                Object.entries(ICON_CATEGORIES).map(([group, names]) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{group}</p>
                    <div className="flex flex-wrap gap-1">
                      {names.map(name => {
                        const Ic = ICON_REGISTRY[name]
                        const sel = currentIcon === name
                        return (
                          <button
                            key={name}
                            type="button"
                            title={name.replace('Icon', '')}
                            onClick={() => selectIcon(name)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary-50 transition ${sel ? 'bg-primary-100 ring-2 ring-primary-400' : ''}`}
                          >
                            <Ic size={18} stroke={1.5} style={{ /* GGA exception: user-selected icon color */ ...(sel && currentColor ? { color: currentColor } : {}) }} className={sel && !currentColor ? 'text-primary-600' : 'text-gray-500'} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'marca' && (
            <div className="p-3 max-h-72 overflow-y-auto">
              {filteredBrands.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {filteredBrands.map(b => {
                    const Ic = BRAND_REGISTRY[b.icon]
                    const sel = currentIcon === b.icon
                    return (
                      <button
                        key={b.icon}
                        type="button"
                        title={b.name}
                        onClick={() => selectIcon(b.icon)}
                        className={`flex flex-col items-center gap-0.5 w-14 py-2 rounded-xl hover:bg-primary-50 transition ${sel ? 'bg-primary-100 ring-2 ring-primary-400' : ''}`}
                      >
                        <Ic size={22} stroke={1.5} style={{ /* GGA exception: user-selected icon color */ ...(sel && currentColor ? { color: currentColor } : {}) }} className={sel && !currentColor ? 'text-primary-600' : 'text-gray-500'} />
                        <span className={`text-[9px] font-medium leading-tight text-center truncate w-full px-0.5 ${sel ? 'text-primary-600' : 'text-gray-400'}`}>
                          {b.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
