import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/native/Common';

type Props = NativeStackScreenProps<any, any>;

export default function Screen({ navigation }: Props) {
  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-black">
      <View className="p-cy-lg pt-10">
        <Text className="text-[28px] font-bold text-text-primary dark:text-slate-100">Route Details</Text>
        <Text className="text-sm text-text-secondary dark:text-slate-400 mt-cy-sm">Page content</Text>
        <Button onPress={() => navigation.navigate("RouteFeedback")}>Route Feedback</Button>
      </View>
    </ScrollView>
  );
}
