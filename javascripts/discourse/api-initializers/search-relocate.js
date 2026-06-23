import { apiInitializer } from "discourse/lib/api";

let observer;

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    const navControls = document.querySelector(".navigation-controls");
    if (!navControls) return;
    
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

    // Fallback: search for any form that has search inputs and is not already inside navigation controls
    if (!searchBar) {
      const allForms = document.querySelectorAll("form");
      for (const form of allForms) {
        if (!form.closest(".navigation-controls") && (form.querySelector(".search-input") || form.querySelector("input#search-term") || form.classList.contains("search-menu-container"))) {
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

    // Fallback: search for any .search-icon element not already inside navigation controls
    if (!searchIcon) {
      const allSearchIcons = document.querySelectorAll(".search-icon");
      for (const icon of allSearchIcons) {
        if (!icon.closest(".navigation-controls")) {
          searchIcon = icon;
          break;
        }
      }
    }

    if (searchBar) {
      if (!navControls.contains(searchBar)) {
        navControls.insertBefore(searchBar, navControls.firstChild);
      }
      searchBar.classList.add("relocated-search-form");
    }

    if (searchIcon) {
      if (!navControls.contains(searchIcon)) {
        // Insert right after the searchBar
        if (searchBar && searchBar.nextSibling) {
          navControls.insertBefore(searchIcon, searchBar.nextSibling);
        } else {
          navControls.appendChild(searchIcon);
        }
      }
      searchIcon.classList.add("relocated-search-icon");
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
