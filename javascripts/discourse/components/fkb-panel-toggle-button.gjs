import Component from "@glimmer/component";
import { action } from "@ember/object";
import { concat } from "@ember/helper";
import { i18n } from "discourse-i18n";
import DButton from "discourse/components/d-button";

export default class FKBPanelHideButton extends Component {
  get isHidden() {
    return document.body.classList.contains("fkb-panel-hidden");
  }

  @action
  toggle() {
    const fkbPanelHidden = this.isHidden;
    if (fkbPanelHidden) {
      localStorage.setItem("fkb_panel_hidden", "false");
      document.body.classList.remove("fkb-panel-hidden");
    } else {
      localStorage.setItem("fkb_panel_hidden", "true");
      document.body.classList.add("fkb-panel-hidden");
    }
  }

  <template>
    <DButton
      @class={{concat "btn-default btn no-text btn-icon fkb-panel-toggle " @class}}
      @action={{this.toggle}}
      @icon="chevron-right"
      @title={{i18n (themePrefix "sidebar.toggle")}}
      @ariaLabel={{i18n (themePrefix "sidebar.toggle")}}
      @ariaPressed={{this.isHidden}}
    />
  </template>
}
