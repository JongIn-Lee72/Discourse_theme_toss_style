import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  const relocateSearch = () => {
    const navControls = document.querySelector(".navigation-controls");
    const searchBar = document.querySelector(".custom-search-banner-wrap form") || 
                      document.querySelector(".search-menu-container form") || 
                      (document.querySelector(".search-input") ? document.querySelector(".search-input").closest("form") : null) ||
                      document.querySelector(".search-menu-container") || 
                      document.querySelector(".search-input");

    if (navControls && searchBar && !navControls.contains(searchBar)) {
      // Move search bar to the left of the other controls (admin dropdown / create topic)
      navControls.insertBefore(searchBar, navControls.firstChild);
    }
  };

  api.onPageChange(() => {
    relocateSearch();
    
    // Watch for dynamic DOM insertions
    const observer = new MutationObserver((mutations, obs) => {
      const navControls = document.querySelector(".navigation-controls");
      const searchBar = document.querySelector(".custom-search-banner-wrap form") || 
                        document.querySelector(".search-menu-container form") || 
                        (document.querySelector(".search-input") ? document.querySelector(".search-input").closest("form") : null) ||
                        document.querySelector(".search-menu-container") || 
                        document.querySelector(".search-input");
      if (navControls && searchBar && !navControls.contains(searchBar)) {
        relocateSearch();
        obs.disconnect();
      }
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
