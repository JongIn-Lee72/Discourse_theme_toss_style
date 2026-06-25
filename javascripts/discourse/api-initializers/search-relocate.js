import { apiInitializer } from "discourse/lib/api";

let observer = null;
let isRelocating = false;
let pendingRelocate = false;
let rafId = null;

const DROPDOWN_SELECTOR = [
  ".results",
  ".search-menu-initial-options",
  ".menu-panel-results",
  ".search-menu-assistant",
  ".popup-input-tip",
  ".autocomplete",
  ".ac-menu",
  ".ac-results",
  ".ac-wrap"
].join(", ");

const SEARCHABLE_ELEMENTS = [
  ".search-menu-container",
  ".welcome-banner",
  ".welcome-banner-wrap",
  ".welcome-banner-container",
  ".welcome-banner__wrap",
  ".custom-search-banner-wrap",
  "form",
  ".search-icon",
  "input#search-term"
].join(", ");

const moveDropdownsOutOfPill = (unifiedSearchBar, dropdownAnchor) => {
  if (!unifiedSearchBar || !dropdownAnchor) return;

  const dropsInsidePill = unifiedSearchBar.querySelectorAll(DROPDOWN_SELECTOR);
  dropsInsidePill.forEach((drop) => {
    if (!dropdownAnchor.contains(drop)) {
      dropdownAnchor.appendChild(drop);
    }
  });
};

const adjustDropdownForKeyboard = () => {
  const anchor = document.querySelector(".search-dropdown-anchor");
  if (!anchor) return;

  const vv = window.visualViewport;
  if (!vv) return;

  const bottom = vv.height + vv.offsetTop;
  const anchorRect = anchor.getBoundingClientRect();
  const maxHeight = bottom - anchorRect.top - 8;

  if (anchorRect.bottom > bottom && maxHeight > 120) {
    anchor.style.maxHeight = `${maxHeight}px`;
    anchor.style.overflowY = "auto";
  } else {
    anchor.style.maxHeight = "";
    anchor.style.overflowY = "";
  }
};

const disconnectObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

const setupObserver = (navContainer, relocateSearch) => {
  disconnectObserver();
  if (!navContainer) return;

  observer = new MutationObserver((mutations) => {
    const hasRelevantChange = mutations.some((mutation) => {
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        return (
          node.matches?.(SEARCHABLE_ELEMENTS) ||
          node.querySelector?.(SEARCHABLE_ELEMENTS)
        );
      });
    });

    if (hasRelevantChange) {
      relocateSearch();
    }
  });

  observer.observe(navContainer, { childList: true, subtree: true });
};

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    if (isRelocating) {
      pendingRelocate = true;
      return;
    }

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      isRelocating = true;
      pendingRelocate = false;
      rafId = null;

      try {
        const navContainer = document.querySelector(".navigation-container");
        if (!navContainer) return;

        // Find or create the outer search wrapper
        let searchWrapper = document.querySelector(".relocated-search-wrapper");
        if (!searchWrapper) {
          searchWrapper = document.createElement("div");
          searchWrapper.className = "relocated-search-wrapper";
        }

        // Find or create the inner unified search bar
        let unifiedSearchBar = searchWrapper.querySelector(".unified-search-bar");
        if (!unifiedSearchBar) {
          unifiedSearchBar = document.createElement("div");
          unifiedSearchBar.className = "unified-search-bar";
          searchWrapper.appendChild(unifiedSearchBar);
        }

        // Find or create the dropdown anchor
        let dropdownAnchor = searchWrapper.querySelector(".search-dropdown-anchor");
        if (!dropdownAnchor) {
          dropdownAnchor = document.createElement("div");
          dropdownAnchor.className = "search-dropdown-anchor";
          searchWrapper.appendChild(dropdownAnchor);
        }

        // --- Locate the search form/input ---
        let searchForm = unifiedSearchBar.querySelector("form.relocated-search-form");

        if (!searchForm) {
          searchForm =
            document.querySelector(".welcome-banner form") ||
            document.querySelector(".welcome-banner-wrap form") ||
            document.querySelector(".welcome-banner-container form") ||
            document.querySelector(".welcome-banner__wrap form") ||
            document.querySelector(".custom-search-banner-wrap form");

          let searchMenuContainer = null;
          if (!searchForm) {
            searchMenuContainer =
              document.querySelector("#main-outlet .search-menu-container:not(.relocated-search-form)") ||
              document.querySelector(".welcome-banner .search-menu-container") ||
              document.querySelector(".welcome-banner-wrap .search-menu-container") ||
              document.querySelector(".custom-search-banner-wrap .search-menu-container");
            if (searchMenuContainer) {
              searchForm = searchMenuContainer.querySelector("form");
            }
          }

          if (!searchForm) {
            const searchInput = document.querySelector(
              "#main-outlet .search-input:not(.unified-search-bar .search-input)"
            );
            if (searchInput) {
              searchForm = searchInput.closest("form");
              if (!searchForm) {
                searchForm = searchInput;
              }
            }
          }

          if (!searchForm) {
            const allForms = document.querySelectorAll("form");
            for (const form of allForms) {
              if (
                !form.closest(".navigation-controls") &&
                !form.closest(".unified-search-bar") &&
                (form.querySelector(".search-input") || form.querySelector("input#search-term"))
              ) {
                searchForm = form;
                break;
              }
            }
          }
        }

        // --- Locate the search icon button ---
        let searchIcon =
          document.querySelector(".welcome-banner .search-icon") ||
          document.querySelector(".welcome-banner-wrap .search-icon") ||
          document.querySelector(".welcome-banner-container .search-icon") ||
          document.querySelector(".welcome-banner__wrap .search-icon") ||
          document.querySelector(".custom-search-banner-wrap .search-icon") ||
          document.querySelector("#main-outlet .search-icon:not(.unified-search-bar .search-icon)");

        if (!searchIcon) {
          const allSearchIcons = document.querySelectorAll(".search-icon");
          for (const icon of allSearchIcons) {
            if (!icon.closest(".navigation-controls") && !icon.closest(".unified-search-bar")) {
              searchIcon = icon;
              break;
            }
          }
        }

        // --- Move input-related elements into the pill bar ---
        if (searchForm && !unifiedSearchBar.contains(searchForm)) {
          unifiedSearchBar.appendChild(searchForm);
          searchForm.classList.add("relocated-search-form");
        }

        if (searchIcon && !unifiedSearchBar.contains(searchIcon)) {
          unifiedSearchBar.appendChild(searchIcon);
          searchIcon.classList.add("relocated-search-icon");
        }

        // --- Move dropdown results OUTSIDE the pill ---
        moveDropdownsOutOfPill(unifiedSearchBar, dropdownAnchor);

        // Insert the wrapper into the navigation container
        if ((searchForm || searchIcon) && !navContainer.contains(searchWrapper)) {
          navContainer.insertBefore(searchWrapper, navContainer.firstChild);
          setupObserver(navContainer, relocateSearch);
        }
      } finally {
        isRelocating = false;
        if (pendingRelocate) {
          pendingRelocate = false;
          relocateSearch();
        }
      }
    });
  };

  // --- Run on every page change ---
  api.onPageChange(() => {
    relocateSearch();
  });

  // --- Mobile keyboard / viewport resize handling ---
  const viewport = window.visualViewport;
  if (viewport) {
    viewport.addEventListener("resize", adjustDropdownForKeyboard);
    viewport.addEventListener("scroll", adjustDropdownForKeyboard);
  }
  window.addEventListener("resize", adjustDropdownForKeyboard);
});
