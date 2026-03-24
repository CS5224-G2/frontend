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

export default function BusinessDashboard() {
  const { logout } = useContext(AuthContext);

  const stats = [
    { label: 'Active Sponsors', value: '8', icon: 'handshake' },
    { label: 'Data Points', value: '45.2k', icon: 'database' },
    { label: 'Total Spent', value: '$3,420', icon: 'cart-outline' },
    { label: 'Reach', value: '8.5k users', icon: 'trending-up' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Business Portal</Text>
          <Text style={styles.headerSubtitle}>Manage Sponsors & Data Insights</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color="#6366f1" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color="#6366f1" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>B2B Services</Text>
        <View style={styles.actionsContainer}>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="account-group" size={24} color="#64748b" />
            <Text style={styles.actionText}>Manage Sponsorships</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="shopping-outline" size={24} color="#64748b" />
            <Text style={styles.actionText}>Purchase Market Data</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
          <Pressable style={styles.actionItem}>
            <MaterialCommunityIcons name="chart-areaspline" size={24} color="#64748b" />
            <Text style={styles.actionText}>Campaign Analytics</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </Pressable>
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Unlock Advanced Insights</Text>
          <Text style={styles.promoDesc}>Get access to real-time heatmaps and user behavior patterns to optimize your campaigns.</Text>
          <Pressable style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Explore Premium Data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  logoutText: {
    marginLeft: 6,
    color: '#6366f1',
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
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 10px 15px -3px rgb(99 102 241 / 0.1)',
      },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f5f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 16,
  },
  actionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    overflow: 'hidden',
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
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
  promoCard: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
  },
  promoTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  promoDesc: {
    color: '#e0e7ff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  promoButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  promoButtonText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 15,
  },
});
