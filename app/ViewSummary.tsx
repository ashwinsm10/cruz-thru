import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface SummaryScreenProps {
  summaryData: {
    title: string;
    mainPoints: string[];
    additionalInfo?: string;
  };
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ summaryData }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{summaryData.title}</Text>
      {summaryData.mainPoints.length > 0 ? (
        summaryData.mainPoints.map((point, index) => (
          <Text key={index} style={styles.point}>
            - {point}
          </Text>
        ))
      ) : (
        <Text>No main points available.</Text>
      )}
      {summaryData.additionalInfo && (
        <Text style={styles.additionalInfo}>{summaryData.additionalInfo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  point: {
    fontSize: 18,
    marginBottom: 5,
  },
  additionalInfo: {
    fontSize: 16,
    marginTop: 10,
    fontStyle: "italic",
  },
});