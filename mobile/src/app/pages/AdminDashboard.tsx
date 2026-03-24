import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);

  const stats = [
    { label: 'Total Rides', value: '1,280', icon: 'bike' },
    { label: 'Active Users', value: '452', icon: 'account-group' },
    { label: 'Revenue', value: '$12.4k', icon: 'currency-usd' },
    { label: 'Reports', value: '12', icon: 'alert-circle' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>System Overview & Management</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="account-search" size={24} color="#64748b" />
            <Text style={styles.actionText}>User Management</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="map-marker-radius" size={24} color="#64748b" />
            <Text style={styles.actionText}>Route Optimization</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="chart-bar" size={24} color="#64748b" />
            <Text style={styles.actionText}>System Reports</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  logoutText: {
    marginLeft: 6,
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  actionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
});
