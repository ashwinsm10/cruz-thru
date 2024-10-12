import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  summaryData: {
    title: string;
    mainPoints: string[];
    additionalInfo?: string;
  } | null;
}

export const SummaryScreen: React.FC<Props> = ({ summaryData }) => {
  if (!summaryData) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No summary data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{summaryData.title}</Text>
      <View style={styles.summaryContainer}>
        {summaryData.mainPoints.map((point, index) => (
          <Text key={index} style={styles.pointText}>• {point}</Text>
        ))}
        {summaryData.additionalInfo && (
          <Text style={styles.additionalInfo}>{summaryData.additionalInfo}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  additionalInfo: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
});