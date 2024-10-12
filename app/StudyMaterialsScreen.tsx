import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { FlashcardsScreen } from './ViewFlashcards';
import { SummaryScreen } from './ViewSummary';

type StudyMaterialScreenRouteProp = RouteProp<
  { StudyMaterial: { audioUrl: string } },
  'StudyMaterial'
>;

type Props = {
  route: StudyMaterialScreenRouteProp;
};

interface ParsedSummaryData {
  title: string;
  mainPoints: string[];
  additionalInfo?: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

export const StudyMaterialScreen: React.FC<Props> = ({ route }) => {
  const { audioUrl } = route.params;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<ParsedSummaryData | null>(null);
  const [flashcardsData, setFlashcardsData] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      const response = await fetch('BACKEND_URL/get_summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const parsedData = parseSummaryData(data);
      setSummaryData(parsedData);
      setLoading(false);
      
      fetchFlashcardsData();
    } catch (err) {
      setError('Failed to fetch summary data');
      console.error('Error fetching summary:', err);
      setLoading(false);
    }
  };

  const fetchFlashcardsData = async () => {
    try {
      const response = await fetch('BACKEND_URL/get_flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setFlashcardsData(data.flashcards);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
    }
  };

  const parseSummaryData = (data: any): ParsedSummaryData => {
    return {
      title: data.title || 'Summary',
      mainPoints: data.main_points || [],
      additionalInfo: data.additional_info,
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading summary...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    switch (selectedIndex) {
      case 0:
        return summaryData ? <SummaryScreen summaryData={summaryData} /> : null;
      case 1:
        return <FlashcardsScreen flashcardsData={flashcardsData} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SegmentedControl
          values={['Summary', 'Flashcards']}
          selectedIndex={selectedIndex}
          onChange={(event) => {
            setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
          }}
          style={styles.segmentedControl}
        />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  segmentedControl: {
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});