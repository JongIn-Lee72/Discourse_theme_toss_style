import { apiInitializer } from "discourse/lib/api";

let observer;

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
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
    
    // Find the search bar form or input wrapper
    let searchBar = document.querySelector(".welcome-banner form") ||
                    document.querySelector(".welcome-banner-wrap form") ||
                    document.querySelector(".welcome-banner-container form") ||
                    document.querySelector(".welcome-banner__wrap form") ||
                    document.querySelector(".custom-search-banner-wrap form") || 
                    document.querySelector(".search-menu-container form") || 
                    (document.querySelector(".search-input") ? document.querySelector(".search-input").closest("form") : null) ||
                    document.querySelector(".search-menu-container") || 
                    document.querySelector(".search-input");

    // Fallback: search for any form that has search inputs and is not already inside navigation controls or unified search bar
    if (!searchBar) {
      const allForms = document.querySelectorAll("form");
      for (const form of allForms) {
        if (!form.closest(".navigation-controls") && !form.closest(".unified-search-bar") && 
            (form.querySelector(".search-input") || form.querySelector("input#search-term") || form.classList.contains("search-menu-container"))) {
          searchBar = form;
          break;
        }
      }
    }

    // Find the separate search icon button
    let searchIcon = document.querySelector(".welcome-banner .search-icon") ||
                     document.querySelector(".welcome-banner-wrap .search-icon") ||
                     document.querySelector(".welcome-banner-container .search-icon") ||
                     document.querySelector(".welcome-banner__wrap .search-icon") ||
                     document.querySelector(".custom-search-banner-wrap .search-icon") || 
                     document.querySelector("#main-outlet .search-icon");

    // Fallback: search for any .search-icon element not already inside navigation controls or unified search bar
    if (!searchIcon) {
      const allSearchIcons = document.querySelectorAll(".search-icon");
      for (const icon of allSearchIcons) {
        if (!icon.closest(".navigation-controls") && !icon.closest(".unified-search-bar")) {
          searchIcon = icon;
          break;
        }
      }
    }

    if (searchBar) {
      if (!unifiedSearchBar.contains(searchBar)) {
        unifiedSearchBar.appendChild(searchBar);
      }
      searchBar.classList.add("relocated-search-form");
    }

    if (searchIcon) {
      if (!unifiedSearchBar.contains(searchIcon)) {
        unifiedSearchBar.appendChild(searchIcon);
      }
      searchIcon.classList.add("relocated-search-icon");
    }

    // Relocate autocomplete suggestions and tips inside the unified search bar container (scoped to when search is focused)
    const searchInput = unifiedSearchBar ? unifiedSearchBar.querySelector("input") : null;
    const isSearchFocused = document.activeElement && searchInput && (document.activeElement === searchInput || unifiedSearchBar.contains(document.activeElement));
    if (isSearchFocused) {
      const popups = document.querySelectorAll("body > .popup-input-tip, body > .autocomplete, body > .ac-menu, body > .ac-results, body > .ac-wrap");
      popups.forEach((popup) => {
        if (unifiedSearchBar && !unifiedSearchBar.contains(popup)) {
          unifiedSearchBar.appendChild(popup);
        }
      });
    }

    if ((searchBar || searchIcon) && !navContainer.contains(searchWrapper)) {
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
    observer = new MutationObserver((mutations) => {
      relocateSearch();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
});
