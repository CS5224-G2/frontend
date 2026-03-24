import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RideHistoryPage from './RideHistoryPage';
import { AuthContext } from '../AuthContext';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View {...props} />,
  };
});

describe('RideHistoryPage', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={{ login: jest.fn(), logout: jest.fn(), isLoggedIn: true }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders correctly', () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    expect(screen.getByText('Ride History')).toBeTruthy();
    expect(screen.getByText('Total Rides')).toBeTruthy();
    expect(screen.getByText('Distance Over Time')).toBeTruthy();
    expect(screen.getByText('Recent Rides')).toBeTruthy();
  });

  it('renders summary values', () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);
    
    // Total Rides should be 3 based on mockRideHistory length
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('toggles period between Week and Month', () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);
    
    const monthButton = screen.getByText('Month');
    fireEvent.press(monthButton);
    
    // Check if summary description changes to Month
    expect(screen.getByText(/Total this month/i)).toBeTruthy();
  });
});
