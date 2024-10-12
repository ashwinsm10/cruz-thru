import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PreviousTranscriptionsScreen from "./PreviousTranscriptionsScreen";
import { RecordVoiceScreen } from "./Transcribe";
import { SummaryScreen } from "./ViewSummary";
import { StudyMaterialScreen } from "./StudyMaterialsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer independent={true}>
        <Stack.Navigator initialRouteName="LectureNotes">
          <Stack.Screen
            name="Lecture Notes"
            component={RecordVoiceScreen}
            options={{
              headerTitle: "Lecture Notes",
              headerStyle: { backgroundColor: "#1a1a1a" },
              headerTintColor: "#ffffff",
            }}
          />
          <Stack.Screen
            name="Previous Transcriptions"
            component={PreviousTranscriptionsScreen}
          />
          <Stack.Screen
            name="Summary"
            component={StudyMaterialScreen}
            options={{
              headerTitle: "Summary",
              headerStyle: { backgroundColor: "#1a1a1a" },
              headerTintColor: "#ffffff",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}