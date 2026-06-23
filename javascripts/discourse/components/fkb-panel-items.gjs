import Component from "@glimmer/component";
import DButton from "discourse/components/d-button";
import { i18n } from "discourse-i18n";

export default class FkbPanelItems extends Component {
  
  get fkbPanelItems() {
    return (settings.fkb_panel_items || []).map(item => {
      const key = item.title.toLowerCase().replace(/\s+/g, "_");
      return {
        ...item,
        translationPath: `sidebar.items.${key}`
      };
    });
  }
  
  <template>
    {{#each this.fkbPanelItems as |fi|}}
      <DButton
        @translatedTitle={{i18n (themePrefix fi.translationPath)}}
        @class="fkb-link btn-default btn no-text btn-icon"
        @href={{fi.link}}
        @icon={{fi.icon}}
      />
    {{/each}}
  </template>
}

