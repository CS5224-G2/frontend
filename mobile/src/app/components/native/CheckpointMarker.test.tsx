import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CheckpointMarker from './CheckpointMarker';

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    MaterialCommunityIcons: ({ testID }: { testID?: string }) =>
      mockReact.createElement(View, { testID }),
  };
});

describe('CheckpointMarker', () => {
  it('does not show checkmark when unvisited', () => {
    render(<CheckpointMarker visited={false} />);
    expect(screen.queryByTestId('checkpoint-marker-check')).toBeNull();
  });

  it('shows checkmark when visited', () => {
    render(<CheckpointMarker visited={true} />);
    expect(screen.getByTestId('checkpoint-marker-check')).toBeTruthy();
  });

  it('uses blue core when unvisited', () => {
    render(<CheckpointMarker visited={false} />);
    const inner = screen.getByTestId('checkpoint-marker-inner');
    expect(inner.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#2563eb' }),
      ])
    );
  });

  it('uses green core when visited', () => {
    render(<CheckpointMarker visited={true} />);
    const inner = screen.getByTestId('checkpoint-marker-inner');
    expect(inner.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#16a34a' }),
      ])
    );
  });
});
