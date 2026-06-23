import Component from "@glimmer/component";
import { htmlSafe } from "@ember/template";
import { gt } from "truth-helpers";
import concatClass from "discourse/helpers/concat-class";
import icon from "discourse/helpers/d-icon";
import number from "discourse/helpers/number";
import UserLink from "discourse/components/user-link";
import avatar from "discourse/helpers/avatar";
import formatDate from "discourse/helpers/format-date";
import dirSpan from "discourse/helpers/dir-span";
import replaceEmoji from "discourse/helpers/replace-emoji";
import i18n from "discourse-common/helpers/i18n";
import discourseTags from "discourse/helpers/discourse-tags";

export default class TliMiddleSection extends Component {
  
  get topic() {
    return this.args.outletArgs.topic;
  }

  get topicBackgroundStyle() {
    return htmlSafe(`background-image: url(${this.topic.image_url})`);
  }

  <template>
    <div class="tli-middle-section">
      {{#if this.topic.hasExcerpt}}
        <div class="topic-excerpt">
          <a href={{this.topic.url}} class="topic-excerpt-link">
            {{dirSpan this.topic.escapedExcerpt htmlSafe="true"}}
            {{#if this.topic.excerptTruncated}}
              <span class="topic-excerpt-more">{{i18n "read_more"}}</span>
            {{/if}}
          </a>
        </div>
      {{/if}}
      {{#if this.topic.image_url}}
        <a href="{{this.topic.lastUnreadUrl}}">
          <div class="topic-image">
            {{#if settings.topic_image_backdrop}}
              <div class="topic-image__backdrop" style={{this.topicBackgroundStyle}} loading="lazy"></div>
            {{/if}}
            <img src="{{this.topic.image_url}}" class="topic-image__img" loading="lazy">
          </div>
        </a>
      {{/if}}
      {{discourseTags this.topic mode="list" tagsForUser=@tagsForUser}}
    </div>
  
    <div class="tli-bottom-section">
      <a href="{{this.topic.lastUnreadUrl}}" class="likes-tlist {{if (gt this.topic.like_count 0) "has-likes" "no-likes"}}" aria-label={{i18n "likes" count=this.topic.like_count}}>
        {{icon (if (gt this.topic.like_count 0) "heart" "far-heart")}}
        {{#if (gt this.topic.like_count 0)}}
          <span class="count">{{number this.topic.like_count}}</span>
        {{/if}}
      </a>

      <a href="{{this.topic.lastUnreadUrl}}" class="replies-tlist {{if (gt this.topic.replyCount 0) "has-replies" "no-replies"}}" aria-label={{i18n "replies" count=this.topic.replyCount}}>
        {{icon "far-comment"}}
        {{#if (gt this.topic.replyCount 0)}}
          <span class="count">{{number this.topic.replyCount noTitle="true"}}</span>
        {{/if}}
      </a>

      <a href="{{this.topic.lastUnreadUrl}}" class="views-tlist" aria-label={{i18n "views" count=this.topic.views}}>
        {{icon "far-eye"}}
        {{#if (gt this.topic.views 0)}}
          <span class="count">{{number this.topic.views numberKey="views_long"}}</span>
        {{/if}}
      </a>
  
      <div class="tli-bottom-right-wrapper">
        <a 
          href="{{this.topic.lastPostUrl}}"
          class={{concatClass "latest-activity-tlist" this.topic.view.likesHeat}}
        >
          {{icon "clock-rotate-left"}}
          {{formatDate this.topic.bumpedAt format="tiny" noTitle="true"~}}
        </a>

        <UserLink
          @user={{this.topic.lastPosterUser}}
          class="latest-poster-tlist"
        >
          {{avatar this.topic.lastPosterUser imageSize="tiny"}}
        </UserLink>
      </div>
    </div>
  </template>
}
