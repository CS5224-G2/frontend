import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/native/Common';

type Props = NativeStackScreenProps<any, any>;

export default function Screen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-cy-lg pt-10">
        <Text className="text-[28px] font-bold text-text-primary">Route Details</Text>
        <Text className="text-sm text-text-secondary mt-cy-sm">Page content</Text>
        <Button onPress={() => navigation.navigate("RouteFeedback")}>Route Feedback</Button>
      </View>
    </ScrollView>
  );
}
