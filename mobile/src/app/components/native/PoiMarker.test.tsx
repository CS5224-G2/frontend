import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PoiMarker from './PoiMarker';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    MaterialCommunityIcons: ({ testID }: { testID?: string }) =>
      mockReact.createElement(View, { testID }),
  };
});

const COLORS = {
  hawkerCenter: '#ea580c',
  historicSite: '#92400e',
  park: '#15803d',
  touristAttraction: '#7c3aed',
} as const;

describe('PoiMarker', () => {
  (Object.keys(COLORS) as Array<keyof typeof COLORS>).forEach((category) => {
    it(`renders the correct pin colour for ${category}`, () => {
      render(<PoiMarker category={category} />);
      const head = screen.getByTestId('poi-marker-head');
      expect(head.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: COLORS[category] }),
        ])
      );
    });
  });
});
