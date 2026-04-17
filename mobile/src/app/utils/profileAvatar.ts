import type { ImageSourcePropType } from 'react-native';

import { mockProfileAvatarUrl } from '../../../../shared/mocks/index';

const mockProfileAvatarAsset = require('../../../assets/images/mock-profile-avatar.png');

export const getProfileAvatarSource = (
  avatarUrl?: string | null,
): ImageSourcePropType | null => {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl === mockProfileAvatarUrl) {
    return mockProfileAvatarAsset;
  }

  return { uri: avatarUrl, cache: 'force-cache' };
};
