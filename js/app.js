/* ============================================================
   TARKELIA • HERO TEST — Telegram Mini App
   Main application logic
   ============================================================ */
(() => {
  'use strict';

  /* ------------------------------------------------------------
     DATA & CONSTANTS
     ------------------------------------------------------------ */

  const D = window.DAGGERHEART_DATA || {};
  const GEAR = window.TK_GEAR || {};
  const CLASSES = Array.isArray(D.classes) ? D.classes : [];
  const RACES = Array.isArray(D.races) ? D.races : [];
  const COMMUNITIES = Array.isArray(D.communities) ? D.communities : [];
  const ARMORS = Array.isArray(GEAR.armor) ? GEAR.armor : (Array.isArray(D.armor) ? D.armor : []);
  const WEAPONS = (GEAR.weapons && Array.isArray(GEAR.weapons.all))
    ? GEAR.weapons.all
    : ((D.weapons && Array.isArray(D.weapons.all)) ? D.weapons.all : []);
  const LOOT = GEAR.loot || {};
  const LOOT_ITEMS = Array.isArray(LOOT.items) ? LOOT.items : [];
  const LOOT_CONSUMABLES = Array.isArray(LOOT.consumables) ? LOOT.consumables : [];
  const LOOT_ALL = Array.isArray(LOOT.all) ? LOOT.all : [...LOOT_ITEMS, ...LOOT_CONSUMABLES];
  const LOOT_BY_ID = new Map(LOOT_ALL.map((item) => [item.id, item]));
  const PRESETS = D.presets || {};
  const TIPS = D.tips || {};

  const STORAGE_KEY = 'tarkelia_hero_v1';
  const STEP_COUNT = 14;

  const ATTRS = [
    { key: 'Проворность', short: 'Пров', icon: 'agility', desc: 'Бег, прыжки, акробатика, скорость реакции' },
    { key: 'Сила', short: 'Сил', icon: 'strength', desc: 'Физическая мощь, тяжёлое оружие, атлетика' },
    { key: 'Искусность', short: 'Иск', icon: 'finesse', desc: 'Ловкость пальцев, скрытность, меткие выстрелы' },
    { key: 'Инстинкт', short: 'Инст', icon: 'instinct', desc: 'Восприятие, чутьё опасности, выживание' },
    { key: 'Влияние', short: 'Влия', icon: 'presence', desc: 'Харизма, обаяние, ораторство, запугивание' },
    { key: 'Знание', short: 'Знан', icon: 'knowledge', desc: 'Ум, дедукция, память, анализ древних текстов' }
  ];
  const ATTR_POOL = ['+2', '+1', '+1', '0', '0', '-1'];

  const POTIONS = [
    {
      value: 'Малое зелье здоровья (1d4 ХП)',
      name: 'Малое зелье здоровья',
      desc: 'Восстанавливает 1d4 Хит-Поинтов. Надёжный спутник в любой передряге.'
    },
    {
      value: 'Малое зелье выносливости (1d4 Стресса)',
      name: 'Малое зелье выносливости',
      desc: 'Снимает 1d4 Стресса. Помогает выдержать то, что не выдержит тело.'
    }
  ];

  const RANDOM_EXPERIENCES = [
    'Ветеран пограничных войн',
    'Липкие пальчики',
    'Притворяйся, пока не поверят',
    'Знание трав и ядов',
    'Тихий шаг',
    'Голос толпы',
    'Следопыт пустошей',
    'Придворный этикет'
  ];

  const RANDOM_BONDS = [
    'Кто из вас однажды вытащил меня из смертельной передряги?',
    'Кому я доверяю больше, чем себе, и почему?',
    'Кто знает обо мне то, чего не знают другие?',
    'С кем мы связаны долгом, который ещё не оплачен?',
    'Кто первым поверил в меня, когда остальные отвернулись?'
  ];

  const PERSONAL_ITEM_SEEDS = [
    'кулон с портретом, письмо из дома, гладкий камень, кружка с трещиной, блокнот',
    'обломок клинка, засушенный цветок, игральная кость, потёртая карта, медный ключ',
    'кольцо без камня, детский рисунок, связка писем, деревянная фигурка, старая монета'
  ];

  const BETA_MESSAGE = 'Сейчас твой выбор в бетта тесте и для него нет распечатанной карты, но ты все еще можешь выбрать этот вариант';

  const BETA_NAMES = new Set([
    'шарлатан', 'шаман', 'маг', 'культист', 'жрец',
    'арахнид', 'коско', 'криликс', 'морок', 'нага', 'плазмоид', 'плазмойд', 'салас', 'текра', 'три-крин',
    'карнавальное', 'трактирное', 'воздушное', 'полевое', 'крепостное', 'садовое', 'цивилизованное', 'особенное', 'мирное'
  ].map((name) => name.toLowerCase().replace(/ё/g, 'е')));

  const RARITY_PRICE = { 'Обычная': 1, 'Необычная': 2, 'Редкая': 3 };
  const RARITY_CLASS = { 'Обычная': 'common', 'Необычная': 'uncommon', 'Редкая': 'rare' };
  const RARITY_LABEL = { 'Обычная': 'Обычный', 'Необычная': 'Необычный', 'Редкая': 'Редкий' };

  const APPEARANCE_SEEDS = [
    'Высокий и жилистый, с внимательным взглядом и шрамом через бровь.',
    'Невысокая, но крепкая, с быстрой улыбкой и пылью дорог на сапогах.',
    'Худощавый, с длинными пальцами и привычкой прятать взгляд под капюшоном.',
    'Широкоплечая, с громким голосом и золотыми кольцами в косе.',
    'Седой не по годам, с чернильными пятнами на пальцах и спокойной осанкой.',
    'Юный, но усталый, с обветренной кожей и слишком взрослым взглядом.',
    'Элегантный, в тщательно зашитой одежде и с неизменной перчаткой на левой руке.',
    'Диковатый, с листьями в волосах и запахом дыма от костра.'
  ];

  const EXPECTATION_IDEAS = [
    'Хочу исследовать тайны древней Таркелии',
    'Хочу больше боёв и опасных схваток',
    'Хочу разобраться в отношениях внутри отряда',
    'Хочу найти ответы о своём прошлом',
    'Хочу, чтобы у героя был шанс измениться'
  ];

  const TRIGGER_IDEAS = [
    'Не описывать подробно пытки и жестокость к детям',
    'Не трогать тему потери близких без предупреждения',
    'Оставлять пространство для юмора даже в мрачных сценах',
    'Спрашивать перед сценами с романтикой',
    'Не заставлять героя предавать отряд без выбора'
  ];

  const NAME_POOL = {
    female: ['Эйрин', 'Лианэль', 'Морвен', 'Сайра', 'Тэсса', 'Иви', 'Найра', 'Вела', 'Айрин', 'Кэтрин', 'Сельва', 'Ориана', 'Дара', 'Мирель', 'Ясна', 'Уна', 'Фрейя', 'Зара', 'Ниа', 'Эления'],
    male: ['Каэль', 'Дориан', 'Рэйнар', 'Тэлон', 'Бран', 'Оррин', 'Вейл', 'Кайрус', 'Эйден', 'Мэл', 'Гаррик', 'Рован', 'Силас', 'Дэйн', 'Торн', 'Ивар', 'Киран', 'Люк', 'Оникс', 'Фенрис'],
    neutral: ['Аш', 'Рен', 'Сэйдж', 'Ник', 'Ривер', 'Скай', 'Лис', 'Ким', 'Джун', 'Ари']
  };

  const STEP_ART = {
    5: 'глобальные_Характеристики',
    6: 'глобальные_оружие',
    7: 'глобальные_броня',
    8: 'глобальные_лут',
    9: 'глобальные_опыт',
    10: 'глобальные_личность и прошлое',
    11: 'глобальные_внешность',
    12: 'глобальные_связи с командой',
    13: 'глобальные_досье персонажа'
  };

  const STEPS = [
    {
      id: 'concept',
      name: 'Искра',
      kicker: 'Начало пути • 01',
      title: 'Кто ты, странник?',
      lead: 'Имя, возраст и искра — первое, что запомнит Таркелия. Начни с образа, который хочется воплотить.'
    },
    {
      id: 'class',
      name: 'Класс',
      kicker: 'Призвание • 02',
      title: 'Выбери своё призвание',
      lead: 'Класс задаёт боевую роль и стиль игры. Подкласс ты выберешь на следующем шаге.'
    },
    {
      id: 'subclass',
      name: 'Подкласс',
      kicker: 'Путь силы • 03',
      title: 'Каким путём пойдёшь?',
      lead: 'Подкласс раскрывает особенности класса и даёт герою собственный почерк.'
    },
    {
      id: 'race',
      name: 'Раса',
      kicker: 'Происхождение • 04',
      title: 'Кровь и происхождение',
      lead: 'Раса определяет внешность, чутьё и особые способности. Можно смешать две родословные.'
    },
    {
      id: 'community',
      name: 'Сообщество',
      kicker: 'Дом и круг • 05',
      title: 'Твой народ и дом',
      lead: 'Сообщество — это люди, обычаи и навыки, которые вырастили героя до первого приключения.'
    },
    {
      id: 'attributes',
      name: 'Характеристики',
      kicker: 'Сила и слабость • 06',
      title: 'Сила в твоих руках',
      lead: 'Распредели шесть значений между характеристиками. Каждый герой силён в одном и уязвим в другом.'
    },
    {
      id: 'weapon',
      name: 'Оружие',
      kicker: 'Сталь и магия • 07',
      title: 'Чем ты сражаешься?',
      lead: 'Выбери парное оружие или одну двуручную вещь. В каждом списке можно выбрать «(ничего)».'
    },
    {
      id: 'armor',
      name: 'Броня',
      kicker: 'Вторая кожа • 08',
      title: 'Что тебя защитит?',
      lead: 'Броня повышает пороги урона и даёт защиту, но иногда стоит подвижности. Выбери свою цену безопасности.'
    },
    {
      id: 'inventory',
      name: 'Лут',
      kicker: 'Дорога зовёт • 09',
      title: 'Что купить в дорогу?',
      lead: 'У тебя есть стартовые монеты. Потрать их в магазине или оставь на потом, а личные вещи опиши словами.'
    },
    {
      id: 'experience',
      name: 'Опыт',
      kicker: 'Уроки прошлого • 10',
      title: 'Чему научила жизнь',
      lead: 'Сформулируй два опыта. За 1 Надежду каждый из них добавляет +2 к подходящему броску.'
    },
    {
      id: 'lore',
      name: 'История',
      kicker: 'Личность и прошлое • 11',
      title: 'История, которую не забыть',
      lead: 'Черты, событие, сожаление, тайна и цель. Пять ответов, из которых складывается живой человек.'
    },
    {
      id: 'appearance',
      name: 'Внешность',
      kicker: 'Лицо и взгляд • 12',
      title: 'Как тебя запомнят?',
      lead: 'Опиши внешность героя и добавь референсы, если они есть. Детали делают образ живым.'
    },
    {
      id: 'party',
      name: 'Отряд',
      kicker: 'Те, кто рядом • 13',
      title: 'Связь с отрядом',
      lead: 'Один вопрос, который свяжет героя с другими. Ожидания и границы помогут играть бережно и интересно.'
    },
    {
      id: 'final',
      name: 'Досье',
      kicker: 'Герой готов • 14',
      title: 'Твоё досье',
      lead: 'Проверь историю, снаряжение и детали. После этого герой отправится в Таркелию.'
    }
  ];

  const CODEX_TABS = [
    { id: 'classes', label: 'Классы', count: CLASSES.length },
    { id: 'subclasses', label: 'Подклассы', count: CLASSES.reduce((n, c) => n + (c.subclasses || []).length, 0) },
    { id: 'races', label: 'Расы', count: RACES.length },
    { id: 'communities', label: 'Сообщества', count: COMMUNITIES.length },
    { id: 'weapons', label: 'Оружие', count: WEAPONS.length },
    { id: 'armor', label: 'Броня', count: ARMORS.length },
    { id: 'lore', label: 'История', count: 0 }
  ];

  /* ------------------------------------------------------------
     SMALL HELPERS
     ------------------------------------------------------------ */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const randInt = (max) => Math.floor(Math.random() * max);
  const pick = (arr) => arr[randInt(arr.length)];
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const unique = (arr) => Array.from(new Set(arr));
  const shuffle = (arr) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const num = (value, fallback = 0) => {
    const parsed = parseInt(String(value == null ? '' : value).replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizePath = (path) => String(path || '').replace(/\\/g, '/');
  const stripImageExt = (path) => normalizePath(path).replace(/\.(png|jpe?g|webp|svg)$/i, '');

  function imageKey(path) {
    if (!path) return '';
    let p = normalizePath(path).replace(/^\.?\/?(?:images\/)?(?:opt\/(?:card|hero)\/)?/, '');
    p = stripImageExt(p);
    p = p.replace(/^глобальные(?:\s+картинки)?\//, 'глобальные_');
    p = p.replace(/^подклассы\//, 'подклассы_');
    p = p.replace(/^расы\//, 'расы_');
    p = p.replace(/^сообщества\//, 'сообщества_');
    p = p.replace(/[\/\\]/g, '_');
    return p;
  }

  function optimized(path, size = 'card') {
    if (!path) return '';
    const key = imageKey(path);
    const folder = size === 'hero' ? 'heroes' : 'cards';
    return `${folder}/${key}.jpg`;
  }

  const FALLBACK_CARD = optimized('глобальные_Заглушка', 'card');
  const FALLBACK_HERO = optimized('глобальные_Заглушка', 'hero');

  window.__tkImgError = function (img) {
    try {
      img.onerror = null;
      if (!img.dataset.failedOnce) {
        img.dataset.failedOnce = '1';
        img.src = img.dataset.fallback || FALLBACK_CARD;
      } else {
        img.style.opacity = '0';
      }
    } catch (_) {}
  };

  function imgTag(src, alt = '', cls = '', opts = {}) {
    if (!src) src = opts.hero ? FALLBACK_HERO : FALLBACK_CARD;
    const fallback = opts.hero ? FALLBACK_HERO : FALLBACK_CARD;
    const loading = opts.eager ? 'eager' : 'lazy';
    return `<img${cls ? ` class="${esc(cls)}"` : ''} src="${esc(src)}" alt="${esc(alt)}" loading="${loading}" decoding="async" data-fallback="${esc(fallback)}" onerror="window.__tkImgError&&window.__tkImgError(this)">`;
  }

  const CLASS_IMAGE_EXCEPTIONS = { 'Компаньонка': 'Компаньенка' };
  function classImagePath(name) {
    const file = CLASS_IMAGE_EXCEPTIONS[name] || name;
    return `глобальные_${file}`;
  }
  function classImage(name, size = 'card') {
    return name ? optimized(classImagePath(name), size) : optimized('глобальные_Заглушка', size);
  }

  function findClass(name) {
    return CLASSES.find((c) => c.name === name) || null;
  }
  function findSubclass(className, subclassName) {
    const cls = findClass(className);
    if (!cls) return null;
    return (cls.subclasses || []).find((s) => s.name === subclassName) || null;
  }
  function findRace(name) {
    return RACES.find((r) => r.name === name) || null;
  }
  function findCommunity(name) {
    return COMMUNITIES.find((c) => c.name === name) || null;
  }
  function findWeapon(id) {
    return WEAPONS.find((w) => w.id === id) || null;
  }
  function findArmor(id) {
    return ARMORS.find((a) => a.id === id) || null;
  }
  function findLootItem(id) {
    return LOOT_BY_ID.get(id) || null;
  }
  function normalizeBetaName(value) {
    return String(value || '').trim().toLowerCase().replace(/ё/g, 'е');
  }
  function isBetaName(value) {
    return BETA_NAMES.has(normalizeBetaName(value));
  }
  function attrIcon(attr) {
    return attr && attr.icon ? `icons/${attr.icon}.svg` : '';
  }
  const RARITY_PRICES = {
  'Обычная': 1,     // Укажите цену для обычных (сейчас 1)
  'Необычная': 3,   // Укажите цену для необычных (сейчас 2)
  'Редкая': 5       // Укажите цену для редких (сейчас 3)
};

function lootPrice(item) {
  if (!item) return 0;
  return RARITY_PRICES[item.rarity] ?? (Number(item.price) || 0);
}

  function parseMod(value) {
    const text = String(value == null ? '' : value).replace('−', '-').replace('—', '').trim();
    if (!text) return 0;
    const parsed = parseInt(text, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function attrNum(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseInt(String(value).replace('+', ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fmtMod(value) {
    const n = attrNum(value);
    return n > 0 ? `+${n}` : String(n);
  }

  function formatText(text) {
    if (!text) return '';
    const escaped = esc(text);
    const lines = escaped.split(/\r?\n/);
    let html = '';
    let inList = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }
      if (/^[-•]\s+/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${inlineFormat(line.replace(/^[-•]\s+/, ''))}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += `<p>${inlineFormat(line)}</p>`;
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  function inlineFormat(line) {
    return line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function firstNonEmpty(...values) {
    for (const value of values) {
      if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function displayGender() {
    if (hero.gender === 'Свой') return firstNonEmpty(hero.genderCustom, 'Свой');
    return hero.gender || '';
  }

  function displayRace() {
    if (hero.mixed) {
      return [hero.mixedA, hero.mixedB].filter(Boolean).join(' / ') || '';
    }
    return hero.race || '';
  }

  function displayClass() {
    const cls = findClass(hero.class);
    if (!cls) return '';
    return hero.subclass ? `${hero.subclass} • ${cls.name}` : cls.name;
  }

  function displayRaceShort() {
    return displayRace() || '—';
  }

  function safeFilename(name) {
    return String(name || 'hero').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'hero';
  }

  /* ------------------------------------------------------------
     STATE & PERSISTENCE
     ------------------------------------------------------------ */

  function defaultHero() {
    return {
      version: 1,
      name: '',
      gender: '',
      genderCustom: '',
      age: '',
      spark: '',
      sparkTitle: '',
      class: '',
      subclass: '',
      race: '',
      mixed: false,
      mixedA: '',
      mixedB: '',
      community: '',
      attrs: {
        'Проворность': null,
        'Сила': null,
        'Искусность': null,
        'Инстинкт': null,
        'Влияние': null,
        'Знание': null
      },
      weaponMode: 'dual',
      mainWeapon: '',
      offhandWeapon: '',
      twohandWeapon: '',
      armor: '',
      potion: POTIONS[0].value,
      startingMoney: 10 + randInt(6),
      shopPurchases: [],
      personalItems: '',
      inventory: [],
      customItem: '',
      experiences: [
        { name: '', mod: 2 },
        { name: '', mod: 2 }
      ],
      traits: '',
      definingEvent: '',
      regret: '',
      secret: '',
      goal: '',
      appearance: '',
      refs: [''],
      partyBond: '',
      expectations: '',
      triggers: '',
      createdAt: null,
      updatedAt: null
    };
  }

  let hero = defaultHero();
  let currentStep = 0;
  let currentScreen = 'home';
  let codexReturn = 'home';
  let sheetOpen = false;
  let sheetCloseTimer = null;
  let confirmCallback = null;
  let betaCallback = null;
  let toastTimer = null;
  let saveTimer = null;

  const ui = {
    classFilter: 'Все',
    classBaseOnly: false,
    raceSlot: 'A',
    weaponTab: 'main',
    weaponFilter: 'Все',
    armorFilter: 'Все',
    lootTab: 'shop',
    shopKindFilter: 'all',
    shopRarityFilter: 'Обычная',
    loreTab: 0,
    codexTab: 'classes',
    codexQuery: ''
  };

  function normalizeHero(raw) {
    const base = defaultHero();
    const merged = Object.assign(base, raw || {});
    merged.attrs = Object.assign(base.attrs, (raw && raw.attrs) || {});
    merged.experiences = Array.isArray(merged.experiences) ? merged.experiences.slice(0, 2) : [];
    while (merged.experiences.length < 2) merged.experiences.push({ name: '', mod: 2 });
    merged.experiences = merged.experiences.map((e) => ({ name: String((e && e.name) || ''), mod: 2 }));
    merged.refs = Array.isArray(merged.refs) && merged.refs.length ? merged.refs.slice(0, 3).map((r) => String(r || '')) : [''];
    merged.inventory = Array.isArray(merged.inventory) ? unique(merged.inventory.map((x) => String(x || '')).filter(Boolean)).slice(0, 12) : [];
    merged.age = merged.age === null || merged.age === undefined ? '' : String(merged.age);
    merged.weaponMode = merged.weaponMode === 'twohand' ? 'twohand' : 'dual';
    const savedMoney = raw && raw.startingMoney;
    merged.startingMoney = savedMoney === null || savedMoney === undefined || !Number.isFinite(Number(savedMoney))
      ? base.startingMoney
      : clamp(Math.round(Number(savedMoney)), 0, 15);
    merged.shopPurchases = Array.isArray(raw && raw.shopPurchases)
      ? unique(raw.shopPurchases.map((id) => String(id || '')).filter((id) => !!findLootItem(id)))
      : [];
    merged.personalItems = String((raw && raw.personalItems) || '');
    merged.potion = POTIONS.some((potion) => potion.value === merged.potion) ? merged.potion : base.potion;
    return merged;
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !saved.hero) return false;
      hero = normalizeHero(saved.hero);
      currentStep = clamp(Number(saved.currentStep) || 0, 0, STEP_COUNT - 1);
      return hasProgress();
    } catch (err) {
      console.warn('Не удалось загрузить черновик', err);
      return false;
    }
  }

  function saveNow() {
    try {
      hero.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        hero,
        currentStep,
        updatedAt: hero.updatedAt
      }));
    } catch (err) {
      console.warn('Не удалось сохранить черновик', err);
    }
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 220);
  }

  function touch() {
    hero.updatedAt = new Date().toISOString();
  }

  function hasProgress() {
    if (!hero) return false;
    if (currentStep > 0) return true;
    if (hero.name || hero.gender || hero.age || hero.spark) return true;
    if (hero.class || hero.race || hero.community) return true;
    if (hero.mixedA || hero.mixedB) return true;
    if (ATTRS.some((a) => hero.attrs[a.key] !== null)) return true;
    if (hero.mainWeapon || hero.offhandWeapon || hero.twohandWeapon || hero.armor) return true;
    if (hero.shopPurchases.length || hero.personalItems) return true;
    if (hero.experiences.some((e) => e.name)) return true;
    if (hero.traits || hero.definingEvent || hero.regret || hero.secret || hero.goal || hero.appearance || hero.partyBond) return true;
    return false;
  }

  function resetHero() {
    hero = defaultHero();
    currentStep = 0;
    ui.loreTab = 0;
    ui.raceSlot = 'A';
    ui.weaponTab = 'main';
    ui.weaponFilter = 'Все';
    ui.armorFilter = 'Все';
    ui.lootTab = 'shop';
    ui.shopKindFilter = 'all';
    ui.shopRarityFilter = 'Обычная';
    saveNow();
  }

  /* ------------------------------------------------------------
     VALIDATION & PROGRESS
     ------------------------------------------------------------ */

  function isStepValid(step) {
    switch (step) {
      case 0:
        return !!(hero.name.trim() && hero.gender && String(hero.age).trim() && hero.spark.trim());
      case 1:
        return !!hero.class;
      case 2:
        return !!(hero.class && hero.subclass);
      case 3:
        return hero.mixed ? !!(hero.mixedA && hero.mixedB) : !!hero.race;
      case 4:
        return !!hero.community;
      case 5:
        return ATTRS.every((a) => hero.attrs[a.key] !== null && hero.attrs[a.key] !== undefined && hero.attrs[a.key] !== '');
      case 6:
        return true;
      case 7:
        return !!hero.armor;
      case 8:
        return true;
      case 9:
        return !!(hero.experiences[0].name.trim() && hero.experiences[1].name.trim());
      case 10:
        return !!(hero.traits.trim() && hero.definingEvent.trim() && hero.regret.trim() && hero.secret.trim() && hero.goal.trim());
      case 11:
        return !!hero.appearance.trim();
      case 12:
        return !!hero.partyBond.trim();
      case 13:
        return STEPS.slice(0, 13).every((_, index) => isStepValid(index));
      default:
        return true;
    }
  }

  function validateMessage(step) {
    switch (step) {
      case 0:
        if (!hero.name.trim()) return 'Впиши имя героя';
        if (!hero.gender) return 'Выбери пол героя';
        if (!String(hero.age).trim()) return 'Укажи возраст героя';
        if (!hero.spark.trim()) return 'Выбери искру или опиши свою';
        return '';
      case 1:
        return hero.class ? '' : 'Выбери класс';
      case 2:
        if (!hero.class) return 'Сначала выбери класс';
        if (!hero.subclass) return 'Выбери подкласс';
        return '';
      case 3:
        if (hero.mixed && (!hero.mixedA || !hero.mixedB)) return 'Выбери две расы для смешанной родословной';
        if (!hero.mixed && !hero.race) return 'Выбери расу героя';
        return '';
      case 4:
        return hero.community ? '' : 'Выбери сообщество';
      case 5: {
        const assigned = ATTRS.filter((a) => hero.attrs[a.key] !== null).length;
        return assigned === 6 ? '' : `Распредели все 6 характеристик (осталось ${6 - assigned})`;
      }
      case 6:
        return '';
      case 7:
        return hero.armor ? '' : 'Выбери броню';
      case 8:
        return '';
      case 9:
        if (!hero.experiences[0].name.trim()) return 'Заполни первый опыт (+2)';
        if (!hero.experiences[1].name.trim()) return 'Заполни второй опыт (+2)';
        return '';
      case 10:
        if (!hero.traits.trim()) return 'Заполни черты характера';
        if (!hero.definingEvent.trim()) return 'Опиши ключевое событие';
        if (!hero.regret.trim()) return 'Опиши главное сожаление';
        if (!hero.secret.trim()) return 'Опиши тайну героя';
        if (!hero.goal.trim()) return 'Опиши цель странствий';
        return '';
      case 11:
        return hero.appearance.trim() ? '' : 'Опиши внешность героя';
      case 12:
        return hero.partyBond.trim() ? '' : 'Заполни связь с отрядом';
      default:
        return '';
    }
  }

  function completionCount() {
    let count = 0;
    for (let i = 0; i < STEP_COUNT; i++) {
      if (isStepValid(i)) count++;
    }
    return count;
  }

  function completionPct() {
    return Math.round((completionCount() / STEP_COUNT) * 100);
  }

  function stepHint(step) {
    if (step === 13) return 'Проверь досье и заверши создание героя';
    const hints = [
      'Имя, пол, возраст и искра — всё на месте',
      'Класс выбран',
      'Подкласс выбран',
      'Родословная определена',
      'Сообщество выбрано',
      'Все характеристики распределены',
      'Оружие готово к бою',
      'Броня надета',
      'Монеты и личные вещи готовы',
      'Опыт записан',
      'История героя готова',
      'Внешность описана',
      'Связь с отрядом установлена'
    ];
    return hints[step] || 'Можно продолжать';
  }

  /* ------------------------------------------------------------
     TELEGRAM & UI FEEDBACK
     ------------------------------------------------------------ */

  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function haptic(type = 'light') {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning');
      } else if (type === 'select') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (_) {}
  }

  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2800);
  }

  function initTelegram() {
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
    } catch (_) {}
    try {
      tg.setHeaderColor('#0b0910');
      tg.setBackgroundColor('#0b0910');
    } catch (_) {}
    try {
      if (tg.BackButton) tg.BackButton.onClick(handleBack);
    } catch (_) {}
  }

  function syncTelegramBack() {
    if (!tg || !tg.BackButton) return;
    try {
      if (sheetOpen || currentScreen !== 'home') tg.BackButton.show();
      else tg.BackButton.hide();
    } catch (_) {}
  }

  function showScreen(name) {
    currentScreen = name;
    $$('.screen').forEach((screen) => {
      screen.classList.toggle('is-active', screen.id === `screen-${name}`);
    });
    window.scrollTo(0, 0);
    syncTelegramBack();
    if (name === 'home') {
      startHomeBgSlideshow();
    } else {
      stopHomeBgSlideshow();
    }
  }

  function openWizard(step = currentStep) {
    currentStep = clamp(Number(step) || 0, 0, STEP_COUNT - 1);
    if (currentStep === 10) {
      const loreFields = ['traits', 'definingEvent', 'regret', 'secret', 'goal'];
      const firstEmpty = loreFields.findIndex((field) => !String(hero[field] || '').trim());
      ui.loreTab = firstEmpty >= 0 ? firstEmpty : 4;
    }
    showScreen('wizard');
    renderStep();
  }

  function goHome() {
    showScreen('home');
    renderHome();
  }

  function handleBack() {
    if (sheetOpen) {
      closeSheet();
      return;
    }
    if (currentScreen === 'codex') {
      showScreen(codexReturn);
      if (codexReturn === 'wizard') renderStep();
      if (codexReturn === 'result') renderResult();
      if (codexReturn === 'home') renderHome();
      return;
    }
    if (currentScreen === 'wizard') {
      if (currentStep > 0) {
        currentStep--;
        renderStep();
      } else {
        confirmSheet({
          title: 'Выйти на главную?',
          message: 'Прогресс сохранится. Ты сможешь продолжить с этого же места.',
          confirmText: 'На главную',
          onConfirm: goHome
        });
      }
      return;
    }
    if (currentScreen === 'result') {
      goHome();
      return;
    }
    if (tg && tg.close) {
      try { tg.close(); } catch (_) {}
    }
  }

  function confirmSheet({ title, message, confirmText = 'Подтвердить', danger = false, onConfirm }) {
    confirmCallback = onConfirm;
    openSheet({
      eyebrow: 'Подтверждение',
      title,
      content: `<p class="confirm-copy">${esc(message)}</p>`,
      footer: `
        <button class="btn btn-ghost" type="button" data-action="close-sheet">Отмена</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-action="confirm-sheet">${esc(confirmText)}</button>
      `
    });
  }

  function openBetaSheet(onConfirm) {
    betaCallback = onConfirm;
    openSheet({
      eyebrow: 'Бета-контент',
      title: 'Карта ещё не напечатана',
      content: `<p class="confirm-copy">${esc(BETA_MESSAGE)}</p>`,
      footer: `
        <button class="btn btn-ghost" type="button" data-action="beta-replace">Заменить</button>
        <button class="btn btn-primary" type="button" data-action="beta-confirm">Оставить и продолжить</button>
      `
    });
  }

  /* ------------------------------------------------------------
     HOME
     ------------------------------------------------------------ */

  function renderHome() {
    const started = hasProgress();
    const startLabel = $('#btn-start-label');
    if (startLabel) startLabel.textContent = started ? 'Начать заново' : 'Начать тест';

    const continueBtn = $('#btn-continue');
    if (continueBtn) {
      continueBtn.hidden = !started;
      if (started) {
        const stepName = STEPS[currentStep] ? STEPS[currentStep].name : 'Продолжить';
        const label = $('#btn-continue-label');
        const stepLabel = $('#btn-continue-step');
        if (label) label.textContent = 'Продолжить';
        if (stepLabel) stepLabel.textContent = `${currentStep + 1}/${STEP_COUNT} • ${stepName}`;
      }
    }

    const initialBg = $('#home-bg-1');
    if (initialBg && !initialBg.getAttribute('src')) {
      initialBg.src = 'wallpaper/1.png';
    }
  }

  /* ------------------------------------------------------------
     HOME BACKGROUND SLIDESHOW (Wallpaper rotation every 2s)
     ------------------------------------------------------------ */

  const HOME_WALLPAPERS = [
    'wallpaper/1.png', 'wallpaper/2.png', 'wallpaper/3.png', 'wallpaper/4.png',
    'wallpaper/5.png', 'wallpaper/6.png', 'wallpaper/7.png', 'wallpaper/8.png',
    'wallpaper/9.png', 'wallpaper/10.png', 'wallpaper/11.png', 'wallpaper/12.png',
    'wallpaper/13.png', 'wallpaper/14.png', 'wallpaper/15.png', 'wallpaper/16.png',
    'wallpaper/17.png', 'wallpaper/18.png', 'wallpaper/19.png', 'wallpaper/20.png',
    'wallpaper/21.png', 'wallpaper/22.png', 'wallpaper/23.png', 'wallpaper/24.png',
    'wallpaper/25.png', 'wallpaper/26.png', 'wallpaper/27.png', 'wallpaper/28.png'
  ];

  let homeBgTimer = null;
  let currentBgLayerIndex = 0;
  let lastHomeBgSrc = 'wallpaper/1.png';
  let wallpaperQueue = [];
  let nextPreloadedSrc = null;
  let nextPreloaderImg = null;

  function getNextWallpaper() {
    if (!wallpaperQueue.length) {
      const copy = [...HOME_WALLPAPERS];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      if (copy[0] === lastHomeBgSrc && copy.length > 1) {
        [copy[0], copy[copy.length - 1]] = [copy[copy.length - 1], copy[0]];
      }
      wallpaperQueue = copy;
    }
    return wallpaperQueue.shift();
  }

  function preloadAhead() {
    nextPreloadedSrc = getNextWallpaper();
    nextPreloaderImg = new Image();
    nextPreloaderImg.src = nextPreloadedSrc;
  }

  function nextHomeBg() {
    if (currentScreen !== 'home') return;

    const nextSrc = nextPreloadedSrc || getNextWallpaper();
    lastHomeBgSrc = nextSrc;

    const layer1 = $('#home-bg-1');
    const layer2 = $('#home-bg-2');
    if (!layer1 || !layer2) return;

    const layers = [layer1, layer2];
    const activeLayer = layers[currentBgLayerIndex];
    const nextLayerIndex = 1 - currentBgLayerIndex;
    const nextLayer = layers[nextLayerIndex];

    const applyTransition = () => {
      if (currentScreen !== 'home') return;
      nextLayer.src = nextSrc;
      nextLayer.classList.add('is-active');
      activeLayer.classList.remove('is-active');
      currentBgLayerIndex = nextLayerIndex;
      preloadAhead();
    };

    if (nextPreloaderImg && nextPreloaderImg.complete && nextPreloaderImg.naturalWidth) {
      applyTransition();
    } else {
      const img = new Image();
      img.onload = applyTransition;
      img.onerror = () => { preloadAhead(); };
      img.src = nextSrc;
    }
  }

  function startHomeBgSlideshow() {
    stopHomeBgSlideshow();
    if (!nextPreloadedSrc) {
      preloadAhead();
    }
    homeBgTimer = setInterval(nextHomeBg, 2000);
  }

  function stopHomeBgSlideshow() {
    if (homeBgTimer) {
      clearInterval(homeBgTimer);
      homeBgTimer = null;
    }
  }

  /* ------------------------------------------------------------
     AMBIENT CANVAS
     ------------------------------------------------------------ */

  function initAmbient() {
    const canvas = $('#ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let raf = 0;
    let last = 0;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 480 ? 32 : 52;
      particles = Array.from({ length: count }, () => spawnParticle(true));
    }

    function spawnParticle(anywhere = false) {
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : height + 12,
        r: 0.6 + Math.random() * 1.8,
        vx: -0.08 + Math.random() * 0.16,
        vy: -0.12 - Math.random() * 0.3,
        alpha: 0.12 + Math.random() * 0.45,
        twinkle: Math.random() * Math.PI * 2
      };
    }

    function draw(now) {
      const dt = Math.min((now - last) / 16.67 || 1, 2);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.twinkle += 0.02 * dt;
          if (p.y < -20 || p.x < -20 || p.x > width + 20) {
            Object.assign(p, spawnParticle(false));
          }
        }
        const flicker = 0.65 + Math.sin(p.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 178, 106, ${p.alpha * flicker})`;
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    draw(performance.now());
  }

  /* ------------------------------------------------------------
     STEP RENDERING (shared)
     ------------------------------------------------------------ */

  function stepArtFor(step) {
    if (step === 0) {
      return optimized('глобальные_Заглушка', 'hero');
    }
    if (step === 1) {
      return hero.class ? classImage(hero.class, 'hero') : optimized('глобальные_Заглушка', 'hero');
    }
    if (step === 2) {
      const sub = findSubclass(hero.class, hero.subclass);
      if (sub && sub.img) return optimized(sub.img, 'hero');
      return hero.class ? classImage(hero.class, 'hero') : optimized('images/глобальные картинки/Заглушка.png', 'hero');
    }
    if (step === 3) {
      const race = findRace(hero.mixed ? hero.mixedA : hero.race);
      return race ? optimized(race.img, 'hero') : optimized('глобальные_Заглушка', 'hero');
    }
    if (step === 4) {
      const comm = findCommunity(hero.community);
      return comm ? optimized(comm.img, 'hero') : optimized('глобальные_Заглушка', 'hero');
    }
    return optimized(STEP_ART[step] || 'глобальные_Заглушка', 'hero');
  }

  function renderStep(options = {}) {
    const step = STEPS[currentStep] || STEPS[0];
    const label = $('#wiz-step-label');
    const name = $('#wiz-step-name');
    const fill = $('#wiz-bar-fill');
    const kicker = $('#step-kicker');
    const title = $('#step-title');
    const lead = $('#step-lead');
    const head = $('#step-head');
    const content = $('#step-content');

    if (label) label.textContent = `${String(currentStep + 1).padStart(2, '0')} / ${STEP_COUNT}`;
    if (name) name.textContent = step.name;
    if (fill) fill.style.width = `${((currentStep + 1) / STEP_COUNT) * 100}%`;
    if (kicker) kicker.textContent = step.kicker;
    if (title) title.textContent = step.title;
    if (lead) lead.textContent = step.lead;
    if (head) {
      const art = stepArtFor(currentStep);
      head.style.setProperty('--step-art', art ? `url("${new URL(art, document.baseURI).href}")` : 'none');
    }
    if (content) {
      const renderers = [
        renderConceptStep,
        renderClassStep,
        renderSubclassStep,
        renderRaceStep,
        renderCommunityStep,
        renderAttributesStep,
        renderWeaponStep,
        renderArmorStep,
        renderInventoryStep,
        renderExperienceStep,
        renderLoreStep,
        renderAppearanceStep,
        renderPartyStep,
        renderFinalStep
      ];
      content.innerHTML = (renderers[currentStep] || renderConceptStep)();
      content.style.animation = 'none';
      void content.offsetWidth;
      content.style.animation = '';
    }
    refreshValidation();
    refreshPassport();
    syncTelegramBack();
    if (!options.keepScroll) window.scrollTo(0, 0);
  }

  function refreshValidation() {
    const hint = $('#footer-hint');
    const next = $('#btn-next');
    if (!hint || !next) return;
    const valid = isStepValid(currentStep);
    const message = valid ? stepHint(currentStep) : validateMessage(currentStep);
    hint.textContent = message;
    hint.classList.toggle('is-warning', !valid);
    const isFinal = currentStep === STEP_COUNT - 1;
    next.disabled = !valid && !isFinal;
    next.innerHTML = isFinal
      ? `<span>Открыть досье</span>${icon('arrow-right')}`
      : `<span>Далее</span>${icon('arrow-right')}`;
  }

  function refreshPassport() {
    const pct = completionPct();
    const ring = $('#passport-ring');
    const text = $('#passport-pct');
    if (ring) ring.style.setProperty('--p', pct);
    if (text) text.textContent = `${pct}%`;
  }

  /* ------------------------------------------------------------
     STEP 01 — CONCEPT
     ------------------------------------------------------------ */

  function renderConceptStep() {
    const genderOptions = ['Мужской', 'Женский', 'Свой'];
    const sparks = Array.isArray(PRESETS.sparks) ? PRESETS.sparks : [];
    return `
      <div class="concept-panel">
        <div class="field">
          <div class="field-label"><span>Имя героя</span><span class="optional">обязательно</span></div>
          <div class="input-row">
            <input class="text-input" id="field-name" type="text" data-field="name" value="${esc(hero.name)}" placeholder="Например, Эйрин из Сумрака" maxlength="50" autocomplete="off">
            <button class="dice-btn" type="button" data-action="roll-name" aria-label="Случайное имя">${icon('dice')}</button>
          </div>
          <div class="field-hint">Это имя увидят Мастер и другие игроки в досье.</div>
        </div>

        <div class="concept-row">
          <div class="field">
            <div class="field-label"><span>Возраст</span><span class="optional">лет</span></div>
            <div class="input-row">
              <input class="text-input" type="number" inputmode="numeric" data-field="age" value="${esc(hero.age)}" placeholder="27" min="1" max="9999">
              <button class="dice-btn" type="button" data-action="roll-age" aria-label="Случайный возраст">${icon('dice')}</button>
            </div>
          </div>
          <div class="field">
            <div class="field-label"><span>Пол</span></div>
            <div class="gender-row">
              ${genderOptions.map((g) => `<button class="gender-chip${hero.gender === g ? ' is-active' : ''}" type="button" data-action="pick-gender" data-gender="${esc(g)}">${esc(g)}</button>`).join('')}
            </div>
          </div>
        </div>
        ${hero.gender === 'Свой' ? `
          <div class="field gender-custom">
            <input class="text-input" type="text" data-field="genderCustom" value="${esc(hero.genderCustom)}" placeholder="Или введи свой вариант..." maxlength="40" autocomplete="off">
          </div>
        ` : ''}
      </div>

      <div class="section-subhead"><span>Искра героя</span><span class="section-subhead-line"></span></div>
      <p class="field-hint" style="margin:-4px 0 10px">Выбери готовый образ или впиши свой. Искра — это то, чем герой цепляет с первого взгляда.</p>

      <div class="spark-carousel">
        ${sparks.map((spark, index) => `
          <button class="spark-card${hero.spark === spark.text ? ' is-selected' : ''}" type="button" data-action="pick-spark" data-index="${index}">
            <span class="spark-icon">${icon('spark')}</span>
            <span class="spark-title">${esc(spark.title)}</span>
            <span class="spark-text">${esc(spark.text)}</span>
          </button>
        `).join('')}
      </div>

      <div class="spark-or">или своя искра</div>
      <div class="field">
        <textarea class="textarea" data-field="spark" maxlength="320" placeholder="Например: бывший стражник, который ищет искупления и не верит в благородство...">${esc(hero.spark)}</textarea>
        <div class="field-hint">${hero.sparkTitle ? `Выбрано: ${esc(hero.sparkTitle)}` : 'Одно-два предложения о том, что движет героем.'}</div>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 02 — CLASS & SUBCLASS
     ------------------------------------------------------------ */

  function renderClassStep() {
    const categories = ['Все', ...unique(CLASSES.map((c) => c.category).filter(Boolean))];
    let list = CLASSES.filter((c) => ui.classFilter === 'Все' || c.category === ui.classFilter);
    if (ui.classBaseOnly) list = list.filter((c) => c.isBase);
    const selected = findClass(hero.class);

    return `
      <div class="filter-scroll">
        ${categories.map((cat) => `<button class="filter-chip${ui.classFilter === cat ? ' is-active' : ''}" type="button" data-action="filter-class" data-filter="${esc(cat)}">${esc(cat)}</button>`).join('')}
        <button class="filter-chip${ui.classBaseOnly ? ' is-active' : ''}" type="button" data-action="toggle-base-classes">Базовые</button>
      </div>

      <div class="choice-grid">
        ${list.map((c) => classCardHTML(c)).join('')}
      </div>

      ${selected ? `
        <div class="summary-banner">
          <strong>Класс выбран:</strong> ${esc(selected.name)}. На следующем шаге выбери подкласс.
        </div>
      ` : `
        <div class="empty-state">Выбери класс, чтобы перейти к его подклассам.</div>
      `}
    `;
  }

  function renderSubclassStep() {
    const cls = findClass(hero.class);
    if (!cls) {
      return `
        <div class="empty-state">
          Сначала выбери класс — от него зависит список подклассов.
          <button class="btn btn-primary" type="button" data-action="jump-step" data-step="1" style="margin-top:14px">${icon('class')} К выбору класса</button>
        </div>
      `;
    }
    const subclasses = cls.subclasses || [];
    return `
      <div class="subclass-intro">
        <div class="subclass-intro-art">${imgTag(classImage(cls.name, 'card'), cls.name)}</div>
        <div class="subclass-intro-copy">
          <span class="section-label">Класс</span>
          <strong>${esc(cls.name)}</strong>
          <span>${esc(cls.domains || '')} • HP ${esc(cls.hp || '—')} • Стресс ${esc(cls.stress || '—')}</span>
          <button class="text-link" type="button" data-action="jump-step" data-step="1">Сменить класс ${icon('chevron-right')}</button>
        </div>
      </div>

      <div class="subclass-list">
        ${subclasses.map((sub) => subclassCardHTML(cls, sub)).join('')}
      </div>
    `;
  }

  function classCardHTML(cls) {
    const selected = hero.class === cls.name;
    return `
      <div class="choice-card class-card${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-class" data-name="${esc(cls.name)}">
        ${imgTag(classImage(cls.name, 'card'), cls.name)}
        <span class="card-shade"></span>
        <span class="check-badge">${icon('check')}</span>
        <button class="info-btn" type="button" data-action="info-class" data-name="${esc(cls.name)}" aria-label="Подробнее о классе ${esc(cls.name)}">${icon('info')}</button>
        <span class="card-copy">
          <span class="card-name">${esc(cls.name)}</span>
          <span class="card-meta">${esc(cls.domains || '')} • HP ${esc(cls.hp || '—')}</span>
        </span>
      </div>
    `;
  }

  function subclassCardHTML(cls, sub) {
    const selected = hero.class === cls.name && hero.subclass === sub.name;
    return `
      <div class="subclass-card${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-subclass" data-class="${esc(cls.name)}" data-name="${esc(sub.name)}">
        <div class="subclass-thumb">${imgTag(optimized(sub.img, 'card'), sub.name)}</div>
        <div class="subclass-body">
          <div class="subclass-name">${esc(sub.name)}</div>
          <div class="subclass-desc">${esc(sub.shortDesc || sub.base || '')}</div>
        </div>
        <button class="mini-info" type="button" data-action="info-subclass" data-class="${esc(cls.name)}" data-name="${esc(sub.name)}" aria-label="Подробнее о подклассе ${esc(sub.name)}">${icon('info')}</button>
        <span class="subclass-check">${icon('check')}</span>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 03 — RACE
     ------------------------------------------------------------ */

  function renderRaceStep() {
    const activeSlot = ui.raceSlot;
    return `
      <div class="toggle-row">
        <div class="toggle-copy">
          <strong>Смешанная родословная</strong>
          <span>Возьми две расы и соедини их наследие. Способности обеих останутся с героем.</span>
        </div>
        <label class="switch">
          <input type="checkbox" data-toggle="mixed" ${hero.mixed ? 'checked' : ''}>
          <span class="switch-track"></span>
        </label>
      </div>

      ${hero.mixed ? `
        <div class="mixed-slots">
          <button class="mixed-slot${hero.mixedA ? ' filled' : ''}${activeSlot === 'A' ? ' is-active' : ''}" type="button" data-action="race-slot" data-slot="A">
            <span class="mixed-slot-label">Первая кровь</span>
            <span class="mixed-slot-name${hero.mixedA ? '' : ' empty'}">${esc(hero.mixedA || 'Выбрать расу')}</span>
          </button>
          <span class="mixed-plus">+</span>
          <button class="mixed-slot${hero.mixedB ? ' filled' : ''}${activeSlot === 'B' ? ' is-active' : ''}" type="button" data-action="race-slot" data-slot="B">
            <span class="mixed-slot-label">Вторая кровь</span>
            <span class="mixed-slot-name${hero.mixedB ? '' : ' empty'}">${esc(hero.mixedB || 'Выбрать расу')}</span>
          </button>
        </div>
        <p class="mixed-hint">Сейчас заполняется слот <strong>${activeSlot === 'A' ? 'первой' : 'второй'}</strong> крови. Нажми на слот, чтобы переключиться.</p>
      ` : ''}

      <div class="choice-grid">
        ${RACES.map((race) => raceCardHTML(race)).join('')}
      </div>
    `;
  }

  function raceCardHTML(race) {
    const inMixed = hero.mixed && (hero.mixedA === race.name || hero.mixedB === race.name);
    const selected = hero.mixed ? inMixed : hero.race === race.name;
    const slot = hero.mixedA === race.name ? 'I' : hero.mixedB === race.name ? 'II' : '';
    return `
      <div class="choice-card race-card${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-race" data-name="${esc(race.name)}">
        ${imgTag(optimized(race.img, 'card'), race.name)}
        <span class="card-shade"></span>
        ${slot ? `<span class="slot-badge">${slot}</span>` : ''}
        <span class="check-badge">${icon('check')}</span>
        <button class="info-btn" type="button" data-action="info-race" data-name="${esc(race.name)}" aria-label="Подробнее о расе ${esc(race.name)}">${icon('info')}</button>
        <span class="card-copy">
          <span class="card-name">${esc(race.name)}</span>
          <span class="card-meta">${esc(race.category || '')}</span>
        </span>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 04 — COMMUNITY
     ------------------------------------------------------------ */

  function renderCommunityStep() {
    const selected = findCommunity(hero.community);
    return `
      <div class="choice-grid">
        ${COMMUNITIES.map((comm) => communityCardHTML(comm)).join('')}
      </div>
      ${selected ? `
        <div class="summary-banner">
          <strong>${esc(selected.abilityName || 'Способность сообщества')}:</strong> ${esc(selected.ability || '')}
        </div>
      ` : ''}
    `;
  }

  function communityCardHTML(comm) {
    const selected = hero.community === comm.name;
    return `
      <div class="choice-card comm-card${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-community" data-name="${esc(comm.name)}">
        ${imgTag(optimized(comm.img, 'card'), comm.name)}
        <span class="card-shade"></span>
        <span class="check-badge">${icon('check')}</span>
        <button class="info-btn" type="button" data-action="info-community" data-name="${esc(comm.name)}" aria-label="Подробнее о сообществе ${esc(comm.name)}">${icon('info')}</button>
        <span class="card-copy">
          <span class="card-name">${esc(comm.name)}</span>
          <span class="card-meta">${esc(comm.abilityName || '')}</span>
        </span>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 05 — ATTRIBUTES
     ------------------------------------------------------------ */

  function assignedAttrCounts() {
    const counts = { '+2': 0, '+1': 0, '0': 0, '-1': 0 };
    ATTRS.forEach((a) => {
      const val = hero.attrs[a.key];
      if (val !== null && counts[val] !== undefined) counts[val]++;
    });
    return counts;
  }

  function attrAvailable(attrKey, val) {
    const counts = assignedAttrCounts();
    const current = hero.attrs[attrKey];
    if (current === val) return true;
    const total = { '+2': 1, '+1': 2, '0': 2, '-1': 1 };
    return counts[val] < total[val];
  }

  function renderAttributesStep() {
    const counts = assignedAttrCounts();
    const total = { '+2': 1, '+1': 2, '0': 2, '-1': 1 };
    return `
      <div class="pool-bar">
        <span class="pool-label">Пул значений</span>
        <div class="pool-pills">
          ${ATTR_POOL.map((val) => `<span class="pool-pill${counts[val] >= total[val] ? ' used' : ''}">${val}</span>`).join('')}
        </div>
      </div>
      <div class="attr-list">
        ${ATTRS.map((attr) => {
          const current = hero.attrs[attr.key];
          return `
            <div class="attr-row${current !== null ? ' has-value' : ''}">
              <div class="attr-head">
                <span class="attr-name">${esc(attr.key)}</span>
                <span class="attr-desc">${esc(attr.desc)}</span>
                <span class="attr-value">${current === null ? '—' : esc(current)}</span>
              </div>
              <div class="attr-chips">
                ${ATTR_POOL.filter((v, i, arr) => arr.indexOf(v) === i).map((val) => {
                  const disabled = !attrAvailable(attr.key, val);
                  return `<button class="attr-chip${current === val ? ' is-active' : ''}" type="button" data-action="pick-attr" data-attr="${esc(attr.key)}" data-val="${esc(val)}"${disabled ? ' disabled' : ''}>${esc(val)}</button>`;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="attr-actions">
        <button class="btn btn-ghost" type="button" data-action="random-attrs">${icon('dice')} Случайно</button>
        <button class="btn btn-ghost" type="button" data-action="clear-attrs">${icon('refresh')} Сбросить</button>
      </div>
      <p class="field-hint" style="margin-top:10px">В Daggerheart значения могут быть отрицательными: слабость делает историю интереснее.</p>
    `;
  }

  /* ------------------------------------------------------------
     STEP 06 — WEAPON
     ------------------------------------------------------------ */

  function weaponMeta(weapon) {
    if (!weapon) return '';
    return [weapon.attr, weapon.range, weapon.hands].filter(Boolean).join(' • ');
  }

  function weaponCardHTML(weapon, slot) {
    const selected = slot === 'main'
      ? hero.mainWeapon === weapon.id
      : slot === 'offhand'
        ? hero.offhandWeapon === weapon.id
        : hero.twohandWeapon === weapon.id;
    return `
      <div class="choice-card gear-choice weapon-card has-info${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-weapon" data-slot="${slot}" data-id="${esc(weapon.id)}">
        <span class="check-badge">${icon('check')}</span>
        <button class="info-btn" type="button" data-action="info-weapon" data-id="${esc(weapon.id)}" aria-label="Подробнее об оружии ${esc(weapon.name)}">${icon('info')}</button>
        <span class="gear-choice-name">${esc(weapon.name)}</span>
        <span class="gear-choice-damage">${esc(weapon.damage || '—')}</span>
        <span class="gear-choice-meta">${esc(weaponMeta(weapon))}</span>
        ${weapon.prop && weapon.prop !== '—' ? `<span class="gear-choice-prop">${esc(weapon.prop)}</span>` : ''}
      </div>
    `;
  }

  function noneWeaponCardHTML(slot, selected, label) {
    return `
      <div class="choice-card gear-choice none-card${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-weapon" data-slot="${slot}" data-id="__none__">
        <span class="check-badge">${icon('check')}</span>
        <span class="none-card-icon">${icon('close')}</span>
        <span class="gear-choice-name">(ничего)</span>
        <span class="gear-choice-meta">${esc(label)}</span>
      </div>
    `;
  }

  function weaponGridHTML(items, slot, noneLabel) {
    const noneSelected = slot === 'main'
      ? (!hero.mainWeapon && hero.weaponMode !== 'twohand')
      : slot === 'offhand'
        ? (!hero.offhandWeapon && hero.weaponMode !== 'twohand')
        : (!hero.twohandWeapon && hero.weaponMode === 'twohand');
    return `
      <div class="gear-choice-grid">
        ${noneWeaponCardHTML(slot, noneSelected, noneLabel)}
        ${items.map((weapon) => weaponCardHTML(weapon, slot)).join('')}
      </div>
    `;
  }

  function renderWeaponStep() {
    const mainWeapon = findWeapon(hero.mainWeapon);
    const offhandWeapon = findWeapon(hero.offhandWeapon);
    const twohandWeapon = findWeapon(hero.twohandWeapon);
    const filter = ui.weaponFilter;

    const matchesFilter = (w) => {
      if (filter === 'Все') return true;
      if (filter === 'Физический') return w.damageType === 'Физический' || w.damageType === 'Физ / Маг';
      if (filter === 'Магический') return w.damageType === 'Магический' || w.damageType === 'Физ / Маг';
      return true;
    };

    const oneHanded = WEAPONS.filter((w) => w.group === 'oneHandedMain' && matchesFilter(w));
    const twoHanded = WEAPONS.filter((w) => w.group === 'twoHandedMain' && matchesFilter(w));
    const offhand = WEAPONS.filter((w) => w.group === 'offhand' && matchesFilter(w));
    const activeTab = ui.weaponTab === 'offhand' ? 'offhand' : 'main';
    const selectedMainText = twohandWeapon
      ? `${twohandWeapon.name} • двуручное`
      : mainWeapon
        ? `${mainWeapon.name} • ${mainWeapon.damage || ''}`
        : 'Ничего не выбрано';

    return `
      <div class="seg-tabs weapon-tabs" role="tablist" aria-label="Оружие">
        <button class="seg-tab${activeTab === 'main' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${activeTab === 'main'}" data-action="weapon-tab" data-tab="main">
          ${icon('sword')} Основное
        </button>
        <button class="seg-tab${activeTab === 'offhand' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${activeTab === 'offhand'}" data-action="weapon-tab" data-tab="offhand">
          ${icon('shield')} Дополнительное
        </button>
      </div>

      <div class="filter-scroll">
        ${['Все', 'Физический', 'Магический'].map((f) => `<button class="filter-chip${filter === f ? ' is-active' : ''}" type="button" data-action="filter-weapon" data-filter="${esc(f)}">${esc(f)}</button>`).join('')}
      </div>

      ${activeTab === 'main' ? `
        <div class="gear-current">
          <span class="gear-current-label">Основное оружие</span>
          <strong>${esc(selectedMainText)}</strong>
        </div>
        <div class="section-label">Одноручное</div>
        ${weaponGridHTML(oneHanded, 'main', 'Без основного оружия')}
        <div class="section-label" style="margin-top:18px">Двуручное</div>
        ${weaponGridHTML(twoHanded, 'twohand', 'Без двуручного оружия')}
      ` : `
        <div class="gear-current">
          <span class="gear-current-label">Дополнительное оружие</span>
          <strong>${esc(offhandWeapon ? `${offhandWeapon.name} • ${offhandWeapon.damage || ''}` : 'Ничего не выбрано')}</strong>
        </div>
        <div class="section-label">Щит, кинжал или второй клинок</div>
        ${weaponGridHTML(offhand, 'offhand', 'Без дополнительного оружия')}
      `}

      <div class="summary-banner">
        ${hero.weaponMode === 'twohand'
          ? `<strong>Стиль:</strong> двуручное оружие. ${twohandWeapon ? esc(twohandWeapon.name) : '—'}`
          : `<strong>Стиль:</strong> парное оружие. ${mainWeapon ? esc(mainWeapon.name) : '—'} + ${offhandWeapon ? esc(offhandWeapon.name) : '—'}`}
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 07 — ARMOR
     ------------------------------------------------------------ */

  function armorMatchesFilter(armor) {
    if (ui.armorFilter === 'Все') return true;
    const category = armor.category || '';
    if (ui.armorFilter === 'Без брони') return category.includes('Без доспеха');
    if (ui.armorFilter === 'Лёгкая') return category.includes('Лёгкая');
    if (ui.armorFilter === 'Средняя') return category.includes('Средняя');
    if (ui.armorFilter === 'Тяжёлая') return category.includes('Тяжёлая');
    return true;
  }

  function armorCardHTML(armor) {
    const selected = hero.armor === armor.id;
    const evasion = parseMod(armor.evasionMod);
    return `
      <div class="choice-card gear-choice armor-card has-info${selected ? ' is-selected' : ''}" role="button" tabindex="0" data-action="pick-armor" data-id="${esc(armor.id)}">
        <span class="check-badge">${icon('check')}</span>
        <button class="info-btn" type="button" data-action="info-armor" data-id="${esc(armor.id)}" aria-label="Подробнее о броне ${esc(armor.name)}">${icon('info')}</button>
        <span class="armor-card-top">
          <span class="armor-card-name">${esc(armor.name)}</span>
          <span class="armor-card-def">${esc(armor.defense)}</span>
        </span>
        <span class="gear-choice-meta">${esc(armor.category || '')}</span>
        <span class="armor-card-thresholds">Пороги ${esc(armor.thresholds || '—')}</span>
        ${evasion ? `<span class="armor-card-evasion">Уклонение ${evasion > 0 ? '+' : ''}${evasion}</span>` : ''}
        ${armor.prop && armor.prop !== '—' ? `<span class="gear-choice-prop">${esc(armor.prop)}</span>` : ''}
      </div>
    `;
  }

  function renderArmorStep() {
    const selected = findArmor(hero.armor);
    const list = ARMORS.filter(armorMatchesFilter);
    return `
      <div class="filter-scroll">
        ${['Все', 'Без брони', 'Лёгкая', 'Средняя', 'Тяжёлая'].map((f) => `<button class="filter-chip${ui.armorFilter === f ? ' is-active' : ''}" type="button" data-action="filter-armor" data-filter="${esc(f)}">${esc(f)}</button>`).join('')}
      </div>

      <div class="gear-choice-grid armor-grid">
        ${list.map((armor) => armorCardHTML(armor)).join('')}
      </div>

      ${selected ? `
        <div class="summary-banner">
          <strong>${esc(selected.name)}:</strong> защита ${esc(selected.defense)}, пороги ${esc(selected.thresholds)}${parseMod(selected.evasionMod) ? `, Уклонение ${esc(selected.evasionMod)}` : ''}.
        </div>
      ` : ''}
    `;
  }

  /* ------------------------------------------------------------
     STEP 08 — INVENTORY
     ------------------------------------------------------------ */

  function shopSpent() {
    return hero.shopPurchases.reduce((sum, id) => sum + lootPrice(findLootItem(id)), 0);
  }

  function shopRemaining() {
    return Math.max(0, Number(hero.startingMoney) - shopSpent());
  }

  function lootKindLabel(item) {
    return item && item.kind === 'consumable' ? 'Расходник' : 'Предмет';
  }

  function lootRarityClass(item) {
    return (item && RARITY_CLASS[item.rarity]) || 'common';
  }

  function lootCardHTML(item) {
    const owned = hero.shopPurchases.includes(item.id);
    const price = lootPrice(item);
    const affordable = owned || price <= shopRemaining();
    return `
      <div class="shop-item rarity-${lootRarityClass(item)}${owned ? ' is-owned' : ''}${affordable ? '' : ' is-locked'}" role="button" tabindex="0" data-action="toggle-buy" data-id="${esc(item.id)}">
        <span class="shop-item-head">
          <span class="shop-item-name">${esc(item.name)}</span>
          <span class="shop-price">${price}</span>
        </span>
        <span class="shop-item-meta"><span class="rarity-dot"></span>${esc(RARITY_LABEL[item.rarity] || item.rarity)} • ${esc(lootKindLabel(item))}</span>
        <span class="shop-item-desc">${esc(item.desc || '—')}</span>
        <span class="shop-buy">${owned ? `${icon('check')} Куплено` : `${icon('plus')} Купить`}</span>
        <button class="info-btn" type="button" data-action="info-loot" data-id="${esc(item.id)}" aria-label="Подробнее о предмете ${esc(item.name)}">${icon('info')}</button>
      </div>
    `;
  }

  function renderShopHTML() {
    if (!['Обычная', 'Необычная', 'Редкая'].includes(ui.shopRarityFilter)) {
      ui.shopRarityFilter = 'Обычная';
    }
    const kind = ui.shopKindFilter;
    const rarity = ui.shopRarityFilter;
    const list = LOOT_ALL.filter((item) => {
      if (kind !== 'all' && item.kind !== kind) return false;
      if (item.rarity !== rarity) return false;
      return true;
    });
    const spent = shopSpent();
    const remaining = shopRemaining();
    return `
      <div class="wallet-banner">
        <div class="wallet-main">
          <span class="wallet-label">Кошелёк</span>
          <strong class="wallet-value">${remaining}<small> / ${hero.startingMoney}</small></strong>
        </div>
        <div class="wallet-side">
          <span>Потрачено</span>
          <strong>${spent}</strong>
        </div>
        ${hero.shopPurchases.length ? `<button class="wallet-reset" type="button" data-action="clear-shop">Сбросить</button>` : ''}
      </div>

      <div class="filter-scroll">
        ${[['all', 'Всё'], ['item', 'Предметы'], ['consumable', 'Расходники']].map(([value, label]) => `<button class="filter-chip${kind === value ? ' is-active' : ''}" type="button" data-action="shop-kind" data-filter="${value}">${label}</button>`).join('')}
      </div>
      <div class="filter-scroll">
        ${[['Обычная', 'Обычные'], ['Необычная', 'Необычные'], ['Редкая', 'Редкие']].map(([value, label]) => `<button class="filter-chip${rarity === value ? ' is-active' : ''}" type="button" data-action="shop-rarity" data-filter="${esc(value)}">${label}</button>`).join('')}
      </div>

      <div class="shop-actions-bar">
        <button class="shop-random-btn" type="button" data-action="random-shop-loot">${icon('dice')} <span>Случайный лут на все монеты</span></button>
      </div>

      <div class="shop-list">
        ${list.length ? list.map(lootCardHTML).join('') : '<div class="empty-state">В этой категории пока ничего нет.</div>'}
      </div>
    `;
  }

  function renderPersonalHTML() {
    const selectedPotion = POTIONS.find((p) => p.value === hero.potion) || POTIONS[0];
    return `
      <div class="section-label">Стартовое зелье</div>
      <div class="potion-list">
        ${POTIONS.map((potion) => `
          <button class="potion-card${hero.potion === potion.value ? ' is-selected' : ''}" type="button" data-action="pick-potion" data-value="${esc(potion.value)}">
            <span class="gear-icon">${icon('potion')}</span>
            <span class="potion-copy"><span class="potion-name">${esc(potion.name)}</span><span class="potion-desc">${esc(potion.desc)}</span></span>
            <span class="subclass-check">${icon('check')}</span>
          </button>
        `).join('')}
      </div>

      <div class="section-label" style="margin-top:18px">Личные вещи</div>
      <p class="field-hint" style="margin:-2px 0 9px">Опиши несколько недорогих вещей, которые герой носит с собой. Они не влияют на бой, но много говорят о человеке: кулон, письмо, камень, кружка, блокнот.</p>
      <textarea class="textarea" data-field="personalItems" maxlength="600" placeholder="${esc(PERSONAL_ITEM_SEEDS[0])}">${esc(hero.personalItems)}</textarea>

      ${hero.shopPurchases.length ? `
        <div class="selected-items">
          <span class="selected-items-label">Куплено в магазине:</span>
          ${hero.shopPurchases.map((id) => {
            const item = findLootItem(id);
            return item ? `<span class="selected-item">${esc(item.name)} <small>${lootPrice(item)}</small></span>` : '';
          }).join('')}
        </div>
      ` : ''}

      <div class="summary-banner">
        <strong>${esc(selectedPotion.name)}:</strong> ${esc(selectedPotion.desc)}
      </div>
    `;
  }

  function renderInventoryStep() {
    const tab = ui.lootTab === 'personal' ? 'personal' : 'shop';
    return `
      <div class="seg-tabs loot-tabs" role="tablist" aria-label="Лут">
        <button class="seg-tab${tab === 'shop' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${tab === 'shop'}" data-action="loot-tab" data-tab="shop">
          ${icon('bag')} Магазин
        </button>
        <button class="seg-tab${tab === 'personal' ? ' is-active' : ''}" type="button" role="tab" aria-selected="${tab === 'personal'}" data-action="loot-tab" data-tab="personal">
          ${icon('scroll')} Личные вещи
        </button>
      </div>
      ${tab === 'shop' ? renderShopHTML() : renderPersonalHTML()}
    `;
  }

  /* ------------------------------------------------------------
     STEP 09 — EXPERIENCE
     ------------------------------------------------------------ */

  function renderExperienceStep() {
    return `
      <div class="exp-list">
        ${hero.experiences.map((exp, index) => `
          <div class="exp-card">
            <div class="exp-head">
              <span class="exp-badge">+2</span>
              <span class="exp-title">Опыт ${index + 1}</span>
            </div>
            <input class="text-input" type="text" data-field="exp-${index}" value="${esc(exp.name)}" maxlength="80" autocomplete="off" placeholder="${index === 0 ? 'например: Ветеран пограничных войн / Липкие пальчики' : 'например: Притворяйся, пока не поверят / Знание трав и ядов'}">
          </div>
        `).join('')}
      </div>

      <div class="summary-banner">
        <strong>Как это работает:</strong> когда опыт применим к ситуации, потрать 1 Надежду и добавь +2 к броску. Один опыт лучше сделать боевым, второй — мирным или социальным.
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 10 — LORE
     ------------------------------------------------------------ */

  function loreDefinitions() {
    return [
      {
        field: 'traits',
        label: 'Черты',
        question: 'Черты характера (в 3 словах)',
        hint: 'Три слова, которые лучше всего описывают героя. Например: преданный, упрямый, осторожный.',
        placeholder: 'например: преданный, упрямый, осторожный',
        presets: Array.isArray(PRESETS.traits) ? PRESETS.traits : [],
        multiline: false
      },
      {
        field: 'definingEvent',
        label: 'Событие',
        question: 'Какое событие повлияло на героя больше всего?',
        hint: 'Мастер может вплести детали этого события в общий сюжет кампании.',
        placeholder: 'Что произошло в прошлом, что навсегда изменило героя?',
        presets: Array.isArray(PRESETS.definingEvents) ? PRESETS.definingEvents : [],
        multiline: true
      },
      {
        field: 'regret',
        label: 'Сожаление',
        question: 'Сожаления (если есть)',
        hint: 'О чём герой сожалеет больше всего? Сожаление делает его уязвимым и живым.',
        placeholder: 'О чём персонаж сожалеет больше всего?',
        presets: Array.isArray(PRESETS.regrets) ? PRESETS.regrets : [],
        multiline: true
      },
      {
        field: 'secret',
        label: 'Тайна',
        question: 'Секрет или личная тайна',
        hint: 'О чём герой никому не рассказывает? Тайна может стать крючком для всей кампании.',
        placeholder: 'О чём герой никому не рассказывает?',
        presets: Array.isArray(PRESETS.secrets) ? PRESETS.secrets : [],
        multiline: true
      },
      {
        field: 'goal',
        label: 'Цель',
        question: 'Главная цель странствий',
        hint: 'Зачем герой отправляется в приключения? Цель должна двигать его вперёд даже без приказа.',
        placeholder: 'Зачем герой отправляется в приключения?',
        presets: Array.isArray(PRESETS.goals) ? PRESETS.goals : [],
        multiline: true
      }
    ];
  }

  function lorePresetValue(def, index) {
    const preset = def.presets[index];
    if (preset === null || preset === undefined) return '';
    return typeof preset === 'string' ? preset : String(preset.text || '');
  }

  function lorePresetLabel(def, index) {
    const preset = def.presets[index];
    if (preset === null || preset === undefined) return '';
    return typeof preset === 'string' ? preset : String(preset.title || preset.text || '');
  }

  function renderLoreStep() {
    const defs = loreDefinitions();
    const active = defs[clamp(ui.loreTab, 0, defs.length - 1)];
    const done = defs.filter((def) => String(hero[def.field] || '').trim()).length;
    const value = hero[active.field] || '';
    return `
      <div class="lore-tabs">
        ${defs.map((def, index) => `
          <button class="lore-tab${index === ui.loreTab ? ' is-active' : ''}${String(hero[def.field] || '').trim() ? ' is-done' : ''}" type="button" data-action="lore-tab" data-index="${index}">
            <span class="lore-tab-num">${String(hero[def.field] || '').trim() ? icon('check') : index + 1}</span>
            ${esc(def.label)}
          </button>
        `).join('')}
      </div>

      <div class="lore-panel">
        <div class="lore-progress">Вопрос ${ui.loreTab + 1} из ${defs.length} • заполнено ${done} из ${defs.length}</div>
        <h2 class="lore-question">${esc(active.question)}</h2>
        <p class="lore-hint">${esc(active.hint)}</p>

        ${active.multiline
          ? `<textarea class="textarea" data-field="${esc(active.field)}" maxlength="900" placeholder="${esc(active.placeholder)}">${esc(value)}</textarea>`
          : `<input class="text-input" type="text" data-field="${esc(active.field)}" maxlength="160" value="${esc(value)}" placeholder="${esc(active.placeholder)}" autocomplete="off">`
        }

        <div class="preset-row">
          ${active.presets.map((preset, index) => {
            const presetValue = lorePresetValue(active, index);
            return `<button class="preset-chip${value === presetValue ? ' is-selected' : ''}" type="button" data-action="lore-preset" data-field="${esc(active.field)}" data-index="${index}">${esc(lorePresetLabel(active, index))}</button>`;
          }).join('')}
        </div>

        <button class="btn btn-ghost lore-next" type="button" data-action="lore-next">
          ${ui.loreTab < defs.length - 1 ? `Следующий вопрос ${icon('arrow-right')}` : `Проверить историю ${icon('check')}`}
        </button>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 11 — APPEARANCE
     ------------------------------------------------------------ */

  function renderRefPreviews() {
    const filled = hero.refs.map((ref, index) => ({ ref: String(ref || '').trim(), index })).filter((item) => item.ref);
    if (!filled.length) return '';
    return filled.map((item) => `
      <div class="ref-preview">
        <img src="${esc(item.ref)}" alt="Референс ${item.index + 1}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
        <span class="ref-broken">Не удалось загрузить</span>
      </div>
    `).join('');
  }

  function renderAppearanceStep() {
    return `
      <div class="field">
        <div class="field-label"><span>Словесное описание внешности</span><span class="optional">обязательно</span></div>
        <textarea class="textarea" data-field="appearance" maxlength="1200" placeholder="Рост, телосложение, приметные детали: шрамы, татуировки, стиль одежды, цвет глаз и волос...">${esc(hero.appearance)}</textarea>
        <button class="btn btn-ghost" type="button" data-action="random-appearance" style="margin-top:8px;width:100%">${icon('dice')} Вдохновиться</button>
      </div>

      <div class="section-subhead"><span>Референсы</span><span class="section-subhead-line"></span></div>
      <p class="field-hint" style="margin:-4px 0 9px">Необязательно. Вставь ссылки на картинки — мастер увидит детали образа и сможет сделать арт ближе к задумке.</p>

      <div class="ref-list">
        ${hero.refs.map((ref, index) => `
          <div class="ref-row">
            <input class="text-input" type="url" data-field="ref-${index}" value="${esc(ref)}" placeholder="https://..." maxlength="500" autocomplete="off">
            ${hero.refs.length > 1 ? `<button class="ref-remove" type="button" data-action="remove-ref" data-index="${index}" aria-label="Удалить ссылку">${icon('trash')}</button>` : ''}
          </div>
        `).join('')}
      </div>

      <button class="add-ref" type="button" data-action="add-ref">${icon('plus')} Добавить ещё одну ссылку</button>
      <div class="ref-previews" id="ref-previews">${renderRefPreviews()}</div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 12 — PARTY
     ------------------------------------------------------------ */

  function renderPartyStep() {
    return `
      <div class="section-label">Вопрос для связи с сопартийцем</div>
      <p class="field-hint" style="margin:-2px 0 9px">Это вопрос, который ты задаёшь другим игрокам за столом, чтобы связать героев общей предысторией.</p>

      <div class="field">
        <div class="field-label"><span>Свой вопрос</span><span class="optional">обязательно</span></div>
        <textarea class="textarea" data-field="partyBond" maxlength="500" placeholder="Например: Кто из вас однажды вытащил меня из смертельной передряги?">${esc(hero.partyBond)}</textarea>
      </div>

      <div class="field">
        <div class="field-label"><span>Ожидания от игры</span><span class="optional">необязательно</span></div>
        <input class="text-input" type="text" data-field="expectations" value="${esc(hero.expectations)}" maxlength="300" placeholder="Чего больше всего хочется: сложных боёв, глубокого сюжета, расследований?" autocomplete="off">
        <div class="preset-row">
          ${EXPECTATION_IDEAS.map((idea) => `<button class="preset-chip${hero.expectations === idea ? ' is-selected' : ''}" type="button" data-action="pick-preset-field" data-field="expectations" data-value="${esc(idea)}">${esc(idea)}</button>`).join('')}
        </div>
      </div>

      <div class="field">
        <div class="field-label"><span>Запретные темы и триггеры</span><span class="optional">необязательно</span></div>
        <textarea class="textarea" data-field="triggers" maxlength="500" placeholder="Темы, которых не должно быть в кампании (или оставь пустым)">${esc(hero.triggers)}</textarea>
        <div class="preset-row">
          ${TRIGGER_IDEAS.map((idea) => `<button class="preset-chip${hero.triggers === idea ? ' is-selected' : ''}" type="button" data-action="pick-preset-field" data-field="triggers" data-value="${esc(idea)}">${esc(idea)}</button>`).join('')}
        </div>
      </div>

      <div class="summary-banner">
        <strong>Зачем это нужно:</strong> ожидания и границы помогают Мастеру сделать игру интересной и безопасной для всех. Это не слабость, а забота об отряде.
      </div>
    `;
  }

  /* ------------------------------------------------------------
     STEP 13 — FINAL
     ------------------------------------------------------------ */

  function computedStats() {
    const cls = findClass(hero.class);
    const armor = findArmor(hero.armor);
    const baseEvasion = cls ? num(cls.evasion, 10) : 10;
    const evasion = baseEvasion + parseMod(armor && armor.evasionMod);
    return {
      evasion,
      hp: cls ? num(cls.hp, 6) : 6,
      stress: cls ? num(cls.stress, 6) : 6,
      armor: armor ? num(armor.defense, 0) : 0,
      thresholds: armor ? (armor.thresholds || '—') : '—',
      hope: 2
    };
  }

  function heroPortrait() {
    const race = findRace(hero.mixed ? hero.mixedA : hero.race);
    if (race && race.img) return optimized(race.img, 'hero');
    const sub = findSubclass(hero.class, hero.subclass);
    if (sub && sub.img) return optimized(sub.img, 'hero');
    if (hero.class) return classImage(hero.class, 'hero');
    return FALLBACK_HERO;
  }

  function heroPortraitCard() {
    const race = findRace(hero.mixed ? hero.mixedA : hero.race);
    if (race && race.img) return optimized(race.img, 'card');
    const sub = findSubclass(hero.class, hero.subclass);
    if (sub && sub.img) return optimized(sub.img, 'card');
    if (hero.class) return classImage(hero.class, 'card');
    return FALLBACK_CARD;
  }

  function attrMiniGridHTML() {
    return `
      <div class="attr-mini-grid">
        ${ATTRS.map((attr) => `<div class="attr-mini"><span>${esc(attr.key)}</span><span>${hero.attrs[attr.key] === null ? '—' : esc(hero.attrs[attr.key])}</span></div>`).join('')}
      </div>
    `;
  }

  function finalCardHTML() {
    const stats = computedStats();
    const name = hero.name || 'Безымянный герой';
    return `
      <div class="final-card">
        <div class="final-hero">
          ${imgTag(heroPortraitCard(), name, '', { eager: true })}
          <div class="final-hero-shade"></div>
          <div class="final-copy">
            <span class="dossier-eyebrow">Герой готов</span>
            <h2 class="final-name">${esc(name)}</h2>
            <p class="final-sub">${esc(displayClass() || 'Класс не выбран')}</p>
            <div class="dossier-tags">
              <span class="tag gold">${esc(displayRaceShort())}</span>
              <span class="tag">${esc(hero.community || 'Сообщество')}</span>
              <span class="tag">${esc(displayGender() || '—')} • ${esc(hero.age || '—')} лет</span>
            </div>
          </div>
        </div>
        <div class="final-body">
          <div class="stat-grid">
            <div class="stat-box"><span class="stat-value">${stats.evasion}</span><span class="stat-label">Уклонение</span></div>
            <div class="stat-box"><span class="stat-value">${stats.hp}</span><span class="stat-label">Раны</span></div>
            <div class="stat-box"><span class="stat-value">${stats.stress}</span><span class="stat-label">Стресс</span></div>
            <div class="stat-box"><span class="stat-value">${stats.armor}</span><span class="stat-label">Броня</span></div>
          </div>
          <div class="section-label" style="margin-top:14px">Характеристики</div>
          ${attrMiniGridHTML()}
        </div>
      </div>
    `;
  }

  function renderFinalStep() {
    const missing = STEPS.slice(0, 13).filter((_, index) => !isStepValid(index));
    return `
      ${finalCardHTML()}

      <div class="section-label" style="margin-top:18px">Проверка шагов</div>
      <div class="checklist">
        ${STEPS.slice(0, 13).map((step, index) => {
          const done = isStepValid(index);
          return `
            <button class="check-row${done ? ' is-done' : ' is-missing'}" type="button" data-action="jump-step" data-step="${index}">
              <span class="check-num">${done ? icon('check') : index + 1}</span>
              <span class="check-name">${esc(step.name)}</span>
              <span class="check-mark">${done ? 'готово' : 'заполнить'} ${icon('chevron-right')}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${missing.length ? `
        <div class="summary-banner" style="border-color:rgba(217,107,107,.35)">
          <strong>Осталось заполнить:</strong> ${missing.map((step) => esc(step.name)).join(', ')}.
        </div>
      ` : `
        <div class="summary-banner">
          <strong>Всё готово.</strong> Осталось открыть полное досье — и герой отправится в Таркелию.
        </div>
      `}

      <div class="final-actions">
        <button class="btn btn-primary btn-lg" type="button" data-action="finish">${icon('scroll')} Открыть полное досье</button>
        <button class="btn btn-ghost" type="button" data-action="copy-summary">${icon('copy')} Скопировать (Markdown)</button>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     RESULT / DOSSIER
     ------------------------------------------------------------ */

  function weaponSummaryText() {
    if (hero.weaponMode === 'dual') {
      const main = findWeapon(hero.mainWeapon);
      const off = findWeapon(hero.offhandWeapon);
      return `${main ? main.name : '—'} + ${off ? off.name : '—'}`;
    }
    const two = findWeapon(hero.twohandWeapon);
    return two ? two.name : '—';
  }

  function purchasedLootItems() {
    return hero.shopPurchases.map((id) => findLootItem(id)).filter(Boolean);
  }

  function equipmentRowsHTML() {
    const armor = findArmor(hero.armor);
    const main = findWeapon(hero.mainWeapon);
    const off = findWeapon(hero.offhandWeapon);
    const two = findWeapon(hero.twohandWeapon);
    const purchases = purchasedLootItems();
    const weaponDetail = hero.weaponMode === 'dual'
      ? `${main ? `${main.name} (${main.damage})` : '—'} / ${off ? `${off.name} (${off.damage})` : '—'}`
      : `${two ? `${two.name} (${two.damage})` : '—'}`;
    return `
      <div class="equip-list">
        <div class="equip-row"><span class="equip-label">Оружие</span><span class="equip-value">${esc(weaponDetail)}</span></div>
        <div class="equip-row"><span class="equip-label">Броня</span><span class="equip-value">${armor ? `${esc(armor.name)} • защита ${esc(armor.defense)} • пороги ${esc(armor.thresholds)}` : '—'}</span></div>
        <div class="equip-row"><span class="equip-label">Зелье</span><span class="equip-value">${esc(hero.potion || '—')}</span></div>
        <div class="equip-row"><span class="equip-label">Магазин</span><span class="equip-value">${purchases.length ? purchases.map((item) => `${esc(item.name)} (${lootPrice(item)})`).join(' • ') : 'Ничего не куплено'}</span></div>
        <div class="equip-row"><span class="equip-label">Монеты</span><span class="equip-value">${shopRemaining()} из ${esc(hero.startingMoney)}</span></div>
        <div class="equip-row"><span class="equip-label">Личные вещи</span><span class="equip-value">${esc(hero.personalItems || '—')}</span></div>
      </div>
    `;
  }

  function storyBlock(question, answer) {
    return `
      <div class="story-block">
        <div class="story-q">${esc(question)}</div>
        <div class="story-a${answer ? '' : ' empty'}">${esc(answer || 'Не заполнено')}</div>
      </div>
    `;
  }

  function mechanicsHTML() {
    const cls = findClass(hero.class);
    const sub = findSubclass(hero.class, hero.subclass);
    const raceA = findRace(hero.mixed ? hero.mixedA : hero.race);
    const raceB = hero.mixed ? findRace(hero.mixedB) : null;
    const comm = findCommunity(hero.community);
    const blocks = [];

    if (cls) {
      blocks.push(`
        <details class="mech-details">
          <summary><span>Класс: ${esc(cls.name)}</span>${icon('chevron-down')}</summary>
          <div class="mech-body">
            <div class="ability-card"><span class="ability-name">Надежда класса</span><p class="ability-text">${formatText(cls.hopeFeature)}</p></div>
            <div class="ability-card"><span class="ability-name">Классовая особенность</span><p class="ability-text">${formatText(cls.classFeature)}</p></div>
          </div>
        </details>
      `);
    }
    if (sub) {
      blocks.push(`
        <details class="mech-details">
          <summary><span>Подкласс: ${esc(sub.name)}</span>${icon('chevron-down')}</summary>
          <div class="mech-body">
            <div class="ability-card"><span class="ability-name">Основа</span><p class="ability-text">${formatText(sub.base)}</p></div>
            <div class="ability-card"><span class="ability-name">Специализация</span><p class="ability-text">${formatText(sub.spec)}</p></div>
            <div class="ability-card"><span class="ability-name">Мастерство</span><p class="ability-text">${formatText(sub.mast)}</p></div>
          </div>
        </details>
      `);
    }
    if (raceA) {
      blocks.push(`
        <details class="mech-details">
          <summary><span>Раса: ${esc(raceA.name)}${raceB ? ` / ${esc(raceB.name)}` : ''}</span>${icon('chevron-down')}</summary>
          <div class="mech-body">
            ${raceA.abilities.map((ability) => `<div class="ability-card"><span class="ability-name">${esc(ability.name)}</span><p class="ability-text">${formatText(ability.text)}</p></div>`).join('')}
            ${raceB ? raceB.abilities.map((ability) => `<div class="ability-card"><span class="ability-name">${esc(raceB.name)}: ${esc(ability.name)}</span><p class="ability-text">${formatText(ability.text)}</p></div>`).join('') : ''}
          </div>
        </details>
      `);
    }
    if (comm) {
      blocks.push(`
        <details class="mech-details">
          <summary><span>Сообщество: ${esc(comm.name)}</span>${icon('chevron-down')}</summary>
          <div class="mech-body">
            <div class="ability-card"><span class="ability-name">${esc(comm.abilityName)}</span><p class="ability-text">${formatText(comm.ability)}</p></div>
          </div>
        </details>
      `);
    }
    return blocks.length ? `<div class="mechanics-list">${blocks.join('')}</div>` : '';
  }

  function renderResult() {
    const stats = computedStats();
    const name = hero.name || 'Безымянный герой';
    const cls = findClass(hero.class);
    const sub = findSubclass(hero.class, hero.subclass);
    const race = findRace(hero.mixed ? hero.mixedA : hero.race);
    const comm = findCommunity(hero.community);
    const armor = findArmor(hero.armor);
    const tags = [];
    if (cls) tags.push(cls.domains);
    if (cls) tags.push(cls.category);
    if (race) tags.push(race.category);
    if (comm) tags.push(comm.name);

    const body = `
      <div class="dossier">
        <div class="dossier-hero">
          ${imgTag(heroPortrait(), name, '', { eager: true })}
          <div class="dossier-hero-copy">
            <div class="dossier-eyebrow">Досье героя • Таркелия</div>
            <h1 class="dossier-name">${esc(name)}</h1>
            <p class="dossier-sub">${esc(sub ? sub.name : (cls ? cls.name : 'Класс не выбран'))}${cls ? ` • ${esc(cls.name)}` : ''} • ${esc(displayRaceShort())} • ${esc(hero.community || 'Без сообщества')}</p>
            <div class="dossier-tags">
              ${tags.filter(Boolean).map((tag, index) => `<span class="tag${index === 0 ? ' gold' : ''}">${esc(tag)}</span>`).join('')}
              <span class="tag">${esc(displayGender() || '—')} • ${esc(hero.age || '—')} лет</span>
            </div>
          </div>
        </div>

        <div class="dossier-body">
          <div class="dossier-section">
            <div class="section-label">Боевые параметры</div>
            <div class="stat-grid">
              <div class="stat-box"><span class="stat-value">${stats.evasion}</span><span class="stat-label">Уклонение</span></div>
              <div class="stat-box"><span class="stat-value">${stats.hp}</span><span class="stat-label">Раны</span></div>
              <div class="stat-box"><span class="stat-value">${stats.stress}</span><span class="stat-label">Стресс</span></div>
              <div class="stat-box"><span class="stat-value">${stats.armor}</span><span class="stat-label">Броня</span></div>
            </div>
            <div class="tag-row">
              <span class="tag">Пороги: ${esc(stats.thresholds)}</span>
              <span class="tag">Надежда: ${stats.hope}</span>
              <span class="tag">${esc(hero.weaponMode === 'dual' ? 'Парное оружие' : 'Двуручное оружие')}</span>
            </div>
          </div>

          <div class="dossier-section">
            <div class="section-label">Характеристики</div>
            ${attrMiniGridHTML()}
          </div>

          <div class="dossier-section">
            <div class="section-label">Снаряжение</div>
            ${equipmentRowsHTML()}
          </div>

          <div class="dossier-section">
            <div class="section-label">Опыт</div>
            <div class="tag-row">
              <span class="tag gold">+2 • ${esc(hero.experiences[0].name || '—')}</span>
              <span class="tag gold">+2 • ${esc(hero.experiences[1].name || '—')}</span>
            </div>
          </div>

          <div class="dossier-section">
            <div class="section-label">Искра и история</div>
            ${storyBlock('Искра / первое впечатление', hero.spark)}
            ${storyBlock('Черты характера', hero.traits)}
            ${storyBlock('Ключевое событие', hero.definingEvent)}
            ${storyBlock('Сожаление', hero.regret)}
            ${storyBlock('Тайна', hero.secret)}
            ${storyBlock('Цель странствий', hero.goal)}
          </div>

          <div class="dossier-section">
            <div class="section-label">Внешность</div>
            <div class="story-a">${esc(hero.appearance || 'Не заполнено')}</div>
            ${hero.refs.filter(Boolean).length ? `<div class="ref-previews">${renderRefPreviews()}</div>` : ''}
          </div>

          <div class="dossier-section">
            <div class="section-label">Связи с отрядом</div>
            ${storyBlock('Вопрос к сопартийцу', hero.partyBond)}
            ${hero.expectations ? storyBlock('Ожидания от игры', hero.expectations) : ''}
            ${hero.triggers ? storyBlock('Запретные темы и триггеры', hero.triggers) : ''}
          </div>

          <div class="dossier-section">
            <div class="section-label">Механики</div>
            ${mechanicsHTML()}
          </div>
        </div>
      </div>

      <div class="dossier-actions">
        <button class="btn btn-primary btn-lg" type="button" data-action="copy-summary">${icon('copy')} Скопировать в формате Markdown</button>
        <div class="action-row">
          <button class="btn btn-ghost" type="button" data-action="edit-hero">${icon('class')} Изменить</button>
          <button class="btn btn-ghost" type="button" data-action="new-hero">${icon('spark')} Новый герой</button>
        </div>
      </div>
      <p class="result-note">Да направят твой клинок Кости Надежды</p>
    `;
    const container = $('#result-body');
    if (container) container.innerHTML = body;
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------
     BOTTOM SHEET
     ------------------------------------------------------------ */

  function openSheet({ eyebrow = '', title = '', content = '', footer = '' }) {
    const sheet = $('#sheet');
    const backdrop = $('#sheet-backdrop');
    const contentEl = $('#sheet-content');
    const footerEl = $('#sheet-footer');
    if (!sheet || !backdrop || !contentEl || !footerEl) return;

    clearTimeout(sheetCloseTimer);
    const eyebrowEl = $('#sheet-eyebrow');
    const titleEl = $('#sheet-title');
    if (eyebrowEl) eyebrowEl.textContent = eyebrow;
    if (titleEl) titleEl.textContent = title;
    contentEl.innerHTML = content;
    contentEl.scrollTop = 0;
    footerEl.innerHTML = footer;
    footerEl.hidden = !footer;

    sheet.hidden = false;
    document.body.classList.add('sheet-open');
    sheetOpen = true;
    syncTelegramBack();

    requestAnimationFrame(() => {
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
  }

  function closeSheet() {
    if (!sheetOpen) return;
    const sheet = $('#sheet');
    const backdrop = $('#sheet-backdrop');
    const contentEl = $('#sheet-content');
    const footerEl = $('#sheet-footer');
    sheetOpen = false;
    confirmCallback = null;
    betaCallback = null;
    if (sheet) sheet.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.classList.remove('sheet-open');
    syncTelegramBack();
    clearTimeout(sheetCloseTimer);
    sheetCloseTimer = setTimeout(() => {
      if (sheet) sheet.hidden = true;
      if (contentEl) contentEl.innerHTML = '';
      if (footerEl) {
        footerEl.innerHTML = '';
        footerEl.hidden = true;
      }
    }, 360);
  }

  function detailStatsHTML(items) {
    return `<div class="detail-stats">${items.map((item) => `<div class="detail-stat"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></div>`).join('')}</div>`;
  }

  function detailSectionHTML(title, html) {
    return `<div class="detail-section"><h3>${esc(title)}</h3><div class="detail-text">${html}</div></div>`;
  }

  function sheetHeroHTML(src, title, subtitle) {
    return `
      <div class="sheet-hero">
        ${imgTag(src, title, '', { eager: true, hero: true })}
        <div class="sheet-hero-copy">
          <h3>${esc(title)}</h3>
          <p>${esc(subtitle || '')}</p>
        </div>
      </div>
    `;
  }

  function openClassDetail(name) {
    const cls = findClass(name);
    if (!cls) return;
    const subclasses = cls.subclasses || [];
    const content = `
      ${sheetHeroHTML(classImage(cls.name, 'hero'), cls.name, cls.domains || '')}
      ${detailStatsHTML([
        { value: cls.evasion || '—', label: 'Уклонение' },
        { value: cls.hp || '—', label: 'Раны' },
        { value: cls.stress || '—', label: 'Стресс' }
      ])}
      <div class="tag-row">
        <span class="tag gold">${esc(cls.category || '')}</span>
        <span class="tag">${esc(cls.domains || '')}</span>
        <span class="tag">${cls.isBase ? 'Базовая книга' : 'Хоумбрю'}</span>
      </div>
      ${detailSectionHTML('Надежда класса', formatText(cls.hopeFeature))}
      ${detailSectionHTML('Классовая особенность', formatText(cls.classFeature))}
      ${detailSectionHTML('Подклассы', `<div class="subclass-list">${subclasses.map((sub) => `
        <button class="subclass-card" type="button" data-action="info-subclass" data-class="${esc(cls.name)}" data-name="${esc(sub.name)}">
          <div class="subclass-thumb">${imgTag(optimized(sub.img, 'card'), sub.name)}</div>
          <div class="subclass-body"><div class="subclass-name">${esc(sub.name)}</div><div class="subclass-desc">${esc(sub.shortDesc || '')}</div></div>
          <span class="subclass-check">${icon('chevron-right')}</span>
        </button>
      `).join('')}</div>`)}
    `;
    openSheet({
      eyebrow: cls.category || 'Класс',
      title: cls.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-class" data-name="${esc(cls.name)}">Выбрать класс</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openSubclassDetail(className, subName) {
    const cls = findClass(className);
    const sub = findSubclass(className, subName);
    if (!cls || !sub) return;
    const content = `
      ${sheetHeroHTML(optimized(sub.img, 'hero'), sub.name, `${cls.name} • ${cls.domains || ''}`)}
      ${detailStatsHTML([
        { value: cls.evasion || '—', label: 'Уклонение' },
        { value: cls.hp || '—', label: 'Раны' },
        { value: cls.stress || '—', label: 'Стресс' }
      ])}
      ${detailSectionHTML('Основа подкласса', formatText(sub.base))}
      ${detailSectionHTML('Специализация', formatText(sub.spec))}
      ${detailSectionHTML('Мастерство', formatText(sub.mast))}
    `;
    openSheet({
      eyebrow: cls.name,
      title: sub.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-subclass" data-class="${esc(cls.name)}" data-name="${esc(sub.name)}">Выбрать подкласс</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openRaceDetail(name) {
    const race = findRace(name);
    if (!race) return;
    const lore = race.lore || {};
    const content = `
      ${sheetHeroHTML(optimized(race.img, 'hero'), race.name, race.category || 'Родословная')}
      ${detailSectionHTML('Описание', formatText(race.desc))}
      ${detailSectionHTML('Способности', (race.abilities || []).map((ability) => `
        <div class="ability-card"><span class="ability-name">${esc(ability.name)}</span><p class="ability-text">${formatText(ability.text)}</p></div>
      `).join('') || '<p>—</p>')}
      ${detailSectionHTML('Связи родословной', `
        <div class="lore-grid">
          <div><span>Начало</span><strong>${esc(lore.start || '—')}</strong></div>
          <div><span>Клан</span><strong>${esc(lore.clan || '—')}</strong></div>
          <div><span>Друзья</span><strong>${esc(lore.friends || '—')}</strong></div>
          <div><span>Враги</span><strong>${esc(lore.enemies || '—')}</strong></div>
        </div>
      `)}
    `;
    openSheet({
      eyebrow: race.category || 'Раса',
      title: race.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-race" data-name="${esc(race.name)}">Выбрать расу</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openCommunityDetail(name) {
    const comm = findCommunity(name);
    if (!comm) return;
    const content = `
      ${sheetHeroHTML(optimized(comm.img, 'hero'), comm.name, comm.abilityName || 'Сообщество')}
      ${detailSectionHTML('Описание', formatText(comm.desc))}
      ${detailSectionHTML(comm.abilityName || 'Способность сообщества', formatText(comm.ability))}
    `;
    openSheet({
      eyebrow: 'Сообщество',
      title: comm.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-community" data-name="${esc(comm.name)}">Выбрать сообщество</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openWeaponDetail(id) {
    const weapon = findWeapon(id);
    if (!weapon) return;
    const content = `
      ${detailStatsHTML([
        { value: weapon.damage || '—', label: 'Урон' },
        { value: weapon.range || '—', label: 'Дистанция' },
        { value: weapon.hands || '—', label: 'Хват' }
      ])}
      <div class="tag-row">
        <span class="tag gold">${esc(weapon.slot || '')}</span>
        <span class="tag">${esc(weapon.damageType || '')}</span>
        <span class="tag">${esc(weapon.attr || '')}</span>
        <span class="tag">Ранг ${esc(weapon.tier || 1)}</span>
      </div>
      ${detailSectionHTML('Свойство', formatText(weapon.prop && weapon.prop !== '—' ? weapon.prop : 'У этого оружия нет особого свойства.'))}
      ${detailSectionHTML('Как использовать', `<p>${esc(weapon.hands === 'Двуручное' ? 'Занимает обе руки. Выбирается в стиле «Двуручное оружие».' : weapon.slot === 'Дополнительное' ? 'Занимает дополнительную руку. Выбирается вместе с основным одноручным оружием.' : 'Основное одноручное оружие. Можно сочетать с дополнительным предметом.')}</p>`)}
    `;
    openSheet({
      eyebrow: weapon.hands || 'Оружие',
      title: weapon.name,
      content,
      footer: `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openArmorDetail(id) {
    const armor = findArmor(id);
    if (!armor) return;
    const content = `
      ${detailStatsHTML([
        { value: armor.defense || '0', label: 'Защита' },
        { value: armor.thresholds || '—', label: 'Пороги' },
        { value: armor.evasionMod || '0', label: 'Уклонение' }
      ])}
      <div class="tag-row">
        <span class="tag gold">${esc(armor.category || '')}</span>
        <span class="tag">Ранг ${esc(armor.tier || 1)}</span>
      </div>
      ${detailSectionHTML('Свойство', formatText(armor.prop && armor.prop !== '—' ? armor.prop : 'У этой брони нет особого свойства.'))}
      ${detailSectionHTML('Как использовать', `<p>${esc(armor.name === 'Без брони' ? 'Свобода движений без защиты. Подходит героям, которые полагаются на ловкость.' : 'Надень броню, чтобы повысить пороги урона. Некоторые доспехи снижают Уклонение — учитывай это при выборе.')}</p>`)}
    `;
    openSheet({
      eyebrow: armor.category || 'Броня',
      title: armor.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-armor" data-id="${esc(armor.id)}">Выбрать броню</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function openLootDetail(id) {
    const item = findLootItem(id);
    if (!item) return;
    const owned = hero.shopPurchases.includes(item.id);
    const content = `
      ${detailStatsHTML([
        { value: String(lootPrice(item)), label: 'Цена' },
        { value: RARITY_LABEL[item.rarity] || item.rarity, label: 'Редкость' },
        { value: lootKindLabel(item), label: 'Тип' }
      ])}
      <div class="tag-row">
        <span class="tag gold">${esc(item.rarity || '')}</span>
        <span class="tag">${esc(lootKindLabel(item))}</span>
        ${owned ? '<span class="tag">Куплено</span>' : ''}
      </div>
      ${detailSectionHTML('Описание', formatText(item.desc && item.desc !== '—' ? item.desc : 'У этого предмета нет описания.'))}
      <p class="field-hint">Осталось монет: ${shopRemaining()} из ${esc(hero.startingMoney)}.</p>
    `;
    openSheet({
      eyebrow: item.rarity || 'Лут',
      title: item.name,
      content,
      footer: currentScreen === 'wizard'
        ? `
          <button class="btn btn-ghost" type="button" data-action="close-sheet">Закрыть</button>
          <button class="btn btn-primary" type="button" data-action="use-loot" data-id="${esc(item.id)}">${owned ? 'Убрать из покупок' : `Купить за ${lootPrice(item)}`}</button>
        `
        : `<button class="btn btn-primary" type="button" data-action="close-sheet">Понятно</button>`
    });
  }

  function useLoot(id) {
    toggleBuy(id);
    closeSheet();
  }

  /* ------------------------------------------------------------
     PASSPORT
     ------------------------------------------------------------ */

  function buildPassportHTML() {
    const pct = completionPct();
    const done = completionCount();
    const name = hero.name || 'Безымянный герой';
    return `
      <div class="passport-hero">
        <div class="passport-avatar">${imgTag(heroPortraitCard(), name)}</div>
        <div class="passport-info">
          <strong>${esc(name)}</strong>
          <span>${esc(displayClass() || 'Класс ещё не выбран')}</span>
          <span>${esc(displayRaceShort())} • ${esc(hero.community || 'Сообщество не выбрано')}</span>
        </div>
      </div>

      <div class="completion-track"><span style="width:${pct}%"></span></div>
      <div class="passport-progress"><span>Заполнено ${done} из ${STEP_COUNT} шагов</span><strong>${pct}%</strong></div>

      <div class="checklist passport-steps">
        ${STEPS.map((step, index) => {
          const valid = isStepValid(index);
          const current = index === currentStep;
          return `
            <button class="check-row${valid ? ' is-done' : ' is-missing'}${current ? ' is-current' : ''}" type="button" data-action="jump-step" data-step="${index}">
              <span class="check-num">${valid ? icon('check') : index + 1}</span>
              <span class="check-name">${esc(step.name)}</span>
              <span class="check-mark">${current ? 'сейчас' : valid ? 'готово' : 'заполнить'} ${icon('chevron-right')}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="summary-banner">
        <strong>Подсказка:</strong> можно вернуться к любому шагу. Все изменения сохраняются автоматически.
      </div>
    `;
  }

  function openPassportSheet() {
    openSheet({
      eyebrow: 'Паспорт героя',
      title: 'Путь героя',
      content: buildPassportHTML(),
      footer: `
        <button class="btn btn-ghost" type="button" data-action="passport-home">${icon('community')} На главную</button>
        <button class="btn btn-primary" type="button" data-action="close-sheet">Продолжить</button>
      `
    });
  }

  /* ------------------------------------------------------------
     CODEX
     ------------------------------------------------------------ */

  function codexMatches(...texts) {
    if (!ui.codexQuery) return true;
    const query = ui.codexQuery.toLowerCase().replace(/ё/g, 'е');
    return texts.filter(Boolean).join(' ').toLowerCase().replace(/ё/g, 'е').includes(query);
  }

  function codexCardHTML(name, image, meta, action) {
    return `
      <div class="choice-card codex-card" role="button" tabindex="0" data-action="${esc(action)}" data-name="${esc(name)}">
        ${imgTag(image, name)}
        <span class="card-shade"></span>
        <span class="card-copy">
          <span class="card-name">${esc(name)}</span>
          <span class="card-meta">${esc(meta || '')}</span>
        </span>
      </div>
    `;
  }

  function codexSubclassRow(cls, sub) {
    return `
      <button class="subclass-card" type="button" data-action="info-subclass" data-class="${esc(cls.name)}" data-name="${esc(sub.name)}">
        <div class="subclass-thumb">${imgTag(optimized(sub.img, 'card'), sub.name)}</div>
        <div class="subclass-body">
          <div class="subclass-name">${esc(sub.name)}</div>
          <div class="subclass-desc">${esc(cls.name)} • ${esc(sub.shortDesc || '')}</div>
        </div>
        <span class="subclass-check">${icon('chevron-right')}</span>
      </button>
    `;
  }

  function codexWeaponRow(weapon) {
    return `
      <button class="weapon-item" type="button" data-action="info-weapon" data-id="${esc(weapon.id)}">
        <span class="wname">${esc(weapon.name)}</span>
        <span class="wdamage">${esc(weapon.damage || '—')}</span>
        <span class="wmeta">${esc([weapon.slot, weapon.attr, weapon.range, weapon.hands].filter(Boolean).join(' • '))}</span>
        ${weapon.prop && weapon.prop !== '—' ? `<span class="wprop">${esc(weapon.prop)}</span>` : ''}
      </button>
    `;
  }

  function codexArmorRow(armor) {
    return `
      <button class="armor-item" type="button" data-action="info-armor" data-id="${esc(armor.id)}">
        <span class="aname">${esc(armor.name)}</span>
        <span class="adef">Защита ${esc(armor.defense)}</span>
        <span class="ameta">${esc(armor.category)} • пороги ${esc(armor.thresholds)}${parseMod(armor.evasionMod) ? ` • Уклонение ${esc(armor.evasionMod)}` : ''}</span>
        ${armor.prop && armor.prop !== '—' ? `<span class="aprop">${esc(armor.prop)}</span>` : ''}
      </button>
    `;
  }

  function codexPresetBlock(title, items, type = 'object') {
    if (!items.length) return '';
    return `
      <div class="codex-preset">
        <div class="codex-preset-title">${esc(title)}</div>
        ${items.map((item) => {
          if (type === 'string') return `<div class="codex-preset-item">${esc(item)}</div>`;
          return `<div class="codex-preset-item"><strong>${esc(item.title || '')}</strong><span>${esc(item.text || '')}</span></div>`;
        }).join('')}
      </div>
    `;
  }

  function codexLoreHTML() {
    const groups = [];
    const sparks = (Array.isArray(PRESETS.sparks) ? PRESETS.sparks : []).filter((item) => codexMatches(item.title, item.text));
    if (sparks.length) groups.push(codexPresetBlock('Искры героя', sparks));

    const events = (Array.isArray(PRESETS.definingEvents) ? PRESETS.definingEvents : []).filter((item) => codexMatches(item.title, item.text));
    if (events.length) groups.push(codexPresetBlock('Ключевые события', events));

    const regrets = (Array.isArray(PRESETS.regrets) ? PRESETS.regrets : []).filter((item) => codexMatches(item.title, item.text));
    if (regrets.length) groups.push(codexPresetBlock('Сожаления', regrets));

    const secrets = (Array.isArray(PRESETS.secrets) ? PRESETS.secrets : []).filter((item) => codexMatches(item.title, item.text));
    if (secrets.length) groups.push(codexPresetBlock('Тайны', secrets));

    const goals = (Array.isArray(PRESETS.goals) ? PRESETS.goals : []).filter((item) => codexMatches(item.title, item.text));
    if (goals.length) groups.push(codexPresetBlock('Цели странствий', goals));

    const traits = (Array.isArray(PRESETS.traits) ? PRESETS.traits : []).filter((item) => codexMatches(item));
    if (traits.length) groups.push(codexPresetBlock('Черты характера', traits, 'string'));

    const bonds = (Array.isArray(PRESETS.partyBonds) ? PRESETS.partyBonds : []).filter((item) => codexMatches(item));
    if (bonds.length) groups.push(codexPresetBlock('Вопросы для связи с отрядом', bonds, 'string'));

    const tips = Object.keys(TIPS).map((key, index) => ({ key, order: index, ...TIPS[key] }))
      .filter((item) => codexMatches(item.title, item.text));
    if (tips.length) {
      groups.push(`
        <div class="codex-preset">
          <div class="codex-preset-title">Советы мастера по шагам</div>
          ${tips.map((tip) => `<div class="codex-preset-item"><strong>${esc(tip.title || '')}</strong><span>${esc(tip.text || '')}</span></div>`).join('')}
        </div>
      `);
    }

    return groups.length ? groups.join('') : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
  }

  function codexContentHTML() {
    if (ui.codexTab === 'classes') {
      const list = CLASSES.filter((cls) => codexMatches(cls.name, cls.domains, cls.category, cls.hopeFeature, cls.classFeature, ...(cls.subclasses || []).map((s) => s.name)));
      return list.length
        ? `<div class="codex-grid">${list.map((cls) => codexCardHTML(cls.name, classImage(cls.name, 'card'), `${cls.domains || ''} • ${cls.category || ''}`, 'info-class')).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    if (ui.codexTab === 'subclasses') {
      const list = [];
      CLASSES.forEach((cls) => (cls.subclasses || []).forEach((sub) => {
        if (codexMatches(sub.name, sub.shortDesc, sub.base, sub.spec, sub.mast, cls.name)) list.push({ cls, sub });
      }));
      return list.length
        ? `<div class="codex-list">${list.map(({ cls, sub }) => codexSubclassRow(cls, sub)).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    if (ui.codexTab === 'races') {
      const list = RACES.filter((race) => codexMatches(race.name, race.desc, race.category, ...(race.abilities || []).map((a) => `${a.name} ${a.text}`)));
      return list.length
        ? `<div class="codex-grid">${list.map((race) => codexCardHTML(race.name, optimized(race.img, 'card'), race.category || '', 'info-race')).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    if (ui.codexTab === 'communities') {
      const list = COMMUNITIES.filter((comm) => codexMatches(comm.name, comm.desc, comm.abilityName, comm.ability));
      return list.length
        ? `<div class="codex-grid">${list.map((comm) => codexCardHTML(comm.name, optimized(comm.img, 'card'), comm.abilityName || '', 'info-community')).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    if (ui.codexTab === 'weapons') {
      const list = WEAPONS.filter((weapon) => codexMatches(weapon.name, weapon.damage, weapon.prop, weapon.attr, weapon.range, weapon.damageType, weapon.hands));
      return list.length
        ? `<div class="codex-list">${list.map(codexWeaponRow).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    if (ui.codexTab === 'armor') {
      const list = ARMORS.filter((armor) => codexMatches(armor.name, armor.category, armor.prop, armor.thresholds));
      return list.length
        ? `<div class="codex-list">${list.map(codexArmorRow).join('')}</div>`
        : `<div class="codex-empty">Ничего не найдено. Попробуй другой запрос.</div>`;
    }

    return codexLoreHTML();
  }

  function renderCodex() {
    const tabs = $('#codex-tabs');
    const content = $('#codex-content');
    const search = $('#codex-search');
    const clear = $('#codex-search-clear');
    if (tabs) {
      tabs.innerHTML = CODEX_TABS.map((tab) => `
        <button class="filter-chip${ui.codexTab === tab.id ? ' is-active' : ''}" type="button" data-action="codex-tab" data-tab="${esc(tab.id)}">
          ${esc(tab.label)}${tab.count ? `<span class="chip-count">${tab.count}</span>` : ''}
        </button>
      `).join('');
    }
    if (search && search.value !== ui.codexQuery) search.value = ui.codexQuery;
    if (clear) clear.hidden = !ui.codexQuery;
    if (content) content.innerHTML = codexContentHTML();
  }

  function openCodex() {
    if (currentScreen !== 'codex') codexReturn = currentScreen;
    ui.codexQuery = '';
    showScreen('codex');
    renderCodex();
  }

  function codexBack() {
    if (currentScreen !== 'codex') return;
    showScreen(codexReturn);
    if (codexReturn === 'wizard') renderStep();
    else if (codexReturn === 'result') renderResult();
    else renderHome();
  }

  /* ------------------------------------------------------------
     PAYLOAD & TEXT EXPORT
     ------------------------------------------------------------ */

  function buildPayload() {
    const cls = findClass(hero.class);
    const armor = findArmor(hero.armor);
    const stats = computedStats();
    const main = findWeapon(hero.mainWeapon);
    const off = findWeapon(hero.offhandWeapon);
    const two = findWeapon(hero.twohandWeapon);
    return {
      name: hero.name,
      gender: displayGender(),
      age: hero.age,
      spark: hero.spark,
      sparkTitle: hero.sparkTitle,
      class: hero.class,
      subclass: hero.subclass,
      classCategory: cls ? cls.category : '',
      race: displayRace(),
      mixed: hero.mixed,
      community: hero.community,
      evasion: stats.evasion,
      hp: stats.hp,
      stress: stats.stress,
      hope: stats.hope,
      weapons: {
        mode: hero.weaponMode,
        main1h: main ? main.name : '',
        offhand: off ? off.name : '',
        twohanded: two ? two.name : ''
      },
      armor: armor ? armor.name : '',
      armorId: hero.armor,
      potion: hero.potion,
      startingMoney: hero.startingMoney,
      moneySpent: shopSpent(),
      moneyLeft: shopRemaining(),
      shopPurchases: purchasedLootItems().map((item) => ({
        name: item.name,
        rarity: item.rarity,
        kind: item.kind,
        price: lootPrice(item)
      })),
      personalItems: hero.personalItems,
      inventory: hero.inventory.slice(),
      attributes: ATTRS.reduce((acc, attr) => {
        acc[attr.key] = attrNum(hero.attrs[attr.key]);
        return acc;
      }, {}),
      exp1: hero.experiences[0].name,
      exp2: hero.experiences[1].name,
      traits: hero.traits,
      definingEvent: hero.definingEvent,
      regret: hero.regret,
      secret: hero.secret,
      goal: hero.goal,
      appearance: hero.appearance,
      refs: hero.refs.filter(Boolean),
      partyBond: hero.partyBond,
      expectations: hero.expectations,
      triggers: hero.triggers,
      createdAt: hero.createdAt || new Date().toISOString()
    };
  }

  function buildSummaryText() {
    const p = buildPayload();
    const armor = findArmor(hero.armor);
    const purchases = purchasedLootItems();
    const weapons = p.weapons.mode === 'dual'
      ? `${p.weapons.main1h || '—'} + ${p.weapons.offhand || '—'}`
      : p.weapons.twohanded || '—';
    const lines = [
      '# Досье героя — Таркелия',
      '',
      `**Имя:** ${p.name || 'Безымянный герой'}`,
      `**Пол:** ${p.gender || '—'} • **Возраст:** ${p.age || '—'} лет`,
      `**Класс:** ${p.class || '—'}${p.subclass ? ` (${p.subclass})` : ''}`,
      `**Раса:** ${p.race || '—'}`,
      `**Сообщество:** ${p.community || '—'}`,
      '',
      '## Боевые параметры',
      '',
      `- **Уклонение:** ${p.evasion}`,
      `- **Раны:** ${p.hp}`,
      `- **Стресс:** ${p.stress}`,
      `- **Броня:** ${p.armor || '—'}`,
      `- **Пороги урона:** ${armor ? armor.thresholds : '—'}`,
      `- **Надежда:** ${p.hope}`,
      '',
      '## Характеристики',
      '',
      ...ATTRS.map((attr) => `- **${attr.key}:** ${fmtMod(hero.attrs[attr.key])}`),
      '',
      '## Снаряжение',
      '',
      `- **Оружие:** ${weapons}`,
      `- **Броня:** ${armor ? `${armor.name} • защита ${armor.defense} • пороги ${armor.thresholds}` : '—'}`,
      `- **Стартовое зелье:** ${p.potion || '—'}`,
      ...(purchases.length
        ? ['- **Куплено в магазине:**', ...purchases.map((item) => `  - ${item.name} — ${lootPrice(item)} (${RARITY_LABEL[item.rarity] || item.rarity})`)]
        : ['- **Куплено в магазине:** ничего']),
      `- **Монеты:** ${p.moneyLeft} из ${p.startingMoney}`,
      `- **Личные вещи:** ${p.personalItems || '—'}`,
      '',
      '## Опыт',
      '',
      `- **+2:** ${p.exp1 || '—'}`,
      `- **+2:** ${p.exp2 || '—'}`,
      '',
      '## История',
      '',
      `**Искра:** ${p.spark || '—'}`,
      '',
      `**Черты:** ${p.traits || '—'}`,
      '',
      `**Ключевое событие:** ${p.definingEvent || '—'}`,
      '',
      `**Сожаление:** ${p.regret || '—'}`,
      '',
      `**Тайна:** ${p.secret || '—'}`,
      '',
      `**Цель:** ${p.goal || '—'}`,
      '',
      '## Внешность',
      '',
      p.appearance || '—',
      '',
      '## Связь с отрядом',
      '',
      `**Вопрос к сопартийцу:** ${p.partyBond || '—'}`,
      p.expectations ? `\n**Ожидания:** ${p.expectations}` : '',
      p.triggers ? `\n**Запретные темы:** ${p.triggers}` : '',
      '',
      '---',
      '',
      '_Да направят твой клинок Кости Надежды!_'
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n');
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast(successMessage || 'Скопировано в буфер обмена');
      haptic('success');
    } catch (err) {
      console.error('Copy error', err);
      toast('Не удалось скопировать текст');
      haptic('error');
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function downloadJSON() {
    const payload = {
      app: 'Tarkelia Hero Test',
      version: 1,
      exportedAt: new Date().toISOString(),
      hero: buildPayload()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${safeFilename(hero.name)}_Daggerheart.json`);
    toast('JSON сохранён');
    haptic('success');
  }

  function sendTelegram() {
    const payload = { hero: buildPayload() };
    const raw = JSON.stringify(payload);
    const bytes = new Blob([raw]).size;
    if (bytes > 4096) {
      toast('Анкета слишком большая для Telegram. Скачай JSON.');
      haptic('error');
      return;
    }
    if (tg && typeof tg.sendData === 'function') {
      try {
        tg.sendData(raw);
        haptic('success');
        return;
      } catch (err) {
        console.warn('sendData error', err);
      }
    }
    copyText(JSON.stringify(payload, null, 2), 'Telegram недоступен — JSON скопирован');
  }

  function printDossier() {
    if (currentScreen !== 'result') {
      renderResult();
      showScreen('result');
    }
    setTimeout(() => {
      try { window.print(); } catch (err) { toast('Печать недоступна в этом браузере'); }
    }, 180);
  }

  /* ------------------------------------------------------------
     PNG POSTER
     ------------------------------------------------------------ */

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawCover(ctx, image, x, y, width, height, radius) {
    ctx.save();
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    if (image && image.width && image.height) {
      const scale = Math.max(width / image.width, height / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
    } else {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, '#241b30');
      gradient.addColorStop(1, '#0e0a14');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, width, height);
    }
    ctx.restore();
  }

  function fitFontSize(ctx, text, maxWidth, startSize, minSize, weight, family) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines, color) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines) break;
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length === maxLines && words.length) {
      const consumed = lines.join(' ').split(/\s+/).length;
      if (consumed < words.length) {
        let last = lines[lines.length - 1];
        while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
        lines[lines.length - 1] = `${last}…`;
      }
    }
    ctx.fillStyle = color;
    lines.forEach((textLine, index) => ctx.fillText(textLine, x, y + index * lineHeight));
    return lines.length;
  }

  function drawPosterTag(ctx, text, x, y) {
    ctx.font = '600 17px Inter, sans-serif';
    const width = ctx.measureText(text).width + 28;
    roundRectPath(ctx, x, y, width, 32, 16);
    ctx.fillStyle = 'rgba(10, 8, 14, 0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(216, 178, 106, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f2dda8';
    ctx.fillText(text, x + 14, y + 22);
    return width;
  }

  async function drawPoster() {
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch (_) {}

    const W = 1080;
    const H = 1620;
    const M = 64;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not supported');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#171020');
    bg.addColorStop(0.55, '#100b17');
    bg.addColorStop(1, '#08060c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.82, 40, 0, W * 0.82, 40, W * 0.85);
    glow.addColorStop(0, 'rgba(112, 70, 150, 0.28)');
    glow.addColorStop(1, 'rgba(112, 70, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(216, 178, 106, 0.42)';
    ctx.lineWidth = 2;
    roundRectPath(ctx, M - 18, M - 18, W - (M - 18) * 2, H - (M - 18) * 2, 28);
    ctx.stroke();

    ctx.fillStyle = '#d8b26a';
    ctx.font = '700 19px Inter, sans-serif';
    ctx.fillText('ТАРКЕЛИЯ • DAGGERHEART', M, 74);

    ctx.fillStyle = '#756b5d';
    ctx.font = '500 17px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ДОСЬЕ ГЕРОЯ • РАНГ 1', W - M, 74);
    ctx.textAlign = 'left';

    const stats = computedStats();
    const name = hero.name || 'Безымянный герой';
    const portrait = await loadImage(heroPortrait());
    const hx = M;
    const hy = 112;
    const hw = W - M * 2;
    const hh = 560;

    drawCover(ctx, portrait, hx, hy, hw, hh, 24);

    ctx.save();
    roundRectPath(ctx, hx, hy, hw, hh, 24);
    ctx.clip();
    const overlay = ctx.createLinearGradient(0, hy + hh * 0.3, 0, hy + hh);
    overlay.addColorStop(0, 'rgba(8, 6, 12, 0)');
    overlay.addColorStop(0.62, 'rgba(8, 6, 12, 0.5)');
    overlay.addColorStop(1, 'rgba(8, 6, 12, 0.96)');
    ctx.fillStyle = overlay;
    ctx.fillRect(hx, hy, hw, hh);
    ctx.restore();

    const nameSize = fitFontSize(ctx, name, hw - 80, 82, 42, '700', '"Cormorant Garamond", Georgia, serif');
    ctx.fillStyle = '#fff8e9';
    ctx.font = `700 ${nameSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(name, hx + 38, hy + hh - 94);

    const subtitle = `${displayClass() || 'Класс не выбран'} • ${displayRaceShort()} • ${hero.community || 'Без сообщества'}`;
    ctx.fillStyle = '#d8cdbd';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText(subtitle.length > 78 ? `${subtitle.slice(0, 77)}…` : subtitle, hx + 40, hy + hh - 54);

    let tagX = hx + 40;
    const tagY = hy + hh - 40;
    const tagTexts = [displayGender() || '—', `${hero.age || '—'} лет`, hero.weaponMode === 'dual' ? 'Парное оружие' : 'Двуручное оружие'];
    for (const text of tagTexts) {
      if (tagX > hx + hw - 160) break;
      tagX += drawPosterTag(ctx, text, tagX, tagY) + 10;
    }

    const statY = 712;
    const statGap = 14;
    const statW = (hw - statGap * 3) / 4;
    const statItems = [
      ['УКЛОНЕНИЕ', stats.evasion],
      ['РАНЫ', stats.hp],
      ['СТРЕСС', stats.stress],
      ['БРОНЯ', stats.armor]
    ];
    statItems.forEach((item, index) => {
      const x = hx + index * (statW + statGap);
      roundRectPath(ctx, x, statY, statW, 92, 14);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(216, 178, 106, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f2dda8';
      ctx.font = '700 42px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(item[1]), x + statW / 2, statY + 52);
      ctx.fillStyle = '#9f9484';
      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillText(item[0], x + statW / 2, statY + 76);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#d8b26a';
    ctx.font = '700 15px Inter, sans-serif';
    ctx.fillText('ХАРАКТЕРИСТИКИ', hx, 858);

    const attrY = 884;
    const colGap = 12;
    const colW = (hw - colGap) / 2;
    const rowH = 54;
    const rowGap = 10;
    ATTRS.forEach((attr, index) => {
      const x = hx + (index % 2) * (colW + colGap);
      const y = attrY + Math.floor(index / 2) * (rowH + rowGap);
      roundRectPath(ctx, x, y, colW, rowH, 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.028)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#cfc5b5';
      ctx.font = '500 20px Inter, sans-serif';
      ctx.fillText(attr.key, x + 18, y + 35);
      ctx.fillStyle = '#f2dda8';
      ctx.font = '700 24px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fmtMod(hero.attrs[attr.key]), x + colW - 18, y + 35);
      ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#d8b26a';
    ctx.font = '700 15px Inter, sans-serif';
    ctx.fillText('СНАРЯЖЕНИЕ', hx, 1088);

    const armor = findArmor(hero.armor);
    const equipLines = [
      `Оружие: ${weaponSummaryText()}`,
      `Броня: ${armor ? `${armor.name} • пороги ${armor.thresholds}` : '—'}`,
      `Зелье: ${hero.potion || '—'}`
    ];
    ctx.fillStyle = '#ded5c6';
    ctx.font = '500 22px Inter, sans-serif';
    equipLines.forEach((line, index) => {
      const text = line.length > 86 ? `${line.slice(0, 85)}…` : line;
      ctx.fillText(text, hx, 1128 + index * 36);
    });

    ctx.fillStyle = '#d8b26a';
    ctx.font = '700 15px Inter, sans-serif';
    ctx.fillText('ИСТОРИЯ', hx, 1262);

    ctx.font = '500 23px Inter, sans-serif';
    const story = [hero.spark, hero.goal].filter(Boolean).join(' ') || 'История этого героя ещё пишется.';
    wrapCanvasText(ctx, story, hx, 1298, hw, 36, 4, '#ded5c6');

    ctx.strokeStyle = 'rgba(216, 178, 106, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx, 1484);
    ctx.lineTo(hx + hw, 1484);
    ctx.stroke();

    ctx.fillStyle = '#d8b26a';
    ctx.font = 'italic 600 27px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('«Да направят твой клинок Кости Надежды»', hx, 1532);

    ctx.fillStyle = '#756b5d';
    ctx.font = '500 16px Inter, sans-serif';
    ctx.fillText('Таркелия • Кампания «Двинк» • Daggerheart v1.5', hx, 1572);

    return canvas;
  }

  async function downloadPNG() {
    toast('Готовим PNG-досье…');
    try {
      const canvas = await drawPoster();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('toBlob failed')), 'image/png');
      });
      downloadBlob(blob, `${safeFilename(hero.name)}_Tarkelia.png`);
      toast('PNG сохранён');
      haptic('success');
    } catch (err) {
      console.error('PNG error', err);
      toast('Не удалось создать PNG');
      haptic('error');
    }
  }

  /* ------------------------------------------------------------
     RANDOM GENERATORS
     ------------------------------------------------------------ */

  function randomNameFor(gender) {
    let pool = NAME_POOL.neutral;
    if (gender === 'Женский') pool = NAME_POOL.female;
    else if (gender === 'Мужской') pool = NAME_POOL.male;
    return pick(pool);
  }

  function randomAge() {
    return String(18 + randInt(43));
  }

  function randomSpark() {
    const sparks = Array.isArray(PRESETS.sparks) ? PRESETS.sparks : [];
    if (!sparks.length) return { title: '', text: '' };
    const spark = pick(sparks);
    return { title: spark.title || '', text: spark.text || '' };
  }

  function randomPresetText(key) {
    const list = Array.isArray(PRESETS[key]) ? PRESETS[key] : [];
    if (!list.length) return '';
    const item = pick(list);
    return typeof item === 'string' ? item : String(item.text || '');
  }

  function rollName() {
    const name = randomNameFor(hero.gender);
    hero.name = name;
    const field = $('#field-name') || $('[data-field="name"]');
    if (field) field.value = name;
    save();
    refreshValidation();
    haptic('select');
  }

  function rollAge() {
    const age = randomAge();
    hero.age = age;
    const field = $('[data-field="age"]');
    if (field) field.value = age;
    save();
    refreshValidation();
    haptic('select');
  }

  function randomAppearance() {
    hero.appearance = pick(APPEARANCE_SEEDS);
    const field = $('[data-field="appearance"]');
    if (field) field.value = hero.appearance;
    save();
    refreshValidation();
    haptic('select');
  }

  function generateRandomHero() {
    const gender = pick(['Мужской', 'Женский', 'Свой']);
    const cls = pick(CLASSES);
    const sub = cls && cls.subclasses && cls.subclasses.length ? pick(cls.subclasses) : null;
    const raceA = pick(RACES);
    const mixed = RACES.length > 1 && Math.random() < 0.18;
    const raceB = mixed && raceA ? pick(RACES.filter((race) => race.name !== raceA.name)) : null;
    const community = pick(COMMUNITIES);
    const attrPool = shuffle(ATTR_POOL.slice());
    const attrs = {};
    ATTRS.forEach((attr, index) => { attrs[attr.key] = attrPool[index]; });

    const mode = Math.random() < 0.55 ? 'dual' : 'twohand';
    const oneHanded = WEAPONS.filter((weapon) => weapon.group === 'oneHandedMain');
    const offhand = WEAPONS.filter((weapon) => weapon.group === 'offhand');
    const twoHanded = WEAPONS.filter((weapon) => weapon.group === 'twoHandedMain');
    const main = pick(oneHanded);
    const off = pick(offhand);
    const two = pick(twoHanded);
    const armor = pick(ARMORS);
    const expIdeas = shuffle(RANDOM_EXPERIENCES.slice());
    const spark = randomSpark();
    const startingMoney = 10 + randInt(6);
    let budget = startingMoney;
    const purchases = [];
    const purchaseTarget = 2 + randInt(3);
    for (const item of shuffle(LOOT_ALL.slice())) {
      if (purchases.length >= purchaseTarget) break;
      const price = lootPrice(item);
      if (price <= budget) {
        purchases.push(item.id);
        budget -= price;
      }
    }

    hero = normalizeHero(Object.assign(defaultHero(), {
      name: randomNameFor(gender),
      gender,
      genderCustom: gender === 'Свой' ? pick(['Не определён', 'Вне рамок', 'Своё имя']) : '',
      age: randomAge(),
      spark: spark.text,
      sparkTitle: spark.title,
      class: cls ? cls.name : '',
      subclass: sub ? sub.name : '',
      race: mixed ? '' : (raceA ? raceA.name : ''),
      mixed,
      mixedA: mixed && raceA ? raceA.name : '',
      mixedB: mixed && raceB ? raceB.name : '',
      community: community ? community.name : '',
      attrs,
      weaponMode: mode,
      mainWeapon: mode === 'dual' && main ? main.id : '',
      offhandWeapon: mode === 'dual' && off ? off.id : '',
      twohandWeapon: mode === 'twohand' && two ? two.id : '',
      armor: armor ? armor.id : '',
      potion: pick(POTIONS).value,
      startingMoney,
      shopPurchases: purchases,
      personalItems: pick(PERSONAL_ITEM_SEEDS),
      inventory: [],
      customItem: '',
      experiences: [
        { name: expIdeas[0] || 'Ветеран пограничных войн', mod: 2 },
        { name: expIdeas[1] || 'Тихий шаг', mod: 2 }
      ],
      traits: randomPresetText('traits'),
      definingEvent: randomPresetText('definingEvents'),
      regret: randomPresetText('regrets'),
      secret: randomPresetText('secrets'),
      goal: randomPresetText('goals'),
      appearance: pick(APPEARANCE_SEEDS),
      refs: [''],
      partyBond: pick(RANDOM_BONDS),
      expectations: pick(EXPECTATION_IDEAS),
      triggers: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    currentStep = STEP_COUNT - 1;
    ui.loreTab = 4;
    ui.weaponTab = 'main';
    ui.weaponFilter = 'Все';
    ui.armorFilter = 'Все';
    ui.lootTab = 'shop';
    ui.shopKindFilter = 'all';
    ui.shopRarityFilter = 'Обычная';
    saveNow();
    renderResult();
    showScreen('result');
    haptic('success');
    toast('Случайный герой готов');
  }

  function requestRandomHero() {
    if (hasProgress()) {
      confirmSheet({
        title: 'Собрать случайного героя?',
        message: 'Текущий черновик будет заменён новым героем. Если он важен — сначала скачай JSON.',
        confirmText: 'Собрать героя',
        onConfirm: generateRandomHero
      });
      return;
    }
    generateRandomHero();
  }

  /* ------------------------------------------------------------
     SELECTION ACTIONS
     ------------------------------------------------------------ */

  function pickGender(gender) {
    hero.gender = gender;
    if (gender !== 'Свой') hero.genderCustom = '';
    save();
    renderStep({ keepScroll: true });
    haptic('select');
    if (gender === 'Свой') {
      setTimeout(() => {
        const field = $('[data-field="genderCustom"]');
        if (field) field.focus();
      }, 80);
    }
  }

  function pickSpark(index) {
    const sparks = Array.isArray(PRESETS.sparks) ? PRESETS.sparks : [];
    const spark = sparks[index];
    if (!spark) return;
    hero.spark = spark.text || '';
    hero.sparkTitle = spark.title || '';
    const field = $('[data-field="spark"]');
    if (field) field.value = hero.spark;
    $$('.spark-card').forEach((card, cardIndex) => card.classList.toggle('is-selected', cardIndex === index));
    save();
    refreshValidation();
    haptic('select');
  }

  function advanceFromStep(stepIndex) {
    if (currentScreen !== 'wizard') return;
    if (currentStep === stepIndex) {
      currentStep = Math.min(stepIndex + 1, STEP_COUNT - 1);
      save();
      renderStep();
    } else {
      renderStep({ keepScroll: true });
    }
  }

  function commitClass(name) {
    const cls = findClass(name);
    if (!cls) return;
    const changed = hero.class !== name;
    hero.class = name;
    if (changed || !findSubclass(name, hero.subclass)) hero.subclass = '';
    save();
  }

  function selectClass(name) {
    const cls = findClass(name);
    if (!cls) return false;
    if (hero.class !== name && isBetaName(name)) {
      openBetaSheet(() => {
        commitClass(name);
        advanceFromStep(1);
        haptic('success');
      });
      return 'beta';
    }
    commitClass(name);
    if (currentScreen === 'wizard') renderStep({ keepScroll: true });
    haptic('select');
    return true;
  }

  function selectSubclass(className, subName) {
    if (!findSubclass(className, subName)) return false;
    hero.class = className;
    hero.subclass = subName;
    save();
    if (currentScreen === 'wizard') renderStep({ keepScroll: true });
    haptic('select');
    return true;
  }

  function commitRace(name) {
    const race = findRace(name);
    if (!race) return false;
    if (!hero.mixed) {
      hero.race = name;
    } else {
      const slot = ui.raceSlot === 'B' ? 'B' : 'A';
      const slotKey = slot === 'A' ? 'mixedA' : 'mixedB';
      const otherKey = slot === 'A' ? 'mixedB' : 'mixedA';
      const current = hero[slotKey];
      if (current === name) {
        hero[slotKey] = '';
      } else {
        if (hero[otherKey] === name) hero[otherKey] = current || '';
        hero[slotKey] = name;
      }
      if (slot === 'A' && !hero.mixedB) ui.raceSlot = 'B';
      else if (slot === 'B' && !hero.mixedA) ui.raceSlot = 'A';
    }
    save();
    if (currentScreen === 'wizard') renderStep({ keepScroll: true });
    return true;
  }

  function applyRace(name) {
    if (!findRace(name)) return false;
    const alreadySelected = hero.mixed
      ? (hero.mixedA === name || hero.mixedB === name)
      : hero.race === name;
    if (!alreadySelected && isBetaName(name)) {
      openBetaSheet(() => {
        commitRace(name);
        if (hero.mixed && !(hero.mixedA && hero.mixedB)) {
          ui.raceSlot = hero.mixedA ? 'B' : 'A';
          save();
          renderStep();
        } else {
          advanceFromStep(3);
        }
        haptic('success');
      });
      return 'beta';
    }
    commitRace(name);
    haptic('select');
    return true;
  }

  function toggleMixed(enabled) {
    hero.mixed = !!enabled;
    if (hero.mixed) {
      hero.mixedA = hero.race || '';
      hero.mixedB = '';
      hero.race = '';
      ui.raceSlot = hero.mixedA ? 'B' : 'A';
    } else {
      hero.race = hero.mixedA || hero.mixedB || '';
      hero.mixedA = '';
      hero.mixedB = '';
      ui.raceSlot = 'A';
    }
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function commitCommunity(name) {
    if (!findCommunity(name)) return false;
    hero.community = name;
    save();
    if (currentScreen === 'wizard') renderStep({ keepScroll: true });
    return true;
  }

  function selectCommunity(name) {
    if (!findCommunity(name)) return false;
    if (hero.community !== name && isBetaName(name)) {
      openBetaSheet(() => {
        commitCommunity(name);
        advanceFromStep(4);
        haptic('success');
      });
      return 'beta';
    }
    commitCommunity(name);
    haptic('select');
    return true;
  }

  function pickAttr(attrKey, value) {
    if (hero.attrs[attrKey] === value) {
      hero.attrs[attrKey] = null;
    } else if (attrAvailable(attrKey, value)) {
      hero.attrs[attrKey] = value;
    } else {
      toast('Это значение уже использовано');
      haptic('warning');
      return;
    }
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function randomAttrs() {
    const pool = shuffle(ATTR_POOL.slice());
    ATTRS.forEach((attr, index) => { hero.attrs[attr.key] = pool[index]; });
    save();
    renderStep({ keepScroll: true });
    haptic('success');
  }

  function clearAttrs() {
    ATTRS.forEach((attr) => { hero.attrs[attr.key] = null; });
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function syncWeaponMode() {
    const dual = !!(hero.mainWeapon || hero.offhandWeapon);
    hero.weaponMode = (!dual && hero.twohandWeapon) ? 'twohand' : 'dual';
  }

  function setWeaponMode(mode) {
    hero.weaponMode = mode === 'twohand' ? 'twohand' : 'dual';
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function selectWeapon(slot, id) {
    if (id === '__none__') {
      if (slot === 'main') {
        hero.mainWeapon = '';
        hero.twohandWeapon = '';
      } else if (slot === 'offhand') {
        hero.offhandWeapon = '';
      } else if (slot === 'twohand') {
        hero.twohandWeapon = '';
      }
    } else {
      const weapon = findWeapon(id);
      if (!weapon) return;
      if (slot === 'main') {
        if (weapon.group === 'twoHandedMain') {
          hero.twohandWeapon = id;
          hero.mainWeapon = '';
          hero.offhandWeapon = '';
        } else {
          hero.mainWeapon = id;
          hero.twohandWeapon = '';
        }
      } else if (slot === 'offhand') {
        hero.offhandWeapon = id;
        hero.twohandWeapon = '';
      } else if (slot === 'twohand') {
        hero.twohandWeapon = id;
        hero.mainWeapon = '';
        hero.offhandWeapon = '';
      }
    }
    syncWeaponMode();
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function selectArmor(id) {
    if (!findArmor(id)) return;
    hero.armor = id;
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function selectPotion(value) {
    if (!POTIONS.some((potion) => potion.value === value)) return;
    hero.potion = value;
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function toggleBuy(id) {
    const item = findLootItem(id);
    if (!item) return;
    const index = hero.shopPurchases.indexOf(id);
    if (index >= 0) {
      hero.shopPurchases.splice(index, 1);
    } else {
      const price = lootPrice(item);
      if (price > shopRemaining()) {
        toast(`Не хватает монет: нужно ${price}, осталось ${shopRemaining()}`);
        haptic('warning');
        return;
      }
      hero.shopPurchases.push(id);
    }
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function clearShop() {
    if (!hero.shopPurchases.length) return;
    hero.shopPurchases = [];
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function randomizeShopLoot() {
    let budget = Number(hero.startingMoney) || 10;
    const purchases = [];
    const pool = shuffle(LOOT_ALL.slice());
    let canAffordMore = true;
    while (canAffordMore) {
      const affordable = pool.filter((item) => !purchases.includes(item.id) && lootPrice(item) <= budget);
      if (!affordable.length) {
        canAffordMore = false;
        break;
      }
      const item = pick(affordable);
      purchases.push(item.id);
      budget -= lootPrice(item);
    }
    hero.shopPurchases = purchases;
    save();
    renderStep({ keepScroll: true });
    toast(`Выбран случайный лут: ${purchases.length} предм. на ${Number(hero.startingMoney) - budget} мон.`);
    haptic('success');
  }

  function setLootTab(tab) {
    ui.lootTab = tab === 'personal' ? 'personal' : 'shop';
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function setWeaponTab(tab) {
    ui.weaponTab = tab === 'offhand' ? 'offhand' : 'main';
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function setLoreTab(index) {
    ui.loreTab = clamp(Number(index) || 0, 0, loreDefinitions().length - 1);
    renderStep();
    haptic('select');
  }

  function pickLorePreset(field, index) {
    const def = loreDefinitions().find((item) => item.field === field);
    if (!def) return;
    const value = lorePresetValue(def, index);
    hero[field] = value;
    const input = $(`[data-field="${field}"]`);
    if (input) input.value = value;
    const panel = $('.lore-panel');
    if (panel) panel.querySelectorAll('.preset-chip').forEach((chip, chipIndex) => chip.classList.toggle('is-selected', chipIndex === index));
    save();
    refreshValidation();
    haptic('select');
  }

  function loreNext() {
    const defs = loreDefinitions();
    if (ui.loreTab < defs.length - 1) {
      ui.loreTab++;
      renderStep();
      haptic('select');
      return;
    }
    const missing = defs.find((def) => !String(hero[def.field] || '').trim());
    if (missing) {
      toast(`Заполни: ${missing.label}`);
      haptic('warning');
      return;
    }
    currentStep = 11;
    renderStep();
    haptic('success');
  }

  function addRef() {
    if (hero.refs.length >= 3) {
      toast('Можно добавить до трёх ссылок');
      return;
    }
    hero.refs.push('');
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function removeRef(index) {
    if (index < 0 || index >= hero.refs.length) return;
    hero.refs.splice(index, 1);
    if (!hero.refs.length) hero.refs.push('');
    save();
    renderStep({ keepScroll: true });
    haptic('select');
  }

  function pickPresetField(field, value) {
    hero[field] = value;
    const input = $(`[data-field="${field}"]`);
    if (input) {
      input.value = value;
      const fieldWrap = input.closest('.field');
      if (fieldWrap) fieldWrap.querySelectorAll('.preset-chip').forEach((chip) => chip.classList.toggle('is-selected', chip.dataset.value === value));
    }
    save();
    refreshValidation();
    haptic('select');
  }

  function jumpToStep(step) {
    const index = clamp(Number(step) || 0, 0, STEP_COUNT - 1);
    if (sheetOpen) closeSheet();
    openWizard(index);
    haptic('select');
  }

  /* ------------------------------------------------------------
     SHEET "USE" ACTIONS
     ------------------------------------------------------------ */

  function useClass(name) {
    if (!findClass(name)) return;
    const result = selectClass(name);
    if (result === 'beta') return;
    closeSheet();
    toast(`Класс выбран: ${name}`);
    haptic('success');
  }

  function useSubclass(className, subName) {
    if (!findSubclass(className, subName)) return;
    selectSubclass(className, subName);
    closeSheet();
    toast(`Подкласс выбран: ${subName}`);
    haptic('success');
  }

  function useRace(name) {
    if (!findRace(name)) return;
    const result = applyRace(name);
    if (result === 'beta') return;
    closeSheet();
    toast(`Раса выбрана: ${name}`);
    haptic('success');
  }

  function useCommunity(name) {
    if (!findCommunity(name)) return;
    const result = selectCommunity(name);
    if (result === 'beta') return;
    closeSheet();
    toast(`Сообщество выбрано: ${name}`);
    haptic('success');
  }

  function useArmor(id) {
    if (!findArmor(id)) return;
    selectArmor(id);
    closeSheet();
    toast('Броня выбрана');
    haptic('success');
  }

  /* ------------------------------------------------------------
     NAVIGATION
     ------------------------------------------------------------ */

  function startWizard() {
    if (hasProgress()) {
      confirmSheet({
        title: 'Начать заново?',
        message: 'Текущий черновик будет очищен. Если хочешь его сохранить — сначала скачай JSON.',
        confirmText: 'Начать заново',
        danger: true,
        onConfirm: () => {
          resetHero();
          openWizard(0);
        }
      });
      return;
    }
    resetHero();
    openWizard(0);
  }

  function continueHero() {
    if (hero.createdAt && isStepValid(13)) {
      renderResult();
      showScreen('result');
      return;
    }
    openWizard(currentStep);
  }

  function nextStep() {
    if (currentStep >= STEP_COUNT - 1) {
      finishHero();
      return;
    }
    if (!isStepValid(currentStep)) {
      toast(validateMessage(currentStep) || 'Заполни шаг, чтобы продолжить');
      haptic('warning');
      return;
    }
    currentStep = clamp(currentStep + 1, 0, STEP_COUNT - 1);
    save();
    renderStep();
    haptic('select');
  }

  function prevStep() {
    if (currentStep <= 0) {
      goHome();
      return;
    }
    currentStep--;
    save();
    renderStep();
    haptic('select');
  }

  function finishHero() {
    const firstMissing = STEPS.slice(0, 13).findIndex((_, index) => !isStepValid(index));
    if (firstMissing >= 0) {
      toast(`Заполни шаг «${STEPS[firstMissing].name}»`);
      haptic('warning');
      openWizard(firstMissing);
      return;
    }
    if (!hero.createdAt) hero.createdAt = new Date().toISOString();
    saveNow();
    renderResult();
    showScreen('result');
    haptic('success');
  }

  function newHero() {
    confirmSheet({
      title: 'Начать нового героя?',
      message: 'Текущее досье будет удалено. Если хочешь его сохранить — сначала скачай JSON.',
      confirmText: 'Новый герой',
      danger: true,
      onConfirm: () => {
        resetHero();
        openWizard(0);
        toast('Новый герой');
        haptic('success');
      }
    });
  }

  function runConfirm() {
    const callback = confirmCallback;
    confirmCallback = null;
    closeSheet();
    if (typeof callback === 'function') callback();
  }

  function runBetaConfirm() {
    const callback = betaCallback;
    betaCallback = null;
    closeSheet();
    if (typeof callback === 'function') callback();
  }

  function runBetaReplace() {
    betaCallback = null;
    closeSheet();
    haptic('select');
  }

  function scrollToSelector(selector) {
    const element = $(selector);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    haptic('select');
  }

  /* ------------------------------------------------------------
     REF PREVIEWS & INPUT STATE
     ------------------------------------------------------------ */

  function updateRefPreviews() {
    const container = $('#ref-previews');
    if (container) container.innerHTML = renderRefPreviews();
  }

  function onInput(event) {
    const target = event.target;
    if (!target || !target.dataset) return;
    const field = target.dataset.field;
    if (!field) return;
    const value = target.value;

    if (field === 'name') {
      hero.name = value;
    } else if (field === 'age') {
      hero.age = value;
    } else if (field === 'genderCustom') {
      hero.genderCustom = value;
    } else if (field === 'spark') {
      hero.spark = value;
      const sparks = Array.isArray(PRESETS.sparks) ? PRESETS.sparks : [];
      const selected = sparks.find((spark) => spark.text === value) || null;
      hero.sparkTitle = selected ? selected.title : '';
      $$('.spark-card').forEach((card) => {
        const index = Number(card.dataset.index);
        card.classList.toggle('is-selected', !!(selected && sparks[index] === selected));
      });
    } else if (field === 'customItem') {
      hero.customItem = value;
    } else if (field === 'personalItems') {
      hero.personalItems = value;
    } else if (field === 'appearance') {
      hero.appearance = value;
    } else if (field === 'partyBond') {
      hero.partyBond = value;
    } else if (field === 'expectations' || field === 'triggers') {
      hero[field] = value;
      const fieldWrap = target.closest('.field');
      if (fieldWrap) fieldWrap.querySelectorAll('.preset-chip').forEach((chip) => chip.classList.toggle('is-selected', chip.dataset.value === value));
    } else if (field === 'traits' || field === 'definingEvent' || field === 'regret' || field === 'secret' || field === 'goal') {
      hero[field] = value;
      const panel = $('.lore-panel');
      const def = loreDefinitions().find((item) => item.field === field);
      if (panel && def) {
        panel.querySelectorAll('.preset-chip').forEach((chip) => {
          const index = Number(chip.dataset.index);
          chip.classList.toggle('is-selected', lorePresetValue(def, index) === value);
        });
      }
      const defs = loreDefinitions();
      $$('.lore-tab').forEach((tab, index) => {
        const item = defs[index];
        if (!item) return;
        const filled = !!String(hero[item.field] || '').trim();
        tab.classList.toggle('is-done', filled);
        const num = tab.querySelector('.lore-tab-num');
        if (num) num.innerHTML = filled ? icon('check') : String(index + 1);
      });
      const done = defs.filter((item) => String(hero[item.field] || '').trim()).length;
      const progress = $('.lore-progress');
      if (progress) progress.textContent = `Вопрос ${ui.loreTab + 1} из ${defs.length} • заполнено ${done} из ${defs.length}`;
    } else if (field.startsWith('exp-')) {
      const index = Number(field.split('-')[1]);
      if (hero.experiences[index]) hero.experiences[index].name = value;
    } else if (field.startsWith('ref-')) {
      const index = Number(field.split('-')[1]);
      if (hero.refs[index] !== undefined) hero.refs[index] = value;
      updateRefPreviews();
    }

    save();
    refreshValidation();
  }

  function onChange(event) {
    const target = event.target;
    if (!target || !target.dataset) return;
    if (target.dataset.toggle === 'mixed') toggleMixed(target.checked);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      if (sheetOpen) {
        closeSheet();
        return;
      }
      if (currentScreen !== 'home') handleBack();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target && event.target.matches && event.target.matches('[role="button"][data-action]')) {
      event.preventDefault();
      event.target.click();
    }
  }

  /* ------------------------------------------------------------
     ACTION ROUTER
     ------------------------------------------------------------ */

  function handleAction(action, element) {
    switch (action) {
      case 'start':
        startWizard();
        break;
      case 'continue':
        continueHero();
        break;
      case 'random':
        requestRandomHero();
        break;
      case 'open-codex':
        openCodex();
        break;
      case 'codex-back':
        codexBack();
        break;
      case 'codex-tab':
        ui.codexTab = element.dataset.tab || 'classes';
        renderCodex();
        haptic('select');
        break;
      case 'open-passport':
        openPassportSheet();
        break;
      case 'wizard-home':
        goHome();
        break;
      case 'wizard-next':
        nextStep();
        break;
      case 'wizard-prev':
        prevStep();
        break;
      case 'result-home':
        goHome();
        break;
      case 'close-sheet':
        closeSheet();
        break;
      case 'confirm-sheet':
        runConfirm();
        break;
      case 'beta-confirm':
        runBetaConfirm();
        break;
      case 'beta-replace':
        runBetaReplace();
        break;
      case 'passport-home':
        closeSheet();
        goHome();
        break;
      case 'roll-name':
        rollName();
        break;
      case 'roll-age':
        rollAge();
        break;
      case 'pick-gender':
        pickGender(element.dataset.gender || '');
        break;
      case 'pick-spark':
        pickSpark(Number(element.dataset.index));
        break;
      case 'filter-class':
        ui.classFilter = element.dataset.filter || 'Все';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'toggle-base-classes':
        ui.classBaseOnly = !ui.classBaseOnly;
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'pick-class':
        selectClass(element.dataset.name);
        break;
      case 'pick-subclass':
        selectSubclass(element.dataset.class, element.dataset.name);
        break;
      case 'info-class':
        openClassDetail(element.dataset.name);
        break;
      case 'info-subclass':
        openSubclassDetail(element.dataset.class, element.dataset.name);
        break;
      case 'use-class':
        useClass(element.dataset.name);
        break;
      case 'use-subclass':
        useSubclass(element.dataset.class, element.dataset.name);
        break;
      case 'race-slot':
        ui.raceSlot = element.dataset.slot === 'B' ? 'B' : 'A';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'pick-race':
        applyRace(element.dataset.name);
        break;
      case 'info-race':
        openRaceDetail(element.dataset.name);
        break;
      case 'use-race':
        useRace(element.dataset.name);
        break;
      case 'pick-community':
        selectCommunity(element.dataset.name);
        break;
      case 'info-community':
        openCommunityDetail(element.dataset.name);
        break;
      case 'use-community':
        useCommunity(element.dataset.name);
        break;
      case 'pick-attr':
        pickAttr(element.dataset.attr, element.dataset.val);
        break;
      case 'random-attrs':
        randomAttrs();
        break;
      case 'clear-attrs':
        clearAttrs();
        break;
      case 'set-weapon-mode':
        setWeaponMode(element.dataset.mode);
        break;
      case 'weapon-tab':
        setWeaponTab(element.dataset.tab);
        break;
      case 'focus-weapon':
        scrollToSelector('.gear-choice-grid');
        break;
      case 'pick-weapon':
        selectWeapon(element.dataset.slot, element.dataset.id);
        break;
      case 'filter-weapon':
        ui.weaponFilter = element.dataset.filter || 'Все';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'info-weapon':
        openWeaponDetail(element.dataset.id);
        break;
      case 'focus-armor':
        scrollToSelector('.armor-grid');
        break;
      case 'pick-armor':
        selectArmor(element.dataset.id);
        break;
      case 'filter-armor':
        ui.armorFilter = element.dataset.filter || 'Все';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'info-armor':
        openArmorDetail(element.dataset.id);
        break;
      case 'use-armor':
        useArmor(element.dataset.id);
        break;
      case 'pick-potion':
        selectPotion(element.dataset.value);
        break;
      case 'loot-tab':
        setLootTab(element.dataset.tab);
        break;
      case 'shop-kind':
        ui.shopKindFilter = element.dataset.filter || 'all';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'shop-rarity':
        ui.shopRarityFilter = element.dataset.filter || 'Обычная';
        renderStep({ keepScroll: true });
        haptic('select');
        break;
      case 'toggle-buy':
        toggleBuy(element.dataset.id);
        break;
      case 'clear-shop':
        clearShop();
        break;
      case 'random-shop-loot':
        randomizeShopLoot();
        break;
      case 'info-loot':
        openLootDetail(element.dataset.id);
        break;
      case 'use-loot':
        useLoot(element.dataset.id);
        break;
      case 'lore-tab':
        setLoreTab(Number(element.dataset.index));
        break;
      case 'lore-preset':
        pickLorePreset(element.dataset.field, Number(element.dataset.index));
        break;
      case 'lore-next':
        loreNext();
        break;
      case 'random-appearance':
        randomAppearance();
        break;
      case 'add-ref':
        addRef();
        break;
      case 'remove-ref':
        removeRef(Number(element.dataset.index));
        break;
      case 'pick-preset-field':
        pickPresetField(element.dataset.field, element.dataset.value);
        break;
      case 'jump-step':
        jumpToStep(Number(element.dataset.step));
        break;
      case 'finish':
        finishHero();
        break;
      case 'download-json':
        downloadJSON();
        break;
      case 'copy-summary':
        copyText(buildSummaryText());
        break;
      case 'download-png':
        downloadPNG();
        break;
      case 'print':
        printDossier();
        break;
      case 'send-telegram':
        sendTelegram();
        break;
      case 'edit-hero':
        openWizard(13);
        break;
      case 'new-hero':
        newHero();
        break;
      default:
        break;
    }
  }

  function onClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const actionElement = target.closest('[data-action]');
    if (actionElement) {
      const action = actionElement.dataset.action;
      if (action) {
        event.preventDefault();
        handleAction(action, actionElement);
        return;
      }
    }
    if (target.id === 'sheet-backdrop') closeSheet();
  }

  /* ------------------------------------------------------------
     EVENTS & INIT
     ------------------------------------------------------------ */

  function attachEvents() {
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeyDown);

    const search = $('#codex-search');
    if (search) {
      search.addEventListener('input', () => {
        ui.codexQuery = search.value.trim();
        renderCodex();
      });
    }
    const clear = $('#codex-search-clear');
    if (clear) {
      clear.addEventListener('click', () => {
        ui.codexQuery = '';
        if (search) {
          search.value = '';
          search.focus();
        }
        renderCodex();
        haptic('select');
      });
    }

    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveNow();
        stopHomeBgSlideshow();
      } else if (currentScreen === 'home') {
        startHomeBgSlideshow();
      }
    });
  }

  function init() {
    loadDraft();
    initTelegram();
    initAmbient();
    renderHome();
    attachEvents();
    showScreen('home');
    syncTelegramBack();
  }

  init();
})();
