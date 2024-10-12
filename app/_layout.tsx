import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PreviousTranscriptionsScreen from "./PreviousTranscriptionsScreen";
import { RecordVoiceScreen } from "./Transcribe";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
