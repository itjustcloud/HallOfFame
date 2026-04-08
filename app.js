const DEFAULT_LANG = "ko";
const DEFAULT_CATEGORY = "all";
const STORAGE_KEYS = {
  language: "hof_language",
  category: "hof_category",
};

const i18n = {
  ko: {
    htmlLang: "ko",
    heroEyebrow: "명예의 작품들",
    heroTitle: "HallOfFame",
    heroDesc: "영화와 책을 한 곳에서 탐색하고 기록하세요.",
    searchLabel: "검색",
    searchPlaceholder: "제목, 감독, 작가로 검색",
    category: { all: "전체", movie: "영화", book: "도서" },
    result: (count) => `총 ${count}개`,
    creator: { movie: "감독", book: "작가" },
    empty: "조건에 맞는 작품이 없습니다.",
  },
  en: {
    htmlLang: "en",
    heroEyebrow: "Hall of Great Works",
    heroTitle: "HallOfFame",
    heroDesc: "Browse standout movies and books in one place.",
    searchLabel: "Search",
    searchPlaceholder: "Search by title, director, or author",
    category: { all: "All", movie: "Movie", book: "Book" },
    result: (count) => `${count} items`,
    creator: { movie: "Director", book: "Author" },
    empty: "No items found for your filters.",
  },
  ja: {
    htmlLang: "ja",
    heroEyebrow: "殿堂入り作品",
    heroTitle: "HallOfFame",
    heroDesc: "映画と本をひとつの場所で探せます。",
    searchLabel: "検索",
    searchPlaceholder: "タイトル・監督・作家で検索",
    category: { all: "すべて", movie: "映画", book: "本" },
    result: (count) => `合計 ${count} 件`,
    creator: { movie: "監督", book: "作家" },
    empty: "条件に合う作品がありません。",
  },
};

const state = {
  items: [],
  language: safeRead(STORAGE_KEYS.language, DEFAULT_LANG, ["ko", "en", "ja"]),
  category: safeRead(STORAGE_KEYS.category, DEFAULT_CATEGORY, ["all", "movie", "book"]),
  query: "",
};

const el = {
  heroEyebrow: document.getElementById("heroEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroDesc: document.getElementById("heroDesc"),
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
    el.cardGrid.innerHTML = `<p class="comment">${error.message}</p>`;
  }
}

function bindEvents() {
  el.categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      localStorage.setItem(STORAGE_KEYS.category, state.category);
      updateActiveButtons();
      render();
    });
  });

  el.langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.language = btn.dataset.lang;
      localStorage.setItem(STORAGE_KEYS.language, state.language);
      updateStaticText();
      updateActiveButtons();
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

  const text = i18n[state.language];
  el.resultMeta.textContent = text.result(filtered.length);

  if (!filtered.length) {
    el.cardGrid.innerHTML = `<p class="comment">${text.empty}</p>`;
    return;
  }

  el.cardGrid.innerHTML = filtered
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

  [...el.cardGrid.querySelectorAll(".card")].forEach((card) => {
    const open = () => openModal(card.dataset.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function openModal(id) {
  const item = state.items.find((v) => v.id === id);
  if (!item) return;

  const text = i18n[state.language];
  const title = localText(item.title);
  const description = localText(item.description);
  const quote = localText(item.quote);
  const creatorName = item.category === "movie" ? item.director : item.author;

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
}

function closeModal() {
  el.modal.classList.remove("open");
  el.modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function localText(map) {
  return map[state.language] || map.ko || map.en || Object.values(map)[0] || "";
}

function makeSearchString(item) {
  return [
    item.title?.ko,
    item.title?.en,
    item.title?.ja,
    item.director,
    item.author,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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
