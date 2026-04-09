// ChemiGator — AR Химия
// v1.0
// Главный модуль приложения

'use strict';

/* =====================================================
   БАЗА ДАННЫХ ЭЛЕМЕНТОВ
   Порядок соответствует порядку маркеров в файле elements.mind.
   Каждый элемент: { symbol, nameRu, atomicNumber, category, youtubeId }
   Индекс в массиве = индекс маркера (0-based).
   ===================================================== */

const ELEMENTS = [
  // Порядок ТОЧНО соответствует порядку изображений в папке Img (и маркеров в elements.mind).
  // Файлы в папке Img (алфавитный порядок по символу):
  // Ac(0), Ag(1), Al(2), Am(3), Ar(4), As(5), At(6), Au(7),
  // B(8), Ba(9), Bh(10), Bi(11), Bk(12), Br(13),
  // C(14), Ca(15), Cd(16), Ce(17), Cf(18), Cl(19), Cm(20), Cn(21), Co(22), Cr(23), Cs(24), Cu(25),
  // Db(26), Ds(27), Dy(28),
  // Er(29), Es(30), Eu(31),
  // F(32), Fe(33), Fm(34), Fr(35),
  // Ga(36), Gd(37), Ge(38),
  // H(39), He(40), Hf(41), Hg(42), Ho(43), Hs(44),
  // I(45), In(46), Ir(47),
  // K(48), Kr(49),
  // La(50), Li(51), Lr(52), Lu(53),
  // Md(54), Mg(55), Mn(56), Mo(57), Mt(58),
  // N(59), Na(60), Nb(61), Nd(62), Ne(63), Ni(64), No(65), Np(66),
  // O(67), Os(68),
  // P(69), Pa(70), Pb(71), Pd(72), Pm(73), Po(74), Pr(75), Pt(76), Pu(77),
  // Ra(78), Rb(79), Re(80), Rf(81), Rg(82), Rh(83), Rn(84), Ru(85),
  // S(86), Sb(87), Sc(88), Se(89), Sg(90), Si(91), Sm(92), Sn(93), Sr(94),
  // Ta(95), Tb(96), Tc(97), Te(98), Th(99), Ti(100), Tl(101), Tm(102),
  // U(103), Uuh(104), Uuo(105), Uup(106), Uuq(107), Uus(108), Uut(109),
  // W(110), Xe(111), Y(112), Yb(113), Zn(114), Zr(115)

  { symbol: 'Ac', nameRu: 'Актиний',         atomicNumber: 89,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Ag', nameRu: 'Серебро',          atomicNumber: 47,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Al', nameRu: 'Алюминий',         atomicNumber: 13,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Am', nameRu: 'Америций',         atomicNumber: 95,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Ar', nameRu: 'Аргон',            atomicNumber: 18,  category: 'Инертный газ',           youtubeId: null },
  { symbol: 'As', nameRu: 'Мышьяк',           atomicNumber: 33,  category: 'Металлоид',              youtubeId: null },
  { symbol: 'At', nameRu: 'Астат',            atomicNumber: 85,  category: 'Галоген',                youtubeId: null },
  { symbol: 'Au', nameRu: 'Золото',           atomicNumber: 79,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'B',  nameRu: 'Бор',              atomicNumber: 5,   category: 'Металлоид',              youtubeId: null },
  { symbol: 'Ba', nameRu: 'Барий',            atomicNumber: 56,  category: 'Щёлочноземельный',       youtubeId: null },
  { symbol: 'Bh', nameRu: 'Борий',            atomicNumber: 107, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Bi', nameRu: 'Висмут',           atomicNumber: 83,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Bk', nameRu: 'Берклий',          atomicNumber: 97,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Br', nameRu: 'Бром',             atomicNumber: 35,  category: 'Галоген',                youtubeId: null },
  { symbol: 'C',  nameRu: 'Углерод',          atomicNumber: 6,   category: 'Неметалл',              youtubeId: null },
  { symbol: 'Ca', nameRu: 'Кальций',          atomicNumber: 20,  category: 'Щёлочноземельный',       youtubeId: null },
  { symbol: 'Cd', nameRu: 'Кадмий',           atomicNumber: 48,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Ce', nameRu: 'Церий',            atomicNumber: 58,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Cf', nameRu: 'Калифорний',       atomicNumber: 98,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Cl', nameRu: 'Хлор',             atomicNumber: 17,  category: 'Галоген',                youtubeId: null },
  { symbol: 'Cm', nameRu: 'Кюрий',            atomicNumber: 96,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Cn', nameRu: 'Коперниций',       atomicNumber: 112, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Co', nameRu: 'Кобальт',          atomicNumber: 27,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Cr', nameRu: 'Хром',             atomicNumber: 24,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Cs', nameRu: 'Цезий',            atomicNumber: 55,  category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Cu', nameRu: 'Медь',             atomicNumber: 29,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Db', nameRu: 'Дубний',           atomicNumber: 105, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Ds', nameRu: 'Дармштадтий',      atomicNumber: 110, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Dy', nameRu: 'Диспрозий',        atomicNumber: 66,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Er', nameRu: 'Эрбий',            atomicNumber: 68,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Es', nameRu: 'Эйнштейний',       atomicNumber: 99,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Eu', nameRu: 'Европий',          atomicNumber: 63,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'F',  nameRu: 'Фтор',             atomicNumber: 9,   category: 'Галоген',                youtubeId: null },
  { symbol: 'Fe', nameRu: 'Железо',           atomicNumber: 26,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Fm', nameRu: 'Фермий',           atomicNumber: 100, category: 'Актиноид',              youtubeId: null },
  { symbol: 'Fr', nameRu: 'Франций',          atomicNumber: 87,  category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Ga', nameRu: 'Галлий',           atomicNumber: 31,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Gd', nameRu: 'Гадолиний',        atomicNumber: 64,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Ge', nameRu: 'Германий',         atomicNumber: 32,  category: 'Металлоид',              youtubeId: null },
  { symbol: 'H',  nameRu: 'Водород',          atomicNumber: 1,   category: 'Неметалл',              youtubeId: null },
  { symbol: 'He', nameRu: 'Гелий',            atomicNumber: 2,   category: 'Инертный газ',           youtubeId: null },
  { symbol: 'Hf', nameRu: 'Гафний',           atomicNumber: 72,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Hg', nameRu: 'Ртуть',            atomicNumber: 80,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Ho', nameRu: 'Гольмий',          atomicNumber: 67,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Hs', nameRu: 'Хассий',           atomicNumber: 108, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'I',  nameRu: 'Йод',              atomicNumber: 53,  category: 'Галоген',                youtubeId: null },
  { symbol: 'In', nameRu: 'Индий',            atomicNumber: 49,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Ir', nameRu: 'Иридий',           atomicNumber: 77,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'K',  nameRu: 'Калий',            atomicNumber: 19,  category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Kr', nameRu: 'Криптон',          atomicNumber: 36,  category: 'Инертный газ',           youtubeId: null },
  { symbol: 'La', nameRu: 'Лантан',           atomicNumber: 57,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Li', nameRu: 'Литий',            atomicNumber: 3,   category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Lr', nameRu: 'Лоуренсий',        atomicNumber: 103, category: 'Актиноид',              youtubeId: null },
  { symbol: 'Lu', nameRu: 'Лютеций',          atomicNumber: 71,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Md', nameRu: 'Менделевий',       atomicNumber: 101, category: 'Актиноид',              youtubeId: null },
  { symbol: 'Mg', nameRu: 'Магний',           atomicNumber: 12,  category: 'Щёлочноземельный',       youtubeId: null },
  { symbol: 'Mn', nameRu: 'Марганец',         atomicNumber: 25,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Mo', nameRu: 'Молибден',         atomicNumber: 42,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Mt', nameRu: 'Майтнерий',        atomicNumber: 109, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'N',  nameRu: 'Азот',             atomicNumber: 7,   category: 'Неметалл',              youtubeId: null },
  { symbol: 'Na', nameRu: 'Натрий',           atomicNumber: 11,  category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Nb', nameRu: 'Ниобий',           atomicNumber: 41,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Nd', nameRu: 'Неодим',           atomicNumber: 60,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Ne', nameRu: 'Неон',             atomicNumber: 10,  category: 'Инертный газ',           youtubeId: null },
  { symbol: 'Ni', nameRu: 'Никель',           atomicNumber: 28,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'No', nameRu: 'Нобелий',          atomicNumber: 102, category: 'Актиноид',              youtubeId: null },
  { symbol: 'Np', nameRu: 'Нептуний',         atomicNumber: 93,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'O',  nameRu: 'Кислород',         atomicNumber: 8,   category: 'Неметалл',              youtubeId: null },
  { symbol: 'Os', nameRu: 'Осмий',            atomicNumber: 76,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'P',  nameRu: 'Фосфор',           atomicNumber: 15,  category: 'Неметалл',              youtubeId: null },
  { symbol: 'Pa', nameRu: 'Протактиний',      atomicNumber: 91,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Pb', nameRu: 'Свинец',           atomicNumber: 82,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Pd', nameRu: 'Палладий',         atomicNumber: 46,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Pm', nameRu: 'Прометий',         atomicNumber: 61,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Po', nameRu: 'Полоний',          atomicNumber: 84,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Pr', nameRu: 'Празеодим',        atomicNumber: 59,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Pt', nameRu: 'Платина',          atomicNumber: 78,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Pu', nameRu: 'Плутоний',         atomicNumber: 94,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Ra', nameRu: 'Радий',            atomicNumber: 88,  category: 'Щёлочноземельный',       youtubeId: null },
  { symbol: 'Rb', nameRu: 'Рубидий',          atomicNumber: 37,  category: 'Щелочной металл',        youtubeId: null },
  { symbol: 'Re', nameRu: 'Рений',            atomicNumber: 75,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Rf', nameRu: 'Резерфордий',      atomicNumber: 104, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Rg', nameRu: 'Рентгений',        atomicNumber: 111, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Rh', nameRu: 'Родий',            atomicNumber: 45,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Rn', nameRu: 'Радон',            atomicNumber: 86,  category: 'Инертный газ',           youtubeId: null },
  { symbol: 'Ru', nameRu: 'Рутений',          atomicNumber: 44,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'S',  nameRu: 'Сера',             atomicNumber: 16,  category: 'Неметалл',              youtubeId: null },
  { symbol: 'Sb', nameRu: 'Сурьма',           atomicNumber: 51,  category: 'Металлоид',              youtubeId: null },
  { symbol: 'Sc', nameRu: 'Скандий',          atomicNumber: 21,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Se', nameRu: 'Селен',            atomicNumber: 34,  category: 'Неметалл',              youtubeId: null },
  { symbol: 'Sg', nameRu: 'Сиборгий',         atomicNumber: 106, category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Si', nameRu: 'Кремний',          atomicNumber: 14,  category: 'Металлоид',              youtubeId: null },
  { symbol: 'Sm', nameRu: 'Самарий',          atomicNumber: 62,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Sn', nameRu: 'Олово',            atomicNumber: 50,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Sr', nameRu: 'Стронций',         atomicNumber: 38,  category: 'Щёлочноземельный',       youtubeId: null },
  { symbol: 'Ta', nameRu: 'Тантал',           atomicNumber: 73,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Tb', nameRu: 'Тербий',           atomicNumber: 65,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Tc', nameRu: 'Технеций',         atomicNumber: 43,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Te', nameRu: 'Теллур',           atomicNumber: 52,  category: 'Металлоид',              youtubeId: null },
  { symbol: 'Th', nameRu: 'Торий',            atomicNumber: 90,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Ti', nameRu: 'Титан',            atomicNumber: 22,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Tl', nameRu: 'Таллий',           atomicNumber: 81,  category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Tm', nameRu: 'Тулий',            atomicNumber: 69,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'U',  nameRu: 'Уран',             atomicNumber: 92,  category: 'Актиноид',              youtubeId: null },
  { symbol: 'Uuh',nameRu: 'Ливерморий',       atomicNumber: 116, category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Uuo',nameRu: 'Оганессон',        atomicNumber: 118, category: 'Инертный газ',           youtubeId: null },
  { symbol: 'Uup',nameRu: 'Московий',         atomicNumber: 115, category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Uuq',nameRu: 'Флеровий',         atomicNumber: 114, category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'Uus',nameRu: 'Теннессин',        atomicNumber: 117, category: 'Галоген',                youtubeId: null },
  { symbol: 'Uut',nameRu: 'Нихоний',          atomicNumber: 113, category: 'Постпереходный металл',  youtubeId: null },
  { symbol: 'W',  nameRu: 'Вольфрам',         atomicNumber: 74,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Xe', nameRu: 'Ксенон',           atomicNumber: 54,  category: 'Инертный газ',           youtubeId: null },
  { symbol: 'Y',  nameRu: 'Иттрий',           atomicNumber: 39,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Yb', nameRu: 'Иттербий',         atomicNumber: 70,  category: 'Лантаноид',              youtubeId: null },
  { symbol: 'Zn', nameRu: 'Цинк',             atomicNumber: 30,  category: 'Переходный металл',      youtubeId: null },
  { symbol: 'Zr', nameRu: 'Цирконий',         atomicNumber: 40,  category: 'Переходный металл',      youtubeId: null },
];

/* =====================================================
   СОСТОЯНИЕ ПРИЛОЖЕНИЯ
   ===================================================== */
const APP = {
  isARRunning: false,
  isPaused: false,
  activeMarkerIndex: null,
  sceneEl: null,
};

/* =====================================================
   DOM-ЭЛЕМЕНТЫ
   ===================================================== */
const DOM = {
  loadingScreen:    () => document.getElementById('loading-screen'),
  startScreen:      () => document.getElementById('start-screen'),
  arContainer:      () => document.getElementById('ar-container'),
  videoPlayer:      () => document.getElementById('video-player'),
  progressBar:      () => document.getElementById('progress-bar'),
  progressPercent:  () => document.getElementById('progress-percent'),
  loadingStatus:    () => document.getElementById('loading-status'),
  startBtn:         () => document.getElementById('start-btn'),
  btnBack:          () => document.getElementById('btn-back'),
  btnPause:         () => document.getElementById('btn-pause'),
  pauseIcon:        () => document.getElementById('pause-icon'),
  playIcon:         () => document.getElementById('play-icon'),
  scanFrame:        () => document.getElementById('scan-frame'),
  scanHint:         () => document.getElementById('scan-hint'),
  videoTrigger:     () => document.getElementById('video-trigger'),
  elementBadge:     () => document.getElementById('element-badge'),
  elementSymbol:    () => document.getElementById('element-symbol'),
  elementNumber:    () => document.getElementById('element-number'),
  elementName:      () => document.getElementById('element-name'),
  elementCategory:  () => document.getElementById('element-category'),
  btnWatch:         () => document.getElementById('btn-watch'),
  btnCloseVideo:    () => document.getElementById('btn-close-video'),
  playerElName:     () => document.getElementById('player-element-name'),
  ytIframe:         () => document.getElementById('yt-iframe'),
};

/* =====================================================
   УТИЛИТЫ
   ===================================================== */
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setProgress(pct) {
  const p = Math.min(100, Math.max(0, Math.round(pct)));
  DOM.progressBar().style.width = p + '%';
  DOM.progressPercent().textContent = p + '%';
}

/* =====================================================
   ЗАГРУЗКА elements.mind
   ===================================================== */
async function preloadMindFile() {
  const url = 'assets/Targets/elements.mind';
  DOM.loadingStatus().textContent = 'Загрузка базы маркеров (~80 МБ)...';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        setProgress(pct);
        DOM.loadingStatus().textContent = `Загружено ${formatBytes(e.loaded)} из ${formatBytes(e.total)}...`;
      } else {
        // Если сервер не даёт Content-Length — анимируем примерно
        const approx = Math.min(90, (e.loaded / 85000000) * 90);
        setProgress(approx);
        DOM.loadingStatus().textContent = `Загружено ${formatBytes(e.loaded)}...`;
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        DOM.loadingStatus().textContent = 'База данных загружена!';
        resolve();
      } else {
        reject(new Error(`Ошибка загрузки: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Ошибка сети при загрузке файла маркеров'));
    xhr.send();
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

/* =====================================================
   ИНИЦИАЛИЗАЦИЯ AR-СЦЕНЫ (ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ ТАРГЕТОВ)
   ===================================================== */
function initARScene() {
  const scene = document.getElementById('ar-scene');
  APP.sceneEl = scene;

  // Создаём <a-entity mindar-image-target="..."> для каждого маркера
  ELEMENTS.forEach((el, index) => {
    const targetEntity = document.createElement('a-entity');
    targetEntity.setAttribute('mindar-image-target', `targetIndex: ${index}`);
    targetEntity.setAttribute('id', `target-${index}`);

    // Невидимая плоскость (нужна для срабатывания событий трекинга)
    const plane = document.createElement('a-plane');
    plane.setAttribute('width', '1');
    plane.setAttribute('height', '1');
    plane.setAttribute('color', 'transparent');
    plane.setAttribute('opacity', '0');
    plane.setAttribute('side', 'double');
    targetEntity.appendChild(plane);

    scene.appendChild(targetEntity);

    // Слушаем события трекинга
    targetEntity.addEventListener('targetFound', () => onMarkerFound(index));
    targetEntity.addEventListener('targetLost',  () => onMarkerLost(index));
  });
}

/* =====================================================
   ОБРАБОТКА МАРКЕРОВ
   ===================================================== */
function onMarkerFound(index) {
  if (APP.isPaused) return;

  const element = ELEMENTS[index];
  if (!element) return;

  APP.activeMarkerIndex = index;

  // Обновляем UI
  DOM.elementSymbol().textContent   = element.symbol;
  DOM.elementNumber().textContent   = element.atomicNumber;
  DOM.elementName().textContent     = element.nameRu;
  DOM.elementCategory().textContent = element.category;

  // Обновляем текст кнопки
  DOM.btnWatch().innerHTML = `<span>▶ Смотреть: ${element.nameRu}</span>`;

  // Скрываем рамку, показываем виджет элемента
  hide(DOM.scanFrame());
  show(DOM.videoTrigger());

  console.log(`[ChemiGator] Маркер найден: ${element.symbol} (${element.nameRu}), индекс: ${index}`);
}

function onMarkerLost(index) {
  if (APP.activeMarkerIndex !== index) return;
  APP.activeMarkerIndex = null;

  hide(DOM.videoTrigger());
  show(DOM.scanFrame());
}

/* =====================================================
   УПРАВЛЕНИЕ ПАУЗОЙ КАМЕРЫ
   ===================================================== */
function pauseAR() {
  if (!APP.isARRunning || !APP.sceneEl) return;
  try {
    APP.sceneEl.pause();
    APP.isPaused = true;
    hide(DOM.pauseIcon());
    show(DOM.playIcon());
  } catch (e) {
    console.warn('[ChemiGator] Ошибка паузы AR:', e);
  }
}

function resumeAR() {
  if (!APP.isARRunning || !APP.sceneEl) return;
  try {
    APP.sceneEl.play();
    APP.isPaused = false;
    show(DOM.pauseIcon());
    hide(DOM.playIcon());
  } catch (e) {
    console.warn('[ChemiGator] Ошибка возобновления AR:', e);
  }
}

/* =====================================================
   ВИДЕОПЛЕЕР
   ===================================================== */

/**
 * Строит URL YouTube Embeds без какого-либо UI YouTube.
 * Параметры: autoplay=1, controls=0, modestbranding=1, rel=0
 */
function buildYouTubeEmbedURL(videoId) {
  const params = new URLSearchParams({
    autoplay: 1,
    controls: 0,         // Убираем управление YouTube
    modestbranding: 1,   // Минимум брендинга
    rel: 0,              // Нет рекомендаций
    showinfo: 0,         // Нет информации
    fs: 1,               // Fullscreen разрешён
    iv_load_policy: 3,   // Без аннотаций
    disablekb: 0,
    enablejsapi: 1,
    origin: window.location.origin || '*',
    playsinline: 1,      // Воспроизведение в линии на iOS
    loop: 0,
    color: 'white',
    cc_load_policy: 0,
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function openVideo(index) {
  const element = ELEMENTS[index];
  if (!element) return;

  // Обновляем заголовок плеера
  DOM.playerElName().textContent = `${element.symbol} — ${element.nameRu}`;

  // Устанавливаем src iframe
  if (element.youtubeId) {
    DOM.ytIframe().src = buildYouTubeEmbedURL(element.youtubeId);
  } else {
    // Видео ещё не добавлено — показываем заглушку
    DOM.ytIframe().src = 'about:blank';
    DOM.ytIframe().srcdoc = `
      <style>
        body { margin:0; background:#000; display:flex; align-items:center;
               justify-content:center; height:100vh; flex-direction:column;
               font-family: Inter, sans-serif; color: rgba(255,255,255,0.5); }
        .icon { font-size: 60px; margin-bottom: 16px; }
        p { font-size: 16px; text-align:center; padding: 0 32px; }
        .symbol { font-size: 28px; font-weight: 900; color: #00d4ff;
                  letter-spacing: 2px; margin-bottom: 8px; }
      </style>
      <div class="icon">🎬</div>
      <div class="symbol">${element.symbol}</div>
      <p>Видео для «${element.nameRu}» будет добавлено позже</p>
    `;
  }

  // Пауза AR, показываем плеер
  pauseAR();
  show(DOM.videoPlayer());
}

function closeVideo() {
  // Останавливаем воспроизведение, убирая src
  DOM.ytIframe().src = 'about:blank';
  hide(DOM.videoPlayer());
  resumeAR();
}

/* =====================================================
   НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
   ===================================================== */
function showStartScreen() {
  hide(DOM.loadingScreen());
  show(DOM.startScreen());
}

function startAR() {
  hide(DOM.startScreen());
  show(DOM.arContainer());

  const scene = document.getElementById('ar-scene');

  // Ждём полной инициализации AR перед генерацией таргетов
  if (!APP._targetsInitialized) {
    initARScene();
    APP._targetsInitialized = true;
  }

  // Применяем оптимизацию экспозиции камеры (улучшает яркий свет)
  applyExposureCorrection();

  APP.isARRunning = true;
  APP.isPaused = false;
}

function stopAR() {
  try {
    if (APP.sceneEl) APP.sceneEl.pause();
  } catch(e) {}
  APP.isARRunning = false;
  APP.activeMarkerIndex = null;
  hide(DOM.arContainer());
  hide(DOM.videoTrigger());
  show(DOM.scanFrame());
  show(DOM.startScreen());
}

/* =====================================================
   КОРРЕКЦИЯ ЭКСПОЗИЦИИ КАМЕРЫ
   ===================================================== */
async function applyExposureCorrection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });
    const [track] = stream.getVideoTracks();
    const capabilities = track.getCapabilities();

    // Устанавливаем уменьшенное значение экспозиции, если поддерживается
    const constraints = {};
    if (capabilities.exposureMode && capabilities.exposureMode.includes('manual')) {
      constraints.exposureMode = 'manual';
      if (capabilities.exposureCompensation) {
        const { min, max } = capabilities.exposureCompensation;
        // Понижаем экспозицию чуть ниже нормы (чтобы не засвечивало бумагу)
        constraints.exposureCompensation = Math.max(min, -1.5);
      }
    }
    if (Object.keys(constraints).length > 0) {
      await track.applyConstraints(constraints);
      console.log('[ChemiGator] Коррекция экспозиции применена:', constraints);
    }
    // Останавливаем вспомогательный стрим
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    // Несмертельно — продолжаем без коррекции
    console.warn('[ChemiGator] Коррекция экспозиции недоступна:', e.message);
  }
}

/* =====================================================
   ПРИВЯЗКА СОБЫТИЙ
   ===================================================== */
function bindEvents() {
  // Кнопка старта
  DOM.startBtn().addEventListener('click', startAR);

  // Назад в меню
  DOM.btnBack().addEventListener('click', () => {
    closeVideo();
    stopAR();
  });

  // Пауза / Возобновление
  DOM.btnPause().addEventListener('click', () => {
    if (APP.isPaused) resumeAR();
    else pauseAR();
  });

  // Кнопка "Смотреть видео"
  DOM.btnWatch().addEventListener('click', () => {
    if (APP.activeMarkerIndex !== null) {
      openVideo(APP.activeMarkerIndex);
    }
  });

  // Закрыть видео
  DOM.btnCloseVideo().addEventListener('click', closeVideo);
}

/* =====================================================
   ЗАПУСК ПРИЛОЖЕНИЯ
   ===================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[ChemiGator] v1.0 — Старт');
  bindEvents();

  // Небольшая задержка для красоты (让UI рендерится)
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    await preloadMindFile();
    await new Promise(resolve => setTimeout(resolve, 600)); // Небольшая пауза после загрузки
    showStartScreen();
  } catch (err) {
    console.error('[ChemiGator] Ошибка загрузки:', err);
    DOM.loadingStatus().textContent = '⚠️ Ошибка загрузки. Перезагрузите страницу.';
    DOM.loadingStatus().style.color = '#ff6b6b';
  }
});
