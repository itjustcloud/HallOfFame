const DEFAULT_LANG = "ko";
const DEFAULT_CATEGORY = "all";
const STORAGE_KEYS = {
  language: "hof_language",
  category: "hof_category",
};

const laneDefinitions = [
  {
    key: "trending",
    pick: (items) => items.slice().sort((a, b) => b.year - a.year),
  },
  {
    key: "pixar",
    pick: (items) => items.filter(isPixarLike),
  },
  {
    key: "masterpieces",
    pick: (items) => items.filter((item) => item.year <= 2021),
  },
  {
    key: "sequels",
    pick: (items) => items.filter(isSequelLike),
  },
];

const i18n = {
  ko: {
    htmlLang: "ko",
    heroEyebrow: "명예의 작품들",
    heroTitle: "HallOfFame",
    heroDesc: "영화와 책을 한 곳에서 탐색하고 기록하세요.",
    featuredKicker: "오늘의 큐레이션",
    laneSectionTitle: "테마 큐레이션",
    lanes: {
      trending: "지금 뜨는 작품",
      pixar: "픽사 감성",
      masterpieces: "애니 명작",
      sequels: "속편 기대작",
    },
    catalogTitle: "검색 가능한 전체 카탈로그",
    searchLabel: "검색",
    searchPlaceholder: "제목, 감독, 작가로 검색",
    category: { all: "전체", movie: "영화", book: "도서" },
    result: (count) => `총 ${count}개`,
    creator: { movie: "감독", book: "작가" },
    empty: "조건에 맞는 작품이 없습니다.",
    laneCount: (count) => `${count}개 큐레이션`,
    featuredFallback: "표시할 작품이 없습니다.",
  },
  en: {
    htmlLang: "en",
    heroEyebrow: "Hall of Great Works",
    heroTitle: "HallOfFame",
    heroDesc: "Browse standout movies and books in one place.",
    featuredKicker: "Featured Pick",
    laneSectionTitle: "Curated Lanes",
    lanes: {
      trending: "Trending Now",
      pixar: "Pixar Mood",
      masterpieces: "Animation Classics",
      sequels: "Sequel Watchlist",
    },
    catalogTitle: "Searchable Catalog",
    searchLabel: "Search",
    searchPlaceholder: "Search by title, director, or author",
    category: { all: "All", movie: "Movie", book: "Book" },
    result: (count) => `${count} items`,
    creator: { movie: "Director", book: "Author" },
    empty: "No items found for your filters.",
    laneCount: (count) => `${count} picks`,
    featuredFallback: "No featured item available.",
  },
  ja: {
    htmlLang: "ja",
    heroEyebrow: "殿堂入り作品",
    heroTitle: "HallOfFame",
    heroDesc: "映画と本をひとつの場所で探せます。",
    featuredKicker: "本日のピック",
    laneSectionTitle: "テーマ別キュレーション",
    lanes: {
      trending: "今話題の作品",
      pixar: "ピクサー気分",
      masterpieces: "アニメ名作",
      sequels: "続編期待作",
    },
    catalogTitle: "検索可能なカタログ",
    searchLabel: "検索",
    searchPlaceholder: "タイトル・監督・作家で検索",
    category: { all: "すべて", movie: "映画", book: "本" },
    result: (count) => `合計 ${count} 件`,
    creator: { movie: "監督", book: "作家" },
    empty: "条件に合う作品がありません。",
    laneCount: (count) => `${count} 作品`,
    featuredFallback: "表示できる作品がありません。",
  },
};

const state = {
  items: [],
  language: safeRead(STORAGE_KEYS.language, DEFAULT_LANG, ["ko", "en", "ja"]),
  category: safeRead(STORAGE_KEYS.category, DEFAULT_CATEGORY, ["all", "movie", "book"]),
  query: "",
  modalTrigger: null,
};

const el = {
  heroEyebrow: document.getElementById("heroEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroDesc: document.getElementById("heroDesc"),
  featuredKicker: document.getElementById("featuredKicker"),
  featuredPanel: document.getElementById("featuredPanel"),
  featuredImage: document.getElementById("featuredImage"),
  featuredTitle: document.getElementById("featuredTitle"),
  featuredMeta: document.getElementById("featuredMeta"),
  featuredDescription: document.getElementById("featuredDescription"),
  laneSectionTitle: document.getElementById("laneSectionTitle"),
  laneRows: document.getElementById("laneRows"),
  catalogTitle: document.getElementById("catalogTitle"),
  searchLabel: document.getElementById("searchLabel"),
  searchInput: document.getElementById("searchInput"),
  categoryButtons: [...document.querySelectorAll("[data-category]")],
  langButtons: [...document.querySelectorAll("[data-lang]")],
  resultMeta: document.getElementById("resultMeta"),
  cardGrid: document.getElementById("cardGrid"),
  modal: document.getElementById("detailModal"),
  modalClose: document.getElementById("modalClose"),
  modalImage: document.getElementById("modalImage"),
  modalBadge: document.getElementById("modalBadge"),
  modalTitle: document.getElementById("modalTitle"),
  modalMeta: document.getElementById("modalMeta"),
  modalDescription: document.getElementById("modalDescription"),
  modalQuote: document.getElementById("modalQuote"),
};

init();

async function init() {
  bindEvents();
  updateStaticText();

  try {
    const res = await fetch("data/items.json");
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    state.items = await res.json();
    render();
  } catch (error) {
    el.cardGrid.innerHTML = `<p class="comment">${escapeHtml(error.message)}</p>`;
  }
}

function bindEvents() {
  el.categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      localStorage.setItem(STORAGE_KEYS.category, state.category);
      render();
    });
  });

  el.langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.language = btn.dataset.lang;
      localStorage.setItem(STORAGE_KEYS.language, state.language);
      updateStaticText();
      render();
    });
  });

  el.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  el.modalClose.addEventListener("click", closeModal);

  el.modal.addEventListener("click", (event) => {
    if (event.target === el.modal) closeModal();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
}

function updateStaticText() {
  const text = i18n[state.language];
  document.documentElement.lang = text.htmlLang;
  el.heroEyebrow.textContent = text.heroEyebrow;
  el.heroTitle.textContent = text.heroTitle;
  el.heroDesc.textContent = text.heroDesc;
  el.featuredKicker.textContent = text.featuredKicker;
  el.laneSectionTitle.textContent = text.laneSectionTitle;
  el.catalogTitle.textContent = text.catalogTitle;
  el.searchLabel.textContent = text.searchLabel;
  el.searchInput.placeholder = text.searchPlaceholder;

  el.categoryButtons.forEach((btn) => {
    btn.textContent = text.category[btn.dataset.category];
  });
}

function updateActiveButtons() {
  el.categoryButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === state.category);
  });
  el.langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.language);
  });
}

function render() {
  updateActiveButtons();

  const filtered = state.items.filter((item) => {
    const categoryMatch = state.category === "all" || item.category === state.category;
    const queryMatch = !state.query || makeSearchString(item).includes(state.query);
    return categoryMatch && queryMatch;
  });

  renderFeatured(filtered);
  renderLanes(filtered);
  renderGrid(filtered);
}

function renderFeatured(filteredItems) {
  const text = i18n[state.language];
  const featured = filteredItems.slice().sort((a, b) => b.year - a.year)[0];

  if (!featured) {
    el.featuredPanel.classList.add("is-empty");
    el.featuredImage.src = "";
    el.featuredImage.alt = "";
    el.featuredTitle.textContent = text.featuredFallback;
    el.featuredMeta.textContent = "";
    el.featuredDescription.textContent = "";
    return;
  }

  const title = localText(featured.title);
  const creatorName = featured.category === "movie" ? featured.director : featured.author;

  el.featuredPanel.classList.remove("is-empty");
  el.featuredImage.src = featured.image;
  el.featuredImage.alt = title;
  el.featuredTitle.textContent = `${title} (${featured.year})`;
  el.featuredMeta.textContent = `${text.creator[featured.category]}: ${creatorName}`;
  el.featuredDescription.textContent = localText(featured.description);
}

function renderLanes(filteredItems) {
  const text = i18n[state.language];

  const rows = laneDefinitions
    .map((lane) => {
      const laneItems = lane.pick(filteredItems).slice(0, 8);
      if (!laneItems.length) return "";

      const laneCards = laneItems.map((item) => laneCardHtml(item)).join("");
      const loopCards = laneCards + laneCards;
      const duration = Math.max(26, laneItems.length * 5);

      return `
        <section class="lane-row" aria-label="${escapeHtml(text.lanes[lane.key])}">
          <div class="lane-head">
            <h3>${escapeHtml(text.lanes[lane.key])}</h3>
            <span class="lane-meta">${escapeHtml(text.laneCount(laneItems.length))}</span>
          </div>
          <div class="lane-viewport">
            <div class="lane-track" style="--lane-duration: ${duration}s;">
              ${loopCards}
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  el.laneRows.innerHTML = rows || `<p class="comment">${escapeHtml(text.empty)}</p>`;
  bindOpenHandlers(el.laneRows.querySelectorAll(".lane-card"));
}

function laneCardHtml(item) {
  const title = localText(item.title);

  return `
    <button class="lane-card" data-id="${item.id}" type="button" aria-label="${escapeHtml(title)}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" loading="lazy" />
      <span class="lane-title">${escapeHtml(title)}</span>
    </button>
  `;
}

function renderGrid(filteredItems) {
  const text = i18n[state.language];
  el.resultMeta.textContent = text.result(filteredItems.length);

  if (!filteredItems.length) {
    el.cardGrid.innerHTML = `<p class="comment">${escapeHtml(text.empty)}</p>`;
    return;
  }

  el.cardGrid.innerHTML = filteredItems
    .map((item) => {
      const title = localText(item.title);
      const comment = localText(item.comment);
      const creatorName = item.category === "movie" ? item.director : item.author;

      return `
        <article class="card" data-id="${item.id}" tabindex="0" role="button" aria-label="${escapeHtml(title)}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(title)}" loading="lazy" />
          <div class="card-body">
            <span class="badge ${item.category}">${text.category[item.category]}</span>
            <h3>${escapeHtml(title)} (${item.year})</h3>
            <p class="meta-line">${text.creator[item.category]}: ${escapeHtml(creatorName)}</p>
            <p class="comment">${escapeHtml(comment)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  bindOpenHandlers(el.cardGrid.querySelectorAll(".card"));
}

function bindOpenHandlers(nodes) {
  [...nodes].forEach((node) => {
    const open = () => openModal(node.dataset.id, node);
    node.addEventListener("click", open);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function openModal(id, triggerNode) {
  const item = state.items.find((v) => v.id === id);
  if (!item) return;

  const text = i18n[state.language];
  const title = localText(item.title);
  const description = localText(item.description);
  const quote = localText(item.quote);
  const creatorName = item.category === "movie" ? item.director : item.author;

  state.modalTrigger = triggerNode || document.activeElement;

  el.modalImage.src = item.image;
  el.modalImage.alt = title;
  el.modalBadge.className = `badge ${item.category}`;
  el.modalBadge.textContent = text.category[item.category];
  el.modalTitle.textContent = `${title} (${item.year})`;
  el.modalMeta.textContent = `${text.creator[item.category]}: ${creatorName}`;
  el.modalDescription.textContent = description;
  el.modalQuote.textContent = quote;

  el.modal.classList.add("open");
  el.modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  el.modalClose.focus();
}

function closeModal() {
  el.modal.classList.remove("open");
  el.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (state.modalTrigger && typeof state.modalTrigger.focus === "function") {
    state.modalTrigger.focus();
  }
}

function localText(map) {
  return map[state.language] || map.ko || map.en || Object.values(map)[0] || "";
}

function makeSearchString(item) {
  return [item.title?.ko, item.title?.en, item.title?.ja, item.director, item.author]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isPixarLike(item) {
  const joined = `${item.director} ${item.title?.en} ${item.title?.ko}`.toLowerCase();
  return /pixar|docter|inside out|soul|elemental|zootopia|인사이드|소울|엘리멘탈|주토피아/.test(joined);
}

function isSequelLike(item) {
  const joined = `${item.title?.ko} ${item.title?.en} ${item.title?.ja}`.toLowerCase();
  return /( 2| ii| sequel|속편|続編)/.test(joined) || item.year >= 2024;
}

function safeRead(key, fallback, allow) {
  const value = localStorage.getItem(key);
  return allow.includes(value) ? value : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
