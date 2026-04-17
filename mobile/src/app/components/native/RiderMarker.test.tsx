import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RiderMarker from './RiderMarker';

jest.mock('../../utils/profileAvatar', () => ({
  getProfileAvatarSource: (url: string | null | undefined) =>
    url ? { uri: url } : null,
}));

describe('RiderMarker', () => {
  it('renders an Image when avatarUrl is provided', () => {
    render(
      <RiderMarker
        avatarUrl="https://example.com/photo.jpg"
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    expect(screen.getByTestId('rider-marker-image')).toBeTruthy();
    expect(screen.queryByTestId('rider-marker-initials')).toBeNull();
  });

  it('renders initials text when avatarUrl is null', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    expect(screen.getByTestId('rider-marker-initials')).toBeTruthy();
    expect(screen.queryByTestId('rider-marker-image')).toBeNull();
  });

  it('applies avatarColor as background when showing initials', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#7c3aed"
        initials="AJ"
      />
    );
    const fallback = screen.getByTestId('rider-marker-fallback');
    expect(fallback.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#7c3aed' }),
      ])
    );
  });

  it('renders the initials text value', () => {
    render(
      <RiderMarker
        avatarUrl={null}
        avatarColor="#1D4ED8"
        initials="TK"
      />
    );
    expect(screen.getByText('TK')).toBeTruthy();
  });
});
