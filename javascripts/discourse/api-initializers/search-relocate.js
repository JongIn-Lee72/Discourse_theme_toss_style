import { apiInitializer } from "discourse/lib/api";

let observer;

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    const navContainer = document.querySelector(".navigation-container");
    if (!navContainer) return;
    
    // Find or create the search wrapper
    let searchWrapper = document.querySelector(".relocated-search-wrapper");
    if (!searchWrapper) {
      searchWrapper = document.createElement("div");
      searchWrapper.className = "relocated-search-wrapper";
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

    // Fallback: search for any form that has search inputs and is not already inside navigation controls or search wrapper
    if (!searchBar) {
      const allForms = document.querySelectorAll("form");
      for (const form of allForms) {
        if (!form.closest(".navigation-controls") && !form.closest(".relocated-search-wrapper") && 
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

    // Fallback: search for any .search-icon element not already inside navigation controls or search wrapper
    if (!searchIcon) {
      const allSearchIcons = document.querySelectorAll(".search-icon");
      for (const icon of allSearchIcons) {
        if (!icon.closest(".navigation-controls") && !icon.closest(".relocated-search-wrapper")) {
          searchIcon = icon;
          break;
        }
      }
    }

    if (searchBar) {
      if (!searchWrapper.contains(searchBar)) {
        searchWrapper.appendChild(searchBar);
      }
      searchBar.classList.add("relocated-search-form");
    }

    if (searchIcon) {
      if (!searchWrapper.contains(searchIcon)) {
        searchWrapper.appendChild(searchIcon);
      }
      searchIcon.classList.add("relocated-search-icon");
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
