import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.8.0", (api) => {
  // 최신 Discourse 호환성을 위해 레거시 modifyClass 배너 로직 비활성화
});
