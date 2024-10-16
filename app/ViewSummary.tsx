import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';

export const SummaryComponent = ({ summaryText }) => {
  const [copyNotification, setCopyNotification] = useState(null);

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setCopyNotification('Summary copied to clipboard');
    setTimeout(() => setCopyNotification(null), 2000);
  };

  if (!summaryText) {
    return (
      <Text style={styles.noContentText}>
        No summary available
      </Text>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      <TouchableOpacity
        style={styles.copyButton}
        onPress={() => copyToClipboard(summaryText)}
        accessibilityLabel="Copy summary"
        accessibilityHint="Double tap to copy the summary to clipboard"
      >
        <Icon name="copy" color="#007AFF" size={24} />
      </TouchableOpacity>
      <ScrollView
        style={styles.contentContainer}
        accessibilityLabel="Summary content"
        accessible={true}
      >
        <Markdown>{summaryText}</Markdown>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    fontSize: 14,
  },
  noContentText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});