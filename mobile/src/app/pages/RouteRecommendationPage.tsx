import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardHeader, CardTitle, CardContent } from '../components/native/Common';
import { type Route } from '../../../../shared/types/index';
import { getRoutes } from '../../services/routeService';

type Props = NativeStackScreenProps<any, 'Recommendation'>;

export default function RouteRecommendationPage({ navigation }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRoutes().then((data) => {
      setRoutes(data.slice(0, 3));
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const renderRoute = ({ item }: { item: Route }) => (
    <Pressable
      style={({ pressed }) => [{ borderRadius: 12 }, pressed && { opacity: 0.8 }]}
      onPress={() => navigation.navigate('RouteDetails', { routeId: item.id })}
    >
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: 18, fontWeight: '700' }}>{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-slate-500 mb-2">{item.description}</Text>
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] ml-1 text-center">
                <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
                Distance
              </Text>
              <Text className="text-base text-[#6b7280] ml-1 text-center">{item.distance} km</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] ml-1 text-center">
                <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                Estimated Time
              </Text>
              <Text className="text-base text-[#6b7280] ml-1 text-center">{item.estimatedTime} min</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] ml-1 text-center">
                <MaterialCommunityIcons name="arrow-up" size={16} color="#6b7280" />
                Elevation
              </Text>
              <Text className="text-base text-[#6b7280] ml-1 text-center">{item.elevation} m</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] ml-1 text-center">
                <MaterialCommunityIcons name="tree" size={16} color="#6b7280" />
                Shade
              </Text>
              <Text className="text-base text-[#6b7280] ml-1 text-center">{item.shade}%</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-base text-[#6b7280] ml-1 text-center">
                <MaterialCommunityIcons name="air-filter" size={16} color="#6b7280" />
                Air Quality
              </Text>
              <Text className="text-base text-[#6b7280] ml-1 text-center">{item.airQuality}%</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-[#444]">
              <AntDesign name="star" size={15} color="#f59e0b" />
              {item.rating} ({item.reviewCount})
            </Text>
            <Text className="text-xs text-[#1e293b] font-bold capitalize">
              {item.cyclistType}
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
      <View className="flex-row items-center mb-[12px] gap-cy-md">
        <Text className="text-2xl font-bold text-[#1e293b]">Route Recommendations</Text>
      </View>

      <Text className="mb-[14px] text-slate-500">{routes.length} routes found</Text>

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={renderRoute}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}
