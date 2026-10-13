import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import {Feather} from "@expo/vector-icons"
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/components/ThemeProvider';

const useNativeTabs = false

export default function TabLayout() {
    const { t } = useTranslation()
    const colors = useThemeColors()
    if (useNativeTabs) {
  return (
    <NativeTabs
        backgroundColor="#0B0E14"
        tintColor="#4A9EFF"
        iconColor={{ default: "#5C5F68", selected: "#4A9EFF" }}
        labelStyle={{
        default: { color: "#5C5F68" },
        selected: { color: "#4A9EFF" },
        }}
    >
      <NativeTabs.Trigger name="index">
        <Label>{t("tabs.home")}</Label>
        <Icon sf="house.fill"/>
      </NativeTabs.Trigger>

     <NativeTabs.Trigger name="transactions">
        <Icon sf="list.bullet"/>
        <Label>{t("tabs.transactions")}</Label>
      </NativeTabs.Trigger>

       <NativeTabs.Trigger name="add-transaction">
        <Icon sf="plus.circle.fill"/>
        <Label>{t("tabs.add")}</Label>
      </NativeTabs.Trigger>

        <NativeTabs.Trigger name="assistant">
        <Icon sf="brain.head.profile"/>
        <Label>{t("tabs.assistant")}</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill"/>
        <Label>{t("tabs.profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4A9EFF",
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          paddingTop: 4,
          height: 100,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: t("tabs.add"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t("tabs.assistant"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}