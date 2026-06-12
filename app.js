(function () {
  const lanes = ["全部", "对抗路", "打野", "中路", "发育路", "游走"];
  const state = { query: "", lane: "全部" };

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function collectGuideText(hero) {
    return [
      hero.name,
      ...(hero.roles || []),
      ...(hero.lanes || []),
      ...(hero.tags || []),
      hero.difficulty,
      ...Object.values(hero.guide || {}),
    ].join(" ");
  }

  function filterHeroes(heroes, query, lane) {
    const keyword = normalize(query);
    const laneFiltered = heroes.filter((hero) => !lane || lane === "全部" || hero.lanes.includes(lane));
    if (!keyword) return laneFiltered;

    const exactNameMatches = laneFiltered.filter((hero) => normalize(hero.name) === keyword);
    if (exactNameMatches.length > 0) return exactNameMatches;

    return laneFiltered.filter((hero) => normalize(collectGuideText(hero)).includes(keyword));
  }

  function createOfficialSearchUrl(heroName) {
    return `https://pvp.qq.com/web201605/search.shtml?keyword=${encodeURIComponent(`${heroName} 王者荣耀 攻略`)}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderLaneFilters() {
    const container = document.getElementById("laneFilters");
    if (!container) return;
    container.innerHTML = lanes
      .map((lane) => `<button class="chip ${state.lane === lane ? "is-active" : ""}" type="button" data-lane="${lane}">${lane}</button>`)
      .join("");
    container.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.lane = button.dataset.lane;
        render();
      });
    });
  }

  function renderHeroCard(hero) {
    return `
      <article class="hero-card" data-hero-id="${hero.id}" tabindex="0" aria-label="查看${escapeHtml(hero.name)}攻略">
        <div class="hero-card__avatar">
          <img src="${hero.avatar}" alt="${escapeHtml(hero.name)}头像" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.hidden=false;">
          <span hidden>${escapeHtml(hero.name.slice(0, 1))}</span>
        </div>
        <div class="hero-card__body">
          <div class="hero-card__top">
            <h2>${escapeHtml(hero.name)}</h2>
            <span class="status">${hero.guideStatus === "complete" ? "完整攻略" : "官方查询"}</span>
          </div>
          <p>${hero.roles.join(" / ")} · ${hero.lanes.join(" / ")} · 难度 ${hero.difficulty}</p>
          <div class="tag-row">${hero.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
      </article>
    `;
  }

  function renderHeroGrid(heroes) {
    const grid = document.getElementById("heroGrid");
    const count = document.getElementById("resultCount");
    const empty = document.getElementById("emptyState");
    if (!grid || !count || !empty) return;

    count.textContent = `${heroes.length} 个结果`;
    grid.innerHTML = heroes.map(renderHeroCard).join("");
    empty.hidden = heroes.length > 0;

    grid.querySelectorAll(".hero-card").forEach((card) => {
      const open = () => openHero(card.dataset.heroId);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function renderGuideSection(title, body) {
    return `<section class="guide-section"><h3>${title}</h3><p>${escapeHtml(body)}</p></section>`;
  }

  function openHero(heroId) {
    const hero = window.HEROES.find((item) => item.id === heroId);
    const dialog = document.getElementById("heroDialog");
    const detail = document.getElementById("heroDetail");
    if (!hero || !dialog || !detail) return;

    const guide = hero.guide;
    detail.innerHTML = `
      <div class="detail-hero">
        <div class="detail-hero__avatar">
          <img src="${hero.avatar}" alt="${escapeHtml(hero.name)}头像" onerror="this.style.display='none'; this.nextElementSibling.hidden=false;">
          <span hidden>${escapeHtml(hero.name.slice(0, 1))}</span>
        </div>
        <div>
          <p class="eyebrow">${hero.roles.join(" / ")} · ${hero.lanes.join(" / ")}</p>
          <h2>${escapeHtml(hero.name)}</h2>
          <p class="detail-tags">${hero.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</p>
        </div>
      </div>
      <div class="guide-grid">
        ${renderGuideSection("定位", guide.positioning)}
        ${renderGuideSection("推荐分路", guide.recommendedLane)}
        ${renderGuideSection("技能要点", guide.skillPoints)}
        ${renderGuideSection("出装思路", guide.build)}
        ${renderGuideSection("铭文思路", guide.arcana)}
        ${renderGuideSection("召唤师技能", guide.summonerSpell)}
        ${renderGuideSection("常用连招", guide.combos)}
        ${renderGuideSection("对线打法", guide.laning)}
        ${renderGuideSection("团战打法", guide.teamFight)}
        ${renderGuideSection("克制关系", guide.counters)}
        ${renderGuideSection("被克制关系", guide.counteredBy)}
        ${renderGuideSection("新手提醒", guide.tips)}
      </div>
      <div class="official-actions">
        <a href="${hero.officialLinks.website || createOfficialSearchUrl(hero.name)}" target="_blank" rel="noreferrer">官网查询</a>
        <a href="${hero.officialLinks.camp}" target="_blank" rel="noreferrer">王者营地</a>
      </div>
    `;

    dialog.showModal();
    document.body.classList.add("has-dialog");
  }

  function closeDialog() {
    const dialog = document.getElementById("heroDialog");
    if (!dialog) return;
    dialog.close();
    document.body.classList.remove("has-dialog");
  }

  function render() {
    renderLaneFilters();
    renderHeroGrid(filterHeroes(window.HEROES || [], state.query, state.lane));
  }

  function boot() {
    const search = document.getElementById("heroSearch");
    const clearButton = document.getElementById("clearSearch");
    const closeButton = document.getElementById("closeDialog");
    const dialog = document.getElementById("heroDialog");

    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value;
        render();
      });
    }

    if (clearButton && search) {
      clearButton.addEventListener("click", () => {
        search.value = "";
        state.query = "";
        search.focus();
        render();
      });
    }

    if (closeButton) closeButton.addEventListener("click", closeDialog);
    if (dialog) {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog();
      });
      dialog.addEventListener("close", () => document.body.classList.remove("has-dialog"));
    }

    render();
  }

  window.filterHeroes = filterHeroes;
  window.createOfficialSearchUrl = createOfficialSearchUrl;
  window.openHeroGuide = openHero;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
