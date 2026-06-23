import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    const navControls = document.querySelector(".navigation-controls");
    
    // Find the search bar form or input wrapper
    const searchBar = document.querySelector(".custom-search-banner-wrap form") || 
                      document.querySelector(".search-menu-container form") || 
                      (document.querySelector(".search-input") ? document.querySelector(".search-input").closest("form") : null) ||
                      document.querySelector(".search-menu-container") || 
                      document.querySelector(".search-input");

    // Find the separate search icon button
    const searchIcon = document.querySelector(".custom-search-banner-wrap .search-icon") || 
                       document.querySelector("#main-outlet .search-icon");

    if (navControls) {
      if (searchBar && !navControls.contains(searchBar)) {
        navControls.insertBefore(searchBar, navControls.firstChild);
      }
      if (searchIcon && !navControls.contains(searchIcon)) {
        // Insert right after the searchBar (which is currently the first child)
        if (searchBar && searchBar.nextSibling) {
          navControls.insertBefore(searchIcon, searchBar.nextSibling);
        } else {
          navControls.appendChild(searchIcon);
        }
      }
    }
  };

  api.onPageChange(() => {
    relocateSearch();
    
    // Watch for dynamic DOM insertions
    const observer = new MutationObserver((mutations, obs) => {
      relocateSearch();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup observer after 5 seconds to prevent memory leak
    setTimeout(() => {
      observer.disconnect();
    }, 5000);
  });
});
