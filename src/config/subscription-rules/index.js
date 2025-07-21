import { SubscriptionType } from '@prisma/client';

const rules = {
  [SubscriptionType.FREE]: {
    customDomains: 1,
    members: 1,
    workspaces: 1,
    // 新增：数字人功能开关
    hasAvatarFeature: false,
    hasStoryFeature: true,
  },
  [SubscriptionType.STANDARD]: {
    customDomains: 3,
    members: 5,
    workspaces: 5,
    // 新增：数字人功能开关
    hasAvatarFeature: true,
    hasStoryFeature: true,
  },
  [SubscriptionType.PREMIUM]: {
    customDomains: 5,
    members: 10,
    workspaces: 10,
    // 新增：数字人功能开关
    hasAvatarFeature: true,
    hasStoryFeature: true,
  },
};

export default rules;
