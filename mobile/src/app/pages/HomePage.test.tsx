import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import HomeScreen from './HomePage';
import { AuthContext } from '../AuthContext';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  FontAwesome5: 'FontAwesome5',
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('HomePage', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={{ login: jest.fn(), logout: jest.fn(), isLoggedIn: true }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders correctly', () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    expect(screen.getByText('CycleLink')).toBeTruthy();
    expect(screen.getByText('Discover Routes')).toBeTruthy();
    expect(screen.getByText('Create Custom Route')).toBeTruthy();
  });

  it('navigates to RouteConfig when create button is pressed', () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);
    
    const createButton = screen.getByText('Create Custom Route');
    fireEvent.press(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('RouteConfig');
  });

  it('renders recommended routes', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);
    
    // Check if at least one route card is rendered (mockRoutes has data)
    expect(await screen.findByText(/Riverside Park Loop/i)).toBeTruthy();
  });
});
