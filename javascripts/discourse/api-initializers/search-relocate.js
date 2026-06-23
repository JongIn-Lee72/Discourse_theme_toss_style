import { apiInitializer } from "discourse/lib/api";

let observer;

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    const navContainer = document.querySelector(".navigation-container");
    if (!navContainer) return;
    
    // Find or create the outer search wrapper (transparent, full-width row container)
    let searchWrapper = document.querySelector(".relocated-search-wrapper");
    if (!searchWrapper) {
      searchWrapper = document.createElement("div");
      searchWrapper.className = "relocated-search-wrapper";
    }

    // Find or create the inner unified search bar (the 36px pill-shaped visible bar)
    let unifiedSearchBar = searchWrapper.querySelector(".unified-search-bar");
    if (!unifiedSearchBar) {
      unifiedSearchBar = document.createElement("div");
      unifiedSearchBar.className = "unified-search-bar";
      searchWrapper.appendChild(unifiedSearchBar);
    }

    // Find or create the dropdown anchor (sits below the pill, holds dropdown results)
    let dropdownAnchor = searchWrapper.querySelector(".search-dropdown-anchor");
    if (!dropdownAnchor) {
      dropdownAnchor = document.createElement("div");
      dropdownAnchor.className = "search-dropdown-anchor";
      searchWrapper.appendChild(dropdownAnchor);
    }
    
    // --- Locate the search form/input ---
    // Try to find the form element containing the search input
    let searchForm = null;
    let searchMenuContainer = null;

    // First, check if form is already relocated
    searchForm = unifiedSearchBar.querySelector("form.relocated-search-form");

    if (!searchForm) {
      // Try various Discourse banner selectors for the form
      searchForm = document.querySelector(".welcome-banner form") ||
                   document.querySelector(".welcome-banner-wrap form") ||
                   document.querySelector(".welcome-banner-container form") ||
                   document.querySelector(".welcome-banner__wrap form") ||
                   document.querySelector(".custom-search-banner-wrap form");

      // Try search-menu-container's inner form (NOT the container itself!)
      if (!searchForm) {
        searchMenuContainer = document.querySelector("#main-outlet .search-menu-container:not(.relocated-search-form)") ||
                              document.querySelector(".welcome-banner .search-menu-container") ||
                              document.querySelector(".welcome-banner-wrap .search-menu-container") ||
                              document.querySelector(".custom-search-banner-wrap .search-menu-container");
        if (searchMenuContainer) {
          searchForm = searchMenuContainer.querySelector("form");
        }
      }

      // Try to find a search-input wrapper and its parent form
      if (!searchForm) {
        const searchInput = document.querySelector("#main-outlet .search-input:not(.unified-search-bar .search-input)");
        if (searchInput) {
          searchForm = searchInput.closest("form");
          if (!searchForm) {
            searchForm = searchInput; // Use .search-input itself if no form wraps it
          }
        }
      }

      // Final fallback: look for any form with a search input not already relocated
      if (!searchForm) {
        const allForms = document.querySelectorAll("form");
        for (const form of allForms) {
          if (!form.closest(".navigation-controls") && !form.closest(".unified-search-bar") && 
              (form.querySelector(".search-input") || form.querySelector("input#search-term"))) {
            searchForm = form;
            break;
          }
        }
      }
    }

    // --- Locate the search icon button ---
    let searchIcon = document.querySelector(".welcome-banner .search-icon") ||
                     document.querySelector(".welcome-banner-wrap .search-icon") ||
                     document.querySelector(".welcome-banner-container .search-icon") ||
                     document.querySelector(".welcome-banner__wrap .search-icon") ||
                     document.querySelector(".custom-search-banner-wrap .search-icon") || 
                     document.querySelector("#main-outlet .search-icon:not(.unified-search-bar .search-icon)");

    // Fallback: search for any .search-icon not already inside navigation controls or unified search bar
    if (!searchIcon) {
      const allSearchIcons = document.querySelectorAll(".search-icon");
      for (const icon of allSearchIcons) {
        if (!icon.closest(".navigation-controls") && !icon.closest(".unified-search-bar")) {
          searchIcon = icon;
          break;
        }
      }
    }

    // --- Move ONLY the input-related elements into the pill bar ---
    if (searchForm) {
      if (!unifiedSearchBar.contains(searchForm)) {
        unifiedSearchBar.appendChild(searchForm);
      }
      searchForm.classList.add("relocated-search-form");
    }

    if (searchIcon) {
      if (!unifiedSearchBar.contains(searchIcon)) {
        unifiedSearchBar.appendChild(searchIcon);
      }
      searchIcon.classList.add("relocated-search-icon");
    }

    // --- Move dropdown results OUTSIDE the pill, into the dropdown anchor ---
    // This is the KEY fix: results/dropdowns must NOT be inside the 36px pill
    const moveDropdownsOutOfPill = () => {
      // Find any .results, .search-menu-initial-options, .menu-panel-results 
      // that are INSIDE the unified search bar and move them to the dropdown anchor
      const dropsInsidePill = unifiedSearchBar.querySelectorAll(
        ".results, .search-menu-initial-options, .menu-panel-results, .search-menu-assistant"
      );
      dropsInsidePill.forEach((drop) => {
        if (!dropdownAnchor.contains(drop)) {
          dropdownAnchor.appendChild(drop);
        }
      });

      // Also catch any popups/autocomplete that might have ended up inside the pill
      const popupsInsidePill = unifiedSearchBar.querySelectorAll(
        ".popup-input-tip, .autocomplete, .ac-menu, .ac-results, .ac-wrap"
      );
      popupsInsidePill.forEach((popup) => {
        if (!dropdownAnchor.contains(popup)) {
          dropdownAnchor.appendChild(popup);
        }
      });
    };

    moveDropdownsOutOfPill();

    // Insert the wrapper into the navigation container
    if ((searchForm || searchIcon) && !navContainer.contains(searchWrapper)) {
      navContainer.insertBefore(searchWrapper, navContainer.firstChild);
    }
  };

  api.onPageChange(() => {
    relocateSearch();
    
    // Disconnect old observer if it exists
    if (observer) {
      observer.disconnect();
    }

    // Watch for dynamic DOM insertions continuously
    observer = new MutationObserver(() => {
      relocateSearch();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
});
