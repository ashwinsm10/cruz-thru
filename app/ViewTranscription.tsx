import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

export const TranscriptionComponent = ({ transcriptionText }) => {
  const [copyNotification, setCopyNotification] = useState(null);

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setCopyNotification('Transcription copied to clipboard');
    setTimeout(() => setCopyNotification(null), 2000);
  };

  if (!transcriptionText) {
    return (
      <Text style={styles.noContentText}>
        No transcription available
      </Text>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => copyToClipboard(transcriptionText)}
        accessibilityLabel="Copy transcription"
        accessibilityHint="Double tap to copy the transcription to clipboard"
      >
        <Icon name="copy" color="#007AFF" size={24} />
      </TouchableOpacity>
      <ScrollView
        style={styles.contentContainer}
        accessibilityLabel="Transcription content"
        accessible={true}
      >
        <Text style={styles.transcriptionText}>{transcriptionText}</Text>
      </ScrollView>
      {copyNotification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>{copyNotification}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    paddingHorizontal: width * 0.05,
    paddingBottom: width * 0.1,
  },
  copyButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  notificationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  notificationText: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    fontSize: width * 0.035,
  },
  transcriptionText: {
    fontSize: width * 0.04,
    lineHeight: width * 0.06,
  },
  noContentText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});